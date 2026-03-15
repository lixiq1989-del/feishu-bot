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

async function run() {
  // 获取表
  const tablesRes = await client.bitable.appTable.list({ path: { app_token: APP_TOKEN } });
  const tables = (tablesRes.data?.items ?? []).map((t: any) => t.table_id);

  // 尝试1: 最简单的角色（无 rec_rule）
  console.log('尝试1: 无 rec_rule...');
  try {
    const res = await client.bitable.appRole.create({
      path: { app_token: APP_TOKEN },
      data: {
        role_name: '学生',
        table_roles: tables.map((tid: string) => ({
          table_id: tid,
          table_perm: 2,
        })),
      },
    });
    console.log('结果:', JSON.stringify(res.data, null, 2));
    if (res.code === 0) {
      console.log('[OK] 基础角色创建成功！');
      const roleId = res.data?.role?.role_id;

      // 再更新添加 rec_rule
      console.log('\n尝试更新角色添加记录规则...');
      for (const tid of tables) {
        try {
          const updateRes = await client.bitable.appRole.update({
            path: { app_token: APP_TOKEN, role_id: roleId! },
            data: {
              role_name: '学生',
              table_roles: [{
                table_id: tid,
                table_perm: 2,
                rec_rule: {
                  conditions: [{
                    field_name: '创建人',
                    operator: 'is' as const,
                  }],
                  conjunction: 'and' as const,
                  other_perm: 0,
                },
              }],
            },
          });
          console.log(`  ${tid}: code=${updateRes.code} ${updateRes.msg || 'OK'}`);
        } catch (e: any) {
          const d = e.response?.data;
          console.log(`  ${tid}: ${d?.msg || e.message?.slice(0, 60)} (code: ${d?.code})`);
        }
      }
      return;
    }
  } catch (e: any) {
    const d = e.response?.data;
    console.log('失败:', d?.msg || e.message?.slice(0, 80), 'code:', d?.code);
  }
}

run().catch(console.error);
