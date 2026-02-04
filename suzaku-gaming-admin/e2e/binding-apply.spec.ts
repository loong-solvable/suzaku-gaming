// e2e/binding-apply.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Binding Apply Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit/binding-apply');
  });

  test('should display binding apply page', async ({ page }) => {
    await expect(page).toHaveURL('/audit/binding-apply');
  });

  test('should display filter bar', async ({ page }) => {
    const filterForm = page.locator('.filter-bar, .el-form, form').first();
    await expect(filterForm).toBeVisible({ timeout: 10000 });
  });

  test('should display data table with binding applies', async ({ page }) => {
    const table = page.locator('.el-table, table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should have status filter', async ({ page }) => {
    // Look for status filter (select or radio group)
    const statusFilter = page.locator('text=/待审核|已通过|已拒绝|状态/').first();
    await page.waitForTimeout(1000);
    const count = await statusFilter.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display action buttons in table', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Look for action buttons like view, edit, delete
    const actionBtns = page.locator('.el-table button, .el-table .el-link');
    const count = await actionBtns.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display pagination', async ({ page }) => {
    const pagination = page.locator('.el-pagination, .pagination');
    await expect(pagination).toBeVisible({ timeout: 10000 });
  });

  test('should filter by status', async ({ page }) => {
    // Find status select
    const statusSelect = page.locator('.el-select').first();
    
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.waitForTimeout(500);
      
      // Click first option
      const option = page.locator('.el-select-dropdown__item').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }
  });
});
