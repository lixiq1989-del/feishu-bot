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
  const res = await (client.wiki.space as any).list({});
  console.log('spaces:', JSON.stringify(res?.data?.items?.map((s: any) => ({ id: s.space_id, name: s.name })), null, 2));
  if (res.code !== 0) console.log('code:', res.code, 'msg:', res.msg);
}
main().catch((e: any) => console.error(e.message ?? e));
