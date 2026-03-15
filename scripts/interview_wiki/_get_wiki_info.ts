/**
 * 查询 wiki 空间信息，找到 space_id
 * 运行：NODE_TLS_REJECT_UNAUTHORIZED=0 node_modules/.bin/ts-node scripts/interview_wiki/_get_wiki_info.ts
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

async function main() {
  // 方法1：列出所有知识库空间
  console.log('=== 方法1：列出所有知识库 ===');
  try {
    const res = await (client.wiki.space as any).list({});
    console.log('code:', res.code, 'msg:', res.msg);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error('list失败:', e?.message);
    const d = e?.response?.data;
    if (d) console.error(JSON.stringify(d));
  }

  // 方法2：通过 node token 获取节点信息（包含 space_id）
  console.log('\n=== 方法2：通过节点token查询 ===');
  try {
    const res = await (client.wiki.space as any).getNode({
      params: { token: 'BJL1wFOwCiNFWtkrVvUcE9ndnyd', obj_type: 'wiki' }
    });
    console.log('code:', res.code, 'msg:', res.msg);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error('getNode失败:', e?.message);
    const d = e?.response?.data;
    if (d) console.error(JSON.stringify(d));
  }
}

main().catch(console.error);
