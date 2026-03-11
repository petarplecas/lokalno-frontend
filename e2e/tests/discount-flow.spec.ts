import { test, expect } from '@playwright/test';
import { register, testEmail, TEST_PASSWORD } from '../fixtures/auth.fixture';

test.describe('Discount flow', () => {
  test.beforeEach(async ({ page }) => {
    await register(page, {
      firstName: 'Test',
      lastName: 'Popust',
      email: testEmail('discount'),
      password: TEST_PASSWORD,
    });
  });

  test('should display home page with discount feed or empty state', async ({ page }) => {
    await page.goto('/home');

    // Either discount cards are visible, or an empty state is shown
    const hasCards = await page.locator('article.discount-card').count();
    const hasEmptyState = await page.locator('app-empty-state').count();

    expect(hasCards + hasEmptyState).toBeGreaterThan(0);
  });

  test('should open discount detail on card click', async ({ page }) => {
    await page.goto('/home');

    const firstCard = page.locator('article.discount-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/discounts\/.+/);
    await expect(page.locator('h1.detail__title')).toBeVisible();
  });

  test('should save a discount from detail page', async ({ page }) => {
    await page.goto('/home');

    const firstCard = page.locator('article.discount-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    await firstCard.click();
    await expect(page).toHaveURL(/\/discounts\/.+/);

    const saveBtn = page.locator('button[aria-label="Sačuvaj popust"]');
    await saveBtn.waitFor({ state: 'visible' });
    await saveBtn.click();

    await expect(page.locator('button[aria-label="Ukloni iz sačuvanih"]')).toBeVisible();
  });

  test('should unsave a previously saved discount', async ({ page }) => {
    await page.goto('/home');

    const firstCard = page.locator('article.discount-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    await firstCard.click();

    // Save
    const saveBtn = page.locator('button[aria-label="Sačuvaj popust"]');
    await saveBtn.waitFor({ state: 'visible' });
    await saveBtn.click();

    // Unsave
    const unsaveBtn = page.locator('button[aria-label="Ukloni iz sačuvanih"]');
    await unsaveBtn.waitFor({ state: 'visible' });
    await unsaveBtn.click();

    await expect(page.locator('button[aria-label="Sačuvaj popust"]')).toBeVisible();
  });

  test('should filter discounts by category', async ({ page }) => {
    await page.goto('/home');

    const pills = page.locator('button.home__pill');
    const pillCount = await pills.count();

    if (pillCount > 1) {
      // Click second pill (first is "Sve kategorije")
      await pills.nth(1).click();
      await expect(pills.nth(1)).toHaveClass(/home__pill--active/);
    }
  });
});
