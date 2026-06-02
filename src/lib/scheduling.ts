// Pure recurring-template → concrete-slot expansion. Extracted from the
// generateSlots Server Action so the date/day-of-week logic can be unit-tested
// without a database (see tests/unit/scheduling.spec.ts).

import { getWeekStart, addDays } from './utils'

export type SlotTemplate = {
  duty: string
  location: string
  days_of_week: number[] // 0 = Mon … 6 = Sun
  start_time: string
  end_time: string
  max_volunteers: number
  notes?: string | null
}

export type GeneratedSlot = {
  date: string
  week_start: string
  duty: string
  location: string
  start_time: string
  end_time: string
  max_volunteers: number
  notes: string
}

/**
 * Expand active templates into slot rows for every matching day in [from, to]
 * (inclusive). `from`/`to` are YYYY-MM-DD; the day-of-week index is normalised
 * to 0 = Monday … 6 = Sunday to match how templates store `days_of_week`.
 */
export function expandTemplatesToSlots(
  templates: SlotTemplate[],
  from: string,
  to: string,
): GeneratedSlot[] {
  const slots: GeneratedSlot[] = []
  let cursor = from
  while (cursor <= to) {
    const dow = new Date(`${cursor}T00:00:00Z`).getUTCDay() // 0 = Sun
    const rota = dow === 0 ? 6 : dow - 1                    // 0 = Mon … 6 = Sun
    for (const t of templates) {
      if (t.days_of_week.includes(rota)) {
        slots.push({
          date: cursor,
          week_start: getWeekStart(cursor),
          duty: t.duty,
          location: t.location,
          start_time: t.start_time,
          end_time: t.end_time,
          max_volunteers: t.max_volunteers,
          notes: t.notes ?? '',
        })
      }
    }
    cursor = addDays(cursor, 1)
  }
  return slots
}
