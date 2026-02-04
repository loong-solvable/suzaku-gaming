# Traceability Matrix - 需求追踪矩阵

> **文档性质**：需求追踪矩阵 / 验收追溯文档  
> **生成日期**：2026-02-03  
> **关联文档**：`网站复刻报告.md`（SSoT）、`Decision_Log.md`、`Test_Plan_and_Cases.md`  
> **SSoT条目ID格式**：`SSoT-{章节号}-{序号}`

---

## 一、Dashboard（概要面板）需求追踪

### 1.1 页面结构需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------|----------------|----------|
| SSoT-4.1-01 | Dashboard显示12个KPI卡片 | Dashboard | StatCard × 12 | GET /api/dashboard/statistics | TC-D-01 | 截图对比 |
| SSoT-4.1-02 | 卡片布局Grid 4列×3行 | Dashboard | el-row + el-col | - | TC-D-02 | 截图对比 |
| SSoT-4.1-03 | 卡片间距gap: 20px | Dashboard | - | - | TC-D-03 | 像素测量 |
| SSoT-4.1-04 | 卡片尺寸约200-250px × 120px | Dashboard | StatCard | - | TC-D-04 | 像素测量 |
| SSoT-4.1-05 | 卡片圆角8px | Dashboard | StatCard | - | TC-D-05 | 像素测量 |
| SSoT-4.1-06 | 卡片阴影0 2px 12px rgba(0,0,0,0.1) | Dashboard | StatCard | - | TC-D-06 | 样式检查 |
| SSoT-4.1-07 | 卡片内边距20px | Dashboard | StatCard | - | TC-D-07 | 像素测量 |

### 1.2 卡片内容需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------|----------------|----------|
| SSoT-4.1-08 | 指标标题灰色14px | Dashboard | StatCard | - | TC-D-08 | 样式检查 |
| SSoT-4.1-09 | 日期区间浅灰色12px | Dashboard | StatCard | - | TC-D-09 | 样式检查 |
| SSoT-4.1-10 | 数值黑色加粗32-36px | Dashboard | StatCard | - | TC-D-10 | 样式检查 |
| SSoT-4.1-11 | 单位灰色14px | Dashboard | StatCard | - | TC-D-11 | 样式检查 |

### 1.3 数据字段需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口字段 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.1-12 | 今日新增玩家 | Dashboard | StatCard | today.newPlayers | TC-D-12 | 数据验证 |
| SSoT-4.1-13 | 今日活跃玩家 | Dashboard | StatCard | today.activePlayers | TC-D-13 | 数据验证 |
| SSoT-4.1-14 | 今日付费玩家 | Dashboard | StatCard | today.paidPlayers | TC-D-14 | 数据验证 |
| SSoT-4.1-15 | 今日付费金额(USD) | Dashboard | StatCard | today.paidAmount | TC-D-15 | 数据验证 |
| SSoT-4.1-16 | 当月新增玩家 | Dashboard | StatCard | monthly.newPlayers | TC-D-16 | 数据验证 |
| SSoT-4.1-17 | 当月活跃玩家 | Dashboard | StatCard | monthly.activePlayers | TC-D-17 | 数据验证 |
| SSoT-4.1-18 | 当月付费玩家 | Dashboard | StatCard | monthly.paidPlayers | TC-D-18 | 数据验证 |
| SSoT-4.1-19 | 当月付费金额(USD) | Dashboard | StatCard | monthly.paidAmount | TC-D-19 | 数据验证 |
| SSoT-4.1-20 | 历史新增用户 | Dashboard | StatCard | total.newPlayers | TC-D-20 | 数据验证 |
| SSoT-4.1-21 | 历史活跃用户 | Dashboard | StatCard | total.activePlayers | TC-D-21 | 数据验证 |
| SSoT-4.1-22 | 历史付费用户 | Dashboard | StatCard | total.paidPlayers | TC-D-22 | 数据验证 |
| SSoT-4.1-23 | 历史付费金额(USD) | Dashboard | StatCard | total.paidAmount | TC-D-23 | 数据验证 |

---

## 二、角色列表需求追踪

