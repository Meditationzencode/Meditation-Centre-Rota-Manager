'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'
import { formField as fieldCls, formLabel as labelCls } from '@/lib/form-styles'

export default function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(updateProfile, null)
  const error   = state && 'error' in state   ? state.error : null
  const success = state && 'success' in state ? true        : false

  return (
    <form action={formAction} className="bg-white border border-sand/70 rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="font-serif text-lg font-medium text-ink border-b border-sand/50 pb-3">Edit Details</h2>

      {error   && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>}
      {success && <div role="status" className="bg-sage-50 border border-sage-200 text-sage-800 text-sm rounded-md px-4 py-3">Profile updated successfully.</div>}

      <div>
        <label htmlFor="profile-name" className={labelCls}>Full Name</label>
        <input id="profile-name" type="text" name="name" required defaultValue={name} className={fieldCls} />
      </div>

      <div>
        <label htmlFor="profile-phone" className={labelCls}>
          Phone Number <span className="text-ink/45 font-normal">(optional)</span>
        </label>
        <input id="profile-phone" type="tel" name="phone" defaultValue={phone} placeholder="+44 7700 900000" className={fieldCls} />
      </div>

      <div>
        <label htmlFor="profile-password" className={labelCls}>
          New Password <span className="text-ink/45 font-normal">(leave blank to keep current)</span>
        </label>
        <input id="profile-password" type="password" name="password" autoComplete="new-password" placeholder="••••••••" className={fieldCls} />
      </div>

      <div>
        <label htmlFor="profile-confirm" className={labelCls}>Confirm New Password</label>
        <input id="profile-confirm" type="password" name="confirmPassword" autoComplete="new-password" placeholder="••••••••" className={fieldCls} />
      </div>

      <div className="flex justify-end pt-2 border-t border-sand/50">
        <button type="submit" disabled={pending}
          className="text-sm px-4 py-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white rounded-md transition-colors">
          {pending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
