/**
 * 任务管理 Bot 服务器
 *
 * 功能：
 *   - 命令式管理任务（添加、完成、搁置、查看今日清单）
 *   - 随手发消息 → AI 自动判断是任务还是灵感，存入多维表格
 *   - 每天 09:00 推送今日待办，18:00 推送 AI 日报
 *   - 支持个人私聊 + 多团队群推送
 *
 * 首次运行（创建多维表格）：
 *   npm run task:init
 *
 * 日常运行：
 *   npm run task
 *
 * 需要在 .env 配置（见文末注释）：
 *   ANTHROPIC_API_KEY, TASK_APP_TOKEN, TASK_TABLE_ID
 *   TASK_USER_OPEN_ID, TASK_CHAT_ID_PERSONAL
 *   TASK_CHAT_ID_TEAM_A, TASK_TEAM_A_NAME（可选，支持多个团队）
 */

// 手动加载 .env
import * as fs from 'fs';
import * as path from 'path';
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

import * as http from 'http';
import { client } from '../src/client';
import {
  TASK_CONFIG,
  initTaskTable,
  getTodayTasks,
  getIdeas,
  addTask,
  updateTaskStatus,
  getDailySummary,
  aiClassify,
  generateDailyReport,
  TaskPriority,
} from '../src/task_store';

const PORT = process.env.TASK_BOT_PORT ? parseInt(process.env.TASK_BOT_PORT) : 3001;
const VERIFICATION_TOKEN = process.env.FEISHU_VERIFICATION_TOKEN || '';

// ─── 多群配置 ─────────────────────────────────────────────────────

interface TeamChannel {
  chatId: string;
  name: string;   // 对应 task_store 里的 "来源" 字段值
  label: string;  // 显示名
}

function loadTeamChannels(): TeamChannel[] {
  const channels: TeamChannel[] = [];
  // 个人群
  if (process.env.TASK_CHAT_ID_PERSONAL) {
    channels.push({
      chatId: process.env.TASK_CHAT_ID_PERSONAL,
      name: '个人',
      label: '个人',
    });
  }
  // 动态加载 TASK_CHAT_ID_TEAM_X / TASK_TEAM_X_NAME（X = A-Z 或 1-9）
  for (const key of Object.keys(process.env)) {
    const match = key.match(/^TASK_CHAT_ID_TEAM_(\w+)$/);
    if (match) {
      const suffix = match[1];
      const chatId = process.env[key] || '';
      const nameKey = `TASK_TEAM_${suffix}_NAME`;
      const label = process.env[nameKey] || `团队${suffix}`;
      if (chatId) {
        channels.push({ chatId, name: label, label });
      }
    }
  }
  return channels;
}

const TEAM_CHANNELS = loadTeamChannels();

// ─── 消息发送 ─────────────────────────────────────────────────────

async function sendToUser(text: string) {
  const openId = process.env.TASK_USER_OPEN_ID;
  if (!openId) return;
  return client.im.message.create({
    params: { receive_id_type: 'open_id' },
    data: { receive_id: openId, msg_type: 'text', content: JSON.stringify({ text }) },
  });
}

async function sendToChat(chatId: string, text: string) {
  return client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: { receive_id: chatId, msg_type: 'text', content: JSON.stringify({ text }) },
  });
}

async function reply(chatId: string, openId: string | null, text: string) {
  // 私聊：用 open_id 回复；群里：用 chat_id 回复
  if (openId && chatId === openId) {
    await sendToUser(text);
  } else {
    await sendToChat(chatId, text);
  }
}

// ─── 格式化今日清单 ───────────────────────────────────────────────

function formatTodayList(
  tasks: Awaited<ReturnType<typeof getTodayTasks>>,
  label: string
): string {
  const dateStr = new Date().toLocaleDateString('zh-CN');
  const lines: string[] = [`📋 今日任务 · ${dateStr}${label ? ' · ' + label : ''}`];

  const fmt = (list: typeof tasks.pending, emoji: string, title: string) => {
    if (list.length === 0) return;
    lines.push(`\n${emoji} ${title} (${list.length})`);
    list.forEach((t, i) => {
      const pri = t.priority !== '中' ? ` [${t.priority}]` : '';
      lines.push(`  ${i + 1}. ${t.name}${pri}`);
    });
  };

  fmt(tasks.pending,    '⏳', '待做');
  fmt(tasks.inProgress, '🔄', '进行中');
  fmt(tasks.done,       '✅', '已完成');

  if (tasks.pending.length + tasks.inProgress.length + tasks.done.length === 0) {
    lines.push('\n今天还没有任务，发"添加 任务名"新增');
  } else {
    lines.push('\n发"完成 任务名"标记完成 | 随便发什么我帮你记');
  }

  return lines.join('\n');
}

