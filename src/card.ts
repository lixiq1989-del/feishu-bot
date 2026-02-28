/**
 * 飞书交互式卡片
 *
 * 飞书开放平台需额外配置「卡片请求 URL」：
 *   App > 应用功能 > 机器人 > 卡片请求 URL → <你的域名>/webhook/card
 *
 * 卡片按钮点击后，飞书会 POST 到该 URL，返回新卡片 JSON 即可更新原卡片。
 */

import { client } from './client';

// ─── 发送卡片 ────────────────────────────────────────────────────

/** 向群发送交互式卡片，返回 message_id（用于后续更新） */
export async function sendCard(chatId: string, card: object): Promise<string> {
  const res = await client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    },
  });
  return (res as any).data?.message_id || '';
}

/** 更新已发出的卡片（用 message_id） */
export async function updateCard(messageId: string, card: object): Promise<void> {
  await (client.im.message as any).patch({
    path: { message_id: messageId },
    data: { content: JSON.stringify(card) },
  });
}

// ─── 卡片模板 ────────────────────────────────────────────────────

/** 「处理中」占位卡片，点击按钮后立即更新为这个 */
export function buildLoadingCard(message: string): object {
  return {
    config: { wide_screen_mode: true },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: `⏳ ${message}` } },
    ],
  };
}

/** Step 1：选方向 */
export function buildDirectionCard(): object {
  const directions = ['职场成长', '求职面试', '行业洞察', '个人品牌'];
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '✍️ 开始创作——选一个方向' },
      template: 'blue',
    },
    elements: [
      {
        tag: 'action',
        actions: directions.map(d => ({
          tag: 'button',
          text: { tag: 'plain_text', content: d },
          type: 'primary',
          value: { action: 'select_direction', direction: d },
        })),
      },
    ],
  };
}

/** Step 2：选选题（3 个候选） */
export function buildTopicChoiceCard(direction: string, topics: string[]): object {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `📝 选题 · ${direction}` },
      template: 'green',
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: '选一个选题继续，或换一批：' } },
      ...topics.map((topic, i) => ({
        tag: 'action',
        actions: [{
          tag: 'button',
          text: { tag: 'plain_text', content: `${i + 1}. ${topic}` },
          type: 'default',
          value: { action: 'select_topic', topic, direction },
        }],
      })),
      {
        tag: 'action',
        actions: [{
          tag: 'button',
          text: { tag: 'plain_text', content: '🔄 换一批' },
          type: 'danger',
          value: { action: 'regenerate_topics', direction },
        }],
      },
    ],
  };
}

/** Step 3：确认大纲 */
export function buildOutlineCard(topic: string, outline: string): object {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '📋 确认大纲' },
      template: 'yellow',
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: `**选题：**${topic}\n\n${outline}` } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '✅ 确认，开始写作' },
            type: 'primary',
            value: { action: 'confirm_outline', topic, outline },
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '🔄 重新生成大纲' },
            type: 'default',
            value: { action: 'regenerate_outline', topic },
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '← 重新选题' },
            type: 'danger',
            value: { action: 'back_to_direction' },
          },
        ],
      },
    ],
  };
}

/** Step 4：完成，附文档链接 */
export function buildDoneCard(topic: string, docUrl: string, preview: string): object {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '✅ 文章已生成' },
      template: 'green',
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: `**${topic}**\n\n${preview}` } },
      {
        tag: 'action',
        actions: [{
          tag: 'button',
          text: { tag: 'plain_text', content: '📄 查看完整文章' },
          type: 'primary',
          url: docUrl,
          value: {},
        }],
      },
    ],
  };
}
