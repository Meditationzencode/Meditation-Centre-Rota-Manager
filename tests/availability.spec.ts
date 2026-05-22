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
    await page.fill('input[name="date"]', '2099-11-10')
    await page.getByRole('button', { name: /add date/i }).click()

    // The date appears formatted as "Mon 10 Nov" (en-GB, no year, weekday short)
    await expect(page.getByText(/10.*nov/i)).toBeVisible({ timeout: 8_000 })
  })

  test('marking the same date twice shows an error', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/profile')

    // First submission
    await page.fill('input[name="date"]', '2099-11-20')
    await page.getByRole('button', { name: /add date/i }).click()
    // Wait for the entry to appear before trying again
    await expect(page.getByText(/20.*nov/i)).toBeVisible({ timeout: 8_000 })

    // Second submission — same date should error
    await page.fill('input[name="date"]', '2099-11-20')
    await page.getByRole('button', { name: /add date/i }).click()
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
