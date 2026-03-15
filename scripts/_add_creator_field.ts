/**
 * 给求职管理系统的每张表添加「创建人」系统字段
 * 创建人字段 type = 1003
 */
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

const APP_TOKEN = process.env.JOB_HUNTING_APP_TOKEN!;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  // 获取所有表
  const tablesRes = await client.bitable.appTable.list({ path: { app_token: APP_TOKEN } });
  const tables = tablesRes.data?.items ?? [];

  for (const t of tables) {
    const tid = t.table_id!;
    const name = (t as any).name;
    console.log(`${name} (${tid})...`);
    try {
      const res = await client.bitable.appTableField.create({
        path: { app_token: APP_TOKEN, table_id: tid },
        data: { field_name: '创建人', type: 1003 as any },
      });
      if (res.code === 0) {
        console.log(`  [OK] 创建人字段已添加`);
      } else {
        console.log(`  [WARN] ${res.msg} (code: ${res.code})`);
      }
    } catch (e: any) {
      const data = e.response?.data;
      if (data) {
        console.log(`  [WARN] ${data.msg} (code: ${data.code})`);
      } else {
        console.log(`  [FAIL] ${e.message?.slice(0, 80)}`);
      }
    }
    await sleep(300);
  }
  console.log('\n完成！');
}

run().catch(console.error);
