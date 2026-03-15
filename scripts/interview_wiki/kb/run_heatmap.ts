/**
 * 生成「📊 求职热门行业热力图」并发布到飞书知识库
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/kb/run_heatmap.ts
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE   = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN   = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const SPACE_ID     = '7615113124324117443';
const PARENT_TOKEN = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd'; // 根节点，发布后可手动移入知识库
const DOMAIN       = 'hcn2vc1r2jus.feishu.cn';

// ──────────────────────────────────────────
// 热力图数据（11大行业）
// 热度等级：🔴 极高 | 🟧 较高 | 🟨 中等 | 🟩 偏低 | ⬛ 负/极差
// ──────────────────────────────────────────
const TABLE_HEADERS = ['行业', '市场规模', '增速', '商科岗位', '薪资水平', '发展前景', '综合热度'];

const ALL_ROWS: string[][] = [
  // [行业, 市场规模, 增速, 商科岗位, 薪资水平, 发展前景, 综合热度]
  ['🤖 科技与AI',      '🟧 中大（~9000亿）',  '🔴 极快（+24%）',    '🔴 极多',  '🔴 极高',  '🔴 极好',   '🔥🔥🔥🔥🔥'],
  ['💰 金融',          '🔴 极大（531万亿资产）','🟧 较快（+8.7%）',  '🔴 极多',  '🔴 极高',  '🟧 较好',   '🔥🔥🔥🔥🔥'],
  ['🏥 医疗健康',      '🟧 大（9.8万亿）',    '🟧 较快（+12%）',    '🟧 较多',  '🟧 较高',  '🔴 极好',   '🔥🔥🔥🔥'],
  ['🚗 汽车与出行',    '🟧 大（含NEV）',      '🔴 快（+38% NEV）',  '🟧 较多',  '🟧 较高',  '🟧 较好',   '🔥🔥🔥🔥'],
  ['🌐 互联网与平台',  '🔴 极大（平台经济）', '🟨 中等（+5%）',     '🟧 较多',  '🟧 较高',  '🟧 较好',   '🔥🔥🔥🔥'],
  ['⚡ 能源',          '🟧 大（+新能源）',    '🟧 较快（+18%）',    '🟨 中等',  '🟧 较高',  '🔴 极好',   '🔥🔥🔥'],
  ['🏭 高端制造',      '🟨 中（机器人2378亿）','🟧 快（+29%）',     '🟨 中等',  '🟧 较高',  '🟧 较好',   '🔥🔥🔥'],
  ['🛍️ 消费与零售',   '🔴 极大（48.4万亿）', '🟩 偏慢（+3.8%）',  '🟧 较多',  '🟨 中等',  '🟨 中等',   '🔥🔥🔥'],
  ['🏢 企业服务',      '🟨 中（SaaS为主）',   '🟨 中等（+8%）',     '🟨 中等',  '🟨 中等',  '🟧 较好',   '🔥🔥🔥'],
  ['🚚 物流与供应链',  '🟧 大（跨境高增）',   '🟨 中等（+7%）',     '🟨 中等',  '🟩 偏低',  '🟨 中等',   '🔥🔥'],
  ['🏠 房地产',        '🔴 极大（调整中）',   '⬛ 负增长（-11%）',  '🟩 较少',  '🟨 中等',  '🟩 待复苏', '🔥🔥'],
];

const ROWS_A = ALL_ROWS.slice(0, 6);  // 前6行（不超9行限制）
const ROWS_B = ALL_ROWS.slice(6);     // 后5行

// ──────────────────────────────────────────
// Feishu Block 工厂
// ──────────────────────────────────────────
const t  = (c: string) => ({ text_run: { content: c, text_element_style: {} } });
const b  = (c: string) => ({ text_run: { content: c, text_element_style: { bold: true } } });
const pB = (...els: any[]) => ({ block_type: 2,  text:    { elements: els, style: {} } });
const h2 = (c: string)     => ({ block_type: 4,  heading2:{ elements: [t(c)], style: {} } });
const h3 = (c: string)     => ({ block_type: 5,  heading3:{ elements: [t(c)], style: {} } });
const hr = ()               => ({ block_type: 22, divider: {} });
const li = (...els: any[]) => ({ block_type: 12, bullet:  { elements: els, style: {} } });
const quote = (...els: any[]) => ({ block_type: 15, quote: { elements: els, style: {} } });

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn', path: urlPath, method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(d.slice(0, 300))); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function createNode(title: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', parent_wiki_token: PARENT_TOKEN, node_type: 'origin', title,
  });
  if (r?.code !== 0) throw new Error(`createNode failed: ${r?.code} ${r?.msg}`);
  return { nodeToken: r.data.node.node_token, objToken: r.data.node.obj_token };
}

async function writeBlocks(objToken: string, blocks: any[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += 50) {
    const chunk = blocks.slice(i, i + 50);
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: chunk }
    );
    if (r?.code !== 0) console.error(`  ❌ blocks: ${r?.code} ${r?.msg}`);
    if (i + 50 < blocks.length) await sleep(400);
  }
}

async function writeTable(objToken: string, headers: string[], rows: string[][]): Promise<void> {
  const numRows = rows.length + 1;
  const numCols = headers.length;
  const tableRes = await api('POST',
    `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }] }
  );
  if (tableRes?.code !== 0) { console.error('  ❌ 表格创建失败:', tableRes?.code, tableRes?.msg); return; }
  const cellIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols);
    const colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;
    const elem = rowIdx === 0 ? b(content) : t(content);
    await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${cellIds[idx]}/children`,
      { children: [pB(elem)] }
    );
    await sleep(110);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

async function main() {
  console.log('📊 生成「求职热门行业热力图」...\n');

  console.log('📁 创建文档节点...');
  const { nodeToken, objToken } = await createNode('📊 求职热门行业热力图');
  console.log(`  ✅ ${nodeToken} (doc: ${objToken})`);
  await sleep(500);

  // ── 标题与导言 ──
  console.log('\n✍️  写入导言...');
  await writeBlocks(objToken, [
    pB(b('维度说明：'), t('市场规模（当前体量）× 增速（近期增长）× 商科岗位（适合咨询/投行/PE/研究员的机会数量）× 薪资水平 × 发展前景 → 综合求职热度')),
    pB(b('热度图例：'), t('🔴 极高/极快  🟧 较高/较快  🟨 中等  🟩 偏低  ⬛ 负增长/极差')),
    pB(b('综合热度：'), t('🔥🔥🔥🔥🔥 = 顶级  🔥🔥🔥🔥 = 强烈推荐  🔥🔥🔥 = 推荐  🔥🔥 = 谨慎选择')),
    hr(),
    h2('行业热力图（上）— 顶级热门'),
  ]);
  await sleep(400);

  // ── 表格A：前6行 ──
  console.log('\n📊 写入表格A（前6行）...');
  await writeTable(objToken, TABLE_HEADERS, ROWS_A);
  await sleep(500);

  await writeBlocks(objToken, [h2('行业热力图（下）— 细分赛道')]);
  await sleep(300);

  // ── 表格B：后5行 ──
  console.log('\n📊 写入表格B（后5行）...');
  await writeTable(objToken, TABLE_HEADERS, ROWS_B);
  await sleep(500);

  // ── 解读与建议 ──
  console.log('\n✍️  写入解读建议...');
  await writeBlocks(objToken, [
    hr(),
    h2('怎么用这张图'),
    h3('① 目标行业定位'),
    li(b('综合热度 🔥🔥🔥🔥🔥：'), t('科技与AI、金融 — 竞争激烈但机会最多，薪资天花板最高，适合有强烈意愿+差异化背景的候选人')),
    li(b('综合热度 🔥🔥🔥🔥：'), t('医疗健康、汽车出行、互联网 — 增速快、岗位多样，赛道上升期，适合前景导向型选择')),
    li(b('综合热度 🔥🔥🔥：'), t('能源、高端制造、消费零售、企业服务 — 国家战略支持或体量庞大，适合找准细分赛道深耕')),
    li(b('综合热度 🔥🔥：'), t('物流供应链、房地产 — 薪资偏低或行业调整期，建议聚焦高利润细分（跨境物流/城市更新/REITs）')),
    h3('② 岗位匹配建议'),
    li(b('咨询（MBB/Big4）：'), t('科技AI > 金融 > 医疗健康 > 能源/高端制造')),
    li(b('投行（IBD）：'), t('金融 > 医疗健康 > 汽车 > 消费')),
    li(b('PE/VC：'), t('科技AI > 医疗健康 > 消费/零售 > 企业服务')),
    li(b('研究员（卖方/买方）：'), t('金融 > 科技AI > 医疗健康 > 汽车')),
    h3('③ 面试准备建议'),
    li(t('每个行业对应「热门行业知识库」内有完整页面，含产业链/商业模式/竞争格局/面试高频问题')),
    li(t('建议精读1-2个目标行业 + 泛读1个相关行业，面试中体现"行业视角"')),
    hr(),
    quote(b('数据来源：'), t('国家统计局、国家能源局、IFR、德勤/毕马威/贝恩/麦肯锡行业报告、各公司年报，截至2025-2026年初。')),
    quote(b('注：'), t('市场规模和增速为近期数据，不代表永续增长，投资和求职决策请结合个人背景综合判断。')),
  ]);

  console.log(`\n✨ 完成！`);
  console.log(`   📊 求职热门行业热力图: https://${DOMAIN}/wiki/${nodeToken}`);
  console.log(`\n   可在飞书中将此页面移入「热门行业知识库」目录`);
}

main().catch(console.error);
