/**
 * 知识库完整版发布脚本
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/kb/run_kb_pages.ts
 *
 * 说明：
 *   - 旧版 p15-p21 页面（速查版）保留不动，存放在 v1_archive/
 *   - 本脚本发布新的知识库完整版到飞书，父节点与旧版分开
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

// ─── 知识库父节点（首次运行会自动创建并打印，之后填入此处跳过重复创建）
// 如果已经创建过父节点，将 token 填入下面这行（否则留空让脚本自动创建）
let KB_PARENT_TOKEN = 'MjX7wHojriDgIrkrfjfcjr5TnPg';

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

// ─── 导入知识库页面 ──────────────────────────────────────────────
import { page as kb15 } from './kb_15_medical';
import { page as kb16 } from './kb_16_energy';
import { page as kb17 } from './kb_17_tech';
import { page as kb18 } from './kb_18_consumer';
import { page as kb19 } from './kb_19_finance';
import { page as kb20 } from './kb_20_manufacturing';
import { page as kb21 } from './kb_21_realestate';
import { page as kb22 } from './kb_22_auto';
import { page as kb23 } from './kb_23_internet';
import { page as kb24 } from './kb_24_bizservice';
import { page as kb25 } from './kb_25_logistics';

const kbPages = [kb15, kb16, kb17, kb18, kb19, kb20, kb21, kb22, kb23, kb24, kb25];

// ─── 列出子节点 ──────────────────────────────────────────────────
async function listChildren(parentToken: string): Promise<Array<{ title: string; node_token: string }>> {
  const r = await api('GET', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes?parent_node_token=${parentToken}&page_size=50`);
  return r?.data?.items ?? [];
}

// ─── 删除节点 ────────────────────────────────────────────────────
async function deleteNode(nodeToken: string) {
  try {
    const r = await api('DELETE', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${nodeToken}`);
    if (r?.code !== 0) console.log(`  ⚠️  删除跳过: ${r?.code} ${r?.msg}`);
  } catch {
    console.log(`  ⚠️  删除API不支持，跳过`);
  }
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
    console.warn(`  ⚠️  表格创建失败，降级为列表`);
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
  console.log(`    ✓ 表格 ${numRows}×${numCols}`);
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
  console.log('🚀 发布行业知识库（完整版）...\n');

  // Step 1：创建或找到知识库父节点
  if (!KB_PARENT_TOKEN) {
    console.log('📁 创建知识库父节点...');
    const { nodeToken } = await createNode('📚 行业知识库（完整版）', ROOT_NODE_TOKEN);
    KB_PARENT_TOKEN = nodeToken;
    console.log(`  ✅ 父节点已创建：${KB_PARENT_TOKEN}`);
    console.log(`  💡 请将此 token 填入 run_kb_pages.ts 第 24 行 KB_PARENT_TOKEN，下次跳过创建\n`);
    await sleep(500);
  } else {
    console.log(`📁 使用已有父节点：${KB_PARENT_TOKEN}\n`);
  }

  // Step 2：删除同名旧页面（幂等重发布）
  console.log('🔍 查找并删除旧版本...');
  const existing = await listChildren(KB_PARENT_TOKEN);
  const pageTitles = new Set(kbPages.map(p => p.title));
  for (const node of existing) {
    if (pageTitles.has(node.title)) {
      console.log(`  🗑️  删除: ${node.title}`);
      await deleteNode(node.node_token);
      await sleep(400);
    }
  }
  console.log('');

  // Step 3：发布各页面
  for (const page of kbPages) {
    console.log(`📄 发布：${page.title}`);
    const { nodeToken, objToken } = await createNode(page.title, KB_PARENT_TOKEN);
    await writeContent(objToken, page.blocks);
    console.log(`  ✅ https://${DOMAIN}/wiki/${nodeToken}\n`);
    await sleep(300);
  }

  console.log('✨ 完成！');
}

main().catch(console.error);
