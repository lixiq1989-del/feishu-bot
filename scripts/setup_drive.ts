/**
 * 用飞书 Drive（云文档）创建「面试三步突击法」知识库结构
 * tenant_access_token 完全支持，不需要 user token
 *
 * 运行：cd ~/feishu-sdk && NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/setup_drive.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) {
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const { client } = require('../src/client') as typeof import('../src/client');

// ── 知识库目录结构 ─────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    title: '00 使用指南（免费预览）',
    docs: [
      '为什么你一直卡在二面',
      '这套方法怎么用',
    ],
  },
  {
    title: '01 Step 1 · 拆JD',
    docs: [
      'JD 的三层信息结构',
      '如何识别考察能力',
      '练习：从JD到题目预测',
    ],
  },
  {
    title: '02 Step 2 · 对能力',
    docs: [
      '泛商科通用能力模型（6大维度）',
      '通用能力清单',
      '专业能力清单（外部分析 / 内部运营 / 策略 / 数据）',
      '能力-经历映射表（模板）',
    ],
  },
  {
    title: '03 Step 3.1 · 行为面',
    docs: [
      '行为面的本质：不是问你经历，是考察你能力',
      '宝洁八大问 · 全拆解',
      '麦肯锡PEI · 全拆解',
      '故事库搭建指南（STAR模板）',
      '高频题 × 回答模板（20题）',
    ],
  },
  {
    title: '04 Step 3.2 · 业务面 / Case面',
    docs: [
      '业务面本质：三层拆解法',
      'Market Sizing · 底层公式拆解',
      '常见Case类型 × 框架（6类）',
      '互联网业务拆解：用户 / 商家 / 增长',
      '陌生市场快速应对策略',
    ],
  },
  {
    title: '05 Step 3.3 · 简历',
    docs: [
      'JD映射写法',
      'Bullet优化公式',
      '项目经历改写示例',
    ],
  },
  {
    title: '06 附录',
    docs: [
      '能力模块后台系统（自测表）',
      '面试前快速检查清单',
    ],
  },
];

// ── API 封装 ─────────────────────────────────────────────────────────────────

async function createFolder(name: string, parentToken?: string): Promise<string> {
  const res = await (client.drive.file as any).createFolder({
    data: {
      name,
      folder_token: parentToken ?? '',
    },
  });
  const token = res.data?.token;
  if (!token) throw new Error(`创建文件夹失败: ${JSON.stringify(res)}`);
  return token;
}

async function createDoc(title: string, folderToken: string): Promise<string> {
  const res = await (client.docx.document as any).create({
    data: {
      title,
      folder_token: folderToken,
    },
  });
  const docId = res.data?.document?.document_id;
  if (!docId) throw new Error(`创建文档失败: ${JSON.stringify(res)}`);
  return docId;
}

// ── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 开始创建「面试三步突击法」知识库结构...\n');

  // 1. 创建根文件夹
  console.log('📁 创建根文件夹：面试三步突击法');
  const rootToken = await createFolder('面试三步突击法');
  console.log(`   folder_token: ${rootToken}`);

  // 2. 创建章节文件夹 + 子文档
  const results: { chapter: string; folder: string; docs: { title: string; id: string }[] }[] = [];

  for (const chapter of CHAPTERS) {
    console.log(`\n📂 创建章节: ${chapter.title}`);
    const folderToken = await createFolder(chapter.title, rootToken);
    console.log(`   folder_token: ${folderToken}`);

    const docResults: { title: string; id: string }[] = [];
    for (const docTitle of chapter.docs) {
      await new Promise(r => setTimeout(r, 300)); // 防限流
      const docId = await createDoc(docTitle, folderToken);
      console.log(`   ✓ ${docTitle}`);
      docResults.push({ title: docTitle, id: docId });
    }

    results.push({ chapter: chapter.title, folder: folderToken, docs: docResults });
  }

  // 3. 输出汇总
  console.log('\n\n✅ 完成！结构汇总：');
  console.log(`📁 根文件夹 token: ${rootToken}`);
  console.log(`🔗 访问地址: https://hcn2vc1r2jus.feishu.cn/drive/folder/${rootToken}`);

  // 保存结构到本地 JSON 便于后续使用
  const outputPath = path.resolve(__dirname, '..', 'wiki_structure.json');
  fs.writeFileSync(outputPath, JSON.stringify({ rootToken, chapters: results }, null, 2), 'utf-8');
  console.log(`\n💾 结构已保存到: ${outputPath}`);
}

main().catch(err => {
  console.error('\n❌ 错误:', err.message ?? err);
  process.exit(1);
});
