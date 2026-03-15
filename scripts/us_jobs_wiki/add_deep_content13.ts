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
// 页面1：💳 美国信用体系完全指南（Credit Score从零建立）
// ============================================================
const creditGuideBlocks: any[] = [
  p(t('来源：NerdWallet、Credit Karma官方指南、Experian/TransUnion/Equifax官网、Reddit r/personalfinance置顶帖、MyFICO论坛、The Points Guy，2024年最新信息。', false, true)),
  hr(),
  h2('一、信用分（Credit Score）基础知识'),
  h3('什么是Credit Score'),
  li(t('信用分是评估你还款能力的三位数分数，范围300-850分')),
  li(t('主要评分模型：FICO Score（最常用）和VantageScore')),
  li(t('贷款、租房、甚至部分雇主背调都会查信用分')),
  li(t('美国三大信用局：Experian、Equifax、TransUnion（三家分数可能略有不同）')),
  h3('FICO Score分级'),
  li(t('300-579：Very Poor（很难获得信用卡/贷款）')),
  li(t('580-669：Fair（可以申请，但利率较高）')),
  li(t('670-739：Good（大多数产品都能申请）')),
  li(t('740-799：Very Good（获得优惠利率）')),
  li(t('800-850：Exceptional（最优惠条件）')),
  h3('信用分5大组成要素'),
  li(t('按时还款（Payment History）：', true), t('35% — 最重要！一次逾期可掉50分以上')),
  li(t('信用使用率（Credit Utilization）：', true), t('30% — 信用卡余额/额度，建议保持<30%，最好<10%')),
  li(t('信用历史长度（Length of Credit History）：', true), t('15% — 账户越老越好，不要随意关卡')),
  li(t('信用种类（Credit Mix）：', true), t('10% — 信用卡+贷款组合比单一类型好')),
  li(t('新信用申请（New Credit）：', true), t('10% — 每次Hard Pull会短暂降分5-10分')),
  hr(),
  h2('二、留学生从零建立信用的路径'),
  h3('第一阶段：入门期（0-6个月，没有SSN或刚到美国）'),
  li(t('Secured Credit Card（押金卡）：存$200-500押金作为额度，推荐Discover it Secured、Capital One Secured')),
  li(t('Student Credit Card：无需信用历史，推荐Discover it Student、Capital One SavorOne Student')),
  li(t('信用社（Credit Union）账户：加入学校信用社，更容易获批第一张卡')),
  li(t('成为Authorized User：让有信用历史的朋友/家人把你加为附属卡用户（对方记录会报告到你名下）')),
  li(t('Nova Credit：可将中国信联记录转换为美国信用报告（支持部分银行）')),
  h3('第二阶段：建立期（6-18个月）'),
  li(t('每月按时全额还款（not minimum payment，而是full balance）')),
  li(t('保持utilization <30%：如果额度$1000，余额不超过$300')),
  li(t('设置自动还款：避免忘记导致逾期')),
  li(t('申请第二张卡：6个月后可以申请普通信用卡（Chase Freedom Student等）')),
  li(t('查询免费信用报告：AnnualCreditReport.com每家信用局每年可免费查一次')),
  h3('第三阶段：优化期（18个月+）'),
  li(t('申请Chase Sapphire Preferred：旅行积分大卡，需要670+分')),
  li(t('申请American Express：Amex Gold/Platinum积分系统极强')),
  li(t('Credit Limit Increase：每6-12个月申请提额（软查询不影响分数）')),
  li(t('目标：毕业前达到720+分，能获得汽车贷款、公寓租约优惠利率')),
  hr(),
  h2('三、信用卡推荐详解（留学生角度）'),
  h3('入门卡（无需信用历史）'),
  li(t('Discover it Student Cash Back：5%轮换类别返现，第一年翻倍，无年费，最佳入门卡')),
  li(t('Capital One SavorOne Student：餐饮3%返现，娱乐3%，无年费')),
  li(t('Bank of America Customized Cash Rewards for Students：6%超市返现，无年费')),
  h3('进阶卡（需要670+分数）'),
  li(t('Chase Freedom Unlimited：1.5%无限返现，配合Chase生态极强，无年费')),
  li(t('Chase Sapphire Preferred：$95年费，旅行保险完善，积分价值高（1.25-2.0cpp）')),
  li(t('Citi Double Cash：2%无限返现（1%消费+1%还款），简单粗暴')),
  h3('高端卡（需要720+分数）'),
  li(t('American Express Gold：$250年费，餐饮4x积分，超市4x积分，Amex Offer省钱神器')),
  li(t('Chase Sapphire Reserve：$550年费，旅行全险，机场贵宾厅，每年$300旅行信用')),
  li(t('American Express Platinum：$695年费，机场贵宾厅最全，Centurion Lounge，适合常旅客')),
  h3('信用卡使用原则'),
  li(t('永远按时全额还款——信用卡不是负债工具，是积分工具')),
  li(t('不要超出预算因为有信用卡——心理账户要一样')),
  li(t('利用Sign-up Bonus：新卡开卡奖励通常价值$500-1000')),
  li(t('不要随意关卡：关卡会影响信用历史长度和总额度')),
  hr(),
  h2('四、常见坑和误区'),
  h3('误区1：只付最低还款额（Minimum Payment）'),
  li(t('后果：信用卡利率通常20-30% APR，1000元余额一年利息$200-300')),
  li(t('正确做法：每月全额还清，如果还不上要先停用该卡')),
  h3('误区2：申请太多卡（Card Churning）'),
  li(t('每次申请新卡会Hard Pull，短暂降分')),
  li(t('初期建议：1年内申请不超过2-3张卡')),
  h3('误区3：关闭老卡'),
  li(t('关卡会减少总信用额度，提高utilization ratio')),
  li(t('还会缩短平均信用历史（影响15%）')),
  li(t('如果有年费但不用，可以downgrade到无年费版本')),
  h3('误区4：不查信用报告'),
  li(t('每年用AnnualCreditReport.com查三家报告，确认没有错误信息')),
  li(t('发现错误要及时Dispute（提出异议），信用局必须45天内处理')),
  h3('误区5：用借记卡代替信用卡'),
  li(t('借记卡消费不会建立信用历史')),
  li(t('信用卡有Purchase Protection、Extended Warranty等额外保护')),
  li(t('建议：日常消费用信用卡，每月全额还款，完全等于用借记卡但多了很多好处')),
  hr(),
  h2('五、信用分快速提升技巧'),
  li(t('租房上报：Rent Reporters、Level Credit等服务可以把房租记录上报三大局')),
  li(t('成为Authorized User：最快方式，朋友的老账户加你进去立即有效果')),
  li(t('降低Utilization：还款后马上申请账单截止日前还款，保持余额接近$0')),
  li(t('不要关老卡：放在抽屉里，每6个月刷一次小额保持活跃')),
  li(t('信用组合：如果只有信用卡，可以考虑Credit-Builder Loan（专门用于建立信用）')),
];

