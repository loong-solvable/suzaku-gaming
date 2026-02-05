# 权限管理系统补全实施报告 v11.0

> 文档版本：v11.0  
> 创建日期：2026-02-05  
> 更新日期：2026-02-05  
> 状态：待实施

---

## 0. 文档说明

### 0.1 符号约定

| 符号 | 含义 |
|------|------|
| ✅ | 已实现 |
| ⚠️ | 部分实现/有风险 |
| ❌ | 未实现 |
| 🔴 | Critical 级别 |
| 🟠 | High 级别 |
| 🟡 | Medium 级别 |

### 0.2 当前状态 vs 目标状态

本报告明确区分：
- **当前状态**：代码库实际现状
- **目标状态**：实施完成后的预期效果
- **实施步骤**：从当前到目标的具体操作

---

## 1. 问题清单与现状核查

### 1.1 Critical 级别问题

| # | 问题 | 当前状态 | 风险 | 证据文件 |
|---|------|----------|------|----------|
| C1 | `RolesGuard` 对 `level=null` 判定为 admin | ❌ `user.level !== undefined` 会让 null 通过，`null <= 2` 转为 `0 <= 2` | 权限提升漏洞 | `guards/roles.guard.ts:45-50` |
| C2 | `audit` 模块全部 `@Public()` | ❌ 除导出外均公开 | 敏感数据泄露、越权操作 | `audit/audit.controller.ts:31-96` |

### 1.2 High 级别问题

| # | 问题 | 当前状态 | 风险 | 证据文件 |
|---|------|----------|------|----------|
| H1 | 数据隔离依赖客户端传参 | ❌ CPS/Audit 均基于 query 过滤 | 跨组数据泄露 | `cps/cps.service.ts`, `audit/audit.service.ts` |
| H2 | `/user/*` API 不存在 | ❌ 无 user 模块 | 用户管理页面 404 | `app.module.ts` |
| H3 | 前端角色枚举错误 | ❌ 含 `viewer`，无 `manager` | UI 权限显示错误 | `stores/user.ts:33-38` |
| H4 | 前端无登录页/路由守卫 | ❌ 无 `/login` 路由 | 启用 Guard 后系统不可用 | `router/index.ts` |
| H5 | 前端 `fetch` 未带 token | ❌ Dashboard/RoleList/OrderList 使用原生 fetch | 启用 Guard 后 401 | `views/Dashboard/index.vue:70`, `views/PlayerData/*.vue` |

### 1.3 Medium 级别问题

| # | 问题 | 当前状态 | 风险 | 证据文件 |
|---|------|----------|------|----------|
| M1 | ThinkingData 手动返回 `{code,data}` | ❌ 与 ResponseInterceptor 双层包装 | 前端解析异常 | `thinkingdata/thinkingdata.controller.ts` |
| M2 | Blob 响应被拦截器拒绝 | ❌ request.ts 未处理 blob | 导出功能失败 | `utils/request.ts` |
| M3 | 侧边栏菜单硬编码 | ❌ 无法按角色过滤 | 新路由不可见 | `components/layout/Sidebar/index.vue` |
| M4 | `operatorType` 字段不一致 | ⚠️ Schema 注释 `admin/leader/member`，代码传 `admin/manager/operator` | 语义混乱 | `prisma/schema.prisma`, `cps/cps.controller.ts` |
| M5 | ThinkingData 错误返回格式 | ❌ `sync-orders-range` 返回 `{code:400}` 会被包装成成功 | 错误处理异常 | `thinkingdata/thinkingdata.controller.ts:73-79` |

---

## 2. 实施步骤（含现状与目标对照）

### 2.1 Phase 0-Critical：安全漏洞修复

#### 2.1.1 修复 RolesGuard null 判定漏洞 🔴

**当前状态**：
```typescript
// suzaku-gaming-server/src/common/guards/roles.guard.ts:45-50
const hasRoleByLevel =
  user.level !== undefined &&  // null !== undefined = true ❌
  requiredRoles.some((r) => {
    const requiredLevel = ROLE_LEVEL_MAP[r];
    return requiredLevel !== undefined && user.level <= requiredLevel;
    // null <= 2 转为 0 <= 2 = true ❌
  });
```

**目标状态**：

```typescript
// suzaku-gaming-server/src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// 导出供 UserService 使用
export const ROLE_LEVEL_MAP: Record<string, number> = {
  admin: 0,
  manager: 1,
  operator: 2,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('无权限访问');
    }

    // 方式1: 基于 role 字符串
    const hasRoleByString = user.role && requiredRoles.includes(user.role);

    // 方式2: 基于 level 数值
    // ⚠️ 修复：显式判断 level 必须是数字类型，防止 null 被当成 0
    const hasRoleByLevel =
      typeof user.level === 'number' &&
      requiredRoles.some((r) => {
        const requiredLevel = ROLE_LEVEL_MAP[r];
        return typeof requiredLevel === 'number' && user.level <= requiredLevel;
      });

    if (!hasRoleByString && !hasRoleByLevel) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}
```

**测试用例**：

