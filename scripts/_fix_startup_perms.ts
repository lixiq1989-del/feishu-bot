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

const FOLDER = 'RyhRfTWLulrYcYdlDrUcKHDln0f';
const DOC1 = 'BSovdPWmFoPMKPxakDzctI16nh7';

async function run() {
  // 1. Check folder permissions
  console.log('=== Folder current permissions ===');
  try {
    const r1 = await client.drive.permissionPublic.get({
      path: { token: FOLDER },
      params: { type: 'folder' as const },
    });
    console.log(JSON.stringify(r1.data, null, 2));
    console.log('code:', r1.code, 'msg:', r1.msg);
  } catch (e: any) {
    console.log('GET folder err:', e.message);
  }

  // 2. Set folder permissions
  console.log('\n=== Set folder permissions ===');
  try {
    const r2 = await client.drive.permissionPublic.patch({
      path: { token: FOLDER },
      params: { type: 'folder' as const },
      data: {
        external_access: true,
        link_share_entity: 'anyone_readable',
      } as any,
    });
    console.log('code:', r2.code, 'msg:', r2.msg);
    console.log(JSON.stringify(r2.data, null, 2));
  } catch (e: any) {
    console.log('PATCH folder err:', e.message);
  }

  // 3. Check doc permissions
  console.log('\n=== Doc 01 current permissions ===');
  try {
    const r3 = await client.drive.permissionPublic.get({
      path: { token: DOC1 },
      params: { type: 'docx' as const },
    });
    console.log(JSON.stringify(r3.data, null, 2));
  } catch (e: any) {
    console.log('GET doc err:', e.message);
  }

  // 4. List permission members on folder
  console.log('\n=== Folder permission members ===');
  try {
    const r4 = await (client.drive.permissionMember as any).list({
      path: { token: FOLDER },
      params: { type: 'folder' },
    });
    console.log('code:', r4.code);
    console.log(JSON.stringify(r4.data, null, 2));
  } catch (e: any) {
    console.log('LIST members err:', e.message);
  }
}

run().catch(console.error);
