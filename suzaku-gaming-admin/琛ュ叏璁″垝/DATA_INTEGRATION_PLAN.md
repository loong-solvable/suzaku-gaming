# Suzaku Gaming 数据接入规划报告

## 一、数据源概览

### 1.1 CSV 文件清单

| 文件名 | 数据类型 | 事件类型 | 记录数（估计） |
|--------|----------|----------|----------------|
| 20260204_014715_06858_y9rrj.csv | 角色数据 | `role_create` | ~500+ |
| 20260204_014828_06863_y9rrj.csv | 订单数据 | `recharge_complete` | ~1000+ |

---

## 二、数据与网站板块映射

### 2.1 角色数据 → 角色列表模块

**对应页面**：玩家数据 > 角色列表

### 2.2 订单数据 → 订单列表模块

**对应页面**：玩家数据 > 订单列表

### 2.3 聚合数据 → 概要面板模块

**对应页面**：概要面板（Dashboard）

需要从两个数据源进行聚合计算。

---

## 三、字段分析与映射

### 3.1 角色数据字段分析 (role_create)

#### 3.1.1 核心业务字段（必需）

| CSV字段 | 网站字段 | 说明 | 是否去重 |
|---------|----------|------|----------|
| `role_id` | 角色ID | 角色唯一标识 | ✅ 主键，需去重 |
| `#account_id` | UCID | 账户唯一标识 | 否 |
| `role_name` | 角色名称 | 角色昵称 | 否 |
| `role_level` | 角色等级 | 当前等级 | 否 |
| `server_id` | 区服ID | 服务器标识 | 否 |
| `server_name` | 区服名称 | 服务器名称 | 否 |
| `#event_time` | 注册时间 | 角色创建时间 | 否 |
| `#country` | 国家 | 国家名称 | 否 |
| `#country_code` | 国家代码 | ISO国家代码 | 否 |
| `dev_type` | 系统 | iOS/Android | 否 |
| `channel_id` | 渠道ID | 渠道标识 | 否 |
| `total_recharge_usd` | 总付费金额 | 累计充值(USD) | 否 |
| `total_recharge_times` | 总付费笔数 | 充值次数 | 否 |
| `total_login_days` | 登录天数 | 累计登录天数 | 否 |
| `total_online_time` | 在线时长 | 累计在线秒数 | 否 |
| `vip_level` | VIP等级 | 当前VIP等级 | 否 |

#### 3.1.2 辅助字段（可选展示）

| CSV字段 | 说明 | 建议 |
|---------|------|------|
| `#city` | 城市 | 可用于地区分析 |
| `#province` | 省份 | 可用于地区分析 |
| `app_version` | APP版本 | 可用于版本分析 |
| `dev_model` | 设备型号 | 可用于设备分析 |
| `net_type` | 网络类型 | WIFI/5G等 |
| `#ip` | IP地址 | 安全分析用 |

#### 3.1.3 游戏内数据字段（可选）

| CSV字段 | 说明 | 建议 |
|---------|------|------|
| `headquarters_lv` | 基地等级 | 游戏进度指标 |
| `remain_diamond` | 剩余钻石 | 经济指标 |
| `remain_power` | 剩余体力 | 游戏状态 |
| `faction_name` | 公会名称 | 社交数据 |
| `world_progress_ptase` | 世界进度 | 游戏进度 |

#### 3.1.4 技术字段（不需要展示）

| CSV字段 | 说明 | 处理建议 |
|---------|------|----------|
| `#user_id` | 内部用户ID | 仅后端使用 |
| `#distinct_id` | 设备唯一ID | 仅后端使用 |
| `$part_event` | 事件类型 | 用于数据分类 |
| `$part_date` | 分区日期 | 数据分区用 |
| `#lib_version` | SDK版本 | 技术追踪 |
| `#data_source` | 数据源 | 内部标识 |
| `package_id` | 包ID | 内部标识 |
| `#lib` | SDK库名 | 技术字段 |
| `sdk_udid` | SDK设备ID | 技术字段 |
| `sdk_open_id` | SDK开放ID | 技术字段 |
| `sdk_adid` | 广告ID | 归因用 |
| `res_version` | 资源版本 | 技术字段 |
| `dev_version` | 系统版本 | 技术字段 |
| `server_zone_offset` | 时区偏移 | 时间计算用 |

