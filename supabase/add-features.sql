-- ============================================================
-- Sangha Rota — Feature additions
-- Run this in the Supabase SQL editor AFTER schema.sql and rls.sql
-- ============================================================

-- ── Ensure helper exists (idempotent) ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ── Unavailability ────────────────────────────────────────────────────────────
-- Volunteers mark dates they cannot attend

CREATE TABLE IF NOT EXISTS public.unavailability (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  note       TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS unavailability_user_id_idx ON public.unavailability(user_id);
CREATE INDEX IF NOT EXISTS unavailability_date_idx    ON public.unavailability(date);

ALTER TABLE public.unavailability ENABLE ROW LEVEL SECURITY;

-- Users can see their own; admins/coordinators see all
CREATE POLICY "unavailability_select_own"
  ON public.unavailability FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "unavailability_select_manage"
  ON public.unavailability FOR SELECT
  USING (public.my_role() IN ('admin', 'coordinator'));

CREATE POLICY "unavailability_insert_own"
  ON public.unavailability FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "unavailability_delete_own"
  ON public.unavailability FOR DELETE
  USING (auth.uid() = user_id);

-- ── Audit log ─────────────────────────────────────────────────────────────────
-- Server-side record of all changes

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   UUID,
  detail      TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx    ON public.audit_log(user_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "audit_log_select_admin"
  ON public.audit_log FOR SELECT
  USING (public.my_role() = 'admin');

-- Service role (used by server actions) bypasses RLS for inserts
