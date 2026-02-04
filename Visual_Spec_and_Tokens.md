# Visual Spec and Tokens - 视觉标注与设计令牌规格书

> **文档性质**：视觉规格定义 / 设计系统文档  
> **生成日期**：2026-02-03  
> **验收基准**：1920x1080，浏览器缩放100%，Windows 10，Chrome 120+  
> **关联文档**：`Decision_Log.md`、`Suzaku_Gaming_Ultimate_Implementation_Plan.md`

---

## 一、视觉标注流程（必须执行）

### 1.1 标注工作流

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           视觉标注与实现流程                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1          Step 2           Step 3          Step 4          Step 5   │
│  ┌──────┐       ┌───────┐        ┌───────┐       ┌───────┐       ┌──────┐  │
│  │ 截图  │ ──▶  │ 测量   │  ──▶  │ 标注   │ ──▶  │ Token │ ──▶  │ 实现  │  │
│  │ 采集  │       │ 分析   │        │ 输出   │       │ 定义   │       │ 验收  │  │
│  └──────┘       └───────┘        └───────┘       └───────┘       └──────┘  │
│                                                                             │
│  原始截图        Figma测量        visual-spec     tokens.scss    组件样式   │
│                  色值/尺寸        文档更新         变量更新        代码实现   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 变更流程（铁律）

**禁止**：直接在组件里"补丁式"改样式

**必须**：
```
设计变更 → 更新 visual-spec.md → 更新 tokens.scss → 更新组件实现 → 更新测试baseline
```

### 1.3 度量环境

| 属性 | 规格 |
|------|------|
| 基准分辨率 | 1920 × 1080 |
| 浏览器缩放 | 100% |
| 操作系统 | Windows 10 |
| 浏览器 | Chrome 120+ |
| 字体渲染 | ClearType 开启 |

---

## 二、颜色Token表（完整Hex值）

### 2.1 品牌色 / 主色调

| Token名称 | Hex值 | RGB | 用途 | Element Plus映射 |
|-----------|-------|-----|------|-----------------|
| `--color-primary` | #409EFF | rgb(64,158,255) | 主操作按钮、链接、激活态 | `--el-color-primary` |
| `--color-primary-light-3` | #79BBFF | rgb(121,187,255) | 主色浅色3级 | `--el-color-primary-light-3` |
| `--color-primary-light-5` | #A0CFFF | rgb(160,207,255) | 主色浅色5级 | `--el-color-primary-light-5` |
| `--color-primary-light-7` | #C6E2FF | rgb(198,226,255) | 主色浅色7级 | `--el-color-primary-light-7` |
| `--color-primary-light-9` | #ECF5FF | rgb(236,245,255) | 主色浅色9级 | `--el-color-primary-light-9` |
| `--color-primary-dark-2` | #337ECC | rgb(51,126,204) | 主色深色2级 | `--el-color-primary-dark-2` |

### 2.2 功能色

| Token名称 | Hex值 | RGB | 用途 | Element Plus映射 |
|-----------|-------|-----|------|-----------------|
| `--color-success` | #67C23A | rgb(103,194,58) | 成功状态、通过审核、导出按钮 | `--el-color-success` |
| `--color-success-light` | #E1F3D8 | rgb(225,243,216) | 成功背景色 | `--el-color-success-light-9` |
| `--color-warning` | #E6A23C | rgb(230,162,60) | 警告状态、需注意 | `--el-color-warning` |
| `--color-warning-light` | #FDF6EC | rgb(253,246,236) | 警告背景色 | `--el-color-warning-light-9` |
| `--color-danger` | #F56C6C | rgb(245,108,108) | 危险操作、删除、错误 | `--el-color-danger` |
| `--color-danger-light` | #FEF0F0 | rgb(254,240,240) | 危险背景色 | `--el-color-danger-light-9` |
| `--color-info` | #909399 | rgb(144,147,153) | 一般信息、禁用态 | `--el-color-info` |
| `--color-info-light` | #F4F4F5 | rgb(244,244,245) | 信息背景色 | `--el-color-info-light-9` |

### 2.3 侧边栏颜色