#### 3.1.5 游戏建筑数据（不需要展示）

以下字段为游戏内建筑等级，一般不在后台展示：

```
steel_plant, missile_factory_lv, naval_academy_lv, manu_factory_lv,
oil_plant, power_plant, coastal_comand_lv, torpedo_factory_lv,
aircraft_factory_lv, warehouse_lv
```

---

### 3.2 订单数据字段分析 (recharge_complete)

#### 3.2.1 核心业务字段（必需）

| CSV字段 | 网站字段 | 说明 | 是否去重 |
|---------|----------|------|----------|
| `game_order_id` | 订单号 | 订单唯一标识 | ✅ 主键，需去重 |
| `role_id` | 角色ID | 关联角色 | 否 |
| `role_name` | 角色昵称 | 角色名称 | 否 |
| `pay_amount_usd` | 充值金额(USD) | 订单金额 | 否 |
| `currency_type` | 币种 | 支付货币类型 | 否 |
| `currency_amount` | 原币金额 | 原始货币金额 | 否 |
| `goods_id` | 商品ID | 购买商品标识 | 否 |
| `goods_price` | 商品价格 | 商品定价 | 否 |
| `goods_currency` | 商品币种 | 商品定价货币 | 否 |
| `#event_time` | 充值时间 | 订单完成时间 | 否 |
| `server_id` | 区服ID | 服务器标识 | 否 |
| `server_name` | 区服名称 | 服务器名称 | 否 |
| `#country` | 国家 | 国家名称 | 否 |
| `dev_type` | 系统 | iOS/Android | 否 |
| `channel_id` | 充值渠道 | 支付渠道 | 否 |
| `role_level` | 角色等级 | 充值时等级 | 否 |

#### 3.2.2 验证字段（后端使用）

| CSV字段 | 说明 | 处理建议 |
|---------|------|----------|
| `is_sandbox` | 沙盒标记 | 过滤测试订单(0=正式,1=测试) |

#### 3.2.3 扩展数据字段（JSON格式）

以下字段包含复杂的 JSON 数据，可选择性解析：

| CSV字段 | 说明 | 建议 |
|---------|------|------|
| `captain_bag` | 船长背包 | 高级分析用 |
| `strategicweapon_info` | 战略武器信息 | 高级分析用 |
| `fleet_info` | 舰队信息 | 高级分析用 |
| `faction_info` | 公会信息 | 高级分析用 |
| `reward` | 奖励信息 | 订单关联奖励 |
| `giftpack` | 礼包信息 | 购买礼包详情 |

---

## 四、数据去重策略

### 4.1 角色数据去重

```sql
-- 主键：role_id
-- 去重逻辑：同一 role_id 保留最新记录（按 #event_time 排序）
SELECT DISTINCT ON (role_id) *
FROM role_data
ORDER BY role_id, "#event_time" DESC;
```

**去重场景**：
- 同一角色可能有多条 `role_create` 记录（如重新登录触发）
- 保留最新状态数据

### 4.2 订单数据去重

```sql
-- 主键：game_order_id
-- 去重逻辑：订单号唯一，重复记录直接删除
SELECT DISTINCT ON (game_order_id) *
FROM order_data
WHERE is_sandbox = 0;  -- 排除沙盒订单
```

**去重场景**：
- 订单回调可能重复触发
- 需排除沙盒测试订单

### 4.3 关联数据一致性

```sql
-- 确保订单关联的角色存在
SELECT o.*
FROM order_data o
INNER JOIN role_data r ON o.role_id = r.role_id;
```

---

## 五、概要面板聚合计算

### 5.1 今日统计

