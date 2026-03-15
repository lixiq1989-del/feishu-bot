/**
 * 🍜 互联网赛道深度报告：本地生活（独立页）
 * 数据来源：美团财报(2024/2025)、饿了么/阿里财报、京东即时零售数据
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
    const req = https.request({
      hostname: 'open.feishu.cn', path: urlPath, method,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}`, 'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      rejectUnauthorized: false,
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
    const chunk = blocks.slice(i, i + 50);
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, { children: chunk });
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
    const elem = rowIdx === 0 ? b(content) : t(content);
    await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${cellIds[idx]}/children`, { children: [p(elem)] });
    await sleep(110);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

async function main() {
  console.log('📝 写入：本地生活深度报告...\n');
  const { nodeToken, objToken } = await createNode('🍜 本地生活：赛道深度报告（2024-2025）');
  console.log(`  ✅ ${nodeToken}\n  🔗 https://${DOMAIN}/wiki/${nodeToken}`);
  await sleep(800);

  await writeBlocks(objToken, [
    p(b('赛道定位：'), t('本地生活是中国互联网「离线下最近」的赛道——覆盖餐饮外卖、到店消费（团购/预订）、即时配送（跑腿/闪购）、酒旅出行。2024年中国本地生活O2O市场规模约2.5万亿元，线上渗透率约30%，仍有巨大增长空间。美团是毋庸置疑的霸主（市占率65%+），但2025年京东/抖音/饿了么的联合进攻正在改变竞争格局。')),
    p(b('核心逻辑：'), t('本地生活的本质是「将线下消费数字化」。核心竞争力不在技术，而在运营——配送网络密度、地推团队覆盖、商家BD能力。这是一个「重」生意：每一单外卖都需要骑手配送、商家出餐、平台匹配，三方协同的效率决定竞争力。')),
    p(b('适合商科岗位：'), t('运营管理（城市运营/商家运营）、商业分析师（订单效率/配送优化）、战略分析、BD（商家拓展）、供应链/物流管理、投资研究员')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('一、行业基本概念'),
    h2('1.1 行业细分'),
    li(b('餐饮外卖：'), t('用户在平台下单，骑手配送到家。中国外卖市场2024年日均订单量约7000万+单，美团占约65%，饿了么约25%。核心变量：配送速度（平均28-35分钟）、骑手密度、商家丰富度')),
    li(b('到店团购/预订：'), t('用户在平台购买优惠券/套餐，到店核销。美团点评是垄断级存在（市占率80%+），但抖音「团购」2023年开始强势入侵——用短视频种草→团购核销，颠覆传统的搜索→下单模式')),
    li(b('即时零售/闪购：'), t('30分钟送达非餐商品（药品/日用品/3C数码/鲜花）。美团闪购、京东秒送、饿了么是三大参与者。2025年即时零售是本地生活增速最快的子赛道（50%+增速）')),
    li(b('酒旅出行：'), t('酒店/民宿预订+机票火车票+景区门票。美团酒旅是其第二大收入来源，低星酒店（经济型/快捷酒店）市占率超50%；携程则垄断高星酒店和商旅市场')),
    h2('1.2 核心商业模式'),
    h3('外卖平台模式'),
    p(t('商家向平台支付佣金（通常15-25%订单金额）+ 骑手配送费（平台承担大部分，用户支付3-8元配送费）。核心经济模型：UE（单位经济模型）= 客单价×佣金率 - 骑手成本 - 补贴 - 营销费用。UE转正是外卖平台盈利的关键里程碑。')),
    h3('到店广告模式'),
    p(t('商家向平台购买「推广通」等广告位，按CPC/CPM付费获取曝光。美团到店业务利润率极高（50%+），因为不涉及配送成本，本质是一个「本地化的广告平台」。这也解释了为什么美团2024年核心本地商业盈利524亿元。')),
    h2('1.3 必背核心指标'),
    li(b('订单量（Order Volume）：'), t('美团2024年日均外卖订单约7000万+单，是全球最大的即时配送平台')),
    li(b('客单价（AOV）：'), t('外卖平均客单价约40-50元，即时零售约80-120元（含3C/日用品客单价更高）')),
    li(b('骑手成本（每单）：'), t('美团外卖每单骑手成本约6-8元。骑手成本是外卖平台最大单项支出')),
    li(b('GTV（总交易额）：'), t('含外卖+到店+闪购全口径。美团2024年GTV约1.8万亿元（含全品类）')),
    li(b('配送时效：'), t('美团外卖平均配送时长约30分钟，闪购约45分钟。京东秒送承诺「最快9分钟」')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('二、市场规模'),
    li(b('中国本地生活O2O市场：'), t('2024年约2.5万亿元（外卖+到店+闪购+酒旅），线上渗透率约30%（来源：艾瑞咨询）')),
    li(b('餐饮外卖市场：'), t('2024年约1.2万亿元GTV，用户规模超5.5亿。增速放缓至约10%，存量博弈特征显著')),
    li(b('即时零售市场：'), t('2024年约5000亿元，2025年增速50%+（增量最大的子赛道）。非餐品类（药品/日用/3C）快速扩展')),
    li(b('到店团购：'), t('2024年约8000亿元。抖音本地生活GTV约4000亿元，已成为美团到店业务最大威胁')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('三、竞争格局'),
    h2('3.1 外卖市场：美团vs饿了么vs京东秒送'),
    p(t('2024年：美团外卖市占率约65%，饿了么约25%，其他（京东/抖音试水）约10%。2025年：京东秒送杀入外卖市场，与美团打响「外卖补贴大战」，日订单量从0快速攀升至1000万+单。这场大战预计2025全年共计烧钱超千亿元。')),
    h2('3.2 到店团购：美团vs抖音'),
    p(t('美团到店业务2020-2023年垄断地位稳固（80%+份额）。2023年抖音上线「本地生活」频道，通过短视频种草+低价团购券迅速抢夺商家和用户。2025年抖音本地生活GTV约4000亿元，核销率约60%（低于美团的80%+），但增速仍在50%+。抖音的优势在于流量入口（每天4亿+DAU），劣势在于缺乏到店消费的完整闭环（评价体系薄弱、商家工具简陋）。')),
    h2('3.3 竞争矩阵'),
  ]);

  await writeTable(objToken,
    ['维度', '美团', '饿了么', '京东秒送', '抖音本地生活'],
    [
      ['外卖份额', '65%+', '~25%', '快速增长', '试水阶段'],
      ['配送网络', '★★★★★', '★★★★', '★★★★（京东物流）', '★★（依赖第三方）'],
      ['到店/团购', '★★★★★', '★★★', '不涉及', '★★★★（增长最快）'],
      ['即时零售', '★★★★', '★★★', '★★★★★', '★★'],
      ['商家覆盖', '★★★★★（800万+）', '★★★★', '★★★', '★★★'],
    ]
  );
  await sleep(400);

  await writeBlocks(objToken, [
    hr(),
    h1('四、行业发展趋势（2025-2027）'),
    h2('趋势一：即时零售替代传统零售'),
    p(t('事实依据：京东秒送日单量突破1000万，美团闪购年增50%+，消费者对「30分钟达」的品类需求从生鲜日用扩展到3C数码、美妆、家居。2025年即时零售渗透率不到5%，对标日本/韩国10%+渗透率，增长空间巨大。')),
    p(t('趋势判断：即时零售是2025-2027年本地生活最大增量。核心挑战是前置仓成本和品类SKU管理。谁能率先建成高密度前置仓网络，谁就赢得这场战争。')),
    h2('趋势二：外卖大战重燃——百亿补贴时代'),
    p(t('事实依据：2025年京东宣布进军外卖，首月补贴力度高达「满减50%」，美团被迫跟进。美团2025年预亏233-243亿元，核心本地商业从盈利524亿元(2024年)急转直下至亏损68-70亿元(2025年)（来源：美团2025年业绩预告/CNA报道）。')),
    p(t('趋势判断：这场外卖大战的终局可能不是任何一方退出，而是两强共存（类似滴滴vs Uber→合并）。但烧钱期间投资者信心和利润波动是最大风险。')),
    h2('趋势三：抖音本地生活增速放缓'),
    p(t('事实依据：抖音本地生活2024年GTV约4000亿元，但核销率（60%）远低于美团（80%+），说明「冲动购买→到店消费」转化率有结构性问题。部分商家反馈「抖音流量大但利润薄」，退出意愿增强。')),
    p(t('趋势判断：抖音在到店团购的增速将放缓，从「颠覆者」变为「补充者」。美团的到店评价体系+高核销率+商家工具是短期内难以被颠覆的壁垒。')),
    h2('趋势四：骑手权益与监管趋严'),
    p(t('事实依据：2024-2025年多地出台骑手社保/工伤保险政策，要求平台为外卖骑手缴纳社保。美团/饿了么骑手数量合计超800万，若全面缴纳社保将新增数百亿成本。')),
    p(t('趋势判断：骑手成本上升是不可逆趋势。平台将通过提升客单价（鼓励高价订单）和AI调度优化（降低单均配送距离）来消化成本压力。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('五、主要玩家近期动态'),
    h2('5.1 美团（3690.HK）'),
    li(b('2024年全年：'), t('净利润358亿元，核心本地商业经营溢利524亿元——这是美团历史上最好的盈利年份（来源：美团2024年全年财报）')),
    li(b('2025年业绩预警：'), t('预亏233-243亿元，核心本地商业从盈利524亿元剧烈转为亏损68-70亿元。主因：京东秒送进军外卖引发补贴大战（来源：美团2025年业绩预告）')),
    li(b('CEO王兴表态：'), t('外卖业务亏损在2025年三季度已见顶，四季度开始改善。暗示补贴力度将逐步收缩')),
    li(b('美团闪购：'), t('非餐即时零售增速50%+，药品/3C是增速最快品类。美团闪购成为美团抵御京东秒送的防御性业务')),
    li(b('美团酒旅：'), t('低星酒店市占率50%+，与携程差异化（美团主攻三四五线+经济型，携程主攻高星+商旅）')),
    h2('5.2 京东即时零售/秒送'),
    li(b('2025年进军外卖：'), t('日订单量突破1000万单（从零到千万级仅用数月）。补贴力度高达「满减50%」，主攻一二线城市白领市场')),
    li(b('与美团核心差异：'), t('京东物流体系（自营骑手+仓配一体）提供「品质送」体验；3C数码/家电即时零售是京东的独特优势——在美团/饿了么买不到iPhone，但京东秒送可以30分钟送达')),
    li(b('烧钱规模：'), t('京东即时零售2025年预计亏损200-300亿元（与美团、饿了么合计烧钱超千亿），刘强东的赌注：外卖是入口，一旦用户养成「京东秒送」心智，所有品类都将高频复购')),
    h2('5.3 饿了么（阿里巴巴旗下）'),
    li(b('2025年战略调整：'), t('配合淘宝即时购（小时达），饿了么从独立App转向「淘宝入口+独立App」双轮驱动。阿里在即时电商上投入250亿元（FY2025数据）')),
    li(b('市场定位：'), t('在美团vs京东大战中处于「第三方」角色。优势是阿里生态（支付宝/淘宝导流），劣势是品牌心智弱于美团、配送效率不及京东')),
    h2('5.4 抖音本地生活'),
    li(b('2024-2025年：'), t('GTV约4000亿元，团购核销率约60%。核心优势：短视频种草带来冲动式消费，商家获客成本低于美团')),
    li(b('痛点：'), t('核销率低（大量用户买了团购券但不到店消费）、商家工具简陋（CRM/评价体系不如美团完善）、退款率高。这些问题短期内难以解决，限制了抖音在到店赛道的天花板')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('六、公司年报深度拆解'),
    h2('6.1 美团 2024年全年财报'),
    li(b('净利润：'), t('358亿元——历史最佳。受益于外卖UE(单位经济模型)持续优化、到店业务高利润率贡献')),
    li(b('核心本地商业：'), t('经营溢利524亿元（含外卖+到店+酒旅+闪购）。到店业务利润率估算50%+，是利润核心')),
    li(b('新业务（美团优选/快驴）：'), t('亏损大幅收窄，从此前年亏损200亿+缩至约100亿。社区团购(美团优选)经历大幅收缩后保留核心城市')),
    quote(t('关键信号：2024年是美团「收获期」——多年亏损的新业务大幅减亏，外卖+到店利润释放。但2025年京东进攻打破了这个「黄金时代」。')),
    h2('6.2 美团 2025年预亏解读'),
    li(b('预亏233-243亿元：'), t('vs 2024年盈利358亿，同比恶化近600亿元。净利润从+358亿到-240亿的反转，是中国互联网2025年最戏剧性的利润变化')),
    li(b('核心原因：'), t('外卖补贴大战。京东秒送的高强度补贴迫使美团跟进，外卖业务从盈利转为巨额亏损。同时即时零售/闪购的扩张也需要大量投资')),
    li(b('王兴的判断：'), t('外卖亏损Q3见顶、Q4改善，说明补贴力度正在收缩。市场预期2026年美团将恢复盈利（券商共识）')),
    quote(t('投资逻辑：美团2025年预亏是「主动选择的战略亏损」（应对京东进攻），不是基本面恶化。核心看点：外卖补贴何时收缩（2025 Q3-Q4）、即时零售规模能否成为第二增长引擎、到店业务利润能否对冲外卖亏损。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('七、求职视角：本地生活赛道商科岗位'),
    h2('7.1 核心岗位'),
    li(b('城市运营/区域运营：'), t('本地生活最核心岗位——管理一个城市/区域的商家数量、订单量、骑手效率。需要极强的数据分析+执行力+地推管理。美团/饿了么/京东秒送均有大量HC，是商科毕业生最直接的入口')),
    li(b('商家BD/KA销售：'), t('负责拓展餐饮/零售商家入驻平台，谈判佣金费率、推广方案。顶级BD年签约商家数百家，佣金率谈判能力直接影响平台利润')),
    li(b('商业分析师/策略分析：'), t('分析订单效率（配送时长/骑手利用率）、商家数据（客单价/复购率）、用户行为（搜索→下单漏斗）。SQL+数据看板是必备能力')),
    li(b('供应链/物流管理：'), t('即时零售的前置仓选址、库存管理、配送路线优化。需要运筹学/供应链背景，薪资溢价明显')),
    h2('7.2 面试高频问题'),
    h3('Q1：美团2025年为什么从盈利358亿变成预亏240亿？'),
    li(b('直接原因：'), t('京东秒送进军外卖，美团被迫跟进补贴大战。外卖从盈利转为巨额亏损')),
    li(b('深层逻辑：'), t('本地生活的护城河（配送网络+商家覆盖）并非不可穿透——京东物流的自建配送能力+资金实力使其成为美团第一次面对的「同量级对手」')),
    li(b('判断框架：'), t('这是「战略性亏损」（主动选择）还是「结构性亏损」（商业模式问题）？答案是前者——美团到店业务利润率50%+、骑手配送网络密度全国第一，基本面未恶化。补贴结束后，利润会回归')),
    h3('Q2：即时零售与传统电商的本质区别是什么？'),
    li(b('时效维度：'), t('传统电商次日达（京东211），即时零售30分钟达。30分钟时效要求前置仓/门店覆盖密度极高，运营复杂度指数级增长')),
    li(b('品类维度：'), t('传统电商适合计划性消费（买手机提前比价），即时零售适合即时性需求（突然想喝饮料/手机充电线断了/半夜发烧需要药）')),
    li(b('竞争壁垒维度：'), t('传统电商壁垒在「SKU宽度+价格」，即时零售壁垒在「前置仓密度+配送网络+品类深度」。后者更重、更难复制，但一旦建成护城河更深')),
    hr(),
    quote(t('数据来源：美团2024年全年财报、美团2025年业绩预告、CNA报道(2026.2)、京东2025年全年财报(2026.3)、阿里巴巴FY2025财报、艾瑞咨询本地生活报告')),
  ]);

  console.log('\n✅ 本地生活深度报告写入完成！');
  console.log(`🔗 https://${DOMAIN}/wiki/${nodeToken}`);
}

main().catch(console.error);
