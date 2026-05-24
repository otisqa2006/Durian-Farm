import { test, expect } from '@playwright/test';

test.describe('Transactions (Income & Expense)', () => {
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

    // First create a fund so we can add income
    await page.click('nav.fixed.bottom-0 a[href="/quy"]');
    await page.click('text=Tạo Quỹ Nhánh');
    await page.fill('input[placeholder="VD: Quỹ Phân Bón"]', 'Quỹ Tổng');
    await page.fill('input[placeholder="VD: Anh Ba"]', 'Admin');
    await page.click('.modal-overlay button:has-text("Tạo quỹ")');
    await expect(page.locator('text=Đã tạo quỹ mới thành công')).toBeVisible();
  });

  test('Add Income Transaction', async ({ page }) => {
    await page.click('nav.fixed.bottom-0 a[href="/thu"]');
    await expect(page).toHaveURL(/.*thu/);

    await page.click('text=Thêm Khoản thu');

    // Fill income details
    await page.selectOption('select', { value: 'Thái Dona' });
    await page.fill('input[placeholder="Ví dụ: 150"]', '100'); // kg
    
    // Playwright locator to target the price input specifically
    await page.fill('input[placeholder="Ví dụ: 65.000"]', '85000'); // price

    await page.selectOption('select >> nth=1', { label: 'Mẫu A' });
    await page.fill('input[placeholder="Ghi chú ngắn..."]', 'Bán lứa đầu');

    await page.click('.modal-overlay button:has-text("Thêm khoản thu")');

    await expect(page.locator('text=Đã thêm khoản thu')).toBeVisible();

    // Verify it's in the list
    await expect(page.locator('text=Sầu riêng Thái Dona').first()).toBeVisible();
    await expect(page.locator('td', { hasText: '8.500.000' }).first()).toBeVisible();
  });
});
