import { test, expect } from '@playwright/test';

test.describe('Debt Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
    });

    await page.goto('/login');
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', '1234567');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('Create Debt Transaction', async ({ page }) => {
    await page.click('text=Khác');
    await page.click('.modal-overlay a[href="/cong-no"]');
    await expect(page).toHaveURL(/.*cong-no/);

    await page.click('text=Thêm khoản nợ');

    // Fill debt form (Bank debt by default)
    await page.fill('input[placeholder="VD: Agribank, BIDV..."]', 'Agribank');
    await page.fill('input[placeholder="0"]', '50000000'); // 50 million
    await page.fill('input[placeholder="VD: 7.5"]', '8.5'); // 8.5% interest

    await page.click('.modal-overlay button:has-text("Thêm khoản nợ")');

    await expect(page.locator('text=Thêm khoản nợ thành công')).toBeVisible();

    // Verify it's in the list
    await expect(page.locator('h3', { hasText: 'Agribank' })).toBeVisible();
    await expect(page.locator('text=50.000.000').first()).toBeVisible();
  });
});