### 2.1 筛选字段需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口参数 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.2-01 | 游戏项目下拉选择 | RoleList | FilterBar > el-select | project | TC-R-01 | 功能验证 |
| SSoT-4.2-02 | 区服下拉选择 | RoleList | FilterBar > el-select | server | TC-R-02 | 功能验证 |
| SSoT-4.2-03 | 一级渠道下拉选择 | RoleList | FilterBar > el-select | channel1 | TC-R-03 | 功能验证 |
| SSoT-4.2-04 | 二级渠道下拉选择 | RoleList | FilterBar > el-select | channel2 | TC-R-04 | 功能验证 |
| SSoT-4.2-05 | 三级渠道下拉选择 | RoleList | FilterBar > el-select | channel3 | TC-R-05 | 功能验证 |
| SSoT-4.2-06 | 系统下拉选择(iOS/Android) | RoleList | FilterBar > el-select | system | TC-R-06 | 功能验证 |
| SSoT-4.2-07 | 时区下拉选择 | RoleList | FilterBar > el-select | timezone | TC-R-07 | 功能验证 |
| SSoT-4.2-08 | 角色ID文本输入(精确查询) | RoleList | FilterBar > el-input | roleId | TC-R-08 | 功能验证 |
| SSoT-4.2-09 | 角色昵称文本输入(模糊查询) | RoleList | FilterBar > el-input | nickname | TC-R-09 | 功能验证 |
| SSoT-4.2-10 | 角色注册时间日期范围选择 | RoleList | FilterBar > el-date-picker | startDate, endDate | TC-R-10 | 功能验证 |

### 2.2 操作按钮需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------|----------------|----------|
| SSoT-4.2-11 | 查询按钮蓝色#3b82f6带放大镜图标 | RoleList | FilterBar > el-button | GET /api/player/roles | TC-R-11 | 样式检查+功能验证 |
| SSoT-4.2-12 | 清空按钮白色灰边框带垃圾桶图标 | RoleList | FilterBar > el-button | - | TC-R-12 | 样式检查+功能验证 |
| SSoT-4.2-13 | 导出按钮绿色#22c55e带下载图标 | RoleList | FilterBar > el-button | 前端CSV导出 | TC-R-13 | 样式检查+功能验证 |

### 2.3 表格列需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口字段 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.2-14 | 项目列(不可排序) | RoleList | DataTable > el-table-column | project | TC-R-14 | 数据显示验证 |
| SSoT-4.2-15 | 角色ID列(不可排序) | RoleList | DataTable > el-table-column | roleId | TC-R-15 | 数据显示验证 |
| SSoT-4.2-16 | UCID列(不可排序) | RoleList | DataTable > el-table-column | ucid | TC-R-16 | 数据显示验证 |
| SSoT-4.2-17 | 区服列(不可排序) | RoleList | DataTable > el-table-column | server | TC-R-17 | 数据显示验证 |
| SSoT-4.2-18 | 系统列(不可排序) | RoleList | DataTable > el-table-column | system | TC-R-18 | 数据显示验证 |
| SSoT-4.2-19 | 角色昵称列(不可排序) | RoleList | DataTable > el-table-column | nickname | TC-R-19 | 数据显示验证 |
| SSoT-4.2-20 | 国家列(不可排序) | RoleList | DataTable > el-table-column | country | TC-R-20 | 数据显示验证 |
| SSoT-4.2-21 | 角色等级列(不可排序) | RoleList | DataTable > el-table-column | level | TC-R-21 | 数据显示验证 |
| SSoT-4.2-22 | 注册时间列(可排序) | RoleList | DataTable > el-table-column | registerTime | TC-R-22 | 排序功能验证 |
| SSoT-4.2-23 | 最后登录时间列(可排序) | RoleList | DataTable > el-table-column | lastLoginTime | TC-R-23 | 排序功能验证 |
| SSoT-4.2-24 | 最后更改时间列(可排序) | RoleList | DataTable > el-table-column | lastUpdateTime | TC-R-24 | 排序功能验证 |
| SSoT-4.2-25 | 总付费金额列(可排序) | RoleList | DataTable > el-table-column | totalPayment | TC-R-25 | 排序功能验证 |
| SSoT-4.2-26 | 总付费笔数列(可排序) | RoleList | DataTable > el-table-column | paymentCount | TC-R-26 | 排序功能验证 |
| SSoT-4.2-27 | 一级渠道列(不可排序) | RoleList | DataTable > el-table-column | channel1 | TC-R-27 | 数据显示验证 |

---

## 三、订单列表需求追踪

### 3.1 筛选字段需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口参数 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.3-01 | 游戏项目下拉选择 | OrderList | FilterBar > el-select | project | TC-O-01 | 功能验证 |
| SSoT-4.3-02 | 区服下拉选择 | OrderList | FilterBar > el-select | server | TC-O-02 | 功能验证 |
| SSoT-4.3-03 | 一级渠道下拉选择 | OrderList | FilterBar > el-select | channel1 | TC-O-03 | 功能验证 |
| SSoT-4.3-04 | 二级渠道下拉选择 | OrderList | FilterBar > el-select | channel2 | TC-O-04 | 功能验证 |
| SSoT-4.3-05 | 三级渠道下拉选择 | OrderList | FilterBar > el-select | channel3 | TC-O-05 | 功能验证 |
| SSoT-4.3-06 | 订单类型下拉选择 | OrderList | FilterBar > el-select | orderType | TC-O-06 | 功能验证 |
| SSoT-4.3-07 | 系统下拉选择 | OrderList | FilterBar > el-select | system | TC-O-07 | 功能验证 |
| SSoT-4.3-08 | 时区下拉选择 | OrderList | FilterBar > el-select | timezone | TC-O-08 | 功能验证 |
| SSoT-4.3-09 | 角色ID文本输入 | OrderList | FilterBar > el-input | roleId | TC-O-09 | 功能验证 |
| SSoT-4.3-10 | 角色昵称文本输入 | OrderList | FilterBar > el-input | nickname | TC-O-10 | 功能验证 |
| SSoT-4.3-11 | 充值时间日期范围选择 | OrderList | FilterBar > el-date-picker | startDate, endDate | TC-O-11 | 功能验证 |

