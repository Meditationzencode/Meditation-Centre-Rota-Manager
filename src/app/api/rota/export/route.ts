import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function icsDate(date: string, time: string): string {
  // Returns YYYYMMDDTHHMMSSZ
  return `${date.replace(/-/g, '')}T${time.replace(/:/g, '').slice(0, 6)}Z`
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const { data: signups } = await supabase
    .from('signups')
    .select('slot:slots(id, date, duty, location, start_time, end_time, notes)')
    .eq('user_id', user.id)

  type SlotRow = { id: string; date: string; duty: string; location: string; start_time: string; end_time: string; notes: string }
  const upcoming = (signups ?? [])
    .map(s => s.slot as unknown as SlotRow | null)
    .filter((s): s is SlotRow => !!s && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const stamp = icsDate(today, '000000')

  const events = upcoming.map(slot => [
    'BEGIN:VEVENT',
    `UID:${slot.id}@sangha-rota`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(slot.date, slot.start_time)}`,
    `DTEND:${icsDate(slot.date, slot.end_time)}`,
    `SUMMARY:${icsEscape(slot.duty)}`,
    `LOCATION:${icsEscape(slot.location)}`,
    slot.notes ? `DESCRIPTION:${icsEscape(slot.notes)}` : '',
    'END:VEVENT',
  ].filter(Boolean).join('\r\n')).join('\r\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bodhi Grove//Sangha Rota//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Bodhi Grove Rota',
    events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bodhi-grove-rota.ics"',
    },
  })
}
