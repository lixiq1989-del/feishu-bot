/**
 * 只发布行业详细页面（14-21）到飞书知识库
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/run_industry_pages.ts
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

// ─── Token ───────────────────────────────────────────────────────
const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
const USER_TOKEN = tokenData.access_token;
const SPACE_ID = '7615113124324117443';
const ROOT_NODE_TOKEN = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

// ─── API helper ──────────────────────────────────────────────────
function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn', path: urlPath, method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(d.slice(0, 200))); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── 导入所有页面 ────────────────────────────────────────────────
import { page as p14 } from './14_industry';
import { page as p15 } from './15_health';
import { page as p16 } from './16_energy';
import { page as p17 } from './17_tech';
import { page as p18 } from './18_consumer';
import { page as p19 } from './19_finance';
import { page as p20 } from './20_manufacturing';
import { page as p21 } from './21_realestate';

// p14 已发布，nodeToken 已知；只更新子页面 p15-p21
const P14_NODE_TOKEN = 'E7newHwyci2rCNkMC2lcUfHqnBf';
const childPages = [p15, p16, p17, p18, p19, p20, p21];

// ─── 列出子节点 ──────────────────────────────────────────────────
async function listChildren(parentToken: string): Promise<Array<{ title: string; node_token: string }>> {
  const r = await api('GET', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes?parent_node_token=${parentToken}&page_size=50`);
  return r?.data?.items ?? [];
}

// ─── 删除节点 ────────────────────────────────────────────────────
async function deleteNode(nodeToken: string) {
  const r = await api('DELETE', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${nodeToken}`);
  if (r.code !== 0) console.error(`  ❌ 删除失败: ${r.code} ${r.msg}`);
}

// ─── 写入普通 blocks ─────────────────────────────────────────────
async function writeBlocks(objToken: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 50) {
    const chunk = blocks.slice(i, i + 50);
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: chunk, index: i }
    );
    if (r.code !== 0) console.error(`  ❌ blocks失败 (${i}): ${r.code} ${r.msg}`);
    if (i + 50 < blocks.length) await sleep(400);
  }
}

// ─── 写入表格 ────────────────────────────────────────────────────
function t(content: string) { return { text_run: { content, text_element_style: {} } }; }
function pBlock(...elements: any[]) { return { block_type: 2, text: { elements, style: {} } }; }

async function writeTable(objToken: string, headers: string[], rows: string[][]) {
  const numRows = rows.length + 1;
  const numCols = headers.length;

  const tableRes = await api('POST',
    `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }] }
  );

  if (tableRes.code !== 0) {
    const fallback = [headers, ...rows].map(row => ({
      block_type: 12, bullet: { elements: [t(row.join(' | '))], style: {} }
    }));
    await writeBlocks(objToken, fallback);
    return;
  }

  const cellBlockIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellBlockIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols);
    const colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;
    const cellRes = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${cellBlockIds[idx]}/children`,
      { children: [pBlock(t(content))] }
    );
    if (cellRes.code !== 0) console.error(`  ❌ cell[${rowIdx}][${colIdx}]: ${cellRes.msg}`);
    await sleep(150);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

// ─── 写入内容（自动处理表格）────────────────────────────────────
async function writeContent(objToken: string, blocks: any[]) {
  const pending: any[] = [];
  for (const block of blocks) {
    if (block && block.__table) {
      if (pending.length > 0) { await writeBlocks(objToken, [...pending]); pending.length = 0; }
      await writeTable(objToken, block.headers, block.rows);
    } else {
      pending.push(block);
    }
  }
  if (pending.length > 0) await writeBlocks(objToken, pending);
}

// ─── 创建 wiki 节点 ──────────────────────────────────────────────
async function createNode(title: string, parentToken: string): Promise<{ nodeToken: string; objToken: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
        obj_type: 'docx', parent_wiki_token: parentToken, node_type: 'origin', title,
      });
      if (r.code !== 0) throw new Error(`${r.code} ${r.msg}`);
      return { nodeToken: r.data.node.node_token, objToken: r.data.node.obj_token };
    } catch(e: any) {
      if (attempt === 2) throw e;
      await sleep(1500);
    }
  }
  throw new Error('createNode failed');
}

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  console.log('🚀 开始更新行业详细子页面（p15-p21）...\n');

  // Step 1: 列出 p14 下的现有子节点，按标题删除旧版本
  console.log('🔍 查找并删除旧子页面...');
  const existing = await listChildren(P14_NODE_TOKEN);
  const childTitles = new Set(childPages.map(p => p.title));
  for (const node of existing) {
    if (childTitles.has(node.title)) {
      console.log(`  🗑️  删除: ${node.title}`);
      await deleteNode(node.node_token);
      await sleep(400);
    }
  }
  console.log('');

  // Step 2: 创建新版本子页面
  for (const page of childPages) {
    console.log(`  📄 ${page.title}`);
    const { nodeToken, objToken } = await createNode(page.title, P14_NODE_TOKEN);
    await writeContent(objToken, page.blocks);
    console.log(`    ✅ https://${DOMAIN}/wiki/${nodeToken}`);
    await sleep(300);
  }

  console.log('\n✨ 完成！');
}

main().catch(console.error);
