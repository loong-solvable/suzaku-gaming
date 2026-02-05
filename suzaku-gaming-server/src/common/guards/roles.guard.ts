// src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// 角色到层级的映射（导出供 UserService 使用）
export const ROLE_LEVEL_MAP: Record<string, number> = {
  admin: 0, // 运营管理员
  manager: 1, // 组长
  operator: 2, // 组员
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

    // 兼容新旧两种权限判断方式
    // 方式1: 基于 role 字符串（现有方式）
    const hasRoleByString = user.role && requiredRoles.includes(user.role);

    // 方式2: 基于 level 数值（新方式，level 越小权限越高）
    // 如果用户 level 小于等于所需角色的最高 level，则有权限
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
