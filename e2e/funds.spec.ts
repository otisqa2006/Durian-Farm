import { test, expect } from '@playwright/test';

test.describe('Funds Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
    });
    // Need to login as admin to manage funds
    await page.goto('/login');
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', '1234567');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('Create Master Fund and Sub Fund', async ({ page }) => {
    // Go to Funds page on mobile bottom nav
    await page.click('nav.fixed.bottom-0 a[href="/quy"]');
    await expect(page).toHaveURL(/.*quy/);

    // Click add fund
    await page.click('text=Tạo Quỹ Nhánh');

    // Fill form
    await page.fill('input[placeholder="VD: Quỹ Phân Bón"]', 'Quỹ Tổng');
    await page.fill('input[placeholder="VD: Anh Ba"]', 'Admin');
    await page.click('.modal-overlay button:has-text("Tạo quỹ")');

    // Toast
    await expect(page.locator('text=Đã tạo quỹ mới thành công')).toBeVisible();

    // Verify fund exists in the list
    await expect(page.locator('h3', { hasText: 'Quỹ Tổng' })).toBeVisible();

    // The first fund created should be master fund. Now create a sub-fund.
    await page.click('text=Tạo Quỹ Nhánh');
    await page.fill('input[placeholder="VD: Quỹ Phân Bón"]', 'Quỹ Chi Nhánh 1');
    await page.fill('input[placeholder="VD: Anh Ba"]', 'Nhân Viên 1');
    await page.click('.modal-overlay button:has-text("Tạo quỹ")');

    await expect(page.locator('text=Đã tạo quỹ mới thành công').first()).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Quỹ Chi Nhánh 1' })).toBeVisible();
    
    // Total funds count should be 2
    // We can check if "2 quỹ" is visible in the stats
    await expect(page.locator('text=2 Quỹ')).toBeVisible();
  });
});