```markdown
## TC-C1: RolesGuard 权限判定测试

### TC-C1-01: level=null 用户访问 admin 接口
- 前置: 构造 user = { role: 'operator', level: null }
- 操作: 模拟访问 @Roles('admin') 接口
- 预期: 返回 403 Forbidden
- 验证点: typeof null === 'number' 为 false

### TC-C1-02: level=null 用户访问 operator 接口
- 前置: 构造 user = { role: 'operator', level: null }
- 操作: 模拟访问 @Roles('operator') 接口
- 预期: 返回 200（通过 role 字符串判定）

### TC-C1-03: level=0 用户访问所有层级
- 前置: 构造 user = { role: 'admin', level: 0 }
- 操作: 分别访问 admin/manager/operator 接口
- 预期: 全部 200

### TC-C1-04: level=2 用户访问 manager 接口
- 前置: 构造 user = { role: 'operator', level: 2 }
- 操作: 访问 @Roles('manager') 接口
- 预期: 返回 403（2 > 1）

### TC-C1-05: level=undefined 用户仅通过 role 判定
- 前置: 构造 user = { role: 'admin', level: undefined }
- 操作: 访问 @Roles('admin') 接口
- 预期: 返回 200
```

---

#### 2.1.2 修复 Audit 模块安全漏洞 🔴

**当前状态**：

```typescript
// suzaku-gaming-server/src/modules/audit/audit.controller.ts
@Get('binding-applies')
@Public()  // ❌ 任何人可访问
async getBindingApplies(@Query() query: QueryBindingAppliesDto) {
  return this.auditService.getBindingApplies(query);
}
```

**目标状态**：

```typescript
// suzaku-gaming-server/src/modules/audit/audit.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryBindingAppliesDto } from './dto/query-binding-applies.dto';
import { CreateBindingApplyDto } from './dto/create-binding-apply.dto';
import { ReviewBindingApplyDto } from './dto/review-binding-apply.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('binding-applies')
  @Roles('admin', 'manager', 'operator')  // ✅ 替换 @Public()
  @ApiOperation({ summary: '获取绑定申请列表' })
  async getBindingApplies(
    @Query() query: QueryBindingAppliesDto,
    @Req() req: Request,  // ✅ 新增：传递当前用户
  ) {
    return this.auditService.getBindingApplies(query, req.user);
  }

  @Get('binding-applies/export')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '导出绑定申请列表' })
  async exportBindingApplies(
    @Query() query: QueryBindingAppliesDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csv = await this.auditService.exportBindingApplies(query, req.user);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=binding_applies_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    res.send('\ufeff' + csv);
  }

  @Get('binding-applies/:id')
  @Roles('admin', 'manager', 'operator')  // ✅ 替换 @Public()
  @ApiOperation({ summary: '获取绑定申请详情' })
  async getBindingApplyById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.auditService.getBindingApplyById(id, req.user);
  }

  @Post('binding-applies')
  @Roles('admin', 'manager', 'operator')  // ✅ 替换 @Public()
  @ApiOperation({ summary: '创建绑定申请' })
  async createBindingApply(
    @Body() dto: CreateBindingApplyDto,
    @Req() req: Request,  // ✅ 服务端强制设置 applicant
  ) {
    return this.auditService.createBindingApply(dto, req.user);
  }

  @Put('binding-applies/:id')
  @Roles('admin', 'manager')  // ✅ 替换 @Public()，仅管理员和组长可更新
  @ApiOperation({ summary: '更新绑定申请' })
  async updateBindingApply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBindingApplyDto>,
    @Req() req: Request,
  ) {
    return this.auditService.updateBindingApply(id, dto, req.user);
  }

  @Delete('binding-applies/:id')
  @Roles('admin')  // ✅ 替换 @Public()，仅管理员可删除
  @ApiOperation({ summary: '删除绑定申请' })
  async deleteBindingApply(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.deleteBindingApply(id);
  }

  @Post('binding-applies/:id/review')
  @Roles('admin', 'manager')  // ✅ 替换 @Public()
  @ApiOperation({ summary: '审核绑定申请' })
  async reviewBindingApply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewBindingApplyDto,
    @Req() req: Request,  // ✅ 服务端强制设置 reviewerId
  ) {
    return this.auditService.reviewBindingApply(id, dto, req.user);
  }
}
```

**测试用例**：

```markdown
## TC-C2: Audit 模块权限测试

### TC-C2-01: 无 token 访问绑定申请列表
- 操作: GET /audit/binding-applies (无 Authorization)
- 预期: 401 Unauthorized

### TC-C2-02: Operator 创建绑定申请
- 前置: role=operator, username='test_op'
- 操作: POST /audit/binding-applies { applicant: 'fake' }
- 预期: 201，且 applicant 被强制覆盖为 'test_op'

### TC-C2-03: Operator 审核绑定申请
- 前置: role=operator
- 操作: POST /audit/binding-applies/:id/review
- 预期: 403 Forbidden

### TC-C2-04: Manager 审核绑定申请
- 前置: role=manager, id=5
- 操作: POST /audit/binding-applies/:id/review
- 预期: 200，reviewerId 自动设置为 5

### TC-C2-05: Operator 删除绑定申请
- 操作: DELETE /audit/binding-applies/:id
- 预期: 403 Forbidden

### TC-C2-06: Admin 删除绑定申请
- 操作: DELETE /audit/binding-applies/:id
- 预期: 200
```

---

#### 2.1.3 历史数据修复脚本

**当前状态**：存在 `scripts/migrate-role-to-level.ts`，但未处理 `role=null` 和批量一致性

**目标状态**：

