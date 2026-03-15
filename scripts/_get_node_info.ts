import * as fs from 'fs';
import * as path from 'path';
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) { const k = t.slice(0, eq).trim(); const v = t.slice(eq+1).trim(); if (!process.env[k]) process.env[k] = v; }
  }
}
const { client } = require('../src/client') as typeof import('../src/client');

async function main() {
  const token = 'Ik7Tw5lLki3Wl1kBQprcj3RMnue';

  // 方法1: wiki.node API
  try {
    const r1 = await (client.wiki as any).node?.getNodeInfo?.({ token }) ?? 'not available';
    console.log('node.getNodeInfo:', JSON.stringify(r1, null, 2));
  } catch (e: any) { console.log('node.getNodeInfo err:', e.message); }

  // 方法2: 直接调用 HTTP
  try {
    const r2 = await (client as any).request({
      method: 'GET',
      url: '/open-apis/wiki/v2/nodes',
      params: { obj_type: 'wiki', token },
    });
    console.log('GET /wiki/v2/nodes:', JSON.stringify(r2, null, 2));
  } catch (e: any) { console.log('GET /wiki/v2/nodes err:', e.message); }

  // 方法3: space member list — 看空间列表是否有数据
  try {
    const r3 = await (client as any).request({
      method: 'GET',
      url: '/open-apis/wiki/v2/spaces',
    });
    console.log('GET /wiki/v2/spaces:', JSON.stringify(r3?.data?.items?.map((s: any) => ({ id: s.space_id, name: s.name })), null, 2));
  } catch (e: any) { console.log('GET /wiki/v2/spaces err:', e.message); }
}
main().catch((e: any) => console.error(e.message ?? e));
