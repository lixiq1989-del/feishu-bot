/**
 * 商科面试真题库 — 创建 Feishu Bitable
 *
 * 用 Perplexity 从牛客网/知乎面经中提取真实面试题，写入多维表格。
 * 覆盖：咨询 / 互联网 / 快消（不含投行）
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *   node_modules/.bin/ts-node scripts/interview_wiki/build_question_bank.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// 加载 .env
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
import { batchAddRecords } from '../../src/bitable';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

// ─── 搜索目标（不含投行）───────────────────────────────────────────

interface Target {
  company: string;
  industry: string;
  role: string;
}

const TARGETS: Target[] = [
  { company: '麦肯锡', industry: '咨询', role: '商业分析师/咨询顾问' },
  { company: 'BCG波士顿咨询', industry: '咨询', role: '咨询顾问' },
  { company: '贝恩咨询', industry: '咨询', role: '咨询顾问' },
  { company: '罗兰贝格', industry: '咨询', role: '咨询顾问' },
  { company: '字节跳动', industry: '互联网', role: '产品经理/商业分析' },
  { company: '腾讯', industry: '互联网', role: '产品运营' },
  { company: '阿里巴巴', industry: '互联网', role: '产品经理/数据分析' },
  { company: '美团', industry: '互联网', role: '产品运营/商业分析' },
  { company: '宝洁', industry: '快消', role: '管培生/品牌管理' },
  { company: '联合利华', industry: '快消', role: '管培生/品牌' },
];

// ─── Perplexity 搜题 ────────────────────────────────────────────────

interface QuestionItem {
  题目: string;
  题型: string;
  考察能力: string;
  难度: string;
  答题思路: string;
}

async function searchQuestions(target: Target): Promise<QuestionItem[]> {
  if (!PERPLEXITY_API_KEY) throw new Error('缺少 PERPLEXITY_API_KEY');

  const body = JSON.stringify({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `你是面试题收集专家。从牛客网、知乎等平台的真实面经中提取面试题。
返回 JSON 数组，每条格式：
{"题目":"具体题目原文","题型":"行为/Case/HR/行业知识","考察能力":"例如逻辑分析/团队协作","难度":"简单/中等/困难","答题思路":"简要说明解题方向，50字以内"}
只返回 JSON 数组，提取5-8个真实面试题，不要杜撰，不要其他内容。`,
      },
      {
        role: 'user',
        content: `${target.company} ${target.role} 面试真题 牛客网 面经 2024 2025`,
      },
    ],
  });

  return new Promise(resolve => {
    const req = https.request(
      {
        hostname: 'api.perplexity.ai',
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) { resolve([]); return; }
            const text = json.content?.[0]?.text || json.choices?.[0]?.message?.content || '';
            const match = text.replace(/```json\s*/gi, '').replace(/```/g, '').match(/\[[\s\S]*\]/);
            if (!match) { resolve([]); return; }
            const arr = JSON.parse(match[0]);
            resolve(Array.isArray(arr) ? arr.filter((x: any) => x.题目) : []);
          } catch {
            resolve([]);
          }
        });
      }
    );
    req.on('error', () => resolve([]));
    req.write(body);
    req.end();
  });
}

// ─── 主流程 ─────────────────────────────────────────────────────────

async function run() {
  console.log('🗂  商科面试真题库 — 开始创建\n');

  // 1. 创建 Bitable
  const appRes = await (client.bitable as any).app.create({
    data: { name: '商科面试真题库' },
  });
  if (appRes.code !== 0) {
    console.error('❌ 创建多维表格失败:', appRes.msg, '| code:', appRes.code);
    console.log('请确认已开通 bitable:app 权限');
    return;
  }
  const appToken = appRes.data?.app?.app_token as string;
  console.log('✅ 多维表格创建成功:', appToken);

  // 2. 获取默认 table
  const tableListRes = await client.bitable.appTable.list({
    path: { app_token: appToken },
  });
  const tableId = tableListRes.data?.items?.[0]?.table_id as string;
  console.log('   table_id:', tableId);

  // 3. 添加字段（type 1 = 文本）
  const fields: Array<{ field_name: string; type: number }> = [
    { field_name: '题目', type: 1 },
    { field_name: '公司', type: 1 },
    { field_name: '行业方向', type: 1 },
    { field_name: '岗位类型', type: 1 },
    { field_name: '题型', type: 1 },
    { field_name: '考察能力', type: 1 },
    { field_name: '难度', type: 1 },
    { field_name: '答题思路', type: 1 },
  ];

  for (const f of fields) {
    const res = await client.bitable.appTableField.create({
      path: { app_token: appToken, table_id: tableId },
      data: f,
    });
    if (res.code === 0) {
      console.log(`   ✅ 字段「${f.field_name}」`);
    } else {
      console.log(`   ⚠  字段「${f.field_name}」: ${res.msg}`);
    }
  }

  // 4. 搜题并写入
  const allRows: Record<string, any>[] = [];

  for (const target of TARGETS) {
    console.log(`\n🔍 搜索：${target.company} × ${target.role}`);
    const questions = await searchQuestions(target);
    console.log(`   → ${questions.length} 条题目`);

    for (const q of questions) {
      allRows.push({
        '题目': String(q.题目 || '').slice(0, 500),
        '公司': target.company,
        '行业方向': target.industry,
        '岗位类型': target.role,
        '题型': String(q.题型 || '').slice(0, 50),
        '考察能力': String(q.考察能力 || '').slice(0, 100),
        '难度': String(q.难度 || '').slice(0, 20),
        '答题思路': String(q.答题思路 || '').slice(0, 500),
      });
    }

    // 限流：每次请求间隔 1.2s
    await new Promise(r => setTimeout(r, 1200));
  }

  // 5. 批量写入（500条上限，分批）
  console.log(`\n📝 共收集 ${allRows.length} 条，写入 Bitable...`);
  const chunkSize = 400;
  for (let i = 0; i < allRows.length; i += chunkSize) {
    const chunk = allRows.slice(i, i + chunkSize);
    const res = await batchAddRecords(appToken, tableId, chunk);
    if ((res as any).code === 0) {
      console.log(`   ✅ 写入 ${chunk.length} 条`);
    } else {
      console.error(`   ❌ 写入失败:`, (res as any).msg);
    }
  }

  console.log('\n🎉 完成！');
  console.log(`   app_token : ${appToken}`);
  console.log(`   访问地址  : https://${DOMAIN}/base/${appToken}`);
  console.log(`   共写入    : ${allRows.length} 条题目`);
}

run().catch(console.error);
