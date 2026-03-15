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
  const doc = await (client.docx.document as any).create({ data: { title: '表格size测试' } });
  const docId = doc.data?.document?.document_id;
  console.log('docId:', docId);

  for (const [r, c] of [[6, 5], [7, 5], [8, 5], [9, 5], [9, 3]]) {
    try {
      const res = await (client.docx.documentBlockChildren as any).create({
        path: { document_id: docId, block_id: docId },
        data: { children: [{ block_type: 31, table: { property: { row_size: r, column_size: c } } }] },
      });
      console.log(`${r}x${c}: code=${res.code}`);
    } catch (e: any) {
      console.log(`${r}x${c}: ERR ${e?.response?.data?.msg || e.message}`);
    }
  }
}
main().catch(console.error);
