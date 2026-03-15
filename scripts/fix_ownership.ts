/**
 * 1. 查找租户用户
 * 2. 把用户加为多维表格的 full_access 管理者
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/fix_ownership.ts
 */

import * as fs from 'fs';
import * as path from 'path';

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

const APP_TOKEN = 'R0DPbgsKhaGj8FsTd0kcvglEnMf';

async function run() {
  console.log('=== 修复多维表格权限 ===\n');

  // 1. 列出租户内用户
  console.log('① 查找用户...');
  const userRes = await client.contact.user.list({
    params: { department_id: '0', page_size: 20 },
  });

  if (userRes.code !== 0) {
    console.log('  查找用户失败:', userRes.msg, '| code:', userRes.code);
    return;
  }

  const users = userRes.data?.items || [];
  console.log(`  找到 ${users.length} 个用户：`);
  for (const u of users) {
    console.log(`    ${u.name} | open_id: ${u.open_id}`);
  }

  if (users.length === 0) {
    console.log('  没有找到用户');
    return;
  }

  // 2. 查看当前协作者
  console.log('\n② 当前协作者：');
  const memberListRes = await client.drive.permissionMember.list({
    path: { token: APP_TOKEN },
    params: { type: 'bitable' },
  });
  if (memberListRes.code === 0) {
    const members = memberListRes.data?.items || [];
    for (const m of members) {
      console.log(`    ${m.member_type}: ${m.member_id} → ${m.perm}`);
    }
    if (members.length === 0) console.log('    (无)');
  }

  // 3. 把每个用户都加为 full_access
  console.log('\n③ 添加用户为管理者...');
  for (const u of users) {
    const addRes = await client.drive.permissionMember.create({
      path: { token: APP_TOKEN },
      params: { type: 'bitable', need_notification: false },
      data: {
        member_type: 'openid',
        member_id: u.open_id!,
        perm: 'full_access',
      },
    });
    if (addRes.code === 0) {
      console.log(`  ✅ ${u.name} → full_access`);
    } else {
      console.log(`  ❌ ${u.name}: ${addRes.msg} (code: ${addRes.code})`);
    }
  }

  // 4. 转移所有权给第一个用户
  console.log('\n④ 转移所有权...');
  const owner = users[0];
  const transferRes = await client.drive.permissionMember.transferOwner({
    path: { token: APP_TOKEN },
    params: { type: 'bitable' },
    data: {
      member_type: 'openid',
      member_id: owner.open_id!,
    },
  });
  if (transferRes.code === 0) {
    console.log(`  ✅ 已将所有权转移给 ${owner.name}`);
  } else {
    console.log(`  ❌ 转移失败: ${transferRes.msg} (code: ${transferRes.code})`);
  }

  console.log(`\n=== 完成 ===`);
  console.log(`打开: https://hcn2vc1r2jus.feishu.cn/base/${APP_TOKEN}`);
  console.log('现在你可以在右上角开启「高级权限」了');
}

run().catch(console.error);
