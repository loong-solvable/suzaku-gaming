# Suzaku Gaming 企业级全栈补全规划方案 (Enterprise Full-Stack Completion Plan)

**版本**: v1.0.0
**目标**: 将当前的高保真前端原型转化为生产级、高可用、可扩展的全栈系统。
**受众**: 高级软件工程师 / 架构师
**核心原则**: 稳健性 (Robustness)、安全性 (Security)、可观测性 (Observability)、自动化 (Automation)。

---

## 0. 架构蓝图与技术选型

为了匹配当前 Vue3 + TypeScript 的前端技术栈，并确保企业级的类型安全和开发效率，我们采用 **TypeScript 全栈架构**。

### 0.1 技术栈 (Tech Stack)

| 层级 | 技术选型 | 理由 |
| :--- | :--- | :--- |
| **Backend Framework** | **NestJS** | 企业级 Node.js 标准框架，提供模块化、依赖注入、强类型支持，架构严谨。 |
| **Language** | **TypeScript** | 前后端统一语言，共享 DTO 类型定义，减少接口联调成本。 |
| **Database** | **PostgreSQL** 15+ | 强大的关系型数据库，支持 JSONB（适合游戏扩展数据），事务处理能力强。 |
| **ORM** | **Prisma** | 现代 TypeScript ORM，类型安全，迁移管理方便，开发者体验极佳。 |
| **Cache / Session** | **Redis** | 用于 Session 存储、API 缓存、限流计数。 |
| **API Doc** | **Swagger (OpenAPI 3.0)** | NestJS 内置支持，自动生成接口文档，方便前端对接。 |
| **Containerization** | **Docker & Docker Compose** | 统一开发与生产环境，一键启动。 |
| **PM2** | **PM2** | 生产环境进程管理，负载均衡。 |

### 0.2 系统拓扑

```mermaid
graph TD
    Client[Vue3 Admin Frontend] -->|HTTPS/REST| Nginx[Nginx Reverse Proxy]
    Nginx -->|Load Balance| Nest[NestJS Backend Cluster]
    Nest -->|ORM| PG[(PostgreSQL Primary)]
    Nest -->|Cache| Redis[(Redis)]
    Nest -->|Logs| File[Log Files / ELK]
    
    subgraph "Data Ingestion (ETL)"
        CSV[Raw CSV Data] -->|Stream Parse| Script[ETL Script (Node.js)]
        Script -->|Upsert| PG
    end
```

---

## 阶段一：地基构建 (Infrastructure & Core Backend)

**目标**: 建立后端工程，配置数据库环境，确立代码规范。

### 1.1 初始化后端工程
*   **操作**:
    *   在根目录创建 `suzaku-gaming-server`。
    *   使用 `@nestjs/cli` 初始化项目。
    *   配置 ESLint/Prettier 与前端保持一致。
    *   **关键配置**: 启用 `Helmet` (安全头), `RateLimit` (限流), `CORS` (跨域), `Compression` (Gzip)。
*   **产出**: 可运行的 NestJS "Hello World" 服务。

### 1.2 数据库环境搭建
*   **操作**:
    *   编写 `docker-compose.yml`，编排 PostgreSQL 和 Redis 容器。
    *   初始化 Prisma，连接本地 Postgres。
*   **产出**: `docker-compose up -d` 可启动数据库。

### 1.3 统一响应与异常处理 (Interceptors & Filters)
*   **设计**:
    *   **Response Interceptor**: 统一封装返回格式 `{ code: 200, data: ..., message: "Success" }`。
    *   **Exception Filter**: 统一捕获异常，将 HTTP 错误、数据库错误转化为标准错误响应 `{ code: 500, message: "Internal Server Error" }`，并记录日志。
    *   **Logger**: 集成 `winston`，按天切割日志文件，区分 `info` 和 `error` 级别。
*   **验收标准**: 任何 API 报错都不会导致服务崩溃，且前端能收到标准 JSON 错误格式。

---

## 阶段二：数据建模与 ETL 管道 (Data Modeling & Ingestion)

**目标**: 将 CSV 原始数据转化为关系型数据库中的结构化数据。这是项目的核心资产。

### 2.1 数据库 Schema 设计 (Prisma Schema)
*   **模型定义**:
    *   `AdminUser`: 管理员表 (id, username, password_hash, role, salt)。
    *   `Player`: 玩家表 (id, nickname, server_id, level, vip_level, region, join_date, ...)。
    *   `Order`: 订单表 (id, player_id, amount, currency, product_id, status, pay_time, ...)。
    *   `AuditLog`: 操作审计表 (id, admin_id, action, target, ip, timestamp)。
*   **索引优化**: 在 `player_id`, `server_id`, `pay_time` 上建立索引以加速查询。

### 2.2 ETL 脚本开发 (Extract-Transform-Load)
*   **挑战**: CSV 文件可能很大，不能一次性读入内存。
*   **方案**:
    *   使用 Node.js `stream` 和 `csv-parser` 库进行流式读取。
    *   **Transform**: 清洗数据（去除无效字段，格式化时间，金额转 Number）。
    *   **Load**: 使用 Prisma 的 `createMany` 或 `upsert` (批量插入/更新) 提高写入性能。每 1000 条为一个批次 (Batch)。
    *   **Idempotency (幂等性)**: 脚本支持重复运行，已存在的数据执行更新，不存在的执行插入。
*   **验收标准**: 运行脚本后，数据库中拥有完整的玩家和订单数据，且无重复记录。

---

## 阶段三：核心业务 API 开发 (Core Business Logic)

**目标**: 替换前端 Mock 接口，实现真实的读取能力。

