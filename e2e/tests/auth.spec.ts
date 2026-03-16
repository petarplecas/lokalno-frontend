import { test, expect } from '@playwright/test';
import {
  register,
  login,
  logout,
  testEmail,
  getSharedUserEmail,
  TEST_PASSWORD,
} from '../fixtures/auth.fixture';

// All auth tests start unauthenticated — clear the shared storageState.
test.describe('Auth flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should register a new user and redirect to home', async ({ page }) => {
    await register(page, {
      firstName: 'Test',
      lastName: 'Korisnik',
      email: testEmail('register'),
      password: TEST_PASSWORD,
    });

    await expect(page).toHaveURL(/\/home/);
  });

  test('should login with valid credentials', async ({ page }) => {
    const email = testEmail('login');

    // Register first, then login
    await register(page, {
      firstName: 'Test',
      lastName: 'Login',
      email,
      password: TEST_PASSWORD,
    });
    await logout(page);
    await login(page, email, TEST_PASSWORD);

    await expect(page).toHaveURL(/\/home/);
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'nepostoji@example.com');
    await page.fill('#password', 'pogresnaLozinka1!');
    await page.click('button[type="submit"]');

    const error = page.locator('.auth-error[role="alert"]');
    await expect(error).toBeVisible();
  });

  test('should show validation errors for empty form submit', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('button[type="submit"]');

    // Touch fields to trigger validation
    await page.fill('#email', 'a');
    await page.fill('#email', '');
    await page.fill('#password', 'a');
    await page.fill('#password', '');
    await page.click('button[type="submit"]');

    const emailError = page.locator('.error-message').first();
    await expect(emailError).toBeVisible();
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Use the shared user (created in global-setup) instead of registering a new one.
    // This avoids hitting the backend throttle limit (10 auth requests/60s) that is
    // reached when chromium + Mobile Chrome both register multiple users in rapid succession.
    // login() puts the access token in memory — same guarantee as register().
    const email = getSharedUserEmail();
    await login(page, email, TEST_PASSWORD);
    await logout(page);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should redirect unauthenticated user from protected route', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
