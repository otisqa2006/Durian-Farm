import { test, expect } from '@playwright/test';

test.describe('Authentication & RBAC', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before tests to ensure a clean state
    await page.goto('/');
    await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
    });
    await page.reload();
  });

  test('User Registration and Login Flow', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Go to register
    await page.click('text=Đăng ký ngay');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[name="id"]', 'testuser');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to login and show success toast
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Đăng ký thành công')).toBeVisible();

    // Login with new user
    await page.fill('input[id="username"]', 'testuser');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should be redirected to home page
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('h1').first()).toContainText('Tổng quan');
  });

  test('Admin Permission Access', async ({ page }) => {
    // First we register an admin directly (we can just register any user and then they won't have admin by default)
    // Wait, by default the system creates admin with 1234567 if it's the first time and we use login.
    await page.goto('/login');
    
    // The system creates admin/1234567 when the DB initializes in `lib/db.ts`
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', '1234567');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:3000/');

    // On mobile, 'Quản lý User' is under the 'Khác' menu
    await page.click('text=Khác');
    await page.click('.modal-overlay a[href="/quan-ly-user"]');
    await expect(page).toHaveURL(/.*quan-ly-user/);

    await expect(page.locator('text=Quản lý Phân Quyền')).toBeVisible();
  });
});
