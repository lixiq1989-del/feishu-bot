/**
 * 内容加工器 — 调用 AI 对精选内容进行汉化/提炼/转化
 *
 * 支持 LLM：
 *   - DeepSeek（推荐，国内稳定）：设置 DEEPSEEK_API_KEY
 *   - Claude（海外/VPN）：设置 ANTHROPIC_API_KEY
 *   - 两个都没有：返回简单格式提示
 */

import * as https from 'https';
import { CurationItem } from './curation_state';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// ─── 提炼 prompt ──────────────────────────────────────────────────

function buildPrompt(item: CurationItem): string {
  const categoryLabel: Record<string, string> = {
    interview: '咨询/商科面试',
    strategy: '战略分析方法论',
    insight: '行业洞察',
  };
  const label = categoryLabel[item.category] || '咨询';

  return `你是咨询行业内容加工助手。以下是一篇${label}相关的文章，请帮我：

标题：${item.title}
摘要：${item.summary}
链接：${item.url || '无'}

请按以下格式输出，用中文：

【核心观点】
① （30字以内）
② （30字以内）
③ （30字以内）

【面试怎么用】
• Case Interview：（具体说明这些观点在什么类型的case中用得上）
• Behavioral：（如何用这些观点展示你的行业认知）
• 给面试官留下印象的一句话总结：（20字以内）

【小红书草稿标题】
（3个备选标题，吸引咨询求职者点击）

不要添加多余的解释，直接按格式输出。`;
}

// ─── DeepSeek 调用 ────────────────────────────────────────────────

async function callDeepSeek(prompt: string): Promise<string> {
  const body = JSON.stringify({
    model: 'deepseek-chat',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.deepseek.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) { reject(new Error(json.error.message)); return; }
            resolve(json.choices?.[0]?.message?.content || '');
          } catch (e: any) {
            reject(new Error(`DeepSeek 解析失败: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Claude 调用 ──────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
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
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) { reject(new Error(json.error.message)); return; }
            resolve(json.content?.[0]?.text || '');
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

// ─── 主入口 ───────────────────────────────────────────────────────

export async function processCurationItem(item: CurationItem): Promise<string> {
  const prompt = buildPrompt(item);

  // 优先 DeepSeek（国内稳定），fallback Claude
  if (DEEPSEEK_API_KEY) {
    return await callDeepSeek(prompt);
  }
  if (ANTHROPIC_API_KEY) {
    return await callClaude(prompt);
  }

  // 无 API key 时返回提示
  return `📄 ${item.title}\n\n${item.summary}\n\n${item.url || ''}\n\n⚠️ 请配置 DEEPSEEK_API_KEY 或 ANTHROPIC_API_KEY 以启用 AI 加工`;
}
