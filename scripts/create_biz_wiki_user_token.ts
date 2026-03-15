/**
 * 商科留学知识库 — 用用户 token 写入飞书知识库
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/create_biz_wiki_user_token.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const SPACE_ID = '7615113433280695257';
const TOKEN_FILE = path.join(__dirname, '../../startup-7steps/.feishu-user-token.json');
const USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;

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

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function api(method: string, apiPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: apiPath,
      method,
      headers: {
        'Authorization': 'Bearer ' + USER_TOKEN,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', (c: any) => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function createWikiNode(title: string, parentToken?: string): Promise<{ node_token: string; obj_token: string }> {
  const resp = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    node_type: 'origin',
    parent_wiki_token: parentToken ?? '',
    title,
  });
  if (resp.code !== 0) throw new Error(`创建节点失败 [${title}]: ${resp.msg} (${resp.code})`);
  return resp.data.node;
}

async function fillDoc(docToken: string, blocks: any[]) {
  const BATCH = 50;
  for (let i = 0; i < blocks.length; i += BATCH) {
    const chunk = blocks.slice(i, i + BATCH);
    const res = await api('POST', `/open-apis/docx/v1/documents/${docToken}/blocks/${docToken}/children`, {
      children: chunk,
    });
    if (res.code !== 0) {
      console.error(`  写入失败 (${i}):`, res.msg, res.code);
    }
    if (i + BATCH < blocks.length) await sleep(300);
  }
}

// 知识库结构
const STRUCTURE: Array<{
  title: string;
  page: typeof p00 | null;
  isSection: boolean;
  parentSection?: string;
}> = [
  { title: p00.title, page: p00, isSection: false },

  { title: '📍 各地区项目详解', page: null, isSection: true },
  { title: p01.title, page: p01, isSection: false, parentSection: '📍 各地区项目详解' },
  { title: p02.title, page: p02, isSection: false, parentSection: '📍 各地区项目详解' },
  { title: p03.title, page: p03, isSection: false, parentSection: '📍 各地区项目详解' },
  { title: p04.title, page: p04, isSection: false, parentSection: '📍 各地区项目详解' },
  { title: p05.title, page: p05, isSection: false, parentSection: '📍 各地区项目详解' },
  { title: p06.title, page: p06, isSection: false, parentSection: '📍 各地区项目详解' },

  { title: '📋 申请前规划', page: null, isSection: true },
  { title: p07.title, page: p07, isSection: false, parentSection: '📋 申请前规划' },
  { title: p08.title, page: p08, isSection: false, parentSection: '📋 申请前规划' },
  { title: p09.title, page: p09, isSection: false, parentSection: '📋 申请前规划' },
  { title: p10.title, page: p10, isSection: false, parentSection: '📋 申请前规划' },
  { title: p12.title, page: p12, isSection: false, parentSection: '📋 申请前规划' },
  { title: p15.title, page: p15, isSection: false, parentSection: '📋 申请前规划' },

  { title: '✍️ 申请中实操', page: null, isSection: true },
  { title: p13.title, page: p13, isSection: false, parentSection: '✍️ 申请中实操' },
  { title: p14.title, page: p14, isSection: false, parentSection: '✍️ 申请中实操' },
  { title: p16.title, page: p16, isSection: false, parentSection: '✍️ 申请中实操' },
  { title: p17.title, page: p17, isSection: false, parentSection: '✍️ 申请中实操' },

  { title: '🎓 录取后 & 最新动态', page: null, isSection: true },
  { title: p18.title, page: p18, isSection: false, parentSection: '🎓 录取后 & 最新动态' },
  { title: p11.title, page: p11, isSection: false, parentSection: '🎓 录取后 & 最新动态' },
];

async function main() {
  console.log('开始写入知识库（用户 token）...\n');
  console.log(`Space: ${SPACE_ID}\n`);

  const sectionTokens = new Map<string, string>();
  let docCount = 0;

  for (const item of STRUCTURE) {
    if (item.isSection) {
      process.stdout.write(`📂 ${item.title}...`);
      const node = await createWikiNode(item.title);
      sectionTokens.set(item.title, node.node_token);
      console.log(` ✓ (${node.node_token})`);
      await sleep(600);
    } else if (item.page) {
      const parentToken = item.parentSection ? sectionTokens.get(item.parentSection) : undefined;
      process.stdout.write(`   📄 [${++docCount}] ${item.title} (${item.page.blocks.length} blocks)...`);
      const node = await createWikiNode(item.title, parentToken);
      if (item.page.blocks.length > 0) {
        await fillDoc(node.obj_token, item.page.blocks);
      }
      console.log(` ✓`);
      await sleep(600);
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`完成！共写入 ${docCount} 篇文档`);
  console.log(`知识库地址: https://hcn2vc1r2jus.feishu.cn/wiki/${SPACE_ID}`);
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
