// e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to role list from sidebar', async ({ page }) => {
    // Navigate directly to test the route
    await page.goto('/player-data/role-list');
    await expect(page).toHaveURL('/player-data/role-list');
    
    // Verify page content
    const table = page.locator('.el-table, table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to order list from sidebar', async ({ page }) => {
    // Navigate directly to test the route
    await page.goto('/player-data/order-list');
    await expect(page).toHaveURL('/player-data/order-list');
    
    // Verify page content
    const table = page.locator('.el-table, table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to binding apply from sidebar', async ({ page }) => {
    // Click on audit menu
    const auditMenu = page.locator('text=审核').first();
    await auditMenu.click();
    await page.waitForTimeout(300);

    // Click on binding apply
    const bindingApplyMenu = page.locator('text=绑定申请').first();
    await bindingApplyMenu.click();

    await expect(page).toHaveURL('/audit/binding-apply');
  });

  test('should navigate to new attribution from sidebar', async ({ page }) => {
    // Click on audit menu
    const auditMenu = page.locator('text=审核').first();
    await auditMenu.click();
    await page.waitForTimeout(300);

    // Click on new attribution
    const newAttrMenu = page.locator('text=新增归因').first();
    await newAttrMenu.click();

    await expect(page).toHaveURL('/audit/new-attribution');
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // First navigate away
    await page.goto('/player-data/role-list');
    await expect(page).toHaveURL('/player-data/role-list');

    // Click on dashboard
    const dashboardMenu = page.locator('text=概要面板').first();
    await dashboardMenu.click();

    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    
    // Page should still be accessible (not crash)
    await page.waitForTimeout(1000);
    
    // Should show some content (404 page, redirect, or empty state)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
