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
// 页面1：🔐 网络安全/Cybersecurity职业路径（攻防/合规/分析）
// ============================================================
const cybersecurityBlocks: any[] = [
  p(t('来源：ISC2 Cybersecurity Workforce Study 2023、Glassdoor安全职位薪资、SANS Institute认证指南、CrowdStrike/Palo Alto Networks招聘信息、Dark Reading行业新闻，2024年整合。', false, true)),
  hr(),
  h2('一、网络安全就业市场概况'),
  h3('行业规模和机会'),
  li(t('人才缺口：全球网络安全人才缺口约340万（ISC2 2023报告），美国缺口最大')),
  li(t('薪资高：Entry Level Security Analyst $70-90k，比同级别CS职位高15-20%')),
  li(t('签证友好：安全领域技能稀缺，雇主H-1B赞助意愿较强')),
  li(t('远程友好：大量安全岗位支持远程工作（SOC分析师等）')),
  h3('中国学生的特殊考量'),
  li(t('政府安全职位（需要Clearance）：通常要求美国公民，国际学生/绿卡不能申请')),
  li(t('私企安全职位：完全开放，不受国籍限制')),
  li(t('因此重点方向：科技公司Security团队、金融机构信息安全、安全咨询、Security产品公司')),
  hr(),
  h2('二、主要职业方向'),
  h3('Security Operations Center（SOC）Analyst'),
  li(t('工作：监控网络异常、分析告警、响应安全事件（Incident Response）')),
  li(t('层级：L1（初级，处理routine alerts）→L2（深入调查）→L3（高级威胁分析）')),
  li(t('工具：SIEM（Splunk、IBM QRadar、Microsoft Sentinel）、EDR（CrowdStrike Falcon）')),
  li(t('薪资：L1 $55-75k、L2 $75-100k、L3 $100-140k')),
  h3('Penetration Tester（渗透测试师）'),
  li(t('工作：模拟黑客攻击，发现系统漏洞，写测试报告（合法的"道德黑客"）')),
  li(t('工具：Metasploit、Burp Suite、Nmap、Kali Linux、Wireshark')),
  li(t('认证：CEH（基础）→OSCP（最认可）→GPEN/GWAPT（进阶）')),
  li(t('薪资：$90-140k，资深Pen Tester $150-200k')),
  h3('Cloud Security Engineer'),
  li(t('工作：保护AWS/Azure/GCP基础设施，IAM策略、网络隔离、数据加密')),
  li(t('需求最旺：云迁移浪潮下，Cloud Security工程师严重短缺')),
  li(t('认证：AWS Security Specialty、Azure Security Engineer Associate、CCSP')),
  li(t('薪资：$130-180k，有云经验的安全专家供不应求')),
  h3('Application Security（AppSec）Engineer'),
  li(t('工作：Secure SDLC、代码安全审计、SAST/DAST工具部署、Developer Security培训')),
  li(t('背景要求：需要有开发背景（能读懂代码），一般Senior SWE转型')),
  li(t('薪资：$140-200k，AppSec Engineer是安全领域薪资最高的工程类职位')),
  h3('GRC（治理、风险与合规）'),
  li(t('工作：确保公司满足安全法规要求（SOC 2、ISO 27001、HIPAA、GDPR、PCI DSS）')),
  li(t('背景：法学、风险管理、会计背景转入也可以，不需要深度技术能力')),
  li(t('薪资：$80-130k，合规分析师到GRC Manager')),
  hr(),
  h2('三、核心认证路径'),
  h3('入门级认证（0-1年经验）'),
  li(t('CompTIA Security+：最广为接受的入门认证，很多政府合同要求，费用约$400')),
  li(t('CompTIA Network+：在Security+之前学，帮助理解网络基础')),
  li(t('Google Cybersecurity Certificate（Coursera）：免费/低价，6个月内可完成，进入入门门槛')),
  h3('中级认证（1-3年经验）'),
  li(t('OSCP（Offensive Security Certified Professional）：渗透测试必须，24小时考试（实操），$1499')),
  li(t('CEH（Certified Ethical Hacker）：EC-Council颁发，业界认可度一般但HR认识')),
  li(t('AWS Security Specialty：云安全必备，AWS生态系统工作必要')),
  li(t('CISM（Certified Information Security Manager）：管理路线，ISC2颁发')),
  h3('高级认证（3年+经验）'),
  li(t('CISSP：被称为安全领域"最难认证"，需要5年工作经验，黄金标准认证')),
  li(t('CCSP（Cloud Security Professional）：云安全顶级认证，ISC2颁发')),
  hr(),
  h2('四、求职策略'),
  h3('简历建议'),
  li(t('Home Lab经验：搭建虚拟化安全实验室（VMware/VirtualBox + Kali Linux + Metasploitable）')),
  li(t('CTF（Capture the Flag）比赛：HackTheBox、TryHackMe、PicoCTF，是展示技术能力的证明')),
  li(t('Bug Bounty：在HackerOne/Bugcrowd参与漏洞赏金项目，有发现记录是超级加分项')),
  li(t('GitHub安全项目：写安全工具、分析malware、做CVE分析——展示真实技术能力')),
  h3('求职平台'),
  li(t('LinkedIn：搜索"Information Security"、"SOC Analyst"、"Security Engineer"')),
  li(t('CyberSN：专注网络安全职位的求职平台')),
  li(t('SANS job board：SANS Institute维护的安全职位板块，质量高')),
  li(t('Black Hat/DEF CON：安全领域最大会议，有大量现场招聘')),
];

