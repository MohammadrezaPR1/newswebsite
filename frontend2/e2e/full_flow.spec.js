import { test, expect } from '@playwright/test';

test.describe('Admin Full Flow Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Shared login for all tests
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@newswebsite.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*admin-dashboard/);
    });

    test('Refresh Persistence Test', async ({ page }) => {
        // Current on dashboard
        await page.reload();
        // Should still see dashboard (spinner might show briefly)
        await expect(page.locator('text=پنل مدیریت').first()).toBeVisible({ timeout: 15000 });
        await expect(page).toHaveURL(/.*admin-dashboard/);
    });

    test('Add News Flow', async ({ page }) => {
        // Navigate to Add News
        await page.locator('text=مدیریت اخبار').click();
        await page.locator('text=ارسال خبر جدید').click();

        await expect(page.locator('text=انتشار خبر جدید')).toBeVisible();

        // Fill form
        await page.fill('input[name="title"]', 'E2E Test News Title');
        await page.fill('textarea[name="description"]', 'E2E Test News Description Content');

        // Select Category (assuming at least one category exists)
        const categorySelect = page.locator('select[name="catId"]');
        const options = await categorySelect.locator('option').all();
        if (options.length > 1) {
            await categorySelect.selectOption({ index: 1 });
        } else {
            // Create a category first if none exist? 
            // For now assume one exists from previous steps
        }

        // Submit
        await page.click('button[type="submit"]');

        // Check for toast
        const toast = page.locator('.Toastify__toast-body');
        await expect(toast).toBeVisible({ timeout: 15000 });
        const text = await toast.innerText();
        console.log('Add News Toast:', text);

        // Should redirect to news list
        await expect(page).toHaveURL(/.*admin-view-news/);
    });

    test('Add Category Flow', async ({ page }) => {
        await page.locator('text=دسته‌بندی‌ها').click();
        await page.locator('text=تعریف دسته جدید').click();

        await page.fill('input[name="name"]', 'E2E Test Category');
        await page.click('button[type="submit"]');

        await expect(page.locator('.Toastify__toast-body')).toBeVisible();
        await expect(page).toHaveURL(/.*admin-view-categories/);
    });

});
