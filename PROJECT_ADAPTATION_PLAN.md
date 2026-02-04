# Suzaku Gaming 项目适配实施规划报告

**文档版本**: v2.3.0  
**生成日期**: 2026-02-04  
**文档性质**: 基于现有项目状态的数据接入与功能完善规划  
**更新说明**: 
- v2.0 新增 CPS 公会绑定模块、ThinkingData API 详细规范、组织架构管理
- v2.1 修正 CSV 字段映射、幂等性逻辑、Schema 增量合并、权限迁移策略、API 路径统一、导出接口补齐
- v2.2 修正 Order.rechargeType 遗漏、CPS 复用方案、技术栈版本统一、新增 CpsLoginLog 表
- v2.3 架构师审查修正：回滚预案、分布式锁、唯一约束、数据标准化函数

---

## ⚠️ 关键修正说明（v2.1 新增）

本节汇总了现有代码与报告方案之间的差异，**必须优先处理**，否则会导致落地阻塞。

### 修正 1：CSV 字段名与现有 ETL 脚本不匹配

**问题**：现有脚本字段名与实际 CSV 不一致

| 现有脚本字段 | 实际 CSV 字段 | 影响 |
|-------------|--------------|------|
| `#role_id` | `role_id` | 角色导入失败 |
| `#server_id` | `server_id` | 服务器 ID 丢失 |
| `#system` | `dev_type` | 设备类型丢失 |
| `pay_amount` | `pay_amount_usd` | 订单金额为空 |

**修正方案**：更新 `scripts/etl/import-roles.ts` 和 `scripts/etl/import-orders.ts` 的字段映射，详见 §4.2。

### 修正 2：订单导入幂等性风险

**问题**：当前逻辑使用 `increment` 累加角色充值统计，重复导入会放大数据。

```typescript
// ❌ 现有问题代码
await prisma.role.update({
  where: { roleId },
  data: {
    totalRechargeUsd: { increment: orderData.payAmountUsd },
    totalRechargeTimes: { increment: 1 },
  },
});
```

**修正方案**：改为"仅在新增订单时更新统计"或"导入后重新汇总计算"，详见 §4.3.3。

### 修正 3：Schema 变更为增量合并

**问题**：报告方案直接替换模型会丢失现有字段。

**现有字段保留清单**：
- `Role.combatPower` - 已有数据，必须保留
- `Order.rechargeType` - 已有默认值 `cash`，必须保留
- `Order.payChannel` - 已有数据，必须保留

**修正方案**：Schema 变更采用增量合并，新字段给默认值，详见 §3.1。

### 修正 4：权限体系迁移策略

**问题**：现有权限依赖 `AdminUser.role` 字符串 + `RolesGuard`，与报告的 `level/parentId` 方案不对齐。

**迁移映射**：
| 现有 role | 新 level | 说明 |
|-----------|----------|------|
| `admin` | 0 | 运营管理员 |
| `manager` | 1 | 组长 |
| `operator` | 2 | 组员 |

**修正方案**：保留 `role` 字段并新增 `level/parentId`，逐步迁移，详见 §7.2。

### 修正 5：ThinkingData API 路径统一

**问题**：现有服务使用 `/open/v1/query_sql`，报告写的是 `/querySql`。

**确认**：实际 API 路径为 `/open/v1/query_sql`（已在代码中使用），报告需统一。

### 修正 6：导出接口缺失

**问题**：前端调用 `/player/roles/export` 和 `/audit/binding-applies/export`，但后端缺失这些接口。

**修正方案**：在 Phase 6 中补齐导出接口，详见 §9.6。

### 修正 7：技术栈版本确认

**当前实际版本（保持不变）**：
- Vue: `3.4.21`
- Element Plus: `2.6.1`
- Pinia: `2.1.7`

---

## 第一部分：项目现状分析

### 1.1 技术栈确认

| 层级 | 技术选型 | 状态 |
|------|---------|------|
| 前端框架 | Vue 3.4.21 + TypeScript | ✅ 已实现 |
| UI 组件库 | Element Plus 2.6.1 | ✅ 已实现 |
| 状态管理 | Pinia | ✅ 已实现 |
| HTTP 客户端 | Axios | ✅ 已实现 |
| 后端框架 | NestJS 11 | ✅ 已实现 |
| ORM | Prisma 5.22 | ✅ 已实现 |
| 数据库 | PostgreSQL 15+ | ✅ 已配置 |
| 缓存 | Redis 7+ | ⏳ 待启用 |

### 1.2 现有模块清单

| 模块 | 后端 API | 前端页面 | Mock 数据 | 状态 |
|------|----------|---------|----------|------|
| 认证 (Auth) | ✅ | ✅ | ✅ | 完成 |
| 仪表盘 (Dashboard) | ✅ | ✅ | ✅ | 完成 |
| 玩家数据 (Player) | ✅ | ✅ | ✅ | 完成 |
| 审核管理 (Audit) | ✅ | ✅ | ✅ | 完成 |
| ThinkingData 同步 | ✅ | ⏳ | ❌ | 部分完成 |
| CSV ETL | ⏳ | ❌ | ❌ | 待实现 |

### 1.3 API 路由清单

```
后端已注册路由：
├── /api/health                          GET   - 健康检查
├── /api/auth/login                      POST  - 用户登录
├── /api/auth/profile                    GET   - 获取用户信息
├── /api/auth/logout                     POST  - 用户登出
├── /api/dashboard/statistics            GET   - 仪表盘统计
├── /api/player/roles                    GET   - 角色列表
├── /api/player/orders                   GET   - 订单列表
├── /api/audit/binding-applies           GET   - 绑定申请列表
├── /api/audit/binding-applies/:id       GET   - 绑定申请详情
├── /api/audit/binding-applies           POST  - 创建绑定申请
├── /api/audit/binding-applies/:id/review POST - 审核绑定申请
├── /api/sync/thinkingdata/trigger       POST  - 手动触发同步
└── /api/sync/thinkingdata/status        GET   - 同步状态
```

---

## 第二部分：原始数据字段分析

### 2.1 角色数据字段映射 (role_create 事件)

基于 CSV 文件 `20260204_014715_06858_y9rrj.csv` 分析：

| CSV 原始字段 | 数据类型 | 示例值 | 映射到数据库字段 | 说明 |
|-------------|---------|--------|-----------------|------|
| `#user_id` | String | 1468480584622804992 | `user_id` | ThinkingData 用户ID |
| `#account_id` | String | 9000310004564 | `account_id` | 游戏账号ID |
| `role_id` | String | 9000310004564 | `role_id` (主键) | 角色唯一标识 |
| `role_name` | String | (可为空) | `role_name` | 角色名称 |
| `role_level` | Int | 1 | `role_level` | 角色等级 |
| `vip_level` | Int | 0 | `vip_level` | VIP等级 |
| `server_id` | Int | 31 | `server_id` | 服务器ID |
| `server_name` | String | S31 | `server_name` | 服务器名称 |
| `#country` | String | 俄罗斯 | `country` | 国家名称 |
| `#country_code` | String | RU | `country_code` | 国家代码 |
| `#province` | String | 莫斯科 | `province` | 省份/州 |
| `#city` | String | 莫斯科 | `city` | 城市 |
| `#ip` | String | 178.173.102.6 | `register_ip` | 注册IP |
| `dev_type` | String | Android/IPhonePlayer | `device_type` | 设备类型 |
| `dev_model` | String | HUAWEI JLN-LX1 | `device_model` | 设备型号 |
| `channel_id` | Int | 32 | `channel_id` | 渠道ID |
| `package_id` | Int | 140 | `package_id` | 包ID (新增) |
| `app_version` | String | 1.0.32 | `app_version` | 应用版本 |
| `total_recharge_usd` | Decimal | 0 | `total_recharge_usd` | 累计充值(USD) |
| `total_recharge_cny` | Decimal | (空) | `total_recharge_cny` | 累计充值(CNY) (新增) |
| `total_recharge_times` | Int | 0 | `total_recharge_times` | 充值次数 |
| `total_login_days` | Int | 0 | `total_login_days` | 登录天数 |
| `total_online_time` | Int | 0 | `total_online_time` | 在线时长(秒) |
| `vip_exp` | Int | 0 | `vip_exp` | VIP经验 (新增) |
| `headquarters_lv` | Int | 0 | `headquarters_lv` | 总部等级 (新增) |
| `#event_time` | DateTime | 2026-02-04 05:37:14.799 | `register_time` | 注册时间 |
| `faction_name` | String | (空) | `faction_name` | 联盟名称 (新增) |
| `faction_level` | Int | 1 | `faction_level` | 联盟等级 (新增) |

**游戏特有字段（建议作为 JSON 存储或新增列）：**