// ============================================================
// 页面2：🎨 UX设计/用户体验职业路径（Design到Design Strategy）
// ============================================================
const uxDesignBlocks: any[] = [
  p(t('来源：Nielsen Norman Group UX职业报告、IDEO Design Thinking课程、Figma Community、Adobe XD职位分析、Glassdoor UX Designer薪资数据，2024年整合。', false, true)),
  hr(),
  h2('一、UX设计行业概况'),
  h3('UX设计的职位细分'),
  li(t('UX Designer：全面负责用户研究、原型设计、交互设计、可用性测试')),
  li(t('UI Designer：专注视觉界面——颜色、字体、组件库（更偏美术向）')),
  li(t('UX Researcher：专注用户研究（访谈/调研/可用性测试），不做设计')),
  li(t('Product Designer：同义于UX Designer，在科技公司更常用的职称')),
  li(t('Design Strategist：更高层次的设计决策，连接设计和商业战略')),
  h3('市场状况（2024）'),
  li(t('UX工作市场：相对2021年高峰收缩，但仍然有需求，竞争更激烈')),
  li(t('需求方：科技公司（Google/Meta/Apple）、金融科技、医疗科技、咨询')),
  li(t('差异化：能做用户研究+设计的全栈UX设计师比纯UI设计师更有竞争力')),
  hr(),
  h2('二、UX设计师核心技能栈'),
  h3('软技能（最重要）'),
  li(t('用户同理心：真正理解用户需求，不是设计自己喜欢的东西')),
  li(t('沟通和讲故事：把设计决策解释给PM/工程师/领导——说服力是核心技能')),
  li(t('批判性思维：能接受批评，用数据/研究支持设计决策')),
  h3('硬技能和工具'),
  li(t('Figma（必须）：现在是行业标准，替代了Sketch，全面学习包括Auto Layout/Components/Variables')),
  li(t('Prototyping：Figma原型+必要时Principle/ProtoPie（做复杂交互动效）')),
  li(t('用户研究：UserTesting平台、Maze、Hotjar、Google Analytics（定量）')),
  li(t('Design Systems：Figma Component Library构建，Storybook理解')),
  li(t('基础前端：不需要会写代码，但要理解HTML/CSS/JS的限制和可能性')),
  hr(),
  h2('三、作品集（Portfolio）建立策略'),
  h3('Portfolio是UX求职的核心——比简历更重要'),
  li(t('展示过程，不只是结果：招聘方看的是你的思维过程（Research→Define→Ideate→Prototype→Test）')),
  li(t('每个项目包含：用户问题→研究发现→设计决策→最终方案→影响/结果')),
  li(t('质量>数量：3个深度的项目比8个浅的项目好很多')),
  h3('项目来源（对学生）'),
  li(t('实际产品改进：选一个你常用但UX有问题的App，做完整的重设计分析')),
  li(t('非盈利项目：Catchafire、VolunteerMatch上有大量NGO需要免费UX设计支持')),
  li(t('虚构项目：选一个真实的问题空间（如"如何改善学生找兼职的体验"）做完整设计过程')),
  li(t('实习/课堂项目：把学校做的项目包装好，重点展示过程和思维')),
  h3('Portfolio网站'),
  li(t('平台推荐：UXfolio（专为UX设计师）、Framer（高颜值）、Webflow（最灵活）')),
  li(t('避免：用Behance或PDF展示——交互性差，无法展示原型')),
  li(t('必须有Figma交互原型嵌入，让面试官可以直接体验你的设计')),
  hr(),
  h2('四、面试流程和准备'),
  h3('UX面试特有环节：Design Challenge'),
  li(t('Take-Home：给你一个问题，2-3天设计并提交（平衡质量和速度）')),
  li(t('Whiteboard：现场快速设计（30-60分钟），考察框架和快速迭代能力')),
  h3('Whiteboard Design框架（CIRCLES改进）'),
  li(t('1. 澄清（Clarify）：确认用户、场景、约束条件')),
  li(t('2. 关键流程（Key Flows）：画出用户完成核心任务的2-3个流程')),
  li(t('3. 设计（Design）：快速线框图（wireframe），说明设计决策')),
  li(t('4. 迭代（Iterate）：面试官feedback后快速修改')),
  li(t('5. 成功指标（Metrics）：如何衡量这个设计的成功？')),
  h3('对中国学生的建议'),
  li(t('用你对中国超级App（微信/支付宝）的深度理解：在分析设计决策时这是真实的比较优势')),
  li(t('解释设计背后的Why：不要只说"我觉得这样好看"，要说"这个决策基于研究发现X"')),
];

