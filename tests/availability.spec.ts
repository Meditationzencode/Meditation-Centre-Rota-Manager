import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Volunteer availability', () => {
  test('profile page shows the unavailability form', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible()
    await expect(page.locator('input[name="date"]')).toBeVisible()
  })

  test('volunteer can mark a date as unavailable', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/profile')

    // Use a far-future date unlikely to conflict
    await page.fill('input[name="date"]', '2099-12-25')
    await page.getByRole('button', { name: /mark unavailable/i }).click()

    // Entry should appear in the list
    await expect(page.getByText('25 Dec 2099')).toBeVisible({ timeout: 8_000 })
  })

  test('marking the same date twice shows an error', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/profile')

    await page.fill('input[name="date"]', '2099-12-25')
    await page.getByRole('button', { name: /mark unavailable/i }).click()
    await page.waitForTimeout(1000)

    await page.fill('input[name="date"]', '2099-12-25')
    await page.getByRole('button', { name: /mark unavailable/i }).click()

    await expect(page.getByText(/already marked/i)).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('My sign-ups', () => {
  test('profile page shows upcoming sign-ups section', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/profile')
    await expect(page.getByText(/my sign-ups/i)).toBeVisible()
  })

  test('profile page has Export .ics link', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/profile')
    await expect(page.getByRole('link', { name: /export .ics/i })).toBeVisible()
  })
})