### 3.2 统计信息需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口字段 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.3-12 | 累计充值金额红色加粗显示 | OrderList | 自定义文本 | totalAmount | TC-O-12 | 样式检查+数据验证 |

### 3.3 表格列需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口字段 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.3-13 | 项目列 | OrderList | DataTable > el-table-column | project | TC-O-13 | 数据显示验证 |
| SSoT-4.3-14 | 角色ID列 | OrderList | DataTable > el-table-column | roleId | TC-O-14 | 数据显示验证 |
| SSoT-4.3-15 | 区服列 | OrderList | DataTable > el-table-column | server | TC-O-15 | 数据显示验证 |
| SSoT-4.3-16 | 系统列 | OrderList | DataTable > el-table-column | system | TC-O-16 | 数据显示验证 |
| SSoT-4.3-17 | 角色昵称列 | OrderList | DataTable > el-table-column | nickname | TC-O-17 | 数据显示验证 |
| SSoT-4.3-18 | 角色等级列 | OrderList | DataTable > el-table-column | level | TC-O-18 | 数据显示验证 |
| SSoT-4.3-19 | 充值时间列(可排序) | OrderList | DataTable > el-table-column | payTime | TC-O-19 | 排序功能验证 |
| SSoT-4.3-20 | 最后登录时间列(可排序) | OrderList | DataTable > el-table-column | lastLoginTime | TC-O-20 | 排序功能验证 |
| SSoT-4.3-21 | 充值金额列(可排序) | OrderList | DataTable > el-table-column | amount | TC-O-21 | 排序功能验证 |
| SSoT-4.3-22 | 币种列 | OrderList | DataTable > el-table-column | currency | TC-O-22 | 数据显示验证 |
| SSoT-4.3-23 | 订单类型列 | OrderList | DataTable > el-table-column | orderType | TC-O-23 | 数据显示验证 |
| SSoT-4.3-24 | 订单号列 | OrderList | DataTable > el-table-column | orderNo | TC-O-24 | 数据显示验证 |
| SSoT-4.3-25 | 充值渠道列 | OrderList | DataTable > el-table-column | payChannel | TC-O-25 | 数据显示验证 |
| SSoT-4.3-26 | 一级渠道列 | OrderList | DataTable > el-table-column | channel1 | TC-O-26 | 数据显示验证 |

---

## 四、绑定申请需求追踪

### 4.1 筛选字段需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口参数 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.4-01 | 游戏项目下拉选择 | BindingApply | FilterBar > el-select | project | TC-B-01 | 功能验证 |
| SSoT-4.4-02 | 区服下拉选择 | BindingApply | FilterBar > el-select | server | TC-B-02 | 功能验证 |
| SSoT-4.4-03 | 角色ID文本输入 | BindingApply | FilterBar > el-input | roleId | TC-B-03 | 功能验证 |
| SSoT-4.4-04 | 申请人文本输入 | BindingApply | FilterBar > el-input | applicant | TC-B-04 | 功能验证 |
| SSoT-4.4-05 | 审核状态下拉选择 | BindingApply | FilterBar > el-select | status | TC-B-05 | 功能验证 |
| SSoT-4.4-06 | 申请时间日期范围选择 | BindingApply | FilterBar > el-date-picker | startDate, endDate | TC-B-06 | 功能验证 |

### 4.2 特殊按钮需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应路由 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------|----------------|----------|
| SSoT-4.4-07 | 归因修改申请快捷入口按钮 | BindingApply | el-button | /audit/new-attribution | TC-B-07 | 跳转验证 |