```sql
-- 今日新增玩家
SELECT COUNT(DISTINCT role_id) as today_new_players
FROM role_data
WHERE DATE("#event_time") = CURRENT_DATE;

-- 今日活跃玩家（有充值记录）
SELECT COUNT(DISTINCT role_id) as today_active_players
FROM order_data
WHERE DATE("#event_time") = CURRENT_DATE;

-- 今日付费玩家
SELECT COUNT(DISTINCT role_id) as today_paid_players
FROM order_data
WHERE DATE("#event_time") = CURRENT_DATE;

-- 今日充值金额
SELECT SUM(pay_amount_usd) as today_revenue
FROM order_data
WHERE DATE("#event_time") = CURRENT_DATE
  AND is_sandbox = 0;
```

### 5.2 本月统计

```sql
-- 本月新增玩家
SELECT COUNT(DISTINCT role_id) as monthly_new_players
FROM role_data
WHERE DATE_TRUNC('month', "#event_time") = DATE_TRUNC('month', CURRENT_DATE);

-- 本月充值金额
SELECT SUM(pay_amount_usd) as monthly_revenue
FROM order_data
WHERE DATE_TRUNC('month', "#event_time") = DATE_TRUNC('month', CURRENT_DATE)
  AND is_sandbox = 0;
```

### 5.3 历史累计

```sql
-- 历史总玩家数
SELECT COUNT(DISTINCT role_id) as total_players
FROM role_data;

-- 历史总充值金额
SELECT SUM(pay_amount_usd) as total_revenue
FROM order_data
WHERE is_sandbox = 0;
```

---

## 六、后端架构设计建议

### 6.1 技术栈推荐

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| API 框架 | Node.js + Express / NestJS | 与前端技术栈一致 |
| 数据库 | PostgreSQL | 支持复杂查询和JSON |
| 缓存 | Redis | 统计数据缓存 |
| ORM | Prisma / TypeORM | 类型安全 |
| 任务队列 | Bull | 数据导入任务 |

### 6.2 数据库表设计

#### 6.2.1 角色表 (roles)

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_id VARCHAR(50) UNIQUE NOT NULL,    -- 角色ID（业务主键）
    account_id VARCHAR(50),                  -- UCID
    role_name VARCHAR(100),                  -- 角色名称
    role_level INT DEFAULT 1,                -- 角色等级
    vip_level INT DEFAULT 0,                 -- VIP等级
    server_id INT,                           -- 区服ID
    server_name VARCHAR(50),                 -- 区服名称
    country VARCHAR(50),                     -- 国家
    country_code VARCHAR(10),                -- 国家代码
    city VARCHAR(50),                        -- 城市
    province VARCHAR(50),                    -- 省份
    device_type VARCHAR(20),                 -- 系统(iOS/Android)
    device_model VARCHAR(100),               -- 设备型号
    channel_id INT,                          -- 渠道ID
    app_version VARCHAR(20),                 -- APP版本
    total_recharge_usd DECIMAL(12,2) DEFAULT 0, -- 累计充值(USD)
    total_recharge_times INT DEFAULT 0,      -- 充值次数
    total_login_days INT DEFAULT 0,          -- 登录天数
    total_online_time INT DEFAULT 0,         -- 在线时长(秒)
    register_time TIMESTAMP,                 -- 注册时间
    last_login_time TIMESTAMP,               -- 最后登录时间
    last_update_time TIMESTAMP,              -- 最后更新时间
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_roles_server ON roles(server_id);
CREATE INDEX idx_roles_country ON roles(country_code);
CREATE INDEX idx_roles_channel ON roles(channel_id);
CREATE INDEX idx_roles_register_time ON roles(register_time);
CREATE INDEX idx_roles_device ON roles(device_type);
```

#### 6.2.2 订单表 (orders)

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,   -- 订单号（业务主键）
    role_id VARCHAR(50) NOT NULL,            -- 角色ID
    role_name VARCHAR(100),                  -- 角色昵称
    role_level INT,                          -- 充值时等级
    server_id INT,                           -- 区服ID
    server_name VARCHAR(50),                 -- 区服名称
    country VARCHAR(50),                     -- 国家
    device_type VARCHAR(20),                 -- 系统
    channel_id INT,                          -- 充值渠道
    goods_id VARCHAR(50),                    -- 商品ID
    goods_price DECIMAL(12,2),               -- 商品价格
    goods_currency VARCHAR(10),              -- 商品币种
    pay_amount_usd DECIMAL(12,2) NOT NULL,   -- 充值金额(USD)
    currency_type VARCHAR(10),               -- 支付币种
    currency_amount DECIMAL(12,2),           -- 原币金额
    order_type VARCHAR(20) DEFAULT 'recharge', -- 订单类型
    is_sandbox BOOLEAN DEFAULT FALSE,        -- 是否沙盒
    pay_time TIMESTAMP NOT NULL,             -- 充值时间
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- 索引
CREATE INDEX idx_orders_role ON orders(role_id);
CREATE INDEX idx_orders_server ON orders(server_id);
CREATE INDEX idx_orders_pay_time ON orders(pay_time);
CREATE INDEX idx_orders_channel ON orders(channel_id);
CREATE INDEX idx_orders_sandbox ON orders(is_sandbox);
```

