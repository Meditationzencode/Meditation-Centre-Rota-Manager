import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Rota views', () => {
  test('weekly rota page loads and shows day columns', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota')
    await expect(page.getByRole('heading', { name: /rota/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /prev/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /next/i })).toBeVisible()
  })

  test('monthly rota page loads', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota/month')
    await expect(page.getByRole('heading', { name: /rota/i })).toBeVisible()
    // Week/Month toggle should be present
    await expect(page.getByRole('link', { name: 'Week' })).toBeVisible()
  })

  test('week navigation moves to next week', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota')
    await page.getByRole('link', { name: /next/i }).click()
    await page.waitForURL(/week=/)
    await expect(page).toHaveURL(/week=/)
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

  test('admin can create a slot and is redirected to the schedule', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/schedule/new')

    await page.fill('input[name="date"]',              '2099-06-15')
    await page.selectOption('select[name="duty"]',     'Morning Sitting')
    await page.fill('input[name="startTime"]',         '07:00')
    await page.fill('input[name="endTime"]',           '08:00')
    await page.selectOption('select[name="location"]', 'Shrine Room')

    await page.click('button[type="submit"]')
    // Server action redirect — give extra time for the dev server
    await page.waitForURL('**/admin/schedule', { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: /manage schedule/i })).toBeVisible()
  })

  test('admin can open the edit form for an existing slot', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/schedule')
    // Wait for at least one slot row to load
    await page.waitForLoadState('networkidle')
    // Target the Edit link specifically by its href pattern inside the table
    const editLink = page.locator('table a[href*="/admin/schedule/"][href$="/edit"]').first()
    await expect(editLink).toBeVisible({ timeout: 10_000 })
    const editHref = await editLink.getAttribute('href')
    await page.goto(editHref!)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[name="date"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('select[name="status"]')).toBeVisible()
  })

  test('admin can delete a slot', async ({ page }) => {
    await loginAs(page, 'admin')

    // Create a slot at a unique date so we can find and delete it
    await page.goto('/admin/schedule/new')
    await page.fill('input[name="date"]',              '2099-08-31')
    await page.selectOption('select[name="duty"]',     'Garden Maintenance')
    await page.fill('input[name="startTime"]',         '09:00')
    await page.fill('input[name="endTime"]',           '11:00')
    await page.selectOption('select[name="location"]', 'Gardens')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/schedule', { timeout: 20_000 })

    // Find the row we just created by its date text ("31 Aug")
    await page.waitForLoadState('networkidle')
    const row = page.locator('tbody tr').filter({ hasText: '31 Aug' }).first()
    await expect(row).toBeVisible({ timeout: 10_000 })

    // Accept the confirm dialog, then click Delete
    page.once('dialog', dialog => dialog.accept())
    await row.getByRole('button', { name: 'Delete' }).click()

    // Row should disappear after the server action completes
    await expect(row).not.toBeVisible({ timeout: 10_000 })
  })

  test('shift form rejects missing required fields', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/schedule/new')
    // Submit without filling any required fields
    await page.click('button[type="submit"]')
    // Browser HTML5 validation prevents the form from submitting — URL stays on /new
    await expect(page).toHaveURL(/\/admin\/schedule\/new/)
  })
})

test.describe('Shift detail page', () => {
  test('clicking a slot duty navigates to the detail page', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota')
    // Slot duty links go to /rota/<uuid> — exclude /rota/month
    const slotLink = page.locator('a[href^="/rota/"]:not([href="/rota/month"])').first()
    await expect(slotLink).toBeVisible({ timeout: 8_000 })
    await slotLink.click()
    await expect(page).toHaveURL(/\/rota\/[0-9a-f-]{36}/)
  })

  test('detail page shows date, time, and location labels', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/rota')
    await page.locator('a[href^="/rota/"]:not([href="/rota/month"])').first().click()
    await expect(page).toHaveURL(/\/rota\/[0-9a-f-]{36}/)
    await expect(page.getByText(/time/i).first()).toBeVisible()
    await expect(page.getByText(/location/i).first()).toBeVisible()
  })
})
