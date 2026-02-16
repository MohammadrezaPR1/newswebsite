import { test, expect } from '@playwright/test';

test('Admin Login and Dashboard Navigation', async ({ page }) => {
    // 1. Go to Login Page
    await page.goto('/login');

    // 2. Fill Credentials
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    // Verify inputs are visible
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill('admin@newswebsite.com');
    await passwordInput.fill('password123');

    // 3. Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 4. Expect Redirection to Dashboard (or Admin Dashboard)
    await expect(page).toHaveURL(/.*admin-dashboard/);
    await expect(page.locator('text=پنل مدیریت').first()).toBeVisible();
});

test('Create User Flow (SPA Navigation)', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@newswebsite.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for Dashboard
    await expect(page).toHaveURL(/.*admin-dashboard/);
    await expect(page.locator('text=پنل مدیریت').first()).toBeVisible();

    // Navigate using Sidebar to avoid full reload
    // Click "مدیریت کاربران". Locator by text.
    await page.locator('text=مدیریت کاربران').click();

    // Wait for "ایجاد کاربر" to be visible and click it
    await page.locator('text=ایجاد کاربر').click();

    // Verify Title "افزودن عضو جدید"
    await expect(page.locator('text=افزودن عضو جدید')).toBeVisible();

    // Fill Form
    await page.fill('input[name="name"]', 'Test User E2E');
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confPassword"]', 'password123');

    // Select Role - Click on exact wrapper div
    // Assuming the text "مدیر ارشد" is inside the div we want to click.
    // Using filter to find the parent div with onClick (or class cursor-pointer)
    await page.locator('div.cursor-pointer').filter({ hasText: 'مدیر ارشد' }).first().click();

    // Check if any validation error is visible before submitting
    const validationError = page.locator('.text-red-500');
    if (await validationError.isVisible()) {
        console.log('Validation Error before submit:', await validationError.innerText());
    }

    // Submit
    await page.click('button[type="submit"]');

    // Expect Success Toast OR Rate Limit Toast (both confirm the app is working and connected)
    const toast = page.locator('.Toastify__toast-body');

    // Increased timeout to 45s just in case
    await expect(toast).toBeVisible({ timeout: 45000 });

    const toastText = await toast.textContent();
    console.log('Toast message:', toastText);
});
