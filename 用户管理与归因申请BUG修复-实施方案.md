# 用户管理与归因申请 BUG 修复 — 实施方案（审阅修订版）

> 日期：2026-03-03
> 结论：**当前仓库可落地，但不是“前端一改就全部闭环”。**
> 范围：以 `suzaku-gaming-admin` 前端修复为主；后端接口/Schema 基本可复用；历史脏数据需要单独处理。

---

## 0. 审阅结论

### 可行性结论

当前方案的主方向是可行的：

- `CreateUserDto` 已支持 `parentId`、`cpsGroupCode`
- `user.service.ts#createUser` 已能在 `operator + cpsGroupCode` 场景生成 `memberCode`
- `userApi.createUser()` 的前端类型已包含新增字段
- `NewAttribution.vue` 当前确实依赖 `getTeamOptions()` 返回的 `cpsGroupCode` / `memberCode`

因此，**通过前端补齐创建用户时的字段传递，可以修复“新创建数据”导致的 B1/B3 主问题。**

### 必须修正的判断偏差

原方案里有两个判断过于乐观，必须改口径：

1. `B4` 不能简单视为“修好 B3 后自然解决”。
   当前 `NewAttribution.vue` 会直接消费已有 `groups/members` 数据。历史上已经创建出的 `cpsGroupCode=null` 组长、`memberCode=null` 组员，不会因为前端上线自动变正常。

2. “后端零改动”只对**代码接口**成立，不对**历史数据**成立。
   后端代码可以不改，但如果线上已存在脏数据，至少需要：
   - 过滤无效组长，避免继续被选中
   - 回填已有 `memberCode`
   - 对无 `cpsGroupCode` 的历史组长做人工修复或脚本修复

### 风险评级

- 高风险：把 B4 当成纯前端展示问题，忽略历史数据治理
- 中风险：允许管理员手工输入重复的 `cpsGroupCode`，会制造重复组名和归因歧义
- 中风险：当前几乎没有覆盖这些业务流的自动化测试，回归主要依赖手工验证

---

## 1. 当前代码现状核对

以下结论已按当前仓库代码核实：

### 1.1 用户创建链路

- 前端 [`suzaku-gaming-admin/src/views/System/UserManagement.vue`] 目前新增弹窗仅有 `username/password/realName/role`，确实**没有** `cpsGroupCode` 和 `parentId`
- 前端 [`suzaku-gaming-admin/src/api/user.ts`] 的 `CreateUserParams` 已包含：
  - `parentId?: number`
  - `cpsGroupCode?: string`
- 后端 [`suzaku-gaming-server/src/modules/user/dto/create-user.dto.ts`] 已允许这两个字段
- 后端 [`suzaku-gaming-server/src/modules/user/user.service.ts`] 在以下场景已具备能力：
  - 组长创建组员时自动继承 `parentId` / `cpsGroupCode`
  - 管理员创建组员时，只要前端传入 `cpsGroupCode`，就会进入 `generateMemberCode()`

结论：**B1/B3 的根因判断成立。**

### 1.2 归因申请链路

- 前端 [`suzaku-gaming-admin/src/views/Audit/NewAttribution.vue`]：
  - `groupOptions` 依赖 `groups[].cpsGroupCode`
  - `memberOptions` 依赖 `members[].cpsGroupCode + memberCode`
- 后端 [`suzaku-gaming-server/src/modules/user/user.service.ts#getTeamOptions`]：
  - 会返回 `groups/managers`
  - 不会过滤 `cpsGroupCode = null` 的组长
  - 会返回 `members/operators`
  - 仅当 `memberCode` 存在时，前端才会显示组员编号

结论：**B4 的成因不只来自“新数据没传字段”，还包含“旧数据已经坏掉且仍会被读出来”。**

### 1.3 图片上传链路

- 前端当前只用 `uploadedCount = success 数量` 做提交前校验
- 上传失败文件会保留在 `fileList` 中，但不会进入 `form.attachments`
- 后端 [`suzaku-gaming-server/src/modules/audit/dto/create-binding-apply.dto.ts`] 已用 `@ArrayMinSize(3)` / `@ArrayMaxSize(5)` 做兜底

结论：**B2 属于前端交互提示不足，不是后端数据安全问题。**

---

## 2. 修复策略（按“最小闭环”拆分）

### 2.1 修复 B1 / B3：补齐用户创建参数

**范围：前端 `UserManagement.vue`。**

### 必做改动

在新增用户弹窗中补充动态字段：

| 角色 | 新增字段 | 是否必填 | 目的 |
|---|---|---|---|
| `manager` | `cpsGroupCode` | 是 | 创建组长时写入组名 |
| `operator`（管理员创建） | `parentId` | 是 | 选定所属组长 |
| `operator`（管理员创建） | `cpsGroupCode` | 自动带出 | 让后端生成 `memberCode` |