#### 6.2.3 每日统计表 (daily_stats)

```sql
CREATE TABLE daily_stats (
    id SERIAL PRIMARY KEY,
    stat_date DATE UNIQUE NOT NULL,          -- 统计日期
    new_players INT DEFAULT 0,               -- 新增玩家
    active_players INT DEFAULT 0,            -- 活跃玩家
    paid_players INT DEFAULT 0,              -- 付费玩家
    total_revenue DECIMAL(12,2) DEFAULT 0,   -- 总收入(USD)
    total_orders INT DEFAULT 0,              -- 订单数
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date);
```

### 6.3 API 接口设计

#### 6.3.1 角色列表 API

```typescript
// GET /api/roles
interface RoleListParams {
    page: number;
    pageSize: number;
    gameProject?: string;
    serverId?: number;
    channel1?: string;
    channel2?: string;
    channel3?: string;
    system?: 'iOS' | 'Android';
    timezone?: string;
    roleId?: string;
    roleName?: string;
    registerTimeStart?: string;
    registerTimeEnd?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
}

interface RoleListResponse {
    total: number;
    list: Role[];
}
```

#### 6.3.2 订单列表 API

```typescript
// GET /api/orders
interface OrderListParams {
    page: number;
    pageSize: number;
    gameProject?: string;
    serverId?: number;
    channel1?: string;
    channel2?: string;
    channel3?: string;
    orderType?: string;
    system?: 'iOS' | 'Android';
    timezone?: string;
    roleId?: string;
    roleName?: string;
    payTimeStart?: string;
    payTimeEnd?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
}

interface OrderListResponse {
    total: number;
    totalAmount: number;  // 累计充值金额
    list: Order[];
}
```

#### 6.3.3 概要面板 API

```typescript
// GET /api/dashboard/stats
interface DashboardStats {
    today: {
        newPlayers: number;
        activePlayers: number;
        paidPlayers: number;
        revenue: number;
    };
    monthly: {
        newPlayers: number;
        activePlayers: number;
        paidPlayers: number;
        revenue: number;
    };
    total: {
        newPlayers: number;
        activePlayers: number;
        paidPlayers: number;
        revenue: number;
    };
}
```

### 6.4 数据导入流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CSV 文件   │────>│  数据解析   │────>│  数据清洗   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  统计更新   │<────│  入库存储   │<────│  去重处理   │
└─────────────┘     └─────────────┘     └─────────────┘
```

#### 6.4.1 导入脚本示例

```typescript
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';

