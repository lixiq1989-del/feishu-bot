/**
 * 用用户OAuth token把情报内容写入飞书Wiki
 * 目标：https://hcn2vc1r2jus.feishu.cn/wiki/W1ohwQfKviDg3IkeV68c0N0bnyc
 */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// ─── 加载 .env ───────────────────────────────────────────────────
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
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';
const SPACE_ID = '7616033289844821185';
const PARENT_NODE_TOKEN = 'W1ohwQfKviDg3IkeV68c0N0bnyc';

let USER_TOKEN = '';

function api(method: string, apiPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: apiPath,
      method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': String(Buffer.byteLength(data)) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', (c: string) => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve(d); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

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
    const h1 = line.match(/^# (.+)$/);
    if (h1) { blocks.push({ block_type: 3, heading1: { elements: parseInline(h1[1]), style: {} } }); continue; }
    const h2 = line.match(/^## (.+)$/);
    if (h2) { blocks.push({ block_type: 4, heading2: { elements: parseInline(h2[1]), style: {} } }); continue; }
    const h3 = line.match(/^### (.+)$/);
    if (h3) { blocks.push({ block_type: 5, heading3: { elements: parseInline(h3[1]), style: {} } }); continue; }
    if (/^(-{3,})$/.test(line.trim())) {
      blocks.push({ block_type: 22, divider: {} }); continue;
    }
    const bul = line.match(/^[-*] (.+)$/);
    if (bul) { blocks.push({ block_type: 12, bullet: { elements: parseInline(bul[1]), style: {} } }); continue; }
    const ord = line.match(/^\d+\. (.+)$/);
    if (ord) { blocks.push({ block_type: 13, ordered: { elements: parseInline(ord[1]), style: {} } }); continue; }
    if (line.trim() === '') continue; // skip empty lines
    blocks.push({ block_type: 2, text: { elements: parseInline(line), style: {} } });
  }
  return blocks;
}

// ─── 刷新 token ──────────────────────────────────────────────────
async function refreshToken() {
  const saved = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));

  // Check if still valid (with 5min buffer)
  const savedAt = new Date(saved.saved_at).getTime();
  const expiresAt = savedAt + (saved.expires_in - 300) * 1000;
  if (Date.now() < expiresAt) {
    console.log('✓ Token 仍然有效');
    USER_TOKEN = saved.access_token;
    return;
  }

  console.log('⏳ Token 已过期，正在刷新...');

  // Get app access token first
  const appTokenResp = await api('POST', '/open-apis/auth/v3/app_access_token/internal');
  // Need to call without user token
  const appResp: any = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET });
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/app_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)) },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', (c: string) => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  const appToken = appResp.app_access_token;
  if (!appToken) {
    throw new Error(`获取app_access_token失败: ${JSON.stringify(appResp)}`);
  }

  // Refresh user token
  const refreshResp: any = await new Promise((resolve, reject) => {
    const body = JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: saved.refresh_token,
    });
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/authen/v1/oidc/refresh_access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appToken}`,
        'Content-Length': String(Buffer.byteLength(body)),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', (c: string) => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (refreshResp.code !== 0) {
    throw new Error(`刷新token失败: ${JSON.stringify(refreshResp)}\n请重新运行授权: cd ~/startup-7steps && NODE_TLS_REJECT_UNAUTHORIZED=0 node feishu-auth.js`);
  }

  const result = {
    access_token: refreshResp.data.access_token,
    refresh_token: refreshResp.data.refresh_token,
    expires_in: refreshResp.data.expires_in,
    token_type: refreshResp.data.token_type,
    saved_at: new Date().toISOString(),
  };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(result, null, 2));
  USER_TOKEN = result.access_token;
  console.log('✅ Token 刷新成功');
}

// ─── 内容 ────────────────────────────────────────────────────────
const CONTENT = `# 海外情报挖掘·第1轮：Management Consulted × IGotAnOffer

**挖掘日期：** 2026-03-12
**母源：** Management Consulted（咨询求职头部站点） + IGotAnOffer（方法论体系最完整的prep站点）
**筛选标准：** 优先深度指南 > 真实经验 > 方法论总结。排除纯SEO文、无案例浅文、广告页。

