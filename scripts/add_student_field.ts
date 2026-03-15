/**
 * 给留学管理系统的 11 张个人数据表添加「所属学生」人员字段
 * 为应用模式 + 高级权限数据隔离做准备
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/add_student_field.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载 .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) {
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

import { client } from '../src/client';

const APP_TOKEN = 'R0DPbgsKhaGj8FsTd0kcvglEnMf';

// 需要添加「所属学生」字段的表（个人数据表）
// 排除：学校库、项目库、版本更新记录（这些是公共/管理表）
const PERSONAL_TABLES = [
  '申请总览',
  '我的选校清单',
  '材料清单',
  '进度计划',
  '个人背景档案',
  '标化考试追踪',
  '文书管理',
  '推荐信管理',
  '面试记录',
  'Offer 对比',
  '费用追踪',
];

const PERSON_FIELD_TYPE = 11; // 人员字段类型

async function run() {
  console.log('=== 添加「所属学生」人员字段 ===\n');

  // 1. 获取所有表
  const listRes = await client.bitable.appTable.list({
    path: { app_token: APP_TOKEN },
  });

  if (listRes.code !== 0) {
    console.error('获取表列表失败:', listRes.msg);
    return;
  }

  const tables = listRes.data?.items ?? [];
  console.log(`共 ${tables.length} 张表\n`);

  // 建立 name → table_id 映射
  const tableMap: Record<string, string> = {};
  for (const t of tables) {
    tableMap[t.name!] = t.table_id!;
    console.log(`  ${t.name} → ${t.table_id}`);
  }
  console.log('');

  // 2. 给个人表添加「所属学生」字段
  let ok = 0, skip = 0, fail = 0;

  for (const name of PERSONAL_TABLES) {
    const tableId = tableMap[name];
    if (!tableId) {
      console.log(`  [SKIP] ${name} — 未找到`);
      skip++;
      continue;
    }

    const res = await client.bitable.appTableField.create({
      path: { app_token: APP_TOKEN, table_id: tableId },
      data: {
        field_name: '所属学生',
        type: PERSON_FIELD_TYPE,
      },
    });

    if (res.code === 0) {
      console.log(`  [OK] ${name} → 字段ID: ${res.data?.field?.field_id}`);
      ok++;
    } else {
      console.log(`  [FAIL] ${name}: ${res.msg} (code: ${res.code})`);
      fail++;
    }
  }

  console.log(`\n=== 完成 ===`);
  console.log(`  成功: ${ok}  跳过: ${skip}  失败: ${fail}`);
  console.log(`\n下一步：`);
  console.log(`  1. 打开 https://hcn2vc1r2jus.feishu.cn/base/${APP_TOKEN}`);
  console.log(`  2. 开启「高级权限」`);
  console.log(`  3. 创建「学生」角色，行权限设为：所属学生 = 当前用户`);
  console.log(`  4. 切换「应用模式」，搭建界面`);
}

run().catch(console.error);
