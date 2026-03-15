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
// 页面1：🎓 PhD毕业生工业界求职指南（学术→产业完整转型）
// ============================================================
const phdIndustryBlocks: any[] = [
  p(t('来源：MIT Career Advising PhD资源、Stanford PhD-to-Industry转型系列讲座、Nature Careers PhD就业调研（2023）、Quora "PhD to industry"高赞回答、Reddit r/PhD和r/datascience，2024年整合。', false, true)),
  hr(),
  h2('一、PhD学生工业界求职的核心挑战'),
  h3('PhD特有的困境'),
  li(t('信息茧房：导师和同学的世界观以学术为中心，工业界信息获取滞后')),
  li(t('时机问题：很多人5-7年博士才开始找工作，而本硕生早就布局3-4年了')),
  li(t('简历翻译：把"研究"经历翻译成工业界能听懂的"贡献和影响"是一门艺术')),
  li(t('过度学历化：PhD被认为"学术思维太重""实践能力不足"——需要主动纠正')),
  li(t('签证复杂：STEM OPT延期到3年（大多数理工PhD都有STEM OPT），这是优势')),
  h3('PhD的工业界优势'),
  li(t('深度专业知识：在某个细分领域的深度无人可及')),
  li(t('研究方法论：系统性问题分解、严格的假设验证——这正是数据科学/研究岗位需要的')),
  li(t('耐受挫折能力：做过研究的人对不确定性的容忍度极高')),
  li(t('发表/专利：是简历上的客观证明')),
  hr(),
  h2('二、PhD适合的工业界职位图谱'),
  h3('数据科学/机器学习（最常见出路）'),
  li(t('Research Scientist（研究科学家）：FAANG/OpenAI/Deepmind等AI实验室，做前沿模型研究')),
  li(t('Applied Scientist：Amazon特有职称，介于Research和Engineering之间')),
  li(t('Data Scientist：中大型公司，建模/分析，需要一定业务感')),
  li(t('ML Engineer：更偏工程，需要强coding能力，系统部署')),
  h3('量化金融（数理PhD热门出路）'),
  li(t('Quant Researcher：Two Sigma、DE Shaw、Renaissance，需要统计/物理/数学PhD')),
  li(t('Risk Model Developer：银行风险部门，金融数学/统计PhD')),
  li(t('Pricing Actuary：保险公司，精算考试通过后前景好')),
  h3('咨询（MBA替代）'),
  li(t('MBB Advanced Analytics/Digital Practices：McKinsey QuantumBlack、BCG GAMMA、Bain Vector')),
  li(t('PhD直接申请：MBB有专门的PhD招募通道，薪资与MBA相当甚至更高')),
  li(t('策略：用PhD研究证明独特分析能力，case interview同样需要准备')),
  h3('生物技术/制药（生命科学PhD）'),
  li(t('Research Scientist：Pfizer/Moderna/Genentech，学术职位的工业界延伸')),
  li(t('Biotech VC：Third Rock Ventures、Atlas Venture专门招生物PhD做投资')),
  li(t('Medical Science Liaison（MSL）：制药公司的科学大使，高薪+出差多')),
  hr(),
  h2('三、简历翻译：学术→工业界语言对照'),
  h3('错误vs正确描述对比'),
  li(t('错误："Developed a novel Bayesian hierarchical model for spatial data analysis"')),
  li(t('正确："Built predictive model that improved location-based recommendation accuracy by 23% (validated on 10M records)"')),
  li(t('错误："Published 3 first-author papers in top-tier venues (NeurIPS, ICML)"')),
  li(t('正确："Published 3 papers in top AI conferences; models adopted by [X companies] in production"')),
  li(t('错误："Taught undergraduate statistics for 3 semesters as TA"')),
  li(t('正确："Designed and delivered curriculum for 150+ students; created automated grading system that reduced evaluation time by 40%"')),
  h3('用"Impact Frame"重写每段经历'),
  li(t('问自己：我的研究如果被工业界应用，会解决什么实际问题？')),
  li(t('问自己：我在这段经历中有哪些量化成果（时间、钱、准确率、规模）？')),
  li(t('问自己：这段经历展示了什么通用技能（领导力、沟通、快速学习）？')),
  hr(),
  h2('四、时间线规划（博士期间的工业求职布局）'),
  h3('理想时间线（以5年PhD为例）'),
  li(t('第1年：专注学术，同时做1-2个学校的数据/AI相关项目，积累GitHub portfolio')),
  li(t('第2-3年：争取暑期实习（很多公司有PhD Intern项目，Amazon AI、Google Research等）')),
  li(t('第3年：开始networking，参加工业界会议，连接学长姐')),
  li(t('第4年：至少1次工业界实习，写得好的实习报告比论文更有求职价值')),
  li(t('第5年：正式求职，用实习经历和研究成果双重包装简历')),
  h3('关键动作：暑期实习最重要！'),
  li(t('为什么：博士实习是转正通道，几乎等于直接进入Hiring Pipeline')),
  li(t('如何找：LinkedIn、学校Career Center、导师人脉（导师工业界人脉很重要）')),
  li(t('什么级别：PhD通常直接当Intern/Research Intern（相当于Senior级别）')),
  li(t('目标：争取1-2次FAANG/研究机构实习，再加1次startup实习')),
  hr(),
  h2('五、PhD面试特别注意事项'),
  h3('Research Presentation（研究讲演）'),
  li(t('很多Research Scientist职位需要45分钟研究讲演')),
  li(t('关键：连接到工业界应用，不要只讲技术细节（非你领域的面试官听不懂）')),
  li(t('结构：研究动机→核心贡献→方法→结果→工业影响→未来方向')),
  h3('PhD常被问的刁钻问题'),
  li(t('"为什么离开学术界？"→诚实+正向：对实际应用更有热情，想看到研究落地')),
  li(t('"你能快速适应工业界的节奏吗？"→用实习经历证明，或者说明你已经理解差异')),
  li(t('"你的研究成果可以商业化吗？"→提前想好1-2个商业应用场景')),
];

