/**
 * 把已创建的多维表格移入知识库，并追加更多真题
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *   node_modules/.bin/ts-node scripts/interview_wiki/move_bitable_to_wiki.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as os from 'os';

// ─── 读取用户 token ───────────────────────────────────────────────
const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
let USER_TOKEN: string;
try {
  USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
  if (!USER_TOKEN) throw new Error('access_token 为空');
} catch (e: any) {
  console.error('❌ 无法读取用户 token:', e.message);
  process.exit(1);
}

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

const SPACE_ID = '7615113124324117443';
const ROOT_NODE_TOKEN = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';

// 已创建的真题库
const APP_TOKEN = 'Y4Jwbk1Rkagnq6sdqeucsbY9nxg';
const TABLE_ID = 'tblBYhdYo0c9zqFT';

// ─── API 工具（user token）────────────────────────────────────────
function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(`JSON parse error: ${d.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── 扩充的搜索目标 ───────────────────────────────────────────────
interface Target { company: string; industry: string; role: string; }

const MORE_TARGETS: Target[] = [
  // 咨询（补充）
  { company: '埃森哲战略', industry: '咨询', role: '咨询顾问/战略分析' },
  { company: '德勤管理咨询', industry: '咨询', role: '商业分析/管理咨询' },
  { company: '科尔尼咨询', industry: '咨询', role: '咨询顾问' },
  // 互联网（补充）
  { company: '小米', industry: '互联网', role: '产品经理/商业分析' },
  { company: '京东', industry: '互联网', role: '产品运营/商业分析' },
  { company: '网易', industry: '互联网', role: '产品经理/运营' },
  { company: '滴滴', industry: '互联网', role: '产品经理/战略' },
  { company: '拼多多', industry: '互联网', role: '产品运营/商业分析' },
  // 快消（补充）
  { company: '欧莱雅', industry: '快消', role: '管培生/品牌/电商' },
  { company: '雀巢', industry: '快消', role: '管培生/销售/市场' },
  { company: '百威英博', industry: '快消', role: '管培生/销售运营' },
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
{"题目":"具体题目原文","题型":"行为/Case/HR/行业知识","考察能力":"例如逻辑分析/团队协作","难度":"简单/中等/困难","答题思路":"简要说明解题方向，60字以内"}
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
          if (json.error) { resolve([]); return; }
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

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  // 1. 移入知识库
  console.log('📚 将真题库移入知识库...');
  const moveRes = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/move_docs_to_wiki`, {
    parent_wiki_token: ROOT_NODE_TOKEN,
    obj_type: 'bitable',
    obj_token: APP_TOKEN,
  });

  if (moveRes.code === 0) {
    const nodeToken = moveRes.data?.wiki_node?.node_token;
    console.log(`✅ 已移入知识库: https://${DOMAIN}/wiki/${nodeToken}`);
  } else {
    console.log(`⚠  移入知识库: code=${moveRes.code} msg=${moveRes.msg}`);
    console.log('   （可能已在知识库中，继续追加题目）');
  }

  // 2. 搜索更多题目追加进去
  console.log('\n🔍 追加更多公司题目...\n');
  const allRows: Record<string, any>[] = [];

  for (const target of MORE_TARGETS) {
    console.log(`   ${target.company} × ${target.role}`);
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

  // 3. 批量写入
  console.log(`\n📝 追加 ${allRows.length} 条到现有题库...`);
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
  console.log(`   本次追加: ${allRows.length} 条（原有75条，共约 ${75 + allRows.length} 条）`);
}

main().catch(console.error);
