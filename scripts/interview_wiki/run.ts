/**
 * 创建「商科面试三步法」飞书知识库
 * 用法：cd ~/feishu-sdk && NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" node_modules/.bin/ts-node scripts/interview_wiki/run.ts
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

const pages = [p00, p01, p02, p03, p04, p04b, p05, p06, p07, p08, p09];

const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

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

  // 1. 创建表格 block (block_type: 31)
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
    console.error('  ⚠️ 表格降级为列表');
    // fallback: 写成 bullet 列表
    const fallback = [];
    for (const row of [headers, ...rows]) {
      fallback.push({ block_type: 12, bullet: { elements: [t(row.join(' | '))], style: {} } });
    }
    await writeBlocks(documentId, fallback);
    return;
  }

  // 2. 从返回结果中提取 cell block_id 列表
  const tableBlockData = tableRes.data?.children?.[0];
  const cellBlockIds: string[] = tableBlockData?.children ?? [];

  if (cellBlockIds.length === 0) {
    console.error('  ❌ 表格无 cell');
    return;
  }

  // 3. 填充每个 cell 的内容
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
    // 避免限频
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

// ─── 写入内容（自动处理表格 + 普通 block）────────────────────────
async function writeContent(documentId: string, blocks: any[]) {
  const pending: any[] = [];

  for (const block of blocks) {
    if (block && block.__table) {
      // 先 flush 已有的普通 blocks
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

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  console.log('🚀 开始创建「商科面试三步法」文档...\n');
  const results: Array<{ title: string; parent?: string; url: string }> = [];

  for (const page of pages) {
    const indent = page.parent ? '  ' : '';
    console.log(`${indent}📄 创建：${page.title}`);

    const docRes = await (client.docx.document as any).create({
      data: { title: page.title },
    });

    if (docRes.code !== 0) {
      console.error(`  ❌ 创建文档失败:`, docRes.msg, '| code:', docRes.code);
      continue;
    }

    const docId = docRes.data?.document?.document_id!;
    await writeContent(docId, page.blocks);

    // 设置权限：租户内成员可通过链接阅读（同 business wiki 方法）
    await client.drive.permissionPublic.patch({
      path: { token: docId },
      params: { type: 'docx' as const },
      data: { link_share_entity: 'tenant_readable' } as any,
    });

    const url = `https://${DOMAIN}/docx/${docId}`;
    results.push({ title: page.title, parent: page.parent, url });
    console.log(`${indent}  ✅ ${url}`);
  }

  console.log('\n✨ 全部完成！共创建', results.length, '个文档');
  console.log('\n📋 文档目录：');
  console.log('─'.repeat(60));
  for (const r of results) {
    const prefix = r.parent ? '    └ ' : '';
    console.log(`${prefix}${r.title}`);
    console.log(`${prefix}  ${r.url}`);
  }
}

main().catch(console.error);