// ============================================================
// 页面2：🌐 跨国公司China Desk/中国业务职位（双语双文化优势）
// ============================================================
const chinaDeskBlocks: any[] = [
  p(t('来源：China-US business council报告、各大投行China Desk LinkedIn职位描述、KPMG/Deloitte跨境业务招聘信息、中资美国上市公司（CALI/EDU/JD等）IR/Finance职位、华人专业人士社群分享，2024年整合。', false, true)),
  hr(),
  h2('一、什么是China Desk职位及其价值'),
  h3('China Desk的定义'),
  li(t('在美资机构（投行/咨询/律所/资管）中专门负责中美跨境业务的团队')),
  li(t('主要服务：中国公司赴美上市（ADR/NYSE/NASDAQ）、美国公司中国业务拓展、中美并购')),
  li(t('为什么存在：中美经济深度交织，需要懂两种语言、两种商业文化、两种监管体系的人才')),
  h3('为什么中国留学生有天然优势'),
  li(t('稀缺的双语/双文化能力：普通话流利+英文专业水平，真正懂两种商业文化')),
  li(t('人脉网络：在中国的商界联系是无价的商业资源')),
  li(t('市场理解：对中国监管环境、商业习惯、政治生态的理解无法通过培训获得')),
  li(t('时区优势：愿意early morning或late night call对接中国团队')),
  hr(),
  h2('二、主要China Desk雇主和职位类型'),
  h3('投行China Desk'),
  li(t('Goldman Sachs China Business（纽约+香港）：服务中国互联网公司美股上市、中美跨境M&A')),
  li(t('JPMorgan China Desk：中国企业美国并购融资、中国主权财富基金客户关系')),
  li(t('Morgan Stanley China-Cross Border：ADR发行、跨境资本市场交易')),
  li(t('中资投行美国分支：中金（CICC）、中信（CITIC）、华泰在美分支——也大量招华人')),
  h3('咨询公司中国业务'),
  li(t('McKinsey Greater China Practice（美国部分）：服务美国客户的中国市场进入战略')),
  li(t('BCG Greater China：帮助中美双向投资的战略咨询')),
  li(t('Deloitte/KPMG/PwC China Practice：中国客户的美国审计、Tax、跨境咨询')),
  h3('律所China Practice'),
  li(t('Paul Weiss、Skadden等顶级律所：中国公司美国上市法律顾问（VIE结构、SEC合规）')),
  li(t('需要JD学位（美国法律学位），但有时IRD/Paralegal角色接受背景多元的人')),
  h3('中概股公司IR/Finance/Legal'),
  li(t('在美上市中国公司（阿里巴巴、京东、拼多多、新东方等）的美国办公室')),
  li(t('职位：Investor Relations（IR）、Financial Reporting（SEC 20-F文件）、Legal Compliance')),
  li(t('优势：跳板进入中国商界核心圈，薪资不输大厂')),
  hr(),
  h2('三、求职策略'),
  h3('简历差异化要点'),
  li(t('明确写出语言能力：Mandarin Chinese (Native)，不要只说"bilingual"')),
  li(t('中国相关实习：哪怕是在中国的实习，都要包含且要翻译成英文写清楚impact')),
  li(t('跨境经验：如果有任何中美跨境项目/研究/案例分析，重点突出')),
  li(t('中国网络：如果有中国商界人脉（父母、亲戚、导师的商界联系），在合适时候提及')),
  h3('China Desk面试特殊问题'),
  li(t('"你如何看待当前中美关系对跨境业务的影响？" → 客观分析，展示成熟政治理解力')),
  li(t('"给我举一个需要同时理解两种文化才能成功谈判的例子" → 用真实经历回答')),
  li(t('"你在中国有什么样的商业人脉？" → 诚实评估，有就说，没有就说会如何建立')),
  h3('额外优势：熟悉中国监管环境'),
  li(t('CSRC（中国证监会）规则：VIE结构、跨境数据监管（数据安全法）')),
  li(t('中国外汇管制：SAFE规则、资本项目管制对跨境并购的影响')),
  li(t('了解这些让你在咨询/银行的China Desk面试中脱颖而出')),
  hr(),
  h2('四、职业发展路径'),
  h3('典型晋升通道'),
  li(t('投行China Desk：Analyst→Associate→VP（可能rotate到香港/北京office）')),
  li(t('咨询China Practice：Analyst→Associate→Principal（经常外派中国项目）')),
  li(t('中概股IR：IR Assistant→IR Manager→IR Director（对接CEO/CFO级别）')),
  h3('出路'),
  li(t('回中国市场：在美积累的资本市场经验在中国是稀缺资源')),
  li(t('香港金融中心：亚洲区域总部常驻，连接东西方的hub')),
  li(t('中资机构：阿里巴巴、腾讯、华为美国分支的BD/Finance角色')),
  li(t('VC/PE（中美双向）：GGV Capital、Qiming Ventures、Sequoia China等双边基金')),
];

