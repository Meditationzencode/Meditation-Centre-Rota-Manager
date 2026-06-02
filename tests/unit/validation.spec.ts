import { test, expect } from '@playwright/test'
import { parseSlotForm, parseTemplateForm, isEmail, MAX_LEN } from '../../src/lib/validation'
import { translatePostgresError } from '../../src/lib/errors'

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) v.forEach(item => fd.append(k, item))
    else fd.set(k, v)
  }
  return fd
}

const validSlot = {
  date: '2026-01-05',
  startTime: '07:00',
  endTime: '08:00',
  duty: 'Morning Sitting',
  location: 'Shrine Room',
  maxVolunteers: '3',
  notes: 'Please arrive early.',
}

test.describe('parseSlotForm', () => {
  test('accepts a valid slot and derives week_start', () => {
    const result = parseSlotForm(form(validSlot))
    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.week_start).toBe('2026-01-05')
      expect(result.max_volunteers).toBe(3)
      expect(result.status).toBe('open')
    }
  })

  test('rejects a duty outside the allowed list', () => {
    const result = parseSlotForm(form({ ...validSlot, duty: 'Hacking' }))
    expect(result).toEqual({ error: 'Please choose a valid duty.' })
  })

  test('rejects a location outside the allowed list', () => {
    const result = parseSlotForm(form({ ...validSlot, location: 'Server Room' }))
    expect(result).toEqual({ error: 'Please choose a valid location.' })
  })

  test('rejects start time at or after end time', () => {
    const result = parseSlotForm(form({ ...validSlot, startTime: '09:00', endTime: '08:00' }))
    expect(result).toEqual({ error: 'Start time must be before end time.' })
  })

  test('rejects max volunteers out of range', () => {
    expect(parseSlotForm(form({ ...validSlot, maxVolunteers: '0' }))).toEqual({
      error: 'Max volunteers must be between 1 and 20.',
    })
    expect(parseSlotForm(form({ ...validSlot, maxVolunteers: '21' }))).toEqual({
      error: 'Max volunteers must be between 1 and 20.',
    })
  })

  test('rejects over-long notes', () => {
    const result = parseSlotForm(form({ ...validSlot, notes: 'x'.repeat(MAX_LEN.notes + 1) }))
    expect('error' in result && result.error).toContain('Notes must be')
  })

  test('rejects missing required fields', () => {
    expect(parseSlotForm(form({ ...validSlot, date: '' }))).toEqual({
      error: 'All fields except notes are required.',
    })
  })
})

test.describe('parseTemplateForm', () => {
  const validTemplate = {
    duty: 'Evening Sitting',
    location: 'Shrine Room',
    startTime: '19:00',
    endTime: '20:00',
    maxVolunteers: '2',
    notes: '',
    daysOfWeek: ['0', '2', '4'],
  }

  test('accepts a valid template', () => {
    const result = parseTemplateForm(form(validTemplate))
    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.days_of_week).toEqual([0, 2, 4])
      expect(result.active).toBe(true)
    }
  })

  test('rejects when no days are selected', () => {
    const { daysOfWeek: _omit, ...rest } = validTemplate
    void _omit
    expect(parseTemplateForm(form(rest))).toEqual({
      error: 'Select at least one valid day of the week.',
    })
  })

  test('rejects an out-of-range day index', () => {
    expect(parseTemplateForm(form({ ...validTemplate, daysOfWeek: ['9'] }))).toEqual({
      error: 'Select at least one valid day of the week.',
    })
  })
})

test.describe('isEmail', () => {
  test('accepts a normal address', () => {
    expect(isEmail('vol1@bodhigrove.demo')).toBe(true)
  })
  test('rejects malformed addresses', () => {
    expect(isEmail('not-an-email')).toBe(false)
    expect(isEmail('a@b')).toBe(false)
    expect(isEmail('')).toBe(false)
  })
})

test.describe('translatePostgresError', () => {
  test('maps the capacity_full trigger message to a friendly string', () => {
    expect(translatePostgresError({ message: 'capacity_full: slot x is full' }))
      .toBe('This slot just filled — try refreshing.')
  })
  test('maps a unique violation', () => {
    expect(translatePostgresError({ code: '23505' })).toBe('That already exists.')
  })
  test('falls back to a generic message for unknown errors', () => {
    expect(translatePostgresError({ code: 'XX999' })).toBe('Something went wrong. Please try again.')
  })
})
