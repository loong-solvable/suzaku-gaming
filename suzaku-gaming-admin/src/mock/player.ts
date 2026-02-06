// src/mock/player.ts
import Mock from 'mockjs';

const Random = Mock.Random;

const countries = ['日本', '韩国', '俄罗斯', '越南', '中国', '美国', '印度'];
const countryCodes = ['JP', 'KR', 'RU', 'VN', 'CN', 'US', 'IN'];
const systems = ['IPhonePlayer', 'Android'];
const servers = ['S28', 'S29', 'S30', 'S31'];
const statuses = ['active', 'inactive', 'banned'];
const rechargeTypes = ['现金', '战舰币', '礼包'];
void ['6', '8', '9', '31', '32', '63']; // payChannels - reserved for future use
const channel1List = ['Google', 'Facebook', 'TikTok', 'Organic', '-'];
const channel2List = ['Display', 'Search', 'Video', '-'];
const channel3List = ['Banner', 'Interstitial', 'Native', '-'];

// 生成角色数据
const generateRoles = (count: number) => {
  const roles = [];
  for (let i = 0; i < count; i++) {
    const countryIndex = Random.integer(0, countries.length - 1);
    const roleId = `900031000${Random.integer(1000, 9999)}`;
    const registerTime = Random.datetime('yyyy-MM-ddTHH:mm:ss.SSSZ');
    roles.push({
      id: i + 1,
      project: '海战',
      roleId,
      ucid: `UC${Random.integer(100000, 999999)}`,
      roleName: Random.cname(),
      serverId: Random.integer(28, 31),
      serverName: Random.pick(servers),
      roleLevel: Random.integer(1, 180),
      vipLevel: Random.integer(0, 10),
      totalRechargeUsd: Random.float(0, 5000, 2, 2),
      totalRechargeTimes: Random.integer(0, 100),
      registerTime,
      lastLoginTime: Random.datetime('yyyy-MM-ddTHH:mm:ss.SSSZ'),
      lastUpdateTime: Random.datetime('yyyy-MM-ddTHH:mm:ss.SSSZ'),
      country: countries[countryIndex],
      countryCode: countryCodes[countryIndex],
      deviceType: Random.pick(systems),
      channelId: Random.integer(6, 63),
      channel1: Random.pick(channel1List),
      channel2: Random.pick(channel2List),
      channel3: Random.pick(channel3List),
      status: Random.pick(statuses)
    });
  }
  return roles;
};

// 角色列表数据池
const rolePool = generateRoles(500);

// 角色列表 API
Mock.mock(/\/api\/player\/roles(\?.*)?$/, 'get', (options: { url: string }) => {
  const url = new URL(options.url, 'http://localhost');
  const params = Object.fromEntries(url.searchParams);
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 20;
  
  let filteredRoles = [...rolePool];
  
  // 筛选逻辑
  if (params.roleId) {
    filteredRoles = filteredRoles.filter(r => r.roleId.includes(params.roleId));
  }
  if (params.roleName) {
    filteredRoles = filteredRoles.filter(r => r.roleName.includes(params.roleName));
  }
  if (params.system) {
    filteredRoles = filteredRoles.filter(r => r.deviceType === params.system);
  }
  if (params.serverId) {
    filteredRoles = filteredRoles.filter(r => r.serverId === parseInt(params.serverId));
  }
  if (params.status) {
    filteredRoles = filteredRoles.filter(r => r.status === params.status);
  }
  
  // 排序逻辑
  if (params.sortBy && params.sortOrder) {
    const sortKey = params.sortBy as keyof typeof rolePool[0];
    const order = params.sortOrder === 'asc' ? 1 : -1;
    filteredRoles.sort((a, b) => {
      if (a[sortKey] > b[sortKey]) return order;
      if (a[sortKey] < b[sortKey]) return -order;
      return 0;
    });
  }
  
  // 分页
  const total = filteredRoles.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const list = filteredRoles.slice(start, start + pageSize);
  
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    },
    timestamp: Date.now()
  };
});

// 生成订单数据
const generateOrders = (count: number) => {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const countryIndex = Random.integer(0, countries.length - 1);
    const payAmountUsd = Random.pick([0.99, 1.99, 4.99, 9.99, 14.99, 29.99, 49.99, 99.99]);
    orders.push({
      id: i + 1,
      project: '海战',
      orderId: `31_900031000${Random.integer(1000, 9999)}_${Random.datetime('yyyyMMddHHmmss')}_${Random.integer(1, 100)}`,
      roleId: `900031000${Random.integer(1000, 9999)}`,
      roleName: Random.cname(),
      roleLevel: Random.integer(1, 180),
      serverId: Random.integer(28, 31),
      serverName: Random.pick(servers),
      payAmountUsd,
      amount: payAmountUsd,
      currency: 'USD',
      currencyAmount: Random.float(100, 5000, 0, 0),
      goodsId: String(Random.integer(7, 100000)),
      payTime: Random.datetime('yyyy-MM-ddTHH:mm:ss.SSSZ'),
      lastLoginTime: Random.datetime('yyyy-MM-ddTHH:mm:ss.SSSZ'),
      payChannel: Random.pick(['applePay', 'googlePay', 'alipay', 'wechat']),
      rechargeType: Random.pick(rechargeTypes),
      country: countries[countryIndex],
      deviceType: Random.pick(systems),
      channel1: Random.pick(channel1List),
      isSandbox: Random.boolean()
    });
  }
  return orders;
};

const orderPool = generateOrders(1000);

// 订单列表 API
Mock.mock(/\/api\/player\/orders(\?.*)?$/, 'get', (options: { url: string }) => {
  const url = new URL(options.url, 'http://localhost');
  const params = Object.fromEntries(url.searchParams);
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 20;
  
  let filteredOrders = [...orderPool];
  
  // 筛选逻辑
  if (params.roleId) {
    filteredOrders = filteredOrders.filter(o => o.roleId.includes(params.roleId));
  }
  if (params.system) {
    filteredOrders = filteredOrders.filter(o => o.deviceType === params.system);
  }
  if (params.orderType) {
    filteredOrders = filteredOrders.filter(o => o.rechargeType === params.orderType);
  }
  if (params.serverId) {
    filteredOrders = filteredOrders.filter(o => o.serverId === parseInt(params.serverId));
  }
  
  // 计算累计金额
  const totalAmount = filteredOrders.reduce((sum, o) => sum + (o.payAmountUsd || o.amount), 0);
  const totalCount = filteredOrders.length;
  
  // 排序逻辑
  if (params.sortBy && params.sortOrder) {
    const sortKey = params.sortBy as keyof typeof orderPool[0];
    const order = params.sortOrder === 'asc' ? 1 : -1;
    filteredOrders.sort((a, b) => {
      if (a[sortKey] > b[sortKey]) return order;
      if (a[sortKey] < b[sortKey]) return -order;
      return 0;
    });
  }
  
  // 分页
  const total = filteredOrders.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const list = filteredOrders.slice(start, start + pageSize);
  
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      },
      summary: {
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalCount
      }
    },
    timestamp: Date.now()
  };
});

export { rolePool, orderPool };
