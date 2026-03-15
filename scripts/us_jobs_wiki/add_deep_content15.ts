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
// 页面1：📈 股权研究/Equity Research深度面经（真实题库+Pitch攻略）
// ============================================================
const equityResearchInterviewBlocks: any[] = [
  p(t('来源：Wall Street Oasis Equity Research Vault、Breaking Into Wall Street ER Course、Goldman Sachs/Morgan Stanley/JPM研究部门招聘信息、多位ER分析师LinkedIn经验分享，2024年整合。', false, true)),
  hr(),
  h2('一、ER面试全流程'),
  h3('面试结构（通常4-5轮）'),
  li(t('Phone Screen：基础金融知识（20-30分钟），会计/估值基础题')),
  li(t('Technical Interview：深度财务建模、估值方法、行业知识（1-2小时）')),
  li(t('Stock Pitch：你的一个股票推荐（15-20分钟展示+问答，最关键！）')),
  li(t('Senior Analyst面试：行业深度、观点辩护、Working style（30-45分钟）')),
  li(t('Culture/Fit Interview：HR或其他团队成员（15-30分钟）')),
  h3('与IB面试的核心区别'),
  li(t('ER更注重：投资观点、行业深度知识、独立判断力、写作能力')),
  li(t('IB更注重：建模技能、交易执行、团队协作、金融产品知识')),
  li(t('ER面试官会主动挑战你的观点——这是测试你是否能defend你的研究')),
  hr(),
  h2('二、技术面试题真题库'),
  h3('会计和财务基础题'),
  li(t('"如果折旧增加$100，三张财务报表如何变化？"')),
  li(t('答：Income Statement：EBIT-100→净利润-66（假设33%税率）；Cash Flow：折旧是non-cash加回+100→经营现金流+34净增；Balance Sheet：资产（PP&E-100）、留存收益-66保持平衡')),
  li(t('"什么是EBITDA，为什么有用，它的局限性是什么？"')),
  li(t('答：EBITDA=息税折旧摊销前利润，代理企业经营现金流能力；局限：忽略资本支出（CapEx）、营运资本变化、杠杆效应，不同行业可比性有限')),
  li(t('"P/E ratio是什么，什么时候不适合用？"')),
  li(t('答：股价/每股收益；不适合：亏损公司（负EPS）、周期性行业底部（EPS虚低）、不同资本结构公司间对比')),
  h3('估值方法题'),
  li(t('"DCF的缺点是什么？"')),
  li(t('答：对终值假设极其敏感（Terminal Value占总价值70-80%）；折现率（WACC）计算主观性强；预测期越长误差越大；不适合无稳定现金流的早期公司')),
  li(t('"什么时候用EV/EBITDA而不是P/E？"')),
  li(t('答：比较不同资本结构公司（EV/EBITDA剔除杠杆影响）；亏损但EBITDA为正的公司；资本密集型行业（折旧大）')),
  li(t('"解释WACC并举例说明如何计算。"')),
  li(t('答：WACC=Ke×[E/(D+E)] + Kd×(1-T)×[D/(D+E)]；Ke=Rf+β×ERP（CAPM）；Kd=借贷利率×（1-税率）')),
  h3('行业估值倍数题（常考）'),
  li(t('银行：P/Book Value、P/TBV（有形账面价值）、P/E')),
  li(t('科技SaaS：EV/ARR（Annual Recurring Revenue）、EV/NTM Revenue、P/FCF')),
  li(t('零售：EV/EBITDA、EV/Sales、P/FCF')),
  li(t('房地产/REIT：P/FFO（Funds From Operations）、NAV Discount/Premium')),
  li(t('能源：EV/EBITDAX（X=勘探）、EV/Proven Reserves')),
  hr(),
  h2('三、Stock Pitch框架（最重要！）'),
  h3('Buy Recommendation结构（15-20分钟）'),
  li(t('1. Summary（30秒）：一句话推荐理由+目标价+潜在上涨空间（"Buy X at $50, TP $75, 50% upside"）')),
  li(t('2. Business Overview（2分钟）：公司做什么，主要业务分部，近期业绩')),
  li(t('3. Investment Thesis（5分钟）：3个核心投资逻辑（Catalyst驱动）')),
  li(t('4. Valuation（3分钟）：你的估值方法和目标价计算')),
  li(t('5. Risks（2分钟）：主要下行风险和你为什么仍然看多')),
  li(t('6. Catalysts（2分钟）：未来3-12个月会发生什么推动股价？')),
  h3('投资论点（Investment Thesis）如何构建'),
  li(t('好的Thesis要有："市场先生错在哪里？"（Market misunderstands X）')),
  li(t('Structural Thesis：行业结构性变化（如AI成本下降）使该公司受益')),
  li(t('Catalyst Thesis：特定事件（新产品发布/收购/监管政策）将推动重新定价')),
  li(t('Mispricing Thesis：市场在某个指标上定价错误（如隐含的churn rate假设过于悲观）')),
  h3('目标价计算方法'),
  li(t('DCF法：WACC 8-10%，Terminal Growth 2-3%，算出内在价值')),
  li(t('Comparable Company法：找5-10家同行，取EV/EBITDA或P/E中位数×你对目标公司的预测')),
  li(t('Sum of Parts法：分拆多业务公司，分别估值再加总')),
  h3('面试官常见质疑题和应对'),
  li(t('"你的主要风险是什么？"→提前准备3个实质性风险，并解释为什么这些不会推翻你的论点')),
  li(t('"如果这个Catalyst没发生，你还会持有吗？"→展示你有基础面支撑，Catalyst只是加速器')),
  li(t('"市场已经price in了X，你凭什么认为还有上涨空间？"→用数据证明市场在某个假设上是错的')),
  hr(),
  h2('四、行业模型建立要点'),
  h3('科技/SaaS公司模型'),
  li(t('关键驱动：ARR增长率、Net Revenue Retention（NRR）、Customer Acquisition Cost（CAC）、LTV')),
  li(t('好的SaaS：NRR>110%（老客户自然扩张）、CAC Payback Period<18个月')),
  li(t('估值：EV/NTM Revenue，成长型SaaS通常10-30x，成熟型5-10x')),
  h3('消费/零售公司模型'),
  li(t('关键驱动：Same-Store Sales Growth（SSS）、New Store Count、EBITDA Margin')),
  li(t('餐饮特殊指标：AUV（Average Unit Volume）、四墙EBITDA（Four-Wall EBITDA）')),
  li(t('估值：EV/EBITDA，快餐（McD）12-15x，快休闲（Shake Shack）25-35x')),
  h3('金融公司模型'),
  li(t('银行：Net Interest Margin（NIM）、Efficiency Ratio、NPL Ratio、ROE、ROA')),
  li(t('保险：Combined Ratio（<100%为盈利）、Investment Income、Book Value')),
  li(t('资管（Asset Management）：AUM增长、Fee Rate、Net Flows、Margins')),
];

