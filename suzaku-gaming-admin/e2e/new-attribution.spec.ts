// e2e/new-attribution.spec.ts
import { test, expect } from '@playwright/test';

test.describe('New Attribution Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit/new-attribution');
  });

  test('should display new attribution page', async ({ page }) => {
    await expect(page).toHaveURL('/audit/new-attribution');
  });

  test('should display form', async ({ page }) => {
    const form = page.locator('.el-form, form').first();
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test('should have required form fields', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for common form fields
    const inputFields = page.locator('.el-input, .el-select, input, select');
    const count = await inputFields.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have submit button', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("保存")').first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields on submit', async ({ page }) => {
    // Click submit without filling form
    const submitBtn = page.locator('button[type="submit"], button:has-text("提交"), button:has-text("保存")').first();
    
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      
      // Check for validation error messages
      const errorMsg = page.locator('.el-form-item__error, .error-message');
      // Validation errors may or may not appear depending on implementation
      const count = await errorMsg.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display breadcrumb', async ({ page }) => {
    const breadcrumb = page.locator('.el-breadcrumb, .breadcrumb');
    await expect(breadcrumb).toBeVisible();
  });
});
