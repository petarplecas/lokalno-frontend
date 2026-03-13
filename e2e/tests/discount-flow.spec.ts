import { test, expect } from '@playwright/test';

test.describe('Discount flow', () => {
  test.beforeEach(async ({ page }) => {
    // storageState (set in playwright.config.ts) loads the shared user's HttpOnly cookie.
    // APP_INITIALIZER silently refreshes the access token on navigation — no register() needed.
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
  });

  test('should display home page with discount feed or empty state', async ({ page }) => {
    const hasCards = await page.locator('article.discount-card').count();
    const hasEmptyState = await page.locator('app-empty-state').count();

    expect(hasCards + hasEmptyState).toBeGreaterThan(0);
  });

  test('should open discount detail on card click', async ({ page }) => {
    const firstCard = page.locator('article.discount-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/discounts\/.+/, { timeout: 10000 });
    await expect(page.locator('h1.detail__hero-title')).toBeVisible();
  });

  test('should save a discount from detail page', async ({ page }) => {
    const firstCard = page.locator('article.discount-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    await firstCard.click();
    await expect(page).toHaveURL(/\/discounts\/.+/, { timeout: 10000 });

    const saveBtn = page.locator('button[aria-label="Sačuvaj popust"]').first();
    const unsaveBtn = page.locator('button[aria-label="Ukloni iz sačuvanih"]').first();

    // Wait for save state to load from server (either button must appear)
    await page.waitForSelector(
      'button[aria-label="Sačuvaj popust"], button[aria-label="Ukloni iz sačuvanih"]',
      { timeout: 10000 },
    );

    // Normalize: if shared user already saved this, unsave first so we can test the save action
    if (await unsaveBtn.isVisible()) {
      await unsaveBtn.click();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    }

    await saveBtn.click();
    await expect(unsaveBtn).toBeVisible({ timeout: 10000 });
  });

  test('should unsave a previously saved discount', async ({ page }) => {
    const firstCard = page.locator('article.discount-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    await firstCard.click();
    await expect(page).toHaveURL(/\/discounts\/.+/, { timeout: 10000 });

    const saveBtn = page.locator('button[aria-label="Sačuvaj popust"]').first();
    const unsaveBtn = page.locator('button[aria-label="Ukloni iz sačuvanih"]').first();

    // Wait for save state to load from server
    await page.waitForSelector(
      'button[aria-label="Sačuvaj popust"], button[aria-label="Ukloni iz sačuvanih"]',
      { timeout: 10000 },
    );

    // Normalize: ensure we start from unsaved state regardless of DB state
    if (await unsaveBtn.isVisible()) {
      await unsaveBtn.click();
      await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    }

    // Save, then unsave
    await saveBtn.click();
    await unsaveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await unsaveBtn.click();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
  });

  test('should filter discounts by category', async ({ page }) => {
    const pills = page.locator('button.home__pill');
    const pillCount = await pills.count();

    if (pillCount > 1) {
      // Click second pill (first is "Sve kategorije")
      await pills.nth(1).click();
      await expect(pills.nth(1)).toHaveClass(/home__pill--active/);
    }
  });
});
