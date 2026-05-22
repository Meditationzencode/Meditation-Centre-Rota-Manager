import type { Page } from '@playwright/test'

// Demo accounts — set env vars to override for your own Supabase instance.
// All demo accounts use password: Demo1234!
const ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL     ?? 'admin@bodhigrove.demo'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD  ?? 'Demo1234!'
const VOL_EMAIL      = process.env.TEST_VOL_EMAIL       ?? 'vol1@bodhigrove.demo'
const VOL_PASSWORD   = process.env.TEST_VOL_PASSWORD    ?? 'Demo1234!'
// Viewer account: create a member with role=viewer in the admin panel, then set TEST_VIEWER_EMAIL.
// If TEST_VIEWER_EMAIL is unset, viewer-specific tests will be skipped automatically.
export const VIEWER_EMAIL    = process.env.TEST_VIEWER_EMAIL    // intentionally no default
const VIEWER_PASSWORD = process.env.TEST_VIEWER_PASSWORD ?? 'Demo1234!'

export async function loginAs(page: Page, role: 'admin' | 'volunteer' | 'viewer') {
  const email    = role === 'admin' ? ADMIN_EMAIL    : role === 'viewer' ? (VIEWER_EMAIL ?? '') : VOL_EMAIL
  const password = role === 'admin' ? ADMIN_PASSWORD : role === 'viewer' ? VIEWER_PASSWORD      : VOL_PASSWORD

  await page.goto('/login')
  await page.fill('input[name="email"]',    email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}

export async function logout(page: Page) {
  // Open user dropdown (first aria-expanded button = user menu toggle) then Sign Out
  await page.locator('button[aria-expanded]').first().click()
  await page.getByRole('button', { name: /sign out/i }).click()
  await page.waitForURL('**/login', { timeout: 10_000 })
}