| Token名称 | Hex值 | RGB | 用途 |
|-----------|-------|-----|------|
| `--sidebar-bg` | #1e222d | rgb(30,34,45) | 侧边栏背景 |
| `--sidebar-text` | #FFFFFF | rgb(255,255,255) | 侧边栏主文字 |
| `--sidebar-text-secondary` | #BFCBD9 | rgb(191,203,217) | 侧边栏次级文字 |
| `--sidebar-active-bg` | #409EFF | rgb(64,158,255) | 激活菜单背景 |
| `--sidebar-active-text` | #FFFFFF | rgb(255,255,255) | 激活菜单文字 |
| `--sidebar-hover-bg` | rgba(255,255,255,0.05) | - | 悬停背景 |
| `--sidebar-submenu-bg` | #1a1d26 | rgb(26,29,38) | 子菜单背景（比主背景深5%） |

### 2.4 背景色

| Token名称 | Hex值 | RGB | 用途 | Element Plus映射 |
|-----------|-------|-----|------|-----------------|
| `--bg-page` | #F0F2F5 | rgb(240,242,245) | 页面背景 | - |
| `--bg-card` | #FFFFFF | rgb(255,255,255) | 卡片/面板背景 | `--el-bg-color` |
| `--bg-table-header` | #FAFAFA | rgb(250,250,250) | 表头背景 | - |
| `--bg-table-stripe` | #FAFAFA | rgb(250,250,250) | 表格斑马纹 | - |
| `--bg-table-hover` | #F5F7FA | rgb(245,247,250) | 表格悬停行 | - |
| `--bg-input` | #FFFFFF | rgb(255,255,255) | 输入框背景 | `--el-fill-color-blank` |
| `--bg-disabled` | #F5F7FA | rgb(245,247,250) | 禁用态背景 | `--el-disabled-bg-color` |

### 2.5 边框色

| Token名称 | Hex值 | RGB | 用途 | Element Plus映射 |
|-----------|-------|-----|------|-----------------|
| `--border-color` | #E4E7ED | rgb(228,231,237) | 默认边框 | `--el-border-color` |
| `--border-color-light` | #EBEEF5 | rgb(235,238,245) | 浅色边框（表格） | `--el-border-color-light` |
| `--border-color-lighter` | #F2F6FC | rgb(242,246,252) | 更浅边框 | `--el-border-color-lighter` |
| `--border-color-dark` | #D4D7DE | rgb(212,215,222) | 深色边框 | `--el-border-color-dark` |
| `--input-border` | #DCDFE6 | rgb(220,223,230) | 输入框边框 | - |
| `--input-focus-border` | #409EFF | rgb(64,158,255) | 输入框聚焦边框 | - |

### 2.6 文字色

| Token名称 | Hex值 | RGB | 用途 | Element Plus映射 |
|-----------|-------|-----|------|-----------------|
| `--text-primary` | #303133 | rgb(48,49,51) | 主要文字 | `--el-text-color-primary` |
| `--text-regular` | #606266 | rgb(96,98,102) | 常规文字 | `--el-text-color-regular` |
| `--text-secondary` | #909399 | rgb(144,147,153) | 次要文字 | `--el-text-color-secondary` |
| `--text-placeholder` | #C0C4CC | rgb(192,196,204) | 占位符文字 | `--el-text-color-placeholder` |
| `--text-disabled` | #C0C4CC | rgb(192,196,204) | 禁用文字 | `--el-text-color-disabled` |
| `--text-link` | #409EFF | rgb(64,158,255) | 链接文字 | - |

### 2.7 状态标签颜色

| 状态 | 背景色 | 文字色 | 边框色 | 用途 |
|------|--------|--------|--------|------|
| 未审核 | #ECF5FF | #409EFF | #B3D8FF | 待处理状态 |
| 审核通过 | #E1F3D8 | #67C23A | #C2E7B0 | 成功状态 |
| 审核拒绝 | #FEF0F0 | #F56C6C | #FBC4C4 | 失败/拒绝状态 |

---

## 三、Element Plus 变量映射表

### 3.1 颜色映射

