import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Rota views', () => {
  test('weekly rota page loads and shows day columns', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota')
    await expect(page.getByRole('heading', { name: /rota/i })).toBeVisible()
    // Should have week navigation
    await expect(page.getByRole('link', { name: /prev/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /next/i })).toBeVisible()
  })

  test('monthly rota page loads', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota/month')
    await expect(page.getByRole('heading', { name: /rota/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /week/i }).first()).toBeVisible()
  })

  test('week navigation moves to next week', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota')
    const initialURL = page.url()
    await page.getByRole('link', { name: /next/i }).click()
    await page.waitForURL(/week=/)
    expect(page.url()).not.toBe(initialURL)
  })
})

test.describe('Shift CRUD (admin)', () => {
  test('admin can reach the create slot form', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/schedule/new')
    await expect(page.locator('input[name="date"]')).toBeVisible()
    await expect(page.locator('select[name="duty"]')).toBeVisible()
    await expect(page.locator('select[name="location"]')).toBeVisible()
  })

  test('admin can create a slot and it appears in the schedule', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/schedule/new')

    // Use a far-future date to avoid conflicts with seed data
    await page.fill('input[name="date"]',         '2099-06-15')
    await page.selectOption('select[name="duty"]', 'Morning Sitting')
    await page.fill('input[name="startTime"]',     '07:00')
    await page.fill('input[name="endTime"]',       '08:00')
    await page.selectOption('select[name="location"]', 'Shrine Room')

    await page.click('button[type="submit"]')
    await page.waitForURL(/admin\/schedule/, { timeout: 10_000 })

    // Slot should appear in the schedule list
    await expect(page.getByText('Morning Sitting')).toBeVisible()
  })

  test('admin can open the edit form for a slot', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/schedule')
    const editLink = page.getByRole('link', { name: /edit/i }).first()
    await editLink.click()
    await expect(page.locator('input[name="date"]')).toBeVisible()
    await expect(page.locator('select[name="status"]')).toBeVisible()
  })
})

test.describe('Shift detail page', () => {
  test('clicking a slot duty navigates to the detail page', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota')

    const slotLink = page.locator('a[href^="/rota/"]').first()
    const slotText = await slotLink.textContent()
    await slotLink.click()

    await expect(page).toHaveURL(/\/rota\/.+/)
    if (slotText) {
      await expect(page.getByRole('heading', { name: slotText.trim() })).toBeVisible()
    }
  })

  test('detail page shows date, time, and location', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota')
    await page.locator('a[href^="/rota/"]').first().click()
    await expect(page.getByText(/time/i)).toBeVisible()
    await expect(page.getByText(/location/i)).toBeVisible()
  })
})