### 4.3 表格列需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口字段 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.4-08 | ID列 | BindingApply | DataTable > el-table-column | id | TC-B-08 | 数据显示验证 |
| SSoT-4.4-09 | 游戏项目列 | BindingApply | DataTable > el-table-column | project | TC-B-09 | 数据显示验证 |
| SSoT-4.4-10 | 角色ID列 | BindingApply | DataTable > el-table-column | roleId | TC-B-10 | 数据显示验证 |
| SSoT-4.4-11 | 区服列 | BindingApply | DataTable > el-table-column | server | TC-B-11 | 数据显示验证 |
| SSoT-4.4-12 | 申请人列 | BindingApply | DataTable > el-table-column | applicant | TC-B-12 | 数据显示验证 |
| SSoT-4.4-13 | 状态列(标签样式) | BindingApply | DataTable > el-tag | status | TC-B-13 | 样式+数据验证 |
| SSoT-4.4-14 | 申请时间列 | BindingApply | DataTable > el-table-column | applyTime | TC-B-14 | 数据显示验证 |
| SSoT-4.4-15 | 操作列(查看/编辑/删除) | BindingApply | DataTable > el-button | - | TC-B-15 | 功能验证 |

### 4.4 状态标签样式需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 样式规格 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------|----------------|----------|
| SSoT-4.4-16 | 未审核状态蓝色浅蓝背景 | BindingApply | el-tag type="info" | 文字蓝色,背景浅蓝 | TC-B-16 | 样式检查 |
| SSoT-4.4-17 | 审核通过绿色浅绿背景 | BindingApply | el-tag type="success" | 文字绿色,背景浅绿 | TC-B-17 | 样式检查 |
| SSoT-4.4-18 | 审核拒绝红色浅红背景 | BindingApply | el-tag type="danger" | 文字红色,背景浅红 | TC-B-18 | 样式检查 |

### 4.5 操作按钮需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应功能 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------|----------------|----------|
| SSoT-4.4-19 | 查看按钮蓝色#1890ff | BindingApply | el-button type="primary" link | 查看详情弹窗 | TC-B-19 | 样式+功能验证 |
| SSoT-4.4-20 | 编辑按钮绿色#52c41a | BindingApply | el-button type="success" link | 编辑弹窗 | TC-B-20 | 样式+功能验证 |
| SSoT-4.4-21 | 删除按钮红色#ff4d4f | BindingApply | el-button type="danger" link | 删除确认 | TC-B-21 | 样式+功能验证 |

---

## 五、新增归因更改需求追踪

### 5.1 表单字段需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 对应接口字段 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------------|----------------|----------|
| SSoT-4.5-01 | 角色ID文本输入(必填) | NewAttribution | el-form-item > el-input | roleId | TC-N-01 | 必填验证 |
| SSoT-4.5-02 | 区服下拉选择(必填) | NewAttribution | el-form-item > el-select | server | TC-N-02 | 必填验证 |
| SSoT-4.5-03 | 角色昵称文本输入(必填) | NewAttribution | el-form-item > el-input | nickname | TC-N-03 | 必填验证 |
| SSoT-4.5-04 | 一级平台下拉选择(必填) | NewAttribution | el-form-item > el-select | platform | TC-N-04 | 必填验证 |
| SSoT-4.5-05 | 组长下拉选择(必填) | NewAttribution | el-form-item > el-select | leader | TC-N-05 | 必填验证 |
| SSoT-4.5-06 | 组员下拉选择(必填) | NewAttribution | el-form-item > el-select | member | TC-N-06 | 必填验证 |
| SSoT-4.5-07 | 附件上传(非必填) | NewAttribution | ImageUpload | attachments | TC-N-07 | 上传功能验证 |

### 5.2 文件上传需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 配置值 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------|----------------|----------|
| SSoT-4.5-08 | 支持jpg/png格式 | NewAttribution | ImageUpload | accept=".jpg,.jpeg,.png" | TC-N-08 | 格式校验 |
| SSoT-4.5-09 | 单文件≤500KB | NewAttribution | ImageUpload | maxSize=512000 | TC-N-09 | 大小校验 |
| SSoT-4.5-10 | 最多10个文件 | NewAttribution | ImageUpload | limit=10 | TC-N-10 | 数量校验 |
| SSoT-4.5-11 | 拖拽区域虚线边框 | NewAttribution | ImageUpload | drag=true | TC-N-11 | 样式检查 |
| SSoT-4.5-12 | 拖拽区域尺寸100%×150px | NewAttribution | ImageUpload | - | TC-N-12 | 尺寸检查 |
| SSoT-4.5-13 | 预览缩略图100px×100px | NewAttribution | ImageUpload | - | TC-N-13 | 尺寸检查 |
| SSoT-4.5-14 | 预览图圆角4px | NewAttribution | ImageUpload | - | TC-N-14 | 样式检查 |

### 5.3 文件上传错误处理需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 错误提示 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------|----------------|----------|
| SSoT-4.5-15 | 格式不支持错误提示 | NewAttribution | ImageUpload | "只支持 jpg/png 格式的图片" | TC-N-15 | 错误提示验证 |
| SSoT-4.5-16 | 文件过大错误提示 | NewAttribution | ImageUpload | "文件大小不能超过 500KB" | TC-N-16 | 错误提示验证 |
| SSoT-4.5-17 | 数量超限错误提示 | NewAttribution | ImageUpload | "最多只能上传 10 个文件" | TC-N-17 | 错误提示验证 |
| SSoT-4.5-18 | 上传失败错误提示 | NewAttribution | ImageUpload | "文件上传失败，请重试" | TC-N-18 | 错误提示验证 |

