/**
 * 清理 + 组织知识库：
 * 1. 将最新11个行业页面移到索引节点下
 * 2. 删除其他重复旧页面
 * 3. 给索引页写入目录内容
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/kb/run_cleanup_and_organize.ts
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const SPACE_ID   = '7615113124324117443';
const DOMAIN     = 'hcn2vc1r2jus.feishu.cn';

// 最新一次全量发布的11个页面（按发布顺序）
const LATEST_PAGES = [
  { token: 'QRmvwZaFHii3FmkIYvFcCIDcn0X', title: '🏥 医疗健康：行业知识库' },
  { token: 'XWU6wPESKi3dQSkvE1RcZbrynvd', title: '⚡ 能源：行业知识库' },
  { token: 'Ou0EwHj9oiVReyk8QdNckAswnlc', title: '🤖 科技与AI：行业知识库' },
  { token: 'Ghplwcu9siRm2ckU4Wdc35ZRnEs', title: '🛍️ 消费与零售：行业知识库' },
  { token: 'VmTuwJuExifivAk2IixcpMxHnrf', title: '💰 金融：行业知识库' },
  { token: 'VfF7wtdmOipoKjkmnyEcCLVFnmM', title: '🏭 高端制造与工业：行业知识库' },
  { token: 'PuGowhwa6iijwjkIzSocyfDcnbe', title: '🏢 房地产与不动产：行业知识库' },
  { token: 'LKm6wQFxTiJtg2kMmyZcFxCrnWh', title: '🚗 汽车与出行：行业知识库' },
  { token: 'WUH7wkkyki0PnckDtqycM8yDnre', title: '🌐 互联网与平台经济：行业知识库' },
  { token: 'SyXJwVyiPiDFAIkinc7clDe7nmg', title: '🏢 企业服务：行业知识库' },
  { token: 'HQTYwYQhJi76rHk03KWcY575nCh', title: '🚚 物流与供应链：行业知识库' },
];

// 新索引节点（由 run_update_index.ts 创建）
const INDEX_NODE = 'EtFbw17r3iofjJk69QMcUz7anrf';
// 索引节点的 obj_token（需要查询）
let INDEX_OBJ = '';

// 旧的重复页面（保留集合之外的全部删除）
const KEEP_TOKENS = new Set(LATEST_PAGES.map(p => p.token).concat([INDEX_NODE]));

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

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
const t  = (c: string) => ({ text_run: { content: c, text_element_style: {} } });
const b  = (c: string) => ({ text_run: { content: c, text_element_style: { bold: true } } });
const pB = (...els: any[]) => ({ block_type: 2,  text:     { elements: els, style: {} } });
const h2 = (c: string)     => ({ block_type: 4,  heading2: { elements: [t(c)], style: {} } });
const hr = ()               => ({ block_type: 22, divider:  {} });

const industries = [
  { emoji: '🏥', name: '医疗健康',         subs: '创新药 / 医疗器械 / AI制药 / 医疗服务',               jobs: '投行 / PE / 咨询 / 研究员 / BD' },
  { emoji: '⚡', name: '能源',             subs: '传统能源 / 光伏 / 储能 / 氢能',                        jobs: '咨询 / 投行 / 产业研究 / 碳市场' },
  { emoji: '🤖', name: '科技与AI',         subs: '大模型 / 算力芯片 / 云计算 / 自动驾驶 / 人形机器人',   jobs: '咨询 / 研究员 / 投行' },
  { emoji: '🛍️', name: '消费与零售',       subs: '食品饮料 / 美妆个护 / 服装 / 奢侈品 / 零售渠道',       jobs: '投行 / PE / 研究员 / 品牌策略' },
  { emoji: '💰', name: '金融',             subs: '商业银行 / 财富管理 / 保险 / PE与VC',                  jobs: 'IBD / 资管 / 咨询 / 精算' },
  { emoji: '🏭', name: '高端制造与工业',   subs: '工业机器人 / 半导体设备 / 低空经济 / 消费电子供应链',   jobs: '咨询 / 产业研究 / 投行' },
  { emoji: '🏢', name: '房地产与不动产',   subs: '住宅开发 / 城市更新 / 物业资管 / REITs',               jobs: '地产金融 / 咨询 / 资产管理' },
  { emoji: '🚗', name: '汽车与出行',       subs: '整车新能源 / 零部件Tier1 / 智能座舱 / 出海',           jobs: '投行 / 咨询 / 产业研究' },
  { emoji: '🌐', name: '互联网与平台经济', subs: '内容社交 / 本地生活 / 电商 / 游戏 / 出行',             jobs: '咨询 / PE / 研究员 / 战略' },
  { emoji: '🏢', name: '企业服务',         subs: 'SaaS / ERP / 营销科技 / HR科技',                       jobs: '咨询 / VC与PE / 销售 / 产品' },
  { emoji: '🚚', name: '物流与供应链',     subs: '快递 / 即时物流 / 冷链 / 跨境物流',                    jobs: '咨询 / 投行 / 产业研究' },
];

async function getAllNodes(): Promise<any[]> {
  const all: any[] = [];
  let pageToken = '';
  while (true) {
    const url = `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes?page_size=50${pageToken ? '&page_token=' + pageToken : ''}`;
    const r = await api('GET', url);
    all.push(...(r?.data?.items ?? []));
    if (!r?.data?.has_more) break;
    pageToken = r?.data?.page_token ?? '';
  }
  return all;
}

async function moveNode(nodeToken: string, targetParent: string): Promise<boolean> {
  const r = await api('POST',
    `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${nodeToken}/move`,
    { target_parent_token: targetParent, target_space_id: SPACE_ID }
  );
  return r?.code === 0;
}

async function deleteNode(nodeToken: string): Promise<void> {
  const r = await api('DELETE', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${nodeToken}`);
  if (r?.code !== 0) console.error(`  ❌ 删除失败 ${nodeToken}: ${r?.code} ${r?.msg}`);
}

async function writeIndexContent(objToken: string): Promise<void> {
  // 写导言（一次性写入，不指定 index，自动 append）
  const introBlocks = [
    pB(b('本知识库'), t('覆盖11大热门行业，每个行业包含：必背数据 / 求职岗位 / 产业链 / 商业模式 / 竞争格局 / 趋势 / 面试高频问题。适合咨询 / 投行 / PE 求职者面试前快速建立行业认知框架。')),
    pB(t('💡 使用建议：重点阅读目标行业，每个子行业末尾的「面试高频问题」含诊断→分析→判断完整框架，可直接用于 Case 作答。')),
    hr(),
    h2('行业总览（11大行业）'),
  ];
  const r1 = await api('POST',
    `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: introBlocks }
  );
  if (r1?.code !== 0) console.error('  ❌ 导言:', r1?.msg);
  await sleep(400);

  // 写表格（append，不指定 index）
  const numRows = industries.length + 1;
  const numCols = 3;
  const tableRes = await api('POST',
    `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }] }
  );
  if (tableRes?.code !== 0) { console.error('  ❌ 表格:', tableRes?.msg); return; }

  const cellIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  const headers = ['行业', '主要子行业', '适合商科岗位'];
  const rows = industries.map(i => [`${i.emoji} ${i.name}`, i.subs, i.jobs]);
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
  await sleep(300);

  // 写尾注（append）
  const footerBlocks = [
    hr(),
    pB(b('数据来源：'), t('McKinsey / BCG / Bain 行业报告、国家统计局、各公司年报，截至2025-2026年初。')),
  ];
  const r3 = await api('POST',
    `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: footerBlocks }
  );
  if (r3?.code !== 0) console.error('  ❌ 尾注:', r3?.msg);
}

async function main() {
  console.log('🗂️  清理 + 组织知识库...\n');

  // 获取索引节点的 obj_token
  const indexInfo = await api('GET', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${INDEX_NODE}`);
  INDEX_OBJ = indexInfo?.data?.node?.obj_token;
  console.log(`📁 索引节点: ${INDEX_NODE}, doc: ${INDEX_OBJ}`);

  // Step 1: 写索引页内容
  console.log('\n✍️  写入索引页内容...');
  await writeIndexContent(INDEX_OBJ);

  // Step 2: 移动11个最新页面到索引节点下
  console.log('\n📦 移动11个最新行业页面到索引节点...');
  for (const page of LATEST_PAGES) {
    process.stdout.write(`  移动: ${page.title} ... `);
    const ok = await moveNode(page.token, INDEX_NODE);
    console.log(ok ? '✅' : '❌');
    await sleep(300);
  }

  // Step 3: 清理重复页面
  console.log('\n🗑️  清理重复旧页面...');
  const allNodes = await getAllNodes();
  let deleted = 0;
  for (const node of allNodes) {
    // 跳过保留的页面和不相关的页面（旧版本"细分赛道"页等保留）
    if (KEEP_TOKENS.has(node.node_token)) continue;
    // 只删除重复的 KB 行业知识库页面
    if (node.title && (
      node.title.includes('行业知识库') ||
      node.title === '📚 行业知识库（完整版）'
    )) {
      process.stdout.write(`  删除: ${node.title} (${node.node_token}) ... `);
      await deleteNode(node.node_token);
      console.log('✅');
      deleted++;
      await sleep(300);
    }
  }
  console.log(`  共删除 ${deleted} 个旧页面`);

  console.log(`\n✨ 完成！`);
  console.log(`   索引页: https://${DOMAIN}/wiki/${INDEX_NODE}`);
  LATEST_PAGES.forEach(p => console.log(`   ${p.title}: https://${DOMAIN}/wiki/${p.token}`));
}

main().catch(console.error);
