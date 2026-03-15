/**
 * 批量发布 MC 文章到飞书 Wiki
 * - 按分类创建目录节点
 * - 每篇文章：中文摘要 + 英文原文 + 配图
 * - 图片：下载后上传飞书获取 file_token
 */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// ─── .env ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const APP_ID = process.env.FEISHU_APP_ID!;
const APP_SECRET = process.env.FEISHU_APP_SECRET!;
const TOKEN_FILE = path.resolve(__dirname, '..', '..', '..', 'startup-7steps', '.feishu-user-token.json');
const SPACE_ID = '7616033289844821185';
const ROOT_NODE = 'W1ohwQfKviDg3IkeV68c0N0bnyc';

let USER_TOKEN = '';

// ─── API helpers ─────────────────────────────────────────────────
function api(method: string, apiPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn', path: apiPath, method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': String(Buffer.byteLength(data)) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', (c: string) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Token refresh ───────────────────────────────────────────────
async function refreshToken() {
  const saved = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  const savedAt = new Date(saved.saved_at).getTime();
  const expiresAt = savedAt + (saved.expires_in - 300) * 1000;
  if (Date.now() < expiresAt) {
    console.log('✓ Token 有效');
    USER_TOKEN = saved.access_token;
    return;
  }
  console.log('⏳ 刷新 Token...');
  const appResp: any = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET });
    const req = https.request({
      hostname: 'open.feishu.cn', path: '/open-apis/auth/v3/app_access_token/internal', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)) },
      rejectUnauthorized: false,
    }, res => { let d = ''; res.on('data', (c: string) => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(body); req.end();
  });
  const appToken = appResp.app_access_token;
  if (!appToken) throw new Error(`app_access_token失败: ${JSON.stringify(appResp)}`);
  const refreshResp: any = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ grant_type: 'refresh_token', refresh_token: saved.refresh_token });
    const req = https.request({
      hostname: 'open.feishu.cn', path: '/open-apis/authen/v1/oidc/refresh_access_token', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appToken}`, 'Content-Length': String(Buffer.byteLength(body)) },
      rejectUnauthorized: false,
    }, res => { let d = ''; res.on('data', (c: string) => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(body); req.end();
  });
  if (refreshResp.code !== 0) throw new Error(`刷新失败: ${JSON.stringify(refreshResp)}\n请重新授权: cd ~/startup-7steps && NODE_TLS_REJECT_UNAUTHORIZED=0 node feishu-auth.js`);
  const result = { access_token: refreshResp.data.access_token, refresh_token: refreshResp.data.refresh_token, expires_in: refreshResp.data.expires_in, token_type: refreshResp.data.token_type, saved_at: new Date().toISOString() };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(result, null, 2));
  USER_TOKEN = result.access_token;
  console.log('✅ Token 刷新成功');
}

// ─── Image download & upload ─────────────────────────────────────
function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = (client as any).get(url, { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res: any) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadImage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function uploadImage(imgBuf: Buffer, fileName: string): Promise<string | null> {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file_name"\r\n\r\n${fileName}\r\n--${boundary}\r\nContent-Disposition: form-data; name="parent_type"\r\n\r\ndocx_image\r\n--${boundary}\r\nContent-Disposition: form-data; name="parent_node"\r\n\r\n\r\n--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${imgBuf.length}\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const payload = Buffer.concat([Buffer.from(header), imgBuf, Buffer.from(footer)]);

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/drive/v1/medias/upload_all',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(payload.length),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', (c: string) => d += c);
      res.on('end', () => {
        try {
          const r = JSON.parse(d);
          resolve(r.data?.file_token || null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

// ─── Markdown → Feishu blocks ────────────────────────────────────
function parseInline(text: string) {
  const elements: any[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[2]) elements.push({ text_run: { content: match[2], text_element_style: { bold: true } } });
    else if (match[3]) elements.push({ text_run: { content: match[3], text_element_style: { italic: true } } });
    else if (match[4]) elements.push({ text_run: { content: match[4] } });
  }
  if (!elements.length) elements.push({ text_run: { content: text } });
  return elements;
}

function mdToBlocks(markdown: string) {
  const blocks: any[] = [];
  for (const line of markdown.split('\n')) {
    if (!line.trim()) continue;
    const h1 = line.match(/^# (.+)$/);
    if (h1) { blocks.push({ block_type: 3, heading1: { elements: parseInline(h1[1]), style: {} } }); continue; }
    const h2 = line.match(/^## (.+)$/);
    if (h2) { blocks.push({ block_type: 4, heading2: { elements: parseInline(h2[1]), style: {} } }); continue; }
    const h3 = line.match(/^### (.+)$/);
    if (h3) { blocks.push({ block_type: 5, heading3: { elements: parseInline(h3[1]), style: {} } }); continue; }
    const h4 = line.match(/^#### (.+)$/);
    if (h4) { blocks.push({ block_type: 6, heading4: { elements: parseInline(h4[1]), style: {} } }); continue; }
    if (/^-{3,}$/.test(line.trim())) { blocks.push({ block_type: 22, divider: {} }); continue; }
    const bul = line.match(/^[-*] (.+)$/);
    if (bul) { blocks.push({ block_type: 12, bullet: { elements: parseInline(bul[1]), style: {} } }); continue; }
    const ord = line.match(/^\d+\. (.+)$/);
    if (ord) { blocks.push({ block_type: 13, ordered: { elements: parseInline(ord[1]), style: {} } }); continue; }
    blocks.push({ block_type: 2, text: { elements: parseInline(line), style: {} } });
  }
  return blocks;
}

// ─── Create wiki node ────────────────────────────────────────────
async function createNode(title: string, parentToken: string): Promise<{ nodeToken: string; objToken: string }> {
  const res = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', node_type: 'origin', parent_node_token: parentToken, title,
  });
  if (res.code !== 0) throw new Error(`创建节点失败 "${title}": ${res.code} ${res.msg}`);
  return { nodeToken: res.data.node.node_token, objToken: res.data.node.obj_token };
}

async function writeBlocks(objToken: string, blocks: any[]) {
  await sleep(400);
  const lr = await api('GET', `/open-apis/docx/v1/documents/${objToken}/blocks?page_size=5`);
  const rootId = lr.data?.items?.[0]?.block_id;
  if (!rootId) throw new Error('获取文档根block失败');
  for (let i = 0; i < blocks.length; i += 50) {
    const chunk = blocks.slice(i, i + 50);
    const wr = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${rootId}/children`, { children: chunk, index: i });
    if (wr.code !== 0) console.error(`  ⚠️ 写入失败 ${i}: ${wr.code} ${wr.msg}`);
    if (i + 50 < blocks.length) await sleep(300);
  }
}