---

## ① Case Interview: Complete Prep Guide (2025)

**平台：** Management Consulted
**作者：** Management Consulted 编辑团队
**链接：** https://managementconsulted.com/case-interview/
**内容类型：** 旗舰级方法论指南
**适合人群：** 新手入门 → 中级提升均适用
**目标公司：** 通用（MBB + T2 均覆盖）
**目标阶段：** Case Interview 全流程

### 内容结构
- 8大case组件拆解：problem capture → framework → data request → math → insights → recommendation
- Framework使用哲学：强调"框架是工具不是模板"，明确反对死记硬背Porter's Five Forces然后硬套
- Case Math四步法：recap → structure → run numbers → develop insights
- 练习量标准：顶级候选人需完成30-50次完整verbal case practice

### 核心经验 / 可复用方法
1. **"Framework as guide, not script"哲学** — 面试官最反感的就是候选人把所有case往一个框架里塞。核心技能是"听完题后现场搭建适配框架"
2. **Case Math不是算对就行** — 面试官评估的是"你能不能把思考过程说出来"，四步法解决的是沟通问题而非计算问题
3. **McKinsey要精确到个位数，BCG/Bain可以适当四舍五入** — 这是firm-specific的关键差异
4. **自我评估四维度：** structure / communication / quantitative accuracy / creative problem-solving

### 适合改写给中国学生吗？
**非常适合。** 中国学生最常见的两个问题——"背框架"和"只算不说"——这篇文章直接解决。可改写为"Case Interview的4个致命误区"类型的小红书/公众号文章。

---

## ② 5 Tips for McKinsey Case Interview

**平台：** Management Consulted
**作者：** Management Consulted 编辑团队
**链接：** https://managementconsulted.com/5-tips-for-mckinsey-case-interview/
**内容类型：** Firm-specific深度指南
**适合人群：** 冲MBB / 冲McKinsey
**目标公司：** McKinsey
**目标阶段：** Case Interview + PEI

### 内容结构
- McKinsey interviewer-led格式详解（与BCG/Bain candidate-led的本质区别）
- 5个McKinsey特有要求：极致结构化、精确计算、30秒思考停顿、二三层级insight、answer-first表达
- Pyramid Principle在面试中的实战应用
- 与Barbara Minto金字塔原理的关联

### 核心经验 / 可复用方法
1. **McKinsey的"结构化"不只是开头搭框架** — 它贯穿笔记、数学、brainstorming、结论的每一个环节。面试官在评估你整个思维过程是否有组织
2. **Answer-first表达法** — 先说结论再说理由。"Here is what I recommend" → 然后用supporting arguments支撑。这和大多数人"先分析后给结论"的习惯完全相反
3. **数学精度要求** — McKinsey要求算到个位数（不能四舍五入到十位），这反映了其风控文化
4. **"Deeper insights"** — McKinsey不满足于表面分析，会追问"so what"和"why does this matter"

### 适合改写给中国学生吗？
**极度适合。** 中国学生最容易踩的坑就是"用BCG的方式准备McKinsey"。可改写为"McKinsey面试和BCG/Bain到底有什么不同？5个你必须知道的差异"，是小红书爆款选题。

---

## ③ McKinsey Case Interview: The Only Post You'll Need to Read

**平台：** IGotAnOffer
**作者：** IGotAnOffer 编辑团队
**链接：** https://igotanoffer.com/blogs/mckinsey-case-interview-blog/115672708-mckinsey-case-interview-preparation-the-only-post-youll-need-to-read
**内容类型：** 旗舰级firm-specific全流程指南
**适合人群：** 冲McKinsey的全阶段候选人
**目标公司：** McKinsey
**目标阶段：** 申请 → Case → PEI → Offer

### 内容结构
- McKinsey interviewer-led面试的5部分标准流程：Situation → Framework Question → Quantitative Question → Creativity Question → Recommendation
- McKinsey三大核心评估维度：problem-solving ability / communication skills / personal experience alignment
- PEI（Personal Experience Interview）详解：4个反复出现的主题，每个主题准备2-3个故事
- 官方练习case推荐：Diconsa, Electro-Light, GlobaPharm, "Transforming a National Education System"
- 沉默是red flag的明确警告