| CSV 原始字段 | 说明 | 建议处理方式 |
|-------------|------|-------------|
| `steel_plant` | 钢厂 | JSON: game_buildings |
| `oil_plant` | 油厂 | JSON: game_buildings |
| `power_plant` | 电厂 | JSON: game_buildings |
| `missile_factory_lv` | 导弹工厂等级 | JSON: game_buildings |
| `naval_academy_lv` | 海军学院等级 | JSON: game_buildings |
| `manu_factory_lv` | 制造工厂等级 | JSON: game_buildings |
| `aircraft_factory_lv` | 飞机工厂等级 | JSON: game_buildings |
| `torpedo_factory_lv` | 鱼雷工厂等级 | JSON: game_buildings |
| `coastal_comand_lv` | 海岸指挥等级 | JSON: game_buildings |
| `warehouse_lv` | 仓库等级 | JSON: game_buildings |
| `remain_diamond` | 剩余钻石 | JSON: game_resources |
| `remain_power` | 剩余电量 | JSON: game_resources |
| `remain_steel` | 剩余钢铁 | JSON: game_resources |
| `remain_oil` | 剩余石油 | JSON: game_resources |
| `remain_rare_earth` | 剩余稀土 | JSON: game_resources |
| `role_ap` | 角色AP | JSON: game_stats |
| `role_bp` | 角色BP | JSON: game_stats |
| `base_coordinate` | 基地坐标 | JSON: game_position |
| `base_seas_id` | 基地海域ID | JSON: game_position |

### 2.2 订单数据字段映射 (recharge_complete 事件)

基于 CSV 文件 `20260204_014828_06863_y9rrj.csv` 分析：

| CSV 原始字段 | 数据类型 | 映射到数据库字段 | 说明 |
|-------------|---------|-----------------|------|
| `game_order_id` | String | `order_id` (主键) | 游戏订单ID |
| `role_id` | String | `role_id` | 角色ID (外键) |
| `role_name` | String | `role_name` | 角色名称 |
| `role_level` | Int | `role_level` | 下单时角色等级 |
| `server_id` | Int | `server_id` | 服务器ID |
| `server_name` | String | `server_name` | 服务器名称 |
| `#country` | String | `country` | 国家 |
| `dev_type` | String | `device_type` | 设备类型 |
| `channel_id` | Int | `channel_id` | 渠道ID |
| `goods_id` | String | `goods_id` | 商品ID |
| `goods_price` | Decimal | `goods_price` | 商品原价 |
| `goods_currency` | String | `goods_currency` | 商品货币 |
| `pay_amount_usd` | Decimal | `pay_amount_usd` | 实付金额(USD) |
| `currency_type` | String | `currency_type` | 支付货币类型 |
| `currency_amount` | Decimal | `currency_amount` | 支付货币金额 |
| `is_sandbox` | Boolean | `is_sandbox` | 是否沙盒订单 |
| `#event_time` | DateTime | `pay_time` | 支付时间 |
| `reward` | JSON | `reward_info` | 奖励内容 (新增) |
| `giftpack` | JSON | `giftpack_info` | 礼包内容 (新增) |

---

## 第三部分：数据库 Schema 优化方案

### ⚠️ Schema 变更策略：增量合并

**核心原则**：保留所有现有字段，仅新增字段，确保迁移可回滚。

**现有字段保留清单**（不可删除/修改类型）：

| 字段 | 现有定义 | 状态 |
|------|---------|------|
| `Role.combatPower` | `Int @default(0)` | ✅ 保留 |
| `Order.rechargeType` | `String @default("cash")` | ✅ 保留 |
| `Order.payChannel` | `String?` | ✅ 保留 |

### 3.1 Role 模型优化

```prisma
model Role {
  // === 基础标识 ===
  id                 Int       @id @default(autoincrement())
  roleId             String    @unique @map("role_id") @db.VarChar(50)
  userId             String?   @map("user_id") @db.VarChar(50)        // 新增: ThinkingData 用户ID
  accountId          String?   @map("account_id") @db.VarChar(50)
  
  // === 角色信息 ===
  roleName           String?   @map("role_name") @db.VarChar(100)
  roleLevel          Int       @default(1) @map("role_level")
  vipLevel           Int       @default(0) @map("vip_level")
  combatPower        Int       @default(0) @map("combat_power")       // ⚠️ 现有字段，保留
  vipExp             Int       @default(0) @map("vip_exp")            // 新增
  headquartersLv     Int       @default(0) @map("headquarters_lv")    // 新增
  
  // === 服务器信息 ===
  serverId           Int       @map("server_id")
  serverName         String?   @map("server_name") @db.VarChar(50)
  currentServerId    Int?      @map("current_server_id")              // 新增
  serverZoneOffset   Int?      @map("server_zone_offset")             // 新增
  serverAliveDays    Int?      @map("server_alive_days")              // 新增
  
  // === 地理信息 ===
  country            String?   @db.VarChar(50)
  countryCode        String?   @map("country_code") @db.VarChar(10)
  city               String?   @db.VarChar(50)
  province           String?   @db.VarChar(50)
  
  // === 设备信息 ===
  deviceType         String?   @map("device_type") @db.VarChar(20)    // Android/iOS
  deviceModel        String?   @map("device_model") @db.VarChar(100)
  appVersion         String?   @map("app_version") @db.VarChar(20)
  registerIp         String?   @map("register_ip") @db.VarChar(50)
  
  // === 渠道信息 ===
  channelId          Int?      @map("channel_id")
  packageId          Int?      @map("package_id")                     // 新增
  
  // === 充值数据 ===
  totalRechargeUsd   Decimal   @default(0) @map("total_recharge_usd") @db.Decimal(12, 2)
  totalRechargeCny   Decimal   @default(0) @map("total_recharge_cny") @db.Decimal(12, 2)  // 新增
  totalRechargeTimes Int       @default(0) @map("total_recharge_times")
  
  // === 活跃数据 ===
  totalLoginDays     Int       @default(0) @map("total_login_days")
  totalOnlineTime    Int       @default(0) @map("total_online_time")  // 秒
  
  // === 联盟数据 ===
  factionName        String?   @map("faction_name") @db.VarChar(100)  // 新增
  factionLevel       Int?      @map("faction_level")                  // 新增
  factionExp         Int?      @map("faction_exp")                    // 新增
  
  // === 游戏数据 (JSON) ===
  gameBuildings      Json?     @map("game_buildings")                 // 新增: 建筑数据
  gameResources      Json?     @map("game_resources")                 // 新增: 资源数据
  gameStats          Json?     @map("game_stats")                     // 新增: 角色数值
  gamePosition       Json?     @map("game_position")                  // 新增: 位置数据
  
  // === 时间戳 ===
  registerTime       DateTime  @map("register_time")
  lastLoginTime      DateTime? @map("last_login_time")
  lastUpdateTime     DateTime? @map("last_update_time")
  status             String    @default("active") @db.VarChar(20)
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  // === 关联 ===
  orders Order[]

  // === 索引 ===
  @@index([serverId])
  @@index([countryCode])
  @@index([channelId])
  @@index([packageId])
  @@index([registerTime])
  @@index([deviceType])
  @@index([status])
  @@index([userId])
  @@map("roles")
}
```

### 3.2 Order 模型优化

```prisma
model Order {
  id             Int      @id @default(autoincrement())
  orderId        String   @unique @map("order_id") @db.VarChar(100)
  roleId         String   @map("role_id") @db.VarChar(50)
  
  // === 角色快照 ===
  roleName       String?  @map("role_name") @db.VarChar(100)
  roleLevel      Int?     @map("role_level")
  serverId       Int      @map("server_id")
  serverName     String?  @map("server_name") @db.VarChar(50)
  country        String?  @db.VarChar(50)
  deviceType     String?  @map("device_type") @db.VarChar(20)
  channelId      Int?     @map("channel_id")
  
  // === 商品信息 ===
  goodsId        String?  @map("goods_id") @db.VarChar(50)
  goodsPrice     Decimal? @map("goods_price") @db.Decimal(12, 2)
  goodsCurrency  String?  @map("goods_currency") @db.VarChar(10)
  
  // === 支付信息 ===
  payAmountUsd   Decimal  @map("pay_amount_usd") @db.Decimal(12, 2)
  currencyType   String?  @map("currency_type") @db.VarChar(10)
  currencyAmount Decimal? @map("currency_amount") @db.Decimal(12, 2)
  rechargeType   String   @default("cash") @map("recharge_type") @db.VarChar(20)  // ⚠️ 现有字段，保留
  payChannel     String?  @map("pay_channel") @db.VarChar(20)                     // ⚠️ 现有字段，保留
  isSandbox      Boolean  @default(false) @map("is_sandbox")
  
  // === 奖励信息 (新增) ===
  rewardInfo     Json?    @map("reward_info")
  giftpackInfo   Json?    @map("giftpack_info")
  
  // === 时间戳 ===
  payTime        DateTime @map("pay_time")
  createdAt      DateTime @default(now()) @map("created_at")

  // === 关联 ===
  role Role @relation(fields: [roleId], references: [roleId])

  // === 索引 ===
  @@index([roleId])
  @@index([serverId])
  @@index([payTime])
  @@index([channelId])
  @@index([isSandbox])
  @@index([goodsId])
  @@map("orders")
}
```