// ============================================================
// 页面3：🔬 制药/生物科技行业求职完全攻略
// ============================================================
const pharmaCareerBlocks: any[] = [
  p(t('来源：BioSpace就业报告（2024）、Glassdoor生物科技薪资数据、MIT Sloan生命科学管理项目课程、LinkedIn Biotech Industry Report、多位biotech MBA/PhD求职经历分享，2024年整合。', false, true)),
  hr(),
  h2('一、制药/生物科技行业版图'),
  h3('行业规模和机会'),
  li(t('美国医药行业：市场规模$600B+，全球最大')),
  li(t('生物科技创业：2023年VC投入biotech约$170亿（即使下滑仍然庞大）')),
  li(t('主要聚集地：波士顿/剑桥（全球最大biotech集群）、旧金山湾区、圣地亚哥')),
  h3('行业职能分类'),
  li(t('研发端（R&D）：Drug Discovery、Clinical Development、Regulatory Affairs')),
  li(t('商业端（Commercial）：Business Development（BD）、Marketing、Sales')),
  li(t('支持端：Finance、Legal、HR、IT')),
  li(t('跨界端：Strategy Consulting、Healthcare VC/PE、Health Economics')),
  hr(),
  h2('二、主要职业路径详解'),
  h3('Business Development（BD）— 最热门非科研职位'),
  li(t('工作内容：寻找授权许可（Licensing）、收购目标、Partnership机会，代表公司谈合作')),
  li(t('日常：分析科学论文（要有一定科学背景）、评估交易价值（用NPV/rNPV模型）、谈判合同条款')),
  li(t('背景要求：MBA+理科背景，或生命科学PhD转商业，或有咨询/IB经验者')),
  li(t('薪资：$120-180k（Associate/Manager），$200k+（Director）')),
  li(t('代表公司：Pfizer BD、AstraZeneca BD、Moderna Business Development')),
  h3('Health Economics & Outcomes Research（HEOR）'),
  li(t('工作内容：证明新药的经济价值（用于保险公司/政府定价谈判）')),
  li(t('背景：经济学/公共卫生/统计学背景+制药知识')),
  li(t('薪资：$90-150k，受签证限制较少，大型制药公司普遍赞助H-1B')),
  h3('Regulatory Affairs（法规事务）'),
  li(t('工作内容：准备FDA（美国）、EMA（欧洲）等监管机构的药品申请文件（IND/NDA/BLA）')),
  li(t('背景：生命科学专业必须，了解ICH指南、GMP/GCP法规')),
  li(t('薪资：$80-130k，相对稳定，不受临床试验成败影响')),
  h3('Clinical Operations（临床运营）'),
  li(t('工作内容：管理临床试验的执行（CRO管理、患者招募、数据质量）')),
  li(t('背景：生命科学+项目管理能力，ICH GCP认证加分')),
  li(t('薪资：$75-120k，工作稳定，有清晰晋升通道（CRA→CTA→Clinical Manager）')),
  hr(),
  h2('三、制药行业VC/PE职位'),
  h3('Healthcare VC'),
  li(t('代表机构：Third Rock Ventures、Atlas Venture、ARCH Venture Partners、Flagship Pioneering（Moderna母公司）')),
  li(t('要求：生命科学PhD通常直接申请，MD/PhD最强，MBA+healthcare experience也可')),
  li(t('工作：评估初创biotech科学价值、参与创业公司建立（Flagship会从零孵化公司）')),
  li(t('薪资：$150-200k+carry，顶级HC VC的carry潜力极高')),
  h3('Healthcare PE'),
  li(t('代表机构：Blackstone Healthcare、KKR Healthcare、TPG Healthcare')),
  li(t('投资对象：成熟的医疗服务公司（医院、药房、器械）而非初创biotech')),
  li(t('进入方式：IB 2年→Healthcare PE（传统PE路径）')),
  h3('Life Science Consulting'),
  li(t('LEK Consulting：医疗健康最强，专注healthcare strategy')),
  li(t('Guidehouse Health：政府/医疗系统咨询')),
  li(t('ZS Associates：医疗销售&市场策略咨询')),
  hr(),
  h2('四、求职策略'),
  h3('对理科PhD的建议'),
  li(t('直接走BD/Strategy路径：用PhD证明科学理解力，用MBA课程/培训补商业技能')),
  li(t('参加BUSA（Biotech Undergraduate Students Association）等学生组织建立人脉')),
  li(t('暑期实习：大型制药公司（Pfizer、J&J、Merck）和biotech都有PhD实习项目')),
  h3('对MBA学生的建议'),
  li(t('选择有healthcare focus的MBA：哈佛/斯坦福/沃顿的healthcare club是进入行业的关键')),
  li(t('Case Competition：很多制药公司赞助MBA案例竞赛，这是直接联系Recruiter的机会')),
  li(t('Internship Summer：在大型制药公司BD/Strategy部门实习是进入行业的黄金路径')),
  h3('推荐资源'),
  li(t('BioSpace.com：生物科技求职最大平台')),
  li(t('FierceBiotech、BioPharma Dive：行业新闻，面试前必读')),
  li(t('Evaluate Pharma：药物管线数据库，了解行业现状')),
  li(t('BIO（Biotechnology Innovation Organization）年会：最大行业conference，有大量networking机会')),
];

