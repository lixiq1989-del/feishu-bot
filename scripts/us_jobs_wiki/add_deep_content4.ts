/**
 * 美国商科求职知识库 - 深度内容补充（第四批）
 * 金融行业全对比 / 科技公司PM/DS面试 / 职场文化 / 求职工具全指南
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
  await sleep(600);
  await writeBlocks(objToken, blocks);
  console.log(`  ✅ https://${DOMAIN}/wiki/${nodeToken}`);
  return nodeToken;
}

// ─── 页面1：金融行业全对比（IB vs PE vs HF vs VC vs AM）─────────
const FINANCE_COMPARE_BLOCKS = [
  p(t('金融行业细分众多，很多中国学生对各方向不清晰。本页帮你彻底搞懂 IB / PE / 对冲基金 / VC / 资产管理 的区别，帮你做出最合适自己的选择。')),
  hr(),

  h2('一、五大方向核心对比'),

  h3('投资银行（Investment Banking）'),
  li(b('本质'), t('：为企业提供财务顾问服务（M&A / IPO / 融资），赚顾问费')),
  li(b('工作内容'), t('：做 pitch books、建模、协调交易流程；大量重复性的 Excel + PowerPoint 工作')),
  li(b('工作强度'), t('：最高。分析师平均 80-100 小时/周，有时 100+；All-nighters 是常态')),
  li(b('薪资'), t('：Year 1 全包 $170,000-$230,000（Base $110k + Bonus）')),
  li(b('出口机会'), t('：PE / HF / VC / Corp Dev / MBA → 投行是最好的职业 "跳板"')),
  li(b('最适合'), t('：愿意短期受苦换取长期出路；财务建模能力强；希望进入 PE/HF 的人')),

  h3('私募股权（Private Equity）'),
  li(b('本质'), t('：用基金的钱买公司（通常 Control 股），改善后卖出获利')),
  li(b('工作内容'), t('：Deal Sourcing（找项目）+ Due Diligence + LBO 建模 + 投后管理（Portfolio Company）')),
  li(b('工作强度'), t('：高，但比 IB 稍好；通常 60-80 小时/周；Deal 期间会更长')),
  li(b('薪资'), t('：IB 跳 PE 后：Base $120-150k + Bonus $80-120k + Carry（最终可能是最大收入来源）')),
  li(b('Carry（附带权益）'), t('：PE 基金利润的 20% 分给基金员工，是长期财富积累的关键')),
  li(b('最适合'), t('：在 IB 做了 2-3 年想做"真正的投资决策"；对业务/运营有兴趣；有耐心（PE 投资周期 5-10 年）')),

  h3('对冲基金（Hedge Fund）'),
  li(b('本质'), t('：用投资者的钱在公开市场上通过各种策略赚取超额回报（Alpha）')),
  li(b('策略类型'), t('：Long/Short Equity（L/S）/ Global Macro / Quant / Event-Driven / Credit')),
  li(b('工作内容'), t('：L/S HF: 做公司研究，做多/做空个股；Quant HF: 用算法自动化交易')),
  li(b('工作强度'), t('：Fundamental HF: 60-70小时/周，比 PE/IB 更轻松；Quant HF: 变化大')),
  li(b('薪资'), t('：Year 1: $150,000-$300,000（视业绩）；顶级 PM: $1,000,000+/年')),
  li(b('风险'), t('：HF 关闭率高；P&L 直接决定薪资，表现不好直接被 let go')),
  li(b('最适合'), t('：真正对投资市场有热情、有独到分析能力、能接受高风险高回报的人')),

  h3('风险投资（Venture Capital）'),
  li(b('本质'), t('：投资早期/成长期 startup，期待 10x+ 回报')),
  li(b('工作内容'), t('：Deal Sourcing（认识创始人）+ Due Diligence + 投后支持（Board Member）')),
  li(b('工作强度'), t('：相对最轻，50-60 小时/周；文化较 casual')),
  li(b('薪资'), t('：比 PE/HF 低很多。Junior VC: $80,000-$150,000；Senior: $200,000-$400,000 + Carry')),
  li(b('进入门槛'), t('：通常需要 IB 或 consulting 经验，或者有 startup 经历；直接校招入 VC 极少见')),
  li(b('最适合'), t('：对 Tech / Startup 生态有热情；喜欢 Networking 多于建模；接受薪资暂时不如 PE/IB')),

  h3('资产管理（Asset Management）'),
  li(b('本质'), t('：管理机构/个人投资者的钱，投资公开市场（股票/债券/另类资产）')),
  li(b('主要公司'), t('：BlackRock / Vanguard / Fidelity / PIMCO / State Street / T. Rowe Price')),
  li(b('工作强度'), t('：相对最低，50-60 小时/周；工作生活平衡好')),
  li(b('薪资'), t('：$80,000-$150,000（应届）；Senior PM: $500,000-$2,000,000（取决于 AUM 和业绩费）')),
  li(b('最适合'), t('：想在金融行业长期发展但不想 Banking 高压；对特定资产类别（固收/股票/新兴市场）有深度兴趣')),
  hr(),

  h2('二、职业路径决策框架'),

  h3('按薪资最大化（Year 5+）'),
  ol(t('Quant HF（Citadel/Two Sigma）→ 顶级可达 $1M+')),
  ol(t('PE → Carry 成熟后 $500K-$2M+')),
  ol(t('IB → 快速晋升至 MD: $1M+（需 10-15 年）')),
  ol(t('L/S HF → 视业绩差异极大')),
  ol(t('AM → 稳定但上限较低')),

  h3('按工作生活平衡'),
  ol(t('VC（最好）→ AM → HF → PE → IB（最差）')),

  h3('按职业稳定性'),
  ol(t('AM（最稳）→ Big 4 → IB（可跳槽）→ PE（Deal-dependent）→ HF（最不稳，业绩决定一切）')),

  h3('按进入难度（应届）'),
  ol(t('Quant HF（最难，需 STEM PhD 或 top school 天才）')),
  ol(t('MBB 咨询 + Top IB（极难，<5%）')),
  ol(t('PE（需先做 IB 2-3 年）')),
  ol(t('四大 + AM（相对可达）')),
  quote(b('建议：'), t('如果你在规划职业，先定目标（Want: 钱 / 工作生活平衡 / 职业发展），再反向推路径。不要因为 "IB 最有名" 就盲目去追。每条路有不同的代价和回报。')),
  hr(),

  h2('三、各方向出路（Exit Opportunities）'),

  h3('从 IB 可以去哪'),
  li(b('PE（最主流）'), t('：70%+ 的 IB 分析师的首选出路')),
  li(b('HF'), t('：L/S HF / Macro HF 都欢迎 IB 背景')),
  li(b('Corporate Development'), t('：大公司内部 M&A 团队；更好的工作生活平衡')),
  li(b('MBA'), t('：Top MBA 重置学校标签，回归咨询或 Finance')),
  li(b('Startup CFO/Finance Lead'), t('：高增长公司需要有 IB 背景的人')),

  h3('从 MBB 咨询可以去哪'),
  li(b('Startup (CEO/COO/Strategy)'), t('：大量 MBB Alumni 在 VC-backed startup 做 Leadership')),
  li(b('PE / VC'), t('：特别是 Growth Equity / Operations 角色')),
  li(b('Corporate Strategy'), t('：Fortune 500 的战略总监/VP')),
  li(b('MBA'), t('：多数 MBB 人做 2-3 年后去 MBA，回来做 Associate/Senior Consultant')),
];

// ─── 页面2：科技大厂 PM / Data Science 面试攻略 ──────────────────
const TECH_PM_DS_BLOCKS = [
  p(t('科技大厂除了软件工程师（SDE），还有大量商科学生可以申请的职位：Product Manager（PM）、Data Scientist、Business Analyst、Operations / Strategy。本页重点讲这些非技术岗位的面试。')),
  hr(),

  h2('一、PM（Product Manager）面试'),

  h3('PM 面试的4种题型'),
  li(b('Product Design'), t('：为某类用户设计一款产品/功能。格式：用户群体 → 痛点 → 解决方案 → 指标')),
  li(b('Product Improvement'), t('："如何改进 YouTube 的推荐算法？" / "如何提升 Uber 的司机留存率？"')),
  li(b('Metrics & Analytics'), t('：定义成功指标；"如果 DAU 下降了 20%，你怎么排查？"')),
  li(b('Behavioral / Leadership'), t('：Tell me about a time you had to prioritize between features... / 与工程师 conflict 的经历')),

  h3('Product Design 框架（通用）'),
  ol(t('Clarify（澄清）：目标用户是谁？产品的 stage 是什么？有哪些限制条件？')),
  ol(t('User Segmentation（用户分层）：把用户分成 2-3 个群体，选最重要的一个深入分析')),
  ol(t('Pain Points（痛点）：该用户群的核心未满足需求是什么？')),
  ol(t('Solutions（解决方案）：列出 3 个解决方案，评估 impact / feasibility / alignment with company goals')),
  ol(t('Metrics（指标）：如何衡量这个功能的成功？Primary Metric + Guard Rails')),
  ol(t('Trade-offs（权衡）：你会选择哪个方案，为什么？')),

  h3('PM 面试实例'),
  p(t('题目："如何改进 Amazon 的购物车功能？"')),
  quote(b('解题思路：'), t('先定义用户（普通购物者）→ 痛点（忘记购物车里的商品/价格变了不知道/分享功能弱）→ 三个解决方案（1. 价格下降推送提醒 2. 购物车分享功能 3. AI 推荐相关商品）→ 选方案2（Engagement + Virality），定义指标（分享率 / 购物车转化率），考虑 Guardrail（不增加加购 friction）')),

  h3('Metrics 排查框架（最重要）'),
  p(t('如果一个指标（DAU/Revenue/Conversion Rate）突然下降，怎么排查？')),
  ol(t('Internal vs External：是我们产品的问题，还是行业/市场大环境变化？')),
  ol(t('Segment：按设备（iOS/Android）/ 地区 / 用户群 / 功能分拆，找到哪个 segment 下降了')),
  ol(t('Funnel：在哪个步骤（展示→点击→加购→结账）drop-off 最严重？')),
  ol(t('Timeline：什么时候开始下降的？最近有没有上线新功能/代码变更？')),
  ol(t('Correlation：有没有其他指标同步变化（如果 DAU 下降但 Session Length 上升，不一定是坏事）')),
  hr(),

  h2('二、Data Scientist 面试'),

  h3('DS 面试题型'),
  li(b('Statistics / Probability'), t('：A/B Testing 设计 / P-value / 中心极限定理 / 置信区间')),
  li(b('Machine Learning'), t('：算法原理（Random Forest / Gradient Boosting / Neural Network）/ 特征工程 / 过拟合处理')),
  li(b('SQL'), t('：几乎所有 DS 面试都有 SQL 题；JOIN / GROUP BY / WINDOW FUNCTION / 子查询')),
  li(b('Case Study'), t('：用数据分析方法解决实际业务问题')),
  li(b('Coding'), t('：Python（Pandas / NumPy / Scikit-learn）/ 算法基础')),

  h3('A/B Testing 深度考察'),
  li(b('实验设计'), t('：如何划分 Control 和 Treatment 组？随机分配的标准（User-level / Session-level）')),
  li(b('Sample Size'), t('：如何计算需要多少样本才能检测到 X% 的提升？（统计功效 Power Analysis）')),
  li(b('Novelty Effect'), t('：新功能上线后短期用户行为变化 ≠ 长期效果，如何处理？')),
  li(b('Multi-armed Bandit'), t('：与传统 A/B Test 的区别；适合何种场景？')),
  li(b('Multiple Testing'), t('：同时做多个 A/B Test 时的 Family-wise Error Rate；Bonferroni 校正')),
  quote(b('面试官最爱问：'), t('"如果 A/B Test 显示 P-value = 0.04，你会推荐上线这个功能吗？"  — 不要直接说"推荐！P<0.05 显著"。要说：先看 Effect Size 是否有业务意义，再看 Practical Significance，再考虑 Sample Size 是否充足，还要考虑长期 vs 短期效果。')),

  h3('SQL 高频题型'),
  li(b('基础题'), t('：找出过去 30 天活跃用户数 / 每个用户的平均订单金额')),
  li(b('Window Function'), t('：找每个用户的最近一次购买 / 计算7天滚动平均 / Dense_rank')),
  li(b('Self Join'), t('：找出连续登录 3 天以上的用户')),
  li(b('Subquery'), t('：找出每个类别中销量最高的商品')),
  li(b('复杂题'), t('：计算用户留存率（Cohort Analysis）/ 漏斗分析（Funnel）')),
  hr(),

  h2('三、Business Analyst / Strategy 面试'),

  h3('主要考察内容'),
  li(b('Case Study'), t('：类似咨询 Case，但更偏向数据驱动。"用给定数据集分析为什么这个市场的 GMV 下降了 15%"')),
  li(b('Excel/Python 实操'), t('：给你一个数据集，当场分析并呈现结论（30-60分钟）')),
  li(b('Behavioral'), t('：同大厂标准 Behavioral 题')),
  li(b('Business Knowledge'), t('：对目标公司的业务有深度了解，了解其竞争对手和行业动态')),

  h3('常见公司差异'),
  li(b('Google（Business Analyst / Strategy）'), t('：极注重 数据分析 + SQL；Go/No-Go 的 Case 分析；商业判断 + 清晰的沟通')),
  li(b('Meta（Operations / Strategy）'), t('：快速迭代文化；重视 Bias for Action；Metrics/Data-first 思维')),
  li(b('Amazon（Business Intelligence / Finance）'), t('：16 LP 贯穿始终；必须能快速用 Excel/SQL 回答数据问题')),
  li(b('Microsoft（Finance / Ops）'), t('：相对更注重 Culture Fit；Excel 高手加分；有 Growth Mindset')),
  hr(),

  h2('四、科技大厂面试准备清单'),

  h3('技能要求'),
  li(b('SQL（必须）'), t('：LeetCode SQL 50题 + Mode Analytics 实战练习。每个 DS/BA 面试都会考')),
  li(b('Excel/Python（必须）'), t('：Pivot Table / VLOOKUP / 数据清洗；或者 Pandas + NumPy')),
  li(b('Statistics（DS必须）'), t('：概率/统计基础；A/B Testing；回归分析')),
  li(b('Business Sense（所有人）'), t('：了解公司产品/竞品；有 1-2 个产品改进想法随时可以讲')),

  h3('准备时间表'),
  li(b('投递前 2-3 个月'), t('：刷 SQL 题 + 学 A/B Testing + 研究目标公司产品')),
  li(b('投递前 1 个月'), t('：练习 Product Design 题（每天 1 题）+ Mock Interview')),
  li(b('投递后'), t('：针对目标公司深入研究：用户数/增长策略/最近发布的功能/竞争威胁')),
];

// ─── 页面3：美国职场文化全解（中国人必读）────────────────────────
const WORKPLACE_BLOCKS = [
  p(t('美国职场文化与中国有根本性的差异。理解这些差异不只是为了"融入"，更是为了在职场中真正发挥影响力、推动晋升。这些是 Reddit/Blind 上中国职场人总结的最真实干货。')),
  hr(),

  h2('一、沟通风格差异'),

  h3('直接 vs 间接'),
  li(b('美国职场'), t('：直接表达意见是美德。"I disagree because..." 是正常甚至被鼓励的。含糊其辞被认为是缺乏自信或不诚实')),
  li(b('中国职场'), t('：顾全大局，委婉表达，避免当众让人难堪')),
  li(b('应对策略'), t('：学会说"I see your point, but I want to add a different perspective..." 既专业又尊重')),

  h3('主动分享 vs 等待被发现'),
  li(b('美国文化'), t('："If you don\'t toot your own horn, no one will." 如果你不主动展示，没人会注意到你的贡献')),
  li(b('中国文化'), t('：做好本职工作，等待上级认可')),
  li(b('实际操作'), t('：每周发 "Status Update" 邮件给经理；在 Team Meeting 上主动分享进展；不要等年终考核才说自己做了什么')),

  h3('反对意见的表达'),
  li(b('美国方式'), t('：可以当场说 "I have a concern about this approach..."，但要有数据支撑')),
  li(b('不要'), t('：在会议上沉默同意，会后私下抱怨——这会让人认为你 passive aggressive')),
  li(b('框架'), t('：使用 "Yes-and" 方法: "I like the direction, and I wonder if we could also consider X because of Y data..."')),
  hr(),

  h2('二、美国经理关系'),

  h3('与中国 Boss 的核心区别'),
  li(b('美国经理 = Coach'), t('：会主动询问你的职业目标，帮助你成长；不是"发号施令"的角色')),
  li(b('主动沟通'), t('：美国文化鼓励定期和经理开 1:1（One-on-one），讨论工作进展、career development、roadblocks')),
  li(b('Direct Report 文化'), t('：你的工作进展是你的责任。不要等经理来问你，要主动 proactively update')),

  h3('1:1 如何最大化利用'),
  li(b('准备议程'), t('：每次 1:1 前整理 3-5 个需要讨论的话题/问题，发给经理')),
  li(b('讨论 Career Development'), t('：每季度说一次："I\'m working toward X role/skill, how can I make progress from your perspective?"')),
  li(b('Ask for feedback'), t('："Is there anything specific you think I could do better in terms of X?" — 主动要 feedback 而不是等年终')),
  li(b('Blockers'), t('：告诉经理你遇到的障碍，让他/她帮你清除，而不是自己默默承受')),

  h3('Performance Review 准备'),
  li(b('文档化你的成就'), t('：全年用 Notes 记录你做的每个重要项目，上 Review 时有具体例子')),
  li(b('量化影响'), t('：不是"我负责了 X 项目"，而是"X 项目帮助团队节省了 Y 小时/增加了 Z% 效率"')),
  li(b('Peer Feedback'), t('：美国公司通常有 360° feedback，培养好与同事的合作关系')),
  li(b('晋升对话'), t('：不要等到 Review 才提晋升。提前 3-6 个月和经理明确说："我的目标是在 X 时间晋升到 Y，我需要达到什么标准？"')),
  hr(),

  h2('三、Email / Slack 沟通规范'),

  h3('Email 写作原则'),
  li(b('Subject Line'), t('：清晰说明 Action Required vs FYI："Action Required by 3/15: Budget Approval for Q2 Campaign"')),
  li(b('结构'), t('：TL;DR（一行总结）→ 背景 → 具体内容 → Action Items（每条 Action 写清楚是谁 / 做什么 / 截止何时）')),
  li(b('简洁'), t('：5 句话能说清楚就不要写 15 句。美国职场非常反感 "Information Overload"')),
  li(b('Reply All 文化'), t('：谨慎使用 Reply All，确认是否有必要通知所有人')),

  h3('Meeting 文化'),
  li(b('会前'), t('：发会议议程（Agenda）；有决策类会议要提前准备 Pre-read 材料')),
  li(b('会中'), t('：按时开始、按时结束；最后 5 分钟 recap Action Items')),
  li(b('会后'), t('：24 小时内发 "Meeting Recap" 邮件，列出所有 Action Items + 负责人 + 截止时间')),
  li(b('远程会议'), t('：保持视频开启；注意发言不要 ramble（漫无目的）；用 Chat 提问而不是打断')),

  h3('Slack / Teams 行为规范'),
  li(b('响应时间'), t('：一般工作时间内 1-2 小时内响应 DM 是合理期望；@mention 更紧急')),
  li(b('设置 Status'), t('：Out of Office / In a meeting 等 Status 要及时更新')),
  li(b('不要在 Slack 发情绪化内容'), t('：任何负面情绪、抱怨要私下或面对面沟通，不要在 Group Channel 里')),
  hr(),

  h2('四、Networking 文化（职场内部）'),

  h3('为什么内部 Networking 很重要'),
  li(b('晋升'), t('：美国职场晋升通常需要 Sponsor（比 Mentor 更有影响力的人），而 Sponsor 来自于内部 Networking')),
  li(b('项目机会'), t('：好的项目往往先给"认识"你的人，而不是官方申请流程')),
  li(b('Visibility'), t('：高层认识你，你才可能被考虑做 High-visibility 工作')),

  h3('如何建立内部关系'),
  li(b('Coffee Chat'), t('：主动约其他团队的人聊 15-20 分钟，了解他们的工作和公司动态')),
  li(b('Cross-functional 合作'), t('：主动承担跨团队项目，让不同部门认识你')),
  li(b('Visibility 机会'), t('：主动在 Team All-hands 上发言；写 Internal Blog 分享你的工作成果')),
  li(b('不要'), t('：只埋头做自己的工作，不认识任何人。这是很多中国员工最大的职业陷阱')),
  hr(),

  h2('五、避免文化误区的实用清单'),
  li(b('✅ 会议上发言'), t('：即使只是说"I agree with X\'s point"，也比完全沉默好')),
  li(b('✅ 量化成就'), t('：所有汇报/申请/Review 都要有数字')),
  li(b('✅ Ask for help'), t('：美国文化里主动问问题是优点，不是无能的表现')),
  li(b('✅ 建立非工作关系'), t('：聊聊周末计划、家庭、爱好；这是美国 Small Talk 文化的一部分')),
  li(b('❌ 不要说"我们"'), t('：强调个人贡献，美国评绩效看个人，不是集体')),
  li(b('❌ 不要沉默同意然后私下抱怨'), t('：被发现后严重损害信任')),
  li(b('❌ 不要期待"自动被认可"'), t('：没有人会注意到你不主动展示的成就')),
  li(b('❌ 不要 Overwork 不声张'), t('：加班不是荣誉勋章；要学会设定边界并沟通工作量')),
];

// ─── 页面4：美国求职工具全指南 ─────────────────────────────────
const TOOLS_BLOCKS = [
  p(t('在美国求职，掌握正确的工具和平台能显著提升效率。本页整理了所有主流求职工具，包括找工作、准备面试、了解薪资的全套武器库。')),
  hr(),

  h2('一、找工作的平台'),

  h3('主流求职平台'),
  li(b('LinkedIn（最重要）'), t('：美国职场的核心平台。找工作 + Networking + 公司研究三合一。设置 Job Alerts 自动推送。有"Easy Apply"一键申请功能')),
  li(b('公司官网 Career Page'), t('：直接在目标公司官网申请，有时候比第三方平台更直接，也避免 ATS 额外过滤')),
  li(b('Glassdoor'), t('：不只是找工作，更重要的是：查公司评价 / 查具体职位薪资 / 查面试题目（Interview Experiences 板块极有价值）')),
  li(b('Indeed'), t('：工作量最大的综合平台；适合广泛搜索，但质量参差不齐')),
  li(b('Handshake（大学生）'), t('：专为大学生设计，接入大量校招和实习；如果在校，必用')),

  h3('金融/咨询专属平台'),
  li(b('Wall Street Oasis（WSO）'), t('：IB/PE/HF 求职社区，有公司评价/面试经历/薪资数据')),
  li(b('Mergers & Inquisitions（M&I）'), t('：IB/PE 深度指南，免费内容极丰富')),
  li(b('Management Consulted'), t('：MBB 咨询准备资源，Case Interview 备考社区')),
  li(b('PrepLounge'), t('：全球最大的 Case Interview 练习平台，可以找 Case Partner')),

  h3('科技公司专属平台'),
  li(b('Levels.fyi'), t('：硅谷薪资透明平台，可以查具体公司/职位/Level 的 Base + Bonus + RSU')),
  li(b('Blind'), t('：匿名职场吐槽社区，有大量 Tech 公司的真实信息（面试经历/文化/薪资谈判）')),
  li(b('LeetCode'), t('：SDE 面试必备刷题平台，Premium 版有公司专属题库')),
  li(b('Glassdoor Interview Reviews'), t('：查每家公司具体的面试题目，按时间倒序排列')),
  hr(),

  h2('二、薪资研究工具'),
  li(b('Levels.fyi'), t('：科技公司最精准的薪资数据，Total Compensation 细分（Base/Bonus/RSU）')),
  li(b('H1B Grader'), t('：可以查看任何公司历史上申请 H-1B 的记录和薪资，侧面印证薪资水平和是否支持 Sponsorship')),
  li(b('Glassdoor Salary'), t('：跨行业薪资参考，数据量大但精确度不如 Levels.fyi')),
  li(b('LinkedIn Salary'), t('：LinkedIn Premium 功能，可以查同等职位的薪资分布')),
  li(b('Wall Street Oasis Salary'), t('：IB/PE/HF 薪资数据库，有明确的 Year 1/2/3 全包数据')),
  li(b('Bureau of Labor Statistics（BLS）'), t('：美国劳工局官方薪资数据，最权威但更新慢')),
  hr(),

  h2('三、简历工具'),
  li(b('Jobscan'), t('：上传简历 + JD，AI 分析 ATS 关键词匹配度和优化建议。免费版有限制，但非常有用')),
  li(b('Resume Worded'), t('：全面的简历诊断工具，检查格式/关键词/语言强度')),
  li(b('Teal'), t('：一站式求职管理平台：Job Tracker + 简历匹配 + AI 关键词优化')),
  li(b('Rezi.ai'), t('：ATS-friendly 简历模板生成工具')),
  li(b('Grammarly'), t('：语法检查必备，特别适合英语非母语申请人')),
  li(b('LinkedIn Resume Builder'), t('：从你的 LinkedIn Profile 一键生成简历草稿')),
  hr(),

  h2('四、面试准备工具'),

  h3('行为面试'),
  li(b('Interviewbit'), t('：结构化行为面试练习，按 LP/Competency 分类')),
  li(b('Pramp'), t('：免费的真人 Mock Interview 平台，匹配 Mock Interview Partner')),
  li(b('ChatGPT / Claude'), t('：把你的 STAR 故事发给 AI，让它帮你优化措辞和结构')),

  h3('技术面试（SDE）'),
  li(b('LeetCode'), t('：必刷，Premium 版有公司专属题库和按频率排序功能')),
  li(b('NeetCode.io'), t('：高质量 LeetCode 解题视频，有按公司/题型分类的路线图')),
  li(b('HackerRank'), t('：很多公司直接用 HackerRank 出 OA 题目')),
  li(b('CodeSignal'), t('：另一个常见 OA 平台，练习 Coding + Numerical Reasoning')),

  h3('案例面试（MBB）'),
  li(b('PrepLounge'), t('：欧美最大 Case Interview 社区，可以找 Case Partner、练习真题')),
  li(b('CaseCoach.me'), t('：AI 辅助 Case Interview 练习，有录音回放分析')),
  li(b('RocketBlocks'), t('：专注于 Consulting Recruiting 准备，有结构化的 Case 练习路径')),
  li(b('Bain / BCG / McKinsey 官网'), t('：三家公司官网都有免费 Case Interview 样题和准备指南')),
  hr(),

  h2('五、公司研究工具'),
  li(b('Glassdoor Company Reviews'), t('：查员工评价（Work-Life Balance / Management / Culture / Salary）')),
  li(b('LinkedIn Company Page'), t('：查公司规模、近期动态、员工 Alumni 分布')),
  li(b('Crunchbase'), t('：Startup/VC 行业必看，查融资轮次/估值/创始人背景')),
  li(b('CB Insights'), t('：科技公司/行业趋势分析')),
  li(b('Bloomberg / WSJ / FT'), t('：投行/金融类面试必须每天看，了解宏观市场动态')),
  li(b('Pitchbook'), t('：PE/VC 行业必备，查私募交易数据；大学通常有免费访问权限')),
  hr(),

  h2('六、求职管理工具'),
  li(b('Teal Job Tracker'), t('：追踪所有申请状态（Applied / Phone Screen / Offer 等），避免漏回 Follow-up')),
  li(b('Notion 或 Airtable'), t('：自建 Networking Tracker，记录每个联系人的沟通历史和 Follow-up 时间')),
  li(b('Google Sheets'), t('：最简单的求职追踪表，创建列：公司/职位/申请时间/状态/下一步')),
  li(b('Calendar Reminders'), t('：对每个 Application，设置 2 周后的 Follow-up 提醒')),
  quote(b('黄金法则：'), t('认真的求职者同时申请 20-40 家公司。没有追踪工具，你会漏掉 Follow-up、忘记 Deadline、错过 Offer 决定时间。花 1 小时建立一个 Tracking System，可以帮你节省无数麻烦。')),

  h2('七、心态与支持资源'),
  li(b('Reddit r/cscareerquestions'), t('：科技求职吐槽和求助社区，有大量真实经历')),
  li(b('Reddit r/consulting'), t('：咨询行业讨论，有真实的 MBB 准备经历分享')),
  li(b('Wall Street Oasis Forum'), t('：IB/PE 求职专属论坛，有现役分析师的亲身建议')),
  li(b('Blind'), t('：匿名的职场讨论平台，有薪资/文化/面试等直接讨论')),
  li(b('微信群/小红书'), t('：中国留学生互助群，有当地华人社区的求职资源分享')),
];

// ─── 主流程 ────────────────────────────────────────────────────────
const PAGES = [
  { title: '⚖️ 金融行业全对比（IB vs PE vs HF vs VC vs AM）', blocks: FINANCE_COMPARE_BLOCKS },
  { title: '💻 科技大厂 PM / Data Science / BA 面试攻略', blocks: TECH_PM_DS_BLOCKS },
  { title: '🌎 美国职场文化全解（中国人必读）', blocks: WORKPLACE_BLOCKS },
  { title: '🛠️ 美国求职工具全指南（平台+薪资+简历+面试）', blocks: TOOLS_BLOCKS },
];

async function main() {
  console.log('🚀 开始写入深度内容（第四批）...\n');
  for (const page of PAGES) {
    await createPage(page.title, page.blocks);
    await sleep(1000);
  }
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
