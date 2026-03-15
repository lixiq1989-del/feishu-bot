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
  'BSovdPWmFoPMKPxakDzctI16nh7',
  'SrTqdQKMzoyXKyxqO9DcTOCmnEb',
  'QhtJdsJXioRI4BxiVzOcMsCmnuf',
  'PATtdnFa2ofSnWx32MNcOhlpntf',
  'H4pJdt5wLoDvfuxPzT5cBhu6nXp',
  'VdKRdSdhaoc1JNx8qTqcNvPvni9',
  'OwGOdA2HpoETC3xyecmcAU1Rnie',
];

async function run() {
  const doc = DOCS[0];

  // 1. Try listing permission members for a doc
  console.log('=== List permission members (doc) ===');
  try {
    const r = await (client.drive.permissionMember as any).list({
      path: { token: doc },
      params: { type: 'docx' },
    });
    console.log('code:', r.code, 'msg:', r.msg);
    console.log(JSON.stringify(r.data, null, 2));
  } catch (e: any) {
    console.log('err:', e.message);
  }

  // 2. Try adding "anyone" as viewer using permissionMember.create
  console.log('\n=== Add anyone_can_view member ===');
  try {
    const r = await (client.drive.permissionMember as any).create({
      path: { token: doc },
      params: { type: 'docx', need_notification: false },
      data: {
        member_type: 'anyone',
        member_id: 'anyone',
        perm: 'view',
      },
    });
    console.log('code:', r.code, 'msg:', r.msg);
    console.log(JSON.stringify(r.data, null, 2));
  } catch (e: any) {
    console.log('err:', e.message);
  }

  // 3. Check if there's a way to transfer owner - try getting doc meta
  console.log('\n=== Doc meta ===');
  try {
    const r = await (client.drive as any).meta.batchQuery({
      data: {
        request_docs: [{ doc_token: doc, doc_type: 'docx' }],
      },
    });
    console.log('code:', r.code);
    console.log(JSON.stringify(r.data, null, 2));
  } catch (e: any) {
    console.log('err:', e.message);
  }

  // 4. Try to set share_entity to 'anyone' in permissionPublic
  console.log('\n=== Set share_entity=anyone ===');
  try {
    const r = await client.drive.permissionPublic.patch({
      path: { token: doc },
      params: { type: 'docx' as const },
      data: {
        external_access: true,
        link_share_entity: 'anyone_readable',
        share_entity: 'anyone',
      } as any,
    });
    console.log('code:', r.code, 'msg:', r.msg);
    console.log(JSON.stringify(r.data, null, 2));
  } catch (e: any) {
    console.log('err:', e.message);
  }
}

run().catch(console.error);
