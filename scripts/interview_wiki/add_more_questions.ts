/**
 * 商科面试真题库 — 第三批追加
 *
 * 新增覆盖：
 *   快消大牌：雅诗兰黛、花王、资生堂、可口可乐、百事、玛氏、亿滋
 *   咨询扩展：Oliver Wyman、毕马威管理咨询、普华永道战略、LEK咨询
 *   互联网补充：华为、快手、百度、bilibili、携程
 *   新消费/零售：名创优品、泡泡玛特、瑞幸咖啡、安踏
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *   node_modules/.bin/ts-node scripts/interview_wiki/add_more_questions.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// ─── 加载 .env ───────────────────────────────────────────────────
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

import { batchAddRecords } from '../../src/bitable';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

// 已有题库（直接追加）
const APP_TOKEN = 'Y4Jwbk1Rkagnq6sdqeucsbY9nxg';
const TABLE_ID = 'tblBYhdYo0c9zqFT';

// ─── 第三批目标 ──────────────────────────────────────────────────
interface Target { company: string; industry: string; role: string; }

const BATCH3_TARGETS: Target[] = [
  // 快消大牌（补充）
  { company: '雅诗兰黛', industry: '快消', role: '管培生/品牌/市场' },
  { company: '花王', industry: '快消', role: '管培生/销售/品牌' },
  { company: '资生堂', industry: '快消', role: '管培生/品牌/渠道' },
  { company: '可口可乐', industry: '快消', role: '管培生/销售/市场' },
  { company: '百事公司', industry: '快消', role: '管培生/销售/品牌' },
  { company: '玛氏', industry: '快消', role: '管培生/销售运营' },
  { company: '亿滋国际', industry: '快消', role: '管培生/销售/市场' },

  // 咨询（补充）
  { company: 'Oliver Wyman奥纬咨询', industry: '咨询', role: '咨询顾问/战略分析' },
  { company: '毕马威管理咨询', industry: '咨询', role: '咨询顾问/数字化转型' },
  { company: '普华永道战略咨询', industry: '咨询', role: '咨询顾问/商业分析' },
  { company: 'LEK咨询', industry: '咨询', role: '咨询顾问/战略' },

  // 互联网（补充）
  { company: '华为', industry: '互联网', role: '产品经理/解决方案/市场' },
  { company: '快手', industry: '互联网', role: '产品经理/运营/商业化' },
  { company: '百度', industry: '互联网', role: '产品经理/商业分析' },
  { company: 'bilibili', industry: '互联网', role: '产品运营/商业化' },
  { company: '携程', industry: '互联网', role: '产品经理/运营' },

  // 新消费/零售
  { company: '名创优品', industry: '新消费', role: '管培生/运营/品牌' },
  { company: '泡泡玛特', industry: '新消费', role: '产品运营/品牌/零售' },
  { company: '瑞幸咖啡', industry: '新消费', role: '管培生/运营/市场' },
  { company: '安踏', industry: '新消费', role: '管培生/品牌/运营' },
];

// ─── Perplexity 搜题 ─────────────────────────────────────────────
interface QuestionItem {
  题目: string; 题型: string; 考察能力: string; 难度: string; 答题思路: string;
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
{"题目":"具体题目原文","题型":"行为/Case/HR/行业知识/逻辑","考察能力":"例如逻辑分析/团队协作/行业认知","难度":"简单/中等/困难","答题思路":"简要说明解题方向，60字以内"}
只返回 JSON 数组，提取10-15个真实面试题，覆盖不同题型，不要杜撰，不要其他内容。`,
      },
      {
        role: 'user',
        content: `${target.company} ${target.role} 面试真题 牛客网 面经 2024 2025`,
      },
    ],
  });

  return new Promise(resolve => {
    const req = https.request({
      hostname: 'api.perplexity.ai',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
    }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { console.log('   ⚠ API error:', json.error.message); resolve([]); return; }
          const text = json.content?.[0]?.text || json.choices?.[0]?.message?.content || '';
          const match = text.replace(/```json\s*/gi, '').replace(/```/g, '').match(/\[[\s\S]*\]/);
          if (!match) { resolve([]); return; }
          const arr = JSON.parse(match[0]);
          resolve(Array.isArray(arr) ? arr.filter((x: any) => x.题目) : []);
        } catch { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.write(body);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  console.log('🗂  商科面试真题库 — 第三批追加\n');
  console.log(`📋 目标：${BATCH3_TARGETS.length} 家公司\n`);

  const allRows: Record<string, any>[] = [];

  for (const target of BATCH3_TARGETS) {
    console.log(`🔍 ${target.company} × ${target.role}`);
    const questions = await searchQuestions(target);
    console.log(`   → ${questions.length} 条`);

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

    await sleep(1200);
  }

  console.log(`\n📝 共收集 ${allRows.length} 条，写入题库...`);

  const chunkSize = 400;
  for (let i = 0; i < allRows.length; i += chunkSize) {
    const chunk = allRows.slice(i, i + chunkSize);
    const res = await batchAddRecords(APP_TOKEN, TABLE_ID, chunk);
    if ((res as any).code === 0) {
      console.log(`   ✅ 写入 ${chunk.length} 条`);
    } else {
      console.error(`   ❌ 写入失败:`, (res as any).msg);
    }
  }

  console.log('\n🎉 完成！');
  console.log(`   题库地址: https://${DOMAIN}/base/${APP_TOKEN}`);
  console.log(`   本次追加: ${allRows.length} 条`);
}

main().catch(console.error);
