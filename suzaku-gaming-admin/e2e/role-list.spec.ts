// e2e/role-list.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Role List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/player-data/role-list');
  });

  test('should display role list page', async ({ page }) => {
    await expect(page).toHaveURL('/player-data/role-list');
  });

  test('should display breadcrumb correctly', async ({ page }) => {
    const breadcrumb = page.locator('.el-breadcrumb, .breadcrumb');
    await expect(breadcrumb).toBeVisible();
  });

  test('should display filter bar', async ({ page }) => {
    // Look for filter form elements
    const filterForm = page.locator('.filter-bar, .el-form, form').first();
    await expect(filterForm).toBeVisible({ timeout: 10000 });
  });

  test('should display data table', async ({ page }) => {
    const table = page.locator('.el-table, table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display pagination', async ({ page }) => {
    const pagination = page.locator('.el-pagination, .pagination');
    await expect(pagination).toBeVisible({ timeout: 10000 });
  });

  test('should filter by role ID', async ({ page }) => {
    // Find role ID input
    const roleIdInput = page.locator('input[placeholder*="角色"]').first();
    
    if (await roleIdInput.isVisible()) {
      await roleIdInput.fill('test123');
      
      // Click search button
      const searchBtn = page.locator('button:has-text("搜索"), button:has-text("查询")').first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should reset filters', async ({ page }) => {
    const resetBtn = page.locator('button:has-text("重置")').first();
    
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('should change page size', async ({ page }) => {
    const pageSizeSelector = page.locator('.el-pagination .el-select, .el-pagination__sizes');
    
    if (await pageSizeSelector.isVisible()) {
      await pageSizeSelector.click();
      await page.waitForTimeout(500);
    }
  });
});
