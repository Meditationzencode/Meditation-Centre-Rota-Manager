'use client'

import { useActionState } from 'react'
import { createMember, updateMember } from '@/lib/actions'
import type { ActionResult, Profile } from '@/lib/types'

interface Props { member: Profile | null }

export default function MemberForm({ member }: Props) {
  const action = member ? updateMember : createMember
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null)
  const error = state && 'error' in state ? state.error : null

  const fieldCls = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-stone-700 mb-1'

  return (
    <form action={formAction} className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 space-y-5">
      {member && <input type="hidden" name="id" value={member.id} />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      <div>
        <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
        <input type="text" name="name" required defaultValue={member?.name ?? ''}
          placeholder="e.g. Maya Patel" className={fieldCls} />
      </div>

      {!member && (
        <div>
          <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
          <input type="email" name="email" required
            placeholder="name@bodhigrove.demo" className={fieldCls} />
        </div>
      )}

      <div>
        <label className={labelCls}>Role <span className="text-red-500">*</span></label>
        <select name="role" required defaultValue={member?.role ?? 'volunteer'} className={fieldCls}>
          <option value="volunteer">Volunteer</option>
          <option value="coordinator">Coordinator</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-stone-400 mt-1">
          Volunteers can view &amp; sign up. Coordinators can manage the schedule. Admins have full access.
        </p>
      </div>

      {member && (
        <div>
          <label className={labelCls}>Active</label>
          <select name="active" defaultValue={String(member.active)} className={fieldCls}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>
          Password{' '}
          {member
            ? <span className="text-stone-400 font-normal">(leave blank to keep current)</span>
            : <span className="text-red-500">*</span>
          }
        </label>
        <input type="password" name="password" autoComplete="new-password"
          {...(!member ? { required: true } : {})}
          placeholder="••••••••" className={fieldCls} />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
        <a href="/admin/members" className="text-sm px-4 py-2 border border-stone-300 rounded-md text-stone-700 hover:bg-stone-50 transition-colors">
          Cancel
        </a>
        <button type="submit" disabled={pending}
          className="text-sm px-4 py-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white rounded-md transition-colors">
          {pending ? 'Saving…' : member ? 'Save Changes' : 'Create Member'}
        </button>
      </div>
    </form>
  )
}
