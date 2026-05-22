import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Admin-only routes', () => {
  test('admin can access /admin/members', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/members')
    await expect(page).toHaveURL(/admin\/members/)
    await expect(page.getByRole('heading', { name: /members/i })).toBeVisible()
  })

  test('admin can access /admin/activity', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/activity')
    await expect(page).toHaveURL(/admin\/activity/)
    await expect(page.getByRole('heading', { name: /activity/i })).toBeVisible()
  })

  test('admin can access /admin/swaps', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/swaps')
    await expect(page).toHaveURL(/admin\/swaps/)
    await expect(page.getByRole('heading', { name: /swap/i })).toBeVisible()
  })

  test('volunteer is redirected away from /admin/members', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/admin/members')
    // Should be bounced to /dashboard (non-admin redirect in page)
    await expect(page).not.toHaveURL(/admin\/members/)
  })

  test('volunteer is redirected away from /admin/activity', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/admin/activity')
    await expect(page).not.toHaveURL(/admin\/activity/)
  })
})

test.describe('Role indicators', () => {
  test('admin nav shows Members, Swaps, and Activity links', async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page.getByRole('link', { name: 'Members' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Swaps'   })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Activity'})).toBeVisible()
  })

  test('volunteer nav does not show admin links', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await expect(page.getByRole('link', { name: 'Members'  })).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Activity' })).not.toBeVisible()
  })
})