**文件**：`suzaku-gaming-server/scripts/fix-admin-levels.ts`（新建）

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminLevels() {
  console.log('=== 修复 AdminUser level 字段 ===\n');

  // 1. 统计当前状态
  const stats = await prisma.$queryRaw`
    SELECT role, level, COUNT(*)::int as count 
    FROM admin_user 
    GROUP BY role, level 
    ORDER BY role, level
  `;
  console.log('修复前统计:');
  console.table(stats);

  const nullLevelCount = await prisma.adminUser.count({
    where: { level: null },
  });
  const nullRoleCount = await prisma.adminUser.count({
    where: { role: null },
  });
  console.log(`\nlevel 为 null: ${nullLevelCount}`);
  console.log(`role 为 null: ${nullRoleCount}\n`);

  // 2. 根据 role 修复 level
  const adminResult = await prisma.adminUser.updateMany({
    where: { role: 'admin', OR: [{ level: null }, { level: { not: 0 } }] },
    data: { level: 0 },
  });
  console.log(`admin -> level=0: ${adminResult.count} 条`);

  const managerResult = await prisma.adminUser.updateMany({
    where: { role: 'manager', OR: [{ level: null }, { level: { not: 1 } }] },
    data: { level: 1 },
  });
  console.log(`manager -> level=1: ${managerResult.count} 条`);

  const operatorResult = await prisma.adminUser.updateMany({
    where: { role: 'operator', OR: [{ level: null }, { level: { not: 2 } }] },
    data: { level: 2 },
  });
  console.log(`operator -> level=2: ${operatorResult.count} 条`);

  // 3. 修复没有 role 的用户（安全起见设为最低权限）
  const noRoleResult = await prisma.adminUser.updateMany({
    where: { role: null },
    data: { role: 'operator', level: 2 },
  });
  if (noRoleResult.count > 0) {
    console.log(`⚠️ 无角色用户 -> operator: ${noRoleResult.count} 条`);
  }

  // 4. 验证结果
  console.log('\n修复后统计:');
  const statsAfter = await prisma.$queryRaw`
    SELECT role, level, COUNT(*)::int as count 
    FROM admin_user 
    GROUP BY role, level 
    ORDER BY role, level
  `;
  console.table(statsAfter);

  const remainingNull = await prisma.adminUser.count({
    where: { OR: [{ level: null }, { role: null }] },
  });
  
  if (remainingNull > 0) {
    console.error(`\n❌ 仍有 ${remainingNull} 条异常数据，请手动检查`);
    const abnormal = await prisma.adminUser.findMany({
      where: { OR: [{ level: null }, { role: null }] },
      select: { id: true, username: true, role: true, level: true },
    });
    console.table(abnormal);
    process.exit(1);
  }

  console.log('\n✅ 修复完成');
}

