# Test Plan and Cases - 测试计划与用例清单

> **文档性质**：测试计划 / 测试用例规格书  
> **生成日期**：2026-02-03  
> **关联文档**：`Traceability_Matrix.md`、`Suzaku_Gaming_Ultimate_Implementation_Plan.md`  
> **测试框架**：Vitest（单元测试）、Playwright（E2E测试）、pixelmatch（视觉回归）

---

## 一、测试策略概述

### 1.1 测试金字塔

```
                    ┌─────────────┐
                    │  视觉回归    │  ← 5个关键页面截图对比
                    │  测试       │
                   ┌┴─────────────┴┐
                   │    E2E测试     │  ← 5个页面主路径+异常路径
                  ┌┴───────────────┴┐
                  │     集成测试      │  ← 组件交互、数据流
                 ┌┴─────────────────┴┐
                 │       单元测试       │  ← 公共组件、Hooks、工具函数
                 └───────────────────┘
```

### 1.2 测试覆盖率要求

| 测试类型 | 覆盖率要求 | 测量工具 | 门禁标准 |
|----------|-----------|----------|----------|
| 单元测试 | ≥80% | Vitest Coverage | 构建失败 |
| E2E测试 | 100%页面覆盖 | Playwright | 构建失败 |
| 视觉回归 | 100%关键页面 | pixelmatch | 人工审核 |

### 1.3 测试环境

| 环境 | 配置 |
|------|------|
| 操作系统 | Windows 10 / macOS 12+ |
| 浏览器 | Chrome 120+ (Chromium) |
| Node版本 | 20.11.1 |
| 分辨率 | 1920×1080 |
| 缩放比例 | 100% |

---

## 二、单元测试计划

### 2.1 测试框架配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/components/**/*.vue', 'src/composables/**/*.ts', 'src/utils/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.spec.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
```

### 2.2 StatCard 组件测试用例

| 用例ID | 测试点 | 输入 | 预期输出 | 覆盖率目标 |
|--------|--------|------|----------|-----------|
| UT-SC-01 | 渲染标题 | title="今日新增" | 显示"今日新增" | 语句 |
| UT-SC-02 | 渲染数值 | value=286 | 显示"286" | 语句 |
| UT-SC-03 | 渲染单位 | unit="人" | 显示"人" | 语句 |
| UT-SC-04 | 渲染日期 | dateRange="2026-02-02 周一" | 显示日期 | 语句 |
| UT-SC-05 | 数值千分位格式化 | value=150350.98 | 显示"150,350.98" | 分支 |
| UT-SC-06 | USD数值格式化 | value=1050.35, unit="USD" | 显示"1,050.35" | 分支 |
| UT-SC-07 | 零值显示 | value=0 | 显示"0" | 边界 |
| UT-SC-08 | Props类型校验 | value="abc" | TypeScript报错 | 类型 |

```typescript
// src/components/StatCard/__tests__/StatCard.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatCard from '../index.vue';

describe('StatCard', () => {
  it('UT-SC-01: 应正确渲染标题', () => {
    const wrapper = mount(StatCard, {
      props: { title: '今日新增', value: 286, unit: '人', dateRange: '2026-02-02' }
    });
    expect(wrapper.find('.stat-card__title').text()).toBe('今日新增');
  });

  it('UT-SC-05: 应正确格式化千分位', () => {
    const wrapper = mount(StatCard, {
      props: { title: '历史金额', value: 150350.98, unit: 'USD', dateRange: '' }
    });
    expect(wrapper.find('.stat-card__value').text()).toBe('150,350.98');
  });

  it('UT-SC-07: 应正确显示零值', () => {
    const wrapper = mount(StatCard, {
      props: { title: '测试', value: 0, unit: '人', dateRange: '' }
    });
    expect(wrapper.find('.stat-card__value').text()).toBe('0');
  });
});
```

### 2.3 FilterBar 组件测试用例

| 用例ID | 测试点 | 输入 | 预期输出 | 覆盖率目标 |
|--------|--------|------|----------|-----------|
| UT-FB-01 | 渲染所有字段 | fields=[10项] | 渲染10个表单项 | 语句 |
| UT-FB-02 | Input类型渲染 | type="input" | 渲染el-input | 分支 |
| UT-FB-03 | Select类型渲染 | type="select" | 渲染el-select | 分支 |
| UT-FB-04 | DateRange类型渲染 | type="daterange" | 渲染el-date-picker | 分支 |
| UT-FB-05 | 搜索按钮触发 | 点击查询 | emit('search') | 函数 |
| UT-FB-06 | 重置按钮触发 | 点击清空 | emit('reset') | 函数 |
| UT-FB-07 | 导出按钮触发 | 点击导出 | emit('export') | 函数 |
| UT-FB-08 | 导出按钮显示控制 | showExport=false | 不显示导出按钮 | 分支 |
| UT-FB-09 | v-model双向绑定 | 修改输入值 | emit('update:modelValue') | 函数 |
| UT-FB-10 | 占位符显示 | placeholder="请输入" | 显示占位符 | 语句 |

```typescript
// src/components/FilterBar/__tests__/FilterBar.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FilterBar from '../index.vue';
import ElementPlus from 'element-plus';

