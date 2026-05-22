import { test, expect } from '@playwright/test'
import { loginAs, VIEWER_EMAIL } from './helpers'

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
    // Scope to the desktop <nav> element to avoid collisions with page content
    const nav = page.locator('header nav')
    await expect(nav.getByRole('link', { name: 'Members'  })).toBeVisible({ timeout: 10_000 })
    await expect(nav.getByRole('link', { name: 'Swaps'    })).toBeVisible({ timeout: 10_000 })
    await expect(nav.getByRole('link', { name: 'Activity' })).toBeVisible({ timeout: 10_000 })
  })

  test('volunteer nav does not show admin links', async ({ page }) => {
    await loginAs(page, 'volunteer')
    const nav = page.locator('header nav')
    await expect(nav.getByRole('link', { name: 'Members'  })).not.toBeVisible()
    await expect(nav.getByRole('link', { name: 'Activity' })).not.toBeVisible()
  })
})

test.describe('Shift creation permissions', () => {
  test('admin can access the create-slot form', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/admin/schedule/new')
    await expect(page).toHaveURL(/admin\/schedule\/new/)
    await expect(page.locator('input[name="date"]')).toBeVisible()
  })

  test('volunteer is redirected away from the create-slot form', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await page.goto('/admin/schedule/new')
    await expect(page).not.toHaveURL(/admin\/schedule\/new/)
  })

  test('viewer cannot sign up for shifts on the rota', async ({ page }) => {
    // Skipped when TEST_VIEWER_EMAIL is not set.
    // To enable: create a member with role=Viewer in Admin → Members,
    // then export TEST_VIEWER_EMAIL=viewer@bodhigrove.demo before running tests.
    test.skip(!VIEWER_EMAIL, 'Set TEST_VIEWER_EMAIL to enable viewer permission tests')
    await loginAs(page, 'viewer')
    await page.goto('/rota')
    await page.waitForLoadState('networkidle')
    // Viewer role sets canSignUp=false; the "Sign up" button must not appear at all
    await expect(page.getByRole('button', { name: 'Sign up' })).not.toBeVisible()
  })
})
