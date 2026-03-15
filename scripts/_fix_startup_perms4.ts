import * as fs from 'fs';
import * as path from 'path';
import * as lark from '@larksuiteoapi/node-sdk';

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

const EVAN_OPEN_ID = 'ou_4ba4262b4484367b2847843ce0c43fa6';
const FOLDER = 'RyhRfTWLulrYcYdlDrUcKHDln0f';

const DOCS = [
  { title: '01-找需求', docId: 'BSovdPWmFoPMKPxakDzctI16nh7' },
  { title: '02-设计产品', docId: 'SrTqdQKMzoyXKyxqO9DcTOCmnEb' },
  { title: '03-搭商业模式', docId: 'QhtJdsJXioRI4BxiVzOcMsCmnuf' },
  { title: '04-获客', docId: 'PATtdnFa2ofSnWx32MNcOhlpntf' },
  { title: '05-转化', docId: 'H4pJdt5wLoDvfuxPzT5cBhu6nXp' },
  { title: '06-交付', docId: 'VdKRdSdhaoc1JNx8qTqcNvPvni9' },
  { title: '07-复购增长', docId: 'OwGOdA2HpoETC3xyecmcAU1Rnie' },
];

async function addMember(token: string, type: string, title: string) {
  try {
    const r = await (client.drive.permissionMember as any).create({
      path: { token },
      params: { type, need_notification: false },
      data: {
        member_type: 'openid',
        member_id: EVAN_OPEN_ID,
        perm: 'full_access',
      },
    });
    if (r.code === 0) {
      console.log(`OK ${title} -> added Evan as full_access`);
    } else {
      console.log(`WARN ${title}: ${r.msg} (code ${r.code})`);
    }
  } catch (e: any) {
    console.log(`ERR ${title}: ${e.message}`);
  }
}

async function transferOwner(token: string, type: string, title: string) {
  // Use raw HTTP since SDK doesn't have transfer method
  try {
    const tokenRes = await client.auth.tenantAccessToken.internal({
      data: {
        app_id: process.env.FEISHU_APP_ID!,
        app_secret: process.env.FEISHU_APP_SECRET!,
      },
    });
    const accessToken = (tokenRes as any).tenant_access_token;

    const resp = await fetch(
      `https://open.feishu.cn/open-apis/drive/v1/permissions/${token}/members/transfer_owner?type=${type}&need_notification=false`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_type: 'openid',
          member_id: EVAN_OPEN_ID,
        }),
      }
    );
    const data = await resp.json();
    if ((data as any).code === 0) {
      console.log(`OK ${title} -> owner transferred to Evan`);
    } else {
      console.log(`WARN transfer ${title}: ${(data as any).msg} (code ${(data as any).code})`);
    }
  } catch (e: any) {
    console.log(`ERR transfer ${title}: ${e.message}`);
  }
}

async function run() {
  // 1. Add Evan as full_access to folder
  console.log('=== Add Evan to folder ===');
  await addMember(FOLDER, 'folder', 'folder');

  // 2. Add Evan as full_access to each doc
  console.log('\n=== Add Evan to docs ===');
  for (const doc of DOCS) {
    await addMember(doc.docId, 'docx', doc.title);
    await new Promise(r => setTimeout(r, 200));
  }

  // 3. Transfer ownership of each doc to Evan
  console.log('\n=== Transfer ownership ===');
  for (const doc of DOCS) {
    await transferOwner(doc.docId, 'docx', doc.title);
    await new Promise(r => setTimeout(r, 300));
  }

  // 4. Transfer folder ownership
  await transferOwner(FOLDER, 'folder', 'folder');

  console.log('\n=== Done ===');
  console.log('Now Evan owns all docs. Please try accessing again.');
  console.log(`Folder: https://hcn2vc1r2jus.feishu.cn/drive/folder/${FOLDER}`);
}

run().catch(console.error);
