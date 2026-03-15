/**
 * 把「商科面试三步法」所有页面发布到指定飞书知识库
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/run_wiki.ts [space_id]
 *
 * space_id 从 wiki URL 里取，如：
 *   https://hcn2vc1r2jus.feishu.cn/wiki/BJL1wFOwCiNFWtkrVvUcE9ndnyd
 *   → space_id = BJL1wFOwCiNFWtkrVvUcE9ndnyd
 */

import * as fs from 'fs';
import * as path from 'path';
import { p, t } from './blocks';

// ─── 加载 .env ───────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '..', '.env');
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
const { client } = require('../../src/client') as typeof import('../../src/client');

// ─── 导入所有页面 ────────────────────────────────────────────────
import { page as p00 } from './00_intro';
import { page as p01 } from './01_part1';
import { page as p02 } from './02_part2';
import { page as p03 } from './03_step1';
import { page as p04 } from './04_step2';
import { page as p04b } from './04b_step2_pro';
import { page as p05 } from './05_step3';
import { page as p06 } from './06_behavioral';
import { page as p07 } from './07_case';
import { page as p08 } from './08_resume';
import { page as p09 } from './09_part4';
import { page as p14 } from './14_industry';
import { page as p15 } from './15_health';
import { page as p16 } from './16_energy';
import { page as p17 } from './17_tech';
import { page as p18 } from './18_consumer';
import { page as p19 } from './19_finance';
import { page as p20 } from './20_manufacturing';
import { page as p21 } from './21_realestate';

const pages = [p00, p01, p02, p03, p04, p04b, p05, p06, p07, p08, p09, p14, p15, p16, p17, p18, p19, p20, p21];

const DOMAIN = 'hcn2vc1r2jus.feishu.cn';
const DEFAULT_SPACE_ID = '7615113124324117443';
// 知识库根节点 token（Homepage），根级页面挂在这里
const ROOT_NODE_TOKEN = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd';

// ─── 写入普通 blocks ─────────────────────────────────────────────
async function writeBlocks(documentId: string, blocks: any[]) {
  const chunkSize = 50;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const res = await client.docx.documentBlockChildren.create({
      path: { document_id: documentId, block_id: documentId },
      data: { children: chunk },
    } as any);
    if (res.code !== 0) {
      console.error(`  ❌ 写入blocks失败 (${i}-${i + chunk.length}):`, res.msg, res.code);
    }
  }
}

// ─── 写入飞书表格 ────────────────────────────────────────────────
async function writeTable(documentId: string, headers: string[], rows: string[][]) {
  const numRows = rows.length + 1;
  const numCols = headers.length;

  let tableRes: any;
  try {
    tableRes = await (client.docx.documentBlockChildren as any).create({
      path: { document_id: documentId, block_id: documentId },
      data: {
        children: [{
          block_type: 31,
          table: { property: { row_size: numRows, column_size: numCols } },
        }],
      },
    });
  } catch (e: any) {
    console.error('  ❌ 创建表格异常:', e?.response?.data?.msg || e.message);
    tableRes = { code: -1 };
  }

  if (tableRes.code !== 0) {
    const fallback = [];
    for (const row of [headers, ...rows]) {
      fallback.push({ block_type: 12, bullet: { elements: [t(row.join(' | '))], style: {} } });
    }
    await writeBlocks(documentId, fallback);
    return;
  }

  const tableBlockData = tableRes.data?.children?.[0];
  const cellBlockIds: string[] = tableBlockData?.children ?? [];

  if (cellBlockIds.length === 0) {
    console.error('  ❌ 表格无 cell');
    return;
  }

  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellBlockIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols);
    const colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;

    const cellRes = await (client.docx.documentBlockChildren as any).create({
      path: { document_id: documentId, block_id: cellBlockIds[idx] },
      data: { children: [p(t(content))] },
    });
    if (cellRes.code !== 0) {
      console.error(`  ❌ cell[${rowIdx}][${colIdx}]:`, cellRes.msg);
    }
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

// ─── 写入内容（自动处理表格 + 普通 block）────────────────────────
async function writeContent(documentId: string, blocks: any[]) {
  const pending: any[] = [];

  for (const block of blocks) {
    if (block && block.__table) {
      if (pending.length > 0) {
        await writeBlocks(documentId, [...pending]);
        pending.length = 0;
      }
      await writeTable(documentId, block.headers, block.rows);
    } else {
      pending.push(block);
    }
  }

  if (pending.length > 0) {
    await writeBlocks(documentId, pending);
  }
}

// ─── 在知识库中创建一个节点，返回 { nodeToken, objToken } ────────
async function createWikiNode(
  spaceId: string,
  title: string,
  parentNodeToken?: string
): Promise<{ nodeToken: string; objToken: string }> {
  const res = await (client.wiki.spaceNode as any).create({
    path: { space_id: spaceId },
    data: {
      obj_type: 'docx',
      parent_node_token: parentNodeToken ?? '',
      node_type: 'origin',
      title,
    },
  });

  if (res.code !== 0) {
    throw new Error(`创建wiki节点失败: code=${res.code} msg=${res.msg}`);
  }

  const node = res.data?.node;
  const nodeToken = node?.node_token;
  const objToken = node?.obj_token;

  if (!nodeToken || !objToken) {
    throw new Error(`创建wiki节点返回数据异常: ${JSON.stringify(res.data)}`);
  }

  return { nodeToken, objToken };
}

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  const spaceId = process.argv[2] || DEFAULT_SPACE_ID;
  console.log(`🚀 开始发布「商科面试三步法」到知识库 ${spaceId}...\n`);

  // title → nodeToken 的映射，用于建立父子关系
  const nodeMap = new Map<string, string>();
  const results: Array<{ title: string; parent?: string; wikiUrl: string }> = [];

  for (const page of pages) {
    const indent = page.parent ? '  ' : '';
    console.log(`${indent}📄 创建：${page.title}`);

    // 根级页面挂在 Homepage 节点下，子页面挂在对应父节点下
    const parentNodeToken = page.parent
      ? nodeMap.get(page.parent)
      : ROOT_NODE_TOKEN;

    let nodeToken: string = '';
    let objToken: string = '';

    // 第一次请求可能 ECONNRESET（SSL issue），retry 最多 3 次
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        ({ nodeToken, objToken } = await createWikiNode(spaceId, page.title, parentNodeToken));
        break;
      } catch (e: any) {
        if (attempt === 2) {
          console.error(`${indent}  ❌ 节点创建失败:`, e.message);
        } else {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }
    if (!nodeToken) continue;

    // 记录 nodeToken 供子页面使用
    nodeMap.set(page.title, nodeToken);

    // 用 objToken（docx document_id）写入内容
    await writeContent(objToken, page.blocks);

    const wikiUrl = `https://${DOMAIN}/wiki/${nodeToken}`;
    results.push({ title: page.title, parent: page.parent, wikiUrl });
    console.log(`${indent}  ✅ ${wikiUrl}`);

    // 避免限频
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n✨ 全部完成！共发布', results.length, '个页面');
  console.log('\n📋 知识库目录：');
  console.log('─'.repeat(60));
  for (const r of results) {
    const prefix = r.parent ? '    └ ' : '';
    console.log(`${prefix}${r.title}`);
    console.log(`${prefix}  ${r.wikiUrl}`);
  }
  console.log(`\n🔗 知识库首页: https://${DOMAIN}/wiki/${spaceId}`);
}

main().catch(console.error);
