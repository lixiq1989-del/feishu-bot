/**
 * 任务管理数据层
 *
 * 多维表格字段：
 *   任务名（文本）| 类型（单选: 任务/灵感）| 状态（单选: 待做/进行中/完成/搁置）
 *   优先级（单选: 高/中/低）| 日期（日期）| 来源（文本）| 负责人（文本）| 备注（文本）
 */

import * as https from 'https';
import { client } from './client';

// ─── 配置 ────────────────────────────────────────────────────────

export const TASK_CONFIG = {
  APP_TOKEN: process.env.TASK_APP_TOKEN || '',
  TABLE_ID: process.env.TASK_TABLE_ID || '',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
};

// ─── 类型 ────────────────────────────────────────────────────────

export type TaskType = '任务' | '灵感';
export type TaskStatus = '待做' | '进行中' | '完成' | '搁置';
export type TaskPriority = '高' | '中' | '低';

export interface Task {
  record_id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  date: string;       // YYYY-MM-DD
  source: string;     // 个人 / 团队名称
  owner: string;
  note: string;
}

export interface DailySummary {
  date: string;
  done: Task[];
  pending: Task[];
  inProgress: Task[];
  ideas: Task[];
}

// ─── 日期工具 ────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '-');
}

function toTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime();
}

function fromTimestamp(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

// ─── 字段解析 ────────────────────────────────────────────────────

function parseRecord(item: any): Task {
  const f = item.fields as Record<string, any>;
  const dateVal = f['日期'];
  let date = todayStr();
  if (typeof dateVal === 'number') {
    date = fromTimestamp(dateVal);
  } else if (typeof dateVal === 'string') {
    date = dateVal.slice(0, 10);
  }
  return {
    record_id: item.record_id || '',
    name: String(f['任务名'] || ''),
    type: (f['类型'] as TaskType) || '任务',
    status: (f['状态'] as TaskStatus) || '待做',
    priority: (f['优先级'] as TaskPriority) || '中',
    date,
    source: String(f['来源'] || '个人'),
    owner: String(f['负责人'] || ''),
    note: String(f['备注'] || ''),
  };
}

// ─── 初始化表格 ──────────────────────────────────────────────────

export async function initTaskTable(): Promise<{ appToken: string; tableId: string }> {
  console.log('📋 创建任务管理多维表格...\n');

  const appRes = await (client.bitable as any).app.create({
    data: { name: '任务 & 灵感管理' },
  });
  if (appRes.code !== 0) throw new Error(`创建表格失败: ${appRes.msg}`);

  const appToken: string = appRes.data?.app?.app_token!;
  console.log(`✅ 表格创建成功`);

  // 获取默认表
  const tableListRes = await client.bitable.appTable.list({
    path: { app_token: appToken },
  });
  const tableId: string = tableListRes.data?.items?.[0]?.table_id!;

  // 重命名默认主字段
  const existingFields = await client.bitable.appTableField.list({
    path: { app_token: appToken, table_id: tableId },
  });
  const defaultField = existingFields.data?.items?.find(
    (f: any) => f.field_name === '文本' || f.type === 1
  );
  if (defaultField) {
    await client.bitable.appTableField.update({
      path: { app_token: appToken, table_id: tableId, field_id: defaultField.field_id! },
      data: { field_name: '任务名', type: 1 },
    });
  }

  // 删除不需要的默认字段
  const toDelete = existingFields.data?.items?.filter(
    (f: any) => ['单选', '日期', '附件', '人员'].includes(f.field_name)
  ) || [];
  for (const f of toDelete) {
    await client.bitable.appTableField.delete({
      path: { app_token: appToken, table_id: tableId, field_id: f.field_id! },
    });
  }

  // 新增字段（type 编号：1=文本, 3=单选, 5=日期）
  const newFields = [
    { field_name: '类型',   type: 3 },  // 单选
    { field_name: '状态',   type: 3 },  // 单选
    { field_name: '优先级', type: 3 },  // 单选
    { field_name: '日期',   type: 5 },  // 日期
    { field_name: '来源',   type: 1 },  // 文本
    { field_name: '负责人', type: 1 },  // 文本
    { field_name: '备注',   type: 1 },  // 文本
  ];
  for (const f of newFields) {
    await client.bitable.appTableField.create({
      path: { app_token: appToken, table_id: tableId },
      data: f,
    });
  }

  console.log('✅ 字段创建完成');
  console.log(`\n💡 请将以下配置保存到 .env：`);
  console.log(`   TASK_APP_TOKEN=${appToken}`);
  console.log(`   TASK_TABLE_ID=${tableId}`);
  console.log(`\n🔗 表格地址：https://hcn2vc1r2jus.feishu.cn/base/${appToken}\n`);

  return { appToken, tableId };
}

// ─── 查询 ────────────────────────────────────────────────────────

/** 拉取所有任务记录（可选按来源过滤） */
async function fetchAllTasks(source?: string): Promise<Task[]> {
  const { APP_TOKEN, TABLE_ID } = TASK_CONFIG;
  const tasks: Task[] = [];
  let pageToken: string | undefined;

  do {
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: APP_TOKEN, table_id: TABLE_ID },
      params: { page_size: 100, ...(pageToken ? { page_token: pageToken } : {}) },
    });
    if (res.code !== 0) break;
    for (const item of res.data?.items || []) {
      const task = parseRecord(item);
      if (!source || task.source === source) {
        tasks.push(task);
      }
    }
    pageToken = res.data?.has_more ? res.data.page_token : undefined;
  } while (pageToken);

  return tasks;
}

