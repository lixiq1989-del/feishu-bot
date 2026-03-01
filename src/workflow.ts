/**
 * 内容创作工作流状态机
 *
 * 步骤：
 *   start → 选方向 → 选选题 → 确认大纲 → 写作 → done
 *
 * 每个群维护一个 session（Map key = chatId）。
 * 卡片按钮点击 → handleCardAction() → 推进到下一步。
 */

import * as https from 'https';
import {
  sendCard,
  buildLoadingCard,
  buildDirectionCard,
  buildTopicChoiceCard,
  buildOutlineCard,
  buildDoneCard,
} from './card';
import { saveToFeishuDoc } from './tip_generator';

// ─── 类型 ────────────────────────────────────────────────────────

type WorkflowStep = 'direction' | 'topic' | 'outline' | 'writing' | 'done';

interface WorkflowSession {
  chatId: string;
  step: WorkflowStep;
  direction?: string;
  topics?: string[];
  selectedTopic?: string;
  outline?: string;
}

// 每个群一个 session
const sessions = new Map<string, WorkflowSession>();

// ─── 启动工作流 ───────────────────────────────────────────────────

export async function startWorkflow(chatId: string): Promise<void> {
  sessions.set(chatId, { chatId, step: 'direction' });
  await sendCard(chatId, buildDirectionCard());
}

// ─── 处理卡片按钮点击 ─────────────────────────────────────────────

/**
 * 飞书卡片 callback payload 关键字段：
 *   open_chat_id  - 群 ID
 *   action.value  - 按钮上挂的 value 对象
 *
 * 返回值：给飞书的卡片更新内容（立即更新原卡片为「处理中」）
 */
export async function handleCardAction(payload: any): Promise<object> {
  const chatId: string = payload.open_chat_id;
  const value: Record<string, string> = payload.action?.value || {};
  const action = value.action;

  if (!chatId || !action) return {};

  // 立即更新卡片为「处理中」，避免飞书超时
  const loadingCard = buildLoadingCard('处理中，稍等...');

  // 异步执行实际逻辑，不阻塞响应
  setImmediate(() => processAction(chatId, action, value).catch(err => {
    console.error('[Workflow] 处理失败:', err.message);
    sendCard(chatId, buildLoadingCard(`❌ 出错了: ${err.message}`));
  }));

  return loadingCard;
}

async function processAction(
  chatId: string,
  action: string,
  value: Record<string, string>
): Promise<void> {
  switch (action) {
    case 'select_direction': {
      const direction = value.direction;
      sessions.set(chatId, { chatId, step: 'topic', direction });
      await sendCard(chatId, buildLoadingCard(`正在为「${direction}」生成选题...`));
      const topics = await generateTopics(direction);
      sessions.get(chatId)!.topics = topics;
      await sendCard(chatId, buildTopicChoiceCard(direction, topics));
      break;
    }

    case 'regenerate_topics': {
      const direction = value.direction;
      await sendCard(chatId, buildLoadingCard(`重新生成「${direction}」选题...`));
      const topics = await generateTopics(direction);
      if (sessions.has(chatId)) sessions.get(chatId)!.topics = topics;
      await sendCard(chatId, buildTopicChoiceCard(direction, topics));
      break;
    }

    case 'select_topic': {
      const topic = value.topic;
      const session = sessions.get(chatId);
      if (session) { session.step = 'outline'; session.selectedTopic = topic; }
      await sendCard(chatId, buildLoadingCard(`正在为「${topic}」生成大纲...`));
      const outline = await generateOutline(topic);
      if (session) session.outline = outline;
      await sendCard(chatId, buildOutlineCard(topic, outline));
      break;
    }

    case 'regenerate_outline': {
      const topic = value.topic;
      await sendCard(chatId, buildLoadingCard(`重新生成「${topic}」大纲...`));
      const outline = await generateOutline(topic);
      const session = sessions.get(chatId);
      if (session) session.outline = outline;
      await sendCard(chatId, buildOutlineCard(topic, outline));
      break;
    }

    case 'confirm_outline': {
      const topic = value.topic;
      const outline = value.outline;
      const session = sessions.get(chatId);
      if (session) session.step = 'writing';
      await sendCard(chatId, buildLoadingCard(`正在写作「${topic}」，大约需要 30 秒...`));
      const article = await generateArticle(topic, outline);
      const dateStr = new Date().toLocaleDateString('zh-CN');
      const docTitle = `${topic} · ${dateStr}`;
      const docUrl = await saveToFeishuDoc(article, docTitle);
      const preview = article.split('\n\n').slice(0, 2).join('\n').slice(0, 150) + '...';
      if (session) session.step = 'done';
      await sendCard(chatId, buildDoneCard(topic, docUrl, preview));
      break;
    }

    case 'back_to_direction': {
      sessions.set(chatId, { chatId, step: 'direction' });
      await sendCard(chatId, buildDirectionCard());
      break;
    }
  }
}

// ─── DeepSeek API 调用 ───────────────────────────────────────────

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

async function callClaude(prompt: string, maxTokens = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const req = https.request({
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) { reject(new Error(json.error.message)); return; }
          resolve(json.choices?.[0]?.message?.content || '');
        } catch (e: any) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateTopics(direction: string): Promise<string[]> {
  const text = await callClaude(
    `你是一个内容策划专家。针对「${direction}」方向，生成 3 个适合在职场社交媒体发布的选题标题。
要求：
- 每个标题独占一行，前面加序号"1. 2. 3."
- 标题要有吸引力，能引发职场人共鸣
- 不超过 25 字
- 只输出 3 个标题，不要其他内容`,
    300
  );
  return text
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function generateOutline(topic: string): Promise<string> {
  return callClaude(
    `你是一个内容策划专家。为以下选题生成一个文章大纲：
选题：${topic}

要求：
- 3-5 个章节
- 每个章节一行，用"## "开头
- 每章节后面加 1 句简短说明（括号内）
- 只输出大纲，不要其他内容`,
    400
  );
}

async function generateArticle(topic: string, outline: string): Promise<string> {
  return callClaude(
    `你是一个专业的职场内容作者。根据以下选题和大纲，写一篇完整的文章。

选题：${topic}

大纲：
${outline}

要求：
- 总字数 800-1200 字
- 语言亲切自然，有洞察力，避免空话套话
- 每个章节充实展开，有具体例子或数据支撑
- 结尾有明确的行动建议或总结
- 直接输出文章正文，不要重复标题`,
    2000
  );
}
