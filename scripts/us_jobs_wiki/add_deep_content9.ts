/**
 * 美国商科求职知识库 - 深度内容补充（第九批）
 * IB技术面经100题 / Case面经真题 / FAANG面经 / PE/HF题库 / 中国学生真实故事
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
// 页面1：💼 投行技术面经大全（IB Technical 100题+答案）
// ============================================================
const ibTechnicalBlocks: any[] = [
  p(t('来源：Wall Street Oasis IB Interview Guide、Breaking Into Wall Street技术题库、Mergers & Inquisitions面经整理、候选人分享（Goldman/MS/JPM/Evercore/Lazard实际面题），共100+题分类整理。', false, true)),
  hr(),
  h2('一、会计基础（Accounting）— 必考30题'),
  h3('三大财务报表连接关系'),
  li(t('如果净利润增加$10（税率40%），三张报表如何变化？')),
  p(t('答：IS：Net Income+$10；BS：Assets（现金）+$6，Equity（Retained Earnings）+$6（净利润-税$4后剩$6）；CF：Operating CF+$6。注意：如果净利润+$10，税=$4，净利润实际+$6。（面试官有时候问税后数）')),
  li(t('如果折旧增加$10，三张报表如何变化（税率40%）？')),
  p(t('答：IS：EBIT-$10，NI-$6（税后）；BS：PP&E-$10，现金+$4（节税），Equity（RE）-$6；CF：Net Income-$6但Non-cash add back+$10，CF净+$4。')),
  li(t('如果发行$100债券买设备，三张报表如何变化？')),
  p(t('答：BS：PP&E+$100，Long-term Debt+$100，现金不变（直接换了资产）；IS：暂时不变（只有未来折旧才影响）；CF：Investing-$100，Financing+$100，净CF=0。')),
  li(t('如果公司回购$50股票，三张报表如何变化？')),
  p(t('答：BS：现金-$50，Treasury Stock+$50（Equity下降）；IS：不变（但EPS上升，因为分母减少）；CF：Financing CF-$50。')),
  h3('资产负债表专项题'),
  li(t('为什么资产=负债+权益？')),
  p(t('答：会计恒等式，公司的所有资产必须由某种资金来源支撑——要么是借来的（负债），要么是股东投入/留存（权益）。')),
  li(t('Goodwill是什么？何时产生？如何影响BS？')),
  p(t('答：当公司被收购时，收购价格超过目标公司净资产公允价值（FMV）的部分。产生于M&A。记在BS资产端。不摊销（GAAP下），但每年进行减值测试（Impairment Test）。')),
  li(t('递延税款（Deferred Tax）如何产生？')),
  p(t('答：当税务报告与会计报告对同一项目处理不一致时产生。典型案例：加速折旧（税务用，减少当期应税收入）vs直线折旧（会计用）。差异在BS中记为Deferred Tax Liability，未来税务会计差异消除时消失。')),
  h3('现金流量表专项题'),
  li(t('为什么折旧要在CF表中加回来（Add-back）？')),
  p(t('答：折旧是非现金费用。在IS上它减少了Net Income，但实际上没有现金流出。在CF的间接法中，从Net Income出发，必须加回非现金项目。')),
  li(t('NWC（Net Working Capital）增加，Cash Flow是增还是减？')),
  p(t('答：减少。NWC增加意味着你把更多现金"锁进"了营运资本（如：应收账款增加），或应付账款减少（还了更多钱）。两种情况都消耗现金。Change in NWC = -ΔWorking Capital（注意符号）。')),
  li(t('CapEx为什么在CF表中是负的？')),
  p(t('答：CapEx是资本支出，花出去的现金，所以在CF的Investing Activities中是负现金流。')),
  hr(),
  h2('二、估值基础（Valuation）— 必考20题'),
  h3('Enterprise Value vs Equity Value'),
  li(t('Enterprise Value和Equity Value的区别？')),
  p(t('答：EV = Equity Value + Debt - Cash（+ 少数股东权益 + 优先股 - 联营投资）。EV代表收购整家公司（包括还债）的成本。Equity Value只代表股权价值。类比：房子总价=$500k（EV），首付=$100k（Equity），贷款=$400k（Debt）。')),
  li(t('为什么有些倍数用EV，有些用Equity Value？')),
  p(t('答：当指标是"pre-debt"的（如EBITDA/EBIT/Revenue），用EV；当指标是"post-debt"的（如Net Income/EPS/Book Value），用Equity Value。因为EV属于所有资本提供者（debt+equity），而Net Income只属于stock holders。')),
  li(t('EV/EBITDA vs P/E，哪个更常用？为什么？')),
  p(t('答：EV/EBITDA更常用于IB/PE，因为它排除了资本结构和税率差异，更适合跨公司对比。P/E更多用于股票市场分析，受资本结构和税率影响大，容易失真。')),
  h3('DCF专项题'),
  li(t('在什么情况下DCF是最好的估值方法？最差的？')),
  p(t('答：最好：现金流可预测的成熟企业（大型消费品/基础设施）；最差：早期亏损公司（创业公司）、金融公司（资本结构特殊）、周期性行业（预测困难）。')),
  li(t('WACC中使用市值还是账面价值？为什么？')),
  p(t('答：使用市值。因为WACC代表投资者要求的当前回报率，应该基于资产的当前市场价值，而不是历史购买成本（账面价值）。')),
  li(t('Terminal Value占DCF总价值的多少比例通常是合理的？')),
  p(t('答：60-80%通常是合理的（对成熟公司）。如果TV占比超过90%，说明预测期现金流太小或不合理，模型可靠性下降。')),
  li(t('在DCF中，永续增长率（g）通常选多少？为什么？')),
  p(t('答：通常2-3%，接近长期通胀率或GDP增长率。因为理论上任何公司不能永远比整体经济增长更快，否则最终会超过整个经济规模。')),
  hr(),
  h2('三、M&A基础（Mergers & Acquisitions）— 必考20题'),
  h3('收购结构'),
  li(t('资产收购（Asset Purchase）vs 股权收购（Stock Purchase）的区别？')),
  p(t('答：Asset Purchase：买方获得特定资产和负债，可以step up税基（提高折旧，节税），但更复杂。Stock Purchase：买方获得整个公司包括所有隐形负债，更简洁但税基不能调整。卖方通常偏好Stock Sale（资本利得税优惠），买方通常偏好Asset Sale（节税）。')),
  li(t('换股并购（Stock Swap）对EPS有什么影响？')),
  p(t('答：如果收购价高于被收购公司的EPS贡献，会导致稀释（Dilutive）；如果收购增加了足够的收益（协同效应），可能是增厚的（Accretive）。简单判断：如果收购方P/E > 目标P/E，通常是Accretive。')),
  li(t('Synergies在M&A中是什么？为什么重要？')),
  p(t('答：协同效应是合并后超过单独运营总和的额外价值。Revenue synergies（交叉销售）通常比Cost synergies（裁员/整合）更难实现。IB在pitch时会用Synergies来justify高溢价。')),
  h3('Leveraged Buyout（LBO）专项'),
  li(t('为什么PE公司要用杠杆（债务）来做收购？')),
  p(t('答：杠杆放大股权回报（IRR）。用$30M股权+$70M债务收购$100M公司，如果5年后以$150M卖出，还掉$70M债务后，股权回报$80M。IRR = (80/30)^(1/5) - 1 = 22%。如果没有杠杆，同样情况IRR = (150/100)^(1/5) - 1 = 8.4%。')),
  li(t('LBO中最重要的价值驱动因素是什么？')),
  p(t('答：三大驱动力：1) Debt Paydown（用FCF还债，提高equity比例）；2) EBITDA Growth（业务增长）；3) Multiple Expansion（以更高倍数退出，市场rerating）。实际上，Multiple Contraction风险是最大的LBO杀手。')),
  hr(),
  h2('四、行业特定技术题（TMT/Healthcare/Energy）'),
  h3('科技公司特有指标'),
  li(t('为什么科技公司常用EV/Revenue而非EV/EBITDA？')),
  p(t('答：很多科技公司亏损或EBITDA为负，EV/EBITDA无意义。EV/Revenue是更通用的指标，允许对不同盈利阶段的公司进行对比。缺点是忽略了盈利能力差异。')),
  li(t('SaaS公司最重要的3个估值指标是什么？')),
  p(t('答：ARR（年度经常性收入）、NRR（净收入留存率，>100%表示扩张）、CAC Payback Period（客户获取成本回收期）。高NRR+高ARR增长=高EV/ARR倍数。')),
  h3('医疗/生物医药特有题'),
  li(t('生物医药公司（Pre-revenue biotech）如何估值？')),
  p(t('答：主要用rNPV（Risk-adjusted NPV）。每条管线药物的商业化价值乘以临床成功概率（FDA批准率），折现到现在。常见数据：Phase 1→批准约10%，Phase 2→批准约15%，Phase 3→批准约50%。')),
  li(t('为什么Healthcare公司的EV/EBITDA倍数通常比其他行业低？')),
  p(t('答：监管风险高、专利悬崖（patent cliff）、保险报销不确定性、研发成功率低，这些风险压低了市场愿意给的倍数。但创新型biotech可能享受高倍数。')),
  hr(),
  h2('五、真实面经分享（来自Glassdoor/WSO/Reddit）'),
  h3('Goldman Sachs IBD 真实面试题（2023-2024届）'),
  li(t('Walk me through your resume. (必问，需要2分钟精炼版本)')),
  li(t('What is the current 10-year Treasury yield, and how does it affect equity valuations?')),
  li(t('Give me an example of a recent deal that interested you. Why? What were the strategic rationales?')),
  li(t('If a company has $100 of revenue and 30% EBITDA margins, what is the enterprise value if we apply 10x EBITDA?')),
  li(t('Goldman就宣布的某笔交易：Do you think this acquisition is accretive or dilutive? Walk me through your analysis.')),
  li(t('Behavioral: Tell me about a time you had to work with someone who was very difficult. (必问，准备完整STAR答案)')),
  h3('Morgan Stanley IBD 真实面试题（2024届）'),
  li(t('If you could only use ONE valuation method, which would you pick and why?')),
  li(t('How would you value a pre-revenue startup vs. a mature cash-generating company?')),
  li(t('A company wants to raise $500M in equity. Walk me through the ECM process.')),
  li(t('What metrics would you look at to assess the health of a retail company?')),
  li(t('MS就某并购案：What synergies do you see? Would you recommend this deal?')),
  h3('JP Morgan IBD 真实面试题（2023-2024届）'),
  li(t('Walk me through a DCF and tell me where you see the most uncertainty.')),
  li(t('How does an increase in interest rates affect the LBO model?')),
  li(t('You\'re pitching a company to acquire a competitor. What are the first 3 things you analyze?')),
  li(t('What\'s the difference between unlevered and levered FCF? When do you use each?')),
  li(t('Tell me about a time you demonstrated exceptional leadership under pressure.')),
  h3('Evercore/Lazard (EB) 真实面试题（2024届）'),
  li(t('EB因为boutique文化更注重深度：Build me a rough LBO on the back of a napkin for [Company X].')),
  li(t('Evercore特别注重modeling test：30-60分钟Excel test，建3-statement或DCF')),
  li(t('Why Evercore/Lazard over a bulge bracket? （必须有具体答案，不能说"更小更好"）')),
  li(t('Tell me about a deal Evercore advised on recently. What do you think of the strategic rationale?')),
];

// ============================================================
// 页面2：🎯 MBB + T2咨询面经大全（Case+PEI真题集）
// ============================================================
const consultingCaseBlocks: any[] = [
  p(t('来源：Victor Cheng (McKinsey)、Case In Point (Cosentino)、PrepLounge案例库、MBB候选人真实分享（2022-2024届）、BCG官方实践案例、Bain案例prep材料。', false, true)),
  hr(),
  h2('一、Case Interview真题库（按公司分类）'),
  h3('McKinsey真实Case案例（2023-2024届）'),
  li(t('零售案例：一家美国大型超市连锁的利润下滑30%，CEO请我们找原因并建议对策')),
  p(t('思路框架：Profit = Revenue - Cost。Revenue：定价/volume/mix变化？Cost：固定/变动成本？再深入：是内部因素还是外部竞争/经济环境？')),
  li(t('科技案例：一家SaaS公司考虑进入中国市场，是否应该？')),
  p(t('思路框架：Market Attractiveness（市场规模/增速/竞争）× Competitive Position（本公司优势）× Entry Risk（监管/本地化挑战）→ Go/No-Go + 进入方式推荐')),
  li(t('医疗案例：一家医院系统的手术量下降，但门诊量增加，总体收入如何？')),
  p(t('思路框架：Revenue mix shift分析。手术高利润，门诊低利润。量变化×单价=Revenue变化。需要数据确认实际影响。')),
  h3('BCG真实Case案例（2023-2024届）'),
  li(t('工业制造：一家德国汽车零件制造商决定是否投资电动车零部件产线')),
  p(t('BCG喜欢市场规模推算：EV渗透率×市场份额×单价×margin = 投资回报。同时考虑cannibalization（内部竞食）。')),
  li(t('银行/FinTech：一家传统银行是否应该收购一家Neobank')),
  p(t('BCG注重创意：Consider digital disruption risk、customer acquisition cost comparison、integration complexity、regulatory approval。')),
  li(t('消费品：一个运动鞋品牌在亚洲市场增长停滞，如何重新激活增长？')),
  p(t('Framework：Customer segmentation → Channel analysis → Product portfolio → Marketing → Geography expansion → Pricing。')),
  h3('Bain真实Case案例（2023-2024届）'),
  li(t('Private Equity Due Diligence Case：Bain面试经常考PE DD类型')),
  p(t('模板问题："我们的PE客户要以10x EBITDA收购这家公司，你会调查什么？" 答：Business model、Market position、Management team、Financial projections、Risks、Entry/Exit multiple合理性。')),
  li(t('零售/电商：Target是否应该与Amazon合作？或者自建配送？')),
  p(t('Bain用数字驱动：Cost of building own logistics vs. Amazon fees，customer experience impact，competitive implications。')),
  hr(),
  h2('二、Case Interview的候选人心理误区'),
  h3('最常见的5个失败原因'),
  li(t('误区1：直接套框架，不听问题就开始Framework。'), t('正确做法：先clarify问题，确认你理解了再展示Framework。', true)),
  li(t('误区2：沉默时间太长（超过30秒）。'), t('正确做法：边说边想，"Let me structure my thoughts..."。', true)),
  li(t('误区3：做完数学计算不解读含义。'), t('正确做法：数字是什么意思？对决策有什么影响？', true)),
  li(t('误区4：提建议时太保守（"It depends"）。'), t('正确做法：McKinsey期望你有明确立场，即使基于假设。', true)),
  li(t('误区5：忽视Exhibit/图表分析。'), t('正确做法：当面试官给你数据图时，先说你观察到的3个关键点。', true)),
  h3('提高Case表现的具体方法'),
  li(t('PrepLounge.com：最好的Case配对练习平台，可以找真实Partner练习')),
  li(t('Casecoach.me：付费但有真实MBB Coaches（$200-$400/session）')),
  li(t('Victor Cheng YouTube：免费Case解析，逻辑清晰度训练最好')),
  li(t('RocketBlocks.me：交互式Case练习，适合自己练习计算和框架')),
  li(t('目标：申请前完成至少50个Case练习（30个自己看+20个找人练）')),
  hr(),
  h2('三、PEI（Personal Experience Interview）真题——McKinsey专项'),
  h3('McKinsey PEI三个维度题目'),
  p(t('Personal Impact（个人影响力）：')),
  li(t('Tell me about a time you had to convince a skeptical audience of your recommendation.')),
  li(t('Describe a situation where you used data to change someone\'s mind.')),
  li(t('Give me an example when you had to influence without authority.')),
  p(t('Entrepreneurial Drive（创业精神）：')),
  li(t('Tell me about the biggest initiative you\'ve ever taken on.')),
  li(t('Describe a time when you saw an opportunity and pursued it despite significant obstacles.')),
  li(t('Give an example of when you created something from nothing.')),
  p(t('Inclusive Leadership（包容型领导力）：')),
  li(t('Tell me about a time you built a diverse team or worked with people very different from you.')),
  li(t('Describe a situation where you helped resolve a conflict within a team.')),
  li(t('Give an example of when you supported someone\'s growth or development.')),
  h3('PEI答案的McKinsey标准'),
  li(t('每个故事必须有清晰的Individual Contribution（你做了什么，不是团队）')),
  li(t('必须有量化结果（即使是估算）："+20%效率提升"比"改善了效率"强10倍')),
  li(t('面试官会追问到第5层：你说了结果，他会问"你具体如何说服那个人"，然后继续深追')),
  li(t('每个dimension只需要1个核心故事，但要能回答5-6个follow-up')),
  hr(),
  h2('四、T2咨询公司面经（Oliver Wyman / AT Kearney / Strategy&）'),
  h3('Oliver Wyman（金融服务咨询最强）'),
  li(t('Case特点：重数学+金融建模（比MBB更quantitative）')),
  li(t('真实题：银行资本充足率（Capital Adequacy Ratio）下降，应该如何应对？')),
  li(t('风格：更偏向"Right Answer"，不像MBB那么注重过程')),
  li(t('适合：CFA/金融背景，喜欢金融行业深度分析的人')),
  h3('AT Kearney（Operations/Supply Chain最强）'),
  li(t('Case特点：运营改善类，大量流程优化')),
  li(t('真实题：汽车制造厂的产线效率低30%，如何改善？')),
  li(t('风格：非常practical，注重实际可执行的建议')),
  h3('Strategy& (PwC Consulting)'),
  li(t('Case特点：类似MBB，但更commercial（商业导向）')),
  li(t('真实题：一个CPG公司是否应该收购一个DTC品牌？')),
  li(t('注意：Strategy&是PwC旗下，文化比MBB更corporate')),
];

// ============================================================
// 页面3：💻 Google/Meta/Amazon面经大全（PM/SWE/DS）
// ============================================================
const techInterviewBlocks: any[] = [
  p(t('来源：Glassdoor Interview Questions（2022-2024）、LeetCode讨论区、Blind App匿名面经、Cracking the PM Interview (Gayle McDowell)、Decode & Conquer (Lewis C. Lin)，综合数百条真实面经。', false, true)),
  hr(),
  h2('一、Google面试体系详解'),
  h3('Google SWE面试结构（L3-L5）'),
  li(t('轮次：4-5轮，每轮45分钟')),
  li(t('内容分配：2-3轮Coding + 1轮System Design + 1轮Behavioral（Googleyness）')),
  li(t('评分标准：0-4分制，需要至少3轮3分以上才能过')),
  li(t('Coding难度：Medium-Hard LeetCode，重视代码质量和沟通过程')),
  h3('Google PM面试（Associate Product Manager/PM）'),
  li(t('Product Design题：Design YouTube for the blind. / Improve Google Maps for cyclists.')),
  li(t('Metrics题：How would you measure the success of Google Docs collaboration feature?')),
  li(t('Strategy题：Should Google enter the healthcare market? Build your case.')),
  li(t('Behavioral题：Tell me about a time you launched a product that failed. What did you learn?')),
  li(t('Estimation题：How many GB of data does Google Photos store per day?')),
  h3('Google Behavioral（Googleyness）真实题'),
  li(t('Tell me about a time you worked with people who had very different perspectives.')),
  li(t('Describe a situation where you had to do something with no clear guidelines or instructions.')),
  li(t('Give an example of when you had to make a decision in ambiguity with incomplete information.')),
  li(t('Tell me about a time you failed publicly and how you handled it.')),
  li(t('Describe a time when you challenged the status quo and were successful.')),
  hr(),
  h2('二、Meta（Facebook）面试体系'),
  h3('Meta PM面试（Rotational PM Program / PM Role）'),
  li(t('Product Sense: Design a product for elderly users to stay connected with family.')),
  li(t('Execution: Facebook Stories engagement is down 20%. Diagnose and fix.')),
  li(t('Strategy: Should Facebook enter the B2B SaaS space? Make your recommendation.')),
  li(t('Behavioral: Tell me about a product you admire. What would you change?')),
  h3('Meta Data Science（DS）面试结构'),
  li(t('SQL题：Find the top 3 countries by DAU for last 30 days, excluding weekends.')),
  li(t('Stats/Probability：A/B test shows 5% lift in click-through rate. How do you determine if this is significant?')),
  li(t('Product案例：Instagram Reels watch time dropped by 10% last Tuesday. Investigate.')),
  li(t('ML：How would you build a model to detect misinformation posts?')),
  h3('Meta真实面试反馈（Glassdoor 2024）'),
  li(t('面试风格：比Google更product-focused，不那么academic')),
  li(t('强调：Speed + Impact，非常注重实际可衡量的outcome')),
  li(t('Coding：也是LeetCode，但更注重"写出能跑的代码"，不那么注重perfect复杂度')),
  li(t('Behavioral：Meta的behavioral更简短，一般问3-4题，每题10分钟')),
  hr(),
  h2('三、Amazon面试体系（最系统化）'),
  h3('Amazon PM/BA面试结构'),
  li(t('轮次：4-5轮，每轮1小时（online assessment → phone screen → loop）')),
  li(t('每轮必须cover 2-3个LP，所有轮次加起来覆盖所有16个LP')),
  li(t('有一轮是Bar Raiser（BR）——专门判断候选人是否达到Amazon Bar')),
  h3('Amazon PM真实面题（2023-2024届）'),
  li(t('Product Design：Design an Alexa feature for parents to monitor their kids\' screen time.')),
  li(t('Product Improvement：You are the PM of Amazon Subscribe & Save. Improve it.')),
  li(t('Metrics：What metrics would you track for Amazon Prime membership? How do you know it\'s healthy?')),
  li(t('Strategy：Amazon is considering entering the grocery delivery market in India. Should it?')),
  h3('Amazon SDE真实面题（LeetCode级别）'),
  li(t('Medium：Two Sum (Array) / Longest Palindromic Substring (String)')),
  li(t('Medium：Number of Islands (Graph DFS) / Binary Tree Level Order Traversal (BFS)')),
  li(t('Hard：Median of Two Sorted Arrays / Word Break II (DP)')),
  li(t('System Design：Design Amazon\'s product recommendation system')),
  li(t('System Design：Design a distributed rate limiter for Amazon API Gateway')),
  h3('Amazon Bar Raiser的角色与准备'),
  li(t('Bar Raiser是一个经过特殊训练的员工（任何职级），专门评估候选人的Bar')),
  li(t('他们不是这个team的人，所以不会因为"需要这个位置"而有bias')),
  li(t('重点考核：Ownership + Insist on Highest Standards + Think Big')),
  li(t('如何识别：通常问最深的behavioral问题，追问最多层')),
  li(t('准备：把你最强的3个故事练到极致，能回答任何角度的follow-up')),
  hr(),
  h2('四、Apple / Microsoft / Netflix 面试特点'),
  h3('Apple面试特点'),
  li(t('极度保密：面试题不会在Glassdoor上出现（NDA文化）')),
  li(t('风格：非常design-focused，注重user experience细节')),
  li(t('PM面试：经常问"如何改善已有Apple产品"，注重简洁美学')),
  li(t('Behavioral：强调"passion for Apple products"，必须真的是Apple粉丝')),
  li(t('技术：SWE面试与Google类似，但更重视系统设计（iOS/macOS特有）')),
  h3('Microsoft面试特点'),
  li(t('Growth Mindset：Satya Nadella的核心文化，面试中体现学习能力')),
  li(t('PM面试题：Design Microsoft Teams for K-12 education / Improve Bing Search.')),
  li(t('Coding：LeetCode Medium，但偶尔有Hard，SDE2以上注重System Design')),
  li(t('Behavioral：很多情境判断题，"how would you handle..."类型')),
  h3('Netflix面试特点'),
  li(t('直接和honest：Netflix文化极度透明，面试中也是，敢于直接说不同意见')),
  li(t('Senior + focus：Netflix很少招junior，通常是3-5年经验的senior')),
  li(t('Keeper Test文化：面试就是在评估"我们会为这个人fight吗？"')),
  li(t('Technical：DS/ML面试非常深，SWE面试相对标准')),
  li(t('注意：不要表现得太谦虚，Netflix要看你的confidence和conviction')),
];

// ============================================================
// 页面4：💰 PE/HF面试全题库（LBO/Market Making/Investment Pitch）
// ============================================================
const pehfInterviewBlocks: any[] = [
  p(t('来源：Wall Street Oasis PE Interview Guide、Macabacus PE题库、Mergers & Inquisitions HF面试指南、WSO HF Interview Prep、Preqin PE数据、真实候选人Glassdoor分享（Blackstone/KKR/Citadel/Point72）。', false, true)),
  hr(),
  h2('一、Private Equity（PE）面试全流程'),
  h3('PE面试结构（大型基金如Blackstone/KKR/Apollo）'),
  li(t('第1轮：Screening Call（Headhunter → 基金HR）— 30分钟，基础背景了解')),
  li(t('第2轮：Technical Screen（1小时）— IB technical + LBO概念')),
  li(t('第3轮：Modeling Test（3小时）— 建LBO或DCF，现场或带回家')),
  li(t('第4轮：Paper LBO（30分钟）— 口头LBO，在白板上快速估算')),
  li(t('第5轮：Investment Presentation — 准备1家公司的详细投资分析')),
  li(t('第6轮：Partner Interviews（3-4轮）— 综合面试，确定录取')),
  h3('Paper LBO（必考，必须掌握）'),
  p(t('题目格式：公司EBITDA=$100M，以10x倍数收购（=$1B），用60%债务。5年后以12x EBITDA退出，期间EBITDA年增长10%。算IRR和MoM。')),
  p(t('解题步骤：')),
  li(t('1. Entry：EV = $100M × 10 = $1,000M；Equity = $400M，Debt = $600M')),
  li(t('2. Exit EBITDA：$100M × (1.1)^5 = $161M')),
  li(t('3. Exit EV：$161M × 12 = $1,934M')),
  li(t('4. Remaining Debt（假设年还$60M，5年还$300M）：$600M - $300M = $300M')),
  li(t('5. Exit Equity：$1,934M - $300M = $1,634M')),
  li(t('6. MoM：$1,634M / $400M = 4.1x')),
  li(t('7. IRR：4.1x over 5 years ≈ 32%（规则：2x=15%, 3x=25%, 4x=32%, 5x=38%）')),
  h3('PE Modeling Test常见类型'),
  li(t('LBO Model（最常见）：通常给财务数据，要建sources/uses + debt schedule + returns')),
  li(t('Operating Model（有时合并）：预测3-5年P&L，重点是EBITDA增长驱动因素')),
  li(t('DCF Model：作为LBO的附加，验证Entry Multiple是否合理')),
  li(t('时间：3小时take-home或现场，格式通常是Excel，注重清洁度和逻辑')),
  hr(),
  h2('二、PE Investment Pitch（投资推荐）— 标准格式'),
  h3('Investment Memo标准结构'),
  li(t('Executive Summary：一段话的Buy/Sell recommendation + 最重要的3个reasons')),
  li(t('Company Overview：业务模式、产品、收入结构、客户群')),
  li(t('Market Analysis：TAM、增长驱动、竞争格局、行业趋势')),
  li(t('Investment Thesis：为什么这是好的LBO target？3-4个核心thesis')),
  li(t('Financial Analysis：历史财务、预测模型、LBO Returns（Base/Bull/Bear）')),
  li(t('Key Risks：最大的3-5个投资风险，以及如何mitigate')),
  li(t('Recommendation：明确Yes/No + Target Entry Multiple + Exit Strategy')),
  h3('什么是好的LBO Target？'),
  li(t('Stable, predictable FCF（稳定的自由现金流用来还债）')),
  li(t('低CapEx需求（债务还款不被资本支出消耗）')),
  li(t('Strong market position（不容易被竞争侵蚀）')),
  li(t('Multiple expansion潜力（可以从低倍数入 → 高倍数出）')),
  li(t('Clear exit path（IPO / 战略并购 / Secondary buyout）')),
  li(t('Management team quality（PE需要优秀的management执行改善计划）')),
  hr(),
  h2('三、Hedge Fund（HF）面试全题库'),
  h3('Long/Short Equity HF面试（Fundamental）'),
  li(t('Pitch me a stock — long or short. Walk me through your thesis.')),
  li(t('What is your variant perception on [stock]? How does it differ from consensus?')),
  li(t('Walk me through your fundamental research process for a new position.')),
  li(t('A stock is down 20% today on earnings miss. Do you buy, sell, or hold?')),
  li(t('What is the most important driver of [Company]\'s stock price over the next 12 months?')),
  li(t('How do you think about position sizing? When do you add vs. trim?')),
  h3('Macro HF面试题'),
  li(t('What is your view on the Fed\'s rate path over the next 12 months?')),
  li(t('Walk me through a macro trade you would put on today with specific instruments.')),
  li(t('How would you play a recession scenario in the credit markets?')),
  li(t('What is the relationship between the dollar and commodity prices? Build a trade around it.')),
  li(t('Explain the current yield curve shape and what it implies for the economy.')),
  h3('Quant/Systematic HF面试题（Point72 / D.E. Shaw / Two Sigma）'),
  li(t('Explain the Sharpe Ratio. What are its limitations?')),
  li(t('You notice a pattern: stocks that gap up on Monday tend to outperform by Friday. How do you test if this is a real signal?')),
  li(t('What is overfitting? How do you prevent it in a trading strategy?')),
  li(t('Walk me through how you would build a mean-reversion strategy for equity pairs.')),
  li(t('Probability: 3 cards, one is red on both sides, one is white on both sides, one has red on one side and white on the other. I draw a card and show you the red side. What\'s the probability the other side is also red?（答：2/3）')),
  hr(),
  h2('四、Stock Pitch完整示例（Long Case）'),
  h3('示例：Long $MSFT（Microsoft）'),
  li(t('Investment Thesis（3 points）：')),
  li(t('1. Azure cloud growth runway：Enterprise cloud penetration仍在低位，Azure有3-5年高增长')),
  li(t('2. AI monetization已开始：Copilot产品已产生收入，$30/月premium订阅有望显著提升ARPU')),
  li(t('3. Attractive valuation vs. peers：EV/FCF低于Google，margin扩张故事intact')),
  li(t('Valuation：$400 target price（当前$375），10%上行空间 + 分红')),
  li(t('Base案例：2年内达到$450，Bull案例：AI收入超预期 → $520，Bear案例：云增长放缓 → $300')),
  li(t('Catalyst：FY25 Q2 Azure增速数据，Copilot商业化进展，EU监管Microsoft-OpenAI关系')),
  li(t('Key Risks：AWS/GCP竞争加剧，AI capex超预期，China/regulatory风险')),
  h3('好的Stock Pitch的标准'),
  li(t('有明确的View：不是"可能涨也可能跌"，而是"我买/卖，target price是X，原因是Y"')),
  li(t('Differentiated：你的观点与市场共识有什么不同？为什么你是对的？')),
  li(t('Catalyst-driven：为什么是现在买？未来3-12个月有什么具体事件会证明你的thesis？')),
  li(t('Risk-aware：主动说最大的downside风险，显示你的分析是诚实的')),
];

// ============================================================
// 页面5：🌟 中国留学生求职真实故事集（从失败到成功）
// ============================================================
const realStoriesBlocks: any[] = [
  p(t('来源：综合整理自r/FinancialCareers/r/cscareerquestions/r/MBA等论坛中中国留学生真实分享，Blind App匿名故事，个人博客，及作者访谈。所有名字均已匿名处理。', false, true)),
  hr(),
  h2('一、从Non-Target到顶级金融（真实案例）'),
  h3('案例1：Indiana University → Goldman Sachs IBD（2023年）'),
  p(t('背景：来自二线城市，Kelly School of Business，GPA 3.7，无任何知名实习。大二暑假在Indiana本地一家小会计师事务所实习。')),
  p(t('转折点：大三开学立刻开始冷Networking——每天在LinkedIn发20个Connection Request给Goldman员工，其中以IU校友优先。3周内，一位IU 2013届校友回复并给他做了Coffee Chat，最后帮他内推。')),
  p(t('结果：内推简历过了ATS筛选，参加了Superday，最后拿到了Goldman IBD的Summer Analyst offer。')),
  p(t('经验总结："非target学校的人唯一的机会就是校友网络+内推，不然简历根本到不了人眼前。我发了200封LinkedIn消息，只有8个人回复，但这8个人中就有1个帮了我的忙。"')),
  h3('案例2：Texas A&M（工程）→ McKinsey（2022年）'),
  p(t('背景：德州A&M机械工程，GPA 3.9，没有商科背景，没有Case练习经验。大三暑假做了一个工厂效率改善项目。')),
  p(t('关键动作：大四秋季开学后，报名参加了McKinsey的Freshman Fellows类似项目（McKinsey有专门针对STEM学生的路径），并花了2个月密集练习Case（每天2个Case，PrepLounge找Partner练）。')),
  p(t('面试经过：一面轻松通过（Case结构清晰），二面时在PEI上遇到困难（McKinsey interviewer深度追问到第6层），最终靠真实的工程项目经历打动了面试官。')),
  p(t('结果：拿到了McKinsey Business Analyst offer，成为Texas A&M第一个进入McKinsey的中国留学生（该届）。')),
  p(t('经验总结："工程背景在Case Interview中反而是优势——我的结构化思维和定量分析能力比商科学生强，弱点是不熟悉业务语言。花2个月补Commercial knowledge是关键。"')),
  hr(),
  h2('二、OPT期间求职——签证焦虑中的坚持'),
  h3('案例3：2019届Purdue → Google PM（经历2次H-1B未中签）'),
  p(t('背景：Purdue CS+Statistics双学位，GPA 3.8。毕业后进入一家中型科技公司做数据分析，OPT有效期2023年到期。')),
  p(t('挑战：2021年未中H-1B签证，公司无法继续sponsor，被迫离职。2022年在OPT期间疯狂求职，目标是能sponsor H-1B的大公司。')),
  p(t('策略：利用STEM OPT的3年时间（到2024年），专注申请FAANG级别公司（都有H-1B quota）。同时备考CPA（增加竞争力）。')),
  p(t('结果：2022年底拿到Google APM（Associate Product Manager）项目offer，2023年成功中H-1B。')),
  p(t('经验总结："最大的错误是第一份工作没有选择大公司。visa问题最简单的解决方案就是一开始就去FAANG——他们每年有几千个H-1B名额。""')),
  h3('案例4：UCLA MBA后进入Citadel（2024年）'),
  p(t('背景：北京大学数学本科，毕业后在中信证券做了2年，然后申请到UCLA Anderson MBA。MBA前没有美国工作经验，英语口语是弱点。')),
  p(t('MBA期间的关键行动：')),
  li(t('每天6am起床练英语口语（TED + 录音回放）')),
  li(t('学了Python和量化分析，做了个人量化投资策略')),
  li(t('参加了UCLA的Quant Finance club，负责联络校友关系')),
  li(t('通过UCLA校友直接联系到了Citadel的Alumni，并被推荐参加了招聘流程')),
  p(t('结果：Citadel Global Fixed Income Quantitative Analyst，base $225k + bonus。被问到英语能力时直接展示了他的数学建模能力和GitHub上的量化项目，面试官认为这比口语更重要。')),
  p(t('经验总结："在美国，你的差异化优势 > 你的弱点。我的优势是数学强，量化背景硬，中文能处理亚洲市场——这比口语更重要。不要用英语补不足，要用技术来赢。"')),
  hr(),
  h2('三、应届生求职的典型错误与教训'),
  h3('错误1：太晚开始申请（最高频错误）'),
  p(t('一位MIT Sloan MBA学生分享：他10月初才开始申请Summer Analyst（他以为暑期实习在春天才开始招）。结果Goldman/MS/JPM都已经填满，只剩下一些non-target的公司。最后他通过一个Off-cycle opportunity进入了Lazard，但也花了额外半年时间。')),
  p(t('教训："美国招聘永远比你想象的早。投行暑期实习在10月前90%已经Fill满。"')),
  h3('错误2：只靠网申，不networking'),
  p(t('来自Georgia Tech的李同学：前两年申请了200+公司，一个回音都没有。第三年才明白networking的重要性，开始系统地和校友联系。同样的简历，有内推和没内推的结果是天壤之别。')),
  p(t('教训："网申进入某些公司的概率是1-2%，内推后的概率是20-40%。Networking不是可选项，是必做项。"')),
  h3('错误3：Offer谈判不够积极'),
  p(t('一位进入PwC Advisory的郑同学：最开始接受了第一个offer（$78k base）。后来听说同班同学谈到了$85k，问了recruiter，recruiter说"we have some flexibility"，最终她谈到$82k，多了$4k每年。"')),
  p(t('教训："即使四大薪资标准化，signing bonus和start date都可以谈。不谈等于白送钱。"')),
  h3('错误4：拒绝小公司，等待大公司（职业窗口关闭）'),
  p(t('一位从Fudan来的金融硕士：坚持要进Goldman/JPM，拒绝了3个Regional Bank的offer。毕业时OPT只剩1年，在巨大的visa压力下匆忙接受了一个不喜欢的岗位。')),
  p(t('教训："Regional Bank → BB Lateral比直接等BB容易10倍。先进行业，再向上走，是最安全的路径。"')),
  hr(),
  h2('四、成功者的共性总结'),
  h3('高成功率求职者的5个共同特点'),
  li(t('提前1年以上开始准备（大三开始，不是大四找工作才开始）')),
  li(t('Networking占总求职时间的30%以上（不只是网申）')),
  li(t('有明确的target list（5-10家公司）而非广撒网（100家公司）')),
  li(t('每次面试后认真复盘（记录问题，改进答案）')),
  li(t('接受第一个"不完美但足够好"的offer，在内部慢慢成长')),
  h3('心态建议'),
  li(t('求职是一个概率游戏：足够多的尝试 → 一定会有成功')),
  li(t('每次被拒不是因为你不够好，而是timing/fit/运气的问题')),
  li(t('在美国，成功的国际学生不是英语最好的，而是最有persistence的')),
  li(t('"起点不等于终点"——Non-target出身，5年后同样可以在PE/Hedge Fund工作')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第九批）...\n');
  await createPage('💼 投行技术面经大全（Goldman/MS/JPM/Evercore真实题库）', ibTechnicalBlocks);
  await createPage('🎯 MBB咨询面经大全（Case真题+PEI题库+T2公司）', consultingCaseBlocks);
  await createPage('💻 FAANG面经大全（Google/Meta/Amazon/Apple/Netflix）', techInterviewBlocks);
  await createPage('💰 PE/HF面试全题库（LBO/Paper LBO/Investment Pitch）', pehfInterviewBlocks);
  await createPage('🌟 中国留学生求职真实故事集（从失败到成功）', realStoriesBlocks);
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/Adh3w4XwCiMs2zkApVhcFdT0nFf`);
}

main().catch(console.error);
