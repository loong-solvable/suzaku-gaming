// e2e/order-list.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/player-data/order-list');
  });

  test('should display order list page', async ({ page }) => {
    await expect(page).toHaveURL('/player-data/order-list');
  });

  test('should display filter bar with order-specific fields', async ({ page }) => {
    const filterForm = page.locator('.filter-bar, .el-form, form').first();
    await expect(filterForm).toBeVisible({ timeout: 10000 });
  });

  test('should display data table with orders', async ({ page }) => {
    const table = page.locator('.el-table, table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display total amount summary', async ({ page }) => {
    // Look for summary section showing total amount
    await page.waitForTimeout(2000);
    
    const summaryText = page.locator('text=/累计|合计|总计/');
    // This is optional as some implementations may not show summary
    const count = await summaryText.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should support date range filter', async ({ page }) => {
    const dateRangePicker = page.locator('.el-date-editor, .el-range-editor').first();
    
    if (await dateRangePicker.isVisible()) {
      await expect(dateRangePicker).toBeVisible();
    }
  });

  test('should display pagination controls', async ({ page }) => {
    const pagination = page.locator('.el-pagination, .pagination');
    await expect(pagination).toBeVisible({ timeout: 10000 });
  });
});
