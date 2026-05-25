-- ============================================================
-- Sangha Rota — Schema additions (v2)
-- Run this in the Supabase SQL editor AFTER all previous SQL files
-- ============================================================

-- ── Shared updated_at trigger function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── profiles: phone_number + updated_at ──────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── slots: status + created_by + updated_at ───────────────────────────────────

ALTER TABLE public.slots
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'cancelled')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS slots_status_idx     ON public.slots(status);
CREATE INDEX IF NOT EXISTS slots_created_by_idx ON public.slots(created_by);

DROP TRIGGER IF EXISTS slots_updated_at ON public.slots;
CREATE TRIGGER slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── shift_swaps: admin_notes ──────────────────────────────────────────────────

ALTER TABLE public.shift_swaps
  ADD COLUMN IF NOT EXISTS admin_notes TEXT NOT NULL DEFAULT '';
