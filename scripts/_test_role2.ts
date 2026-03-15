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
const ROLE_ID = 'rolnL8psJU';

async function run() {
  const tablesRes = await client.bitable.appTable.list({ path: { app_token: APP_TOKEN } });
  const tables = (tablesRes.data?.items ?? []).map((t: any) => t.table_id);

  // 尝试不同的 rec_rule 格式
  const attempts = [
    { name: 'value=[]', rule: { conditions: [{ field_name: '创建人', operator: 'is' as const, value: [] as string[] }], conjunction: 'and' as const, other_perm: 0 } },
    { name: 'isEmpty', rule: { conditions: [{ field_name: '创建人', operator: 'isNotEmpty' as const }], conjunction: 'and' as const, other_perm: 0 } },
    { name: 'no conditions', rule: { conditions: [] as any[], conjunction: 'and' as const, other_perm: 0 } },
  ];

  for (const attempt of attempts) {
    console.log(`\n尝试: ${attempt.name}`);
    try {
      const res = await client.bitable.appRole.update({
        path: { app_token: APP_TOKEN, role_id: ROLE_ID },
        data: {
          role_name: '学生',
          table_roles: tables.map((tid: string) => ({
            table_id: tid,
            table_perm: 2,
            rec_rule: attempt.rule,
          })),
        },
      });
      console.log(`  code=${res.code} ${res.msg || 'OK'}`);
      if (res.code === 0) {
        console.log('  成功！');
        console.log(JSON.stringify(res.data, null, 2));
        return;
      }
    } catch (e: any) {
      const d = e.response?.data;
      console.log(`  失败: ${d?.msg || e.message?.slice(0, 60)} (code: ${d?.code})`);
    }
  }

  // 尝试用原始 HTTP 请求
  console.log('\n尝试原始 HTTP 请求...');
  try {
    const res = await (client as any).request({
      method: 'PUT',
      url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/roles/${ROLE_ID}`,
      data: {
        role_name: '学生',
        table_roles: tables.map((tid: string) => ({
          table_id: tid,
          table_perm: 2,
          allow_add_record: true,
          allow_delete_record: true,
          rec_rule: {
            conditions: [{ field_name: '创建人' }],
            conjunction: 'and',
            other_perm: 0,
          },
        })),
      },
    });
    console.log('  结果:', JSON.stringify(res?.data || res, null, 2));
  } catch (e: any) {
    const d = e.response?.data;
    console.log('  失败:', JSON.stringify(d, null, 2));
  }
}

run().catch(console.error);
