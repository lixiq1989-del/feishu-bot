import * as fs from 'fs';
import * as path from 'path';
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) { const k = t.slice(0, eq).trim(); const v = t.slice(eq + 1).trim(); if (!process.env[k]) process.env[k] = v; }
  }
}
const { client } = require('../src/client') as typeof import('../src/client');

async function main() {
  const token = 'Adh3w4XwCiMs2zkApVhcFdT0nFf';

  // 用 /wiki/v2/nodes 拿节点信息（含 space_id）
  const r = await (client as any).request({
    method: 'GET',
    url: '/open-apis/wiki/v2/nodes',
    params: { obj_type: 'wiki', token },
  });
  console.log('GET /wiki/v2/nodes:', JSON.stringify(r, null, 2));
}
main().catch((e: any) => console.error(e.message ?? e));