```scss
// styles/element-variables.scss

// 品牌色
--el-color-primary: var(--color-primary);           // #409EFF
--el-color-primary-light-3: var(--color-primary-light-3);
--el-color-primary-light-5: var(--color-primary-light-5);
--el-color-primary-light-7: var(--color-primary-light-7);
--el-color-primary-light-9: var(--color-primary-light-9);
--el-color-primary-dark-2: var(--color-primary-dark-2);

// 功能色
--el-color-success: var(--color-success);           // #67C23A
--el-color-warning: var(--color-warning);           // #E6A23C
--el-color-danger: var(--color-danger);             // #F56C6C
--el-color-info: var(--color-info);                 // #909399

// 文字色
--el-text-color-primary: var(--text-primary);       // #303133
--el-text-color-regular: var(--text-regular);       // #606266
--el-text-color-secondary: var(--text-secondary);   // #909399
--el-text-color-placeholder: var(--text-placeholder); // #C0C4CC
--el-text-color-disabled: var(--text-disabled);     // #C0C4CC

// 边框色
--el-border-color: var(--border-color);             // #E4E7ED
--el-border-color-light: var(--border-color-light); // #EBEEF5
--el-border-color-lighter: var(--border-color-lighter); // #F2F6FC
--el-border-color-dark: var(--border-color-dark);   // #D4D7DE

// 背景色
--el-bg-color: var(--bg-card);                      // #FFFFFF
--el-fill-color-blank: var(--bg-input);             // #FFFFFF

// 菜单色（侧边栏）
--el-menu-bg-color: var(--sidebar-bg);              // #1e222d
--el-menu-text-color: var(--sidebar-text);          // #FFFFFF
--el-menu-active-color: var(--sidebar-active-text); // #FFFFFF
--el-menu-hover-bg-color: var(--sidebar-hover-bg);  // rgba(255,255,255,0.05)
```

### 3.2 尺寸映射

```scss
// 组件尺寸
--el-component-size-large: 40px;
--el-component-size: 32px;
--el-component-size-small: 24px;

// 圆角
--el-border-radius-base: 4px;
--el-border-radius-small: 2px;
--el-border-radius-round: 20px;
--el-border-radius-circle: 100%;
```

---

## 四、字体规范

### 4.1 字体族定义

```scss
// 主字体族
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                   'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
                   'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';

// Windows 中文优化
$font-family-zh: 'Microsoft YaHei', '微软雅黑', 'PingFang SC', 
                 'Hiragino Sans GB', 'Heiti SC', sans-serif;

// 最终字体族
--font-family: #{$font-family-base}, #{$font-family-zh};
```

### 4.2 字号阶梯

| Token名称 | 大小 | 行高 | 用途 |
|-----------|------|------|------|
| `--font-size-xs` | 12px | 18px | 辅助文字、标签、徽标 |
| `--font-size-sm` | 13px | 20px | 表格内容、表单提示 |
| `--font-size-base` | 14px | 22px | 正文、按钮、输入框 |
| `--font-size-lg` | 16px | 24px | 小标题、菜单、面包屑 |
| `--font-size-xl` | 18px | 26px | 二级标题 |
| `--font-size-xxl` | 20px | 28px | 一级标题 |
| `--font-size-stat` | 28px | 36px | 统计数值（Dashboard卡片） |
| `--font-size-stat-lg` | 32px | 40px | 大号统计数值 |

