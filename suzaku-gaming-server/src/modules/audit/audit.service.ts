// src/modules/audit/audit.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { QueryBindingAppliesDto } from './dto/query-binding-applies.dto';
import { CreateBindingApplyDto } from './dto/create-binding-apply.dto';
import { UpdateBindingApplyDto } from './dto/update-binding-apply.dto';
import { ReviewBindingApplyDto } from './dto/review-binding-apply.dto';

// CSV 导出列配置
const BINDING_APPLY_EXPORT_COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'project', header: '项目' },
  { key: 'roleId', header: '角色ID' },
  { key: 'roleName', header: '角色名称' },
  { key: 'serverId', header: '服务器ID' },
  { key: 'serverName', header: '服务器名称' },
  { key: 'platform', header: '平台' },
  { key: 'teamLeader', header: '组长' },
  { key: 'teamMember', header: '组员' },
  { key: 'applicant', header: '申请人' },
  { key: 'status', header: '状态' },
  { key: 'remark', header: '备注' },
  { key: 'applyTime', header: '申请时间' },
  { key: 'reviewTime', header: '审核时间' },
];

// 当前用户接口
interface CurrentUser {
  id: number;
  username: string;
  role: string;
  level?: number;
  cpsGroupCode?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  // ===== 权限隔离辅助方法（R2 完整方案 §4.1） =====

  /**
   * 判断 Manager 是否有权"查看/编辑"指定申请
   * 同时兼容新数据（platform = cpsGroupCode）和旧数据（teamLeader = username）
   * 注意：此方法包含 applicant 自身查看权限，仅用于查看/编辑，不可用于审核
   */
  private canManagerView(
    apply: { platform?: string | null; teamLeader?: string | null; applicant: string },
    currentUser: CurrentUser,
  ): boolean {
    return (
      apply.platform === currentUser.cpsGroupCode ||   // 新数据：组编码匹配
      apply.teamLeader === currentUser.username ||      // 旧数据：组长名匹配
      apply.applicant === currentUser.username           // 自己提交的（仅查看/编辑需要）
    );
  }

  /**
   * 判断 Manager 是否有权"审核"指定申请（R10）
   * ★ 不包含 applicant 条件——防止"非本组但本人申请可审核"的语义漏洞
   * 审核权限严格按组归属判定
   */
  private canManagerReview(
    apply: { platform?: string | null; teamLeader?: string | null },
    currentUser: CurrentUser,
  ): boolean {
    return (
      apply.platform === currentUser.cpsGroupCode ||   // 新数据：组编码匹配
      apply.teamLeader === currentUser.username          // 旧数据：组长名匹配
    );
  }

  /**
   * 构建数据隔离过滤条件（R2 修正）
   * Admin: 可查看所有数据
   * Manager: 可查看本组（platform/teamLeader）及自己提交的数据
   * Operator: 只能查看自己创建的数据
   */
  private buildDataFilter(currentUser?: CurrentUser): any {
    if (!currentUser) return {};

    // Admin (level === 0) 无限制
    if (typeof currentUser.level === 'number' && currentUser.level === 0) {
      return {};
    }

    // Manager (level === 1) 按组过滤（R2: 兼容新旧数据）
    if (typeof currentUser.level === 'number' && currentUser.level === 1) {
      return {
        OR: [
          { platform: currentUser.cpsGroupCode },   // 新数据：组编码匹配
          { teamLeader: currentUser.username },      // 旧数据：组长名匹配
          { applicant: currentUser.username },       // 自己提交的
        ],
      };
    }

    // Operator (level === 2) 只能看自己的申请
    return {
      applicant: currentUser.username,
    };
  }

  // ===== 列表查询 =====

  async getBindingApplies(query: QueryBindingAppliesDto, currentUser?: CurrentUser) {
    const {
      page = 1,
      pageSize = 20,
      project,
      gameProject,
      server,
      roleId,
      applicant,
      status,
      applyTimeStart,
      applyTimeEnd,
      sortBy,
      sortOrder,
    } = query;

    // 应用数据隔离过滤
    const dataFilter = this.buildDataFilter(currentUser);
    const where: any = { ...dataFilter };

    // 支持 project 或 gameProject 参数
    const projectFilter = project || gameProject;
    if (projectFilter) {
      where.project = projectFilter;
    }
    // 服务器筛选
    if (server) {
      const parsedServerId = parseInt(server, 10);
      if (!isNaN(parsedServerId)) {
        where.serverId = parsedServerId;
      } else {
        where.serverName = { contains: server };
      }
    }
    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (applicant) {
      where.applicant = { contains: applicant };
    }
    if (status) {
      where.status = status;
    }
    // 申请时间范围筛选
    if (applyTimeStart || applyTimeEnd) {
      where.applyTime = {};
      if (applyTimeStart) {
        where.applyTime.gte = new Date(applyTimeStart);
      }
      if (applyTimeEnd) {
        const endDate = new Date(applyTimeEnd);
        endDate.setDate(endDate.getDate() + 1);
        where.applyTime.lt = endDate;
      }
    }

    // 排序
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.applyTime = 'desc';
    }