---

## 第四部分：ETL 数据导入实施方案

### 4.1 CSV 导入流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     CSV ETL 数据流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  CSV文件  │───▶│  解析器   │───▶│  清洗器   │───▶│  写入器   │  │
│  │ (原始数据) │    │(csv-parse)│    │(字段映射) │    │(Prisma)  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                 │
│  处理策略：                                                       │
│  1. 流式读取 - 支持大文件                                          │
│  2. 批量写入 - 每 500 条一批                                       │
│  3. 幂等保证 - ON CONFLICT DO UPDATE                              │
│  4. 错误隔离 - 单条失败不影响整批                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 角色数据导入脚本规格

**脚本路径**: `scripts/etl/import-roles.ts`

**⚠️ 现有脚本字段修正**：

现有脚本 `RoleCSVRow` 接口需要修改以匹配实际 CSV：

```typescript
// ❌ 现有错误字段          →  ✅ 修正后字段
'#role_id'                 →  'role_id'
'#server_id'               →  'server_id'  
'#system'                  →  'dev_type'
'#device_model'            →  'dev_model'
'#channel_id'              →  'channel_id'
'#app_version'             →  'app_version'
```

**核心逻辑**:

```typescript
// 字段映射配置（已与实际 CSV 对齐）
const ROLE_FIELD_MAPPING = {
  // 基础字段（注意：CSV 中字段名无 # 前缀）
  'role_id': 'roleId',                    // 实际: role_id（无#）
  '#user_id': 'userId',                   // 实际: #user_id（有#）
  '#account_id': 'accountId',             // 实际: #account_id（有#）
  'role_name': 'roleName',
  'role_level': { field: 'roleLevel', type: 'int', default: 1 },
  'vip_level': { field: 'vipLevel', type: 'int', default: 0 },
  'vip_exp': { field: 'vipExp', type: 'int', default: 0 },
  'headquarters_lv': { field: 'headquartersLv', type: 'int', default: 0 },
  
  // 服务器
  'server_id': { field: 'serverId', type: 'int', required: true },
  'server_name': 'serverName',
  'current_server_id': { field: 'currentServerId', type: 'int' },
  'server_zone_offset': { field: 'serverZoneOffset', type: 'int' },
  'server_alive_days': { field: 'serverAliveDays', type: 'int' },
  
  // 地理
  '#country': 'country',
  '#country_code': 'countryCode',
  '#city': 'city',
  '#province': 'province',
  '#ip': 'registerIp',
  
  // 设备
  'dev_type': { field: 'deviceType', transform: normalizeDeviceType },
  'dev_model': 'deviceModel',
  'app_version': 'appVersion',
  
  // 渠道
  'channel_id': { field: 'channelId', type: 'int' },
  'package_id': { field: 'packageId', type: 'int' },
  
  // 充值
  'total_recharge_usd': { field: 'totalRechargeUsd', type: 'decimal', default: 0 },
  'total_recharge_cny': { field: 'totalRechargeCny', type: 'decimal', default: 0 },
  'total_recharge_times': { field: 'totalRechargeTimes', type: 'int', default: 0 },
  
  // 活跃
  'total_login_days': { field: 'totalLoginDays', type: 'int', default: 0 },
  'total_online_time': { field: 'totalOnlineTime', type: 'int', default: 0 },
  
  // 联盟
  'faction_name': 'factionName',
  'faction_level': { field: 'factionLevel', type: 'int' },
  'faction_exp': { field: 'factionExp', type: 'int' },
  
  // 时间
  '#event_time': { field: 'registerTime', type: 'datetime', required: true },
};

// 设备类型标准化（不区分大小写）
function normalizeDeviceType(value: string): string {
  if (!value) return 'unknown';
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('android')) return 'Android';
  if (lowerValue.includes('iphone') || lowerValue.includes('ipad') || lowerValue.includes('ios')) return 'iOS';
  // 处理 IPhonePlayer 等混合大小写情况
  if (lowerValue.includes('iphoneplayer')) return 'iOS';
  return value;
}

// JSON 字段聚合
function buildGameBuildings(row: any): object {
  return {
    steelPlant: parseInt(row['steel_plant']) || 0,
    oilPlant: parseInt(row['oil_plant']) || 0,
    powerPlant: parseInt(row['power_plant']) || 0,
    missileFactoryLv: parseInt(row['missile_factory_lv']) || 0,
    navalAcademyLv: parseInt(row['naval_academy_lv']) || 0,
    manuFactoryLv: parseInt(row['manu_factory_lv']) || 0,
    aircraftFactoryLv: parseInt(row['aircraft_factory_lv']) || 0,
    torpedoFactoryLv: parseInt(row['torpedo_factory_lv']) || 0,
    coastalComandLv: parseInt(row['coastal_comand_lv']) || 0,
    warehouseLv: parseInt(row['warehouse_lv']) || 0,
  };
}

function buildGameResources(row: any): object {
  return {
    remainDiamond: parseInt(row['remain_diamond']) || 0,
    remainPower: parseInt(row['remain_power']) || 0,
    remainSteel: parseInt(row['remain_steel']) || 0,
    remainOil: parseInt(row['remain_oil']) || 0,
    remainRareEarth: parseInt(row['remain_rare_earth']) || 0,
  };
}

function buildGameStats(row: any): object {
  return {
    roleAp: parseInt(row['role_ap']) || 0,
    roleBp: parseInt(row['role_bp']) || 0,
    worldProgressPhase: parseInt(row['world_progress_ptase']) || 0,
    empireStageId: parseInt(row['empire_stage_id']) || 0,
    expeditionStageId: parseInt(row['expedition_stage_id']) || 0,
  };
}

function buildGamePosition(row: any): object | null {
  const coordinate = row['base_coordinate'];
  const seasId = row['base_seas_id'];
  if (!coordinate && !seasId) return null;
  
  let parsedCoordinate = null;
  if (coordinate) {
    try {
      parsedCoordinate = JSON.parse(coordinate);
    } catch (e) {
      parsedCoordinate = coordinate;
    }
  }
  
  return {
    baseCoordinate: parsedCoordinate,
    baseSeasId: parseInt(seasId) || null,
  };
}
```

### 4.3 订单数据导入脚本规格

**脚本路径**: `scripts/etl/import-orders.ts`

**⚠️ 现有脚本字段修正**：

```typescript
// ❌ 现有错误字段          →  ✅ 修正后字段
'#role_id'                 →  'role_id'
'#server_id'               →  'server_id'
'#system'                  →  'dev_type'
'pay_amount'               →  'pay_amount_usd'    // 关键！
'#pay_channel'             →  'recharge_channel'  // CSV 中实际字段名
```

**核心逻辑**:

```typescript
// 字段映射配置（已与实际 CSV 对齐）
const ORDER_FIELD_MAPPING = {
  'game_order_id': { field: 'orderId', required: true },
  'role_id': { field: 'roleId', required: true },      // 无 # 前缀
  'role_name': 'roleName',
  'role_level': { field: 'roleLevel', type: 'int' },
  'server_id': { field: 'serverId', type: 'int', required: true },  // 无 # 前缀
  'server_name': 'serverName',
  '#country': 'country',
  'dev_type': { field: 'deviceType', transform: normalizeDeviceType },  // 非 #system
  'channel_id': { field: 'channelId', type: 'int' },   // 无 # 前缀
  'goods_id': 'goodsId',
  'goods_price': { field: 'goodsPrice', type: 'decimal' },
  'goods_currency': 'goodsCurrency',
  'pay_amount_usd': { field: 'payAmountUsd', type: 'decimal', required: true },  // 非 pay_amount
  'currency_type': 'currencyType',
  'currency_amount': { field: 'currencyAmount', type: 'decimal' },
  'recharge_type': 'rechargeType',                     // 保留现有字段
  'recharge_channel': 'payChannel',                    // 非 #pay_channel
  'is_sandbox': { field: 'isSandbox', type: 'boolean', default: false },
  '#event_time': { field: 'payTime', type: 'datetime', required: true },
};

// 特殊处理：订单关联角色校验
async function validateRoleExists(prisma: PrismaClient, roleId: string): Promise<boolean> {
  const role = await prisma.role.findUnique({ where: { roleId } });
  return !!role;
}

// 幂等写入
async function upsertOrder(prisma: PrismaClient, data: OrderCreateInput): Promise<void> {
  await prisma.order.upsert({
    where: { orderId: data.orderId },
    update: {
      // 更新所有字段（幂等）
      ...data,
    },
    create: data,
  });
}
```

