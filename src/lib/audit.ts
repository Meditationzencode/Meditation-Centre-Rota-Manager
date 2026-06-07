import { createAdminClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

/**
 * Append an entry to the audit log. Shared by the server actions that mutate
 * state. Uses the admin client so the row is written regardless of the
 * caller's RLS permissions on audit_log.
 */
export async function audit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  detail: string,
) {
  try {
    const admin = createAdminClient()
    await admin.from('audit_log').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, detail })
  } catch (err) {
    // Audit failures must never break the user-facing action — but we do
    // want to know about them, since a silent gap defeats the audit story.
    log.error({ action: 'audit', userId, message: 'failed to insert audit entry', err })
  }
}
