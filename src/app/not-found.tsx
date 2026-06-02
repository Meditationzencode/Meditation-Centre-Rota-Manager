import type { Metadata } from 'next'
import Link from 'next/link'
import BrandMark from '@/components/ui/brand-mark'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
      <main className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <BrandMark size={52} />
        </div>
        <p className="mt-5 font-serif text-5xl font-semibold leading-none text-sage-700">404</p>
        <h1 className="mt-4 font-serif text-2xl font-medium text-stone-900">
          This path leads nowhere
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          The page you’re looking for isn’t here. It may have moved, or the link may be incomplete.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center justify-center rounded-md bg-sage-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-700"
        >
          Return home
        </Link>
      </main>
    </div>
  )
}