#### 4.3.1 幂等性修正方案（重要！）

**问题**：现有代码在每次导入订单时使用 `increment` 累加角色充值统计：

```typescript
// ❌ 现有问题代码 - 重复导入会累加统计
await prisma.role.update({
  where: { roleId },
  data: {
    totalRechargeUsd: { increment: orderData.payAmountUsd },
    totalRechargeTimes: { increment: 1 },
  },
});
```

**修正方案 A（推荐）：仅新增订单时更新统计**

```typescript
// ✅ 修正方案 - 使用事务 + 条件更新
async function upsertOrderWithStats(prisma: PrismaClient, data: OrderCreateInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. 检查订单是否已存在
    const existingOrder = await tx.order.findUnique({
      where: { orderId: data.orderId },
      select: { id: true },
    });
    
    // 2. 创建或更新订单
    await tx.order.upsert({
      where: { orderId: data.orderId },
      update: { ...data },
      create: data,
    });
    
    // 3. 仅在新增订单时更新角色统计
    if (!existingOrder) {
      await tx.role.update({
        where: { roleId: data.roleId },
        data: {
          totalRechargeUsd: { increment: data.payAmountUsd },
          totalRechargeTimes: { increment: 1 },
        },
      });
    }
  });
}
```

**修正方案 B：导入后重新汇总计算**

```typescript
// ✅ 修正方案 - 导入完成后重新计算统计
async function recalculateRoleStats(prisma: PrismaClient, roleId: string): Promise<void> {
  const stats = await prisma.order.aggregate({
    where: { roleId, isSandbox: false },
    _sum: { payAmountUsd: true },
    _count: { id: true },
  });
  
  await prisma.role.update({
    where: { roleId },
    data: {
      totalRechargeUsd: stats._sum.payAmountUsd || 0,
      totalRechargeTimes: stats._count.id || 0,
    },
  });
}

// 批量重算所有角色
async function recalculateAllRoleStats(prisma: PrismaClient): Promise<void> {
  const roles = await prisma.role.findMany({ select: { roleId: true } });
  for (const role of roles) {
    await recalculateRoleStats(prisma, role.roleId);
  }
}
```

### 4.4 数据清洗规则

| 字段 | 清洗规则 | 示例 |
|------|---------|------|
| `role_id` | 字符串化，去除首尾空格 | `"9000310004564"` |
| `server_id` | 整数化，默认值 0 | `31` |
| `#event_time` | ISO 8601 格式转换 | `2026-02-04T05:37:14.799Z` |
| `dev_type` | 标准化: Android/iOS/unknown（不区分大小写） | `"Android"` |
| `total_recharge_usd` | Decimal(12,2)，空值转 0 | `99.99` |
| `is_sandbox` | 布尔化，空值转 false | `false` |
| `base_coordinate` | JSON 解析，失败保留原值 | `{"right":467,"left":486}` |
| `recharge_type` | 标准化: `现金`→`cash`, `积分`→`points` | `"cash"` |
| `giftpack_id` | 映射到 giftpackInfo（注意：CSV 字段是 `giftpack_id` 非 `giftpack`） | `"gift_001"` |

#### 4.4.1 rechargeType 标准化函数

```typescript
// 充值类型标准化（处理中文/英文混用）
function normalizeRechargeType(value: string): string {
  if (!value) return 'cash';
  const lowerValue = value.toLowerCase();
  if (lowerValue === '现金' || lowerValue === 'cash') return 'cash';
  if (lowerValue === '积分' || lowerValue === 'points') return 'points';
  if (lowerValue === '代金券' || lowerValue === 'voucher') return 'voucher';
  return value;  // 保留未知类型
}
```

---

## 第五部分：ThinkingData API 详细规范

### 5.1 API 概览

ThinkingData 提供三种 SQL 查询方式，根据数据量和实时性需求选择：

| 查询方式 | 适用场景 | 数据量 | 实时性 |
|---------|---------|--------|--------|
| SQL 同步查询 | 小数据量实时查询 | < 10,000 行 | 实时 |
| SQL 分页查询 | 中等数据量分批获取 | 10,000 - 100,000 行 | 准实时 |
| SQL 异步查询 | 大数据量后台任务 | > 100,000 行 | 延迟 |

### 5.2 API 端点规范

> **⚠️ 重要**：本项目现有代码使用 `/open/v1/query_sql` 路径，以下规范已与现有实现对齐。

#### 5.2.1 SQL 同步查询 (推荐用于 CPS 绑定判断)

```
POST /open/v1/query_sql
Content-Type: application/x-www-form-urlencoded
```

> 注：部分 ThinkingData 版本也支持 `/querySql` 路径，但本项目统一使用 `/open/v1/query_sql`。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `token` | String | 是 | 查询密钥（环境变量注入） |
| `sql` | String | 是 | URL Encode 后的 SQL 语句 |
| `format` | String | 否 | 返回格式：`json`(默认), `json_object`, `csv`, `tsv` |
| `timeoutSeconds` | Integer | 否 | 超时时间（秒），建议 60+ |

**响应格式 (format=json_object，本项目采用)：**

```json
{
  "return_code": 0,
  "return_message": "success",
  "result": {
    "columns": ["#account_id", "tf_medium"],
    "rows": [
      ["9000310004564", "Organic"],
      ["9000310004565", "facebook"]
    ]
  }
}
```

> **现有代码解析方式**：`response.result.columns` + `response.result.rows`

**响应格式 (format=json，流式响应)：**

```json
// 首行：元信息
{
  "data": { 
    "headers": ["#account_id", "tf_medium"] 
  },
  "return_code": 0,
  "return_message": "success"
}
// 后续行：数据行（每行一个 JSON 数组）
["9000310004564", "Organic"]
["9000310004565", "facebook"]
```

**响应格式 (format=json_object 流式)：**

```json
// 首行：元信息（同上）
// 后续行：每行一个 JSON 对象
{"#account_id": "9000310004564", "tf_medium": "Organic"}
{"#account_id": "9000310004565", "tf_medium": "facebook"}
```

#### 5.2.2 SQL 分页查询 (推荐用于充值日志同步)

**步骤1：执行查询**

```
POST /open/execute-sql
Content-Type: application/x-www-form-urlencoded
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `token` | String | 是 | 查询密钥 |
| `sql` | String | 是 | SQL 语句 |
| `format` | String | 否 | 返回格式，推荐 `json_object` |
| `pageSize` | Integer | 否 | 每页行数（最小1000，默认10000） |
| `timeoutSeconds` | Integer | 否 | 超时时间 |

**响应：**

```json
{
  "data": {
    "headers": ["#account_id", "pay_amount_usd", ...],
    "pageCount": 5,
    "pageSize": 10000,
    "rowCount": 45000,
    "taskId": "119a3a37411f3000"
  },
  "return_code": 0,
  "return_message": "success"
}
```

**步骤2：下载分页数据**

```
GET /open/sql-result-page?token=xxx&taskId=xxx&pageId=0
```

#### 5.2.3 SQL 异步查询 (推荐用于大数据量ETL)

```
POST /open/submit-sql     → 提交任务，返回 taskId
GET  /open/sql-task-info  → 查询状态（RUNNING/FINISHED/FAILED）
GET  /open/sql-result-page → 下载结果
POST /open/cancel-sql-task → 取消任务
```

### 5.3 本项目采用的查询策略

```
┌─────────────────────────────────────────────────────────────────┐
│                    查询策略选择矩阵                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  业务场景              API 选择                 更新频率          │
│  ─────────────────────────────────────────────────────────────  │
│  CPS 绑定判断          /open/v1/query_sql      实时（用户触发）   │
│  CPS 充值日志          /open/execute-sql       30分钟定时        │
│  CPS 登录日志          /open/execute-sql       30分钟定时        │
│  每日数据统计          /open/submit-sql        每日 02:00        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 第六部分：CPS 公会绑定业务模块 (新增)

### 6.1 业务需求概览

CPS（Cost Per Sale）公会系统用于管理游戏推广渠道的用户归因和佣金结算。

**核心功能：**
1. **角色绑定判断** - 实时判断角色是否可绑定（排除买量用户）
2. **CPS 充值日志** - 同步绑定用户的充值记录用于佣金计算
3. **CPS 登录日志** - 跟踪绑定用户的活跃状态
4. **绑定失败日志** - 记录所有绑定失败的原因