// ============================================================
// 页面2：🤝 Informational Interview完全指南（各行业话术脚本）
// ============================================================
const informationalInterviewBlocks: any[] = [
  p(t('来源：Harvard Business Review、LinkedIn官方指南、WSO论坛、Reddit r/jobs和r/careerguidance、Management Consulted、Breaking Into Wall Street博客，2024年整理。', false, true)),
  hr(),
  h2('一、什么是Informational Interview及为什么重要'),
  h3('定义'),
  li(t('与目标行业/公司的专业人士进行30-45分钟的非正式对话')),
  li(t('目的：了解行业信息、建立人脉、获取内推机会——不是直接要工作')),
  li(t('据LinkedIn数据：80%的职位通过人脉填补，而非公开申请')),
  h3('为什么对中国学生特别重要'),
  li(t('非目标学校学生突破圈子的最有效方式')),
  li(t('获取内部信息（Headcount、部门文化、面试侧重点）')),
  li(t('即使对方没有HC，被记住了→转介绍到其他组或公司')),
  li(t('练习英语职业对话，降低正式面试紧张感')),
  h3('成功率数据（来自WSO/Reddit调研）'),
  li(t('冷邮件（Cold Email）：响应率约10-20%')),
  li(t('LinkedIn InMail：响应率约15-25%')),
  li(t('校友网络：响应率约40-60%（最高！）')),
  li(t('朋友介绍：响应率约70-80%')),
  hr(),
  h2('二、找到目标联系人的方法'),
  h3('LinkedIn搜索策略'),
  li(t('搜索：公司名 + 职位 + 你的学校名称（找校友优先）')),
  li(t('搜索：公司名 + 职位 + "China" or "Chinese"（文化背景相近更容易接受）')),
  li(t('使用LinkedIn Alumni Tool：在LinkedIn找到学校页面→Alumni→筛选公司/行业')),
  li(t('看谁和你有共同联系（2nd connection）：可以请共同联系介绍')),
  h3('其他渠道'),
  li(t('学校Career Center：很多有Alumni Database，联系比冷找效果好很多')),
  li(t('学校中国学生学者联合会（CSSA）：建立了系统的互助网络')),
  li(t('行业会议/networking events：直接面对面效果最好')),
  li(t('公司官网Team页面：找到名字后再LinkedIn搜索联系方式')),
  li(t('Twitter/X：很多金融/科技人士比LinkedIn更活跃，可以先互动再私信')),
  hr(),
  h2('三、LinkedIn/邮件请求模板（按行业分类）'),
  h3('通用请求模板（LinkedIn InMail）'),
  p(t('Hi [Name],')),
  p(t('My name is [Your Name], a [Year] student at [School] studying [Major]. I came across your profile while researching [Company/Industry] and was really impressed by your experience in [specific aspect of their work].')),
  p(t('I\'m exploring career opportunities in [field] and would love to learn from your journey. Would you be open to a brief 20-30 minute call at your convenience? I completely understand if your schedule doesn\'t allow for it.')),
  p(t('Thank you so much for your time!')),
  p(t('Best, [Your Name]')),
  h3('投行/金融请求模板'),
  p(t('Subject: Informational Chat - [School] Student Interested in [Bank] [Division]')),
  p(t('Hi [Name],')),
  p(t('My name is [Name], a junior at [School] pursuing finance. I\'ve been following [Bank]\'s advisory work, particularly the [recent deal/league table achievement] announced last month.')),
  p(t('I\'m actively recruiting for IB SA roles and would deeply appreciate 20 minutes to hear about your experience in [M&A/Leveraged Finance/etc.] and any advice you might have for someone breaking into the industry.')),
  p(t('I understand you\'re incredibly busy, so even a quick call or email exchange would be invaluable. Thank you for considering my request.')),
  p(t('[Your Name] | [School] | [LinkedIn URL]')),
  h3('科技/互联网请求模板'),
  p(t('Hi [Name],')),
  p(t('I\'m [Name], an MS CS student at [School]. I\'ve been following your work on [specific project they\'ve shared publicly or their team\'s work]—the approach to [technical aspect] was really insightful.')),
  p(t('I\'m recruiting for SWE roles at [Company] this fall and would love to understand the team culture and what makes candidates stand out in your hiring process. Would you be open to a 25-minute chat?')),
  p(t('Happy to work around your schedule entirely. Thanks!')),
  h3('咨询请求模板'),
  p(t('Hi [Name],')),
  p(t('My name is [Name], a [Year] MBA student at [School]. I\'ve been following your career trajectory from [undergrad] through [current role at MBB firm]—particularly your work in [industry practice].')),
  p(t('As I recruit for consulting, I\'d love to hear your perspective on what differentiates strong candidates and how you think about case prep. Would you have 20-30 minutes for a brief conversation?')),
  p(t('I\'m flexible and happy to meet in person if you\'re near [city], or by phone/Zoom.')),
  hr(),
  h2('四、Informational Interview问题库（30+经典问题）'),
  h3('破冰和背景了解'),
  li(t('"Could you walk me through your career path and what led you to [current role]?"')),
  li(t('"What made you choose [Company] over other opportunities when you joined?"')),
  li(t('"I saw you went from [X] to [Y]—how did you make that transition?"')),
  h3('日常工作了解'),
  li(t('"What does a typical day/week look like for you?"')),
  li(t('"What percentage of your work is [analysis/client-facing/collaborative]?"')),
  li(t('"What\'s the most challenging part of your current role?"')),
  li(t('"What skills do you use most day-to-day that you didn\'t expect when you started?"')),
  h3('公司文化和环境'),
  li(t('"How would you describe the culture at [Company] compared to industry norms?"')),
  li(t('"How much mentorship/structure is there for junior employees?"')),
  li(t('"How does the team handle work-life balance?"')),
  li(t('"What\'s the promotion timeline and what does it take to advance?"')),
  h3('招聘流程和建议'),
  li(t('"What do you look for when evaluating candidates for [role]?"')),
  li(t('"What mistakes do you see candidates make most often in interviews?"')),
  li(t('"Is there anything specific I should emphasize given my background in [China/engineering/etc.]?"')),
  li(t('"Would you recommend any particular resources for interview prep specific to [Company/industry]?"')),
  h3('行业趋势'),
  li(t('"How do you see [industry] changing in the next 3-5 years?"')),
  li(t('"What skills do you think will be most important for someone entering the field today?"')),
  h3('结尾必问（最重要！）'),
  li(t('"Is there anyone else you\'d recommend I speak with, either at [Company] or elsewhere in the industry?"')),
  li(t('"Would it be okay to stay in touch as I continue my search?"')),
  li(t('"Is there anything I can share that would be helpful to you?"（体现reciprocity）')),
  hr(),
  h2('五、Follow-up和维护人脉'),
  h3('24小时内发感谢邮件'),
  p(t('Subject: Thank You - [Your Name] from [School]')),
  p(t('Hi [Name],')),
  p(t('Thank you so much for taking the time to speak with me today. Our conversation gave me a much clearer picture of [specific thing they shared], and I especially appreciated your insight on [specific advice].')),
  p(t('I\'ve already [action you took based on their advice—e.g., started reading X book, reached out to Y person they mentioned]. Your guidance is incredibly helpful.')),
  p(t('I\'ll definitely keep you posted on my progress. Thanks again!')),
  p(t('Best, [Name]')),
  h3('后续维护（3-6个月周期）'),
  li(t('分享相关行业文章："Hi [Name], I came across this article about [topic we discussed] and thought you might find it interesting."')),
  li(t('分享进展更新："Hi [Name], wanted to let you know I got an interview at [Company]—thanks for your advice on [specific thing]!"')),
  li(t('结果通知：无论成功失败都告诉他们，这是礼貌也是维护关系')),
  li(t('LinkedIn连接：发请求时附上个性化消息，不要用默认文字')),
  h3('建立Networking CRM（人脉管理表）'),
  li(t('用Excel/Notion记录：姓名、公司、联系日期、聊了什么、下次跟进日期')),
  li(t('设置Calendar提醒：每3个月给重要联系人发一条更新')),
  li(t('节日问候：感恩节、新年简短问候，保持温度')),
];

