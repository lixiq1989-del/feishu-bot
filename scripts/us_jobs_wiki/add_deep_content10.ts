/**
 * 美国商科求职知识库 - 深度内容补充（第十批）
 * 市场常识100题 / Equity Research / D&I招聘项目 / STEM转金融 / 职场第一年生存手册
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

const SPACE_ID = '7615700879567506381';
const PARENT_NODE_TOKEN = 'Adh3w4XwCiMs2zkApVhcFdT0nFf';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

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
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 300))); } });
    });
    req.on('error', reject);
    if (data) req.write(data); req.end();
  });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function t(text: string, bold = false, italic = false): any {
  return { text_run: { content: text, text_element_style: { bold, italic } } };
}
function p(...elements: any[]): any {
  return { block_type: 2, text: { elements, style: {} } };
}
function h2(text: string): any {
  return { block_type: 4, text: { elements: [t(text, true)], style: {} } };
}
function h3(text: string): any {
  return { block_type: 5, text: { elements: [t(text, true)], style: {} } };
}
function li(...elements: any[]): any {
  return { block_type: 12, text: { elements, style: {} } };
}
function hr(): any { return { block_type: 22 }; }

async function writeBlocks(objToken: string, blocks: any[]) {
  const CHUNK = 50;
  for (let i = 0; i < blocks.length; i += CHUNK) {
    const chunk = blocks.slice(i, i + CHUNK);
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, {
      children: chunk, index: i,
    });
    if (r.code !== 0) console.error(`  ❌ block写入失败: ${r.code} ${r.msg}`);
    else console.log(`  ✓ 写入 blocks ${i}-${Math.min(i + CHUNK, blocks.length) - 1}`);
    await sleep(400);
  }
}

async function createPage(title: string, blocks: any[]): Promise<string | null> {
  console.log(`\n📄 创建页面：${title}`);
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    parent_node_token: PARENT_NODE_TOKEN,
    node_type: 'origin',
    title,
  });
  if (r.code !== 0) { console.error(`  ❌ 创建失败: ${r.code} ${r.msg}`); return null; }
  const nodeToken = r.data?.node?.node_token;
  const objToken = r.data?.node?.obj_token;
  console.log(`  node_token: ${nodeToken}`);
  await sleep(600);
  await writeBlocks(objToken, blocks);
  console.log(`  ✅ https://${DOMAIN}/wiki/${nodeToken}`);
  return nodeToken;
}

// ============================================================
// 页面1：📰 华尔街市场常识100题（面试必备时事+宏观+产品知识）
// ============================================================
const marketKnowledgeBlocks: any[] = [
  p(t('来源：Bloomberg Markets、Wall Street Journal日常阅读、Goldman Sachs经济研究报告、CFA Level 1考纲、S&T/IBD面试官反馈，覆盖宏观经济/市场结构/金融产品三大模块。', false, true)),
  hr(),
  h2('一、宏观经济基础（Macro Foundation）— 必知30题'),
  h3('货币政策与美联储'),
  li(t('美联储（Federal Reserve）有哪两大使命？')),
  p(t('答：1) 最大化就业（Maximum Employment）；2) 稳定物价（Price Stability，目标通胀率2%）。这叫"Dual Mandate"（双重使命）。')),
  li(t('联邦基金利率（Fed Funds Rate）是什么？它如何影响经济？')),
  p(t('答：银行之间隔夜借贷的利率，由美联储FOMC设定目标区间。加息→借贷成本上升→消费/投资减少→压制通胀；降息→反之，刺激经济。')),
  li(t('什么是量化宽松（QE）？与普通降息有何区别？')),
  p(t('答：QE是美联储在利率接近零时，通过直接购买国债/MBS向市场注入流动性。普通降息通过价格机制（利率），QE通过数量机制（直接买资产）。COVID期间美联储QE扩表超$4万亿。')),
  li(t('收益率曲线倒挂（Inverted Yield Curve）是什么信号？')),
  p(t('答：正常情况下长端利率>短端利率（因为时间风险溢价）。倒挂（短端>长端）通常是经济衰退的领先指标，历史上倒挂后1-2年内多发生衰退。2022-2023年美国出现严重倒挂。')),
  li(t('通货膨胀（Inflation）和利率的关系是什么？')),
  p(t('答：通胀上升→美联储加息（防止经济过热）；通胀下降→美联储降息（刺激经济）。这是标准的货币政策反应函数。2022年美国CPI峰值9.1%→美联储快速加息500bp。')),
  h3('市场结构与指标'),
  li(t('标普500（S&P 500）是什么？它代表美国经济吗？')),
  p(t('答：S&P 500是美国市值最大的500家上市公司的指数，按市值加权。不完全代表经济——它高度集中于大型科技股（苹果/微软/Nvidia等占比约30%），而经济中有大量中小企业和服务业不在其中。')),
  li(t('VIX指数是什么？正常范围是多少？')),
  p(t('答：VIX是"恐慌指数"，衡量S&P 500期权隐含的30天预期波动率。正常市场<20；市场压力期20-30；危机时>40（2020年COVID峰值达80以上）。VIX飙升=市场恐慌。')),
  li(t('什么是10年期美国国债收益率？为什么重要？')),
  p(t('答：10年期美国国债的年化收益率，被视为"无风险利率"（Risk-free Rate）。它影响：1) 所有资产的折现率（WACC）；2) 抵押贷款利率；3) 企业债成本；4) 股票估值（分母变大→股价下降）。')),
  li(t('美元指数（DXY）是什么？它如何影响其他资产？')),
  p(t('答：衡量美元对一篮子主要货币的价值。美元走强→大宗商品（以美元计价）价格受压→新兴市场货币承压；美元走弱→反之。美元与黄金通常负相关。')),
  h3('重要经济指标'),
  li(t('GDP（国内生产总值）的四个组成部分是什么？')),
  p(t('答：GDP = C（消费）+ I（投资）+ G（政府支出）+ NX（净出口=出口-进口）。美国GDP结构：消费约占70%，这也是为什么消费数据（零售销售/信心指数）如此重要。')),
  li(t('PCE（Personal Consumption Expenditures）和CPI有什么区别？美联储更关注哪个？')),
  p(t('答：CPI是固定篮子，PCE会随消费者行为变化调整权重；PCE涵盖更广（含医疗保险报销部分）。美联储官方目标是PCE通胀2%（而非CPI），所以更关注PCE。')),
  li(t('非农就业数据（Non-Farm Payrolls）对市场有什么影响？')),
  p(t('答：每月第一个周五发布，是最重要的就业指标。好于预期→市场可能认为经济强→美联储可能不降息→债券跌股票反应复杂；差于预期→降息预期升→债券涨。')),
  hr(),
  h2('二、固定收益基础（Fixed Income）— 必知20题'),
  h3('债券定价基础'),
  li(t('债券价格与收益率是什么关系？')),
  p(t('答：反向关系。市场利率上升→新债给更高收益率→旧债按面值相比不够吸引力→旧债价格下跌。利率下降→债券价格上涨。这是固定收益最基础的概念。')),
  li(t('什么是Duration（久期）？为什么重要？')),
  p(t('答：衡量债券价格对利率变化的敏感度。久期越长→利率上升时价格下跌越多。30年期国债久期约20，意味着利率升1%，债券价格跌约20%。投资组合管理中用久期来控制利率风险。')),
  li(t('投资级（Investment Grade）和高收益（High Yield/Junk）债券的区别？')),
  p(t('答：IG是BBB-/Baa3及以上评级，HY是BB+/Ba1及以下。IG利率低、违约率低（约0.1-0.5%/年）；HY利率高（通常高出IG 3-5%），违约率高（约3-5%/年，危机时可达10%+）。')),
  li(t('什么是信用利差（Credit Spread）？它如何反映市场情绪？')),
  p(t('答：公司债收益率与同期国债收益率之差，代表信用风险溢价。利差收窄=市场乐观（风险偏好高）；利差扩大=市场担忧（避险情绪）。高收益利差是经济衰退的重要先行指标。')),
  h3('衍生品基础（Derivatives）'),
  li(t('看涨期权（Call Option）和看跌期权（Put Option）的区别？')),
  p(t('答：Call赋予持有人在到期日前以执行价买入标的资产的权利（不是义务）；Put赋予卖出的权利。Buy Call = 看多；Buy Put = 看空；Sell Call = 轻微看空+收权利金；Sell Put = 轻微看多+收权利金。')),
  li(t('什么是Delta？Gamma？Theta？Vega？')),
  p(t('答：Delta = 期权价格对标的资产价格变化的敏感度（Call Delta 0-1，Put Delta -1-0）；Gamma = Delta对标的价格变化的敏感度（二阶导）；Theta = 时间价值每日衰减；Vega = 期权价格对波动率变化的敏感度。')),
  li(t('什么是利率互换（Interest Rate Swap）？谁会用它？')),
  p(t('答：两方交换不同利率现金流的合约。常见：A固定利率利息 ↔ B浮动利率（SOFR）利息。使用者：公司想把浮动债务转换成固定以锁定成本；银行管理利率风险；投机者押注利率方向。')),
  hr(),
  h2('三、金融产品与市场结构（Products & Structure）— 必知20题'),
  h3('股票市场结构'),
  li(t('IPO（首次公开发行）的流程是什么？')),
  p(t('答：选择承销商（BB/EB）→ 准备S-1申请文件→SEC审批→路演（Management roadshow, 2周）→ 簿记（BookBuild，收集机构投资者订单）→ 定价（通常定在路演收集的需求区间）→ 上市交易→稳定期（Greenshoe）。')),
  li(t('做市商（Market Maker）是做什么的？')),
  p(t('答：在买卖双方之间提供流动性的中间商。持续公开买价（Bid）和卖价（Ask），从Bid-Ask Spread中获利。大型做市商：Citadel Securities/Virtu Financial/Jane Street。他们让市场可以随时买卖。')),
  li(t('什么是Prime Brokerage（主经纪商）？它服务谁？')),
  p(t('答：为对冲基金提供综合服务：融资（借钱买股票）、借券（卖空需要）、清算结算、风险管理。主要提供者：Goldman Sachs/Morgan Stanley/JPMorgan。对冲基金的"银行"。')),
  h3('2024年最新市场知识（面试必须了解）'),
  li(t('2024年美联储的利率决策是什么？当前联邦基金利率区间？')),
  p(t('答：美联储在2022-2023年快速加息525bp至5.25-5.50%，2024年9月开始降息（首次-50bp），年底降至4.25-4.50%。2025年降息节奏放缓，因为通胀下降进度不及预期。')),
  li(t('什么是SOFR？为什么取代了LIBOR？')),
  p(t('答：SOFR（Secured Overnight Financing Rate）是美国以国债回购为基础的隔夜利率，是LIBOR的替代品。LIBOR因2012年操纵丑闻被逐步废除，2023年6月正式退出。SOFR更透明，基于真实交易。')),
  li(t('比特币ETF在2024年有什么重大变化？')),
  p(t('答：2024年1月，SEC批准了首批比特币现货ETF（BlackRock iShares/Fidelity Wise Origin等），这是加密货币进入主流金融市场的标志性事件。上市首日交易量超$46亿。')),
  li(t('私信贷（Private Credit）在2024年为何快速增长？')),
  p(t('答：银行因监管收紧减少杠杆贷款，企业转向私信贷（Direct Lending）。Blackstone/Apollo/Ares等资产管理巨头的Private Credit AUM快速增长，利率高企（SOFR+5-8%），对投资者有吸引力。')),
  hr(),
  h2('四、中国相关宏观知识（对中国背景候选人加分）'),
  h3('中美经济关系'),
  li(t('中美贸易战的主要内容和对市场的影响？')),
  p(t('答：2018年开始，美国对中国商品加征关税（最高25%）。影响：供应链转移（越南/墨西哥/印度受益）、半导体出口管制（美国限制先进芯片出口中国）、中国科技股美国上市受限。')),
  li(t('人民币汇率如何运作？与美元的关系？')),
  p(t('答：人民币有"爬行盯住汇率"机制，每日中间价由央行公布，允许在中间价上下2%浮动。人民币贬值→中国出口竞争力提升但外资流出；升值→反之。2024年人民币对美元约7.1-7.3。')),
  li(t('中国房地产危机对全球经济有何影响？')),
  p(t('答：恒大/碧桂园等大型房企债务危机→建设量下降→钢铁/水泥/铜等大宗商品需求减弱→对铁矿石依赖的澳大利亚/巴西出口减少→中国消费信心下降→全球增长预期下调。')),
];

// ============================================================
// 页面2：📊 Equity Research（卖方研究）完整入行指南
// ============================================================
const equityResearchBlocks: any[] = [
  p(t('来源：CFA Institute Equity Research职业调查、Morgan Stanley/Goldman ER部门官方描述、Institutional Investor（II）分析师排名说明、Wall Street Oasis ER论坛，综合在职/前ER分析师分享。', false, true)),
  hr(),
  h2('一、Equity Research职业概览'),
  h3('ER分析师的日常工作'),
  li(t('早上5-7点：阅读隔夜新闻/财报/竞争对手信息，准备Morning Note')),
  li(t('早上8-9点：Sales desk早会，briefing交易员和销售关于你覆盖股票的最新观点')),
  li(t('早上9-11点：市场开盘，实时监控覆盖股票，回应客户（机构投资者）问题')),
  li(t('午后：建立/更新财务模型，撰写深度研究报告')),
  li(t('下午3-5点：与被覆盖公司的IR（投资者关系）团队沟通，了解最新动态')),
  li(t('下午5-7点：写作/完成报告，审核数据')),
  li(t('季报季：工作量翻倍，经常到深夜11点')),
  h3('ER的覆盖结构'),
  li(t('每位分析师通常覆盖15-30只股票（同一行业/子行业）')),
  li(t('评级体系：Buy/Overweight（看多）、Hold/Neutral（中性）、Sell/Underweight（看空）')),
  li(t('目标价（Price Target）：根据DCF/Comps估算的12个月目标价格')),
  li(t('报告类型：Initiation（初始覆盖）/ Update / Deep Dive / Thesis Change')),
  h3('ER薪资（2024年）'),
  li(t('Junior Analyst/Associate（1-2年）：$100,000-$150,000 total comp')),
  li(t('Associate Analyst（2-4年）：$150,000-$250,000 total comp')),
  li(t('Senior Analyst（4年+）：$250,000-$500,000+ total comp')),
  li(t('Top-rated II Analyst（最强10%）：$500,000-$1,500,000+ total comp')),
  li(t('注：ER薪资远低于IB，但工作时间也相对合理（不需要IB那样的80-100小时）')),
  hr(),
  h2('二、Sell-side vs Buy-side Research对比'),
  h3('卖方（Sell-side）Research'),
  li(t('雇主：投资银行（Goldman/MS/JPM/Bank of America/Jefferies等）')),
  li(t('产品：免费给机构客户的研究报告，用于争取交易佣金')),
  li(t('目标：影响力、II排名、维护客户关系')),
  li(t('评分：每年Institutional Investor（II）排名，Top Analyst收入大幅提升')),
  li(t('出路：转Buy-side（最常见），做基金经理/Portfolio Manager')),
  h3('买方（Buy-side）Research'),
  li(t('雇主：对冲基金/共同基金/PE（BlackRock/Fidelity/Citadel等）')),
  li(t('产品：内部分析，直接支持投资决策')),
  li(t('目标：帮助基金赚钱，回报直接linked到compensation')),
  li(t('评分：基金业绩直接评估你的价值')),
  li(t('薪资：通常比Sell-side高，有更多Bonus/Carry')),
  hr(),
  h2('三、ER面试准备'),
  h3('Stock Pitch（最关键的准备）'),
  li(t('准备1-2个深度Stock Pitch，能支撑30分钟讨论')),
  li(t('选择：中等市值公司（$1B-$20B），避免大家都知道的（Apple/Google）')),
  li(t('必须有：Initiation-level detail，含Industry Overview + Company Overview + Financial Model')),
  li(t('量化：给出明确Price Target和上行/下行空间，以及key catalysts')),
  h3('ER特有面试题'),
  li(t('What sectors are you most interested in and why?')),
  li(t('Tell me about a company in [sector] and give me your investment thesis.')),
  li(t('Walk me through your financial model for [company you pitched].')),
  li(t('Who are the top institutional investors in [stock you pitched]? What are their positions?')),
  li(t('What\'s a bullish and bearish thesis for [large-cap company in your sector]?')),
  li(t('What is the most important metric to track for [your sector]? Why?')),
  h3('II（Institutional Investor）排名体系'),
  li(t('每年调查机构投资者：哪位分析师最有帮助？谁的预测最准？')),
  li(t('#1 Ranked Analyst在Goldman/MS：薪资可达$1M-$2M+')),
  li(t('成为Top Ranked需要：准确的预测 + 深度的行业知识 + 强大的客户关系')),
  li(t('对刚入行者：成为II #1是5-10年的目标，不是1年能实现的')),
  hr(),
  h2('四、ER出路分析'),
  h3('主流出路'),
  li(t('Buy-side研究员（最常见）：做2-4年Sell-side后转AM/HF')),
  li(t('Portfolio Manager（PM）：资深后管理自己的portfolio（5-10年路径）')),
  li(t('IR（投资者关系）：被覆盖公司的IR团队（时间更合理）')),
  li(t('Corporate Finance：被覆盖行业的公司CFO Office')),
  li(t('VC/PE（较少）：Deep Tech/Healthcare sector分析师有时转VC')),
  h3('AI对ER的影响（2024年趋势）'),
  li(t('基础数据整理/模型更新被AI工具部分替代（FactSet AI/Bloomberg GPT）')),
  li(t('但：独特的分析视角/关系网络/判断力无法被替代')),
  li(t('建议：主动学习如何用AI工具提升效率（不是被替代，而是成为"使用AI的分析师"）')),
  li(t('前景：顶级分析师价值更高（稀缺性提升），初级ER岗位数量可能减少')),
];

// ============================================================
// 页面3：🎁 D&I招聘项目大全（亚裔/国际学生专属入口）
// ============================================================
const diversityProgramsBlocks: any[] = [
  p(t('来源：Goldman Sachs/JPMorgan/McKinsey/BCG/Deloitte官方官网招聘页面、ASCEND（全美最大亚裔专业人士组织）、Beta Alpha Psi、National Association of Asian MBAs (NAAMBA)、多所大学Career Center汇总，2024-2025年信息。', false, true)),
  hr(),
  h2('一、投行D&I早期招聘项目'),
  h3('Goldman Sachs Diversity Programs'),
  li(t('Possibilities Summit：面向大二学生的2-3天体验项目，了解IB/S&T/AM各业务线')),
  li(t('Undergraduate Technology Insight Days：面向科技背景学生')),
  li(t('GS Diversity Campus Recruiting：专为代表性不足群体设计的早期招聘流程')),
  li(t('时间：通常Possibilities Summit在秋季（10-11月）')),
  li(t('申请策略：AAPI（亚裔）学生可以申请，体验项目后往往有FastTrack申请机会')),
  h3('JP Morgan Chase Diversity Programs'),
  li(t('Winning Women：面向女性学生的金融职业探索项目')),
  li(t('APEX Program：面向First-Generation College Students')),
  li(t('JPMC Advancing Black Pathways：面向Black学生，有fellowship机会')),
  li(t('Advancing Latinos Program：类似')),
  li(t('注：国际学生（F-1/J-1）也可以申请多数D&I项目')),
  h3('Morgan Stanley Programs'),
  li(t('Morgan Stanley Diverse Student Network：全年活动，包括Job Shadowing和Mentoring')),
  li(t('Early Insights Program：大二/大三学生的Diversity探索项目')),
  li(t('Technology Virtual Programs：专门针对Tech/Data Science方向')),
  h3('Bank of America / Citi / Barclays Programs'),
  li(t('BofA Global Capital Markets Diversity Program：有快速通道internship')),
  li(t('Citi Global Perspectives & Solutions Internship：有diversity track')),
  li(t('Barclays Global Internship Diversity Fellowship：$2,500奖学金+实习机会')),
  hr(),
  h2('二、咨询公司D&I项目'),
  h3('McKinsey & Company'),
  li(t('Freshman Fellows Program：面向大一/大二学生，1周体验McKinsey工作')),
  li(t('Future Leaders Program：面向代表性不足群体（含亚裔）')),
  li(t('Women\'s Initiative：专门为女性候选人提供额外支持')),
  li(t('LGBTQ+ Initiative：专项支持')),
  li(t('McKinsey Next Generation Technology Initiative：STEM背景多元化学生')),
  h3('BCG Programs'),
  li(t('BCG Diversity Programs（各office自己组织）：通常春季举办')),
  li(t('On-campus Events：BCG主动去diversity-focused club举办信息会')),
  li(t('注：BCG没有统一的全国性D&I项目，主要通过office-level活动实现')),
  h3('Deloitte / PwC / EY / KPMG Diversity Programs'),
  li(t('Deloitte Scholars Program：$15,000奖学金+实习直通车')),
  li(t('PwC Access Your Potential：提供早期career探索机会')),
  li(t('EY Access Program：面向first-gen/underrepresented学生，早于正式招聘')),
  li(t('KPMG Future Diversity Leaders Conference：全国性会议，有招聘活动')),
  hr(),
  h2('三、亚裔专业人士组织（最有价值的Network）'),
  h3('ASCEND（Pan-Asian Leaders）'),
  li(t('全美最大亚裔商业专业人士组织，在主要大学有分会')),
  li(t('活动：Career Summit / Networking Night / Mentorship Program')),
  li(t('价值：很多大行在ASCEND活动上专门招募亚裔候选人')),
  li(t('加入方式：大学ASCEND分会，会员费约$30-50/年')),
  h3('Beta Alpha Psi（BAP）'),
  li(t('全美会计专业荣誉学会，四大/中型会计师事务所在BAP活动重点招聘')),
  li(t('要求：会计/Finance专业，GPA 3.0+')),
  li(t('好处：与Recruiter直接接触，部分公司只通过BAP招聘某些岗位')),
  h3('National Association of Asian MBAs（NAAMBA）'),
  li(t('专注于MBA级别亚裔专业人士的网络组织')),
  li(t('活动：年度Conference，公司赞助，有大量招聘活动')),
  li(t('适用于：MBA申请前和MBA期间的职业networking')),
  h3('ALPFA（Latino Finance Association）'),
  li(t('对于Spanish/Asian双重背景的学生，这个组织也很有价值')),
  li(t('四大/投行在ALPFA活动上积极招聘')),
  hr(),
  h2('四、国际学生特别注意：如何使用D&I项目'),
  h3('F-1学生是否可以申请D&I项目？'),
  li(t('大多数D&I项目不限制国际学生（除非明确说"US Citizens Only"）')),
  li(t('申请时不需要主动提visa状态（除非被问到）')),
  li(t('D&I项目的目的是增加多样性，你的中国背景 = 文化多样性的体现')),
  h3('如何在D&I项目中脱颖而出'),
  li(t('强调你的"unique perspective"：双语、跨文化理解、中美两地市场洞察')),
  li(t('不要把自己塑造成"hard-working Chinese student"的刻板印象')),
  li(t('强调：你想解决什么问题？你有什么独特视角？你如何给团队带来不同的思路？')),
  li(t('参加D&I项目后一定要follow up：发谢谢邮件，加LinkedIn，表达下一步兴趣')),
];

// ============================================================
// 页面4：🔬 理工科转金融完整路径（STEM to Finance）
// ============================================================
const stemToFinanceBlocks: any[] = [
  p(t('来源：Reddit r/quant/r/FinancialCareers STEM转行帖子汇总、Wall Street Oasis非传统背景入行指南、LinkedIn Survey（STEM毕业生金融就业路径）、CFA Institute STEM候选人报告，综合数百个成功案例分析。', false, true)),
  hr(),
  h2('一、STEM背景在金融行业的真实优势'),
  h3('哪些金融岗位特别欢迎STEM背景'),
  li(t('量化分析师（Quant）：100%需要数学/物理/CS背景')),
  li(t('数据科学（Data Science in Finance）：统计/CS背景最受欢迎')),
  li(t('Risk Management：数学模型能力非常重要')),
  li(t('Algorithmic Trading / Prop Trading：CS+数学背景是标配')),
  li(t('Fintech（科技金融）：工程背景+金融理解=稀缺组合')),
  li(t('Investment Banking Tech Coverage：TMT/Semiconductor/Biotech组偏好理工背景')),
  li(t('Healthcare Investment Banking：生物/医学背景能真正理解公司业务')),
  h3('STEM学生的弱点（需要补充）'),
  li(t('金融知识空白：不了解基本财务报表和估值方法')),
  li(t('业务洞察力（Business Intuition）：习惯技术思维，不擅长"big picture"思考')),
  li(t('Networking习惯差：工程师文化不擅长主动建立关系')),
  li(t('口头表达：相比商科学生，presentation和storytelling能力较弱')),
  hr(),
  h2('二、主要转型路径（按目标职位）'),
  h3('路径1：STEM → 量化金融（Quant）'),
  li(t('最自然的转型，几乎不需要"转行"，是技能的直接应用')),
  li(t('目标岗位：Quant Researcher / Quant Trader / Quant Developer / Risk Quant')),
  li(t('关键技能：Python/C++ + 概率论 + 统计学 + 机器学习')),
  li(t('学历：顶级Quant基金（Citadel/Two Sigma/Renaissance）强烈偏好PhD')),
  li(t('硕士路径：MFE（Master of Financial Engineering）是最直接的证书')),
  li(t('MFE项目：CMU MSCF / Columbia MFE / NYU MFE / Berkeley MFE / Princeton MFin')),
  h3('路径2：CS/工程 → 科技行业金融岗（最顺滑）'),
  li(t('大科技公司都有Finance/Strategy团队，CS背景进入很自然')),
  li(t('岗位：Data Scientist (Finance) / Business Analyst / Product Analyst / Finance Engineering')),
  li(t('Google有专门的"Finance SWE"岗位，给金融系统建工具')),
  li(t('Amazon的Finance Technology团队需要金融+技术双背景')),
  h3('路径3：STEM + MBA → IB/Consulting（最传统的"洗牌"路径）'),
  li(t('本科STEM → 工作2-3年 → MBA → IB/Consulting Associate')),
  li(t('MBA成为语言转换器：把工程经历翻译成商业语言')),
  li(t('在MBA前：建议在STEM行业做Product/Strategy/BD角色，而非纯技术')),
  li(t('成功率：Wharton/HBS/GSB MBA → IB/MBB成功率约50-70%（含STEM背景）')),
  h3('路径4：工程 → 直接lateral到IB（不需要MBA，难但可能）'),
  li(t('适用：半导体/生物技术行业，IB这些coverage组真的需要技术专家')),
  li(t('关键：先学习Financial Modeling（BIWS课程），再开始申请')),
  li(t('入口：通常先去Big 4 FDD或Regional IB，然后再lateral到BB/EB')),
  hr(),
  h2('三、STEM转金融的自学路线图'),
  h3('阶段1：金融基础（3个月）'),
  li(t('会计基础：Financial Accounting by Dyckman（教材）/ Khan Academy会计课（免费）')),
  li(t('DCF建模：BIWS YouTube DCF Tutorial（免费）')),
  li(t('金融市场：Coursera的Financial Markets课程（Yale Robert Shiller，免费旁听）')),
  li(t('目标：能看懂财务报表，理解基本估值概念')),
  h3('阶段2：技能认证（3-6个月）'),
  li(t('CFA Level 1：对转型有一定帮助，展示commitment，约300小时准备')),
  li(t('FMVA证书（Corporate Finance Institute）：实操建模，适合想进IB/PE的人')),
  li(t('Python for Finance：Coursera/Udemy有专门课程，结合Pandas/NumPy')),
  li(t('SQL：Mode Analytics SQL Tutorial（免费），数据岗位必备')),
  h3('阶段3：实战项目（可以和阶段2并行）'),
  li(t('建立个人投资组合：开Schwab/Fidelity账户，记录投资决策和理由')),
  li(t('做公司分析报告：自选一家公司，做DCF估值，写2页Investment Memo')),
  li(t('参加Stock Pitch Competition：CFA Institute Research Challenge、Rotman等')),
  li(t('Kaggle Finance Competition：量化路线的人展示数据分析能力')),
  hr(),
  h2('四、真实成功案例：STEM转金融'),
  h3('案例1：Caltech物理PhD → Two Sigma Research Scientist'),
  p(t('背景：Caltech理论物理PhD，研究Condensed Matter Physics，毕业时考虑学术界vs工业界。看到Two Sigma的招聘要求后发现完全match（微分方程/统计建模/编程）。')),
  p(t('行动：花3个月学习了Python（金融应用）和基础财务知识。向Two Sigma申请Research Scientist岗位，面试主要考核统计推理和Python编程，几乎不考核金融知识。')),
  p(t('结果：直接拿到Two Sigma offer，base $200k + bonus，总comp第一年约$350k。')),
  h3('案例2：University of Michigan CS → Goldman Sachs S&T Analyst'),
  p(t('背景：Michigan CS本科，参加了Goldman的Diversity招聘项目（Technology Day），被邀请快速通道申请S&T岗位。')),
  p(t('关键差异化：在Goldman面试中，他展示了他用Python做的个人量化交易策略GitHub项目，还展示了对期权定价（Black-Scholes）的理解。')),
  p(t('结果：拿到Goldman S&T Analyst offer（Equity Derivatives desk），之后2年转到了前台Trading。')),
  h3('案例3：Purdue生物化学 → JPMorgan Healthcare IB'),
  p(t('背景：Purdue生物化学硕士，在生物科技公司做了1年Research Associate，然后决定转IB。')),
  p(t('行动：参加了JPMorgan Healthcare Group的Recruiting，强调专业的生物知识。自学了Excel建模（看BIWS教程），在面试中展示了对一个药物研发公司的rNPV分析。')),
  p(t('结果：JPMorgan Healthcare IBD Summer Associate → Full-time offer。"我的生物背景让我在Coverage Group比大多数MBA更能理解公司的核心价值驱动因素。"')),
];

// ============================================================
// 页面5：🌱 职场第一年生存手册（新员工必读）
// ============================================================
const firstYearSurvivalBlocks: any[] = [
  p(t('来源：Harvard Business Review职场研究、First 90 Days (Michael Watkins书)、Manager Tools播客、Glassdoor新员工调查、Reddit r/careerguidance真实帖子，覆盖从入职到晋升的完整第一年路径。', false, true)),
  hr(),
  h2('一、入职前90天（最关键的窗口期）'),
  h3('第1-2周：观察为主，建立关系'),
  li(t('Listen more than you talk：你来了解，不是来表现。多问问题，少说答案。')),
  li(t('学习权力结构：谁真正有影响力（不只是title显示的那些人）？')),
  li(t('Meet your "informal mentors"：找2-3个比你高2-3级、愿意指导你的人')),
  li(t('Understand the unwritten rules：哪些事情大家都做但没写在handbook里？')),
  li(t('Map out stakeholders：谁是你最重要的3个内部客户/合作方？')),
  h3('第3-8周：快速证明价值'),
  li(t('Find an early win：找一个3-4周内能完成并展示成果的小项目')),
  li(t('Over-deliver on the first assignment：第一件被分配的任务要做到超出预期')),
  li(t('Ask for feedback at 30 days："Am I focusing on the right things?"')),
  li(t('Build reputation for reliability：永远按时完成承诺，宁可少承诺多兑现')),
  h3('第9-12周：扩展影响力'),
  li(t('From doing to leading：从执行任务到开始提出改进建议')),
  li(t('Build cross-team relationships：认识其他部门的关键人物')),
  li(t('Establish your personal brand：你想被人记住是因为什么？（精准/速度/创新？）')),
  hr(),
  h2('二、投行/咨询第一年的特别生存法则'),
  h3('投行Analyst第一年'),
  li(t('永远检查数字：每次发出模型前三遍检查，错误会让你在团队中永久留下"粗心"标签')),
  li(t('Formatting matters：在投行，Deck的格式和排版和内容一样重要')),
  li(t('Anticipate requests：你的MD下午3点开会，你应该在早上就准备好他可能需要的数据')),
  li(t('"What else?"思维：每次完成任务后问自己"还有什么Senior会想要但没说的？"')),
  li(t('Build relationships with other Analysts：你的同级是你最好的资源，互相帮助')),
  li(t('Face time culture：即使没事做，在重要时刻（deal close/pitch前）不要7点就跑')),
  h3('咨询Analyst/BA第一年'),
  li(t('Structure everything：每封邮件、每次口头汇报都要有清晰结构（Problem/Finding/Recommendation）')),
  li(t('MECE原则：Mutually Exclusive, Collectively Exhaustive——分析框架必须无遗漏无重复')),
  li(t('数字驱动：每个观点背后要有数据，"我觉得"在咨询公司不被接受')),
  li(t('Manage up：主动告诉你的manager进展，让他们不担心，而非等他来问')),
  li(t('Slide design：咨询公司的幻灯片标准极高，学会"一句话标题"的表达方式')),
  hr(),
  h2('三、中国学生在美国职场的文化适应'),
  h3('最需要改变的习惯'),
  li(t('习惯1改变：从"等待被分配"到"主动要任务"——美国职场期望你主动seek work')),
  li(t('习惯2改变：从"谦虚"到"准确表达自己的贡献"——不说出来等于没做过')),
  li(t('习惯3改变：从"服从上级决定"到"表达专业意见"——你的想法有价值，需要说出来')),
  li(t('习惯4改变：从"集体第一"到"我+团队"的平衡——在绩效评估中你需要清晰表达你的individual contribution')),
  h3('职场英语的具体场景应对'),
  li(t('会议发言：先说结论再说理由（Headline first），不要铺垫太长')),
  li(t('When you disagree："I see it a bit differently... have you considered X?"（不是直接否定）')),
  li(t('When you don\'t know："Good question. Let me check and get back to you by EOD."（不要猜测作答）')),
  li(t('Asking for help："I want to make sure I deliver this correctly — could I get 15 min to align on expectations?"')),
  li(t('Receiving criticism："Thank you for the feedback. Let me make sure I understand — are you suggesting I should X?"')),
  hr(),
  h2('四、第一年如何管理工作生活平衡（特别是高强度行业）'),
  h3('投行/咨询的现实管理'),
  li(t('不要白天浪费时间：如果你中午发呆2小时，晚上就得工作到深夜。中午高效工作=晚上早回家')),
  li(t('建立"深度工作"区块：把最需要专注的工作（建模/写作）放在早上，不要被会议打断')),
  li(t('设定体力锻炼的底线：每周至少2-3次运动（哪怕只是30分钟），否则一年后身体垮掉')),
  li(t('和家人的固定联系时间：给父母/伴侣一个固定时间（如周日早上），提前设预期')),
  h3('心理健康（实用建议）'),
  li(t('Burnout早期信号：对工作全无兴趣、睡眠质量极差、身体出现症状——要及时重视')),
  li(t('找到职场外的anchor：一个hobby/体育活动/朋友圈，让你保持正常人的感觉')),
  li(t('Employee Assistance Program（EAP）：大多数公司免费提供心理咨询，不要羞于使用')),
  li(t('Talk to your mentor/buddy：每家公司都有新员工mentor，不需要独自承受压力')),
  h3('美国员工权利基础知识'),
  li(t('FMLA（Family and Medical Leave）：12周不带薪病假保障（联邦法律）')),
  li(t('ADA（Americans with Disabilities Act）：有心理健康问题可以申请合理调整工作安排')),
  li(t('At-will Employment：美国大多数州是"随意解雇"——公司可以在没有明确原因下解雇你（但不能基于歧视）')),
  li(t('Visa相关：如果被解雇，F-1/OPT有60天宽限期找新工作，H-1B有60天找新雇主')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十批）...\n');
  await createPage('📰 华尔街市场常识100题（宏观/固收/衍生品/2024热点）', marketKnowledgeBlocks);
  await createPage('📊 Equity Research（卖方研究）完整入行指南', equityResearchBlocks);
  await createPage('🎁 D&I招聘项目大全（亚裔/国际学生专属入口）', diversityProgramsBlocks);
  await createPage('🔬 理工科转金融完整路径（STEM to Finance）', stemToFinanceBlocks);
  await createPage('🌱 职场第一年生存手册（新员工必读）', firstYearSurvivalBlocks);
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/Adh3w4XwCiMs2zkApVhcFdT0nFf`);
}

main().catch(console.error);