### 3.1 认证模块 (Auth Module)
*   **功能**:
    *   `POST /auth/login`: 校验账号密码（使用 Argon2 或 Bcrypt 哈希），颁发 JWT Access Token。
    *   `GET /auth/profile`: 获取当前用户信息。
    *   **Guard**: 实现 `JwtAuthGuard`，全局拦截未登录请求。
*   **安全性**: Token 有效期设为 2 小时，实现 Refresh Token 机制（可选）。

### 3.2 玩家模块 (Players Module)
*   **功能**:
    *   `GET /players`: 分页列表查询。
        *   **后端逻辑**: 接收 `page`, `pageSize`, `server`, `nickname` 参数。构建动态 `WHERE` 子句。使用 Prisma `count()` 获取总数。
    *   `GET /players/:id`: 详情查询。
*   **DTO**: 使用 `class-validator` 严格校验入参（如 `page` 必须为正整数）。

### 3.3 订单模块 (Orders Module)
*   **功能**:
    *   `GET /orders`: 分页查询，支持按时间范围筛选 (`pay_time BETWEEN start AND end`)。
    *   `GET /orders/stats`: 聚合统计（Dashboard 用）。
        *   **后端逻辑**: 使用 SQL 聚合函数 `SUM(amount)` 按日期分组，计算每日营收。

### 3.4 仪表盘模块 (Dashboard Module)
*   **功能**:
    *   `GET /dashboard/summary`: 返回 12 个 KPI 卡片的数据。
    *   **缓存策略**: 由于统计查询较慢，使用 Redis 缓存统计结果，TTL 设为 5-10 分钟。

---

## 阶段四：前端对接与状态同步 (Frontend Integration)

**目标**: 前端彻底移除 Mock，对接真实 API。

### 4.1 API 层重构
*   **操作**:
    *   配置 `.env` 中的 `VITE_API_BASE_URL`。
    *   重写 `src/api/*.ts`，移除 Mock 引用，对接 `/api/v1/...`。
    *   定义 TypeScript Interface 与后端 DTO 保持一致（建议使用工具自动生成）。

### 4.2 拦截器增强
*   **Request Interceptor**: 自动在 Header 中携带 `Authorization: Bearer <token>`。
*   **Response Interceptor**:
    *   处理 401: 自动清除本地状态并跳转登录页。
    *   处理 403: 提示“无权访问”。
    *   处理 500: 弹出全局错误提示。

### 4.3 交互优化
*   **Loading**: 在表格数据请求期间，严格展示 Loading 状态。
*   **Debounce**: 搜索框输入增加防抖（300ms），减少后端压力。

---

## 阶段五：高级功能与写操作 (Advanced Features)

**目标**: 实现数据的修改、审核与文件处理。

### 5.1 审核工作流 (Audit Workflow)
*   **场景**: "绑定申请"与"归因更改"。
*   **后端逻辑**:
    *   `POST /audit/approve`: 开启数据库事务 (Transaction)。
    *   步骤 1: 更新申请单状态为 `APPROVED`。
    *   步骤 2: 修改玩家表对应数据。
    *   步骤 3: 写入 `AuditLog`。
    *   **原子性**: 任意步骤失败，全部回滚。

### 5.2 文件上传服务 (File Service)
*   **场景**: 上传证明图片。
*   **方案**:
    *   使用 `Multer` 处理 `multipart/form-data`。
    *   本地开发: 存储在 `uploads/` 目录，Nginx 映射静态资源。
    *   生产环境: 对接 AWS S3 或 阿里云 OSS SDK。
    *   **限制**: 校验文件类型 (jpg/png) 和大小 (max 2MB)。

### 5.3 数据导出 (Export Service)
*   **场景**: 导出 CSV。
*   **方案**:
    *   **流式导出**: 避免一次性将 10 万条数据加载到内存。使用 SQL 游标 (Cursor) 逐行读取，通过 HTTP Stream 响应给前端下载。

---

## 阶段六：生产就绪与部署 (Production Readiness)

**目标**: 确保系统在生产环境稳定运行。

### 6.1 测试体系 (Testing)
*   **Unit Test**: 覆盖核心 Service 逻辑（如金额计算、权限判断）。
*   **E2E Test**: 更新现有的 Playwright 脚本，使其在测试环境真实调用后端接口。

### 6.2 Docker 化交付
*   **Dockerfile**: 构建多阶段镜像 (Multi-stage Build)，产出极小的生产镜像（仅包含 `dist` 和 `node_modules`）。
*   **Docker Compose (Prod)**: 编排 Backend, Postgres, Redis, Nginx。

### 6.3 CI/CD 流水线 (GitHub Actions)
*   **流程**:
    *   Push 代码 -> 触发 Lint & Test -> Build Docker Image -> Push to Registry -> SSH 部署到服务器。

---

## 验收清单 (Checklist)

- [ ] **数据库**: PostgreSQL 运行正常，Schema 设计符合 3NF，索引已建立。
- [ ] **数据**: CSV 数据已完整导入，无丢失，无重复。
- [ ] **后端**: NestJS 服务启动无报错，Swagger 文档可访问。
- [ ] **接口**: 所有 CRUD 接口响应时间 < 200ms (复杂统计除外)。
- [ ] **安全**: 必须登录才能访问业务接口，密码已加密存储。
- [ ] **前端**: 移除所有 Mock 代码，完全依赖后端数据。
- [ ] **部署**: 可通过 Docker Compose 一键启动整个全栈系统。

此方案执行完毕后，Suzaku Gaming 将成为一个**真正具备商业交付标准**的后台管理系统。