const mockFields = [
  { key: 'project', label: '游戏项目', type: 'select', options: [] },
  { key: 'roleId', label: '角色ID', type: 'input' },
  { key: 'registerTime', label: '注册时间', type: 'daterange' }
];

describe('FilterBar', () => {
  it('UT-FB-01: 应渲染所有字段', () => {
    const wrapper = mount(FilterBar, {
      props: { fields: mockFields, modelValue: {} },
      global: { plugins: [ElementPlus] }
    });
    expect(wrapper.findAll('.el-form-item').length).toBeGreaterThanOrEqual(3);
  });

  it('UT-FB-05: 点击查询应触发search事件', async () => {
    const wrapper = mount(FilterBar, {
      props: { fields: mockFields, modelValue: {} },
      global: { plugins: [ElementPlus] }
    });
    await wrapper.find('.btn-search').trigger('click');
    expect(wrapper.emitted('search')).toBeTruthy();
  });
});
```

### 2.4 DataTable 组件测试用例

| 用例ID | 测试点 | 输入 | 预期输出 | 覆盖率目标 |
|--------|--------|------|----------|-----------|
| UT-DT-01 | 列渲染 | columns=[14项] | 渲染14列 | 语句 |
| UT-DT-02 | 数据渲染 | data=[10条] | 渲染10行 | 语句 |
| UT-DT-03 | 排序功能 | sortable=true | 显示排序图标 | 分支 |
| UT-DT-04 | 排序事件触发 | 点击排序 | emit('sort-change') | 函数 |
| UT-DT-05 | 分页渲染 | pagination={...} | 显示分页组件 | 分支 |
| UT-DT-06 | 页码变化 | 点击下一页 | emit('page-change') | 函数 |
| UT-DT-07 | 每页条数变化 | 切换pageSize | emit('size-change') | 函数 |
| UT-DT-08 | 空状态显示 | data=[] | 显示"暂无数据" | 分支 |
| UT-DT-09 | 加载状态显示 | loading=true | 显示loading遮罩 | 分支 |
| UT-DT-10 | 固定列渲染 | fixed="right" | 操作列右固定 | 分支 |
| UT-DT-11 | 斑马纹显示 | stripe=true | 偶数行背景色 | 分支 |
| UT-DT-12 | 格式化函数 | formatter=(row)=>... | 正确格式化 | 函数 |

### 2.5 ImageUpload 组件测试用例

| 用例ID | 测试点 | 输入 | 预期输出 | 覆盖率目标 |
|--------|--------|------|----------|-----------|
| UT-IU-01 | 格式校验-通过 | file.type="image/png" | 允许上传 | 分支 |
| UT-IU-02 | 格式校验-拒绝 | file.type="image/gif" | 阻止上传+错误提示 | 分支 |
| UT-IU-03 | 大小校验-通过 | file.size=400KB | 允许上传 | 分支 |
| UT-IU-04 | 大小校验-拒绝 | file.size=600KB | 阻止上传+错误提示 | 分支 |
| UT-IU-05 | 数量校验-通过 | fileList.length=9 | 允许上传 | 分支 |
| UT-IU-06 | 数量校验-拒绝 | fileList.length=10 | 阻止上传+错误提示 | 分支 |
| UT-IU-07 | 预览显示 | 上传成功 | 显示缩略图 | 语句 |
| UT-IU-08 | 删除功能 | 点击删除 | 从列表移除 | 函数 |
| UT-IU-09 | 拖拽区域渲染 | drag=true | 显示拖拽区域 | 分支 |
| UT-IU-10 | 成功状态显示 | status="success" | 显示绿色对勾 | 分支 |
| UT-IU-11 | 失败状态显示 | status="error" | 显示红色叉号 | 分支 |
| UT-IU-12 | 上传进度显示 | uploading=true | 显示进度条 | 分支 |

### 2.6 Hooks 测试用例

#### useTable Hook

| 用例ID | 测试点 | 输入 | 预期输出 | 覆盖率目标 |
|--------|--------|------|----------|-----------|
| UT-HT-01 | 初始化状态 | - | loading=false, data=[] | 语句 |
| UT-HT-02 | fetchData调用 | fetchApi | 数据加载+loading变化 | 函数 |
| UT-HT-03 | 分页变化 | page=2 | 触发fetchData | 函数 |
| UT-HT-04 | pageSize变化 | pageSize=50 | page重置为1 | 分支 |
| UT-HT-05 | 排序变化 | sort={prop,order} | 触发fetchData | 函数 |
| UT-HT-06 | reset调用 | - | 重置所有状态 | 函数 |
| UT-HT-07 | 请求取消 | 连续调用fetchData | 取消前一次请求 | 边界 |
| UT-HT-08 | 错误处理 | fetchApi抛错 | 捕获错误+loading=false | 边界 |

#### useFilter Hook

| 用例ID | 测试点 | 输入 | 预期输出 | 覆盖率目标 |
|--------|--------|------|----------|-----------|
| UT-HF-01 | 初始化 | defaultValues | filterValues=defaultValues | 语句 |
| UT-HF-02 | handleSearch | - | 调用onSearch回调 | 函数 |
| UT-HF-03 | handleReset | - | 重置为defaultValues | 函数 |
| UT-HF-04 | getFilterValues | - | 返回当前筛选值副本 | 函数 |

#### useSubmitLock Hook

| 用例ID | 测试点 | 输入 | 预期输出 | 覆盖率目标 |
|--------|--------|------|----------|-----------|
| UT-HS-01 | 初始状态 | - | isSubmitting=false | 语句 |
| UT-HS-02 | withLock执行 | async fn | 执行fn+状态变化 | 函数 |
| UT-HS-03 | 重复调用阻止 | isSubmitting=true时调用 | 返回null | 分支 |
| UT-HS-04 | 异常恢复 | fn抛错 | isSubmitting=false | 边界 |

---

## 三、E2E测试计划

### 3.1 测试框架配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

### 3.2 Dashboard 页面E2E测试

| 用例ID | 用例名称 | 类型 | 测试步骤 | 预期结果 |
|--------|----------|------|----------|----------|
| E2E-D-01 | 页面加载验证 | 主路径 | 1. 访问/dashboard | 12个KPI卡片正确显示 |
| E2E-D-02 | 数据显示验证 | 主路径 | 1. 检查卡片数值 | 显示Mock数据值 |
| E2E-D-03 | 布局验证 | 主路径 | 1. 检查Grid布局 | 4列×3行布局正确 |
| E2E-D-04 | 接口失败处理 | 异常路径 | 1. Mock接口返回500 | 显示错误提示 |
| E2E-D-05 | 加载状态显示 | 异常路径 | 1. Mock接口延迟2秒 | 显示loading状态 |

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard页面', () => {
  test('E2E-D-01: 页面加载应显示12个KPI卡片', async ({ page }) => {
    await page.goto('/dashboard');
    const cards = page.locator('.stat-card');
    await expect(cards).toHaveCount(12);
  });

  test('E2E-D-02: 卡片数据应正确显示', async ({ page }) => {
    await page.goto('/dashboard');
    // 今日新增
    await expect(page.locator('.stat-card').first().locator('.stat-card__value')).toContainText('286');
  });

  test('E2E-D-04: 接口失败应显示错误提示', async ({ page }) => {
    await page.route('**/api/dashboard/**', route => route.fulfill({ status: 500 }));
    await page.goto('/dashboard');
    await expect(page.locator('.el-message--error')).toBeVisible();
  });
});
```

