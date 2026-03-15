/**
 * 美国商科求职知识库 - 深度内容补充（第三批）
 * PE面试 / Quant面试 / 学校Target分析 / MBA申请指南
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
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function t(content: string, style?: any) { return { text_run: { content, text_element_style: style ?? {} } }; }
function b(content: string) { return t(content, { bold: true }); }
function p(...elements: any[]) { return { block_type: 2, text: { elements, style: {} } }; }
function h2(text: string) { return { block_type: 4, heading2: { elements: [t(text)], style: {} } }; }
function h3(text: string) { return { block_type: 5, heading3: { elements: [t(text)], style: {} } }; }
function li(...elements: any[]) { return { block_type: 12, bullet: { elements, style: {} } }; }
function ol(...elements: any[]) { return { block_type: 13, ordered: { elements, style: {} } }; }
function hr() { return { block_type: 22, divider: {} }; }
function quote(...elements: any[]) { return { block_type: 15, quote: { elements, style: {} } }; }

async function writeBlocks(objToken: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: blocks.slice(i, i + 50), index: i }
    );
    if (r.code !== 0) console.error(`  ❌ blocks失败 (${i}): code=${r.code} msg=${r.msg}`);
    else console.log(`  ✓ 写入 blocks ${i}-${Math.min(i + 50, blocks.length)}`);
    if (i + 50 < blocks.length) await sleep(400);
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

// ─── 页面1：私募股权（PE）面试完整攻略 ──────────────────────────
const PE_BLOCKS = [
  p(t('PE（Private Equity 私募股权）是投行分析师最主要的出口之一。通常在 IB 做 2-3 年后跳 PE，也有少数 MBB 咨询直接进 PE。')),
  p(t('PE 面试比投行更难，因为它同时测试：金融建模能力 + 投资判断力 + 行业深度 + 文化契合度。')),
  hr(),

  h2('一、PE 招聘分类'),

  h3('On-Cycle 招聘（最主流）'),
  li(b('时间'), t('：每年 8-10 月（分析师入职仅半年就开始！），速度极快')),
  li(b('特点'), t('：几乎所有 MF（Mega Fund）和主流 MM PE 同时招，"爆炸式 offer"只给几小时决定')),
  li(b('节奏'), t('：周一发出面试邀请，周三 Superday，周四拿 offer')),
  li(b('竞争'), t('：全美顶级 IB 分析师都在参与，竞争极为激烈')),

  h3('Off-Cycle 招聘'),
  li(b('时间'), t('：全年滚动，主要集中在 1-3 月（1 年后）和 6-8 月')),
  li(b('适合'), t('：错过 on-cycle 的人、从 non-target 背景进 PE 的人、从咨询转 PE 的人')),
  li(b('节奏'), t('：通常 2-4 周流程，相对不那么极端')),

  h3('主要 PE 类型'),
  li(b('Mega Fund（MF）'), t('：Blackstone / KKR / Apollo / Carlyle / Warburg Pincus / TPG — 管理资产 $50B+，招聘最难')),
  li(b('Upper Middle Market（UMM）'), t('：Bain Capital / General Atlantic / Silver Lake / CVC — 管理资产 $5-50B')),
  li(b('Middle Market（MM）'), t('：Vista Equity / Thoma Bravo / Francisco Partners — 规模适中，文化各异')),
  li(b('Growth Equity'), t('：General Atlantic / Insight Partners / Sequoia Growth — 投 Later-stage startup')),
  hr(),

  h2('二、PE 面试全流程'),

  h3('第一关：筛选（Paper LBO + 简单技术题）'),
  p(t('On-cycle 速度极快，第一轮通常是15分钟电话 + Paper LBO（纸笔不用电脑）。')),
  li(b('Paper LBO 要求'), t('：5-10 分钟内算出 IRR 和 MOIC，不能用计算器')),
  li(b('关键公式'), t('：IRR ≈ (Exit Equity / Entry Equity)^(1/n) - 1；或用 Rule of 72（双倍回报 ≈ 72/IRR年数）')),
  quote(b('Paper LBO 5步法：'), t('1. 确认 Entry Price（EBITDA × Multiple = EV；EV - Debt = Equity）→ 2. 建立 5年 EBITDA 预测 → 3. 算 Levered FCF = EBITDA - Interest - Tax - CapEx ± WC Change → 4. 计算 Debt Paydown → 5. Exit（EV = EBITDA × Exit Multiple；Exit Equity = EV - Remaining Debt）→ IRR/MOIC')),

  h3('第二关：正式技术面试（LBO Modeling Test）'),
  li(b('类型1：基础 LBO（45-60分钟）'), t('：给 Excel 模板，填充 Sources & Uses、3-statement、Returns分析')),
  li(b('类型2：标准 LBO（90分钟）'), t('：有时从零开始，有时给部分模板；需要计算 IRR / MOIC 和多种情景')),
  li(b('类型3：Take-Home Case（24-72小时）'), t('：给一个真实公司（或 CIM），自建模型 + 写投资建议书')),
  li(b('评分标准'), t('：结构正确性（Sources & Uses 平衡）> 速度 > 现金流机制（Debt 还款）> 结果解读')),
  quote(b('注意：'), t('LBO model 不做好 = 直接淘汰。即使 Behavioral 表现完美，建模测试失败也会被拒。顶级候选人会练习 50+ 个 LBO model 直到可以在 60 分钟内从零完成。')),

  h3('第三关：投资判断（Deal Discussion + Investment Thesis）'),
  li(b('"Walk me through a deal you worked on"'), t('：IBD 分析师必须准备 2-3 个真实 deal 的完整 Investment Memo 思路')),
  li(b('"What makes a good LBO candidate?"'), t('：预测现金流稳定 + 强市场地位 + 管理层激励对齐 + 去杠杆能力')),
  li(b('"If you had $100M to invest, where would you put it?"'), t('：展示你独立的投资判断力，有理有据')),
  li(b('"What industry do you want to cover?"'), t('：要有深度：准备 1-2 个行业的 deep-dive（竞争格局/增长驱动/典型交易）')),

  h3('第四关：Behavioral / Cultural Fit'),
  li(b('"Why PE? Why not stay in banking?"'), t('：必须回答"想要从事投资决策，而不仅是交易执行"；展示对 ownership 和 long-term value creation 的热情')),
  li(b('"Tell me about a time you pushed back on your team"'), t('：展示独立判断力 + 专业自信')),
  li(b('"What\'s a deal you would have passed on?"'), t('：展示批判性思维；不要只说完成的交易都好')),
  hr(),

  h2('三、LBO 核心概念'),

  h3('为什么用杠杆'),
  li(b('财务杠杆效应'), t('：同样的 equity 回报，用债务后 IRR 更高（因为 equity = 总价 - 债务）')),
  li(b('税盾'), t('：利息支出可以抵税，降低有效融资成本')),
  li(b('管理层激励'), t('：管理层持有一定比例 equity，与 PE 利益对齐，提高运营效率')),

  h3('IRR 驱动因素'),
  li(b('EBITDA 增长'), t('：改善运营，提高盈利能力 → Exit EV 更高')),
  li(b('Multiple Expansion'), t('：买低卖高（Entry 8x，Exit 10x）→ 价差直接增厚回报')),
  li(b('Debt Paydown'), t('：用经营现金流还债 → Exit Equity = EV - 更少的债务 = 更多回报')),
  li(b('Dividends/Recapitalization'), t('：在持有期间发股息提前分配回报')),

  h3('典型 LBO 回报目标'),
  li(b('最低可接受回报'), t('：IRR 20%+ / MOIC 2x+（5年）')),
  li(b('优秀交易'), t('：IRR 25-30% / MOIC 3-4x')),
  li(b('顶级交易'), t('：IRR 30%+ / MOIC 5x+（罕见）')),
  hr(),

  h2('四、PE 面试备考资源'),
  li(b('建模课程'), t('：Wall Street Prep / Breaking Into Wall Street / Financial Edge — 都提供 LBO 模型课程')),
  li(b('书籍'), t('：《Investment Banking》(Rosenbaum & Pearl) — 技术知识圣经')),
  li(b('在线资源'), t('：Mergers & Inquisitions / Wall Street Oasis — 有大量真实 PE 面试经历分享')),
  li(b('案例练习'), t('：自选上市公司，下载财报，做简化 LBO model — 每周至少 1 个')),
  quote(b('来自前 Apax/JP Morgan 教练建议：'), t('在面试前做至少 20 个完整 LBO model，其中包括 5 个以上从零开始（blank Excel）。熟练程度 > 知道理论。')),
];

// ─── 页面2：Quant / 量化金融面试全攻略 ──────────────────────────
const QUANT_BLOCKS = [
  p(t('Quant（Quantitative Finance）是薪资最高的金融方向，应届 Quant Researcher 全包可达 $200,000+，4年后可能超过 $1,000,000。但门槛极高，主要招 STEM PhD 或顶校数学/CS/统计 本硕生。')),
  hr(),

  h2('一、Quant 行业分类'),

  h3('主要雇主'),
  li(b('Citadel'), t('：全球最大对冲基金之一，薪资天花板，录取率极低')),
  li(b('Two Sigma'), t('：科技文化浓厚，机器学习驱动')),
  li(b('D.E. Shaw'), t('：以招聘"天才"著称，面试极难，薪资顶级')),
  li(b('Jane Street'), t('：以 Options/Market Making 见长，Culture 独特')),
  li(b('Hudson River Trading / Virtu'), t('：高频交易（HFT）为主')),
  li(b('Optiver / IMC'), t('：荷兰系 Market Maker，Amsterdam 总部')),
  li(b('Renaissance Technologies'), t('："神话级"量化基金，几乎不公开招聘')),

  h3('职位类型'),
  li(b('Quant Researcher（QR）'), t('：开发和优化交易信号（Alpha）；重数学/统计/ML')),
  li(b('Quant Trader'), t('：执行交易策略，需要快速决策和市场感知')),
  li(b('Quant Developer（QD）/ Software Engineer'), t('：实现交易系统；C++/Python 高手')),
  li(b('Quant Risk'), t('：衡量投资组合风险；相对入门级别较低')),
  hr(),

  h2('二、技术面试内容'),

  h3('概率与统计（最高频）'),
  li(b('骰子/硬币类题'), t('：期望值计算、条件概率、贝叶斯定理')),
  li(b('随机游走'), t('：对称随机游走、到达时间、反射原理')),
  li(b('经典题型'), t('：「掷骰子直到出现第一个 H，得到 k 个球，放入 3 个桶——求每个桶非空的概率」')),
  li(b('期望值博弈'), t('：「你愿意做 A 还是 B？A先选数字，B后选，骰子接近谁的数字谁赢相应金额」')),

  h3('概率题实例'),
  li(b('题1'), t('：公平硬币，掷到第一个正面需要几次？（期望 = 2）')),
  li(b('题2'), t('：3个公平骰子，最大值的期望值是多少？（约 4.96）')),
  li(b('题3'), t('：100 个人，每人各自随机取一顶帽子，期望多少人取到自己的帽子？（1）')),
  li(b('题4'), t('：蒙提霍尔问题（换门还是不换？换！概率 2/3）')),
  li(b('题5'), t('：两个信封问题（一个是另一个2倍，看到金额后是否换？这道题有争议）')),

  h3('市场/金融知识'),
  li(b('期权 Greeks'), t('：Delta（价格变化）/ Gamma（Delta 变化率）/ Theta（时间衰减）/ Vega（波动率影响）')),
  li(b('Put-Call Parity'), t('：C - P = S - PV(K)；推导：若不满足则存在套利机会')),
  li(b('Black-Scholes 直觉'), t('：不需要推导完整公式，但要知道哪些参数影响期权价格及方向')),
  li(b('Market Making 基础'), t('：Bid-Ask Spread / Adverse Selection / Inventory Risk')),

  h3('编程（Quant Developer / SDE 类）'),
  li(b('C++ 深度'), t('：内存管理、模板、STL、多线程（Citadel/HRT 必考）')),
  li(b('Python'), t('：NumPy / Pandas / Statistical modeling（Two Sigma / D.E. Shaw）')),
  li(b('算法'), t('：LeetCode Hard 级别；动态规划、图算法、位运算')),
  li(b('系统设计'), t('：低延迟交易系统架构（顶级 HFT 必考）')),
  hr(),

  h2('三、面试流程（以 Citadel 为例）'),
  ol(t('Online Assessment（OA）：HackerRank 算法题 + 概率题（1-2小时）')),
  ol(t('Phone Screen（45-60分钟）：技术题 + 概率题 + Behavioral')),
  ol(t('Superday（1天）：5-8 轮连续面试，涵盖概率/统计/金融/编程/Behavioral')),
  ol(t('Research Challenge（QR 专属）：给数据集，分析并展示交易信号')),
  quote(b('Citadel 面试特点：'), t('极难，面试官会故意挑战和 stress test。在给出答案后，面试官可能说"这是错的，再想想"——即使你的答案是对的，他也可能这样说。保持冷静，坚持你的推导过程。')),
  hr(),

  h2('四、Quant 入门路径'),

  h3('背景要求'),
  li(b('最理想'), t('：Top PhD in Math/CS/Statistics/Physics；或者名校（MIT/Stanford/CMU/Princeton）本硕')),
  li(b('本科'), t('：数学/统计/CS/工程，GPA 3.8+，有竞赛背景（IMO/Putnam/ICPC）')),
  li(b('非 STEM'), t('：几乎不可能进顶级 Quant Fund；可以考虑 Quant Risk 或四大的 Risk Advisory 作为过渡')),

  h3('提升竞争力的方法'),
  li(b('参加数学竞赛'), t('：Putnam（美国大学数学竞赛）得奖是极大加分')),
  li(b('机器学习项目'), t('：在 Kaggle 竞赛中取得好成绩，展示数据分析能力')),
  li(b('自建交易策略'), t('：用 Python 做回测，展示对市场的理解')),
  li(b('实习'), t('：Citadel / Two Sigma / Jane Street 的 Summer Intern，几乎都是直接 Return Offer 通道')),

  h3('备考资源'),
  li(b('书籍'), t('：《A Practical Guide To Quantitative Finance Interviews》（"绿皮书"）— 最重要')),
  li(b('书籍'), t('：《Heard on the Street》— 经典 Quant 面试题库')),
  li(b('平台'), t('：coachquant.com / myntbit.com — 500+ 真实面试题')),
  li(b('概率准备'), t('：《50 Challenging Problems in Probability》/ 《Introduction to Probability》(Blitzstein)）')),
  quote(b('Jane Street 文化：'), t('Jane Street 以 Trading 和 Poker 文化出名。他们看重"Think clearly under uncertainty"——在不完整信息下快速估算和做决策的能力。面试会有真实交易模拟练习。')),
];

// ─── 页面3：Target / Semi-target 学校分析 ──────────────────────
const SCHOOL_BLOCKS = [
  p(t('在美国，你上哪所学校，直接决定了你进入顶级投行/咨询/PE 的难易程度。这是残酷但真实的事实。本页基于 15 年 LinkedIn 数据分析。')),
  hr(),

  h2('一、投行学校层级（IB Target School）'),

  h3('Tier 1 Ultra-Target（超级目标校）'),
  li(b('Wharton（UPenn）'), t('：无可争议的第一。历史上送出最多 IB 分析师，几乎所有顶级银行都有强力 Alumni 网络')),
  li(b('Harvard'), t('：名气第一，但 Finance 学生比例低于 Wharton；强调全面性而非 Finance 专精')),
  li(b('Princeton'), t('：少量但极高质量的 Finance 出路；Alumni 在 Buy-side 影响力巨大')),
  li(b('Yale'), t('：类似 Princeton，Finance 学生少但质量高')),
  li(b('Columbia'), t('：纽约地理优势极大；直接与 Wall Street 接壤，送出大量 IB 分析师')),

  h3('Tier 1.5 顶级目标校'),
  li(b('UPenn（非 Wharton）'), t('：借助 UPenn 品牌和 Wharton 丰富的校友网络')),
  li(b('NYU Stern'), t('：纽约最强公立大学商学院；IB 总量仅次于 Wharton，但人均比例不及')),
  li(b('MIT'), t('：科技/Quant 出路极强，IB 兴趣比例不如 Wharton 但质量顶尖')),
  li(b('Stanford'), t('：硅谷出口更强；IB 出路略弱，但 PE/VC 极好')),
  li(b('UChicago'), t('：Booth 商学院和 UChicago 品牌；Buy-side 极强')),
  li(b('Duke'), t('：稳定的 Top IB 目标校，Fuqua MBA 极强')),

  h3('Tier 2 高目标校'),
  li(b('Cornell'), t('：Dyson/AEM 项目是强力金融出路；但学生多竞争激烈')),
  li(b('Georgetown McDonough'), t('：DC 地理优势；政府/金融监管领域极强')),
  li(b('UMich Ross'), t('：大中西部最强商学院；Target School 体量大但竞争激烈')),
  li(b('Brown'), t('：Top Ivy 但缺乏 Finance 专项培训，需要自我驱动')),
  li(b('Northwestern'), t('：Kellogg MBA 极强；本科相对弱一些但仍是 Target')),

  h3('Tier 2.5 半目标校（Semi-Target）'),
  li(b('Notre Dame Mendoza'), t('：中西部地区极强；东海岸略弱')),
  li(b('UVA McIntire'), t('：弗吉尼亚地区顶强；送往 DC/Richmond 银行')),
  li(b('UC Berkeley Haas'), t('：西海岸最强；但东海岸覆盖有限')),
  li(b('USC Marshall'), t('：洛杉杉矶/西海岸好；PE 出路在 LA 极强')),
  li(b('Emory Goizueta'), t('：南部最强；与 Lazard 有特殊 Pipeline')),
  li(b('UT Austin McCombs'), t('：德克萨斯地区极强；全美排名一般')),
  hr(),

  h2('二、中国留学生（非名校）的突破策略'),

  h3('如果你在 Semi-Target'),
  li(b('从大一开始 Networking'), t('：比名校学生早 1-2 年开始，弥补学校劣势')),
  li(b('精英项目'), t('：Indiana IB Workshop / Kelley Investment Banking Club — 非名校中送往 Wall Street 最多人的项目')),
  li(b('转学'), t('：大二转 Target School 是可行选项，但转学到 Wharton 极难')),
  li(b('Master\'s Degree'), t('：到 Target School 读 MFin（Master in Finance）或 MAcc — 重置学校标签')),

  h3('如果你在 Non-Target'),
  li(b('IB Workshop 路径'), t('：Indiana Kelley IB Workshop / Notre Dame Investment Club — 少数 Non-target 能进 BB 的通道')),
  li(b('中小市场 IB 起步'), t('：先去 Middle Market IB（Baird / Piper Sandler / Houlihan Lokey）→ 再横跳 BB')),
  li(b('四大会计 + 跳槽'), t('：四大 Transaction Services → 投行是可行的 2-3 年路径')),
  li(b('MBA'), t('：最终王牌 — Top MBA 可以彻底重置你的招聘标签')),
  hr(),

  h2('三、咨询目标校（MBB）'),
  p(t('咨询的学校重要性略低于投行（因为更看重 GPA 和 Case Interview 能力），但名校仍有显著优势。')),
  li(b('超级目标校'), t('：Harvard / Wharton / MIT / Princeton / Yale — 每年送出大量 MBB')),
  li(b('目标校'), t('：Columbia / Stanford / UChicago / Duke / Northwestern / Georgetown')),
  li(b('半目标校'), t('：Notre Dame / UMich / Cornell / UVA / UC Berkeley / Emory')),
  li(b('非目标校突破'), t('：参加 MBB 的 Diversity Programs + 早期 Networking + 完美 GPA + 优秀 Case 成绩')),
  hr(),

  h2('四、科技大厂目标校'),
  p(t('Big Tech（FAANG）的学校偏好和 IB 不同，更偏向 CS 技术能力，学校品牌次要。')),
  li(b('CS 顶校'), t('：MIT / Stanford / CMU / Berkeley / UIUC / Georgia Tech — 招聘量极大')),
  li(b('数据/PM'), t('：UMich / UT Austin / USC / Northwestern 等商科强校')),
  li(b('关键差异'), t('：Tech 公司招募规模更大，几乎全美 Top 50 CS 学校都有招聘；IB 则只有 ~15 家真正的 Target School')),
  quote(b('结论：'), t('如果你的目标是科技大厂 SDE，学校重要性约为 30%（背景）；但 IB/PE 中学校重要性高达 60-70%。这解释了为什么学金融的人比学 CS 的人更焦虑学校排名。')),
];

// ─── 页面4：MBA 申请完整指南 ─────────────────────────────────────
const MBA_BLOCKS = [
  p(t('MBA（Master of Business Administration）是进入顶级咨询/投行/PE 的重要通道，也是职业转型的最佳契机。M7 MBA 是全球最具影响力的职业敲门砖。')),
  hr(),

  h2('一、M7 商学院数据（2024-2025）'),

  h3('Harvard Business School (HBS)'),
  li(b('班级规模'), t('：943人（最大的 M7）')),
  li(b('录取率'), t('：11.2%（极竞争）')),
  li(b('平均 GMAT'), t('：740（新版）；平均 GPA：3.70')),
  li(b('工作经验'), t('：平均 4-5 年，最低 2 年')),
  li(b('特色'), t('：Case Method 教学法，培养通科型领导者；毕业生流向 PE/Consulting/VC 为主')),
  li(b('学费'), t('：约 $76,000/年，两年合计约 $200,000+（含生活费）')),

  h3('Stanford Graduate School of Business (GSB)'),
  li(b('班级规模'), t('：434人（最小的 M7）')),
  li(b('录取率'), t('：6.8%（全美最难申请的商学院）')),
  li(b('平均 GMAT'), t('：738；平均 GPA：3.80（最高）')),
  li(b('特色'), t('："Change Lives, Change Organizations, Change the World"——最关注社会影响力和创业；VC/Tech Startup 出口极强')),
  li(b('独特要求'), t('：两篇 Essay，其中一篇是："What matters most to you and why?" — 业界最难的文书')),

  h3('Wharton (University of Pennsylvania)'),
  li(b('班级规模'), t('：866人')),
  li(b('录取率'), t('：20.5%')),
  li(b('平均 GMAT'), t('：732；平均 GPA：3.70')),
  li(b('特色'), t('：全球最强金融 MBA；每年向投行/PE 输送最多学生；量化分析极强')),
  li(b('适合'), t('：明确走 Finance 路径（IB Associate / PE / Hedge Fund）的申请人')),

  h3('Columbia Business School (CBS)'),
  li(b('班级规模'), t('：982人')),
  li(b('录取率'), t('：20.9%')),
  li(b('平均 GMAT'), t('：732；平均 GPA：3.60')),
  li(b('特色'), t('：纽约地理优势无与伦比；有 Early Decision（申请截止10月，承诺录取即入读）——ED 录取率显著高于 Regular')),

  h3('Chicago Booth'),
  li(b('班级规模'), t('：632人')),
  li(b('录取率'), t('：28.7%')),
  li(b('平均 GMAT'), t('：729；平均 GPA：3.60')),
  li(b('特色'), t('：课程高度灵活，量化分析和金融理论极强；较多学生走 Finance/Quant 路径')),

  h3('Kellogg (Northwestern)'),
  li(b('班级规模'), t('：524人')),
  li(b('录取率'), t('：28.6%')),
  li(b('平均 GMAT'), t('：733；平均 GPA：3.70')),
  li(b('特色'), t('：Marketing 和 General Management 极强；文化强调 teamwork；女性比例 50%（最高）')),

  h3('MIT Sloan'),
  li(b('班级规模'), t('：450人')),
  li(b('录取率'), t('：19%')),
  li(b('平均 GMAT'), t('：720；平均 GPA：3.70')),
  li(b('特色'), t('：Tech + Operations + Innovation 最强；和 MIT 工程学院协同强大；Action Learning 实践导向')),
  hr(),

  h2('二、申请时间线'),

  h3('标准时间线（以申请次年秋季入学为例）'),
  li(b('前两年'), t('：积累工作经验（目标 3-5 年），取得 GMAT/GRE，考虑请 MBA Consultant')),
  li(b('申请前一年 5-9 月'), t('：参加 Campus Visit / Info Sessions；与在读生 Coffee Chat')),
  li(b('申请年 9月前'), t('：完成 GMAT/GRE（目标分数在手）；确定目标学校列表')),
  li(b('Round 1（9-10月截止）'), t('：最佳轮次，竞争略少且奖学金机会更多；通常 12 月有消息')),
  li(b('Round 2（1月截止）'), t('：最多申请人的轮次，最激烈；通常 3-4 月有消息')),
  li(b('Round 3（4月截止）'), t('：不建议！名额所剩无几，接近放弃轮次（除非有特殊情况）')),
  quote(b('最佳策略：'), t('Round 1 申请你的"梦校"，Round 2 申请其余学校。两轮分开申请，避免因 Round 2 材料不完善而浪费机会。')),
  hr(),

  h2('三、GMAT / GRE 要求'),

  h3('分数目标'),
  li(b('M7 竞争范围'), t('：GMAT 730+（新版 Focus Edition）；GRE 325+ Verbal+Quant')),
  li(b('安全分数'), t('：HBS/Stanford 目标 740+；其他 M7 目标 730')),
  li(b('下限'), t('：GMAT 700 以下进 M7 极难，除非其他亮点压倒性强（比如 Olympic 级别成就）')),

  h3('GMAT vs GRE'),
  li(b('哪个更容易'), t('：不同背景的人各有优劣，数学强的人通常选 GMAT；语言强的人有时选 GRE')),
  li(b('学校偏好'), t('：M7 均接受两者，无明确偏好；但 GMAT 是传统选择，更多人有参考数据')),
  li(b('GMAT Focus Edition'), t('：2023年后的新版本，满分 805，考查内容有变化（不再考 AWA）')),

  h3('中国学生数学优势'),
  li(b('数学'), t('：几乎所有中国申请人 Quant 满分，因此数学不是区分点')),
  li(b('语言'), t('：Verbal（语言部分）是中国学生最大挑战；目标 Verbal 165+（GRE）或 M7 均值附近')),
  li(b('备考时间'), t('：GMAT 通常需要 3-6 个月；GRE 相似；建议 1年+ 前开始')),
  hr(),

  h2('四、申请材料'),

  h3('推荐信（Recommendation Letters）'),
  li(b('数量'), t('：通常 2 封，部分学校要求 3 封')),
  li(b('推荐人选择'), t('：直属上司（最重要）+ 客户/合作者（跨部门视角）')),
  li(b('关键'), t('：推荐人必须能提供具体故事和量化例子，而不仅是"他/她很优秀"')),
  li(b('非英语母语推荐人'), t('：可以写中文，但需要附英文翻译；部分学校直接要求英文')),

  h3('Essay 写作'),
  li(b('核心主题'), t('：Why MBA / Why This School / Career Goals / Leadership / Personal Growth')),
  li(b('长度'), t('：HBS 通常 900-1000 字；其他学校 250-500 字不等')),
  li(b('差异化'), t('：不要写"我想做咨询"或"我想进投行"这种通用答案；要展示独特的价值观和人生经历')),
  li(b('具体性'), t('："Why Kellogg" 里必须提到具体的 Kellogg 项目/教授/文化 — 否则显得你只是用了通用模板')),
  quote(b('Stanford GSB 最难 Essay：'), t('"What matters most to you, and why?" 不是问职业目标，是问你的 core value 和人生哲学。写这道题时不要背诵 MBA 成功模板，要真实、深度反思自己。审稿人一眼能看出套路。')),

  h3('面试'),
  li(b('HBS'), t('：Post-Interview Reflection（面试后写一篇 reflection），独特！测试你能否在压力下清晰思考')),
  li(b('Stanford GSB'), t('：面试对 Offer 影响极大；注重 Personal Narrative 的真实性')),
  li(b('Wharton'), t('：有 Group Presentation（小组展示）轮次；测试 Teamwork')),
  li(b('通用准备'), t('：STAR 格式 Behavioral 题 + Why MBA + Why This School + Career Goals')),
  hr(),

  h2('五、中国申请人特点与应对'),

  h3('中国申请人的优势'),
  li(b('定量能力'), t('：数学 GMAT 满分是标配')),
  li(b('工作背景'), t('：中国快速发展的经济提供了丰富的职业故事素材')),
  li(b('国际化视角'), t('：中美双文化经历是叙事亮点')),

  h3('中国申请人的劣势与对策'),
  li(b('同质化'), t('：太多人有"Consulting + 高 GPA + GMAT 740"的背景。需要找到差异化的故事')),
  li(b('Leadership 故事'), t('：美式 Leadership 强调 Initiative 和 Impact，不是"我完成了任务"而是"我改变了方向"')),
  li(b('英语 Verbal'), t('：加强练习，必要时请 Essay Consultant 润色')),
  li(b('Social Capital'), t('：美国申请人天然有更多推荐人选择；提前在美工作 2-3 年建立 Recommender 关系')),

  h3('奖学金机会'),
  li(b('M7 奖学金'), t('：HBS / Wharton 等均有 Merit-based 奖学金，金额 $20,000-$80,000/年')),
  li(b('Full Scholarship'), t('：极罕见于 M7；Knight-Hennessy（Stanford）是最知名的全额奖学金项目')),
  li(b('中国基金'), t('：部分中国基金会（宝钢等）提供赴美 MBA 奖学金，可以关注')),
  quote(b('ROI 计算：'), t('M7 MBA 两年总成本约 $220,000-$260,000（学费 + 生活费），但 MBA 后 MBB 全包薪资约 $260,000/年，投行 Associate $300,000+/年。3-4 年可回本，长期 ROI 极高。')),
];

// ─── 主流程 ────────────────────────────────────────────────────────
const PAGES = [
  { title: '🏢 私募股权（PE）面试完整攻略（LBO + 投资判断）', blocks: PE_BLOCKS },
  { title: '📐 量化金融（Quant）面试全攻略（Citadel/Two Sigma/D.E. Shaw）', blocks: QUANT_BLOCKS },
  { title: '🎓 Target / Semi-Target 学校分析（IB/咨询/科技）', blocks: SCHOOL_BLOCKS },
  { title: '📚 美国 MBA 申请完整指南（M7 + GMAT + 文书）', blocks: MBA_BLOCKS },
];

async function main() {
  console.log('🚀 开始写入深度内容（第三批）...\n');
  for (const page of PAGES) {
    await createPage(page.title, page.blocks);
    await sleep(1000);
  }
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