// ─── Article definitions ─────────────────────────────────────────
interface Article {
  file: string;          // /tmp/mc_xxx.txt
  title_cn: string;      // 中文标题
  title_en: string;      // 英文标题
  source_url: string;    // 原始链接
  summary_cn: string;    // 中文摘要/导读
}

interface Category {
  title: string;
  articles: Article[];
}

const CATEGORIES: Category[] = [
  {
    title: '📋 Case Interview 入门与总论',
    articles: [
      {
        file: '/tmp/mc_case.txt',
        title_cn: 'Case Interview 完全准备指南',
        title_en: 'Case Interview Prep Guide',
        source_url: 'https://managementconsulted.com/case-interview/',
        summary_cn: '咨询案例面试全流程指南：什么是Case Interview、面试流程、框架使用哲学（框架是工具不是模板）、Case数学4步法、MBB三家真题示例、备考核心建议（30-50次verbal practice）。',
      },
      {
        file: '/tmp/mc_case-examples.txt',
        title_cn: 'Case Interview 真题示例集',
        title_en: 'Case Interview Examples',
        source_url: 'https://managementconsulted.com/case-interview-examples/',
        summary_cn: 'McKinsey/BCG/Bain/Deloitte各家Case Interview真题汇编，含完整题目描述、考察重点、解题思路示范。',
      },
      {
        file: '/tmp/mc_free-case-prep.txt',
        title_cn: '免费Case Interview备考资源',
        title_en: 'Free Case Interview Prep',
        source_url: 'https://managementconsulted.com/free-case-interview-prep/',
        summary_cn: '免费的Case面试准备资源汇总：官方练习题、免费mock平台、社区资源推荐。',
      },
      {
        file: '/tmp/mc_three-rounds.txt',
        title_cn: '咨询面试三轮结构详解',
        title_en: 'Structure of Three Case Interview Rounds',
        source_url: 'https://managementconsulted.com/structure-of-three-case-interview-rounds/',
        summary_cn: '咨询公司面试的三轮结构：每轮考什么、评分标准差异、如何针对性准备各轮。',
      },
    ],
  },
  {
    title: '🧩 Case 框架详解',
    articles: [
      {
        file: '/tmp/mc_case-interview-frameworks.txt',
        title_cn: 'Case Interview 框架完全指南',
        title_en: 'Case Interview Frameworks',
        source_url: 'https://managementconsulted.com/case-interview-frameworks/',
        summary_cn: '7大核心框架详解（盈利、市场研究、并购、4P、Porter五力等）+ 框架定制化方法 + MECE原则实战应用。核心理念：不要背框架套框架，要现场拆零件重新组装。',
      },
      {
        file: '/tmp/mc_profitability-framework.txt',
        title_cn: '盈利分析框架（Profitability Framework）',
        title_en: 'Profitability Framework',
        source_url: 'https://managementconsulted.com/profitability-framework/',
        summary_cn: '最常见的Case类型 — 盈利分析框架详解：收入=数量×单价、成本=固定+变动、利润树拆解、从定量到定性的分析转换方法。',
      },
      {
        file: '/tmp/mc_case-frameworks-market-study.txt',
        title_cn: '市场研究框架（Market Study Framework）',
        title_en: 'Market Study Framework',
        source_url: 'https://managementconsulted.com/case-interview-frameworks-market-study/',
        summary_cn: '市场研究类Case的分析框架：市场规模与增长、竞争格局、客户分群、进入壁垒、定价策略。',
      },
      {
        file: '/tmp/mc_case-frameworks-ma.txt',
        title_cn: '并购分析框架（M&A Framework）',
        title_en: 'Mergers & Acquisitions Framework',
        source_url: 'https://managementconsulted.com/case-interview-frameworks-mergers-acquisitions/',
        summary_cn: '并购类Case的完整分析框架：独立价值评估、协同效应分析（成本/收入）、整合风险、文化融合、法律因素。',
      },
      {
        file: '/tmp/mc_mece-framework.txt',
        title_cn: 'MECE原则详解',
        title_en: 'MECE Framework',
        source_url: 'https://managementconsulted.com/mece-framework/',
        summary_cn: 'MECE（相互独立、完全穷尽）原则的详细解读：什么是真正的MECE、常见违反MECE的错误、如何在Case面试中实践MECE思维。McKinsey尤其看重此能力。',
      },
    ],
  },
  {
    title: '🔢 Case 数学与 Market Sizing',
    articles: [
      {
        file: '/tmp/mc_case-math.txt',
        title_cn: 'Case Interview 数学技巧',
        title_en: 'Case Interview Math',
        source_url: 'https://managementconsulted.com/case-interview-math/',
        summary_cn: 'Case面试中的数学：心算技巧、4步计算法（回顾→结构→计算→洞察）、常见数学陷阱、McKinsey要求精确到个位数。',
      },
      {
        file: '/tmp/mc_market-sizing.txt',
        title_cn: 'Market Sizing 估算方法详解',
        title_en: 'Market Sizing',
        source_url: 'https://managementconsulted.com/market-sizing/',
        summary_cn: '市场规模估算的完整方法：自上而下法vs自下而上法、分段估算技巧、常见Market Sizing题型、如何展示结构化思维。',
      },
    ],
  },
  {
    title: '🏢 MBB 各家面试指南',
    articles: [
      {
        file: '/tmp/mc_mckinsey.txt',
        title_cn: 'McKinsey Case Interview 5大技巧',
        title_en: '5 Tips for McKinsey Case Interview',
        source_url: 'https://managementconsulted.com/5-tips-for-mckinsey-case-interview/',
        summary_cn: 'McKinsey面试的5个核心技巧：interviewer-led格式、极致结构化、精确计算（个位数）、answer-first表达（金字塔原理）、deeper insights追问。',
      },
      {
        file: '/tmp/mc_mckinsey-pei.txt',
        title_cn: 'McKinsey PEI（个人经历面试）详解',
        title_en: 'McKinsey PEI',
        source_url: 'https://managementconsulted.com/mckinsey-pei/',
        summary_cn: 'McKinsey PEI完全攻略：4大核心主题（领导力/影响力/团队合作/克服困难）、故事选择策略、STAR隐形化表达、追问应对、常见陷阱。PEI至少占10分钟，是独立评估维度。',
      },
      {
        file: '/tmp/mc_mckinsey-solve.txt',
        title_cn: 'McKinsey Solve 游戏化评估',
        title_en: 'McKinsey Solve',
        source_url: 'https://managementconsulted.com/mckinsey-solve/',
        summary_cn: 'McKinsey Solve（原PST）游戏化评估工具介绍：测试内容、准备建议。',
      },
      {
        file: '/tmp/mc_bcg-case-interview.txt',
        title_cn: 'BCG Case Interview 完全指南',
        title_en: 'BCG Case Interview',
        source_url: 'https://managementconsulted.com/bcg-case-interview/',
        summary_cn: 'BCG面试完全攻略：candidate-led格式（与McKinsey interviewer-led的本质区别）、对话式风格、创造力优先、鼓励定制框架、非典型case应对。',
      },
      {
        file: '/tmp/mc_bain-case-interview.txt',
        title_cn: 'Bain Case Interview 完全指南',
        title_en: 'Bain Case Interview',
        source_url: 'https://managementconsulted.com/bain-case-interview/',
        summary_cn: 'Bain面试完全攻略：实用主义导向、关系驱动型面试文化、面试中后段可能转为自由对话、"Bainies never let other Bainies fail"的团队文化。',
      },
      {
        file: '/tmp/mc_deloitte-case.txt',
        title_cn: 'Deloitte Case Interview 完全指南',
        title_en: 'Deloitte Case Interview',
        source_url: 'https://managementconsulted.com/deloitte-case-interview/',
        summary_cn: 'Deloitte面试完全攻略：group case环节、written case环节、面试流程差异（与MBB相比）、Deloitte特有的评估维度。',
      },
    ],
  },
  {
    title: '🤝 Fit / Behavioral 面试',
    articles: [
      {
        file: '/tmp/mc_fit-interview.txt',
        title_cn: 'Fit Interview（适配性面试）指南',
        title_en: 'Fit Interview',
        source_url: 'https://managementconsulted.com/fit-interview/',
        summary_cn: 'Fit面试的本质、常见问题类型、回答策略、如何展示咨询素质（分析能力/沟通能力/领导力/团队协作）。',
      },
      {
        file: '/tmp/mc_star.txt',
        title_cn: 'STAR方法在咨询面试中的正确用法',
        title_en: 'STAR Method: Should it be Used in Fit Interviews?',
        source_url: 'https://managementconsulted.com/star-method/',
        summary_cn: 'STAR方法的正确理解：它是隐形结构不是填空模板。Situation选择策略（选能展示咨询能力的而非最牛的）、Action环节的核心（展示不确定环境下的决策过程）、好STAR vs 坏STAR对比、三类behavioral问题分型。',
      },
      {
        file: '/tmp/mc_culture-fit.txt',
        title_cn: 'Culture Fit 面试问题详解',
        title_en: 'Culture Fit Interview Questions',
        source_url: 'https://managementconsulted.com/culture-fit-interview-questions/',
        summary_cn: '文化适配面试的常见问题和回答策略：公司文化研究方法、价值观匹配表达、"Why this firm"类问题的深层逻辑。',
      },
    ],
  },
  {
    title: '💡 思维方法论',
    articles: [
      {
        file: '/tmp/mc_pyramid-principle.txt',
        title_cn: '金字塔原理（Pyramid Principle）',
        title_en: 'Pyramid Principle',
        source_url: 'https://managementconsulted.com/pyramid-principle/',
        summary_cn: 'Barbara Minto金字塔原理在咨询面试中的实战应用：answer-first表达、MECE结构、逻辑论证层次、从结论到支撑论据的表达训练。McKinsey面试的核心能力。',
      },
    ],
  },
  {
    title: '📄 申请材料',
    articles: [
      {
        file: '/tmp/mc_consulting-resume.txt',
        title_cn: '咨询简历撰写指南',
        title_en: 'Consulting Resume',
        source_url: 'https://managementconsulted.com/consulting-resume/',
        summary_cn: '咨询行业简历的写法：action verb使用、量化成果表达、一页纸原则、教育/经历/技能的排版策略、MBB筛选标准。',
      },
      {
        file: '/tmp/mc_cover-letter.txt',
        title_cn: '咨询Cover Letter撰写指南',
        title_en: 'Consulting Cover Letter',
        source_url: 'https://managementconsulted.com/consulting-cover-letter/',
        summary_cn: '咨询行业Cover Letter的写法：3段式结构、Why Consulting + Why This Firm + Why Me的逻辑链、个性化定制策略、常见错误。',
      },
    ],
  },
  {
    title: '📊 行业信息',
    articles: [
      {
        file: '/tmp/mc_consulting-salary.txt',
        title_cn: '咨询行业薪资指南（2026）',
        title_en: 'Consultant Salary',
        source_url: 'https://managementconsulted.com/consultant-salary/',
        summary_cn: 'MBB及各大咨询公司薪资数据：不同级别（Analyst→Partner）薪资范围、奖金结构、MBA起薪对比、各家薪资差异。',
      },
      {
        file: '/tmp/mc_top-consulting-firms.txt',
        title_cn: '全球顶尖咨询公司排名',
        title_en: 'Top Consulting Firms',
        source_url: 'https://managementconsulted.com/top-consulting-firms/',
        summary_cn: '全球咨询公司完整排名：MBB → Tier 2（Oliver Wyman, LEK, ATK等）→ Big 4 → Boutique，按行业/地区/专业分类，含各家特色和文化差异。',
      },
      {
        file: '/tmp/mc_why-consulting.txt',
        title_cn: 'Why Consulting? 完全回答指南',
        title_en: 'Why Consulting?',
        source_url: 'https://managementconsulted.com/why-consulting/',
        summary_cn: '"为什么选择咨询"这个必考题的完整回答框架：真实动机挖掘、通用理由vs个性化理由、MBB各家的文化差异如何体现在回答中、面试官真正想听到什么。',
      },
    ],
  },
];

