import { defineConfig } from '@playwright/test'

// Pure-function unit tests (validation, scheduling) — no browser, server, or
// database. Kept in a separate config from the E2E suite so they never trigger
// the webServer or the isolated-database guard. This is what CI runs.
export default defineConfig({
  testDir: './tests/unit',
  reporter: [['list']],
})