// ─── 命令解析 ─────────────────────────────────────────────────────

const PRIORITY_MAP: Record<string, TaskPriority> = {
  '高': '高', '紧急': '高', '重要': '高',
  '低': '低', '次要': '低',
  '中': '中',
};

interface ParsedCmd {
  cmd: 'today' | 'ideas' | 'add' | 'status' | 'report' | 'help' | 'auto';
  arg?: string;
  priority?: TaskPriority;
  status?: '完成' | '进行中' | '搁置';
}

function parseCommand(raw: string): ParsedCmd {
  const text = raw.replace(/@\S+/g, '').trim();

  if (/^(今天|任务|todo)$/i.test(text)) return { cmd: 'today' };
  if (/^(灵感|想法|ideas?)$/i.test(text)) return { cmd: 'ideas' };
  if (/^(日报|总结|report)$/i.test(text)) return { cmd: 'report' };
  if (/^(帮助|help|\?)$/i.test(text)) return { cmd: 'help' };

  // 完成 xxx
  const doneMatch = text.match(/^完成\s+(.+)/);
  if (doneMatch) return { cmd: 'status', arg: doneMatch[1], status: '完成' };

  // 进行中 xxx
  const wipMatch = text.match(/^进行中\s+(.+)/);
  if (wipMatch) return { cmd: 'status', arg: wipMatch[1], status: '进行中' };

  // 搁置 xxx
  const holdMatch = text.match(/^搁置\s+(.+)/);
  if (holdMatch) return { cmd: 'status', arg: holdMatch[1], status: '搁置' };

  // 添加 [优先级] xxx
  const addMatch = text.match(/^添加\s+(.+)/);
  if (addMatch) {
    const rest = addMatch[1].trim();
    const priMatch = rest.match(/^(高|低|中|紧急|重要|次要)\s+(.+)/);
    if (priMatch) {
      return { cmd: 'add', arg: priMatch[2], priority: PRIORITY_MAP[priMatch[1]] };
    }
    return { cmd: 'add', arg: rest };
  }

  // 其他：交给 AI 自动分类
  return { cmd: 'auto', arg: text };
}

const HELP_TEXT = `📖 任务管理 Bot

命令：
• 今天 → 今日任务清单
• 添加 xxx → 新增任务
• 添加 高 xxx → 高优先级任务
• 完成 xxx → 标记完成
• 进行中 xxx → 标记进行中
• 搁置 xxx → 搁置任务
• 灵感 → 查看所有灵感记录
• 日报 → 立即生成 AI 日报
• 帮助 → 显示此菜单

💡 直接发任何想法，我来判断是任务还是灵感`;

// ─── 处理消息 ─────────────────────────────────────────────────────

// 简单去重防重复处理（飞书有时会重发）
const processedIds = new Set<string>();