// ─── Main ────────────────────────────────────────────────────────
async function publishArticle(article: Article, parentToken: string) {
  const raw = fs.readFileSync(article.file, 'utf-8');

  // Build page content: 中文摘要 + 原始链接 + 英文原文
  const md = [
    `## 📌 导读`,
    article.summary_cn,
    ``,
    `**原文链接：** ${article.source_url}`,
    `**来源：** Management Consulted`,
    ``,
    `---`,
    ``,
    `## 📖 英文原文 / Original Content`,
    ``,
    raw,
  ].join('\n');

  const blocks = mdToBlocks(md);
  if (blocks.length === 0) {
    console.log(`  ⚠️ ${article.title_cn}: 无内容，跳过`);
    return null;
  }

  // 限制blocks数量避免超长（飞书单文档有限制）
  const maxBlocks = 500;
  const trimmedBlocks = blocks.slice(0, maxBlocks);
  if (blocks.length > maxBlocks) {
    console.log(`  ⚠️ ${article.title_cn}: ${blocks.length} blocks → 截取前 ${maxBlocks}`);
  }

  const title = `${article.title_cn}｜${article.title_en}`;
  const { nodeToken, objToken } = await createNode(title, parentToken);
  console.log(`  ✓ 节点: ${nodeToken}`);

  await writeBlocks(objToken, trimmedBlocks);

  // Upload images if available
  const imgFile = article.file.replace('.txt', '_imgs.txt');
  if (fs.existsSync(imgFile)) {
    const imgLines = fs.readFileSync(imgFile, 'utf-8').split('\n').filter(l => l.trim());
    const contentImgs = imgLines.filter(l => {
      const url = l.split('\t')[1] || l.split('\t')[0];
      // Filter out tiny icons, logos, gravatar
      return url && !url.includes('gravatar') && !url.includes('favicon') && !url.includes('logo')
        && !url.includes('1x1') && !url.includes('pixel');
    }).slice(0, 8); // max 8 images per article

    if (contentImgs.length > 0) {
      console.log(`  📷 上传 ${contentImgs.length} 张图片...`);
      await sleep(300);
      const docBlocks = await api('GET', `/open-apis/docx/v1/documents/${objToken}/blocks?page_size=5`);
      const rootId2 = docBlocks.data?.items?.[0]?.block_id;

      for (const imgLine of contentImgs) {
        const parts = imgLine.split('\t').filter(p => p.trim());
        // Find the URL part (starts with http)
        const imgUrl = parts.find(p => p.startsWith('http')) || '';
        const alt = parts.find(p => !p.startsWith('http')) || '';
        if (!imgUrl || !imgUrl.startsWith('http')) { console.log(`    ✗ 跳过无效URL`); continue; }
        try {
          const buf = await downloadImage(imgUrl);
          if (buf.length < 1000) continue; // skip tiny images
          const ext = imgUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'png';
          const fileName = `mc_img_${Date.now()}.${ext}`;
          const fileToken = await uploadImage(buf, fileName);
          if (fileToken && rootId2) {
            await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${rootId2}/children`, {
              children: [{ block_type: 27, image: { token: fileToken, width: 600, height: 400 } }],
              index: trimmedBlocks.length,
            });
            console.log(`    ✓ ${alt || fileName}`);
          }
          await sleep(300);
        } catch (e: any) {
          console.log(`    ✗ 图片失败: ${e.message}`);
        }
      }
    }
  }

  return nodeToken;
}

async function main() {
  await refreshToken();

  // Process only the category specified by CLI arg, or all
  const targetIdx = process.argv[2] ? parseInt(process.argv[2]) : -1;

  const categoriesToProcess = targetIdx >= 0 ? [CATEGORIES[targetIdx]] : CATEGORIES;
  const startIdx = targetIdx >= 0 ? targetIdx : 0;

  for (let ci = 0; ci < categoriesToProcess.length; ci++) {
    const cat = categoriesToProcess[ci];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📂 ${cat.title} (${cat.articles.length} 篇)`);
    console.log(`${'='.repeat(60)}`);

    // Create category folder node
    const { nodeToken: catNode } = await createNode(cat.title, ROOT_NODE);
    console.log(`✓ 分类节点: ${catNode}`);
    await sleep(500);

    for (let ai = 0; ai < cat.articles.length; ai++) {
      const article = cat.articles[ai];
      console.log(`\n  [${ai + 1}/${cat.articles.length}] ${article.title_cn}`);
      try {
        await publishArticle(article, catNode);
        console.log(`  ✅ 完成`);
      } catch (e: any) {
        console.error(`  ❌ 失败: ${e.message}`);
      }
      await sleep(600);
    }
  }

  console.log(`\n${'🎉'.repeat(20)}`);
  console.log(`全部发布完成！`);
  console.log(`📖 https://hcn2vc1r2jus.feishu.cn/wiki/${ROOT_NODE}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
