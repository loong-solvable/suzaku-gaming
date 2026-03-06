# Suzaku Gaming 游戏运营管理系统

游戏运营后台管理系统，用于管理玩家数据、订单、渠道推广（CPS）、审计等业务。

## 文档状态（2026-03-06）

| 文档 | 类型 | 状态 | 使用建议 |
|------|------|------|----------|
| `README.md` | 项目总览 | 生效中 | 作为最新功能与部署入口文档 |
| `用户使用手册.md` | 用户操作手册 | 生效中 | 作为业务/运营同学日常操作依据 |
| `部署到服务器上避坑经验.md` | 运维部署文档 | 生效中 | 作为服务器部署、排障和验收清单依据 |
| `用户管理与归因申请BUG修复-实施方案.md` | 历史实施方案 | 已实现（含历史背景） | 保留复盘价值，执行以当前代码与 README 为准 |
| `概要面板数据权限隔离-实施方案.md` | 历史实施方案 | 已实现（含历史背景） | 文中“当前不符合”属于历史结论 |
| `归因绑定审批回写数数平台-实施计划.md` | 历史实施计划 | 已实现 | 回写链路已落地，参数与字段以当前代码为准 |
| `0206-验收问题修改方案.md` | 历史草案 | 已归档（过时） | 不再作为实施依据 |
| `0206-验收问题修改方案1.md` | 历史草案 | 已归档（过时） | 不再作为实施依据 |
| `0206-验收问题修改方案-终版.md` | 历史草案 | 已归档（过时） | 不再作为实施依据 |

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
│   │   │   ├── audit/       # 审计模块（归因绑定申请审批）
│   │   │   ├── dashboard/   # 数据概览模块（按用户权限隔离）
│   │   │   ├── thinkingdata/# 数数平台同步模块
│   │   │   └── user/        # 用户管理模块
│   │   ├── common/          # 公共模块
│   │   │   ├── decorators/  # 装饰器（@Roles, @Public, @CurrentUser）
│   │   │   ├── guards/      # 守卫（JWT、角色）
│   │   │   ├── filters/     # 异常过滤器
│   │   │   ├── interceptors/# 响应拦截器
│   │   │   └── interfaces/  # 公共类型（CurrentUser）
│   │   └── shared/          # 共享模块（Prisma）
│   ├── prisma/              # 数据库 Schema & Seed
│   └── scripts/             # 脚本工具
│
├── docker-compose.yml       # 生产 Docker 编排
└── docker-compose.dev.yml   # 开发环境（PostgreSQL + Redis）
```

## 功能模块

| 模块 | 说明 |
|------|------|
| Dashboard | 数据概览，按用户权限隔离统计（admin 全量 / manager 本组 / operator 本人） |
| 玩家数据 | 角色列表、订单列表查询与导出 |
| CPS 管理 | 渠道绑定、充值日志、登录日志 |
| 审计管理 | 归因绑定申请流程（创建→审核→通过/拒绝），仅管理员可审核；通过后自动回写数数平台 CPS 维度表 |
| 用户管理 | 后台用户 CRUD、三级权限体系（admin/manager/operator） |
| 数据同步 | 从 ThinkingData 平台定时同步角色、订单、登录、行为统计数据 |

## 权限体系

系统采用三级权限模型，通过 `level` 字段区分：

| 角色 | level | 权限范围 |
|------|-------|----------|
| admin（管理员） | 0 | 查看全部数据，管理所有用户，审批所有申请 |
| manager（组长） | 1 | 查看本组数据（按 `cpsGroupCode` 隔离），查看本组申请记录（无审核权限），管理本组用户 |
| operator（组员） | 2 | 仅查看本人提交的数据和申请 |

### Dashboard 权限隔离

Dashboard 统计数据基于 **已审批通过（approved）的归因绑定申请** 构建作用域：
- admin：统计所有 approved 申请关联的角色/订单
- manager：仅统计本组（`platform = cpsGroupCode` 或旧数据 `teamLeader = username`）
- operator：仅统计本人提交且已 approved 的申请关联数据
- 无 approved 数据时，所有指标返回 0

### 数据安全
- 已通过（approved）的绑定申请**不允许删除**，防止统计真相源被破坏
- 仅允许删除 pending 和 rejected 状态的申请
- 归因申请审核接口仅允许 `admin` 调用（控制器与服务层双重校验）
- 角色/订单列表与导出按当前用户作用域过滤，避免越权查询
- CSV 导出对以 `= + - @` 开头的值做转义，防止公式注入
- 上传仅允许 JPG/PNG/GIF/WEBP，并校验文件签名防止伪装文件
- 全局启用限流（`100 req/min`）与 `JWT_SECRET` 强制配置（缺失将启动失败）

## 快速开始

### 环境要求

- Node.js >= 18
- Docker Desktop（用于 PostgreSQL 和 Redis）
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

### 启动基础设施（PostgreSQL + Redis）

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 配置环境变量

```bash
# 后端（已提供默认开发配置）
cp suzaku-gaming-server/.env.example suzaku-gaming-server/.env
# 编辑 .env 配置数据库连接等
```

### 数据库初始化

```bash
cd suzaku-gaming-server

