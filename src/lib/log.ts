// Minimal structured logger. Writes JSON lines to stderr/stdout so logs
// are grep-able in Vercel (or any log drain) without pulling in Sentry.
// Swap the impl for a real reporter when one becomes worth the weight.

type Level = 'info' | 'warn' | 'error'

type Fields = {
  action?: string
  userId?: string | null
  entityType?: string
  entityId?: string | null
  message?: string
  err?: unknown
  [key: string]: unknown
}

function serialiseError(err: unknown) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  if (err && typeof err === 'object') {
    // Postgres errors from supabase-js carry { message, code, details, hint }
    const e = err as Record<string, unknown>
    return {
      message: e.message,
      code:    e.code,
      details: e.details,
      hint:    e.hint,
    }
  }
  return { message: String(err) }
}

function emit(level: Level, fields: Fields) {
  const { err, ...rest } = fields
  const payload = {
    level,
    ts: new Date().toISOString(),
    ...rest,
    ...(err !== undefined ? { err: serialiseError(err) } : {}),
  }
  const out = level === 'error' ? console.error : console.log
  out(JSON.stringify(payload))
}

export const log = {
  info:  (fields: Fields) => emit('info',  fields),
  warn:  (fields: Fields) => emit('warn',  fields),
  error: (fields: Fields) => emit('error', fields),
}
