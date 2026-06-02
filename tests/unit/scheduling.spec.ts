import { test, expect } from '@playwright/test'
import { expandTemplatesToSlots, type SlotTemplate } from '../../src/lib/scheduling'

// These are pure-function tests — no browser, no server, no database.

const base: Omit<SlotTemplate, 'days_of_week'> = {
  duty: 'Morning Sitting',
  location: 'Shrine Room',
  start_time: '07:00',
  end_time: '08:00',
  max_volunteers: 3,
  notes: null,
}

// 2026-01-05 is a Monday; 2026-01-11 is the Sunday that ends that week.
const MON = '2026-01-05'
const SUN = '2026-01-11'

test.describe('expandTemplatesToSlots', () => {
  test('returns nothing when there are no templates', () => {
    expect(expandTemplatesToSlots([], MON, SUN)).toEqual([])
  })

  test('maps Monday (getUTCDay 1) to rota index 0', () => {
    const slots = expandTemplatesToSlots([{ ...base, days_of_week: [0] }], MON, SUN)
    expect(slots).toHaveLength(1)
    expect(slots[0].date).toBe(MON)
    expect(slots[0].week_start).toBe(MON) // Monday is its own week start
    expect(slots[0].notes).toBe('') // null normalised to ''
  })

  test('maps Sunday (getUTCDay 0) to rota index 6', () => {
    const slots = expandTemplatesToSlots([{ ...base, days_of_week: [6] }], MON, SUN)
    expect(slots.map(s => s.date)).toEqual([SUN])
  })

  test('generates one slot per matching day across the range, inclusive', () => {
    // Mon, Wed, Fri
    const slots = expandTemplatesToSlots([{ ...base, days_of_week: [0, 2, 4] }], MON, SUN)
    expect(slots.map(s => s.date)).toEqual(['2026-01-05', '2026-01-07', '2026-01-09'])
  })

  test('combines multiple templates on the same day', () => {
    const t1: SlotTemplate = { ...base, days_of_week: [0], duty: 'Morning Sitting' }
    const t2: SlotTemplate = { ...base, days_of_week: [0], duty: 'Reception Desk', location: 'Reception' }
    const slots = expandTemplatesToSlots([t1, t2], MON, MON)
    expect(slots).toHaveLength(2)
    expect(slots.map(s => s.duty).sort()).toEqual(['Morning Sitting', 'Reception Desk'])
  })

  test('returns nothing when no day in range matches', () => {
    // Range is a single Monday; template only wants Sunday.
    expect(expandTemplatesToSlots([{ ...base, days_of_week: [6] }], MON, MON)).toEqual([])
  })
})