### 3.3 角色列表页面E2E测试

| 用例ID | 用例名称 | 类型 | 测试步骤 | 预期结果 |
|--------|----------|------|----------|----------|
| E2E-R-01 | 页面加载 | 主路径 | 1. 访问/player-data/role-list | 筛选表单+表格正确显示 |
| E2E-R-02 | 筛选查询 | 主路径 | 1. 输入角色ID<br>2. 点击查询 | 表格显示筛选结果 |
| E2E-R-03 | 清空筛选 | 主路径 | 1. 输入筛选条件<br>2. 点击清空 | 所有条件重置为空 |
| E2E-R-04 | 分页切换 | 主路径 | 1. 点击第2页 | 表格显示第2页数据 |
| E2E-R-05 | 排序功能 | 主路径 | 1. 点击注册时间列排序 | 数据按时间排序 |
| E2E-R-06 | 导出功能 | 主路径 | 1. 点击导出按钮 | 下载CSV文件 |
| E2E-R-07 | 空数据显示 | 异常路径 | 1. 筛选无结果条件 | 显示"暂无数据" |
| E2E-R-08 | 查询失败处理 | 异常路径 | 1. Mock接口返回错误 | 显示错误提示 |

```typescript
// e2e/role-list.spec.ts
import { test, expect } from '@playwright/test';

test.describe('角色列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/player-data/role-list');
  });

  test('E2E-R-02: 筛选查询应更新表格数据', async ({ page }) => {
    await page.fill('input[placeholder*="角色ID"]', '16020013010603');
    await page.click('button:has-text("查询")');
    await expect(page.locator('.el-table__row')).toHaveCount(1);
  });

  test('E2E-R-03: 清空按钮应重置所有筛选条件', async ({ page }) => {
    await page.fill('input[placeholder*="角色ID"]', '123456');
    await page.click('button:has-text("清空")');
    await expect(page.locator('input[placeholder*="角色ID"]')).toHaveValue('');
  });

  test('E2E-R-05: 点击排序列应触发排序', async ({ page }) => {
    await page.click('th:has-text("注册时间") .caret-wrapper');
    // 验证排序图标激活
    await expect(page.locator('th:has-text("注册时间") .ascending')).toBeVisible();
  });

  test('E2E-R-07: 无数据应显示空状态', async ({ page }) => {
    await page.route('**/api/player/roles**', route => 
      route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ code: 0, data: { list: [], total: 0 } }) 
      })
    );
    await page.reload();
    await expect(page.locator('.el-empty__description')).toContainText('暂无数据');
  });
});
```

