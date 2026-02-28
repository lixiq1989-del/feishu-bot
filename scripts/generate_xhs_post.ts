/**
 * generate_xhs_post.ts
 * 从飞书多维表格原子库随机抽取 tips，组合成一篇小红书帖子
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/generate_xhs_post.ts
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/generate_xhs_post.ts --theme 面试
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/generate_xhs_post.ts --count 8 --type 真实数据
 */

import { client } from '../src/client';

const APP_TOKEN = 'WLayb8PbjagRMrsnsoAciVkwnId';
const TABLE_ID = 'tblt8h55bOmh4zi2';

interface Tip {
  record_id: string;
  内容: string;
  分类: string;
  类型: string;
  数据来源: string;
  使用次数: number;
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const opts: { theme?: string; type?: string; count: number; save: boolean; chat?: string } = { count: 7, save: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--theme' && args[i + 1]) opts.theme = args[++i];
    if (args[i] === '--type' && args[i + 1]) opts.type = args[++i];
    if (args[i] === '--count' && args[i + 1]) opts.count = parseInt(args[++i], 10);
    if (args[i] === '--save') opts.save = true;
    if (args[i] === '--chat' && args[i + 1]) { opts.chat = args[++i]; opts.save = true; }
  }
  return opts;
}

// 从 Bitable 拉取所有 tips
async function fetchAllTips(): Promise<Tip[]> {
  const tips: Tip[] = [];
  let pageToken: string | undefined;

  do {
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: APP_TOKEN, table_id: TABLE_ID },
      params: { page_size: 100, ...(pageToken ? { page_token: pageToken } : {}) },
    });

    if (res.code !== 0) {
      throw new Error(`拉取记录失败: ${res.msg} (code: ${res.code})`);
    }

    const items = res.data?.items || [];
    for (const item of items) {
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

// 随机打乱数组
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// 生成小红书帖子
function buildPost(selected: Tip[]): string {
  const titles = [
    `商科生求职，没人告诉你的 ${selected.length} 条真相`,
    `投了 ${100 + Math.floor(Math.random() * 500)} 份简历才懂的求职规律`,
    `HR 绝不会主动说的 ${selected.length} 条面试潜规则`,
    `学了四年商科，求职时我后悔没早知道这些`,
    `裂变型求职笔记：把竞争对手当老师的 ${selected.length} 个方法`,
    `应届生求职避坑：这 ${selected.length} 件事比背答案更重要`,
  ];

  const endings = [
    `\n\n保存这篇，下次投简历之前翻出来看一遍。\n\n#求职 #校招 #商科求职 #找工作 #职场新人`,
    `\n\n真正的竞争力从来不是答案，是提问题的方式。\n\n#求职干货 #校招 #面试技巧 #商科 #职场`,
    `\n\n收藏不等于行动，但不收藏连行动的机会都没有。\n\n#求职 #面试 #简历 #校招攻略 #商科生`,
    `\n\n你的竞争对手已经知道这些了，你呢？\n\n#求职 #校招 #面试干货 #简历 #商科求职`,
  ];

  const title = titles[Math.floor(Math.random() * titles.length)];
  const ending = endings[Math.floor(Math.random() * endings.length)];

  const lines = selected.map((tip, i) => {
    const prefix = i === 0 ? '⚡' : i < 3 ? '🔥' : '✅';
    return `${prefix} ${i + 1}. ${tip.内容}`;
  });

  return `${title}\n\n${lines.join('\n\n')}${ending}`;
}

// 将帖子保存为飞书文档，返回文档链接
async function saveToFeishuDoc(post: string, title: string): Promise<string> {
  // 1. 创建文档
  const createRes = await client.docx.document.create({
    data: { title },
  });

  if (createRes.code !== 0) {
    throw new Error(`创建文档失败: ${createRes.msg} (code: ${createRes.code})`);
  }

  const docId = createRes.data?.document?.document_id!;

  // 2. 把帖子内容按段落拆分，逐段写入
  const paragraphs = post.split('\n\n').filter(p => p.trim().length > 0);
  const children = paragraphs.map(p => ({
    block_type: 2,
    text: {
      elements: [{ text_run: { content: p.trim() } }],
      style: {},
    },
  }));

  const blockRes = await client.docx.documentBlockChildren.create({
    path: { document_id: docId, block_id: docId },
    params: { document_revision_id: -1 },
    data: { children, index: 0 },
  });

  if (blockRes.code !== 0) {
    throw new Error(`写入文档失败: ${blockRes.msg} (code: ${blockRes.code})`);
  }

  return `https://hcn2vc1r2jus.feishu.cn/docx/${docId}`;
}

// 发送文档链接到飞书群聊
async function sendToChat(chatId: string, docUrl: string, title: string) {
  const content = JSON.stringify({
    zh_cn: {
      title: '📝 今日小红书草稿',
      content: [
        [{ tag: 'text', text: `标题：${title}\n` }],
        [{ tag: 'text', text: '点击查看全文 👉 ' }, { tag: 'a', text: '飞书文档', href: docUrl }],
        [{ tag: 'text', text: '\n（可直接复制帖子内容到小红书）' }],
      ],
    },
  });

  const res = await client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: chatId,
      msg_type: 'post',
      content,
    },
  });

  if (res.code !== 0) {
    console.warn(`⚠️  发送群消息失败: ${res.msg}`);
  } else {
    console.log(`✅ 已发送到群聊`);
  }
}

