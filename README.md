# Suzaku Gaming 游戏运营管理系统

游戏运营后台管理系统，用于管理玩家数据、订单、渠道推广（CPS）、审计等业务。

## 技术栈

### 前端 (suzaku-gaming-admin)
- Vue 3 + TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router

### 后端 (suzaku-gaming-server)
- NestJS
- Prisma ORM
- PostgreSQL
- JWT 认证
- ThinkingData 数据同步

## 项目结构

```
suzaku-cursor/
├── suzaku-gaming-admin/     # 前端项目
│   ├── src/
│   │   ├── api/             # API 接口
│   │   ├── components/      # 公共组件
│   │   ├── composables/     # 组合式函数
│   │   ├── layouts/         # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── views/           # 页面组件
│   │   └── utils/           # 工具函数
│   └── e2e/                 # E2E 测试
│
├── suzaku-gaming-server/    # 后端项目
│   ├── src/
│   │   ├── modules/         # 业务模块
│   │   │   ├── auth/        # 认证模块
│   │   │   ├── player/      # 玩家数据模块
│   │   │   ├── cps/         # CPS 渠道模块
│   │   │   ├── audit/       # 审计模块
│   │   │   ├── dashboard/   # 数据概览模块
│   │   │   ├── thinkingdata/# 数数平台同步模块
│   │   │   └── user/        # 用户管理模块
│   │   ├── common/          # 公共模块（守卫、拦截器、装饰器）
│   │   └── shared/          # 共享模块（Prisma）
│   ├── prisma/              # 数据库 Schema
│   └── scripts/             # 脚本工具
│
└── docker-compose.yml       # Docker 编排
```

## 功能模块

| 模块 | 说明 |
|------|------|
| Dashboard | 数据概览，展示关键指标统计 |
| 玩家数据 | 角色列表、订单列表查询与导出 |
| CPS 管理 | 渠道绑定、充值日志、登录日志 |
| 审计管理 | 绑定申请审批流程 |
| 用户管理 | 后台用户 CRUD、权限控制 |
| 数据同步 | 从 ThinkingData 平台定时同步数据 |

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14
- pnpm

### 安装依赖

```bash
# 后端
cd suzaku-gaming-server
pnpm install

# 前端
cd suzaku-gaming-admin
pnpm install
```

### 配置环境变量

```bash
# 后端
cp suzaku-gaming-server/.env.example suzaku-gaming-server/.env
# 编辑 .env 配置数据库连接等

# 前端
cp suzaku-gaming-admin/.env.development suzaku-gaming-admin/.env
```

### 数据库初始化

```bash
cd suzaku-gaming-server

# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移
npx prisma db push

# 初始化种子数据
npx prisma db seed
```

### 启动开发服务

```bash
# 后端 (端口 3000)
cd suzaku-gaming-server
pnpm run start:dev

# 前端 (端口 5173)
cd suzaku-gaming-admin
pnpm run dev
```

### 使用 Docker

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 生产环境
docker-compose up -d
```

## 数据同步

系统通过 ThinkingData 平台同步游戏数据：

- **定时同步**：每 30 分钟自动同步最近 2 天的数据
- **手动同步**：通过 API 或脚本触发全量/增量同步

```bash
# 同步近一周数据
cd suzaku-gaming-server
npx ts-node scripts/sync-week.ts
```

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

## API 文档

后端启动后访问：http://localhost:3000/api

## License

MIT
