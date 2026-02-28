import { client } from './client';

/** 发送文本消息到用户（通过 open_id） */
export async function sendTextToUser(openId: string, text: string) {
  return client.im.message.create({
    params: { receive_id_type: 'open_id' },
    data: {
      receive_id: openId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
  });
}

/** 发送文本消息到群（通过 chat_id） */
export async function sendTextToChat(chatId: string, text: string) {
  return client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
  });
}

/** 发送富文本（post）消息 */
export async function sendRichText(chatId: string, title: string, paragraphs: string[][]) {
  const content = {
    post: {
      'zh_cn': {
        title,
        content: paragraphs.map(line =>
          line.map(text => ({ tag: 'text', text }))
        ),
      },
    },
  };
  return client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: chatId,
      msg_type: 'post',
      content: JSON.stringify(content),
    },
  });
}

/** 发送卡片消息 */
export async function sendCard(chatId: string, cardJson: object) {
  return client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify(cardJson),
    },
  });
}

/** 获取群列表 */
export async function listChats() {
  return client.im.chat.list({});
}