fixAdminLevels()
  .catch((e) => {
    console.error('修复失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**测试用例**：

```markdown
## TC-P0C-DATA: 数据修复验证

### TC-P0C-DATA-01: 执行前检查
- 操作: SELECT COUNT(*) FROM admin_user WHERE level IS NULL OR role IS NULL
- 记录: 异常数量

### TC-P0C-DATA-02: 脚本执行
- 操作: npx ts-node scripts/fix-admin-levels.ts
- 预期: 无错误，显示修复统计

### TC-P0C-DATA-03: 执行后验证
- 操作: SELECT role, level, COUNT(*) FROM admin_user GROUP BY role, level
- 预期: admin=0, manager=1, operator=2，无 null

### TC-P0C-DATA-04: 一致性验证
- 操作: SELECT * FROM admin_user WHERE (role='admin' AND level!=0) OR (role='manager' AND level!=1) OR (role='operator' AND level!=2)
- 预期: 返回 0 条
```

---

### 2.2 Phase 0-A：前端基础设施

> ⚠️ **关键修正**：路由使用 `@/layouts/MainLayout.vue`（非 `@/components/layout/`）

#### 2.2.1 修复前端角色枚举 🟠

**当前状态**：

```typescript
// suzaku-gaming-admin/src/stores/user.ts:33-38
roleName(): string {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    operator: '运营',  // ❌ 应为"组员"
    viewer: '访客'     // ❌ 后端无此角色
  };
  return roleMap[this.userInfo?.role || ''] || '未知角色';
}
```

**目标状态**：

```typescript
// suzaku-gaming-admin/src/stores/user.ts
import { defineStore } from 'pinia';

interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: string;
  level?: number;           // ✅ 新增
  parentId?: number;        // ✅ 新增
  cpsGroupCode?: string;    // ✅ 新增
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
      return this.userInfo?.realName || this.userInfo?.username || '管理员';
    },

    // ✅ 修复：统一为 admin/manager/operator
    roleName(): string {
      const roleMap: Record<string, string> = {
        admin: '管理员',
        manager: '组长',
        operator: '组员'
      };
      return roleMap[this.userInfo?.role || ''] || '未知角色';
    },

    role(): string {
      return this.userInfo?.role || '';
    },

    level(): number {
      return this.userInfo?.level ?? 2;
    },

    cpsGroupCode(): string | undefined {
      return this.userInfo?.cpsGroupCode;
    },

    isAdmin(): boolean {
      return this.userInfo?.role === 'admin' || this.userInfo?.level === 0;
    },

    isManagerOrAbove(): boolean {
      const level = this.userInfo?.level;
      return typeof level === 'number' && level <= 1;
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

    async fetchUserInfo() {
      try {
        const { authApi } = await import('@/api/auth');
        const userInfo = await authApi.getProfile();
        this.setUserInfo(userInfo);
        return userInfo;
      } catch (error) {
        this.logout();
        throw error;
      }
    },

    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('token');
    }
  }
});
```

**测试用例**：

```markdown
## TC-H3: 前端角色枚举测试

### TC-H3-01: Admin 角色显示
- 前置: userInfo.role = 'admin'
- 预期: roleName = '管理员'

### TC-H3-02: Manager 角色显示
- 前置: userInfo.role = 'manager'
- 预期: roleName = '组长'

### TC-H3-03: Operator 角色显示
- 前置: userInfo.role = 'operator'
- 预期: roleName = '组员'

### TC-H3-04: 旧 viewer 角色显示
- 前置: userInfo.role = 'viewer'
- 预期: roleName = '未知角色'

### TC-H3-05: isManagerOrAbove 判断
- 前置: level = 1
- 预期: isManagerOrAbove = true
- 前置: level = 2
- 预期: isManagerOrAbove = false
```

---

#### 2.2.2 修复前端 fetch 未带 token 🟠

**当前状态**：

```typescript
// suzaku-gaming-admin/src/views/Dashboard/index.vue:70
const res = await fetch("/api/dashboard/statistics");  // ❌ 无 token

// suzaku-gaming-admin/src/views/PlayerData/RoleList.vue:73
const res = await fetch(url);  // ❌ 无 token
```

**目标状态**：将原生 `fetch` 替换为 `request` 工具

**文件**：`suzaku-gaming-admin/src/views/Dashboard/index.vue`

```typescript
// 替换前
const res = await fetch("/api/dashboard/statistics");
const json = await res.json();
if (json.code === 0) {
  // ...
}

// 替换后
import { request } from '@/utils/request';

const data = await request.get('/dashboard/statistics');
// request 已解包 data，直接使用
```

**文件**：`suzaku-gaming-admin/src/views/PlayerData/RoleList.vue`

```typescript
// 替换前
const res = await fetch(url);
const json = await res.json();
if (json.code === 0) {
  tableData.value = json.data.list || [];
}

// 替换后
import { request } from '@/utils/request';

const data = await request.get<{ list: any[], pagination: any }>('/player/roles?' + params.toString());
tableData.value = data.list || [];
pagination.value.total = data.pagination?.total || 0;
```

**文件**：`suzaku-gaming-admin/src/views/PlayerData/OrderList.vue`

同上处理。

**测试用例**：

```markdown
## TC-H5: 前端 Token 注入测试

### TC-H5-01: Dashboard 请求带 token
- 前置: 登录状态，localStorage 有 token
- 操作: 访问 /dashboard
- 预期: 请求头包含 Authorization: Bearer xxx

### TC-H5-02: RoleList 请求带 token
- 前置: 登录状态
- 操作: 访问 /player-data/role-list
- 预期: 请求头包含 Authorization

### TC-H5-03: 无 token 时请求被拦截
- 前置: 未登录
- 操作: 直接访问 /dashboard
- 预期: 被路由守卫拦截到 /login
```

---

#### 2.2.3 修复 request.ts Blob 响应处理 🟡

**当前状态**：无 blob 处理，导出会报错

**目标状态**：

```typescript
// suzaku-gaming-admin/src/utils/request.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // ✅ 新增：Blob 响应直接返回（用于文件下载）
    if (response.config.responseType === 'blob') {
      return response;
    }

    const res = response.data;

    // 后端统一响应格式: { code, message, data, timestamp }
    if (res.code === 0 || res.code === 200) {
      return res.data;
    }

    // 直接返回数据（用于 Mock 或不标准响应）
    if (res.list !== undefined || res.token !== undefined) {
      return res;
    }

    ElMessage.error(res.message || '请求失败');
    return Promise.reject(new Error(res.message));
  },
  (error) => {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请重试');
      } else if (error.code === 'ERR_CANCELED') {
        return Promise.reject(error);
      } else {
        ElMessage.error('网络连接失败，请检查网络');
      }
      return Promise.reject(error);
    }

    const status = error.response.status;

    // ✅ 401 时自动跳转登录
    if (status === 401) {
      localStorage.removeItem('token');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    const errorMap: Record<number, string> = {
      400: '请求参数错误',
      401: '登录已过期，请重新登录',
      403: '没有权限访问',
      404: '请求的资源不存在',
      500: '服务器繁忙，请稍后重试',
    };

    ElMessage.error(errorMap[status] || `请求失败 (${status})`);
    return Promise.reject(error);
  }
);

// 通用请求方法
export const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config) as Promise<T>;
  },

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config) as Promise<T>;
  },

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config) as Promise<T>;
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config) as Promise<T>;
  },

  // ✅ 新增：文件下载
  download(url: string, filename?: string): Promise<void> {
    return service.get(url, { responseType: 'blob' }).then((response: any) => {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 
        response.headers['content-disposition']?.split('filename=')[1] || 
        'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    });
  }
};

export default service;
```

**测试用例**：

```markdown
## TC-M2: Blob 响应测试

### TC-M2-01: CSV 导出
- 操作: 调用 request.download('/audit/binding-applies/export')
- 预期: 下载 CSV 文件

### TC-M2-02: JSON 响应不受影响
- 操作: request.get('/dashboard/statistics')
- 预期: 返回解包后的 data
```

---

#### 2.2.4 创建 Login 页面 🟠

**当前状态**：❌ 不存在

**目标状态**：

**文件**：`suzaku-gaming-admin/src/views/Login/index.vue`（新建）

```vue
<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">海战游戏后台</h2>
      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="密码" 
            prefix-icon="Lock" 
            size="large"
            show-password 
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="login-btn" 
            size="large"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, type FormInstance } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { authApi } from '@/api/auth';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const res = await authApi.login(form);
    userStore.setToken(res.token);
    userStore.setUserInfo(res.userInfo);
    
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
    ElMessage.success('登录成功');
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  margin-bottom: 32px;
  color: #333;
  font-size: 24px;
}

.login-btn {
  width: 100%;
}
</style>
```

---

#### 2.2.5 创建 403 页面

**文件**：`suzaku-gaming-admin/src/views/Error/403.vue`（新建）

```vue
<template>
  <div class="error-container">
    <div class="error-content">
      <h1 class="error-code">403</h1>
      <p class="error-message">抱歉，您没有权限访问此页面</p>
      <div class="error-actions">
        <el-button type="primary" @click="goBack">返回上一页</el-button>
        <el-button @click="goHome">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  router.go(-1);
}

function goHome() {
  router.push('/');
}
</script>

<style scoped lang="scss">
.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  color: #f56c6c;
  margin: 0;
  font-weight: bold;
}

.error-message {
  font-size: 18px;
  color: #606266;
  margin: 20px 0 30px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
```

---

#### 2.2.6 路由配置更新

**当前状态**：

```typescript
// suzaku-gaming-admin/src/router/index.ts
import MainLayout from "@/layouts/MainLayout.vue";  // ✅ 正确路径
// 无 /login、/403、/system 路由
```

**目标状态**：

```typescript
// suzaku-gaming-admin/src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";  // ✅ 保持现有路径

const routes: RouteRecordRaw[] = [
  // ✅ 新增：登录页（布局外）
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login/index.vue"),
    meta: { title: "登录" }
  },
  // ✅ 新增：403 页面
  {
    path: "/403",
    name: "Forbidden",
    component: () => import("@/views/Error/403.vue"),
    meta: { title: "无权限" }
  },
  {
    path: "/",
    component: MainLayout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/Dashboard/index.vue"),
        meta: {
          title: "概要面板",
          icon: "House",
          breadcrumb: ["概要面板"]
        }
      },
      {
        path: "player-data",
        name: "PlayerData",
        redirect: "/player-data/role-list",
        meta: {
          title: "玩家数据",
          icon: "DataLine"
        },
        children: [
          {
            path: "role-list",
            name: "RoleList",
            component: () => import("@/views/PlayerData/RoleList.vue"),
            meta: {
              title: "角色列表",
              breadcrumb: ["玩家数据报表", "角色列表"]
            }
          },
          {
            path: "order-list",
            name: "OrderList",
            component: () => import("@/views/PlayerData/OrderList.vue"),
            meta: {
              title: "订单列表",
              breadcrumb: ["玩家数据报表", "订单列表"]
            }
          }
        ]
      },
      {
        path: "audit",
        name: "Audit",
        redirect: "/audit/binding-apply",
        meta: {
          title: "审核管理",
          icon: "Checked"
        },
        children: [
          {
            path: "binding-apply",
            name: "BindingApply",
            component: () => import("@/views/Audit/BindingApply.vue"),
            meta: {
              title: "绑定申请",
              breadcrumb: ["审核", "绑定申请"]
            }
          },
          {
            path: "new-attribution",
            name: "NewAttribution",
            component: () => import("@/views/Audit/NewAttribution.vue"),
            meta: {
              title: "新增归因更改",
              breadcrumb: ["审核", "新增归因更改"]
            }
          }
        ]
      },
      // ✅ 新增：系统管理（Phase 1/2 后启用）
      {
        path: "system",
        name: "System",
        redirect: "/system/users",
        meta: {
          title: "系统管理",
          icon: "Setting",
          roles: ["admin", "manager"]
        },
        children: [
          {
            path: "users",
            name: "UserManagement",
            component: () => import("@/views/System/UserManagement.vue"),
            meta: {
              title: "用户管理",
              breadcrumb: ["系统管理", "用户管理"],
              roles: ["admin", "manager"]
            }
          }
        ]
      }
    ]
  },
  // 404
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/Error/404.vue"),
    meta: { title: "页面不存在" }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string;
  document.title = title ? title + " - 海战游戏后台" : "海战游戏后台";
  next();
});

export default router;
```

---

#### 2.2.7 创建路由守卫

**文件**：`suzaku-gaming-admin/src/router/guards.ts`（新建）

```typescript
import type { Router } from 'vue-router';
import { useUserStore } from '@/stores/user';

const WHITE_LIST = ['/login', '/403', '/404'];

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();

    // 白名单直接放行
    if (WHITE_LIST.includes(to.path)) {
      // 已登录用户访问 /login 时跳转首页
      if (to.path === '/login' && userStore.token) {
        next('/');
        return;
      }
      next();
      return;
    }

    // 未登录跳转登录页
    if (!userStore.token) {
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }

    // 有 token 但无 userInfo 时获取用户信息
    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo();
      } catch (error) {
        next({ path: '/login', query: { redirect: to.fullPath } });
        return;
      }
    }

    // 检查路由权限
    const requiredRoles = to.meta?.roles as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = userStore.userInfo?.role;
      if (!userRole || !requiredRoles.includes(userRole)) {
        next('/403');
        return;
      }
    }

    next();
  });
}
```

**文件**：`suzaku-gaming-admin/src/main.ts`（修改）

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import 'element-plus/dist/index.css';
import '@/assets/styles/index.scss';

import App from './App.vue';
import router from './router';
import { setupRouterGuards } from './router/guards';  // ✅ 新增

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(createPinia());
app.use(router);

app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
});

// ✅ 新增：路由守卫（Phase 0-C 启用）
setupRouterGuards(router);

app.mount('#app');
```

**测试用例**：

```markdown
## TC-H4: 路由守卫测试

### TC-H4-01: 无 token 访问受保护页面
- 前置: 清除 localStorage token
- 操作: 访问 /dashboard
- 预期: 重定向到 /login?redirect=/dashboard

### TC-H4-02: 有 token 无 userInfo 时自动获取
- 前置: 有 token，userInfo 为 null
- 操作: 访问 /dashboard
- 预期: 调用 getProfile，成功后继续

### TC-H4-03: 已登录用户访问 /login
- 前置: 已登录
- 操作: 访问 /login
- 预期: 重定向到 /

### TC-H4-04: Operator 访问 /system/users
- 前置: role=operator
- 操作: 访问 /system/users
- 预期: 重定向到 /403
```

---

### 2.3 Phase 0-B：后端 JWT 扩展

#### 2.3.1 扩展 auth.service.ts

**当前状态**：
```typescript
// JWT payload 仅含 sub/username/role
// getProfile 仅返回 id/username/realName/role/avatar
```

**目标状态**：

```typescript
// suzaku-gaming-server/src/modules/auth/auth.service.ts
async login(loginDto: LoginDto, ip?: string) {
  // ... 现有验证逻辑 ...

  // ✅ 扩展 JWT 载荷
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    level: user.level,              // ✅ 新增
    parentId: user.parentId,        // ✅ 新增
    cpsGroupCode: user.cpsGroupCode, // ✅ 新增
  };
  const token = this.jwtService.sign(payload);

  // ... 更新登录信息 ...

  // ✅ 保留审计日志
  await this.prisma.auditLog.create({
    data: {
      adminId: user.id,
      action: 'login',
      module: 'auth',
      ip: ip || null,
    },
  });

  return {
    token,
    userInfo: {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      level: user.level,              // ✅ 新增
      cpsGroupCode: user.cpsGroupCode, // ✅ 新增
      avatar: user.avatar,
    },
  };
}

