import type { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-stone-700 to-sage-700 text-white p-12">
        <div>
          <div className="text-sage-200 tracking-widest text-2xl mb-8 opacity-60">◆ ◆ ◆</div>
          <h1 className="font-serif text-5xl font-semibold mb-2">Bodhi Grove</h1>
          <p className="uppercase tracking-[0.2em] text-sm text-stone-300 mb-1">Meditation Centre</p>
          <p className="text-stone-400 text-sm mt-4">Sangha Rota — volunteer scheduling portal</p>
        </div>
        <blockquote className="border-l-2 border-white/30 pl-4 italic font-serif text-lg text-white/70">
          &ldquo;Peace comes from within. Do not seek it without.&rdquo;
        </blockquote>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8 bg-stone-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="text-sage-600 text-lg mr-1">◆</span>
            <span className="font-serif text-2xl font-semibold">Bodhi Grove</span>
          </div>

          <h2 className="font-serif text-3xl font-medium mb-1">Welcome back</h2>
          <p className="text-stone-500 text-sm mb-8">Sign in to manage the rota</p>

          <LoginForm />

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-xs text-stone-400 mb-3">
              Demo accounts &mdash; password: <code className="bg-stone-100 px-1 rounded">Demo1234!</code>
            </p>
            <div className="flex flex-col gap-2">
              {[
                { email: 'admin@bodhigrove.demo',  role: 'admin',       name: 'Ananda Sharma'   },
                { email: 'coord1@bodhigrove.demo', role: 'coordinator', name: 'Maya Patel'      },
                { email: 'vol1@bodhigrove.demo',   role: 'volunteer',   name: 'James Whitfield' },
              ].map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  data-email={acc.email}
                  className="demo-fill flex items-center gap-2 px-3 py-2 text-left text-sm border border-stone-200 rounded-md bg-white hover:bg-stone-50 hover:border-stone-400 transition-colors"
                >
                  <RoleBadge role={acc.role as 'admin' | 'coordinator' | 'volunteer'} />
                  <span className="text-stone-700">{acc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: 'admin' | 'coordinator' | 'volunteer' }) {
  const styles = {
    admin:       'bg-purple-100 text-purple-800',
    coordinator: 'bg-teal-100 text-teal-800',
    volunteer:   'bg-sage-100 text-sage-800',
  }
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[role]}`}>
      {role}
    </span>
  )
}
