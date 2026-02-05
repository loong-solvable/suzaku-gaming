// src/modules/user/user.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ROLE_LEVEL_MAP } from '../../common/guards/roles.guard';
import * as bcrypt from 'bcrypt';

// 当前用户接口
interface CurrentUser {
  id: number;
  username: string;
  role: string;
  level?: number;
  cpsGroupCode?: string;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户列表
   * - Admin: 可查看所有用户
   * - Manager: 只能查看自己和下级
   */
  async getUsers(query: QueryUserDto, currentUser: CurrentUser) {
    const { page = 1, pageSize = 20, username, realName, role, status, cpsGroupCode } = query;

    const where: any = {};

    // 数据隔离
    if (typeof currentUser.level === 'number' && currentUser.level > 0) {
      // Manager 只能看到自己和下级
      where.OR = [
        { id: currentUser.id },
        { parentId: currentUser.id },
      ];
    }

    // 搜索条件
    if (username) {
      where.username = { contains: username };
    }
    if (realName) {
      where.realName = { contains: realName };
    }
    if (role) {
      where.role = role;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (cpsGroupCode) {
      where.cpsGroupCode = cpsGroupCode;
    }

    const [list, total] = await Promise.all([
      this.prisma.adminUser.findMany({
        where,
        select: {
          id: true,
          username: true,
          realName: true,
          role: true,
          level: true,
          parentId: true,
          cpsGroupCode: true,
          avatar: true,
          status: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.adminUser.count({ where }),
    ]);

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取组长和组员选项（用于归因申请，所有角色可访问）
   */
  async getTeamOptions() {
    const [managers, operators] = await Promise.all([
      this.prisma.adminUser.findMany({
        where: { role: 'manager', status: 1 },
        select: {
          id: true,
          username: true,
          realName: true,
        },
        orderBy: { realName: 'asc' },
      }),
      this.prisma.adminUser.findMany({
        where: { role: 'operator', status: 1 },
        select: {
          id: true,
          username: true,
          realName: true,
          parentId: true,
        },
        orderBy: { realName: 'asc' },
      }),
    ]);

    return {
      managers,
      operators,
    };
  }

  /**
   * 获取用户详情
   */
  async getUserById(id: number, currentUser: CurrentUser) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        level: true,
        parentId: true,
        cpsGroupCode: true,
        avatar: true,
        status: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 数据隔离验证
    if (typeof currentUser.level === 'number' && currentUser.level > 0) {
      if (user.id !== currentUser.id && user.parentId !== currentUser.id) {
        throw new NotFoundException('用户不存在');
      }
    }

    return user;
  }

  /**
   * 创建用户
   * - Admin: 可创建任何角色
   * - Manager: 只能创建 operator
   */
  async createUser(dto: CreateUserDto, currentUser: CurrentUser) {
    // 权限检查：Manager 只能创建 operator
    if (typeof currentUser.level === 'number' && currentUser.level === 1) {
      if (dto.role !== 'operator') {
        throw new ForbiddenException('组长只能创建组员');
      }
      // 自动设置 parentId 为当前用户
      dto.parentId = currentUser.id;
      // 继承 cpsGroupCode
      dto.cpsGroupCode = currentUser.cpsGroupCode;
    }

    // 检查用户名是否已存在
    const existing = await this.prisma.adminUser.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    // 计算 level
    const level = ROLE_LEVEL_MAP[dto.role] ?? 2;

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.adminUser.create({
      data: {
        username: dto.username,
        passwordHash,
        salt,
        realName: dto.realName,
        role: dto.role,
        level,
        parentId: dto.parentId,
        cpsGroupCode: dto.cpsGroupCode,
        avatar: dto.avatar,
        status: 1,
      },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        level: true,
        parentId: true,
        cpsGroupCode: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        adminId: currentUser.id,
        action: 'create_user',
        module: 'user',
        target: `user:${user.id}`,
        newValue: { username: dto.username, role: dto.role },
      },
    });

    return user;
  }

  /**
   * 更新用户
   * - Admin: 可更新任何用户
   * - Manager: 只能更新自己的下级
   */
  async updateUser(id: number, dto: UpdateUserDto, currentUser: CurrentUser) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 数据隔离验证
    if (typeof currentUser.level === 'number' && currentUser.level > 0) {
      if (user.parentId !== currentUser.id && user.id !== currentUser.id) {
        throw new NotFoundException('用户不存在');
      }
      // Manager 不能修改角色
      if (dto.role && dto.role !== user.role) {
        throw new ForbiddenException('无权修改角色');
      }
    }

    // 不能修改自己的角色
    if (id === currentUser.id && dto.role && dto.role !== currentUser.role) {
      throw new BadRequestException('不能修改自己的角色');
    }

    const updateData: any = {};

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(dto.password, salt);
      updateData.salt = salt;
    }

    if (dto.realName !== undefined) {
      updateData.realName = dto.realName;
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
      updateData.level = ROLE_LEVEL_MAP[dto.role] ?? 2;
    }

    if (dto.parentId !== undefined) {
      updateData.parentId = dto.parentId;
    }

    if (dto.cpsGroupCode !== undefined) {
      updateData.cpsGroupCode = dto.cpsGroupCode;
    }

    if (dto.avatar !== undefined) {
      updateData.avatar = dto.avatar;
    }

    if (dto.status !== undefined) {
      // 不能禁用自己
      if (id === currentUser.id && dto.status === 0) {
        throw new BadRequestException('不能禁用自己');
      }
      updateData.status = dto.status;
    }

    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        level: true,
        parentId: true,
        cpsGroupCode: true,
        avatar: true,
        status: true,
        updatedAt: true,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        adminId: currentUser.id,
        action: 'update_user',
        module: 'user',
        target: `user:${id}`,
        oldValue: { role: user.role, status: user.status },
        newValue: updateData,
      },
    });

    return updated;
  }

  /**
   * 切换用户状态
   */
  async toggleStatus(id: number, currentUser: CurrentUser) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不能禁用自己
    if (id === currentUser.id) {
      throw new BadRequestException('不能禁用自己');
    }

    // 数据隔离验证
    if (typeof currentUser.level === 'number' && currentUser.level > 0) {
      if (user.parentId !== currentUser.id) {
        throw new NotFoundException('用户不存在');
      }
    }

    const newStatus = user.status === 1 ? 0 : 1;

    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        username: true,
        status: true,
      },
    });

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        adminId: currentUser.id,
        action: newStatus === 1 ? 'enable_user' : 'disable_user',
        module: 'user',
        target: `user:${id}`,
        oldValue: { status: user.status },
        newValue: { status: newStatus },
      },
    });

    return updated;
  }

  /**
   * 获取可选的上级用户列表（用于下拉选择）
   */
  async getParentOptions(currentUser: CurrentUser) {
    // Admin 可以选择所有 admin 和 manager
    // Manager 只能选择自己
    const where: any = {
      status: 1,
    };

    if (typeof currentUser.level === 'number' && currentUser.level === 0) {
      where.role = { in: ['admin', 'manager'] };
    } else {
      where.id = currentUser.id;
    }

    return this.prisma.adminUser.findMany({
      where,
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
      },
      orderBy: { role: 'asc' },
    });
  }
}
