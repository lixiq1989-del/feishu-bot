import * as fs from 'fs';
import * as path from 'path';
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

async function main() {
  // First create a test document
  const docRes = await (client.docx.document as any).create({ data: { title: '表格测试' } });
  console.log('doc:', docRes.code, docRes.data?.document?.document_id);
  const docId = docRes.data?.document?.document_id;

  // block_type 31 = table, 32 = table_cell
  const t1 = await (client.docx.documentBlockChildren as any).create({
    path: { document_id: docId, block_id: docId },
    data: { children: [{ block_type: 31, table: { property: { row_size: 3, column_size: 3 } } }] }
  }).catch((e: any) => e?.response?.data || { err: e.message });
  console.log('table (31) full:', JSON.stringify(t1, null, 1).slice(0, 500));

  if (t1?.code === 0) {
    const tableBlockId = t1.data?.children?.[0];
    console.log('tableBlockId:', tableBlockId);
    await new Promise(r => setTimeout(r, 500));
    // Get cell blocks
    const cells = await (client.docx.documentBlockChildren as any).get({
      path: { document_id: docId, block_id: tableBlockId },
      params: { page_size: 50 }
    }).catch((e: any) => e?.response?.data || { err: e.message });
    console.log('cells:', JSON.stringify(cells?.data?.items?.map((c: any) => c.block_id)));
  }
  
  // Check what methods are on documentBlockChildren
  console.log('methods:', Object.keys((client.docx.documentBlockChildren as any)));
}
main().catch(console.error);
