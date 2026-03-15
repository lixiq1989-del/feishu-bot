/**
 * 创建「面试三步突击法」飞书知识库结构
 *
 * 运行：NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/setup_wiki.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载 .env（必须在 client 初始化前，所以用 require 延迟导入）
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { client } = require('../src/client') as typeof import('../src/client');

// ── 知识库目录结构 ─────────────────────────────────────────────────────────────
// parent_node_token 为空 = 根节点
// node_type: origin = 飞书文档, shortcut = 快捷方式
const SPACE_TITLE = '面试三步突击法';
const SPACE_DESC = '泛商科求职 · 系统化面试准备 · 行为面/业务面/Case面全覆盖';

const CHAPTERS = [
  {
    title: '00 使用指南（免费预览）',
    children: [
      '为什么你一直卡在二面',
      '这套方法怎么用',
    ],
  },
  {
    title: '01 Step 1 · 拆JD',
    children: [
      'JD 的三层信息结构',
      '如何识别考察能力',
      '练习：从JD到题目预测',
    ],
  },
  {
    title: '02 Step 2 · 对能力',
    children: [
      '泛商科通用能力模型（6大维度）',
      '通用能力清单',
      '专业能力清单（外部分析 / 内部运营 / 策略 / 数据）',
      '能力-经历映射表（模板）',
    ],
  },
  {
    title: '03 Step 3.1 · 行为面',
    children: [
      '行为面的本质：不是问你经历，是考察你能力',
      '宝洁八大问 · 全拆解',
      '麦肯锡PEI · 全拆解',
      '故事库搭建指南（STAR模板）',
      '高频题 × 回答模板（20题）',
    ],
  },
  {
    title: '04 Step 3.2 · 业务面 / Case面',
    children: [
      '业务面本质：三层拆解法',
      'Market Sizing · 底层公式拆解',
      '常见Case类型 × 框架（6类）',
      '互联网业务拆解：用户 / 商家 / 增长',
      '陌生市场快速应对策略',
    ],
  },
  {
    title: '05 Step 3.3 · 简历',
    children: [
      'JD映射写法',
      'Bullet优化公式',
      '项目经历改写示例',
    ],
  },
  {
    title: '06 附录',
    children: [
      '能力模块后台系统（自测表）',
      '面试前快速检查清单',
    ],
  },
];

// ── 主流程 ───────────────────────────────────────────────────────────────────

// wiki.space.create 仅支持 user_access_token，不支持 tenant token
// 请手动在飞书中创建知识库空间，然后将 space_id 作为命令行参数传入
// 运行示例：NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/setup_wiki.ts <space_id>
function getSpaceId(): string {
  const spaceId = process.argv[2];
  if (!spaceId) {
    console.error('❌ 请传入 space_id 参数');
    console.error('   用法：NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/setup_wiki.ts <space_id>');
    console.error('   space_id 在知识库 URL 中找到：feishu.cn/wiki/settings/<space_id>');
    process.exit(1);
  }
  return spaceId;
}

async function createNode(
  spaceId: string,
  title: string,
  parentNodeToken?: string
): Promise<string> {
  const res = await (client.wiki.spaceNode as any).create({
    path: { space_id: spaceId },
    data: {
      obj_type: 'doc',
      parent_node_token: parentNodeToken ?? '',
      node_type: 'origin',
      title,
    },
  });
  const nodeToken = res.data?.node?.node_token;
  if (!nodeToken) throw new Error(`创建节点失败: ${JSON.stringify(res)}`);
  return nodeToken;
}

async function main() {
  const spaceId = getSpaceId();
  console.log(`🚀 开始在知识库 ${spaceId} 中创建页面结构...\n`);

  // 2. 创建章节和子页面
  for (const chapter of CHAPTERS) {
    console.log(`\n📂 创建章节: ${chapter.title}`);
    const chapterToken = await createNode(spaceId, chapter.title);
    console.log(`   token: ${chapterToken}`);

    for (const child of chapter.children) {
      const childToken = await createNode(spaceId, child, chapterToken);
      console.log(`   ✓ ${child} (${childToken})`);
      // 避免触发限流
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\n🎉 完成！所有页面已创建`);
  console.log(`🔗 访问地址: https://hcn2vc1r2jus.feishu.cn/wiki/${spaceId}`);
}

main().catch(err => {
  console.error('❌ 错误:', err.message ?? err);
  process.exit(1);
});
