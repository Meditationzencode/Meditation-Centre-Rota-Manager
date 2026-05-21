-- Recurring shift templates
-- days_of_week: integer array, 0 = Monday … 6 = Sunday

CREATE TABLE IF NOT EXISTS recurring_templates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  duty            text        NOT NULL,
  location        text        NOT NULL,
  days_of_week    int[]       NOT NULL,
  start_time      time        NOT NULL,
  end_time        time        NOT NULL,
  max_volunteers  int         NOT NULL DEFAULT 1,
  notes           text        NOT NULL DEFAULT '',
  active          boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

-- Admins and coordinators can manage templates
CREATE POLICY "managers can manage recurring templates"
  ON recurring_templates
  USING (my_role() IN ('admin', 'coordinator'))
  WITH CHECK (my_role() IN ('admin', 'coordinator'));