async getProfile(userId: number) {
  const user = await this.prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      level: true,              // ✅ 新增
      parentId: true,           // ✅ 新增
      cpsGroupCode: true,       // ✅ 新增
      avatar: true,
      lastLoginAt: true,
      lastLoginIp: true,
    },
  });

  if (!user) {
    throw new UnauthorizedException('用户不存在');
  }

  return user;
}
```

#### 2.3.2 扩展 jwt.strategy.ts

**当前状态**：
```typescript
// validate 返回 id/username/realName/role/status
// 不含 level/parentId/cpsGroupCode
```

**目标状态**：

```typescript
// suzaku-gaming-server/src/modules/auth/strategies/jwt.strategy.ts
async validate(payload: JwtPayload) {
  const user = await this.prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      level: true,           // ✅ 新增
      parentId: true,        // ✅ 新增
      cpsGroupCode: true,    // ✅ 新增
      status: true,
    },
  });

  if (!user || user.status !== 1) {
    throw new UnauthorizedException('用户不存在或已被禁用');
  }

  return user;
}
```

**测试用例**：

```markdown
## TC-P0B-JWT: JWT 扩展测试

### TC-P0B-JWT-01: 登录返回包含新字段
- 操作: POST /auth/login
- 预期: userInfo 包含 level, cpsGroupCode

