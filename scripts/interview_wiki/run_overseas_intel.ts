/**
 * 把「海外咨询求职情报」写入飞书知识库
 *
 * 目标节点：https://hcn2vc1r2jus.feishu.cn/wiki/W1ohwQfKviDg3IkeV68c0N0bnyc
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/run_overseas_intel.ts
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

// ─── 导入情报页面 ────────────────────────────────────────────────
import { page as round1 } from './40_overseas_intel_round1';

const pages = [round1];

const DOMAIN = 'hcn2vc1r2jus.feishu.cn';
const DEFAULT_SPACE_ID = '7615113124324117443';
// 父节点：海外情报库的根节点
const PARENT_NODE_TOKEN = 'W1ohwQfKviDg3IkeV68c0N0bnyc';

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

// ─── 在知识库中创建一个节点 ──────────────────────────────────────
async function createWikiNode(
  spaceId: string,
  title: string,
  parentNodeToken: string
): Promise<{ nodeToken: string; objToken: string }> {
  const res = await (client.wiki.spaceNode as any).create({
    path: { space_id: spaceId },
    data: {
      obj_type: 'docx',
      parent_node_token: parentNodeToken,
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
  console.log(`🚀 开始发布「海外咨询求职情报」到知识库...`);
  console.log(`   父节点: https://${DOMAIN}/wiki/${PARENT_NODE_TOKEN}\n`);

  for (const page of pages) {
    console.log(`📄 创建：${page.title}`);

    let nodeToken = '';
    let objToken = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        ({ nodeToken, objToken } = await createWikiNode(spaceId, page.title, PARENT_NODE_TOKEN));
        break;
      } catch (e: any) {
        if (attempt === 2) {
          console.error(`  ❌ 节点创建失败:`, e.message);
        } else {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }
    if (!nodeToken) continue;

    await writeContent(objToken, page.blocks);

    const wikiUrl = `https://${DOMAIN}/wiki/${nodeToken}`;
    console.log(`  ✅ ${wikiUrl}`);

    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n✨ 发布完成！');
}

main().catch(console.error);
