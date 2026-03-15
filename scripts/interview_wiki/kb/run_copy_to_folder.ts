/**
 * 把8个赛道深度报告复制到飞书「互联网求职」文件夹
 * 读取wiki节点内容 → 在文件夹中创建新文档 → 复制blocks
 */
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE   = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN   = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const FOLDER_TOKEN = 'PHmxfhrtelrQvudF3BFcTCYHnDe'; // 互联网求职

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn', path: urlPath, method,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}`, 'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      rejectUnauthorized: false,
    }, res => { let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(d.slice(0,300))); } }); });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}

// wiki node token → docx obj_token
const TRACKS = [
  { node: 'MT6tw6qQCicbfzkj4Z2c6aMgnSd', title: '🎬 内容与社交：赛道深度报告（2024-2025）' },
  { node: 'Lsf9wlhUnigVrQkTMjxcEFten9f', title: '🛒 电商平台：赛道深度报告（2024-2025）' },
  { node: 'BQ6qwsda3iPCVPkV1LBcLP96nhc', title: '🎮 游戏：赛道深度报告（2024-2025）' },
  { node: 'XZfLwLZXjia1p3kSxSecTT87n6d', title: '🍜 本地生活：赛道深度报告（2024-2025）' },
  { node: 'N56ZwBI39iXzkHkGwfyc9J92nJg', title: '📢 广告与商业化：赛道深度报告（2024-2025）' },
  { node: 'H5pvwj4SliSfgMkorBycILuQnah', title: '🤖 大模型与AI应用：赛道深度报告（2024-2025）' },
  { node: 'OFHOwg9PIiHXgpkgLZUcbK9AnCg', title: '☁️ 云计算：赛道深度报告（2024-2025）' },
  { node: 'Briuw4Ft4iVf2kkQlqacLM02nbh', title: '🌏 出海与跨境电商：赛道深度报告（2024-2025）' },
];

async function getWikiObjToken(nodeToken: string): Promise<string> {
  const r = await api('GET', `/open-apis/wiki/v2/spaces/get_node?token=${nodeToken}`);
  if (r?.code !== 0) throw new Error(`getNode failed: ${r?.code} ${r?.msg}`);
  return r.data.node.obj_token;
}

async function getDocBlocks(docToken: string): Promise<any[]> {
  let allBlocks: any[] = [];
  let pageToken = '';
  while (true) {
    const url = `/open-apis/docx/v1/documents/${docToken}/blocks?page_size=500${pageToken ? '&page_token=' + pageToken : ''}`;
    const r = await api('GET', url);
    if (r?.code !== 0) throw new Error(`getBlocks failed: ${r?.code} ${r?.msg}`);
    const items = r.data?.items || [];
    allBlocks = allBlocks.concat(items);
    if (!r.data?.has_more) break;
    pageToken = r.data.page_token;
    await sleep(200);
  }
  return allBlocks;
}

function cleanBlock(blk: any): any | null {
  // Skip the document root block (block_type=1) and page block
  if (blk.block_type === 1) return null;

  const typeMap: Record<number, string> = {
    2: 'text', 3: 'heading1', 4: 'heading2', 5: 'heading3',
    12: 'bullet', 15: 'quote', 22: 'divider', 31: 'table',
  };

  const typeName = typeMap[blk.block_type];
  if (!typeName) return null; // skip unknown types

  const out: any = { block_type: blk.block_type };
  if (blk.block_type === 22) {
    out.divider = {};
  } else if (blk.block_type === 31) {
    // table - skip, will be handled separately
    return null;
  } else if (blk[typeName]) {
    out[typeName] = {
      elements: blk[typeName].elements || [],
      style: blk[typeName].style || {},
    };
  }
  return out;
}

async function createDocInFolder(title: string): Promise<string> {
  const r = await api('POST', '/open-apis/docx/v1/documents', {
    folder_token: FOLDER_TOKEN,
    title: title,
  });
  if (r?.code !== 0) throw new Error(`createDoc failed: ${r?.code} ${r?.msg}`);
  return r.data.document.document_id;
}

async function writeBlocks(docToken: string, blocks: any[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += 50) {
    const chunk = blocks.slice(i, i + 50);
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${docToken}/blocks/${docToken}/children`,
      { children: chunk }
    );
    if (r?.code !== 0) console.error(`  ❌ blocks[${i}]: ${r?.code} ${r?.msg}`);
    if (i + 50 < blocks.length) await sleep(500);
  }
}

async function main() {
  console.log('📋 复制8个赛道报告到「互联网求职」文件夹...\n');

  for (const track of TRACKS) {
    console.log(`\n📄 ${track.title}`);

    // 1. Get wiki doc obj_token
    const objToken = await getWikiObjToken(track.node);
    console.log(`  源文档: ${objToken}`);
    await sleep(300);

    // 2. Read all blocks from source doc
    const allBlocks = await getDocBlocks(objToken);
    console.log(`  读取 ${allBlocks.length} 个blocks`);

    // 3. Filter and clean blocks (skip root, tables, unknown)
    const cleanedBlocks = allBlocks
      .map(cleanBlock)
      .filter((b: any) => b !== null);
    console.log(`  可复制 ${cleanedBlocks.length} 个blocks（跳过表格/根节点）`);

    // 4. Create new doc in folder
    const newDocId = await createDocInFolder(track.title);
    console.log(`  新文档: ${newDocId}`);
    await sleep(500);

    // 5. Write blocks to new doc
    await writeBlocks(newDocId, cleanedBlocks);
    console.log(`  ✅ 完成 → https://hcn2vc1r2jus.feishu.cn/docx/${newDocId}`);

    await sleep(800);
  }

  console.log('\n🎉 全部8个赛道已复制到「互联网求职」文件夹！');
}

main().catch(console.error);
