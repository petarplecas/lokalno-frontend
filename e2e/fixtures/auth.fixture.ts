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
  await page.waitForURL('**/home', { timeout: 30000 });
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
  await page.waitForURL(expectedUrlPattern, { timeout: 30000 });
}

export async function logout(page: Page): Promise<void> {
  // Ne koristiti goto('/profile') — hard nav gubi access token iz memorije.
  // Kliknuti na profile link u navigaciji (SPA navigacija, token ostaje).
  // Čekati da bottom-nav bude rendrovan (APP_INITIALIZER mora biti završen i user autentifikovan).
  await page.waitForSelector('a[href="/profile"]', { timeout: 30000 });
  await page.click('a[href="/profile"]');
  await page.waitForSelector('button.profile__logout', { timeout: 10000 });
  await page.click('button.profile__logout');
  await page.waitForURL('**/auth/login');
}

/** Unique email per test run to avoid conflicts (rand suffix prevents timestamp collision between projects) */
export function testEmail(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `e2e-${prefix}-${Date.now()}-${rand}@playwright.test`;
}

export const TEST_PASSWORD = 'Playwright123!';

export const ADMIN_USER = {
  email: process.env['E2E_ADMIN_EMAIL'] ?? 'e2e-admin@lokalno.test',
  // No hardcoded fallback — E2E_ADMIN_PASSWORD must be set via env var in CI
  password: process.env['E2E_ADMIN_PASSWORD'] ?? '',
};
