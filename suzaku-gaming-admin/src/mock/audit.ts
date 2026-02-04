// src/mock/audit.ts
import Mock from 'mockjs';

const Random = Mock.Random;

const statuses = ['pending', 'approved', 'rejected'];
const applicants = ['星禾组1', '星禾组2', '星禾组3', '华晨组1', '华晨组2'];
const projects = ['JUR', 'SGX', 'WSG'];
const servers = ['S28', 'S29', 'S30', 'S31'];
const platforms = ['iOS', 'Android', 'PC'];

// 生成绑定申请数据
const generateBindingApplies = (count: number) => {
  const applies = [];
  for (let i = 0; i < count; i++) {
    applies.push({
      id: i + 1,
      project: Random.pick(projects),
      roleId: `900031000${Random.integer(1000, 9999)}`,
      roleName: Random.cname(),
      serverId: Random.integer(28, 31),
      serverName: Random.pick(servers),
      applicant: Random.pick(applicants),
      platform: Random.pick(platforms),
      teamLeader: Random.cname(),
      teamMember: Random.cname(),
      status: Random.pick(statuses),
      applyTime: Random.datetime('yyyy-MM-ddTHH:mm:ss.SSSZ'),
      reviewTime: Random.datetime('yyyy-MM-ddTHH:mm:ss.SSSZ'),
      reviewer: Random.cname(),
      attachments: [],
      remark: Random.cparagraph(1, 2)
    });
  }
  return applies;
};

let bindingAppliesPool = generateBindingApplies(100);

// 绑定申请列表 API
Mock.mock(/\/api\/audit\/binding-applies(\?.*)?$/, 'get', (options: { url: string }) => {
  // 排除包含 /review 或以数字结尾的路径
  if (options.url.includes('/review') || /\/\d+$/.test(options.url.split('?')[0])) {
    return;
  }
  
  const url = new URL(options.url, 'http://localhost');
  const params = Object.fromEntries(url.searchParams);
  
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 20;
  
  let filtered = [...bindingAppliesPool];
  
  if (params.project) {
    filtered = filtered.filter(a => a.project === params.project);
  }
  if (params.roleId) {
    filtered = filtered.filter(a => a.roleId.includes(params.roleId));
  }
  if (params.applicant) {
    filtered = filtered.filter(a => a.applicant.includes(params.applicant));
  }
  if (params.status) {
    filtered = filtered.filter(a => a.status === params.status);
  }
  
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);
  
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

// 获取详情
Mock.mock(/\/api\/audit\/binding-applies\/\d+$/, 'get', (options: { url: string }) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)?.[1] || '0');
  const apply = bindingAppliesPool.find(a => a.id === id);
  
  if (!apply) {
    return { code: 404, message: '记录不存在', timestamp: Date.now() };
  }
  
  return {
    code: 0,
    message: 'success',
    data: apply,
    timestamp: Date.now()
  };
});

// 创建申请
Mock.mock('/api/audit/binding-applies', 'post', (options: { body: string }) => {
  const data = JSON.parse(options.body);
  const newApply = {
    id: bindingAppliesPool.length + 1,
    ...data,
    status: 'pending',
    applyTime: new Date().toISOString()
  };
  bindingAppliesPool.unshift(newApply);
  
  return {
    code: 0,
    message: 'success',
    data: newApply,
    timestamp: Date.now()
  };
});

// 更新申请
Mock.mock(/\/api\/audit\/binding-applies\/\d+$/, 'put', (options: { url: string; body: string }) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)?.[1] || '0');
  const data = JSON.parse(options.body);
  const index = bindingAppliesPool.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { code: 404, message: '记录不存在', timestamp: Date.now() };
  }
  
  bindingAppliesPool[index] = { ...bindingAppliesPool[index], ...data };
  
  return {
    code: 0,
    message: 'success',
    data: bindingAppliesPool[index],
    timestamp: Date.now()
  };
});

// 删除申请
Mock.mock(/\/api\/audit\/binding-applies\/\d+$/, 'delete', (options: { url: string }) => {
  const id = parseInt(options.url.match(/\/(\d+)$/)?.[1] || '0');
  const index = bindingAppliesPool.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { code: 404, message: '记录不存在', timestamp: Date.now() };
  }
  
  bindingAppliesPool.splice(index, 1);
  
  return {
    code: 0,
    message: 'success',
    timestamp: Date.now()
  };
});

// 审核
Mock.mock(/\/api\/audit\/binding-applies\/\d+\/review$/, 'post', (options: { url: string; body: string }) => {
  const id = parseInt(options.url.match(/\/(\d+)\/review$/)?.[1] || '0');
  const { action, remark } = JSON.parse(options.body);
  const index = bindingAppliesPool.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { code: 404, message: '记录不存在', timestamp: Date.now() };
  }
  
  bindingAppliesPool[index].status = action === 'approve' ? 'approved' : 'rejected';
  bindingAppliesPool[index].reviewTime = new Date().toISOString();
  if (remark) {
    bindingAppliesPool[index].remark = remark;
  }
  
  return {
    code: 0,
    message: 'success',
    data: bindingAppliesPool[index],
    timestamp: Date.now()
  };
});

export { bindingAppliesPool };
