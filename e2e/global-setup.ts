import { chromium, FullConfig } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { register, TEST_PASSWORD } from './fixtures/auth.fixture';

const SHARED_USER_EMAIL = `e2e-shared-${Date.now()}@playwright.test`;

// Path where shared state is written so worker processes can read it.
// process.env mutations in global-setup are NOT visible to test workers.
export const E2E_STATE_FILE = join(__dirname, '.e2e-state.json');

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

  // Write shared credentials to a file — the only reliable way to pass
  // data from global-setup to test workers (process.env is not shared).
  writeFileSync(E2E_STATE_FILE, JSON.stringify({ sharedUserEmail: SHARED_USER_EMAIL }));
}

export default globalSetup;
