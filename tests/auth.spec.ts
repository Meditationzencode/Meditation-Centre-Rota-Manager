import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers'

test.describe('Home page', () => {
  test('is publicly accessible without login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Sangha Rota/)
    await expect(page.getByRole('heading', { name: /volunteer rota/i })).toBeVisible()
  })

  test('shows Login button for unauthenticated visitors', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /login/i }).first()).toBeVisible()
  })
})

test.describe('Login page', () => {
  test('renders email, password, and forgot-password link', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.getByRole('link', { name: /forgot/i })).toBeVisible()
  })

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]',    'nobody@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 8_000 })
  })

  test('redirects to dashboard after successful login', async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText(/dashboard/i).first()).toBeVisible()
  })

  test('redirects authenticated users away from /login', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/login')
    await expect(page).toHaveURL(/dashboard/)
  })
})

test.describe('Logout', () => {
  test('signs the user out and redirects to /login', async ({ page }) => {
    await loginAs(page, 'admin')
    await logout(page)
    await expect(page).toHaveURL(/login/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })
})

test.describe('Forgot password page', () => {
  test('is publicly accessible', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })
})