### 核心经验 / 可复用方法
1. **McKinsey面试的5段式结构是固定的** — 掌握每段的评估重点，比盲目刷题有效10倍
2. **PEI不是"附加题"** — 至少占10分钟（first + second round都有），而且是独立评估维度
3. **McKinsey官方公开了4个练习case** — 多数候选人不知道或没认真做，这是免费的"真题"
4. **沉默 = 红旗** — 哪怕在想，也要说出来"Let me think about this for a moment"

### 适合改写给中国学生吗？
**非常适合。** 可拆成两篇："McKinsey面试的5个固定环节（附官方真题链接）" + "PEI怎么准备？McKinsey最看重的4类故事"。中国学生普遍忽视PEI，以为case做好就行，这是最大盲区。

---

## ④ Common Case Interview Frameworks (and how to create your own)

**平台：** IGotAnOffer
**作者：** IGotAnOffer 编辑团队
**链接：** https://igotanoffer.com/blogs/mckinsey-case-interview-blog/118288068-case-interviews-frameworks-comprehensive-guide
**内容类型：** 方法论 + 实操指南
**适合人群：** 新手到中级（尤其适合从"背框架"过渡到"搭框架"的阶段）
**目标公司：** 通用
**目标阶段：** Case Interview框架阶段

### 内容结构
- 7大常用框架详解：Profitability / 4Ps / Porter's Five Forces / Market Entry / M&A / Pricing / Problem Solving
- 每个框架配真实case演示（McKinsey + Bain源）
- 框架定制化方法论（Framework Development Method）：extract main elements → break into components → communicate structure
- 行业特定定制示例（retail vs healthcare vs tech）
- Marc Cosentino《Case in Point》方法的批判性评价

### 核心经验 / 可复用方法
1. **"面试官一眼就能看出你在套框架"** — 这是被扣分最多的行为之一
2. **Framework Development Method三步法：** ①从题目中提取核心要素 → ②拆解为子组件 → ③清晰表达给面试官。这个方法可以现场用于任何case
3. **行业定制化：** 零售case加入foot traffic / store footprint；医疗case加入regulatory hurdles / patient adoption — 这体现的是business acumen
4. **7个框架不是用来"选一个套上去"的，** 而是用来"拆零件重新组装"的

### 适合改写给中国学生吗？
**极其适合。** 中国学生最大的框架误区就是"背→选→套"。可改写为"Case Interview框架的正确用法：不是选框架，是造框架"，直击痛点。

---

## ⑤ STAR Method: Should it be Used in Fit Interviews?

**平台：** Management Consulted
**作者：** Management Consulted 编辑团队
**链接：** https://managementconsulted.com/star-method/
**内容类型：** Behavioral / Fit Interview方法论
**适合人群：** 所有人（尤其是fit interview薄弱的候选人）
**目标公司：** 通用（MBB + T2）
**目标阶段：** Fit / Behavioral Interview

### 内容结构
- STAR方法的正确理解：它是隐形结构，不是填空模板
- Situation选择策略：不是选"最牛的经历"，而是选"能展示咨询相关能力的经历"
- Action环节的核心：展示decision-making under uncertainty — 解释为什么选A而不是B或C
- 坏STAR vs 好STAR的对比：机械感 vs 故事感
- 三类behavioral问题分型：direct questions / story questions / tricky questions

### 核心经验 / 可复用方法
1. **顶级fit回答不会宣布"这是我的situation"** — 它像讲故事一样自然流淌，STAR结构在后台无形运行
2. **Situation选择 = 策略决策** — 你选什么故事，决定了你能展示什么能力。不要默认选"最impressive的"，要选"最能讨论problem-solving / leadership / stakeholder management的"
3. **Tricky questions的评估对象是"判断力+真实性"** — 不要把失败包装成"学习经验"，要展示真正的反思和行为改变
4. **Action环节要暴露思考过程** — 面试官要看到你在不确定环境下如何做判断，而不是"我执行了一个方案"

