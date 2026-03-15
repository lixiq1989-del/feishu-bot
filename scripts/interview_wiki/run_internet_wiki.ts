/**
 * 把互联网面试专题（Part 5）发布到飞书知识库
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *   node_modules/.bin/ts-node scripts/interview_wiki/run_internet_wiki.ts
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

const SPACE_ID = '7615113124324117443';
const ROOT_NODE_TOKEN = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

import { page as p10 } from './10_internet_intro';
import { page as p11 } from './11_internet_product';
import { page as p12 } from './12_internet_data';
import { page as p13 } from './13_internet_questions';

const pages = [p10, p11, p12, p13];

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

async function createWikiNode(title: string, parentToken: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    node_type: 'origin',
    parent_node_token: parentToken,
    title,
  });
  if (r.code !== 0) throw new Error(`创建wiki节点失败: code=${r.code} msg=${r.msg}`);
  return { nodeToken: r.data.node.node_token, objToken: r.data.node.obj_token };
}

async function writeBlocks(objToken: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, {
      children: blocks.slice(i, i + 50),
      index: i,
    });
    if (r.code !== 0) console.error(`  ❌ 写blocks失败 (${i}): code=${r.code} msg=${r.msg}`);
    if (i + 50 < blocks.length) await sleep(400);
  }
}

async function main() {
  console.log('🚀 发布「互联网大厂面试专题」到知识库...\n');

  const nodeMap = new Map<string, string>();
  const results: Array<{ title: string; wikiUrl: string }> = [];

  for (const page of pages) {
    const indent = page.parent ? '  ' : '';
    console.log(`${indent}📄 创建：${page.title}`);

    const parentToken = page.parent ? (nodeMap.get(page.parent) ?? ROOT_NODE_TOKEN) : ROOT_NODE_TOKEN;

    let nodeToken = '';
    let objToken = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        ({ nodeToken, objToken } = await createWikiNode(page.title, parentToken));
        break;
      } catch (e: any) {
        if (attempt === 2) console.error(`${indent}  ❌ 节点创建失败:`, e.message);
        else await sleep(1500);
      }
    }
    if (!nodeToken) continue;

    nodeMap.set(page.title, nodeToken);
    await writeBlocks(objToken, page.blocks);

    const wikiUrl = `https://${DOMAIN}/wiki/${nodeToken}`;
    results.push({ title: page.title, wikiUrl });
    console.log(`${indent}  ✅ ${wikiUrl}`);
    await sleep(300);
  }

  console.log('\n✨ 完成！共发布', results.length, '个页面\n');
  for (const r of results) console.log(`  ${r.title}\n  ${r.wikiUrl}\n`);
}

main().catch(console.error);
