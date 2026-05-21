import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Authentication Error' }

const messages = {
  missing_profile: {
    title: 'Your account is signed in, but no profile was found',
    body: 'The sign-in worked, but the rota app could not load a matching member profile. Ask an admin to check that this user exists in the profiles table and is active.',
  },
  default: {
    title: 'We could not complete sign-in',
    body: 'The app could not finish loading your account. Try signing out and back in, or ask an admin to check the account setup.',
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const message = reason === 'missing_profile' ? messages.missing_profile : messages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
      <main className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-sage-700">
          Sangha Rota
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium text-stone-900">
          {message.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {message.body}
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Back to sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-700"
          >
            Retry dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