// ============================================================
// 页面2：🌱 ESG/可持续金融职业路径（2024年最新机会）
// ============================================================
const esgCareerBlocks: any[] = [
  p(t('来源：MSCI ESG Research、Bloomberg Intelligence ESG报告、CFA Institute ESG Certificate指南、Harvard Kennedy School ESG Leadership论文、Glassdoor ESG职位薪资，2024年。', false, true)),
  hr(),
  h2('一、ESG就业市场现状（2024实情）'),
  h3('规模和趋势'),
  li(t('ESG相关资产：全球$30万亿+（虽然增速放缓但规模庞大）')),
  li(t('就业需求：ESG分析师职位2023年同比增加24%（LinkedIn就业数据）')),
  li(t('转变：从纯粹"社会责任"转向监管合规驱动（SEC气候披露规则、IFRS S1/S2）')),
  h3('2024年现实：ESG就业的喜与忧'),
  li(t('利好：SEC强制气候披露要求大量合规人才；欧盟SFDR/CSRD要求在美运营欧资机构增加ESG人手')),
  li(t('挑战：美国政治阻力（"反ESG"州立法）部分机构放缓ESG招聘')),
  li(t('最稳定：ESG评级、数据、咨询（比资管ESG岗位更稳定）')),
  h3('哪些机构最在招ESG人才'),
  li(t('ESG数据/评级公司：MSCI ESG Research、Sustainalytics（晨星旗下）、ISS ESG、Moody\'s ESG Solutions')),
  li(t('咨询公司：BCG Center for Climate and Sustainability、McKinsey Sustainability、Deloitte Sustainability')),
  li(t('大型资管：BlackRock Sustainable Investing、Vanguard ESG Team、State Street ESG')),
  li(t('投行ESG/Sustainability：Goldman Sachs Sustainability、JPM Center for Carbon Transition')),
  hr(),
  h2('二、ESG行业核心职位详解'),
  h3('ESG Research Analyst（评级公司）'),
  li(t('工作内容：为上市公司撰写ESG评分报告，分析温室气体排放、公司治理、社会影响')),
  li(t('技能要求：行业知识+定量分析+报告写作，CFA ESG Certificate加分')),
  li(t('薪资：$65-90k（初级），$100-150k（高级），低于传统金融但工时合理')),
  li(t('代表公司：MSCI、Sustainalytics、ISS、Vigeo Eiris、RepRisk')),
  h3('ESG Integration Analyst（资管/投资端）'),
  li(t('工作内容：将ESG因子整合到投资组合分析中，评估ESG风险对Alpha的影响')),
  li(t('与传统ER区别：不是替代财务分析，而是在财务分析上叠加E/S/G维度')),
  li(t('技能要求：投资分析基础+ESG监管框架（TCFD、SFDR、GRI）+气候模型')),
  li(t('代表机构：CalPERS Sustainable Investment、Calvert Research、Parnassus Investments')),
  h3('Sustainability Consultant（咨询）'),
  li(t('工作内容：帮企业制定碳中和路径、ESG披露策略、供应链可持续性改造')),
  li(t('客户：Fortune 500企业（零售/食品/制造/能源）以及私募投资组合公司')),
  li(t('薪资：MBB Sustainability Practice（McKinsey Center for Sustainability）：$110-140k base（MBA）')),
  li(t('非MBB咨询：$70-100k，比传统咨询低但工时更合理')),
  hr(),
  h2('三、核心框架和认证'),
  h3('必知监管框架'),
  li(t('TCFD（Task Force on Climate-related Financial Disclosures）：气候披露4大支柱：治理/策略/风险管理/指标')),
  li(t('GRI（Global Reporting Initiative）：最广泛使用的ESG报告框架')),
  li(t('SASB（Sustainability Accounting Standards Board）：行业特定的可持续性会计标准')),
  li(t('SEC气候披露规则（2024）：要求大型上市公司披露Scope 1/2排放及气候风险')),
  li(t('SFDR（EU Sustainable Finance Disclosure Regulation）：在欧盟销售基金必须分类（Article 6/8/9）')),
  h3('推荐认证'),
  li(t('CFA ESG Certificate：CFA Institute推出，含6个模块，约100小时学习，通过率约70%')),
  li(t('SASB FSA Credential：Fundamentals of Sustainability Accounting，聚焦行业特定ESG会计')),
  li(t('GARP SCR（Sustainability and Climate Risk）：风险管理角度的气候/可持续性认证')),
  li(t('CDP Training：碳披露项目（CDP）的官方培训，对碳会计有帮助')),
  hr(),
  h2('四、求职策略'),
  h3('简历和背景建议'),
  li(t('技术背景+金融知识+ESG：这个组合最稀缺，工程/环境科学背景转ESG金融很有竞争力')),
  li(t('量化证明：在简历上体现你做了什么具体ESG分析（如："分析了X公司Scope 1-3排放，发现Y风险..."）')),
  li(t('Thesis/Research Paper：如果有ESG相关毕业论文，是非常强的差异化展示')),
  h3('进入路径'),
  li(t('直接申请ESG评级公司：MSCI/Sustainalytics招大量初级分析师，不需要IB经验')),
  li(t('从传统金融转：在IB/ER/咨询做1-2年后转ESG专注方向，薪资更高起点')),
  li(t('ESG数据平台：Bloomberg ESG Data、Refinitiv ESG、FactSet Sustainability也在招')),
  li(t('非盈利/NGO路径：CDP、CERES、Rocky Mountain Institute——工资低但积累顶级行业人脉')),
];

