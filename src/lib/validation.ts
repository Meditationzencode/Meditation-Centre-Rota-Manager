// Pure, framework-free input validation for the rota's write paths.
// Lives outside the 'use server' actions file so it can be unit-tested
// directly (see tests/unit/validation.spec.ts) and reused across actions.

import { getWeekStart } from './utils'
import { DUTIES, LOCATIONS } from './types'

// Free-text length caps. Mirrored by DB CHECK constraints in
// supabase/09_length_checks.sql so the limits hold even on a direct insert.
export const MAX_LEN = {
  name: 100,
  phone: 30,
  notes: 500,
  reason: 500,
  adminNotes: 500,
  unavailNote: 100,
} as const

const DUTY_SET = new Set<string>(DUTIES)
const LOCATION_SET = new Set<string>(LOCATIONS)

/** Trim a form value to a string, returning '' for null/undefined. */
export function str(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Basic email shape check (server-side; Supabase does the authoritative check). */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export type SlotPayload = {
  date: string; week_start: string; start_time: string; end_time: string
  duty: string; location: string; max_volunteers: number; notes: string; status: string
}

export function parseSlotForm(formData: FormData): { error: string } | SlotPayload {
  const date      = str(formData.get('date'))
  const startTime = str(formData.get('startTime'))
  const endTime   = str(formData.get('endTime'))
  const duty      = str(formData.get('duty'))
  const location  = str(formData.get('location'))
  const maxVols   = parseInt(formData.get('maxVolunteers') as string, 10)
  const notes     = str(formData.get('notes'))
  const status    = str(formData.get('status')) === 'cancelled' ? 'cancelled' : 'open'

  if (!date || !startTime || !endTime || !duty || !location)
    return { error: 'All fields except notes are required.' }
  if (!DUTY_SET.has(duty))
    return { error: 'Please choose a valid duty.' }
  if (!LOCATION_SET.has(location))
    return { error: 'Please choose a valid location.' }
  if (startTime >= endTime)
    return { error: 'Start time must be before end time.' }
  if (!Number.isFinite(maxVols) || maxVols < 1 || maxVols > 20)
    return { error: 'Max volunteers must be between 1 and 20.' }
  if (notes.length > MAX_LEN.notes)
    return { error: `Notes must be ${MAX_LEN.notes} characters or fewer.` }

  return {
    date,
    week_start:     getWeekStart(date),
    start_time:     startTime,
    end_time:       endTime,
    duty,
    location,
    max_volunteers: maxVols,
    notes,
    status,
  }
}

export type TemplatePayload = {
  duty: string; location: string; days_of_week: number[]
  start_time: string; end_time: string; max_volunteers: number; notes: string; active: boolean
}

export function parseTemplateForm(formData: FormData): { error: string } | TemplatePayload {
  const duty       = str(formData.get('duty'))
  const location   = str(formData.get('location'))
  const startTime  = str(formData.get('startTime'))
  const endTime    = str(formData.get('endTime'))
  const maxVols    = parseInt(formData.get('maxVolunteers') as string, 10)
  const notes      = str(formData.get('notes'))
  const active     = formData.get('active') !== 'false'
  const daysOfWeek = formData.getAll('daysOfWeek').map(d => parseInt(d as string, 10))

  if (!duty || !location || !startTime || !endTime)
    return { error: 'Duty, location, and times are required.' }
  if (!DUTY_SET.has(duty))
    return { error: 'Please choose a valid duty.' }
  if (!LOCATION_SET.has(location))
    return { error: 'Please choose a valid location.' }
  if (daysOfWeek.length === 0 || daysOfWeek.some(d => !Number.isInteger(d) || d < 0 || d > 6))
    return { error: 'Select at least one valid day of the week.' }
  if (startTime >= endTime)
    return { error: 'Start time must be before end time.' }
  if (!Number.isFinite(maxVols) || maxVols < 1 || maxVols > 20)
    return { error: 'Max volunteers must be between 1 and 20.' }
  if (notes.length > MAX_LEN.notes)
    return { error: `Notes must be ${MAX_LEN.notes} characters or fewer.` }

  return { duty, location, days_of_week: daysOfWeek, start_time: startTime, end_time: endTime, max_volunteers: maxVols, notes, active }
}