### 5.4 文件上传状态显示需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 视觉表现 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------|----------------|----------|
| SSoT-4.5-19 | 上传中显示进度条 | NewAttribution | ImageUpload | 蓝色进度条 | TC-N-19 | 状态验证 |
| SSoT-4.5-20 | 上传成功显示绿色对勾 | NewAttribution | ImageUpload | 右上角绿色✓ | TC-N-20 | 状态验证 |
| SSoT-4.5-21 | 上传失败显示红色叉号 | NewAttribution | ImageUpload | 右上角红色✗ | TC-N-21 | 状态验证 |
| SSoT-4.5-22 | 悬停显示删除按钮 | NewAttribution | ImageUpload | 右上角×按钮 | TC-N-22 | 交互验证 |

### 5.5 表单规格需求

| SSoT条目ID | SSoT描述 | 对应页面 | 对应组件 | 配置值 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|--------|----------------|----------|
| SSoT-4.5-23 | 标签宽度100-120px | NewAttribution | el-form | label-width="120px" | TC-N-23 | 样式检查 |
| SSoT-4.5-24 | 输入框宽度300-400px | NewAttribution | el-input | style width | TC-N-24 | 样式检查 |
| SSoT-4.5-25 | 必填标识红色星号 | NewAttribution | el-form-item | required | TC-N-25 | 样式检查 |
| SSoT-4.5-26 | 圆角4px | NewAttribution | el-input | - | TC-N-26 | 样式检查 |
| SSoT-4.5-27 | 边框颜色#dcdfe6 | NewAttribution | el-input | - | TC-N-27 | 样式检查 |
| SSoT-4.5-28 | 聚焦边框#409eff | NewAttribution | el-input | - | TC-N-28 | 样式检查 |

---

## 六、通用组件需求追踪

### 6.1 侧边栏需求

| SSoT条目ID | SSoT描述 | 对应组件 | 配置值 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|--------|----------------|----------|
| SSoT-5.1-01 | 展开宽度220px | Sidebar | width: 220px | TC-S-01 | 像素测量 |
| SSoT-5.1-02 | 收起宽度64px | Sidebar | width: 64px | TC-S-02 | 像素测量 |
| SSoT-5.1-03 | 背景色#1e222d | Sidebar | background: #1e222d | TC-S-03 | 颜色检查 |
| SSoT-5.1-04 | 菜单项高度50px | Sidebar | height: 50px | TC-S-04 | 像素测量 |
| SSoT-5.1-05 | 子菜单项高度40px | Sidebar | height: 40px | TC-S-05 | 像素测量 |
| SSoT-5.1-06 | 激活项背景#409EFF | Sidebar | background: #409EFF | TC-S-06 | 颜色检查 |
| SSoT-5.1-07 | 图标大小18-20px | Sidebar | font-size: 16px | TC-S-07 | 尺寸检查 |
| SSoT-5.1-08 | 文字大小14px | Sidebar | font-size: 14px | TC-S-08 | 尺寸检查 |
| SSoT-5.1-09 | 一级菜单左内边距20px | Sidebar | padding-left: 20px | TC-S-09 | 像素测量 |
| SSoT-5.1-10 | 二级菜单左内边距40px | Sidebar | padding-left: 40px | TC-S-10 | 像素测量 |

### 6.2 顶部栏需求

| SSoT条目ID | SSoT描述 | 对应组件 | 配置值 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|--------|----------------|----------|
| SSoT-5.2-01 | 高度56px | Header | height: 56px | TC-H-01 | 像素测量 |
| SSoT-5.2-02 | 背景色#ffffff | Header | background: #ffffff | TC-H-02 | 颜色检查 |
| SSoT-5.2-03 | 底部边框1px solid #e8e8e8 | Header | border-bottom | TC-H-03 | 样式检查 |
| SSoT-5.2-04 | 左侧内边距20px | Header | padding-left: 20px | TC-H-04 | 像素测量 |
| SSoT-5.2-05 | 收缩按钮圆形灰色背景 | Header | - | TC-H-05 | 样式检查 |
| SSoT-5.2-06 | 面包屑分隔符> | Header | separator=">" | TC-H-06 | 样式检查 |

### 6.3 表格需求

