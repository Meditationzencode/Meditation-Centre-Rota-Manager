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

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()

  // --- Desktop context (1280×800) ---
  const desktop  = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page     = await desktop.newPage()

  // 1. Login page — capture BEFORE logging in, with a validation error visible
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.fill('input[name="email"]',    'wrong@example.com')
  await page.fill('input[name="password"]', 'badpassword')
  await page.click('button[type="submit"]')
  // Wait for an error message to appear
  await page.waitForSelector('text=/invalid|incorrect|error/i', { timeout: 10_000 }).catch(() => {})
  await page.screenshot({ path: join(OUT_DIR, 'login.png'), fullPage: false })
  console.log('Saved login.png')

  // Log in properly
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[name="email"]',    ADMIN_EMAIL)
  await page.fill('input[name="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15_000 })

  // 2. Standard full-page screenshots
  const shots = [
    { name: 'dashboard',          path: '/dashboard'          },
    { name: 'rota-weekly',        path: '/rota'               },
    { name: 'rota-monthly',       path: '/rota/month'         },
    { name: 'admin-schedule',     path: '/admin/schedule'     },
    { name: 'admin-members',      path: '/admin/members'      },
    { name: 'admin-availability', path: '/admin/availability' },
  ]

  for (const { name, path } of shots) {
    await page.goto(`${BASE_URL}${path}`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: false })
    console.log(`Saved ${name}.png`)
  }

  // 3. Shift detail — click first slot link on the rota
  await page.goto(`${BASE_URL}/rota`)
  await page.waitForLoadState('networkidle')
  const slotLink = page.locator('a[href^="/rota/"]:not([href="/rota/month"])').first()
  if (await slotLink.count()) {
    await slotLink.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: join(OUT_DIR, 'slot-detail.png'), fullPage: false })
    console.log('Saved slot-detail.png')
  }

  // 4. Create shift form
  await page.goto(`${BASE_URL}/admin/schedule/new`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: join(OUT_DIR, 'create-slot.png'), fullPage: false })
  console.log('Saved create-slot.png')

  await desktop.close()

  // --- Mobile context (390×844, iPhone 14 size) ---
  const mobile     = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobile.newPage()

  await mobilePage.goto(`${BASE_URL}/login`)
  await mobilePage.fill('input[name="email"]',    ADMIN_EMAIL)
  await mobilePage.fill('input[name="password"]', ADMIN_PASSWORD)
  await mobilePage.click('button[type="submit"]')
  await mobilePage.waitForURL('**/dashboard', { timeout: 15_000 })

  await mobilePage.goto(`${BASE_URL}/rota`)
  await mobilePage.waitForLoadState('networkidle')
  await mobilePage.screenshot({ path: join(OUT_DIR, 'mobile-rota.png'), fullPage: false })
  console.log('Saved mobile-rota.png')

  await mobile.close()

  await browser.close()
  console.log(`\nAll screenshots saved to public/screenshots/`)
}

main().catch(err => { console.error(err); process.exit(1) })
