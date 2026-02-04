// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display sidebar with menu items', async ({ page }) => {
    const sidebar = page.locator('.sidebar, .el-aside, aside').first();
    await expect(sidebar).toBeVisible();

    // Check menu items - use more specific selectors
    await expect(page.locator('.el-menu-item:has-text("概要面板"), .sidebar-item:has-text("概要面板")').first()).toBeVisible();
  });

  test('should display header', async ({ page }) => {
    // Try multiple selectors for header
    const header = page.locator('.el-header, header, .layout-header, .main-header').first();
    await expect(header).toBeVisible();
  });

  test('should display stat cards', async ({ page }) => {
    // Wait for stat cards to load
    const statCards = page.locator('.stat-card');
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should toggle sidebar collapse', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    
    // Find and click the collapse button
    const collapseBtn = page.locator('.sidebar__collapse, .collapse-btn, [class*="collapse"]').first();
    
    if (await collapseBtn.isVisible()) {
      // Get initial width
      const initialBox = await sidebar.boundingBox();
      
      await collapseBtn.click();
      await page.waitForTimeout(500);
      
      // Get new width
      const newBox = await sidebar.boundingBox();
      
      // Width should have changed
      if (initialBox && newBox) {
        expect(newBox.width).not.toBe(initialBox.width);
      }
    }
  });
});