/** 获取今日任务，按状态分组 */
export async function getTodayTasks(source?: string): Promise<{
  pending: Task[];
  inProgress: Task[];
  done: Task[];
}> {
  const today = todayStr();
  const all = await fetchAllTasks(source);
  const todayTasks = all.filter(t => t.type === '任务' && t.date === today);

  return {
    pending:    todayTasks.filter(t => t.status === '待做'),
    inProgress: todayTasks.filter(t => t.status === '进行中'),
    done:       todayTasks.filter(t => t.status === '完成'),
  };
}

/** 获取所有未转化的灵感 */
export async function getIdeas(source?: string): Promise<Task[]> {
  const all = await fetchAllTasks(source);
  return all.filter(t => t.type === '灵感');
}

/** 获取当日汇总（供日报用） */
export async function getDailySummary(source?: string, date?: string): Promise<DailySummary> {
  const targetDate = date || todayStr();
  const all = await fetchAllTasks(source);
  const dayTasks = all.filter(t => t.type === '任务' && t.date === targetDate);

  return {
    date: targetDate,
    done:       dayTasks.filter(t => t.status === '完成'),
    pending:    dayTasks.filter(t => t.status === '待做'),
    inProgress: dayTasks.filter(t => t.status === '进行中'),
    ideas:      all.filter(t => t.type === '灵感'),
  };
}

// ─── 写入 ────────────────────────────────────────────────────────

/** 新增一条记录 */
export async function addTask(
  name: string,
  opts: {
    type?: TaskType;
    priority?: TaskPriority;
    date?: string;
    source?: string;
    note?: string;
  } = {}
): Promise<void> {
  const { APP_TOKEN, TABLE_ID } = TASK_CONFIG;
  const dateStr = opts.date || todayStr();

  await client.bitable.appTableRecord.create({
    path: { app_token: APP_TOKEN, table_id: TABLE_ID },
    data: {
      fields: {
        '任务名':  name,
        '类型':   opts.type     || '任务',
        '状态':   '待做',
        '优先级': opts.priority || '中',
        '日期':   toTimestamp(dateStr),
        '来源':   opts.source   || '个人',
        '备注':   opts.note     || '',
      },
    },
  });
}

