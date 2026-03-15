/**
 * 美国商科求职知识库 → 飞书 Wiki
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 node_modules/.bin/ts-node scripts/us_jobs_wiki/run.ts
 *
 * space_id: 7615700879567506381
 * 根节点:   Adh3w4XwCiMs2zkApVhcFdT0nFf
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

// ─── 用户 token ─────────────────────────────────────────────
const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
let USER_TOKEN: string;
try {
  USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
  if (!USER_TOKEN) throw new Error('access_token 为空');
} catch (e: any) {
  console.error('❌ 无法读取用户 token:', e.message);
  console.error('   请先运行: cd ~/startup-7steps && NODE_TLS_REJECT_UNAUTHORIZED=0 node feishu-auth.js');
  process.exit(1);
}

const SPACE_ID = '7615700879567506381';
const ROOT_NODE_TOKEN = 'Adh3w4XwCiMs2zkApVhcFdT0nFf';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

// ─── HTTP ────────────────────────────────────────────────────
function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(`JSON parse error: ${d.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Block 工厂 ──────────────────────────────────────────────
export function t(content: string, style?: any) { return { text_run: { content, text_element_style: style ?? {} } }; }
export function b(content: string) { return t(content, { bold: true }); }
export function p(...elements: any[]) { return { block_type: 2, text: { elements, style: {} } }; }
export function h1(text: string) { return { block_type: 3, heading1: { elements: [t(text)], style: {} } }; }
export function h2(text: string) { return { block_type: 4, heading2: { elements: [t(text)], style: {} } }; }
export function h3(text: string) { return { block_type: 5, heading3: { elements: [t(text)], style: {} } }; }
export function li(...elements: any[]) { return { block_type: 12, bullet: { elements, style: {} } }; }
export function nl(...elements: any[]) { return { block_type: 13, ordered: { elements, style: {} } }; }
export function hr() { return { block_type: 22, divider: {} }; }
export function quote(...elements: any[]) { return { block_type: 15, quote: { elements, style: {} } }; }

// ─── 写 blocks ────────────────────────────────────────────────
async function writeBlocks(objToken: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: blocks.slice(i, i + 50), index: i }
    );
    if (r.code !== 0) {
      console.error(`  ❌ 写blocks失败 (${i}): code=${r.code} msg=${r.msg}`);
    }
    if (i + 50 < blocks.length) await sleep(400);
  }
}

// ─── 创建 wiki 子节点 ────────────────────────────────────────
async function createNode(title: string, parentNodeToken: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    parent_node_token: parentNodeToken,
    node_type: 'origin',
    title,
  });
  if (r.code !== 0) throw new Error(`创建节点失败: ${r.code} ${r.msg}`);
  return {
    nodeToken: r.data?.node?.node_token,
    objToken: r.data?.node?.obj_token,
  };
}

// ─── 页面内容 ─────────────────────────────────────────────────

// 首页内容（写入根节点）
const HOME_BLOCKS = [
  p(t('帮助在美华人/留学生了解美国商科就业市场。覆盖咨询、投行、科技大厂等主流方向，内容来自 Reddit / Blind / LinkedIn 一手整理。')),
  hr(),

  h2('📂 知识库结构'),

  h3('一、行业与公司'),
  li(b('咨询 MBB / Big4：'), t('McKinsey / BCG / Bain / Deloitte / PwC 美国招聘路径')),
  li(b('投行 Investment Banking：'), t('GS / MS / JP Morgan IBD 应届生流程')),
  li(b('科技大厂 Big Tech：'), t('Amazon / Google / Meta 商业类岗位（BA / PM / Ops）')),
  li(b('快消 & 零售：'), t('P&G / Nike / Unilever Management Trainee')),

  h3('二、求职流程'),
  li(t('美国网申时间线（暑期实习 vs 全职）')),
  li(t('Resume / Cover Letter 写作指南（美国版）')),
  li(t('内推 Referral：怎么找、怎么开口')),
  li(t('OPT / H1B：时间线与注意事项')),

  h3('三、面试攻略'),
  li(t('Behavioral Interview（STAR 框架）高频题库')),
  li(t('Case Interview 解题框架（MBB 专项）')),
  li(t('Technical / Finance 面试备考')),

  h3('四、薪资与 Offer'),
  li(t('各行业应届薪资数据（2024-2025）')),
  li(t('Offer 对比框架 + 谈薪话术')),
  li(t('Base vs Bonus vs RSU 怎么算')),

  h3('五、中国人专属避坑'),
  li(t('Behavioral 面试里中国人最常犯的错误')),
  li(t('美国职场文化差异（≠ 国内）')),
  li(t('中文口音 & 沟通风格影响')),
  li(t('背景调查 / Reference 怎么准备')),

  hr(),

  h2('📡 内容来源'),
  li(t('Reddit：r/MBA / r/consulting / r/financialcareers / r/cscareerquestions')),
  li(t('Blind：薪资数据 & 面经最真实')),
  li(t('Glassdoor：面试题 + 公司评价')),
  li(t('LinkedIn：大厂 HR / Recruiter 帖子')),

  hr(),
  p(t('持续更新中 · 最后更新：2026年3月')),
];

// ─── 行业与公司 ────────────────────────────────────────────────
const INDUSTRY_BLOCKS = [
  p(t('覆盖美国主要雇主：MBB咨询、投行、科技大厂、快消。数据来自 Glassdoor / Blind / 官网，2024-2025 届。')),
  hr(),

  h2('咨询 Management Consulting'),

  h3('MBB（McKinsey / BCG / Bain）'),
  li(b('应届入口：'), t('McKinsey BA / BCG Associate / Bain Associate Consultant')),
  li(b('申请时间：'), t('全职：9-11月；暑期实习：1-3月（提前一年）')),
  li(b('流程：'), t('网申 → Resume/Cover Letter筛选 → 视频面试 → Superday（2-3轮Case+Fit）')),
  li(b('面试特点：'), t('McKinsey 用 interviewer-led case；BCG/Bain 用 candidate-led case')),
  li(b('应届薪资：'), t('BA/AC：$100k-$110k base + $25-35k signing + $35-60k first-year bonus')),
  li(b('OPT 友好度：'), t('接受 OPT，但 H1B 抽签不保证。BCG 支持 H1B sponsorship')),
  li(b('Blind 评价：'), t('工作强度极大（周60-80小时），但职业背书极强')),

  h3('Big4 咨询（Deloitte / PwC / EY / KPMG）'),
  li(b('主要岗位：'), t('Consultant / Analyst（Strategy & Consulting / Tech / Financial Advisory）')),
  li(b('申请时间：'), t('全职：9月开放，11-12月截止；滚动录取')),
  li(b('流程：'), t('网申 → HireVue 视频面试 → Virtual/In-person Assessment Center')),
  li(b('应届薪资：'), t('纽约 $75k-$90k；其他城市 $65k-$80k')),
  li(b('OPT 友好度：'), t('提供 H1B sponsorship，国际学生友好')),

  hr(),

  h2('投资银行 Investment Banking'),

  h3('Bulge Bracket（GS / MS / JP Morgan / Citi / BofA）'),
  li(b('应届入口：'), t('Summer Analyst（大三申请）→ 转正 Full-time Analyst')),
  li(b('申请时间：'), t('暑期实习：8-9月开始（提前一年半！），10-11月截止')),
  li(b('流程：'), t('网申 → 笔试（HackerRank/SHL）→ Superday（技术+行为面试，1天3-5轮）')),
  li(b('应届薪资（纽约IBD）：'), t('Base $110k + Signing $20k + 第一年 Bonus $80-100k，总包约$210k')),
  li(b('工作强度：'), t('周80-100小时，特别是 M&A / Lev Fin 组')),
  li(b('OPT 友好度：'), t('接受 OPT；H1B sponsorship 视部门，GS/MS 通常支持')),

  h3('Elite Boutique（Lazard / Evercore / Moelis / Centerview）'),
  li(b('特点：'), t('招聘量少，竞争极强。薪资与 BB 相当甚至更高')),
  li(b('网络要求：'), t('冷邮件 + 内推尤其关键，很多名额不对外公开')),

  hr(),

  h2('科技大厂 Big Tech（商业类岗位）'),

  h3('常见岗位类型'),
  li(b('Business Analyst（BA）：'), t('数据分析 + 业务决策支持')),
  li(b('Product Manager（PM）：'), t('产品规划，MBA热门转型方向')),
  li(b('Strategy & Operations：'), t('战略分析、运营优化')),
  li(b('Finance / FP&A：'), t('财务规划与分析')),

  h3('Google'),
  li(b('应届入口：'), t('Business Analyst / Financial Analyst / Strategy & Operations')),
  li(b('流程：'), t('网申 → 电话面试 → Onsite（4-5轮，行为+Case+数据分析）')),
  li(b('应届薪资（湾区）：'), t('$120-140k base + $50-80k signing + RSU')),

  h3('Amazon'),
  li(b('应届入口：'), t('Business Analyst / Finance Analyst / Product Manager')),
  li(b('流程：'), t('网申 → OA（在线测试）→ 电话面试 → Loop Interview（Leadership Principles为核心）')),
  li(b('应届薪资：'), t('$100-120k base + signing + RSU（RSU 4年 vesting）')),
  li(b('注意：'), t('Amazon 面试极度强调 14 条 Leadership Principles，必须背熟并准备例子')),

  h3('Meta / Apple'),
  li(b('应届薪资（湾区）：'), t('$130-150k base + RSU，总包3-4年内可达$300k+')),

  hr(),

  h2('快消 & 零售 FMCG / Retail'),

  h3('P&G / Unilever / Nike'),
  li(b('招聘项目：'), t('Management Trainee / Leadership Development Program（LDP）')),
  li(b('特点：'), t('轮岗制，快速上升；薪资低于咨询/金融（$65-85k）')),
  li(b('OPT 友好度：'), t('一般，视公司和部门。P&G 不一定提供 H1B sponsorship')),
  li(b('适合人群：'), t('对品牌/市场/运营感兴趣，不想做高强度金融/咨询')),

  hr(),

  quote(b('选择建议：'), t('最大化薪资 → IBD → PE；职业背书+多元出路 → MBB；工作生活平衡+高总包 → 科技大厂。不要只看 Base，算清楚 Total Compensation（含 Bonus + RSU + Signing）。')),
];

// ─── 求职流程 ───────────────────────────────────────────────────
const PROCESS_BLOCKS = [
  p(t('美国商科求职节奏与国内完全不同。关键：要提前一年开始，节奏极快。')),
  hr(),

  h2('🗓️ 时间线总览'),

  h3('暑期实习 Summer Internship（大三申请，次年暑假实习）'),
  li(b('7-9月：'), t('开始找内推 Referral，投简历前 networking')),
  li(b('8-10月：'), t('主要 Deadline 集中，投行尤其早（有的9月就截止）')),
  li(b('10-11月：'), t('面试高峰期，Superday 集中')),
  li(b('11-12月：'), t('Offer 陆续发出')),
  li(b('次年6-8月：'), t('暑期实习，末期通常有转正评估')),

  h3('全职应届 Full-time（大四/毕业生申请）'),
  li(b('8-10月：'), t('大公司开放申请（咨询/投行/科技）')),
  li(b('10-12月：'), t('面试密集期')),
  li(b('12月-次年1月：'), t('Offer 发放，通常给2-4周决定时间')),
  li(b('次年6-8月：'), t('入职')),

  hr(),

  h2('📄 Resume（美国简历）'),

  h3('与国内简历的核心区别'),
  li(b('长度：'), t('应届生 1 页，严格控制。超过1页直接筛掉')),
  li(b('无照片：'), t('美国简历不放照片')),
  li(b('格式：'), t('Reverse Chronological（最新在前），用 Bullet Points')),
  li(b('量化结果：'), t('每条 Bullet 必须有数字。"提升了效率"不够，要写"提升了30%效率"')),
  li(b('动词开头：'), t('每条 Bullet 用强动词开头：Developed / Led / Increased / Built...')),

  h3('咨询简历 vs 金融简历'),
  li(b('咨询：'), t('强调问题拆解、数据分析、领导力、影响力')),
  li(b('金融：'), t('强调建模技能（DCF/LBO）、财务知识、行业研究')),

  h3('ATS 系统注意事项'),
  li(t('用标准字体（Times New Roman / Arial / Calibri）')),
  li(t('不用表格、边框、多列布局（ATS 无法解析）')),
  li(t('文件名：FirstName_LastName_Resume.pdf')),

  hr(),

  h2('📧 内推 Referral'),

  h3('为什么内推重要'),
  p(t('咨询/投行的简历筛选极其激烈，内推可以绕过初筛直达 HR。有内推的简历被看到的概率高出 5-10 倍。')),

  h3('怎么找内推'),
  li(b('LinkedIn：'), t('搜索目标公司 + 目标岗位的员工（优先找华人或中国留学生）')),
  li(b('学校 Alumni Network：'), t('找同校校友，成功率最高')),
  li(b('朋友圈：'), t('二度人脉往往比冷联系更有效')),

  h3('正确的开口方式'),
  li(b('❌ 错误：'), t('直接上来就问"能帮我内推吗？"')),
  li(b('✓ 正确：'), t('先建立联系 → 聊对方经历和公司文化 → 30分钟信息访谈 → 自然过渡到请求内推')),
  p(b('模板：'), t("\"Hi [Name], I noticed we both went to [school / we're both in consulting]. I'm exploring opportunities at [Company] and would love to learn about your experience for 20 minutes. Would you have time for a quick chat?\"")),

  hr(),

  h2('🛂 OPT / H1B 关键节点'),

  h3('OPT 申请时间线'),
  li(b('毕业前90天：'), t('可向 DSO 申请 OPT，提交 I-765 表格给 USCIS')),
  li(b('审批时间：'), t('通常 3-5 个月，务必提前申请')),
  li(b('OPT 有效期：'), t('12个月；STEM OPT 额外延长 24 个月（共 36 个月）')),
  li(b('STEM OPT 条件：'), t('需在 E-Verify 雇主处工作，须在第一个 OPT 结束前90天申请延期')),

  h3('H1B 注意事项'),
  li(b('抽签制：'), t('每年4月抽签，名额约 85,000（6.5 万 + 2 万硕士以上）')),
  li(b('中签率：'), t('近年约 25-30%，不保证')),
  li(b('时间节点：'), t('3月注册→4月抽签→10月1日起生效（即使6月入职也要等H1B）')),
  li(b('建议：'), t('优先选择支持 H1B sponsorship 且有历史记录的大雇主（咨询四大/大银行/科技大厂）')),
];

// ─── 面试攻略 ───────────────────────────────────────────────────
const INTERVIEW_BLOCKS = [
  p(t('美国商科面试分三大类型：Behavioral（行为面试）、Case（案例面试）、Technical（专业技术）。每种考察重点不同，需要分开准备。')),
  hr(),

  h2('🗣️ Behavioral Interview（行为面试）'),

  h3('核心框架：STAR'),
  li(b('S - Situation：'), t('简要描述背景（2-3句话）')),
  li(b('T - Task：'), t('你的角色和任务是什么')),
  li(b('A - Action：'), t('你具体做了什么（重点，占60-70%时间）')),
  li(b('R - Result：'), t('最终结果，必须量化')),

  h3('高频题目分类'),

  h3('领导力类'),
  li(t('"Tell me about a time you led a team through a difficult situation."')),
  li(t('"Describe a time you had to influence someone who didn\'t report to you."')),
  li(t('"Tell me about a time you took initiative without being asked."')),

  h3('协作与冲突类'),
  li(t('"Describe a conflict you had with a teammate. How did you resolve it?"')),
  li(t('"Tell me about a time you had to work with someone difficult."')),
  li(t('"Give an example of a time you had to make a decision with limited information."')),

  h3('失败与成长类'),
  li(t('"Tell me about your biggest failure or mistake. What did you learn?"')),
  li(t('"Describe a time when you received critical feedback. How did you respond?"')),

  h3('中国人常犯的3大错误'),
  li(b('说"我们"而不是"我"：'), t('美国面试官要听你个人做了什么，不是团队集体贡献')),
  li(b('结果没有量化：'), t('"我提升了效率"不够，要说"减少了30%处理时间"')),
  li(b('故事太短：'), t('STAR 至少要讲 2-3 分钟，行动部分要有细节')),

  hr(),

  h2('📊 Case Interview（案例面试）'),

  h3('类型对比'),
  li(b('McKinsey（Interviewer-led）：'), t('面试官引导每一步，问"接下来你想看什么数据？"——你只需回答当前问题')),
  li(b('BCG / Bain（Candidate-led）：'), t('你主导整个框架拆解，需要完整呈现结构化思路')),

  h3('常见 Case 类型'),
  li(b('利润下降 Profitability：'), t('利润 = 收入 - 成本 → 分别拆解原因')),
  li(b('市场进入 Market Entry：'), t('市场规模 + 竞争格局 + 公司能力 + 进入方式')),
  li(b('并购 M&A：'), t('战略fit + 财务分析 + 整合风险')),
  li(b('增长策略 Growth：'), t('现有市场 vs 新市场 vs 新产品')),
  li(b('估算 Market Sizing：'), t('人口 × 渗透率 × 频次 × 客单价')),

  h3('Case 练习资源'),
  li(b('Case in Point（书）：'), t('经典教材，框架大全')),
  li(b('Management Consulted / CaseCoach：'), t('付费平台，质量高')),
  li(b('Reddit r/consulting：'), t('免费练习伙伴')),
  li(b('目标：'), t('正式面试前完成 50-100 个 Case')),

  hr(),

  h2('💹 Technical / Finance 面试'),

  h3('投行技术面试高频题'),
  li(b('Walk me through a DCF：'), t('预测自由现金流 → 折现 → 加终值 → 减债加现金 = 股权价值')),
  li(b('三大报表关系：'), t('净利润流入留存收益（BS）；非现金项目调回（CF）；资产=负债+权益')),
  li(b('LBO 基本逻辑：'), t('借钱买公司 → 用 FCF 还债 → 财务杠杆放大 IRR')),
  li(b('PE Multiples：'), t('EV/EBITDA / P/E / P/B 用于不同行业估值')),

  h3('科技大厂 BA 面试'),
  li(b('SQL：'), t('必须熟练。JOIN / GROUP BY / Window Functions')),
  li(b('指标体系：'), t('如何定义和追踪某业务的核心指标？')),
  li(b('实验设计：'), t('A/B Test 怎么设计？如何判断统计显著性？')),
  li(b('Product Sense：'), t('"如果某指标下降了，你怎么排查？"')),
];

// ─── 薪资与 Offer ────────────────────────────────────────────────
const SALARY_BLOCKS = [
  p(t('数据来源：Glassdoor / Blind / Levels.fyi / 官方薪资披露。2024-2025 届，纽约/旧金山地区。')),
  hr(),

  h2('各行业应届薪资对比'),

  h3('咨询'),
  li(b('MBB（BA/AC，纽约）：'), t('Base $100-110k + Signing $25-35k + 第一年Bonus $35-60k')),
  li(b('Big4 Consulting（纽约）：'), t('Base $75-90k + Bonus 10-15%')),
  li(b('Tier 2（Oliver Wyman / LEK / A.T. Kearney）：'), t('Base $90-100k + Signing')),

  h3('投资银行'),
  li(b('BB IBD Analyst（纽约）：'), t('Base $110k + Signing $20k + 年终Bonus $80-100k，总包约 $200-220k')),
  li(b('Elite Boutique（Lazard / Evercore）：'), t('略高于 BB，$220-250k+')),
  li(b('Middle Market IB：'), t('Base $90-100k + Bonus')),

  h3('科技大厂（湾区）'),
  li(b('Google（Business Analyst）：'), t('$125-145k base + RSU $150-200k/4年 + Signing')),
  li(b('Amazon（BA / Finance）：'), t('$110-130k base + RSU + Signing（Amazon RSU 后端加权）')),
  li(b('Meta（Business Operations）：'), t('$135-155k base + RSU + Bonus')),
  li(b('Apple：'), t('$120-140k base + RSU')),
  p(t('注：科技大厂总包（Total Comp）通常4年内达到 $300-500k，但 RSU 是股票，有波动风险')),

  h3('快消 / 零售'),
  li(b('P&G Management Trainee：'), t('$75-85k')),
  li(b('Unilever / Nike LDP：'), t('$70-80k')),

  hr(),

  h2('Offer 比较框架'),

  h3('不要只看 Base'),
  p(t('Total Compensation = Base Salary + Annual Bonus + Signing Bonus + RSU/Equity')),
  li(b('Base：'), t('稳定，影响社保/税基')),
  li(b('Bonus：'), t('与公司业绩挂钩，有风险。投行 Bonus 可达 Base 的 100%')),
  li(b('Signing Bonus：'), t('一次性，通常要求工作满1年否则需退还')),
  li(b('RSU：'), t('4年 vesting，随股价波动。科技公司核心福利')),

  h3('谈薪话术'),
  li(b('第一步：'), t('不要第一个报数。"我对整个 compensation package 持开放态度"')),
  li(b('第二步：'), t('拿到数字后，查 Glassdoor/Blind 确认是否在范围内')),
  li(b('第三步：'), t('"我很兴奋这个机会，我收到另一个 offer 是 $X，你们能否 match？"')),
  li(b('注意：'), t('Base 比 Bonus 更好谈；一线大厂（GS/McKinsey/Google）谈薪空间较小，Tier 2 空间更大')),

  hr(),

  h2('生活成本对比（月均）'),

  h3('纽约（NYC）'),
  li(b('单间/合租：'), t('$2,000-3,500/月')),
  li(b('交通：'), t('地铁月票 $132')),
  li(b('餐饮：'), t('$600-1,000')),
  li(b('合计：'), t('约 $3,000-4,500/月，IBD 薪资税后约 $8,000-10,000/月')),

  h3('旧金山/湾区'),
  li(b('单间/合租：'), t('$2,500-4,000/月')),
  li(b('无公共交通（需要车）：'), t('养车 $800-1,200/月')),
  li(b('合计：'), t('约 $4,000-6,000/月，科技大厂税后约 $9,000-13,000/月')),

  h3('加州税特别注意'),
  p(t('加州州税最高 13.3%，比纽约（8.82%）更高。湾区 Base $140k 的税后到手约比纽约同等 Base 少 $8,000-12,000/年')),
];

// ─── 中国人避坑 ───────────────────────────────────────────────────
const PITFALLS_BLOCKS = [
  p(t('整理自 Reddit / Blind / 真实求职者访谈。这些坑中国留学生踩得最多。')),
  hr(),

  h2('🚫 求职流程里的坑'),

  h3('坑1：太晚开始申请'),
  p(t('美国求职，特别是投行暑期实习，Deadline 在大三9-10月就截止。很多中国学生大四才开始，已经完全错过。')),
  quote(b('规则：'), t('暑期实习比你以为的早一年开始。')),

  h3('坑2：只投官网不做 Networking'),
  p(t('美国职场高度依赖 Relationship。只投官网简历，即使简历再好，通过率也极低。投行/咨询很多名额根本不在官网上，全靠内推。')),

  h3('坑3：简历超过一页'),
  p(t('应届生简历必须是 1 页。很多中国学生习惯写2-3页详细简历，在美国会被直接筛掉。')),

  h3('坑4：GPA 门槛'),
  li(b('MBB：'), t('非明文要求，但事实上 Top 学校 GPA 3.5+ 更安全')),
  li(b('投行：'), t('GPA 3.5+ 是简历筛选的软门槛')),
  li(b('科技大厂：'), t('对 GPA 相对宽松，更看重技能和项目经历')),

  hr(),

  h2('🗣️ 面试里的坑'),

  h3('坑5：Behavioral 说"我们"'),
  p(t('中国文化强调集体，但美国面试官只想听你个人做了什么。每次说"我们做了..."，在面试官眼里就是减分。')),
  quote(b('解决：'), t('把故事里的"我们"换成"我"，明确说出你个人的贡献和决策。')),

  h3('坑6：结果不量化'),
  p(t('"我提升了团队效率"→ "通过优化流程，将处理时间减少了40%，节省了200小时/季度"')),
  p(t('没有数字 = 没有印象。就算不确定，估算一个量级也比没有强。')),

  h3('坑7：英语口音焦虑导致表达不清'),
  p(t('口音不是核心问题，表达是否清晰才是。中国学生常见：说话太快（紧张）、表达过于简短、不敢表达个人观点。')),
  quote(b('解决：'), t('放慢语速，每个 STAR 故事练习到能自然讲出，不需要背诵但要熟练。')),

  h3('坑8：Why [Company] 没有真实性'),
  p(t('面试官听过太多"因为贵公司很有名/我很崇拜..."。你需要具体说出你研究过的内容——某个项目/某位合伙人/公司某个战略方向。')),

  hr(),

  h2('🏢 美国职场文化差异'),

  h3('与国内最大的区别'),
  li(b('直接表达观点：'), t('美国职场鼓励 disagree，你不同意就说，不同意但沉默=没有价值')),
  li(b('主动展示工作：'), t('不要等人发现你的贡献，要主动 communicate 和 share updates')),
  li(b('Ask for what you want：'), t('想要晋升/加薪要主动说，没有人会自动给你')),
  li(b('Manager 关系：'), t('美国 Manager 更像 Coach，可以直接讨论职业发展，不需要等年度考核')),

  h3('Reference（背景调查）'),
  li(b('什么是 Reference：'), t('雇主会联系你提供的2-3个前 Manager/Supervisor 核实你的情况')),
  li(b('中国学生常见问题：'), t('没有在美国的职场 Reference；提供的 Reference 英语不好')),
  li(b('解决方案：'), t('实习时主动维护关系；毕业前联系教授/指导老师；确认 Reference 知道你在申请什么岗位')),

  hr(),

  h2('📋 常见高频面试题标准答案框架'),
  li(b('"Tell me about yourself"：'), t('现在（当前背景）→ 过去（关键经历）→ 未来（为什么是这个岗位）。控制在 2 分钟内')),
  li(b('"Why [Company]?"：'), t('1. 公司具体吸引我的地方 2. 和我的技能/经历的契合 3. 长期职业目标')),
  li(b('"What\'s your weakness?"：'), t('真实的弱点 + 你已经在怎么改进，不要说假弱点（"我太完美主义了"）')),
  li(b('"Do you have any questions for me?"：'), t('必须有！问面试官的个人经历/公司文化/最有挑战的项目')),
];

// ─── 页面列表 ──────────────────────────────────────────────────
interface Page {
  title: string;
  blocks: any[];
}

const PAGES: Page[] = [
  { title: '🏢 行业与公司情报', blocks: INDUSTRY_BLOCKS },
  { title: '📋 求职流程全攻略', blocks: PROCESS_BLOCKS },
  { title: '🎯 面试攻略', blocks: INTERVIEW_BLOCKS },
  { title: '💰 薪资与 Offer 指南', blocks: SALARY_BLOCKS },
  { title: '⚠️ 中国人专属避坑指南', blocks: PITFALLS_BLOCKS },
];

// ─── 主流程 ────────────────────────────────────────────────────
async function main() {
  console.log('🚀 开始发布「美国商科求职」知识库...\n');

  // 1. 获取首页 obj_token
  console.log('📍 获取首页 obj_token...');
  const nodeRes = await api('GET', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${ROOT_NODE_TOKEN}`);
  if (nodeRes.code !== 0) {
    console.error('❌ 获取根节点失败:', nodeRes.code, nodeRes.msg);
    process.exit(1);
  }
  const homeObjToken = nodeRes.data?.node?.obj_token;
  console.log(`  ✓ 首页 obj_token: ${homeObjToken}`);

  // 2. 写首页内容
  console.log('\n📝 写入首页...');
  await writeBlocks(homeObjToken, HOME_BLOCKS);
  console.log(`  ✅ https://${DOMAIN}/wiki/${ROOT_NODE_TOKEN}`);

  // 3. 创建子页面
  console.log('\n📚 创建子页面...');
  for (const page of PAGES) {
    try {
      console.log(`  📄 ${page.title}...`);
      const { nodeToken, objToken } = await createNode(page.title, ROOT_NODE_TOKEN);
      await sleep(500);
      await writeBlocks(objToken, page.blocks);
      console.log(`     ✅ https://${DOMAIN}/wiki/${nodeToken}`);
      await sleep(300);
    } catch (e: any) {
      console.error(`  ❌ ${page.title}: ${e.message}`);
    }
  }

  console.log('\n✨ 完成！');
  console.log(`🔗 知识库首页: https://${DOMAIN}/wiki/${ROOT_NODE_TOKEN}`);
}

main().catch(console.error);
