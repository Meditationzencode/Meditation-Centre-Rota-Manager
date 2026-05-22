import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers'

// Each test uses a unique date so parallel runs and re-runs don't conflict.
// Test data accumulates in the DB but doesn't break subsequent runs:
//   - approved swaps cancel the signup → volunteer can sign up again next run
//   - rejected swaps leave signup intact but clear swapPending → volunteer can re-request

async function createSlot(page: Parameters<typeof loginAs>[0], date: string, duty: string) {
  await page.goto('/admin/schedule/new')
  await page.fill('input[name="date"]',              date)
  await page.selectOption('select[name="duty"]',     duty)
  await page.fill('input[name="startTime"]',         '07:00')
  await page.fill('input[name="endTime"]',           '08:00')
  await page.selectOption('select[name="location"]', 'Shrine Room')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin/schedule', { timeout: 20_000 })
}

async function signUpAndRequestSwap(
  page: Parameters<typeof loginAs>[0],
  weekDate: string,
) {
  await page.goto(`/rota?week=${weekDate}`)
  await page.waitForLoadState('networkidle')

  // Sign up for any open slot if not already signed up for one
  const signUpBtn = page.getByRole('button', { name: 'Sign up' }).first()
  if (await signUpBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await signUpBtn.click()
    // Wait for the rota to re-render showing Cancel / Swap? on the signed-up slot
    await page.waitForLoadState('networkidle')
  }

  // "Swap?" only appears on slots where the current user is signed up
  const swapBtn = page.getByRole('button', { name: 'Swap?' }).first()
  await expect(swapBtn).toBeVisible({ timeout: 10_000 })
  await swapBtn.click()

  await page.fill('textarea[name="reason"]', 'Automated test swap request')
  await page.getByRole('button', { name: 'Request' }).first().click()

  await expect(page.getByText(/swap pending/i).first()).toBeVisible({ timeout: 10_000 })
}

// Each test uses a date in a DIFFERENT week so that when the volunteer navigates
// to that week she only sees the slots created by that specific test. Cross-week
// isolation prevents the page-level .first() locators from grabbing the wrong slot.
test.describe('Swap requests', () => {
  test('volunteer can request a shift swap', async ({ page }) => {
    await loginAs(page, 'admin')
    await createSlot(page, '2099-07-01', 'Morning Sitting')   // week of 30 Jun

    await logout(page)
    await loginAs(page, 'volunteer')
    await signUpAndRequestSwap(page, '2099-07-01')
  })

  test('admin can approve a pending swap request', async ({ page }) => {
    await loginAs(page, 'admin')
    await createSlot(page, '2099-07-08', 'Evening Sitting')   // week of 7 Jul

    await logout(page)
    await loginAs(page, 'volunteer')
    await signUpAndRequestSwap(page, '2099-07-08')

    await logout(page)
    await loginAs(page, 'admin')
    await page.goto('/admin/swaps')
    await page.waitForLoadState('networkidle')

    // Record how many Approve buttons exist before acting
    const pendingBefore = await page.getByRole('button', { name: 'Approve' }).count()
    expect(pendingBefore).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Approve' }).first().click()

    // After the server action and page re-render, one fewer pending swap remains
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(
      pendingBefore - 1, { timeout: 15_000 }
    )
  })

  test('admin can reject a pending swap request', async ({ page }) => {
    await loginAs(page, 'admin')
    await createSlot(page, '2099-07-15', 'Reception Desk')    // week of 14 Jul

    await logout(page)
    await loginAs(page, 'volunteer')
    await signUpAndRequestSwap(page, '2099-07-15')

    await logout(page)
    await loginAs(page, 'admin')
    await page.goto('/admin/swaps')
    await page.waitForLoadState('networkidle')

    const pendingBefore = await page.getByRole('button', { name: 'Reject' }).count()
    expect(pendingBefore).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Reject' }).first().click()

    await expect(page.getByRole('button', { name: 'Reject' })).toHaveCount(
      pendingBefore - 1, { timeout: 15_000 }
    )
  })
})