// ============================================================
// 页面4：📊 财务/会计职业深度攻略（Big 4出路/CPA/CFO路径）
// ============================================================
const accountingDeepBlocks: any[] = [
  p(t('来源：AICPA会计就业调研（2024）、Glassdoor Big 4薪资数据、CPA Journal职业规划系列、Reddit r/accounting真实经历帖、CFO Magazine CFO career路径研究，2024年整合。', false, true)),
  hr(),
  h2('一、美国会计/财务行业版图'),
  h3('主要职业路径分支'),
  li(t('公共会计（Public Accounting）：Big 4/中型所审计/税务/咨询，积累证书和经验')),
  li(t('企业财务（Corporate Finance）：从AP/AR到Controller到CFO的企业内部路径')),
  li(t('政府/非盈利会计：稳定、工时好，但薪资较低')),
  li(t('金融财务（Financial Accounting + FP&A）：面向上市公司的财务计划与分析')),
  hr(),
  h2('二、Big 4职业路径完全解析（审计方向）'),
  h3('审计职级和时间线'),
  li(t('Audit Associate（0-2年）：$65-85k，学GAAP/GAAS，执行审计程序，prepare workpapers')),
  li(t('Senior Associate（2-4年）：$80-100k，带小团队，客户联系，review junior work')),
  li(t('Manager（4-7年）：$110-150k，管理客户关系，新业务开发，3-5个项目同时进行')),
  li(t('Senior Manager（7-10年）：$150-200k，行业专家，辅导新人，参与提案')),
  li(t('Partner（10-15年）：$300k-$1M+，拥有客户，分配收益，参与公司决策')),
  h3('出路（Big 4 Exit Opportunities）'),
  li(t('最经典：Senior Associate或Manager时跳去Corporate Controller/Accounting Manager')),
  li(t('财务精英路径：Big 4 2-3年→SEC Reporting Manager→VP Finance→CFO')),
  li(t('CFO助理路径：Big 4→Fortune 500财务→CFO（平均需要15-20年）')),
  li(t('创业：很多人用Big 4经验自己开会计事务所，华人市场有稳定需求')),
  h3('对中国学生的签证注意'),
  li(t('Big 4 H-1B：Deloitte、KPMG、PwC、EY都有大量H-1B赞助历史')),
  li(t('重要：Big 4 H-1B是非常安全的路径，配额充足、公司有完整流程')),
  li(t('OPT期间：完全可以在Big 4以OPT工作，等H-1B抽签')),
  hr(),
  h2('三、CPA考试完全攻略（2024 Evolution版本）'),
  h3('CPA考试新架构（2024年改革）'),
  li(t('Core（所有人必考3门）：')),
  li(t('  - BAR（Business Analysis and Reporting）：财务报告、分析、技术')),
  li(t('  - FAR（Financial Accounting and Reporting）：GAAP会计准则全面考核')),
  li(t('  - REG（Taxation and Law）：联邦税法、企业税、伦理')),
  li(t('Discipline（选一门）：')),
  li(t('  - BAR：商业分析和报告（适合做审计咨询路线）')),
  li(t('  - ISC（Information Systems and Controls）：IT审计、网络安全（适合科技路线）')),
  li(t('  - TCP（Tax Compliance and Planning）：个人和企业税务规划（适合税务专家）')),
  h3('考试难度和通过率'),
  li(t('整体通过率：约50%，各科不一，FAR最难（约45%通过率）')),
  li(t('2024改革影响：总体难度与之前相近，但结构更聚焦实际工作技能')),
  h3('备考策略（工作同时备考）'),
  li(t('备考材料：Becker（最贵但最全）、Roger（性价比高）、Wiley CPAexcel（书本友好）')),
  li(t('时间规划：全职工作时每科3-4个月（每周15-20小时），Tax season避免考试')),
  li(t('顺序建议：BEC→AUD→FAR→REG（先难后易的反向，让大脑持续激活）')),
  li(t('刷题：Becker/Roger的题库是核心，MCQ>模拟题>TBS（Task-Based Simulations）')),
  h3('CPA for 非美本科学生'),
  li(t('学历评估：需要通过NASBA或各州Board评估中国学历（NACES会员机构）')),
  li(t('学分要求：大多数州要求150学分（中国本科通常只有120-130学分等效）')),
  li(t('补充学分：选择接受国际学历的州（Colorado、Montana等）要求较低')),
  li(t('经验要求：通常需要1-2年有CPA监督的工作经验才能拿证')),
  hr(),
  h2('四、FP&A（财务计划与分析）职业路径'),
  h3('FP&A日常工作'),
  li(t('预算编制：年度预算、季度更新、Rolling Forecast')),
  li(t('财务报告：月度/季度业绩分析，Variance Analysis（实际vs预算）')),
  li(t('Business Partnership：为各业务单元提供财务分析支持（真正的商业伙伴角色）')),
  li(t('特别项目：M&A分析、新产品财务建模、市场进入分析')),
  h3('FP&A薪资数据（2024）'),
  li(t('Financial Analyst（0-3年）：$65-90k')),
  li(t('Senior Financial Analyst（3-6年）：$90-120k')),
  li(t('FP&A Manager（6-10年）：$120-160k')),
  li(t('Director of FP&A（10年+）：$160-220k')),
  li(t('VP/CFO路径：通常20年总path')),
  h3('FP&A最推荐的工具技能'),
  li(t('Excel高级：Power Query、Power Pivot、复杂建模')),
  li(t('BI工具：Tableau、Power BI（现在是standard技能）')),
  li(t('ERP系统：SAP、Oracle、Workday（大公司用）')),
  li(t('SQL：中大型公司的FP&A需要从数据库pull数据，SQL越来越必须')),
  li(t('Python：新生代FP&A工具，自动化报告、数据处理')),
];

