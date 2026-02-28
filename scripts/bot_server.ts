/**
 * 飞书机器人服务器
 *
 * 功能：在群里发命令，机器人自动生成小红书帖子并回复
 *
 * 支持的命令（@机器人 或私聊直接发）：
 *   生成          → 随机生成综合帖子（存文档 + 回复链接）
 *   生成 面试      → 面试专题
 *   生成 简历      → 简历专题
 *   生成 心态/赛道/决策/行动  → 对应分类
 *   帮助          → 查看命令列表
 *
 * 配置步骤（见文末注释）
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/bot_server.ts
 *   npm run bot
 */

import * as http from 'http';
import { client } from '../src/client';
import { generatePost, incrementUsage, saveToFeishuDoc } from '../src/tip_generator';
import { CHANNELS } from '../src/channels';
import { startWorkflow, handleCardAction } from '../src/workflow';

const PORT = process.env.BOT_PORT ? parseInt(process.env.BOT_PORT) : 3000;
// 飞书开放平台 → 事件订阅 → Verification Token（可选，若配置了则做校验）
const VERIFICATION_TOKEN = process.env.FEISHU_VERIFICATION_TOKEN || '';

// ─── 消息发送 ──────────────────────────────────────────────────────

async function replyText(chatId: string, text: string) {
  return client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
  });
}

async function replyPost(chatId: string, title: string, docUrl: string, preview: string) {
  const content = JSON.stringify({
    zh_cn: {
      title: '📝 ' + title,
      content: [
        [{ tag: 'text', text: preview }],
        [{ tag: 'text', text: '\n\n查看完整帖子 👉 ' }, { tag: 'a', text: '飞书文档', href: docUrl }],
        [{ tag: 'text', text: '\n（在文档里复制全文即可发到小红书）' }],
      ],
    },
  });
  return client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: { receive_id: chatId, msg_type: 'post', content },
  });
}

// ─── 命令解析 ──────────────────────────────────────────────────────

const THEME_MAP: Record<string, string> = {
  '面试': '面试', '简历': '简历', '心态': '心态',
  '赛道': '赛道', '决策': '决策', '行动': '行动',
};

const TYPE_MAP: Record<string, string> = {
  '数据': '真实数据', '真实数据': '真实数据',
  '反常识': '反常识', '行动建议': '行动建议',
};

function parseCommand(text: string): { cmd: string; theme?: string; type?: string } | null {
  // 去掉 @机器人 前缀
  const cleaned = text.replace(/@\S+/g, '').trim();

  if (/^帮助|help$/i.test(cleaned)) return { cmd: 'help' };

  if (/^写文章|开始创作|创作/.test(cleaned)) return { cmd: 'write' };

  if (/^生成/.test(cleaned)) {
    const rest = cleaned.replace(/^生成\s*/, '');
    const theme = THEME_MAP[rest] || undefined;
    const type = TYPE_MAP[rest] || undefined;
    return { cmd: 'generate', theme, type };
  }

  // 直接发分类名也触发
  if (THEME_MAP[cleaned]) return { cmd: 'generate', theme: THEME_MAP[cleaned] };

  return null;
}

const HELP_TEXT = `📖 小红书帖子生成器

发以下消息触发：
• 生成 → 随机综合帖子
• 生成 面试 → 面试专题
• 生成 简历 → 简历专题
• 生成 心态/赛道/决策/行动 → 对应维度
• 生成 数据 → 仅用真实数据
• 帮助 → 显示此菜单`;

// ─── 处理消息事件 ──────────────────────────────────────────────────

async function handleMessage(event: any) {
  const msg = event.message;
  if (!msg) return;

  // 只处理文本消息
  if (msg.message_type !== 'text') return;

  let text = '';
  try {
    text = JSON.parse(msg.content).text || '';
  } catch {
    return;
  }

  const chatId: string = msg.chat_id;

  // 打印 chat_id，方便首次配置时记录到 .env
  console.log(`[Bot] chat_id: ${chatId} | text: ${text.slice(0, 30)}`);

  const parsed = parseCommand(text);
  if (!parsed) return;  // 不是命令，忽略

  console.log(`[Bot] 收到命令: ${JSON.stringify(parsed)} from chat: ${chatId}`);

  if (parsed.cmd === 'help') {
    await replyText(chatId, HELP_TEXT);
    return;
  }

  if (parsed.cmd === 'write') {
    try {
      await startWorkflow(chatId);
    } catch (err: any) {
      await replyText(chatId, `❌ 启动失败: ${err.message}`);
    }
    return;
  }

  if (parsed.cmd === 'generate') {
    await replyText(chatId, '⏳ 正在生成帖子，稍等...');

    try {
      const { post, selected } = await generatePost({
        theme: parsed.theme,
        type: parsed.type,
        count: 7,
      });

      // 更新使用次数
      await incrementUsage(selected);

      // 存飞书文档
      const dateStr = new Date().toLocaleDateString('zh-CN');
      const docTitle = `小红书草稿 · ${dateStr} · ${parsed.theme || '综合'}`;
      const docUrl = await saveToFeishuDoc(post, docTitle);

      // 取帖子前三行作预览
      const preview = post.split('\n\n').slice(0, 3).join('\n').slice(0, 200) + '...';

      await replyPost(chatId, docTitle, docUrl, preview);
      console.log(`[Bot] 已回复，文档: ${docUrl}`);
    } catch (err: any) {
      console.error(`[Bot] 生成失败:`, err.message);
      await replyText(chatId, `❌ 生成失败: ${err.message}`);
    }
  }
}

