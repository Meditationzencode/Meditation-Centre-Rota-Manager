import { test, expect } from '@playwright/test'

// All protected routes must redirect unauthenticated users to /login.
// These tests run without any authentication state.

const PROTECTED_ROUTES = [
  '/dashboard',
  '/rota',
  '/rota/month',
  '/profile',
  '/admin/schedule',
  '/admin/members',
  '/admin/swaps',
  '/admin/activity',
]

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/forgot-password',
]

test.describe('Unauthenticated route protection', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects to /login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
    })
  }
})

test.describe('Public routes', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} is accessible without login`, async ({ page }) => {
      const response = await page.goto(route)
      // /login itself is at /login — only check redirect for other public routes
      if (route !== '/login') {
        await expect(page).not.toHaveURL(/\/login/)
      }
      expect(response?.status()).toBeLessThan(500)
    })
  }
})
