import { chromium, FullConfig } from '@playwright/test';
import { register, TEST_PASSWORD } from './fixtures/auth.fixture';

const SHARED_USER_EMAIL = `e2e-shared-${Date.now()}@playwright.test`;

async function globalSetup(_config: FullConfig): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
  });
  const page = await context.newPage();

  await register(page, {
    firstName: 'Shared',
    lastName: 'User',
    email: SHARED_USER_EMAIL,
    password: TEST_PASSWORD,
  });

  await browser.close();

  // Expose credentials for discount-flow tests (no storageState —
  // incompatible with token rotation: same cookie presented by multiple
  // test contexts revokes the entire token family after the first use).
  process.env['E2E_SHARED_USER_EMAIL'] = SHARED_USER_EMAIL;
}

export default globalSetup;