### TC-P0B-JWT-02: JWT payload 包含新字段
- 操作: 解码返回的 token
- 预期: payload 包含 level, parentId, cpsGroupCode

### TC-P0B-JWT-03: getProfile 返回完整信息
- 操作: GET /auth/profile
- 预期: 返回包含 level, parentId, cpsGroupCode

### TC-P0B-JWT-04: req.user 包含新字段
- 操作: 访问任意受保护接口，检查 req.user
- 预期: req.user 包含 level, parentId, cpsGroupCode
```

---

#### 2.3.3 修复 ThinkingData 响应格式 🟡

**当前状态**：
```typescript
// 手动返回 {code, message, data}，被 ResponseInterceptor 再次包装
return {
  code: 0,
  message: result.success ? 'success' : result.error,
  data: result,
};
```

**目标状态**：

```typescript
// suzaku-gaming-server/src/modules/thinkingdata/thinkingdata.controller.ts
import { BadRequestException } from '@nestjs/common';

@Post('thinkingdata/trigger')
@Public() // Phase 0-C 时改为 @Roles('admin')
async triggerSync() {
  const result = await this.scheduler.triggerManualSync();
  // ✅ 直接返回业务对象
  return result;
}

@Post('thinkingdata/sync-orders-range')
@Public()
async syncOrdersRange(
  @Query('startDate') startDate: string,
  @Query('endDate') endDate: string,
  @Query('limit') limit?: string,
) {
  if (!startDate || !endDate) {
    // ✅ 使用异常而非手动返回 {code: 400}
    throw new BadRequestException('startDate and endDate are required');
  }
  const maxLimit = limit ? parseInt(limit, 10) : 50000;
  const result = await this.thinkingDataService.syncOrdersRange(startDate, endDate, maxLimit);
  return result;
}

// ... 其他方法同样处理
```

**测试用例**：

```markdown
## TC-M1: 响应格式测试

### TC-M1-01: ThinkingData 成功响应
- 操作: POST /sync/thinkingdata/trigger
- 预期: { code: 0, data: { success: true, ... }, message: 'success', timestamp: ... }
- 验证: data 内部不包含 code/message

