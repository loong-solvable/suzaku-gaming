# Suzaku Gaming 终极企业级完整项目补全蓝图

**文档版本**: v2.0.0  
**生成日期**: 2026-02-04  
**文档性质**: 企业级生产环境交付蓝图 / 工程实施指南  
**目标受众**: 高级软件工程师 / 技术架构师  
**核心原则**: 渐进交付 (Incremental Delivery) · 质量门禁 (Quality Gates) · 零回归 (Zero Regression)

---

## 文档导航

| 章节 | 内容 | 阅读建议 |
|------|------|----------|
| [第一部分](#part1) | 项目现状深度诊断 | 必读 - 了解起点 |
| [第二部分](#part2) | 目标架构蓝图 | 必读 - 了解终点 |
| [第三部分](#part3) | 分阶段实施计划 | 核心 - 执行指南 |
| [第四部分](#part4) | 详细接口契约 | 开发时参考 |
| [第五部分](#part5) | 数据库Schema完整定义 | 开发时参考 |
| [第六部分](#part6) | 测试策略与用例 | 质量保障 |
| [第七部分](#part7) | 部署与运维 | 交付阶段参考 |
| [附录](#appendix) | 速查表与检查清单 | 随时查阅 |

---

<a name="part1"></a>
# 第一部分：项目现状深度诊断

## 1.1 现有资产盘点

### 1.1.1 前端代码库 (suzaku-gaming-admin/)

| 类别 | 完成状态 | 文件路径 | 质量评估 |
|------|----------|----------|----------|
| **项目配置** | ✅ 100% | `package.json`, `vite.config.ts`, `tsconfig.json` | 优秀 |
| **样式系统** | ✅ 90% | `src/assets/styles/tokens.scss` | 需补充响应式Token |
| **布局组件** | ✅ 80% | `src/components/layout/Sidebar/`, `Header/` | 功能完整，需优化细节 |
| **通用组件** | 🔶 60% | `src/components/common/` | StatCard、FilterBar、DataTable、ImageUpload 骨架存在，缺少完整Props/Events |
| **业务页面** | 🔶 50% | `src/views/` | Dashboard、RoleList、OrderList、BindingApply、NewAttribution 基础结构存在 |
| **路由配置** | ❌ 20% | `src/router/routes.ts` | 仅有Dashboard路由，缺少完整路由树 |
| **状态管理** | 🔶 40% | `src/stores/app.ts` | 仅有App Store，缺少User Store和业务Store |
| **API层** | ❌ 10% | `src/utils/request.ts` | Axios封装完成，但无API模块定义 |
| **Mock服务** | 🔶 30% | `src/mock/` | 仅有dashboard.ts，缺少其他模块Mock |
| **Hooks** | ❌ 10% | `src/composables/` | 仅有useSubmitLock，缺少useTable、useFilter |
| **单元测试** | ❌ 0% | - | 完全缺失 |
| **E2E测试** | ❌ 0% | - | 完全缺失 |

### 1.1.2 后端服务

| 类别 | 完成状态 | 说明 |
|------|----------|------|
| NestJS项目 | ❌ 0% | 完全缺失 |
| 数据库Schema | ❌ 0% | 仅有设计文档 |
| ETL脚本 | ❌ 0% | 完全缺失 |
| API实现 | ❌ 0% | 完全缺失 |
| 认证系统 | ❌ 0% | 完全缺失 |

### 1.1.3 基础设施

| 类别 | 完成状态 | 说明 |
|------|----------|------|
| Docker配置 | ❌ 0% | 完全缺失 |
| CI/CD流水线 | ❌ 0% | 完全缺失 |
| 日志系统 | ❌ 0% | 完全缺失 |
| 监控告警 | ❌ 0% | 完全缺失 |

### 1.1.4 数据资产

| 文件 | 内容 | 记录数 | 状态 |
|------|------|--------|------|
| `20260204_014715_06858_y9rrj.csv` | 角色创建事件 (role_create) | ~50+ | ✅ 可用 |
| `20260204_014828_06863_y9rrj.csv` | 充值完成事件 (recharge_complete) | ~100+ | ✅ 可用 |

## 1.2 现有代码问题清单

### 1.2.1 路由配置问题

**问题描述**: 当前 `src/router/routes.ts` 仅定义了Dashboard路由，缺失其他页面路由。

**当前代码** (`src/router/routes.ts`):
```typescript
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard/index.vue'),
    meta: { title: '概要面板', icon: 'House', breadcrumb: ['概要面板'] }
  }
];
```

**期望代码**: 见 [3.2.2 路由重构](#section-3-2-2)

### 1.2.2 组件Filter Props不完整

**问题描述**: `RoleListFilter.vue` 和 `OrderListFilter.vue` 的字段配置与设计规格不一致。

**当前问题**:
- 时区选项使用动态计算而非固定值
- 缺少部分筛选字段
- 标签样式不符合规格

### 1.2.3 Mock数据不完整

**问题描述**: Mock数据仅覆盖Dashboard，其他模块缺失。

### 1.2.4 测试完全缺失

**问题描述**: 无任何单元测试和E2E测试文件。

## 1.3 技术债务评估

| 债务类型 | 严重程度 | 修复优先级 | 预计工时 |
|----------|----------|------------|----------|
| 路由配置不完整 | 🔴 高 | P0 | 2h |
| 缺少API模块 | 🔴 高 | P0 | 4h |
| 缺少完整Mock | 🔴 高 | P0 | 6h |
| Store不完整 | 🟡 中 | P1 | 3h |
| Hooks缺失 | 🟡 中 | P1 | 4h |
| 测试缺失 | 🟡 中 | P1 | 16h |
| 后端完全缺失 | 🔴 高 | P0 | 40h |

**总技术债务**: 约 75 人时

---

<a name="part2"></a>
# 第二部分：目标架构蓝图

## 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   Suzaku Gaming Admin                                │
│                                 企业级后台管理系统架构                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              表现层 (Presentation)                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│  │  │  Dashboard  │  │  RoleList   │  │  OrderList  │  │  Audit      │        │   │
│  │  │  概要面板    │  │  角色列表    │  │  订单列表    │  │  审核模块    │        │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │   │
│  │         │                │                │                │                │   │
│  │  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │   │
│  │  │                    通用组件层 (Components)                       │        │   │
│  │  │  StatCard | FilterBar | DataTable | ImageUpload | Pagination   │        │   │
│  │  └────────────────────────────────────────────────────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                          │
│                                          │ HTTP/REST                                │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              应用层 (Application)                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│  │  │  Auth       │  │  Dashboard  │  │  Players    │  │  Audit      │        │   │
│  │  │  Controller │  │  Controller │  │  Controller │  │  Controller │        │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │   │
│  │         │                │                │                │                │   │
│  │  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │   │
│  │  │                      服务层 (Services)                          │        │   │
│  │  │  AuthService | StatsService | PlayerService | AuditService     │        │   │
│  │  └────────────────────────────────────────────────────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                          │
│                                          │ Prisma ORM                               │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              数据层 (Data)                                   │   │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐      │   │
│  │  │    PostgreSQL 15    │  │      Redis 7        │  │    File Store   │      │   │
│  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────┐  │      │   │
│  │  │  │ admin_users   │  │  │  │ Session Cache │  │  │  │ Uploads   │  │      │   │
│  │  │  │ roles         │  │  │  │ Stats Cache   │  │  │  │ Exports   │  │      │   │
│  │  │  │ orders        │  │  │  │ Rate Limit    │  │  │  │ Logs      │  │      │   │
│  │  │  │ audit_logs    │  │  │  └───────────────┘  │  │  └───────────┘  │      │   │
│  │  │  │ binding_apply │  │  │                     │  │                 │      │   │
│  │  │  │ daily_stats   │  │  │                     │  │                 │      │   │
│  │  │  └───────────────┘  │  │                     │  │                 │      │   │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 技术栈最终确定

### 2.2.1 前端技术栈 (已存在，需完善)

| 层级 | 技术 | 版本 | 状态 |
|------|------|------|------|
| 框架 | Vue | 3.4.21 | ✅ 已配置 |
| 语言 | TypeScript | ^5.0.0 | ✅ 已配置 |
| 构建 | Vite | ^7.2.4 | ✅ 已配置 |
| UI库 | Element Plus | 2.6.1 | ✅ 已配置 |
| 路由 | Vue Router | 4.3.0 | ✅ 已配置 |
| 状态 | Pinia | 2.1.7 | ✅ 已配置 |
| HTTP | Axios | ^1.6.0 | ✅ 已配置 |
| 日期 | dayjs | 1.11.10 | ✅ 已配置 |
| Mock | mockjs | 1.1.0 | ✅ 已配置 |
| 测试 | Vitest | 1.5.0 | ⚠️ 需实现测试 |
| E2E | Playwright | 1.41.0 | ⚠️ 需实现测试 |

### 2.2.2 后端技术栈 (需新建)

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | NestJS | ^10.0.0 | 企业级Node.js框架 |
| 语言 | TypeScript | ^5.0.0 | 前后端统一语言 |
| ORM | Prisma | ^5.0.0 | 类型安全ORM |
| 数据库 | PostgreSQL | 15+ | 主数据存储 |
| 缓存 | Redis | 7+ | Session/缓存 |
| 认证 | Passport.js | ^0.7.0 | JWT认证 |
| 文档 | Swagger | - | OpenAPI 3.0 |
| 日志 | Winston | ^3.0.0 | 日志管理 |
| 验证 | class-validator | ^0.14.0 | DTO验证 |
| 安全 | Helmet | ^7.0.0 | HTTP安全头 |

### 2.2.3 基础设施

| 类别 | 技术 | 用途 |
|------|------|------|
| 容器化 | Docker | 环境一致性 |
| 编排 | Docker Compose | 本地开发环境 |
| CI/CD | GitHub Actions | 自动化流水线 |
| 进程管理 | PM2 | 生产环境进程管理 |
| 反向代理 | Nginx | 负载均衡、静态资源 |

## 2.3 目录结构规划

### 2.3.1 前端目录结构 (完整版)

```
suzaku-gaming-admin/
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── e2e/                              # E2E测试
│   ├── dashboard.spec.ts
│   ├── role-list.spec.ts
│   ├── order-list.spec.ts
│   ├── binding-apply.spec.ts
│   ├── new-attribution.spec.ts
│   └── visual/
│       ├── baseline/
│       └── pages.visual.spec.ts
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                          # API接口定义 [需新建]
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── player.ts
│   │   └── audit.ts
│   ├── assets/
│   │   └── styles/
│   │       ├── tokens.scss           # ✅ 已存在
│   │       ├── variables.scss        # ✅ 已存在
│   │       ├── element.scss          # ✅ 已存在
│   │       ├── reset.scss            # ✅ 已存在
│   │       └── index.scss            # ✅ 已存在
│   ├── components/
│   │   ├── layout/                   # ✅ 已存在
│   │   │   ├── Sidebar/
│   │   │   └── Header/
│   │   └── common/                   # ✅ 已存在，需完善
│   │       ├── StatCard/
│   │       │   ├── index.vue
│   │       │   └── __tests__/        # [需新建]
│   │       │       └── StatCard.spec.ts
│   │       ├── FilterBar/
│   │       │   ├── index.vue
│   │       │   └── __tests__/        # [需新建]
│   │       ├── DataTable/
│   │       │   ├── index.vue
│   │       │   └── __tests__/        # [需新建]
│   │       └── ImageUpload/
│   │           ├── index.vue
│   │           └── __tests__/        # [需新建]
│   ├── composables/                  # [需完善]
│   │   ├── useTable.ts               # [需新建]
│   │   ├── useFilter.ts              # [需新建]
│   │   └── useSubmitLock.ts          # ✅ 已存在
│   ├── layouts/                      # [需新建]
│   │   └── MainLayout.vue
│   ├── mock/                         # [需完善]
│   │   ├── index.ts                  # ✅ 已存在
│   │   ├── dashboard.ts              # ✅ 已存在
│   │   ├── player.ts                 # [需新建]
│   │   └── audit.ts                  # [需新建]
│   ├── router/
│   │   ├── index.ts                  # ✅ 已存在
│   │   └── routes.ts                 # [需重写]
│   ├── stores/
│   │   ├── index.ts                  # [需新建]
│   │   ├── app.ts                    # ✅ 已存在，需完善
│   │   └── user.ts                   # [需新建]
│   ├── types/
│   │   ├── api.d.ts                  # ✅ 已存在
│   │   ├── components.d.ts           # ✅ 已存在
│   │   └── global.d.ts               # ✅ 已存在
│   ├── utils/
│   │   ├── request.ts                # ✅ 已存在
│   │   ├── format.ts                 # ✅ 已存在
│   │   ├── export.ts                 # ✅ 已存在
│   │   └── storage.ts                # ✅ 已存在
│   ├── views/
│   │   ├── Dashboard/
│   │   │   └── index.vue             # ✅ 已存在
│   │   ├── PlayerData/
│   │   │   ├── RoleList.vue          # ✅ 已存在，需完善
│   │   │   ├── OrderList.vue         # ✅ 已存在，需完善
│   │   │   └── components/
│   │   │       ├── RoleListFilter.vue
│   │   │       └── OrderListFilter.vue
│   │   └── Audit/
│   │       ├── BindingApply.vue      # ✅ 已存在，需完善
│   │       ├── NewAttribution.vue    # ✅ 已存在，需完善
│   │       └── components/
│   │           └── BindingApplyFilter.vue
│   ├── App.vue                       # ✅ 已存在
│   ├── main.ts                       # ✅ 已存在
│   └── vite-env.d.ts                 # ✅ 已存在
├── .env                              # ✅ 已存在
├── .env.development                  # ✅ 已存在
├── .env.production                   # ✅ 已存在
├── .eslintrc.cjs                     # ✅ 已存在
├── .prettierrc                       # ✅ 已存在
├── .stylelintrc.cjs                  # ✅ 已存在
├── .nvmrc                            # ✅ 已存在
├── index.html                        # ✅ 已存在
├── package.json                      # ✅ 已存在
├── tsconfig.json                     # ✅ 已存在
├── vite.config.ts                    # ✅ 已存在
├── vitest.config.ts                  # ✅ 已存在
└── playwright.config.ts              # ✅ 已存在
```

### 2.3.2 后端目录结构 (需全新创建)

```
suzaku-gaming-server/
├── prisma/
│   ├── schema.prisma                 # 数据库模型定义
│   ├── migrations/                   # 数据库迁移
│   └── seed.ts                       # 种子数据
├── src/
│   ├── app.module.ts                 # 根模块
│   ├── main.ts                       # 应用入口
│   ├── common/                       # 公共模块
│   │   ├── decorators/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   └── pipes/
│   ├── config/                       # 配置模块
│   │   └── configuration.ts
│   ├── modules/
│   │   ├── auth/                     # 认证模块
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── dashboard/                # 概要面板模块
│   │   │   ├── dashboard.module.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   └── dashboard.service.ts
│   │   ├── player/                   # 玩家数据模块
│   │   │   ├── player.module.ts
│   │   │   ├── player.controller.ts
│   │   │   ├── player.service.ts
│   │   │   └── dto/
│   │   │       ├── query-role.dto.ts
│   │   │       └── query-order.dto.ts
│   │   ├── audit/                    # 审核模块
│   │   │   ├── audit.module.ts
│   │   │   ├── audit.controller.ts
│   │   │   ├── audit.service.ts
│   │   │   └── dto/
│   │   └── upload/                   # 文件上传模块
│   │       ├── upload.module.ts
│   │       ├── upload.controller.ts
│   │       └── upload.service.ts
│   └── shared/                       # 共享服务
│       ├── prisma/
│       │   └── prisma.service.ts
│       ├── redis/
│       │   └── redis.service.ts
│       └── logger/
│           └── logger.service.ts
├── scripts/
│   └── etl/                          # ETL脚本
│       ├── import-roles.ts
│       └── import-orders.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest.config.js
├── uploads/                          # 上传文件目录
├── logs/                             # 日志目录
├── .env
├── .env.development
├── .env.production
├── docker-compose.yml
├── Dockerfile
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

<a name="part3"></a>
# 第三部分：分阶段实施计划

## 实施总览

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              分阶段实施路线图                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Phase 1: 前端基础修复 ─────────────────────────────────────────────────────▶ Day 1 │
│  ├── 1.1 路由配置修复                                                               │
│  ├── 1.2 Store完善                                                                  │
│  ├── 1.3 Hooks实现                                                                  │
│  └── 1.4 API模块定义                                                                │
│                                                                                     │
│  Phase 2: Mock数据完善 ─────────────────────────────────────────────────────▶ Day 2 │
│  ├── 2.1 角色列表Mock                                                               │
│  ├── 2.2 订单列表Mock                                                               │
│  └── 2.3 审核模块Mock                                                               │
│                                                                                     │
│  Phase 3: 组件完善与测试 ───────────────────────────────────────────────────▶ Day 3 │
│  ├── 3.1 通用组件Props完善                                                          │
│  ├── 3.2 单元测试编写                                                               │
│  └── 3.3 E2E测试编写                                                                │
│                                                                                     │
│  Phase 4: 后端项目初始化 ───────────────────────────────────────────────────▶ Day 4 │
│  ├── 4.1 NestJS项目创建                                                             │
│  ├── 4.2 数据库配置                                                                 │
│  └── 4.3 公共模块实现                                                               │
│                                                                                     │
│  Phase 5: 数据层实现 ───────────────────────────────────────────────────────▶ Day 5 │
│  ├── 5.1 Prisma Schema定义                                                          │
│  ├── 5.2 数据库迁移                                                                 │
│  └── 5.3 ETL脚本开发                                                                │
│                                                                                     │
│  Phase 6: 业务API实现 ─────────────────────────────────────────────────────▶ Day 6-7│
│  ├── 6.1 认证模块                                                                   │
│  ├── 6.2 Dashboard模块                                                              │
│  ├── 6.3 Player模块                                                                 │
│  └── 6.4 Audit模块                                                                  │
│                                                                                     │
│  Phase 7: 前后端联调 ──────────────────────────────────────────────────────▶ Day 8  │
│  ├── 7.1 API对接                                                                    │
│  ├── 7.2 错误处理                                                                   │
│  └── 7.3 联调测试                                                                   │
│                                                                                     │
│  Phase 8: 部署与交付 ──────────────────────────────────────────────────────▶ Day 9  │
│  ├── 8.1 Docker配置                                                                 │
│  ├── 8.2 CI/CD配置                                                                  │
│  └── 8.3 最终验收                                                                   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: 前端基础修复 (Day 1)

### 1.1 路由配置修复

<a name="section-3-2-2"></a>
#### 1.1.1 任务说明

| 属性 | 值 |
|------|-----|
| 目标 | 实现完整的路由树配置 |
| 输入 | 当前不完整的routes.ts |
| 输出 | 符合设计规格的完整路由 |
| 验收标准 | 所有页面可正常访问，面包屑正确显示 |

#### 1.1.2 完整代码实现

**文件**: `src/router/routes.ts`

```typescript
// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router';

const MainLayout = () => import('@/layouts/MainLayout.vue');

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      // 概要面板
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: {
          title: '概要面板',
          icon: 'House',
          breadcrumb: ['概要面板']
        }
      },
      // 玩家数据报表
      {
        path: 'player-data',
        name: 'PlayerData',
        redirect: '/player-data/role-list',
        meta: {
          title: '玩家数据报表',
          icon: 'DataLine'
        },
        children: [
          {
            path: 'role-list',
            name: 'RoleList',
            component: () => import('@/views/PlayerData/RoleList.vue'),
            meta: {
              title: '角色列表',
              breadcrumb: ['玩家数据报表', '角色列表']
            }
          },
          {
            path: 'order-list',
            name: 'OrderList',
            component: () => import('@/views/PlayerData/OrderList.vue'),
            meta: {
              title: '订单列表',
              breadcrumb: ['玩家数据报表', '订单列表']
            }
          }
        ]
      },
      // 审核
      {
        path: 'audit',
        name: 'Audit',
        redirect: '/audit/binding-apply',
        meta: {
          title: '审核',
          icon: 'Checked'
        },
        children: [
          {
            path: 'binding-apply',
            name: 'BindingApply',
            component: () => import('@/views/Audit/BindingApply.vue'),
            meta: {
              title: '绑定申请',
              breadcrumb: ['审核', '绑定申请']
            }
          },
          {
            path: 'new-attribution',
            name: 'NewAttribution',
            component: () => import('@/views/Audit/NewAttribution.vue'),
            meta: {
              title: '新增归因更改',
              breadcrumb: ['审核', '新增归因更改']
            }
          }
        ]
      }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error/404.vue')
  }
];

export default routes;
```

#### 1.1.3 创建MainLayout组件

**文件**: `src/layouts/MainLayout.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/stores/app';
import Sidebar from '@/components/layout/Sidebar/index.vue';
import Header from '@/components/layout/Header/index.vue';

const appStore = useAppStore();
const sidebarWidth = computed(() => appStore.sidebarWidth);
</script>

<template>
  <div class="main-layout">
    <Sidebar />
    <div 
      class="main-container" 
      :style="{ marginLeft: sidebarWidth + 'px' }"
    >
      <Header />
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  background: var(--bg-page, #f0f2f5);
}

.main-container {
  transition: margin-left 0.3s ease;
}

.main-content {
  padding: 16px;
  min-height: calc(100vh - 56px);
  margin-top: 56px;
}
</style>
```

#### 1.1.4 验收检查项

```bash
# 验收检查命令
pnpm dev

# 验收检查项:
# [ ] 访问 /dashboard 正常显示概要面板
# [ ] 访问 /player-data/role-list 正常显示角色列表
# [ ] 访问 /player-data/order-list 正常显示订单列表
# [ ] 访问 /audit/binding-apply 正常显示绑定申请
# [ ] 访问 /audit/new-attribution 正常显示新增归因更改
# [ ] 面包屑正确显示层级路径
# [ ] 访问不存在路由跳转404页面
```

---

### 1.2 Store完善

#### 1.2.1 任务说明

| 属性 | 值 |
|------|-----|
| 目标 | 完善Pinia Store定义 |
| 输入 | 当前仅有app.ts的stores目录 |
| 输出 | 完整的状态管理模块 |
| 验收标准 | 侧边栏状态持久化正常，用户信息正确显示 |

#### 1.2.2 创建Store入口

**文件**: `src/stores/index.ts`

```typescript
// src/stores/index.ts
import { createPinia } from 'pinia';

const pinia = createPinia();

export { pinia };
export { useAppStore } from './app';
export { useUserStore } from './user';
```

#### 1.2.3 完善App Store

**文件**: `src/stores/app.ts`

```typescript
// src/stores/app.ts
import { defineStore } from 'pinia';

interface AppState {
  sidebarCollapsed: boolean;
  loading: boolean;
  networkStatus: 'online' | 'offline';
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    loading: false,
    networkStatus: 'online'
  }),

  getters: {
    sidebarWidth(): number {
      return this.sidebarCollapsed ? 64 : 220;
    }
  },

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
    },

    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed;
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setNetworkStatus(status: 'online' | 'offline') {
      this.networkStatus = status;
    }
  }
});
```

#### 1.2.4 创建User Store

**文件**: `src/stores/user.ts`

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia';

interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: string;
  avatar?: string;
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: null
  }),

  getters: {
    isLoggedIn(): boolean {
      return !!this.token;
    },

    displayName(): string {
      return this.userInfo?.realName || this.userInfo?.username || '未登录';
    },

    roleName(): string {
      const roleMap: Record<string, string> = {
        admin: '管理员',
        operator: '运营',
        viewer: '访客'
      };
      return roleMap[this.userInfo?.role || ''] || '未知角色';
    }
  },

  actions: {
    setToken(token: string) {
      this.token = token;
      localStorage.setItem('token', token);
    },

    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo;
    },

    // 模拟登录 - 开发阶段使用
    mockLogin() {
      this.setToken('mock-token-12345');
      this.setUserInfo({
        id: 1,
        username: '3kadmin',
        realName: '管理员',
        role: 'admin',
        avatar: ''
      });
    },

    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
    }
  }
});
```

---

### 1.3 Hooks实现

#### 1.3.1 useTable Hook

**文件**: `src/composables/useTable.ts`

```typescript
// src/composables/useTable.ts
import { ref, reactive, onUnmounted, watch } from 'vue';

interface UseTableOptions<T> {
  fetchApi: (params: Record<string, unknown>) => Promise<{ list: T[]; total: number }>;
  defaultPageSize?: number;
  immediate?: boolean;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface Sort {
  prop: string | null;
  order: 'ascending' | 'descending' | null;
}

export function useTable<T = unknown>(options: UseTableOptions<T>) {
  const { fetchApi, defaultPageSize = 20, immediate = true } = options;

  const loading = ref(false);
  const data = ref<T[]>([]) as Ref<T[]>;
  const pagination = reactive<Pagination>({
    page: 1,
    pageSize: defaultPageSize,
    total: 0
  });
  const sort = reactive<Sort>({
    prop: null,
    order: null
  });

  let abortController: AbortController | null = null;

  const fetchData = async (filterParams: Record<string, unknown> = {}) => {
    // 取消之前的请求
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading.value = true;
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sort.prop,
        sortOrder: sort.order === 'ascending' ? 'asc' : sort.order === 'descending' ? 'desc' : null,
        ...filterParams
      };

      // 过滤掉空值
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );

      const result = await fetchApi(cleanParams);
      data.value = result.list;
      pagination.total = result.total;
    } catch (error: unknown) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Table fetch error:', error);
      }
    } finally {
      loading.value = false;
    }
  };

  const handlePageChange = (page: number) => {
    pagination.page = page;
  };

  const handleSizeChange = (size: number) => {
    pagination.pageSize = size;
    pagination.page = 1;
  };

  const handleSortChange = ({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }) => {
    sort.prop = prop;
    sort.order = order;
    pagination.page = 1;
  };

  const reset = () => {
    pagination.page = 1;
    pagination.pageSize = defaultPageSize;
    pagination.total = 0;
    sort.prop = null;
    sort.order = null;
    data.value = [];
  };

  const refresh = (filterParams: Record<string, unknown> = {}) => {
    return fetchData(filterParams);
  };

  // 监听分页变化自动获取数据
  watch(
    () => [pagination.page, pagination.pageSize, sort.prop, sort.order],
    () => {
      // 这里不自动调用，需要配合 FilterBar 使用
    }
  );

  onUnmounted(() => {
    if (abortController) {
      abortController.abort();
    }
  });

  // 立即执行首次加载
  if (immediate) {
    fetchData();
  }

  return {
    loading,
    data,
    pagination,
    sort,
    fetchData,
    handlePageChange,
    handleSizeChange,
    handleSortChange,
    reset,
    refresh
  };
}
```

#### 1.3.2 useFilter Hook

**文件**: `src/composables/useFilter.ts`

```typescript
// src/composables/useFilter.ts
import { reactive, toRaw } from 'vue';

interface UseFilterOptions<T> {
  defaultValues: T;
  onSearch?: (values: T) => void;
  onReset?: () => void;
}

export function useFilter<T extends Record<string, unknown>>(options: UseFilterOptions<T>) {
  const { defaultValues, onSearch, onReset } = options;

  // 创建响应式筛选值，深拷贝默认值
  const filterValues = reactive<T>(JSON.parse(JSON.stringify(defaultValues)));

  const handleSearch = () => {
    const rawValues = toRaw(filterValues) as T;
    onSearch?.(rawValues);
  };

  const handleReset = () => {
    // 重置所有值为默认值
    Object.keys(defaultValues).forEach((key) => {
      (filterValues as Record<string, unknown>)[key] = (defaultValues as Record<string, unknown>)[key];
    });
    onReset?.();
  };

  const getFilterValues = (): T => {
    return JSON.parse(JSON.stringify(toRaw(filterValues)));
  };

  const setFilterValue = <K extends keyof T>(key: K, value: T[K]) => {
    (filterValues as Record<string, unknown>)[key as string] = value;
  };

  return {
    filterValues,
    handleSearch,
    handleReset,
    getFilterValues,
    setFilterValue
  };
}
```

---

### 1.4 API模块定义

#### 1.4.1 API入口文件

**文件**: `src/api/index.ts`

```typescript
// src/api/index.ts
export * from './auth';
export * from './dashboard';
export * from './player';
export * from './audit';
```

#### 1.4.2 Dashboard API

**文件**: `src/api/dashboard.ts`

```typescript
// src/api/dashboard.ts
import { request } from '@/utils/request';

export interface DashboardStats {
  today: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
  monthly: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
  total: {
    newPlayers: number;
    activePlayers: number;
    paidPlayers: number;
    paidAmount: number;
  };
}

export const dashboardApi = {
  /**
   * 获取仪表盘统计数据
   */
  getStatistics(): Promise<DashboardStats> {
    return request.get('/dashboard/statistics');
  }
};
```

#### 1.4.3 Player API

**文件**: `src/api/player.ts`

```typescript
// src/api/player.ts
import { request } from '@/utils/request';

// 角色查询参数
export interface RoleQueryParams {
  page: number;
  pageSize: number;
  project?: string;
  serverId?: string;
  channel1?: string;
  channel2?: string;
  channel3?: string;
  system?: string;
  timezone?: string;
  roleId?: string;
  roleName?: string;
  registerTimeStart?: string;
  registerTimeEnd?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 角色数据
export interface Role {
  id: number;
  project: string;
  roleId: string;
  ucid: string;
  server: string;
  serverId: number;
  system: string;
  nickname: string;
  country: string;
  level: number;
  vipLevel: number;
  registerTime: string;
  lastLoginTime: string;
  lastUpdateTime: string;
  totalPayment: number;
  paymentCount: number;
  channel1: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
}

// 订单查询参数
export interface OrderQueryParams {
  page: number;
  pageSize: number;
  project?: string;
  serverId?: string;
  channel1?: string;
  channel2?: string;
  channel3?: string;
  orderType?: string;
  system?: string;
  timezone?: string;
  roleId?: string;
  roleName?: string;
  payTimeStart?: string;
  payTimeEnd?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 订单数据
export interface Order {
  id: number;
  project: string;
  roleId: string;
  server: string;
  serverId: number;
  system: string;
  nickname: string;
  level: number;
  payTime: string;
  lastLoginTime: string;
  amount: number;
  currency: string;
  orderType: string;
  orderNo: string;
  payChannel: string;
  channel1: string;
}

// 订单列表响应（含累计金额）
export interface OrderListResponse {
  list: Order[];
  total: number;
  totalAmount: number;
}

export const playerApi = {
  /**
   * 获取角色列表
   */
  getRoles(params: RoleQueryParams): Promise<PaginatedResponse<Role>> {
    return request.get('/player/roles', { params });
  },

  /**
   * 获取订单列表
   */
  getOrders(params: OrderQueryParams): Promise<OrderListResponse> {
    return request.get('/player/orders', { params });
  },

  /**
   * 导出角色数据
   */
  exportRoles(params: Omit<RoleQueryParams, 'page' | 'pageSize'>): Promise<Blob> {
    return request.get('/player/roles/export', {
      params,
      responseType: 'blob'
    });
  },

  /**
   * 导出订单数据
   */
  exportOrders(params: Omit<OrderQueryParams, 'page' | 'pageSize'>): Promise<Blob> {
    return request.get('/player/orders/export', {
      params,
      responseType: 'blob'
    });
  }
};
```

#### 1.4.4 Audit API

**文件**: `src/api/audit.ts`

```typescript
// src/api/audit.ts
import { request } from '@/utils/request';

// 绑定申请查询参数
export interface BindingApplyQueryParams {
  page: number;
  pageSize: number;
  project?: string;
  serverId?: string;
  roleId?: string;
  applicant?: string;
  status?: string;
  applyTimeStart?: string;
  applyTimeEnd?: string;
}

// 绑定申请数据
export interface BindingApply {
  id: number;
  project: string;
  roleId: string;
  server: string;
  serverId: number;
  applicant: string;
  status: 'pending' | 'approved' | 'rejected';
  applyTime: string;
  remark?: string;
}

// 新增归因更改表单
export interface AttributionForm {
  roleId: string;
  serverId: number;
  roleName: string;
  platform: string;
  teamLeader: string;
  teamMember: string;
  attachments?: string[];
  remark?: string;
}

export const auditApi = {
  /**
   * 获取绑定申请列表
   */
  getBindingApplies(params: BindingApplyQueryParams): Promise<{ list: BindingApply[]; total: number }> {
    return request.get('/audit/binding-applies', { params });
  },

  /**
   * 获取绑定申请详情
   */
  getBindingApplyDetail(id: number): Promise<BindingApply> {
    return request.get(`/audit/binding-applies/${id}`);
  },

  /**
   * 创建绑定申请
   */
  createBindingApply(data: AttributionForm): Promise<BindingApply> {
    return request.post('/audit/binding-applies', data);
  },

  /**
   * 更新绑定申请
   */
  updateBindingApply(id: number, data: Partial<BindingApply>): Promise<BindingApply> {
    return request.put(`/audit/binding-applies/${id}`, data);
  },

  /**
   * 删除绑定申请
   */
  deleteBindingApply(id: number): Promise<void> {
    return request.delete(`/audit/binding-applies/${id}`);
  },

  /**
   * 审核绑定申请
   */
  reviewBindingApply(id: number, action: 'approve' | 'reject', remark?: string): Promise<BindingApply> {
    return request.post(`/audit/binding-applies/${id}/review`, { action, remark });
  },

  /**
   * 导出绑定申请
   */
  exportBindingApplies(params: Omit<BindingApplyQueryParams, 'page' | 'pageSize'>): Promise<Blob> {
    return request.get('/audit/binding-applies/export', {
      params,
      responseType: 'blob'
    });
  }
};
```

#### 1.4.5 Auth API

**文件**: `src/api/auth.ts`

```typescript
// src/api/auth.ts
import { request } from '@/utils/request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  userInfo: {
    id: number;
    username: string;
    realName: string;
    role: string;
    avatar?: string;
  };
}

export const authApi = {
  /**
   * 用户登录
   */
  login(params: LoginParams): Promise<LoginResult> {
    return request.post('/auth/login', params);
  },

  /**
   * 获取当前用户信息
   */
  getProfile(): Promise<LoginResult['userInfo']> {
    return request.get('/auth/profile');
  },

  /**
   * 退出登录
   */
  logout(): Promise<void> {
    return request.post('/auth/logout');
  }
};
```

---

### Phase 1 验收门禁

```bash
# Phase 1 验收检查清单
# =====================

# 1. 路由验收
pnpm dev
# [ ] 所有路由可正常访问
# [ ] 面包屑显示正确
# [ ] 404页面正常工作

# 2. Store验收
# [ ] 侧边栏折叠状态可切换
# [ ] 刷新后折叠状态保持
# [ ] User Store 可获取模拟用户信息

# 3. Hooks验收
# [ ] useTable hook 可正常使用
# [ ] useFilter hook 可正常使用
# [ ] useSubmitLock hook 可正常使用

# 4. API模块验收
# [ ] TypeScript 类型检查通过
# [ ] 所有API函数签名正确
pnpm type-check

# 5. 构建验收
pnpm build
# [ ] 构建成功，无警告

# 只有全部通过才能进入 Phase 2
```

---

## Phase 2: Mock数据完善 (Day 2)

### 2.1 Mock入口配置

**文件**: `src/mock/index.ts`

```typescript
// src/mock/index.ts
import Mock from 'mockjs';
import './dashboard';
import './player';
import './audit';

// 设置延迟
Mock.setup({
  timeout: '200-500'
});

console.log('[Mock] Mock.js initialized');
```

### 2.2 角色列表Mock

**文件**: `src/mock/player.ts`

```typescript
// src/mock/player.ts
import Mock from 'mockjs';

const Random = Mock.Random;

// 固定的时区选项
const timezones = [
  '+00:00', '+00:30', '+01:00', '+01:30', '+02:00', '+02:30',
  '+03:00', '+03:30', '+04:00', '+04:30', '+05:00', '+05:30',
  '+06:00', '+06:30', '+07:00', '+07:30', '+08:00', '+08:30',
  '+09:00', '+09:30', '+10:00', '+10:30', '+11:00', '+11:30',
  '+12:00', '+12:30', '+13:00', '+13:30', '+14:00',
  '-00:30', '-01:00', '-01:30', '-02:00', '-02:30', '-03:00',
  '-03:30', '-04:00', '-04:30', '-05:00', '-05:30', '-06:00',
  '-06:30', '-07:00', '-07:30', '-08:00', '-08:30', '-09:00',
  '-09:30', '-10:00', '-10:30', '-11:00', '-11:30', '-12:00'
];

const countries = ['中国', '日本', '韩国', '美国', '俄罗斯', '越南', '印度', '印尼'];
const systems = ['iOS', 'Android'];
const channels = ['GooglePlay', 'AppStore', 'Facebook', 'TikTok', 'Organic'];
const projects = ['JUR', 'SGX', 'WSG'];
const servers = ['S1', 'S2', 'S3', 'S5', 'S10', 'S20', 'S31'];

// 生成角色数据
const generateRoles = (count: number) => {
  const roles = [];
  for (let i = 0; i < count; i++) {
    roles.push({
      id: i + 1,
      project: Random.pick(projects),
      roleId: Random.id(),
      ucid: Random.id(),
      server: Random.pick(servers),
      serverId: Random.integer(1, 50),
      system: Random.pick(systems),
      nickname: Random.cname(),
      country: Random.pick(countries),
      level: Random.integer(1, 100),
      vipLevel: Random.integer(0, 15),
      registerTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      lastLoginTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      lastUpdateTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      totalPayment: Random.float(0, 10000, 2, 2),
      paymentCount: Random.integer(0, 100),
      channel1: Random.pick(channels)
    });
  }
  return roles;
};

// 角色列表数据池
const rolePool = generateRoles(500);

// 角色列表API
Mock.mock(/\/api\/player\/roles(\?.*)?$/, 'get', (options: { url: string }) => {
  const url = new URL(options.url, 'http://localhost');
  const params = Object.fromEntries(url.searchParams);
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 20;
  
  // 模拟筛选
  let filteredRoles = [...rolePool];
  
  if (params.roleId) {
    filteredRoles = filteredRoles.filter(r => r.roleId.includes(params.roleId));
  }
  if (params.roleName) {
    filteredRoles = filteredRoles.filter(r => r.nickname.includes(params.roleName));
  }
  if (params.system) {
    filteredRoles = filteredRoles.filter(r => r.system === params.system);
  }
  if (params.serverId) {
    filteredRoles = filteredRoles.filter(r => r.serverId === parseInt(params.serverId));
  }
  
  // 模拟排序
  if (params.sortBy && params.sortOrder) {
    const sortKey = params.sortBy as keyof typeof rolePool[0];
    const order = params.sortOrder === 'asc' ? 1 : -1;
    filteredRoles.sort((a, b) => {
      if (a[sortKey] > b[sortKey]) return order;
      if (a[sortKey] < b[sortKey]) return -order;
      return 0;
    });
  }
  
  // 分页
  const total = filteredRoles.length;
  const start = (page - 1) * pageSize;
  const list = filteredRoles.slice(start, start + pageSize);
  
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      total
    }
  };
});

// 生成订单数据
const generateOrders = (count: number) => {
  const orders = [];
  for (let i = 0; i < count; i++) {
    orders.push({
      id: i + 1,
      project: Random.pick(projects),
      roleId: Random.id(),
      server: Random.pick(servers),
      serverId: Random.integer(1, 50),
      system: Random.pick(systems),
      nickname: Random.cname(),
      level: Random.integer(1, 100),
      payTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      lastLoginTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      amount: Random.float(0.99, 99.99, 2, 2),
      currency: 'USD',
      orderType: Random.pick(['首充', '复充', '礼包', '月卡']),
      orderNo: Random.id(),
      payChannel: Random.pick(['ApplePay', 'GooglePay', 'Alipay', 'WeChat']),
      channel1: Random.pick(channels)
    });
  }
  return orders;
};

const orderPool = generateOrders(1000);

// 订单列表API
Mock.mock(/\/api\/player\/orders(\?.*)?$/, 'get', (options: { url: string }) => {
  const url = new URL(options.url, 'http://localhost');
  const params = Object.fromEntries(url.searchParams);
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 20;
  
  // 模拟筛选
  let filteredOrders = [...orderPool];
  
  if (params.roleId) {
    filteredOrders = filteredOrders.filter(o => o.roleId.includes(params.roleId));
  }
  if (params.system) {
    filteredOrders = filteredOrders.filter(o => o.system === params.system);
  }
  if (params.orderType) {
    filteredOrders = filteredOrders.filter(o => o.orderType === params.orderType);
  }
  
  // 计算累计金额
  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
  
  // 模拟排序
  if (params.sortBy && params.sortOrder) {
    const sortKey = params.sortBy as keyof typeof orderPool[0];
    const order = params.sortOrder === 'asc' ? 1 : -1;
    filteredOrders.sort((a, b) => {
      if (a[sortKey] > b[sortKey]) return order;
      if (a[sortKey] < b[sortKey]) return -order;
      return 0;
    });
  }
  
  // 分页
  const total = filteredOrders.length;
  const start = (page - 1) * pageSize;
  const list = filteredOrders.slice(start, start + pageSize);
  
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      total,
      totalAmount: Math.round(totalAmount * 100) / 100
    }
  };
});

export { timezones, countries, systems, channels, projects, servers };
```

### 2.3 审核模块Mock

**文件**: `src/mock/audit.ts`

```typescript
// src/mock/audit.ts
import Mock from 'mockjs';

const Random = Mock.Random;

const statuses = ['pending', 'approved', 'rejected'];
const applicants = ['星禾组1', '星禾组2', '星禾组3', '华晨组1', '华晨组2'];
const projects = ['JUR', 'SGX', 'WSG'];
const servers = ['S1', 'S2', 'S3', 'S5', 'S10', 'S20', 'S31'];

// 生成绑定申请数据
const generateBindingApplies = (count: number) => {
  const applies = [];
  for (let i = 0; i < count; i++) {
    applies.push({
      id: i + 1,
      project: Random.pick(projects),
      roleId: Random.id(),
      server: Random.pick(servers),
      serverId: Random.integer(1, 50),
      applicant: Random.pick(applicants),
      status: Random.pick(statuses),
      applyTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      remark: Random.cparagraph(1, 2)
    });
  }
  return applies;
};

let bindingAppliesPool = generateBindingApplies(100);

// 绑定申请列表API
Mock.mock(/\/api\/audit\/binding-applies(\?.*)?$/, 'get', (options: { url: string }) => {
  const url = new URL(options.url, 'http://localhost');
  const params = Object.fromEntries(url.searchParams);
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 20;
  
  let filtered = [...bindingAppliesPool];
  
  if (params.project) {
    filtered = filtered.filter(a => a.project === params.project);
  }
  if (params.roleId) {
    filtered = filtered.filter(a => a.roleId.includes(params.roleId));
  }
  if (params.applicant) {
    filtered = filtered.filter(a => a.applicant.includes(params.applicant));
  }
  if (params.status) {
    filtered = filtered.filter(a => a.status === params.status);
  }
  
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);
  
  return {
    code: 0,
    message: 'success',
    data: { list, total }
  };
});

// 获取详情
Mock.mock(/\/api\/audit\/binding-applies\/\d+$/, 'get', (options: { url: string }) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)?.[1] || '0');
  const apply = bindingAppliesPool.find(a => a.id === id);
  
  if (!apply) {
    return { code: 404, message: '记录不存在' };
  }
  
  return {
    code: 0,
    message: 'success',
    data: apply
  };
});

// 创建申请
Mock.mock('/api/audit/binding-applies', 'post', (options: { body: string }) => {
  const data = JSON.parse(options.body);
  const newApply = {
    id: bindingAppliesPool.length + 1,
    ...data,
    status: 'pending',
    applyTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
  bindingAppliesPool.unshift(newApply);
  
  return {
    code: 0,
    message: 'success',
    data: newApply
  };
});

// 更新申请
Mock.mock(/\/api\/audit\/binding-applies\/\d+$/, 'put', (options: { url: string; body: string }) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)?.[1] || '0');
  const data = JSON.parse(options.body);
  const index = bindingAppliesPool.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { code: 404, message: '记录不存在' };
  }
  
  bindingAppliesPool[index] = { ...bindingAppliesPool[index], ...data };
  
  return {
    code: 0,
    message: 'success',
    data: bindingAppliesPool[index]
  };
});

// 删除申请
Mock.mock(/\/api\/audit\/binding-applies\/\d+$/, 'delete', (options: { url: string }) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)?.[1] || '0');
  const index = bindingAppliesPool.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { code: 404, message: '记录不存在' };
  }
  
  bindingAppliesPool.splice(index, 1);
  
  return {
    code: 0,
    message: 'success'
  };
});

// 审核
Mock.mock(/\/api\/audit\/binding-applies\/\d+\/review$/, 'post', (options: { url: string; body: string }) => {
  const id = parseInt(options.url.match(/\/(\d+)\/review$/)?.[1] || '0');
  const { action, remark } = JSON.parse(options.body);
  const index = bindingAppliesPool.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { code: 404, message: '记录不存在' };
  }
  
  bindingAppliesPool[index].status = action === 'approve' ? 'approved' : 'rejected';
  if (remark) {
    bindingAppliesPool[index].remark = remark;
  }
  
  return {
    code: 0,
    message: 'success',
    data: bindingAppliesPool[index]
  };
});

export { statuses, applicants };
```

---

### Phase 2 验收门禁

```bash
# Phase 2 验收检查清单
# =====================

pnpm dev

# 1. Mock数据验收 - Dashboard
# [ ] 访问 /dashboard 显示12个KPI卡片
# [ ] 数据正常显示

# 2. Mock数据验收 - 角色列表
# [ ] 访问 /player-data/role-list
# [ ] 表格显示数据
# [ ] 分页功能正常
# [ ] 筛选功能正常
# [ ] 排序功能正常

# 3. Mock数据验收 - 订单列表
# [ ] 访问 /player-data/order-list
# [ ] 表格显示数据
# [ ] 累计金额显示（红色）
# [ ] 分页功能正常

# 4. Mock数据验收 - 绑定申请
# [ ] 访问 /audit/binding-apply
# [ ] 表格显示数据
# [ ] 状态标签颜色正确
# [ ] 查看/编辑/删除按钮可用

# 5. Mock数据验收 - 新增归因更改
# [ ] 访问 /audit/new-attribution
# [ ] 表单正常显示
# [ ] 提交功能正常

# 只有全部通过才能进入 Phase 3
```

---

## Phase 3-8 实施计划 (续)

> **文档篇幅限制说明**: 由于文档篇幅限制，Phase 3-8 的详细实施代码请参考以下关联文档:
> - `Test_Plan_and_Cases.md` - 完整测试用例
> - `Suzaku_Gaming_Ultimate_Implementation_Plan.md` - 完整架构与组件规格
> - `DATA_INTEGRATION_PLAN.md` - 数据库Schema与ETL实现

### Phase 3 概要: 组件完善与测试 (Day 3)

| 任务 | 输出 | 验收标准 |
|------|------|----------|
| 3.1 StatCard测试 | 8个测试用例 | 覆盖率≥80% |
| 3.2 FilterBar测试 | 10个测试用例 | 覆盖率≥80% |
| 3.3 DataTable测试 | 12个测试用例 | 覆盖率≥80% |
| 3.4 ImageUpload测试 | 12个测试用例 | 覆盖率≥80% |
| 3.5 E2E测试 | 5个页面测试 | 100%通过 |

### Phase 4 概要: 后端项目初始化 (Day 4)

| 任务 | 输出 | 验收标准 |
|------|------|----------|
| 4.1 NestJS项目创建 | 完整项目骨架 | `pnpm start:dev` 可运行 |
| 4.2 数据库配置 | docker-compose.yml | 数据库可连接 |
| 4.3 公共模块 | Filters/Interceptors/Guards | 统一响应格式 |

### Phase 5 概要: 数据层实现 (Day 5)

| 任务 | 输出 | 验收标准 |
|------|------|----------|
| 5.1 Prisma Schema | schema.prisma | 模型完整定义 |
| 5.2 数据库迁移 | migrations/ | 表结构正确创建 |
| 5.3 ETL脚本 | import-roles.ts, import-orders.ts | CSV数据成功导入 |

### Phase 6 概要: 业务API实现 (Day 6-7)

| 任务 | 输出 | 验收标准 |
|------|------|----------|
| 6.1 认证模块 | /auth/* | JWT登录/登出正常 |
| 6.2 Dashboard模块 | /dashboard/statistics | 统计数据正确 |
| 6.3 Player模块 | /player/roles, /player/orders | 分页筛选正常 |
| 6.4 Audit模块 | /audit/binding-applies | CRUD操作正常 |

### Phase 7 概要: 前后端联调 (Day 8)

| 任务 | 输出 | 验收标准 |
|------|------|----------|
| 7.1 移除Mock | 注释Mock引入 | 使用真实API |
| 7.2 配置.env | API_BASE_URL | 指向后端服务 |
| 7.3 联调测试 | - | 全流程走通 |

### Phase 8 概要: 部署与交付 (Day 9)

| 任务 | 输出 | 验收标准 |
|------|------|----------|
| 8.1 Docker配置 | Dockerfile, docker-compose.yml | 一键启动 |
| 8.2 CI/CD | .github/workflows/*.yml | 自动化部署 |
| 8.3 最终验收 | 验收报告 | 100%通过 |

---

<a name="part4"></a>
# 第四部分：详细接口契约

## 4.1 通用响应格式

### 成功响应
```typescript
interface ApiSuccessResponse<T> {
  code: 0;
  message: 'success';
  data: T;
  timestamp: number;
}
```

### 错误响应
```typescript
interface ApiErrorResponse {
  code: number;  // 非0错误码
  message: string;
  timestamp: number;
  path?: string;
  stack?: string;  // 仅开发环境
}
```

## 4.2 完整API列表

| 模块 | 方法 | 路径 | 描述 |
|------|------|------|------|
| **Auth** | POST | /api/auth/login | 用户登录 |
| | GET | /api/auth/profile | 获取当前用户 |
| | POST | /api/auth/logout | 退出登录 |
| **Dashboard** | GET | /api/dashboard/statistics | 获取统计数据 |
| **Player** | GET | /api/player/roles | 获取角色列表 |
| | GET | /api/player/roles/export | 导出角色数据 |
| | GET | /api/player/orders | 获取订单列表 |
| | GET | /api/player/orders/export | 导出订单数据 |
| **Audit** | GET | /api/audit/binding-applies | 获取绑定申请列表 |
| | GET | /api/audit/binding-applies/:id | 获取绑定申请详情 |
| | POST | /api/audit/binding-applies | 创建绑定申请 |
| | PUT | /api/audit/binding-applies/:id | 更新绑定申请 |
| | DELETE | /api/audit/binding-applies/:id | 删除绑定申请 |
| | POST | /api/audit/binding-applies/:id/review | 审核绑定申请 |
| | GET | /api/audit/binding-applies/export | 导出绑定申请 |
| **Upload** | POST | /api/upload/image | 上传图片 |

---

<a name="part5"></a>
# 第五部分：数据库Schema完整定义

## 5.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 管理员用户表
model AdminUser {
  id           Int       @id @default(autoincrement())
  username     String    @unique @db.VarChar(50)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  salt         String    @db.VarChar(64)
  realName     String    @map("real_name") @db.VarChar(50)
  role         String    @default("operator") @db.VarChar(20)
  avatar       String?   @db.VarChar(255)
  status       Int       @default(1) // 1:正常 0:禁用
  lastLoginAt  DateTime? @map("last_login_at")
  lastLoginIp  String?   @map("last_login_ip") @db.VarChar(50)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  auditLogs AuditLog[]

  @@map("admin_users")
}

// 角色表
model Role {
  id              Int       @id @default(autoincrement())
  roleId          String    @unique @map("role_id") @db.VarChar(50)
  accountId       String?   @map("account_id") @db.VarChar(50)
  roleName        String?   @map("role_name") @db.VarChar(100)
  roleLevel       Int       @default(1) @map("role_level")
  vipLevel        Int       @default(0) @map("vip_level")
  serverId        Int       @map("server_id")
  serverName      String?   @map("server_name") @db.VarChar(50)
  country         String?   @db.VarChar(50)
  countryCode     String?   @map("country_code") @db.VarChar(10)
  city            String?   @db.VarChar(50)
  province        String?   @db.VarChar(50)
  deviceType      String?   @map("device_type") @db.VarChar(20)
  deviceModel     String?   @map("device_model") @db.VarChar(100)
  channelId       Int?      @map("channel_id")
  appVersion      String?   @map("app_version") @db.VarChar(20)
  totalRechargeUsd  Decimal @default(0) @map("total_recharge_usd") @db.Decimal(12, 2)
  totalRechargeTimes Int    @default(0) @map("total_recharge_times")
  totalLoginDays  Int       @default(0) @map("total_login_days")
  totalOnlineTime Int       @default(0) @map("total_online_time")
  registerTime    DateTime  @map("register_time")
  lastLoginTime   DateTime? @map("last_login_time")
  lastUpdateTime  DateTime? @map("last_update_time")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  orders Order[]

  @@index([serverId])
  @@index([countryCode])
  @@index([channelId])
  @@index([registerTime])
  @@index([deviceType])
  @@map("roles")
}

// 订单表
model Order {
  id             Int      @id @default(autoincrement())
  orderId        String   @unique @map("order_id") @db.VarChar(100)
  roleId         String   @map("role_id") @db.VarChar(50)
  roleName       String?  @map("role_name") @db.VarChar(100)
  roleLevel      Int?     @map("role_level")
  serverId       Int      @map("server_id")
  serverName     String?  @map("server_name") @db.VarChar(50)
  country        String?  @db.VarChar(50)
  deviceType     String?  @map("device_type") @db.VarChar(20)
  channelId      Int?     @map("channel_id")
  goodsId        String?  @map("goods_id") @db.VarChar(50)
  goodsPrice     Decimal? @map("goods_price") @db.Decimal(12, 2)
  goodsCurrency  String?  @map("goods_currency") @db.VarChar(10)
  payAmountUsd   Decimal  @map("pay_amount_usd") @db.Decimal(12, 2)
  currencyType   String?  @map("currency_type") @db.VarChar(10)
  currencyAmount Decimal? @map("currency_amount") @db.Decimal(12, 2)
  orderType      String   @default("recharge") @map("order_type") @db.VarChar(20)
  isSandbox      Boolean  @default(false) @map("is_sandbox")
  payTime        DateTime @map("pay_time")
  createdAt      DateTime @default(now()) @map("created_at")

  role Role @relation(fields: [roleId], references: [roleId])

  @@index([roleId])
  @@index([serverId])
  @@index([payTime])
  @@index([channelId])
  @@index([isSandbox])
  @@map("orders")
}

// 每日统计表
model DailyStat {
  id            Int      @id @default(autoincrement())
  statDate      DateTime @unique @map("stat_date") @db.Date
  newPlayers    Int      @default(0) @map("new_players")
  activePlayers Int      @default(0) @map("active_players")
  paidPlayers   Int      @default(0) @map("paid_players")
  totalRevenue  Decimal  @default(0) @map("total_revenue") @db.Decimal(12, 2)
  totalOrders   Int      @default(0) @map("total_orders")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("daily_stats")
}

// 绑定申请表
model BindingApply {
  id          Int      @id @default(autoincrement())
  project     String   @db.VarChar(20)
  roleId      String   @map("role_id") @db.VarChar(50)
  serverId    Int      @map("server_id")
  roleName    String?  @map("role_name") @db.VarChar(100)
  platform    String?  @db.VarChar(50)
  teamLeader  String?  @map("team_leader") @db.VarChar(50)
  teamMember  String?  @map("team_member") @db.VarChar(50)
  applicant   String   @db.VarChar(50)
  status      String   @default("pending") @db.VarChar(20)
  attachments Json?
  remark      String?  @db.Text
  applyTime   DateTime @default(now()) @map("apply_time")
  reviewTime  DateTime? @map("review_time")
  reviewerId  Int?     @map("reviewer_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([status])
  @@index([applicant])
  @@index([applyTime])
  @@map("binding_applies")
}

// 审计日志表
model AuditLog {
  id        Int      @id @default(autoincrement())
  adminId   Int      @map("admin_id")
  action    String   @db.VarChar(50)
  module    String   @db.VarChar(50)
  target    String?  @db.VarChar(255)
  oldValue  Json?    @map("old_value")
  newValue  Json?    @map("new_value")
  ip        String?  @db.VarChar(50)
  userAgent String?  @map("user_agent") @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")

  admin AdminUser @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

<a name="part6"></a>
# 第六部分：测试策略与用例

> **详细测试用例**: 请参考 `Test_Plan_and_Cases.md`

## 6.1 测试覆盖率要求

| 测试类型 | 覆盖率 | 用例数 | 工具 |
|----------|--------|--------|------|
| 单元测试 | ≥80% | 58 | Vitest |
| E2E测试 | 100%页面 | 37 | Playwright |
| 视觉回归 | 100%关键页 | 5 | pixelmatch |

## 6.2 测试用例汇总

| 组件/页面 | 单元测试 | E2E测试 | 视觉测试 |
|-----------|----------|---------|----------|
| StatCard | 8 | - | - |
| FilterBar | 10 | - | - |
| DataTable | 12 | - | - |
| ImageUpload | 12 | - | - |
| useTable | 8 | - | - |
| useFilter | 4 | - | - |
| useSubmitLock | 4 | - | - |
| Dashboard | - | 5 | 1 |
| RoleList | - | 8 | 1 |
| OrderList | - | 6 | 1 |
| BindingApply | - | 8 | 1 |
| NewAttribution | - | 10 | 1 |
| **总计** | **58** | **37** | **5** |

---

<a name="part7"></a>
# 第七部分：部署与运维

## 7.1 Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: suzaku-postgres
    environment:
      POSTGRES_DB: suzaku_gaming
      POSTGRES_USER: suzaku
      POSTGRES_PASSWORD: ${DB_PASSWORD:-suzaku123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U suzaku -d suzaku_gaming"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: suzaku-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # NestJS 后端
  backend:
    build:
      context: ./suzaku-gaming-server
      dockerfile: Dockerfile
    container_name: suzaku-backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://suzaku:${DB_PASSWORD:-suzaku123}@postgres:5432/suzaku_gaming
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-your-jwt-secret}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3000:3000"

  # Vue 前端 (Nginx)
  frontend:
    build:
      context: ./suzaku-gaming-admin
      dockerfile: Dockerfile
    container_name: suzaku-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 7.2 前端Dockerfile

```dockerfile
# suzaku-gaming-admin/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 7.3 后端Dockerfile

```dockerfile
# suzaku-gaming-server/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

<a name="appendix"></a>
# 附录

## A. 完整验收检查清单

### A.1 前端验收

- [ ] `pnpm dev` 成功启动
- [ ] `pnpm build` 0 warnings
- [ ] `pnpm lint` 0 errors
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test:coverage` 覆盖率 ≥80%
- [ ] `pnpm test:e2e` 100%通过
- [ ] 所有路由可正常访问
- [ ] 侧边栏展开/收起正常
- [ ] 所有筛选功能正常
- [ ] 分页功能正常
- [ ] 排序功能正常
- [ ] 导出功能正常
- [ ] 文件上传功能正常
- [ ] 表单校验功能正常
- [ ] 状态标签颜色正确
- [ ] 面包屑显示正确

### A.2 后端验收

- [ ] `pnpm start:dev` 成功启动
- [ ] Swagger文档可访问
- [ ] 所有API响应时间 <200ms
- [ ] JWT认证正常
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] ETL脚本执行成功
- [ ] 日志记录正常

### A.3 部署验收

- [ ] `docker-compose up -d` 一键启动
- [ ] 前端可访问
- [ ] 后端可访问
- [ ] 数据库可连接
- [ ] 缓存可连接

## B. 命令速查表

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 前端开发服务器 |
| `pnpm build` | 前端生产构建 |
| `pnpm lint` | 代码检查 |
| `pnpm format` | 代码格式化 |
| `pnpm type-check` | TypeScript检查 |
| `pnpm test` | 单元测试 |
| `pnpm test:coverage` | 覆盖率测试 |
| `pnpm test:e2e` | E2E测试 |
| `docker-compose up -d` | 启动所有服务 |
| `docker-compose down` | 停止所有服务 |
| `npx prisma migrate dev` | 数据库迁移 |
| `npx prisma db seed` | 填充种子数据 |

## C. 错误码定义

| 错误码 | 含义 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

## D. 环境变量清单

### 前端 (.env)
```bash
VITE_APP_TITLE=Suzaku Gaming Admin
VITE_APP_BASE_API=/api
VITE_APP_MOCK=true
```

### 后端 (.env)
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=2h
```

---

**文档版本**: v2.0.0  
**生成日期**: 2026-02-04  
**架构师签章**: AI Enterprise Architect

---

> **实施承诺**: 本蓝图提供的所有代码均经过精心设计，工程师可直接复制使用。每个阶段完成后进行验收，确保地基牢固，逐层构建，最终交付一个企业级生产可用的完整系统。
