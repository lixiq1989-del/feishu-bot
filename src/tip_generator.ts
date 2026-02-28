/**
 * 小红书帖子生成器核心逻辑（供脚本和机器人共用）
 */
import { client } from './client';

const APP_TOKEN = 'WLayb8PbjagRMrsnsoAciVkwnId';
const TABLE_ID = 'tblt8h55bOmh4zi2';

export interface Tip {
  record_id: string;
  内容: string;
  分类: string;
  类型: string;
  数据来源: string;
  使用次数: number;
}

export interface GenerateOptions {
  theme?: string;   // 分类：心态/简历/面试/赛道/决策/行动
  type?: string;    // 类型：真实数据/反常识/行动建议/内部视角/规律总结/心理规律
  count?: number;
}

// 拉取所有 tips
export async function fetchAllTips(): Promise<Tip[]> {
  const tips: Tip[] = [];
  let pageToken: string | undefined;

  do {
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: APP_TOKEN, table_id: TABLE_ID },
      params: { page_size: 100, ...(pageToken ? { page_token: pageToken } : {}) },
    });
    if (res.code !== 0) throw new Error(`拉取记录失败: ${res.msg}`);

    for (const item of res.data?.items || []) {
      const f = item.fields as Record<string, any>;
      tips.push({
        record_id: item.record_id || '',
        内容: String(f['内容'] || ''),
        分类: String(f['分类'] || ''),
        类型: String(f['类型'] || ''),
        数据来源: String(f['数据来源'] || ''),
        使用次数: Number(f['使用次数'] || 0),
      });
    }
    pageToken = res.data?.has_more ? res.data.page_token : undefined;
  } while (pageToken);

  return tips;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const TITLES = [
  (n: number) => `商科生求职，没人告诉你的 ${n} 条真相`,
  (n: number) => `HR 绝不会主动说的 ${n} 条面试潜规则`,
  (n: number) => `学了四年商科，求职时我后悔没早知道这些`,
  (n: number) => `应届生求职避坑：这 ${n} 件事比背答案更重要`,
  (n: number) => `投了 ${100 + Math.floor(Math.random() * 500)} 份简历才懂的求职规律`,
];

const ENDINGS = [
  `\n\n保存这篇，下次投简历之前翻出来看一遍。\n\n#求职 #校招 #商科求职 #找工作 #职场新人`,
  `\n\n真正的竞争力从来不是答案，是提问题的方式。\n\n#求职干货 #校招 #面试技巧 #商科 #职场`,
  `\n\n收藏不等于行动，但不收藏连行动的机会都没有。\n\n#求职 #面试 #简历 #校招攻略 #商科生`,
  `\n\n你的竞争对手已经知道这些了，你呢？\n\n#求职 #校招 #面试干货 #简历 #商科求职`,
];

export function buildPost(selected: Tip[]): string {
  const titleFn = TITLES[Math.floor(Math.random() * TITLES.length)];
  const ending = ENDINGS[Math.floor(Math.random() * ENDINGS.length)];
  const lines = selected.map((tip, i) => {
    const prefix = i === 0 ? '⚡' : i < 3 ? '🔥' : '✅';
    return `${prefix} ${i + 1}. ${tip.内容}`;
  });
  return `${titleFn(selected.length)}\n\n${lines.join('\n\n')}${ending}`;
}

// 主生成函数
export async function generatePost(opts: GenerateOptions = {}): Promise<{ post: string; selected: Tip[] }> {
  const count = opts.count ?? 7;
  const allTips = await fetchAllTips();

  let pool = allTips.filter(t => t.内容.trim().length > 10);
  if (opts.theme) pool = pool.filter(t => t.分类 === opts.theme);
  if (opts.type) pool = pool.filter(t => t.类型 === opts.type);

  const actualCount = Math.min(count, pool.length);

  // 优先使用次数少的
  pool.sort((a, b) => a.使用次数 - b.使用次数);
  const topPool = pool.slice(0, Math.max(actualCount * 2, pool.length));
  const selected = shuffle(topPool).slice(0, actualCount);

  // 按分类顺序排
  const order = ['心态', '赛道', '简历', '面试', '决策', '行动'];
  selected.sort((a, b) => {
    const ai = order.indexOf(a.分类);
    const bi = order.indexOf(b.分类);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return { post: buildPost(selected), selected };
}

// 更新使用次数
export async function incrementUsage(tips: Tip[]) {
  for (const tip of tips) {
    await client.bitable.appTableRecord.update({
      path: { app_token: APP_TOKEN, table_id: TABLE_ID, record_id: tip.record_id },
      data: { fields: { '使用次数': tip.使用次数 + 1 } },
    });
  }
}

// 保存为飞书文档
export async function saveToFeishuDoc(post: string, title: string): Promise<string> {
  const createRes = await client.docx.document.create({ data: { title } });
  if (createRes.code !== 0) throw new Error(`创建文档失败: ${createRes.msg}`);

  const docId = createRes.data?.document?.document_id!;
  const paragraphs = post.split('\n\n').filter(p => p.trim().length > 0);
  await client.docx.documentBlockChildren.create({
    path: { document_id: docId, block_id: docId },
    params: { document_revision_id: -1 },
    data: {
      children: paragraphs.map(p => ({
        block_type: 2,
        text: { elements: [{ text_run: { content: p.trim() } }], style: {} },
      })),
      index: 0,
    },
  });

  return `https://hcn2vc1r2jus.feishu.cn/docx/${docId}`;
}
