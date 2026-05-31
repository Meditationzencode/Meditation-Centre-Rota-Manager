// Centralised env-var access with import-time validation.
// Throwing here means a missing var crashes module-load (and the boot of a
// serverless function) with a clear message, rather than surfacing as a
// confusing 500 mid-request.

function required(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      'Set it in .env.local for development or in the deploy environment.'
    )
  }
  return value
}

function optional(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

// Public — exposed to the browser, safe to read on either runtime.
export const SUPABASE_URL      = required('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_ANON_KEY = required('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Server-only — must never reach the browser bundle. Validated lazily
// the first time createAdminClient() is called, since some build steps
// (e.g. Next's static analysis) don't have the service-role key set.
let _serviceRoleKey: string | undefined
export function getServiceRoleKey(): string {
  if (!_serviceRoleKey) _serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY')
  return _serviceRoleKey
}

// Optional integrations and config.
export const RESEND_API_KEY = optional('RESEND_API_KEY')
export const SITE_URL =
  optional('NEXT_PUBLIC_SITE_URL')
  ?? (optional('VERCEL_URL') ? `https://${optional('VERCEL_URL')}` : 'http://localhost:3000')
