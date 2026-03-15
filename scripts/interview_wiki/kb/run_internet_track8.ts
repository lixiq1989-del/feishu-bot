/**
 * 🌏 互联网赛道深度报告：出海与跨境电商（独立页）
 * 数据来源：PDD/SHEIN/TikTok Shop公开数据、Canalys、商务部、Sensor Tower
 */
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE   = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN   = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const SPACE_ID     = '7615113124324117443';
const PARENT_TOKEN = 'MjX7wHojriDgIrkrfjfcjr5TnPg';
const DOMAIN       = 'hcn2vc1r2jus.feishu.cn';

const t    = (c: string) => ({ text_run: { content: c, text_element_style: {} } });
const b    = (c: string) => ({ text_run: { content: c, text_element_style: { bold: true } } });
const p    = (...els: any[]) => ({ block_type: 2,  text:     { elements: els, style: {} } });
const h1   = (c: string)    => ({ block_type: 3,  heading1: { elements: [b(c)], style: {} } });
const h2   = (c: string)    => ({ block_type: 4,  heading2: { elements: [t(c)], style: {} } });
const h3   = (c: string)    => ({ block_type: 5,  heading3: { elements: [t(c)], style: {} } });
const hr   = ()             => ({ block_type: 22, divider: {} });
const li   = (...els: any[]) => ({ block_type: 12, bullet:  { elements: els, style: {} } });
const quote = (...els: any[]) => ({ block_type: 15, quote:  { elements: els, style: {} } });

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({ hostname: 'open.feishu.cn', path: urlPath, method,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}`, 'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }, rejectUnauthorized: false,
    }, res => { let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(d.slice(0, 300))); } }); });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}
async function createNode(title: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', parent_wiki_token: PARENT_TOKEN, node_type: 'origin', title });
  if (r?.code !== 0) throw new Error(`createNode failed: ${r?.code} ${r?.msg}`);
  return { nodeToken: r.data.node.node_token, objToken: r.data.node.obj_token };
}
async function writeBlocks(objToken: string, blocks: any[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, { children: blocks.slice(i, i + 50) });
    if (r?.code !== 0) console.error(`  ❌ blocks[${i}]: ${r?.code} ${r?.msg}`);
    if (i + 50 < blocks.length) await sleep(500);
  }
}
async function writeTable(objToken: string, headers: string[], rows: string[][]): Promise<void> {
  const numRows = rows.length + 1, numCols = headers.length;
  const tableRes = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }] });
  if (tableRes?.code !== 0) { console.error('  ❌ 表格:', tableRes?.code, tableRes?.msg); return; }
  const cellIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols), colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;
    await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${cellIds[idx]}/children`,
      { children: [p(rowIdx === 0 ? b(content) : t(content))] });
    await sleep(110);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