async function importRoleData(filePath: string) {
    const parser = createReadStream(filePath).pipe(
        parse({ columns: true, skip_empty_lines: true })
    );
    
    const batch: Role[] = [];
    const BATCH_SIZE = 1000;
    
    for await (const record of parser) {
        // 字段映射
        const role = {
            role_id: record['role_id'],
            account_id: record['#account_id'],
            role_name: record['role_name'],
            role_level: parseInt(record['role_level']) || 1,
            server_id: parseInt(record['server_id']),
            server_name: record['server_name'],
            country: record['#country'],
            country_code: record['#country_code'],
            device_type: record['dev_type'],
            channel_id: parseInt(record['channel_id']),
            total_recharge_usd: parseFloat(record['total_recharge_usd']) || 0,
            total_recharge_times: parseInt(record['total_recharge_times']) || 0,
            register_time: new Date(record['#event_time']),
        };
        
        batch.push(role);
        
        if (batch.length >= BATCH_SIZE) {
            await upsertRoles(batch);
            batch.length = 0;
        }
    }
    
    // 处理剩余数据
    if (batch.length > 0) {
        await upsertRoles(batch);
    }
}

async function upsertRoles(roles: Role[]) {
    // 使用 ON CONFLICT 实现 upsert
    await prisma.$executeRaw`
        INSERT INTO roles (role_id, account_id, role_name, ...)
        VALUES ${Prisma.join(roles.map(r => Prisma.sql`(${r.role_id}, ${r.account_id}, ...)`), ',')}
        ON CONFLICT (role_id) 
        DO UPDATE SET 
            role_level = EXCLUDED.role_level,
            total_recharge_usd = EXCLUDED.total_recharge_usd,
            updated_at = NOW()
    `;
}
```

---

## 七、数据接入实施步骤

### 阶段一：数据准备
1. 创建数据库和表结构
2. 编写数据导入脚本
3. 执行初始数据导入
4. 验证数据完整性

### 阶段二：API 开发
1. 搭建后端项目框架
2. 实现角色列表 API
3. 实现订单列表 API
4. 实现概要面板统计 API
5. 添加导出功能

### 阶段三：前后端对接
1. 修改前端 Mock 数据为真实 API 调用
2. 调整数据格式适配
3. 添加加载状态和错误处理
4. 性能优化

### 阶段四：数据同步
1. 设置定时任务自动导入新数据
2. 实现增量更新逻辑
3. 添加数据监控和告警

---

## 八、注意事项

### 8.1 数据安全
- IP 地址等敏感信息需脱敏处理
- SDK 相关 ID 不应前端展示
- 订单金额数据需要权限控制

### 8.2 性能优化
- 大量数据查询需分页
- 统计数据使用缓存
- 建立合适的数据库索引
- 考虑数据分区（按日期）

### 8.3 数据质量
- 处理空值和异常值
- 统一时区处理
- 货币汇率转换逻辑

---

## 九、字段映射速查表

### 9.1 角色列表字段映射

| 前端展示字段 | CSV 字段 | 数据库字段 |
|-------------|----------|-----------|
| 项目 | - | game_project |
| 角色ID | role_id | role_id |
| UCID | #account_id | account_id |
| 区服 | server_id / server_name | server_id |
| 系统 | dev_type | device_type |
| 角色名称 | role_name | role_name |
| 国家 | #country | country |
| 角色等级 | role_level | role_level |
| 注册时间 | #event_time | register_time |
| 最后登录时间 | - | last_login_time |
| 最后更改时间 | - | last_update_time |
| 总付费金额 | total_recharge_usd | total_recharge_usd |
| 总付费笔数 | total_recharge_times | total_recharge_times |
| 一级渠道 | channel_id | channel_id |

### 9.2 订单列表字段映射

| 前端展示字段 | CSV 字段 | 数据库字段 |
|-------------|----------|-----------|
| 项目 | - | game_project |
| 角色ID | role_id | role_id |
| 区服 | server_id | server_id |
| 系统 | dev_type | device_type |
| 角色昵称 | role_name | role_name |
| 角色等级 | role_level | role_level |
| 充值时间 | #event_time | pay_time |
| 充值金额 | pay_amount_usd | pay_amount_usd |
| 币种 | currency_type | currency_type |
| 订单类型 | - | order_type |
| 订单号 | game_order_id | order_id |
| 充值渠道 | channel_id | channel_id |
| 一级渠道 | channel_id | channel_id |

---

*报告生成时间：2026-02-04*
*版本：1.0*
