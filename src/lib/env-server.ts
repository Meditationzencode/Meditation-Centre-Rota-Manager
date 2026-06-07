// Server-only env vars (secrets). The `server-only` import makes any
// attempt to pull this module into a client bundle a build-time error,
// so the service-role key and other secrets can never reach the browser.
import 'server-only'
import { required, optional } from '@/lib/env-public'

// Validated lazily the first time createAdminClient() is called, since some
// build steps (e.g. Next's static analysis) don't have the service-role key set.
let _serviceRoleKey: string | undefined
export function getServiceRoleKey(): string {
  if (!_serviceRoleKey) _serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY')
  return _serviceRoleKey
}

// Optional integrations.
export const RESEND_API_KEY = optional('RESEND_API_KEY')
