// Public env vars — safe to read in either the browser or server bundle.
// Only NEXT_PUBLIC_* values (and values derived from them) belong here.
// Import-time validation means a missing var crashes module-load with a
// clear message, rather than surfacing as a confusing 500 mid-request.

export function required(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      'Set it in .env.local for development or in the deploy environment.'
    )
  }
  return value
}

export function optional(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export const SUPABASE_URL      = required('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_ANON_KEY = required('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const SITE_URL =
  optional('NEXT_PUBLIC_SITE_URL')
  ?? (optional('VERCEL_URL') ? `https://${optional('VERCEL_URL')}` : 'http://localhost:3000')
