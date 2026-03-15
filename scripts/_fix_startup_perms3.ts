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

const DOCS = [
  { title: '01-找需求', docId: 'BSovdPWmFoPMKPxakDzctI16nh7' },
  { title: '02-设计产品', docId: 'SrTqdQKMzoyXKyxqO9DcTOCmnEb' },
  { title: '03-搭商业模式', docId: 'QhtJdsJXioRI4BxiVzOcMsCmnuf' },
  { title: '04-获客', docId: 'PATtdnFa2ofSnWx32MNcOhlpntf' },
  { title: '05-转化', docId: 'H4pJdt5wLoDvfuxPzT5cBhu6nXp' },
  { title: '06-交付', docId: 'VdKRdSdhaoc1JNx8qTqcNvPvni9' },
  { title: '07-复购增长', docId: 'OwGOdA2HpoETC3xyecmcAU1Rnie' },
];

async function run() {
  // 1. Get all users in tenant to find Simon's user_id
  console.log('=== Find users ===');
  try {
    const r = await (client.contact.user as any).list({
      params: { department_id: '0', page_size: 50 },
    });
    console.log('code:', r.code);
    if (r.data?.items) {
      for (const u of r.data.items) {
        console.log(`  ${u.name} | open_id: ${u.open_id} | user_id: ${u.user_id}`);
      }
    }
  } catch (e: any) {
    console.log('err:', e.message);
  }

  // 2. Try to transfer ownership of doc to Simon
  // First, let's try transferOwner API
  console.log('\n=== Transfer owner (doc 01) ===');
  const doc = DOCS[0];
  try {
    const r = await (client.drive as any).permissionMember.transfer({
      path: { token: doc.docId },
      params: { type: 'docx' },
      data: {
        member_type: 'openid',
        member_id: 'ou_bc6ad6eced5c3989040c846fe9eeac9b',
      },
    });
    console.log('transfer code:', r?.code, 'msg:', r?.msg);
  } catch (e: any) {
    console.log('transfer err:', e.message);
  }

  // 3. For each doc, set all permission fields
  console.log('\n=== Set full permissions on all docs ===');
  for (const doc of DOCS) {
    try {
      const r = await client.drive.permissionPublic.patch({
        path: { token: doc.docId },
        params: { type: 'docx' as const },
        data: {
          external_access: true,
          link_share_entity: 'anyone_readable',
          share_entity: 'anyone',
          copy_entity: 'only_full_access',
          comment_entity: 'anyone_can_view',
          security_entity: 'anyone_can_view',
        } as any,
      });
      console.log(`${doc.title}: code=${r.code}`);
      if (r.code !== 0) console.log(`  msg: ${r.msg}`);
    } catch (e: any) {
      console.log(`${doc.title}: err ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
}

run().catch(console.error);
