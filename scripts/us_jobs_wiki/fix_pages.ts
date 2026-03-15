/**
 * 修复写入失败的两个页面（quote block_type 错误）
 * 行业与公司情报 → RRf7wB5yoi0wQ1kEklfc7Ncunhg  (obj_token: 从 wiki API 获取)
 * 中国人专属避坑  → QSjcw2Nw8i8zaTkCNlxcfL3enpc
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const SPACE_ID = '7615700879567506381';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn', path: urlPath, method,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}`, 'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      rejectUnauthorized: false,
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } });
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
function hr() { return { block_type: 22, divider: {} }; }
function quote(...elements: any[]) { return { block_type: 15, quote: { elements, style: {} } }; }  // 修正：15

async function writeBlocks(objToken: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: blocks.slice(i, i + 50), index: i }
    );
    if (r.code !== 0) console.error(`  ❌ blocks失败 (${i}): ${r.code} ${r.msg}`);
    if (i + 50 < blocks.length) await sleep(400);
  }
}

// 行业与公司 - 补充后半段（块50+，包含 quote 的部分）
const INDUSTRY_TAIL = [
  quote(b('选择建议：'), t('最大化薪资 → IBD → PE；职业背书+多元出路 → MBB；工作生活平衡+高总包 → 科技大厂。不要只看 Base，算清楚 Total Compensation（含 Bonus + RSU + Signing）。')),
];

// 中国人专属避坑 - 完整重写（原来chunk 0就失败）
const PITFALLS_BLOCKS = [
  p(t('整理自 Reddit / Blind / 真实求职者访谈。这些坑中国留学生踩得最多。')),
  hr(),

  h2('求职流程里的坑'),

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

  h2('面试里的坑'),

  h3('坑5：Behavioral 说"我们"'),
  p(t('中国文化强调集体，但美国面试官只想听你个人做了什么。每次说"我们做了..."，在面试官眼里就是减分。')),
  quote(b('解决：'), t('把故事里的"我们"换成"我"，明确说出你个人的贡献和决策。')),

  h3('坑6：结果不量化'),
  p(t('"我提升了团队效率" → "通过优化流程，将处理时间减少了40%，节省了200小时/季度"')),
  p(t('没有数字 = 没有印象。就算不确定，估算一个量级也比没有强。')),

  h3('坑7：英语口音焦虑导致表达不清'),
  p(t('口音不是核心问题，表达是否清晰才是。中国学生常见：说话太快（紧张）、表达过于简短、不敢表达个人观点。')),
  quote(b('解决：'), t('放慢语速，每个 STAR 故事练习到能自然讲出，不需要背诵但要熟练。')),

  h3('坑8：Why [Company] 没有真实性'),
  p(t('面试官听过太多"因为贵公司很有名/我很崇拜..."。你需要具体说出你研究过的内容：某个项目/某位合伙人/公司某个战略方向。')),

  hr(),

  h2('美国职场文化差异'),

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

  h2('高频面试题标准答案框架'),
  li(b('"Tell me about yourself"：'), t('现在（当前背景）→ 过去（关键经历）→ 未来（为什么是这个岗位）。控制在 2 分钟内')),
  li(b('"Why [Company]?"：'), t('1. 公司具体吸引我的地方 2. 和我的技能/经历的契合 3. 长期职业目标')),
  li(b('"What\'s your weakness?"：'), t('真实的弱点 + 你已经在怎么改进，不要说假弱点')),
  li(b('"Do you have any questions for me?"：'), t('必须有！问面试官的个人经历/公司文化/最有挑战的项目')),
];

async function main() {
  // 获取两个失败页面的 obj_token
  const nodes = [
    { nodeToken: 'RRf7wB5yoi0wQ1kEklfc7Ncunhg', name: '行业与公司情报', tail: true },
    { nodeToken: 'QSjcw2Nw8i8zaTkCNlxcfL3enpc', name: '中国人专属避坑', tail: false },
  ];

  for (const node of nodes) {
    console.log(`\n📄 修复：${node.name}`);
    const r = await api('GET', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${node.nodeToken}`);
    if (r.code !== 0) { console.error('  ❌ 获取节点失败:', r.msg); continue; }
    const objToken = r.data?.node?.obj_token;
    console.log(`  obj_token: ${objToken}`);

    if (node.tail) {
      // 行业页：已有前50块，追加 quote 结尾
      await writeBlocks(objToken, INDUSTRY_TAIL);
    } else {
      // 避坑页：全量写入
      await writeBlocks(objToken, PITFALLS_BLOCKS);
    }
    console.log(`  ✅ https://${DOMAIN}/wiki/${node.nodeToken}`);
    await sleep(500);
  }

  console.log('\n✨ 修复完成！');
}

main().catch(console.error);
