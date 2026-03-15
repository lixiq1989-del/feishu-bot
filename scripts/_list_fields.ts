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
async function run() {
  const res = await client.bitable.appTableField.list({
    path: { app_token: 'F97TbvmG7aBI7Vs8rZccV0Xsnyd', table_id: 'tblo44ZOBV43BEFu' },
  });
  for (const f of res.data?.items ?? []) {
    console.log(`${f.field_name} | type=${f.type} | id=${(f as any).field_id}`);
  }
}
run().catch(console.error);