### 4.3 字重阶梯

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--font-weight-normal` | 400 | 正文、普通文字 |
| `--font-weight-medium` | 500 | 中等强调 |
| `--font-weight-semibold` | 600 | 标题、表头、按钮 |
| `--font-weight-bold` | 700 | 统计数值、强调 |

### 4.4 具体应用

| 场景 | 字号 | 字重 | 行高 | 颜色 |
|------|------|------|------|------|
| 页面标题 | 20px | 600 | 28px | #303133 |
| 卡片标题 | 14px | 400 | 22px | #303133 |
| 卡片副标题 | 12px | 400 | 18px | #909399 |
| 卡片数值 | 28px | 700 | 36px | #303133 |
| 卡片单位 | 12px | 400 | 18px | #909399 |
| 表头文字 | 14px | 600 | 22px | #606266 |
| 表格内容 | 14px | 400 | 22px | #303133 |
| 按钮文字 | 14px | 400 | 22px | - |
| 输入框文字 | 14px | 400 | 22px | #303133 |
| 占位符 | 14px | 400 | 22px | #C0C4CC |
| 菜单项 | 14px | 400 | 22px | #FFFFFF |
| 面包屑 | 14px | 400 | 22px | #606266 |
| Logo文字 | 16px | 600 | 24px | #FFFFFF |

---

## 五、间距与尺寸阶梯

### 5.1 间距阶梯（Spacing Scale）

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--spacing-none` | 0 | 无间距 |
| `--spacing-xs` | 4px | 最小间距（图标与文字） |
| `--spacing-sm` | 8px | 小间距（按钮间距、列表项） |
| `--spacing-md` | 12px | 中间距（表单项行间距） |
| `--spacing-base` | 16px | 基础间距（内容区内边距） |
| `--spacing-lg` | 20px | 大间距（卡片内边距、Grid gap） |
| `--spacing-xl` | 24px | 超大间距（区块间距） |
| `--spacing-xxl` | 32px | 最大间距（页面区块） |

### 5.2 布局尺寸

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--sidebar-width` | 220px | 侧边栏展开宽度 |
| `--sidebar-collapsed-width` | 64px | 侧边栏收起宽度 |
| `--header-height` | 56px | 顶部导航栏高度 |
| `--content-padding` | 16px | 内容区内边距 |
| `--content-min-height` | calc(100vh - 56px) | 内容区最小高度 |

### 5.3 组件尺寸

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--menu-item-height` | 50px | 一级菜单项高度 |
| `--submenu-item-height` | 40px | 子菜单项高度 |
| `--button-height` | 32px | 按钮高度（default） |
| `--button-height-lg` | 40px | 按钮高度（large） |
| `--button-height-sm` | 24px | 按钮高度（small） |
| `--input-height` | 32px | 输入框高度（default） |
| `--input-height-lg` | 40px | 输入框高度（large） |
| `--table-row-height` | 52px | 表格行高 |
| `--table-header-height` | 40px | 表格表头高度 |
| `--card-height` | 120px | Dashboard卡片高度 |
| `--avatar-size` | 32px | 头像尺寸 |
| `--icon-size` | 16px | 图标尺寸 |
| `--icon-size-lg` | 20px | 大图标尺寸 |

---

## 六、圆角与阴影

### 6.1 圆角阶梯

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--radius-none` | 0 | 无圆角 |
| `--radius-sm` | 2px | 小圆角（徽标） |
| `--radius-base` | 4px | 基础圆角（按钮、输入框、标签） |
| `--radius-md` | 6px | 中圆角（下拉面板） |
| `--radius-lg` | 8px | 大圆角（卡片、弹窗） |
| `--radius-xl` | 12px | 超大圆角 |
| `--radius-round` | 20px | 胶囊形圆角 |
| `--radius-circle` | 50% | 圆形（头像） |

### 6.2 阴影阶梯

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--shadow-none` | none | 无阴影 |
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | 轻微阴影 |
| `--shadow-base` | 0 2px 8px rgba(0,0,0,0.06) | 基础阴影（卡片） |
| `--shadow-md` | 0 2px 12px rgba(0,0,0,0.1) | 中等阴影（悬浮卡片） |
| `--shadow-lg` | 0 4px 16px rgba(0,0,0,0.12) | 大阴影（下拉面板） |
| `--shadow-xl` | 0 8px 24px rgba(0,0,0,0.15) | 超大阴影（弹窗） |

