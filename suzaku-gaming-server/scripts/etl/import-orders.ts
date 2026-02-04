// scripts/etl/import-orders.ts
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ===== CSV 实际字段接口 =====
interface OrderCSVRow {
  // 基础字段
  game_order_id: string;
  role_id: string; // 无 # 前缀
  role_name: string;
  role_level: string;
  server_id: string; // 无 # 前缀
  server_name: string;
  '#country': string;
  dev_type: string; // 非 #system
  channel_id: string; // 无 # 前缀

  // 商品信息
  goods_id: string;
  goods_price: string;
  goods_currency: string;

  // 支付信息
  pay_amount_usd: string; // 关键修正：非 pay_amount
  currency_type: string;
  currency_amount: string;
  recharge_type: string;
  recharge_channel: string; // 非 #pay_channel
  is_sandbox: string;
  publisher_order_id: string;

  // 奖励信息
  reward: string;
  giftpack_id: string; // 注意：是 giftpack_id 非 giftpack

  // 时间
  '#event_time': string;
}

// ===== 数据标准化函数 =====

/**
 * 设备类型标准化（不区分大小写）
 */
function normalizeDeviceType(value: string): string {
  if (!value) return 'unknown';
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('android')) return 'Android';
  if (
    lowerValue.includes('iphone') ||
    lowerValue.includes('ipad') ||
    lowerValue.includes('ios') ||
    lowerValue.includes('iphoneplayer')
  )
    return 'iOS';
  return value;
}

/**
 * 充值类型标准化（处理中文/英文混用）
 */
function normalizeRechargeType(value: string): string {
  if (!value) return 'cash';
  const lowerValue = value.toLowerCase();
  if (lowerValue === '现金' || lowerValue === 'cash') return 'cash';
  if (lowerValue === '积分' || lowerValue === 'points') return 'points';
  if (lowerValue === '代金券' || lowerValue === 'voucher') return 'voucher';
  return value; // 保留未知类型
}

/**
 * 安全解析整数
 */
function safeParseInt(value: string, defaultValue = 0): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 安全解析 Decimal
 */
function safeParseDecimal(value: string, defaultValue = '0'): Decimal {
  if (!value || value.trim() === '') return new Decimal(defaultValue);
  try {
    return new Decimal(value);
  } catch {
    return new Decimal(defaultValue);
  }
}

/**
 * 安全解析日期时间
 */
