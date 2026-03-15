/**
 * 修复wiki页面：
 * 1. 重新发布 03_step1（JD拆解，内容已更新）
 * 2. 给 04_step2（九大能力）的能力②-⑨加 h3 标题
 * 3. 给 04b_step2_pro（专业能力）的方向②-⑩加 h3 标题
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
let USER_TOKEN: string;
try {
  USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
  if (!USER_TOKEN) throw new Error('access_token 为空');
} catch (e: any) {
  console.error('❌ 无法读取用户 token:', e.message);
  process.exit(1);
}

const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

// 已知的 wiki 页面信息
const PAGES = {
  step1: { node: 'JtLIw8n3GiUVYbkQqTNcGJhenBb', obj: 'Q723d9ilFoh0OLxQgGJc5SN5nhc' },
  step2: { node: 'HwKlwEWxuiaWfikBVbPcTjUgnGd', obj: 'WTKqdEj4roonRHxaQttcbAdinnl' },
  step2b: { node: 'GfPmw5K79iIp5mkrLKWcTfeonIg', obj: 'YUVydQYvfoyqi7xg9J5cqZtFnsg' },
};

// ─── HTTPS 工具 ────────────────────────────────────────────────────
function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(`JSON parse error: ${d}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── 获取文档所有blocks ──────────────────────────────────────────
async function getDocBlocks(docId: string): Promise<any[]> {
  const blocks: any[] = [];
  let pageToken = '';
  do {
    const url = `/open-apis/docx/v1/documents/${docId}/blocks?page_size=500${pageToken ? '&page_token=' + pageToken : ''}`;
    const r = await api('GET', url);
    if (r.code !== 0) {
      console.error('获取blocks失败:', r.code, r.msg);
      return blocks;
    }
    blocks.push(...(r.data?.items ?? []));
    pageToken = r.data?.has_more ? r.data.page_token : '';
  } while (pageToken);
  return blocks;
}

// ─── 给文档加缺失的h3标题 ────────────────────────────────────────
async function addMissingTitles(docId: string, titlePatterns: string[], titleTexts: string[]) {
  console.log('  获取文档blocks...');
  const blocks = await getDocBlocks(docId);

  const pageBlock = blocks.find(b => b.block_type === 1);
  if (!pageBlock) {
    console.error('  ❌ 找不到page block');
    return;
  }
  const rootBlockId = pageBlock.block_id;
  const childIds: string[] = pageBlock.children ?? [];

  // 收集已有的h3标题文本
  const existingH3s: string[] = [];
  for (const block of blocks) {
    if (block.block_type === 5) { // heading3 = block_type 5
      const text = block.heading3?.elements?.map((e: any) => e.text_run?.content ?? '').join('') ?? '';
      existingH3s.push(text);
    }
  }
  console.log(`  已有h3标题 (${existingH3s.length}个):`, existingH3s.join(' | '));

  // 找出缺失的标题
  const missing: string[] = [];
  for (let i = 0; i < titlePatterns.length; i++) {
    const found = existingH3s.some(t => t.includes(titlePatterns[i]));
    if (!found) {
      missing.push(titleTexts[i]);
    } else {
      console.log(`  ✓ 已存在: ${titleTexts[i]}`);
    }
  }

  if (missing.length === 0) {
    console.log('  ✅ 所有标题都已存在');
    return;
  }

  console.log(`  需要添加 ${missing.length} 个标题:`, missing.join(', '));

  // 找到所有table blocks的位置
  const tablePositions: Array<{ index: number; blockId: string }> = [];
  for (let i = 0; i < childIds.length; i++) {
    const block = blocks.find(b => b.block_id === childIds[i]);
    if (block?.block_type === 31) {
      tablePositions.push({ index: i, blockId: childIds[i] });
    }
  }
  console.log(`  共 ${tablePositions.length} 个表格`);

  // 对每个表格检查前面有没有h3
  // 构建需要插入的列表：{ insertBeforeIndex, titleText }
  const insertions: Array<{ index: number; title: string }> = [];

  for (let ti = 0; ti < tablePositions.length; ti++) {
    const tableIdx = tablePositions[ti].index;

    // 往前找，看有没有h3
    let hasH3 = false;
    for (let j = tableIdx - 1; j >= Math.max(0, tableIdx - 6); j--) {
      const prevBlock = blocks.find(b => b.block_id === childIds[j]);
      if (!prevBlock) continue;
      if (prevBlock.block_type === 5) { hasH3 = true; break; } // heading3
      if (prevBlock.block_type === 31) break; // another table
      if (prevBlock.block_type === 17) break; // divider
    }

    if (!hasH3 && ti < titleTexts.length) {
      insertions.push({ index: tableIdx, title: titleTexts[ti] });
    }
  }

  if (insertions.length === 0) {
    console.log('  ✅ 所有表格前都有h3标题（可能标题文本不完全匹配pattern）');
    return;
  }

  // 从后往前插入，避免index偏移
  for (let i = insertions.length - 1; i >= 0; i--) {
    const { index, title } = insertions[i];
    console.log(`  📝 在位置${index}插入: ${title}`);

    // 还需要在h3前插入定义和典型岗位的p blocks
    const h3Block = {
      block_type: 5,
      heading3: {
        elements: [{ text_run: { content: title, text_element_style: {} } }],
        style: {},
      },
    };

    const r = await api('POST', `/open-apis/docx/v1/documents/${docId}/blocks/${rootBlockId}/children`, {
      children: [h3Block],
      index,
    });
    if (r.code !== 0) {
      console.error(`  ❌ 插入失败:`, r.code, r.msg);
    } else {
      console.log(`  ✓ 插入成功`);
    }
    await sleep(500);
  }
}

// ─── 任务1：新建JD拆解页（因API不支持删除blocks，只能新建） ───
const SPACE_ID = '7615113124324117443';
const PARENT_PART2_NODE = 'EKhEwvw8miTKLrklTaAcPP3FnZd'; // Part 2

async function createNewStep1(): Promise<string> {
  console.log('  创建新wiki节点...');
  const createRes = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    node_type: 'origin',
    parent_node_token: PARENT_PART2_NODE,
    title: 'Step 1：拆JD（看考什么）✨',
  });
  if (createRes.code !== 0) {
    console.error('  ❌ 创建节点失败:', createRes.code, createRes.msg);
    return '';
  }
  const nodeToken = createRes.data.node.node_token;
  const objToken = createRes.data.node.obj_token;
  console.log(`  ✓ 节点创建成功: ${nodeToken}`);

  // 写入内容
  console.log('  写入内容...');
  const { page } = require('./03_step1');

  const pending: any[] = [];
  for (const block of page.blocks) {
    if (block?.__table) {
      if (pending.length > 0) {
        await writeBlocks(objToken, pending);
        pending.length = 0;
      }
      await writeTable(objToken, block.headers, block.rows);
    } else {
      pending.push(block);
    }
  }
  if (pending.length > 0) {
    await writeBlocks(objToken, pending);
  }

  console.log('  ✅ 新页面创建完成');
  return nodeToken;
}

async function writeBlocks(objToken: string, blocks: any[], startIndex: number = 0) {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, {
      children: blocks.slice(i, i + 50),
    });
    if (r.code !== 0) {
      console.error(`  ❌ 写blocks失败: code=${r.code} msg=${r.msg}`);
    }
    if (i + 50 < blocks.length) await sleep(400);
  }
}

async function writeTable(objToken: string, headers: string[], rows: string[][]) {
  const numRows = rows.length + 1;
  const numCols = headers.length;

  const tableRes = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, {
    children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }],
  });

  if (tableRes.code !== 0) {
    console.error('  ❌ 创建表格失败:', tableRes.msg, '— 用bullet降级');
    const fallback = [headers, ...rows].map(row => ({
      block_type: 12,
      bullet: { elements: [{ text_run: { content: row.join(' | ') } }], style: {} },
    }));
    await writeBlocks(objToken, fallback);
    return;
  }

  const cellIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  if (cellIds.length === 0) return;

  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols);
    const colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;
    const cellRes = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${cellIds[idx]}/children`, {
      children: [{ block_type: 2, text: { elements: [{ text_run: { content, text_element_style: {} } }], style: {} } }],
    });
    if (cellRes.code !== 0) console.error(`  ❌ cell[${rowIdx}][${colIdx}]: ${cellRes.msg}`);
    await sleep(150);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  console.log('🔧 开始修复wiki页面...\n');

  // 任务1已完成（新页面: P4Ddw5bDTi6n0KkMi3dcMJmenkh），跳过
  console.log('━━━ 任务1：已完成，跳过 ━━━\n');

  // 任务2：九大能力加标题
  console.log('━━━ 任务2：给九大能力加h3标题 ━━━');
  await addMissingTitles(PAGES.step2.obj,
    ['能力②', '能力③', '能力④', '能力⑤', '能力⑥', '能力⑦', '能力⑧', '能力⑨'],
    ['能力②：沟通表达', '能力③：问题解决', '能力④：团队协作', '能力⑤：结果导向', '能力⑥：领导力与影响力', '能力⑦：抗压与适应', '能力⑧：学习成长', '能力⑨：客户/用户导向']
  );
  console.log(`链接: https://${DOMAIN}/wiki/${PAGES.step2.node}\n`);

  // 任务3：专业能力方向加标题
  console.log('━━━ 任务3：给专业能力方向加h3标题 ━━━');
  await addMissingTitles(PAGES.step2b.obj,
    ['方向②', '方向③', '方向④', '方向⑤', '方向⑥', '方向⑦', '方向⑧', '方向⑨', '方向⑩'],
    ['方向②：用户/产品运营', '方向③：市场营销', '方向④：战略/商业分析', '方向⑤：产品管理', '方向⑥：咨询与投行', '方向⑦：销售与商务拓展', '方向⑧：财务与会计', '方向⑨：人力资源管理', '方向⑩：供应链与采购']
  );
  console.log(`链接: https://${DOMAIN}/wiki/${PAGES.step2b.node}\n`);

  console.log('🎉 全部完成！');
}

main().catch(console.error);
