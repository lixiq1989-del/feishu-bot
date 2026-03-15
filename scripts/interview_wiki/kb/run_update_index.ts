/**
 * 创建"热门行业知识库"索引页，然后将所有子页面移入其中
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/kb/run_update_index.ts
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE   = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN   = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const SPACE_ID     = '7615113124324117443';
const ROOT_NODE    = 'BJL1wFOwCiNFWtkrVvUcE9ndnyd';
// 旧父节点（11 个子页面当前挂在这里）
const OLD_PARENT   = 'SyjSwAxXJi7zutkHUPtc2AAmnvc';
const DOMAIN       = 'hcn2vc1r2jus.feishu.cn';

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
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { reject(new Error(d.slice(0, 300))); }
      });
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
const h2 = (c: string)   => ({ block_type: 4,  heading2: { elements: [t(c)], style: {} } });
const hr = ()             => ({ block_type: 22, divider:  {} });
const li = (...els: any[]) => ({ block_type: 12, bullet: { elements: els, style: {} } });

const industries = [
  { emoji: '🏥', name: '医疗健康',         subs: '创新药 / 医疗器械 / AI制药 / 医疗服务',                  jobs: '投行 / PE / 咨询 / 研究员 / BD' },
  { emoji: '⚡', name: '能源',             subs: '传统能源 / 光伏 / 储能 / 氢能',                           jobs: '咨询 / 投行 / 产业研究 / 碳市场' },
  { emoji: '🤖', name: '科技与AI',         subs: '大模型 / 算力芯片 / 云计算 / 自动驾驶 / 人形机器人',      jobs: '咨询 / 研究员 / 投行' },
  { emoji: '🛍️', name: '消费与零售',       subs: '食品饮料 / 美妆个护 / 服装 / 奢侈品 / 零售渠道',          jobs: '投行 / PE / 研究员 / 品牌策略' },
  { emoji: '💰', name: '金融',             subs: '商业银行 / 财富管理 / 保险 / PE与VC',                     jobs: 'IBD / 资管 / 咨询 / 精算' },
  { emoji: '🏭', name: '高端制造与工业',   subs: '工业机器人 / 半导体设备 / 低空经济 / 消费电子供应链',      jobs: '咨询 / 产业研究 / 投行' },
  { emoji: '🏢', name: '房地产与不动产',   subs: '住宅开发 / 城市更新 / 物业资管 / REITs',                  jobs: '地产金融 / 咨询 / 资产管理' },
  { emoji: '🚗', name: '汽车与出行',       subs: '整车新能源 / 零部件Tier1 / 智能座舱 / 出海',              jobs: '投行 / 咨询 / 产业研究' },
  { emoji: '🌐', name: '互联网与平台经济', subs: '内容社交 / 本地生活 / 电商 / 游戏 / 出行',                jobs: '咨询 / PE / 研究员 / 战略' },
  { emoji: '🏢', name: '企业服务',         subs: 'SaaS / ERP / 营销科技 / HR科技',                          jobs: '咨询 / VC与PE / 销售 / 产品' },
  { emoji: '🚚', name: '物流与供应链',     subs: '快递 / 即时物流 / 冷链 / 跨境物流',                       jobs: '咨询 / 投行 / 产业研究' },
];

async function createNode(title: string, parentToken: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', parent_wiki_token: parentToken, node_type: 'origin', title,
  });
  if (r?.code !== 0) throw new Error(`createNode failed: ${r?.code} ${r?.msg}`);
  return { nodeToken: r.data.node.node_token, objToken: r.data.node.obj_token };
}

async function writeBlocks(objToken: string, blocks: any[], startIndex = 0) {
  for (let i = 0; i < blocks.length; i += 50) {
    const chunk = blocks.slice(i, i + 50);
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: chunk, index: startIndex + i }
    );
    if (r?.code !== 0) console.error(`  ❌ blocks(${startIndex + i}): ${r?.code} ${r?.msg}`);
    if (i + 50 < blocks.length) await sleep(400);
  }
}

async function writeTable(objToken: string, headers: string[], rows: string[][], insertAt: number) {
  const numRows = rows.length + 1;
  const numCols = headers.length;
  const tableRes = await api('POST',
    `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }],
      index: insertAt }
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
    await sleep(120);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

async function listChildren(parentToken: string): Promise<Array<{ title: string; node_token: string }>> {
  const r = await api('GET',
    `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes?parent_node_token=${parentToken}&page_size=50`
  );
  return r?.data?.items ?? [];
}

async function moveNode(nodeToken: string, targetParent: string) {
  const r = await api('POST',
    `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${nodeToken}/move`,
    { target_parent_token: targetParent, target_space_id: SPACE_ID }
  );
  if (r?.code !== 0) console.error(`  ❌ move ${nodeToken}: ${r?.code} ${r?.msg}`);
}

async function main() {
  console.log('🗂️  创建"热门行业知识库"索引页...\n');

  // Step 1: 创建新的索引节点
  console.log('📁 创建索引节点...');
  const { nodeToken: indexNode, objToken: indexObj } = await createNode(
    '📚 热门行业知识库', ROOT_NODE
  );
  console.log(`  ✅ 节点已创建: ${indexNode}`);
  await sleep(500);

  // Step 2: 写导言（3块）
  console.log('\n✍️  写入导言...');
  const introBlocks = [
    pB(b('本知识库'), t('覆盖11大热门行业，每个行业包含：必背数据 / 求职岗位 / 产业链与价值链 / 商业模式 / 主要玩家 / 竞争格局 / 行业趋势 / 面试高频问题。适合咨询 / 投行 / PE 求职者在面试前快速建立行业认知框架。')),
    pB(t('💡 使用建议：面试前重点阅读目标行业，每个子行业末尾的「面试高频问题」含诊断 → 分析 → 判断完整框架，可直接用于 Case 作答。')),
    hr(),
    h2('行业总览'),
  ];
  await writeBlocks(indexObj, introBlocks, 0);
  await sleep(400);

  // Step 3: 写行业总览表格
  console.log('\n📊 写入行业总览表格...');
  await writeTable(
    indexObj,
    ['行业', '主要子行业', '适合商科岗位'],
    industries.map(i => [`${i.emoji} ${i.name}`, i.subs, i.jobs]),
    4  // after 4 intro blocks
  );
  await sleep(400);

  // Step 4: 写尾注
  const footerBlocks = [
    hr(),
    h2('数据说明'),
    pB(t('数据来源：McKinsey / BCG / Bain 行业报告、国家统计局、各公司年报、行业协会数据，截至2025-2026年初。')),
  ];
  await writeBlocks(indexObj, footerBlocks, 16);
  await sleep(400);

  // Step 5: 将旧父节点下的所有子页面移到新节点下
  console.log('\n📦 迁移11个行业页面...');
  const children = await listChildren(OLD_PARENT);
  console.log(`  找到 ${children.length} 个子页面`);
  for (const child of children) {
    process.stdout.write(`  移动: ${child.title} ...`);
    await moveNode(child.node_token, indexNode);
    console.log(' ✅');
    await sleep(300);
  }

  // Step 6: 更新 run_kb_pages.ts 中的 KB_PARENT_TOKEN
  console.log('\n📝 更新 run_kb_pages.ts...');
  const scriptPath = path.join(__dirname, 'run_kb_pages.ts');
  let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  scriptContent = scriptContent.replace(
    /let KB_PARENT_TOKEN = '[^']*';/,
    `let KB_PARENT_TOKEN = '${indexNode}';`
  );
  fs.writeFileSync(scriptPath, scriptContent, 'utf-8');
  console.log(`  ✅ KB_PARENT_TOKEN → ${indexNode}`);

  console.log(`\n✨ 完成！`);
  console.log(`   索引页: https://${DOMAIN}/wiki/${indexNode}`);
  console.log(`   旧父节点 (${OLD_PARENT}) 现在为空，可在飞书手动删除`);
}

main().catch(console.error);
