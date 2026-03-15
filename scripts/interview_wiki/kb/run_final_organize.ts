/**
 * 最终整理：创建干净的"📚 热门行业知识库"索引页，迁移所有行业页面
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/kb/run_final_organize.ts
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const SPACE_ID   = '7615113124324117443';
const ROOT_NODE  = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd';
const DOMAIN     = 'hcn2vc1r2jus.feishu.cn';

// 当前11个行业页面（最新一次发布）
const INDUSTRY_PAGES = [
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

// 需要删除的旧节点（重复 / 无用）
const DELETE_TOKENS = [
  'EtFbw17r3iofjJk69QMcUz7anrf', // 旧的混乱索引节点
  'SyjSwAxXJi7zutkHUPtc2AAmnvc', // 旧父节点
];

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
const li = (...els: any[]) => ({ block_type: 12, bullet: { elements: els, style: {} } });

async function createNode(title: string, parentToken: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', parent_wiki_token: parentToken, node_type: 'origin', title,
  });
  if (r?.code !== 0) throw new Error(`createNode failed: ${r?.code} ${r?.msg}`);
  return { nodeToken: r.data.node.node_token, objToken: r.data.node.obj_token };
}

async function moveNode(nodeToken: string, targetParent: string): Promise<boolean> {
  const r = await api('POST',
    `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${nodeToken}/move`,
    { target_parent_token: targetParent, target_space_id: SPACE_ID }
  );
  return r?.code === 0;
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
  if (tableRes?.code !== 0) { console.error('  ❌ 表格:', tableRes?.msg); return; }
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
  console.log('🗂️  最终整理：创建干净索引页...\n');

  // Step 1: 创建新的干净索引节点
  console.log('📁 创建索引节点...');
  const { nodeToken: indexNode, objToken: indexObj } = await createNode(
    '📚 热门行业知识库', ROOT_NODE
  );
  console.log(`  ✅ ${indexNode} (doc: ${indexObj})`);
  await sleep(500);

  // Step 2: 写导言
  console.log('\n✍️  写入导言...');
  const introBlocks = [
    pB(b('本知识库'), t('覆盖11大热门行业，每个行业包含：必背数据 / 求职岗位 / 产业链 / 商业模式 / 竞争格局 / 趋势 / 面试高频问题。适合咨询 / 投行 / PE 求职者面试前快速建立行业认知框架。')),
    pB(t('💡 使用建议：重点阅读目标行业，每个子行业末尾「面试高频问题」含诊断→分析→判断完整框架，可直接用于 Case 作答。')),
    hr(),
    h2('行业总览（上）'),
  ];
  await writeBlocks(indexObj, introBlocks);
  await sleep(400);

  // Step 3: 两个表格（≤9行，避免 API 限制）
  console.log('\n📊 写入行业总览表格...');
  const headers = ['行业', '主要子行业', '适合商科岗位'];
  const rows = industries.map(i => [`${i.emoji} ${i.name}`, i.subs, i.jobs]);
  await writeTable(indexObj, headers, rows.slice(0, 6));  // 前6行
  await sleep(400);

  await writeBlocks(indexObj, [h2('行业总览（下）')]);
  await sleep(300);
  await writeTable(indexObj, headers, rows.slice(6));      // 后5行
  await sleep(400);

  // Step 4: 尾注
  await writeBlocks(indexObj, [
    hr(),
    pB(b('数据来源：'), t('McKinsey / BCG / Bain 行业报告、国家统计局、各公司年报，截至2025-2026年初。')),
  ]);
  await sleep(300);

  // Step 5: 移动11个行业页面到新索引节点
  console.log('\n📦 移动11个行业页面...');
  for (const page of INDUSTRY_PAGES) {
    process.stdout.write(`  ${page.title} ... `);
    const ok = await moveNode(page.token, indexNode);
    console.log(ok ? '✅' : '❌');
    await sleep(300);
  }

  // Step 6: 更新 run_kb_pages.ts 的 KB_PARENT_TOKEN
  console.log('\n📝 更新 run_kb_pages.ts...');
  const scriptPath = path.join(__dirname, 'run_kb_pages.ts');
  let content = fs.readFileSync(scriptPath, 'utf-8');
  content = content.replace(
    /let KB_PARENT_TOKEN = '[^']*';/,
    `let KB_PARENT_TOKEN = '${indexNode}';`
  );
  fs.writeFileSync(scriptPath, content, 'utf-8');
  console.log(`  ✅ KB_PARENT_TOKEN → ${indexNode}`);

  // Step 7: 删除旧的混乱节点
  console.log('\n🗑️  删除旧节点...');
  for (const token of DELETE_TOKENS) {
    const r = await api('DELETE', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${token}`);
    if (r?.code === 0) {
      console.log(`  ✅ 已删除 ${token}`);
    } else {
      console.log(`  ⚠️  ${token}: ${r?.code} ${r?.msg || '（可能已删除或不支持API删除）'}`);
    }
    await sleep(300);
  }

  console.log(`\n✨ 完成！`);
  console.log(`   📚 热门行业知识库: https://${DOMAIN}/wiki/${indexNode}`);
  console.log(`\n   11个行业页面：`);
  INDUSTRY_PAGES.forEach(p => console.log(`   ${p.title}: https://${DOMAIN}/wiki/${p.token}`));
}

main().catch(console.error);
