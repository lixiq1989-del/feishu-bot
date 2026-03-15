/**
 * 发布德语咨询面试内容到飞书 Wiki
 *
 * 目标节点：https://hcn2vc1r2jus.feishu.cn/wiki/Jg6xwfGsviWXpzknnWfcy9kInBh
 *
 * 用法：
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/publish_german_wiki.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

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

// 目标知识库 — 从 URL 提取的 node_token
const PARENT_NODE = 'Jg6xwfGsviWXpzknnWfcy9kInBh';
let SPACE_ID = ''; // 将通过 API 查询获取
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

// ─── 查询 space_id ────────────────────────────────────────────────
async function findSpaceId() {
  // 通过 node_token 查询节点信息获取 space_id
  const res = await api('GET', `/open-apis/wiki/v2/spaces/get_node?token=${PARENT_NODE}`);
  if (res.code === 0 && res.data?.node?.space_id) {
    SPACE_ID = res.data.node.space_id;
    console.log(`✓ Space ID: ${SPACE_ID}`);
    return;
  }
  // fallback: 遍历 spaces
  const spacesRes = await api('GET', '/open-apis/wiki/v2/spaces?page_size=20');
  if (spacesRes.code === 0) {
    for (const s of spacesRes.data?.items || []) {
      console.log(`  发现知识库: ${s.name} (${s.space_id})`);
    }
  }
  throw new Error(`无法找到 space_id，节点查询返回: ${JSON.stringify(res)}`);
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
  const lines = markdown.split('\n');
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];

    // 表格处理
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        continue;
      }
      // 跳过分隔行 |---|---|
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // 表格结束，输出为格式化文本
      // 飞书表格需要两步创建，这里用格式化文本替代
      blocks.push({ block_type: 2, text: { elements: parseInline(`**${tableHeaders.join(' │ ')}**`), style: {} } });
      for (const row of tableRows) {
        blocks.push({ block_type: 2, text: { elements: parseInline(row.join(' │ ')), style: {} } });
      }
      inTable = false;
      tableRows = [];
      tableHeaders = [];
    }

    if (!line.trim()) continue;

    // 标题
    const h1 = line.match(/^# (.+)$/);
    if (h1) { blocks.push({ block_type: 3, heading1: { elements: parseInline(h1[1]), style: {} } }); continue; }
    const h2 = line.match(/^## (.+)$/);
    if (h2) { blocks.push({ block_type: 4, heading2: { elements: parseInline(h2[1]), style: {} } }); continue; }
    const h3 = line.match(/^### (.+)$/);
    if (h3) { blocks.push({ block_type: 5, heading3: { elements: parseInline(h3[1]), style: {} } }); continue; }
    const h4 = line.match(/^#### (.+)$/);
    if (h4) { blocks.push({ block_type: 6, heading4: { elements: parseInline(h4[1]), style: {} } }); continue; }

    // 分隔线
    if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
      blocks.push({ block_type: 22, divider: {} });
      continue;
    }

    // 引用
    const quo = line.match(/^> (.+)$/);
    if (quo) {
      blocks.push({ block_type: 2, text: { elements: [
        { text_run: { content: '❝ ', text_element_style: { bold: true } } },
        ...parseInline(quo[1]),
        { text_run: { content: ' ❞', text_element_style: { bold: true } } },
      ], style: {} } });
      continue;
    }

    // 无序列表
    const bul = line.match(/^[-*] (.+)$/);
    if (bul) { blocks.push({ block_type: 12, bullet: { elements: parseInline(bul[1]), style: {} } }); continue; }

    // 有序列表
    const ord = line.match(/^\d+\. (.+)$/);
    if (ord) { blocks.push({ block_type: 13, ordered: { elements: parseInline(ord[1]), style: {} } }); continue; }

    // 普通段落
    blocks.push({ block_type: 2, text: { elements: parseInline(line), style: {} } });
  }

  // 处理末尾的表格
  if (inTable && tableHeaders.length) {
    blocks.push({ block_type: 2, text: { elements: parseInline(`**${tableHeaders.join(' │ ')}**`), style: {} } });
    for (const row of tableRows) {
      blocks.push({ block_type: 2, text: { elements: parseInline(row.join(' │ ')), style: {} } });
    }
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

// ─── 文章定义 ────────────────────────────────────────────────────
interface Article {
  file: string;
  title: string;
  folder: string;      // 网站目录
  subfolder?: string;  // 公司栏目（可选）
}

const ARTICLES: Article[] = [
  // ── WiWi-TReFF 论坛 ──
  {
    file: '/tmp/de_final_1.md',
    title: '我参加了McKinsey、BCG、Bain三家的选拔日，这是我的完整经历',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'MBB综合',
  },
  {
    file: '/tmp/de_final_2.md',
    title: 'McKinsey选拔日有多残酷？10个人，9个第一轮就被淘汰了',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'McKinsey',
  },
  {
    file: '/tmp/de_final_3.md',
    title: 'BCG面试的那些事——十年论坛帖的真实声音',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'BCG',
  },
  {
    file: '/tmp/de_final_4.md',
    title: 'Bain面试经验分享——从流程到Case到Partner面试',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'Bain',
  },
  {
    file: '/tmp/de_final_5.md',
    title: '一年半面试了10家咨询公司，只拿到1个offer',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'MBB综合',
  },
  // ── Karrierebibel.de ──
  {
    file: '/tmp/de_final_6.md',
    title: 'Assessment Center自我展示怎么做？',
    folder: 'Karrierebibel.de',
  },
  // ── WiWi-TReFF 第二批 ──
  {
    file: '/tmp/wiwi_final_7.md',
    title: 'Case Interview怎么准备？——Simon-Kucher顾问的四步法',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'Case Interview',
  },
  {
    file: '/tmp/wiwi_final_8.md',
    title: '大型咨询公司的最终面试到底考什么？',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'MBB综合',
  },
  {
    file: '/tmp/wiwi_final_9.md',
    title: '没有咨询经验，怎么准备战略咨询面试？',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'Case Interview',
  },
  {
    file: '/tmp/wiwi_final_10.md',
    title: 'Deloitte选拔日是什么体验？——十五年的真实记录',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'Deloitte',
  },
  {
    file: '/tmp/wiwi_final_11.md',
    title: 'Accenture Assessment Center全记录',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'Accenture',
  },
  {
    file: '/tmp/wiwi_final_12.md',
    title: 'MBB里有没有"不靠谱"的人？',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'MBB综合',
  },
  {
    file: '/tmp/wiwi_final_13.md',
    title: 'KPMG能跟MBB比吗？——一场激烈争论',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'MBB综合',
  },
  {
    file: '/tmp/wiwi_final_14.md',
    title: 'BCG的职级体系和BCG Vantage是什么？',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'BCG',
  },
  {
    file: '/tmp/wiwi_final_15.md',
    title: '从Big 4跳到T2甚至T1咨询公司，现实吗？',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'MBB综合',
  },
  {
    file: '/tmp/wiwi_final_16.md',
    title: 'BCG X的工作时间到底有多长？',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'BCG',
  },
  {
    file: '/tmp/wiwi_final_17.md',
    title: 'Roland Berger还是Stern Stewart？——入职选择纠结',
    folder: 'WiWi-TReFF 论坛',
    subfolder: 'Roland Berger',
  },
  // ── Karrierebibel.de 第二批 ──
  {
    file: '/tmp/karriere_final_2.md',
    title: 'Assessment Center完全指南——8种题型+破解技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_3.md',
    title: '面试全攻略——5个阶段+心理战术+高频问题',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_4.md',
    title: '面试中的压力问题——6种类型+应对公式',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_5.md',
    title: '小组讨论怎么带？——6阶段+8技巧+4种人格',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_6.md',
    title: '自我展示完全手册——结构、范文、5大错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_7.md',
    title: 'Elevator Pitch——60秒打动对方的10个技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_8.md',
    title: '薪资谈判完全指南——策略、话术、时机、错误',
    folder: 'Karrierebibel.de',
  },
  // ── Squeaker.net ──
  {
    file: '/tmp/squeaker_final_1.md',
    title: 'Consulting Cases怎么解？——框架与结构指南',
    folder: 'Squeaker.net',
  },
  {
    file: '/tmp/squeaker_final_2.md',
    title: '咨询公司面试全攻略——Personal Fit到Case到压力测试',
    folder: 'Squeaker.net',
  },
  // ── PrepLounge ──
  {
    file: '/tmp/preplounge_final_1.md',
    title: 'Case Interview终极指南——PrepLounge系统备考法',
    folder: 'PrepLounge',
  },
  // ── consulting-life.de ──
  {
    file: '/tmp/consulting_life_final_1.md',
    title: '德国顾问薪资完全解密——三大支柱+五大影响因素',
    folder: 'consulting-life.de',
  },
  {
    file: '/tmp/consulting_life_final_2.md',
    title: '7个不做顾问的理由——来自行业内部的诚实剖析',
    folder: 'consulting-life.de',
  },
  // ── consulting.de ──
  {
    file: '/tmp/consulting_de_final_1.md',
    title: '咨询行业为何持续吸引商科毕业生？——数据与现实',
    folder: 'consulting.de',
  },
  // ── e-fellows.net ──
  {
    file: '/tmp/efellows_final_1.md',
    title: '德国顶尖学生求职全攻略——简历到AC到时间线',
    folder: 'e-fellows.net',
  },
  // ── Karrierebibel.de 第三批 ──
  {
    file: '/tmp/karriere_final_9.md',
    title: '100个面试高频问题+答案——完整分类版',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_10.md',
    title: 'STAR方法：行为面试的结构化答题法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_11.md',
    title: '面试陷阱问题完全指南——30种类型+破解公式',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_12.md',
    title: 'Assessment Center全流程解析——8种题型+准备策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_13.md',
    title: '薪资谈判进阶版——德国职场策略与话术',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_14.md',
    title: '面试准备7阶段完全指南——Jochen Mai方法论',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_15.md',
    title: '薪资期望怎么说——求职信和面试中的策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_16.md',
    title: '"我们为什么要录用你？"——完美回答框架',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_17.md',
    title: '电话面试完全指南——15分钟内打动HR',
    folder: 'Karrierebibel.de',
  },
  // ── consulting-life.de 第二批 ──
  {
    file: '/tmp/consulting_life_final_3.md',
    title: '咨询业21个缺点——The Dark Side of Consulting',
    folder: 'consulting-life.de',
  },
  {
    file: '/tmp/consulting_life_final_4.md',
    title: '咨询行业薪资谈判——背后的财务逻辑与策略',
    folder: 'consulting-life.de',
  },
  // ── Karrierebibel.de 第四批 ──
  {
    file: '/tmp/karriere_final_18.md',
    title: '换工作完全指南——时机、步骤、常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_19.md',
    title: 'LinkedIn优化完全指南——11步打造专业形象',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_20.md',
    title: '求职信完全指南——格式、内容、89%面试决策关键',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_21.md',
    title: '主动求职——打入隐性就业市场',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_22.md',
    title: '职业社交网络（Networking）完全指南——20个技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_23.md',
    title: '2026年简历制作完全指南——格式、结构、ATS优化',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_24.md',
    title: '晋升申请指南——可见性比表现更重要',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_25.md',
    title: '小组面试完全指南——不是说得最多的人赢',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_26.md',
    title: '工作证明（Arbeitszeugnis）完全解码指南',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_27.md',
    title: '软技能完全指南——十大核心能力+面试展示方法',
    folder: 'Karrierebibel.de',
  },
  // ── Karrierebibel.de 第五批 ──
  {
    file: '/tmp/karriere_final_28.md',
    title: '试用期（Probezeit）完全指南——法律权利+成功策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_29.md',
    title: '主动辞职（Eigenkündigung）完全指南——法律流程+模板+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_30.md',
    title: '领导力风格（Führungsstile）完全指南——8种类型+如何选择',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_31.md',
    title: '职业倦怠（Burnout）完全指南——12个阶段+识别+预防+恢复',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_32.md',
    title: '冲突管理（Konfliktmanagement）完全指南——8种类型+5步解决框架',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_33.md',
    title: '反馈技巧完全指南——10条黄金法则+4种方法+SARA模型',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_34.md',
    title: '职场新人入职指南（Onboarding）——三阶段+成功清单+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_35.md',
    title: '工作-生活平衡（Work-Life-Balance）完全指南——四支柱模型+实践策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_36.md',
    title: '面试中的优势展示——"你的优势是什么？"完美回答指南',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_37.md',
    title: '时间管理完全指南——17种方法+关键技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_38.md',
    title: '动机信（Motivationsschreiben）完全指南——与求职信的区别+结构+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_39.md',
    title: '授权委托（Delegation）完全指南——5级模型+8大法则+常见障碍',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_40.md',
    title: '推荐信（Empfehlungsschreiben）完全指南——如何要求+结构+正反示例',
    folder: 'Karrierebibel.de',
  },
  // ── Karrierebibel.de 第六批 ──
  {
    file: '/tmp/karriere_final_41.md',
    title: '简短职业档案（Kurzprofil）——求职中的竞争利器',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_42.md',
    title: '德国求职材料完全指南（Bewerbungsunterlagen）——顺序+格式+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_43.md',
    title: '职场自我营销（Selbstmarketing）完全指南——可见度策略+平衡技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_44.md',
    title: '远程办公（Homeoffice）完全指南——法律权利+生产力技巧+税务',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_45.md',
    title: '求职被"鬼了"怎么办？——应对Ghosting的完整策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_46.md',
    title: '个人魅力（Charisma）培养指南——4种类型+15个发展策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_47.md',
    title: '心理韧性（Resilienz）培养指南——7大支柱+8个训练策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_48.md',
    title: '内向者职场完全指南——优势发挥+常见误解+成功策略',
    folder: 'Karrierebibel.de',
  },
  // ── Karrierebibel.de 第七批 ──
  {
    file: '/tmp/karriere_final_49.md',
    title: '创意思维技术（Kreativitätstechniken）完全指南——20种方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_50.md',
    title: '跨行业转职（Quereinsteiger）完全指南——策略+申请方法+高需求领域',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_51.md',
    title: '职场肢体语言（Körpersprache）完全指南——7个沟通维度+高地位信号',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_52.md',
    title: '面试全流程7阶段实战指南——从准备到跟进',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_53.md',
    title: '高效学习方法（Lernmethoden）完全指南——12种科学验证技术',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_54.md',
    title: '谈判技巧（Verhandlung）完全指南——哈佛谈判法+心理策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_55.md',
    title: '情商（Emotionale Intelligenz）完全指南——4大能力+EQ自测+提升策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_56.md',
    title: '决策能力（Entscheidungsfindung）完全指南——5阶段框架+决策矩阵+常见陷阱',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_57.md',
    title: '职场人脉建设（Netzwerken）完全指南——4大法则+平台策略+常见误区',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_58.md',
    title: '评鉴中心（Assessment Center）完全指南——8种测试+全流程+备考策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_59.md',
    title: '加薪谈判（Gehaltserhöhung）完全指南——最强论据+时机+谈判话术',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_60.md',
    title: '电梯演讲（Elevator Pitch）完全指南——60秒打动人心的10个技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_61.md',
    title: '职场优势（Stärken）完全指南——100个优势+7种自我发现方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_62.md',
    title: '工作证明（Arbeitszeugnis）完全指南——解读密码+申请模板+评级系统',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_63.md',
    title: '职业进修（Weiterbildung）完全指南——4种类型+资助+德国最大机构',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_64.md',
    title: '压力管理（Stressmanagement）完全指南——3层防御体系+5种即时减压技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_65.md',
    title: '团队合作（Teamarbeit）完全指南——5大成功要素+10条黄金法则',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_66.md',
    title: '沟通技巧（Kommunikation）完全指南——7种模型+6大改进法则',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_67.md',
    title: '职场自信心（Selbstbewusstsein）提升完全指南——16种方法+19题自测',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_68.md',
    title: '职业动力（Motivation）完全指南——内外驱力+7种激活策略+5种心理技术',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_69.md',
    title: '项目管理（Projektmanagement）完全指南——5阶段+5种方法论+6个实践技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_70.md',
    title: '薪资谈判（Gehaltsverhandlung）完全指南——2-3-1策略+精确报价+反驳技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_71.md',
    title: '问题解决（Problemlösung）完全指南——5步框架+6种工具方法+心理障碍突破',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_72.md',
    title: '职业网络（Netzwerken）完全指南——4大原则+20条技巧+70-20-10法则',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_73.md',
    title: '情商（Emotionale Intelligenz）完全指南——4大能力域+12项核心胜任力+EQ测评',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_74.md',
    title: '决策方法（Entscheidung）完全指南——7种方法+12个心理洞察+双系统思维',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_75.md',
    title: '个人成长（Persönlichkeitsentwicklung）完全指南——三支柱模型+成熟人格标志',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_76.md',
    title: '领导力特质（Führungsqualitäten）完全指南——13种核心能力+简历呈现方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_77.md',
    title: '目标设定（Ziele setzen）完全指南——SMART+WOOP+书面目标76%成功率',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_78.md',
    title: '职场高效能（Produktivität）完全指南——30种策略+效率vs高效+OECD研究',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_79.md',
    title: '德语求职信（Bewerbungsschreiben）完全指南——结构模板+7大避坑+AI使用指南',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_80.md',
    title: '德语面试完全指南（Vorstellungsgespräch）——5阶段流程+心理战术+禁忌问题',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_81.md',
    title: '德国薪资指南（Gehalt）完全指南——7个收入层级+行业对比+50-30-20理财法则',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_82.md',
    title: '德语简历（Lebenslauf）完全指南——ATS兼容格式+2026年趋势+PAR方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_83.md',
    title: '薪资期望（Gehaltsvorstellung）完全指南——精确报价策略+7条规则+面试回答模板',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_84.md',
    title: '德国劳动合同终止（Kündigung）完全指南——法律要求+通知期+终止类型',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_85.md',
    title: '敏捷工作（Agiles Arbeiten）完全指南——5种方法+Scrum框架+实施建议',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_86.md',
    title: '自我管理（Selbstmanagement）完全指南——18种方法+心理学原理+实施框架',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_87.md',
    title: '批评能力（Kritikfähigkeit）完全指南——SARA模型+10条黄金法则+WWW反馈框架',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_88.md',
    title: '创意思维技巧（Kreativitätstechniken）完全指南——20种方法+3大类型',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_89.md',
    title: '完美主义（Perfektionismus）完全指南——2种类型+风险+9个克服方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_90.md',
    title: '拖延症（Prokrastination）完全指南——16个克服方法+心理原因+9种类型',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_91.md',
    title: '管理培训生（Trainee）完整指南——薪资+职责+申请策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_92.md',
    title: '管理咨询顾问（Unternehmensberater）职业指南——薪资+职责+申请建议',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_93.md',
    title: '财务控制员（Controller）职业指南——薪资+职责+申请策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_94.md',
    title: '产品经理（Produktmanager）职业指南——薪资+职责+申请策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_95.md',
    title: '投资银行家（Investmentbanker）职业指南——薪资+职责+申请策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_96.md',
    title: '关键客户经理（Key Account Manager）职业指南——薪资+职责+申请策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_97.md',
    title: '税务顾问（Steuerberater）职业指南——薪资+职责+申请策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_98.md',
    title: '项目经理（Projektleiter）职业指南——薪资+职责+PMP等认证路径',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_99.md',
    title: '德国公共服务（Öffentlicher Dienst）职业指南——职等制度+薪资+晋升路径',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_100.md',
    title: '数字化（Digitalisierung）完全指南——定义+4种类型+职场影响',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_101.md',
    title: '主动辞职还是被解雇（Kündigen vs. Gekündigt）——完整策略指南',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_102.md',
    title: '求职面试（Vorstellungsgespräch）完全指南——5阶段+心理技巧+反问策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_103.md',
    title: '求职文件（Bewerbungsunterlagen）完全指南——顺序+清单+各场景模板',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_104.md',
    title: '薪资谈判（Gehaltsverhandlung）完全指南——策略+论据+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_105.md',
    title: '自我介绍（Selbstpräsentation）完全指南——AIDA模型+三步公式+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_106.md',
    title: '评估中心（Assessment Center）完全指南——8种常见练习+准备策略',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_107.md',
    title: '职场人脉（Netzwerken）完全指南——20个技巧+四大核心法则',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_108.md',
    title: 'LinkedIn个人资料优化完全指南——11个步骤+求职技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_109.md',
    title: '招聘测试（Einstellungstest）完全指南——5个测试类型+备考技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_110.md',
    title: '软技能（Soft Skills）完全指南——4种类型+10大核心能力+训练方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_111.md',
    title: '领导风格（Führungsstile）完全指南——9种类型+优缺点+情境式领导',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_112.md',
    title: '薪资期望（Gehaltsvorstellung）完全指南——7大核心规则+表达公式',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_113.md',
    title: '个人优势（Stärken）完全指南——100个优势例子+识别方法+求职应用',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_114.md',
    title: '职业目标（Karriereziele）完全指南——SMART方法+4步定义法+目标示例',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_115.md',
    title: '跳槽换工作（Jobwechsel）完全指南——10个好理由+清单+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_116.md',
    title: '职业起步（Berufseinstieg）完全指南——7种入职方式+清单+实用建议',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_117.md',
    title: '雇主品牌（Employer Branding）完全指南——战略框架+实施措施+成功案例',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_118.md',
    title: '员工入职培训（Onboarding）完全指南——3阶段模型+清单+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_119.md',
    title: '职业进修（Weiterbildung）完全指南——4种类型+资助方式+如何选择靠谱机构',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_120.md',
    title: '居家办公（Homeoffice）完全指南——法律权利+10条黄金法则+税务扣除',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_121.md',
    title: '职业倦怠（Burnout）完全指南——症状+原因+测试+应对方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_122.md',
    title: '心理韧性（Resilienz）完全指南——7大支柱+研究发现+8种训练方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_123.md',
    title: '沟通（Kommunikation）完全指南——3种类型+7大模型+6个改善技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_124.md',
    title: '冲突管理（Konfliktmanagement）完全指南——7种冲突类型+5种方法+9阶段升级模型',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_125.md',
    title: '时间管理（Zeitmanagement）完全指南——17种最佳方法+5个核心技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_126.md',
    title: '工作动力（Motivation）完全指南——内外动力区别+12个重获动力技巧+心理学原理',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_127.md',
    title: '试用期（Probezeit）完全指南——持续时间、解约规则与11个成功技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_128.md',
    title: '加班（Überstunden）完全指南——法律规定、薪酬权利与应对技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_129.md',
    title: '离职解约（Kündigung）完全指南——所有规定+通知期+解雇保护',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_130.md',
    title: '德国劳动法（Arbeitsrecht）完全指南——法律体系、合同权利与职场保护',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_131.md',
    title: '主动求职（Initiativbewerbung）完全指南——写法模板+成功技巧+常见错误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_132.md',
    title: '创造力（Kreativität）完全指南——定义、4个阶段、6个误区+6种培养方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_133.md',
    title: '分析性思维（Analytisches Denken）完全指南——定义、职场应用、训练方法与求职技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_134.md',
    title: '批判性思维（Kritisches Denken）完全指南——7步学习法+4阶段模型+常见陷阱',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_135.md',
    title: '共情能力（Empathie）完全指南——定义、3种类型、4大支柱与实践技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_136.md',
    title: '项目管理（Projektmanagement）完全指南——5个阶段、主要方法与成功技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_137.md',
    title: '决策（Entscheidungsfindung）完全指南——5个阶段、最佳方法与克服决策障碍',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_138.md',
    title: '团队合作（Teamarbeit）完全指南——定义、成功要素、10条黄金法则与常见陷阱',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_139.md',
    title: '演讲技巧（Präsentationstechniken）完全指南——工具选择、修辞手法与语音训练',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_140.md',
    title: '提问技巧（Fragetechniken）完全指南——10种提问类型+开放与封闭式问题应用',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_141.md',
    title: '面试说服力（Vorstellungsgespräch）完全指南——7个阶段、精准表达与常见失误',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_142.md',
    title: '抗压能力（Stressresistenz）完全指南——定义、正负压力区别与15个增强技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_143.md',
    title: '自我管理（Selbstmanagement）完全指南——定义、18种方法与实践技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_144.md',
    title: '敏捷工作（Agiles Arbeiten）完全指南——定义、5种方法与实施要素',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_145.md',
    title: '数字化（Digitalisierung）完全指南——定义、实例、职场影响与企业应对',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_146.md',
    title: '企业文化（Unternehmenskultur）完全指南——定义、模型、实例与建设方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_147.md',
    title: '变革管理（Change Management）完全指南——定义、5个阶段、模型与成功要素',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_148.md',
    title: '财务会计（Rechnungswesen）完全指南——定义、四大领域、任务与实例',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_149.md',
    title: 'SWOT分析完全指南——定义、四要素、4种战略组合与应用方法',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_150.md',
    title: '商业模式（Geschäftsmodell）完全指南——定义、10种类型与商业模式画布',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_151.md',
    title: '商业计划书（Businessplan）完全指南——定义、10个章节结构、常见错误与写作技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_152.md',
    title: '标杆分析（Benchmarking）完全指南——定义、5种类型、5个阶段与风险',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_153.md',
    title: '目标协议（Zielvereinbarung）完全指南——定义、4个阶段、SMART标准与注意事项',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_154.md',
    title: 'OKR方法论完全指南——定义、目标与关键结果、季度流程与实践技巧',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_155.md',
    title: '职场认可（Wertschätzung）完全指南——定义、真正认可的3个要素与10种表达方式',
    folder: 'Karrierebibel.de',
  },
  {
    file: '/tmp/karriere_final_156.md',
    title: '多元化管理（Diversity Management）完全指南——定义、维度、措施与优缺点',
    folder: 'Karrierebibel.de',
  },
  // ─── UK ─────────────────────────────────────────────────────────
  {
    file: '/tmp/uk_prospects_1.md',
    title: '管理咨询顾问（Management Consultant）职业指南——英国',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_2.md',
    title: '商业分析师（Business Analyst）职业指南——英国',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_3.md',
    title: '投资分析师（Investment Analyst）职业指南——英国',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_4.md',
    title: '数据分析师（Data Analyst）职业指南——英国',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_5.md',
    title: '金融风险分析师（Financial Risk Analyst）职业指南——英国',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_6.md',
    title: '企业投资银行家（Corporate Investment Banker）职业指南——英国',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_targetjobs_1.md',
    title: 'BCG面试题目全解析——申请流程、筛选面试与Case Interview完全指南（英国）',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_targetjobs_2.md',
    title: '求职评估中心Case Study完全指南——如何应对案例分析题（英国）',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_targetjobs_3.md',
    title: '咨询公司评估中心（Assessment Centre）完全指南——7大环节详解（英国）',
    folder: 'UK',
  },
  // ─── 日本 ────────────────────────────────────────────────────────
  {
    file: '/tmp/japan_mynavi_1.md',
    title: '日本コンサルタント职业完全指南——定义、种类、职级体系与年收入',
    folder: '日本',
  },
  // ─── 新加坡 ──────────────────────────────────────────────────────
  {
    file: '/tmp/singapore_gradsg_1.md',
    title: '新加坡投资银行与投资管理职业指南——岗位类型、技能要求与职业路径',
    folder: '新加坡',
  },
  {
    file: '/tmp/singapore_gradsg_2.md',
    title: '新加坡管理会计（Management Accounting）职业指南——岗位概述、技能要求与职业路径',
    folder: '新加坡',
  },
  {
    file: '/tmp/singapore_gradsg_3.md',
    title: '新加坡商业金融（Commercial Finance）职业指南——岗位概述、技能要求与职业路径',
    folder: '新加坡',
  },
  {
    file: '/tmp/singapore_gradsg_4.md',
    title: '新加坡毕业生求职Case Study完全指南——如何应对案例分析题',
    folder: '新加坡',
  },
  {
    file: '/tmp/singapore_gradsg_5.md',
    title: '新加坡毕业生面试高频题目全解析——10道经典题目及应答策略',
    folder: '新加坡',
  },
  {
    file: '/tmp/singapore_gradsg_6.md',
    title: '新加坡毕业生群体面试（Panel Interview）完全指南',
    folder: '新加坡',
  },
  // ─── 韩国 ────────────────────────────────────────────────────────
  {
    file: '/tmp/korea_jobkorea_1.md',
    title: '韩国经营顾问（경영컨설턴트）职业指南——职责、入行路径、年薪与发展前景',
    folder: '韩国',
  },
  // ─── UK (prospects.ac.uk) 面试/求职内容 ──────────────────────────
  {
    file: '/tmp/uk_prospects_7.md',
    title: '英国求职面试准备完全指南——类型、着装、体态与事后跟进',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_8.md',
    title: '英国求职面试高频题目全解析——10大经典问题及回答策略',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_9.md',
    title: '能力型面试（Competency-Based Interview）完全指南——英国',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_10.md',
    title: '英国求职评估中心（Assessment Centre）完全指南',
    folder: 'UK',
  },
  {
    file: '/tmp/uk_prospects_11.md',
    title: '英国求职心理测试（Psychometric Tests）完全指南',
    folder: 'UK',
  },
  // ─── 日本 (mynavi.jp) 面试内容 ──────────────────────────────────
  {
    file: '/tmp/japan_mynavi_2.md',
    title: '日本转职面试质问一览与对策完全指南——130+题目、5阶段框架',
    folder: '日本',
  },
  {
    file: '/tmp/japan_mynavi_3.md',
    title: '日本转职面试序盘高频题目与答法——OK/NG例文全解析',
    folder: '日本',
  },
  {
    file: '/tmp/japan_mynavi_4.md',
    title: '日本转职面试志望动机完全答法——4步构建法+NG案例解析',
    folder: '日本',
  },
  {
    file: '/tmp/japan_mynavi_5.md',
    title: '日本转职面试逆向提问（逆質問）完全指南——42个例子+NG案例',
    folder: '日本',
  },
  // ─── 韩国 (jobkorea.co.kr) 面试/求职内容 ────────────────────────
  {
    file: '/tmp/korea_jobkorea_2.md',
    title: '韩国AI面试完全指南——评分逻辑、高频题型与备考攻略',
    folder: '韩国',
  },
  {
    file: '/tmp/korea_jobkorea_3.md',
    title: '韩国面试题目的真正含义——面试官问的和想知道的是不同的事',
    folder: '韩国',
  },
  {
    file: '/tmp/korea_jobkorea_4.md',
    title: '韩国求职자소서写作完全指南——让人事担当跳过的光탈文章避坑指南',
    folder: '韩国',
  },
  {
    file: '/tmp/korea_jobkorea_5.md',
    title: '韩国신입合格者平均SPEC分析——270名合格者数据解析',
    folder: '韩国',
  },
];

// ─── 获取或创建目录节点 ─────────────────────────────────────────
const folderCache: Record<string, string> = {}; // "folder/subfolder" → nodeToken

async function getOrCreateFolder(name: string, parentToken: string): Promise<string> {
  const cacheKey = `${parentToken}/${name}`;
  if (folderCache[cacheKey]) return folderCache[cacheKey];

  // 检查是否已存在
  const listRes = await api('GET', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes?parent_node_token=${parentToken}&page_size=50`);
  if (listRes.code === 0) {
    for (const item of listRes.data?.items || []) {
      if (item.title === name) {
        console.log(`  📁 已有目录: ${name} (${item.node_token})`);
        folderCache[cacheKey] = item.node_token;
        return item.node_token;
      }
    }
  }

  // 创建新目录节点（用 docx 类型，标题即目录名）
  const { nodeToken } = await createNode(name, parentToken);
  console.log(`  📁 新建目录: ${name} (${nodeToken})`);
  folderCache[cacheKey] = nodeToken;
  await sleep(400);
  return nodeToken;
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  await refreshToken();
  await findSpaceId();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📂 发布 ${ARTICLES.length} 篇德语面试内容翻译`);
  console.log(`   目标节点: ${PARENT_NODE}`);
  console.log(`   结构: 按网站分目录，按公司分栏目`);
  console.log(`${'='.repeat(60)}`);

  // 跳过已发布的文章（设置起始索引）
  const START_INDEX = parseInt(process.env.START_INDEX || '0', 10);
  const SKIP_INDICES = new Set((process.env.SKIP_INDICES || '').split(',').filter(s => s.trim()).map(Number));

  for (let i = START_INDEX; i < ARTICLES.length; i++) {
    if (SKIP_INDICES.has(i)) { console.log(`  ⏭️ 跳过 index ${i}`); continue; }
    const article = ARTICLES[i];
    console.log(`\n[${i + 1}/${ARTICLES.length}] ${article.title}`);

    if (!fs.existsSync(article.file)) {
      console.error(`  ❌ 文件不存在: ${article.file}`);
      continue;
    }

    try {
      // 创建目录层级
      const folderToken = await getOrCreateFolder(article.folder, PARENT_NODE);
      let parentToken = folderToken;
      if (article.subfolder) {
        parentToken = await getOrCreateFolder(article.subfolder, folderToken);
      }

      const md = fs.readFileSync(article.file, 'utf-8');
      const blocks = mdToBlocks(md);

      // 跳过第一个 h1 block（标题在 node title 里）
      const contentBlocks = blocks.length > 0 && blocks[0].block_type === 3 ? blocks.slice(1) : blocks;

      if (contentBlocks.length === 0) {
        console.log(`  ⚠️ 无内容，跳过`);
        continue;
      }

      const maxBlocks = 500;
      const trimmedBlocks = contentBlocks.slice(0, maxBlocks);
      if (contentBlocks.length > maxBlocks) {
        console.log(`  ⚠️ ${contentBlocks.length} blocks → 截取前 ${maxBlocks}`);
      }

      const { nodeToken, objToken } = await createNode(article.title, parentToken);
      console.log(`  ✓ 节点: ${nodeToken} (${trimmedBlocks.length} blocks)`);

      await writeBlocks(objToken, trimmedBlocks);
      console.log(`  ✅ 完成: ${article.folder}${article.subfolder ? ' > ' + article.subfolder : ''} > ${article.title}`);
    } catch (e: any) {
      console.error(`  ❌ 失败: ${e.message}`);
    }

    await sleep(600);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`全部发布完成！`);
  console.log(`📖 https://hcn2vc1r2jus.feishu.cn/wiki/${PARENT_NODE}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