### 6.2 用户归因判断逻辑

**判断字段：** `tf_medium`（流量来源/媒介）

```
┌─────────────────────────────────────────────────────────────────┐
│                     用户归因判断流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  输入: account_id / role_id                                     │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ 查询 tf_medium │  ← ThinkingData API                         │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────┐                   │
│  │              tf_medium 值判断              │                   │
│  ├──────────────────────────────────────────┤                   │
│  │                                          │                   │
│  │  ✅ 允许绑定:                             │                   │
│  │     • 'Organic'                          │                   │
│  │     • '%自然量%'                          │                   │
│  │     • 'WA_CPS_link%'                     │                   │
│  │                                          │                   │
│  │  ❌ 禁止绑定 (买量用户):                   │                   │
│  │     • 'facebook'                         │                   │
│  │     • 'google'                           │                   │
│  │     • 其他广告渠道                        │                   │
│  │                                          │                   │
│  └──────────────────────────────────────────┘                   │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │  绑定成功     │    │  绑定失败     │                           │
│  │  记录归因     │    │  记录日志     │                           │
│  └──────────────┘    └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 SQL 查询模板

#### 6.3.1 角色绑定判断 SQL

```sql
-- 查询角色是否可绑定（排除买量用户）
SELECT "#account_id", "tf_medium" 
FROM ta.v_user_22 
WHERE "#account_id" = '${accountId}'
  AND (
    tf_medium = 'Organic' 
    OR tf_medium LIKE '%自然量%' 
    OR tf_medium LIKE 'WA_CPS_link%'
  )
```

**判断逻辑：**
- 返回有结果 → 可绑定
- 返回空结果 → 不可绑定（买量用户），提示"该角色为买量用户，不可绑定"

#### 6.3.2 CPS 用户充值日志 SQL

```sql
-- 获取 CPS 绑定用户的充值明细
-- 替换参数: ${partDate}, ${startTime}, ${endTime}
SELECT 
  "#account_id",
  "#event_time",
  "pay_amount_usd",
  "#country",
  "server_id",
  "role_name",
  "server_name",
  "publisher_order_id",
  "recharge_type",
  "#account_id@cps_group"
FROM (
  SELECT 
    "#account_id", "#event_time", "pay_amount_usd", "#country",
    "server_id", "role_name", "server_name", "publisher_order_id", "recharge_type"
  FROM v_event_22 
  WHERE "$part_event" = 'recharge_complete'  
    AND "recharge_type" = '现金' 
    AND "is_sandbox" = '0' 
    AND "$part_date" = '${partDate}' 
    AND "#event_time" BETWEEN 
        CAST('${startTime}' AS TIMESTAMP) 
        AND CAST('${endTime}' AS TIMESTAMP)
) AS role_recharge
LEFT JOIN (
  SELECT "#account_id@account_id", "#account_id@cps_group" 
  FROM ta_dim.dim_22_0_518509 
) AS role_cps
ON role_recharge."#account_id" = role_cps."#account_id@account_id"
WHERE role_cps."#account_id@account_id" IS NOT NULL
```

#### 6.3.3 CPS 用户登录日志 SQL

```sql
-- 获取 CPS 绑定用户的登录日志
-- 替换参数: ${partDate}, ${startTime}, ${endTime}
SELECT 
  role_login."#account_id",
  "#event_time" AS "last_login_time", 
  "#active_time" AS "create_time",
  "#country",
  "server_id",
  "role_name",
  "server_name",
  "#account_id@cps_group"
FROM (
  SELECT 
    "#account_id",
    MAX("#event_time") AS "#event_time",
    "#country", "server_id", "role_name", "server_name"
  FROM v_event_22 
  WHERE "$part_event" = 'role_login'    
    AND "$part_date" = '${partDate}' 
    AND "#event_time" BETWEEN 
        CAST('${startTime}' AS TIMESTAMP) 
        AND CAST('${endTime}' AS TIMESTAMP)
  GROUP BY "#account_id", "#country", "server_id", "role_name", "server_name"
) AS role_login
LEFT JOIN (
  SELECT "#account_id", "#active_time" FROM v_user_22
) AS role_act
ON role_login."#account_id" = role_act."#account_id"
LEFT JOIN (
  SELECT "#account_id@account_id", "#account_id@cps_group" 
  FROM ta_dim.dim_22_0_518509 
) AS role_cps
ON role_login."#account_id" = role_cps."#account_id@account_id"
WHERE role_cps."#account_id@account_id" IS NOT NULL
```

### 6.4 数据库 Schema 扩展

#### 6.4.1 Role 模型新增字段

```prisma
model Role {
  // ... 现有字段 ...
  
  // === CPS 归因字段 (新增) ===
  tfMedium           String?   @map("tf_medium") @db.VarChar(100)     // 流量来源
  cpsGroup           String?   @map("cps_group") @db.VarChar(100)     // CPS 分组
  cpsBindTime        DateTime? @map("cps_bind_time")                  // 绑定时间
  cpsBindBy          Int?      @map("cps_bind_by")                    // 绑定操作人ID
  
  // === 关联 ===
  cpsBindings        CpsBinding[]
}
```

#### 6.4.2 新增 CpsBinding 表（绑定记录）

```prisma
model CpsBinding {
  id              Int       @id @default(autoincrement())
  roleId          String    @map("role_id") @db.VarChar(50)
  accountId       String    @map("account_id") @db.VarChar(50)
  cpsGroup        String    @map("cps_group") @db.VarChar(100)      // CPS 分组
  operatorId      Int       @map("operator_id")                     // 操作人ID
  operatorType    String    @map("operator_type") @db.VarChar(20)   // admin/leader/member
  status          String    @default("active") @db.VarChar(20)      // active/cancelled
  attachments     Json?                                             // 截图等附件
  remark          String?   @db.Text
  bindTime        DateTime  @default(now()) @map("bind_time")
  unbindTime      DateTime? @map("unbind_time")
  createdAt       DateTime  @default(now()) @map("created_at")
  
  role Role @relation(fields: [roleId], references: [roleId])
  
  @@index([roleId])
  @@index([accountId])
  @@index([cpsGroup])
  @@index([operatorId])
  @@index([status])
  @@map("cps_bindings")
}
```

#### 6.4.3 新增 CpsBindFailLog 表（绑定失败日志）

```prisma
model CpsBindFailLog {
  id              Int       @id @default(autoincrement())
  roleId          String?   @map("role_id") @db.VarChar(50)         // 可能为空（仅有 accountId 的场景）
  accountId       String?   @map("account_id") @db.VarChar(50)      // 可能为空（仅有 roleId 的场景）
  operatorId      Int       @map("operator_id")
  failReason      String    @map("fail_reason") @db.VarChar(200)    // 失败原因
  tfMedium        String?   @map("tf_medium") @db.VarChar(100)      // 查询到的 tf_medium 值
  requestData     Json?     @map("request_data")                    // 请求数据快照
  createdAt       DateTime  @default(now()) @map("created_at")
  
  // 至少有一个标识符
  // 应用层校验: roleId 和 accountId 不能同时为空
  
  @@index([roleId])
  @@index([operatorId])
  @@index([createdAt])
  @@map("cps_bind_fail_logs")
}
```

#### 6.4.4 新增 CpsRechargeLog 表（充值日志）

```prisma
model CpsRechargeLog {
  id              Int       @id @default(autoincrement())
  accountId       String    @map("account_id") @db.VarChar(50)
  roleId          String?   @map("role_id") @db.VarChar(50)
  roleName        String?   @map("role_name") @db.VarChar(100)
  serverId        Int       @map("server_id")
  serverName      String?   @map("server_name") @db.VarChar(50)
  country         String?   @db.VarChar(50)
  cpsGroup        String    @map("cps_group") @db.VarChar(100)
  gameOrderId     String    @map("game_order_id") @db.VarChar(100)   // 游戏订单号（必填，用于去重）
  publisherOrderId String?  @map("publisher_order_id") @db.VarChar(100) // 发行商订单号（可能为空）
  payAmountUsd    Decimal   @map("pay_amount_usd") @db.Decimal(12, 2)
  rechargeType    String?   @map("recharge_type") @db.VarChar(20)
  eventTime       DateTime  @map("event_time")
  syncBatch       String    @map("sync_batch") @db.VarChar(50)      // 同步批次号
  createdAt       DateTime  @default(now()) @map("created_at")
  
  // ⚠️ publisherOrderId 可能为空，改用游戏订单号作为唯一键
  @@unique([accountId, gameOrderId], name: "account_order_unique")
  @@index([accountId])
  @@index([cpsGroup])
  @@index([eventTime])
  @@index([syncBatch])
  @@index([publisherOrderId])  // 非唯一索引，支持查询
  @@map("cps_recharge_logs")
}
```

#### 6.4.5 新增 CpsLoginLog 表（登录日志）

> 用于存储 CPS 绑定用户的登录记录，支持活跃度统计

```prisma
model CpsLoginLog {
  id              Int       @id @default(autoincrement())
  accountId       String    @map("account_id") @db.VarChar(50)
  roleId          String?   @map("role_id") @db.VarChar(50)
  roleName        String?   @map("role_name") @db.VarChar(100)
  serverId        Int       @map("server_id")
  serverName      String?   @map("server_name") @db.VarChar(50)
  country         String?   @db.VarChar(50)
  cpsGroup        String    @map("cps_group") @db.VarChar(100)
  lastLoginTime   DateTime  @map("last_login_time")              // 最后登录时间
  createTime      DateTime? @map("create_time")                  // 角色创建时间
  eventTime       DateTime  @map("event_time")                   // 事件时间
  syncBatch       String    @map("sync_batch") @db.VarChar(50)   // 同步批次号
  createdAt       DateTime  @default(now()) @map("created_at")
  
  @@unique([accountId, syncBatch], name: "account_batch_unique")  // 同一批次去重
  @@index([accountId])
  @@index([cpsGroup])
  @@index([lastLoginTime])
  @@index([syncBatch])
  @@map("cps_login_logs")
}
```

### 6.5 API 设计

#### 6.5.1 CPS 绑定相关 API

```
POST   /api/cps/binding/check          # 检查角色是否可绑定
POST   /api/cps/binding/create         # 创建绑定
DELETE /api/cps/binding/:id            # 取消绑定
GET    /api/cps/binding/list           # 绑定列表（支持分页筛选）
GET    /api/cps/binding/fail-logs      # 绑定失败日志
```

#### 6.5.2 CPS 数据查询 API

```
GET    /api/cps/recharge/list          # 充值日志列表
GET    /api/cps/recharge/summary       # 充值汇总统计
GET    /api/cps/login/list             # 登录日志列表
POST   /api/cps/sync/trigger           # 手动触发数据同步
GET    /api/cps/sync/status            # 同步状态查询
```

#### 6.5.3 CPS 绑定与现有 BindingApply 流程的关系

**⚠️ 重要说明**：

现有系统已有 `BindingApply` 模型和 `/api/audit/binding-applies` API，用于通用的绑定申请审核流程。

**关系说明**：

| 模块 | 用途 | 数据表 | 流程 |
|------|------|--------|------|
| **BindingApply** (现有) | 通用绑定申请审核 | `binding_applies` | 申请→审核→通过/拒绝 |
| **CpsBinding** (新增) | CPS 公会专属绑定 | `cps_bindings` | 检查→绑定（无需审核） |

**集成方案（二选一）**：

**方案 A：CPS 绑定复用 BindingApply 流程（需审核）**

> ⚠️ 现有 `BindingApply` 表无 `type` 字段，使用现有 `project` 字段区分：`project='cps'`

```
用户提交 CPS 绑定请求
       ↓