async function main() {
  console.log('📝 写入：出海与跨境电商深度报告...\n');
  const { nodeToken, objToken } = await createNode('🌏 出海与跨境电商：赛道深度报告（2024-2025）');
  console.log(`  ✅ ${nodeToken}\n  🔗 https://${DOMAIN}/wiki/${nodeToken}`);
  await sleep(800);

  await writeBlocks(objToken, [
    p(b('赛道定位：'), t('中国互联网出海是2020年代最重要的增长叙事——当国内市场增速放缓（互联网用户增长接近天花板），「把中国的产品/模式/供应链复制到全球」成为所有大厂的战略必选项。2024年Temu实现24%全球跨境电商份额（3年内从0到全球前三），TikTok Shop全球GMV约$1000亿，SHEIN估值660亿美元。中国跨境电商正在重塑全球贸易格局。')),
    p(b('核心逻辑：'), t('中国出海的核心竞争力来自三个维度：（1）供应链效率——中国制造业成本优势使同质商品价格低40-60%；（2）互联网运营能力——中国互联网公司在算法推荐、用户增长、直播带货等方面领先全球；（3）资本实力——大厂愿意承受数年亏损换取全球市场份额。')),
    p(b('适合商科岗位：'), t('出海运营（市场本地化）、跨境电商运营、国际BD/销售、供应链/物流管理、战略分析（国际市场）、投资研究（出海方向）')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('一、行业基本概念'),
    h2('1.1 出海模式分类'),
    h3('跨境电商——商品出海'),
    li(b('全托管模式（Temu/SHEIN早期）：'), t('平台全权负责物流、定价、售后、广告，卖家只需提供商品。门槛最低、扩张最快，但卖家无品牌沉淀。Temu以全托管起家，快速覆盖70+国家')),
    li(b('半托管模式（Temu/AliExpress转型中）：'), t('卖家自建海外仓/本地仓发货，平台负责流量和售后。半托管可规避de minimis关税风险（本地仓发货不受小额包裹关税豁免政策影响）')),
    li(b('独立站模式（SHEIN/Anker）：'), t('品牌自建官网销售（不依赖平台），通过Google/Facebook广告获客。利润率高但获客成本高，适合有品牌溢价的企业')),
    h3('应用出海——模式/产品出海'),
    li(b('TikTok（短视频出海）：'), t('字节跳动将「抖音」模式复制到全球，TikTok全球MAU超15亿。TikTok Shop（直播电商出海）是2024年增速最快的出海业务')),
    li(b('游戏出海：'), t('2025年中国游戏海外收入204.5亿美元(+10.23%)。SLG品类（莉莉丝/FunPlus）和二次元（米哈游）是出海最成功的品类')),
    li(b('工具应用出海：'), t('CapCut（剪映海外版）、Lemon8（小红书海外版）、Bigo Live（YY系直播出海）')),
    h2('1.2 关键基础设施'),
    li(b('国际物流：'), t('菜鸟国际（阿里）、极兔国际（拼多多系）、SHEIN自建仓。中国→海外的物流时效从2-3周缩短至7天（海外仓直发3天）')),
    li(b('支付：'), t('PayPal、Stripe + 本地支付（东南亚GrabPay/ShopeePay，拉美Pix/Mercado Pago）。支付本地化是出海电商的关键成功因素')),
    li(b('流量获取：'), t('Google Ads + Meta Ads是海外最主要的广告渠道。Temu 2024年在Meta/Google上的广告投入估算超$30亿，是全球最大的广告主之一')),
    h2('1.3 必背核心指标'),
    li(b('GMV（成交额）：'), t('Temu 2024年GMV超700亿美元，TikTok Shop全球约$1000亿（来源：PDD财报/媒体报道）')),
    li(b('CAC（获客成本）：'), t('Temu在美国的单用户获客成本约$30-50（含Super Bowl广告摊薄），高于国内电商但用户LTV也更高')),
    li(b('退货率：'), t('跨境电商退货率15-25%（含物流损失），远高于国内（5-10%）。退货处理成本是跨境电商最大的隐性成本')),
    li(b('物流时效：'), t('直邮模式7-15天，海外仓3-5天。物流时效直接影响用户满意度和复购率')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('二、市场规模'),
    li(b('全球电商市场：'), t('2025年预计突破$7万亿，其中跨境电商占比约15-20%（约$1-1.4万亿）')),
    li(b('中国跨境电商出口：'), t('2025年预估超2万亿元人民币，同比+15-20%（来源：商务部/海关数据）')),
    li(b('Temu全球份额：'), t('3年内实现24%全球跨境电商份额（来源：媒体报道/行业估算）')),
    li(b('TikTok Shop：'), t('2025年全球GMV约$1000亿，活跃买家4亿+。美国月GMV超$11亿（来源：36氪/行业报告）')),
    li(b('东南亚电商：'), t('Shopee 52%东南亚GMV份额（印尼/泰国/越南），TikTok Shop通过与Tokopedia整合在印尼快速增长')),
    li(b('中国游戏海外收入：'), t('2025年204.5亿美元(+10.23%)，美国市场占32.31%、日本16.35%（来源：CADPA）')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('三、竞争格局'),
    h2('3.1 跨境电商「四小龙」'),
  ]);

  await writeTable(objToken,
    ['平台', '模式', '2024-2025 GMV', '核心市场', '关键优势'],
    [
      ['Temu (PDD)', '全托管→半托管', '超$700亿(2024)', '北美/欧洲/中东', '极致低价+PDD供应链整合+$30亿+广告投入'],
      ['SHEIN', '自有品牌+平台', '估值660亿美元', '欧洲/美国/中东', '快时尚柔性供应链+15天上新周期+品牌认知'],
      ['TikTok Shop', '兴趣电商出海', '全球约$1000亿', '东南亚/美国/英国', '15亿MAU流量入口+直播/短视频带货'],
      ['AliExpress(速卖通)', '传统跨境→半托管', '全球覆盖', '欧洲/南美/中东', '阿里商家资源+菜鸟国际物流'],
    ]
  );
  await sleep(400);

  await writeBlocks(objToken, [
    h2('3.2 区域市场竞争'),
    h3('北美市场'),
    p(t('最大单一市场，也是监管压力最大的市场。Temu在美国下载量多次超过Amazon，但面临de minimis政策收紧风险（$800以下小包裹免关税政策可能调整）。TikTok Shop面临TikTok禁令风险（2024-2025年持续的立法压力）。SHEIN在美国市场品牌认知最高（93%知晓率），但用户转化率停滞在50%。')),
    h3('东南亚市场'),
    p(t('增速最快的电商区域，Shopee以52%市场份额领先（印尼/泰国/越南）。TikTok Shop通过与Tokopedia（印尼最大本地电商）整合，在东南亚实现了「内容电商+本地电商」双模式。中国卖家在东南亚面临的核心挑战：物流基础设施薄弱、支付碎片化、消费力有限（客单价低）。')),
    h3('中东/拉美/非洲市场'),
    p(t('新兴市场，增速高但体量小。Temu/SHEIN均在积极拓展。核心挑战：支付基础设施不完善（现金支付比例高）、物流时效差（2-3周）、退货处理困难。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('四、行业发展趋势（2025-2027）'),
    h2('趋势一：de minimis政策收紧——跨境电商最大变数'),
    p(t('事实依据：美国de minimis政策（$800以下小包裹免征关税）是Temu/SHEIN低价策略的关键政策基础。2025年美国立法机构正在讨论收紧或取消该政策，欧盟也在考虑类似措施。若取消，跨境直邮包裹将面临15-25%关税，直接冲击Temu/SHEIN的价格优势。')),
    p(t('趋势判断：即使de minimis收紧，「中国制造成本优势+极致供应链效率」仍然存在。应对方式：从全托管直邮转向半托管+海外仓模式（在美国/欧洲建本地仓发货，规避小包裹关税）。Temu/AliExpress已在推进半托管转型。')),
    h2('趋势二：TikTok Shop——直播电商全球化'),
    p(t('事实依据：TikTok Shop在东南亚GMV翻倍，美国月GMV超$11亿(2025年中)，美国女装类目GMV $7.42亿(上半年，+149%，全托管模式)。单品最高GMV达$550万（来源：36氪报道）。')),
    p(t('趋势判断：直播电商出海是2025年最大的跨境商业模式创新。核心挑战：（1）TikTok禁令风险；（2）欧美用户直播购物习惯尚未完全养成；（3）本地化运营（达人/物流/客服）成本高。若TikTok存续，TikTok Shop可能成为全球第三大电商平台。')),
    h2('趋势三：品牌出海取代白牌出海'),
    p(t('事实依据：早期跨境电商以白牌/低价商品为主（Wish/早期速卖通），2025年趋势是「中国品牌全球化」——Anker（充电宝）、SHEIN（快时尚）、泡泡玛特（潮玩）、追觅（扫地机器人）等品牌在海外建立了品牌溢价。')),
    p(t('趋势判断：白牌低价竞争长期不可持续（关税+竞争加剧），有品牌溢价的出海企业利润率和估值远高于白牌。商科背景的求职者在品牌出海方向有天然优势（品牌策略/海外市场研究/用户洞察）。')),
    h2('趋势四：AI赋能出海运营'),
    p(t('事实依据：AI翻译（自动多语言商品描述）、AI客服（多语言智能客服）、AI选品（基于海外消费数据推荐热销品类）正在降低出海运营成本30-50%。SHEIN的柔性供应链本身就高度依赖AI预测（提前预判爆款→小单快反）。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('五、主要玩家近期动态'),
    h2('5.1 Temu (PDD Holdings)'),
    li(b('2024年GMV：'), t('超$700亿美元，覆盖70+国家。在上线仅2年内实现24%全球跨境电商份额——电商史上最快的全球化扩张（来源：PDD 2024年全年财报/媒体估算）')),
    li(b('Super Bowl广告：'), t('连续两年投放美国超级碗广告（单条$700万+），快速建立美国消费者品牌认知')),
    li(b('全托管→半托管转型：'), t('2025年开始推进半托管模式——卖家在美国/欧洲本地仓发货，规避de minimis关税风险，同时提升物流时效（3-5天达）')),
    li(b('2025年澳大利亚销售：'), t('预计达260亿澳元，占澳大利亚零售市场5%。引发当地「支持本地商家」舆论反弹')),
    li(b('风险提示：'), t('美国de minimis政策收紧、多国数据隐私/知识产权审查、与Amazon/Walmart正面竞争加剧')),
    h2('5.2 SHEIN'),
    li(b('估值660亿美元：'), t('全球最大快时尚跨境电商。核心优势：柔性供应链（15天从设计到上架，每天上新5000+款式）+AI驱动选品+品牌认知（欧洲93%品牌知晓率）')),
    li(b('平台化转型：'), t('从「自有品牌」转向「平台+品牌」双模式，引入第三方卖家（类似淘宝模式）。目标：从快时尚品牌升级为综合电商平台')),
    li(b('IPO计划：'), t('多次传出上市计划（伦敦/纽约），但因中美关系和监管审查多次延迟。一旦上市，将是近年最大的科技IPO之一')),
    h2('5.3 TikTok Shop'),
    li(b('2025年全球GMV约$1000亿：'), t('活跃买家4亿+。东南亚（最大市场）+美国（增速最快）+英国（最早试点）三大区域')),
    li(b('美国市场爆发：'), t('月GMV超$11亿(2025年中)，女装全托管类目GMV $7.42亿(H1，+149%)。直播带货+短视频种草在美国年轻用户中接受度持续提升')),
    li(b('东南亚+Tokopedia整合：'), t('通过收购/整合Tokopedia（印尼最大电商），TikTok Shop在东南亚实现「内容电商+本地电商」双引擎')),
    li(b('核心风险：'), t('美国TikTok禁令（2024年通过立法但延期执行）是最大不确定性。若TikTok在美国被禁，TikTok Shop美国业务将直接受冲击')),
    h2('5.4 AliExpress / 速卖通'),
    li(b('欧洲/中东/南美：'), t('速卖通是阿里国际电商核心载体，覆盖欧洲（尤其俄罗斯/西班牙/法国）+中东+南美。菜鸟国际物流是其竞争优势（大件/重货跨境配送能力领先）')),
    li(b('半托管模式：'), t('与Temu同步推进半托管，帮助中国卖家在海外建本地仓。速卖通的优势：阿里商家资源（淘宝/1688商家直接上架海外）')),
    h2('5.5 中国游戏出海'),
    li(b('2025年海外收入204.5亿美元：'), t('(+10.23%)，美国32.31%、日本16.35%（来源：CADPA）')),
    li(b('头部出海公司：'), t('米哈游（原神/星穹铁道）、莉莉丝（AFK系列）、FunPlus（State of Survival）、Habby（弓箭传说）——这些公司海外收入占比50-80%')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('六、求职视角：出海赛道商科岗位'),
    h2('6.1 核心岗位'),
    li(b('海外运营/市场本地化：'), t('负责特定区域（北美/东南亚/中东）的产品运营、用户运营、内容本地化。需要对目标市场文化/消费习惯的深度理解+英语/小语种能力。薪资溢价20-30%（vs 国内运营）')),
    li(b('跨境电商运营：'), t('负责Temu/Amazon/TikTok Shop店铺运营——选品、listing优化、广告投放、库存管理。核心能力：数据分析（转化率/ROI）+平台规则理解+供应链协调')),
    li(b('国际BD/商务拓展：'), t('拓展海外商家入驻/合作伙伴/本地达人资源。TikTok Shop在各国招募本地达人做直播带货，BD人才需求大')),
    li(b('供应链/物流管理：'), t('跨境物流（直邮/海外仓/关务）是出海电商最大痛点。懂国际物流+海关政策的人才极度稀缺')),
    li(b('出海投研/战略分析：'), t('分析海外市场机会、竞争格局、监管风险。TMT基金对出海方向研究员需求大增，核心是海外市场信息获取能力')),
    h2('6.2 面试高频问题'),
    h3('Q1：Temu和SHEIN的商业模式有什么本质区别？'),
    li(b('Temu = 平台模式：'), t('连接中国工厂和全球消费者，不做自有品牌。靠低价+流量吸引用户，靠广告+佣金赚钱。类似「出海版拼多多」')),
    li(b('SHEIN = 品牌+平台：'), t('早期是自有快时尚品牌（SHEIN品牌商品），后转向平台化（引入第三方卖家）。核心优势是柔性供应链（AI选品+小单快反+15天上新）')),
    li(b('本质差异：'), t('Temu追求「极致低价」（同质商品价格最低），SHEIN追求「快时尚品牌」（款式最多更新最快）。Temu的壁垒在于PDD供应链整合能力，SHEIN的壁垒在于柔性供应链+品牌认知')),
    h3('Q2：如果de minimis政策取消，对中国跨境电商的影响有多大？'),
    li(b('直接冲击：'), t('目前中国跨境直邮包裹（平均$20-50/单）免征关税。若取消，将面临15-25%关税，直接推高终端售价，削弱价格竞争力')),
    li(b('应对策略：'), t('（1）转半托管/海外仓模式（本地发货不受de minimis影响）；（2）提升客单价（减少低价商品占比，提高品牌溢价）；（3）分散市场（减少对美国单一市场依赖）')),
    li(b('长期判断：'), t('de minimis收紧会放慢中国跨境电商在美国的扩张速度，但不会逆转趋势——中国供应链成本优势（相比美国本土制造低40-60%）是根本性的，关税只能缩小但无法消除价差')),
    hr(),
    quote(t('数据来源：PDD Holdings 2024年全年财报(2025.3)、TikTok Shop公开数据/36氪报道、CADPA《2025年中国游戏产业报告》、商务部跨境电商统计、Sensor Tower、行业媒体报道')),
  ]);

  console.log('\n✅ 出海与跨境电商深度报告写入完成！');
  console.log(`🔗 https://${DOMAIN}/wiki/${nodeToken}`);
}
main().catch(console.error);
