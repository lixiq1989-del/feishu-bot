/**
 * 测试用例 1：向测试群发送消息
 *
 * 准备工作：
 *   1. 把飞书机器人拉进目标群
 *   2. 在群设置 → 群机器人 里确认机器人已加入
 *   3. 把下方 TEST_CHAT_ID 改成目标群的 chat_id
 *      获取方式：飞书 PC 端 → 群设置 → 复制群链接，链接里有 open_chat_id 参数
 *      或者用 API：GET /open-apis/im/v1/chats 列出所有群
 */

import { message } from '../src/index';

// ← 替换成你的测试群 chat_id（格式：oc_xxxxxxxx）
const TEST_CHAT_ID = 'oc_REPLACE_ME';

async function run() {
  console.log('--- 测试1：发送文本消息 ---');

  const res = await message.sendTextToChat(
    TEST_CHAT_ID,
    `[MCP 连通测试] 飞书 API 接入成功 ✅\n时间：${new Date().toLocaleString('zh-CN')}`
  );

  if (res.code === 0) {
    console.log('✅ 消息发送成功，message_id:', res.data?.message_id);
  } else {
    console.error('❌ 发送失败:', res.msg, '| code:', res.code);
    console.log('请检查：1) chat_id 是否正确 2) 机器人是否在群内 3) 权限是否开通');
  }
}

run().catch(console.error);
