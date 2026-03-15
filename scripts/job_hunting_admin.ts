/**
 * 求职管理系统 - 管理后台脚本
 *
 * 命令:
 *   --setup                 配置高级权限 + 创建学生角色
 *   --add <手机号或邮箱>     添加学生
 *   --remove <手机号或邮箱>  移除学生
 *   --list                  列出所有学生
 *   --guide                 打印飞书应用配置指南
 *
 * 运行:
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/job_hunting_admin.ts --setup
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/job_hunting_admin.ts --add 13800138000
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/job_hunting_admin.ts --list
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/job_hunting_admin.ts --guide
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载 .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) {
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

import { client } from '../src/client';

const APP_TOKEN = process.env.JOB_HUNTING_APP_TOKEN!;
const TENANT_DOMAIN = 'hcn2vc1r2jus.feishu.cn';

if (!APP_TOKEN) {
  console.error('请在 .env 中设置 JOB_HUNTING_APP_TOKEN');
  process.exit(1);
}

// ─── helpers ────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function isEmail(s: string) {
  return s.includes('@');
}

// ─── 获取所有 table_id ────────────────────────────────────────────
async function getTableIds(): Promise<Array<{ table_id: string; name: string }>> {
  const res = await client.bitable.appTable.list({
    path: { app_token: APP_TOKEN },
  });
  return (res.data?.items ?? []).map((t: any) => ({
    table_id: t.table_id,
    name: t.name,
  }));
}

// ─── setup: 开启高级权限 + 创建学生角色 ──────────────────────────
async function setup() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   求职管理系统 - 权限配置                     ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 获取所有表
  const tables = await getTableIds();
  console.log(`  找到 ${tables.length} 张表:`);
  tables.forEach(t => console.log(`    ${t.name} (${t.table_id})`));

  // 1. 检查是否已有角色（需要先开启高级权限）
  console.log('\n① 检查现有角色...');
  let existingRoles: any[] = [];
  try {
    const rolesRes = await client.bitable.appRole.list({
      path: { app_token: APP_TOKEN },
    });
    existingRoles = rolesRes.data?.items ?? [];
  } catch (e: any) {
    const errData = e.response?.data;
    if (errData?.code === 1254301) {
      console.log('  [!] 高级权限尚未开启\n');
      console.log('  请先手动开启：');
      console.log(`  1. 打开 https://${TENANT_DOMAIN}/base/${APP_TOKEN}`);
      console.log('  2. 右上角「...」→「更多」→「高级权限」→ 开启');
      console.log('  3. 开启后重新运行: npm run job-hunting:setup');
      return null;
    }
    throw e;
  }

  console.log(`  现有角色: ${existingRoles.length} 个`);
  existingRoles.forEach((r: any) => console.log(`    ${r.role_name} (${r.role_id})`));

  const studentRole = existingRoles.find((r: any) => r.role_name === '学生');
  if (studentRole) {
    console.log('\n  「学生」角色已存在，跳过创建');
    console.log(`  role_id: ${(studentRole as any).role_id}`);
    return (studentRole as any).role_id;
  }

  // 2. 创建「学生」角色
  console.log('\n② 创建「学生」角色...');

  // 构建每张表的权限：可编辑，但只能看到自己创建的记录
  const tableRoles = tables.map(t => ({
    table_id: t.table_id,
    table_perm: 2, // 2 = 可编辑
    rec_rule: {
      conditions: [
        {
          field_name: '创建人',
          operator: 'is' as const,
        },
      ],
      conjunction: 'and' as const,
      other_perm: 0, // 0 = 不可见其他记录
    },
  }));

  const createRes = await client.bitable.appRole.create({
    path: { app_token: APP_TOKEN },
    data: {
      role_name: '学生',
      table_roles: tableRoles,
    },
  });

  if (createRes.code === 0) {
    const roleId = createRes.data?.role?.role_id;
    console.log(`  [OK] 角色创建成功，role_id: ${roleId}`);
    return roleId;
  } else {
    console.error(`  [FAIL] 角色创建失败: ${createRes.msg} (code: ${createRes.code})`);
    console.log('\n  可能原因:');
    console.log('  1. 需要先在飞书界面开启「高级权限」:');
    console.log(`     打开 https://${TENANT_DOMAIN}/base/${APP_TOKEN}`);
    console.log('     → 右上角「...」→「更多」→「高级权限」→ 开启');
    console.log('  2. 开启后重新运行 --setup');
    return null;
  }
}

// ─── 获取学生角色 ID ─────────────────────────────────────────────
async function getStudentRoleId(): Promise<string | null> {
  const rolesRes = await client.bitable.appRole.list({
    path: { app_token: APP_TOKEN },
  });
  const role = (rolesRes.data?.items ?? []).find((r: any) => r.role_name === '学生');
  return role ? (role as any).role_id : null;
}

// ─── add: 添加学生 ──────────────────────────────────────────────
async function addStudent(identifier: string) {
  console.log(`\n添加学生: ${identifier}\n`);

  // 1. 获取学生角色
  const roleId = await getStudentRoleId();
  if (!roleId) {
    console.error('  未找到「学生」角色，请先运行 --setup');
    return;
  }

  // 2. 查找用户
  let openId: string | undefined;
  let userName: string = identifier;

  if (isEmail(identifier)) {
    // 通过邮箱查找
    try {
      const res = await (client.contact as any).user.batchGetId({
        params: { user_id_type: 'open_id' },
        data: { emails: [identifier] },
      });
      const userList = res.data?.user_list ?? [];
      if (userList.length > 0 && userList[0].user_id) {
        openId = userList[0].user_id;
        console.log(`  通过邮箱找到用户: ${openId}`);
      }
    } catch (e: any) {
      console.log(`  邮箱查找失败: ${e.message?.slice(0, 80)}`);
    }
  } else {
    // 通过手机号查找
    try {
      const res = await (client.contact as any).user.batchGetId({
        params: { user_id_type: 'open_id' },
        data: { mobiles: [identifier] },
      });
      const userList = res.data?.user_list ?? [];
      if (userList.length > 0 && userList[0].user_id) {
        openId = userList[0].user_id;
        console.log(`  通过手机号找到用户: ${openId}`);
      }
    } catch (e: any) {
      console.log(`  手机号查找失败: ${e.message?.slice(0, 80)}`);
    }
  }

  if (!openId) {
    console.log('  未在飞书通讯录中找到该用户');
    console.log('  尝试直接用标识符添加为协作者...\n');
  }

  // 3. 添加为多维表格协作者（通过 drive 权限 API）
  console.log('  ① 添加为多维表格协作者...');
  try {
    const memberType = openId ? 'openid' : (isEmail(identifier) ? 'email' : 'phone');
    const memberId = openId || identifier;

    const permRes = await (client as any).drive.permission.member.create({
      path: { token: APP_TOKEN },
      params: { type: 'bitable', need_notification: true },
      data: {
        member_type: memberType,
        member_id: memberId,
        perm: 'view',
      },
    });
    if (permRes.code === 0) {
      console.log('    [OK] 已添加为协作者');
    } else {
      console.log(`    [WARN] ${permRes.msg} (code: ${permRes.code})`);
    }
  } catch (e: any) {
    console.log(`    [WARN] 添加协作者失败: ${e.message?.slice(0, 80)}`);
    console.log('    可能需要手动在多维表格中添加协作者');
  }
  await sleep(300);

  // 4. 分配「学生」角色
  console.log('  ② 分配「学生」角色...');
  if (openId) {
    try {
      const memberRes = await client.bitable.appRoleMember.create({
        path: { app_token: APP_TOKEN, role_id: roleId },
        data: {
          member_id: openId,
        },
      });
      if (memberRes.code === 0) {
        console.log('    [OK] 已分配「学生」角色');
      } else {
        console.log(`    [WARN] ${memberRes.msg} (code: ${memberRes.code})`);
      }
    } catch (e: any) {
      console.log(`    [WARN] 分配角色失败: ${e.message?.slice(0, 80)}`);
    }
  } else {
    console.log('    [SKIP] 无法获取 open_id，需要手动在高级权限中分配角色');
    console.log(`    打开: https://${TENANT_DOMAIN}/base/${APP_TOKEN}`);
    console.log('    → 高级权限 → 学生角色 → 添加成员');
  }

  console.log('\n  完成！学生可以通过以下链接访问:');
  console.log(`  https://${TENANT_DOMAIN}/base/${APP_TOKEN}`);
}

// ─── remove: 移除学生 ──────────────────────────────────────────
async function removeStudent(identifier: string) {
  console.log(`\n移除学生: ${identifier}\n`);

  const roleId = await getStudentRoleId();
  if (!roleId) {
    console.error('  未找到「学生」角色');
    return;
  }

  // 查找用户 open_id
  let openId: string | undefined;
  try {
    const idType = isEmail(identifier) ? 'emails' : 'mobiles';
    const res = await (client.contact as any).user.batchGetId({
      params: { user_id_type: 'open_id' },
      data: { [idType]: [identifier] },
    });
    const userList = res.data?.user_list ?? [];
    if (userList.length > 0 && userList[0].user_id) {
      openId = userList[0].user_id;
    }
  } catch (e) {}

  if (!openId) {
    console.log('  未找到用户 open_id，请在飞书界面手动移除');
    return;
  }

  // 从角色中移除
  try {
    const res = await client.bitable.appRoleMember.delete({
      path: { app_token: APP_TOKEN, role_id: roleId, member_id: openId },
      params: { member_id_type: 'open_id' },
    });
    if (res.code === 0) {
      console.log('  [OK] 已从「学生」角色中移除');
    } else {
      console.log(`  [FAIL] ${res.msg}`);
    }
  } catch (e: any) {
    console.log(`  [FAIL] ${e.message?.slice(0, 80)}`);
  }

  // 从协作者中移除
  try {
    const res = await (client as any).drive.permission.member.delete({
      path: { token: APP_TOKEN, member_id: openId },
      params: { type: 'bitable', member_type: 'openid' },
    });
    if (res.code === 0) {
      console.log('  [OK] 已从协作者中移除');
    } else {
      console.log(`  [WARN] ${res.msg}`);
    }
  } catch (e: any) {
    console.log(`  [WARN] ${e.message?.slice(0, 80)}`);
  }
}

// ─── list: 列出所有学生 ─────────────────────────────────────────
async function listStudents() {
  console.log('\n当前学生列表:\n');

  const roleId = await getStudentRoleId();
  if (!roleId) {
    console.error('  未找到「学生」角色，请先运行 --setup');
    return;
  }

  try {
    const res = await client.bitable.appRoleMember.list({
      path: { app_token: APP_TOKEN, role_id: roleId },
    });

    const members = res.data?.items ?? [];
    if (members.length === 0) {
      console.log('  暂无学生');
      return;
    }

    console.log(`  共 ${members.length} 名学生:\n`);
    for (const m of members) {
      const member = m as any;
      console.log(`  - ${member.member_name || '未知'} (${member.member_id})`);
    }
  } catch (e: any) {
    console.log(`  查询失败: ${e.message?.slice(0, 80)}`);
  }
}

// ─── guide: 飞书应用配置指南 ────────────────────────────────────
function printGuide() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   求职管理系统 - 飞书应用配置指南                             ║
╚══════════════════════════════════════════════════════════════╝

  多维表格链接: https://${TENANT_DOMAIN}/base/${APP_TOKEN}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  第一步：开启多维表格高级权限

  1. 打开多维表格: https://${TENANT_DOMAIN}/base/${APP_TOKEN}
  2. 点右上角「...」→「更多」→「高级权限」
  3. 开启高级权限
  4. 然后运行: npm run job-hunting:setup
     → 脚本会自动创建「学生」角色（只能看自己创建的记录）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  第二步：配置飞书应用（网页应用）

  1. 打开飞书开放平台:
     https://open.feishu.cn/app/cli_a92832aa14b9dcef

  2. 左侧菜单 →「应用能力」→「网页应用」

  3. 填写:
     - 桌面端主页: https://${TENANT_DOMAIN}/base/${APP_TOKEN}
     - 移动端主页: https://${TENANT_DOMAIN}/base/${APP_TOKEN}

  4. 保存

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  第三步：发布应用

  1. 左侧菜单 →「版本管理与发布」
  2. 创建新版本
  3. 填写版本说明 → 提交
  4. 审核通过后，学生可在飞书工作台搜索「求职管理系统」使用

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  日常运营命令:

  添加学生:  npm run job-hunting:add -- 13800138000
  移除学生:  npm run job-hunting:remove -- 13800138000
  查看学生:  npm run job-hunting:list
  重新配置:  npm run job-hunting:setup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

// ─── main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case '--setup':
      await setup();
      break;
    case '--add':
      if (!args[1]) {
        console.error('用法: --add <手机号或邮箱>');
        process.exit(1);
      }
      await addStudent(args[1]);
      break;
    case '--remove':
      if (!args[1]) {
        console.error('用法: --remove <手机号或邮箱>');
        process.exit(1);
      }
      await removeStudent(args[1]);
      break;
    case '--list':
      await listStudents();
      break;
    case '--guide':
      printGuide();
      break;
    default:
      console.log('求职管理系统 - 管理后台\n');
      console.log('命令:');
      console.log('  --setup              配置高级权限 + 创建学生角色');
      console.log('  --add <手机号/邮箱>   添加学生');
      console.log('  --remove <手机号/邮箱> 移除学生');
      console.log('  --list               列出所有学生');
      console.log('  --guide              打印飞书应用配置指南');
      break;
  }
}

main().catch(console.error);