| SSoT条目ID | SSoT描述 | 对应组件 | 配置值 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|--------|----------------|----------|
| SSoT-5.3-01 | 边框1px solid #ebeef5 | DataTable | border | TC-T-01 | 样式检查 |
| SSoT-5.3-02 | 表头背景#fafafa | DataTable | header-cell-style | TC-T-02 | 颜色检查 |
| SSoT-5.3-03 | 表头文字#606266 14px 600 | DataTable | header-cell-style | TC-T-03 | 样式检查 |
| SSoT-5.3-04 | 行高52px | DataTable | row-height: 52px | TC-T-04 | 像素测量 |
| SSoT-5.3-05 | 斑马纹偶数行#fafafa | DataTable | stripe | TC-T-05 | 颜色检查 |
| SSoT-5.3-06 | 悬停背景#f5f7fa | DataTable | highlight-current-row | TC-T-06 | 颜色检查 |
| SSoT-5.3-07 | 排序图标灰色/激活蓝色 | DataTable | - | TC-T-07 | 颜色检查 |
| SSoT-5.3-08 | 最小列宽80px | DataTable | min-width: 80px | TC-T-08 | 像素测量 |
| SSoT-5.3-09 | 操作列右固定 | DataTable | fixed="right" | TC-T-09 | 功能验证 |
| SSoT-5.3-10 | 空状态容器高度200px | DataTable | empty slot | TC-T-10 | 像素测量 |
| SSoT-5.3-11 | 空状态图标64px×64px灰色 | DataTable | el-empty | TC-T-11 | 样式检查 |
| SSoT-5.3-12 | 空状态文字"暂无数据" | DataTable | description | TC-T-12 | 文本验证 |

### 6.4 分页需求

| SSoT条目ID | SSoT描述 | 对应组件 | 配置值 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|--------|----------------|----------|
| SSoT-5.8-01 | 位置表格底部右对齐 | Pagination | justify-content: flex-end | TC-P-01 | 样式检查 |
| SSoT-5.8-02 | margin-top: 16px | Pagination | margin-top: 16px | TC-P-02 | 像素测量 |
| SSoT-5.8-03 | 布局包含total/sizes/prev/pager/next/jumper | Pagination | layout | TC-P-03 | 功能验证 |
| SSoT-5.8-04 | 每页条数选项[10,20,50,100] | Pagination | page-sizes | TC-P-04 | 选项验证 |
| SSoT-5.8-05 | 默认每页20条 | Pagination | page-size: 20 | TC-P-05 | 默认值验证 |
| SSoT-5.8-06 | 当前页高亮背景#409eff文字#ffffff | Pagination | - | TC-P-06 | 样式检查 |

### 6.5 消息提示需求

| SSoT条目ID | SSoT描述 | 对应组件 | 配置值 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|--------|----------------|----------|
| SSoT-5.9-01 | success类型绿色对勾3000ms | ElMessage | type="success" duration=3000 | TC-M-01 | 样式+时长验证 |
| SSoT-5.9-02 | warning类型橙色三角5000ms | ElMessage | type="warning" duration=5000 | TC-M-02 | 样式+时长验证 |
| SSoT-5.9-03 | error类型红色叉号5000ms | ElMessage | type="error" duration=5000 | TC-M-03 | 样式+时长验证 |
| SSoT-5.9-04 | info类型蓝色圆圈3000ms | ElMessage | type="info" duration=3000 | TC-M-04 | 样式+时长验证 |

---

## 七、路由需求追踪

| SSoT条目ID | SSoT描述 | 路由路径 | 组件路径 | meta.title | meta.icon | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|------------|-----------|----------------|----------|
| SSoT-8-01 | 根路由重定向到dashboard | / → /dashboard | - | - | - | TC-RT-01 | 路由跳转验证 |
| SSoT-8-02 | 概要面板路由 | /dashboard | @/views/Dashboard/index.vue | 概要面板 | House | TC-RT-02 | 路由访问验证 |
| SSoT-8-03 | 玩家数据报表父路由 | /player-data | - | 玩家数据报表 | DataLine | TC-RT-03 | 菜单展示验证 |
| SSoT-8-04 | 角色列表路由 | /player-data/role-list | @/views/PlayerData/RoleList.vue | 角色列表 | - | TC-RT-04 | 路由访问验证 |
| SSoT-8-05 | 订单列表路由 | /player-data/order-list | @/views/PlayerData/OrderList.vue | 订单列表 | - | TC-RT-05 | 路由访问验证 |
| SSoT-8-06 | 审核父路由 | /audit | - | 审核 | Checked | TC-RT-06 | 菜单展示验证 |
| SSoT-8-07 | 绑定申请路由 | /audit/binding-apply | @/views/Audit/BindingApply.vue | 绑定申请 | - | TC-RT-07 | 路由访问验证 |
| SSoT-8-08 | 新增归因更改路由 | /audit/new-attribution | @/views/Audit/NewAttribution.vue | 新增归因更改 | - | TC-RT-08 | 路由访问验证 |

