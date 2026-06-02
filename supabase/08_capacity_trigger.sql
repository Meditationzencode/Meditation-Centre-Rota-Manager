-- ============================================================
-- Sangha Rota — Signup capacity enforcement
-- Run this in the Supabase SQL editor after all previous migrations.
-- ============================================================
--
-- The application layer pre-checks "is there room in this slot?" before
-- inserting a signup, but two concurrent inserts can both pass that check
-- and overfill a slot. This trigger pushes the constraint into the
-- database so capacity is enforced atomically regardless of caller.
--
-- The trigger raises with SQLSTATE 'P0001' and a message starting with
-- 'capacity_full'; the application's translatePostgresError() helper
-- (src/lib/errors.ts) maps that to a friendly "this slot just filled"
-- message for the user.

CREATE OR REPLACE FUNCTION public.enforce_signup_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_count INTEGER;
  cap           INTEGER;
BEGIN
  -- Lock the parent slot row FOR UPDATE. This serialises all concurrent
  -- signups for the same slot: two different volunteers inserting at once
  -- take distinct (slot_id, user_id) unique-index locks and would NOT block
  -- each other, so without this lock both could read the same pre-insert
  -- count and overfill the slot. Locking the slot row forces them to queue.
  SELECT max_volunteers INTO cap FROM public.slots WHERE id = NEW.slot_id FOR UPDATE;
  IF cap IS NULL THEN
    RAISE EXCEPTION 'slot_not_found: %', NEW.slot_id;
  END IF;

  -- With the slot row locked above, a concurrent inserter for this slot has
  -- either already committed (and is visible here) or is still waiting on the
  -- lock, so this count is accurate at decision time.
  SELECT COUNT(*) INTO current_count
    FROM public.signups
   WHERE slot_id = NEW.slot_id;

  IF current_count >= cap THEN
    RAISE EXCEPTION 'capacity_full: slot % is full (% / %)', NEW.slot_id, current_count, cap;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS signups_enforce_capacity ON public.signups;
CREATE TRIGGER signups_enforce_capacity
  BEFORE INSERT ON public.signups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_signup_capacity();
