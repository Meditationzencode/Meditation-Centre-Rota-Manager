import fs from 'node:fs'
import path from 'node:path'

// Read a dotenv-style file into a plain object (no dependency on dotenv).
function readEnvFile(file: string): Record<string, string> {
  const full = path.resolve(process.cwd(), file)
  if (!fs.existsSync(full)) return {}
  const out: Record<string, string> = {}
  for (const raw of fs.readFileSync(full, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

const URL_KEY = 'NEXT_PUBLIC_SUPABASE_URL'

/**
 * Fail-closed guard for the E2E suite. The end-to-end tests create and delete
 * real rows, so they must NEVER run against the live demo database. This aborts
 * the run unless a separate, throwaway Supabase project is configured in
 * `.env.test.local` (and it differs from the demo project in `.env.local`).
 */
export default function globalSetup() {
  const prodUrl = readEnvFile('.env.local')[URL_KEY]
  const testUrl = readEnvFile('.env.test.local')[URL_KEY]

  if (!testUrl) {
    throw new Error(
      [
        '',
        '──────────────────────────────────────────────────────────────',
        ' E2E tests need an ISOLATED Supabase project — refusing to run.',
        '──────────────────────────────────────────────────────────────',
        ' The suite creates and deletes real rows, so it must never touch',
        ' the live demo database.',
        '',
        ' One-time setup:',
        '   1. Create a second (free) throwaway Supabase project.',
        '   2. Run supabase/*.sql in its SQL editor (same order as the demo).',
        '   3. cp .env.test.local.example .env.test.local  and fill in its',
        '      URL + anon + service-role keys.',
        '   4. npm run setup:e2e        (seeds demo users into the test project)',
        '',
        ' Then:  npm test',
        '──────────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    )
  }

  if (prodUrl && testUrl === prodUrl) {
    throw new Error(
      '\n🛑 .env.test.local points at the SAME Supabase project as .env.local ' +
        '(the live demo).\n   Point the E2E suite at a separate throwaway project ' +
        "so it can't pollute the demo.\n",
    )
  }

  console.log(`\n[e2e] Isolated Supabase OK → ${testUrl}\n`)
}
