/**
 * 商科留学知识库 — 直接写入飞书知识库空间
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/create_biz_wiki_in_space.ts Ik7Tw5lLki3Wl1kBQprcj3RMnue
 */

import * as fs from 'fs';
import * as path from 'path';

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

const { client } = require('../src/client') as typeof import('../src/client');

import { page as p00 } from './biz_wiki/00_intro';
import { page as p01 } from './biz_wiki/01_us';
import { page as p02 } from './biz_wiki/02_uk';
import { page as p03 } from './biz_wiki/03_france';
import { page as p04 } from './biz_wiki/04_singapore';
import { page as p05 } from './biz_wiki/05_hk';
import { page as p06 } from './biz_wiki/06_australia';
import { page as p07 } from './biz_wiki/07_strategy';
import { page as p08 } from './biz_wiki/08_exams';
import { page as p09 } from './biz_wiki/09_essays';
import { page as p10 } from './biz_wiki/10_timeline';
import { page as p11 } from './biz_wiki/11_updates';
import { page as p12 } from './biz_wiki/12_background';
import { page as p13 } from './biz_wiki/13_materials';
import { page as p14 } from './biz_wiki/14_finance';
import { page as p15 } from './biz_wiki/15_career_switch';
import { page as p16 } from './biz_wiki/16_application';
import { page as p17 } from './biz_wiki/17_interview_advanced';
import { page as p18 } from './biz_wiki/18_post_admission';

// 知识库结构
const STRUCTURE = [
  { title: p00.title, page: p00, isFolder: false, parentTitle: null },

  // 地区专项
  { title: '📍 各地区项目详解', page: null, isFolder: true, parentTitle: null },
  { title: p01.title, page: p01, isFolder: false, parentTitle: '📍 各地区项目详解' },
  { title: p02.title, page: p02, isFolder: false, parentTitle: '📍 各地区项目详解' },
  { title: p03.title, page: p03, isFolder: false, parentTitle: '📍 各地区项目详解' },
  { title: p04.title, page: p04, isFolder: false, parentTitle: '📍 各地区项目详解' },
  { title: p05.title, page: p05, isFolder: false, parentTitle: '📍 各地区项目详解' },
  { title: p06.title, page: p06, isFolder: false, parentTitle: '📍 各地区项目详解' },

  // 申请前规划
  { title: '📋 申请前规划', page: null, isFolder: true, parentTitle: null },
  { title: p07.title, page: p07, isFolder: false, parentTitle: '📋 申请前规划' },
  { title: p08.title, page: p08, isFolder: false, parentTitle: '📋 申请前规划' },
  { title: p09.title, page: p09, isFolder: false, parentTitle: '📋 申请前规划' },
  { title: p10.title, page: p10, isFolder: false, parentTitle: '📋 申请前规划' },
  { title: p12.title, page: p12, isFolder: false, parentTitle: '📋 申请前规划' },
  { title: p15.title, page: p15, isFolder: false, parentTitle: '📋 申请前规划' },

  // 申请中实操
  { title: '✍️ 申请中实操', page: null, isFolder: true, parentTitle: null },
  { title: p13.title, page: p13, isFolder: false, parentTitle: '✍️ 申请中实操' },
  { title: p14.title, page: p14, isFolder: false, parentTitle: '✍️ 申请中实操' },
  { title: p16.title, page: p16, isFolder: false, parentTitle: '✍️ 申请中实操' },
  { title: p17.title, page: p17, isFolder: false, parentTitle: '✍️ 申请中实操' },

  // 录取后 & 动态
  { title: '🎓 录取后 & 最新动态', page: null, isFolder: true, parentTitle: null },
  { title: p18.title, page: p18, isFolder: false, parentTitle: '🎓 录取后 & 最新动态' },
  { title: p11.title, page: p11, isFolder: false, parentTitle: '🎓 录取后 & 最新动态' },
];

async function writeBlocks(documentId: string, blocks: any[]) {
  const chunkSize = 50;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const res = await client.docx.documentBlockChildren.create({
      path: { document_id: documentId, block_id: documentId },
      data: { children: chunk },
    } as any);
    if (res.code !== 0) {
      console.error(`  写入失败 (${i}-${i + chunk.length}):`, res.msg, res.code);
    }
  }
}

async function createWikiNode(
  spaceId: string,
  title: string,
  isFolder: boolean,
  parentNodeToken?: string
): Promise<{ nodeToken: string; objToken?: string }> {
  const res = await (client.wiki.spaceNode as any).create({
    path: { space_id: spaceId },
    data: {
      obj_type: isFolder ? 'doc' : 'docx',
      parent_node_token: parentNodeToken ?? '',
      node_type: 'origin',
      title,
    },
  });
  if (res.code !== 0) {
    throw new Error(`创建节点失败: ${res.msg} (code: ${res.code})`);
  }
  return {
    nodeToken: res.data?.node?.node_token,
    objToken: res.data?.node?.obj_token,
  };
}

async function main() {
  const spaceId = process.argv[2];
  if (!spaceId) {
    console.error('用法: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/create_biz_wiki_in_space.ts <space_id>');
    process.exit(1);
  }

  console.log(`开始写入知识库 ${spaceId}...\n`);

  const folderTokens = new Map<string, string>();
  let total = 0;

  for (const item of STRUCTURE) {
    const parentToken = item.parentTitle ? folderTokens.get(item.parentTitle) : undefined;

    if (item.isFolder) {
      console.log(`📂 创建目录: ${item.title}`);
      const { nodeToken } = await createWikiNode(spaceId, item.title, true, parentToken);
      folderTokens.set(item.title, nodeToken);
      console.log(`   node_token: ${nodeToken}`);
    } else if (item.page) {
      console.log(`📄 [${++total}] ${item.title} (${item.page.blocks.length} blocks)`);
      const { nodeToken, objToken } = await createWikiNode(spaceId, item.title, false, parentToken);
      if (objToken && item.page.blocks.length > 0) {
        await writeBlocks(objToken, item.page.blocks);
      }
      console.log(`   done — node: ${nodeToken}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`完成！共写入 ${total} 篇文档`);
  console.log(`知识库地址: https://hcn2vc1r2jus.feishu.cn/wiki/${spaceId}`);
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
