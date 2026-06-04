/**
 * Starts the Next.js dev server for the E2E suite on an isolated port, using an
 * ISOLATED Supabase project from `.env.test.local`. Acts as the fail-closed
 * guard: if no separate test project is configured, it refuses to start so the
 * suite can never write into the live demo database.
 *
 * Invoked by Playwright's `webServer` via:  npm run dev:e2e
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function readEnvFile(file) {
  const full = path.resolve(process.cwd(), file)
  if (!fs.existsSync(full)) return null
  const out = {}
  for (const raw of fs.readFileSync(full, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const k = line.slice(0, eq).trim()
    let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[k] = v
  }
  return out
}

const KEY = 'NEXT_PUBLIC_SUPABASE_URL'
const GUARD = `
──────────────────────────────────────────────────────────────
 E2E tests need an ISOLATED Supabase project — refusing to run.
──────────────────────────────────────────────────────────────
 The suite creates and deletes real rows, so it must never touch
 the live demo database.

 One-time setup:
   1. Create a second (free) throwaway Supabase project.
   2. Run supabase/*.sql in its SQL editor (same order as the demo).
   3. cp .env.test.local.example .env.test.local  and fill it in.
   4. npm run setup:e2e        (seeds demo users into the test project)

 Then:  npm test
──────────────────────────────────────────────────────────────
`

const testEnv = readEnvFile('.env.test.local')
if (!testEnv || !testEnv[KEY]) {
  console.error(GUARD)
  process.exit(1)
}

const prodEnv = readEnvFile('.env.local')
if (prodEnv?.[KEY] && prodEnv[KEY] === testEnv[KEY]) {
  console.error(
    '\n🛑 .env.test.local points at the SAME Supabase project as .env.local (the live demo).' +
    '\n   Use a separate throwaway project so the E2E suite cannot pollute the demo.\n',
  )
  process.exit(1)
}

const port = process.env.E2E_PORT ?? '3100'
// Next.js does not override variables already present in process.env, so the
// test project's Supabase config (passed here) wins over anything in .env.local.
const child = spawn('next', ['dev', '-p', port], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ...testEnv },
})
child.on('exit', code => process.exit(code ?? 0))
