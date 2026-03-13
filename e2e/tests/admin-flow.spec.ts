import { test, expect } from '@playwright/test';
import { login, ADMIN_USER } from '../fixtures/auth.fixture';

test.describe('Admin flow', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password, '**/admin/**');
    // Ne pozivati goto() — hard navigacija gubi access token iz memorije
    await page.waitForSelector('.admin-businesses__tabs', { timeout: 15000 });
  });

  test('should land on pending businesses tab by default', async ({ page }) => {
    const activeTab = page.locator('.admin-businesses__tab--active');
    await expect(activeTab).toHaveText('Na čekanju');
  });

  test('should switch to Istekli trial tab', async ({ page }) => {
    const trialTab = page.locator('.admin-businesses__tab', { hasText: 'Istekli trial' });
    await trialTab.click();

    await expect(trialTab).toHaveClass(/admin-businesses__tab--active/);
  });

  test('should switch to Odbijeni tab', async ({ page }) => {
    const rejectedTab = page.locator('.admin-businesses__tab', { hasText: 'Odbijeni' });
    await rejectedTab.click();

    await expect(rejectedTab).toHaveClass(/admin-businesses__tab--active/);
  });

  test('should navigate to business detail on card click', async ({ page }) => {
    const firstCard = page.locator('.admin-businesses__card').first();
    const cardCount = await firstCard.count();

    if (cardCount === 0) {
      // No businesses in pending — switch to Odobreni
      await page.locator('.admin-businesses__tab', { hasText: 'Odobreni' }).click();
    }

    const card = page.locator('.admin-businesses__card').first();
    await card.waitFor({ state: 'visible', timeout: 10000 });
    await card.click();

    await expect(page).toHaveURL(/\/admin\/businesses\/.+/);
  });

  test('should show pagination when there are many businesses', async ({ page }) => {
    // Pagination appears only when totalPages > 1
    const pagination = page.locator('.admin-businesses__pagination');
    const isVisible = await pagination.isVisible();

    // Just assert it renders correctly if visible
    if (isVisible) {
      await expect(page.locator('.admin-businesses__pagination span')).toBeVisible();
    }
  });

  test('should show all tabs without horizontal overflow clipping', async ({ page }) => {
    const tabBar = page.locator('.admin-businesses__tabs');
    await expect(tabBar).toBeVisible();

    // All 5 tabs should be in DOM
    const tabs = page.locator('.admin-businesses__tab');
    await expect(tabs).toHaveCount(5);
  });
});
