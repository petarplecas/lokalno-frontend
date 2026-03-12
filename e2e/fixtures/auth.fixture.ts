import { Page } from '@playwright/test';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function register(page: Page, data: RegisterData): Promise<void> {
  await page.goto('/auth/register');
  await page.fill('#firstName', data.firstName);
  await page.fill('#lastName', data.lastName);
  await page.fill('#email', data.email);
  await page.fill('#password', data.password);
  await page.fill('#confirmPassword', data.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home', { timeout: 20000 });
}

export async function login(
  page: Page,
  email: string,
  password: string,
  expectedUrlPattern = '**/home',
): Promise<void> {
  await page.goto('/auth/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(expectedUrlPattern);
}

export async function logout(page: Page): Promise<void> {
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('button.profile__logout', { timeout: 10000 });
  await page.click('button.profile__logout');
  await page.waitForURL('**/auth/login');
}

/** Unique email per test run to avoid conflicts */
export function testEmail(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}@playwright.test`;
}

export const TEST_PASSWORD = 'Playwright123!';

export const ADMIN_USER = {
  email: process.env['E2E_ADMIN_EMAIL'] ?? 'e2e-admin@lokalno.test',
  // No hardcoded fallback — E2E_ADMIN_PASSWORD must be set via env var in CI
  password: process.env['E2E_ADMIN_PASSWORD'] ?? '',
};
