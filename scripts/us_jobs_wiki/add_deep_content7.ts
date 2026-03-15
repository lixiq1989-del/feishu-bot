/**
 * 美国商科求职知识库 - 深度内容补充（第七批）
 * Financial Modeling自学 / S&T职业路径 / 房地产金融 / 网申测试攻略 / LinkedIn优化
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
// 页面1：📈 Financial Modeling自学完整指南（DCF/LBO/资源库）
// ============================================================
const financialModelingBlocks: any[] = [
  p(t('来源：Breaking Into Wall Street (BIWS) 教程、Aswath Damodaran NYU课程（公开）、Mergers & Inquisitions教程、Wall Street Prep教材、Reddit r/FinancialCareers建议，整合最系统的自学路径。', false, true)),
  hr(),
  h2('一、Financial Modeling核心技能体系'),
  h3('三大基础模型（必须掌握）'),
  li(t('3-Statement Model：'), t('损益表/资产负债表/现金流量表联动，所有模型的基础', true)),
  li(t('DCF (Discounted Cash Flow)：'), t('公司内在价值估算，IB/PE面试必考', true)),
  li(t('LBO (Leveraged Buyout) Model：'), t('PE面试核心，收购杠杆收益分析', true)),
  h3('进阶模型（加分项）'),
  li(t('M&A Accretion/Dilution Model：'), t('并购EPS影响分析', true)),
  li(t('Comparable Company Analysis (Comps)：'), t('市场倍数估值，相对估值', true)),
  li(t('Precedent Transactions：'), t('历史交易对比估值', true)),
  li(t('Real Estate Financial Model：'), t('REPE专用，NOI/Cap Rate/Waterfall', true)),
  li(t('Sum of the Parts (SOTP)：'), t('多业务线公司估值', true)),
  hr(),
  h2('二、YouTube学习资源（完全免费）'),
  h3('Breaking Into Wall Street (BIWS) — 最推荐'),
  li(t('YouTube频道：@BreakingIntoWallStreet，超过200个免费视频')),
  li(t('核心免费系列：Excel Crash Course / DCF Tutorial / 3-Statement Model')),
  li(t('学习建议：先看"How to Build a DCF Model"系列（共4个视频）')),
  li(t('适合人群：想进IB/PE的人，内容完全围绕金融求职')),
  li(t('付费课程（可选）：BIWS Financial Modeling Mastery，$397，非常值得如果认真找IB工作')),
  h3('Professor Aswath Damodaran — 最严谨'),
  li(t('YouTube频道：@AswathDamodaran，NYU金融学教授，估值领域权威')),
  li(t('推荐播放列表：Valuation / Applied Corporate Finance / Investment Philosophies')),
  li(t('特点：理论深度远超其他资源，理解"为什么"而不只是"怎么做"')),
  li(t('配套网站：pages.stern.nyu.edu/~adamodar，免费下载所有模型和数据集')),
  li(t('推荐课：Spring 2024 Valuation Course（YouTube上完整录制）')),
  h3('Kenji Explains — 最适合Excel初学者'),
  li(t('YouTube频道：@KenjiExplains，内容清晰简洁')),
  li(t('核心视频：Financial Modeling Crash Course / 3-Statement Model Tutorial')),
  li(t('特点：Excel操作讲解详细，适合完全没有建模经验的人')),
  li(t('同时覆盖：如何用Excel做Scenario Analysis / Sensitivity Tables')),
  h3('其他优质免费资源'),
  li(t('Corporate Finance Institute (CFI)：免费基础课程，有证书（CFI FMVA入门免费）')),
  li(t('Wall Street Oasis YouTube：大量职业经验分享，不只是技术内容')),
  li(t('Excel Campus：@ExcelCampus，Excel快捷键和高级功能专项')),
  li(t('Chandoo.org：Excel可视化和仪表板，适合Analyst报告制作')),
  hr(),
  h2('三、DCF建模完整步骤（从零开始）'),
  h3('Step 1：选公司 + 下载财务数据'),
  li(t('选择原则：先选简单公司（Walmart/Target），避免金融类或特殊会计公司')),
  li(t('数据来源：Macrotrends.net（免费）/ EDGAR SEC filings / company IR页面')),
  li(t('下载至少3年历史财务报表：损益表/资产负债表/现金流量表')),
  h3('Step 2：建3-Statement Model（基础）'),
  li(t('损益表（Income Statement）：预测Revenue → Gross Profit → EBITDA → Net Income')),
  li(t('现金流量表（Cash Flow Statement）：从Net Income → Operating CF → Free Cash Flow')),
  li(t('资产负债表（Balance Sheet）：确保Assets = Liabilities + Equity（平衡检查）')),
  li(t('关键公式：Unlevered Free Cash Flow = EBIT×(1-tax) + D&A - CapEx - ΔNWC')),
  h3('Step 3：预测未来5-10年UFCF'),
  li(t('Revenue Growth Rate：参考历史增长率 + 行业分析师预期')),
  li(t('EBITDA Margin：参考历史区间 + 管理层指引')),
  li(t('CapEx：% of Revenue，参考历史平均')),
  li(t('NWC变化：运营资本需求，通常与Revenue成比例')),
  h3('Step 4：计算WACC（折现率）'),
  li(t('Risk-free Rate：当前10年期美国国债收益率（2024约4.2%）')),
  li(t('Equity Risk Premium：通常用5.0%-6.5%（Damodaran每年更新）')),
  li(t('Beta：Bloomberg或Yahoo Finance查历史Beta，通常unlevered后relevered')),
  li(t('Cost of Equity = Risk-free Rate + Beta × ERP')),
  li(t('WACC = Ke × E/(D+E) + Kd × (1-tax) × D/(D+E)')),
  h3('Step 5：计算Terminal Value'),
  li(t('永续增长法（Gordon Growth Model）：TV = UFCF_n × (1+g) / (WACC - g)，g通常2-3%')),
  li(t('退出倍数法（Exit Multiple）：TV = EBITDA_n × EV/EBITDA倍数（可比公司）')),
  li(t('两种方法都算，看敏感性是否合理')),
  h3('Step 6：计算企业价值 → 股权价值 → 股价'),
  li(t('Enterprise Value = PV of FCFs + PV of Terminal Value')),
  li(t('Equity Value = Enterprise Value - Net Debt（债务 - 现金）')),
  li(t('每股价值 = Equity Value / Fully Diluted Shares（考虑期权稀释）')),
  li(t('与当前股价比较：是否存在upside/downside？')),
  h3('Step 7：敏感性分析（Sensitivity Analysis）'),
  li(t('做2D Data Table：WACC vs Terminal Growth Rate → 得到价格区间')),
  li(t('做Scenario Analysis：Best Case / Base Case / Bear Case')),
  li(t('Tornado Chart：哪个假设对价值影响最大？')),
  hr(),
  h2('四、LBO建模核心要点'),
  h3('LBO基础概念'),
  li(t('LBO = 用大量债务（通常60-70%）收购一家公司，通过运营改善后卖出获利')),
  li(t('PE基金核心工具，Blackstone/KKR/Carlyle等做的就是LBO')),
  li(t('核心指标：IRR（内部收益率，>20%是好投资）和MoM（money-on-money，>2.5x是好投资）')),
  h3('LBO建模步骤简版'),
  li(t('Sources & Uses：收购资金从哪来（Debt + Equity）+ 用在哪（Purchase Price + Fees）')),
  li(t('Debt Schedule：Term Loan / Revolver / Senior Notes各自利率和还款安排')),
  li(t('Operating Model：EBITDA预测，关注自由现金流用来还债')),
  li(t('Exit Analysis：5年后以X倍EV/EBITDA退出，计算IRR和MoM')),
  li(t('Returns Sensitivity：IRR对Entry Multiple / Exit Multiple / Leverage的敏感度')),
  h3('推荐LBO学习资源'),
  li(t('BIWS LBO Modeling Tutorial（YouTube免费）：最清晰的LBO入门')),
  li(t('Macabacus LBO Template：免费下载，可以作为练习模板')),
  li(t('WSO LBO Modeling Course（付费，$150）：题库丰富，有参考答案')),
  hr(),
  h2('五、Excel效率工具（必学快捷键）'),
  h3('Windows Excel必备快捷键'),
  li(t('Ctrl+Shift+L：筛选/Filter')),
  li(t('Ctrl+T：将区域转为Table')),
  li(t('Alt+H+O+I：自动调整列宽')),
  li(t('F5 → Special → Formulas：选中所有公式单元格（检查硬编码）')),
  li(t('Ctrl+[：追踪公式引用（找到来源数据）')),
  li(t('Ctrl+Shift+1：数字格式（千分位）')),
  li(t('Ctrl+Shift+5：百分比格式')),
  h3('Mac Excel（部分不同）'),
  li(t('Cmd+Shift+L：筛选')),
  li(t('Cmd+1：格式化单元格')),
  li(t('Option+Enter：单元格内换行')),
  h3('高级功能（面试加分）'),
  li(t('INDEX MATCH：比VLOOKUP更强大，双向查找')),
  li(t('OFFSET + MATCH：动态引用，适合滚动预测')),
  li(t('Data Table（What-If Analysis）：自动化敏感性分析')),
  li(t('Power Query：数据清洗，自动化数据导入')),
];

// ============================================================
// 页面2：📉 Sales & Trading（S&T）职业路径全解
// ============================================================
const stCareerBlocks: any[] = [
  p(t('来源：Wall Street Oasis S&T论坛、eFinancialCareers、Vault Finance Career Guide、Bloomberg Markets、ex-trader LinkedIn文章，综合在职交易员和前交易员的第一手信息。', false, true)),
  hr(),
  h2('一、S&T vs IBD：根本区别'),
  h3('核心对比'),
  li(t('IBD（投资银行部门）：'), t('帮助公司融资/并购，费用收入，项目制', true)),
  li(t('S&T（销售与交易）：'), t('在市场中买卖证券，赚取买卖差价和客户佣金，实时交易', true)),
  h3('工作内容对比'),
  li(t('IBD的一天：'), t('建模/PPT/客户call/内部会议，9am-midnight', true)),
  li(t('S&T的一天：'), t('市场开盘前准备 → 高强度交易时段 → 收市后复盘，7am-6pm', true)),
  h3('技能需求对比'),
  li(t('IBD需要：Excel建模、演示技巧、行业知识、项目管理')),
  li(t('S&T需要：市场直觉、快速数字感、压力管理、产品知识（期权/固收/信用等）')),
  h3('薪资模式对比'),
  li(t('IBD：Base + Year-end Bonus（一年一次）')),
  li(t('S&T：Base + Performance Bonus（更直接与交易P&L挂钩）')),
  hr(),
  h2('二、S&T内部细分（产品线）'),
  h3('Equity（股票）'),
  li(t('Cash Equities：', true), t('最基础的股票买卖，客户驱动，利润率下降')),
  li(t('Equity Derivatives：', true), t('期权、结构性产品，技术含量高')),
  li(t('Delta One：', true), t('ETF/指数/互换，通常是quant-driven')),
  li(t('Prime Brokerage：', true), t('服务对冲基金，借券/融资，关系型业务')),
  h3('Fixed Income（固定收益）'),
  li(t('Rates（利率）：', true), t('国债/利率互换，宏观驱动，最大市场')),
  li(t('Credit（信用）：', true), t('公司债/CDS，分Investment Grade和High Yield')),
  li(t('Securitized Products：', true), t('MBS/ABS/CLO，复杂结构性产品')),
  li(t('Emerging Markets：', true), t('新兴市场债券/外汇，风险高但回报也高')),
  h3('FX & Commodities'),
  li(t('FX（外汇）：', true), t('日交易量$7.5万亿，最流动市场')),
  li(t('Commodities：', true), t('能源/金属/农产品，Goldman/Citi有强大desk')),
  hr(),
  h2('三、S&T招聘流程'),
  h3('申请时间线'),
  li(t('大三秋（9-10月）：Summer Analyst Application开放')),
  li(t('大三冬/春（1-3月）：Super Day（面试日）')),
  li(t('大三暑假（6-8月）：10周Summer Analyst Program')),
  li(t('大四（8-9月）：Full-time Offer/Exploding Offer')),
  h3('S&T面试内容（与IBD不同！）'),
  li(t('市场知识测试：今天股市涨跌？上周美联储决定？10年期国债目前利率？')),
  li(t('数学快速计算：如果期权Delta是0.6，股票涨$2，期权涨多少？')),
  li(t('产品知识：给我解释一下Interest Rate Swap的结构和用途')),
  li(t('Behavioral：你最近Follow的一个trade是什么？为什么看多/看空？')),
  li(t('Game/Simulation：有些银行用交易模拟游戏考察反应速度和市场直觉')),
  h3('S&T面试准备资源'),
  li(t('每天看Bloomberg Markets / FT Markets板块，了解当日市场动态')),
  li(t('Broken Quant（YouTube）：金融市场基础，适合准备S&T')),
  li(t('Options, Futures, and Other Derivatives（John Hull书）：衍生品圣经')),
  li(t('WSO S&T Prep Guide：具体到各产品线的面试题库')),
  hr(),
  h2('四、S&T薪资与职业路径'),
  h3('薪资数据（2024年，BB级别）'),
  li(t('1年级Analyst Base：$100,000-$115,000')),
  li(t('1年级Bonus（好年份）：$50,000-$100,000')),
  li(t('Senior Trader（MD级）：$500,000-$2,000,000+（直接与P&L挂钩）')),
  li(t('Quant Trader（顶级）：$1,000,000-$5,000,000+（Citadel/Two Sigma等）')),
  h3('职业晋升路径'),
  li(t('Analyst（2年）→ Associate（3年）→ VP（3年）→ ED/Director → MD/Partner')),
  li(t('关键节点：Associate → VP是第一个淘汰关卡，需要产生独立P&L')),
  li(t('MD级Trader：需要有"franchise"——一批稳定的机构客户或稳定的proprietary P&L')),
  h3('S&T出路'),
  li(t('对冲基金（最常见出路）：Fundamental HF / Macro HF / Multi-Strategy HF')),
  li(t('Prop Trading Firm：Jane Street / Citadel Securities / Virtu Financial')),
  li(t('Asset Management：从S&T转到Buy-side Portfolio Management')),
  li(t('FinTech：很多S&T出身的人进入金融科技，量化交易平台')),
  li(t('Corporate Treasury：大公司管理现金/FX risk')),
  hr(),
  h2('五、Prop Trading vs Bank S&T（关键区别）'),
  h3('Prop Trading Firm特点'),
  li(t('代表公司：Jane Street / Two Sigma Securities / Optiver / DRW / Susquehanna (SIG)')),
  li(t('用自己的资金交易，没有客户，纯算法或量化策略')),
  li(t('薪资远高于Bank：入门Base $200,000+，好年份Total Comp $500,000-$1,000,000+')),
  li(t('要求：通常需要顶级数学/CS背景（MIT/Stanford/CMU），高度selective')),
  li(t('面试：大量数学/概率题 + 交易游戏，极难')),
  h3('如何进入Prop Trading（非CS背景）'),
  li(t('Jane Street有专门的internship program，接受优秀的数学背景本科生')),
  li(t('SIG（Susquehanna）有structured interview prep program')),
  li(t('数学竞赛背景（AIME/AMC/Putnam）有很大优势')),
  li(t('编程：Python + C++，需要能写交易策略代码')),
];

// ============================================================
// 页面3：🏘️ 房地产金融（REPE/REIT）入行完整指南
// ============================================================
const realEstateBlocks: any[] = [
  p(t('来源：BIWS Real Estate Financial Modeling Course、Urban Land Institute (ULI) 职业报告、Wall Street Oasis Real Estate Forum、CBRE/JLL招聘信息、Nareit REIT行业报告，及ex-REPE professionals分享。', false, true)),
  hr(),
  h2('一、房地产金融行业概览'),
  h3('主要细分领域'),
  li(t('REPE（Real Estate Private Equity）：'), t('Blackstone BREIT / KKR Real Estate / Starwood Capital，收购/开发/增值', true)),
  li(t('REIT（Real Estate Investment Trust）：'), t('上市房地产公司，Equity Residential/Prologis/Simon Property', true)),
  li(t('Real Estate Investment Banking（REIB）：'), t('为地产公司提供融资/并购服务，是REPE的投行分支', true)),
  li(t('Real Estate Debt（Mortgage/CMBS）：'), t('商业地产贷款，发行抵押贷款证券', true)),
  li(t('Property Management / Development：'), t('运营和开发，更operational导向', true)),
  h3('地产金融 vs 传统金融的区别'),
  li(t('专业术语不同：NOI / Cap Rate / IRR / Waterfall / JV Structure')),
  li(t('资产类型：Office / Multifamily / Industrial / Retail / Hotel / Data Center')),
  li(t('地域性强：不同城市不同市场，地理知识很重要')),
  li(t('人脉驱动：地产行业极度依赖关系，Broker/Developer/Investor之间紧密')),
  hr(),
  h2('二、关键地产金融概念（面试必知）'),
  h3('最核心指标'),
  li(t('NOI（Net Operating Income）：', true), t('= 租金收入 - 运营费用（不含折旧和融资）')),
  li(t('Cap Rate（资本化率）：', true), t('= NOI / Property Value，越低说明市场对资产价格越高')),
  li(t('Cash-on-Cash Return：', true), t('= Annual Cash Flow / Equity Invested，衡量现金回报率')),
  li(t('IRR（Internal Rate of Return）：', true), t('全周期内部收益率，REPE目标通常15-20%+')),
  li(t('Equity Multiple（MoM）：', true), t('= Total Equity Returned / Total Equity Invested，2x-3x是好投资')),
  h3('REPE特有概念'),
  li(t('Waterfall Structure：分配利润的顺序——Preferred Return → Return of Capital → Carry')),
  li(t('Preferred Return（Hurdle Rate）：通常8%，LP先拿到这个回报率才轮到GP')),
  li(t('Promoted Interest / Carried Interest：GP超过hurdle后的超额分成，通常20-30%')),
  li(t('Value-Add Strategy：', true), t('收购老旧资产 → 翻新/重新定位 → 提高租金 → 增值卖出')),
  li(t('Core vs Core+ vs Value-Add vs Opportunistic：', true), t('从低风险低回报到高风险高回报的策略分类')),
  hr(),
  h2('三、REPE职业路径'),
  h3('入行路径'),
  li(t('路径1（最优）：Real Estate IB分析师2年 → REPE Associate')),
  li(t('路径2：传统IB（M&A/LevFin）2年 → REPE（需要自学地产建模）')),
  li(t('路径3：大型REIT（Blackstone/Prologis）分析师项目 → 直接入行')),
  li(t('路径4：Big 4地产咨询（KPMG/PwC Real Estate Advisory）→ REPE')),
  h3('顶级REPE公司'),
  li(t('Blackstone Real Estate：', true), t('全球最大REPE，$330B+ AUM，极难进，顶薪')),
  li(t('Starwood Capital：', true), t('Hotel/Distressed专注，全球化运营')),
  li(t('KKR Real Estate：', true), t('大型多元化REPE，信贷+权益')),
  li(t('Brookfield Asset Management：', true), t('全球规模第二，多元化地产+基建')),
  li(t('Ares Real Estate：', true), t('信贷导向，近年扩张很快')),
  h3('REPE薪资（2024年）'),
  li(t('Analyst（Entry Level）：$90,000-$130,000 base + $30,000-$70,000 bonus')),
  li(t('Associate（Post-MBA/2年IB）：$160,000-$220,000 base + $80,000-$150,000 bonus')),
  li(t('VP：$250,000-$400,000 total comp')),
  li(t('MD/Partner：$500,000-$2,000,000+（含carried interest）')),
  hr(),
  h2('四、REPE面试准备'),
  h3('技术题（与传统PE不同）'),
  li(t('能否建一个简单的Multifamily Acquisition Model？（NOI → Valuation → Returns）')),
  li(t('如果Cap Rate从5%扩大到6%，对资产价值有什么影响？（向下压）')),
  li(t('解释一个Waterfall Structure，LP先拿8%回报，GP拿20% carry')),
  li(t('你认为当前写字楼市场面临的最大挑战是什么？（hybrid work影响等）')),
  h3('Real Estate Financial Model（REPE面试核心）'),
  li(t('建模流程：收购价格假设 → Financing Structure → NOI Projections → Exit Valuation → Returns')),
  li(t('BIWS Real Estate Modeling Course（付费$397）：最好的地产建模系统培训')),
  li(t('免费资源：REFM（Real Estate Financial Modeling）有免费基础教程')),
  li(t('练习案例：从网上找真实地产投资Offering Memorandum（OM），自己做Underwriting')),
  h3('宏观/市场判断题'),
  li(t('你最看好哪个资产类别？（Industrial/Data Center是2024热门答案）')),
  li(t('你如何看待利率上升对REPE策略的影响？')),
  li(t('Sun Belt城市vs. Gateway城市（纽约/SF）的投资逻辑差异？')),
  li(t('Work From Home对办公室市场的长期影响？（必考，要有数据支撑）')),
];

// ============================================================
// 页面4：🎯 网申测试攻略（HireVue/Amazon OA/McKinsey Game）
// ============================================================
const onlineAssessmentBlocks: any[] = [
  p(t('来源：Reddit r/cscareerquestions、r/MBA真实应试记录，Glassdoor Interview Reviews（数千条），Reddit r/FinancialCareers分享，成功候选人总结，2024年最新版本信息。', false, true)),
  hr(),
  h2('一、Goldman Sachs HireVue（单向视频面试）'),
  h3('格式说明'),
  li(t('格式：HireVue录制平台，单向视频，没有真人互动')),
  li(t('题目数量：通常5道题（4道behavioral + 1道technical）')),
  li(t('准备时间：每题30秒思考')),
  li(t('回答时间：通常2-3分钟/题')),
  li(t('重录机会：通常给1-2次重录机会')),
  h3('高频出现的题目（Glassdoor汇总）'),
  li(t('Why Goldman Sachs? Why this division specifically?')),
  li(t('Tell me about a time you demonstrated leadership.')),
  li(t('Describe a time you worked under pressure and how you handled it.')),
  li(t('What makes you stand out from other candidates?')),
  li(t('Technical（IBD）: Walk me through a DCF / How do you value a company? / EV vs Equity Value差异')),
  li(t('Technical（S&T）: What happened in markets last week? / Pitch me a trade.')),
  li(t('Technical（AM）: Pitch me a stock / What sectors are you watching?')),
  h3('准备策略'),
  li(t('准备阶段：提前用手机/镜子练习2分钟以内的structured回答')),
  li(t('关键词策略：在回答中融入Goldman相关词汇（divisional keywords会被AI扫描）')),
  li(t('研究分工：提前读Goldman 10-K + 最新季报，找具体数据和strategic initiatives')),
  li(t('Why GS必须具体：不要说"largest investment bank"，要说具体产品/团队/近期deal')),
  li(t('背景布置：干净背景、好光线、正装（至少上半身）、看镜头不看屏幕')),
  h3('HireVue AI评分机制（已知信息）'),
  li(t('分析：语音清晰度、眼神接触（看镜头）、情绪表达、关键词密度')),
  li(t('避免：过多"um/uh"、低头看笔记、语速过快过慢')),
  li(t('建议：背STAR框架答案，但用自然语言表达，不要背稿朗读')),
  hr(),
  h2('二、Amazon Online Assessment（OA）'),
  h3('OA组成（因岗位不同略有差异）'),
  li(t('Work Style Assessment（工作风格测评）：', true), t('38道1-5量表题，测试你与Amazon LP的match程度')),
  li(t('Work Simulation（工作情景模拟）：', true), t('50分钟，模拟真实工作情景的决策题')),
  li(t('Coding Assessment（SDE岗位）：', true), t('2道LeetCode风格题，90分钟')),
  li(t('Reasoning Assessment（操作类岗位）：', true), t('数字推理 + 逻辑推理')),
  h3('Work Style Assessment攻略（最重要）'),
  p(t('核心策略：这份测评没有"正确答案"，但有"Amazon倾向的答案"。答案要与Amazon的16个LP高度一致。')),
  li(t('倾向高分的方向：Customer Obsession > 内部指标；主动承担责任 > 等待指示；快速行动 > 分析瘫痪')),
  li(t('对于"我更喜欢独立工作"：', true), t('倾向于选collaborative（但保持individual accountability）')),
  li(t('对于"遵守规则 vs 挑战流程"：', true), t('倾向于尊重规则+主动提改进（而非直接挑战）')),
  li(t('一致性原则：38题全程保持一致性，不能自相矛盾')),
  li(t('避免全选中性（3分）：', t('会被认为没有明确立场', true))),
  h3('Work Simulation攻略'),
  li(t('模拟情景：处理邮件/优先级排序/团队冲突/客户问题')),
  li(t('核心框架：永远先考虑Customer Impact → 然后是Team/Process')),
  li(t('时间分配：50分钟内完成，大约每题2-3分钟')),
  li(t('不要过度分析：Bias for Action是Amazon LP之一，快速决策')),
  h3('Coding OA攻略（SDE岗位）'),
  li(t('通常两道题：1道Easy-Medium + 1道Medium')),
  li(t('90分钟，可以用任何语言（Python/Java/C++/JavaScript）')),
  li(t('Amazon喜欢的题型：Arrays / Strings / HashMaps / Dynamic Programming / Graphs')),
  li(t('工具：LeetCode Amazon题单（过滤Amazon标签），重点刷Medium难度')),
  li(t('除代码外：注意代码可读性和注释，有时候会被人工review')),
  hr(),
  h2('三、McKinsey Problem Solving Game（Imbellus）'),
  h3('游戏概述'),
  li(t('正式名称：Solve（McKinsey Problem Solving Game）')),
  li(t('平台：Imbellus，浏览器运行，约70分钟')),
  li(t('形式：两个生态系统游戏场景，不是传统数学/逻辑题')),
  li(t('测评内容：系统性思维 / 数据整合能力 / 学习速度 / 决策质量')),
  h3('游戏场景说明'),
  li(t('场景1：鸟类生态系统（Island Ecosystem）', true)),
  p(t('任务：分析生态系统中各物种之间的关系，将一种新物种引入岛屿后，预测生态系统的变化。需要观察数据、建立假设、测试并做决策。')),
  li(t('场景2：疾病或灾难管理情景', true)),
  p(t('任务：在资源限制下，做出最优的干预决策（如：疫情中分配医疗资源）。涉及多变量权衡和不确定性下的决策。')),
  h3('准备策略（不能"背题"，但可以训练思维）'),
  li(t('核心能力训练：系统思维（System Dynamics）—— 了解变量如何相互影响')),
  li(t('推荐资源：Thinking in Systems（Donella Meadows书）—— 系统思维入门')),
  li(t('数据可视化练习：Tableau Public课程 / D3.js（提升数据整合能力）')),
  li(t('模拟练习：Imbellus官网有示例游戏，务必先熟悉界面')),
  li(t('时间管理：70分钟要完成两个场景，每个约35分钟，速度要快')),
  li(t('不要过度思考：McKinsey看的是思维过程，不是完美答案')),
  h3('常见失败原因'),
  li(t('被游戏界面吓到，没有system thinking思路')),
  li(t('时间管理失败，第一个游戏花太多时间')),
  li(t('忽视数据，凭直觉做决策（这正是测试要避免的）')),
  li(t('不理解游戏规则就开始操作（一定要先看tutorial）')),
  hr(),
  h2('四、BCG Casey / Chatham Case（Pymetrics替代品）'),
  h3('BCG Casey Chat（AI对话案例）'),
  li(t('形式：与AI聊天机器人进行真实case，提问/分析/推荐')),
  li(t('时间：约25-35分钟')),
  li(t('评判：结构化思维、hypothesis-driven approach、量化分析')),
  li(t('准备：练习向AI提问的能力，模拟case interview但以文字形式')),
  h3('Pymetrics（被多家公司使用）'),
  li(t('形式：12个神经科学小游戏，测试cognitive/emotional traits')),
  li(t('无法"作弊"：测的是真实特质，建议在状态好时完成')),
  li(t('重要：在安静、专注的环境下完成，不能中断')),
  li(t('使用公司：Unilever / Accenture / LinkedIn / McDonald\'s等')),
  hr(),
  h2('五、网申测试的通用策略'),
  h3('环境与时机'),
  li(t('选择最佳状态时段（通常上午10点-下午2点精力最好）')),
  li(t('使用有线网络连接（防止断线）')),
  li(t('清理浏览器缓存，关闭其他程序（保证运行流畅）')),
  li(t('准备好草稿纸和计算器（数字题用）')),
  h3('常见错误避免'),
  li(t('Work Style Assessment：不要来回修改答案，保持第一直觉')),
  li(t('Coding OA：先读懂题目再写代码，不要盲目coding')),
  li(t('Video Interview：测试设备后才开始录制，避免技术问题浪费机会')),
  li(t('时间压力：每道题都设好时间，不要在一道题上卡太久')),
];

// ============================================================
// 页面5：🔗 LinkedIn优化+英语表达提升（中国学生专版）
// ============================================================
const linkedinEnglishBlocks: any[] = [
  p(t('来源：LinkedIn官方算法研究（2024）、Jobscan.co优化工具、Reddit r/jobs优化建议、ESL资源（Coursera/YouTube）、美国职场英语教练建议，结合中国学生常见问题整理。', false, true)),
  hr(),
  h2('一、LinkedIn Profile优化完整指南（2024算法）'),
  h3('LinkedIn算法核心逻辑'),
  li(t('LinkedIn的搜索算法偏向：Keywords密度 + Connections in network + Profile Completeness')),
  li(t('All-Star Profile：填写全7个关键模块才达到最高曝光率')),
  li(t('Recruiter视角：他们用Boolean Search（关键词组合），你的Profile必须有对的词')),
  h3('Headline优化（最重要的一行）'),
  li(t('不要用：', t('"Student at [University]"或"Looking for Opportunities"——最差的Headline', true))),
  li(t('应该用：具体技能+目标职位+核心优势')),
  p(t('好的Headline例子：')),
  li(t('"MBA Candidate @ Wharton | Ex-Goldman Sachs IB | Seeking PE/HF Roles"')),
  li(t('"Finance Major @ Columbia | Investment Banking Analyst Intern @JPMorgan | CFA L1 Candidate"')),
  li(t('"Data Science MS @ CMU | Python/SQL/ML | Seeking PM/DS Roles at Tech Companies"')),
  h3('About Section（摘要）优化'),
  li(t('长度：3-5段，共150-300字，开门见山')),
  li(t('结构：Who you are → Key experience → Specific skills → What you are looking for')),
  li(t('关键词：把目标职位的关键词自然融入（Recruiter用这些词搜索）')),
  li(t('Call to Action：结尾写"Open to [roles] in [cities/industries]. Feel free to connect!"')),
  h3('Experience Section（经历）优化'),
  li(t('每条经历写2-4个bullet points')),
  li(t('必须量化：数字化结果（grew revenue by 15% / analyzed $50M portfolio / reduced costs by $200K）')),
  li(t('Action verbs（动作词）开头：Developed / Designed / Led / Analyzed / Implemented / Streamlined')),
  li(t('避免：Responsible for / Assisted with（被动且弱）')),
  li(t('关键词嵌入：每段经历中自然包含行业关键词（DCF / Bloomberg / Python / GAAP等）')),
  h3('Skills Section优化'),
  li(t('添加至少50个技能（覆盖面越广，在更多搜索中出现）')),
  li(t('金融类关键词：Financial Modeling / Valuation / Bloomberg / Excel / PowerPoint / SQL')),
  li(t('咨询类关键词：Strategy Consulting / Data Analysis / Stakeholder Management / PowerBI')),
  li(t('科技类关键词：Python / SQL / Product Management / A/B Testing / Agile')),
  li(t('让同学/朋友互相Endorse技能（提升技能的credibility权重）')),
  h3('Network构建策略'),
  li(t('First 500 connections是关键里程碑（显示500+，增加可信度）')),
  li(t('每天发5-10个Connection Request（校友优先，成功率更高）')),
  li(t('个性化邀请信：不要用默认文字，写一句有个性的reason')),
  li(t('LinkedIn Premium学生版：$30/月，可以看谁看了你的Profile，可以发InMail')),
  hr(),
  h2('二、LinkedIn活跃策略（让Recruiter主动找你）'),
  h3('内容创作（极高ROI）'),
  li(t('发帖频率：每周1-2篇，坚持3个月，visibility大幅提升')),
  li(t('内容方向：你的求职经历/面试心得/行业观察/学习笔记')),
  li(t('格式：短段落（3-5行一段），多用bullet points，加hashtag（#investmentbanking #finance）')),
  li(t('真实性：分享你真实的经历和思考，比转发别人的内容效果好10倍')),
  h3('互动策略'),
  li(t('评论目标公司/Recruiter的帖子（让他们看到你的名字）')),
  li(t('给行业大V点赞+留有质量的评论（别只说"Great post!"）')),
  li(t('参与行业discussion：用专业见解证明你的价值')),
  h3('Open to Work设置的讲究'),
  li(t('不要公开显示绿色"Open to Work"框（看起来desperate）')),
  li(t('在设置中选择"Share with Recruiters Only"（仍然被猎头看到，但对其他人不显示）')),
  li(t('Job Preferences要填写具体：job titles / locations / job type')),
  hr(),
  h2('三、面试英语表达提升（中国学生专项）'),
  h3('最常见的中国学生英语问题'),
  li(t('问题1：句子结构过于复杂（把中文复杂句直接翻译成英文）')),
  li(t('问题2：过度使用"um/ah/like"（填充词过多）')),
  li(t('问题3：声音过小，语气不够confident')),
  li(t('问题4：重音/语调不自然（单调语调）')),
  li(t('问题5：专业词汇能说，日常idiom不熟（显得过于formal）')),
  h3('快速提升英语的具体方法'),
  p(t('方法1：Shadowing（跟读练习）')),
  li(t('选择TED Talks或NPR Podcast，听一句、暂停、模仿跟读')),
  li(t('重点模仿：语调、停顿、重音、语速')),
  li(t('推荐资源：TED.com（有字幕）/ BBC Learning English / NPR Planet Money')),
  p(t('方法2：录音自我反馈')),
  li(t('用手机录下自己回答面试问题的视频，回放观看')),
  li(t('关注：语速是否合适？有没有填充词？眼神是否在看镜头？')),
  li(t('每次录完对比上一次，追踪进步')),
  p(t('方法3：Language Exchange')),
  li(t('找美国同学做language exchange（你教中文，他们帮你练英文）')),
  li(t('平台：Tandem App / HelloTalk / Meetup（本地语言交流活动）')),
  p(t('方法4：行业词汇刻意练习')),
  li(t('每周学5个金融行业英语表达，配例句')),
  li(t('用Anki制作闪卡（flashcard），每天复习')),
  li(t('推荐YouTube：Bilingua / Speak English With Vanessa（专业场景英语）')),
  h3('面试表达模板（直接套用）'),
  p(t('自我介绍开场白（30秒版）：')),
  li(t('"I\'m [Name], currently a [year] student at [School] studying [Major]. I\'m originally from [City, China] and came to the US in [year] to pursue [goal]. My background is in [key experience], and I\'m particularly interested in [specific area] because [concise reason]."')),
  p(t('不确定时的过渡句（避免尴尬沉默）：')),
  li(t('"That\'s a great question. Let me take a moment to think through this."')),
  li(t('"I want to make sure I give you the most relevant example, so..."')),
  li(t('"If I understand your question correctly, you\'re asking about..."')),
  p(t('结束面试时主动提问（必须问！）：')),
  li(t('"What does success look like in the first 90 days for someone in this role?"')),
  li(t('"What\'s the most exciting project your team is currently working on?"')),
  li(t('"What do you personally enjoy most about working here?"')),
  hr(),
  h2('四、中文口音的正确心态'),
  li(t('现实：美国职场有accent bias，但这主要影响clarity，不影响content')),
  li(t('重点：可理解性（intelligibility）> 完美发音（native accent）')),
  li(t('研究显示：结构清晰、有逻辑的回答比"perfect accent"更受面试官好评')),
  li(t('最有效的训练：慢下来说话 + 清晰发音每个词 + 适当停顿')),
  li(t('不要为accent道歉：自信地表达，面试官反而会更尊重你')),
  li(t('成功案例：无数口音很重的人在Goldman/McKinsey/Google工作，accent不是障碍')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第七批）...\n');
  await createPage('📈 Financial Modeling自学完整指南（DCF/LBO/YouTube资源库）', financialModelingBlocks);
  await createPage('📉 Sales & Trading（S&T）职业路径全解', stCareerBlocks);
  await createPage('🏘️ 房地产金融（REPE/REIT）入行完整指南', realEstateBlocks);
  await createPage('🎯 网申测试攻略（HireVue/Amazon OA/McKinsey Game）', onlineAssessmentBlocks);
  await createPage('🔗 LinkedIn优化+面试英语提升（中国学生专版）', linkedinEnglishBlocks);
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/Adh3w4XwCiMs2zkApVhcFdT0nFf`);
}

main().catch(console.error);
