/**
 * 行业洞察日报 — 搜索 + AI提炼 + 飞书推送
 *
 * 流程：
 *   1. Perplexity 搜索最新咨询/行业报告
 *   2. Claude API 提炼「3个结论 + 面试用法」
 *   3. 写入飞书 Bitable 存档
 *   4. 推送到「行业洞察群」
 *
 * 用法：
 *   npm run insight              # 手动触发一次
 *   npm run insight:init         # 首次建表
 *
 * 环境变量：
 *   PERPLEXITY_API_KEY           # 已有
 *   ANTHROPIC_API_KEY            # 用于 Claude 提炼
 *   CHAT_ID_INSIGHT              # 行业洞察群 chat_id
 *   INSIGHT_APP_TOKEN            # Bitable 表格 token（init 后填入）
 *   INSIGHT_TABLE_ID             # Bitable 表格 ID（init 后填入）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// 加载 .env
const envPath = path.resolve(__dirname, '..', '.env');
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

import { client } from '../src/client';
import { CHANNELS } from '../src/channels';

// ─── 配置 ─────────────────────────────────────────────────────────

const CONFIG = {
  APP_TOKEN: process.env.INSIGHT_APP_TOKEN || '',
  TABLE_ID: process.env.INSIGHT_TABLE_ID || '',
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

  QUERIES: [
    'McKinsey BCG Bain latest China industry report 2025 2026 key findings consumer retail technology',
    '麦肯锡 BCG 贝恩 最新中国行业报告 2025 2026 核心结论 消费 科技 金融 能源',
    'China business strategy consulting insights 2026 market trends key takeaways',
    '中国产业趋势 行业洞察 2025 2026 战略咨询 最新报告',
  ],
};

// ─── 类型 ─────────────────────────────────────────────────────────

interface RawInsight {
  title: string;
  summary: string;
  sourceUrl: string;
  date: string;
}

interface ProcessedInsight {
  title: string;
  conclusions: string[];   // 3个核心结论
  interviewTips: string[]; // 面试怎么用
  sourceUrl: string;
  date: string;
}

// ─── Perplexity 搜索 ──────────────────────────────────────────────

async function searchPerplexity(query: string): Promise<{ text: string; urls: string[] }> {
  const apiKey = CONFIG.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('缺少 PERPLEXITY_API_KEY');

  const body = JSON.stringify({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `你是行业研究助手。搜索最新的咨询公司报告和行业洞察，返回 JSON 数组。
每条格式：{"title":"报告/文章标题","summary":"核心内容摘要（200字以内）","url":"原文链接或空字符串"}
返回5-8条，只返回 JSON 数组，不要其他内容。`,
      },
      { role: 'user', content: query },
    ],
    search_recency_filter: 'month',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.perplexity.ai',
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) { reject(new Error(json.error.message)); return; }
            const text = json.choices?.[0]?.message?.content || '';
            const urls: string[] = json.citations || [];
            resolve({ text, urls });
          } catch (e: any) {
            reject(new Error(`Perplexity 解析失败: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseInsights(text: string, fallbackUrls: string[]): RawInsight[] {
  const today = new Date().toISOString().slice(0, 10);
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    const arr = JSON.parse(match[0]);
    return (Array.isArray(arr) ? arr : [])
      .filter((x: any) => x.title && x.summary)
      .map((x: any, i: number) => ({
        title: String(x.title).slice(0, 100),
        summary: String(x.summary).slice(0, 500),
        sourceUrl: String(x.url || fallbackUrls[i] || ''),
        date: today,
      }));
  } catch {
    return [];
  }
}

// ─── Claude 提炼 ──────────────────────────────────────────────────

async function processWithClaude(raw: RawInsight): Promise<ProcessedInsight> {
  const apiKey = CONFIG.ANTHROPIC_API_KEY;

  // 若无 Claude key，返回简单格式
  if (!apiKey) {
    console.warn('[Claude] 未配置 ANTHROPIC_API_KEY，跳过 AI 提炼');
    return {
      title: raw.title,
      conclusions: [raw.summary],
      interviewTips: ['（待配置 Claude API 后自动生成面试应用建议）'],
      sourceUrl: raw.sourceUrl,
      date: raw.date,
    };
  }

  const prompt = `以下是一篇行业报告的摘要，请帮我：
1. 提炼3个核心结论（每条30字以内，用①②③标注）
2. 给出3条面试应用建议（说明这些结论在 case interview 或行为面试中如何使用）

报告标题：${raw.title}
摘要内容：${raw.summary}

严格按以下 JSON 格式返回，不要其他内容：
{
  "conclusions": ["①...", "②...", "③..."],
  "interviewTips": ["Case Interview: ...", "Profitability/Market Entry: ...", "Behavioral: ..."]
}`;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const text = json.content?.[0]?.text || '';
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              resolve({
                title: raw.title,
                conclusions: parsed.conclusions || [],
                interviewTips: parsed.interviewTips || [],
                sourceUrl: raw.sourceUrl,
                date: raw.date,
              });
            } else {
              throw new Error('Claude 返回格式异常');
            }
          } catch (e: any) {
            reject(new Error(`Claude 解析失败: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── 飞书推送 ─────────────────────────────────────────────────────

async function pushToFeishuGroup(insight: ProcessedInsight) {
  const chatId = CHANNELS.insight.chatId;
  if (!chatId) {
    console.log('[Push] 未配置 CHAT_ID_INSIGHT，跳过推送');
    return;
  }

  const dateStr = new Date().toLocaleDateString('zh-CN');
  const conclusionsText = insight.conclusions.join('\n');
  const tipsText = insight.interviewTips.map(t => `• ${t}`).join('\n');
  const linkLine = insight.sourceUrl ? `\n🔗 ${insight.sourceUrl}` : '';

  const content = JSON.stringify({
    zh_cn: {
      title: `📊 行业洞察 · ${dateStr}`,
      content: [
        [{ tag: 'text', text: `【${insight.title}】` }],
        [{ tag: 'text', text: '\n📌 核心结论\n' + conclusionsText }],
        [{ tag: 'text', text: '\n💼 面试怎么用\n' + tipsText }],
        ...(insight.sourceUrl ? [[{ tag: 'a', text: '查看原文', href: insight.sourceUrl }]] : []),
      ],
    },
  });

  await client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: { receive_id: chatId, msg_type: 'post', content },
  });

  console.log(`[Push] 已推送到行业洞察群: ${insight.title}`);
}

// ─── Bitable 存档 ─────────────────────────────────────────────────

async function saveToTable(insight: ProcessedInsight, appToken: string, tableId: string) {
  const res = await client.bitable.appTableRecord.create({
    path: { app_token: appToken, table_id: tableId },
    data: {
      fields: {
        '标题': insight.title,
        '核心结论': insight.conclusions.join('\n'),
        '面试应用': insight.interviewTips.join('\n'),
        '来源链接': insight.sourceUrl,
        '日期': new Date(insight.date).getTime(),
        '状态': '已推送',
      },
    },
  });
  if (res.code !== 0) console.error(`[Bitable] 写入失败: ${res.msg}`);
}

// ─── 建表 ─────────────────────────────────────────────────────────

async function createTable(): Promise<{ appToken: string; tableId: string }> {
  const appRes = await (client.bitable as any).app.create({
    data: { name: '行业洞察知识库 · Insight' },
  });
  if (appRes.code !== 0) throw new Error(`建表失败: ${appRes.msg}`);

  const appToken = appRes.data?.app?.app_token!;
  const tableListRes = await client.bitable.appTable.list({ path: { app_token: appToken } });
  const tableId = tableListRes.data?.items?.[0]?.table_id!;

  // 字段
  const fields = [
    { field_name: '标题',   type: 1 },
    { field_name: '核心结论', type: 1 },
    { field_name: '面试应用', type: 1 },
    { field_name: '来源链接', type: 1 },
    { field_name: '日期',   type: 5 },
    { field_name: '状态',   type: 3 },
  ];
  for (const f of fields) {
    await client.bitable.appTableField.create({
      path: { app_token: appToken, table_id: tableId },
      data: f,
    });
  }

  console.log(`✅ 建表完成: https://hcn2vc1r2jus.feishu.cn/base/${appToken}`);
  console.log(`   请将以下内容写入 .env：`);
  console.log(`   INSIGHT_APP_TOKEN=${appToken}`);
  console.log(`   INSIGHT_TABLE_ID=${tableId}`);

  return { appToken, tableId };
}

// ─── 主流程 ───────────────────────────────────────────────────────

export async function runInsight() {
  const isInit = process.argv.includes('--init');
  const today = new Date().toISOString().slice(0, 10);
  console.log(`\n📊 行业洞察日报 · ${today}\n`);

  let appToken = CONFIG.APP_TOKEN;
  let tableId = CONFIG.TABLE_ID;

  if (isInit || !appToken || !tableId) {
    ({ appToken, tableId } = await createTable());
    if (isInit) return;
  }

  // 搜索
  let allRaw: RawInsight[] = [];
  for (let i = 0; i < CONFIG.QUERIES.length; i++) {
    const q = CONFIG.QUERIES[i];
    console.log(`[Search ${i + 1}/${CONFIG.QUERIES.length}] ${q.slice(0, 40)}...`);
    try {
      const { text, urls } = await searchPerplexity(q);
      const items = parseInsights(text, urls);
      console.log(`  → ${items.length} 条`);
      allRaw.push(...items);
    } catch (err: any) {
      console.error(`  ⚠ 搜索失败: ${err.message}`);
    }
    if (i < CONFIG.QUERIES.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  if (allRaw.length === 0) {
    console.log('没有搜到内容，结束');
    return;
  }

  // 取第一条做 AI 提炼 + 推送（每天推1条精华）
  const picked = allRaw[0];
  console.log(`\n[Claude] 提炼: ${picked.title}`);
  const processed = await processWithClaude(picked);

  // 推送
  await pushToFeishuGroup(processed);

  // 存档（所有条目）
  if (appToken && tableId) {
    for (const raw of allRaw) {
      try {
        const p = raw === picked ? processed : await processWithClaude(raw);
        await saveToTable(p, appToken, tableId);
      } catch (err: any) {
        console.error(`[Bitable] 存档失败: ${err.message}`);
      }
    }
    console.log(`\n✅ 共存档 ${allRaw.length} 条`);
  }
}

// 直接运行时执行
if (require.main === module) {
  runInsight().catch(console.error);
}