    const [list, total] = await Promise.all([
      this.prisma.bindingApply.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bindingApply.count({ where }),
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

  // ===== 详情查询（R2: canManagerView） =====

  async getBindingApplyById(id: number, currentUser?: CurrentUser) {
    const apply = await this.prisma.bindingApply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException('绑定申请不存在');
    }

    // 数据隔离验证
    if (currentUser) {
      const level = currentUser.level;
      // Admin 无限制
      if (typeof level === 'number' && level === 0) {
        return apply;
      }
      // Manager: 使用 canManagerView（R2）
      if (typeof level === 'number' && level === 1) {
        if (!this.canManagerView(apply, currentUser)) {
          throw new NotFoundException('绑定申请不存在');
        }
      }
      // Operator 只能查看自己的申请
      if (typeof level === 'number' && level === 2) {
        if (apply.applicant !== currentUser.username) {
          throw new NotFoundException('绑定申请不存在');
        }
      }
    }

    return apply;
  }

  // ===== 角色预校验接口 =====

  async checkRoleForBinding(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
      select: { roleId: true, roleName: true, serverId: true, serverName: true, cpsGroup: true, cpsVisible: true },
    });

    if (!role) {
      return { valid: false, reason: '该角色不在CPS候选池中' };
    }
    if (role.cpsGroup || role.cpsVisible) {
      return { valid: false, reason: `该角色已绑定到分组: ${role.cpsGroup}` };
    }

    // 检查是否有 pending/approved 申请
    const existingApply = await this.prisma.bindingApply.findFirst({
      where: { roleId, status: { in: ['pending', 'approved'] } },
    });
    if (existingApply) {
      const statusText = existingApply.status === 'pending' ? '待审核' : '已通过';
      return { valid: false, reason: `该角色已有${statusText}的绑定申请` };
    }