---

## 八、接口需求追踪

| SSoT条目ID | SSoT描述 | 接口路径 | 方法 | 请求参数 | 响应字段 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|------|----------|----------|----------------|----------|
| SSoT-9.1-01 | Dashboard统计接口 | /api/dashboard/statistics | GET | - | today/monthly/total | TC-API-01 | 接口响应验证 |
| SSoT-9.2-01 | 角色列表接口 | /api/player/roles | GET | 筛选+分页+排序参数 | list/total/page/pageSize | TC-API-02 | 接口响应验证 |
| SSoT-9.3-01 | 订单列表接口 | /api/player/orders | GET | 筛选+分页+排序参数 | list/total/totalAmount/page/pageSize | TC-API-03 | 接口响应验证 |
| SSoT-9.4-01 | 绑定申请列表接口 | /api/audit/binding-applies | GET | 筛选+分页参数 | list/total/page/pageSize | TC-API-04 | 接口响应验证 |
| SSoT-9.4-02 | 新增绑定申请接口 | /api/audit/binding-applies | POST | 表单字段 | id | TC-API-05 | 接口响应验证 |
| SSoT-9.4-03 | 更新绑定申请接口 | /api/audit/binding-applies/:id | PUT | status/remark | - | TC-API-06 | 接口响应验证 |
| SSoT-9.4-04 | 删除绑定申请接口 | /api/audit/binding-applies/:id | DELETE | - | - | TC-API-07 | 接口响应验证 |

---

## 九、交互需求追踪

### 9.1 导航交互

| SSoT条目ID | SSoT描述 | 对应组件 | 交互行为 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------------|----------|
| SSoT-6.1-01 | 点击无子菜单的一级菜单直接跳转 | Sidebar | router.push + 高亮 | TC-I-01 | 交互验证 |
| SSoT-6.1-02 | 点击有子菜单的一级菜单展开/收起 | Sidebar | 展开收起动画 | TC-I-02 | 交互验证 |
| SSoT-6.1-03 | 点击二级菜单跳转并高亮 | Sidebar | router.push + 高亮 | TC-I-03 | 交互验证 |
| SSoT-6.1-04 | 点击收缩按钮折叠侧边栏 | Header | 宽度变化动画 | TC-I-04 | 交互验证 |

### 9.2 表格交互

| SSoT条目ID | SSoT描述 | 对应组件 | 交互行为 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------------|----------|
| SSoT-6.2-01 | 鼠标悬停行背景变浅灰 | DataTable | hover效果 | TC-I-05 | 样式验证 |
| SSoT-6.2-02 | 点击排序图标升序/降序排列 | DataTable | 排序切换 | TC-I-06 | 功能验证 |
| SSoT-6.2-03 | 点击操作按钮执行对应操作 | DataTable | 查看/编辑/删除 | TC-I-07 | 功能验证 |
| SSoT-6.2-04 | 滚动时表头固定 | DataTable | 粘性表头 | TC-I-08 | 交互验证 |

### 9.3 表单交互

| SSoT条目ID | SSoT描述 | 对应组件 | 交互行为 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------------|----------|
| SSoT-6.3-01 | 输入框聚焦边框变蓝 | el-input | focus效果 | TC-I-09 | 样式验证 |
| SSoT-6.3-02 | 必填字段未填显示红色错误提示 | el-form-item | 验证错误 | TC-I-10 | 样式验证 |
| SSoT-6.3-03 | 文件拖入上传区高亮 | ImageUpload | dragover效果 | TC-I-11 | 样式验证 |
| SSoT-6.3-04 | 上传成功显示缩略图和绿色勾选 | ImageUpload | 成功状态 | TC-I-12 | 状态验证 |

### 9.4 按钮交互

| SSoT条目ID | SSoT描述 | 对应组件 | 交互行为 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------------|----------|
| SSoT-6.4-01 | 悬停颜色加深10% | el-button | hover效果 | TC-I-13 | 样式验证 |
| SSoT-6.4-02 | 点击颜色加深20% | el-button | active效果 | TC-I-14 | 样式验证 |
| SSoT-6.4-03 | 禁用透明度50%+not-allowed | el-button | disabled效果 | TC-I-15 | 样式验证 |
| SSoT-6.4-04 | 加载中显示旋转图标禁止点击 | el-button | loading效果 | TC-I-16 | 状态验证 |

### 9.5 防重复提交

| SSoT条目ID | SSoT描述 | 对应组件 | 交互行为 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|----------|----------------|----------|
| SSoT-6.5-01 | 表单提交按钮点击后禁用+loading | 表单提交按钮 | 防重复提交 | TC-I-17 | 状态验证 |
| SSoT-6.5-02 | 搜索按钮请求期间禁用 | 查询按钮 | 防重复请求 | TC-I-18 | 状态验证 |
| SSoT-6.5-03 | 删除确认按钮点击后禁用 | 删除确认按钮 | 防重复操作 | TC-I-19 | 状态验证 |
| SSoT-6.5-04 | 导出按钮点击后禁用5秒 | 导出按钮 | 防重复导出 | TC-I-20 | 时长验证 |