### 适合改写给中国学生吗？
**非常适合。** 中国学生fit interview两大问题：①太机械（像背答案）②选故事不策略（只挑"最牛"的讲）。可改写为"Fit Interview的秘密：面试官听的不是你有多牛，而是你怎么想"。

---

## 本轮挖掘总结

### 最值得沉淀的方法论
- "框架是工具不是模板" + Framework Development Method三步法
- Answer-first表达法（Pyramid Principle在面试中的应用）
- Case Math四步法（recap → structure → run numbers → develop insights）
- STAR隐形化：结构在后台运行，前台是自然叙事

### MBB三家的核心差异
- **McKinsey：** interviewer-led，精确计算，answer-first，极致结构化，PEI深度追问
- **BCG：** candidate-led，创造力优先，对话式，鼓励定制框架，重视非典型case
- **Bain：** 实用主义，关系导向，重人格和团队协作，面试中后段可能转为自由对话

### 中国学生最大盲区
- PEI准备不足：以为case做好就行，忽视行为面占10-30分钟
- Fit Interview机械化：像背答案而不是讲故事
- 背框架硬套：面试官一眼看穿，直接扣分
- 不知道McKinsey有官方练习case（Diconsa等4个免费真题）
- McKinsey vs BCG准备方式混用：interviewer-led和candidate-led需要完全不同的策略

### 可直接改写的爆款选题
1. "McKinsey vs BCG面试到底有什么不同？5个关键差异"
2. "Case Interview框架的正确用法：不是选框架，是造框架"
3. "Fit Interview的秘密：面试官听的不是你有多牛，而是你怎么想"
4. "PEI怎么准备？McKinsey最看重的4类故事"
5. "Case Interview的4个致命误区（附McKinsey官方免费真题）"

### 下一轮计划
- 母源：CaseCoach + PrepLounge（补充firm差异和社区视角）
- 或切换到：Reddit r/consulting + Medium（抓真实候选人复盘帖）
`;

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  await refreshToken();

  console.log('\n📄 创建Wiki页面...');

  // 1. 创建节点
  const createRes = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    node_type: 'origin',
    parent_node_token: PARENT_NODE_TOKEN,
    title: '海外情报挖掘·第1轮：Management Consulted × IGotAnOffer',
  });

  if (createRes.code !== 0) {
    console.error('❌ 创建节点失败:', createRes.code, createRes.msg);
    return;
  }

  const { node_token, obj_token } = createRes.data.node;
  console.log('✓ 节点已创建:', node_token);

  // 2. 获取文档根block
  await sleep(500);
  const docRes = await api('GET', `/open-apis/docx/v1/documents/${obj_token}/blocks?page_size=5`);
  const rootBlockId = docRes.data?.items?.[0]?.block_id;
  if (!rootBlockId) {
    console.error('❌ 获取文档根block失败');
    return;
  }

  // 3. 转换并写入内容
  const blocks = mdToBlocks(CONTENT);
  // Skip the h1 title (already in node title)
  const contentBlocks = blocks.slice(1);

  console.log(`⏳ 写入 ${contentBlocks.length} 个blocks...`);

  const chunkSize = 50;
  for (let i = 0; i < contentBlocks.length; i += chunkSize) {
    const chunk = contentBlocks.slice(i, i + chunkSize);
    const writeRes = await api('POST', `/open-apis/docx/v1/documents/${obj_token}/blocks/${rootBlockId}/children`, {
      children: chunk,
      index: i,
    });
    if (writeRes.code !== 0) {
      console.error(`❌ 写入blocks失败 (${i}-${i + chunk.length}):`, writeRes.code, writeRes.msg);
    } else {
      console.log(`  ✓ ${i + 1}-${Math.min(i + chunkSize, contentBlocks.length)}`);
    }
    if (i + chunkSize < contentBlocks.length) await sleep(400);
  }

  const wikiUrl = `https://${DOMAIN}/wiki/${node_token}`;
  console.log(`\n✅ 发布完成！`);
  console.log(`🔗 ${wikiUrl}`);
}

main().catch(e => {
  console.error('❌ 失败:', e.message);
  process.exit(1);
});
