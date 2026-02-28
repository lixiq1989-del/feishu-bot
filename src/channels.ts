/**
 * 多群频道配置
 *
 * 使用步骤：
 *   1. 在各群里 @机器人 发任意消息
 *   2. 查看 bot_server 终端日志，找到 "[Bot] chat_id: oc_xxx" 这行
 *   3. 将对应 chat_id 填入 .env
 */

export interface Channel {
  chatId: string;
  name: string;
  pushHour: number;    // 每天推送时间（24小时制）
  pushMinute: number;
  enabled: boolean;
}

export const CHANNELS: Record<string, Channel> = {
  jobs: {
    chatId: process.env.CHAT_ID_JOBS || '',
    name: '岗位追踪群',
    pushHour: 8,
    pushMinute: 0,
    enabled: !!process.env.CHAT_ID_JOBS,
  },
  insight: {
    chatId: process.env.CHAT_ID_INSIGHT || '',
    name: '行业洞察群',
    pushHour: 9,
    pushMinute: 0,
    enabled: !!process.env.CHAT_ID_INSIGHT,
  },
  interview: {
    chatId: process.env.CHAT_ID_INTERVIEW || '',
    name: '咨询面试群',
    pushHour: 9,
    pushMinute: 30,
    enabled: !!process.env.CHAT_ID_INTERVIEW,
  },
  strategy: {
    chatId: process.env.CHAT_ID_STRATEGY || '',
    name: '战略分析群',
    pushHour: 10,
    pushMinute: 0,
    enabled: !!process.env.CHAT_ID_STRATEGY,
  },
};
