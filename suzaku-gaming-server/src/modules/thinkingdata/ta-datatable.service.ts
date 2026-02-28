import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class TaDatatableService {
  private readonly logger = new Logger(TaDatatableService.name);
  private readonly apiHost: string;
  private readonly token: string;
  private readonly projectId: string;
  private readonly datatableName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiHost = this.configService.get<string>('TA_API_HOST') || '';
    this.token = this.configService.get<string>('TA_PROJECT_TOKEN') || '';
    this.projectId = this.configService.get<string>('TA_PROJECT_ID') || '22';
    this.datatableName =
      this.configService.get<string>('TA_DATATABLE_NAME') || 'cps_group';
  }

  /**
   * 审批通过后，将角色信息回写到数数平台 CPS 维度表。
   * 自包含方法：内部完成 accountId 查询、CSV 生成、API 调用、日志记录。
   * 调用方只需 fire-and-forget，无需处理异常。
   */
  async writeCpsDim(roleId: string, cpsGroup: string): Promise<void> {
    if (!cpsGroup) {
      this.logger.warn(`跳过CPS维度表回写: cpsGroup为空, roleId=${roleId}`);
      return;
    }

    if (!this.token || !this.apiHost) {
      this.logger.warn(
        '跳过CPS维度表回写: TA_API_HOST 或 TA_PROJECT_TOKEN 未配置',
      );
      return;
    }

    try {
      const role = await this.prisma.role.findUnique({
        where: { roleId },
        select: { accountId: true },
      });

      if (!role?.accountId) {
        this.logger.warn(
          `跳过CPS维度表回写: 角色 ${roleId} 无 accountId`,
        );
        return;
      }

      // 增量更新要求 CSV 包含全部 3 列，首列 account_id 为主键
      const csvContent = [
        'account_id,role_id,cps_group',
        `${this.escapeCsvField(role.accountId)},${this.escapeCsvField(roleId)},${this.escapeCsvField(cpsGroup)}`,
      ].join('\n');

      const form = new FormData();
      form.append('file', Buffer.from(csvContent, 'utf-8'), {
        filename: 'cps_dim_update.csv',
        contentType: 'text/csv',
      });

      const url = `${this.apiHost}/open/datatable/updateDatatable`;
      const response = await axios.post(url, form, {
        params: {
          token: this.token,
          projectId: this.projectId,
          datatableName: this.datatableName,
          updateType: 'INCR_UPDATE',
        },
        headers: form.getHeaders(),
        timeout: 30000,
      });

      const returnCode = response.data?.return_code;
      const succeeded = response.data?.data?.successRowCount ?? 0;
      const failed = response.data?.data?.failedRowCount ?? 0;

      if (returnCode === 0 && succeeded > 0) {
        this.logger.log(
          `CPS维度表回写成功: accountId=${role.accountId}, roleId=${roleId}, cpsGroup=${cpsGroup}`,
        );
      } else {
        this.logger.warn(
          `CPS维度表回写异常结果: returnCode=${returnCode}, succeeded=${succeeded}, failed=${failed}, ` +
            `response=${JSON.stringify(response.data)}`,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `CPS维度表回写异常: roleId=${roleId}, cpsGroup=${cpsGroup}, error=${msg}`,
      );
    }
  }

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