async function handleMessage(event: any) {
  const msg = event.message;
  if (!msg || msg.message_type !== 'text') return;

  // 去重
  const msgId: string = msg.message_id || '';
  if (msgId && processedIds.has(msgId)) return;
  if (msgId) {
    processedIds.add(msgId);
    // 10 分钟后清理
    setTimeout(() => processedIds.delete(msgId), 10 * 60 * 1000);
  }

  let text = '';
  try { text = JSON.parse(msg.content).text || ''; } catch { return; }

  const chatId: string = msg.chat_id;
  const senderOpenId: string = event.sender?.sender_id?.open_id || '';
  console.log(`[TaskBot] chat:${chatId} | text: ${text.slice(0, 40)}`);

  // 判断来源（哪个群或私聊）
  const channel = TEAM_CHANNELS.find(c => c.chatId === chatId);
  const source = channel ? channel.name : '个人';

  const parsed = parseCommand(text);

  const replyTo = async (t: string) => {
    await sendToChat(chatId, t);
  };

  try {
    if (parsed.cmd === 'help') {
      await replyTo(HELP_TEXT);

    } else if (parsed.cmd === 'today') {
      const tasks = await getTodayTasks(source === '个人' ? undefined : source);
      await replyTo(formatTodayList(tasks, source === '个人' ? '' : source));

    } else if (parsed.cmd === 'ideas') {
      const ideas = await getIdeas(source === '个人' ? undefined : source);
      if (ideas.length === 0) {
        await replyTo('💡 还没有灵感记录，随便发什么我来帮你存');
      } else {
        const lines = [`💡 灵感记录（${ideas.length} 条）\n`];
        ideas.slice(0, 20).forEach((t, i) => {
          lines.push(`${i + 1}. ${t.name}（${t.date}）`);
        });
        await replyTo(lines.join('\n'));
      }

    } else if (parsed.cmd === 'add') {
      const name = parsed.arg || '';
      if (!name) { await replyTo('请告诉我任务名，例如：添加 写周报'); return; }
      await addTask(name, { priority: parsed.priority, source });
      const pri = parsed.priority ? ` [${parsed.priority}]` : '';
      await replyTo(`✅ 已添加任务：${name}${pri}`);

    } else if (parsed.cmd === 'status') {
      const name = parsed.arg || '';
      if (!name) { await replyTo('请告诉我任务名，例如：完成 写周报'); return; }
      const updated = await updateTaskStatus(name, parsed.status!, source === '个人' ? undefined : source);
      if (!updated) {
        await replyTo(`❌ 没找到任务"${name}"，请检查名称`);
      } else {
        const emoji = { '完成': '✅', '进行中': '🔄', '搁置': '⏸' }[parsed.status!];
        await replyTo(`${emoji} 已标记为${parsed.status}：${updated.name}`);
      }

    } else if (parsed.cmd === 'report') {
      await replyTo('⏳ 生成日报中...');
      const summary = await getDailySummary(source === '个人' ? undefined : source);
      const report = await generateDailyReport(summary);
      await replyTo(report);

    } else if (parsed.cmd === 'auto') {
      // AI 自动分类
      const rawText = parsed.arg || '';
      if (!rawText) return;
      await replyTo('🤔 分析中...');
      const result = await aiClassify(rawText);
      await addTask(result.name, {
        type: result.type,
        priority: result.priority,
        source,
      });
      if (result.type === '任务') {
        const pri = result.priority !== '中' ? ` [${result.priority}]` : '';
        await replyTo(`✅ 已存为任务${pri}：${result.name}\n（发"完成 ${result.name}"标记完成）`);
      } else {
        await replyTo(`💡 已存为灵感：${result.name}\n（发"添加 ${result.name}"可转为任务）`);
      }
    }
  } catch (err: any) {
    console.error('[TaskBot] 处理失败:', err.message);
    await replyTo(`❌ 出错了：${err.message}`);
  }
}

// ─── 定时推送 ─────────────────────────────────────────────────────

let lastMorningPush = '';
let lastEveningPush = '';

async function scheduledPush() {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);

  // 09:00 早间推送
  if (hhmm === '09:00' && lastMorningPush !== today) {
    lastMorningPush = today;
    console.log('[TaskBot] 触发早间推送');

    // 个人私聊
    if (process.env.TASK_USER_OPEN_ID) {
      try {
        const tasks = await getTodayTasks();
        await sendToUser(formatTodayList(tasks, ''));
      } catch (e: any) { console.error('[TaskBot] 私聊推送失败:', e.message); }
    }

    // 各团队群
    for (const ch of TEAM_CHANNELS) {
      if (!ch.chatId) continue;
      try {
        const tasks = await getTodayTasks(ch.name);
        await sendToChat(ch.chatId, formatTodayList(tasks, ch.label));
      } catch (e: any) { console.error(`[TaskBot] 群推送失败 ${ch.label}:`, e.message); }
    }
  }

  // 18:00 晚间日报
  if (hhmm === '18:00' && lastEveningPush !== today) {
    lastEveningPush = today;
    console.log('[TaskBot] 触发晚间日报');

    // 个人私聊
    if (process.env.TASK_USER_OPEN_ID) {
      try {
        const summary = await getDailySummary();
        const report = await generateDailyReport(summary);
        await sendToUser(report);
      } catch (e: any) { console.error('[TaskBot] 私聊日报失败:', e.message); }
    }

    // 各团队群
    for (const ch of TEAM_CHANNELS) {
      if (!ch.chatId) continue;
      try {
        const summary = await getDailySummary(ch.name);
        const report = await generateDailyReport(summary);
        await sendToChat(ch.chatId, report);
      } catch (e: any) { console.error(`[TaskBot] 群日报失败 ${ch.label}:`, e.message); }
    }
  }
}

