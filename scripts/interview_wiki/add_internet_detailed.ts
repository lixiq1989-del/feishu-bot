/**
 * 商科面试真题库 — 互联网详细版
 *
 * 重新搜索互联网公司面试题，答题思路大幅扩展：
 *   - 明确解题框架（STAR/MECE/5W1H等）
 *   - 分步骤说明答题方向
 *   - 给出关键得分点
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *   node_modules/.bin/ts-node scripts/interview_wiki/add_internet_detailed.ts
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
const APP_TOKEN = 'Y4Jwbk1Rkagnq6sdqeucsbY9nxg';
const TABLE_ID = 'tblBYhdYo0c9zqFT';

// ─── 互联网公司目标 ──────────────────────────────────────────────
interface Target { company: string; industry: string; role: string; }

const INTERNET_TARGETS: Target[] = [
  { company: '字节跳动', industry: '互联网', role: '产品经理/商业分析' },
  { company: '腾讯', industry: '互联网', role: '产品经理/运营' },
  { company: '阿里巴巴', industry: '互联网', role: '产品经理/数据分析' },
  { company: '美团', industry: '互联网', role: '产品运营/商业分析' },
  { company: '滴滴', industry: '互联网', role: '产品经理/战略' },
  { company: '拼多多', industry: '互联网', role: '产品运营/商业分析' },
  { company: '京东', industry: '互联网', role: '产品运营/商业分析' },
  { company: '快手', industry: '互联网', role: '产品经理/运营/商业化' },
  { company: '百度', industry: '互联网', role: '产品经理/商业分析' },
  { company: 'bilibili', industry: '互联网', role: '产品运营/商业化' },
  { company: '网易', industry: '互联网', role: '产品经理/运营' },
  { company: '小米', industry: '互联网', role: '产品经理/商业分析' },
  { company: '携程', industry: '互联网', role: '产品经理/运营' },
  { company: '华为', industry: '互联网', role: '产品经理/解决方案' },
];

// ─── Perplexity 搜题（详细版 prompt）───────────────────────────
interface QuestionItem {
  题目: string; 题型: string; 考察能力: string; 难度: string; 答题思路: string;
}

async function searchQuestions(target: Target): Promise<QuestionItem[]> {
  if (!PERPLEXITY_API_KEY) throw new Error('缺少 PERPLEXITY_API_KEY');

  const body = JSON.stringify({
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content: `你是互联网大厂面试专家，熟悉牛客网、知乎真实面经。

请从真实面经中提取面试题，并给出详细答题指导。返回 JSON 数组，每条格式：
{
  "题目": "完整题目原文",
  "题型": "行为题/Case分析/产品设计/数据分析/HR题/逻辑推理/行业认知",
  "考察能力": "具体能力点，如：结构化思维、用户洞察、数据驱动决策",
  "难度": "简单/中等/困难",
  "答题思路": "详细说明：①用什么框架（如STAR/MECE/用户-场景-需求拆解）②分几个步骤回答③每步的关键内容④评分官关注什么——共150-200字"
}

要求：
- 提取12-15道题，覆盖多种题型
- 答题思路必须详细、有操作性，不是泛泛而谈
- 只返回 JSON 数组，不要其他内容`,
      },
      {
        role: 'user',
        content: `${target.company} ${target.role} 面试真题 2024 2025 牛客网面经 高频题`,
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
          const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '');
          const match = cleaned.match(/\[[\s\S]*\]/);
          if (!match) { console.log('   ⚠ 未解析到JSON'); resolve([]); return; }
          const arr = JSON.parse(match[0]);
          resolve(Array.isArray(arr) ? arr.filter((x: any) => x.题目) : []);
        } catch (e) {
          console.log('   ⚠ 解析错误');
          resolve([]);
        }
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
  console.log('🖥  互联网面试题 — 详细版追加\n');
  console.log(`📋 目标：${INTERNET_TARGETS.length} 家公司，使用 sonar-pro 深度搜索\n`);

  const allRows: Record<string, any>[] = [];

  for (const target of INTERNET_TARGETS) {
    console.log(`🔍 ${target.company} × ${target.role}`);
    const questions = await searchQuestions(target);
    console.log(`   → ${questions.length} 条`);

    if (questions.length > 0) {
      // 打印第一条作为预览
      const first = questions[0];
      console.log(`   预览：「${first.题目.slice(0, 30)}...」`);
      console.log(`   思路：${first.答题思路.slice(0, 60)}...`);
    }

    for (const q of questions) {
      allRows.push({
        '题目': String(q.题目 || '').slice(0, 500),
        '公司': target.company,
        '行业方向': target.industry,
        '岗位类型': target.role,
        '题型': String(q.题型 || '').slice(0, 50),
        '考察能力': String(q.考察能力 || '').slice(0, 100),
        '难度': String(q.难度 || '').slice(0, 20),
        '答题思路': String(q.答题思路 || '').slice(0, 1000),
      });
    }

    await sleep(1500);
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
  console.log(`   本次追加: ${allRows.length} 条（详细版互联网题目）`);
}

main().catch(console.error);
