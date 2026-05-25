-- ============================================================
-- Sangha Rota — Demo seed data
-- Run this AFTER schema.sql and rls.sql.
--
-- IMPORTANT: You must create the auth users first.
-- Go to Supabase Dashboard → Authentication → Users → Add user
-- Use email/password and the emails below, then note the UUIDs.
-- Replace the placeholder UUIDs in this file with the real ones.
--
-- All demo accounts use password: demo1234
-- ============================================================

-- Replace these UUIDs with the real values from your Supabase auth.users table
DO $$
DECLARE
  admin_id    UUID := 'aaaaaaaa-0001-0001-0001-000000000001';
  coord1_id   UUID := 'bbbbbbbb-0001-0001-0001-000000000002';
  coord2_id   UUID := 'cccccccc-0001-0001-0001-000000000003';
  vol1_id     UUID := 'dddddddd-0001-0001-0001-000000000004';
  vol2_id     UUID := 'eeeeeeee-0001-0001-0001-000000000005';
  vol3_id     UUID := 'ffffffff-0001-0001-0001-000000000006';
  vol4_id     UUID := 'gggggggg-0001-0001-0001-000000000007';
BEGIN

-- ── Profiles ─────────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, name, role, created_at) VALUES
  (admin_id,  'Ananda Sharma',   'admin',       '2024-01-01T00:00:00Z'),
  (coord1_id, 'Maya Patel',      'coordinator', '2024-01-15T00:00:00Z'),
  (coord2_id, 'Rohan Desai',     'coordinator', '2024-04-01T00:00:00Z'),
  (vol1_id,   'James Whitfield', 'volunteer',   '2024-02-01T00:00:00Z'),
  (vol2_id,   'Priya Nair',      'volunteer',   '2024-02-10T00:00:00Z'),
  (vol3_id,   'Tom Eriksson',    'volunteer',   '2024-03-01T00:00:00Z'),
  (vol4_id,   'Suki Tanaka',     'volunteer',   '2024-03-15T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- ── Slots — current week ──────────────────────────────────────────────────────
-- Dates are relative to the Monday of the current ISO week.
-- Adjust CURRENT_DATE arithmetic as needed when seeding.

INSERT INTO public.slots
  (date, week_start, start_time, end_time, duty, location, max_volunteers, notes)
SELECT
  monday + (offset_days || ' days')::INTERVAL,
  monday,
  start_time::TIME,
  end_time::TIME,
  duty,
  location,
  max_volunteers,
  ''
FROM (
  -- Calculate current ISO week Monday
  SELECT date_trunc('week', CURRENT_DATE)::DATE AS monday
) w
CROSS JOIN (VALUES
  -- Mon
  (0, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (0, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  (0, '08:00', '09:00', 'Shrine Room Clean',  'Shrine Room',   2),
  -- Tue
  (1, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (1, '09:00', '13:00', 'Reception Desk',     'Reception',     1),
  (1, '12:00', '14:00', 'Kitchen Duty',       'Kitchen',       2),
  (1, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  -- Wed
  (2, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (2, '08:00', '09:00', 'Shrine Room Clean',  'Shrine Room',   2),
  (2, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  -- Thu
  (3, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (3, '09:00', '13:00', 'Reception Desk',     'Reception',     1),
  (3, '12:00', '14:00', 'Kitchen Duty',       'Kitchen',       2),
  (3, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  -- Fri
  (4, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (4, '10:00', '12:00', 'Garden Maintenance', 'Gardens',       3),
  (4, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  -- Sat
  (5, '10:00', '12:00', 'Garden Maintenance', 'Gardens',       3),
  (5, '12:00', '14:00', 'Kitchen Duty',       'Kitchen',       2),
  (5, '18:30', '21:00', 'Welcome Greeter',    'Main Entrance', 1),
  (5, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  -- Sun
  (6, '08:00', '09:00', 'Shrine Room Clean',  'Shrine Room',   2),
  (6, '18:30', '21:00', 'Welcome Greeter',    'Main Entrance', 1),
  (6, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3)
) AS duties(offset_days, start_time, end_time, duty, location, max_volunteers);

-- Next week too
INSERT INTO public.slots
  (date, week_start, start_time, end_time, duty, location, max_volunteers, notes)
SELECT
  monday + 7 + (offset_days || ' days')::INTERVAL,
  monday + 7,
  start_time::TIME,
  end_time::TIME,
  duty,
  location,
  max_volunteers,
  ''
FROM (SELECT date_trunc('week', CURRENT_DATE)::DATE AS monday) w
CROSS JOIN (VALUES
  (0, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (0, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  (0, '08:00', '09:00', 'Shrine Room Clean',  'Shrine Room',   2),
  (1, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (1, '09:00', '13:00', 'Reception Desk',     'Reception',     1),
  (1, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  (2, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (2, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  (3, '06:30', '07:30', 'Morning Sitting',    'Shrine Room',   2),
  (3, '09:00', '13:00', 'Reception Desk',     'Reception',     1),
  (3, '12:00', '14:00', 'Kitchen Duty',       'Kitchen',       2),
  (3, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  (4, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  (5, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3),
  (5, '18:30', '21:00', 'Welcome Greeter',    'Main Entrance', 1),
  (6, '19:30', '20:30', 'Evening Sitting',    'Shrine Room',   3)
) AS duties(offset_days, start_time, end_time, duty, location, max_volunteers);

-- ── Sample signups ────────────────────────────────────────────────────────────
-- Sign a few volunteers up for this week's Morning Sittings
INSERT INTO public.signups (slot_id, user_id)
SELECT s.id, p.id
FROM public.slots s
CROSS JOIN (
  SELECT id FROM public.profiles
  WHERE id IN (vol1_id, vol2_id, vol3_id, vol4_id)
  LIMIT 2
) p
WHERE s.duty = 'Morning Sitting'
  AND s.week_start = date_trunc('week', CURRENT_DATE)::DATE
  AND s.date = date_trunc('week', CURRENT_DATE)::DATE  -- Monday only
ON CONFLICT DO NOTHING;

END $$;