// ─── HTTP 服务器 ──────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook/event') {
    res.writeHead(404); res.end('Not Found'); return;
  }

  try {
    const body = await readBody(req);
    const data = JSON.parse(body);

    // URL 验证
    if (data.type === 'url_verification') {
      if (VERIFICATION_TOKEN && data.token !== VERIFICATION_TOKEN) {
        res.writeHead(403); res.end('token mismatch'); return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ challenge: data.challenge }));
      console.log('[TaskBot] URL 验证通过 ✅');
      return;
    }

    // 立即响应，异步处理
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 0 }));

    const schema = data.schema;
    if (schema === '2.0') {
      if (data.header?.event_type === 'im.message.receive_v1') {
        await handleMessage(data.event);
      }
    } else if (data.event?.type === 'message') {
      await handleMessage({ message: data.event });
    }
  } catch (err: any) {
    console.error('[TaskBot] 请求处理失败:', err.message);
    if (!res.headersSent) { res.writeHead(500); res.end('Error'); }
  }
});

// ─── 启动 ────────────────────────────────────────────────────────

async function main() {
  // --init 模式：创建多维表格
  if (process.argv.includes('--init')) {
    await initTaskTable();
    process.exit(0);
  }

  // 检查必要配置
  if (!TASK_CONFIG.APP_TOKEN || !TASK_CONFIG.TABLE_ID) {
    console.error('❌ 缺少 TASK_APP_TOKEN 或 TASK_TABLE_ID');
    console.error('   请先运行 npm run task:init 创建多维表格');
    process.exit(1);
  }

  // 启动 HTTP 服务
  server.listen(PORT, () => {
    console.log(`\n🤖 任务管理 Bot 已启动`);
    console.log(`   监听: http://localhost:${PORT}/webhook/event`);
    console.log(`\n📋 已配置：`);
    console.log(`   个人私聊推送: ${process.env.TASK_USER_OPEN_ID ? '✅' : '❌（未配置 TASK_USER_OPEN_ID）'}`);
    console.log(`   AI 分类/日报: ${TASK_CONFIG.DEEPSEEK_API_KEY ? '✅' : '⚠️（未配置 DEEPSEEK_API_KEY，使用降级逻辑）'}`);
    for (const ch of TEAM_CHANNELS) {
      console.log(`   团队群 [${ch.label}]: ${ch.chatId}`);
    }
    console.log(`\n📡 下一步：`);
    console.log(`   1. 另开终端：npx localtunnel --port ${PORT}`);
    console.log(`   2. 复制 URL 填到飞书开放平台 → 事件订阅 → 请求地址：<tunnel-url>/webhook/event`);
    console.log(`   3. 订阅事件：im.message.receive_v1`);
    console.log(`   4. 在飞书给 Bot 发"帮助"测试\n`);
  });

  // 每分钟检查定时推送
  setInterval(scheduledPush, 60 * 1000);
}

main().catch(console.error);

/*
 * ─── .env 配置参考 ───────────────────────────────────────────────
 *
 * # DeepSeek AI（用于自动分类消息和生成日报）
 * DEEPSEEK_API_KEY=sk-xxx
 *
 * # 多维表格（npm run task:init 后自动打印）
 * TASK_APP_TOKEN=xxx
 * TASK_TABLE_ID=xxx
 *
 * # 推送目标
 * TASK_USER_OPEN_ID=ou_xxx          # 个人 open_id，私聊推送
 * TASK_CHAT_ID_PERSONAL=oc_xxx      # 个人群/助记群（可选）
 *
 * # 团队群（每个团队加一组，TEAM_X 中 X 可以是任意字母或数字）
 * TASK_CHAT_ID_TEAM_A=oc_xxx
 * TASK_TEAM_A_NAME=产品团队          # 群显示名，也是"来源"字段的值
 * TASK_CHAT_ID_TEAM_B=oc_xxx
 * TASK_TEAM_B_NAME=研发团队
 *
 * # Bot 端口（默认 3001，与现有 bot_server 的 3000 区分）
 * TASK_BOT_PORT=3001
 */