// ============================================================
// 页面3：⚡ 能源/清洁能源/基础设施金融职业路径
// ============================================================
const energyFinanceBlocks: any[] = [
  p(t('来源：Energy Capital Partners官网、Brookfield Asset Management投资者报告、Goldman Sachs电力基础设施研究报告、Clean Energy Capital博客、PitchBook能源PE数据、Glassdoor薪资数据，2024年整理。', false, true)),
  hr(),
  h2('一、行业概况：为什么能源/基础设施金融是2024年最热方向'),
  h3('规模和增长'),
  li(t('IRA（《通胀削减法案》）：10年$3690亿清洁能源补贴，带动数万亿私人投资')),
  li(t('基础设施资产管理规模：全球$1.3万亿，预计2030年达$2万亿')),
  li(t('能源转型投资：彭博NEF预测2030年前每年需$1万亿清洁能源投资')),
  h3('就业市场'),
  li(t('投行能源组：Goldman Sachs NRG、JPM Energy Power Infrastructure（EPI）、Citi能源团队')),
  li(t('基础设施PE：Brookfield Renewables、KKR Infrastructure、Blackstone Infrastructure、ECP、Global Atlantic')),
  li(t('清洁能源开发商：NextEra Energy、Ørsted、Sunrun、Rivian、Tesla Energy')),
  li(t('咨询：Wood Mackenzie、BloombergNEF、ICF、E3 Consulting')),
  h3('对中国学生优势'),
  li(t('中国在清洁能源制造（太阳能、电池、风机）有全球最大供应链，行业知识有竞争优势')),
  li(t('工程背景（EE/ME/ChemE）转金融在此方向最自然')),
  li(t('IRA补贴分析、项目融资建模都需要懂技术+懂金融的复合人才')),
  hr(),
  h2('二、主要职业方向详解'),
  h3('1. 投行能源组（Energy IBD）'),
  li(t('工作内容：太阳能、风电、储能、LNG、油气、公用事业的并购、债权、IPO')),
  li(t('代表交易：NextEra Energy Partners MLP发行、BP可再生能源剥离、RWE收购Con Edison Clean Energy')),
  li(t('薪资（SA 2024）：$110k base + $20-35k bonus；全职Analyst $110k base + $60-90k bonus')),
  li(t('出路：能源PE/Infrastructure PE、Renewable Developer BD、清洁能源咨询')),
  h3('2. 基础设施PE/Infrastructure PE'),
  li(t('工作内容：收购风电场、太阳能园区、输电线路、收费公路、数据中心、港口')),
  li(t('投资逻辑：稳定现金流、通胀保护、ESG配置需求，长持有期（15-30年）')),
  li(t('代表基金：Brookfield Infrastructure（$100B AUM）、KKR Infrastructure、Stonepeak、ECP')),
  li(t('薪资（Associate）：$150-200k base + $150-200k bonus + carry')),
  li(t('特别技能：Project Finance建模、Merchant Risk分析、Regulatory/Policy理解')),
  h3('3. 能源信贷/结构融资'),
  li(t('工作内容：为可再生能源项目提供Tax Equity、Construction Loan、Term Loan、Green Bond')),
  li(t('Tax Equity：利用ITC/PTC补贴的结构融资，JP Morgan、Bank of America是最大提供方')),
  li(t('Project Finance：无追索权融资（non-recourse）以项目现金流还贷')),
  li(t('薪资（前3年）：$90-130k，银行信贷路线相对IB低但工作生活平衡更好')),
  h3('4. 清洁能源咨询/研究'),
  li(t('Wood Mackenzie：全球能源研究咨询龙头，电力市场/石油天然气/金属矿产')),
  li(t('BloombergNEF：彭博清洁能源研究，定价模型和政策分析')),
  li(t('E3 Consulting：电力系统规划咨询，服务PUC（公共事业委员会）')),
  li(t('薪资：$70-100k入门，偏研究性质，适合能源领域PhD/硕士转行')),
  hr(),
  h2('三、核心技能和知识图谱'),
  h3('财务建模特殊技能'),
  li(t('Project Finance LBO：与传统LBO区别在于无追索权、DSCR（偿债覆盖率）、P50/P90发电量')),
  li(t('LCOE（平准化电力成本）计算：资本成本、容量因子、O&M成本、通胀假设')),
  li(t('IRR vs Equity IRR：项目层面IRR vs 权益层面IRR的区别，Levered vs Unlevered')),
  li(t('Waterfall结构：Tax Equity flip结构、YieldCo结构、MLP结构')),
  h3('行业知识'),
  li(t('电力市场：PJM、MISO、ERCOT、CAISO等区域电力市场的运作机制')),
  li(t('可再生能源合同：PPA（电力购买协议）、REC（可再生能源证书）、SREC')),
  li(t('政策：ITC（30%投资税收抵免）、PTC（发电量税收抵免）、MACRS加速折旧')),
  li(t('技术基础：Capacity Factor（容量因子）、Curtailment、Grid Integration、储能原理')),
  h3('推荐资源'),
  li(t('书籍：《Project Finance in Theory and Practice》、《The Handbook of Project Finance》')),
  li(t('课程：SIEPR能源经济学、MIT Energy Initiative在线课程')),
  li(t('认证：CFA（金融通用）、PMP（项目管理）、LEED（绿建）')),
  li(t('网站：PV Magazine、Wood Mackenzie免费报告、EIA.gov数据、BloombergNEF年报')),
  hr(),
  h2('四、求职策略'),
  h3('目标公司清单（2024招聘活跃）'),
  li(t('投行：Goldman NRG、JPM EPI、Citi EPI、Lazard Energy、Guggenheim Power')),
  li(t('Infrastructure PE：Brookfield、KKR Infrastructure、ECP、Global Atlantic、DigitalBridge')),
  li(t('清洁能源公司：NextEra Energy Resources、Ørsted NA、Sunrun、Clearway Energy')),
  li(t('咨询：Wood Mackenzie、BloombergNEF、ICF、EDF Renewables')),
  h3('差异化简历关键词'),
  li(t('模型：Project Finance LBO、DSCR sensitivity、LCOE model、Waterfall structure')),
  li(t('知识：IRA tax credits、PPA structuring、REC markets、capacity factor analysis')),
  li(t('如果有工程背景：Solar PV design、Battery storage system、Grid interconnection study')),
  h3('面试准备重点'),
  li(t('行业动态：IRA最新补贴政策变化、各州RPS（可再生配额标准）')),
  li(t('最近大交易：过去6个月能源行业重大并购（Bloomberg/Reuters能源板块新闻）')),
  li(t('技术问题：如何给一个100MW太阳能项目建融资模型？走你通过项目的步骤。')),
];

