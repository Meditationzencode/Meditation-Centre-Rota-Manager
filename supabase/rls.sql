-- ============================================================
-- Sangha Rota — Row Level Security policies
-- Run this AFTER schema.sql in the Supabase SQL editor
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signups  ENABLE ROW LEVEL SECURITY;

-- ── Helper: get the calling user's role ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ── Profiles ─────────────────────────────────────────────────────────────────

-- Any authenticated user may read active profiles (e.g. to show volunteer names)
CREATE POLICY "profiles_select_active"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND active = true);

-- Admins may read all profiles regardless of active status
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.my_role() = 'admin');

-- Users may update their own name / password-related metadata
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent volunteers from escalating their own role
    AND (public.my_role() IN ('admin', 'coordinator') OR role = 'volunteer')
  );

-- Admins may update any profile (role, active flag, etc.)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.my_role() = 'admin');

-- Only the trigger (SECURITY DEFINER) inserts new profiles; no direct INSERT from clients
-- Admins may delete profiles
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (public.my_role() = 'admin');

-- ── Slots ─────────────────────────────────────────────────────────────────────

-- All authenticated users may view slots
CREATE POLICY "slots_select_auth"
  ON public.slots FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Coordinators and admins may create slots
CREATE POLICY "slots_insert_manage"
  ON public.slots FOR INSERT
  WITH CHECK (public.my_role() IN ('admin', 'coordinator'));

-- Coordinators and admins may edit slots
CREATE POLICY "slots_update_manage"
  ON public.slots FOR UPDATE
  USING (public.my_role() IN ('admin', 'coordinator'));

-- Coordinators and admins may delete slots (signups cascade automatically)
CREATE POLICY "slots_delete_manage"
  ON public.slots FOR DELETE
  USING (public.my_role() IN ('admin', 'coordinator'));

-- ── Signups ───────────────────────────────────────────────────────────────────

-- All authenticated users may see who has signed up
CREATE POLICY "signups_select_auth"
  ON public.signups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Any authenticated user may sign themselves up
CREATE POLICY "signups_insert_own"
  ON public.signups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users may cancel their own signup
CREATE POLICY "signups_delete_own"
  ON public.signups FOR DELETE
  USING (auth.uid() = user_id);

-- Admins and coordinators may remove any signup
CREATE POLICY "signups_delete_manage"
  ON public.signups FOR DELETE
  USING (public.my_role() IN ('admin', 'coordinator'));
