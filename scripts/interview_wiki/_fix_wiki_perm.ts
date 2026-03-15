/**
 * 给知识库空间开放 tenant 编辑权限（一次性运行）
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
const { client } = require('../../src/client') as typeof import('../../src/client');

const SPACE_ID = '7615113124324117443';

async function main() {
  // 方法1: 修改空间设置，开放给所有组织成员可编辑
  console.log('=== 修改 spaceSetting ===');
  try {
    const res = await (client.wiki.spaceSetting as any).update({
      path: { space_id: SPACE_ID },
      data: {
        create_setting: 'admin',        // 谁能创建子页面：admin/member
        security_setting: 'tenant',     // 安全设置
        comment_setting: 'member',      // 评论设置
      },
    });
    console.log('spaceSetting result:', res.code, res.msg);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error('spaceSetting失败:', e?.message);
    const d = e?.response?.data;
    if (d) console.error(JSON.stringify(d, null, 2));
  }

  // 方法2: 添加应用为成员（编辑权限）
  console.log('\n=== 添加 App 为编辑成员 ===');
  try {
    const res = await (client.wiki.spaceMember as any).create({
      path: { space_id: SPACE_ID },
      data: {
        member_type: 'openid',
        member_id: process.env.FEISHU_APP_ID || 'cli_a92832aa14b9dcef',
        role: 'editor',
      },
    });
    console.log('spaceMember result:', res.code, res.msg);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error('spaceMember失败:', e?.message);
    const d = e?.response?.data;
    if (d) console.error(JSON.stringify(d, null, 2));
  }
}

main().catch(console.error);
