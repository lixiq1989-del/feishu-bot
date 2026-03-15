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

import { client } from '../../src/client';

async function main() {
  // 列出所有知识库
  const spaces = await (client.wiki as any).space.list({ params: { page_size: 50 } });
  console.log('=== App可访问的知识库 ===');
  for (const s of spaces?.data?.items || []) {
    console.log(s.name, '| space_id:', s.space_id);
  }

  // 查询目标节点
  try {
    const res = await (client.wiki as any).space.getNode({
      params: { token: 'W1ohwQfKviDg3IkeV68c0N0bnyc' },
    });
    console.log('\n=== 目标节点信息 ===');
    console.log(JSON.stringify(res?.data, null, 2));
  } catch (e: any) {
    console.log('\n=== 目标节点查询失败 ===');
    console.log('code:', e?.response?.data?.code, 'msg:', e?.response?.data?.msg);
  }
}

main().catch(console.error);