// 更新使用次数
async function incrementUsage(tips: Tip[]) {
  for (const tip of tips) {
    await client.bitable.appTableRecord.update({
      path: { app_token: APP_TOKEN, table_id: TABLE_ID, record_id: tip.record_id },
      data: { fields: { '使用次数': tip.使用次数 + 1 } },
    });
  }
}

async function main() {
  const opts = parseArgs();

  console.log('📥 正在从飞书原子库拉取 tips...');
  const allTips = await fetchAllTips();
  console.log(`   共加载 ${allTips.length} 条`);

  // 过滤掉空内容
  let pool = allTips.filter(t => t.内容.trim().length > 10);
  if (opts.theme) {
    pool = pool.filter(t => t.分类 === opts.theme);
    console.log(`   按主题「${opts.theme}」筛选后剩 ${pool.length} 条`);
  }
  if (opts.type) {
    pool = pool.filter(t => t.类型 === opts.type);
    console.log(`   按类型「${opts.type}」筛选后剩 ${pool.length} 条`);
  }

  if (pool.length < opts.count) {
    console.warn(`⚠️  可用 tips 不足 ${opts.count} 条，将使用全部 ${pool.length} 条`);
    opts.count = pool.length;
  }

  // 优先选使用次数少的（保持库的均匀消耗），再随机
  pool.sort((a, b) => a.使用次数 - b.使用次数);
  const topPool = pool.slice(0, Math.max(opts.count * 2, pool.length));
  const selected = shuffle(topPool).slice(0, opts.count);

  // 按分类顺序排序，帖子结构更流畅
  const order = ['心态', '赛道', '简历', '面试', '决策', '行动'];
  selected.sort((a, b) => {
    const ai = order.indexOf(a.分类);
    const bi = order.indexOf(b.分类);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  console.log('\n--- 选中 tips ---');
  selected.forEach((t, i) => console.log(`  ${i + 1}. [${t.分类}][${t.类型}] ${t.内容.slice(0, 40)}...`));

  const post = buildPost(selected);

  console.log('\n' + '='.repeat(60));
  console.log(post);
  console.log('='.repeat(60));

  // 更新使用次数
  console.log('\n📝 更新使用次数...');
  await incrementUsage(selected);

  // 保存到飞书文档
  if (opts.save) {
    console.log('\n📄 正在保存到飞书文档...');
    const docTitle = `小红书草稿 · ${new Date().toLocaleDateString('zh-CN')} · ${opts.theme || '综合'}`;
    try {
      const docUrl = await saveToFeishuDoc(post, docTitle);
      console.log(`✅ 文档已创建：${docUrl}`);

      // 可选：发送到群聊
      if (opts.chat) {
        console.log(`\n💬 发送到群聊 ${opts.chat}...`);
        await sendToChat(opts.chat, docUrl, docTitle);
      }
    } catch (e: any) {
      console.error(`❌ 保存文档失败: ${e.message}`);
    }
  }

  console.log('\n✅ 完成');
}

main().catch(console.error);
