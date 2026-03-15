import * as fs from 'fs';
import * as https from 'https';

const SPACE_ID = '7615700879567506381';
const PARENT_NODE_TOKEN = 'Adh3w4XwCiMs2zkApVhcFdT0nFf';
const DOMAIN = 'open.feishu.cn';
const LINK_DOMAIN = 'hcn2vc1r2jus.feishu.cn';

function getToken(): string {
  const raw = fs.readFileSync('/Users/simon/startup-7steps/.feishu-user-token.json', 'utf-8');
  return JSON.parse(raw).access_token;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function api(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: DOMAIN,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve(d); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function t(text: string, bold = false, italic = false): any {
  return { text_run: { content: text, text_element_style: { bold, italic } } };
}
function p(...elements: any[]): any { return { block_type: 2, text: { elements, style: {} } }; }
function h2(text: string): any { return { block_type: 4, text: { elements: [t(text, true)], style: {} } }; }
function h3(text: string): any { return { block_type: 5, text: { elements: [t(text, true)], style: {} } }; }
function li(...elements: any[]): any { return { block_type: 12, text: { elements, style: {} } }; }
function hr(): any { return { block_type: 22 }; }

async function writeBlocks(docToken: string, blocks: any[]) {
  const chunkSize = 50;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const res = await api('POST', `/open-apis/docx/v1/documents/${docToken}/blocks/${docToken}/children`, {
      children: chunk,
      index: i,
    });
    if (res.code !== 0) {
      console.log(`  ❌ block写入失败: ${res.code} ${res.msg}`);
    }
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
  if (r.code !== 0) {
    console.log(`  ❌ 创建失败: ${r.code} ${r.msg}`);
    return null;
  }
  const nodeToken = r.data?.node?.node_token;
  const objToken = r.data?.node?.obj_token;
  console.log(`  node_token: ${nodeToken}`);
  await sleep(600);
  await writeBlocks(objToken, blocks);
  const url = `https://${LINK_DOMAIN}/wiki/${nodeToken}`;
  console.log(`  ✅ ${url}`);
  return url;
}

// ============================================================
// 页面1：🏦 商业银行/零售银行/信贷职业路径（Commercial & Retail Banking）
// ============================================================
const commercialBankingBlocks: any[] = [
  p(t('来源：JPMorgan Chase、Wells Fargo、Bank of America官方职业页面，WSO商业银行板块，Glassdoor商业银行SA评价，CFA Institute信贷分析课程，2024年整合。', false, true)),
  hr(),
  h2('一、商业银行 vs 投资银行：核心区别'),
  h3('商业银行（Commercial Banking）'),
  li(t('本质：给企业/个人提供贷款、存款、现金管理等传统银行服务')),
  li(t('工作对象：中小企业（SME）、中型企业（Middle Market）、大型企业（Corporate）')),
  li(t('主要产品：Term Loan、Revolving Credit、SBA Loan、Treasury Services、Trade Finance')),
  li(t('工作节奏：相对IB更规律，工作生活平衡好，工作时间通常50-60小时/周')),
  h3('投资银行 vs 商业银行 对比表'),
  li(t('薪资：IB > Commercial Bank（IB SA $110k，Commercial Bank SA $65-85k）')),
  li(t('工时：IB 80-100h/周 vs Commercial Bank 50-60h/周')),
  li(t('技能：IB（M&A建模/估值）vs Commercial（信贷分析/关系管理）')),
  li(t('出路：IB→PE/Corp Dev；Commercial→Corporate Banking升级/信贷基金/CRE')),
  li(t('签证友好度：Commercial Banking转正率高，部分银行愿意赞助H-1B（Chase、BofA、Wells Fargo）')),
  hr(),
  h2('二、商业银行主要职业轨道'),
  h3('1. Corporate Banking（大企业银行）'),
  li(t('服务对象：年收入$500M+的大型企业')),
  li(t('产品：Syndicated Loans、Revolving Credit Facility、Cash Management、FX Hedging')),
  li(t('特点：与IB联动密切，大型银行Corporate Banking和IB经常联合覆盖客户')),
  li(t('就业：JPM、Citi、BofA、Wells Fargo、HSBC都有大型CB部门')),
  h3('2. Middle Market Banking'),
  li(t('服务对象：年收入$10M-$500M的中型企业')),
  li(t('产品：商业贷款、设备融资、信用证、现金管理')),
  li(t('特点：关系管理为核心，分析师主要做信贷备忘录（Credit Memo）和财务分析')),
  li(t('代表机构：BMO、Fifth Third、PNC、KeyBank、Regions Bank')),
  h3('3. Real Estate Banking（商业地产贷款）'),
  li(t('产品：Construction Loan、Bridge Loan、CMBS（商业地产证券化）、Mezzanine Debt')),
  li(t('服务对象：房地产开发商、REIT、私募地产基金')),
  li(t('特点：与REPE联动，出路可以走REPE、债权基金、CMBS团队')),
  h3('4. SBA/Community Banking'),
  li(t('SBA Loan：政府担保贷款，帮小企业（常见：华人餐饮/零售）融资')),
  li(t('薪资低于大银行，但本地关系管理经验丰富')),
  hr(),
  h2('三、日常工作详解：信贷分析师（Credit Analyst）'),
  h3('核心工作'),
  li(t('信贷备忘录（Credit Memo）：分析借款人财务状况，评估还款能力，写贷款审批报告')),
  li(t('财务分析：3-5年历史财报分析，DSCR（偿债覆盖率）、LTV（贷款价值比）计算')),
  li(t('行业分析：所在行业的风险、竞争格局、周期性分析')),
  li(t('信贷监控：已放贷款的贷后管理，定期财务报告审阅')),
  h3('关键指标和财务比率'),
  li(t('DSCR（Debt Service Coverage Ratio）：EBITDA / Annual Debt Service，通常要求>1.25x')),
  li(t('Leverage Ratio：Total Debt / EBITDA，通常要求<4-5x')),
  li(t('Current Ratio：流动资产/流动负债，通常要求>1.2x')),
  li(t('LTV（Loan-to-Value）：贷款额/抵押品价值，通常要求<75-80%')),
  li(t('Interest Coverage：EBIT / Interest Expense，通常要求>3x')),
  hr(),
  h2('四、求职策略（针对中国学生）'),
  h3('目标公司和项目'),
  li(t('JPMorgan Commercial Banking SA：全美最大商业银行部门，每年招大量SA')),
  li(t('Wells Fargo Commercial Banking Analyst Program：重视关系，对中国学生相对友好')),
  li(t('Bank of America Global Commercial Banking：集团招募，跨product rotation')),
  li(t('HSBC Commercial Banking：对亚裔/亚洲业务有特别需求，中文能力是加分项')),
  li(t('East West Bank：专注亚裔社区，中文是竞争优势！总部LA')),
  h3('面试准备重点'),
  li(t('为什么是Commercial Banking而不是IB？诚实答案：工作生活平衡、关系建立、长期信贷兴趣')),
  li(t('"带我读一遍这家公司的财报"：练习快速看Income Statement、Balance Sheet、Cash Flow')),
  li(t('信贷知识：DSCR、LTV、5 Cs of Credit（Character、Capacity、Capital、Conditions、Collateral）')),
  li(t('行业问题：商业银行面试常问特定行业（如零售、制造业）的信贷风险')),
  h3('简历关键词'),
  li(t('Financial Statement Analysis、Credit Analysis、DCF Valuation')),
  li(t('Credit Memo、Loan Underwriting、Risk Assessment')),
  li(t('Portfolio Management、Covenant Monitoring、Industry Research')),
];

// ============================================================
// 页面2：🎯 产品经理（PM）完整求职攻略（Product Sense + Execution面试）
// ============================================================
const pmInterviewBlocks: any[] = [
  p(t('来源：Exponent PM课程（成功率统计）、Lenny\'s Newsletter（Lenny Rachitsky，前Airbnb PM）、Jackie Bavaro《Cracking the PM Interview》、Reddit r/productmanagement真实面经，FAANG PM招聘官LinkedIn分享，2024年整合。', false, true)),
  hr(),
  h2('一、PM面试结构全景图'),
  h3('FAANG PM面试轮次（通常4-5轮）'),
  li(t('Product Sense/Design（产品设计）：考察你设计产品的思路')),
  li(t('Analytical（数据分析）：指标分析、数据解读、A/B Test设计')),
  li(t('Execution（执行）：优先级排序、路线图规划、与工程师合作')),
  li(t('Strategy（战略）：市场进入、新产品机会、竞争分析')),
  li(t('Leadership/Behavioral：冲突管理、失败经历、跨团队合作')),
  h3('各公司PM面试风格差异'),
  li(t('Google：重分析和数据，大量指标问题和SQL能力测试，Culture Fit非常重要')),
  li(t('Meta：非常注重Product Sense，Facebook自己的产品深度理解必须，"Impact > process"')),
  li(t('Amazon：Leadership Principles贯穿每一轮，14条LP必须每条都有故事，Mechanism思维')),
  li(t('Apple：用户体验哲学，设计细节敏感度，"Simplicity is the ultimate sophistication"')),
  li(t('Microsoft：偏重成熟产品改进，系统思维，Growth和竞争分析多')),
  hr(),
  h2('二、Product Sense面试框架（最重要！）'),
  h3('产品设计题万能框架（CIRCLES改进版）'),
  p(t('步骤：1.澄清问题→2.确定用户→3.用户需求→4.解决方案→5.优先级→6.成功指标')),
  h3('Step 1：澄清问题（Clarification）'),
  li(t('问清楚：为什么要做这个产品？目标是什么？范围是什么？')),
  li(t('示例问题："Is this an entirely new product or an improvement to existing one?"')),
  li(t('"What\'s the primary business goal—growth, engagement, or monetization?"')),
  h3('Step 2：用户分析（User Segmentation）'),
  li(t('按行为分段：轻度/重度用户、新用户/老用户、B端/C端')),
  li(t('选择重点用户："I\'m going to focus on [X] because they represent the most valuable/underserved segment"')),
  li(t('构建用户画像：人口统计+使用场景+动机+痛点')),
  h3('Step 3：用户痛点和需求'),
  li(t('用用户旅程地图：把用户完成某任务的每个步骤列出来，在哪步有痛点？')),
  li(t('区分需求层次：功能需求（我需要能做X）vs 情感需求（我想感到Y）')),
  li(t('"What are the top 3 pain points of [user segment] when trying to [goal]?"')),
  h3('Step 4：生成解决方案'),
  li(t('先发散（3-5个方案），再收敛（选最好的2个深入）')),
  li(t('每个方案要有：功能描述、解决哪个痛点、实现难度估计')),
  li(t('避免只想到自己公司的产品，也要考虑生态系统整合')),
  h3('Step 5：优先级（最考验判断力）'),
  li(t('优先级框架：影响力（Impact）/ 可行性（Feasibility）/ 战略匹配度（Strategic fit）')),
  li(t('明确说出权衡："I\'m prioritizing X over Y because..."')),
  li(t('考虑：短期收益 vs 长期价值、用户价值 vs 商业价值')),
  h3('Step 6：成功指标'),
  li(t('North Star Metric：最能反映用户价值的单一指标（如DAU、GMV、NPS）')),
  li(t('护栏指标（Guardrail Metrics）：防止优化北极星时伤害其他方面')),
  li(t('分层：Acquisition→Activation→Retention→Revenue→Referral（AARRR）')),
  hr(),
  h2('三、Analytical面试题真题详解'),
  h3('指标下降分析题（A/B Test变种）'),
  p(t('经典题："Facebook DAU下降10%，原因是什么，你怎么调查？"')),
  li(t('第一步：确认数据可靠性——是否是数据采集问题？仪器/SDK bug？')),
  li(t('第二步：时间分析——什么时候开始下降？是否与某个发布/事件相关？')),
  li(t('第三步：分解拆分——按地区/平台/用户类型/功能拆分，哪个维度下降最多？')),
  li(t('第四步：内外部原因——产品变更？竞品攻势？市场/季节性？政策？')),
  li(t('第五步：验证假设——如何设计实验验证你的假设？')),
  h3('A/B Test题'),
  p(t('经典题："如何测试新的推荐算法是否有效？"')),
  li(t('实验设计：随机分组（Treatment/Control），确保分组balance')),
  li(t('样本量计算：基于最小检测效应量（MDE）、显著性水平（α=0.05）、统计功效（80%）')),
  li(t('指标选择：Primary metric、Guardrail metrics、Debug metrics')),
  li(t('分析：统计显著性检验（t-test、chi-square）、置信区间解读')),
  li(t('常见陷阱：Novelty effect、Network effect泄漏、Simpson\'s Paradox')),
  hr(),
  h2('四、Amazon Leadership Principles（14条必背）'),
  h3('最高频考查的LP（FAANG PM面试通用）'),
  li(t('Customer Obsession："Tell me about a time you went above and beyond for customers."')),
  li(t('Bias for Action："Describe a situation where you had to make a decision quickly without all the info."')),
  li(t('Dive Deep："Tell me about a time you used data to solve a problem."')),
  li(t('Deliver Results："What\'s the most impactful project you\'ve shipped and how did you measure success?"')),
  li(t('Ownership："Tell me about a time you took ownership of something outside your responsibility."')),
  li(t('Invent and Simplify："Describe a time you simplified a complex process or product."')),
  h3('STAR方法精华技巧'),
  li(t('Situation：简短（2-3句），不要超过30秒')),
  li(t('Task：你的具体职责，不要说"我们团队"，说"我负责X"')),
  li(t('Action：最重要，占70%时间，说3-4个具体行动和决策逻辑')),
  li(t('Result：必须量化（提升20%、节省$500k、DAU增加100k），没有数字就造不出好故事')),
  hr(),
  h2('五、PM求职实战策略'),
  h3('APM（Associate PM）项目申请'),
  li(t('Google APM：最著名的PM培训项目，全美竞争最激烈，需要强烈产品sense + CS背景')),
  li(t('Meta RPM（Rotational PM）：3次rotation，覆盖3个产品团队，技术背景偏重')),
  li(t('Microsoft PM Explore：专门为大二大三学生，技术+PM双轨')),
  li(t('LinkedIn PM Rotational：LinkedIn内部培训项目，B2B产品为主')),
  li(t('Uber APM、Airbnb RPM、Lyft PM Intern：科技独角兽PM项目')),
  h3('中国学生特别建议'),
  li(t('用你对中国科技产品（微信/抖音/滴滴）的深度了解回答产品问题——这是真实竞争优势')),
  li(t('技术背景很重要：CS/工程背景比商科背景更容易进FAANG PM岗')),
  li(t('side project：做一个个人产品项目（App/增长experiment），展示真实产品能力')),
  li(t('用户研究经验：哪怕是做的学生项目里的用户调研，也要包含在简历中')),
];

// ============================================================
// 页面3：⚠️ 风险管理职业路径（Market Risk/Credit Risk/Operational Risk）
// ============================================================
const riskMgmtBlocks: any[] = [
  p(t('来源：GARP（全球风险管理协会）FRM考纲、Goldman Sachs/JPMorgan风险部门LinkedIn帖子、Glassdoor风险分析师评价、Investopedia Risk Management专题，2024年整合。', false, true)),
  hr(),
  h2('一、风险管理行业概览'),
  h3('为什么选择Risk Management'),
  li(t('薪资合理（Associate：$120-180k total），工作生活平衡好于IB')),
  li(t('H-1B赞助：大银行风险部门通常赞助签证（监管要求下H-1B配额不受限）')),
  li(t('职业稳定：银行业周期波动中，Risk部门反而更稳定（监管驱动需求）')),
  li(t('晋升通道清晰：Analyst→Associate→VP→MD，路径比买方更标准化')),
  h3('三大风险类型和职位'),
  li(t('市场风险（Market Risk）：监控交易账本的市场风险敞口，计算VaR/ES，压力测试')),
  li(t('信用风险（Credit Risk）：贷款/债券的违约风险分析，对手方风险，评级模型')),
  li(t('操作风险（Operational Risk）：系统故障、欺诈、人为错误、合规违规的风险管理')),
  hr(),
  h2('二、市场风险（Market Risk）详解'),
  h3('日常工作'),
  li(t('VaR（Value at Risk）计算：用历史/蒙特卡洛/参数法计算每日风险敞口')),
  li(t('Greeks监控：Delta/Gamma/Vega/Theta对整个交易账本的汇总分析')),
  li(t('压力测试：模拟历史极端情景（2008金融危机、2020新冠暴跌）对组合的影响')),
  li(t('限额管理：监控交易员是否在VaR/Greeks限额内，超限时escalate')),
  li(t('监管报告：Basel III/IV要求的每日/每月风险报告')),
  h3('核心概念必须掌握'),
  li(t('VaR（Value at Risk）：在给定置信水平（95%/99%）和持有期（1天/10天）下，最大可能损失')),
  li(t('ES（Expected Shortfall）：超过VaR部分的平均损失，比VaR更能反映尾部风险')),
  li(t('Greeks：Delta（方向风险）、Gamma（Delta变化速度）、Vega（波动率敏感度）')),
  li(t('Basis Risk：两个相关资产之间的风险敞口不完全抵消')),
  li(t('Concentration Risk：集中在单一资产/行业/地区的风险')),
  hr(),
  h2('三、信用风险（Credit Risk）详解'),
  h3('日常工作'),
  li(t('对手方信用评估：衍生品交易对手的信用分析（CCR：Counterparty Credit Risk）')),
  li(t('CVA（Credit Valuation Adjustment）：因对手方违约风险对衍生品价值的调整')),
  li(t('PD/LGD/EAD建模：违约概率、违约损失率、违约时敞口的统计模型开发')),
  li(t('信用组合分析：贷款/债券组合的相关性、集中度、预期损失/非预期损失')),
  h3('核心指标'),
  li(t('PD（Probability of Default）：借款人在特定时期内违约的概率')),
  li(t('LGD（Loss Given Default）：违约发生后实际损失比例（1 - Recovery Rate）')),
  li(t('EAD（Exposure at Default）：违约时的风险敞口金额')),
  li(t('Expected Loss = PD × LGD × EAD')),
  li(t('RAROC（Risk-Adjusted Return on Capital）：调整风险后的资本回报率，用于定价和业绩评估')),
  hr(),
  h2('四、FRM考证详细攻略'),
  h3('FRM简介'),
  li(t('由GARP颁发，全球最认可的风险管理认证')),
  li(t('两级：FRM Part I（基础）+ Part II（应用），通常12-18个月完成')),
  li(t('Part I通过率约46%，Part II约59%（难度不低）')),
  li(t('考试费用：$550-$800（早鸟/正价）')),
  h3('Part I考试内容（四个模块）'),
  li(t('Foundations of Risk Management：20%，风险管理基础和金融危机分析')),
  li(t('Quantitative Analysis：20%，统计、回归、时间序列、蒙特卡洛')),
  li(t('Financial Markets and Products：30%，衍生品定价、固定收益、外汇')),
  li(t('Valuation and Risk Models：30%，VaR、信用风险模型、压力测试')),
  h3('Part II考试内容（五个模块）'),
  li(t('Market Risk Measurement and Management：25%')),
  li(t('Credit Risk Measurement and Management：25%')),
  li(t('Operational Risk and Resilience：25%')),
  li(t('Liquidity and Treasury Risk：15%')),
  li(t('Risk Management and Investment Management：10%')),
  h3('备考策略（3-6个月）'),
  li(t('Bionic Turtle（BT）：最好的FRM第三方备考资料，题库质量最高')),
  li(t('Schweser FRM Notes：官方指定提供商，知识框架清晰')),
  li(t('时间分配：题库练习>看书，尤其Part II要大量做真题')),
  li(t('对中国学生：数学/统计模块（QA）是优势，但Financial Markets and Products需要额外努力')),
  hr(),
  h2('五、求职路径和薪资数据'),
  h3('主要雇主'),
  li(t('大型银行风险部门：JPM Risk、Goldman Sachs Market Risk、Citi Risk Analytics、BofA Global Risk')),
  li(t('监管机构：美联储（Fed）、OCC、CFTC、SEC都有大量风险分析师职位')),
  li(t('风险咨询：Oliver Wyman、McKinsey Risk Practice、EY/KPMG/Deloitte/PwC金融风险')),
  li(t('评级机构：Moody\'s、S&P Global（信用风险分析师）、Fitch Ratings')),
  h3('薪资数据（2024）'),
  li(t('Risk Analyst（0-2年）：$70-100k base')),
  li(t('Risk Associate（2-5年）：$120-160k base + $30-60k bonus')),
  li(t('VP Market Risk（5-10年）：$180-250k base + $100-200k bonus')),
  li(t('MD/Head of Risk：$300k+ base + 大额bonus')),
  li(t('量化风险模型开发（Quant风险）：在以上基础上再高20-30%')),
];

// ============================================================
// 页面4：📝 SOP/Personal Statement写作攻略（金融/咨询/科技方向）
// ============================================================
const sopGuideBlocks: any[] = [
  p(t('来源：Harvard GSD admissions blog、MIT Sloan写作指南、Wharton MBA admissions Q&A、多位MFin/MFE成功申请者经验分享（WSO、Reddit r/gradadmissions），2024年整合。', false, true)),
  hr(),
  h2('一、SOP的核心逻辑：为什么你，为什么这里，为什么现在'),
  h3('三大核心问题'),
  li(t('为什么你（Why You）：你的独特背景/经历/视角如何使你成为理想候选人？')),
  li(t('为什么这个项目（Why Here）：这个项目的什么具体特点吸引你（课程/教授/校友网络）？')),
  li(t('为什么现在（Why Now）：你的职业目标是什么，这个项目如何帮你实现？')),
  h3('中国学生最常见的错误'),
  li(t('错误1：简历式写法——把GPA/实习/奖项列表，没有故事性和反思')),
  li(t('错误2：过度强调"努力"/"勤奋"——美国admissions看重的是impact和leadership，不是努力')),
  li(t('错误3：Copy模板——每所学校的SOP要高度定制化，"I chose Columbia because of its location in NYC"是最差的回答')),
  li(t('错误4：弱化中国背景——你在中国的经历是资产，不要刻意回避或道歉')),
  li(t('错误5：不说清楚职业目标——"I want to work in finance"不够，要具体到什么类型的金融/什么职位')),
  hr(),
  h2('二、MFin/MFE/MS申请SOP写作框架'),
  h3('开头（Hook）：抓住眼球'),
  li(t('用一个具体的故事/场景/问题开头，不要"My name is...I was born in..."')),
  li(t('好的开头示例：描述一个具体的项目经历、数据分析的顿悟时刻、市场事件的观察')),
  li(t('长度：3-4句话，让读者立刻想继续读下去')),
  h3('背景叙述（Background）：讲清楚你的故事'),
  li(t('不要列清单：把3-4个最重要的经历用故事的方式串联起来')),
  li(t('强调你做了什么、为什么做、结果如何——STAR格式但要流畅')),
  li(t('每个经历要有"So what"：这段经历如何推动了你向申请这个项目的方向发展？')),
  h3('职业目标（Goals）：短期和长期'),
  li(t('短期（毕业后1-3年）：具体职位/公司类型/地点——越具体越好（不是"IB"而是"M&A analyst at a bulge bracket in NYC"）')),
  li(t('长期（5-10年）：更宏观的愿景，允许模糊一点，但要与短期目标逻辑一致')),
  li(t('逻辑闭环：你的过去→这个项目→你的目标，三者要形成清晰的因果链')),
  h3('为什么这个项目（Program Fit）：最需要定制化的部分'),
  li(t('研究要深：具体到课程名称（能说出教授名字更好）、研究中心、特定资源')),
  li(t('正确示例："Professor X\'s research on [specific topic] directly aligns with my interest in [Y], and I plan to work as his/her RA"')),
  li(t('错误示例："Your program\'s strong alumni network and excellent career services will help me achieve my goals"（太通用）')),
  h3('结尾：简短有力'),
  li(t('回应开头主题，形成首尾呼应')),
  li(t('表达对项目的真诚热情和信心')),
  li(t('一句话总结：你将为这个项目/班级带来什么独特价值？')),
  hr(),
  h2('三、MBA申请文书（Essay）策略'),
  h3('Wharton MBA Essay 2024'),
  p(t('主题："What do you hope to gain professionally from the Wharton MBA?"（500字）+ "Describe a situation where you were outside of your comfort zone..." （400字）')),
  li(t('Wharton重视：领导力证明（实际影响他人的经历）、明确职业规划、Team-based learning fit')),
  li(t('陷阱：Wharton人特别有"精英感"，文章要confident但不要arrogant')),
  h3('HBS MBA Essay 2024'),
  p(t('主题："As we review your application, what more would you like us to know as we consider your candidacy for the Harvard Business School MBA program?"（900字，开放式）')),
  li(t('HBS重视：以影响他人为中心的领导力（不是个人成就），多元化视角，真实性')),
  li(t('策略：用这篇文章讲一个其他地方没说到的重要故事，或深化已提及的某个主题')),
  h3('Booth MBA Essay 2024'),
  p(t('主题："How will the Booth MBA help you achieve your immediate and long-term post-MBA career goals?"（250字）+ "An MBA is a significant investment of time, money, and energy. Why is getting an MBA the right decision for you at this point in your career, and why Booth?"（250字）')),
  li(t('Booth重视：智识好奇心（Intellectual curiosity）、具体理由选Booth（不是因为排名）')),
  hr(),
  h2('四、推荐信（Letter of Recommendation）策略'),
  h3('选择推荐人的原则'),
  li(t('了解你的工作+能量化你的贡献：不要选"大牛"但不了解你的人')),
  li(t('直接上级最好：直接supervisor的评价比CEO的形式信有效得多')),
  li(t('多元化来源：工作+学术，尽量覆盖不同角度')),
  li(t('提前至少2个月ask：礼貌地给推荐人充足时间')),
  h3('如何帮助推荐人写出好的推荐信'),
  li(t('提供"推荐素材包"：简历、申请文书草稿、2-3个你们合作的具体项目细节')),
  li(t('告诉推荐人你希望他们强调的方面（但不要让他们照着你写的写）')),
  li(t('好的推荐信特征：有具体的量化成就（"top 5% of analysts I\'ve worked with"），有故事，有比较（"better than most"）')),
  h3('中国学生特别注意'),
  li(t('不要让推荐人主要说"他很勤奋/努力"——这是stereotype，不是差异化')),
  li(t('最强的推荐信：说你在某个具体项目中展示了领导力、解决了特定问题、有创造性思维')),
];

// ============================================================
// 页面5：🏢 美国职场文化深度解析（中美职场10大差异避坑指南）
// ============================================================
const workplaceCultureBlocks: any[] = [
  p(t('来源：Harvard Business Review跨文化沟通研究、Erin Meyer《The Culture Map》、《What\'s Your Cultural EQ?》研究报告、Reddit r/ChineseInAmerica真实经历贴、前McKinsey、Goldman、Amazon华人员工访谈整理，2024年。', false, true)),
  hr(),
  h2('一、中美职场文化核心差异矩阵'),
  h3('直接沟通 vs 间接沟通（最大差异）'),
  li(t('中国文化：留面子，暗示不满，不直接拒绝，说"这个可以再看看"其实是否定')),
  li(t('美国文化：直接表达意见，"I disagree because..."是正常的、被鼓励的沟通方式')),
  li(t('坑：美国同事说"That\'s interesting"有时是礼貌否定，要结合语境')),
  li(t('解决方案：主动学习直接表达，把"I think maybe we could consider..."改成"I recommend we do X because Y"')),
  h3('个人表达 vs 集体和谐'),
  li(t('中国：不出头/不露锋芒，团队功劳放在集体')),
  li(t('美国：职场要主动争取credit，"我们做了X"要补充"我具体负责了Y，结果是Z"')),
  li(t('实际影响：年终绩效评估时美国同事会明确说自己的贡献，中国员工往往"默默做好事"被忽视')),
  li(t('解决方案：学会在适当时候说"Just wanted to flag that I led this initiative..."')),
  h3('层级关系 vs 扁平文化'),
  li(t('中国：严格等级，不越级，对上级要表示尊重，不轻易质疑')),
  li(t('美国：可以直接邮件VP甚至SVP，叫上级名字（不用"Director/VP+姓"），可以friendly挑战观点')),
  li(t('坑：不要觉得直接联系高层是"不尊重"，在美国这是proactiveness，是加分的')),
  h3('长期关系 vs 交易关系'),
  li(t('中国：先建立关系再谈业务，饭局/礼物是建立信任的工具')),
  li(t('美国：关系和工作相对分开，可以高效完成交易后再慢慢建立更深个人关系')),
  li(t('Networking在美国：更功利化但更透明，直接说"I\'m looking for opportunities in X, would you know anyone in that field?"是正常的')),
  hr(),
  h2('二、职场沟通10大具体坑（附解决方案）'),
  h3('坑1：会议中太安静'),
  li(t('问题：怕说错/英语不够好→选择沉默→被认为"没有想法"或"不engage"')),
  li(t('解决：提前准备1-2个问题或观点，会议中一定要说话（哪怕只是提问也算）')),
  li(t('话术："I had a thought on [topic]—is this a good time to share?" 或 "Building on what [Name] said..."')),
  h3('坑2：被问"有问题吗"时说没有'),
  li(t('美国文化：提问=聪明好奇，不提问=不感兴趣或没有理解')),
  li(t('准备1-2个提前想好的问题，哪怕不完全相关也要开口')),
  h3('坑3：邮件太正式或太简短'),
  li(t('太正式："Dear Mr. Smith, I am writing to respectfully inquire about..."（不必要的formal）')),
  li(t('太简短：只回复"OK"（显得冷漠）')),
  li(t('适当：用名字，有1句建立rapport（"Hope your week is going well!"），内容清晰简洁，结尾friendly')),
  h3('坑4：避免正面冲突，问题不说'),
  li(t('现象：有disagreement但不说，选择behind the scenes抱怨或被动执行')),
  li(t('美国期望：尽早说出问题，"I have a concern about [X]—can we discuss?"')),
  li(t('后果：不说→项目出问题→你也有责任；说了→被当作有ownership和initiative')),
  h3('坑5：过度道歉'),
  li(t('中国习惯：出错→大量道歉，觉得humble')),
  li(t('美国文化：一次真诚道歉+解决方案，over-apology显得没有confidence')),
  li(t('句式：把"I\'m so sorry for this terrible mistake"改成"I apologize for the delay. Here\'s the updated version and what I\'ll do differently going forward."')),
  h3('坑6：不会接受赞美'),
  li(t('中国式："没有没有，都是运气，同事们帮了很多"')),
  li(t('美国式期望：直接接受，"Thank you, I worked hard on this / I\'m glad it landed well."')),
  li(t('Overly modest在美国：让人觉得你不认可自己的工作，或不相信自己的能力')),
  h3('坑7：时间观念完全不同'),
  li(t('会议：提前5分钟到；绝不迟到（美国职场对时间极度respect）')),
  li(t('截止日期：美国文化中deadline是硬性的，"I\'ll try my best"不是承诺，要说"I can deliver X by Friday"')),
  li(t('邮件回复：一般工作日内回复，超过48小时不回是失礼的')),
  h3('坑8：不会推销自己'),
  li(t('绩效评估：美国是"self-advocacy"文化，你要主动向经理展示你的贡献')),
  li(t('Brag Doc：建议每周记录自己的成就，到年终绩效时有料可写')),
  li(t('话术："I wanted to share an update—this quarter I [specific achievement with numbers]."')),
  h3('坑9：Networking时太功利（尴尬）'),
  li(t('坑：上来就问"我想找X职位，你能帮我内推吗？"')),
  li(t('正确：先建立对话，展示对工作的真诚兴趣，再自然过渡到"我正在探索类似机会..."')),
  h3('坑10：在不该humorous的场合太serious，或不懂美式humor'),
  li(t('美国职场：适度humor是建立rapport的工具（尤其casual conversation、team outing）')),
  li(t('Safe humor类型：自嘲（self-deprecating）、对情境的轻松评论')),
  li(t('避免：涉及政治/种族/性别/宗教的玩笑，哪怕你觉得无害')),
  hr(),
  h2('三、与不同类型上级相处的策略'),
  h3('Micromanager型'),
  li(t('特征：每件事都要汇报，检查细节，不放权')),
  li(t('策略：主动提供frequent updates，这样他们不需要来问你。用"I wanted to proactively share..."开头')),
  h3('Hands-off型'),
  li(t('特征：给你很大自由度，很少check in')),
  li(t('策略：要主动争取方向确认，否则做错方向很难看。每2周主动约1:1')),
  h3('结果导向型（大多数美国经理）'),
  li(t('只关心结果，不管你怎么做')),
  li(t('策略：每次对话以"outcome"为中心，先说结论再说过程')),
  hr(),
  h2('四、晋升加速器：美国职场的"潜规则"'),
  li(t('Visibility：让更高层知道你的工作——参加cross-functional会议、volunteer高visibility项目')),
  li(t('Sponsorship vs Mentorship：Mentor告诉你怎么做，Sponsor在你不在的会议室里为你说话——主动培养sponsor关系')),
  li(t('Executive Communication：能用2分钟给C-suite汇报清楚你的项目，是晋升VP的必备技能')),
  li(t('Network Up：花时间建立与高层的关系，不要只在自己层级horizontal networking')),
  li(t('Brand Building：在公司内部有清晰的"个人品牌"——你是那个做X最好的人吗？')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十四批）...');

  await createPage('🏦 商业银行/零售银行/信贷职业路径（Commercial Banking）', commercialBankingBlocks);
  await createPage('🎯 产品经理PM完整求职攻略（Product Sense + Execution面试）', pmInterviewBlocks);
  await createPage('⚠️ 风险管理职业路径（Market Risk/Credit Risk/FRM考证）', riskMgmtBlocks);
  await createPage('📝 SOP/Personal Statement写作攻略（金融/咨询/MBA方向）', sopGuideBlocks);
  await createPage('🏢 美国职场文化深度解析（中美职场10大差异避坑指南）', workplaceCultureBlocks);

  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
