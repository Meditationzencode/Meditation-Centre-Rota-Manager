/** Returns the ISO Monday (YYYY-MM-DD) for any given date string or Date */
export function getWeekStart(input: string | Date): string {
  const d = new Date(input)
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = utc.getUTCDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day
  utc.setUTCDate(utc.getUTCDate() + diff)
  return utc.toISOString().slice(0, 10)
}

export function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** "Mon 20 Jan" */
export function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

/** "20 January 2026" */
export function fmtDateLong(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

/** "06:30" from "06:30:00" */
export function fmtTime(t: string): string {
  return t.slice(0, 5)
}

export function clsx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
