import { log } from './log'

// Postgres errors come back from supabase-js as { message, code, details, hint }.
type PgError = { message?: string; code?: string; details?: string; hint?: string }

/**
 * Translate a Postgres / Supabase error into a user-facing message.
 * Logs the original error server-side so debugging remains possible,
 * and returns a friendly string the UI can render directly.
 *
 * Custom check-constraint codes:
 *   'capacity_full' — raised by the signups capacity trigger.
 */
export function translatePostgresError(
  err: unknown,
  ctx: { action?: string; userId?: string | null } = {},
): string {
  const e = (err ?? {}) as PgError

  // Application-defined errors raised from triggers / RPCs.
  if (e.message?.includes('capacity_full')) {
    return 'This slot just filled — try refreshing.'
  }

  switch (e.code) {
    case '23505': // unique_violation
      return 'That already exists.'
    case '23503': // foreign_key_violation
      return 'A referenced item no longer exists. Try refreshing.'
    case '23514': // check_violation
      return 'That value isn\'t allowed.'
    case '23502': // not_null_violation
      return 'A required field was missing.'
    case '42501': // insufficient_privilege
      return 'You don\'t have permission to do that.'
    case 'PGRST116': // PostgREST: row not found
      return 'That item could not be found.'
  }

  log.error({
    action:  ctx.action ?? 'unknown',
    userId:  ctx.userId ?? null,
    message: 'Untranslated database error',
    err,
  })

  return 'Something went wrong. Please try again.'
}
