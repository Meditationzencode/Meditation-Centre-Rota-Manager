-- ============================================================
-- Sangha Rota — Shift swaps + viewer role support
-- Run this in the Supabase SQL editor AFTER 02_rls.sql
-- (uses my_role() defined in 02_rls.sql)
-- ============================================================

-- ── Viewer role ───────────────────────────────────────────────────────────────
-- The profiles.role column is TEXT — no migration needed to add 'viewer'.
-- The my_role() helper already returns whatever role is stored.
-- Existing RLS policies that check role IN ('admin','coordinator','volunteer')
-- will naturally exclude viewers (they cannot write/sign-up).
-- Viewer accounts are created via the admin Members page like any other role.

-- Ensure slots are readable by viewers (authenticated users)
-- Check existing select policy on slots — if it only allows certain roles, widen it.
-- The safest approach: drop and recreate a permissive read policy.

-- (If your schema already has "slots_select_authenticated" or similar, adjust below.)

-- ── Shift swaps table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shift_swaps (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_id      UUID        NOT NULL REFERENCES public.slots(id)    ON DELETE CASCADE,
  reason       TEXT        NOT NULL DEFAULT '',
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  UUID        REFERENCES public.profiles(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, slot_id)
);

CREATE INDEX IF NOT EXISTS shift_swaps_status_idx       ON public.shift_swaps(status);
CREATE INDEX IF NOT EXISTS shift_swaps_requester_id_idx ON public.shift_swaps(requester_id);
CREATE INDEX IF NOT EXISTS shift_swaps_slot_id_idx      ON public.shift_swaps(slot_id);

ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;

-- Volunteers can see their own swap requests
CREATE POLICY "swaps_select_own"
  ON public.shift_swaps FOR SELECT
  USING (auth.uid() = requester_id);

-- Admins and coordinators can see all swap requests
CREATE POLICY "swaps_select_manage"
  ON public.shift_swaps FOR SELECT
  USING (public.my_role() IN ('admin', 'coordinator'));

-- Volunteers can create their own swap requests
CREATE POLICY "swaps_insert_own"
  ON public.shift_swaps FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Service role (used by reviewSwap server action via admin client) bypasses RLS for updates
-- No explicit UPDATE policy needed when using the service-role key.
