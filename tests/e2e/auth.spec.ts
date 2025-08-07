import { test, expect } from './setup'

test.describe('Authentication', () => {
  test('should display auth form on initial load', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to /auth
    await expect(page).toHaveURL('/auth')
    
    // Should show the auth form
    await expect(page.locator('h1')).toContainText('QUEST FORGE')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('SIGN IN')
  })

  test('should toggle between sign in and sign up forms', async ({ page }) => {
    await page.goto('/auth')
    
    // Initially should show sign in form
    await expect(page.locator('button[type="submit"]')).toContainText('SIGN IN')
    await expect(page.locator('input[id="username"]')).not.toBeVisible()
    
    // Click toggle to sign up
    await page.click('text="DON\'T HAVE AN ACCOUNT? SIGN UP"')
    
    // Should now show sign up form
    await expect(page.locator('button[type="submit"]')).toContainText('CREATE ACCOUNT')
    await expect(page.locator('input[id="username"]')).toBeVisible()
    
    // Toggle back to sign in
    await page.click('text="ALREADY HAVE AN ACCOUNT? SIGN IN"')
    
    // Should be back to sign in form
    await expect(page.locator('button[type="submit"]')).toContainText('SIGN IN')
    await expect(page.locator('input[id="username"]')).not.toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth')
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]')
    
    // Browser validation should prevent submission
    // The form should still be visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should show username field in signup mode', async ({ page }) => {
    await page.goto('/auth')
    
    // Switch to signup mode
    await page.click('text="DON\'T HAVE AN ACCOUNT? SIGN UP"')
    
    // Username field should be visible and required
    const usernameInput = page.locator('input[id="username"]')
    await expect(usernameInput).toBeVisible()
    await expect(usernameInput).toHaveAttribute('required')
  })
})