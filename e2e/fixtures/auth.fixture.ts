import { readFileSync } from 'fs';
import { Page } from '@playwright/test';
import { E2E_STATE_FILE } from '../global-setup';

const API_BASE_URL = process.env['E2E_API_URL'] ?? 'http://localhost:3000';

/** Email of the shared user registered in global-setup, readable by all workers. */
export function getSharedUserEmail(): string {
  const state = JSON.parse(readFileSync(E2E_STATE_FILE, 'utf-8')) as { sharedUserEmail: string };
  return state.sharedUserEmail;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Wait for home page async discount fetch to settle.
// article.discount-card appears when discounts load; app-empty-state appears when empty or error.
// Both are only rendered when the loading() signal is false.
async function waitForHomeReady(page: Page): Promise<void> {
  await page.waitForSelector('article.discount-card, app-empty-state', {
    timeout: 30000,
  });
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
  await waitForHomeReady(page);
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
  // Race: fail immediately if auth-error appears instead of waiting 30s for URL that never changes.
  await Promise.race([
    page.waitForURL(expectedUrlPattern, { timeout: 30000 }),
    page.locator('.auth-error[role="alert"]').waitFor({ state: 'visible', timeout: 30000 })
      .then(async () => {
        const msg = await page.locator('.auth-error[role="alert"]').textContent();
        throw new Error(`Login failed — backend returned: ${msg?.trim()}`);
      }),
  ]);
  if (expectedUrlPattern.includes('home')) {
    await waitForHomeReady(page);
  }
}

export async function loginDirect(
  page: Page,
  email: string,
  password: string,
  redirectPath = '/home',
): Promise<void> {
  // Mora biti page.goto() pre fetch-a da bi browser imao origin za cookie (SameSite policy).
  // Ne čekamo UI — samo uspostavljamo browser origin.
  await page.goto('/auth/login');

  // fetch() unutar page.evaluate() se izvršava u browser kontekstu →
  // browser automatski prima i čuva Set-Cookie: refreshToken (HttpOnly) iz response-a.
  // page.context().request.post() je Playwright API context — odvojen od browser cookie jar-a,
  // pa Set-Cookie ne bi bio dostupan APP_INITIALIZER-u pri sledećem page.goto().
  const result = await page.evaluate(
    async ({ apiUrl, email: e, password: p }) => {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // KRITIČNO: browser prima i čuva HttpOnly cookie
        body: JSON.stringify({ email: e, password: p }),
      });
      return { ok: res.ok, status: res.status, body: await res.text() };
    },
    { apiUrl: API_BASE_URL, email, password },
  );

  if (!result.ok) {
    throw new Error(`loginDirect failed: ${result.status} ${result.body}`);
  }

  // goto() pokreće APP_INITIALIZER → POST /auth/refresh (uspešan, cookie je u browser jar-u)
  await page.goto(redirectPath);
  if (redirectPath === '/home') {
    await waitForHomeReady(page);
  }
}

export async function logout(page: Page): Promise<void> {
  // Ne koristiti goto('/profile') — hard nav gubi access token iz memorije.
  // Kliknuti na profile link u navigaciji (SPA navigacija, token ostaje).
  // bottom-nav je uvek rendrovan (nema auth check), pa čekamo URL promenu na /profile
  // — to dokazuje da je authGuard propustio (APP_INITIALIZER završen, user autentifikovan).
  await page.click('a[href="/profile"]');
  await page.waitForURL('**/profile', { timeout: 15000 });
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
