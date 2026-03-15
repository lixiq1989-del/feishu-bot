/**
 * 用用户 OAuth token 把「商科面试三步法」发布到飞书知识库
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/run_wiki_oauth.ts
 *
 * 前提：~/startup-7steps/.feishu-user-token.json 存在且未过期
 * 如需刷新 token，先运行：
 *   cd ~/startup-7steps && NODE_TLS_REJECT_UNAUTHORIZED=0 node feishu-auth.js
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

// ─── 读取用户 token ───────────────────────────────────────────────
const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
let USER_TOKEN: string;
try {
  USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
  if (!USER_TOKEN) throw new Error('access_token 为空');
} catch (e: any) {
  console.error('❌ 无法读取用户 token:', e.message);
  console.error('   请先运行: cd ~/startup-7steps && NODE_TLS_REJECT_UNAUTHORIZED=0 node feishu-auth.js');
  process.exit(1);
}

// ─── 常量 ────────────────────────────────────────────────────────
const SPACE_ID = '7615113124324117443';
const ROOT_NODE_TOKEN = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

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

// ─── HTTPS 工具函数 ───────────────────────────────────────────────
function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(`JSON parse error: ${d}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── 创建 wiki 节点 ───────────────────────────────────────────────
async function createWikiNode(title: string, parentToken: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    node_type: 'origin',
    parent_node_token: parentToken,
    title,
  });
  if (r.code !== 0) throw new Error(`创建wiki节点失败: code=${r.code} msg=${r.msg}`);
  return {
    nodeToken: r.data.node.node_token,
    objToken: r.data.node.obj_token,
  };
}

// ─── 写普通 blocks ────────────────────────────────────────────────
async function writeBlocks(objToken: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, {
      children: blocks.slice(i, i + 50),
      index: i,
    });
    if (r.code !== 0) {
      console.error(`  ❌ 写blocks失败 (${i}-${i + 50}): code=${r.code} msg=${r.msg}`);
    }
    if (i + 50 < blocks.length) await sleep(400);
  }
}

// ─── 写表格 ───────────────────────────────────────────────────────
async function writeTable(objToken: string, headers: string[], rows: string[][]) {
  const numRows = rows.length + 1;
  const numCols = headers.length;

  const tableRes = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, {
    children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }],
  });

  if (tableRes.code !== 0) {
    console.error('  ❌ 创建表格失败:', tableRes.msg, '— 降级为 bullet');
    const fallback = [headers, ...rows].map(row => ({
      block_type: 12,
      bullet: { elements: [{ text_run: { content: row.join(' | ') } }], style: {} },
    }));
    await writeBlocks(objToken, fallback);
    return;
  }

  const cellIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  if (cellIds.length === 0) {
    console.error('  ❌ 表格无 cell，跳过');
    return;
  }

  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols);
    const colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;
    const cellRes = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${cellIds[idx]}/children`, {
      children: [{ block_type: 2, text: { elements: [{ text_run: { content, text_element_style: {} } }], style: {} } }],
    });
    if (cellRes.code !== 0) console.error(`  ❌ cell[${rowIdx}][${colIdx}]: ${cellRes.msg}`);
    await sleep(150);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

// ─── 写内容（分发普通 block 和表格）─────────────────────────────
async function writeContent(objToken: string, blocks: any[]) {
  const pending: any[] = [];
  for (const block of blocks) {
    if (block?.__table) {
      if (pending.length > 0) {
        await writeBlocks(objToken, [...pending]);
        pending.length = 0;
      }
      await writeTable(objToken, block.headers, block.rows);
    } else {
      pending.push(block);
    }
  }
  if (pending.length > 0) await writeBlocks(objToken, pending);
}

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  console.log(`🚀 开始发布「商科面试三步法」到知识库...\n`);

  const nodeMap = new Map<string, string>();
  const results: Array<{ title: string; parent?: string; wikiUrl: string }> = [];

  for (const page of pages) {
    const indent = page.parent ? '  ' : '';
    console.log(`${indent}📄 创建：${page.title}`);

    const parentToken = page.parent ? nodeMap.get(page.parent) ?? ROOT_NODE_TOKEN : ROOT_NODE_TOKEN;

    let nodeToken = '';
    let objToken = '';

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        ({ nodeToken, objToken } = await createWikiNode(page.title, parentToken));
        break;
      } catch (e: any) {
        if (attempt === 2) {
          console.error(`${indent}  ❌ 节点创建失败:`, e.message);
        } else {
          await sleep(1500);
        }
      }
    }
    if (!nodeToken) continue;

    nodeMap.set(page.title, nodeToken);
    await writeContent(objToken, page.blocks);

    const wikiUrl = `https://${DOMAIN}/wiki/${nodeToken}`;
    results.push({ title: page.title, parent: page.parent, wikiUrl });
    console.log(`${indent}  ✅ ${wikiUrl}`);
    await sleep(300);
  }

  console.log('\n✨ 全部完成！共发布', results.length, '个页面\n');
  console.log('📋 知识库目录：');
  console.log('─'.repeat(60));
  for (const r of results) {
    const prefix = r.parent ? '    └ ' : '';
    console.log(`${prefix}${r.title}`);
    console.log(`${prefix}  ${r.wikiUrl}`);
  }
  console.log(`\n🔗 知识库首页: https://${DOMAIN}/wiki/${SPACE_ID}`);
}

main().catch(console.error);