// ============================================================
// 页面3：🎪 校园招聘On-Campus完全策略（Career Fair/Info Session/Campus Interview）
// ============================================================
const onCampusRecruitingBlocks: any[] = [
  p(t('来源：Princeton Career Services博客、Wharton MBA Career Management报告、多位BB/MBB校招成功者LinkedIn分享、Reddit r/cscareerquestions校招版块，2024年整合。', false, true)),
  hr(),
  h2('一、On-Campus Recruiting（OCR）完全时间线'),
  h3('投行/咨询Summer Analyst（大三招聘）'),
  li(t('大二暑假（6-8月）：参加Sophomore Explorer Program（高盛、摩根、麦肯锡等的大二体验项目）')),
  li(t('大三开学（9月）：OCR正式开始，公司Info Session、Career Fair、Coffee Chats密集启动')),
  li(t('9-10月：网上申请开放（通常同一时间开放，要提前关注），简历截止通常在10月初')),
  li(t('10-11月：First Round Interviews（Super Day前筛选）')),
  li(t('11-12月：Super Day（终轮面试，通常1天内完成所有轮次）')),
  li(t('12月-1月：Offer发放，通常有2-4周的Decision Deadline')),
  h3('科技公司SWE/PM实习（大三/大四招聘）'),
  li(t('9月：Google/Meta/Amazon早期开放申请（Rolling Basis）')),
  li(t('10月-12月：大多数科技公司申请截止')),
  li(t('11月-2月：电话/视频面试')),
  li(t('12月-3月：Offer陆续发放')),
  li(t('注意：科技公司申请越早越好（Headcount先到先得）')),
  hr(),
  h2('二、Info Session（信息宣讲会）策略'),
  h3('参加Info Session的真实目的'),
  li(t('不是为了学信息（网上都能查到）——是为了让Recruiter记住你的脸和名字')),
  li(t('目标：在Q&A时问一个好问题，然后After Session主动找Recruiter/Employee名片')),
  li(t('非目标校学生：Info Session经常向所有学生开放，这是你进入Pipeline的机会')),
  h3('提问策略（让你被记住）'),
  li(t('避免可以Google到的问题："Your deal flow for this year was..."（无聊）')),
  li(t('好问题示例："How has [recent industry trend] changed how your team evaluates opportunities?"')),
  li(t('好问题示例："What\'s the most challenging part of transitioning from [your past role] to your current team?"')),
  li(t('好问题示例："What differentiates the analysts who thrive in your group from those who struggle?"')),
  h3('Session结束后的动作'),
  li(t('立刻走向演讲嘉宾/Recruiter（在人群dispersed之前）')),
  li(t('自我介绍：姓名+学校+专业+一句为什么对他们感兴趣')),
  li(t('拿到名片或者LinkedIn地址')),
  li(t('24小时内发LinkedIn Request+感谢邮件（提及具体聊了什么）')),
  hr(),
  h2('三、Career Fair攻略'),
  h3('Career Fair前的准备'),
  li(t('研究目标公司：知道他们的核心业务、最近新闻、当前招聘职位——不能说"我对贵公司感兴趣，你们主要做什么？"')),
  li(t('准备30秒Elevator Pitch：姓名+学校+年级+专业+为什么对这家公司感兴趣+你能带来什么')),
  li(t('准备简历：对每家公司定制化（如果时间允许），至少打印10份以上')),
  li(t('着装：Business Professional（投行/咨询）或Business Casual（科技/咨询）')),
  h3('Career Fair现场策略'),
  li(t('先去非第一志愿的公司练手：用来练Pitch，调整到最佳状态')),
  li(t('最理想时机：开始后30分钟、快结束前30分钟（Recruiter更有时间聊）')),
  li(t('每次对话后记笔记：聊了什么、谁的名片、承诺了什么follow-up行动')),
  li(t('时间控制：每个摊位3-5分钟，不要占用太久让别人等')),
  h3('Career Fair后跟进'),
  li(t('当天晚上：给所有聊过的人发LinkedIn/邮件（趁他们还记得你）')),
  li(t('内容：提及具体聊了什么，表达真诚兴趣，附上简历')),
  li(t('后续：如果有给你名片，后续网申时在cover letter里提到"met at [School] Career Fair"')),
  hr(),
  h2('四、OCR面试特殊技巧'),
  h3('Super Day攻略（终轮面试）'),
  li(t('Super Day通常一天内进行4-6轮面试（投行）或2-3轮（咨询）')),
  li(t('前晚准备：把所有STAR故事、技术知识、公司研究再过一遍，早睡早起')),
  li(t('态度：每一轮都当作第一轮，保持能量和热情（面试官会交流反馈）')),
  li(t('中间休息：补水、回顾要点，不要和其他候选人讨论面试题（你们是竞争关系）')),
  li(t('Lunch/Dinner轮：看似casual但仍然是评估，保持专业，不要说competitor坏话')),
  h3('非目标校学生OCR替代策略'),
  li(t('申请"Target School"公司的Off-Campus Diversity Program')),
  li(t('参加公司Virtual Info Session（通常向非目标校开放）')),
  li(t('校友关系：学校MBA/学长里在目标公司的人，通过他们referral进入On-Campus Pipeline')),
  li(t('直接冷邮件给Recruiter："I noticed you\'re recruiting at [Target Schools]. I\'m interested in applying for the same role..."')),
];