// ============================================================
// 页面3：💻 系统设计面试完全攻略（SWE必备，分布式架构）
// ============================================================
const systemDesignBlocks: any[] = [
  p(t('来源：《Designing Data-Intensive Applications》（Martin Kleppmann）、Alex Xu《System Design Interview》Vol 1-2、Grokking the System Design Interview（Educative.io）、前Google/Meta/Amazon工程师YouTube系统设计讲解，2024年整合。', false, true)),
  hr(),
  h2('一、系统设计面试概述'),
  h3('什么是系统设计面试'),
  li(t('考察你设计大规模分布式系统的能力（如：设计Twitter、设计URL短链服务）')),
  li(t('通常在L5+（Senior Engineer）面试中出现，初级工程师也越来越多考')),
  li(t('开放式问题，没有唯一正确答案，考察思维过程和权衡（trade-off）意识')),
  h3('面试评估维度'),
  li(t('需求分析能力：主动澄清functional/non-functional requirements')),
  li(t('量级估算：计算QPS（每秒查询数）、存储、带宽需求')),
  li(t('组件设计：选择合适的数据库/缓存/消息队列，解释为什么')),
  li(t('Scale考量：如何从1000用户扩展到1亿用户')),
  li(t('Trade-off意识：CAP理论、一致性vs可用性的权衡')),
  hr(),
  h2('二、系统设计框架（Step-by-Step）'),
  h3('Step 1：需求澄清（5分钟）'),
  li(t('功能需求（Functional）："用户可以发帖、评论、关注其他用户"')),
  li(t('非功能需求（Non-functional）："支持1亿MAU，读多写少，99.9% uptime，延迟<100ms"')),
  li(t('范围确认："今天我们重点设计新闻Feed，不考虑广告系统"')),
  h3('Step 2：量级估算（3-5分钟）'),
  li(t('用户量：1亿MAU，每天10%活跃=1000万DAU')),
  li(t('QPS：1000万用户 × 10次/天请求 / 86400秒 ≈ 1200 QPS（读），写QPS更低')),
  li(t('存储：每条推文100字节，每天1000万条推文 = 1GB/天，3年=~1TB')),
  li(t('带宽：1200 QPS × 每个响应10KB = 12MB/s')),
  h3('Step 3：高层架构（High-Level Design）'),
  li(t('画出：Client → CDN → Load Balancer → API Gateway → Service Layer → DB')),
  li(t('标准组件：Web Server、Application Server、Cache（Redis）、Database（SQL/NoSQL）、Message Queue')),
  li(t('不要一开始就跳进细节——先展示全局，再逐步深入')),
  h3('Step 4：详细设计（Deep Dive）'),
  li(t('数据库选择：关系型（PostgreSQL/MySQL）vs NoSQL（DynamoDB/Cassandra/MongoDB）的选择逻辑')),
  li(t('缓存策略：Cache Aside、Write Through、Write Behind、Read Through')),
  li(t('消息队列：Kafka（高吞吐）、RabbitMQ（低延迟）、SQS（AWS托管）')),
  li(t('API设计：RESTful vs GraphQL的权衡')),
  h3('Step 5：Scale（1-2分钟）'),
  li(t('水平扩展：Stateless服务加Load Balancer')),
  li(t('数据库扩展：Sharding（水平分库）、Read Replica（读写分离）')),
  li(t('CDN：静态资源全球加速')),
  li(t('Rate Limiting：防止滥用')),
  hr(),
  h2('三、必会经典系统设计题详解'),
  h3('设计URL短链接服务（类似bit.ly）'),
  li(t('核心功能：输入长URL → 生成短链 → 短链重定向到长URL')),
  li(t('关键设计：短链ID生成（Base62编码）、Redirect 301 vs 302、过期时间处理')),
  li(t('存储：KV Store（Redis+MySQL），短链→长URL映射')),
  li(t('Scale：读多写少，重度缓存，全球CDN')),
  h3('设计Twitter/X首页Feed'),
  li(t('核心：用户关注关系 + 时间线生成 + 实时推送')),
  li(t('Push vs Pull：Pull Model（用户打开时实时计算）vs Push Model（写入时推送到粉丝Feed）')),
  li(t('混合策略：名人用Pull（粉丝太多不能Push），普通用户用Push')),
  li(t('数据库：关系表（User Follow）+ 时序数据（Tweet）+ Cache（Hot Feed）')),
  h3('设计分布式缓存（类似Redis）'),
  li(t('功能：GET/SET/DELETE，支持TTL，分布式')),
  li(t('一致性哈希：添加/删除节点时最小化数据迁移')),
  li(t('数据分区：Hash Slot（Redis Cluster的方式）')),
  li(t('Replication：主从复制保证高可用')),
  h3('设计Google Drive/Dropbox'),
  li(t('分块上传：大文件分成小块（Chunk），断点续传')),
  li(t('存储：Block Storage（S3）+ MetaData DB（记录文件→Chunk映射）')),
  li(t('同步：冲突检测（版本号/Last-Write-Wins）')),
  li(t('CDN：热门文件边缘缓存')),
  hr(),
  h2('四、核心技术概念速记'),
  h3('CAP定理'),
  li(t('Consistency（一致性）：所有节点同时看到相同数据')),
  li(t('Availability（可用性）：每次请求都能收到响应（不保证最新数据）')),
  li(t('Partition Tolerance（分区容错）：网络分区时系统仍然运行')),
  li(t('CA系统（不能容忍分区）：传统关系型数据库')),
  li(t('CP系统（牺牲可用性）：HBase、Zookeeper')),
  li(t('AP系统（牺牲一致性）：Cassandra、CouchDB')),
  h3('数据库选型原则'),
  li(t('用SQL（关系型）：需要ACID、复杂JOIN查询、事务一致性（支付、订单）')),
  li(t('用NoSQL文档（MongoDB）：非结构化数据、快速迭代、schema灵活')),
  li(t('用NoSQL宽列（Cassandra）：时序数据、IoT、高写入量、天然分布式')),
  li(t('用KV存储（Redis/DynamoDB）：缓存、会话、高频简单读写')),
  li(t('用图数据库（Neo4j）：社交网络、知识图谱、复杂关系查询')),
  h3('推荐备考资源'),
  li(t('书籍：《System Design Interview》Alex Xu Vol 1+2（必读）')),
  li(t('书籍：《Designing Data-Intensive Applications》（深度理解，但内容重）')),
  li(t('视频：ByteByteGo YouTube（Alex Xu的系统设计视频）')),
  li(t('视频：Gaurav Sen YouTube（印度系统设计教学名人）')),
  li(t('练习：Exponent mock interview、Pramp点对点模拟面试')),
];