调用 ThinkingData API 检查 tf_medium
       ↓
  ┌────┴────┐
  │ 买量用户 │ → 拒绝，记录 CpsBindFailLog
  └────┬────┘
       ↓
创建 BindingApply（project='cps'，status='pending'）  // 使用现有 project 字段
       ↓
组长审核通过
       ↓
创建 CpsBinding 记录 + 更新 BindingApply.status='approved'
```

**方案 B（推荐）：CPS 绑定独立流程（无需审核）**

> 由于 CPS 绑定已有 tf_medium 自动判断（排除买量用户），无需额外人工审核

```
用户提交 CPS 绑定请求
       ↓
调用 ThinkingData API 检查 tf_medium
       ↓
  ┌────┴────┐
  │ 买量用户 │ → 拒绝，记录 CpsBindFailLog
  └────┬────┘
       ↓
直接创建 CpsBinding 记录（无需审核）
       ↓
可选：上传截图作为凭证存入 CpsBinding.attachments
```

**建议**：推荐方案 B。CPS 绑定已有 tf_medium 自动判断机制，可直接绑定；若业务要求必须人工复核，则选方案 A 并使用 `project='cps'` 区分。

### 6.6 前端页面需求

```
侧边栏菜单结构：
├── 概览 (Dashboard)
├── CPS 管理
│   ├── 角色绑定
│   ├── 绑定失败日志
│   ├── 充值明细
│   └── 登录日志
├── 数据查询
│   ├── 今日数据
│   ├── 月度数据
│   └── 历史数据
└── 系统设置
```

**角色绑定页面功能：**
1. 输入 role_id 或 account_id 查询
2. 显示角色信息：role_id, role_name, 创角时间, 最后登录
3. 实时判断是否可绑定
4. 绑定时需上传截图作为凭证
5. 绑定成功/失败均需记录日志

---

## 第七部分：组织架构管理 (新增)

### 7.1 层级结构

```
┌─────────────────────────────────────────────────────────────────┐
│                       组织架构层级                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Level 0:  ops-admin (运营管理员)                                │
│               │                                                  │
│               ├── 全局数据查看权限                                │
│               ├── 组长/组员管理权限                               │
│               └── 系统配置权限                                    │
│                                                                 │
│  Level 1:  组长 (Team Leader)                                   │
│               │                                                  │
│               ├── 本组数据查看权限                                │
│               ├── 组员管理权限                                    │
│               └── CPS 绑定审核权限                               │
│                                                                 │
│  Level 2:  组员 (Team Member)                                   │
│               │                                                  │
│               ├── 个人绑定数据查看                                │
│               └── CPS 绑定操作权限                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 数据库 Schema 与权限迁移策略

**⚠️ 现有权限字段保留**：

现有系统使用 `AdminUser.role` 字符串（`admin`/`manager`/`operator`）+ `RolesGuard` 判断权限。
新增 `level`/`parentId` 字段采用**渐进式迁移**策略：

```prisma
model AdminUser {
  // === 现有字段 (保留) ===
  id           Int       @id @default(autoincrement())
  username     String    @unique @db.VarChar(50)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  salt         String    @db.VarChar(64)
  realName     String    @map("real_name") @db.VarChar(50)
  role         String    @default("operator") @db.VarChar(20)    // ⚠️ 保留现有字段
  
  // === 组织架构字段 (新增，与 role 并存) ===
  level           Int       @default(2)                            // 0:admin, 1:leader, 2:member
  parentId        Int?      @map("parent_id")                      // 上级ID
  cpsGroupCode    String?   @map("cps_group_code") @db.VarChar(50) // CPS 分组编码
  
  // === 自关联 ===
  parent          AdminUser?  @relation("UserHierarchy", fields: [parentId], references: [id])
  subordinates    AdminUser[] @relation("UserHierarchy")
}
```

**迁移映射脚本**：

```typescript
// 一次性迁移脚本：同步 role → level
async function migrateRoleToLevel(prisma: PrismaClient): Promise<void> {
  const ROLE_LEVEL_MAP: Record<string, number> = {
    'admin': 0,
    'manager': 1,
    'operator': 2,
  };
  
  const users = await prisma.adminUser.findMany();
  for (const user of users) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { level: ROLE_LEVEL_MAP[user.role] ?? 2 },
    });
  }
}
```

**RolesGuard 兼容更新**：

```typescript
// 更新 RolesGuard 同时支持 role 和 level 判断
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
  if (!requiredRoles) return true;
  
  const { user } = context.switchToHttp().getRequest();
  
  // 兼容新旧两种权限判断
  const hasRoleByString = requiredRoles.includes(user.role);
  const hasRoleByLevel = requiredRoles.some(r => {
    const levelMap: Record<string, number> = { 'admin': 0, 'manager': 1, 'operator': 2 };
    return user.level <= (levelMap[r] ?? 2);
  });
  
  return hasRoleByString || hasRoleByLevel;
}
```

### 7.3 权限矩阵

| 功能 | ops-admin | 组长 | 组员 |
|------|-----------|------|------|
| 查看全局数据 | ✅ | ❌ | ❌ |
| 查看本组数据 | ✅ | ✅ | ❌ |
| 查看个人数据 | ✅ | ✅ | ✅ |
| 创建绑定 | ✅ | ✅ | ✅ |
| 审核绑定 | ✅ | ✅ | ❌ |
| 取消绑定 | ✅ | ✅ | ❌ |
| 管理组长 | ✅ | ❌ | ❌ |
| 管理组员 | ✅ | ✅ | ❌ |

---

