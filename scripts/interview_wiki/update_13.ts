/**
 * 更新 5.3 各大厂高频真题解析（已有页面，重新写内容）
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *   node_modules/.bin/ts-node scripts/interview_wiki/update_13.ts
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
let USER_TOKEN: string;
try {
  USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
  if (!USER_TOKEN) throw new Error('access_token 为空');
} catch (e: any) {
  console.error('❌ 无法读取用户 token:', e.message);
  process.exit(1);
}

const SPACE_ID = '7615113124324117443';
const PARENT_NODE_TOKEN = 'BWoewiQF5iVxkbknkl2cXqS0nTe'; // Part 5 总览页
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

import { page as p13 } from './13_internet_questions';

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
  console.log('🔄 新建「5.3 各大厂高频真题解析（详细版）」...\n');

  // 新建一个页面（挂在 Part5 总览下面）
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    node_type: 'origin',
    parent_node_token: PARENT_NODE_TOKEN,
    title: p13.title + '（详细版）',
  });

  if (r.code !== 0) {
    console.error('❌ 创建节点失败:', r.msg);
    return;
  }

  const nodeToken = r.data.node.node_token;
  const objToken = r.data.node.obj_token;
  console.log('✅ 节点创建成功:', nodeToken);

  await writeBlocks(objToken, p13.blocks);

  console.log('\n🎉 完成！');
  console.log(`   链接: https://${DOMAIN}/wiki/${nodeToken}`);
}

main().catch(console.error);