### 6.3 特殊阴影

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--shadow-table-fixed-left` | 10px 0 10px -10px rgba(0,0,0,0.12) | 表格左固定列阴影 |
| `--shadow-table-fixed-right` | -10px 0 10px -10px rgba(0,0,0,0.12) | 表格右固定列阴影 |
| `--shadow-header` | 0 1px 4px rgba(0,21,41,0.08) | 顶部栏阴影 |
| `--shadow-dropdown` | 0 2px 12px rgba(0,0,0,0.12) | 下拉菜单阴影 |

---

## 七、组件状态定义

### 7.1 按钮状态

| 状态 | Primary按钮 | Success按钮 | Danger按钮 | Default按钮 |
|------|-------------|-------------|------------|-------------|
| **默认** | bg:#409EFF, text:#FFF | bg:#67C23A, text:#FFF | bg:#F56C6C, text:#FFF | bg:#FFF, text:#606266, border:#DCDFE6 |
| **悬停** | bg:#66B1FF | bg:#85CE61 | bg:#F78989 | bg:#ECF5FF, text:#409EFF, border:#C6E2FF |
| **点击** | bg:#3A8EE6 | bg:#5DAF34 | bg:#DD6161 | bg:#ECF5FF, text:#409EFF, border:#409EFF |
| **禁用** | bg:#A0CFFF, text:#FFF | bg:#B3E19D, text:#FFF | bg:#FAB6B6, text:#FFF | bg:#F5F7FA, text:#C0C4CC, border:#E4E7ED |
| **加载** | 同默认 + 显示spinner | 同默认 + 显示spinner | 同默认 + 显示spinner | 同默认 + 显示spinner |

### 7.2 输入框状态

| 状态 | 背景色 | 边框色 | 文字色 | 其他 |
|------|--------|--------|--------|------|
| **默认** | #FFFFFF | #DCDFE6 | #303133 | - |
| **悬停** | #FFFFFF | #C0C4CC | #303133 | - |
| **聚焦** | #FFFFFF | #409EFF | #303133 | box-shadow: 0 0 0 2px rgba(64,158,255,0.2) |
| **禁用** | #F5F7FA | #E4E7ED | #C0C4CC | cursor: not-allowed |
| **错误** | #FFFFFF | #F56C6C | #303133 | - |
| **成功** | #FFFFFF | #67C23A | #303133 | - |

### 7.3 表格状态

| 状态 | 背景色 | 说明 |
|------|--------|------|
| **默认行** | #FFFFFF | 奇数行 |
| **斑马纹行** | #FAFAFA | 偶数行 |
| **悬停行** | #F5F7FA | 鼠标悬停 |
| **选中行** | #ECF5FF | 被选中的行 |
| **表头** | #FAFAFA | 固定背景色 |

### 7.4 菜单项状态

| 状态 | 背景色 | 文字色 | 其他 |
|------|--------|--------|------|
| **默认** | transparent | #FFFFFF | - |
| **悬停** | rgba(255,255,255,0.05) | #FFFFFF | - |
| **激活** | #409EFF | #FFFFFF | 左侧3px指示条 |
| **禁用** | transparent | rgba(255,255,255,0.3) | cursor: not-allowed |

### 7.5 页面加载状态

| 状态 | 视觉表现 |
|------|----------|
| **加载中** | 遮罩层 rgba(255,255,255,0.9)，显示Element Plus默认spinner，颜色#409EFF |
| **空数据** | el-empty组件，描述文字"暂无数据"，颜色#909399 |
| **错误** | el-result组件，type="error"，描述错误信息 |
| **网络断开** | 顶部固定提示条，红色背景#F56C6C，文字"网络连接已断开" |

---

## 八、资源清单

### 8.1 Logo规格

| 属性 | 规格 |
|------|------|
| 类型 | 纯文字Logo |
| 文本 | `Suzaku Gaming` |
| 字号 | 16px |
| 字重 | 600 |
| 颜色 | #FFFFFF |
| 对齐 | 水平居中、垂直居中 |
| 容器高度 | 56px（与Header等高） |
| 容器背景 | 同侧边栏背景 #1e222d |

### 8.2 头像规格

| 属性 | 规格 |
|------|------|
| 尺寸 | 32px × 32px |
| 形状 | 圆形 (border-radius: 50%) |
| 默认背景 | #D9D9D9 |
| 默认图标 | Element Plus User图标，颜色#FFFFFF |
| 边框 | 无 |

### 8.3 占位图规格

| 类型 | 尺寸 | 背景色 | 圆角 | 用途 |
|------|------|--------|------|------|
| 表格空态图 | 64px × 64px | - | - | 使用el-empty默认图标 |
| 上传占位区 | 100% × 150px | #FAFAFA | 4px | 虚线边框 #DCDFE6 |
| 缩略图预览 | 100px × 100px | #F2F2F2 | 4px | 上传预览 |

### 8.4 图标规格

| 场景 | 图标库 | 尺寸 | 颜色 |
|------|--------|------|------|
| 菜单图标 | @element-plus/icons-vue | 16px | 继承菜单文字颜色 |
| 按钮图标 | @element-plus/icons-vue | 14px | 继承按钮文字颜色 |
| 操作图标 | @element-plus/icons-vue | 14px | #409EFF / #67C23A / #F56C6C |
| 状态图标 | @element-plus/icons-vue | 16px | 继承状态颜色 |

---

## 九、响应式断点

### 9.1 断点定义

| Token名称 | 值 | 说明 |
|-----------|-----|------|
| `--breakpoint-xl` | 1440px | 超大屏，默认布局 |
| `--breakpoint-lg` | 1280px | 大屏，表格可横向滚动 |
| `--breakpoint-md` | 1024px | 中屏，侧边栏自动折叠 |

### 9.2 断点行为

```scss
// 响应式行为定义