// ============================================================
// 页面4：📋 美国工作Visa详解（OPT/H-1B/L-1/O-1/EB全面解析）
// ============================================================
const visaGuideDeepBlocks: any[] = [
  p(t('来源：USCIS官方政策文件、移民律师Greg Siskind的博客、National Foundation for American Policy H-1B统计报告、Immigration Planner案例、多位过来人经历整合，2024年最新信息。', false, true)),
  hr(),
  h2('一、F-1/OPT签证详解'),
  h3('OPT基本规则'),
  li(t('OPT：Optional Practical Training，F-1学生毕业后的合法工作许可')),
  li(t('时长：标准12个月，STEM专业延期至36个月（共3年）')),
  li(t('关键：必须在专业相关领域工作（但"相关"定义较宽泛）')),
  li(t('申请时机：毕业前90天申请，EAD（工作许可）通常需要3-5个月处理')),
  h3('STEM OPT延期注意事项'),
  li(t('E-Verify要求：雇主必须参与E-Verify才能赞助STEM OPT延期')),
  li(t('训练计划（Training Plan）：Form I-983，需要雇主配合填写')),
  li(t('24个月延期：OPT第12个月结束前60天申请，两次12个月延期（共24个月）')),
  li(t('工作性质：必须是与学位"directly related"的工作——但解释较宽泛')),
  h3('OPT期间的风险管理'),
  li(t('失业期：OPT期间累计失业不超过90天（STEM OPT：150天）')),
  li(t('换工作：可以换工作，但必须一直保持在相关领域，并更新SEVP系统')),
  li(t('创业：可以在自己公司工作，但公司必须符合要求，建议咨询律师')),
  hr(),
  h2('二、H-1B签证完全解析'),
  h3('H-1B申请时间线（2025年周期）'),
  li(t('1月：H-1B注册系统开放，雇主提交候选人信息')),
  li(t('3月初：注册窗口关闭（约2周），每年略有变化')),
  li(t('3月底/4月初：USCIS公布抽签结果（中签者收到通知）')),
  li(t('4月-6月：中签者提交正式申请（I-129申请包）')),
  li(t('10月1日：H-1B生效日（新财年开始）')),
  h3('H-1B抽签中签率（历史数据）'),
  li(t('2020年：66%（注册制度改革前）')),
  li(t('2021年：61%')),
  li(t('2022年：53%（注册数暴增）')),
  li(t('2023年：39%（多次注册欺诈问题后调整）')),
  li(t('2024年：约50%（USCIS增加了高等学历配额比例）')),
  h3('H-1B相关规则'),
  li(t('职位要求："Specialty Occupation"，通常需要学士及以上学历')),
  li(t('薪资要求：必须支付Prevailing Wage（同地区同职位的市场工资中位数）')),
  li(t('H-1B Transfer：换工作要提交Transfer申请，建议提交后再离开前雇主')),
  li(t('Cap-Exempt雇主：大学、研究机构、非盈利（符合条件）不受抽签限制')),
  li(t('Premium Processing：加急处理费$2805，15个工作日决定，不增加批准概率')),
  hr(),
  h2('三、其他工作签证选项'),
  h3('L-1签证（跨国公司内部调动）'),
  li(t('L-1A（管理/行政职位）：在母公司工作1年后可以调到美国，绿卡路径相对快')),
  li(t('L-1B（专业知识）：在母公司工作1年后，以专业技能被调到美国')),
  li(t('时长：L-1A最长7年，L-1B最长5年')),
  li(t('优势：没有抽签，只要满足条件就批')),
  li(t('路径：在中国总部/分公司工作1年以上→申请L-1到美国办公室')),
  h3('O-1A签证（杰出能力）'),
  li(t('适用于：在其领域有"非凡成就"的个人')),
  li(t('证明标准（满足至少3条）：获得重大奖项、媒体报道、高薪酬、重要贡献等')),
  li(t('优势：无抽签配额，可随时申请；雇主赞助即可（也可自雇）')),
  li(t('劣势：申请材料要求高，需要移民律师，约$5000-10000律师费')),
  li(t('适合：有一定学术/行业成就的人（发表过论文、获过奖、高薪者）')),
  h3('TN签证（加拿大/墨西哥公民专属）'),
  li(t('USMCA/NAFTA协议下，特定职业的加拿大/墨西哥公民可以快速工作')),
  li(t('不适用于中国公民')),
  li(t('但策略：先移民加拿大拿PR，再以加拿大公民身份申请TN进入美国工作')),
  hr(),
  h2('四、绿卡申请策略（针对中国大陆出生者）'),
  h3('EB-1A（杰出成就——推荐重点研究）'),
  li(t('优点：无排队（Priority Date是即时的），无需雇主担保')),
  li(t('10条证明标准中满足任意3条即可：')),
  li(t('  - 获得重大奖项（包括国内竞赛/学术奖项）')),
  li(t('  - 专业组织会员（需要杰出成就才能加入的组织）')),
  li(t('  - 媒体报道（专业媒体/行业媒体对你的报道）')),
  li(t('  - 担任评审（期刊评审、比赛评委、政府专家评审）')),
  li(t('  - 原创贡献（对领域的实质性贡献——发表论文/开源项目引用量）')),
  li(t('  - 学术文章（作为第一作者发表）')),
  li(t('  - 艺术/商业展览')),
  li(t('  - 领导角色（在杰出组织中担任要职）')),
  li(t('  - 高薪（与同行相比）')),
  li(t('  - 商业成功（表演艺术/商业票房）')),
  h3('如何提前布局EB-1A申请材料'),
  li(t('参加学术/行业会议并做演讲——建立媒体记录')),
  li(t('主动担任期刊审稿人（很多期刊欢迎博士生/年轻学者参与）')),
  li(t('写专业博客/文章发布在行业媒体——建立媒体报道记录')),
  li(t('GitHub开源项目积累Star/Fork——展示原创贡献')),
  li(t('申请行业奖项（哪怕小奖也有帮助）')),
];

