import { request, FullConfig } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { TEST_PASSWORD } from './fixtures/auth.fixture';

const SHARED_USER_EMAIL = `e2e-shared-${Date.now()}@playwright.test`;

// Path where shared state is written so worker processes can read it.
// process.env mutations in global-setup are NOT visible to test workers.
export const E2E_STATE_FILE = join(__dirname, '.e2e-state.json');

async function globalSetup(_config: FullConfig): Promise<void> {
  const apiUrl = process.env['E2E_API_URL'] ?? 'http://localhost:3000';

  // Use API directly — no browser needed for setup.
  // Avoids: 30s UI timeout on form submission failure, wasted throttle slot from
  // APP_INITIALIZER firing POST /auth/refresh when browser loads /auth/register.
  const ctx = await request.newContext({ baseURL: apiUrl });

  const res = await ctx.post('/auth/register', {
    data: {
      firstName: 'Shared',
      lastName: 'User',
      email: SHARED_USER_EMAIL,
      password: TEST_PASSWORD,
    },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `global-setup: shared user registration failed ${res.status()} — ${body}`,
    );
  }

  await ctx.dispose();

  // Write shared credentials to a file — the only reliable way to pass
  // data from global-setup to test workers (process.env is not shared).
  writeFileSync(E2E_STATE_FILE, JSON.stringify({ sharedUserEmail: SHARED_USER_EMAIL }));
}

export default globalSetup;
