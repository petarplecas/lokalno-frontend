import { chromium, FullConfig } from '@playwright/test';
import { register, TEST_PASSWORD } from './fixtures/auth.fixture';

async function globalSetup(_config: FullConfig): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
  });
  const page = await context.newPage();

  await register(page, {
    firstName: 'Shared',
    lastName: 'User',
    email: `e2e-shared-${Date.now()}@playwright.test`,
    password: TEST_PASSWORD,
  });

  await context.storageState({ path: 'e2e/.auth/user.json' });
  await browser.close();
}

export default globalSetup;