    return { valid: true, role };
  }

  // ===== 创建申请（P3+P5+P6+R11+R16+R21 全校验链） =====

  async createBindingApply(dto: CreateBindingApplyDto, currentUser?: CurrentUser) {
    if (!currentUser) {
      throw new BadRequestException('无法获取当前用户信息');
    }

    // 1. 校验角色可绑定性（P3）
    const role = await this.prisma.role.findUnique({
      where: { roleId: dto.roleId },
      select: { roleId: true, roleName: true, serverId: true, serverName: true, cpsGroup: true, cpsVisible: true },
    });
    if (!role) {
      await this.logBindFail(dto.roleId, currentUser.id, '该角色不在CPS候选池中，无法绑定');
      throw new BadRequestException('该角色不在CPS候选池中，无法绑定');
    }
    if (role.cpsGroup || role.cpsVisible) {
      await this.logBindFail(dto.roleId, currentUser.id, `该角色已绑定到分组: ${role.cpsGroup}`);
      throw new BadRequestException(`该角色已绑定到分组: ${role.cpsGroup}`);
    }

    // 2. 防重复提交（R11 应用层）
    const existingApply = await this.prisma.bindingApply.findFirst({
      where: { roleId: dto.roleId, status: { in: ['pending', 'approved'] } },
    });
    if (existingApply) {
      const statusText = existingApply.status === 'pending' ? '待审核' : '已通过';
      throw new BadRequestException(
        `该角色已有${statusText}的绑定申请（ID: ${existingApply.id}），不可重复提交`,
      );
    }

    // 3. R21 服务层强制必填
    if (!dto.platform) {
      throw new BadRequestException('组名（platform）为必填项');
    }
    if (!dto.teamMember) {
      throw new BadRequestException('组员编号（teamMember）为必填项');
    }

    // 4. 校验 platform 是合法的 cpsGroupCode（R16）
    const groupExists = await this.prisma.adminUser.findFirst({
      where: { cpsGroupCode: dto.platform, role: 'manager', status: 1 },
    });

    let effectiveGroupCode = dto.platform;

    if (!groupExists) {
      // 旧前端提交旧语义：退回到当前用户自身的 cpsGroupCode
      if (currentUser.cpsGroupCode) {
        effectiveGroupCode = currentUser.cpsGroupCode;
      } else if (currentUser.level !== 0) {
        throw new BadRequestException(`无效的CPS分组编码: ${dto.platform}`);
      }
      // admin 不强制校验组编码
    }

    // 非 admin 只能提交本组申请
    if (groupExists && currentUser.level !== 0 && dto.platform !== currentUser.cpsGroupCode) {
      throw new ForbiddenException('不允许为其他分组提交申请');
    }

    // 5. 校验 teamMember 是合法的 memberCode（R16）
    let memberExists = await this.prisma.adminUser.findFirst({
      where: { cpsGroupCode: effectiveGroupCode, memberCode: dto.teamMember, role: 'operator', status: 1 },
    });
    if (!memberExists) {
      // 降级：旧前端提交 username
      memberExists = await this.prisma.adminUser.findFirst({
        where: { cpsGroupCode: effectiveGroupCode, username: dto.teamMember, role: 'operator', status: 1 },
      });
    }
    if (!memberExists && currentUser.level !== 0) {
      throw new BadRequestException(`分组 ${effectiveGroupCode} 中不存在组员编号或用户名: ${dto.teamMember}`);
    }

    // 6. 自动回填 teamLeader（R2）
    let teamLeader: string | null = null;
    if (dto.platform) {
      const leader = await this.prisma.adminUser.findFirst({
        where: { cpsGroupCode: dto.platform, role: 'manager', status: 1 },
        select: { username: true },
      });
      teamLeader = leader?.username || null;
    }

    // 7. 创建（R11：捕获数据库唯一索引冲突，返回友好 4xx 而非 500）
    try {
      return await this.prisma.bindingApply.create({
        data: {
          ...dto,
          project: 'warship',                                // P6 强制
          applicant: currentUser.username,                    // 强制申请人
          teamLeader,                                         // R2 自动回填
          attachments: dto.attachments,                       // DTO 已校验 3-5（P5）
          status: 'pending',
        },
      });
    } catch (error: any) {
      // Prisma P2002 = PostgreSQL 23505 unique_violation
      if (error?.code === 'P2002') {
        throw new ConflictException('该角色已有待审核或已通过的绑定申请，请勿重复提交');
      }
      throw error;
    }
  }

  // ===== 更新申请（R9 + R16 + canManagerView） =====

  async updateBindingApply(id: number, dto: UpdateBindingApplyDto, currentUser?: CurrentUser) {
    const apply = await this.prisma.bindingApply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException('绑定申请不存在');
    }

    if (apply.status !== 'pending') {
      throw new BadRequestException('只能修改待审核的申请');
    }

    // 数据隔离验证（R2: canManagerView）
    if (currentUser) {
      const level = currentUser.level;
      // Manager 只能修改本组申请
      if (typeof level === 'number' && level === 1) {
        if (!this.canManagerView(apply, currentUser)) {
          throw new NotFoundException('绑定申请不存在');
        }
      }
    }

    // 强制项目不可改（P6）
    if ('project' in dto) {
      delete (dto as any).project;
    }

    return this.prisma.bindingApply.update({
      where: { id },
      data: { ...dto, project: 'warship' },  // 强制 project=warship
    });
  }

  // ===== 删除申请 =====

  async deleteBindingApply(id: number) {
    const apply = await this.prisma.bindingApply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException('绑定申请不存在');
    }

    await this.prisma.bindingApply.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }

  // ===== 审核申请（R10+R12+R19 全链路） =====

  async reviewBindingApply(
    id: number,
    dto: ReviewBindingApplyDto,
    currentUser: CurrentUser,
  ) {
    const apply = await this.prisma.bindingApply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException('绑定申请不存在');
    }

    if (apply.status !== 'pending') {
      throw new BadRequestException('该申请已被审核');
    }

    // R10: 权限校验——Manager 只能审核本组申请（使用 canManagerReview，不含 applicant）
    if (typeof currentUser.level === 'number' && currentUser.level === 1) {
      if (!this.canManagerReview(apply, currentUser)) {
        throw new ForbiddenException('无权审核非本组的申请');
      }
    }
    // Admin (level=0) 无限制
    // Operator 无审核权限（已由 @Roles 守卫拦截）

    const newStatus = dto.action === 'approve' ? 'approved' : 'rejected';

    // R12 + R19: 使用事务，不吞异常，原子更新防并发
    return this.prisma.$transaction(async (tx) => {
      // R19 原子更新：WHERE 条件包含 status='pending'，防止并发双通过
      const updateResult = await tx.bindingApply.updateMany({
        where: { id, status: 'pending' },  // ← 原子条件
        data: {
          status: newStatus,
          reviewTime: new Date(),
          reviewerId: currentUser.id,
          remark: dto.remark || apply.remark,
        },
      });

      // 校验影响行数：为 0 说明已被其他审核员处理
      if (updateResult.count === 0) {
        throw new BadRequestException('该申请已被其他审核员处理，请刷新页面后重试');
      }

      // R12: 审核通过时联动更新角色——不 try/catch，失败直接事务回滚
      if (dto.action === 'approve') {
        const role = await tx.role.findUnique({ where: { roleId: apply.roleId } });
        if (!role) {
          throw new BadRequestException(`审核失败：角色 ${apply.roleId} 不存在于本地数据库`);
        }
        await tx.role.update({
          where: { roleId: apply.roleId },
          data: {
            cpsVisible: true,
            cpsGroup: apply.platform,
            cpsBindTime: new Date(),
            cpsBindBy: currentUser.id,
          },
        });
      }

      // 审计日志
      await tx.auditLog.create({
        data: {
          adminId: currentUser.id,
          action: dto.action,
          module: 'audit',
          target: `binding_apply:${id}`,
          oldValue: { status: apply.status },
          newValue: { status: newStatus, remark: dto.remark },
        },
      });

      // updateMany 不返回记录，需重新查询返回
      return tx.bindingApply.findUnique({ where: { id } });
    });
  }

  // ===== 失败日志 =====

  private async logBindFail(roleId: string, operatorId: number, failReason: string) {
    await this.prisma.cpsBindFailLog.create({
      data: { roleId, operatorId, failReason },
    });
  }

  // ===== 导出功能 =====

  /**
   * 导出绑定申请列表为 CSV
   */
  async exportBindingApplies(query: QueryBindingAppliesDto, currentUser?: CurrentUser): Promise<string> {
    const {
      project,
      gameProject,
      server,
      roleId,
      applicant,
      status,
      applyTimeStart,
      applyTimeEnd,
    } = query;

    // 应用数据隔离过滤（自动跟随 R2 修复）
    const dataFilter = this.buildDataFilter(currentUser);
    const where: any = { ...dataFilter };

    const projectFilter = project || gameProject;
    if (projectFilter) {
      where.project = projectFilter;
    }
    if (server) {
      const parsedServerId = parseInt(server, 10);
      if (!isNaN(parsedServerId)) {
        where.serverId = parsedServerId;
      } else {
        where.serverName = { contains: server };
      }
    }
    if (roleId) {
      where.roleId = { contains: roleId };
    }
    if (applicant) {
      where.applicant = { contains: applicant };
    }
    if (status) {
      where.status = status;
    }
    if (applyTimeStart || applyTimeEnd) {
      where.applyTime = {};
      if (applyTimeStart) {
        where.applyTime.gte = new Date(applyTimeStart);
      }
      if (applyTimeEnd) {
        const endDate = new Date(applyTimeEnd);
        endDate.setDate(endDate.getDate() + 1);
        where.applyTime.lt = endDate;
      }
    }

    // 获取全部数据（导出时不分页，但限制最大数量）
    const MAX_EXPORT_ROWS = 10000;
    const list = await this.prisma.bindingApply.findMany({
      where,
      orderBy: { applyTime: 'desc' },
      take: MAX_EXPORT_ROWS,
      select: {
        id: true,
        project: true,
        roleId: true,
        roleName: true,
        serverId: true,
        serverName: true,
        platform: true,
        teamLeader: true,
        teamMember: true,
        applicant: true,
        status: true,
        remark: true,
        applyTime: true,
        reviewTime: true,
      },
    });

    return this.toCSV(list, BINDING_APPLY_EXPORT_COLUMNS);
  }

  /**
   * 将数据转换为 CSV 格式
   */
  private toCSV(
    data: any[],
    columns: { key: string; header: string }[],
  ): string {
    // 状态映射
    const statusMap: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    };

    // 生成表头
    const header = columns.map((col) => col.header).join(',');

    // 生成数据行
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          let value = item[col.key];

          // 处理特殊类型
          if (value === null || value === undefined) {
            return '';
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          // 状态字段翻译
          if (col.key === 'status' && statusMap[value]) {
            value = statusMap[value];
          }
          if (typeof value === 'object') {
            if (value.toString) {
              value = value.toString();
            } else {
              value = JSON.stringify(value);
            }
          }
          if (typeof value === 'boolean') {
            return value ? '是' : '否';
          }

          // 转换为字符串并处理特殊字符
          const strValue = String(value);
          if (
            strValue.includes(',') ||
            strValue.includes('"') ||
            strValue.includes('\n')
          ) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  }
}