// ============================================================
// 页面4：💰 美国薪资谈判全攻略（Offer Negotiation进阶版）
// ============================================================
const salaryNegotiationBlocks: any[] = [
  p(t('来源：Levels.fyi薪资数据库、Glassdoor Negotiation指南、Harvard Business Review薪资谈判研究、Reddit r/cscareerquestions和r/financialcareers经验帖、前HR招聘官访谈，2024年整合。', false, true)),
  hr(),
  h2('一、薪资谈判的核心心理学'),
  h3('为什么大多数人不谈判（并因此损失$）'),
  li(t('误区1："他们可能撤回offer" — 极少发生，公司已经投入大量时间筛选你')),
  li(t('误区2："我还是实习生/新人，没资格谈" — 错，每个层级都可以谈')),
  li(t('误区3："我不知道市场价，谈了怕报价太高" — 先研究市场价再谈')),
  li(t('数据：Fidelity 2023调研：87%谈判成功的人至少成功争取到部分提升')),
  h3('谈判的基本逻辑'),
  li(t('公司的目标：以市场价±合理范围雇到你——他们有预算空间')),
  li(t('你的筹码：你已经有offer（证明了价值），谈判只是确定价格')),
  li(t('谈判不是对抗：是双方找到都满意的安排，保持collaborative语气')),
  hr(),
  h2('二、金融行业谈判策略（IB/PE/AM）'),
  h3('Base Salary谈判'),
  li(t('IB Base是高度标准化的（街道级别固定）——不要浪费精力在Base上')),
  li(t('可以谈的：Signing Bonus（签约奖金）、Relocation Package、Start Date')),
  li(t('Signing Bonus谈法：轻描淡写提及有竞争offer，不要激进逼迫')),
  h3('PE/HF（较灵活）'),
  li(t('Carry的谈判：入职时确认carry allocation的timing和vesting schedule')),
  li(t('了解bonus历史：问"What was the bonus range for someone at my level last year?"')),
  li(t('第一年通常没有谈判空间，但可以谈定期review时间（6个月而不是12个月）')),
  h3('具体话术模板'),
  p(t('"Thank you so much for the offer—I\'m genuinely excited about this opportunity. I\'ve done some research on market compensation for this role, and based on [Levels.fyi/Glassdoor/competing offers], I was hoping we could discuss the total package. Is there flexibility around [specific component]?"')),
  p(t('"I have another offer at [$X] that I need to respond to by [date]. I\'m significantly more interested in this role—is there anything you can do to close the gap?"')),
  hr(),
  h2('三、科技公司谈判（最有空间！）'),
  h3('科技公司薪资结构'),
  li(t('Base（固定）：通常有上限（同级别相差不超过15-20%）')),
  li(t('Stock（RSU/Options）：最大谈判空间！可能差别2-3倍')),
  li(t('Signing Bonus：短期弥补差距的工具，公司更愿意给（不算fixed cost）')),
  li(t('Performance Bonus：通常有target %，实际发放看公司/个人表现')),
  h3('有效谈判需要的信息'),
  li(t('当前市场数据：Levels.fyi（最准确）、Glassdoor、Blind（科技公司非常活跃）')),
  li(t('竞争offer：真实或隐性的竞争offer是最强筹码（必须真实，谎称会损害信任）')),
  li(t('内部数据：同职级同事（朋友告诉你的）是最直接的比较')),
  h3('谈判剧本（科技PM/SWE）'),
  li(t('第一步：表达热情，确认真心想要这个offer')),
  li(t('第二步：说出期望，给出具体数字（不要说"competitive"，要说"$X total comp"）')),
  li(t('第三步：等待——沉默是你的朋友，不要自己填补沉默')),
  li(t('第四步：如果对方counter，评估后接受/继续谈/有礼貌地decline')),
  h3('RSU谈判特别技巧'),
  li(t('要求更多Stock而不是更多Cash（对公司的会计成本更低，他们更愿意给）')),
  li(t('"Can you add another $X in RSU to close the gap with my other offer?"')),
  li(t('了解vesting schedule：标准4年（25%/年）vs 更快vesting是重要差异')),
  hr(),
  h2('四、反向谈判：如何要求加薪（在职时）'),
  h3('最佳时机'),
  li(t('刚完成重大项目（impact最明显的时候）')),
  li(t('年终绩效评估之前（把高绩效转化为谈判筹码）')),
  li(t('有competing offer在手（最强筹码，但要准备好真的离开）')),
  li(t('公司股价/业绩好的时候（财务压力小，批准更容易）')),
  h3('会话结构'),
  p(t('第一步："I\'d like to schedule some time to discuss my compensation—I have some data I\'d like to share."（预约专门对话）')),
  p(t('第二步：展示market data（Levels.fyi/Glassdoor）+"My current comp is $X, market for this role is $Y-Z"')),
  p(t('第三步：展示你的contribution（Brag Doc里的成就清单）')),
  p(t('第四步：提出具体数字，给经理思考时间（"I hope we can revisit this by [date]"）')),
  h3('如果对方说不'),
  li(t('"I understand—when would be a good time to revisit this?" → 把拒绝变成下次谈判的铺垫')),
  li(t('问："What would I need to achieve in the next 6 months to support a raise?" → 把条件具体化')),
  li(t('如果长期没有进展：认真考虑外部市场，competing offer是最有效的催化剂')),
];

