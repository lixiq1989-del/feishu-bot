/**
 * 美国商科求职知识库 - 深度内容补充（第十二批）
 * 职业转换攻略 / 在美租房指南 / Supply Chain职业 / 暑期实习全攻略 / DS vs PM vs BA对比
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
// 页面1：🔄 职业转换完全攻略（行业间跳槽策略）
// ============================================================
const careerSwitchBlocks: any[] = [
  p(t('来源：Harvard Business Review职业转换研究、LinkedIn Career Insights报告、Reddit r/cscareerquestions和r/FinancialCareers职业转换帖、成功转行者LinkedIn文章，覆盖主要转行路径分析。', false, true)),
  hr(),
  h2('一、最常见的职业转换路径分析'),
  h3('转换难度分级'),
  li(t('容易（同行业横向移动）：IB分析师→PE（金融内部）/ SWE→PM（科技内部）')),
  li(t('中等（相关行业纵向升级）：四大咨询→MBB / 工程师→技术PM')),
  li(t('困难（跨行业大转换）：咨询→金融 / 工程→金融 / 金融→科技产品')),
  li(t('最难（无直接关联）：法律→科技 / 医生→咨询（无工作经验对应）')),
  hr(),
  h2('二、热门转换路径深度分析'),
  h3('路径1：咨询→科技（越来越普遍）'),
  li(t('目标职位：Strategy & Operations Manager / Chief of Staff / Business Development')),
  li(t('为什么容易：科技公司需要"business thinking"，MBB背景是强信号')),
  li(t('转换时机：MBB工作1.5-3年后（有了足够的经验和品牌）')),
  li(t('必须补充：了解科技产品基础（如何做PRD / 用户研究基础 / A/B测试）')),
  li(t('面试重点：在传统behavioral题外加product sense和data analysis题')),
  li(t('薪资变化：咨询$150k → 科技$200k-$300k（TC包含RSU）')),
  h3('路径2：IB→PE（传统金融黄金路径，已有详细章节，此处补充）'),
  li(t('成功关键因素：Tier 1 bank的brand > 个人GPA/GPA')),
  li(t('时机：第1年内就要开始networking，等到第2年才想才太晚')),
  li(t('对中国学生的特别挑战：语言流利度要求高，Superday要面试6-8轮，任何一轮失误都可能导致失败')),
  li(t('备选：如果Top PE拿不到，先去中型PE（$1-5B AUM），3年后再考虑升级')),
  h3('路径3：会计/四大→投行（可行但需要努力）'),
  li(t('推荐路径：四大FDD（Financial Due Diligence）→ IB（最直接）')),
  li(t('替代路径：四大Audit 2年 → CFA L1 → Regional IB / Corp Dev')),
  li(t('关键障碍：IB技术问题（DCF/LBO）需要自学，四大不教这个')),
  li(t('推荐资源：BIWS Financial Modeling Course（$400）是这条路的必备投资')),
  li(t('成功案例常见于：有CFA Level 2+成绩 + 四大Deals经验的候选人')),
  h3('路径4：工程/技术→产品经理（PM）'),
  li(t('进入方式1：公司内部转岗（最容易，你已有内部credibility）')),
  li(t('进入方式2：转到以engineering background为优势的PM岗位（Technical PM）')),
  li(t('必须补充：Product Design Framework（CIRCLES/HEART）+ 用户研究方法 + Stakeholder管理')),
  li(t('最受欢迎的路径：SWE 2年 → APM Program（Google/Meta/Microsoft等都有）')),
  li(t('薪资：SWE $150k → PM $180k-$250k（通常），但PM竞争更激烈')),
  h3('路径5：从中国金融→美国金融（特殊路径）'),
  li(t('最大挑战：经历认可度（国内顶级和中等机构在美国都不被熟悉）')),
  li(t('策略1：MBA桥接（国内工作2-3年 → M7 MBA → 美国金融）')),
  li(t('策略2：直接在美国重新进入（从实习开始，接受降级进入）')),
  li(t('策略3：转到在美国有业务的中国机构（中金/中信CLSA/华泰美国）')),
  li(t('有优势的方向：China Cross-border M&A / China Coverage Group（这里你的背景是优势）')),
  hr(),
  h2('三、职业转换的通用策略'),
  h3('职业转换"三角"方法'),
  li(t('第1步（技能）：识别你的可迁移技能（Financial analysis / Data analysis / Project management）')),
  li(t('第2步（网络）：建立目标行业的联系（至少20个informational interview）')),
  li(t('第3步（信号）：增加目标行业的可信信号（证书/项目/内容创作）')),
  p(t('没有这三步同时进行，转行成功率极低。大多数人只做了一步（如只考CFA证书），发现没用就放弃。')),
  h3('转行Timeline规划'),
  li(t('决定转行后的前3个月：研究目标行业（informational interviews + 自学）')),
  li(t('3-6个月：开始针对性准备（简历重写 + 补充证书/项目）')),
  li(t('6-9个月：开始求职（小规模测试，找feedback）')),
  li(t('9-12个月：全力求职（有了足够准备和networking）')),
  li(t('总时间：大多数成功的职业转换需要6-18个月，不要期望1个月就成功')),
];

// ============================================================
// 页面2：🏠 在美租房完整指南（找房/合同/押金/维权）
// ============================================================
const housingGuideBlocks: any[] = [
  p(t('来源：Zillow租房指南、Apartments.com使用说明、美国各州租客权利手册（NLIHC）、HUD（住房和城市发展部）指南、Reddit r/personalfinance租房建议，综合中国留学生实际经验。', false, true)),
  hr(),
  h2('一、找房平台与策略'),
  h3('主要租房平台'),
  li(t('Zillow.com：最大的综合平台，信息全面，可设置价格/位置/卧室数量筛选')),
  li(t('Apartments.com：公寓楼盘多，适合找有管理处的大楼')),
  li(t('Craigslist.org：个人房东多，价格可能更低，但需要小心诈骗')),
  li(t('Facebook Marketplace：本地化找房，适合找室友')),
  li(t('Zumper：适合短租，也有长租选项')),
  h3('找房时间线（各城市节奏不同）'),
  li(t('纽约市：移动非常快，看到合适的当天或第二天就要决定，热门公寓1-2天就没了')),
  li(t('湾区：类似纽约，竞争激烈，提前1-2个月找')),
  li(t('其他城市（芝加哥/西雅图/波士顿）：提前3-4周开始看房即可')),
  li(t('建议：目标开始日期前30-45天开始认真找房')),
  h3('找室友策略'),
  li(t('Roomies.com / Roommate.com：专门的室友匹配平台')),
  li(t('脸书华人群组：各城市都有"留学生租房群"，直接用中文交流')),
  li(t('大学国际学生办公室：很多学校有Housing Matching Service')),
  li(t('好处：分摊租金，大城市1-2室合租 vs 自己租1室每月省$500-$1,500')),
  hr(),
  h2('二、租房申请流程（美国特有的材料要求）'),
  h3('申请材料清单'),
  li(t('身份证明：护照 + F-1/H-1B Visa + I-20或I-797')),
  li(t('收入证明：Offer Letter / Pay Stubs（通常要求月收入=房租×3倍）')),
  li(t('银行存款证明：3个月银行对账单（如果没有收入证明）')),
  li(t('信用报告：Credit Score（新来的学生可能没有，见下方解决方案）')),
  li(t('推荐信：之前房东的Reference Letter（如有）')),
  h3('没有信用历史的解决方案（新来学生的痛点）'),
  li(t('方案1：多付押金（通常可以用3个月押金代替credit check）')),
  li(t('方案2：找担保人（Guarantor），即有美国信用记录的人为你担保')),
  li(t('方案3：Leap/Piñata：第三方担保服务，付5-10%额外费用，适合留学生')),
  li(t('方案4：选择不查信用的公寓/房东（个人房东更灵活）')),
  li(t('建立信用：申请Secured Credit Card（$200-$500押金），6个月后有信用记录')),
  hr(),
  h2('三、租房合同（Lease）关键条款'),
  h3('必须仔细阅读的条款'),
  li(t('租期（Lease Term）：通常12个月，部分有6个月或月租（Month-to-Month）选项')),
  li(t('押金（Security Deposit）：通常1-2个月房租，退租后30-60天内归还（各州法律不同）')),
  li(t('提前终止条款（Early Termination Clause）：提前终止需要付多少罚金？')),
  li(t('宠物政策：明确宠物是否允许，宠物押金是多少')),
  li(t('维修责任：哪些由房东修，哪些由租客负责')),
  li(t('访客/转租（Subletting）：是否允许短租或转租给他人')),
  li(t('租金涨幅：部分城市有Rent Control（租金管制），问清楚下次涨幅上限')),
  h3('押金退还指南'),
  li(t('在搬入当天拍摄所有房间的视频/照片（有时间戳），通过邮件发给房东')),
  li(t('搬出时做同样的记录，留存证据')),
  li(t('法律：大多数州要求房东在搬出后14-30天内退还押金，逾期可以要求赔偿')),
  li(t('如果房东不退：发需求信（Demand Letter），必要时去Small Claims Court（不需要律师）')),
  hr(),
  h2('四、实用生活设施建议'),
  h3('水电网络设置'),
  li(t('水：通常包含在租金中')),
  li(t('电：选择当地电力公司（如ConEd in NYC / PG&E in Bay Area），开户需要SSN或护照')),
  li(t('网络：Comcast/Xfinity / AT&T Fiber / Spectrum，比较速度和价格')),
  li(t('外卖/生活APP：Instacart（超市）/ DoorDash / Uber Eats')),
  h3('搬家省钱技巧'),
  li(t('二手家具：Facebook Marketplace / Craigslist，非常多人搬家时半价甚至免费处理家具')),
  li(t('IKEA：性价比高，学生可以申请IKEA Family会员额外折扣')),
  li(t('中国超市：Mitsuwa/99Ranch附近常有华人社区，二手商品更容易找到')),
  li(t('搬家时机：月底/月初搬家价格高，月中搬家通常便宜20-30%')),
];

// ============================================================
// 页面3：🔗 供应链/运营管理职业路径（Supply Chain & Operations）
// ============================================================
const supplyChainBlocks: any[] = [
  p(t('来源：APICS（供应链专业组织）职业调查、McKinsey Operations Practice报告、Amazon Operations内部架构、Glassdoor Supply Chain Analyst薪资数据、LinkedIn Supply Chain就业分析。', false, true)),
  hr(),
  h2('一、供应链/运营管理概览'),
  h3('行业概览'),
  li(t('市场规模：全球供应链管理市场约$20万亿，Covid后供应链重要性大幅提升')),
  li(t('主要雇主：Amazon（最大）/ Apple / Walmart / P&G / Boeing / 汽车制造商 / 咨询公司')),
  li(t('中国学生特别优势：了解中国制造和供应商生态，跨境业务能力')),
  h3('主要职位分类'),
  li(t('Supply Chain Analyst：数据分析、预测、库存优化，入门岗位')),
  li(t('Procurement/Sourcing：供应商管理、价格谈判、合同管理')),
  li(t('Logistics & Distribution：运输/仓储/配送网络优化')),
  li(t('Operations Manager：负责具体运营流程改善，通常有团队管理责任')),
  li(t('Supply Chain Consultant（MBB/Big4）：为企业提供供应链优化咨询')),
  hr(),
  h2('二、主要公司的Supply Chain职业路径'),
  h3('Amazon Operations（全球最大供应链体系）'),
  li(t('Amazon Operations Management Internship（AMOI）：本科生最重要的入口')),
  li(t('Area Manager（AM）：管理仓库的一个区域和20-50名员工')),
  li(t('Operations Manager（OM）：管理多个区域，MBA直招岗位')),
  li(t('Amazon方法：大量使用数据分析（SQL/Python）优化物流网络')),
  li(t('Amazon Operation薪资：Area Manager $60,000-$80,000 + RSU（相对低但发展快）')),
  h3('Apple Supply Chain（最知名的消费品供应链）'),
  li(t('Apple的供应链是其核心竞争力，Tim Cook就是供应链出身的CEO')),
  li(t('主要职位：Hardware Procurement / Supplier Analyst / NPI (New Product Introduction) Engineer')),
  li(t('工作地点：Cupertino总部 + 中国/台湾/越南供应商')),
  li(t('对中国背景学生友好：经常需要与中国供应商（富士康/鸿海）沟通，普通话优势大')),
  h3('麦肯锡/BCG Operations Practice'),
  li(t('咨询公司专门做Operations改善，每年有数十个供应链相关项目')),
  li(t('招聘偏好：有Supply Chain实习背景的候选人在咨询面试中更有case preparation素材')),
  li(t('适合长期做顾问，或2-3年后转到企业Supply Chain Director')),
  hr(),
  h2('三、供应链面试准备'),
  h3('技术/行为问题'),
  li(t('Case类：某工厂的生产效率低20%，如何诊断和改善？')),
  li(t('数据类：给你一个CSV数据集，找出库存积压的根本原因')),
  li(t('Behavioral：告诉我一次你优化了某个流程的经历')),
  li(t('Strategic：如果要重新设计一个电商公司的最后一公里配送，你如何考虑？')),
  h3('必备证书'),
  li(t('APICS CSCP（Certified Supply Chain Professional）：$1,500，业界认可度高')),
  li(t('APICS CPIM（Certified in Planning and Inventory Management）：更技术性')),
  li(t('Lean Six Sigma Green Belt/Black Belt：流程优化专业认证')),
  li(t('PMP（Project Management Professional）：通用项目管理认证')),
  h3('薪资数据（2024年）'),
  li(t('Supply Chain Analyst（Entry）：$60,000-$80,000')),
  li(t('Senior Supply Chain Analyst：$80,000-$110,000')),
  li(t('Supply Chain Manager：$100,000-$140,000')),
  li(t('Director of Supply Chain：$150,000-$220,000')),
  li(t('VP of Supply Chain（大公司）：$250,000-$500,000')),
];

// ============================================================
// 页面4：☀️ 暑期实习完全攻略（如何找/如何表现/如何转正）
// ============================================================
const internshipGuideBlocks: any[] = [
  p(t('来源：National Association of Colleges and Employers (NACE) 2024年实习报告、LinkedIn实习转化数据、各大行官方Summer Analyst Program介绍、Glassdoor实习生评价、真实实习生分享，覆盖从申请到转正的全流程。', false, true)),
  hr(),
  h2('一、美国暑期实习的基本逻辑'),
  h3('为什么暑期实习那么重要'),
  li(t('NACE 2024数据：拥有实习经验的毕业生找到全职工作的成功率比没有实习经验的高68%')),
  li(t('更重要：顶级公司（Goldman/McKinsey/Google）超过70%的全职岗位来自内部实习转正')),
  li(t('IB现实：不做过Goldman或同级别公司的实习，基本没有全职机会（太竞争了）')),
  li(t('逻辑：公司把实习当做"延长面试"——比任何面试都更真实地评估你')),
  h3('不同类型实习的战略价值'),
  li(t('顶级公司实习（Goldman/McKinsey/Google）：能直接带来同等级别全职offer，战略价值最高')),
  li(t('中等公司实习：能作为"跳板"，让你进入更大平台的全职招聘')),
  li(t('小公司实习：获取技能和经历，难以直接跳到顶级')),
  li(t('非营利/研究：展示兴趣但信号弱，慎重作为主要实习经历')),
  hr(),
  h2('二、申请策略'),
  h3('时间线：早而非晚'),
  li(t('大三暑期实习申请：8月开放 → 10月大部分填满 → 11月仅剩残余')),
  li(t('常见错误：大三9月开学后才开始申请，已经晚了1-2个月')),
  li(t('正确做法：大二暑假就开始准备简历，8月1日申请窗口开放第一天就提交')),
  h3('申请数量策略'),
  li(t('目标公司：5-10家（深度准备每家）')),
  li(t('保底公司：10-15家（略浅的准备）')),
  li(t('总申请：20-25家（不要广撒网100家，质量比数量重要）')),
  h3('内推（Referral）策略'),
  li(t('在开始投简历前，先找到每家目标公司的内部联系人（校友优先）')),
  li(t('内推流程：Coffee chat 2-3次 → 建立关系 → 对方主动提referral → 提供你的简历')),
  li(t('数据：有内推的简历过初筛概率是普通投递的10倍（LinkedIn报告）')),
  hr(),
  h2('三、实习期间如何表现（转正率提升策略）'),
  h3('前两周：快速适应期'),
  li(t('过度deliver（Over-deliver）：第一个任务用120%的标准完成，建立credibility')),
  li(t('主动认识所有人：每天和1-2个full-time员工约15分钟coffee chat')),
  li(t('观察未说明的规则：什么时候来，什么时候走，着装风格，会议中如何表达')),
  li(t('问好问题：展示你的智识好奇心，但不要问低级的"能在网上找到答案的"问题')),
  h3('中期：证明价值期'),
  li(t('发现一个可以主动改善的机会，不要等待被分配')),
  li(t('Request feedback主动版：每两周问你的mentor"我还能改善什么？"')),
  li(t('增加visibility：在team meeting上发言，分享有价值的insight')),
  li(t('IB实习特别技巧：帮associate做他们不想做的tedious tasks（获得好感度）')),
  h3('最后两周：冲刺转正'),
  li(t('询问反馈和转正信号："Based on my performance, am I on track for a full-time offer?"')),
  li(t('展示学习曲线：说明你从实习中学到了什么，以及如何在全职中更好地贡献')),
  li(t('建立长期关系：即使没有立即转正offer，保持良好关系（他们可能来年再招）')),
  hr(),
  h2('四、实习后的可能结果与应对'),
  h3('拿到Return Offer（转正）'),
  li(t('通常在实习结束前1-2周发出，有"Exploding Offer"（如2-4周内决定）')),
  li(t('如果有多个offer：可以要求延长决定时间（礼貌地说明你在考虑其他机会）')),
  li(t('注意：接受后再反悔会烧掉桥，要谨慎决定再接受')),
  h3('没有拿到Return Offer'),
  li(t('不要气馁：有时候是公司HC冻结，不是你表现问题')),
  li(t('立刻开始：参考"大四全职申请"时间线，秋季就要全力投入')),
  li(t('使用实习经历：即使没有return offer，这段经历对简历有价值')),
  li(t('向Recruiter获取反馈："What were the main areas where I could have improved?"')),
  h3('IB暑期实习特别注意'),
  li(t('IB转正率因bank和组别差异很大：EB（Evercore/Lazard）约80-90%；BB（GS/MS）约50-70%')),
  li(t('关键事件：Summer Presentation（实习生需要做一个行业研究陈述）要认真对待')),
  li(t('社交活动：所有optional的social events都要参加（这是评估"cultural fit"的机会）')),
];

// ============================================================
// 页面5：🔀 Data Science vs PM vs Business Analyst 深度对比
// ============================================================
const dsPmBaComparisonBlocks: any[] = [
  p(t('来源：FAANG内部职位说明（公开版）、Glassdoor职位评价、Levels.fyi薪资对比、LinkedIn就业数据、Reddit r/datascience/r/productmanagement的讨论，2024年最新信息。', false, true)),
  hr(),
  h2('一、三个职位本质区别'),
  h3('Data Scientist（数据科学家）'),
  li(t('核心问题："数据说明了什么？如何用数据构建更好的模型和产品？"')),
  li(t('日常工作：分析大规模数据集，构建ML模型，设计A/B实验，提供insight')),
  li(t('主要工具：Python(pandas/scikit-learn/pytorch) + SQL + Spark + Tableau')),
  li(t('合作对象：工程师（拿到数据）+ PM（提需求）+ 管理层（呈现结论）')),
  li(t('核心指标：模型准确率 / 实验uplift / insight的业务影响')),
  h3('Product Manager（产品经理）'),
  li(t('核心问题："我们应该构建什么？为什么？怎么定义成功？"')),
  li(t('日常工作：写PRD / 做用户研究 / 优先级排序 / 跨团队协调 / 制定产品路线图')),
  li(t('主要工具：Figma(wireframe) + Jira/Asana(项目管理) + Amplitude/Mixpanel(分析) + Excel')),
  li(t('合作对象：工程师（研发）+ 设计师（UX）+ DS（数据支持）+ 业务团队')),
  li(t('核心指标：DAU / Retention Rate / Revenue / NPS / Feature Adoption Rate')),
  h3('Business Analyst（业务分析师）'),
  li(t('核心问题："数据如何支持业务决策？现在的业务表现如何？"')),
  li(t('日常工作：制作Dashboard / 做ad hoc分析 / 制作汇报材料 / 数据清洗')),
  li(t('主要工具：Excel(高级) + SQL + Tableau/Power BI + Python(基础)')),
  li(t('合作对象：Finance / Marketing / Operations / Sales / C-Suite')),
  li(t('核心指标：Revenue / Cost / Margin / Conversion Rate')),
  hr(),
  h2('二、薪资对比（2024年，FAANG级别）'),
  h3('Entry Level（0-2年经验）'),
  li(t('Data Scientist：$130,000-$180,000 total comp（含RSU）')),
  li(t('Product Manager：$140,000-$200,000 total comp')),
  li(t('Business Analyst：$80,000-$110,000 total comp（大多数公司）')),
  li(t('注：BA在FAANG公司也有$120k+，但平均低很多')),
  h3('Mid Level（3-6年经验）'),
  li(t('Senior Data Scientist：$200,000-$350,000 total comp')),
  li(t('Senior PM（L5 at Google/E5 at Meta）：$300,000-$500,000 total comp')),
  li(t('Senior Business Analyst：$120,000-$160,000（传统公司）/ $150k-$220k（科技）')),
  h3('注意：BA薪资差异最大'),
  li(t('BA at Goldman Sachs（IBD/S&T支持）：$100,000-$130,000')),
  li(t('BA at Fortune 500公司：$65,000-$90,000')),
  li(t('BA at FAANG科技公司（有时叫Analytics Engineer）：$120,000-$180,000')),
  hr(),
  h2('三、适合人群分析'),
  h3('适合DS的人'),
  li(t('数学和统计背景扎实（本科统计/数学/CS）')),
  li(t('喜欢独立深度研究，可以花几周专注一个问题')),
  li(t('对建模和算法感兴趣（不只是会用，还想理解原理）')),
  li(t('愿意花大量时间在数据清洗上（现实中DS工作约60%是数据处理）')),
  h3('适合PM的人'),
  li(t('喜欢解决模糊问题，对"为什么"比"怎么做"更感兴趣')),
  li(t('擅长沟通和协调，能在没有直接权力的情况下影响他人')),
  li(t('对产品和用户体验有强烈的好奇心')),
  li(t('能忍受不确定性和高度ambiguity（PM通常没有"正确答案"）')),
  h3('适合BA的人'),
  li(t('喜欢快速产出有商业价值的分析（而非深度研究）')),
  li(t('擅长storytelling：把数据转化成清晰的商业建议')),
  li(t('财务/业务背景（对Finance/Marketing/Operations感兴趣）')),
  li(t('想要更接近业务决策，而非深度技术工作')),
  hr(),
  h2('四、职业路径与转换'),
  h3('DS的晋升路径'),
  li(t('Junior DS → DS → Senior DS → Staff DS → Principal DS')),
  li(t('管理路径：Senior DS → DS Manager → Director of Data Science')),
  li(t('横向机会：DS → ML Engineer（更偏工程）/ DS → PM（PM Analytics）')),
  h3('PM的晋升路径'),
  li(t('APM（Associate PM）→ PM → Senior PM → Staff PM → Group PM → Director of PM → VP of Product')),
  li(t('两种路径：IC（个人贡献者）路径 vs 管理路径')),
  li(t('IC到顶级：Staff PM / Principal PM = 管理多个PM而不需要转管理')),
  h3('BA的晋升路径'),
  li(t('BA → Senior BA → Lead BA / Analytics Manager → Director')),
  li(t('横向：BA → DS（加强技术技能）/ BA → PM（加强产品感）/ BA → FP&A（金融方向）')),
  li(t('注：BA是很好的起点，但天花板相对较低，通常需要转型才能大幅提升薪资')),
  hr(),
  h2('五、面试难度对比'),
  h3('面试难度排序（同级别岗位）'),
  li(t('最难：PM（FAANG）—— 4-5轮，产品感+数据+behavioral，没有标准答案')),
  li(t('中等：DS（FAANG）—— 技术题（SQL+Python）+ 统计 + ML理论 + Case')),
  li(t('相对容易：BA（大多数公司）—— SQL + Excel + behavioral，较标准化')),
  h3('准备资源推荐'),
  li(t('PM面试：Cracking the PM Interview (Gayle) + Decode and Conquer (Lewis Lin) + Product School YouTube')),
  li(t('DS面试：Ace the Data Science Interview (book) + LeetCode SQL题 + StatQuest YouTube')),
  li(t('BA面试：SQL Practice (Mode Analytics) + Excel/Power BI教程 + Case Interview入门')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十二批）...\n');
  await createPage('🔄 职业转换完全攻略（跨行业跳槽最优路径）', careerSwitchBlocks);
  await createPage('🏠 在美租房完整指南（找房/合同/押金/维权）', housingGuideBlocks);
  await createPage('🔗 供应链/运营管理职业路径（Supply Chain & Operations）', supplyChainBlocks);
  await createPage('☀️ 暑期实习完全攻略（如何找/如何表现/如何转正）', internshipGuideBlocks);
  await createPage('🔀 Data Science vs PM vs Business Analyst 深度对比', dsPmBaComparisonBlocks);
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/Adh3w4XwCiMs2zkApVhcFdT0nFf`);
}

main().catch(console.error);