### 3.4 订单列表页面E2E测试

| 用例ID | 用例名称 | 类型 | 测试步骤 | 预期结果 |
|--------|----------|------|----------|----------|
| E2E-O-01 | 页面加载 | 主路径 | 1. 访问/player-data/order-list | 页面正确显示 |
| E2E-O-02 | 累计金额显示 | 主路径 | 1. 检查累计金额 | 红色加粗显示金额 |
| E2E-O-03 | 日期范围筛选 | 主路径 | 1. 选择日期范围<br>2. 点击查询 | 数据按日期过滤 |
| E2E-O-04 | 订单类型筛选 | 主路径 | 1. 选择订单类型<br>2. 点击查询 | 数据按类型过滤 |
| E2E-O-05 | 导出功能 | 主路径 | 1. 点击导出 | 下载CSV文件 |
| E2E-O-06 | 导出失败处理 | 异常路径 | 1. Mock导出失败 | 显示错误提示 |

```typescript
// e2e/order-list.spec.ts
import { test, expect } from '@playwright/test';

test.describe('订单列表页面', () => {
  test('E2E-O-02: 累计金额应以红色加粗显示', async ({ page }) => {
    await page.goto('/player-data/order-list');
    const totalAmount = page.locator('.total-amount');
    await expect(totalAmount).toHaveCSS('color', 'rgb(245, 108, 108)'); // #F56C6C
    await expect(totalAmount).toHaveCSS('font-weight', '700');
  });
});
```

### 3.5 绑定申请页面E2E测试

