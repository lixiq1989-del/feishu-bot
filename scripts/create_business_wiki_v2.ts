/**
 * 商科留学知识库 v2 — 完整版（逐校逐项目 + 申请全流程）
 *
 * 19 篇文档：导读 + 6 地区 + 申请前 4 篇 + 申请中 5 篇 + 录取后 1 篇 + 最新动态
 * 每个地区逐校拆解所有硕士项目（无 MBA）
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/create_business_wiki_v2.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载 .env
const envPath = path.resolve(__dirname, '..', '.env');
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

const { client } = require('../src/client') as typeof import('../src/client');

// 导入所有页面
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

const pages = [p00, p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14, p15, p16, p17, p18];

// ─── 向 Docx 文档写入 blocks ────────────────────────────────────

async function writeBlocks(documentId: string, blocks: any[]) {
  const chunkSize = 50;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const res = await client.docx.documentBlockChildren.create({
      path: { document_id: documentId, block_id: documentId },
      data: { children: chunk },
    } as any);
    if (res.code !== 0) {
      console.error(`  写入失败 (${i}-${i + chunk.length}):`, res.msg, res.code);
    }
  }
}

// ─── 主流程 ──────────────────────────────────────────────────────

async function main() {
  console.log('开始创建「商科留学知识库 v2」...\n');
  console.log(`共 ${pages.length} 篇文档\n`);

  const results: Array<{ title: string; url: string; blocks: number }> = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    console.log(`[${i + 1}/${pages.length}] ${page.title}（${page.blocks.length} blocks）`);

    const docRes = await (client.docx.document as any).create({
      data: { title: page.title }
    });

    if (docRes.code !== 0) {
      console.error(`  创建文档失败:`, docRes.msg, '| code:', docRes.code);
      continue;
    }

    const docId = docRes.data?.document?.document_id!;
    await writeBlocks(docId, page.blocks);

    // 设置权限：租户内成员可通过链接阅读
    const permRes = await client.drive.permissionPublic.patch({
      path: { token: docId },
      params: { type: 'docx' as const },
      data: {
        link_share_entity: 'tenant_readable',
      } as any,
    });
    if (permRes.code !== 0) {
      console.error(`  权限设置失败:`, permRes.msg, permRes.code);
    }

    const url = `https://hcn2vc1r2jus.feishu.cn/docx/${docId}`;
    results.push({ title: page.title, url, blocks: page.blocks.length });
    console.log(`  done ${url}`);

    // 避免限流
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '═'.repeat(60));
  console.log('全部完成！共创建', results.length, '篇文档');
  console.log('═'.repeat(60));
  for (const r of results) {
    console.log(`\n${r.title}（${r.blocks} blocks）`);
    console.log(`  ${r.url}`);
  }
  console.log('\n' + '═'.repeat(60));
  console.log('提示：文档已创建为独立文档。请在飞书中创建知识库空间，然后将文档移入。');
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
