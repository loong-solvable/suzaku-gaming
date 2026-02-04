# Suzaku Gaming Admin

游戏数据管理后台系统，包含前端 Vue3 + Element Plus 应用和后端 NestJS + Prisma 服务。

## 技术栈

### 前端
- Vue 3 + TypeScript
- Element Plus 组件库
- Pinia 状态管理
- Vue Router 路由
- Axios HTTP 客户端
- SCSS 样式

### 后端
- NestJS (Node.js)
- Prisma ORM
- PostgreSQL 数据库
- Redis 缓存
- JWT 认证
- Swagger API 文档

## 项目结构

```
├── suzaku-gaming-admin/     # 前端项目
│   ├── src/
│   │   ├── api/            # API 接口
│   │   ├── components/     # 通用组件
│   │   ├── composables/    # 组合式函数
│   │   ├── layouts/        # 布局组件
│   │   ├── mock/           # Mock 数据
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # Pinia Store
│   │   ├── utils/          # 工具函数
│   │   └── views/          # 页面组件
│   └── ...
├── suzaku-gaming-server/    # 后端项目
│   ├── src/
│   │   ├── common/         # 通用模块
│   │   ├── modules/        # 业务模块
│   │   └── shared/         # 共享模块
│   ├── prisma/             # Prisma Schema
│   └── scripts/            # ETL 脚本
├── docker-compose.yml       # Docker 编排
└── ...
```

## 快速开始

### 开发环境

#### 前端

```bash
cd suzaku-gaming-admin
pnpm install
pnpm dev
```

访问 http://localhost:5173

#### 后端

```bash
cd suzaku-gaming-server
pnpm install
npx prisma generate
npx prisma migrate dev
pnpm prisma:seed  # 初始化数据
pnpm start:dev
```

访问 http://localhost:3000/api/docs (Swagger)

### Docker 部署

```bash
# 复制环境配置
cp .env.example .env
# 编辑 .env 配置必要参数

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务端口:
- 前端: http://localhost:80
- 后端 API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## 功能模块

### 已实现
- [x] 用户登录/注销
- [x] Dashboard 统计面板
- [x] 角色管理 (列表/筛选/分页)
- [x] 订单管理 (列表/筛选/分页)
- [x] 绑定审核 (CRUD/审核流程)
- [x] ThinkingData 数据同步
- [x] CSV 数据导入 (ETL)

### API 接口

| 模块 | 接口 | 描述 |
|------|------|------|
| Auth | POST /api/auth/login | 用户登录 |
| Auth | GET /api/auth/profile | 获取用户信息 |
| Dashboard | GET /api/dashboard/statistics | 获取统计数据 |
| Player | GET /api/player/roles | 获取角色列表 |
| Player | GET /api/player/orders | 获取订单列表 |
| Audit | GET /api/audit/binding-applies | 获取绑定申请列表 |
| Audit | POST /api/audit/binding-applies | 创建绑定申请 |
| Audit | POST /api/audit/binding-applies/:id/review | 审核绑定申请 |
| Sync | POST /api/sync/thinkingdata/trigger | 手动触发数据同步 |
| Sync | GET /api/sync/thinkingdata/status | 获取同步状态 |

## 数据库迁移

```bash
cd suzaku-gaming-server

# 创建迁移
npx prisma migrate dev --name <migration_name>

# 应用迁移
npx prisma migrate deploy

# 重置数据库
pnpm db:reset
```

## 环境变量

### 后端 (.env)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/suzaku_gaming
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=2h
TA_API_HOST=https://api.thinkingdata.cn
TA_PROJECT_TOKEN=your-token
TA_SYNC_ENABLED=true
TA_SYNC_CRON=0 0 2 * * *
```

### 前端 (.env.development)

```
VITE_APP_TITLE=Suzaku Gaming Admin
VITE_APP_BASE_API=/api
VITE_APP_MOCK=true
```

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| operator | operator123 | 运营 |

## License

Private - All Rights Reserved
