/**
 * 美国商科求职知识库 - 深度内容补充（第十一批）
 * 生物医药求职 / LeetCode攻略 / 城市选择 / 美国个人理财 / 研究生项目选择
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
// 页面1：💊 生物医药/医疗行业求职全攻略
// ============================================================
const healthcareBiotechBlocks: any[] = [
  p(t('来源：BioPharma Dive行业报告、EvaluatePharma数据、Goldman Sachs Healthcare Research、BioCentury、MedCityNews、Wall Street Oasis Healthcare IB论坛，综合真实候选人分享。', false, true)),
  hr(),
  h2('一、医疗/生物医药行业的主要金融职位'),
  h3('Healthcare Investment Banking（Healthcare IB）'),
  li(t('工作内容：为制药/生物科技/医疗设备公司提供M&A顾问和融资服务')),
  li(t('客户类型：大型Pharma（辉瑞/强生/默沙东）、Biotech（Moderna/BioNTech）、医疗设备（Medtronic/Boston Scientific）')),
  li(t('顶级Healthcare IB：Evercore/Lazard/Goldman/JPM/Morgan Stanley Healthcare Group')),
  li(t('差异化优势：生物/化学/医学背景能真正理解产品价值，在client meeting中极有优势')),
  li(t('薪资：与通用IB相同（$110k base + bonus），但exit到Healthcare PE/VC更有竞争力')),
  h3('Biotech Equity Research'),
  li(t('工作内容：分析生物科技公司，发布研究报告，预测临床试验结果')),
  li(t('特别技能：能读懂FDA申报文件、理解药物MOA（作用机制）、预测Phase 3成功率')),
  li(t('薪资：Senior Biotech Analyst是所有ER中薪资最高之一（$500k-$1.5M）')),
  li(t('原因：真正懂科学+金融的复合人才极其稀缺')),
  h3('Healthcare Private Equity（Healthcare PE）'),
  li(t('代表基金：KKR Healthcare / Blackstone Life Sciences / TPG Healthcare / Bain Capital Life Sciences')),
  li(t('投资策略：医疗服务（医院/诊所）/ 制药 / 医疗技术 / 数字健康')),
  li(t('医疗服务PE的特殊性：涉及大量监管（Medicare/Medicaid报销规则）')),
  li(t('入行路径：Healthcare IB 2年 → Healthcare PE Associate（标准路径）')),
  h3('Biotech/Pharma VC'),
  li(t('代表基金：ARCH Venture Partners / Atlas Venture / OrbiMed / Third Rock Ventures')),
  li(t('投资阶段：多数从Pre-clinical到Phase 2，很早期')),
  li(t('核心技能：科学判断（这个MOA是否合理？）+ 商业化分析（市场够大吗？）')),
  li(t('MD/PhD背景在这里更受欢迎（甚至必须）')),
  hr(),
  h2('二、Healthcare IB面试特别准备'),
  h3('必须了解的医疗行业知识'),
  li(t('FDA药物审批路径：IND → Phase 1/2/3临床试验 → NDA/BLA申请 → FDA审评（标准12个月，优先审评6个月）')),
  li(t('临床试验成功率：Phase 1→批准约10%；Phase 2→批准约15%；Phase 3→批准约50%')),
  li(t('专利悬崖（Patent Cliff）：当专利到期后，仿制药进入市场，原研药销售额断崖式下跌（最著名案例：Lipitor专利到期后销售下跌80%）')),
  li(t('生物类似药（Biosimilar）：对比仿制药，更复杂，要做可比性研究')),
  li(t('付款方（Payer）知识：美国医疗支付方=保险公司（UnitedHealth/Aetna/CVS Health）+ 政府（Medicare/Medicaid）')),
  h3('Healthcare IB特有估值方法'),
  li(t('rNPV（Risk-adjusted NPV）：每条管线价值 = 未来现金流 × 临床成功概率，然后折现')),
  li(t('Pipeline Valuation：sum-of-parts，每个药物分别估值相加')),
  li(t('Precedent Transaction Multiples：以EV/Revenue或EV/EBITDA衡量已批准产品')),
  li(t('Pre-revenue biotech：通常只能用DCF+rNPV，P/E毫无意义')),
  h3('Healthcare IB面试真题'),
  li(t('Walk me through how you would value a pre-revenue biotech company.')),
  li(t('If a drug fails Phase 3, how does that affect the company\'s stock and your DCF model?')),
  li(t('What are the key regulatory milestones for a drug\'s path to market?')),
  li(t('Pitch me a biotech company you\'d recommend we cover. What\'s your investment thesis?')),
  li(t('What is the difference between biologics and small molecule drugs? Why does it matter for valuation?')),
  hr(),
  h2('三、医疗行业薪资数据（2024年）'),
  h3('Healthcare IB（Analyst级别）'),
  li(t('Base：$110,000-$125,000（与通用IB相同）')),
  li(t('Bonus（好年份）：$80,000-$130,000')),
  li(t('2年后Exit：Healthcare PE Associate $200,000-$300,000')),
  h3('Biotech Equity Research'),
  li(t('Associate（1-3年）：$150,000-$250,000')),
  li(t('Senior Analyst（II Ranked）：$400,000-$1,500,000')),
  h3('Pharma/Biotech Corp Finance（公司内部）'),
  li(t('Sr. Financial Analyst at Pfizer/J&J：$90,000-$110,000 base')),
  li(t('Manager of Finance at Biotech：$110,000-$150,000')),
  li(t('Director of Finance at Large Pharma：$180,000-$250,000 total comp')),
  hr(),
  h2('四、Biotech公司内部职位（非金融）——也是好出路'),
  h3('Business Development（BD）'),
  li(t('工作内容：识别合作/收购机会，谈判licensing deals，代表公司与Pharma谈判')),
  li(t('薪资：$100,000-$200,000 base，通常有bonus和股票')),
  li(t('背景：MBA或科学背景+商业意识，MBA从咨询/IB转入最常见')),
  h3('Clinical Operations / Regulatory Affairs'),
  li(t('工作内容：管理临床试验项目，协调FDA申报')),
  li(t('薪资相对较低，但接近科学更多，不需要纯商业背景')),
  h3('Medical Device / Digital Health创业'),
  li(t('美国数字健康融资2024年约$9B，创业机会大')),
  li(t('中国学生优势：AI/ML技术背景 + 理解中美两地市场')),
  li(t('热门细分方向：AI辅助诊断 / 远程医疗 / 慢病管理 / 基因测序')),
];

// ============================================================
// 页面2：💻 LeetCode/编程面试完全攻略（非CS背景转技术）
// ============================================================
const leetcodeBlocks: any[] = [
  p(t('来源：LeetCode官方统计数据、NeetCode.io系统化题单、Blind App的Tech面试讨论、Cracking the Coding Interview (Gayle McDowell)、Reddit r/cscareerquestions面经，综合2024年最有效的刷题策略。', false, true)),
  hr(),
  h2('一、编程面试基础（非CS背景必读）'),
  h3('编程面试的真实难度分布（LeetCode）'),
  li(t('Easy（简单）：约占30%，基础题，用来热身和筛选基础能力')),
  li(t('Medium（中等）：约占55%，面试最常见难度，需要掌握核心算法')),
  li(t('Hard（困难）：约占15%，主要在高级别岗位或顶级公司（Google L5+）')),
  p(t('现实：大多数科技公司面试考Medium。如果你能稳定解决Medium，已经可以通过大多数面试。Hard题只在FAANG高级别岗位必须。')),
  h3('主要编程语言选择建议'),
  li(t('Python：', t('最推荐', true), t('，语法简洁，面试用代码最少，LeetCode上Python解法最多'))),
  li(t('Java：适合有Java背景的人，大公司很接受')),
  li(t('C++：Quant/HFT岗位偏好，但面试时容易出bug')),
  li(t('JavaScript：前端岗位，但不适合算法面试（缺少内置数据结构）')),
  hr(),
  h2('二、必须掌握的数据结构与算法'),
  h3('第一层：必须精通（所有公司都考）'),
  li(t('Array & String：Two Pointers / Sliding Window / Prefix Sum')),
  li(t('HashMap & HashSet：频率计数 / 查找重复 / 两数之和系列')),
  li(t('Stack & Queue：括号匹配 / 单调栈 / BFS队列')),
  li(t('Binary Search：在有序数组中搜索 / 搜索范围')),
  li(t('Tree (Binary Tree & BST)：DFS/BFS遍历 / 层序遍历 / 路径问题')),
  h3('第二层：必须理解（FAANG常考）'),
  li(t('Graph：BFS & DFS / 连通分量 / 拓扑排序')),
  li(t('Dynamic Programming：记忆化递归 / 0/1背包 / LCS/LIS系列')),
  li(t('Heap / Priority Queue：Top K问题 / 合并K个有序链表')),
  li(t('Backtracking：全排列 / 组合 / 子集问题')),
  li(t('Linked List：反转链表 / 环检测 / 合并有序链表')),
  h3('第三层：加分项（高级别岗位）'),
  li(t('Trie：前缀搜索 / 单词字典')),
  li(t('Segment Tree / BIT：区间查询')),
  li(t('Union Find (DSU)：连通性问题')),
  li(t('Bit Manipulation：XOR / 位运算技巧')),
  hr(),
  h2('三、系统化刷题计划（从零到能面试）'),
  h3('NeetCode 150（最推荐的刷题路线）'),
  li(t('网址：neetcode.io，精选150道最重要的题目，分类清晰')),
  li(t('每道题都有YouTube视频讲解（NeetCode频道）')),
  li(t('完成时间：扎实刷完约2-3个月（每天2-3小时）')),
  li(t('覆盖度：完成NeetCode 150可以通过大多数FAANG面试')),
  h3('具体刷题时间表（10周计划）'),
  li(t('第1-2周：Array + String + HashMap（基础，每天3题）')),
  li(t('第3-4周：Stack + Queue + Binary Search + Sliding Window')),
  li(t('第5-6周：Tree（Binary Tree + BST + BFS/DFS）')),
  li(t('第7-8周：Graph + Dynamic Programming（最难，要多花时间）')),
  li(t('第9周：综合复习 + 模拟面试')),
  li(t('第10周：Mock Interview（找人练习或用LeetCode模拟面试功能）')),
  h3('刷题方法论（很多人刷了300题还没过，是方法错了）'),
  li(t('第1步：先独立思考15-20分钟，不要立刻看答案')),
  li(t('第2步：如果没有思路，看hint（而非完整答案）')),
  li(t('第3步：自己写代码，提交，调试通过')),
  li(t('第4步：看最优解，理解时间复杂度O(n)等')),
  li(t('第5步：第二天不看答案重新写一遍（记忆+内化）')),
  li(t('第6步：每两周做一次"模拟面试"——限时45分钟、边说话边写代码')),
  hr(),
  h2('四、面试中的思考过程表达（Verbal Communication）'),
  h3('面试官想看什么'),
  li(t('你不只是"刷题机器"——面试官在评估你的思维过程，不只是最终答案')),
  li(t('沟通格式：Understand → Clarify → Approach → Code → Test')),
  h3('标准表达脚本'),
  li(t('开始前："Let me make sure I understand the problem. We have [input], and we need to return [output]. Is that right?"')),
  li(t('思考阶段："I\'m thinking of a few approaches... [Brute force] would be O(n^2), but we can optimize with [HashMap] to get O(n)."')),
  li(t('写代码时："I\'ll start by [initializing data structure], then [main loop logic]..."')),
  li(t('遇到卡壳时："Let me think through this edge case... if [input is empty], we should return [value]."')),
  li(t('完成后："Let me trace through an example to verify... with input [1,2,3], we get [result], which looks correct."')),
  hr(),
  h2('五、系统设计面试（Senior岗位必考）'),
  h3('系统设计面试的考核维度'),
  li(t('Functional Requirements：系统需要支持哪些功能？')),
  li(t('Non-functional Requirements：可用性/延迟/一致性/可扩展性')),
  li(t('High-level Design：主要组件和数据流')),
  li(t('Deep Dive：某一关键组件的详细设计')),
  h3('经典系统设计题目'),
  li(t('Design YouTube / Netflix（视频流媒体）')),
  li(t('Design Twitter（社交媒体时间线）')),
  li(t('Design Uber（实时位置追踪+匹配）')),
  li(t('Design a URL Shortener（TinyURL）')),
  li(t('Design Amazon\'s Product Search')),
  h3('学习资源'),
  li(t('System Design Primer（GitHub，免费）：最全面的入门资料')),
  li(t('Alex Xu《System Design Interview》：最推荐的书籍（Volume 1 + 2）')),
  li(t('YouTube：Gaurav Sen / ByteByteGo / FAANG Interviews 频道')),
];

// ============================================================
// 页面3：🏙️ 美国主要城市求职+生活对比（选城市指南）
// ============================================================
const cityGuideBlocks: any[] = [
  p(t('来源：Numbeo生活成本数据库（2024）、Levels.fyi城市薪资对比、Zillow租房市场数据、Reddit r/personalfinance城市对比帖、Bloomberg城市生活报告，覆盖6大求职目标城市。', false, true)),
  hr(),
  h2('一、六大求职城市总览'),
  h3('纽约（New York City）'),
  li(t('求职优势：金融之都，IB/HF/PE/咨询/媒体集中，机会密度最高')),
  li(t('主要行业：IB（goldman/MS/JPM等）、咨询（MBB NYC office）、科技（Amazon HQ2）、媒体')),
  li(t('生活成本：最高，一居室租金$3,000-$5,000/月（曼哈顿），布鲁克林/皇后区约$2,000-$3,000')),
  li(t('税收：纽约州+纽约市双重所得税，有效税率比加州还高（约51%最高边际税率）')),
  li(t('中国学生群体：极大，尤其是金融业，有大量华人聚集社区（法拉盛/曼哈顿华埠）')),
  li(t('总结：金融业必选城市，生活成本高但机会无与伦比')),
  h3('旧金山湾区（Bay Area）'),
  li(t('求职优势：科技公司大本营，Google/Meta/Apple/Salesforce/Airbnb总部聚集')),
  li(t('主要行业：科技/创业/VC/PE（科技型）')),
  li(t('生活成本：全美最高，一居室$3,000-$5,000+（旧金山市区），湾区其他地区$2,500-$4,000')),
  li(t('税收：加州州税最高，无city税，有效税率约13.3%顶边际（加上联邦约50%+）')),
  li(t('住房：全球最贵之一，购房极难（中位数$1.3M）')),
  li(t('总结：科技/VC首选，生活成本极高但TC补偿丰厚')),
  h3('西雅图（Seattle）'),
  li(t('求职优势：Amazon/Microsoft总部所在地，工程师天堂')),
  li(t('主要行业：科技（AWS/Azure/游戏/电商）、Boeing（航空航天）')),
  li(t('生活成本：中高，一居室$2,000-$3,500（西雅图市区）')),
  li(t('税收：华盛顿州无个人所得税！（重大优势，年省$20,000-$50,000）')),
  li(t('科技薪资：与湾区相近，但无州税，实际到手更多')),
  li(t('总结：对科技工程师非常有吸引力，税后收入可能优于湾区')),
  h3('芝加哥（Chicago）'),
  li(t('求职优势：期货/衍生品/Prop Trading圣地（CME/CBOE），咨询次中心，四大中西部hub')),
  li(t('主要行业：Trading（Citadel/DRW/Jump Trading/Optiver）、咨询（A.T. Kearney总部）、制造业金融')),
  li(t('生活成本：中等，一居室$1,800-$2,800（市区），郊区更低')),
  li(t('Quant/Trading机会：非常集中，仅次于纽约，Citadel/Two Sigma有芝加哥office')),
  li(t('总结：量化/交易首选，生活成本合理，城市文化好')),
  h3('波士顿（Boston）'),
  li(t('求职优势：生物医药/医疗科技重镇，学术资源密集，一些IB和AM也在此')),
  li(t('主要行业：Biotech/Pharma（Moderna/Vertex总部）、AMC（Wellington Management/Putnam）、咨询')),
  li(t('生活成本：较高，一居室$2,500-$4,000（Back Bay/Kenmore），郊区约$2,000')),
  li(t('学术：MIT/Harvard在此，学生+科研生态浓厚')),
  li(t('总结：生物医药和学术路线最优选择')),
  h3('德克萨斯（德克萨斯三角区：奥斯汀/达拉斯/休斯敦）'),
  li(t('求职优势：快速崛起的科技/金融/能源中心，税收优惠')),
  li(t('奥斯汀：科技（Tesla/Apple/Oracle/Dell总部/大量科技公司迁入）')),
  li(t('达拉斯：金融（AT&T/美国航空/大型保险公司）、科技')),
  li(t('休斯敦：能源行业（Chevron/Shell Americas总部）、Healthcare')),
  li(t('生活成本：全美最低之一，一居室$1,200-$2,000')),
  li(t('税收：德克萨斯无个人所得税，存款/投资收益全留下')),
  li(t('总结：薪资×(1-税率)在德克萨斯的实际购买力远高于纽约/湾区')),
  hr(),
  h2('二、城市选择决策框架'),
  h3('核心问题：哪个城市适合你？'),
  li(t('如果目标是IB/PE/HF (traditional finance)：纽约或芝加哥（quantitative）')),
  li(t('如果目标是科技公司PM/SWE/DS：湾区/西雅图/奥斯汀')),
  li(t('如果目标是生物医药：波士顿或旧金山湾区')),
  li(t('如果目标是咨询：纽约/芝加哥/旧金山（MBB有office在所有大城市）')),
  li(t('如果最看重税后收入：西雅图（科技）或德克萨斯三角（各行业）')),
  h3('税收对比：$200,000收入在不同城市的实际留存'),
  li(t('纽约：联邦+州+市税，约净留$110,000（净留55%）')),
  li(t('旧金山：联邦+加州税，约净留$115,000（净留57.5%）')),
  li(t('西雅图：联邦税，约净留$140,000（净留70%）')),
  li(t('奥斯汀（德克萨斯）：联邦税，约净留$140,000（净留70%）')),
  p(t('注：西雅图和德克萨斯的"税后剩余"比纽约多$30,000/年，10年就多出$300,000+')),
];

// ============================================================
// 页面4：💵 美国个人理财入门（401k/HSA/Roth IRA/投资）
// ============================================================
const personalFinanceBlocks: any[] = [
  p(t('来源：IRS官方401k/IRA说明（2024）、Fidelity个人理财指南、Vanguard投资原则、CFPB消费者金融保护指南、Investopedia、Reddit r/personalfinance常见问题整合。', false, true)),
  hr(),
  h2('一、401(k)退休账户（最重要的福利）'),
  h3('401(k)基础'),
  li(t('是什么：雇主提供的税前退休储蓄账户，投资收益免税直到退休取款')),
  li(t('2025年限额：员工可存$23,500/年（50岁以上额外$7,500）')),
  li(t('传统401k：税前存入，降低当期应税收入；退休取款时交税')),
  li(t('Roth 401k（如雇主提供）：税后存入，退休取款完全免税')),
  h3('Employer Match（最重要！不要错过）'),
  li(t('典型Match：雇主match你贡献的50%，最高至工资的6%')),
  li(t('示例：工资$100k，你存6%=$6,000，雇主match 50%=$3,000，总计$9,000进入账户')),
  li(t('这是"免费的钱"——如果不存到match上限，相当于拒绝了工资涨幅')),
  li(t('Vesting Schedule：雇主match可能有3-4年归属期（离职早了拿不走）')),
  h3('如何选择401k投资组合'),
  li(t('默认选项：Target Date Fund（如Vanguard 2055 Fund），自动随年龄调整股债比例')),
  li(t('进阶选项：Low-cost index funds（Vanguard/Fidelity的Total Market Index Fee <0.05%）')),
  li(t('避免：主动管理基金（费率高，长期跑不赢指数），年费>0.5%的基金')),
  li(t('原则：时间在你这边，保持低费率的广泛指数投资，不要频繁操作')),
  hr(),
  h2('二、Roth IRA（年轻人最应该开的账户）'),
  h3('Roth IRA的魔法'),
  li(t('税后存入，投资收益完全免税，退休后取款完全免税')),
  li(t('2025年限额：$7,000/年（50岁以下）')),
  li(t('收入限制：2025年单身Modified AGI < $150,000才能直接贡献（>$165,000不能）')),
  li(t('为什么年轻人特别适合：现在税率低，未来税率可能更高；复利效应极大')),
  h3('Backdoor Roth IRA（收入超限时的解决方案）'),
  li(t('方法：先往传统IRA存$7,000（不可抵扣）→ 立即转换（convert）到Roth IRA')),
  li(t('效果：规避收入限制，合法享受Roth IRA的免税增长')),
  li(t('注意：如果已有其他传统IRA，可能需要考虑Pro-rata Rule，建议咨询税务顾问')),
  hr(),
  h2('三、HSA（三重税收优惠，被低估的神器）'),
  h3('HSA的三重优惠'),
  li(t('存入：税前（降低当期应税收入）')),
  li(t('增长：免税投资增值')),
  li(t('取款：用于医疗费用完全免税；65岁后可用于任何目的（按普通收入税）')),
  h3('HSA使用策略'),
  li(t('条件：必须参加HDHP（High Deductible Health Plan）')),
  li(t('2025年限额：$4,300（个人）/ $8,550（家庭）')),
  li(t('最优策略：存满HSA → 投资增长（不提取现金）→ 同时自付医疗账单（用税后现金）→ 保存收据 → 年老后用于报销（或退休')),
  li(t('推荐开户：Fidelity HSA（无费用，可投资共同基金）')),
  hr(),
  h2('四、股票投资基础（RSU/ESPP/个人投资）'),
  h3('RSU（限制性股票单元）税务处理'),
  li(t('归属（Vesting）时：按当日股价计入W-2，作为普通收入交税')),
  li(t('归属后卖出：归属价格和卖出价格之间的差额按资本利得税处理')),
  li(t('常见策略："Sell to cover"——归属时立刻卖出一部分还税款，剩余持有')),
  li(t('23%联邦+州税近似税率（中等收入）：RSU归属时需要预留这个比例缴税')),
  h3('ESPP（员工股票购买计划）'),
  li(t('通常：员工可以用市价85折购买公司股票（6个月或1年期）')),
  li(t('最安全策略：购买后立刻卖出，锁定15%+的无风险收益')),
  li(t('税务：折扣部分作为普通收入，涨幅部分按资本利得')),
  h3('个人投资账户（Brokerage Account）基础'),
  li(t('推荐平台：Fidelity（功能全面，费率低）/ Schwab（国际学生友好）/ Vanguard（指数基金老牌）')),
  li(t('核心策略：Buy and Hold低费率指数基金（VTI/VOO/VXUS）')),
  li(t('VTI：Vanguard Total US Stock Market，费率0.03%')),
  li(t('VOO：Vanguard S&P 500，费率0.03%')),
  li(t('VXUS：Vanguard Total International，费率0.07%')),
  li(t('国际学生注意：F-1/H-1B都可以开券商账户投资美股，税务上按Non-resident/Resident规则申报')),
  hr(),
  h2('五、学生贷款管理（如果有的话）'),
  h3('联邦学生贷款（Federal Student Loans）'),
  li(t('收入驱动还款（IDR）：按收入比例还款，10-25年后可申请豁免')),
  li(t('PSLF（公共服务贷款豁免）：在501c3非营利/政府机构工作10年后豁免')),
  li(t('再融资（Refinance）：如果利率较高，可以用私人贷款以更低利率再融资（但失去联邦保护）')),
  h3('私人学生贷款策略'),
  li(t('优先偿还高利率贷款（>6%）')),
  li(t('低利率贷款（<4%）可以慢慢还，用额外资金投资')),
  li(t('雪球法（Snowball）：先还最小余额贷款，获得心理激励')),
  li(t('雪崩法（Avalanche）：先还最高利率贷款，数学上最优')),
];

// ============================================================
// 页面5：🎓 美国研究生项目选择指南（金融/统计/CS）
// ============================================================
const gradSchoolBlocks: any[] = [
  p(t('来源：US News研究生排名、Poets&Quants Master\'s program rankings、各项目官方placement statistics、LinkedIn校友就业数据、Reddit r/GradAdmissions申请建议，综合申请人实际分享。', false, true)),
  hr(),
  h2('一、几个关键问题：读不读研？读什么？'),
  h3('读研的好处'),
  li(t('如果本科不是target school：Master可以清洗学历（某些顶级MS项目）')),
  li(t('STEM专业认定：让OPT延长到3年（对留美工作至关重要）')),
  li(t('补充金融技能：非金融本科通过MS Finance/MFin补充专业知识')),
  li(t('网络扩展：顶级项目的校友网络可以直接媲美MBA')),
  h3('读研的代价'),
  li(t('直接成本：$50,000-$100,000学费（顶级项目）')),
  li(t('机会成本：1-2年工作经验，推迟2年工作的复利')),
  li(t('关键问题：你的本科够强吗？如果哥大/NYU本科去读哥大硕士，提升有限')),
  hr(),
  h2('二、金融相关硕士项目对比'),
  h3('MFin（Master of Finance）— 偏量化'),
  li(t('Top项目：MIT MFin (#1) / Princeton MFin / UCLA Anderson MFin / UT Austin MFin')),
  li(t('适合：理工科背景想进量化金融/HFT')),
  li(t('MIT MFin就业：约35%进入买方，30%进入卖方，20%进入科技')),
  li(t('MIT MFin薪资：中位数起步$150,000 total comp（2023 Placement Report）')),
  h3('MS Finance — 偏传统金融'),
  li(t('Top项目：Vanderbilt MS Finance / Notre Dame MS Finance / WashU Olin MS Finance / Johns Hopkins MS Finance')),
  li(t('适合：想进传统IB/AM/Corp Finance，偏向非定量')),
  li(t('就业：多数去IB/四大/Corp Finance')),
  h3('MAcc（Master of Accounting）— 会计/税务'),
  li(t('适合：想进四大，补150学分要求，STEM MAcc获得3年OPT')),
  li(t('Top项目：UT Austin McCombs MAcc / USC Leventhal MAcc / University of Illinois MAcc')),
  li(t('就业：几乎100%进入四大，提供最稳定的就业保障')),
  li(t('特别：部分MAcc项目（如UT Austin）被认定为STEM，获得3年OPT')),
  h3('MFE（Master of Financial Engineering）— 量化'),
  li(t('Top项目：CMU MSCF / Columbia MFE / Berkeley MFE / NYU Tandon MFE / Baruch MFE')),
  li(t('适合：数学/物理/CS背景，想进Quant Trading/Risk/Structuring')),
  li(t('CMU MSCF就业：~60%进入Quant HF/Prop Trading，40%进入IB Quant组')),
  li(t('薪资：毕业起步$200,000+ total comp（顶级量化基金）')),
  li(t('申请要求：GRE/GMAT数学部分极高（通常97%+），编程能力（Python/C++）')),
  hr(),
  h2('三、统计/数据科学硕士项目'),
  h3('Top MS Statistics项目'),
  li(t('Stanford MS Statistics：最难进，进金融/科技都非常受认可')),
  li(t('Columbia MS Statistics：纽约地利优势，就业极好')),
  li(t('UChicago MS Statistics：顶级数学/统计背景，量化金融首选')),
  li(t('CMU MS Statistics & Data Science：卡内基梅隆的量化优势')),
  h3('MS Data Science项目'),
  li(t('Columbia MS Data Science / NYU Center for Data Science：纽约就业网络强')),
  li(t('CMU MSML：机器学习最顶级，进科技公司DS岗最强')),
  li(t('UC Berkeley MIDS：偏向商业数据科学应用')),
  li(t('薪资：MS Statistics毕业进量化金融$150,000-$200,000；进科技DS $130,000-$180,000')),
  hr(),
  h2('四、CS硕士项目（非CS本科的补充路径）'),
  h3('Top CS MS项目'),
  li(t('Carnegie Mellon MSCS：全球最强CS，但竞争极激烈')),
  li(t('Stanford MSCS：CS No.1，校友网络无敌')),
  li(t('Columbia MSCS / NYU Tandon MSCS：纽约就业优势，接受转专业申请')),
  li(t('Georgia Tech OMSCS（在线）：$7,000全程，性价比极高，不影响工作')),
  h3('非CS本科申请CS硕士的条件'),
  li(t('必须：有CS基础课（数据结构/算法/编程语言）')),
  li(t('GRE Quant：95%+是标准要求')),
  li(t('项目经历：GitHub上有技术项目，展示真实编程能力')),
  li(t('部分友好项目：Columbia/NYU/Penn比较接受转专业申请')),
  hr(),
  h2('五、申请时间表'),
  h3('申请季关键节点'),
  li(t('9月：确定目标项目清单（10-15个），开始准备材料')),
  li(t('9-10月：GRE/GMAT考试（如没有成绩），TOEFL确认满足要求')),
  li(t('10-11月：完成第一版PS（Personal Statement）和推荐信邀请')),
  li(t('12月-1月：大多数项目截止日期（Round 1 / Round 2）')),
  li(t('2-3月：录取结果陆续发出')),
  li(t('4月15日：接受offer的通用截止日期')),
  h3('奖学金策略'),
  li(t('大多数顶级硕士项目（非PhD）无全奖，需要自费')),
  li(t('部分方案：RA/TA职位（每周10-20小时工作，换学费减免或stipend）')),
  li(t('外部奖学金：中国国家留学基金委（CSC）对部分海外学习有资助')),
  li(t('国际学生奖学金：部分学校有merit-based scholarships，申请时注明财务需求')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十一批）...\n');
  await createPage('💊 生物医药/医疗行业求职全攻略（Healthcare IB/Biotech VC）', healthcareBiotechBlocks);
  await createPage('💻 LeetCode/编程面试完全攻略（非CS背景转技术）', leetcodeBlocks);
  await createPage('🏙️ 美国主要城市求职+生活指南（NY/SF/Seattle/Chicago/Boston）', cityGuideBlocks);
  await createPage('💵 美国个人理财入门（401k/HSA/Roth IRA/RSU税务）', personalFinanceBlocks);
  await createPage('🎓 美国研究生项目选择指南（金融/统计/CS Master）', gradSchoolBlocks);
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/Adh3w4XwCiMs2zkApVhcFdT0nFf`);
}

main().catch(console.error);