// ≥1440px：默认布局
@media (min-width: 1440px) {
  // 侧边栏展开 220px
  // 所有列表完整显示
}

// 1280px - 1439px：大屏适配
@media (min-width: 1280px) and (max-width: 1439px) {
  // 侧边栏展开 220px
  // 表格启用横向滚动
}

// 1024px - 1279px：中屏适配
@media (min-width: 1024px) and (max-width: 1279px) {
  // 侧边栏自动折叠为 64px 图标模式
  // 表格启用横向滚动
}

// <1024px：不支持
@media (max-width: 1023px) {
  // 显示"请使用桌面设备访问"提示页面
  // 隐藏主内容
}
```

### 9.3 响应式SCSS Mixin

```scss
// styles/mixins/_responsive.scss

$breakpoint-xl: 1440px;
$breakpoint-lg: 1280px;
$breakpoint-md: 1024px;

@mixin respond-to($breakpoint) {
  @if $breakpoint == 'xl' {
    @media (min-width: $breakpoint-xl) { @content; }
  } @else if $breakpoint == 'lg' {
    @media (min-width: $breakpoint-lg) and (max-width: $breakpoint-xl - 1) { @content; }
  } @else if $breakpoint == 'md' {
    @media (min-width: $breakpoint-md) and (max-width: $breakpoint-lg - 1) { @content; }
  } @else if $breakpoint == 'sm' {
    @media (max-width: $breakpoint-md - 1) { @content; }
  }
}

// 使用示例
.sidebar {
  width: $sidebar-width;
  
  @include respond-to('md') {
    width: $sidebar-collapsed-width;
  }
}
```

---

## 十、动画与过渡

### 10.1 过渡时长

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--transition-fast` | 0.15s | 快速交互（hover效果） |
| `--transition-base` | 0.3s | 基础过渡（展开收起） |
| `--transition-slow` | 0.5s | 慢速过渡（页面切换） |

### 10.2 缓动函数

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--ease-linear` | linear | 匀速 |
| `--ease-in` | ease-in | 加速 |
| `--ease-out` | ease-out | 减速 |
| `--ease-in-out` | ease-in-out | 先加后减 |
| `--ease-default` | ease | 默认 |

### 10.3 常用过渡定义

```scss
// 按钮悬停
.el-button {
  transition: all var(--transition-fast) var(--ease-default);
}

// 侧边栏折叠
.sidebar {
  transition: width var(--transition-base) var(--ease-in-out);
}

// 表格行悬停
.el-table__row {
  transition: background-color var(--transition-fast) var(--ease-default);
}

