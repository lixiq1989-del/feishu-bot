/**
 * 英国商科求职知识库 — 发布所有子页面到飞书 Wiki
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/uk_jobs_wiki/run_subpages.ts
 *
 * 前提：~/startup-7steps/.feishu-user-token.json 存在且未过期（7200s）
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

// ─── 用户 token ─────────────────────────────────────────────────────
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

// ─── 配置 ───────────────────────────────────────────────────────────
const SPACE_ID = '7615701011126029275';  // 英国商科求职知识库
const PARENT_NODE_TOKEN = 'PECkwc1ZDiR5fzkAQHccLh4gnNc';  // 知识库首页
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

// ─── HTTP ────────────────────────────────────────────────────────────
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
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 500))); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Block 工厂（与 biz_wiki/blocks.ts 保持一致）────────────────────
function t(content: string, style?: any) { return { text_run: { content, text_element_style: style ?? {} } }; }
function p(...elements: any[]) { return { block_type: 2, text: { elements, style: {} } }; }

// ─── 写普通 Blocks ───────────────────────────────────────────────────
async function writeBlocks(objToken: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: blocks.slice(i, i + 50), index: i }
    );
    if (r.code !== 0) {
      console.error(`  ❌ writeBlocks失败 (${i}-${i + 50}): code=${r.code} msg=${r.msg}`);
    } else {
      process.stdout.write('.');
    }
    if (i + 50 < blocks.length) await sleep(400);
  }
}

// ─── 写表格 ──────────────────────────────────────────────────────────
async function writeTable(objToken: string, headers: string[], rows: string[][]) {
  const numRows = rows.length + 1;
  const numCols = headers.length;

  // Step1: 创建 table block
  const tableRes = await api('POST',
    `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }] }
  );

  if (tableRes.code !== 0) {
    console.error(`  ❌ 创建表格失败: ${tableRes.code} ${tableRes.msg}`);
    // Fallback: 用 bullet 代替
    const fallback = [headers, ...rows].map(row => ({
      block_type: 12, bullet: { elements: [t(row.join(' | '))], style: {} }
    }));
    await writeBlocks(objToken, fallback);
    return;
  }

  const cellBlockIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  if (cellBlockIds.length === 0) {
    console.error('  ❌ 表格无 cell，用 fallback');
    return;
  }

  // Step2: 逐 cell 填内容
  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellBlockIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols);
    const colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;

    const cellRes = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${cellBlockIds[idx]}/children`,
      { children: [p(t(content))] }
    );
    if (cellRes.code !== 0) {
      console.error(`  ❌ cell[${rowIdx}][${colIdx}]: ${cellRes.code} ${cellRes.msg}`);
    }
    await sleep(150);
  }
  process.stdout.write(`[表格${numRows}×${numCols}]`);
}

// ─── 写内容（自动处理 tableBlock + 普通 blocks）──────────────────────
async function writeContent(objToken: string, blocks: any[]) {
  const pending: any[] = [];

  for (const block of blocks) {
    if (block && block.__table) {
      if (pending.length > 0) {
        await writeBlocks(objToken, [...pending]);
        pending.length = 0;
        await sleep(300);
      }
      await writeTable(objToken, block.headers, block.rows);
      await sleep(300);
    } else {
      pending.push(block);
    }
  }

  if (pending.length > 0) {
    await writeBlocks(objToken, pending);
  }
  console.log();
}

// ─── 创建子页面 ──────────────────────────────────────────────────────
async function createPage(title: string, blocks: any[]): Promise<string | null> {
  console.log(`\n📄 创建：${title}`);

  let r: any;
  // retry 3次（第一次可能 ECONNRESET）
  for (let attempt = 0; attempt < 3; attempt++) {
    r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
      obj_type: 'docx',
      parent_node_token: PARENT_NODE_TOKEN,
      node_type: 'origin',
      title,
    });
    if (r.code === 0) break;
    if (attempt < 2) await sleep(1500);
  }

  if (r.code !== 0) {
    console.error(`  ❌ 创建失败: ${r.code} ${r.msg}`);
    return null;
  }

  const nodeToken = r.data?.node?.node_token;
  const objToken = r.data?.node?.obj_token;
  console.log(`  node_token: ${nodeToken}`);

  await sleep(600);
  await writeContent(objToken, blocks);

  console.log(`  ✅ https://${DOMAIN}/wiki/${nodeToken}`);
  return nodeToken;
}

// ─── 导入所有内容页面 ────────────────────────────────────────────────
import { page as companies } from './content_companies';
import { page as interview } from './content_interview';
import { page as salary } from './content_salary';
import { page as timeline } from './content_timeline';
import { page as chineseStudents } from './content_chinese_students';
import { page as consultingTrends } from './content_consulting_trends';
import { page as cvLinkedin } from './content_cv_linkedin';
import { page as qaByCompany } from './content_qa_by_company';
import { page as consultingCases } from './content_consulting_cases';
import { page as ibTechnical } from './content_ib_technical';
import { page as realStories } from './content_real_stories';
import { page as fintechAssetmgmt } from './content_fintech_assetmgmt';
import { page as assessmentCentre } from './content_assessment_centre';
import { page as visaGuide } from './content_visa_guide';
import { page as networking } from './content_networking';
import { page as workplaceCulture } from './content_workplace_culture';

const pages = [
  assessmentCentre,
  visaGuide,
  networking,
  workplaceCulture,
];

// ─── 主流程 ──────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 开始发布「英国商科求职」子页面...\n');
  console.log(`📁 父节点: https://${DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
  console.log(`📚 共 ${pages.length} 个页面待发布\n`);

  const results: Array<{ title: string; url: string }> = [];

  for (const page of pages) {
    const nodeToken = await createPage(page.title, page.blocks);
    if (nodeToken) {
      results.push({ title: page.title, url: `https://${DOMAIN}/wiki/${nodeToken}` });
    }
    await sleep(800);
  }

  console.log('\n\n✨ 全部完成！共发布', results.length, '个页面');
  console.log('\n📋 页面目录：');
  console.log('─'.repeat(60));
  for (const r of results) {
    console.log(`  ${r.title}`);
    console.log(`    ${r.url}`);
  }
  console.log(`\n🔗 知识库首页: https://${DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
