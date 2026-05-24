/**
 * Captures screenshots of key pages for the README.
 * Run with: node scripts/capture-screenshots.mjs
 * Requires the dev server to be running on http://localhost:3000.
 */

import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR   = join(__dirname, '..', 'public', 'screenshots')

const BASE_URL       = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL    ?? 'admin@bodhigrove.demo'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Demo1234!'

async function shot(page, name) {
  const file = join(OUT_DIR, `${name}.png`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: file, fullPage: false })
  console.log(`  ✓ ${name}.png`)
}

async function loginAdmin(page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[name="email"]',    ADMIN_EMAIL)
  await page.fill('input[name="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()

  // ── Desktop (1280×800) ───────────────────────────────────────────────────────
  console.log('\nDesktop screenshots (1280×800):')
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page    = await desktop.newPage()

  // Public pages
  await page.goto(`${BASE_URL}/`)
  await shot(page, 'home')

  await page.goto(`${BASE_URL}/forgot-password`)
  await shot(page, 'forgot-password')

  // Login with validation error
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[name="email"]',    'wrong@example.com')
  await page.fill('input[name="password"]', 'badpassword')
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=/invalid|incorrect|error/i', { timeout: 10_000 }).catch(() => {})
  await shot(page, 'login')

  // Log in as admin
  await loginAdmin(page)

  // Core app pages
  for (const [name, path] of [
    ['dashboard',          '/dashboard'],
    ['rota-weekly',        '/rota'],
    ['rota-monthly',       '/rota/month'],
    ['profile',            '/profile'],
  ]) {
    await page.goto(`${BASE_URL}${path}`)
    await shot(page, name)
  }

  // Slot detail — click first slot link
  await page.goto(`${BASE_URL}/rota`)
  await page.waitForLoadState('networkidle')
  const slotLink = page.locator('a[href^="/rota/"]:not([href="/rota/month"])').first()
  if (await slotLink.count()) {
    await slotLink.click()
    await shot(page, 'slot-detail')
    await page.goBack()
  }

  // Admin pages
  for (const [name, path] of [
    ['admin-schedule',          '/admin/schedule'],
    ['admin-schedule-recurring','/admin/schedule/recurring'],
    ['create-slot',             '/admin/schedule/new'],
    ['admin-members',           '/admin/members'],
    ['admin-members-new',       '/admin/members/new'],
    ['admin-swaps',             '/admin/swaps'],
    ['admin-activity',          '/admin/activity'],
    ['admin-availability',      '/admin/availability'],
  ]) {
    await page.goto(`${BASE_URL}${path}`)
    await shot(page, name)
  }

  // Edit slot — grab the first slot ID from schedule page
  await page.goto(`${BASE_URL}/admin/schedule`)
  await page.waitForLoadState('networkidle')
  const editLink = page.locator('a[href*="/edit"]').first()
  if (await editLink.count()) {
    await editLink.click()
    await shot(page, 'edit-slot')
  }

  // Edit member — grab first member edit link
  await page.goto(`${BASE_URL}/admin/members`)
  await page.waitForLoadState('networkidle')
  const memberEditLink = page.locator('a[href*="/edit"]').first()
  if (await memberEditLink.count()) {
    await memberEditLink.click()
    await shot(page, 'edit-member')
  }

  await desktop.close()

  // ── Mobile (390×844) ────────────────────────────────────────────────────────
  console.log('\nMobile screenshots (390×844):')
  const mobile     = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobile.newPage()
  await loginAdmin(mobilePage)

  for (const [name, path] of [
    ['mobile-dashboard', '/dashboard'],
    ['mobile-rota',      '/rota'],
    ['mobile-monthly',   '/rota/month'],
    ['mobile-profile',   '/profile'],
  ]) {
    await mobilePage.goto(`${BASE_URL}${path}`)
    await shot(mobilePage, name)
  }

  await mobile.close()
  await browser.close()
  console.log(`\nDone — all screenshots saved to public/screenshots/`)
}

main().catch(err => { console.error(err); process.exit(1) })