### 建议实现

- `formData` 新增：
  - `cpsGroupCode: ''`
  - `parentId: undefined`
- 新增 `managerOptions`
- 复用 `userApi.getTeamOptions()` 获取组长列表
- 选择组长后，把该组长的 `cpsGroupCode` 自动写入 `formData`
- `watch(formData.role)` 清空角色切换残留字段
- `handleSubmit()` 在创建分支按角色条件追加：
  - 组长：`cpsGroupCode`
  - 管理员创建组员：`parentId + cpsGroupCode`

### 兼容性判断

- 不影响编辑分支：当前编辑分支只提交 `realName/role`
- 不影响组长创建组员：后端仍会自动继承当前组长的 `parentId/cpsGroupCode`
- 不影响管理员创建管理员：额外字段不展示也不提交

### 审阅备注

原方案这里的主思路正确，可以执行。

---

### 2.2 修复 B4：把“新数据修复”和“历史数据治理”分开处理

**范围：`UserManagement.vue` + `NewAttribution.vue` + 上线前数据检查。**

### 代码层面必须补的点

仅修 `UserManagement.vue` 还不够，`NewAttribution.vue` 至少要补一层无效数据过滤：

- 管理员视角的组名下拉，需要过滤 `!cpsGroupCode` 的组长
- 组员下拉继续只展示 `memberCode` 存在的成员

建议在前端明确处理：

```ts
groups.value = (res.groups || res.managers || []).filter(g => !!g.cpsGroupCode);
members.value = res.members || res.operators || [];
```

或在 `groupOptions` 计算属性中增加过滤，但**不能继续把空 `cpsGroupCode` 直接映射成空值选项**。

### 历史数据问题（不能靠前端自动修好）

以下数据即使前端代码上线后仍然是坏的：

1. 组长：`role='manager'` 且 `cpsGroupCode is null`
   - 管理员在归因页仍可能看到空白组名，或该组长彻底不可用
   - 该组长本人登录后，`userStore.cpsGroupCode` 也为空，依然无法正常发起归因

2. 组员：`role='operator'` 且 `cpsGroupCode` 有值但 `memberCode is null`
   - 在归因页不会出现在组员编号下拉中

### 必须纳入实施计划的数据治理动作

- 上线前先检查线上脏数据：
  - `manager + cpsGroupCode is null`
  - `operator + cpsGroupCode is not null + memberCode is null`
- 对第二类数据，可以直接使用已有脚本：
  - [`suzaku-gaming-server/scripts/backfill-member-codes.ts`]
- 对第一类数据，仓库内**没有现成脚本**自动推断组名，只能：
  - 人工修正
  - 或按业务映射补一段一次性脚本

### 结论

`B4` 的正确表述应为：

- 对**新创建的合规数据**，会随 B1/B3 一并恢复
- 对**历史脏数据**，必须额外过滤和补数，否则问题只会“部分缓解”，不会真正闭环

---

### 2.3 修复 B2：把上传失败/上传中状态说清楚

**范围：前端 `NewAttribution.vue`。**

### 建议保留的改动

原方案对 B2 的方向是正确的，建议按下面思路执行：

- 提交前分开统计：
  - `successCount`
  - `failedCount`
  - `uploadingCount`（含 `ready` + `uploading`）
- 优先阻断：
  1. 有文件仍在上传
  2. 有文件上传失败
  3. 成功数不足 3
  4. 成功数超过 5

### 必要原因

当前 `uploadedCount` 只统计成功数，用户“选了 3 张但有失败”时看到 `2/5`，无法理解是数量问题还是状态问题。把错误信息明确化后，用户才能知道需要“删除失败文件再重传”。

### 与后端的边界

- 后端仍保持兜底校验
- 前端这次改动只改善交互反馈，不改变后端约束

---

### 2.4 上线前置条件（原方案遗漏，现补齐）

以下步骤不是“可选项”，而是这次方案真正落地前应明确的前置动作：

1. 检查生产/测试环境是否存在历史无组名组长
2. 检查是否存在 `memberCode` 缺失的历史组员
3. 明确业务规则：`cpsGroupCode` 是否允许重复
4. 确认上线窗口内是否允许手工补数或执行一次性脚本

如果第 1 项存在数据且本次不处理，则不能宣称 `B4` 已完全修复。

---

### 2.5 建议增强项（非最小修复，但强烈建议写进文档）

这些不是这次上线的阻塞项，但属于明显残余风险：

### A. `cpsGroupCode` 重复风险

当前 schema 只有：

- `@@unique([cpsGroupCode, memberCode])`

并**没有**限制组长的 `cpsGroupCode` 唯一。

这意味着管理员可以创建：