// ============================================================
// 页面5：🔑 美国求职全流程追踪系统（从搜职到拿Offer的系统化方法）
// ============================================================
const jobSearchSystemBlocks: any[] = [
  p(t('来源：Teal HQ求职追踪工具、Notion官方求职模板、Joshua Fluke（YouTube求职顾问）、Ramit Sethi《I Will Teach You to Be Rich》求职章节、Job Search Coach Podcast，2024年整合。', false, true)),
  hr(),
  h2('一、系统化求职的重要性'),
  h3('为什么需要系统'),
  li(t('普通求职者：随机投简历→等待→焦虑→又随机投→循环')),
  li(t('系统化求职者：有计划、有追踪、有分析→能主动优化成功率')),
  li(t('数据表明：求职期间平均投150-250份简历才拿到1个Offer——你需要组织管理这个过程')),
  h3('建立求职系统的核心组件'),
  li(t('职位追踪表（Job Tracker）：记录每个职位的状态和后续行动')),
  li(t('人脉追踪表（Networking Tracker）：记录每个联系人的信息和跟进计划')),
  li(t('简历版本管理：针对不同类型职位的定制简历')),
  li(t('时间预算：每天固定的求职时间（不要让求职占满整个生活）')),
  hr(),
  h2('二、职位追踪表（Job Tracker）建立方法'),
  h3('追踪表核心字段'),
  li(t('公司名称、职位名称、申请日期、申请状态、链接/JD截图')),
  li(t('联系人：认识的内部员工或Recruiter')),
  li(t('面试轮次和时间：每次面试后记录面试官姓名和问题')),
  li(t('下一步行动：什么时候发Thank You邮件、什么时候follow up')),
  li(t('备注：面试反馈、公司文化印象、是否值得继续')),
  h3('申请状态分类'),
  li(t('Wishlist：想申请但还没行动')),
  li(t('Applied：已提交申请')),
  li(t('Screening：HR电话筛选阶段')),
  li(t('Interview：已进入正式面试')),
  li(t('Offer：收到Offer')),
  li(t('Rejected：已拒绝/被拒')),
  li(t('Withdrawn：主动撤回申请')),
  h3('工具推荐'),
  li(t('Teal HQ（teal.work）：专为求职设计的免费工具，有Chrome插件可以一键保存职位')),
  li(t('Notion模板：Job Search Tracker模板，自定义灵活，推荐有技术能力的人使用')),
  li(t('Excel/Google Sheets：最简单，自己建表，完全控制')),
  hr(),
  h2('三、每周求职节奏管理'),
  h3('推荐的每周框架（求职密集期）'),
  li(t('周一：研究目标公司（1-2家），更新求职追踪表，规划本周目标')),
  li(t('周二/周三：发送Informational Interview请求（批量），回复邮件，参加网络活动')),
  li(t('周四：刷题/技术准备，更新简历，写Cover Letter')),
  li(t('周五：批量投简历（周五投的简历周一被看到），跟进上周的请求')),
  li(t('周末：至少一天完全休息，避免burnout')),
  h3('KPI设定（关键指标）'),
  li(t('每周申请目标：求职密集期10-15份/周（太少没数据，太多影响质量）')),
  li(t('每周Networking目标：发送3-5条Informational Interview请求')),
  li(t('回复率追踪：记录申请→电话率（目标>5%），电话→面试率（目标>50%）')),
  li(t('转化漏斗分析：如果某个阶段转化率低，说明那个环节需要优化')),
  hr(),
  h2('四、简历投递效率优化'),
  h3('定制化简历策略'),
  li(t('基础简历（Master Resume）：包含所有经历的完整版本（不用来直接投）')),
  li(t('定制版本：根据职位JD，从Master Resume中选择最relevant的经历')),
  li(t('关键词优化：把JD中重复出现的关键词（工具名/技能名）融入简历')),
  li(t('ATS优化：使用简单格式（无表格/图片），关键词自然嵌入')),
  h3('内推（Referral）系统化策略'),
  li(t('目标率：争取所有申请中30%通过Referral渠道（内推简历筛选通过率高5-10倍）')),
  li(t('识别内推候选人：Linkedin搜索目标公司+你的校友/同学/朋友圈')),
  li(t('请求内推的时机：先做Informational Interview，然后再请求内推（成功率更高）')),
  li(t('感谢内推人：提供内推者的后续反馈（面试情况），这是基本礼貌')),
  h3('多渠道并行策略'),
  li(t('官网直投（40%精力）：针对目标公司，直接在官网申请，JD最新最准确')),
  li(t('LinkedIn申请（20%精力）：Easy Apply适合快速批量，但竞争激烈')),
  li(t('内推（30%精力）：花时间维护找内推，回报率最高')),
  li(t('猎头（10%精力）：让猎头主动联系你（优化LinkedIn Profile），对于有经验者更有用')),
  hr(),
  h2('五、求职时间线规划建议'),
  h3('按毕业时间倒推'),
  li(t('5月毕业：10-11月是最重要的招聘高峰，9月开始全力准备')),
  li(t('12月毕业：3-4月是夏季实习申请季，秋季是全职申请高峰')),
  li(t('全职1月入职：9-10月对应招聘周期，提前3-4个月开始申请')),
  h3('求职密集期长度预期'),
  li(t('IB/咨询（最快）：如果走target school OCR，11月就能拿到offer')),
  li(t('科技公司：3-6个月求职周期（申请到offer）')),
  li(t('非传统路径：可能6-12个月，要有耐心和财务准备')),
  li(t('普遍规律：越早开始，选择越多；等到最后关头，好机会已经被人占完')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十八批）...');

  await createPage('🔐 网络安全/Cybersecurity职业路径（攻防/合规/Cloud Security）', cybersecurityBlocks);
  await createPage('🎨 UX设计/用户体验职业路径（Portfolio到Design Strategy）', uxDesignBlocks);
  await createPage('💻 系统设计面试完全攻略（分布式架构/CAP理论/经典题详解）', systemDesignBlocks);
  await createPage('📋 美国工作Visa深度解析（OPT/H-1B/L-1/O-1/EB绿卡全攻略）', visaGuideDeepBlocks);
  await createPage('🔑 求职全流程系统化方法（追踪表/节奏管理/内推策略）', jobSearchSystemBlocks);

  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