function safeParseDateTime(value: string): Date {
  if (!value) return new Date();
  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * 安全解析 JSON
 */
function safeParseJson(value: string): any | null {
  if (!value || value.trim() === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * 解析布尔值
 */
function parseBoolean(value: string): boolean {
  return value === 'true' || value === '1' || value === 'True';
}

// ===== 幂等性辅助函数 =====

/**
 * 幂等写入订单 + 更新角色统计
 * 修正方案 A（推荐）：仅新增订单时更新统计
 */
async function upsertOrderWithStats(
  orderData: any,
  roleId: string,
): Promise<{ isNew: boolean }> {
  return await prisma.$transaction(async (tx) => {
    // 1. 检查订单是否已存在
    const existingOrder = await tx.order.findUnique({
      where: { orderId: orderData.orderId },
      select: { id: true },
    });

    // 2. 创建或更新订单
    await tx.order.upsert({
      where: { orderId: orderData.orderId },
      update: {
        roleName: orderData.roleName,
        roleLevel: orderData.roleLevel,
        serverId: orderData.serverId,
        serverName: orderData.serverName,
        country: orderData.country,
        deviceType: orderData.deviceType,
        channelId: orderData.channelId,
        goodsId: orderData.goodsId,
        goodsPrice: orderData.goodsPrice,
        goodsCurrency: orderData.goodsCurrency,
        payAmountUsd: orderData.payAmountUsd,
        currencyType: orderData.currencyType,
        currencyAmount: orderData.currencyAmount,
        rechargeType: orderData.rechargeType,
        payChannel: orderData.payChannel,
        isSandbox: orderData.isSandbox,
        rewardInfo: orderData.rewardInfo,
        giftpackInfo: orderData.giftpackInfo,
        payTime: orderData.payTime,
      },
      create: orderData,
    });

    // 3. 仅在新增订单时更新角色统计（幂等性保证）
    if (!existingOrder && !orderData.isSandbox) {
      await tx.role.update({
        where: { roleId },
        data: {
          totalRechargeUsd: { increment: orderData.payAmountUsd },
          totalRechargeTimes: { increment: 1 },
        },
      });
    }

    return { isNew: !existingOrder };
  });
}

// ===== 主导入函数 =====
async function importOrders(csvPath: string) {
  console.log(`Starting order import from: ${csvPath}`);
  const startTime = Date.now();
  let processed = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const parser = fs.createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }),
  );

  // 收集需要创建占位角色的 roleId
  const missingRoles = new Set<string>();

  for await (const row of parser as AsyncIterable<OrderCSVRow>) {
    try {
      const orderId = row.game_order_id;
      // 使用正确的字段名: role_id（无 # 前缀）
      const roleId = row['role_id'];
      if (!orderId || !roleId) {
        console.warn('Skipping row: missing order_id or role_id');
        skipped++;
        continue;
      }

      // 使用正确的字段名: server_id（无 # 前缀）
      const serverId = safeParseInt(row['server_id']);
      const payTime = safeParseDateTime(row['#event_time']);

      // 使用正确的字段名: pay_amount_usd（非 pay_amount）
      const payAmountUsd = safeParseDecimal(row['pay_amount_usd']);

      // 确保角色存在（如果不存在则创建占位角色）
      const existingRole = await prisma.role.findUnique({
        where: { roleId },
      });

      if (!existingRole) {
        // 创建占位角色
        await prisma.role.create({
          data: {
            roleId,
            roleName: row.role_name || '未知角色',
            roleLevel: safeParseInt(row.role_level, 1),
            serverId,
            serverName: row.server_name || `S${serverId}`,
            registerTime: payTime,
            // 不在这里累加充值统计，由 upsertOrderWithStats 处理
          },
        });
        console.log(`Created placeholder role: ${roleId}`);
      }

      const orderData: any = {
        orderId,
        role: { connect: { roleId } },
        roleName: row.role_name || null,
        roleLevel: row.role_level ? safeParseInt(row.role_level) : null,
        serverId,
        serverName: row.server_name || null,
        country: row['#country'] || null,
        // 使用正确的字段名: dev_type（非 #system）
        deviceType: normalizeDeviceType(row['dev_type']),
        // 使用正确的字段名: channel_id（无 # 前缀）
        channelId: row['channel_id'] ? safeParseInt(row['channel_id']) : null,
        goodsId: row.goods_id || null,
        goodsPrice: row.goods_price ? safeParseDecimal(row.goods_price) : null,
        goodsCurrency: row.goods_currency || null,
        payAmountUsd,
        currencyType: row.currency_type || null,
        currencyAmount: row.currency_amount
          ? safeParseDecimal(row.currency_amount)
          : null,
        // 标准化充值类型
        rechargeType: normalizeRechargeType(row.recharge_type),
        // 使用正确的字段名: recharge_channel（非 #pay_channel）
        payChannel: row.recharge_channel || null,
        isSandbox: parseBoolean(row.is_sandbox),
        // 解析 JSON 字段
        rewardInfo: safeParseJson(row.reward),
        // 使用正确的字段名: giftpack_id
        giftpackInfo: row.giftpack_id
          ? { giftpackId: row.giftpack_id }
          : null,
        payTime,
      };

      // 使用幂等写入（仅新增时更新统计）
      const { isNew } = await upsertOrderWithStats(orderData, roleId);

      if (isNew) {
        created++;
      } else {
        updated++;
      }

      processed++;
      if (processed % 100 === 0) {
        console.log(
          `Processed ${processed} orders (${created} created, ${updated} updated)...`,
        );
      }
    } catch (error) {
      errors++;
      console.error(`Error processing row:`, error);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n========== Import Summary ==========`);
  console.log(`  Total Processed: ${processed}`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Speed: ${((processed / duration) * 1000).toFixed(2)} records/s`);

  await prisma.$disconnect();
}

// ===== 角色统计重算函数（可选：导入后重算所有角色统计）=====
async function recalculateRoleStats(roleId: string): Promise<void> {
  const stats = await prisma.order.aggregate({
    where: { roleId, isSandbox: false },
    _sum: { payAmountUsd: true },
    _count: { id: true },
  });

  await prisma.role.update({
    where: { roleId },
    data: {
      totalRechargeUsd: stats._sum.payAmountUsd || new Decimal(0),
      totalRechargeTimes: stats._count.id || 0,
    },
  });
}

/**
 * 批量重算所有角色统计
 * 使用场景：数据修复或完整重新导入后
 */
async function recalculateAllRoleStats(): Promise<void> {
  console.log('Starting full role stats recalculation...');
  const startTime = Date.now();

  const roles = await prisma.role.findMany({ select: { roleId: true } });
  let processed = 0;

  for (const role of roles) {
    await recalculateRoleStats(role.roleId);
    processed++;
    if (processed % 100 === 0) {
      console.log(`Recalculated ${processed}/${roles.length} roles...`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(
    `Recalculation completed: ${processed} roles in ${duration}ms`,
  );
}

// ===== 命令行入口 =====
const csvPath = process.argv[2];
const recalcFlag = process.argv[3];

if (!csvPath) {
  console.error(
    'Usage: npx ts-node scripts/etl/import-orders.ts <csv-path> [--recalc]',
  );
  console.error('  --recalc: Recalculate all role stats after import');
  process.exit(1);
}

importOrders(path.resolve(csvPath))
  .then(async () => {
    if (recalcFlag === '--recalc') {
      await recalculateAllRoleStats();
    }
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
