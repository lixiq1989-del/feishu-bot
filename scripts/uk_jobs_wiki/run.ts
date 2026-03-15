/**
 * 英国商科求职知识库 → 飞书 Wiki
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/uk_jobs_wiki/run.ts
 *
 * 前提：~/startup-7steps/.feishu-user-token.json 存在且未过期
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

// ─── 目标：用户创建的「英国商科求职」wiki 页面 ──────────────
// node_token 从 URL 提取：https://hcn2vc1r2jus.feishu.cn/wiki/PECkwc1ZDiR5fzkAQHccLh4gnNc
const TARGET_NODE_TOKEN = 'PECkwc1ZDiR5fzkAQHccLh4gnNc';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

// ─── HTTP 工具 ───────────────────────────────────────────────
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
        catch (e) { reject(new Error(`JSON parse error: ${d}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Block 工厂 ──────────────────────────────────────────────
function t(content: string, style?: any) { return { text_run: { content, text_element_style: style ?? {} } }; }
function b(content: string) { return t(content, { bold: true }); }
function p(...elements: any[]) { return { block_type: 2, text: { elements, style: {} } }; }
function h2(text: string) { return { block_type: 4, heading2: { elements: [t(text)], style: {} } }; }
function h3(text: string) { return { block_type: 5, heading3: { elements: [t(text)], style: {} } }; }
function li(...elements: any[]) { return { block_type: 12, bullet: { elements, style: {} } }; }
function hr() { return { block_type: 22, divider: {} }; }

// ─── 内容：知识库框架 ────────────────────────────────────────
const CONTENT_BLOCKS = [
  p(t('这是一个帮助在英华人/留学生了解英国商科就业市场的知识库，持续更新。')),
  p(t('覆盖四大、MBB、投行、科技大厂等主流方向，重点关注中国留学生视角。')),
  hr(),

  h2('📚 知识库分类'),

  h3('一、求职流程与策略'),
  li(t('英国校招流程全攻略（Milkround / Graduate Scheme）')),
  li(t('LinkedIn 在英国求职中的正确用法')),
  li(t('如何写英国 CV（与中国简历的核心区别）')),
  li(t('Cover Letter 写作指南 + 模板')),
  li(t('申请时间线：各行业 Deadline 汇总')),

  h3('二、目标公司情报'),
  li(b('四大会计师事务所'), t('Deloitte / KPMG / EY / PwC — 英国校招路径、Timeline、Salary')),
  li(b('MBB 咨询'), t('McKinsey / BCG / Bain 英国办公室 — 招聘要求、面试流程')),
  li(b('英国本土投行'), t('Barclays / HSBC / NatWest / Lloyds — 应届生项目')),
  li(b('科技大厂'), t('Amazon / Google / Meta 英国团队 — Business/Operations 岗位')),
  li(b('英国零售与快消'), t('M&S / Unilever / Diageo — Management Trainee 项目')),

  h3('三、面试 QA 题库'),
  li(t('Competency-Based Interview（CBI）高频题 + STAR 框架')),
  li(t('Case Study 解题框架（咨询 / 商业分析类）')),
  li(t('Group Exercise 技巧 + 常见坑')),
  li(t('Strengths-Based Interview（SBI）应对策略')),
  li(t('Online Tests：SJT / Numerical / Verbal 备考指南')),

  h3('四、薪资与市场数据'),
  li(t('英国各行业应届生薪资行情（2024-2025）')),
  li(t('伦敦 vs 曼彻斯特 vs 爱丁堡生活成本对比')),
  li(t('签约奖金（Signing Bonus）行情')),
  li(t('Graduate Scheme vs 直接入职对比')),

  h3('五、避坑指南（中国留学生专属）'),
  li(t('最常见的 10 个求职误区')),
  li(t('Graduate Visa / Skilled Worker Visa 注意事项')),
  li(t('英国职场文化差异：面试礼仪、沟通风格')),
  li(t('如何解释海外学历背景')),
  li(t('英文自我介绍 / Elevator Pitch 怎么写')),

  hr(),

  h2('📡 内容来源'),
  li(t('Reddit：r/UKJobs、r/GradJob、r/AskUK、r/FinancialCareers 精华帖')),
  li(t('LinkedIn：英国 HR / 猎头 / 应届毕业生分享')),
  li(t('Glassdoor / The Student Room：面试经验、薪资数据')),
  li(t('真实求职者采访与亲身经历整理')),

  hr(),

  h2('🛠️ 关联工具'),
  p(t('本知识库由「UK Jobs KB」系统驱动，支持：')),
  li(t('自动从 Reddit 采集帖子')),
  li(t('AI 提炼关键知识点和中国留学生视角')),
  li(t('批量生成小红书/LinkedIn 帖子')),
  p(t('运行地址：http://localhost:3101')),

  hr(),
  p(t('持续更新中 · 最后更新：2026年3月')),
];

// ─── 写 blocks ───────────────────────────────────────────────
async function writeBlocks(objToken: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: blocks.slice(i, i + 50), index: i }
    );
    if (r.code !== 0) {
      console.error(`  ❌ 写blocks失败 (${i}-${i + 50}): code=${r.code} msg=${r.msg}`);
    }
    if (i + 50 < blocks.length) await sleep(400);
  }
}

// ─── 主流程 ──────────────────────────────────────────────────
async function main() {
  console.log('🚀 开始写入「英国商科求职」知识库首页...\n');

  // 1. 获取节点信息（拿 obj_token）
  const SPACE_ID = '7615701011126029275';
  console.log('📍 获取页面 obj_token...');
  const nodeRes = await api('GET', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${TARGET_NODE_TOKEN}`);

  if (nodeRes.code !== 0) {
    console.error('❌ 获取节点失败:', nodeRes.code, nodeRes.msg);
    process.exit(1);
  }

  const objToken = nodeRes.data?.node?.obj_token;
  const spaceId = SPACE_ID;
  if (!objToken) {
    console.error('❌ 无法获取 obj_token，返回:', JSON.stringify(nodeRes.data, null, 2));
    process.exit(1);
  }

  console.log(`  ✓ obj_token: ${objToken}`);
  console.log(`  ✓ space_id: ${spaceId}`);

  // 2. 写入内容
  console.log('\n📝 写入内容...');
  await writeBlocks(objToken, CONTENT_BLOCKS);

  console.log('\n✅ 写入完成！');
  console.log(`🔗 页面链接: https://${DOMAIN}/wiki/${TARGET_NODE_TOKEN}`);
}

main().catch(console.error);
