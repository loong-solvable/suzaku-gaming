// scripts/etl/import-roles.ts
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ===== CSV 实际字段接口 =====
interface RoleCSVRow {
  // 基础字段（注意 # 前缀）
  '#user_id': string;
  '#account_id': string;
  role_id: string; // 无 # 前缀
  role_name: string;
  role_level: string;
  vip_level: string;
  vip_exp: string;
  headquarters_lv: string;

  // 服务器
  server_id: string; // 无 # 前缀
  server_name: string;
  current_server_id: string;
  server_zone_offset: string;
  server_alive_days: string;

  // 地理
  '#country': string;
  '#country_code': string;
  '#city': string;
  '#province': string;
  '#ip': string;

  // 设备
  dev_type: string; // 非 #system
  dev_model: string;
  app_version: string; // 无 # 前缀

  // 渠道
  channel_id: string; // 无 # 前缀
  package_id: string;

  // 充值
  total_recharge_usd: string;
  total_recharge_cny: string;
  total_recharge_times: string;

  // 活跃
  total_login_days: string;
  total_online_time: string;

  // 联盟
  faction_name: string;
  faction_level: string;
  faction_exp: string;

  // 游戏建筑
  steel_plant: string;
  oil_plant: string;
  power_plant: string;
  missile_factory_lv: string;
  naval_academy_lv: string;
  manu_factory_lv: string;
  aircraft_factory_lv: string;
  torpedo_factory_lv: string;
  coastal_comand_lv: string;
  warehouse_lv: string;

  // 游戏资源
  remain_diamond: string;
  remain_power: string;
  remain_steel: string;
  remain_oil: string;
  remain_rare_earth: string;

  // 游戏数值
  role_ap: string;
  role_bp: string;
  world_progress_ptase: string;
  empire_stage_id: string;
  expedition_stage_id: string;