| 用例ID | 用例名称 | 类型 | 测试步骤 | 预期结果 |
|--------|----------|------|----------|----------|
| E2E-B-01 | 页面加载 | 主路径 | 1. 访问/audit/binding-apply | 页面正确显示 |
| E2E-B-02 | 状态标签显示 | 主路径 | 1. 检查状态列 | 不同状态显示不同颜色标签 |
| E2E-B-03 | 查看详情 | 主路径 | 1. 点击查看按钮 | 弹出详情弹窗 |
| E2E-B-04 | 编辑记录 | 主路径 | 1. 点击编辑按钮 | 弹出编辑弹窗 |
| E2E-B-05 | 删除记录 | 主路径 | 1. 点击删除按钮<br>2. 确认删除 | 记录从列表移除 |
| E2E-B-06 | 删除取消 | 主路径 | 1. 点击删除按钮<br>2. 取消删除 | 记录保留 |
| E2E-B-07 | 归因修改入口 | 主路径 | 1. 点击"归因修改申请" | 跳转到表单页 |
| E2E-B-08 | 删除失败处理 | 异常路径 | 1. Mock删除失败 | 显示错误提示 |

```typescript
// e2e/binding-apply.spec.ts
import { test, expect } from '@playwright/test';

test.describe('绑定申请页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit/binding-apply');
  });

  test('E2E-B-02: 状态标签应显示正确颜色', async ({ page }) => {
    // 未审核 - info蓝色
    const pendingTag = page.locator('.el-tag--info').first();
    await expect(pendingTag).toBeVisible();
    
    // 审核通过 - success绿色
    const approvedTag = page.locator('.el-tag--success').first();
    await expect(approvedTag).toBeVisible();
  });

  test('E2E-B-03: 点击查看应弹出详情弹窗', async ({ page }) => {
    await page.click('button:has-text("查看")');
    await expect(page.locator('.el-dialog')).toBeVisible();
  });

  test('E2E-B-05: 删除确认后应移除记录', async ({ page }) => {
    const rowCount = await page.locator('.el-table__row').count();
    await page.click('button:has-text("删除")');
    await page.click('.el-message-box__btns button:has-text("确定")');
    await expect(page.locator('.el-table__row')).toHaveCount(rowCount - 1);
  });

  test('E2E-B-07: 点击归因修改申请应跳转表单页', async ({ page }) => {
    await page.click('button:has-text("归因修改申请")');
    await expect(page).toHaveURL(/.*new-attribution/);
  });
});
```

### 3.6 新增归因更改页面E2E测试

| 用例ID | 用例名称 | 类型 | 测试步骤 | 预期结果 |
|--------|----------|------|----------|----------|
| E2E-N-01 | 页面加载 | 主路径 | 1. 访问/audit/new-attribution | 表单正确显示 |
| E2E-N-02 | 必填校验 | 主路径 | 1. 直接点击提交 | 显示必填项错误提示 |
| E2E-N-03 | 表单填写 | 主路径 | 1. 填写所有必填项<br>2. 点击提交 | 提交成功提示 |
| E2E-N-04 | 文件上传成功 | 主路径 | 1. 上传jpg图片 | 显示缩略图+绿色勾 |
| E2E-N-05 | 文件格式校验 | 异常路径 | 1. 上传gif图片 | 显示格式错误提示 |
| E2E-N-06 | 文件大小校验 | 异常路径 | 1. 上传600KB图片 | 显示大小错误提示 |
| E2E-N-07 | 文件数量校验 | 异常路径 | 1. 上传第11个文件 | 显示数量超限提示 |
| E2E-N-08 | 文件删除 | 主路径 | 1. 上传文件<br>2. 点击删除 | 文件从列表移除 |
| E2E-N-09 | 取消返回 | 主路径 | 1. 点击取消 | 返回绑定申请页 |
| E2E-N-10 | 提交失败处理 | 异常路径 | 1. Mock提交失败 | 显示错误提示 |

```typescript
// e2e/new-attribution.spec.ts
import { test, expect } from '@playwright/test';

test.describe('新增归因更改页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit/new-attribution');
  });

  test('E2E-N-02: 必填校验应显示错误提示', async ({ page }) => {
    await page.click('button:has-text("提交")');
    await expect(page.locator('.el-form-item__error')).toHaveCount(6);
  });

  test('E2E-N-03: 填写完整表单应提交成功', async ({ page }) => {
    await page.fill('input[placeholder*="角色ID"]', '16020013010603');
    await page.click('.el-select:has-text("区服")');
    await page.click('.el-select-dropdown__item:first-child');
    await page.fill('input[placeholder*="角色昵称"]', '测试昵称');
    await page.click('.el-select:has-text("一级平台")');
    await page.click('.el-select-dropdown__item:first-child');
    await page.click('.el-select:has-text("组长")');
    await page.click('.el-select-dropdown__item:first-child');
    await page.click('.el-select:has-text("组员")');
    await page.click('.el-select-dropdown__item:first-child');
    
    await page.click('button:has-text("提交")');
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  test('E2E-N-05: 上传非法格式应显示错误', async ({ page }) => {
    // 模拟上传gif文件
    await page.setInputFiles('input[type="file"]', {
      name: 'test.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from('fake gif content')
    });
    await expect(page.locator('.el-message--error')).toContainText('只支持 jpg/png');
  });
});
```

