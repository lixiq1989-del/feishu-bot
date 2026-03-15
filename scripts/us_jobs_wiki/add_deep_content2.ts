/**
 * 美国商科求职知识库 - 深度内容补充（第二批）
 * 四大攻略 / 高盛JP Morgan面试 / 简历ATS / MBB Networking时间线
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

// ─── 页面1：四大会计师事务所完整攻略 ────────────────────────────────
const BIG4_BLOCKS = [
  p(t('四大（Deloitte / PwC / EY / KPMG）是全球最大的专业服务机构，也是商科留学生进入美国职场的主要跳板之一。')),
  p(t('适合人群：会计/财务/咨询专业；也欢迎 CS/Data Science/工程类（主要是 Advisory/Tech 部门）。')),
  hr(),

  h2('一、四大 vs MBB：如何选择'),
  li(b('MBB 咨询'), t('：战略咨询，高强度、高薪、高光环，但非常难进（录取率 < 5%）')),
  li(b('四大咨询/Advisory'), t('：实施咨询，项目多、稳定，更关注执行细节')),
  li(b('四大审计/税务'), t('：CPA 路径，结构清晰，适合想考 CPA 的会计专业生')),
  li(b('四大 vs Big Tech'), t('：四大提供更系统的培训和晋升路径；Big Tech 薪资更高但竞争更激烈')),
  quote(b('结论：'), t('四大是"入门美国职场最可靠的路径之一"，特别是对没有名牌学校光环的候选人——四大在全美多所学校都有 on-campus recruiting。')),
  hr(),

  h2('二、四大各家特点'),

  h3('Deloitte'),
  li(b('规模'), t('：全球最大的四大，美国员工超过 15 万人')),
  li(b('强项'), t('：Consulting（战略+技术）、Government/Public Sector、M&A Transaction Services')),
  li(b('文化'), t('：注重 Diversity & Inclusion，有大量对国际学生友好的项目')),
  li(b('面试特点'), t('：需要准备 Behavioral（STAR 格式）+ 有时有 Business Case。Partner 面试最终决定')),
  li(b('应届薪资'), t('：Audit $63,000-$72,000；Consulting $75,000-$85,000；Tax $65,000-$75,000')),

  h3('PwC（PricewaterhouseCoopers）'),
  li(b('规模'), t('：全球第二大，以 Audit 和 Tax 为传统强项')),
  li(b('强项'), t('：Financial Services Audit、Tax、Deals（M&A advisory）')),
  li(b('文化'), t('：技术导向，近年大力投资数字化转型和 AI')),
  li(b('面试特点'), t('：HireVue 视频面试（30秒准备 / 2分钟回答）→ 正式面试；强调 Business Acumen')),
  li(b('应届薪资'), t('：Audit $62,000-$70,000；Advisory $75,000-$88,000；Tax $64,000-$74,000')),

  h3('EY（Ernst & Young）'),
  li(b('规模'), t('：全球第三大四大')),
  li(b('强项'), t('：Assurance（审计）、Tax、Strategy and Transactions（M&A）、Technology Consulting')),
  li(b('文化'), t('：强调 "Building a Better Working World"，对创业和创新有更高容忍度')),
  li(b('面试特点'), t('：偏向 Competency-Based Interview（CBI），结构化强。咨询类有 Case')),
  li(b('应届薪资'), t('：Assurance $63,000-$72,000；Consulting $74,000-$85,000')),

  h3('KPMG'),
  li(b('规模'), t('：全球第四大四大，美国相对规模小一些')),
  li(b('强项'), t('：Audit（传统强项）、Financial Risk Management、Government/Defense Sector')),
  li(b('文化'), t('：相对传统，工作生活平衡相对较好')),
  li(b('面试特点'), t('：5 轮流程：Online Assessment → Group Discussion → Case Study → Recruiter 评估 → 技术面板')),
  li(b('应届薪资'), t('：Audit $61,000-$70,000；Advisory $72,000-$82,000')),
  hr(),

  h2('三、各部门对比：Audit vs Tax vs Advisory vs Consulting'),

  h3('Audit（审计）'),
  li(b('工作内容'), t('：验证公司财务报表的准确性；大量 Excel + 文件检查')),
  li(b('优点'), t('：CPA 考试的最佳跳板；Exit Opportunity 多（公司内部审计、FP&A、CFO 路径）')),
  li(b('缺点'), t('：工作较枯燥；旺季（1-3月）加班严重；薪资是四大最低的部门')),
  li(b('适合人群'), t('：想考 CPA、走传统会计路径的候选人')),

  h3('Tax（税务）'),
  li(b('工作内容'), t('：企业/个人税务申报和规划；国际税（Transfer Pricing）在留学生中很热门')),
  li(b('优点'), t('：专业技能需求高、不容易被替代；International Tax 专精度高')),
  li(b('缺点'), t('：技术性强，需要大量记忆税法细节；旺季（3-4月）压力大')),
  li(b('适合人群'), t('：对税法/会计感兴趣；想走 Tax Director/CFO 路径')),

  h3('Advisory（咨询/财务顾问）'),
  li(b('子业务线'), t('：Transaction Services（M&A）、Risk Advisory、Forensic（反舞弊）、Valuation')),
  li(b('优点'), t('：更接近"真实的商业问题"；Transaction Services 是跳 PE/IB 的重要路径')),
  li(b('薪资'), t('：高于 Audit/Tax；与 Consulting 相近')),
  li(b('适合人群'), t('：想转 IB/PE 的人从 Transaction Services 跳槽；想做数据分析的从 Risk Advisory 入手')),

  h3('Consulting（管理咨询）'),
  li(b('子业务线'), t('：Strategy、Technology、Human Capital（HR Transformation）、Finance Transformation')),
  li(b('优点'), t('：工作内容最接近 MBB；薪资最高；Exit Opportunity 广')),
  li(b('缺点'), t('：竞争最激烈（和 MBB 抢候选人）；出差多')),
  li(b('适合人群'), t('：想做 Management Consulting 但没进 MBB 的候选人；跳 Corporate Strategy 的理想平台')),
  hr(),

  h2('四、申请时间线'),

  h3('暑期实习（Summer Internship）'),
  li(b('申请开放'), t('：每年 8月（大三开始申请）')),
  li(b('截止日期'), t('：8-9月（越早越好，前两周就投！）')),
  li(b('面试'), t('：9-10月')),
  li(b('Offer'), t('：10-11月')),
  li(b('实习时间'), t('：次年 6-8月')),
  quote(b('关键：'), t('8月就开放申请，很多人以为9月再投还来得及——实际上名额常在8月就快填满！学校 Career Fair 通常在9月，此时已经偏晚。')),

  h3('全职招聘（Full-Time）'),
  li(b('主要来源'), t('：80%+ 来自暑期实习转正，Return Offer 是主要路径')),
  li(b('直接申请全职'), t('：通常比实习晚 1-2 个月；名额更少')),
  li(b('非应届毕业生'), t('：四大全年 Rolling，随时有机会，但旺季 8-11 月机会更多')),
  hr(),

  h2('五、四大面试全流程'),

  h3('第一关：Online Assessment'),
  li(b('HireVue 视频面试'), t('：30秒准备 + 2分钟回答，录制1次不可重录')),
  li(b('Situational Judgment Test（SJT）'), t('：给你一个情景，选最合适/最不合适的行动')),
  li(b('认知能力测试'), t('：逻辑推理、数字推理、语言推理（类似 GMAT）')),
  quote(b('准备建议：'), t('HireVue 关键在练习！提前录制自己的视频，检查眼神接触、说话速度、是否用 STAR 格式。光线好、背景整洁。第一次做往往会紧张导致失常，多练几次。')),

  h3('第二关：First Round Interview（电话/视频）'),
  li(b('时长'), t('：30-45 分钟，通常与 Recruiter 或 Senior Associate')),
  li(b('内容'), t('：Walk me through your resume + 2-3 个 Behavioral 题')),
  li(b('重点'), t('：Why this firm? Why this service line? Tell me about yourself.')),

  h3('第三关：Office Visit / Assessment Center（关键轮）'),
  li(b('形式'), t('：通常在公司办公室进行一天或半天，多轮面试')),
  li(b('面试官'), t('：Manager + Senior Manager + Partner（最终拍板）')),
  li(b('内容'), t('：Behavioral Interview + Case Study（Advisory/Consulting）+ Business Acumen 题')),
  li(b('Partner Round'), t('：考文化契合度和长远潜力，问"Where do you see yourself in 5 years?"类问题')),
  quote(b('现场感受：'), t('Assessment Center 是马拉松，保持精力和热情。中间休息时也是面试——不要松懈。对接待你的行政人员也要礼貌，他们会反馈印象。')),

  h3('四大高频 Behavioral 题 + 标准答案框架'),
  li(b('"Why this firm?"'), t('：必须具体说出该公司的1个独特之处（某个业务线/某次参与的 info session/某位员工的经历），而不是"因为你们很有名"')),
  li(b('"Why Audit/Tax/Advisory?"'), t('：说清楚职业路径逻辑：Audit → CPA → CFO；Advisory → Transaction Services → PE/Corp Dev')),
  li(b('"Tell me about a time you worked under pressure"'), t('：STAR 格式，重点在 Action 和 quantified Result')),
  li(b('"Describe a time you handled a difficult client or coworker"'), t('：展示 Empathy + Problem-solving + Resolution')),
  li(b('"How do you stay up to date with accounting/business news?"'), t('：必须有具体答案！Wall Street Journal / FT / Bloomberg / The Economist 是加分')),
  li(b('"What is your biggest weakness?"'), t('：说真实的、正在改进的弱点，不要假装"太完美主义"')),
  hr(),

  h2('六、四大 vs 其他 Exit Opportunities'),
  li(b('Audit (2-3年) → '), t('Corporate Accounting / Controller / Internal Audit at Fortune 500 / CFO track')),
  li(b('Tax (2-3年) → '), t('Corporate Tax / Transfer Pricing / Private Wealth Management')),
  li(b('Transaction Services (2-3年) → '), t('Private Equity / Investment Banking / Corporate Development')),
  li(b('Consulting (2-3年) → '), t('Corporate Strategy / Internal Consulting / MBA / Startup')),
  quote(b('关键数据：'), t('Deloitte Transaction Services 的校友 LinkedIn 上有大量 PE/PE fund 职位。这条路是四大到 PE 最直接的通道，虽然没有 IB 直接，但胜在竞争略低。')),

  h2('七、国际学生签证注意事项'),
  li(b('四大支持 H-1B 吗？'), t('：是的，四大全部支持 H-1B 申请，也支持绿卡')),
  li(b('Audit/Tax'), t('：某些小客户项目可能要求 Government Clearance，可能限制国际学生参与，了解清楚')),
  li(b('Advisory/Consulting'), t('：政府客户项目同样可能有公民/PR要求，申请前确认')),
  li(b('四大 Sponsorship 稳定性'), t('：大公司，历史上从未因经济周期取消 H-1B 申请，相对安全')),
];

// ─── 页面2：高盛 / JP Morgan 面试全攻略 ─────────────────────────
const GS_JPM_BLOCKS = [
  p(t('Goldman Sachs 和 JP Morgan 是全球最顶级的投行，每年收到数十万份申请。本页基于 100+ 位真实候选人的面试经历整理。')),
  hr(),

  h2('一、Goldman Sachs 面试全流程'),

  h3('申请数据'),
  li(b('2024年申请量'), t('：236,000+（Breaking News：创历史新高）')),
  li(b('Summer Analyst 录取率'), t('：约 1-2%')),
  li(b('目标学校'), t('：Harvard / Wharton / MIT / Columbia / NYU Stern / Princeton + 其他名校')),

  h3('阶段 1：简历筛选'),
  li(b('ATS 初筛'), t('：大量简历由系统自动筛选，关键词匹配学校/GPA/相关实习经历')),
  li(b('GPA 门槛'), t('：非明文规定，但 3.7+ 在顶校更安全；非顶校 3.8+ 更有竞争力')),
  li(b('经历优先级'), t('：前一段实习的公司 > GPA > Extracurricular（社团/竞赛）')),

  h3('阶段 2：HireVue 视频面试（2-3天完成）'),
  li(b('题目数量'), t('：3-6 道题')),
  li(b('格式'), t('：30秒准备时间 → 最多 2 分钟回答 → 不可重录')),
  li(b('题目类型'), t('：100% Behavioral（行为题）。GS 的 HireVue 通常不问技术题')),
  li(b('算法分析'), t('：HireVue 使用 AI 分析面部表情、语调、措辞，评估 25,000 个数据点')),
  quote(b('高频 HireVue 题目：'), t('1. Walk me through your resume. 2. Why Goldman Sachs? 3. Tell me about a time you worked under pressure. 4. Describe a time you influenced someone. 5. What is your greatest achievement?')),

  h3('阶段 3：Superday / Final Round（5-10轮，1天）'),
  li(b('轮次'), t('：通常 3-5 轮正式面试，IBD 可能多达 6-8 轮')),
  li(b('Behavioral 比例'), t('：约 58% 的问题是 Behavioral，其余是 Technical 和 Business Sense')),
  li(b('Technical 重点'), t('：DCF 三步走 / 三张报表联动 / LBO 概念 / M&A Accretion/Dilution')),
  li(b('Business Sense'), t('：评价某笔交易 / 某个行业趋势 / "How would you evaluate this acquisition?"')),
  li(b('Case Study'), t('："A client is considering acquiring a competitor—how would you approach this?"')),
  hr(),

  h2('二、Goldman Sachs 高频面试题全集'),

  h3('Behavioral 核心题（必须准备）'),
  li(b('Q: Why Goldman Sachs?'), t('A: 要具体！提到 GS 的 Special Situations Group / Merchant Banking / Marcus（消费金融）/ 某个行业的 deal flow 等，而不是"因为你们是最好的投行"')),
  li(b('Q: Walk me through your resume.'), t('A: 2-3分钟，从最近的经历倒叙，每段经历提取1个核心成就，结尾连接"这就是为什么我申请 GS"')),
  li(b('Q: Tell me about a time you faced a tight deadline.'), t('A: STAR格式，Action 要详细（你具体做了什么 step by step），Result 必须量化')),
  li(b('Q: Describe a conflict with a coworker.'), t('A: 展示 Professional Maturity。不要抱怨对方，重点放在你如何 initiate 解决对话和达成共识')),
  li(b('Q: What is your greatest weakness?'), t('A: 真实弱点 + 正在改进的方法。例："早期我在 presentation 时语速太快，我通过每周录制自己的演讲并回看来改进，现在控制在 120 words/min"')),

  h3('Technical 题库'),
  li(b('Q: Walk me through a DCF.'), t('A: 预测 5-10年 FCFF → 用 WACC 折现 → 加 Terminal Value（Gordon Growth 法或 EBITDA Multiple 法）→ 减 Net Debt = Equity Value')),
  li(b('Q: If net income increases by $10, what happens to the 3 statements?'), t('A: IS: Net Income +$10。BS: Cash/Retained Earnings +$6（假设40%税率已折算）；严格来说需要看是否 Cash 还是 AR。CFS: Operating Activities 没有现金影响（只有付款时才影响）')),
  li(b('Q: What are the 3 main valuation methods?'), t('A: (1) DCF（内在价值，基于预测，最主观但最全面）(2) Comparable Company Analysis（市场参考，快速）(3) Precedent Transactions（M&A 历史，包含控制权溢价）')),
  li(b('Q: When would you NOT use P/E?'), t('A: (1) 公司亏损时（负 P/E 无意义）(2) 有大量非经常性项目导致 Net Income 失真时 (3) 跨行业比较时（不同行业 P/E 标准不同）')),
  li(b('Q: What is WACC?'), t('A: Weighted Average Cost of Capital = (E/V × Re) + (D/V × Rd × (1-T))。反映公司的综合融资成本，用于 DCF 折现率')),

  h3('Business Sense 题库'),
  li(b('Q: Tell me about a recent M&A deal you find interesting.'), t('A: 准备 2-3 个真实近期案例。Structure: 1)交易概述 2)战略逻辑（协同效应）3)估值是否合理 4)你的观点')),
  li(b('Q: What sectors do you think will outperform in the next 2 years?'), t('A: 要有独立观点！说 AI/半导体（标准答案），加上你自己的 thesis')),
  li(b('Q: How would you evaluate whether a company should acquire a competitor?'), t('A: Strategic fit → Financial analysis（Synergies vs Premium）→ Integration risk → Regulatory risk → Financing options')),
  hr(),

  h2('三、JP Morgan 面试全流程'),

  h3('JP Morgan 特点'),
  li(b('面试风格'), t('：Behavioral 占 69%，比 GS 更强调行为面试')),
  li(b('Pymetrics 测试'), t('：独有！通过 12 个小游戏测试你的认知/社交/行为特征（30分钟）')),
  li(b('文化'), t('：更注重 Teamwork 和 Diversity & Inclusion；有 JPMorgan Access 等多元化项目')),

  h3('阶段 1：Pymetrics 测试（独家）'),
  p(t('Pymetrics 是 JPM 独有的筛选工具，通过12个游戏评估你的90个性格特征。不是智力测试，是行为特征测试。')),
  li(b('气球游戏'), t('：测试 Risk Tolerance（风险承受能力）')),
  li(b('红球游戏'), t('：测试 Attention 和 Pattern Recognition')),
  li(b('记忆游戏'), t('：测试 Working Memory')),
  quote(b('注意：'), t('Pymetrics 没有标准"正确答案"。JPM 系统会对比你的特征和 JPM 高绩效员工的特征。最佳策略：保持自然，不要刻意操纵答案（系统能检测）。')),

  h3('阶段 2：HireVue（20分钟）'),
  li(b('格式'), t('：与 GS 类似，3-5 道行为题')),
  li(b('JPM HireVue 高频题'), t('：Why investment banking? / Why JP Morgan? / Tell me about yourself / Describe a time you had a positive impact on a project')),

  h3('阶段 3：Superday（Final Round）'),
  li(b('轮次'), t('：通常 4-6 轮')),
  li(b('题型分布'), t('：Behavioral 69% / Technical（Valuation + Accounting）20% / Business Sense 11%')),
  li(b('JPM 特色题'), t('："Make a sales pitch for something you are interested in" — 测试你的 Communication 和 Passion')),
  li(b('"What is the biggest challenge you have faced"'), t('：JPM 特别看重 Resilience 和 Growth Mindset')),
  hr(),

  h2('四、GS vs JPM 对比'),
  li(b('文化差异'), t('：GS 更"狼性"、以交易为核心；JPM 更"结构化"、有更多 Diversity 项目')),
  li(b('面试风格'), t('：GS 侧重 Technical + Business Judgment；JPM 侧重 Behavioral + Team Fit')),
  li(b('薪资'), t('：几乎相同（2024-2025 Base $110k，Bonus $55k-$70k Year 1）')),
  li(b('出口机会'), t('：两者 Alumni 网络都极强，都是 PE/HF 跳槽的最优平台')),
  li(b('哪个更容易进？'), t('：无绝对答案，取决于个人背景。建议两家都申请，互相作为 backup')),
  hr(),

  h2('五、所有顶级投行通用的 5 条黄金准则'),
  li(b('准则1：Know Your Resume Deeply'), t('：简历上的每一条经历都要能讲出 5 分钟的故事。随时被追问细节')),
  li(b('准则2：Follow Financial News Daily'), t('：每天看 WSJ / Bloomberg / FT 10-15 分钟，面试前能说出最近3条重大 M&A/IPO/市场事件')),
  li(b('准则3：Nail the Technical Fundamentals'), t('：三张报表联动 + DCF + LBO概念 + Comps — 这是最低门槛，不会直接淘汰')),
  li(b('准则4：STAR Format for Every Story'), t('：所有 Behavioral 答案必须有清晰的 Situation→Task→Action→Result 结构，并有数字量化')),
  li(b('准则5：Practice Out Loud'), t('：在脑子里想100遍不如大声说出来练10遍。找 Mock Interview Partner 是必须做的事')),
];

// ─── 页面3：简历写作 + ATS 优化完全指南 ─────────────────────────
const RESUME_BLOCKS = [
  p(t('美国求职的第一关是简历筛选——99% 的 Fortune 500 公司使用 ATS（Applicant Tracking System）自动筛选简历。你的简历可能在到达人类审阅者之前就已经被淘汰了。')),
  hr(),

  h2('一、美国简历 vs 中国/其他国家简历'),

  h3('核心差异'),
  li(b('长度'), t('：美国应届生简历必须是 1 页！不超过 1 页是硬规则（有 5 年+ 工作经验才可以 2 页）')),
  li(b('照片'), t('：绝对不要放照片！美国雇主不要求且明确不希望看到，这是法律合规要求')),
  li(b('个人信息'), t('：不写年龄/婚姻状况/国籍/性别。只需要姓名、邮件、手机、LinkedIn URL（可选）')),
  li(b('格式'), t('：成就导向（Achievement-focused），每条工作经历用动词+数字描述结果')),
  li(b('语言'), t('：全英文，避免 Chinglish（中式英语）')),

  h3('签证状态如何写'),
  li(b('CPT 期间'), t('：不必在简历上注明，但网申问卷里如实填')),
  li(b('OPT 期间'), t('：可以在 Contact Info 下加一行：Work Authorization: OPT - Authorized to work in the U.S.')),
  li(b('需要 H-1B'), t('：在网申系统里选"Yes, will require sponsorship"，简历上无需特别注明')),
  hr(),

  h2('二、ATS 工作原理'),
  p(t('ATS 是一个数据库系统，它把你的简历解析成结构化数据，然后与职位描述（JD）匹配关键词。如果匹配分低于阈值，简历直接进"垃圾桶"。')),

  h3('ATS 如何评分'),
  li(b('关键词匹配'), t('：JD 中出现的技能词、工具名称、职位名称出现在你的简历中得分')),
  li(b('解析准确性'), t('：ATS 能否正确识别你的工作经历、教育背景、技能')),
  li(b('格式兼容性'), t('：表格/图形/PDF特殊格式可能导致 ATS 解析失败')),
  quote(b('测试工具：'), t('用 Jobscan.co 上传简历和 JD，可以看到 ATS 匹配分数和优化建议。目标：匹配分 65-75% 以上。Resume Worded 也可以免费使用。')),

  h3('ATS 常见错误'),
  li(b('使用表格/文本框'), t('：ATS 无法解析，信息可能被完全忽略')),
  li(b('非标准字体'), t('：用 Arial / Calibri / Times New Roman，避免花哨字体')),
  li(b('错误文件格式'), t('：除非 JD 特别要求 PDF，否则提交 .docx')),
  li(b('缩写不完整'), t('：不要只写 "ML"，写 "Machine Learning (ML)"')),
  li(b('非标准标题'), t('：不要写 "My Professional Journey"，写 "Work Experience"')),
  li(b('关键词堆砌'), t('：人工看到关键词堆砌会直接拒，ATS 也会检测')),
  hr(),

  h2('三、简历格式规范'),

  h3('文件结构（自上而下）'),
  ol(t('Header（姓名 + 联系方式）')),
  ol(t('Summary / Objective（可选，2-3句话）')),
  ol(t('Education（学历，应届生放最前面）')),
  ol(t('Work Experience / Internships（最重要的部分）')),
  ol(t('Projects（可选，Tech/Quant类必备）')),
  ol(t('Skills（技能）')),
  ol(t('Activities / Leadership（可选）')),

  h3('Education 怎么写'),
  li(b('格式'), t('：学校名 | 专业 | GPA（3.5+ 才写） | 毕业年份')),
  li(b('相关课程'), t('：可加一行 Relevant Coursework（选3-5门最相关的课）')),
  li(b('荣誉'), t('：Dean\'s List / Cum Laude 等写上')),
  li(b('国内本科'), t('：写清楚大学全称（不要写拼音缩写），加 GPA（如果有且好看）')),

  h3('Work Experience 每条怎么写'),
  p(t('格式：[公司名] | [职位] | [城市] | [时间段]')),
  p(t('然后是 3-5 个 Bullet Points，每条以 强动词 开头 + 量化结果。')),
  li(b('好的例子'), t('：Developed Python automation script reducing data processing time by 40%, saving 8 hours/week for a team of 5')),
  li(b('差的例子'), t('：Helped with data processing tasks')),
  li(b('常用强动词'), t('：Developed / Analyzed / Led / Designed / Implemented / Optimized / Reduced / Increased / Generated / Launched / Managed / Built')),
  quote(b('黄金公式：'), t('"Strong action verb + what you did + how you did it (method/tool) + quantified result (%, $, time)"')),

  h3('如何量化结果'),
  li(b('有数字时'), t('：直接用数字：节省了 200小时、提升了35%、影响了5,000名用户')),
  li(b('没有精确数字时'), t('：估算量级：约减少了30%处理时间、提升了20%团队效率')),
  li(b('没有任何数字时'), t('：描述规模/范围："cross-functional team of 8" / "3 product lines" / "$2M project"')),
  li(b('绝对不要'), t('：写没有任何数字和规模的纯描述性语句')),
  hr(),

  h2('四、针对中国留学生的简历常见问题'),

  h3('问题1：国内经历如何转化'),
  li(b('公司知名度'), t('：腾讯/阿里/华为 → 美国雇主知道；其他公司加一句描述："China\'s leading XXX company with $XB revenue"')),
  li(b('职位名称翻译'), t('：不要直译，用美国标准职位名称。"产品专员" → "Product Analyst"')),
  li(b('成就转化'), t('：把中国的成就用美国能理解的框架描述，关键是量化')),

  h3('问题2：语言表达'),
  li(b('避免 Chinglish'), t('："Responsible for the execution of the project" → "Led project execution"')),
  li(b('主动语态'), t('：每个 Bullet 用主动语态，避免 "Was responsible for"')),
  li(b('工具'), t('：用 Grammarly 检查语法，或者让美国同学帮你 review')),

  h3('问题3：GPA 写法'),
  li(b('GPA 3.5+'), t('：写上，格式：GPA: 3.7/4.0')),
  li(b('GPA 3.0-3.4'), t('：谨慎考虑是否写，投行/MBB 的 GPA 门槛是 3.5+')),
  li(b('GPA 3.0以下'), t('：不要写；用其他内容（实习/项目/技能）弥补')),
  li(b('国内 GPA 换算'), t('：一般不直接换算，写原分制：GPA: 89/100 或 3.8/5.0')),
  hr(),

  h2('五、针对不同职位的简历定制'),

  h3('投行 IBD 简历'),
  li(b('必须有'), t('：Finance 相关实习（至少 1 段）+ 财务课程 + Financial Modeling 技能')),
  li(b('凸显'), t('：数字分析能力、对 M&A/Deal 的了解、高 GPA（3.7+）')),
  li(b('格式'), t('：极简、整洁、黑白配色——投行偏保守，创意设计反而减分')),

  h3('咨询 MBB/Big 4 简历'),
  li(b('必须有'), t('：团队项目经历、Leadership 角色、Problem-solving 案例')),
  li(b('凸显'), t('：Impact / Client-facing 经历 / 数据分析能力 / Cross-functional 合作')),
  li(b('Cover Letter'), t('：MBB 通常要求 Cover Letter！要特别个性化，说出你对这家公司的具体了解')),

  h3('科技大厂（非 SDE）简历'),
  li(b('必须有'), t('：SQL / Python / Excel / Data Analysis 技能，有具体项目展示')),
  li(b('凸显'), t('：Business Impact（你的工作如何影响产品/用户/收入）')),
  li(b('SDE 简历'), t('：还需要 GitHub 链接 + 主要项目的 Tech Stack + Algorithm/DS 知识')),
  hr(),

  h2('六、Cover Letter 写作指南'),
  p(t('部分公司要求 Cover Letter（特别是 MBB 咨询）。一份好的 Cover Letter 不是简历的复述，而是讲清楚"为什么是这家公司+这个职位"。')),

  h3('结构'),
  ol(t('开头段（1-2句）：说明申请职位 + 你最核心的 Hook（一句话说明你为什么特别适合）')),
  ol(t('主体段1：你的最相关经历 + 如何与职位契合')),
  ol(t('主体段2：为什么是这家公司（具体！具体！具体！）')),
  ol(t('结尾段（2-3句）：表达热情 + Thank you + 邀请面试')),
  quote(b('核心原则：'), t('具体性。"I am passionate about consulting" 毫无价值。"After attending McKinsey\'s Solve Challenge event and reading about your work on digital transformation for healthcare systems, I am particularly excited about..." 才有价值。')),
];

// ─── 页面4：MBB Networking 完整路径 + 申请时间线 ──────────────────
const MBB_NETWORK_BLOCKS = [
  p(t('咨询求职中，Networking 的权重比很多人想象的高得多。McKinsey 估计，有推荐的候选人获得第一轮面试的概率是冷申的 5 倍。本页提供从零开始的完整 Networking 路径。')),
  hr(),

  h2('一、MBB 申请时间线（完整版）'),

  h3('本科生时间线'),
  li(b('大二（Sophomore）秋冬'), t('：参加 BCG\'s Diversity Programs / Bain BEL / McKinsey Sophomore Programs；开始了解咨询行业')),
  li(b('大二春季 - 大三秋季'), t('：参加 On-campus Info Sessions；开始与校友 Coffee Chat；加入 Case Competition 团队')),
  li(b('大三春季（1-4月）'), t('：开始正式 Networking（关键期！）；加入学校的咨询俱乐部')),
  li(b('大三夏季（5-7月）'), t('：暑期实习 Deadline 开始到来！McKinsey July 17 / BCG June 23-Sep 3 / Bain July 6-Sep 2')),
  li(b('大三暑假（6-8月）'), t('：做 Summer Internship（金融/咨询相关最好）；练习 Case Interview')),
  li(b('大四开学（8-10月）'), t('：全职申请 Deadline；面试轮次（通常 2 轮：First Round + Final Round）')),
  li(b('大四（9-11月）'), t('：Offers 发出；通常给 1-2 周 Exploding Deadline 决定')),
  quote(b('关键结论：'), t('从大一开始就要准备，最晚大三开学就要开始 Networking。不要等到大四再临时抱佛脚。')),

  h3('MBA 学生时间线（2年制）'),
  li(b('入学前暑假'), t('：Experience Bain / McKinsey Summer Programs（给 Pre-MBA 的 diversity 项目）')),
  li(b('MBA 第一年秋（9-11月）'), t('：Summer Associate 实习 Networking；Info Sessions；Case Prep')),
  li(b('MBA 第一年（11-12月）'), t('：Summer Associate Deadline（McKinsey Nov / BCG Nov / Bain Nov）')),
  li(b('MBA 第一年（1-4月）'), t('：First Round → Second Round 面试；Offers')),
  li(b('MBA 第一年暑假'), t('：Summer Associate 实习（10-12周）')),
  li(b('MBA 第二年（7-9月）'), t('：全职 Consultant 申请 Deadline（McKinsey Sep / BCG Sep-Oct / Bain Sep）')),
  li(b('MBA 第二年（10-12月）'), t('：Full-time Offer → 毕业入职')),
  hr(),

  h2('二、Networking 的核心逻辑'),

  h3('为什么 Networking 对咨询特别重要'),
  li(b('推荐加速通道'), t('：很多办公室会先看有 Employee Referral 的申请，这批申请会被"Fast-track"')),
  li(b('信息不对称'), t('：没有 Networking，你不知道某个办公室今年招哪个行业、文化是什么')),
  li(b('Airport Test'), t('：咨询顾问要判断"这个人我能在机场共处4小时吗？" — Networking 就是提前建立这种信任')),
  li(b('Non-target 学校的命门'), t('：非 Target School 学生，没有 On-campus Recruiting，唯一进入 MBB 的路径就是 Networking')),

  h3('谁值得联系（优先级排序）'),
  ol(t('校友（同大学/同专业）：最高优先级，情感连接强，成功率最高')),
  ol(t('同类背景（中国留学生、同专业转行）：共同经历带来共鸣')),
  ol(t('你认识的人的直接联系人（2度连接）：降低陌生感')),
  ol(t('Info Session 后主动交换名片的顾问：已建立初步印象')),
  ol(t('Cold Email / LinkedIn 陌拜：最后手段，但比多数人想象的更有效')),
  hr(),

  h2('三、Coffee Chat / Informational Chat 实战'),

  h3('联系方式'),
  li(b('LinkedIn 是找人的工具'), t('，但联系方式最好用 Email。在 LinkedIn 上找到名字后，用公司邮件格式联系')),
  li(b('MBB 邮件格式'), t('：McKinsey: firstname_lastname@mckinsey.com / BCG: firstname.lastname@bcg.com / Bain: firstnamelastname@bain.com')),
  li(b('2/2/2 规则'), t('：同一办公室同时联系不超过 2 人；间隔不超过 2 周；每人最多联系 2 次')),

  h3('Cold Email 模板（MBB）'),
  quote(
    b('Subject: Coffee Chat Request – [Your School] / [Your Program]'),
    t('\n\nDear [Name],\n\nI came across your profile while researching [Firm]\'s [Office] office and noticed we share a connection through [School / X field / background].\n\nI\'m currently a [Year] at [School] studying [Major] and am deeply interested in pursuing a career in management consulting. I\'ve been particularly drawn to [Firm]\'s work in [specific sector/practice, e.g., Digital Transformation / Private Equity practice] after learning about [specific project or public initiative].\n\nWould you be open to a 15-20 minute call at your convenience? I\'d love to learn more about your experience transitioning into consulting and any advice you might have for the recruiting process.\n\nThank you so much for your time, and I look forward to hearing from you.\n\nBest,\n[Your Name]\n[School / Program] | [LinkedIn URL]')
  ),

  h3('Coffee Chat 核心问题（准备 3-5 个）'),
  li(b('关于经历'), t('："What led you to consulting, and what has surprised you most about the work?"')),
  li(b('关于招聘'), t('："What qualities do you think set apart successful candidates at [Firm] specifically?"')),
  li(b('关于 Case 准备'), t('："What would you recommend for case interview prep given my background in [X]?"')),
  li(b('关于文化'), t('："Can you describe what a typical project looks like in the [Practice Area] at this office?"')),
  li(b('最后的关键问题'), t('："Is there anyone else at [Firm] or in consulting you\'d recommend I speak with?"（链式扩展）')),

  h3('跟进（Follow-up）'),
  li(b('24小时内发感谢邮件'), t('：提到 1-2 个你从对话中学到的具体内容')),
  li(b('申请时告知'), t('："I wanted to let you know I\'ve submitted my application to [Firm]. Thank you again for your guidance — it greatly informed how I positioned my application."')),
  li(b('Offer 后感谢'), t('：无论录取与否，感谢每一个帮助过你的人')),
  hr(),

  h2('四、MBB 申请材料准备'),

  h3('简历（Resume）'),
  li(b('1页'), t('：绝对不超过 1 页，即使你有 4 年经验')),
  li(b('Impact-driven'), t('：每条 Bullet 有量化数字，用 "Led / Designed / Analyzed" 等强动词')),
  li(b('Leadership 必须有'), t('：社团领导 / 项目负责人 / 竞赛成绩，体现出 leadership potential')),
  li(b('Case Competition'), t('：参加过学校的 Business Case Competition 是加分项，获奖更好')),

  h3('Cover Letter（MBB 必须写）'),
  li(b('字数'), t('：400-500字，一页')),
  li(b('结构'), t('：Why Consulting + Why THIS Firm + Why Me')),
  li(b('具体化'), t('：提到具体的 Firm 项目/价值观/近期 Publication')),
  li(b('Don\'t copy-paste'), t('：面试官一眼能看出通用 Cover Letter，立即减分')),

  h3('Diversity Programs（国际学生的额外机会）'),
  li(b('McKinsey'), t('：McKinsey Sophomore Summer / First Generation Program / Target School Diversity')),
  li(b('BCG'), t('：BCG Advance / Bridge to BCG')),
  li(b('Bain'), t('：Bain BEL（Diverse Leaders）/ Bain BASE（MBA Diversity）')),
  quote(b('重要：'), t('这些 Diversity Programs 通常有更早的 Deadline（2-3月）且竞争相对较低！先投 Diversity Program，再投正式通道，大大增加获得面试的概率。')),
  hr(),

  h2('五、Case Interview 准备路线图'),

  h3('准备时间'),
  li(b('理想时间'), t('：至少 3-4 个月的系统准备，6 个月更好')),
  li(b('阶段划分'), t('：第 1 个月：学习框架 → 第 2-3 个月：每天练 Case → 第 4 个月：Mock Interview')),

  h3('资源推荐'),
  li(b('书籍'), t('：《Case In Point》（经典）/ 《The McKinsey Way》（文化了解）')),
  li(b('在线平台'), t('：PrepLounge（欧洲风格）/ CaseCoach.me / RocketBlocks（美国风格）/ MConsultingPrep')),
  li(b('YouTube'), t('：Management Consulted / CaseCoach / Kenton Kivestu — 有大量免费视频案例')),
  li(b('Mock Partner'), t('：PrepLounge 上可以找 Practice Partner；学校 Consulting Club 也有配对项目')),

  h3('练习节奏（建议）'),
  li(b('前 2 周'), t('：只学框架（Profitability / Market Entry / Market Sizing），不做真题')),
  li(b('第 3-8 周'), t('：每天 1-2 个 Case，独立思考后再看答案；开始录制自己的回答')),
  li(b('第 9-12 周'), t('：每周至少 3 次 Mock Interview（有Partner，互相扮演面试官）')),
  li(b('最后 2 周'), t('：模拟真实 Superday 节奏，连续做 5-6 个 Case')),
  quote(b('关键数据：'), t('McKinsey 的调研显示，做了 60+ 个 Case 练习的候选人，通过率比做了 20 个以下的候选人高出 2-3 倍。质量 > 数量，但数量也很重要。')),
];

// ─── 主流程 ────────────────────────────────────────────────────────
const PAGES = [
  { title: '🏦 四大会计师事务所完整攻略（Deloitte/PwC/EY/KPMG）', blocks: BIG4_BLOCKS },
  { title: '💼 Goldman Sachs / JP Morgan 面试全攻略', blocks: GS_JPM_BLOCKS },
  { title: '📄 简历写作 + ATS 优化完全指南（国际学生版）', blocks: RESUME_BLOCKS },
  { title: '🎯 MBB Networking 完整路径 + 申请时间线', blocks: MBB_NETWORK_BLOCKS },
];

async function main() {
  console.log('🚀 开始写入深度内容（第二批）...\n');
  for (const page of PAGES) {
    await createPage(page.title, page.blocks);
    await sleep(1000);
  }
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