// ============================================================
// 页面5：🎮 游戏/娱乐/媒体行业职业路径（创意+商业融合）
// ============================================================
const entertainmentCareerBlocks: any[] = [
  p(t('来源：Game Developers Conference（GDC）就业报告、Hollywood Reporter行业薪资调研、Glassdoor游戏公司数据、Entertainment Finance Forum案例、Bloomberg Businessweek流媒体行业分析，2024年整合。', false, true)),
  hr(),
  h2('一、行业概况（游戏/娱乐/媒体）'),
  h3('规模和机会'),
  li(t('全球游戏市场：$200B+，超过电影和音乐行业之和')),
  li(t('流媒体：Netflix、Disney+、Apple TV+、Amazon Prime的内容投入持续增加')),
  li(t('音乐行业：Spotify、Apple Music的版权和艺人经营带来大量商业角色')),
  li(t('体育娱乐：NBA、NFL的数字化转型带来分析和商业化机会')),
  h3('为什么对中国学生有机会'),
  li(t('中国是最大游戏市场：腾讯、网易的美国分支大量招募懂中国市场的人才')),
  li(t('中美娱乐合拍/合作：需要双文化人才处理内容监管和市场定制')),
  li(t('电竞：中国是电竞超级强国，League of Legends、Honor of Kings的全球化需要中文人才')),
  hr(),
  h2('二、主要职业路径'),
  h3('游戏行业商业职位'),
  li(t('Game Producer：管理游戏开发项目，协调设计/工程/美术团队，类似tech PM但更创意')),
  li(t('Business Development（游戏BD）：Licensing、IP授权、Publisher/Developer合同谈判')),
  li(t('User Acquisition（UA）Manager：付费广告投放优化，ROI分析，面向移动游戏')),
  li(t('Monetization Manager：游戏内购设计、订阅模式、战斗通行证（Battle Pass）策略')),
  li(t('Analytics/Data Science：用数据分析玩家行为、优化留存率和付费率')),
  h3('影视/流媒体商业职位'),
  li(t('Content Acquisition：评估和购买内容IP，需要懂市场和创意双面')),
  li(t('Film Finance：电影项目融资，Pre-sale、Distribution Deal、Tax Incentives')),
  li(t('Studio Finance/FP&A：Netflix/Disney内部财务，Content Budget管理')),
  li(t('Talent Agency（经纪公司）：CAA、WME、UTA的Agent或Coordinator——传统路径极难但是行业门槛')),
  h3('代表公司和职位'),
  li(t('游戏：Riot Games（LA）、Activision Blizzard（LA）、EA（San Jose）、2K Games（NYC）')),
  li(t('腾讯美国、网易互娱美国：面向美国市场的中国游戏大厂，中文是显著优势')),
  li(t('流媒体：Netflix（LA/NYC）、Disney+ （Burbank）、Amazon Prime Video（Seattle/Culver City）')),
  li(t('音乐科技：Spotify（NYC）、Apple Music（Cupertino）、SoundCloud')),
  hr(),
  h2('三、娱乐行业面试特殊准备'),
  h3('娱乐行业的特殊招聘文化'),
  li(t('人脉优先：70%以上的职位通过关系填补，冷申请转化率极低')),
  li(t('助手文化（Entry Level）：传统娱乐行业从Coordinator/Assistant做起，经常无薪或低薪')),
  li(t('了解你的内容：面试前必须深度了解那家公司的核心IP/产品（"What\'s your favorite game we make?"）')),
  li(t('展示激情：纯商业人才会被质疑"你真的热爱游戏/电影吗？"——要有真实的个人兴趣')),
  h3('进入路径策略'),
  li(t('商学院路径：MBA Summer Intern at Entertainment Finance/Strategy是最直接的路径')),
  li(t('创意行业实习：在制作公司、游戏公司的任何实习，哪怕是营销助理，都比其他行业实习更有用')),
  li(t('GDC/SXSW/Tribeca Film Festival：参加行业会议，这些场合的networking效率极高')),
  li(t('从Tech跳跃：从FAANG的媒体/内容团队（Netflix Tech、YouTube Partnerships）跳到娱乐主流')),
  h3('薪资现实'),
  li(t('传统娱乐（好莱坞体系）：起步很低（Coordinator $40-50k），但晋升后薪资追上来')),
  li(t('科技驱动娱乐（Netflix/Spotify）：科技公司薪资标准，比传统娱乐高30-50%')),
  li(t('游戏行业：与科技公司基本持平，Riot Games/Activision等大厂薪资竞争力强')),
  hr(),
  h2('四、电竞（Esports）职业路径（新兴方向）'),
  h3('电竞行业机会'),
  li(t('全球电竞收入：$1.4B（2024），中国是最大市场')),
  li(t('赛事运营：ESL、PGL、Riot Global Events等电竞赛事公司')),
  li(t('战队管理：Team SoloMid（TSM）、Cloud9、100 Thieves等电竞战队的商业职位')),
  li(t('品牌合作：电竞赞助是增长最快的营销形式，Red Bull/Monster/BMW都大量投入')),
  h3('中国学生在电竞的独特机会'),
  li(t('英雄联盟LPL（中国）+LCS（北美）跨区业务：精通两个赛区文化的人才极稀缺')),
  li(t('Honor of Kings（王者荣耀）国际化：腾讯推动全球化，中文+游戏理解是入场券')),
  li(t('电竞媒体/内容：中文电竞解说/内容在北美华人社区有稳定受众')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十六批）...');

  await createPage('🎓 PhD毕业生工业界求职指南（学术→产业完整转型）', phdIndustryBlocks);
  await createPage('🌐 跨国公司China Desk职位攻略（双语双文化优势利用）', chinaDeskBlocks);
  await createPage('🔬 制药/生物科技行业求职完全攻略（BD/HEOR/VC路径）', pharmaCareerBlocks);
  await createPage('📊 财务/会计职业深度攻略（Big4出路/CPA/CFO路径）', accountingDeepBlocks);
  await createPage('🎮 游戏/娱乐/媒体行业职业路径（创意+商业融合）', entertainmentCareerBlocks);

  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