---

## 四、视觉回归测试计划

### 4.1 测试配置

```typescript
// e2e/visual/visual.spec.ts
import { test, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

const THRESHOLD = 0.01; // 1%容差
const BASELINE_DIR = 'e2e/visual/baseline';
const DIFF_DIR = 'e2e/visual/diff';

async function compareScreenshots(
  page: any, 
  name: string
): Promise<{ match: boolean; diffPixels: number }> {
  const screenshot = await page.screenshot({ fullPage: true });
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  
  if (!fs.existsSync(baselinePath)) {
    fs.writeFileSync(baselinePath, screenshot);
    return { match: true, diffPixels: 0 };
  }
  
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const current = PNG.sync.read(screenshot);
  const { width, height } = baseline;
  const diff = new PNG({ width, height });
  
  const diffPixels = pixelmatch(
    baseline.data, current.data, diff.data, 
    width, height, 
    { threshold: 0.1 }
  );
  
  if (diffPixels > width * height * THRESHOLD) {
    fs.writeFileSync(path.join(DIFF_DIR, `${name}-diff.png`), PNG.sync.write(diff));
    return { match: false, diffPixels };
  }
  
  return { match: true, diffPixels };
}
```

### 4.2 视觉回归测试用例

| 用例ID | 页面 | 基准截图 | 容差阈值 | baseline生成流程 |
|--------|------|----------|----------|-----------------|
| VRT-01 | Dashboard | dashboard-baseline.png | 1px | 首次运行生成 |
| VRT-02 | 角色列表 | role-list-baseline.png | 1px | 首次运行生成 |
| VRT-03 | 订单列表 | order-list-baseline.png | 1px | 首次运行生成 |
| VRT-04 | 绑定申请 | binding-apply-baseline.png | 1px | 首次运行生成 |
| VRT-05 | 新增归因更改 | new-attribution-baseline.png | 1px | 首次运行生成 |

```typescript
// e2e/visual/pages.visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('视觉回归测试', () => {
  test('VRT-01: Dashboard页面视觉对比', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-baseline.png', {
      maxDiffPixels: 100,
      threshold: 0.1
    });
  });

  test('VRT-02: 角色列表页面视觉对比', async ({ page }) => {
    await page.goto('/player-data/role-list');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('role-list-baseline.png', {
      maxDiffPixels: 100,
      threshold: 0.1
    });
  });

  test('VRT-03: 订单列表页面视觉对比', async ({ page }) => {
    await page.goto('/player-data/order-list');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('order-list-baseline.png', {
      maxDiffPixels: 100,
      threshold: 0.1
    });
  });

  test('VRT-04: 绑定申请页面视觉对比', async ({ page }) => {
    await page.goto('/audit/binding-apply');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('binding-apply-baseline.png', {
      maxDiffPixels: 100,
      threshold: 0.1
    });
  });

  test('VRT-05: 新增归因更改页面视觉对比', async ({ page }) => {
    await page.goto('/audit/new-attribution');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('new-attribution-baseline.png', {
      maxDiffPixels: 100,
      threshold: 0.1
    });
  });
});
```

### 4.3 视觉回归更新流程

```bash
# 首次生成baseline
pnpm playwright test --update-snapshots

# 运行视觉回归测试
pnpm playwright test e2e/visual/

# 查看测试报告
pnpm playwright show-report
```

---

## 五、测试执行脚本