## 第八部分：ThinkingData ETL 同步服务

### 8.1 服务架构

```
┌─────────────────────────────────────────────────────────────────┐
│               ThinkingData ETL 同步服务架构                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                               │
│  │ NestJS 定时器 │  定时任务配置：                                 │
│  │ (Scheduler)  │  • 充值/登录日志: 每 30 分钟                    │
│  │              │  • 每日统计: 每日 02:00                         │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ 日期计算器    │───▶│  SQL 生成器   │───▶│  API 请求器   │       │
│  │ (T-1 逻辑)   │    │ (模板替换)    │    │ (Axios)      │       │
│  └──────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                  │               │
│                                                  ▼               │
│                                          ┌──────────────┐       │
│                                          │ ThinkingData │       │
│                                          │  Open API    │       │
│                                          └──────┬───────┘       │
│                                                  │               │
│         ┌────────────────────────────────────────┘               │
│         ▼                                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ 响应解析器    │───▶│  数据清洗器   │───▶│  幂等写入器   │       │
│  │ (流式解析)   │    │ (字段映射)    │    │ (Prisma)     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                 │
│  错误处理：指数退避重试 (5s → 10s → 30s → 告警)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 现有实现状态

| 组件 | 文件路径 | 状态 |
|------|---------|------|
| 服务 | `src/modules/thinkingdata/thinkingdata.service.ts` | ✅ 已实现 |
| 调度器 | `src/modules/thinkingdata/thinkingdata.scheduler.ts` | ✅ 已实现 |
| 控制器 | `src/modules/thinkingdata/thinkingdata.controller.ts` | ✅ 已实现 |
| 接口定义 | `src/modules/thinkingdata/interfaces/ta-response.interface.ts` | ✅ 已实现 |
| 环境配置 | `.env` (TA_API_HOST, TA_PROJECT_TOKEN) | ✅ 已配置 |

### 8.3 待完善项

1. **SQL 模板配置化** - 将 SQL 查询模板移至配置文件或数据库
2. **分页查询支持** - 实现 `/open/execute-sql` + `/open/sql-result-page` 流程
3. **响应流式解析** - 处理 JSON 首行 + 数据行的返回格式
4. **CPS 数据同步** - 新增充值日志、登录日志同步任务
5. **30分钟定时任务** - 实现 CPS 数据高频同步
6. **告警集成** - 失败时发送告警通知
7. **分布式锁机制** - 防止定时任务重复执行

### 8.4 定时任务分布式锁（新增）

> 防止多实例部署时定时任务重复执行

```typescript
// cps-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class CpsSyncService {
  private readonly logger = new Logger(CpsSyncService.name);
  private readonly LOCK_KEY = 'cps:sync:lock';
  private readonly LOCK_TTL = 1800; // 30分钟

  constructor(
    private readonly redis: RedisService,
    private readonly thinkingDataService: ThinkingDataService,
  ) {}

  @Cron('*/30 * * * *') // 每30分钟执行
  async syncCpsData() {
    // 尝试获取分布式锁
    const locked = await this.redis.set(
      this.LOCK_KEY, 
      process.pid.toString(), 
      'NX',  // 仅在键不存在时设置
      'EX',  // 设置过期时间
      this.LOCK_TTL
    );
    
    if (!locked) {
      this.logger.warn('CPS sync already running on another instance, skipping');
      return;
    }
    
    try {
      this.logger.log('Starting CPS data sync...');
      
      // 同步充值日志
      await this.syncRechargeLog();
      
      // 同步登录日志
      await this.syncLoginLog();
      
      this.logger.log('CPS data sync completed');
    } catch (error) {
      this.logger.error('CPS sync failed', error);
      // 发送告警
      await this.sendAlert(error);
    } finally {
      // 释放锁
      await this.redis.del(this.LOCK_KEY);
    }
  }
}
```

---

## 第九部分：实施优先级与排期

### 9.1 Phase 1: 数据库 Schema 升级 (优先级: P0)

**任务清单**:
- [ ] 1.1 备份现有 Prisma Schema 和数据库
- [ ] 1.2 更新 Role 模型（新增游戏字段 + CPS 字段）
- [ ] 1.3 更新 Order 模型（新增 JSON 字段）
- [ ] 1.4 新增 CpsBinding、CpsBindFailLog、CpsRechargeLog、CpsLoginLog 表
- [ ] 1.5 更新 AdminUser 模型（新增组织架构字段）
- [ ] 1.6 生成迁移文件 `npx prisma migrate dev --name add_cps_module`
- [ ] 1.7 验证迁移结果
- [ ] 1.8 准备回滚脚本

**预计影响**: 数据库结构变更，需要停机迁移

**⚠️ 回滚预案**：

```bash
# 1. 迁移失败时回滚
npx prisma migrate resolve --rolled-back add_cps_module

# 2. 手动回滚 SQL（若 Prisma 回滚失败）
-- roles 表回滚
ALTER TABLE roles DROP COLUMN IF EXISTS tf_medium;
ALTER TABLE roles DROP COLUMN IF EXISTS cps_group;
ALTER TABLE roles DROP COLUMN IF EXISTS cps_bind_time;
ALTER TABLE roles DROP COLUMN IF EXISTS cps_bind_by;
ALTER TABLE roles DROP COLUMN IF EXISTS user_id;
ALTER TABLE roles DROP COLUMN IF EXISTS vip_exp;
-- ... 其他新增字段

-- 删除新增表
DROP TABLE IF EXISTS cps_bindings;
DROP TABLE IF EXISTS cps_bind_fail_logs;
DROP TABLE IF EXISTS cps_recharge_logs;
DROP TABLE IF EXISTS cps_login_logs;

-- admin_users 表回滚
ALTER TABLE admin_users DROP COLUMN IF EXISTS level;
ALTER TABLE admin_users DROP COLUMN IF EXISTS parent_id;
ALTER TABLE admin_users DROP COLUMN IF EXISTS cps_group_code;
```

**迁移前必须执行**：
```bash
# 全量备份数据库
pg_dump -U suzaku -d suzaku_gaming > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 9.2 Phase 2: CSV ETL 脚本完善 (优先级: P0)

**任务清单**:
- [ ] 2.1 更新 `scripts/etl/import-roles.ts` 字段映射（修正 `#role_id` → `role_id` 等）
- [ ] 2.2 更新 `scripts/etl/import-orders.ts` 字段映射（修正 `pay_amount` → `pay_amount_usd` 等）
- [ ] 2.3 添加 JSON 字段聚合逻辑
- [ ] 2.4 添加数据清洗函数
- [ ] 2.5 **修复幂等性问题**：订单导入改为"仅新增时更新统计"或"导入后重算"
- [ ] 2.6 单元测试

**预计影响**: ETL 脚本，不影响线上服务

### 9.3 Phase 3: CPS 公会绑定模块 (优先级: P0)

**任务清单**:
- [ ] 3.1 实现 ThinkingData API 客户端（支持三种查询方式）
- [ ] 3.2 实现角色绑定判断 API `/api/cps/binding/check`
- [ ] 3.3 实现绑定创建/取消 API
- [ ] 3.4 实现绑定失败日志记录
- [ ] 3.5 单元测试 + 集成测试

**预计影响**: 新增后端模块

### 9.4 Phase 4: CPS 数据同步 (优先级: P1)

**任务清单**:
- [ ] 4.1 实现分页查询 API 客户端
- [ ] 4.2 实现 CPS 充值日志同步（30分钟定时）
- [ ] 4.3 实现 CPS 登录日志同步（30分钟定时）
- [ ] 4.4 实现同步状态监控 API
- [ ] 4.5 集成测试

**预计影响**: 后台定时任务

### 9.5 Phase 5: 组织架构管理 (优先级: P1)

**任务清单**:
- [ ] 5.1 实现组长/组员 CRUD API
- [ ] 5.2 实现层级权限校验中间件
- [ ] 5.3 实现数据范围过滤（全局/本组/个人）
- [ ] 5.4 更新现有 API 添加权限校验

**预计影响**: 权限体系变更

### 9.6 Phase 6: 前后端接口对齐与适配 (优先级: P2)

**⚠️ 导出接口缺失问题**：

前端已调用以下导出接口，但后端缺失：
- `/api/player/roles/export` - 角色导出
- `/api/audit/binding-applies/export` - 绑定申请导出

**任务清单**:

**6.A 后端导出接口补齐**:
- [ ] 6.A.1 实现 `GET /api/player/roles/export` （返回 CSV/Excel）
- [ ] 6.A.2 实现 `GET /api/audit/binding-applies/export` （返回 CSV/Excel）
- [ ] 6.A.3 添加 ExcelJS 或 csv-stringify 依赖
- [ ] 6.A.4 设置响应头 `Content-Disposition: attachment`

