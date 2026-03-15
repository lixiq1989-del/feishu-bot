/**
 * 美国商科求职知识库 - 深度内容补充
 * 新增7个深度页面：薪资拆解、Amazon面试、OPT/H1B、Superday、Case Interview、LinkedIn内推
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     npx ts-node scripts/us_jobs_wiki/add_deep_content.ts
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

// Block factories
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
  console.log(`  obj_token: ${objToken}`);
  await sleep(600);
  await writeBlocks(objToken, blocks);
  console.log(`  ✅ https://${DOMAIN}/wiki/${nodeToken}`);
  return nodeToken;
}

// ─── 页面1：薪资数据深度拆解 ────────────────────────────────────────
const SALARY_BLOCKS = [
  p(t('数据来源：Levels.fyi / Glassdoor / Wall Street Oasis / LinkedIn Salary / H1B Grader。更新时间：2024-2025。')),
  p(t('注意：以下均为美国市场数据。薪资因城市、学校背景、谈判能力有较大差异。')),
  hr(),

  h2('一、投资银行（Investment Banking）'),

  h3('IBD 分析师（Analyst）— 2024-2025 市场行情'),
  li(b('Bulge Bracket（高盛/JP Morgan/摩根士丹利/美银/巴克莱）'), t('：Base $110,000 + Year-1 Bonus $55,000-$70,000 = 全包 $165,000-$180,000')),
  li(b('Elite Boutique（Evercore/Lazard/Centerview/PJT）'), t('：Base $110,000 + Bonus $80,000-$120,000 = 全包 $190,000-$230,000（2024年大幅提升）')),
  li(b('Signing Bonus'), t('：通常 $10,000-$30,000；部分 EB 已达 $30,000+')),
  li(b('Summer Analyst Return Offer'), t('：直接转正，无需重新申请；Base 同全职分析师')),
  quote(b('关键数据：'), t('2024年 elite boutique 奖金比 bulge bracket 高出 11-68%。Centerview/PJT Partners 是薪资天花板。全包超过 $200k 的分析师已不罕见。')),

  h3('Year 2 & 3 分析师'),
  li(b('Year 2 Bonus'), t('：$70,000-$100,000（BB）；$100,000-$150,000（EB）')),
  li(b('Year 3 Bonus'), t('：$80,000-$120,000（部分人提前晋升 Associate）')),
  li(b('Associate（MBA 直接入职）'), t('：Base $175,000-$200,000 + Bonus $100,000-$200,000')),

  h3('其他银行职能'),
  li(b('S&T（Sales & Trading）Analyst'), t('：Base $100,000 + Bonus $40,000-$100,000（取决于 desk 表现）')),
  li(b('Research Analyst'), t('：Base $100,000 + Bonus $30,000-$70,000')),
  li(b('Risk/Operations/Middle Office'), t('：Base $75,000-$95,000 + Bonus $15,000-$30,000')),
  hr(),

  h2('二、MBB 咨询'),

  h3('MBB 本科生 BA/Analyst（2024-2025）'),
  li(b('McKinsey BA'), t('：Base $112,000 + 年度 Bonus $18,000 + Signing $5,000 = 第一年全包约 $135,000')),
  li(b('BCG Analyst'), t('：Base $110,000 + Bonus $18,000 + Signing $5,000 = 约 $133,000')),
  li(b('Bain Associate Consultant（AC）'), t('：Base $110,000 + Bonus $22,000 + Signing $5,000 = 约 $137,000')),
  li(b('Performance Bonus'), t('：视个人评级，最高可达 $30,000+；顶级评级比平均高 40-50%')),
  quote(b('注意：'), t('MBB 提供搬家费（Relocation）、手机费用报销、出差补贴（Per Diem）等福利。实际到手远超 Base。')),

  h3('MBB MBA Associate（2024-2025）'),
  li(b('McKinsey Post-MBA Associate'), t('：Base $192,000 + Signing $30,000 + Performance Bonus $40,000-$60,000 = 全包 $260,000-$280,000')),
  li(b('BCG Post-MBA Consultant'), t('：Base $190,000 + Bonus ~$30,000 = 全包约 $240,000-$260,000')),
  li(b('Bain Post-MBA Consultant'), t('：Base $190,000 + Bonus ~$30,000 = 全包约 $240,000-$260,000')),

  h3('MBB 晋升与薪资增长'),
  li(b('BA/AC → Senior Associate（2-3年）'), t('：+20-30%；通常建议先读 MBA')),
  li(b('Engagement Manager / Project Leader'), t('：$200,000-$280,000 全包')),
  li(b('Principal → Partner/Director'), t('：$400,000-$1,000,000+（含分红/利润分配）')),
  hr(),

  h2('三、科技大厂（Big Tech）'),

  h3('Google/Meta/Apple/Microsoft/Amazon — 应届生（L3/L4）'),
  li(b('Software Engineer（SDE）NYC/SF'), t('：Base $130,000-$175,000 + Bonus 10-15% + RSU $200,000-$400,000/4年 = 全包 $200,000-$350,000+')),
  li(b('Product Manager（PM）'), t('：Base $130,000-$165,000 + Bonus + RSU = 全包 $180,000-$280,000')),
  li(b('Data Scientist/Analyst'), t('：Base $115,000-$145,000 + Bonus + RSU = 全包 $160,000-$220,000')),
  li(b('Business Analyst/Strategy'), t('：Base $100,000-$130,000 + Bonus = 全包 $120,000-$165,000')),
  li(b('Finance/Accounting（FP&A）'), t('：Base $85,000-$110,000 + Bonus = 全包 $100,000-$135,000')),

  h3('FAANG+ L3 vs L4 差异'),
  li(b('L3（应届本科）'), t('：全包 $180,000-$250,000（Meta/Google SDE）')),
  li(b('L4（2-4年经验或 MBA）'), t('：全包 $250,000-$400,000')),
  li(b('L5（Senior/技术专家）'), t('：全包 $350,000-$600,000+')),
  quote(b('Levels.fyi 2024 数据：'), t('Google L4 SWE 中位数全包 $380,000；Meta E4 中位数 $330,000；Amazon L5 中位数 $340,000。')),

  h3('Startup / VC-backed 公司'),
  li(b('Series A-B（50-200人）'), t('：Base $120,000-$160,000 + 期权 0.1-0.5%（若退出成功，价值数百万）')),
  li(b('Series C+（独角兽）'), t('：Base $150,000-$200,000 + 期权')),
  li(b('风险提示'), t('：绝大多数 startup 期权最终价值为零；优先谈 Base + Vest 时间表')),
  hr(),

  h2('四、私募股权（PE）与对冲基金（HF）'),

  h3('PE 分析师（投行 2 年跳 PE）'),
  li(b('MF PE（Apollo/Blackstone/KKR/Carlyle）'), t('：Base $120,000-$150,000 + Carried Interest + Bonus = 全包 $250,000-$400,000')),
  li(b('MM PE（中等规模）'), t('：Base $120,000-$140,000 + Bonus $60,000-$100,000')),
  li(b('Carry（Carried Interest）'), t('：是 PE 的核心激励，通常 3-7年后 vest，丰厚但高度不确定')),

  h3('对冲基金（Quant/HF）'),
  li(b('Quant Researcher/Trader（Citadel/Two Sigma/D.E. Shaw）'), t('：全包 $300,000-$500,000+（顶级 quant 可达 $1M+）')),
  li(b('Fundamental Analyst（L/S HF）'), t('：Base $100,000-$150,000 + Performance Bonus（上限极高）')),
  hr(),

  h2('五、薪资谈判要点'),
  li(b('不要先报价'), t('：让公司先出数字，然后基于 competing offers 谈判')),
  li(b('Competing Offer 最有效'), t('：手里有 offer 才有谈判筹码；同时申请多家')),
  li(b('可谈判项目'), t('：Signing Bonus（最容易）> RSU Cliff加速 > Base > Bonus Target')),
  li(b('延迟 Deadline'), t('：礼貌要求延长2-4周决定，公司通常会同意')),
  li(b('Books'), t('：《Never Split the Difference》— 谈判心理学，直接适用于求职薪资谈判')),
  quote(b('真实数据：'), t('Wall Street Oasis 调研显示，70%+ 的应届生从未尝试谈判。而主动谈判的候选人平均多拿 $5,000-$30,000 Signing Bonus。')),
];

// ─── 页面2：Amazon 面试全攻略 ────────────────────────────────────────
const AMAZON_BLOCKS = [
  p(t('Amazon 是中国留学生最重要的大厂求职目标之一。其独特的 Leadership Principles（领导力准则）文化使面试风格与其他大厂截然不同。')),
  hr(),

  h2('Amazon 领导力准则（16 LP）全解'),

  h3('LP 1: Customer Obsession（客户至上）'),
  p(t('Leaders start with the customer and work backwards. They work vigorously to earn and keep customer trust.')),
  li(b('高频面试题：'), t('Tell me about a time you went above and beyond for a customer.')),
  li(b('关键词：'), t('customer feedback, user research, working backwards, customer metrics')),
  quote(b('答题要点：'), t('强调你如何主动收集客户反馈、如何在资源有限时优先保护客户体验。量化影响（如 NPS 提升、退款率下降）。')),

  h3('LP 2: Ownership（主人翁精神）'),
  p(t('Leaders are owners. They think long term and never say "that\'s not my job."')),
  li(b('高频面试题：'), t('Tell me about a time you took on something outside your area of responsibility.')),
  li(b('关键词：'), t('stepped up, took initiative, beyond my role, long-term thinking')),
  quote(b('答题要点：'), t('展示你主动承担额外工作、不推诿的经历。避免说"这不是我的事"类故事。')),

  h3('LP 3: Invent and Simplify（创新与简化）'),
  li(b('高频面试题：'), t('Tell me about a time you innovated or simplified a process.')),
  quote(b('答题要点：'), t('展示你从零开始设计新方案，或将复杂流程简化20%+的实际案例。')),

  h3('LP 4: Are Right, A Lot（经常正确）'),
  li(b('高频面试题：'), t('Tell me about a time your judgment turned out to be correct despite opposition.')),
  quote(b('答题要点：'), t('展示你基于数据和第一性原理做出正确判断的故事，哪怕当时有反对声音。')),

  h3('LP 5: Learn and Be Curious（好奇心学习）'),
  li(b('高频面试题：'), t('Tell me about a time you had to learn something new quickly.')),
  quote(b('答题要点：'), t('展示你主动自学新技能、研究新领域，并将其应用于工作的经历。')),

  h3('LP 6: Hire and Develop the Best（招募和培育最优秀的人才）'),
  li(b('高频面试题：'), t('Tell me about a time you helped someone develop their skills or grow.')),
  quote(b('答题要点：'), t('适合有过带团队、指导实习生、mentoring 经历的候选人。强调具体的成长结果。')),

  h3('LP 7: Insist on the Highest Standards（坚持最高标准）'),
  li(b('高频面试题：'), t('Tell me about a time you refused to compromise on quality.')),
  quote(b('答题要点：'), t('展示你在时间压力下坚持质量标准、不接受"够好就行"的案例。')),

  h3('LP 8: Think Big（远见卓识）'),
  li(b('高频面试题：'), t('Tell me about a time you proposed a bold, long-term vision.')),
  quote(b('答题要点：'), t('展示你有宏观战略思维、敢于提出颠覆性想法的经历。')),

  h3('LP 9: Bias for Action（崇尚行动）'),
  li(b('高频面试题：'), t('Tell me about a time you made a decision with incomplete information.')),
  quote(b('答题要点：'), t('展示你在不确定性下快速做决策、不等完美信息的能力。强调"速度是业务的关键"。')),

  h3('LP 10: Frugality（勤俭节约）'),
  li(b('高频面试题：'), t('Tell me about a time you achieved more with fewer resources.')),
  quote(b('答题要点：'), t('展示你在预算或人员有限的情况下实现超额目标的经历。')),

  h3('LP 11: Earn Trust（赢得信任）'),
  li(b('高频面试题：'), t('Tell me about a time you had to rebuild trust after a mistake.')),
  quote(b('答题要点：'), t('展示你坦诚面对错误、透明沟通、重建信任的过程。这是最考验诚信的题目。')),

  h3('LP 12: Dive Deep（刨根问底）'),
  li(b('高频面试题：'), t('Tell me about a time you used data to challenge an assumption.')),
  quote(b('答题要点：'), t('展示你深入分析数据、不满足于表面结论的能力。准备具体的数据分析案例。')),

  h3('LP 13: Have Backbone; Disagree and Commit（敢于谏言、服从大局）'),
  li(b('高频面试题：'), t('Tell me about a time you disagreed with your manager or team but committed to the decision.')),
  quote(b('答题要点：'), t('最有深度的 LP 之一。展示你如何有理有据地表达反对意见，但最终尊重决策并全力执行。')),

  h3('LP 14: Deliver Results（达成业绩）'),
  li(b('高频面试题：'), t('Tell me about a time you achieved a challenging goal despite obstacles.')),
  quote(b('答题要点：'), t('展示你克服重重困难、最终达成量化目标的能力。必须有具体数字。')),

  h3('LP 15: Strive to be Earth\'s Best Employer（努力成为地球上最好的雇主）'),
  li(b('适合场景：'), t('Manager/TPM 等有管理职责的岗位面试，重点考察团队建设能力')),

  h3('LP 16: Success and Scale Bring Broad Responsibility（成功与规模带来广泛责任）'),
  li(b('适合场景：'), t('Senior/Principal 级别，考察候选人对社会影响的思考')),
  hr(),

  h2('Amazon 面试流程'),

  h3('一般流程'),
  ol(t('Online Assessment（OA）：Coding + LP 问卷（SDE类）或 Work Style Survey + 情景题')),
  ol(t('Phone Screen（30-45分钟）：1个 LP 题 + 1个技术/业务问题')),
  ol(t('Loop Interview（Loop = 5-7轮，同一天或2天内完成）')),
  quote(b('Loop 结构：'), t('每轮 45-60分钟。通常包含：2-3轮 LP 行为题 + 1轮技术/Case + 1轮 Bar Raiser（独立评审员）')),

  h3('Bar Raiser（BR）是什么'),
  p(t('Bar Raiser 是 Amazon 独有的制度——每次 Loop 必须有一个不来自招聘团队的独立评审员，确保录用标准不因招聘压力降低。')),
  li(b('BR 有一票否决权'), t('：即使所有面试官都想录取，BR 觉得不符合标准可以否决')),
  li(b('BR 最爱考的 LP'), t('：LP 13（Disagree and Commit）、LP 4（Are Right A Lot）、LP 11（Earn Trust）')),
  li(b('应对策略'), t('：BR 面试时更深挖、多追问；准备好被挑战，保持冷静逻辑回应')),
  hr(),

  h2('STAR 框架实战'),
  p(t('S（Situation）→ T（Task）→ A（Action）→ R（Result）。Amazon 面试官会追问，每个环节都要准备好细节。')),

  h3('常见追问方式'),
  li(b('"What was your specific contribution?"'), t('：当你说"我们"时，面试官会追问你个人做了什么')),
  li(b('"What would you do differently?"'), t('：测试你的自我反思能力')),
  li(b('"Walk me through the data"'), t('：测试你是否真的 Dive Deep')),
  li(b('"Why did you choose this approach?"'), t('：测试 Judgment 和 Invent & Simplify')),

  h3('故事准备方法'),
  li(b('准备 8-10 个核心故事'), t('（覆盖不同项目/经历），每个故事可用于多个 LP')),
  li(b('每个故事量化'), t('：必须有数字（减少了多少时间、提升了多少%、影响了多少用户）')),
  li(b('故事多样性'), t('：包含成功案例、失败案例、冲突解决、团队合作、独立工作等不同类型')),
  quote(b('黄金技巧：'), t('准备一个"Story Bank"电子表格，行是你的8-10个故事，列是16个 LP，打勾哪个故事可以用于哪个 LP。面试前复习这张表。')),
  hr(),

  h2('SDE 技术面试要点'),
  li(b('LeetCode 重点'), t('：Graph/BFS/DFS、Dynamic Programming、Binary Search、Two Pointers、Tree Traversal')),
  li(b('System Design'), t('：Senior 必考。设计 URL Shortener / Twitter Feed / Amazon 购物车等')),
  li(b('Amazon 偏好'), t('：能用 OOP 设计清晰的解法；能在写代码前先说清楚思路和 tradeoff')),

  h2('Business/Operations 类面试要点'),
  li(b('SQL 基础'), t('：JOIN / GROUP BY / WINDOW FUNCTION。即使是 Business 岗也会考')),
  li(b('Excel/Python 数据分析'), t('：展示 data-driven 分析能力')),
  li(b('Metrics 框架'), t('：如何定义和衡量一个功能的成功？（DAU/Retention/Conversion Rate）')),
  li(b('A/B Testing'), t('：了解实验设计基础知识')),
];

// ─── 页面3：OPT / H-1B 签证详细指南 ────────────────────────────────
const OPT_BLOCKS = [
  p(t('美国留学生求职必须了解的签证时间线和合规要求。错误的 OPT 申请时间可能导致无法工作甚至身份失效。')),
  hr(),

  h2('一、OPT 基础知识'),

  h3('什么是 OPT'),
  li(b('全称'), t('：Optional Practical Training（实践培训）')),
  li(b('对象'), t('：F-1 学生签证持有者，完成学位后可申请')),
  li(b('有效期'), t('：12个月（本科/硕士/博士通用）')),
  li(b('STEM 延期'), t('：STEM 专业可申请额外 24 个月 = 共 36 个月工作时间')),

  h3('OPT 申请时间线（关键！）'),
  li(b('最早可申请时间'), t('：毕业前 90 天')),
  li(b('最晚提交 USCIS'), t('：毕业后 60 天内')),
  li(b('USCIS 处理时间'), t('：约 3-5 个月（建议申请 Premium Processing，加速至 2-3 周，费用约 $1,500）')),
  li(b('OPT 开始日期'), t('：最早为毕业日期，最晚为毕业后 60 天')),
  quote(b('关键原则：'), t('毕业前 90 天就提交申请！不要等到毕业后才开始。USCIS 处理慢，晚交可能导致 OPT 开始日期推迟，浪费可用工作时间。')),

  h3('60天 Grace Period'),
  li(b('毕业后 60 天宽限期'), t('：找工作期间不需要立即工作，但必须在 60 天内提交 OPT 申请')),
  li(b('注意'), t('：60 天内没工作但要继续待在美国，必须已申请 OPT 或有新的 I-20')),
  hr(),

  h2('二、STEM OPT 延期（重要！）'),

  h3('STEM OPT 申请条件'),
  li(b('你的学位专业'), t('必须在 STEM 认证列表上（CIP 代码）。Computer Science/Data Science/Finance（部分）/Statistics 等')),
  li(b('雇主必须参与 E-Verify'), t('：没有参与 E-Verify 的公司无法支持 STEM OPT')),
  li(b('需要每6个月向学校汇报'), t('：自我评估报告 + 雇主签字确认')),

  h3('STEM OPT 申请时间线'),
  li(b('最早可申请'), t('：OPT 到期前 90 天')),
  li(b('180 天自动延期'), t('：在 OPT 到期前及时申请 STEM 延期，USCIS 批准前可享受 180 天自动延期，无需中断工作')),
  li(b('提交要求'), t('：Form I-539 + I-20（带学校 DSO 签字）+ I-765 + 护照复印 + I-94')),
  quote(b('重要提醒：'), t('180 天自动延期的条件是：在 OPT 有效期内（到期前）提交申请，且申请材料齐全。请提前准备，不要拖到最后一刻！')),

  h3('常见 STEM 专业确认'),
  li(b('CS/CE/EE'), t('：100% 符合 STEM')),
  li(b('Data Science/Analytics'), t('：通常符合（CIP 11.0401）')),
  li(b('Finance（部分）'), t('：Quantitative Finance/Financial Engineering 符合；普通 Finance MBA 通常不符合')),
  li(b('Business Analytics/MIS'), t('：部分学校认定符合，需查 I-20 上的 CIP 代码')),
  li(b('Economics'), t('：部分（Econometrics/Mathematical Economics 可能符合）')),
  hr(),

  h2('三、H-1B 签证'),

  h3('H-1B 基础'),
  li(b('全称'), t('：Specialty Occupation Work Visa')),
  li(b('有效期'), t('：初始 3 年，可续签 3 年（部分有绿卡申请情况下可无限续签）')),
  li(b('配额'), t('：每年 65,000 个（普通）+ 20,000 个（美国硕士以上）= 共 85,000')),
  li(b('2024年竞争情况'), t('：约 78 万人申请，录取率约 22%；STEM 硕士以上约 30%+')),

  h3('H-1B 抽签时间线（每年重复）'),
  li(b('3月上旬'), t('：USCIS 开放预注册窗口（约 2 周）。雇主在此窗口提交你的信息，费用约 $10-$215/人')),
  li(b('3月末-4月初'), t('：USCIS 随机抽签，中签者收到通知')),
  li(b('4月 → 6月'), t('：中签后雇主正式提交完整申请包（I-129 等材料）')),
  li(b('10月1日'), t('：H-1B 生效日（联邦财政年开始）')),
  quote(b('关键理解：'), t('H-1B 必须由雇主为你申请，你个人无法自行申请。没有参与 H-1B 抽签的公司（如部分小公司）就无法支持你的签证续签！')),

  h3('H-1B Cap Exempt（不受配额限制）'),
  li(b('大学/研究机构工作'), t('：无需抽签，随时申请')),
  li(b('Nonprofit 关联研究机构'), t('：同上')),
  p(t('这是部分 OPT 没抽中的人的过渡策略：先在大学做 Postdoc/Research 1-2年，再申请 H-1B 或绿卡。')),

  h3('H-1B 抽不中怎么办'),
  li(b('Option 1：续签 OPT/STEM OPT'), t('：最多 3 年（本科+研究生算一个学位周期则最多是 OPT 12个月 + STEM 24个月）')),
  li(b('Option 2：读研/MBA'), t('：重新以学生身份留在美国，毕业后重新申请 OPT，再碰 H-1B')),
  li(b('Option 3：加拿大 / 英国'), t('：加拿大有 Express Entry，英国有 Graduate Route（PSW）。作为跳板再回美国')),
  li(b('Option 4：L-1 签证'), t('：公司内部调动，在美国境外工作 1 年后可申请 L-1 转入美国')),
  li(b('Option 5：O-1 签证'), t('：杰出人才签证。理论上无配额限制，但门槛极高（需要获奖/发表/行业知名度）')),
  hr(),

  h2('四、绿卡路径'),

  h3('EB-2/EB-3（职业移民）'),
  li(b('EB-1A（卓越人才）'), t('：无需雇主支持，自我申请，但门槛极高')),
  li(b('EB-2 NIW（国家利益豁免）'), t('：不需要 PERM，自己申请，但需证明对美国有重大贡献')),
  li(b('EB-2/EB-3 PERM'), t('：雇主支持，需要 Labor Certification（约1-2年），然后排期')),
  li(b('中国大陆出生排期'), t('：目前 EB-2/EB-3 排期约 10-20+ 年（2024年数据）。这是中国人绿卡最大痛点')),
  quote(b('实用建议：'), t('如果你持有中国护照，绿卡排期极长。部分人选择：(1) 尽早申请，排队等候；(2) 入籍第三国（台湾/加拿大/其他）再申请；(3) 通过 EB-1A/NIW 绕过 PERM。')),

  h3('对求职的影响'),
  li(b('大公司支持绿卡'), t('：Google/Amazon/Microsoft/Goldman 等通常支持员工申请绿卡')),
  li(b('小公司慎重'), t('：部分小公司或 startup 不愿承担绿卡申请费用（约 $5,000-$15,000）')),
  li(b('谈判时机'), t('：入职后1-2年再提绿卡申请，不要在 offer 谈判阶段提')),
  hr(),

  h2('五、面试中如何回答签证问题'),
  li(b('"Do you require visa sponsorship?"'), t('：直接回答"Yes, I will need H-1B sponsorship starting October 20XX."')),
  li(b('OPT 在职期间'), t('：告知"I currently have X months of OPT remaining and will apply for STEM OPT extension."')),
  li(b('不必过多解释'), t('：面试阶段只需说明基本事实。详细的签证流程由 HR 和法务处理')),
  quote(b('关键：'), t('很多公司的招聘系统会直接过滤不支持 Visa Sponsorship 的候选人。在申请时如实填写，避免浪费双方时间。Glassdoor/LinkedIn 上可查公司是否历史上支持过 H-1B（搜索 H1B Grader 网站）。')),
];

// ─── 页面4：Superday 投行面试超级日攻略 ───────────────────────────
const SUPERDAY_BLOCKS = [
  p(t('Superday（超级日）是投资银行招聘的决赛轮，通常在1天内完成5-10轮面试。通过率约 35-40%。这是你离 offer 最近的时刻，也是最后的战场。')),
  hr(),

  h2('一、Superday 是什么'),

  h3('基本结构'),
  li(b('时长'), t('：1天（通常 9AM-5PM 或 10AM-4PM），有时分两天')),
  li(b('面试轮数'), t('：5-10轮，每轮 30-45 分钟')),
  li(b('面试官'), t('：Analysts（1-3年）、Associates（3-5年）、VPs（5-10年）、MDs/Directors（10年+）')),
  li(b('格式'), t('：1-on-1 或 2-on-1（两个面试官对一个候选人）')),
  li(b('录取率'), t('：约 35-40%（比第一轮 Phone Screen 高，因为到这一步已经有基础筛选）')),

  h3('各银行 Superday 特点'),
  li(b('Goldman Sachs'), t('：非常注重 Fit/文化匹配，会问"Why GS?"的深度版本；技术题考 DCF 和 LBO 基础')),
  li(b('JP Morgan'), t('：结构化面试，每轮都会问 Behavioral + Technical；会有 Diversity/Inclusion 相关问题')),
  li(b('Morgan Stanley'), t('：非常注重行业知识，需要准备2-3个你感兴趣的行业深度研究')),
  li(b('Boutique（Evercore/Lazard）'), t('：技术题更难，可能会有 LBO model 案例；文化更 meritocracy')),
  hr(),

  h2('二、技术面试核心内容'),

  h3('必须掌握的金融知识'),
  li(b('三张财务报表'), t('：Income Statement / Balance Sheet / Cash Flow Statement 及其勾稽关系')),
  li(b('DCF（折现现金流）'), t('：WACC / FCFF / Terminal Value 计算逻辑；为什么 DCF 是最"科学"但误差最大的方法')),
  li(b('LBO（杠杆收购）'), t('：用债务买公司，通过改善运营/削减成本/时机退出获利；IRR 计算')),
  li(b('Comps（可比公司分析）'), t('：EV/EBITDA / P/E / EV/Revenue 等倍数选取逻辑')),
  li(b('M&A 基础'), t('：为什么做并购？Synergies 怎么算？Accretion/Dilution 分析')),

  h3('高频技术题 + 标准答案'),
  li(b('Q: Walk me through a DCF.'), t('A: 1)预测5-10年FCFF; 2)用WACC折现; 3)加Terminal Value(用Gordon Growth或EV/EBITDA); 4)减Net Debt得Equity Value')),
  li(b('Q: What happens to the 3 statements if D&A increases by $10?'), t('A: IS: EBIT减$10, 税后Net Income减$7(假设30%税率); BS: PP&E减$10, Retained Earnings减$7, Deferred Tax Asset+$3; CFS: 运营中加回$10折旧, 净现金流+$3')),
  li(b('Q: Why would a company use debt vs equity financing?'), t('A: Debt: 税盾(利息抵税)、不稀释股权、信号效应(管理层有信心); Equity: 不增加破产风险、适合高不确定性阶段、可做战略股东')),
  li(b('Q: When would P/E not be a useful multiple?'), t('A: 当公司亏损时(负 P/E 无意义); 当公司有大量非经常性项目导致 Net Income 失真时; 跨国比较时(会计准则/税率不同)')),

  h3('当场建模（有时）'),
  p(t('部分 boutique bank 会给你纸笔，让你当场做一个简单的 LBO 或 DCF。这不是测试速度，是测试你对逻辑的理解。')),
  quote(b('应对策略：'), t('先说清楚你的方法论，再动笔计算。数字出错不重要，逻辑清晰最重要。面试官会 follow up 你的每个假设。')),
  hr(),

  h2('三、Behavioral 行为面试'),

  h3('投行 Behavioral 与其他行业的区别'),
  li(b('节奏更快'), t('：每道题只有 2-3 分钟，要更简洁精炼')),
  li(b('更注重 Work Ethic'), t('：愿意付出、抗压能力强、能在高压下完成工作')),
  li(b('考察 Leadership 潜力'), t('：即使是应届生，也要展示有一天可以带团队的潜力')),

  h3('投行高频 Behavioral 题目'),
  li(b('"Why Investment Banking?"'), t('：必须真实、有逻辑。结合你的专业背景 + 对交易的热情 + 职业发展目标')),
  li(b('"Why this bank?"'), t('：必须说具体的——某个交易案例、某个 MD 的背景、公司某个业务线的独特之处')),
  li(b('"Tell me about a deal you find interesting."'), t('：准备2-3个近期真实交易案例（M&A/IPO/LBO），会说 Deal Rationale、估值逻辑、行业背景')),
  li(b('"What\'s your greatest weakness?"'), t('：说真实的、可解决的弱点 + 你已经在改进的方法。不要说"工作太努力"这种假弱点')),
  li(b('"Where do you see yourself in 5 years?"'), t('：在投行做 Analyst 2-3年 → 考虑 MBA 或转 PE/HF → 长期留在金融')),

  h3('压力测试（Stress Test）'),
  p(t('部分 MD 或资深面试官会故意挑战你的回答，看你在压力下的反应。')),
  li(b('常见形式'), t('："I don\'t think that\'s right. Can you rethink?" / "Why should I believe your analysis?"')),
  quote(b('应对策略：'), t('保持冷静，不要退缩。如果你是对的，礼貌但坚定地坚持你的观点（This is what I believe because...）。如果你错了，大方承认并修正。Disagree and Commit 的精神。')),
  hr(),

  h2('四、Superday 当天的实战准备'),

  h3('提前准备'),
  li(b('研究每位面试官'), t('：提前拿到面试官名单（Recruiting Coordinator 通常会发），LinkedIn 搜每个人的背景')),
  li(b('针对性准备'), t('：如果面试官做 TMT，准备一个 TMT 相关交易；如果做 Restructuring，了解基本 distressed debt 概念')),
  li(b('着装'), t('：Business Formal（深色西装/正装）。投行是正式的，不要穿 Business Casual')),
  li(b('带什么'), t('：简历若干份、笔记本和笔（用于记录或建模）、水')),

  h3('当天策略'),
  li(b('每轮之间休息'), t('：Superday 中有短暂休息，利用这段时间在笔记本上记下刚才的问题和回答，调整状态')),
  li(b('保持能量'), t('：这是一场马拉松。早上吃好早饭，带能量棒。不要喝太多咖啡导致紧张')),
  li(b('Ask good questions'), t('：每轮结束时准备1-2个有深度的问题。问面试官的职业发展历程、他们印象最深的交易等')),
  li(b('Track who you talked to'), t('：记下每位面试官的名字和聊到的主要话题，用于后续 Thank You Email')),

  h3('Thank You Email（24小时内）'),
  p(t('Superday 结束后必须发 Thank You Email 给每位面试官（通过 Recruiting Coordinator 转发，或直接发邮件）。')),
  quote(b('模板：'), t('Dear [Name], Thank you for taking the time to speak with me today. I particularly enjoyed our conversation about [具体话题]. It reinforced my conviction that [公司] would be the ideal place for me to begin my career because [具体原因]. I look forward to hearing from you. Best, [你的名字]')),
  hr(),

  h2('五、Superday 后的等待'),
  li(b('决策时间'), t('：通常 1-2 周，最快 2-3 天，最慢 3-4 周')),
  li(b('Follow up 时机'), t('：若超过 2 周无消息，可礼貌发邮件询问')),
  li(b('口头 offer 之后'), t('：要求书面 offer letter；不要在拿到书面 offer 前拒绝其他机会')),
  li(b('若被拒'), t('：请求 feedback（部分公司会给，投行通常不给）；请求保留 pipeline（未来有 opening 时联系你）')),
];

// ─── 页面5：Case Interview 框架库 ───────────────────────────────
const CASE_BLOCKS = [
  p(t('Case Interview 是咨询（MBB/Tier 2）和部分投行战略部门的核心面试形式。掌握框架是基础，但框架只是起点，最终考察的是思维逻辑和沟通能力。')),
  hr(),

  h2('一、核心框架总览'),

  h3('框架使用原则'),
  li(b('MECE 原则'), t('：Mutually Exclusive, Collectively Exhaustive — 不重复、不遗漏')),
  li(b('假设驱动'), t('：先提出假设，用数据验证/否定，而不是收集完所有数据再下结论')),
  li(b('结构先于内容'), t('：先告诉面试官你的分析框架，获得认可后再展开')),
  li(b('边说边写'), t('：在白板/纸上画出你的结构树，让面试官跟着你的思路走')),
  hr(),

  h2('二、盈利分析（Profitability）'),
  p(t('最高频的 Case 类型，占所有 MBB Case 的 30-40%。')),

  h3('核心公式'),
  quote(b('Profit = Revenue - Cost')),
  li(b('Revenue = Price × Volume')),
  li(b('Price: 定价是否变化？市场定价？竞争对手定价？')),
  li(b('Volume: 销量是否变化？是整体市场缩小？还是公司市占率下降？')),
  li(b('Cost = Fixed Cost + Variable Cost')),
  li(b('Fixed Cost: 租金/人员/设备，与产量无关')),
  li(b('Variable Cost: 原材料/生产成本，随产量变化')),

  h3('分析步骤'),
  ol(t('确认问题：利润下降了多少？什么时候开始？是否只有这个产品/区域/业务线？')),
  ol(t('拆分收入：价格变了吗？销量变了吗？产品组合变了吗（Mix Shift）？')),
  ol(t('拆分成本：固定成本变了吗？变动成本变了吗？新增了什么成本？')),
  ol(t('对比竞争对手：行业整体如何？是行业问题还是公司独有问题？')),
  ol(t('给出假设和建议：找到根本原因，提出2-3个可行的解决方案')),

  h3('Case 示例'),
  p(t('面试题："我们客户的净利润过去两年下降了30%。你会如何分析？"')),
  quote(b('解题过程：'), t('先澄清：是哪条业务线？所有产品？所有地区？然后拆分 Revenue(价格×量) 和 Cost(固变) 分别分析。假设收入正常但毛利下降 → 深入拆分变动成本 → 发现原材料涨价 → 建议：重新谈判采购合同 / 寻找替代供应商 / 提价转移成本。')),
  hr(),

  h2('三、市场进入（Market Entry）'),
  p(t('适用于：是否进入新市场？是否推出新产品？是否进行并购？')),

  h3('3C + 市场吸引力框架'),
  li(b('Market Attractiveness（市场吸引力）'), t('：市场规模？增长率？竞争格局？客户需求？')),
  li(b('Company Capabilities（公司能力）'), t('：是否有相关能力/资产/品牌？进入成本？Synergy？')),
  li(b('Competition（竞争分析）'), t('：现有竞争者有多强？进入壁垒？差异化机会？')),

  h3('决策框架'),
  ol(t('市场有多大？能拿到多少份额？')),
  ol(t('公司是否有竞争优势进入这个市场？')),
  ol(t('进入方式：有机增长(Organic) vs 并购(Acquisition) vs 合资(JV)')),
  ol(t('风险和退出策略')),

  h3('Case 示例'),
  p(t('面试题："星巴克应该进入中国三四线城市吗？"')),
  quote(b('解题过程：'), t('市场规模（三四线城市人口 × 咖啡渗透率 × 客单价）→ 星巴克能力（品牌/供应链/已有规模优势）→ 竞争（瑞幸/本地茶饮）→ 结论：需要调整产品线（价格/口味）并借助数字化降低运营成本。')),
  hr(),

  h2('四、市场规模估算（Market Sizing）'),
  p(t('Guesstimate 题目，考察结构化思维和数字感。')),

  h3('两种方法'),
  li(b('自上而下（Top-Down）'), t('：总市场 × 渗透率 × 市占率。适合有明确总量的市场')),
  li(b('自下而上（Bottom-Up）'), t('：细分客户群 × 使用频率 × 单价。适合需要从需求侧计算的市场')),

  h3('常用数字记忆'),
  li(b('美国人口'), t('：3.3亿（约 1.3亿 households）')),
  li(b('中国人口'), t('：14亿（约 4.5亿 households）')),
  li(b('纽约市人口'), t('：约 800万')),
  li(b('美国 GDP'), t('：约 $27 Trillion（2024）')),
  li(b('美国人均收入'), t('：约 $65,000/年')),

  h3('Case 示例：估算纽约市出租车市场规模'),
  ol(t('纽约人口 800万，假设 30% 会坐出租车 = 240万人')),
  ol(t('每人平均每周坐出租车 2次 × 平均车费 $15 = $30/人/周')),
  ol(t('年化：$30 × 52周 = $1,560/人/年')),
  ol(t('总市场：240万 × $1,560 = $37亿/年')),
  quote(b('注意：'), t('估算不需要精确，面试官考察的是逻辑性和假设是否合理。主动说出你的假设，并在最后做 sanity check（结果是否符合直觉）。')),
  hr(),

  h2('五、其他常见框架'),

  h3('并购分析（M&A）'),
  li(b('战略理由'), t('：Synergies（收入协同/成本协同）？水平整合？垂直整合？')),
  li(b('财务分析'), t('：溢价是否合理？Accretion/Dilution？对 EPS/ROIC 的影响？')),
  li(b('整合挑战'), t('：文化融合？人才保留？系统整合？监管风险？')),

  h3('定价策略'),
  li(b('Cost-Plus 成本加成'), t('：成本 + 固定利润率。简单但忽视市场')),
  li(b('Competitive Pricing 竞争定价'), t('：参考竞争对手价格')),
  li(b('Value-Based Pricing 价值定价'), t('：基于客户愿意支付的价格。MBB 最推崇的方法')),
  li(b('Price Elasticity 价格弹性'), t('：需求对价格变化的敏感度')),

  h3('运营改善'),
  li(b('成本削减'), t('：直接成本（原材料）→ 间接成本（管理费用）→ 资本支出')),
  li(b('收入增长'), t('：价格提升 → 产品组合优化 → 新客户获取 → 现有客户增值')),
  li(b('流程优化'), t('：Lean / Six Sigma → 消除浪费、提高质量')),
  hr(),

  h2('六、Case Interview 实战技巧'),
  li(b('澄清问题'), t('：面试官给完题目，先花30秒澄清核心假设，再开始分析')),
  li(b('大声思考'), t('：把你的思考过程说出来，让面试官跟上。沉默是减分项')),
  li(b('用数字支撑'), t('：每个结论都要有数据/假设支撑，避免仅凭直觉')),
  li(b('简洁有力'), t('：每个要点一句话，先说结论再解释，不要绕弯子')),
  li(b('练习方法'), t('：找 Case Partner 互相练习；用 CaseCoach / PrepLounge 平台；每周练习 5-10 个 Case')),
  quote(b('误区：'), t('很多人花大量时间背框架，但框架只是工具。面试官更在乎你能否根据具体情境灵活调整框架，而不是机械套用。')),
];

// ─── 页面6：LinkedIn 内推实战指南 ────────────────────────────────
const LINKEDIN_BLOCKS = [
  p(t('美国求职中，networking 和内推的转化率是直投简历的 5-10 倍。掌握 LinkedIn 内推技巧是获得面试机会的关键。')),
  hr(),

  h2('一、为什么内推这么重要'),
  li(b('数据：'), t('美国 70-80% 的工作是通过 Networking 填补的，从未在网上公开发布')),
  li(b('招聘逻辑：'), t('对于招聘方，有内推的候选人 = 降低招聘风险，内推人用个人信誉背书')),
  li(b('申请转化率：'), t('冷投简历通过率约 1-3%；内推后通过率可达 30-50%')),
  li(b('MBB 数据：'), t('McKinsey 只有不到 4% 的申请人获得第一轮面试；有内推的候选人比例更高')),
  hr(),

  h2('二、寻找内推对象的策略'),

  h3('目标人群'),
  li(b('校友（最优先）'), t('：同大学毕业生，有情感连接，最愿意帮忙。通过学校 LinkedIn alumni 搜索')),
  li(b('华人/中国留学生背景'), t('：同样经历过求职困难，更有同理心')),
  li(b('你认识的人的一度联系人'), t('：共同联系人 → 降低陌生感')),
  li(b('招聘帖子下的员工'), t('：公司刚发招聘帖，相关员工最有动力帮忙推荐')),

  h3('搜索技巧'),
  li(b('LinkedIn 搜索公式'), t('："[公司名] [职位/部门] [你的学校]"')),
  li(b('校友搜索'), t('：LinkedIn → My Network → Find alumni → 按公司/地点/专业筛选')),
  li(b('关注招聘帖'), t('：当看到感兴趣的招聘帖，点击"See who shared this"找到相关员工')),
  hr(),

  h2('三、Connection Request 模板'),

  h3('原则'),
  li(b('字数控制'), t('：LinkedIn 连接请求上限 300 字，实际最有效的是 150-200 字')),
  li(b('CCQ 方法'), t('：Connection（连接原因）+ Compliment（真诚称赞）+ Question（一个具体问题）')),
  li(b('不要直接要求内推'), t('：连接时只求"了解"，不要上来就说"能帮我内推吗？"')),

  h3('模板 A：校友连接'),
  quote(
    b('Hi [Name], '),
    t('I came across your profile while exploring [Company] on LinkedIn and noticed you also graduated from [University]. As a current [Year] student in [Program], I\'d love to connect and learn more about your experience in [Department/Role]. Would you be open to a 20-minute chat? Best, [Your Name]')
  ),

  h3('模板 B：共同背景连接（中文版）'),
  quote(
    b('Hi [Name]，'),
    t('在 LinkedIn 上看到您在 [公司] 做 [职位]，也注意到我们有共同的背景（[同校/同专业/都是留学生]）。我目前在积极申请 [公司] 的 [职位]，很想了解您在 [公司] 的工作体验。如果方便的话，能否和您进行一个 15-20 分钟的 informational call？非常感谢！')
  ),

  h3('模板 C：看到招聘帖后'),
  quote(
    b('Hi [Name], '),
    t('I noticed [Company] recently posted an opening for [Role] and saw that you\'re on the [Team Name] team. I\'d love to learn more about the team culture and what you look for in candidates. Would you be willing to share your perspective in a brief 15-min call? Thank you!')
  ),
  hr(),

  h2('四、Informational Chat 后如何请求内推'),

  h3('时机'),
  li(b('不要第一次聊就要求'), t('：先建立关系，展示你的价值和真诚')),
  li(b('谈话结束时'), t('：如果对话进行得顺畅，可以在最后说："I\'ve really enjoyed our conversation. If you feel our discussion went well, I\'d be grateful if you\'d consider referring me for the open position."')),
  li(b('Follow up 邮件时'), t('：Call 结束后 24-48 小时发感谢邮件，顺带提内推请求')),

  h3('请求内推邮件模板'),
  quote(
    b('Subject: Thank you + Referral Request for [Position]'),
    t('\n\nHi [Name],\n\nThank you so much for taking the time to speak with me about your experience at [Company]. The insight you shared about [具体点] was incredibly helpful and reinforced my excitement about the [Role] position.\n\nI\'ve just submitted my application and was wondering if you\'d be comfortable submitting a referral on my behalf. I understand if this is not possible, and I truly appreciate any support you can provide.\n\nI\'ve attached my resume for your reference. Please let me know if you need anything else from me.\n\nThank you again, [Your Name]')
  ),
  hr(),

  h2('五、LinkedIn Profile 优化'),

  h3('基础优化'),
  li(b('专业照片'), t('：正装或商务休闲，清晰背景，面带微笑（有照片的 Profile 浏览量高 14倍）')),
  li(b('Headline'), t('：不要只写"Student at XXX University"。写"Finance/Consulting Enthusiast | [专业] @ [学校] | Seeking Summer 2026 Internship"')),
  li(b('About Section'), t('：3-4句话，清晰说明：你是谁、你的核心技能/经历、你在找什么机会')),
  li(b('Skills'), t('：添加至少15-20个技能，请求 Connections 为你 Endorse')),
  li(b('连接数'), t('：尽量达到 500+ 连接，这样搜索结果中 Profile 排名更高')),

  h3('内容策略'),
  li(b('定期发帖'), t('：每周1-2条专业内容（行业新闻观点、求职感悟、实习经历），建立专业形象')),
  li(b('评论'), t('：在目标公司员工/招聘官的帖子下留下有价值的评论，增加曝光')),
  li(b('Open to Work'), t('：开启"Open to Work"功能，但可以选择仅对 Recruiters 可见（不显示绿色边框）')),
  hr(),

  h2('六、Informational Interview 实战'),

  h3('准备问题（15-20分钟内）'),
  li(b('Q1'), t('："What does a typical week look like in your role?"')),
  li(b('Q2'), t('："What do you wish you\'d known before joining [Company]?"')),
  li(b('Q3'), t('："What qualities do you look for in successful candidates for this type of role?"')),
  li(b('Q4'), t('："How has [Company] supported the growth of international employees?"')),
  li(b('最重要'), t('："Is there anyone else at [Company] or in [Industry] you\'d recommend I speak with?"（链式扩展人脉）')),

  h3('注意事项'),
  li(b('守时'), t('：提前 5 分钟上线/到达，超过 15 分钟的 meeting 要主动说"I know we only have 5 more minutes..."')),
  li(b('做功课'), t('：Call 前研究对方的 LinkedIn，了解他们的背景，展示你的用心')),
  li(b('记录要点'), t('：Call 中做笔记，Call 后整理到你的 Networking Tracker 中')),
  quote(b('黄金法则：'), t('每次 informational interview 结束时问："Is there anyone else you\'d recommend I speak with?" 通过这种链式推荐，你的人脉网络会指数级扩展。')),
];

// ─── 主流程 ────────────────────────────────────────────────────────
const PAGES = [
  { title: '💰 薪资数据深度拆解（IBD/MBB/Big Tech）', blocks: SALARY_BLOCKS },
  { title: '🏢 Amazon 面试全攻略（16 LP + Loop Interview）', blocks: AMAZON_BLOCKS },
  { title: '🌏 OPT / H-1B / 绿卡 签证详细指南', blocks: OPT_BLOCKS },
  { title: '⚡ Superday 投行超级日攻略', blocks: SUPERDAY_BLOCKS },
  { title: '📊 Case Interview 框架库（MBB咨询）', blocks: CASE_BLOCKS },
  { title: '🔗 LinkedIn 内推实战指南', blocks: LINKEDIN_BLOCKS },
];

async function main() {
  console.log('🚀 开始写入深度内容页面...\n');
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Parent: ${PARENT_NODE_TOKEN}\n`);

  for (const page of PAGES) {
    await createPage(page.title, page.blocks);
    await sleep(1000);
  }

  console.log('\n✨ 所有深度内容页面创建完成！');
  console.log(`🔗 知识库链接：https://${DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
