'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createMember, updateMember } from '@/lib/actions'
import type { ActionResult, Profile } from '@/lib/types'
import { formField as fieldCls, formLabel as labelCls, formCancelBtn } from '@/lib/form-styles'

interface Props { member: Profile | null }

export default function MemberForm({ member }: Props) {
  const action = member ? updateMember : createMember
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null)
  const error = state && 'error' in state ? state.error : null

  return (
    <form action={formAction} className="bg-white border border-sand/70 rounded-xl shadow-sm p-6 space-y-5">
      {member && <input type="hidden" name="id" value={member.id} />}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      <div>
        <label htmlFor="member-name" className={labelCls}>Full Name <span className="text-red-500">*</span></label>
        <input id="member-name" type="text" name="name" required defaultValue={member?.name ?? ''}
          placeholder="e.g. Maya Patel" className={fieldCls} />
      </div>

      {!member && (
        <div>
          <label htmlFor="member-email" className={labelCls}>Email Address <span className="text-red-500">*</span></label>
          <input id="member-email" type="email" name="email" required
            placeholder="name@bodhigrove.demo" className={fieldCls} />
        </div>
      )}

      <div>
        <label htmlFor="member-role" className={labelCls}>Role <span className="text-red-500">*</span></label>
        <select id="member-role" name="role" required defaultValue={member?.role ?? 'volunteer'} className={fieldCls}>
          <option value="viewer">Viewer</option>
          <option value="volunteer">Volunteer</option>
          <option value="coordinator">Coordinator</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-ink/45 mt-1">
          Viewers can read the rota only. Volunteers can sign up for slots and submit availability.
          Coordinators can also manage the schedule. Admins have full access including members and audit log.
        </p>
      </div>

      {member && (
        <div>
          <label htmlFor="member-active" className={labelCls}>Active</label>
          <select id="member-active" name="active" defaultValue={String(member.active)} className={fieldCls}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="member-password" className={labelCls}>
          Password{' '}
          {member
            ? <span className="text-ink/45 font-normal">(leave blank to keep current)</span>
            : <span className="text-red-500">*</span>
          }
        </label>
        <input id="member-password" type="password" name="password" autoComplete="new-password"
          {...(!member ? { required: true } : {})}
          placeholder="••••••••" className={fieldCls} />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-sand/50">
        <Link href="/admin/members" className={formCancelBtn}>
          Cancel
        </Link>
        <button type="submit" disabled={pending}
          className="text-sm px-4 py-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white rounded-md transition-colors">
          {pending ? 'Saving…' : member ? 'Save Changes' : 'Create Member'}
        </button>
      </div>
    </form>
  )
}