# 生成 Prisma Client
npx prisma generate

# 同步数据库 Schema（创建表和索引）
npx prisma db push

# 初始化种子数据（创建默认账号）
npx prisma db seed
```

### 启动开发服务

```bash
# 后端（默认端口 3001，可通过 PORT 环境变量修改）
cd suzaku-gaming-server
pnpm run start:dev

# 前端（端口 5173）
cd suzaku-gaming-admin
pnpm run dev
```

### 使用 Docker（本地开发）

```bash
# 仅启动基础设施（PostgreSQL + Redis）
docker compose -f docker-compose.dev.yml up -d

# 生产环境（全部容器化）
docker compose up -d
```

## 默认账号

执行 `npx prisma db seed` 后会创建以下默认账号：

| 用户名 | 密码 | 角色 | 层级 | 所属组 |
|--------|------|------|------|--------|
| admin | admin123 | admin | 管理员(0) | 无 |
| leader_a | leader123 | manager | 组长(1) | GroupA |
| leader_b | leader123 | manager | 组长(1) | GroupB |
| leader_c | leader123 | manager | 组长(1) | GroupC |

> 注意：如果通过用户管理界面创建了新用户，其密码由创建时指定。Seed 仅在首次初始化时执行。

## 数据同步

系统通过 ThinkingData（数数平台）同步游戏数据：

- **增量同步**：每 **5 分钟**自动同步最近 2 天的角色、订单、登录、行为统计数据（需配置 `TA_SYNC_ENABLED=true`）
- **审批回写**：归因申请审批通过后，自动将 CPS 分组信息回写到数数平台维度表
- **手动同步**：通过 API 触发同步

### 同步策略说明

增量同步采用 2 天滑动窗口 + upsert 幂等策略：
- 每次同步最近 2 天数据，确保跨天边界不遗漏
- 使用 upsert（已存在则更新，不存在则插入），保证数据一致性
- 同步顺序：角色 → 订单 → 登录时间 → 行为统计（确保外键依赖正确）

### 配置 ThinkingData

在 `.env` 或 `.env.production` 中配置：

```bash
TA_API_HOST=https://your-thinkingdata-api-host
TA_PROJECT_TOKEN=your-project-token
TA_SYNC_ENABLED=true

# ThinkingData 表/视图配置
TA_USER_VIEW=ta.v_user_22
TA_EVENT_VIEW=v_event_22
TA_CPS_DIM_TABLE=ta_dim.dim_22_0_518509
```

配置完成后重启后端服务使配置生效。

### 手动同步数据（Docker 环境）

```bash
# 1. 获取登录 Token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# 2. 同步角色数据
curl -X POST "http://localhost:3000/api/sync/thinkingdata/sync-roles?limit=100000" \
  -H "Authorization: Bearer $TOKEN"