// 页面切换
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity var(--transition-base) var(--ease-default);
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
```

---

## 十一、Z-Index层级

| Token名称 | 值 | 用途 |
|-----------|-----|------|
| `--z-index-base` | 1 | 基础层级 |
| `--z-index-dropdown` | 10 | 下拉菜单 |
| `--z-index-sticky` | 20 | 粘性定位元素 |
| `--z-index-fixed` | 30 | 固定定位元素 |
| `--z-index-sidebar` | 100 | 侧边栏 |
| `--z-index-header` | 101 | 顶部栏 |
| `--z-index-modal-backdrop` | 200 | 弹窗遮罩 |
| `--z-index-modal` | 201 | 弹窗 |
| `--z-index-popover` | 300 | 气泡弹出 |
| `--z-index-tooltip` | 400 | 工具提示 |
| `--z-index-message` | 500 | 消息提示 |
| `--z-index-loading` | 600 | 全局加载 |

---

## 十二、完整SCSS Token文件

```scss
// styles/tokens.scss
// Suzaku Gaming Design Tokens
// 生成日期: 2026-02-03

// ==================== 颜色变量 ====================

// 品牌色
$color-primary: #409EFF;
$color-primary-light-3: #79BBFF;
$color-primary-light-5: #A0CFFF;
$color-primary-light-7: #C6E2FF;
$color-primary-light-9: #ECF5FF;
$color-primary-dark-2: #337ECC;

// 功能色
$color-success: #67C23A;
$color-success-light: #E1F3D8;
$color-warning: #E6A23C;
$color-warning-light: #FDF6EC;
$color-danger: #F56C6C;
$color-danger-light: #FEF0F0;
$color-info: #909399;
$color-info-light: #F4F4F5;

// 侧边栏
$sidebar-bg: #1e222d;
$sidebar-text: #FFFFFF;
$sidebar-text-secondary: #BFCBD9;
$sidebar-active-bg: $color-primary;
$sidebar-active-text: #FFFFFF;
$sidebar-hover-bg: rgba(255, 255, 255, 0.05);
$sidebar-submenu-bg: #1a1d26;

// 背景色
$bg-page: #F0F2F5;
$bg-card: #FFFFFF;
$bg-table-header: #FAFAFA;
$bg-table-stripe: #FAFAFA;
$bg-table-hover: #F5F7FA;
$bg-input: #FFFFFF;
$bg-disabled: #F5F7FA;

// 边框色
$border-color: #E4E7ED;
$border-color-light: #EBEEF5;
$border-color-lighter: #F2F6FC;
$border-color-dark: #D4D7DE;
$input-border: #DCDFE6;
$input-focus-border: $color-primary;

// 文字色
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$text-placeholder: #C0C4CC;
$text-disabled: #C0C4CC;
$text-link: $color-primary;

// ==================== 尺寸变量 ====================

// 布局尺寸
$sidebar-width: 220px;
$sidebar-collapsed-width: 64px;
$header-height: 56px;
$content-padding: 16px;

// 组件尺寸
$menu-item-height: 50px;
$submenu-item-height: 40px;
$button-height: 32px;
$button-height-lg: 40px;
$button-height-sm: 24px;
$input-height: 32px;
$input-height-lg: 40px;
$table-row-height: 52px;
$table-header-height: 40px;
$card-height: 120px;
$avatar-size: 32px;
$icon-size: 16px;
$icon-size-lg: 20px;

// 间距阶梯
$spacing-none: 0;
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-base: 16px;
$spacing-lg: 20px;
$spacing-xl: 24px;
$spacing-xxl: 32px;

// ==================== 字体变量 ====================

$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
              'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
              'Microsoft YaHei', '微软雅黑', 'PingFang SC';

$font-size-xs: 12px;
$font-size-sm: 13px;
$font-size-base: 14px;
$font-size-lg: 16px;
$font-size-xl: 18px;
$font-size-xxl: 20px;
$font-size-stat: 28px;
$font-size-stat-lg: 32px;

$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

$line-height-xs: 18px;
$line-height-sm: 20px;
$line-height-base: 22px;
$line-height-lg: 24px;
$line-height-xl: 26px;

// ==================== 圆角变量 ====================

$radius-none: 0;
$radius-sm: 2px;
$radius-base: 4px;
$radius-md: 6px;
$radius-lg: 8px;
$radius-xl: 12px;
$radius-round: 20px;
$radius-circle: 50%;

