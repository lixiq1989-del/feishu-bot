import * as fs from 'fs';
import * as path from 'path';
const envPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) { const k = t.slice(0,eq).trim(); const v = t.slice(eq+1).trim(); if (!process.env[k]) process.env[k] = v; }
  }
}
const { client } = require('../../src/client') as typeof import('../../src/client');

async function main() {
  // 查空间成员列表
  console.log('=== 空间成员 ===');
  try {
    const r = await (client.wiki.spaceMember as any).list({ path: { space_id: '7615113124324117443' } });
    console.log(JSON.stringify(r?.data, null, 2));
  } catch(e:any) { console.error('成员列表失败:', e?.message); }

  // 查直接写入 Homepage 的 docx（obj_token）
  console.log('\n=== 尝试写入 Homepage docx ===');
  const OBJ_TOKEN = 'ECCPdJ3fUoxGTYxronNcCK88nZk';
  try {
    const r = await (client.docx.documentBlockChildren as any).create({
      path: { document_id: OBJ_TOKEN, block_id: OBJ_TOKEN },
      data: { children: [{ block_type: 2, text: { elements: [{ text_run: { content: 'API测试写入', text_element_style: {} } }], style: {} } }] },
    });
    console.log('写入结果:', r?.code, r?.msg);
  } catch(e:any) { console.error('写入失败:', e?.message); }
}

main().catch(console.error);
