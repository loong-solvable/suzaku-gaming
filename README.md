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

### 使用 Docker（本地开发）

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 生产环境
docker-compose up -d
```

## 服务器部署

### 系统要求

- **操作系统**：CentOS 6.5+ / CentOS 7+ / Ubuntu 18.04+ / Debian 9+
- **内存**：建议 2GB 以上
- **硬盘**：建议 20GB 以上

> 📌 部署脚本已针对**低版本 CentOS**（包括 CentOS 6.x）进行优化，会自动选择兼容的安装方式。

### 方式一：一键部署（推荐）

在服务器上执行：

```bash
# 1. 克隆代码
git clone https://github.com/your-repo/suzaku-cursor.git
cd suzaku-cursor

# 2. 配置环境变量（可选，脚本会自动生成随机密码）
cp .env.production.example .env.production
vim .env.production  # 修改数据库密码、JWT 密钥等

# 3. 一键部署
sudo bash quick-start.sh
```

### 方式二：手动部署

```bash
# 1. 克隆代码
git clone https://github.com/your-repo/suzaku-cursor.git
cd suzaku-cursor

# 2. 安装 Docker（如已安装可跳过）
sudo bash deploy.sh install

# 3. 配置环境变量
cp .env.production .env
vim .env  # 修改数据库密码、JWT 密钥等

# 4. 部署服务
sudo bash deploy.sh deploy
```

### 部署脚本命令

```bash
# 部署服务（首次使用）
sudo bash deploy.sh deploy

# 启动服务
sudo bash deploy.sh start

# 停止服务
sudo bash deploy.sh stop

# 重启服务
sudo bash deploy.sh restart

# 查看日志
sudo bash deploy.sh logs

# 查看服务状态
sudo bash deploy.sh status

# 清理所有数据（危险操作）
sudo bash deploy.sh cleanup
```

### 环境变量说明

编辑 `.env.production` 文件：

```bash
# 数据库配置（务必修改密码）
POSTGRES_USER=suzaku
POSTGRES_PASSWORD=your_strong_password_here  # ← 修改为强密码
POSTGRES_DB=suzaku_gaming

# JWT 配置（务必修改为随机字符串）
JWT_SECRET=your-super-secret-jwt-key-32chars  # ← 修改为随机字符串
JWT_EXPIRES_IN=2h

# ThinkingData 配置（可选）
TA_API_HOST=
TA_PROJECT_TOKEN=
TA_SYNC_ENABLED=false
```

### 部署后访问

部署成功后：

| 服务 | 地址 |
|------|------|
| 管理后台 | http://服务器IP |
| 后端 API | http://服务器IP:3000 |
| 数据库 | 服务器IP:5432 |
| Redis | 服务器IP:6379 |

### 常见问题

**Q: 端口被占用怎么办？**

编辑 `docker-compose.yml`，修改端口映射：
```yaml
ports:
  - "8080:80"  # 将 80 改为 8080
```

**Q: 如何查看服务日志？**

```bash
# 查看所有服务日志
sudo bash deploy.sh logs

# 查看特定服务日志
docker logs -f suzaku-backend
docker logs -f suzaku-frontend
```

**Q: 如何更新部署？**

```bash
git pull origin main
sudo bash deploy.sh deploy
```

**Q: CentOS 6 部署失败怎么办？**

1. 确保内核版本 >= 2.6.32-431
2. 如果 Docker 安装失败，尝试升级到 CentOS 7
3. 或者联系运维手动安装 Docker

### 项目结构（Docker）

```
suzaku-cursor/
├── docker-compose.yml       # Docker 编排配置
├── .env.production          # 生产环境变量
├── deploy.sh                # 部署脚本
├── quick-start.sh           # 快速启动脚本
├── suzaku-gaming-admin/
│   ├── Dockerfile           # 前端镜像构建
│   └── nginx.conf           # Nginx 配置
└── suzaku-gaming-server/
    └── Dockerfile           # 后端镜像构建
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