// ─── HTTP 服务器 ───────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  try {
    const body = await readBody(req);
    const data = JSON.parse(body);

    // ── /webhook/card：卡片按钮点击回调 ──────────────────────────
    if (req.url === '/webhook/card') {
      // 飞书卡片 URL 验证（首次配置）
      if (data.type === 'url_verification') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ challenge: data.challenge }));
        return;
      }
      const updatedCard = await handleCardAction(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedCard));
      return;
    }

    // ── /webhook/event：消息事件 ──────────────────────────────────
    if (req.url === '/webhook/event') {
      // 1. URL 验证（飞书首次配置时发送）
      if (data.type === 'url_verification') {
        if (VERIFICATION_TOKEN && data.token !== VERIFICATION_TOKEN) {
          res.writeHead(403);
          res.end('token mismatch');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ challenge: data.challenge }));
        console.log('[Bot] URL 验证通过 ✅');
        return;
      }

      // 2. 事件处理
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 0 }));

      const schema = data.schema;
      if (schema === '2.0') {
        const eventType = data.header?.event_type;
        if (eventType === 'im.message.receive_v1') {
          await handleMessage(data.event);
        }
      } else if (data.event?.type === 'message') {
        await handleMessage({ message: data.event });
      }
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  } catch (err: any) {
    console.error('[Bot] 处理请求失败:', err.message);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

// ─── 定时推送调度器 ────────────────────────────────────────────────

async function pushToChannel(key: string) {
  const ch = CHANNELS[key];
  console.log(`[Scheduler] 开始推送「${ch.name}」...`);
  // TODO: 根据 key 调用各自的推送逻辑
  // 'jobs'     → daily_job_tracker
  // 'insight'  → daily_industry_insight
  // 'interview'→ knowledge_push (面试)
  // 'strategy' → knowledge_push (战略)
  console.log(`[Scheduler] 「${ch.name}」推送占位，功能待接入`);
}

function schedulePush(key: string) {
  const ch = CHANNELS[key];
  if (!ch.enabled) {
    console.log(`[Scheduler] 「${ch.name}」未配置 chat_id，跳过调度`);
    return;
  }

  const now = new Date();
  const next = new Date();
  next.setHours(ch.pushHour, ch.pushMinute, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();
  const nextStr = next.toLocaleString('zh-CN', { hour12: false });
  console.log(`[Scheduler] 「${ch.name}」下次推送: ${nextStr}`);

  setTimeout(async () => {
    try {
      await pushToChannel(key);
    } catch (err: any) {
      console.error(`[Scheduler] 「${ch.name}」推送失败:`, err.message);
    }
    schedulePush(key); // 递归，每天同一时间触发
  }, delay);
}

server.listen(PORT, () => {
  console.log(`\n🤖 飞书机器人服务器已启动`);
  console.log(`   监听: http://localhost:${PORT}/webhook/event`);
  console.log(`\n📋 下一步：`);
  console.log(`   1. 用 localtunnel 暴露端口（另开终端）：`);
  console.log(`      npx localtunnel --port ${PORT}`);
  console.log(`   2. 复制生成的 URL，填到飞书开放平台：`);
  console.log(`      App > 事件订阅 > 请求地址 → <tunnel-url>/webhook/event`);
  console.log(`   3. 订阅事件：im.message.receive_v1`);
  console.log(`   4. 在群里 @机器人 发"生成"即可\n`);

  // 启动所有频道的定时调度
  Object.keys(CHANNELS).forEach(key => schedulePush(key));
});

/*
 * ─── 飞书开放平台配置步骤 ────────────────────────────────────────
 *
 * 1. 进入 https://open.feishu.cn/app/cli_a92832aa14b9dcef
 *
 * 2. 添加应用能力 → 机器人（如果还没启用）
 *
 * 3. 事件订阅
 *    - 请求 URL：https://<你的tunnel地址>/webhook/event
 *    - 订阅事件：搜索 "接收消息" → im.message.receive_v1
 *    - 保存后飞书会发一个 challenge 验证，服务器自动响应
 *
 * 4. 权限管理 → 确认开通：
 *    - im:message（读取消息）
 *    - im:message:send_as_bot（发送消息）
 *
 * 5. 把机器人加入你的群聊
 *    - 在群里 → 添加成员 → 搜索 App 名称
 *
 * 6. 发布版本（开发版本在本 tenant 内可直接用，无需发布）
 */