---

## 十、图标映射追踪

| SSoT条目ID | SSoT描述 | 图标名称 | Element Plus Icons | 使用位置 | 对应测试用例ID | 验收证据 |
|------------|----------|----------|-------------------|----------|----------------|----------|
| SSoT-10.1-01 | 概要面板图标 | House | @element-plus/icons-vue/House | 侧边栏菜单 | TC-IC-01 | 图标显示验证 |
| SSoT-10.1-02 | 玩家数据报表图标 | DataLine | @element-plus/icons-vue/DataLine | 侧边栏菜单 | TC-IC-02 | 图标显示验证 |
| SSoT-10.1-03 | 审核图标 | Checked | @element-plus/icons-vue/Checked | 侧边栏菜单 | TC-IC-03 | 图标显示验证 |
| SSoT-10.1-04 | 查询图标 | Search | @element-plus/icons-vue/Search | 查询按钮 | TC-IC-04 | 图标显示验证 |
| SSoT-10.1-05 | 清空图标 | Delete | @element-plus/icons-vue/Delete | 清空按钮 | TC-IC-05 | 图标显示验证 |
| SSoT-10.1-06 | 导出图标 | Download | @element-plus/icons-vue/Download | 导出按钮 | TC-IC-06 | 图标显示验证 |
| SSoT-10.1-07 | 打印图标 | Printer | @element-plus/icons-vue/Printer | 顶部栏按钮 | TC-IC-07 | 图标显示验证 |
| SSoT-10.1-08 | 返回图标 | ArrowLeft | @element-plus/icons-vue/ArrowLeft | 返回按钮 | TC-IC-08 | 图标显示验证 |
| SSoT-10.1-09 | 展开图标 | ArrowDown | @element-plus/icons-vue/ArrowDown | 菜单展开 | TC-IC-09 | 图标显示验证 |
| SSoT-10.1-10 | 收起图标 | ArrowUp | @element-plus/icons-vue/ArrowUp | 菜单收起 | TC-IC-10 | 图标显示验证 |

---

## 十一、追踪统计

### 11.1 需求覆盖统计

| 模块 | SSoT条目数 | 已追踪数 | 覆盖率 |
|------|-----------|----------|--------|
| Dashboard | 23 | 23 | 100% |
| 角色列表 | 27 | 27 | 100% |
| 订单列表 | 26 | 26 | 100% |
| 绑定申请 | 21 | 21 | 100% |
| 新增归因更改 | 28 | 28 | 100% |
| 侧边栏 | 10 | 10 | 100% |
| 顶部栏 | 6 | 6 | 100% |
| 表格 | 12 | 12 | 100% |
| 分页 | 6 | 6 | 100% |
| 消息提示 | 4 | 4 | 100% |
| 路由 | 8 | 8 | 100% |
| 接口 | 7 | 7 | 100% |
| 交互 | 20 | 20 | 100% |
| 图标 | 10 | 10 | 100% |
| **总计** | **208** | **208** | **100%** |

### 11.2 测试用例覆盖统计

| 测试类型 | 用例数 | 说明 |
|----------|--------|------|
| Dashboard测试 | TC-D-01 ~ TC-D-23 | 23条 |
| 角色列表测试 | TC-R-01 ~ TC-R-27 | 27条 |
| 订单列表测试 | TC-O-01 ~ TC-O-26 | 26条 |
| 绑定申请测试 | TC-B-01 ~ TC-B-21 | 21条 |
| 新增归因更改测试 | TC-N-01 ~ TC-N-28 | 28条 |
| 侧边栏测试 | TC-S-01 ~ TC-S-10 | 10条 |
| 顶部栏测试 | TC-H-01 ~ TC-H-06 | 6条 |
| 表格测试 | TC-T-01 ~ TC-T-12 | 12条 |
| 分页测试 | TC-P-01 ~ TC-P-06 | 6条 |
| 消息提示测试 | TC-M-01 ~ TC-M-04 | 4条 |
| 路由测试 | TC-RT-01 ~ TC-RT-08 | 8条 |
| 接口测试 | TC-API-01 ~ TC-API-07 | 7条 |
| 交互测试 | TC-I-01 ~ TC-I-20 | 20条 |
| 图标测试 | TC-IC-01 ~ TC-IC-10 | 10条 |
| **总计** | **208条** | 与SSoT条目1:1对应 |

---

**文档版本**：v1.0  
**生成时间**：2026-02-03  
**架构师签章**：AI Architect