# 3. 同步近一周订单
START_DATE=$(date -d "7 days ago" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
curl -X POST "http://localhost:3000/api/sync/thinkingdata/sync-orders-range?startDate=$START_DATE&endDate=$END_DATE&limit=100000" \
  -H "Authorization: Bearer $TOKEN"

# 4. 同步最后登录时间
curl -X POST "http://localhost:3000/api/sync/thinkingdata/sync-last-login-range?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $TOKEN"
```

### 本地开发环境同步

```bash
cd suzaku-gaming-server
npx ts-node scripts/sync-week.ts
```

## 服务器部署

### 系统要求

- **操作系统**：CentOS 6.5+ / CentOS 7+ / Ubuntu 18.04+ / Debian 9+
- **内存**：建议 2GB 以上
- **硬盘**：建议 20GB 以上

> 部署脚本已针对低版本 CentOS（包括 CentOS 6.x）进行优化，会自动选择兼容的安装方式。

### 方式一：一键部署（推荐）

```bash
# 1. 克隆代码
git clone https://github.com/your-repo/suzaku-cursor.git
cd suzaku-cursor

# 2. 配置环境变量（可选，脚本会自动生成随机密码）
cp .env.production.example .env.production
vim .env.production  # 修改数据库密码、JWT 密钥、ThinkingData 配置等

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
cp .env.production.example .env.production
vim .env.production  # 修改数据库密码、JWT 密钥等
ln -sf .env.production .env

# 4. 部署服务
sudo bash deploy.sh deploy
```

### 部署脚本命令

```bash
sudo bash deploy.sh deploy    # 部署服务（首次使用）
sudo bash deploy.sh start     # 启动服务
sudo bash deploy.sh stop      # 停止服务
sudo bash deploy.sh restart   # 重启服务
sudo bash deploy.sh logs      # 查看日志
sudo bash deploy.sh status    # 查看服务状态
sudo bash deploy.sh cleanup   # 清理所有数据（危险操作）
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
# 注意：JWT_SECRET 不能为空，缺失会导致后端启动失败

# ThinkingData 配置
TA_API_HOST=https://your-thinkingdata-api-host
TA_PROJECT_TOKEN=your-project-token
TA_SYNC_ENABLED=true
```

### 部署后访问

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
sudo bash deploy.sh logs

# 或查看特定服务
docker logs -f suzaku-backend
docker logs -f suzaku-frontend
```

**Q: 如何更新部署？**

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
sudo bash deploy.sh deploy
```

**Q: CentOS 6 部署失败怎么办？**

1. 确保内核版本 >= 2.6.32-431
2. 如果 Docker 安装失败，尝试升级到 CentOS 7
3. 或者联系运维手动安装 Docker

**Q: 根目录磁盘空间不足怎么办？**

Docker 默认将数据存储在 `/var/lib/docker`，会占用根目录空间。如果根目录空间有限，建议将 Docker 数据目录迁移到其他分区（如 `/data`）：

```bash
# 1. 停止 Docker
sudo systemctl stop docker

# 2. 创建新目录并复制数据
sudo mkdir -p /data/docker
sudo rsync -aP /var/lib/docker/ /data/docker/

# 3. 修改 Docker 配置
sudo vi /etc/docker/daemon.json
# 添加: "data-root": "/data/docker"

# 4. 重启 Docker
sudo systemctl start docker

# 5. 验证后删除旧数据
sudo docker info | grep "Docker Root Dir"
sudo rm -rf /var/lib/docker
```

**Q: 上传的图片无法显示怎么办？**

确保 Nginx 配置中包含 `/uploads/` 的代理配置，且使用 `^~` 前缀确保优先级高于静态文件正则规则：

```nginx
location ^~ /uploads/ {
    proxy_pass http://backend:3000;
    proxy_set_header Host $host;
}
```

### 项目结构（Docker）

```
suzaku-cursor/
├── docker-compose.yml       # 生产 Docker 编排配置
├── docker-compose.dev.yml   # 开发环境基础设施
├── .env.production          # 生产环境变量
├── deploy.sh                # 部署脚本
├── quick-start.sh           # 快速启动脚本
├── suzaku-gaming-admin/
│   ├── Dockerfile           # 前端镜像构建
│   └── nginx.conf           # Nginx 配置
└── suzaku-gaming-server/
    └── Dockerfile           # 后端镜像构建
```

## API 文档

后端启动后访问：http://localhost:3001/api（开发环境）或 http://服务器IP:3000/api（生产环境）

## License

MIT
