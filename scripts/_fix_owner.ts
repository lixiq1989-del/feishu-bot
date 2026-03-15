/**
 * 临时脚本：找到管理员用户并授予多维表格 full_access 权限
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

const APP_TOKEN = process.env.JOB_HUNTING_APP_TOKEN!;

async function run() {
  // 1. 获取组织内用户
  console.log('① 查找组织用户...');
  const res = await client.contact.user.findByDepartment({
    params: {
      department_id: '0',
      department_id_type: 'department_id',
      user_id_type: 'open_id',
      page_size: 10,
    },
  });
  const users = res.data?.items ?? [];
  console.log(`  找到 ${users.length} 个用户:`);
  for (const u of users as any[]) {
    console.log(`  - ${u.name} (${u.open_id}) ${u.is_tenant_manager ? '[管理员]' : ''}`);
  }

  // 2. 找管理员或第一个用户
  const admin = (users as any[]).find(u => u.is_tenant_manager) || users[0];
  if (!admin) {
    console.log('  未找到用户');
    return;
  }

  // 2. 用原始 HTTP 请求添加协作者
  console.log(`\n② 授予 ${admin.name} (${admin.open_id}) full_access 权限...`);
  try {
    const permRes = await (client as any).request({
      method: 'POST',
      url: `https://open.feishu.cn/open-apis/drive/v1/permissions/${APP_TOKEN}/members`,
      params: { type: 'bitable', need_notification: true },
      data: {
        member_type: 'openid',
        member_id: admin.open_id,
        perm: 'full_access',
      },
    });
    console.log('  结果:', JSON.stringify(permRes?.data || permRes, null, 2));
  } catch (e: any) {
    const respData = e.response?.data;
    if (respData) {
      console.log('  响应:', JSON.stringify(respData, null, 2));
    } else {
      console.log(`  [FAIL] ${e.message?.slice(0, 100)}`);
    }

    // 备用：尝试转移所有者
    console.log('\n③ 尝试转移所有者...');
    try {
      const transferRes = await (client as any).request({
        method: 'POST',
        url: `https://open.feishu.cn/open-apis/drive/v1/permissions/${APP_TOKEN}/members/transfer_owner`,
        params: { type: 'bitable' },
        data: {
          member_type: 'openid',
          member_id: admin.open_id,
        },
      });
      console.log('  结果:', JSON.stringify(transferRes?.data || transferRes, null, 2));
    } catch (e2: any) {
      const respData2 = e2.response?.data;
      if (respData2) {
        console.log('  响应:', JSON.stringify(respData2, null, 2));
      } else {
        console.log(`  [FAIL] ${e2.message?.slice(0, 100)}`);
      }
    }
  }

  console.log('\n完成！现在可以在飞书中打开多维表格并开启高级权限。');
  console.log(`链接: https://hcn2vc1r2jus.feishu.cn/base/${APP_TOKEN}`);
}

run().catch(console.error);