- 组长甲：`GroupA`
- 组长乙：`GroupA`

后果：

- 归因页会出现重复组名选项
- 同组编码下成员会被混合看待
- 审核/统计语义可能变模糊

文档至少应明确：

- 若业务要求“一组一组长”，则本次仅是最小修复，仍留有数据风险
- 后续建议加：
  - 前端重复校验
  - 或后端唯一约束 / 创建前校验

### B. 自动化测试缺口

当前仓库里：

- `new-attribution.spec.ts` 只有基础 smoke 测试
- 没有覆盖 `UserManagement.vue` 这次新增字段的端到端测试
- 没有覆盖“历史脏数据 + 新代码”的回归用例

因此本次上线后仍需依赖手工回归，不应把“通过编译”当成充分验证。

---

## 3. 修订后的实施范围

### 代码改动

| 文件 | 是否建议修改 | 目的 |
|---|---|---|
| `suzaku-gaming-admin/src/views/System/UserManagement.vue` | 是 | 修 B1 / B3，补全创建参数 |
| `suzaku-gaming-admin/src/views/Audit/NewAttribution.vue` | 是 | 修 B2，并过滤无效组名数据，避免 B4 残留 |

### 数据处理

| 动作 | 是否建议执行 | 目的 |
|---|---|---|
| 检查历史 `manager.cpsGroupCode` 空值 | 是 | 判断 B4 是否能真正闭环 |
| 执行 `scripts/backfill-member-codes.ts`（如有需要） | 视数据而定 | 让历史组员重新出现在组员下拉 |
| 手工/脚本修复历史无组名组长 | 视数据而定 | 修复无法由前端自动修复的老数据 |

### 后端代码

| 模块 | 是否必须改动 | 说明 |
|---|---|---|
| `CreateUserDto` / `user.service.ts` | 否 | 当前能力已够用 |
| DB Schema | 否（本次最小修复） | 但若要消除重复组名风险，后续应补唯一性约束或服务端校验 |

---

## 4. 风险清单（按实施视角重排）

| 风险 | 等级 | 是否被当前最小方案完全消除 | 处理建议 |
|---|---|---|---|
| 历史无组名组长仍无法正常参与归因 | 高 | 否 | 必须做数据检查；必要时人工/脚本补数 |
| 历史无 `memberCode` 组员不出现在下拉 | 高 | 否 | 执行已有回填脚本 |
| 管理员创建新组员时未带上 `parentId/cpsGroupCode` | 高 | 是 | 改 `UserManagement.vue` 即可 |
| 创建组长时无入口填写组名 | 高 | 是 | 增加 `cpsGroupCode` 输入框 |
| 上传失败导致“明明传了 3 张却不能提交” | 中 | 是 | 增加分状态提示 |
| 重复 `cpsGroupCode` 造成组名冲突 | 中 | 否 | 作为后续增强或上线前人工规避 |
| 隐藏字段校验行为与 UI 库实现差异 | 低 | 基本可控 | 规则写成按角色短路，不依赖 UI 库隐式行为 |
| 自动化测试不足导致回归盲区 | 中 | 否 | 增加最少 1 条用户创建 E2E 和 1 条上传失败 E2E |

---

## 5. 建议测试清单

### 5.1 手工验证（本次必须）

1. 管理员创建组长，填写 `GroupA`，确认列表显示 `cpsGroupCode`
2. 管理员创建组员，选择有组名的组长，确认自动生成 `memberCode`
3. 组长登录创建组员，确认无需选上级也能正常创建
4. 管理员进入归因页，确认无效空白组名不再出现在组名下拉
5. 若存在历史回填数据，确认回填后的组员编号可正常出现在下拉
6. 上传 3 张图，其中 1 张失败，确认提示明确要求删除后重传
7. 上传进行中立即提交，确认被“上传中”提示阻断

### 5.2 自动化补测（强烈建议）

1. 为 `UserManagement.vue` 增加“管理员创建组长/组员”的 E2E
2. 为 `NewAttribution.vue` 增加“3 张图 1 张失败”的 E2E
3. 增加“历史脏数据过滤”的组件级或 E2E 用例

---

## 6. 最终建议（供执行时直接采用）

本次方案应按以下口径执行：

- **可以只改前端代码来修复新增数据链路**
- **不能把历史数据问题算作已自动修复**
- **文档必须把 `NewAttribution.vue` 的无效组过滤写进改动范围**
- **上线前必须补一轮数据检查，必要时执行 `backfill-member-codes.ts`**
- **若业务要求组名唯一，应把重复 `cpsGroupCode` 风险明确标记为后续必做项**

如果按以上修订版执行，这份方案在当前项目中是可实施的；如果仍按原版“前端改完即全部修复”的口径执行，线上会留下明确的功能残缺和数据一致性风险。