### 5.1 package.json 脚本配置

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report",
    "test:visual": "playwright test e2e/visual/",
    "test:visual:update": "playwright test e2e/visual/ --update-snapshots",
    "test:all": "pnpm test:coverage && pnpm test:e2e"
  }
}
```

### 5.2 CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20.11.1'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20.11.1'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 六、测试用例汇总

### 6.1 单元测试用例统计

| 组件/模块 | 用例数 | 覆盖率目标 |
|-----------|--------|-----------|
| StatCard | 8 | ≥80% |
| FilterBar | 10 | ≥80% |
| DataTable | 12 | ≥80% |
| ImageUpload | 12 | ≥80% |
| useTable | 8 | ≥80% |
| useFilter | 4 | ≥80% |
| useSubmitLock | 4 | ≥80% |
| **总计** | **58** | **≥80%** |

### 6.2 E2E测试用例统计

| 页面 | 主路径用例 | 异常路径用例 | 总计 |
|------|-----------|-------------|------|
| Dashboard | 3 | 2 | 5 |
| 角色列表 | 6 | 2 | 8 |
| 订单列表 | 5 | 1 | 6 |
| 绑定申请 | 7 | 1 | 8 |
| 新增归因更改 | 6 | 4 | 10 |
| **总计** | **27** | **10** | **37** |

### 6.3 视觉回归测试用例统计

| 页面 | 用例数 |
|------|--------|
| Dashboard | 1 |
| 角色列表 | 1 |
| 订单列表 | 1 |
| 绑定申请 | 1 |
| 新增归因更改 | 1 |
| **总计** | **5** |

### 6.4 测试用例总计

| 测试类型 | 用例数 |
|----------|--------|
| 单元测试 | 58 |
| E2E测试 | 37 |
| 视觉回归测试 | 5 |
| **总计** | **100** |

---

## 七、测试报告模板

### 7.1 单元测试报告

```
================================================================================
                         Suzaku Gaming 单元测试报告
================================================================================
执行时间: 2026-02-03 10:00:00
测试框架: Vitest 1.5.0
Node版本: 20.11.1

--------------------------------------------------------------------------------
                                  测试结果汇总
--------------------------------------------------------------------------------
总用例数: 58
通过: 58
失败: 0
跳过: 0
通过率: 100%

--------------------------------------------------------------------------------
                                   覆盖率报告
--------------------------------------------------------------------------------
语句覆盖率: 85.6% (目标 ≥80%) ✓
分支覆盖率: 82.3% (目标 ≥80%) ✓
函数覆盖率: 88.9% (目标 ≥80%) ✓
行覆盖率: 84.2% (目标 ≥80%) ✓

--------------------------------------------------------------------------------
                                  详细结果
--------------------------------------------------------------------------------
✓ StatCard (8 tests) - 120ms
✓ FilterBar (10 tests) - 340ms
✓ DataTable (12 tests) - 560ms
✓ ImageUpload (12 tests) - 430ms
✓ useTable (8 tests) - 180ms
✓ useFilter (4 tests) - 90ms
✓ useSubmitLock (4 tests) - 60ms

================================================================================
```

### 7.2 E2E测试报告

```
================================================================================
                         Suzaku Gaming E2E测试报告
================================================================================
执行时间: 2026-02-03 10:30:00
测试框架: Playwright 1.41.0
浏览器: Chromium 120
分辨率: 1920x1080

--------------------------------------------------------------------------------
                                  测试结果汇总
--------------------------------------------------------------------------------
总用例数: 37
通过: 37
失败: 0
跳过: 0
通过率: 100%

--------------------------------------------------------------------------------
                                  页面覆盖情况
--------------------------------------------------------------------------------
✓ Dashboard (5/5 tests) - 2.3s
✓ 角色列表 (8/8 tests) - 4.5s
✓ 订单列表 (6/6 tests) - 3.2s
✓ 绑定申请 (8/8 tests) - 4.8s
✓ 新增归因更改 (10/10 tests) - 5.6s

总执行时间: 20.4s

================================================================================
```

---

## 八、验收检查清单

### 8.1 测试完成检查清单

- [ ] 单元测试全部通过
- [ ] 单元测试覆盖率 ≥80%
- [ ] E2E主路径用例全部通过
- [ ] E2E异常路径用例全部通过
- [ ] 视觉回归测试全部通过（或差异已审核确认）
- [ ] 无控制台错误
- [ ] 无未处理的Promise rejection
- [ ] 测试报告已生成

### 8.2 测试环境检查清单

- [ ] Node版本为20.11.1
- [ ] 浏览器为Chrome 120+
- [ ] 分辨率为1920×1080
- [ ] 缩放比例为100%
- [ ] Mock数据服务正常运行

---

**文档版本**：v1.0  
**生成时间**：2026-02-03  
**架构师签章**：AI Architect
