-- ============================================================
-- Sangha Rota — Bodhi Grove Meditation Centre
-- Schema: run this first in the Supabase SQL editor
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────────────────────
-- Extends auth.users. A trigger keeps them in sync on sign-up.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'volunteer'
                          CHECK (role IN ('admin', 'coordinator', 'volunteer')),
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row whenever a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'volunteer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Slots ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.slots (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date           DATE        NOT NULL,
  week_start     DATE        NOT NULL,       -- Monday of the slot's week
  start_time     TIME        NOT NULL,
  end_time       TIME        NOT NULL,
  duty           TEXT        NOT NULL,
  location       TEXT        NOT NULL,
  max_volunteers INTEGER     NOT NULL DEFAULT 1 CHECK (max_volunteers BETWEEN 1 AND 20),
  notes          TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS slots_date_idx       ON public.slots(date);
CREATE INDEX IF NOT EXISTS slots_week_start_idx ON public.slots(week_start);

-- ── Signups ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.signups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id      UUID        NOT NULL REFERENCES public.slots(id)    ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slot_id, user_id)
);

CREATE INDEX IF NOT EXISTS signups_slot_id_idx ON public.signups(slot_id);
CREATE INDEX IF NOT EXISTS signups_user_id_idx ON public.signups(user_id);