  // 位置
  base_coordinate: string;
  base_seas_id: string;

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
 * 构建游戏建筑数据 JSON
 */
function buildGameBuildings(row: RoleCSVRow): object {
  return {
    steelPlant: safeParseInt(row['steel_plant']),
    oilPlant: safeParseInt(row['oil_plant']),
    powerPlant: safeParseInt(row['power_plant']),
    missileFactoryLv: safeParseInt(row['missile_factory_lv']),
    navalAcademyLv: safeParseInt(row['naval_academy_lv']),
    manuFactoryLv: safeParseInt(row['manu_factory_lv']),
    aircraftFactoryLv: safeParseInt(row['aircraft_factory_lv']),
    torpedoFactoryLv: safeParseInt(row['torpedo_factory_lv']),
    coastalComandLv: safeParseInt(row['coastal_comand_lv']),
    warehouseLv: safeParseInt(row['warehouse_lv']),
  };
}

/**
 * 构建游戏资源数据 JSON
 */
function buildGameResources(row: RoleCSVRow): object {
  return {
    remainDiamond: safeParseInt(row['remain_diamond']),
    remainPower: safeParseInt(row['remain_power']),
    remainSteel: safeParseInt(row['remain_steel']),
    remainOil: safeParseInt(row['remain_oil']),
    remainRareEarth: safeParseInt(row['remain_rare_earth']),
  };
}

/**
 * 构建游戏数值数据 JSON
 */
function buildGameStats(row: RoleCSVRow): object {
  return {
    roleAp: safeParseInt(row['role_ap']),
    roleBp: safeParseInt(row['role_bp']),
    worldProgressPhase: safeParseInt(row['world_progress_ptase']),
    empireStageId: safeParseInt(row['empire_stage_id']),
    expeditionStageId: safeParseInt(row['expedition_stage_id']),
  };
}

/**
 * 构建游戏位置数据 JSON
 */
function buildGamePosition(row: RoleCSVRow): object | null {
  const coordinate = row['base_coordinate'];
  const seasId = row['base_seas_id'];
  if (!coordinate && !seasId) return null;

  let parsedCoordinate = null;
  if (coordinate) {
    try {
      parsedCoordinate = JSON.parse(coordinate);
    } catch {
      parsedCoordinate = coordinate;
    }
  }

  return {
    baseCoordinate: parsedCoordinate,
    baseSeasId: safeParseInt(seasId) || null,
  };
}

// ===== 主导入函数 =====
async function importRoles(csvPath: string) {
  console.log(`Starting role import from: ${csvPath}`);
  const startTime = Date.now();
  let processed = 0;
  let created = 0;
  let updated = 0;
  let errors = 0;

  const parser = fs.createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }),
  );

  const BATCH_SIZE = 100;
  const batch: any[] = [];

  for await (const row of parser as AsyncIterable<RoleCSVRow>) {
    try {
      // 使用正确的字段名: role_id（无 # 前缀）
      const roleId = row['role_id'];
      if (!roleId) {
        console.warn('Skipping row: missing role_id');
        continue;
      }

      // 使用正确的字段名: server_id（无 # 前缀）
      const serverId = safeParseInt(row['server_id']);
      if (serverId === 0) {
        console.warn(`Skipping row ${roleId}: invalid server_id`);
        continue;
      }

      const registerTime = safeParseDateTime(row['#event_time']);

      const roleData = {
        roleId,
        userId: row['#user_id'] || null,
        accountId: row['#account_id'] || null,
        roleName: row['role_name'] || null,
        roleLevel: safeParseInt(row['role_level'], 1),
        vipLevel: safeParseInt(row['vip_level']),
        vipExp: safeParseInt(row['vip_exp']),
        headquartersLv: safeParseInt(row['headquarters_lv']),
        serverId,
        serverName: row['server_name'] || `S${serverId}`,
        currentServerId: row['current_server_id']
          ? safeParseInt(row['current_server_id'])
          : null,
        serverZoneOffset: row['server_zone_offset']
          ? safeParseInt(row['server_zone_offset'])
          : null,
        serverAliveDays: row['server_alive_days']
          ? safeParseInt(row['server_alive_days'])
          : null,
        country: row['#country'] || null,
        countryCode: row['#country_code'] || null,
        city: row['#city'] || null,
        province: row['#province'] || null,
        // 使用正确的字段名: dev_type（非 #system）
        deviceType: normalizeDeviceType(row['dev_type']),
        deviceModel: row['dev_model'] || null,
        // 使用正确的字段名: app_version（无 # 前缀）
        appVersion: row['app_version'] || null,
        registerIp: row['#ip'] || null,
        // 使用正确的字段名: channel_id（无 # 前缀）
        channelId: row['channel_id'] ? safeParseInt(row['channel_id']) : null,
        packageId: row['package_id'] ? safeParseInt(row['package_id']) : null,
        totalRechargeUsd: safeParseDecimal(row['total_recharge_usd']),
        totalRechargeCny: safeParseDecimal(row['total_recharge_cny']),
        totalRechargeTimes: safeParseInt(row['total_recharge_times']),
        totalLoginDays: safeParseInt(row['total_login_days']),
        totalOnlineTime: safeParseInt(row['total_online_time']),
        factionName: row['faction_name'] || null,
        factionLevel: row['faction_level']
          ? safeParseInt(row['faction_level'])
          : null,
        factionExp: row['faction_exp']
          ? safeParseInt(row['faction_exp'])
          : null,
        gameBuildings: buildGameBuildings(row),
        gameResources: buildGameResources(row),
        gameStats: buildGameStats(row),
        gamePosition: buildGamePosition(row),
        registerTime,
        lastLoginTime: registerTime,
        lastUpdateTime: new Date(),
      };

      // 执行 upsert（幂等写入）
      const result = await prisma.role.upsert({
        where: { roleId },
        create: roleData,
        update: {
          ...roleData,
          updatedAt: new Date(),
        },
      });

      processed++;
      if (processed % 100 === 0) {
        console.log(`Processed ${processed} roles...`);
      }
    } catch (error) {
      errors++;
      console.error(`Error processing row:`, error);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n========== Import Summary ==========`);
  console.log(`  Total Processed: ${processed}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Speed: ${((processed / duration) * 1000).toFixed(2)} records/s`);

  await prisma.$disconnect();
}

// ===== 命令行入口 =====
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npx ts-node scripts/etl/import-roles.ts <csv-path>');
  process.exit(1);
}

importRoles(path.resolve(csvPath)).catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
