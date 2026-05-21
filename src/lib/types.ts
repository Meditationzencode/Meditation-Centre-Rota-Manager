export type Role = 'admin' | 'coordinator' | 'volunteer'

export interface Profile {
  id: string
  name: string
  role: Role
  active: boolean
  created_at: string
  email?: string  // joined from auth.users where needed
}

export interface Slot {
  id: string
  date: string        // YYYY-MM-DD
  week_start: string  // YYYY-MM-DD (Monday)
  start_time: string  // HH:mm:ss
  end_time: string
  duty: string
  location: string
  max_volunteers: number
  notes: string
  created_at: string
}

export interface Signup {
  id: string
  slot_id: string
  user_id: string
  signed_up_at: string
}

export interface SlotWithSignups extends Slot {
  signups: (Signup & { profile: Pick<Profile, 'id' | 'name'> })[]
}

export interface Unavailability {
  id: string
  user_id: string
  date: string   // YYYY-MM-DD
  note: string
  created_at: string
}

export interface AuditEntry {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  detail: string
  created_at: string
  // joined
  profile?: Pick<Profile, 'name'> | null
}

export type ActionResult = { error: string } | { success: true }

export const DUTIES = [
  'Morning Sitting',
  'Evening Sitting',
  'Reception Desk',
  'Kitchen Duty',
  'Shrine Room Clean',
  'Garden Maintenance',
  'Welcome Greeter',
  'Other',
] as const

export const LOCATIONS = [
  'Shrine Room',
  'Reception',
  'Kitchen',
  'Gardens',
  'Main Entrance',
  'Library',
  'Courtyard',
] as const
