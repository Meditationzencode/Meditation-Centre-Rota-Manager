import type { Metadata } from 'next'
import Link from 'next/link'
import ResetForm from './reset-form'

export const metadata: Metadata = { title: 'Set New Password' }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-stone-700 to-sage-700 text-white p-12">
        <div>
          <div className="text-sage-200 tracking-widest text-2xl mb-8 opacity-60">◆ ◆ ◆</div>
          <h1 className="font-serif text-5xl font-semibold mb-2">Bodhi Grove</h1>
          <p className="uppercase tracking-[0.2em] text-sm text-stone-300 mb-1">Meditation Centre</p>
        </div>
        <blockquote className="border-l-2 border-white/30 pl-4 italic font-serif text-lg text-white/70">
          &ldquo;Peace comes from within. Do not seek it without.&rdquo;
        </blockquote>
      </div>

      <div className="flex items-center justify-center p-8 bg-stone-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="text-sage-600 text-lg mr-1">◆</span>
            <span className="font-serif text-2xl font-semibold">Bodhi Grove</span>
          </div>

          <h2 className="font-serif text-3xl font-medium mb-1">Set a new password</h2>
          <p className="text-stone-500 text-sm mb-8">Choose a new password for your account.</p>

          <ResetForm />

          <p className="mt-6 text-center text-sm text-stone-500">
            <Link href="/login" className="text-sage-700 hover:underline font-medium">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