// ============================================================
// 页面4：🧠 中国学生美国求职心理健康指南（压力管理与mental health）
// ============================================================
const mentalHealthBlocks: any[] = [
  p(t('来源：American Psychological Association留学生心理研究、MIT Counseling Services报告、Reddit r/ChineseInAmerica经验贴、The Muse职场心理建议、国际学生心理研究论文（2023），整理实用指导。', false, true)),
  hr(),
  h2('一、中国留学生求职压力的特殊来源'),
  h3('独特压力因素'),
  li(t('签证压力：OPT/H-1B身份不确定，求职时间窗口有限，每次拒信都觉得"没工作就得回国"')),
  li(t('家庭期望：父母倾尽积蓄送出来，不能"浪费"，巨大的回报压力')),
  li(t('文化障碍：语言、表达方式、Networking文化与国内截然不同，每天都是额外消耗')),
  li(t('比较效应：微信群、朋友圈满是别人的offer和成就，严重影响自我评价')),
  li(t('身份孤独：在这里不完全是"美国人"，回国又有"镀金"的标签，两边都有距离感')),
  h3('压力的表现形式'),
  li(t('求职焦虑：每投一封简历就期待回复，沉默=失败，陷入焦虑循环')),
  li(t('冒充者综合征（Impostor Syndrome）："我配吗？我的英语够好吗？我是不是靠运气？"')),
  li(t('社交回避：因为"networking好累"就躲避，越来越孤立')),
  li(t('完美主义陷阱：简历改了50遍不敢投，面试准备过度导致过度焦虑')),
  hr(),
  h2('二、实用压力管理工具（可操作版）'),
  h3('1. 建立"求职系统"而非"求职结果"导向'),
  li(t('每天的目标：投X封简历、联系Y个人、准备Z个问题——这是你能控制的')),
  li(t('不以offer/拒信评价今天，只评价今天的"系统执行率"')),
  li(t('参考：《Atomic Habits》提到的系统>目标思维')),
  h3('2. 信息断食（Information Diet）'),
  li(t('求职期间退出焦虑群：那些"谁谁谁拿到了XX offer"的消息对你没有帮助')),
  li(t('设定"查邮件时间"：每天只查2次（比如10am和4pm），不要随时刷新')),
  li(t('减少Glassdoor/Blind刷帖频率：信息茧房会放大恐惧')),
  h3('3. 建立稳定的生活锚点'),
  li(t('固定运动时间：即使每天只有30分钟，对压力激素的调节效果明显（研究证实）')),
  li(t('睡眠保护：比多刷题更重要，睡眠不足直接影响面试表现')),
  li(t('至少一件非求职的事：做饭、看剧、打球——给大脑设定"求职OFF时间"')),
  h3('4. 社交支持网络'),
  li(t('找1-2个求职伙伴（互相模拟面试、分享资源），但不要变成互相焦虑')),
  li(t('学校Counseling Center：美国大学counseling一般免费，有针对国际学生的专项支持')),
  li(t('使用中文心理服务：TalkToAngel、迈诺心理（北美华人）等中文心理咨询')),
  hr(),
  h2('三、Impostor Syndrome（冒充者综合征）克服指南'),
  h3('什么是Impostor Syndrome'),
  li(t('定义：觉得自己的成就是"运气"或"偶然"，随时会被"揭穿"是骗子')),
  li(t('研究：70%的人一生中都会经历，高成就者中更普遍（Journal of Behavioral Science）')),
  li(t('特别高发：语言/文化非母语环境中，留学生尤其容易产生')),
  h3('具体应对方法'),
  li(t('写下"成就清单"：把你做过的具体成就写下来，不允许自我否定（事实vs感受）')),
  li(t('"我做到了，因为..."练习：每次质疑自己时，强迫自己完成这个句子')),
  li(t('重新框架"不懂"：面试中说"That\'s a great question, let me think through it"比"I don\'t know"好')),
  li(t('接受"不完美准备"：等感觉100%准备好才投，永远都在等。70%就可以开始申请')),
  h3('文化适应重新框架'),
  li(t('你的"外国视角"是资产：在分析中国市场、国际业务时，你的背景是优势，不是劣势')),
  li(t('语言口音不是问题：美国职场充满口音，只要表达清晰、内容有价值就够了')),
  li(t('直接表达是可以学习的技能：不是性格，是沟通风格，可以刻意练习')),
  hr(),
  h2('四、面试焦虑实战管理'),
  h3('面试前（紧张感管理）'),
  li(t('Power Pose：面试前2分钟双手叉腰站立（Amy Cuddy研究，降低皮质醇）')),
  li(t('Box Breathing：吸气4秒→屏住4秒→呼气4秒→屏住4秒，循环3次')),
  li(t('"紧张=兴奋"重新标记：研究表明说"I\'m excited"比"I\'m calm"更能提升表现')),
  li(t('提前到场/上线5分钟：不要掐点，准备时间能显著降低焦虑')),
  h3('面试中（思维卡壳处理）'),
  li(t('沉默是可以的："Let me take a moment to think through this"——面试官不怕你想')),
  li(t('允许自己不知道："That\'s at the edge of my knowledge—here\'s how I\'d approach finding out"')),
  li(t('记笔记：如果紧张忘词，可以把问题关键词写下来，视觉锚点帮助集中')),
  h3('面试后（结果等待期）'),
  li(t('Done is done：面试完立刻记录反思，然后心理上关闭这个文件夹')),
  li(t('不要复盘超过1次：分析一遍学习经验即可，反复想象"那个问题我应该这么答"没有意义')),
  li(t('多线程申请：永远保持pipeline里有5+家在进行，不把希望押注在一家')),
  hr(),
  h2('五、拒信之后的心理重建'),
  h3('正常化拒绝'),
  li(t('即使是TOP候选人也会拿到80%的拒信——这是统计结果，不是对你的评价')),
  li(t('拒信≠你不够好：可能是headcount冻结、内部转正、更match的候选人，与你能力无关')),
  li(t('在LinkedIn上你能看到的那个"成功"，是他们发出来的——他们的拒信你看不到')),
  h3('重建行动计划'),
  li(t('给自己24-48小时：允许自己难过，不要强迫立刻乐观，这很正常')),
  li(t('48小时后：复盘一遍面试/投递，提炼1-2个可改进点，仅此而已')),
  li(t('立刻行动：打开求职追踪表，看看下一步是什么，用行动打破"沉浸在拒信里"的循环')),
  h3('何时寻求专业帮助'),
  li(t('长期失眠（>2周）或睡眠中频繁惊醒')),
  li(t('持续情绪低落、对曾经喜欢的事失去兴趣（>2周）')),
  li(t('社交完全回避，有自我伤害的想法')),
  li(t('学校Counseling Center（一般免费）：直接预约，不需要"严重到一定程度"才能去')),
  li(t('NAMI Helpline：1-800-950-6264，有中文服务')),
];

