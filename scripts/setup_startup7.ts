/**
 * 创业7步法：创建文件夹 + 移动文档 + 设置权限
 *
 * 运行: cd ~/feishu-sdk && NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/setup_startup7.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) {
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const { client } = require('../src/client') as typeof import('../src/client');

// 7篇文档的 document_id
const DOCS = [
  { title: '第一步：找需求', docId: 'BSovdPWmFoPMKPxakDzctI16nh7' },
  { title: '第二步：设计产品', docId: 'SrTqdQKMzoyXKyxqO9DcTOCmnEb' },
  { title: '第三步：搭商业模式', docId: 'QhtJdsJXioRI4BxiVzOcMsCmnuf' },
  { title: '第四步：获客', docId: 'PATtdnFa2ofSnWx32MNcOhlpntf' },
  { title: '第五步：转化', docId: 'H4pJdt5wLoDvfuxPzT5cBhu6nXp' },
  { title: '第六步：交付', docId: 'VdKRdSdhaoc1JNx8qTqcNvPvni9' },
  { title: '第七步：复购增长', docId: 'OwGOdA2HpoETC3xyecmcAU1Rnie' },
];

async function setDocPermission(token: string) {
  const res = await client.drive.permissionPublic.patch({
    path: { token },
    params: { type: 'docx' as const },
    data: {
      external_access: true,
      link_share_entity: 'anyone_readable',
      copy_entity: 'only_full_access',
    } as any,
  });
  return res;
}

const FOLDER_TOKEN = 'RyhRfTWLulrYcYdlDrUcKHDln0f';

async function main() {
  console.log('=== 创业7步法：设置文档权限 ===\n');
  console.log(`文件夹: https://hcn2vc1r2jus.feishu.cn/drive/folder/${FOLDER_TOKEN}\n`);

  // 设置每篇文档的权限：外部可读、不可复制
  for (const doc of DOCS) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await setDocPermission(doc.docId);
      if (res.code === 0) {
        console.log(`OK ${doc.title}`);
        console.log(`   ${JSON.stringify(res.data)}`);
      } else {
        console.log(`WARN ${doc.title}: ${res.msg} (code ${res.code})`);
        console.log(`   ${JSON.stringify(res)}`);
      }
    } catch (e: any) {
      console.log(`ERR ${doc.title}: ${e.message}`);
    }
  }

  console.log('\n=== 链接 ===\n');
  console.log(`文件夹: https://hcn2vc1r2jus.feishu.cn/drive/folder/${FOLDER_TOKEN}\n`);
  for (const doc of DOCS) {
    console.log(`${doc.title}: https://hcn2vc1r2jus.feishu.cn/docx/${doc.docId}`);
  }
}

main().catch(err => {
  console.error('\nERR:', err.message ?? err);
  process.exit(1);
});
