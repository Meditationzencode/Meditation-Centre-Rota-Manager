import { defineConfig, devices } from '@playwright/test'

// E2E config. Runs against an ISOLATED Supabase project + dev server on a
// dedicated port so the suite can never pollute the live demo database.
// Unit tests live in playwright.unit.config.ts (no server / no database).
const PORT = process.env.E2E_PORT ?? '3100'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  testIgnore: '**/unit/**',                  // unit suite has its own config
  globalSetup: './tests/global-setup.ts',    // refuses to run against the live demo DB
  fullyParallel: false,   // tests share a Supabase instance — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,        // swap tests do 3 login/logout cycles — 30s is too tight
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  // Auto-start an isolated dev server (separate port + test Supabase). Never
  // reuse an existing server, so a prod-connected `npm run dev` on the default
  // port can't be hit by the suite.
  webServer: {
    command: 'npm run dev:e2e',
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