// ============================================================
// 页面5：📊 量化金融/Quant职业完全攻略（入门到MFE到对冲基金）
// ============================================================
const quantGuideBlocks: any[] = [
  p(t('来源：QuantLib开源社区、Wilmott论坛、Reddit r/quant、MFE Program官网数据、Glassdoor和Levels.fyi量化职位薪资、Two Sigma/Citadel/Jane Street招聘信息，2024年整理。', false, true)),
  hr(),
  h2('一、量化金融职业全景图'),
  h3('量化金融三大方向'),
  li(t('量化研究员（Quantitative Researcher）：开发Alpha信号、统计模型、因子模型')),
  li(t('量化开发/量化工程师（Quant Developer/Engineer）：交易系统基础设施、低延迟系统、数据管道')),
  li(t('量化交易员（Quantitative Trader）：执行策略、市场微结构分析、做市')),
  h3('主要雇主类型'),
  li(t('高频交易公司（HFT）：Jane Street、Citadel Securities、Virtu Financial、Jump Trading、Tower Research、Hudson River Trading')),
  li(t('对冲基金量化部门：Two Sigma、DE Shaw、Renaissance Technologies、AQR Capital、Point72（Cubist）')),
  li(t('大型投行量化部门：Goldman Sachs Strats、Morgan Stanley PDT Partners（分拆）、JPM AI Research')),
  li(t('买方量化：Bridgewater、Man AHL、Winton Group')),
  h3('薪资水平（2024）'),
  li(t('Jane Street新毕业Quant Trader：$250-300k total compensation（base+bonus+relocation）')),
  li(t('Citadel Securities Quant Researcher（PhD）：$200-250k base + $150-300k bonus')),
  li(t('Two Sigma SWE/Quant（Master）：$180-220k base + $80-150k bonus')),
  li(t('DE Shaw Computational Finance（PhD）：$200-250k base + 大额bonus（不公开）')),
  hr(),
  h2('二、核心技能要求'),
  h3('数学基础（必须扎实）'),
  li(t('概率论：测度论、随机过程（布朗运动、Ito积分）、马尔可夫链')),
  li(t('统计：回归分析、时间序列、贝叶斯统计、假设检验、Bootstrap')),
  li(t('线性代数：矩阵分解（SVD、PCA）、特征值分解')),
  li(t('最优化：凸优化、线性规划、动态规划')),
  li(t('微积分/偏微分方程：Black-Scholes PDE求解')),
  h3('编程技能'),
  li(t('Python：NumPy、Pandas、scikit-learn、PyTorch/TensorFlow（机器学习）、Statsmodels')),
  li(t('C++：低延迟系统必须，需要掌握内存管理、模板编程、并发')),
  li(t('R：统计建模，部分公司（AQR等）仍大量使用')),
  li(t('SQL：数据处理必须、时序数据库（InfluxDB、kdb+）')),
  li(t('Linux/Shell：生产环境基本都是Linux，Shell脚本自动化')),
  h3('金融知识'),
  li(t('衍生品定价：Black-Scholes模型、Greeks（Delta/Gamma/Vega/Theta）、蒙特卡洛定价')),
  li(t('市场微结构：Order Book、Bid-Ask Spread、Market Impact、VWAP/TWAP')),
  li(t('固定收益：利率模型（Vasicek、Hull-White）、久期、凸性')),
  li(t('量化策略：统计套利（配对交易）、动量策略、均值回归、机器学习Alpha')),
  hr(),
  h2('三、MFE（金融工程硕士）完整攻略'),
  h3('顶级MFE项目排名（QuantNet 2024）'),
  li(t('1. Carnegie Mellon MSCF：最顶级，就业最好，录取率极低，数学/编程要求最高')),
  li(t('2. Baruch MFE：CPP纽约，性价比最高顶级项目，就业好，费用低')),
  li(t('3. Columbia MAFN：纽约地理优势，Columbia品牌，课程偏学术')),
  li(t('4. NYU Courant MathFin：数学系主导，理论最强，实践稍弱')),
  li(t('5. Berkeley MFE：西海岸最好，科技公司人脉，16个月含实习')),
  li(t('6. Princeton MFin：偏研究，多PhD学生，不做HFT求职')),
  li(t('7. Chicago Financial Mathematics：U Chicago品牌，课程强')),
  li(t('8. Cornell MFE：Ithaca位置偏，但品牌强，金融衍生品方向强')),
  h3('申请准备（时间线：大三/研二开始）'),
  li(t('GRE/GMAT：Quant需要接近满分（167-170/Quant 51）')),
  li(t('数学课程：Real Analysis、Probability Theory、Linear Algebra、PDE——必须A')),
  li(t('编程：C++和Python项目，GitHub上展示量化项目')),
  li(t('实习：量化实习经历>>普通金融实习，哪怕是小公司量化实习也算')),
  li(t('推荐信：数学系教授最好，有量化研究合作更好')),
  h3('MFE项目期间如何找实习/全职'),
  li(t('程序：大多数项目秋季入学→春季招聘SA→夏季实习→秋季全职→毕业')),
  li(t('Career Fair：CMU/Baruch/Columbia career fair上HFT公司会直接到场')),
  li(t('早申请：Jane Street、Citadel等顶级公司招聘在每年9-10月开始')),
  li(t('做项目：GitHub上的量化项目（回测框架、因子研究）极大帮助面试')),
  hr(),
  h2('四、量化面试完全准备'),
  h3('Brain Teasers题库（HFT常考）'),
  li(t('概率题："从1-100随机选，如果选到偶数赢$1，奇数输$1，期望是多少？"（变形：各种期望计算）')),
  li(t('赌徒破产："A有$n，B有$m，每轮各押$1，A赢概率p，A破产概率是多少？"')),
  li(t('随机游走："对称随机游走，从0出发，期望首次到达n的步数是多少？"')),
  li(t('物理/逻辑："1000个储物柜都是关的，1000人依次经过，第i个人翻转所有i的倍数，最终有多少开着的？"（答案：完全平方数，31个）')),
  h3('技术面试（编程）'),
  li(t('LeetCode Hard：量化公司编程题比一般FAANG更难，需要刷到Hard熟练')),
  li(t('C++底层：内存对齐、Cache友好、无锁数据结构、SIMD指令')),
  li(t('系统设计：设计一个低延迟订单管理系统（OMS）')),
  li(t('统计实现：用Python实现Ridge回归、Bootstrap置信区间、Kalman Filter')),
  h3('市场知识面试'),
  li(t('Greeks问答："如果Gamma是正的，Delta怎么变化？"、"为什么做市商要Delta-hedge？"')),
  li(t('"如何定价一个path-dependent期权（亚式期权）？用哪种方法？"')),
  li(t('"解释vol smile/skew的成因。"')),
  li(t('"如果你有一个有Alpha的策略，如何估计它的容量？"')),
  h3('推荐备考资源'),
  li(t('书籍：《A Practical Guide to Quantitative Finance Interviews》（绿皮书，必备）')),
  li(t('书籍：《Options, Futures, and Other Derivatives》（John Hull，期权圣经）')),
  li(t('书籍：《Heard on the Street》（脑筋急转弯经典）')),
  li(t('课程：Coursera《Financial Engineering and Risk Management》、edX《Algorithmic Trading》')),
  li(t('练习：HackerRank量化挑战、Kaggle金融竞赛、QuantConnect回测平台')),
  hr(),
  h2('五、求职时间线和策略'),
  h3('HFT公司申请时间线（超早！）'),
  li(t('每年9月：Jane Street、Citadel Securities、Jump Trading开放暑期实习申请')),
  li(t('10-11月：Two Sigma、DE Shaw、Virtu开放申请')),
  li(t('12月-1月：大量面试，需要同步准备Brain Teasers + 编程 + 金融知识')),
  li(t('2-3月：Offer发放，通常有deadline爆炸式压力（"exploding offer"）')),
  h3('申请策略'),
  li(t('网撒广：HFT公司招聘不通过猎头，直接官网投递，多投不吃亏')),
  li(t('GPA很重要：顶级量化公司有GPA filter（通常3.5+，CMU/MIT等顶校可能3.7+）')),
  li(t('竞赛背书：数学奥林匹克（IMO）、Putnam、物理奥赛等获奖经历极有用')),
  li(t('论文/研究：机器学习、统计物理、信号处理等领域顶刊发表可直接进顶级公司面试')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十三批）...');

  await createPage('💳 美国信用体系完全指南（Credit Score从零建立）', creditGuideBlocks);
  await createPage('🤝 Informational Interview完全指南（各行业话术脚本）', informationalInterviewBlocks);
  await createPage('⚡ 能源/清洁能源/基础设施金融职业路径', energyFinanceBlocks);
  await createPage('🧠 中国留学生求职心理健康指南（压力管理）', mentalHealthBlocks);
  await createPage('📊 量化金融/Quant职业完全攻略（MFE到对冲基金）', quantGuideBlocks);

  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
