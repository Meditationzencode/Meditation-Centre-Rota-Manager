-- ============================================================
-- Sangha Rota — Free-text length constraints (defence in depth)
-- Run this in the Supabase SQL editor after 08_capacity_trigger.sql.
-- ============================================================
--
-- The application now caps free-text field lengths in its Server Actions
-- (src/lib/validation.ts and the relevant actions). These CHECK constraints
-- enforce the same limits at the database level, so a direct insert with the
-- anon key (bypassing the app) still cannot store oversized values.
--
-- Idempotent: each constraint is added only if it does not already exist.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_name_len') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_name_len CHECK (char_length(name) <= 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_len') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_len CHECK (char_length(phone_number) <= 30);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'slots_duty_len') THEN
    ALTER TABLE public.slots ADD CONSTRAINT slots_duty_len CHECK (char_length(duty) <= 50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'slots_location_len') THEN
    ALTER TABLE public.slots ADD CONSTRAINT slots_location_len CHECK (char_length(location) <= 50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'slots_notes_len') THEN
    ALTER TABLE public.slots ADD CONSTRAINT slots_notes_len CHECK (char_length(notes) <= 500);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shift_swaps_reason_len') THEN
    ALTER TABLE public.shift_swaps ADD CONSTRAINT shift_swaps_reason_len CHECK (char_length(reason) <= 500);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shift_swaps_admin_notes_len') THEN
    ALTER TABLE public.shift_swaps ADD CONSTRAINT shift_swaps_admin_notes_len CHECK (char_length(admin_notes) <= 500);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unavailability_note_len') THEN
    ALTER TABLE public.unavailability ADD CONSTRAINT unavailability_note_len CHECK (char_length(note) <= 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recurring_templates_notes_len') THEN
    ALTER TABLE public.recurring_templates ADD CONSTRAINT recurring_templates_notes_len CHECK (char_length(notes) <= 500);
  END IF;
END $$;