// ==================== 阴影变量 ====================

$shadow-none: none;
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-base: 0 2px 8px rgba(0, 0, 0, 0.06);
$shadow-md: 0 2px 12px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
$shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.15);
$shadow-table-fixed-left: 10px 0 10px -10px rgba(0, 0, 0, 0.12);
$shadow-table-fixed-right: -10px 0 10px -10px rgba(0, 0, 0, 0.12);
$shadow-header: 0 1px 4px rgba(0, 21, 41, 0.08);
$shadow-dropdown: 0 2px 12px rgba(0, 0, 0, 0.12);

// ==================== 过渡变量 ====================

$transition-fast: 0.15s ease;
$transition-base: 0.3s ease;
$transition-slow: 0.5s ease;

// ==================== 层级变量 ====================

$z-index-base: 1;
$z-index-dropdown: 10;
$z-index-sticky: 20;
$z-index-fixed: 30;
$z-index-sidebar: 100;
$z-index-header: 101;
$z-index-modal-backdrop: 200;
$z-index-modal: 201;
$z-index-popover: 300;
$z-index-tooltip: 400;
$z-index-message: 500;
$z-index-loading: 600;

// ==================== 响应式断点 ====================

$breakpoint-xl: 1440px;
$breakpoint-lg: 1280px;
$breakpoint-md: 1024px;
```

---

## 十三、CSS自定义属性导出

```scss
// styles/css-variables.scss
// 将SCSS变量导出为CSS自定义属性

:root {
  // 颜色
  --color-primary: #{$color-primary};
  --color-primary-light-3: #{$color-primary-light-3};
  --color-primary-light-5: #{$color-primary-light-5};
  --color-primary-light-7: #{$color-primary-light-7};
  --color-primary-light-9: #{$color-primary-light-9};
  --color-primary-dark-2: #{$color-primary-dark-2};
  
  --color-success: #{$color-success};
  --color-success-light: #{$color-success-light};
  --color-warning: #{$color-warning};
  --color-warning-light: #{$color-warning-light};
  --color-danger: #{$color-danger};
  --color-danger-light: #{$color-danger-light};
  --color-info: #{$color-info};
  --color-info-light: #{$color-info-light};
  
  --sidebar-bg: #{$sidebar-bg};
  --sidebar-text: #{$sidebar-text};
  --sidebar-active-bg: #{$sidebar-active-bg};
  
  --bg-page: #{$bg-page};
  --bg-card: #{$bg-card};
  --bg-table-header: #{$bg-table-header};
  --bg-table-stripe: #{$bg-table-stripe};
  --bg-table-hover: #{$bg-table-hover};
  
  --border-color: #{$border-color};
  --border-color-light: #{$border-color-light};
  --input-border: #{$input-border};
  --input-focus-border: #{$input-focus-border};
  
  --text-primary: #{$text-primary};
  --text-regular: #{$text-regular};
  --text-secondary: #{$text-secondary};
  --text-placeholder: #{$text-placeholder};
  
  // 尺寸
  --sidebar-width: #{$sidebar-width};
  --sidebar-collapsed-width: #{$sidebar-collapsed-width};
  --header-height: #{$header-height};
  --content-padding: #{$content-padding};
  
  --menu-item-height: #{$menu-item-height};
  --submenu-item-height: #{$submenu-item-height};
  --table-row-height: #{$table-row-height};
  --table-header-height: #{$table-header-height};
  
  // 字体
  --font-family: #{$font-family};
  --font-size-base: #{$font-size-base};
  --font-size-stat: #{$font-size-stat};
  
  // 圆角
  --radius-base: #{$radius-base};
  --radius-lg: #{$radius-lg};
  
  // 阴影
  --shadow-base: #{$shadow-base};
  --shadow-md: #{$shadow-md};
  
  // 过渡
  --transition-fast: #{$transition-fast};
  --transition-base: #{$transition-base};
}
```

---

**文档版本**：v1.0  
**生成时间**：2026-02-03  
**架构师签章**：AI Architect