/** 模糊匹配任务名，更新状态 */
export async function updateTaskStatus(
  nameQuery: string,
  status: TaskStatus,
  source?: string
): Promise<Task | null> {
  const { APP_TOKEN, TABLE_ID } = TASK_CONFIG;
  const all = await fetchAllTasks(source);
  const query = nameQuery.trim().toLowerCase();

  // 优先精确匹配，其次包含匹配
  const match =
    all.find(t => t.name.toLowerCase() === query) ||
    all.find(t => t.name.toLowerCase().includes(query));

  if (!match) return null;

  await client.bitable.appTableRecord.update({
    path: { app_token: APP_TOKEN, table_id: TABLE_ID, record_id: match.record_id },
    data: { fields: { '状态': status } },
  });

  return { ...match, status };
}

// ─── AI 分类（Claude API） ────────────────────────────────────────

export interface ClassifyResult {
  type: TaskType;
  name: string;
  priority: TaskPriority;
}

/** 调用 DeepSeek 判断消息是"任务"还是"灵感"，提取内容和优先级 */
export async function aiClassify(text: string): Promise<ClassifyResult> {
  const apiKey = TASK_CONFIG.DEEPSEEK_API_KEY;
  if (!apiKey) {
    // 无 API key 时降级：有动词开头的视为任务
    const taskKeywords = /^(写|做|完成|处理|联系|跟进|发|回|看|学|准备|整理|确认|安排|更新|检查)/;
    return {
      type: taskKeywords.test(text.trim()) ? '任务' : '灵感',
      name: text.trim(),
      priority: '中',
    };
  }

  const systemPrompt = `你是一个任务管理助手。分析用户发来的消息，判断它是"任务"（需要执行的具体行动）还是"灵感"（想法、备忘、观察）。

返回 JSON，格式严格如下（不要加 markdown 代码块）：
{"type":"任务或灵感","name":"清晰简短的内容（不超过30字）","priority":"高或中或低"}

优先级规则：包含"紧急""今天必须""立刻"→ 高；包含"重要""尽快" → 中；其余 → 低。`;

  const body = JSON.stringify({
    model: 'deepseek-chat',
    max_tokens: 200,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
            return;
          }
          const content = json.choices?.[0]?.message?.content || '';
          const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const result = JSON.parse(cleaned);
          resolve({
            type: result.type === '灵感' ? '灵感' : '任务',
            name: String(result.name || text).slice(0, 50),
            priority: (['高', '中', '低'].includes(result.priority) ? result.priority : '中') as TaskPriority,
          });
        } catch (e: any) {
          resolve({ type: '灵感', name: text.trim().slice(0, 50), priority: '中' });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── AI 日报（Claude API） ───────────────────────────────────────

/** 调用 DeepSeek 生成当日日报文字 */
export async function generateDailyReport(summary: DailySummary): Promise<string> {
  const apiKey = TASK_CONFIG.DEEPSEEK_API_KEY;
  const { done, pending, inProgress } = summary;
  const total = done.length + pending.length + inProgress.length;

  const statsText = [
    `完成 ${done.length}/${total} 个任务`,
    done.length  > 0 ? `已完成：${done.map(t => t.name).join('、')}` : '',
    inProgress.length > 0 ? `进行中：${inProgress.map(t => t.name).join('、')}` : '',
    pending.length > 0 ? `未完成：${pending.map(t => t.name).join('、')}` : '',
  ].filter(Boolean).join('\n');

  if (!apiKey) {
    return `📊 今日日报 · ${summary.date}\n\n${statsText}`;
  }

  const prompt = `以下是今日任务完成情况：\n${statsText}\n\n请用2-3句话做简短点评（中文），包括：进展评价、明天的建议。不超过80字，语气鼓励但实事求是。`;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const req = https.request({
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const aiComment = json.choices?.[0]?.message?.content || '';
          resolve(`📊 今日日报 · ${summary.date}\n\n${statsText}\n\n${aiComment.trim()}`);
        } catch {
          resolve(`📊 今日日报 · ${summary.date}\n\n${statsText}`);
        }
      });
    });
    req.on('error', () => {
      resolve(`📊 今日日报 · ${summary.date}\n\n${statsText}`);
    });
    req.write(body);
    req.end();
  });
}
