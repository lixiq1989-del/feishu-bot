/**
 * 美国商科求职知识库 - 深度内容补充（第八批）
 * 四大面试2024版 / MBB出路 / Corporate Finance / 求职全年时间线 / 数量面试题库
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
// 页面1：🏢 四大面试完全手册（2024最新版）
// ============================================================
const big4InterviewBlocks: any[] = [
  p(t('来源：Deloitte/PwC/EY/KPMG官方招聘网站、Glassdoor面试评价（2024年）、Reddit r/Accounting真实面经、Beta Alpha Psi论坛、NASBA报告、综合2024-2025届学生实际经历。', false, true)),
  hr(),
  h2('一、四大招聘时间线（滚动招聘，早申请早拿offer）'),
  h3('暑期实习申请时间线（最关键）'),
  li(t('7-8月：', true), t('申请窗口开放，强烈建议立刻申请——很多位置8-9月已满')),
  li(t('8-10月：', true), t('大多数公司的优先截止日期，过了就看剩余名额')),
  li(t('9-11月：', true), t('校园一轮面试/HireVue')),
  li(t('10-12月：', true), t('Super Day（终面）')),
  li(t('10-1月：', true), t('Offer发出')),
  li(t('6-8月：', true), t('实习进行，时长10周')),
  p(t('关键提醒：四大招聘是严格Rolling制——7月申请的人录取率远高于10月申请，即使portal还开着。很多学生11月才开始申请，此时大多数位置已经填满。')),
  h3('全职申请时间线'),
  li(t('8-9月：全职申请窗口开放')),
  li(t('10-2月：offer发出')),
  li(t('次年9-10月：入职')),
  li(t('转化率：实习生转全职录取率约70-90%，外部直接全职招聘竞争激烈')),
  hr(),
  h2('二、四大面试完整流程（5个阶段）'),
  h3('阶段1：简历+网申筛选'),
  li(t('GPA门槛：大多数办公室要求3.5+，绝对底线3.0；纽约/SF竞争激烈办公室实际更高')),
  li(t('Cover Letter：部分公司/服务线要求，建议准备（200字以内，具体说明why this firm/city）')),
  li(t('ATS关键词：会计专业关键词（GAAP/IFRS/Financial Reporting/Internal Controls/Tax Compliance）')),
  h3('阶段2：Online Assessment（网测）'),
  li(t('Deloitte：认知能力测试（数字推理+逻辑推理），约30-45分钟')),
  li(t('PwC：Korn Ferry评估，包含cognitive assessment + Game-Based Assessment（类Pymetrics）')),
  li(t('EY：SHL风格测试（数字推理+情景判断）')),
  li(t('KPMG：SHL风格测试，要求在第一轮面试前完成')),
  h3('阶段3：HireVue（单向视频面试）'),
  li(t('题目数量：通常3-6道，含4道behavioral + 1-2道situational')),
  li(t('准备时间：每题30秒')),
  li(t('回答时间：通常2-3分钟/题')),
  li(t('AI评分：关键词匹配 + 语音清晰度 + 非语言表达')),
  li(t('重要：所有四大均使用HireVue，是最关键的筛选节点')),
  h3('阶段4：一轮面试（部分公司有）'),
  li(t('时长：30-45分钟，与Recruiter或Senior Associate')),
  li(t('内容：Behavioral + 为什么选这家公司/这个服务线')),
  li(t('形式：有些办公室直接跳过这轮，直接进Super Day')),
  h3('阶段5：Super Day（终面）'),
  li(t('形式：通常2-4轮面试，每轮30-45分钟')),
  li(t('面试官：Manager + Senior Manager + Partner级别')),
  li(t('内容：Behavioral + Technical + Culture Fit')),
  li(t('附加：办公室参观 + 员工午餐（观察你的soft skills）')),
  li(t('Offer时间：Super Day后1-2周')),
  hr(),
  h2('三、各公司文化与面试特点对比'),
  h3('Deloitte'),
  li(t('规模：美国四大最大，员工超15万人')),
  li(t('文化亮点：Deloitte University（DU）——专属培训中心，面试时必须提')),
  li(t('招聘重点：Leadership potential + Deloitte四大价值观（Integrity/Outstanding Value/Commitment/Strength from Diversity）')),
  li(t('特别注意：按城市招聘，不同办公室体验差异大；纽约/SF最难')),
  li(t('国际学生友好度：5颗星，H-1B预算大，大量国际员工')),
  li(t('Deloitte Scholars项目：多元化学生专属，是重要的早期入口')),
  h3('PwC'),
  li(t('文化亮点："The New Equation"战略——Trusted Leadership + Sustained Outcomes')),
  li(t('招聘重点：把公司价值观语言融入答案，显示你研究过这家公司')),
  li(t('特别注意：PwC的在线测评（Korn Ferry）是四大中最难的')),
  li(t('技术强调：数字化能力和数据分析技能备受重视（提及Power BI/Python等）')),
  li(t('PwC Access项目：多元化学生入口，比正式申请早2-3个月')),
  li(t('国际学生友好度：5颗星')),
  h3('EY'),
  li(t('文化亮点："Building a Better Working World"——强调社会影响')),
  li(t('招聘重点：好奇心 + 创新思维 + 包容性（EY Competency Framework）')),
  li(t('特别注意：EY亚裔员工网络（EY Asian Professional Network）非常活跃')),
  li(t('EY Bridges项目：专门针对多元化学生的早期networking项目')),
  li(t('EY Access项目：暑期体验项目，提供"快速通道"申请机会')),
  li(t('国际学生友好度：5颗星，亚裔员工比例最高之一')),
  h3('KPMG'),
  li(t('文化亮点：规模相对小，更"家庭式"团队文化')),
  li(t('招聘重点：KPMG五大价值观（Integrity/Excellence/Courage/Together/For Better）')),
  li(t('特别注意：近年审计质量受PCAOB关注，面试中展示对审计质量的重视是加分项')),
  li(t('KPMG Ignition Center：创新中心，体现技术和创新兴趣')),
  li(t('KPMG Future Diversity Leaders：多元化学生入口')),
  li(t('国际学生友好度：4颗星')),
  hr(),
  h2('四、四大面试真题库（Behavioral）'),
  h3('必准备的通用Behavioral题'),
  li(t('Tell me about yourself / Walk me through your resume. (2分钟版本必背)')),
  li(t('Why Big 4? Why specifically [this firm]? Why this service line?')),
  li(t('Tell me about a time you worked in a team and faced conflict.')),
  li(t('Describe a situation where you had to meet a tight deadline.')),
  li(t('Give an example of when you showed leadership.')),
  li(t('Tell me about a time you made a mistake. How did you handle it?')),
  li(t('Describe a time you had to adapt to a significant change.')),
  li(t('Give an example of when you had to analyze data to solve a problem.')),
  li(t('Tell me about a time you went above and beyond for a client/customer.')),
  li(t('Where do you see yourself in 5 years?')),
  h3('Technical题（按服务线）'),
  p(t('Audit（审计）常考技术题：')),
  li(t('How do the three financial statements connect to each other?')),
  li(t('What is the difference between internal audit and external audit?')),
  li(t('What is materiality and how do auditors determine it?')),
  li(t('What is a going concern opinion? When would auditors issue one?')),
  li(t('What are the key differences between GAAP and IFRS?')),
  li(t('Explain the difference between substantive testing and controls testing.')),
  p(t('Tax（税务）常考技术题：')),
  li(t('What is the difference between tax avoidance and tax evasion?')),
  li(t('Explain deferred tax assets and deferred tax liabilities.')),
  li(t('What is transfer pricing and why does it matter for multinationals?')),
  li(t('Walk me through how corporate income tax is calculated.')),
  p(t('Advisory/Consulting常考技术题：')),
  li(t('Walk me through a DCF analysis step by step.')),
  li(t('What does EBITDA represent and why do analysts use it?')),
  li(t('What is the difference between an asset purchase and a stock purchase in M&A?')),
  li(t('A client\'s profits are declining — how would you diagnose the problem?')),
  hr(),
  h2('五、四大薪资完整数据（2024-2025年）'),
  h3('暑期实习时薪'),
  li(t('Audit/Tax：$32-$38/小时（约合年薪$67k-$79k）')),
  li(t('Advisory/Consulting：$36-$45/小时（约合年薪$75k-$94k）')),
  li(t('FDD/Deals：$36-$42/小时（约合年薪$75k-$87k）')),
  li(t('纽约/SF市场：普遍在上述区间顶端或更高')),
  h3('全职起薪（Associate级别，2024年）'),
  li(t('Audit Associate（全部四大）：$65,000-$75,000 base + $5,000-$10,000 signing bonus')),
  li(t('Tax Associate（全部四大）：$65,000-$75,000 base + $5,000-$10,000 signing bonus')),
  li(t('Advisory/Consulting Associate：$75,000-$90,000 base + $10,000-$15,000 signing bonus')),
  li(t('FDD/Deals Associate：$80,000-$95,000 base + $10,000-$20,000 signing bonus')),
  li(t('Deloitte Consulting S&O（最高）：接近MBB水平，部分$90k-$110k base')),
  h3('后续晋升薪资'),
  li(t('Senior Associate（2-3年）：$90,000-$120,000')),
  li(t('Manager（4-6年）：$120,000-$160,000')),
  li(t('Senior Manager（7-9年）：$160,000-$220,000')),
  li(t('Partner（10年+）：$300,000-$1,000,000+（含利润分成）')),
  hr(),
  h2('六、服务线选择（国际学生视角）'),
  h3('按难度排序（从易到难）'),
  p(t('1. Audit（最容易）：招聘量最大，H-1B支持稳定，CPA路径清晰，推荐作为保底选择')),
  p(t('2. Tax（很容易）：有中美税务条约背景是独特优势，国际税务组对华背景很友好')),
  p(t('3. Risk Advisory（中等）：IT Audit/SOX/内控，技术型，门槛较低')),
  p(t('4. Advisory General（中等偏难）：Management Consulting/Tech Consulting，需要数据技能')),
  p(t('5. Deals/FDD/Valuations（难）：金融背景要求高，强调IB/Finance经历')),
  p(t('6. Strategy Consulting（最难）：Deloitte S&O / PwC Strategy& / EY-Parthenon — 需要Case Interview，与MBB竞争')),
  h3('国际学生特别建议'),
  li(t('申请Tax的国际税务（International Tax）组：中美税务背景是真正的差异化优势')),
  li(t('申请Audit时主动说：你对跨国公司审计感兴趣，强调语言/文化背景价值')),
  li(t('Advisory Digital/Technology组：理工背景国际学生最有竞争力的Advisory入口')),
  li(t('STEM OPT专业：会计+数据分析方向的MAcc/MSA可以认定为STEM，获得3年OPT')),
];

// ============================================================
// 页面2：🚀 咨询出路完整解析（MBB/Big4咨询 After 2-3 Years）
// ============================================================
const consultingExitBlocks: any[] = [
  p(t('来源：Management Consulted调查（1000+MBB离职者）、LinkedIn职业路径追踪、Ex-McKinsey/BCG/Bain博客文章、Reddit r/consulting真实帖子、Harvard Business Review研究。', false, true)),
  hr(),
  h2('一、MBB出路真实数据'),
  h3('McKinsey离职后去向（Management Consulted 2023调查）'),
  li(t('私营企业（Corp Dev/Strategy/Ops）：约35%——最大比例出路')),
  li(t('科技公司（PM/Strategy/BD）：约25%——越来越多人去科技')),
  li(t('创业/自己创业：约15%——McKinsey alumni创业生态极强')),
  li(t('MBA（如果undergraduate直招）：约12%')),
  li(t('PE/VC：约8%——比IB转PE难，但仍有通道')),
  li(t('非营利/政府：约5%')),
  p(t('关键数据：大多数MBB consultant在2-3年后离开（not 10年做到Partner）。"Up-or-Out"文化让这成为常态。')),
  hr(),
  h2('二、主要出路深度解析'),
  h3('出路1：科技公司（最热门方向）'),
  li(t('典型职位：Strategy & Operations / Product Manager / Business Development / Corp Dev')),
  li(t('主要目标公司：Google / Amazon / Meta / Stripe / Airbnb / Uber（最喜欢招McKinsey人）')),
  li(t('薪资对比：科技公司TC通常$250k-$400k，比咨询Senior Consultant高')),
  li(t('入职级别：通常以Senior associate/Manager级别进入，跳过entry level')),
  li(t('吸引力：RSU/equity upside + 相对合理工作时间 + 产品影响力')),
  li(t('MBB人在科技公司最突出的技能：结构化分析 + stakeholder management + 快速学习')),
  h3('出路2：Private Equity（增长型PE/Growth Equity）'),
  li(t('注意：传统buyout PE更偏好IB背景，但Growth Equity和Venture Growth偏好咨询背景')),
  li(t('原因：Growth stage公司需要ops improvement和strategy，这是咨询技能')),
  li(t('代表基金：General Atlantic / Summit Partners / TA Associates / TPG Growth')),
  li(t('时间：通常需要MBA或2-3年咨询经验后再申请')),
  li(t('薪资：Associate $200k-$300k + carry（长期）')),
  h3('出路3：公司战略（Corporate Strategy/Corp Dev）'),
  li(t('典型雇主：财富500强公司的战略部门（Microsoft/Apple/Google等均有独立Strategy团队）')),
  li(t('职位名称：Senior Strategy Manager / Head of Corp Dev / VP of Strategy')),
  li(t('薪资：$150k-$250k（低于PE/科技，但工作生活更平衡）')),
  li(t('吸引力：更稳定，可以深度了解一个行业，职业路径更可预期')),
  li(t('MBB人在Corp Strategy最受欢迎的原因：已经做了很多公司的战略，有广度')),
  h3('出路4：创业（比例在增加）'),
  li(t('数据：McKinsey alumni创立了超过500家venture-backed公司')),
  li(t('典型路径：在MBB学会了如何分析问题 → 发现行业痛点 → 自己创业')),
  li(t('优势：MBB alumni network是巨大的资源（融资/客户/招人）')),
  li(t('中国背景机会：中美两地market insight，部分人回国创业或做跨境业务')),
  h3('出路5：非营利/政府（影响力导向）'),
  li(t('适合真正想做impact的人，薪资明显低于商业出路')),
  li(t('典型机构：Gates Foundation / World Bank / UN / 美国政府政策部门')),
  li(t('MBB alumni网络在这些机构也有影响力')),
  hr(),
  h2('三、Big 4咨询（Deloitte/PwC/EY/KPMG Consulting）出路'),
  h3('Big 4咨询 vs MBB出路差异'),
  li(t('MBB Brand：更强，在PE/科技公司中认可度更高')),
  li(t('Big 4咨询Brand：在公司战略、Corp Dev、行业专家领域认可度高')),
  li(t('Deloitte S&O出路：接近MBB，可以转到科技公司Strategy/PE')),
  li(t('PwC Strategy&出路：类似，但Brand稍弱于MBB')),
  h3('Big 4咨询常见出路'),
  li(t('目标公司：Fortune 500公司的战略/运营部门')),
  li(t('行业专家路径：在特定行业（Healthcare/FS/Government）深耕，成为SME')),
  li(t('创业：Big 4咨询alumni创业比例也在上升')),
  li(t('转MBB（困难但可能）：有人做Big 4咨询2-3年后成功转到MBB，通常需要MBA过渡')),
  hr(),
  h2('四、如何在咨询工作期间规划出路'),
  h3('第1年：建立基础+探索方向'),
  li(t('把每个Project当作exploration——哪个行业/职能你最感兴趣？')),
  li(t('与每个项目的客户建立真实关系（他们是你未来最好的employer）')),
  li(t('参加内部Knowledge网络，了解公司哪个Practice Group最有价值')),
  h3('第2年：锁定目标+开始networking'),
  li(t('确定你的"故事"：我从咨询学到了什么？我想去哪个方向？')),
  li(t('在LinkedIn上主动分享行业洞察（增加外部可见度）')),
  li(t('参加行业会议，认识目标公司的人')),
  li(t('开始与headhunter建立联系')),
  h3('第3年：主动出击'),
  li(t('在"Up-or-Out"压力到来前主动跳槽，不要等被推出')),
  li(t('利用Manager/Engagement的关系让客户直接招你')),
  li(t('"Spin out"项目：很多咨询project直接催生了startup机会')),
  h3('对中国背景顾问的特别建议'),
  li(t('明确你的差异化价值：中美两地市场理解 + 双语能力 + 科技行业洞察')),
  li(t('目标科技公司中有大量China Business需求（TikTok/Shein/中国出海公司）')),
  li(t('在咨询期间积累的中国企业客户关系是独特的长期资产')),
];

// ============================================================
// 页面3：🏦 Corporate Finance / FP&A 职业路径（Fortune 500）
// ============================================================
const corpFinanceBlocks: any[] = [
  p(t('来源：Glassdoor Financial Analyst薪资数据、Reddit r/FinancialCareers CF/FP&A讨论、CFO Alliance报告、Association for Financial Professionals (AFP) 年度调查、LinkedIn职位数据分析。', false, true)),
  hr(),
  h2('一、Corporate Finance概览（vs IB的核心区别）'),
  h3('关键差异对比'),
  li(t('IB：', true), t('帮外部客户做交易，项目制，工时极高，高压短周期')),
  li(t('Corp Finance：', true), t('公司内部财务部门，长期经营导向，工作生活更平衡')),
  li(t('IB薪资：', true), t('高但集中在基础薪资+年终奖')),
  li(t('Corp Finance薪资：', true), t('中等，但RSU/401k匹配通常更好，稳定性高')),
  li(t('IB出路：', true), t('PE/HF/MBA，每2年要做决策')),
  li(t('Corp Finance出路：', true), t('内部晋升到VP/CFO，或转到更大公司')),
  h3('Corp Finance岗位类型'),
  li(t('FP&A（Financial Planning & Analysis）：', true), t('预算/预测/业务分析，CFO直属最重要部门')),
  li(t('Corporate Development（Corp Dev）：', true), t('M&A/战略合并，公司内部投行')),
  li(t('Treasury（资金管理）：', true), t('现金管理/外汇/债务')),
  li(t('Investor Relations（IR）：', true), t('与华尔街沟通，发布财报')),
  li(t('Accounting & Controllership：', true), t('财务报告，CPA必须')),
  hr(),
  h2('二、FP&A深度解析（最主流入口）'),
  h3('FP&A的工作内容'),
  li(t('Annual Budgeting Process：每年Q3-Q4做来年预算，是最密集的工作节点')),
  li(t('Monthly/Quarterly Forecasting：滚动预测，与实际业绩对比分析')),
  li(t('Business Partnering：支持各Business Unit的财务决策')),
  li(t('Management Reporting：制作给CFO/CEO/Board的财务报告')),
  li(t('Ad Hoc Analysis：各种临时性财务分析，支持战略决策')),
  h3('FP&A工作时间现实'),
  li(t('正常周：45-55小时，远低于IB')),
  li(t('Earnings Season（季报前后）：60-65小时，1周左右')),
  li(t('Budget Season（Q3-Q4）：55-65小时，持续2-3个月')),
  li(t('总体而言：比IB好得多，但不是"朝九晚五"')),
  h3('FP&A薪资数据（2024年）'),
  li(t('Financial Analyst（Entry）：$65,000-$85,000 base + 10-15% bonus')),
  li(t('Senior Financial Analyst：$85,000-$110,000 base + 15-20% bonus')),
  li(t('Finance Manager：$110,000-$150,000 base + 20-25% bonus')),
  li(t('Director of Finance/FP&A：$150,000-$220,000 base + 25-35% bonus + RSU')),
  li(t('VP of Finance：$200,000-$300,000 total comp + RSU')),
  li(t('CFO（大公司）：$500,000-$2,000,000+ total comp')),
  hr(),
  h2('三、Corporate Development（Corp Dev）深度解析'),
  h3('Corp Dev是什么'),
  li(t('公司内部的"Investment Banking" + "Strategic Planning"团队')),
  li(t('主要工作：寻找收购目标 → 尽职调查 → 谈判 → 整合')),
  li(t('目标公司：Apple/Google/Amazon/Microsoft等科技巨头的Corp Dev是最顶级的')),
  h3('进入Corp Dev的路径'),
  li(t('最主流路径1：IB 2年 + MBA → Corp Dev Associate')),
  li(t('最主流路径2：Big 4 FDD/Valuations → Corp Dev')),
  li(t('路径3：MBB Consulting → Corp Dev（在科技公司特别常见）')),
  li(t('时间线：通常在有2-4年相关经验后申请')),
  h3('Corp Dev薪资（2024年）'),
  li(t('Associate（初级）：$100,000-$130,000 base + $20,000-$40,000 bonus')),
  li(t('Manager：$130,000-$170,000 base + $40,000-$70,000 bonus + RSU')),
  li(t('Director：$170,000-$230,000 base + $80,000-$120,000 bonus + RSU')),
  li(t('VP/Head of Corp Dev（大型科技公司）：$300,000-$600,000 total comp')),
  hr(),
  h2('四、Treasury（资金管理）职业路径'),
  h3('Treasury的工作内容'),
  li(t('Cash Management：管理公司日常现金流，确保流动性')),
  li(t('FX Risk Management：跨国公司管理汇率风险（hedging）')),
  li(t('Debt Capital Markets：与投行合作发行债券/获得信贷额度')),
  li(t('Capital Allocation：决定如何使用现金（股票回购/股息/收购）')),
  li(t('关联证书：Certified Treasury Professional（CTP），Treasury领域的CPA')),
  h3('Treasury薪资'),
  li(t('Treasury Analyst（Entry）：$65,000-$80,000')),
  li(t('Senior Treasury Analyst：$80,000-$100,000')),
  li(t('Treasury Manager：$100,000-$140,000')),
  li(t('Treasurer（大公司）：$200,000-$400,000+')),
  hr(),
  h2('五、Corp Finance求职技巧'),
  h3('简历关键词（Corp Finance专用）'),
  li(t('FP&A：Financial Modeling / Variance Analysis / Budget / Forecast / EBITDA / KPI Dashboard')),
  li(t('Corp Dev：M&A / Due Diligence / Valuation / DCF / LBO / Deal Sourcing / Integration')),
  li(t('Treasury：Cash Management / Hedging / FX / Capital Markets / Debt Covenants')),
  h3('必备工具技能'),
  li(t('Excel（高级）：必须，Pivot Table/VLOOKUP/Data Table/Macro')),
  li(t('SAP/Oracle/NetSuite：ERP系统经验，简历上写出来')),
  li(t('Hyperion/Anaplan/Workday：FP&A专用工具，越来越多公司要求')),
  li(t('Power BI/Tableau：数据可视化，FP&A越来越需要')),
  li(t('SQL：数据分析用，科技公司Finance角色必须')),
  h3('面试常见问题'),
  li(t('Walk me through a time you built a financial model from scratch.')),
  li(t('How do you prioritize competing deadlines during budget season?')),
  li(t('Give an example of an insight you found in data that influenced a business decision.')),
  li(t('How would you explain a budget variance to a non-finance business partner?')),
  li(t('What KPIs would you track for an e-commerce business? Why those?')),
];

// ============================================================
// 页面4：📅 美国求职全年时间线（大一到毕业完整版）
// ============================================================
const recruitingTimelineBlocks: any[] = [
  p(t('来源：Top Consulting Group、华尔街各大行官方Recruiting Calendar、MBA Admissions Committee数据、多所美国大学Career Center时间线整合，综合给中国留学生的完整路径图。', false, true)),
  hr(),
  h2('一、总体节奏：美国求职的独特之处'),
  h3('与中国求职的三大差异'),
  li(t('提前量极大：大三就要申请大四的实习/工作，比中国早1年')),
  li(t('关系驱动：Networking占成功因素的30-50%，不只是简历')),
  li(t('Rolling制：很多机会先申先得，不等截止日期')),
  hr(),
  h2('二、四年时间线详细版'),
  h3('大一（Freshman Year）'),
  li(t('秋季（9-12月）：熟悉校园，加入Career Center/Finance Club/Consulting Club/Beta Alpha Psi')),
  li(t('重点：建立GPA基础（前两年GPA最重要），建立社交基础')),
  li(t('行动：参加所有大行的Info Session（即使大一没资格申请，也让Recruiter认识你）')),
  li(t('冬/春季（1-4月）：开始LinkedIn，目标：500+connections')),
  li(t('暑假（6-8月）：任何相关实习（小公司/本地银行/research助理均可）')),
  h3('大二（Sophomore Year）'),
  li(t('秋季（9-10月）：', true), t('参加Sophomore Diversity Programs（Goldman/JPMorgan/McKinsey都有大二多元化项目）')),
  li(t('秋季重点：', true), t('开始与学长学姐coffee chat，了解不同行业实习的区别')),
  li(t('秋季（10-11月）：', true), t('申请大三暑假实习（部分大公司提前一年招）')),
  li(t('春季（1-3月）：', true), t('如果秋季没有锁定，继续申请大三暑假实习')),
  li(t('暑假（6-8月）：', true), t('第一个目标行业实习（BB/EB/MBB/四大）')),
  h3('大三（Junior Year）——最关键的一年'),
  p(t('这是整个大学期间最关键的一年。大三暑假实习 = 毕业全职offer。')),
  li(t('秋季（8-9月）：', true), t('简历完全准备好，开始申请暑期实习（Rolling，越早越好！）')),
  li(t('秋季（9-10月）：', true), t('密集Networking（每周5-10个coffee chat）')),
  li(t('秋季（10-12月）：', true), t('IB Superday + 咨询Superday（主要集中这段时间）')),
  li(t('冬季（12-1月）：', true), t('接受offer，慎重考虑；注意exploding offer时间')),
  li(t('春季（1-4月）：', true), t('没有实习的同学继续申请，关注Off-cycle positions')),
  li(t('暑假（6-8月）：', true), t('Summer Analyst Program（这就是你的全职面试！）')),
  h3('大四（Senior Year）'),
  li(t('8-9月（入学第一周）：', true), t('如果暑假实习拿到Return Offer，你已经完成了！')),
  li(t('9-11月：', true), t('没有Return Offer的同学：全力申请Full-time positions')),
  li(t('10-12月：', true), t('四大/咨询全职recruiting窗口')),
  li(t('1-3月：', true), t('仍有机会：Off-cycle recruiting / 部分公司春季招聘')),
  li(t('5-6月：', true), t('毕业，开始工作')),
  hr(),
  h2('三、各行业招聘季精确时间表'),
  h3('投资银行（IBD）'),
  li(t('Super Target校On-campus：大三10-11月（Off-cycle更早开始）')),
  li(t('申请时间：大三8月开放，9-10月截止（很多10月就满了）')),
  li(t('Megabank vs EB：Megabank（JPM/GS/MS）更structured时间线；EB更灵活')),
  li(t('关键：不要等11月才申请，应该8月一开放就提交')),
  h3('咨询公司（MBB/T2）'),
  li(t('McKinsey/BCG/Bain：秋季10-11月是主要窗口')),
  li(t('Deloitte/PwC/EY/KPMG咨询：7-10月（更早，rolling）')),
  li(t('Case Interview准备：需要2-3个月专项训练，8月就要开始')),
  li(t('关键：Case Interview不是临时抱佛脚能过的，提前准备')),
  h3('四大会计师事务所'),
  li(t('最早：7月开放申请（Deloitte/PwC尤其早）')),
  li(t('重要：8月 > 9月 > 10月 > 11月，越早越好')),
  li(t('注意：很多同学等到秋季开学（9月）才申请，已经晚了')),
  h3('科技公司（Google/Meta/Amazon等）'),
  li(t('SWE/PM/DS：9-10月开放，但有些岗位全年招聘')),
  li(t('Amazon SDE OA：在申请后立刻发，需要快速完成')),
  li(t('Google/Meta：10-12月是主要Interview窗口')),
  li(t('特点：科技公司没有统一时间线，全年都有机会，Off-cycle较多')),
  h3('MBA申请（如果计划读MBA）'),
  li(t('工作2-4年后申请（最佳时机）')),
  li(t('Round 1截止：10月上旬（录取率最高，强烈推荐）')),
  li(t('Round 2截止：1月上旬（申请人最多，竞争最激烈）')),
  li(t('GMAT备考：提前12-18个月开始')),
  li(t('目标GMAT分数：710+（旧版）/ 635+（Focus Edition）才有竞争力')),
  hr(),
  h2('四、求职关键里程碑清单'),
  h3('在申请季之前必须完成'),
  li(t('LinkedIn Profile达到All-Star状态')),
  li(t('简历精简到1页，经历全部量化')),
  li(t('明确1-2个target行业 + 5-10个target公司')),
  li(t('对目标行业的基础知识掌握（能回答"What does an IB Analyst do all day?"）')),
  li(t('至少进行过10次coffee chat，了解内部情况')),
  li(t('有至少1-2个实质性实习经历')),
  h3('申请季中的每周行动'),
  li(t('每周发出5-10个申请（质量重于数量）')),
  li(t('每周进行3-5个networking call')),
  li(t('每周做1次mock interview（找同学或用Big Interview平台）')),
  li(t('跟踪所有申请状态（用Excel或Notion管理application tracker）')),
  h3('常见错误时间表（要避免）'),
  li(t('错误：9月才开始准备简历 → 正确：7月就应该准备好')),
  li(t('错误：11月才申请IB实习 → 正确：8月一开放就申请')),
  li(t('错误：只靠网申，不networking → 正确：networking + 申请并行')),
  li(t('错误：同时申请20个不同行业 → 正确：专注1-2个行业，深度准备')),
];

// ============================================================
// 页面5：🧠 数量/逻辑/市场估算题库（咨询/科技/AM必备）
// ============================================================
const quantInterviewBlocks: any[] = [
  p(t('来源：Victor Cheng (McKinsey前顾问) 市场估算框架、Case In Point (Marc Cosentino) 、Google QUANT面试题库、Reddit r/cscareerquestions、CFA Institute计算题库、真实咨询面试反馈。', false, true)),
  hr(),
  h2('一、市场估算题（Estimation/Guesstimate）框架'),
  h3('核心方法：Top-Down vs Bottom-Up'),
  p(t('Top-Down：从总量出发，逐步缩小')),
  li(t('例：美国网球球拍市场规模 = 美国人口3.3亿 × 打网球的比例(3%) × 每人每年买球拍(0.5) × 平均价格($80) = $3.96亿')),
  p(t('Bottom-Up：从单位出发，逐步放大')),
  li(t('例：纽约市出租车数量 = 曼哈顿上班族数量(100万) × 打车比例(20%) × 平均一次出行时间(20分钟) / 出租车每天工作时间(12小时) ÷ 利用率(75%)')),
  h3('市场估算五步法'),
  li(t('第1步：', true), t('明确问题边界（什么市场？什么地理范围？什么时间段？）')),
  li(t('第2步：', true), t('选择方法（Top-Down or Bottom-Up，以及为什么）')),
  li(t('第3步：', true), t('逐步拆解，每步说出假设')),
  li(t('第4步：', true), t('计算，保持数字整洁（向上取整，避免复杂计算）')),
  li(t('第5步：', true), t('合理性检验（"这个数字感觉对吗？"）')),
  hr(),
  h2('二、经典市场估算题库（30道）'),
  h3('消费品市场'),
  li(t('美国每年卖出多少双跑鞋？（约1.2亿双 / $90亿市场）')),
  li(t('星巴克在美国的年收入大概是多少？（约$19亿，可用门店数×客单价×频次估算）')),
  li(t('麦当劳在美国每天服务多少顾客？（约2500万，从门店数入手）')),
  li(t('美国每年卖出多少辆自行车？（约1500万辆）')),
  li(t('美国宠物食品市场规模？（约$500亿）')),
  h3('科技/数字市场'),
  li(t('Spotify在美国的年收入大概是多少？（从用户数×平均ARPU估算）')),
  li(t('美国每年发送多少封电子邮件？（约2000亿封）')),
  li(t('Google每天处理多少次搜索？（约85亿次）')),
  li(t('Uber在美国每天完成多少次出行？（约1500万次）')),
  li(t('美国网约车市场年规模？（约$600亿）')),
  h3('基础设施/服务市场'),
  li(t('美国有多少加油站？（约14万个）')),
  li(t('纽约市有多少座建筑？（约100万栋）')),
  li(t('美国医院市场年规模？（约$1.2万亿）')),
  li(t('美国每年有多少次飞机起降？（约1600万次）')),
  li(t('美国健身房市场规模？（约$350亿）')),
  h3('面试中的Tricky题目（需要创意）'),
  li(t('如果你要给纽约市的所有窗户清洗，你会收多少钱？（利润导向，不是市场规模）')),
  li(t('地球上有多少颗高尔夫球？（存量概念，vs 每年新增）')),
  li(t('美国有多少钢琴调音师？（利用频次推算需求 → 推供给人数）')),
  li(t('中国有多少辆出租车？（人口×打车比例×出行需求→车辆数）')),
  hr(),
  h2('三、S&T/Quant面试数学题（概率+期望值）'),
  h3('经典概率题'),
  li(t('你掷一枚硬币，正面赢$2，反面输$1，这个游戏期望值是多少？（$0.50）')),
  li(t('两个骰子，掷出7的概率是多少？（6/36 = 1/6 ≈ 16.7%）')),
  li(t('一副52张牌，连续抽到2张A的概率？（4/52 × 3/51 ≈ 0.45%）')),
  li(t('你玩一个游戏：赢了翻倍，输了减半。赢了一次输了一次，你是赚还是亏？（亏25%）')),
  li(t('30人的房间，两人生日相同的概率超过50%吗？（是的，70%以上——生日悖论）')),
  h3('期望值和策略题'),
  li(t('你有3个箱子，1个有$100，2个空的。你选了箱子1，主持人打开箱子3（空）。你换还是不换？（换！概率从1/3提升到2/3）')),
  li(t('你可以选择：确定拿$50，还是50%概率拿$120（或$0）。Risk-neutral如何选？（选后者，期望$60 > $50）')),
  li(t('你买了一个看涨期权（call option），Delta=0.7，股票从$100涨到$102，期权大约涨多少？（$1.40）')),
  h3('Quant面试数列/推理题'),
  li(t('序列：2, 6, 12, 20, 30, ___？（42，规律：n(n+1)）')),
  li(t('序列：1, 1, 2, 3, 5, 8, 13, ___？（21，Fibonacci数列）')),
  li(t('如果你从1数到1000，数字9一共出现多少次？（300次）')),
  li(t('一栋100层楼，你有2个鸡蛋，如何用最少的次数找到鸡蛋不碎的最高楼层？（14次，动态规划思路）')),
  hr(),
  h2('四、数据分析面试题（DS/BA岗位）'),
  h3('SQL类题目（必考）'),
  li(t('找出每个用户最近一次购买记录（需要用ROW_NUMBER()或MAX()）')),
  li(t('计算7天滚动平均活跃用户数（需要用窗口函数 + DATE_SUB）')),
  li(t('找出连续3天登录的用户（需要用LAG()函数和self-join）')),
  li(t('AB测试结果表，找出每个实验组的conversion rate，并判断是否显著（需要统计基础）')),
  h3('产品指标类题目（PM/BA必考）'),
  li(t('DAU突然下降30%，如何分析原因？（分层分析：地区/设备/用户群/功能模块）')),
  li(t('如何定义"用户活跃度"？你会选什么指标？（DAU/MAU比率/Session Length/Feature Adoption）')),
  li(t('设计一个实验来测试新功能是否改善了用户留存。（说明sample size/duration/metric/success criteria）')),
  li(t('你的核心metric是Conversion Rate，但它突然升了10%。好事还是坏事？如何判断？（需要检查潜在的负面信号）')),
  h3('统计/ML基础题'),
  li(t('解释p-value和Type I/Type II Error的区别')),
  li(t('过拟合（overfitting）是什么？如何解决？（正则化/dropout/更多数据）')),
  li(t('Precision vs Recall的取舍在什么场景下更重要？（医疗诊断 vs 垃圾邮件过滤）')),
  li(t('解释Random Forest的工作原理和与单一决策树的区别')),
  li(t('什么是A/B测试中的Sample Ratio Mismatch？如何检测？')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第八批）...\n');
  await createPage('🏢 四大面试完全手册（2024最新版，Deloitte/PwC/EY/KPMG）', big4InterviewBlocks);
  await createPage('🚀 咨询出路完整解析（MBB/Big4 After 2-3 Years）', consultingExitBlocks);
  await createPage('🏦 Corporate Finance / FP&A 职业路径（Fortune 500）', corpFinanceBlocks);
  await createPage('📅 美国求职全年时间线（大一到毕业完整版）', recruitingTimelineBlocks);
  await createPage('🧠 数量/逻辑/估算/数据面试题库（咨询/科技/AM必备）', quantInterviewBlocks);
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/Adh3w4XwCiMs2zkApVhcFdT0nFf`);
}

main().catch(console.error);
