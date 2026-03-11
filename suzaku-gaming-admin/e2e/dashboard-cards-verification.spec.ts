// e2e/dashboard-cards-verification.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Cards Verification', () => {
  test('should login and verify all dashboard cards', async ({ page }) => {
    // 1. 打开登录页面
    await page.goto('http://localhost:5174');
    
    // 2. 等待登录页面加载
    await page.waitForLoadState('networkidle');
    
    // 3. 输入用户名
    const usernameInput = page.locator('input[type="text"], input[placeholder*="用户名"], input[placeholder*="username"]').first();
    await usernameInput.fill('admin');
    
    // 4. 输入密码
    const passwordInput = page.locator('input[type="password"], input[placeholder*="密码"], input[placeholder*="password"]').first();
    await passwordInput.fill('admin123');
    
    // 5. 点击登录按钮
    const loginButton = page.locator('button:has-text("登录"), button[type="submit"]').first();
    await loginButton.click();
    
    // 6. 等待跳转到 Dashboard 页面
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // 7. 等待统计卡片加载
    await page.waitForTimeout(2000);
    
    // 8. 截图整个页面
    await page.screenshot({ 
      path: 'dashboard-full-page.png', 
      fullPage: true 
    });
    
    // 9. 查找所有统计卡片
    const statCards = page.locator('.stat-card');
    const cardCount = await statCards.count();
    
    console.log(`Total cards found: ${cardCount}`);
    
    // 10. 提取所有卡片的标题和数值
    const cardData = [];
    
    for (let i = 0; i < cardCount; i++) {
      const card = statCards.nth(i);
      
      // 获取卡片标题
      const titleElement = card.locator('.stat-card__title, .card-title, h3, .title').first();
      const title = await titleElement.textContent();
      
      // 获取卡片数值
      const valueElement = card.locator('.stat-card__value, .card-value, .value, .stat-value').first();
      const value = await valueElement.textContent();
      
      cardData.push({
        index: i + 1,
        title: title?.trim() || '',
        value: value?.trim() || ''
      });
      
      console.log(`Card ${i + 1}: ${title?.trim()} = ${value?.trim()}`);
    }
    
    // 11. 验证每组应该有 6 张卡片（今日、本月、历史累计各 6 张）
    expect(cardCount).toBe(18); // 3 组 × 6 卡片
    
    // 12. 查找并验证特定卡片
    
    // 验证"充值金额"卡片存在
    const rechargeCards = page.locator('.stat-card:has-text("充值金额")');
    const rechargeCount = await rechargeCards.count();
    console.log(`Found ${rechargeCount} "充值金额" cards`);
    expect(rechargeCount).toBeGreaterThanOrEqual(3); // 至少 3 个（今日、本月、历史累计）
    
    // 验证"游戏内充值金额"卡片存在
    const inGameRechargeCards = page.locator('.stat-card:has-text("游戏内充值金额")');
    const inGameRechargeCount = await inGameRechargeCards.count();
    console.log(`Found ${inGameRechargeCount} "游戏内充值金额" cards`);
    expect(inGameRechargeCount).toBeGreaterThanOrEqual(3);
    
    // 验证"三方充值金额"卡片存在
    const thirdPartyRechargeCards = page.locator('.stat-card:has-text("三方充值金额")');
    const thirdPartyRechargeCount = await thirdPartyRechargeCards.count();
    console.log(`Found ${thirdPartyRechargeCount} "三方充值金额" cards`);
    expect(thirdPartyRechargeCount).toBeGreaterThanOrEqual(3);
    
    // 13. 验证历史累计组的数值
    // 假设页面按"今日"、"本月"、"历史累计"顺序排列
    
    // 查找历史累计组（第三组，索引 12-17）
    const historicalSection = page.locator('.dashboard-section, .stat-section').nth(2);
    
    if (await historicalSection.isVisible()) {
      // 截图历史累计部分
      await historicalSection.screenshot({ path: 'dashboard-historical-section.png' });
      
      // 验证历史累计中的充值金额为 19.99
      const historicalRecharge = historicalSection.locator('.stat-card:has-text("充值金额") .stat-card__value');
      const historicalRechargeValue = await historicalRecharge.textContent();
      console.log(`Historical 充值金额: ${historicalRechargeValue}`);
      expect(historicalRechargeValue).toContain('19.99');
      
      // 验证历史累计中的游戏内充值金额为 19.99
      const historicalInGameRecharge = historicalSection.locator('.stat-card:has-text("游戏内充值金额") .stat-card__value');
      const historicalInGameRechargeValue = await historicalInGameRecharge.textContent();
      console.log(`Historical 游戏内充值金额: ${historicalInGameRechargeValue}`);
      expect(historicalInGameRechargeValue).toContain('19.99');
      
      // 验证历史累计中的三方充值金额为 0
      const historicalThirdPartyRecharge = historicalSection.locator('.stat-card:has-text("三方充值金额") .stat-card__value');
      const historicalThirdPartyRechargeValue = await historicalThirdPartyRecharge.textContent();
      console.log(`Historical 三方充值金额: ${historicalThirdPartyRechargeValue}`);
      expect(historicalThirdPartyRechargeValue).toContain('0');
    }
    
    // 14. 验证今日组的充值金额都为 0
    const todaySection = page.locator('.dashboard-section, .stat-section').first();
    if (await todaySection.isVisible()) {
      await todaySection.screenshot({ path: 'dashboard-today-section.png' });
      
      const todayRecharge = todaySection.locator('.stat-card:has-text("充值金额") .stat-card__value');
      const todayRechargeValue = await todayRecharge.textContent();
      console.log(`Today 充值金额: ${todayRechargeValue}`);
      expect(todayRechargeValue).toContain('0');
      
      const todayInGameRecharge = todaySection.locator('.stat-card:has-text("游戏内充值金额") .stat-card__value');
      const todayInGameRechargeValue = await todayInGameRecharge.textContent();
      console.log(`Today 游戏内充值金额: ${todayInGameRechargeValue}`);
      expect(todayInGameRechargeValue).toContain('0');
      
      const todayThirdPartyRecharge = todaySection.locator('.stat-card:has-text("三方充值金额") .stat-card__value');
      const todayThirdPartyRechargeValue = await todayThirdPartyRecharge.textContent();
      console.log(`Today 三方充值金额: ${todayThirdPartyRechargeValue}`);
      expect(todayThirdPartyRechargeValue).toContain('0');
    }
    
    // 15. 验证本月组的充值金额都为 0
    const monthSection = page.locator('.dashboard-section, .stat-section').nth(1);
    if (await monthSection.isVisible()) {
      await monthSection.screenshot({ path: 'dashboard-month-section.png' });
      
      const monthRecharge = monthSection.locator('.stat-card:has-text("充值金额") .stat-card__value');
      const monthRechargeValue = await monthRecharge.textContent();
      console.log(`Month 充值金额: ${monthRechargeValue}`);
      expect(monthRechargeValue).toContain('0');
      
      const monthInGameRecharge = monthSection.locator('.stat-card:has-text("游戏内充值金额") .stat-card__value');
      const monthInGameRechargeValue = await monthInGameRecharge.textContent();
      console.log(`Month 游戏内充值金额: ${monthInGameRechargeValue}`);
      expect(monthInGameRechargeValue).toContain('0');
      
      const monthThirdPartyRecharge = monthSection.locator('.stat-card:has-text("三方充值金额") .stat-card__value');
      const monthThirdPartyRechargeValue = await monthThirdPartyRecharge.textContent();
      console.log(`Month 三方充值金额: ${monthThirdPartyRechargeValue}`);
      expect(monthThirdPartyRechargeValue).toContain('0');
    }
    
    // 输出所有卡片数据供分析
    console.log('\n=== All Card Data ===');
    console.log(JSON.stringify(cardData, null, 2));
  });
});
