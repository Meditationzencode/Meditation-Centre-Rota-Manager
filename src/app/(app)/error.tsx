'use client'

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-xl font-medium text-red-700 mb-2">Something went wrong</h2>
        <p className="text-sm text-stone-600 mb-4">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-sage-600 text-white text-sm rounded-lg hover:bg-sage-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
