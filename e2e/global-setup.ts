import { FullConfig } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Path where shared state is written so worker processes can read it.
// process.env mutations in global-setup are NOT visible to test workers.
export const E2E_STATE_FILE = join(__dirname, '.e2e-state.json');

// Fixed seeded user — created by `npm run seed:e2e` on staging before tests run.
// Using a seeded user avoids a POST /auth/register call in global-setup,
// which previously caused "Pogrešan email ili lozinka" failures because the
// registration hit E2E_API_URL but the browser-based login hit the staging
// frontend's configured API (which may differ in non-obvious ways).
const SHARED_USER_EMAIL = 'e2e-user@lokalno.test';

async function globalSetup(_config: FullConfig): Promise<void> {
  writeFileSync(E2E_STATE_FILE, JSON.stringify({ sharedUserEmail: SHARED_USER_EMAIL }));
}

export default globalSetup;
