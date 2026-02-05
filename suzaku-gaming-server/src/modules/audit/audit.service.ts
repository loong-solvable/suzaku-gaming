// src/modules/audit/audit.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { QueryBindingAppliesDto } from './dto/query-binding-applies.dto';
import { CreateBindingApplyDto } from './dto/create-binding-apply.dto';
import { ReviewBindingApplyDto } from './dto/review-binding-apply.dto';
import { Prisma } from '@prisma/client';

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

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getBindingApplies(query: QueryBindingAppliesDto) {
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

    const where: any = {};

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

  async getBindingApplyById(id: number) {
    const apply = await this.prisma.bindingApply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException('绑定申请不存在');
    }

    return apply;
  }

  async createBindingApply(dto: CreateBindingApplyDto) {
    return this.prisma.bindingApply.create({
      data: {
        ...dto,
        attachments: dto.attachments || [],
        status: 'pending',
      },
    });
  }

  async updateBindingApply(id: number, dto: Partial<CreateBindingApplyDto>) {
    const apply = await this.prisma.bindingApply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException('绑定申请不存在');
    }

    if (apply.status !== 'pending') {
      throw new BadRequestException('只能修改待审核的申请');
    }

    return this.prisma.bindingApply.update({
      where: { id },
      data: dto,
    });
  }

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

  async reviewBindingApply(
    id: number,
    dto: ReviewBindingApplyDto,
    reviewerId?: number,
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

    const newStatus = dto.action === 'approve' ? 'approved' : 'rejected';

    // 使用事务确保数据一致性
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.bindingApply.update({
        where: { id },
        data: {
          status: newStatus,
          reviewTime: new Date(),
          reviewerId: reviewerId || null,
          remark: dto.remark || apply.remark,
        },
      });

      // 记录审计日志
      if (reviewerId) {
        await tx.auditLog.create({
          data: {
            adminId: reviewerId,
            action: dto.action,
            module: 'audit',
            target: `binding_apply:${id}`,
            oldValue: { status: apply.status },
            newValue: { status: newStatus, remark: dto.remark },
          },
        });
      }

      return updated;
    });
  }

  // ===== 导出功能 =====

  /**
   * 导出绑定申请列表为 CSV
   */
  async exportBindingApplies(query: QueryBindingAppliesDto): Promise<string> {
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

    const where: any = {};

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
