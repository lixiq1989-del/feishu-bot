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
import { client } from '../src/client';

(async () => {
  // 列出所有 wiki space
  const res = await (client.wiki as any).space.list({});
  console.log(JSON.stringify(res?.data, null, 2));
})().catch(console.error);