### TC-M1-02: ThinkingData 参数错误
- 操作: POST /sync/thinkingdata/sync-orders-range (无参数)
- 预期: { code: 400, message: 'startDate and endDate are required' }
```

---

### 2.4 Phase 0-C：全局 Guard 启用

#### 2.4.1 注册全局 Guard

**文件**：`suzaku-gaming-server/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
// ... 其他 imports

@Module({
  imports: [/* ... */],
  providers: [
    // ✅ 顺序重要：JwtAuthGuard 先于 RolesGuard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

#### 2.4.2 调整 @Public 白名单

**保留 @Public 的接口**：
- `auth/login` ✅
- `health/check` ✅ (实际路径 `/health`)

**不应该是 @Public 的接口**：
- `auth/logout` ❌ - 需要识别用户，记录审计日志

#### 2.4.3 ThinkingData 添加权限

```typescript
// suzaku-gaming-server/src/modules/thinkingdata/thinkingdata.controller.ts
@Post('thinkingdata/trigger')
@Roles('admin')  // ✅ 替换 @Public()
@ApiBearerAuth()
async triggerSync() { /* ... */ }
```

#### 2.4.4 移除 Dashboard/Player @Public

```typescript
// suzaku-gaming-server/src/modules/dashboard/dashboard.controller.ts
@Get('statistics')
@Roles('admin', 'manager', 'operator')  // ✅ 替换 @Public()
async getStatistics() { /* ... */ }

// suzaku-gaming-server/src/modules/player/player.controller.ts
@Get('roles')
@Roles('admin', 'manager', 'operator')  // ✅ 替换 @Public()
async getRoles() { /* ... */ }

@Get('orders')
@Roles('admin', 'manager', 'operator')  // ✅ 替换 @Public()
async getOrders() { /* ... */ }

@Get('filter-options')
@Roles('admin', 'manager', 'operator')  // ✅ 替换 @Public()
async getFilterOptions() { /* ... */ }
```

**测试用例**：

```markdown
## TC-P0C-GUARD: 全局 Guard 测试

### TC-P0C-GUARD-01: 无 token 访问 /dashboard
- 操作: GET /dashboard/statistics (无 Authorization)
- 预期: 401 Unauthorized

### TC-P0C-GUARD-02: Operator 访问 ThinkingData
- 前置: role=operator
- 操作: POST /sync/thinkingdata/trigger
- 预期: 403 Forbidden

### TC-P0C-GUARD-03: Admin 访问 ThinkingData
- 前置: role=admin
- 操作: POST /sync/thinkingdata/trigger
- 预期: 200 OK

### TC-P0C-GUARD-04: 健康检查保持公开
- 操作: GET /health (无 token)
- 预期: 200 OK

### TC-P0C-GUARD-05: 登录接口保持公开
- 操作: POST /auth/login (无 token)
- 预期: 200/401（取决于凭证）

### TC-P0C-GUARD-06: 登出需要认证
- 操作: POST /auth/logout (无 token)
- 预期: 401 Unauthorized
```

---

### 2.5 Phase 1：用户管理后端模块

> 详见独立实现，需新建 `modules/user/*` 全量文件

**API 设计**：

| 方法 | 路径 | 角色 | 描述 |
|------|------|------|------|
| GET | /user/list | admin, manager | 获取用户列表 |
| POST | /user/create | admin, manager | 创建用户 |
| GET | /user/:id | admin, manager | 获取用户详情 |
| PUT | /user/:id | admin, manager | 更新用户 |
| POST | /user/:id/toggle-status | admin, manager | 切换状态 |

**返回格式**（与现有列表一致）：
```typescript
{
  list: AdminUser[],
  pagination: {
    page: number,
    pageSize: number,
    total: number
  }
}
```

**测试用例**：见 v10.0 中 TC-P1-01 ~ TC-P1-08

---

### 2.6 Phase 2：用户管理前端页面

> 详见 v10.0 中的 `UserManagement.vue` 实现

---

### 2.7 Phase 3：数据隔离落地

#### 2.7.1 CPS Service 隔离

**当前状态**：完全依赖 query 参数，无 req.user 过滤

**目标状态**：

```typescript
// suzaku-gaming-server/src/modules/cps/cps.service.ts
private buildCpsDataFilter(currentUser: any, query: any = {}) {
  // Admin 可以使用任何过滤条件
  if (typeof currentUser.level === 'number' && currentUser.level === 0) {
    return query.cpsGroup ? { cpsGroup: query.cpsGroup } : {};
  }

  // Manager: 强制按 cpsGroup 过滤，忽略传入参数
  if (typeof currentUser.level === 'number' && currentUser.level === 1) {
    return { cpsGroup: currentUser.cpsGroupCode };
  }

  // Operator: 强制按 operatorId 过滤
  return { operatorId: String(currentUser.id) };
}

async getBindings(query: any, currentUser: any) {
  const dataFilter = this.buildCpsDataFilter(currentUser, query);
  // 合并其他查询条件...
  return this.prisma.cpsBinding.findMany({ where: dataFilter });
}
```

#### 2.7.2 CPS Controller 传递 req.user

**当前状态**：仅 `createBinding` 使用 req.user

**目标状态**：

```typescript
// suzaku-gaming-server/src/modules/cps/cps.controller.ts
@Get('bindings')
@Roles('admin', 'manager', 'operator')
async getBindings(@Query() query, @Req() req: Request) {
  return this.cpsService.getBindings(query, req.user);  // ✅ 传递 req.user
}

@Get('fail-logs')
@Roles('admin', 'manager', 'operator')
async getFailLogs(@Query() query, @Req() req: Request) {
  return this.cpsService.getFailLogs(query, req.user);  // ✅ 传递 req.user
}

// ... 其他查询方法同样处理
```

**测试用例**：

```markdown
## TC-P3: 数据隔离测试

### TC-P3-01: Admin 查询所有 CPS 数据
- 前置: role=admin
- 操作: GET /cps/bindings
- 预期: 返回所有数据

### TC-P3-02: Manager 查询本组 CPS 数据
- 前置: role=manager, cpsGroupCode='A'
- 操作: GET /cps/bindings
- 预期: 仅返回 cpsGroup='A' 的数据

### TC-P3-03: Manager 传参无法越权
- 前置: role=manager, cpsGroupCode='A'
- 操作: GET /cps/bindings?cpsGroup=B
- 预期: 仍返回 cpsGroup='A'（忽略传参）

### TC-P3-04: Operator 查询本人数据
- 前置: role=operator, id=10
- 操作: GET /cps/bindings
- 预期: 仅返回 operatorId='10' 的数据

### TC-P3-05: Operator 查询自己的审核申请
- 前置: role=operator, username='user1'
- 操作: GET /audit/binding-applies
- 预期: 仅返回 applicant='user1' 的数据
```

---

## 3. 开放问题敲定

| # | 问题 | 决定 | 说明 |
|---|------|------|------|
| Q1 | 角色体系 | 统一为 `admin/manager/operator` | 移除前端 `viewer` |
| Q2 | Audit 隔离字段 | `applicant`(用户名) + `reviewerId`(用户ID) | 服务端强制覆盖 |
| Q3 | @Public 保留 | `auth/login`, `health/check` | `auth/logout` 需要认证 |
| Q4 | /user/* 返回格式 | `{ list, pagination }` | 与现有列表一致 |
| Q5 | operatorType 枚举 | 统一为 `admin/manager/operator` | 需迁移历史数据 |

---

## 4. 实施顺序与依赖

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 0-Critical (1-2天)                                        │
│   ├─ 修复 RolesGuard null 判定                                   │
│   ├─ 移除 Audit @Public()，添加 @Roles                           │
│   └─ 执行数据修复脚本                                            │
├─────────────────────────────────────────────────────────────────┤
│ Phase 0-A (2-3天) - 可与 0-Critical 并行                         │
│   ├─ 修复前端角色枚举                                            │
│   ├─ 修复前端 fetch → request（带 token）                        │
│   ├─ 修复 request.ts Blob 处理                                   │
│   ├─ 创建 Login/403 页面                                         │
│   ├─ 更新路由配置                                                │
│   └─ 创建路由守卫（暂不启用）                                     │
├─────────────────────────────────────────────────────────────────┤
│ Phase 0-B (1天) - 依赖 0-Critical 完成                           │
│   ├─ 扩展 auth.service.ts JWT 载荷                               │
│   ├─ 扩展 jwt.strategy.ts validate                               │
│   └─ 修复 ThinkingData 响应格式                                  │
├─────────────────────────────────────────────────────────────────┤
│ Phase 0-C (1天) - 依赖 0-A 和 0-B 完成                           │
│   ├─ 注册全局 APP_GUARD                                          │
│   ├─ ThinkingData 添加 @Roles('admin')                           │
│   ├─ Dashboard/Player 移除 @Public                               │
│   └─ 前端启用路由守卫                                            │
├─────────────────────────────────────────────────────────────────┤
│ Phase 1 (2-3天) - 依赖 0-C 完成                                  │
│   └─ 创建 UserModule 及全部 API                                  │
├─────────────────────────────────────────────────────────────────┤
│ Phase 2 (1-2天) - 依赖 Phase 1 完成                              │
│   └─ 创建 UserManagement.vue                                     │
├─────────────────────────────────────────────────────────────────┤
│ Phase 3 (2-3天) - 依赖 Phase 1 完成                              │
│   ├─ CPS Service 数据隔离                                        │
│   ├─ Audit Service 数据隔离                                      │
│   └─ Controller 传递 req.user                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 完整测试清单

```markdown
# 测试执行清单

## Phase 0-Critical
- [ ] TC-C1-01 ~ TC-C1-05: RolesGuard null 判定
- [ ] TC-C2-01 ~ TC-C2-06: Audit 权限控制
- [ ] TC-P0C-DATA-01 ~ TC-P0C-DATA-04: 数据修复

## Phase 0-A
- [ ] TC-H3-01 ~ TC-H3-05: 前端角色枚举
- [ ] TC-H5-01 ~ TC-H5-03: 前端 Token 注入
- [ ] TC-M2-01 ~ TC-M2-02: Blob 响应
- [ ] TC-H4-01 ~ TC-H4-04: 路由守卫

## Phase 0-B
- [ ] TC-P0B-JWT-01 ~ TC-P0B-JWT-04: JWT 扩展
- [ ] TC-M1-01 ~ TC-M1-02: 响应格式

## Phase 0-C
- [ ] TC-P0C-GUARD-01 ~ TC-P0C-GUARD-06: 全局 Guard

## Phase 1
- [ ] TC-P1-01 ~ TC-P1-08: 用户管理 API

## Phase 2
- [ ] TC-P2-01 ~ TC-P2-06: 用户管理页面

## Phase 3
- [ ] TC-P3-01 ~ TC-P3-05: 数据隔离
```

---

**文档结束**
