/**
 * 为留学管理系统开启外部分享 + 查看当前权限
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/enable_external_share.ts
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
  console.log('=== 开启多维表格外部分享 ===\n');

  // 1. 查看当前权限
  console.log('① 当前权限设置：');
  const getRes = await client.drive.permissionPublic.get({
    path: { token: APP_TOKEN },
    params: { type: 'bitable' },
  });
  if (getRes.code === 0) {
    console.log(JSON.stringify(getRes.data, null, 2));
  } else {
    console.log('  查询失败:', getRes.msg, '| code:', getRes.code);
  }

  // 2. 开启外部访问 + 链接分享
  console.log('\n② 开启外部访问 & 链接分享...');
  const patchRes = await client.drive.permissionPublic.patch({
    path: { token: APP_TOKEN },
    params: { type: 'bitable' },
    data: {
      external_access: true,
      link_share_entity: 'anyone_readable',
      invite_external: true,
    } as any,
  });

  if (patchRes.code === 0) {
    console.log('  ✅ 外部分享已开启!');
    console.log(JSON.stringify(patchRes.data, null, 2));
  } else {
    console.log('  ❌ 失败:', patchRes.msg, '| code:', patchRes.code);
    console.log('  完整响应:', JSON.stringify(patchRes, null, 2));
  }

  console.log(`\n=== 链接 ===`);
  console.log(`https://hcn2vc1r2jus.feishu.cn/base/${APP_TOKEN}`);
}

run().catch(console.error);
