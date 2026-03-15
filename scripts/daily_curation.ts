/**
 * 每日内容精选 — 搜索5条优质链接推送到个人会话
 *
 * 流程：
 *   1. Perplexity 搜索咨询/面试/战略优质内容
 *   2. 整理成带编号的清单推给你
 *   3. 你回复数字 → bot 调 AI 加工
 *
 * 用法：
 *   npm run curation          # 手动推送一次
 *
 * 环境变量：
 *   PERPLEXITY_API_KEY        # 已有
 *   CHAT_ID_CURATION          # 你的个人会话 chat_id（见下方说明）
 *
 * 如何获取个人会话 chat_id：
 *   启动 bot → 给机器人发任意私信 → 终端会打印 chat_id
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
import { saveState, CurationItem } from '../src/curation_state';

const CHAT_ID = process.env.CHAT_ID_CURATION || '';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';

// ─── 搜索 queries ──────────────────────────────────────────────────
// 每次随机选3个，保持内容多样性
const QUERY_POOL = [
  {
    q: 'site:reddit.com/r/consulting OR site:reddit.com/r/caseinterview best posts this week consulting interview tips case frameworks',
    category: 'interview',
  },
  {
    q: 'McKinsey BCG Bain new article insight 2025 2026 business strategy China market',
    category: 'insight',
  },
  {
    q: 'consulting career advice management consultant interview experience 2025 Reddit LinkedIn',
    category: 'interview',
  },
  {
    q: '麦肯锡 BCG 最新报告 中国市场 战略分析 2026',
    category: 'strategy',
  },
  {
    q: 'MBA consulting recruiting tips behavioral interview STAR method real examples 2025',
    category: 'interview',
  },
  {
    q: 'business strategy framework analysis case study consulting toolkit 2025',
    category: 'strategy',
  },
  {
    q: 'China industry trends retail consumer technology energy 2026 consulting insights',
    category: 'insight',
  },
];

// ─── Perplexity 搜索 ──────────────────────────────────────────────

async function searchLinks(query: string, category: string): Promise<CurationItem[]> {
  if (!PERPLEXITY_API_KEY) throw new Error('缺少 PERPLEXITY_API_KEY');

  const body = JSON.stringify({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `你是内容发现助手。找出2-3篇高质量的文章或帖子，返回 JSON 数组。
每条格式：{"title":"标题","summary":"用中文写一句话说这篇文章的核心内容（30字以内）","url":"链接"}
只返回 JSON 数组，不要其他内容。优先选原创经验分享、数据报告、实用框架类内容。`,
      },
      { role: 'user', content: query },
    ],
    search_recency_filter: 'week',
  });

  return new Promise((resolve, reject) => {
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
            const citations: string[] = json.citations || [];
            const match = text.replace(/```json\s*/gi, '').replace(/```/g, '').match(/\[[\s\S]*\]/);
            if (!match) { resolve([]); return; }
            const arr = JSON.parse(match[0]);
            const items: CurationItem[] = (Array.isArray(arr) ? arr : [])
              .filter((x: any) => x.title && x.summary)
              .map((x: any, i: number) => ({
                index: 0, // 后面统一编号
                title: String(x.title).slice(0, 120),
                summary: String(x.summary).slice(0, 100),
                url: String(x.url || citations[i] || ''),
                category,
                processed: false,
                savedToLibrary: false,
              }));
            resolve(items);
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

// ─── 构建推送消息 ──────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  interview: '🎯',
  strategy: '📐',
  insight: '📊',
};

function buildMessage(items: CurationItem[], dateStr: string): string {
  const lines = [
    `📚 今日待加工 · ${dateStr}\n`,
  ];

  for (const item of items) {
    const emoji = CATEGORY_EMOJI[item.category] || '📄';
    lines.push(`${item.index}️⃣ ${emoji} ${item.title}`);
    lines.push(`   → ${item.summary}`);
    if (item.url) lines.push(`   🔗 ${item.url}`);
    lines.push('');
  }

  lines.push('─────────────');
  lines.push('回复 数字(1/2/3...) 开始加工');
  lines.push('回复「跳过」重新搜一批');

  return lines.join('\n');
}

// ─── 发送消息 ─────────────────────────────────────────────────────

async function sendMessage(chatId: string, text: string) {
  return client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
  });
}

// ─── 主流程 ───────────────────────────────────────────────────────

export async function runDailyCuration(chatIdOverride?: string) {
  const chatId = chatIdOverride || CHAT_ID;
  if (!chatId) {
    console.log('[Curation] 未配置 CHAT_ID_CURATION，跳过');
    console.log('  获取方式：启动 bot → 给机器人发私信 → 终端打印 chat_id');
    return;
  }

  const today = new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  const todayISO = new Date().toISOString().slice(0, 10);
  console.log(`\n📚 每日精选 · ${today}\n`);

  // 随机选3个 query
  const shuffled = [...QUERY_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  let allItems: CurationItem[] = [];

  for (const { q, category } of shuffled) {
    console.log(`[Search] ${q.slice(0, 50)}...`);
    try {
      const items = await searchLinks(q, category);
      console.log(`  → ${items.length} 条`);
      allItems.push(...items);
    } catch (err: any) {
      console.error(`  ⚠ ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // 去重 + 限制5条
  const seen = new Set<string>();
  allItems = allItems.filter(item => {
    const key = item.title.slice(0, 30).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);

  if (allItems.length === 0) {
    await sendMessage(chatId, '今天没搜到好内容，明天再试 🙁');
    return;
  }

  // 编号
  allItems.forEach((item, i) => (item.index = i + 1));

  // 保存状态
  saveState({ date: todayISO, items: allItems, chatId });

  // 推送
  const msg = buildMessage(allItems, today);
  await sendMessage(chatId, msg);
  console.log(`\n✅ 已推送 ${allItems.length} 条到会话`);
}

// 直接运行时执行
if (require.main === module) {
  runDailyCuration().catch(console.error);
}