**导出接口实现参考**:

```typescript
// player.controller.ts
@Get('roles/export')
@ApiOperation({ summary: '导出角色列表' })
async exportRoles(@Query() query: QueryRolesDto, @Res() res: Response) {
  const data = await this.playerService.getRolesForExport(query);
  const csv = await this.exportService.toCSV(data, ROLE_EXPORT_COLUMNS);
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=roles.csv');
  res.send('\ufeff' + csv);  // BOM for Excel compatibility
}
```

**6.B 前端适配**:
- [ ] 6.B.1 新增 CPS 管理菜单和页面
- [ ] 6.B.2 实现角色绑定页面（查询+绑定+截图上传）
- [ ] 6.B.3 实现充值/登录日志列表页
- [ ] 6.B.4 实现组织架构管理页面
- [ ] 6.B.5 更新角色/订单列表展示新字段
- [ ] 6.B.6 更新 Mock 数据

**预计影响**: 前后端均需修改和重新部署

---

## 第十部分：验收标准

### 10.1 功能验收

| 验收项 | 标准 | 验证方法 |
|--------|------|---------|
| CSV 角色导入 | 50 条样本数据全部正确入库 | SQL COUNT + 字段抽查 |
| CSV 订单导入 | 关联角色存在，金额正确 | SQL JOIN + SUM 校验 |
| CPS 绑定判断 | 买量用户被正确拒绝 | 使用已知买量角色测试 |
| CPS 绑定创建 | 绑定记录正确写入 | 数据库记录校验 |
| CPS 充值同步 | 数据与 ThinkingData 一致 | 对比查询结果 |
| 绑定失败日志 | 失败操作有完整记录 | 日志表查询 |
| 权限控制 | 组员无法越权操作 | 跨组数据访问测试 |
| 幂等性 | 重复执行不产生重复数据 | 多次执行后 COUNT 不变 |
| **导出接口** | 角色/绑定申请导出返回正确 CSV | 下载文件 + 数据校验 |
| **字段映射** | CSV 字段与 ETL 脚本完全匹配 | 导入实际样本数据测试 |

### 10.2 性能验收

| 指标 | 标准 |
|------|------|
| CSV 导入速度 | ≥ 1000 条/秒 |
| CPS 绑定判断响应 | P99 < 2s（含 ThinkingData API 调用） |
| 充值日志同步 | 单批次 < 5 分钟（10000 条） |
| API 响应时间 | P99 < 500ms（本地数据库查询） |
| 数据库查询 | 全索引命中 |

### 10.3 安全验收

| 检查项 | 要求 |
|--------|------|
| Token 存储 | 仅在环境变量中，不入代码库 |
| SQL 注入 | 参数化查询，无拼接 |
| 敏感日志 | 不打印 Token、密码等 |
| 权限校验 | 所有 API 需校验用户层级 |
| 数据隔离 | 组员只能看到自己绑定的数据 |

---

## 附录 A: CSV 字段完整清单

### A.1 角色数据字段 (51 个)

```
#user_id, #account_id, #distinct_id, $part_event, #event_time, $part_date,
#lib_version, role_level, #ip, #data_source, package_id, #lib, #city,
role_id, #country_code, #province, server_id, role_name, channel_id,
server_name, sdk_udid, sdk_open_id, #country, sdk_adid, app_version,
net_type, res_version, dev_version, dev_type, steel_plant, total_recharge_usd,
role_ap, missile_factory_lv, remain_rare_earth, naval_academy_lv,
manu_factory_lv, oil_plant, role_bp, total_recharge_times, headquarters_lv,
server_zone_offset, total_online_time, coastal_comand_lv, total_login_days,
vip_level, power_plant, remain_power, remain_steel, remain_oil,
torpedo_factory_lv, vip_exp, server_alive_days, faction_name,
aircraft_factory_lv, warehouse_lv, world_progress_ptase, remain_diamond,
dev_model, event_time, base_coordinate, base_seas_id, faction_level,
faction_exp, empire_stage_id, expedition_stage_id, current_server_id,
total_recharge_cny
```

### A.2 订单数据字段 (66+ 个)

```
(角色字段 + 以下订单特有字段)
game_order_id, pay_amount_usd, goods_id, is_sandbox, currency_type,
currency_amount, captain_bag, strategicweapon_info, fleet_info,
goods_price, goods_currency, faction_info, reward, giftpack, ...
```

---

## 附录 B: ThinkingData API 错误码

| 错误码 | 说明 | 处理方式 |
|--------|------|---------|
| 0 | 成功 | - |
| -1 | 任务执行中 | 等待后重试 |
| -1008 | 参数为空 | 检查必填参数 |
| -1xxx | 其他错误 | 记录日志，重试/告警 |

---

## 附录 C: CPS 绑定状态流转

```
┌──────────┐    绑定成功    ┌──────────┐
│  待绑定   │ ───────────▶ │  已绑定   │
│ (无记录)  │              │ (active) │
└──────────┘              └────┬─────┘
      │                        │
      │ 绑定失败                │ 取消绑定
      │ (买量用户)             │
      ▼                        ▼
┌──────────┐              ┌──────────┐
│ 失败日志  │              │  已取消   │
│ (记录原因)│              │(cancelled)│
└──────────┘              └──────────┘
```

---

## 附录 D: 环境变量配置

```bash
# .env.example

# 数据库
DATABASE_URL="postgresql://suzaku:suzaku123@localhost:5432/suzaku_gaming?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRES_IN=2h

# ThinkingData 基础配置
TA_API_HOST=https://api.thinkingdata.cn
TA_PROJECT_TOKEN=your-thinkingdata-project-token

# ThinkingData 同步配置
TA_SYNC_ENABLED=true
TA_SYNC_CRON=0 2 * * *              # 每日统计同步时间
TA_CPS_SYNC_ENABLED=true
TA_CPS_SYNC_INTERVAL=30             # CPS 数据同步间隔（分钟）
TA_QUERY_TIMEOUT=60                 # API 查询超时（秒）
TA_PAGE_SIZE=10000                  # 分页查询每页大小

# ThinkingData 表/视图配置（根据实际项目调整）
TA_USER_VIEW=ta.v_user_22           # 用户表视图
TA_EVENT_VIEW=v_event_22            # 事件表视图
TA_CPS_DIM_TABLE=ta_dim.dim_22_0_518509  # CPS 维度表

# 应用
NODE_ENV=development
PORT=3000
```

---

## 附录 E: 关键业务字段说明

| 字段 | 来源 | 说明 |
|------|------|------|
| `tf_medium` | ThinkingData | 流量来源，用于判断是否买量用户 |
| `#account_id@cps_group` | ThinkingData 维度表 | CPS 分组标识 |
| `publisher_order_id` | 充值事件 | 发行商订单号，用于去重 |
| `recharge_type` | 充值事件 | 充值类型：现金/积分等 |
| `is_sandbox` | 充值事件 | 沙盒订单标识，需过滤 |

---

**文档版本历史**

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0.0 | 2026-02-04 | 初版：CSV 数据字段分析、Schema 优化、ETL 方案 |
| v2.0.0 | 2026-02-04 | 新增：ThinkingData API 详细规范、CPS 公会绑定模块、组织架构管理、用户归因逻辑 |
| v2.1.0 | 2026-02-04 | **关键修正**：<br>• CSV 字段映射对齐实际数据<br>• 订单导入幂等性修复方案<br>• Schema 增量合并策略<br>• 权限 role↔level 迁移方案<br>• ThinkingData API 路径统一为 `/open/v1/query_sql`<br>• 补齐导出接口任务<br>• 技术栈版本确认（Vue 3.4.21）<br>• CPS 与 BindingApply 关系说明 |
| v2.2.0 | 2026-02-04 | **P0/P1 修正**：<br>• Order 模型补齐 `rechargeType` 字段<br>• CPS 复用方案改用 `project='cps'` 而非 `type`<br>• 技术栈表统一为 Vue 3.4.21 / Element Plus 2.6.1<br>• 查询策略矩阵统一为 `/open/v1/query_sql`<br>• 新增 `CpsLoginLog` 表结构<br>• 推荐 CPS 绑定方案 B（直绑无需审核） |
| v2.3.0 | 2026-02-04 | **架构师审查修正**：<br>• CpsRechargeLog 唯一约束改用 gameOrderId<br>• CpsBindFailLog.roleId 改为可空<br>• 设备类型标准化改为不区分大小写<br>• 新增 rechargeType 标准化函数<br>• giftpack_id 字段映射修正<br>• 新增 Schema 迁移回滚预案<br>• 新增分布式锁机制 |

---

**文档结束**