// ============================================================
// 页面5：🚀 中国学生非传统路径（创业/小公司/政府/非盈利）
// ============================================================
const alternativePathBlocks: any[] = [
  p(t('来源：美国移民律师博客（关于H-1B自雇规定）、SBA.gov小企业统计、GovLoop政府求职指南、Idealist非盈利求职平台、多位走非传统路径的中国学生经验整理，2024年。', false, true)),
  hr(),
  h2('一、为什么考虑非传统路径'),
  h3('传统路径的竞争现实'),
  li(t('IB SA职位：录取率1-3%，非目标校更低，签证限制更多')),
  li(t('大厂SWE：每年申请者数百万，录取率<1%')),
  li(t('现实：大多数人不会走传统顶级路径，但有很多其他优秀路径')),
  h3('非传统路径的真实机会'),
  li(t('创业：自主雇佣可以免除H-1B抽签（用O-1/EB-1签证路径）')),
  li(t('中小企业：H-1B赞助率比大公司低，但竞争也低很多')),
  li(t('政府工作：联邦政府的某些职位对非公民开放，且不需要H-1B')),
  li(t('非盈利：签证友好，且有独特职业发展和社会影响力')),
  hr(),
  h2('二、创业路径（Startup & Self-Employment）'),
  h3('创业的签证选择'),
  li(t('O-1A签证（杰出能力）：需要证明你在领域内有杰出成就（奖项/出版/高薪/判断角色）')),
  li(t('EB-1A（杰出成就绿卡）：无需雇主担保，自己申请，证明标准与O-1相似但更高')),
  li(t('EB-2 NIW（国家利益豁免）：证明你的工作有全国性重要意义，也无需雇主担保')),
  li(t('International Entrepreneur Parole（IEP）：创业者假释计划，需要美国风险投资背书')),
  h3('创业成功路径'),
  li(t('YC Combinator：最顶级加速器，每年2期，每次~200家团队，$500k标准条款投资')),
  li(t('Techstars：全球性加速器网络，$120k投资换6%股份，非常适合初期团队')),
  li(t('University Incubators：很多大学有学生创业项目（MIT$15k, Stanford StartX等）')),
  li(t('专注方向：中美跨境电商、AI工具、面向华人社区的垂直应用——你有天然优势')),
  h3('从小公司开始的策略'),
  li(t('Seed/Series A startup（50-200人）：通常比大公司更容易进，成长和学习速度更快')),
  li(t('H-1B赞助：很多startup只要有资金（Series A以上）就愿意赞助，可直接在申请时确认')),
  li(t('提前了解：公司是否有赞助H-1B历史（myvisajobs.com）')),
  hr(),
  h2('三、联邦政府职位（Federal Government Jobs）'),
  h3('中国学生能申请的政府职位'),
  li(t('大多数联邦政府职位要求美国公民，但有例外')),
  li(t('可以申请的机构（非公民友好）：世界银行、IMF、美洲开发银行、联合国驻美机构')),
  li(t('美国政府例外：某些非安全敏感职位，绿卡持有者可以申请（如NIH、NSF等研究机构）')),
  h3('国际组织职位（对外国人开放）'),
  li(t('世界银行Young Professionals Program：全球开放，强调发展中国家背景优先')),
  li(t('IMF Economist Program：需要经济学PhD，对中国学生有明显机会')),
  li(t('Asian Development Bank：招大量亚裔专业人才，北京/马尼拉双总部')),
  li(t('UNDP/UNICEF/WHO联合国机构：纽约日内瓦为主，硕士+工作经验')),
  h3('政府相关智库（Think Tank）'),
  li(t('Brookings Institution、Peterson Institute for International Economics——接受非公民研究员')),
  li(t('RAND Corporation：主要做国防/政策研究，部分职位接受非公民')),
  li(t('中美关系智库：Asia Society、US-China Business Council——中国背景是核心优势')),
  hr(),
  h2('四、非盈利/社会影响力路径'),
  h3('非盈利行业概况'),
  li(t('美国501(c)(3)组织：约150万个，覆盖教育、医疗、环境、社区发展等领域')),
  li(t('签证友好：很多非盈利愿意赞助H-1B（有些有专门的非盈利H-1B配额外名额）')),
  li(t('薪资：通常比私营低20-30%，但有独特职业发展和impact机会')),
  h3('高薪非盈利组织（别误解非盈利=低薪）'),
  li(t('大型医院/医疗系统（Mayo Clinic、Kaiser Permanente）：技术职位薪资接近私营')),
  li(t('大学和研究机构：研究分析师、数据科学家职位薪资具有竞争力')),
  li(t('Gates Foundation：全球最大私人基金会，分析师职位薪资市场化')),
  li(t('Nature Conservancy、WWF等大型环境NGO：专业职位薪资合理')),
  h3('面向中国学生的专属机会'),
  li(t('美中关系全国委员会（NCUSCR）：连接美中两国的非盈利，招bilingual专业人士')),
  li(t('中文学校和文化机构：在美华人社区机构，中文是核心要求，可赞助签证')),
  li(t('China-focused研究中心：各大学的China Studies中心，研究助理/项目管理职位')),
  h3('非盈利求职平台'),
  li(t('Idealist.org：最大的非盈利求职平台，可以筛选签证赞助意愿')),
  li(t('Bridgespan Group：非盈利管理咨询，出路极好（麦肯锡顾问做完去做Bridgespan）')),
  li(t('LinkedIn：搜索"nonprofit"+"visa sponsorship"可以精确筛选')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十五批）...');

  await createPage('📈 股权研究ER深度面经（真实题库+Stock Pitch攻略）', equityResearchInterviewBlocks);
  await createPage('🌱 ESG/可持续金融职业路径（2024年最新机会）', esgCareerBlocks);
  await createPage('🎪 校园招聘OCR完全策略（Career Fair/Info Session攻略）', onCampusRecruitingBlocks);
  await createPage('💰 美国薪资谈判全攻略（从Offer到在职加薪）', salaryNegotiationBlocks);
  await createPage('🚀 中国学生非传统路径（创业/政府/非盈利/国际组织）', alternativePathBlocks);

  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
