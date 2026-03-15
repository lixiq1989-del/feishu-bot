/**
 * 测试：创建一个 doc，然后 move_docs_to_wiki 移进知识库
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '..', '..', '.env');
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
const { client } = require('../../src/client') as typeof import('../../src/client');

const SPACE_ID = '7615113124324117443';
const PARENT_NODE_TOKEN = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

async function getToken(): Promise<string> {
  const res = await client.auth.tenantAccessToken.internal({
    data: { app_id: process.env.FEISHU_APP_ID!, app_secret: process.env.FEISHU_APP_SECRET! },
  });
  return (res as any).tenant_access_token;
}

async function main() {
  // 先拿 token（第一次可能 ECONNRESET，retry 一次）
  let token: string = '';
  for (let i = 0; i < 3; i++) {
    try {
      token = await getToken();
      break;
    } catch (e: any) {
      console.log(`  token retry ${i + 1}...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  if (!token) { console.error('无法获取 token'); return; }
  console.log('token OK');

  // 创建测试 doc
  const docRes = await (client.docx.document as any).create({ data: { title: '[TEST] 移wiki测试' } });
  if (docRes.code !== 0) { console.error('创建doc失败:', docRes.msg); return; }
  const docId = docRes.data.document.document_id;
  console.log('doc created:', docId);

  // 尝试 move_docs_to_wiki（raw HTTP）
  console.log('\n=== move_docs_to_wiki ===');
  const resp = await fetch(
    `https://open.feishu.cn/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/move_docs_to_wiki`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent_wiki_token: PARENT_NODE_TOKEN,
        obj_type: 'docx',
        obj_token: docId,
        apply: true,
      }),
    }
  );
  const data = await resp.json() as any;
  console.log('move result:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
