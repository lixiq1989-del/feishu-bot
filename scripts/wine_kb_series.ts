/**
 * 葡萄酒知识库 - 4个持续更新系列
 * 产区深度游、餐酒实验室、酒友问答、节日专题
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_series.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
const { execSync } = require('child_process');

// 加载 .env
const envPath = path.resolve(__dirname, '..', '.env');
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

// ─── Block 工厂 ──────────────────────────────────────────────
function t(content: string, style?: any) { return { text_run: { content, text_element_style: style ?? {} } }; }
function b(content: string) { return t(content, { bold: true }); }
function it(content: string) { return t(content, { italic: true }); }
function p(...elements: any[]) { return { block_type: 2, text: { elements, style: {} } }; }
function h1(text: string) { return { block_type: 3, heading1: { elements: [t(text)], style: {} } }; }
function h2(text: string) { return { block_type: 4, heading2: { elements: [t(text)], style: {} } }; }
function h3(text: string) { return { block_type: 5, heading3: { elements: [t(text)], style: {} } }; }
function li(...elements: any[]) { return { block_type: 12, bullet: { elements, style: {} } }; }
function ol(...elements: any[]) { return { block_type: 13, ordered: { elements, style: {} } }; }
function hr() { return { block_type: 22, divider: {} }; }
function quote(...elements: any[]) { return { block_type: 15, quote: { elements, style: {} } }; }
function img() { return { block_type: 27, image: {} }; }

// ─── API 工具 ──────────────────────────────────────────────
function curlApi(method: string, apiPath: string, token: string, body?: any): any {
  let cmd = `curl -sk --retry 3 --retry-delay 2 -X ${method} "https://open.feishu.cn${apiPath}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`;
  if (body) {
    const tmpFile = `/tmp/feishu_body_${Date.now()}.json`;
    fs.writeFileSync(tmpFile, JSON.stringify(body));
    cmd += ` -d @${tmpFile}`;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 });
      return JSON.parse(result);
    } catch (err: any) {
      if (attempt < 4) { console.log(`  curl 重试 (${attempt + 1}/5)...`); execSync('sleep 3'); }
      else throw err;
    }
  }
}

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = (u: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : require('http');
      mod.get(u, { rejectUnauthorized: false }, (res: any) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location, redirects + 1);
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    get(url);
  });
}

function uploadAndPatch(token: string, objToken: string, blockId: string, imageBuffer: Buffer, fileName: string) {
  const tmpFile = `/tmp/wine_series_${Date.now()}.jpg`;
  fs.writeFileSync(tmpFile, imageBuffer);
  const result = execSync(
    `curl -sk --retry 5 --retry-delay 3 -X POST "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all" ` +
    `-H "Authorization: Bearer ${token}" ` +
    `-F "file_name=${fileName}" -F "parent_type=docx_image" -F "parent_node=${blockId}" ` +
    `-F "size=${imageBuffer.length}" -F "file=@${tmpFile};type=image/jpeg"`,
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 }
  );
  try { fs.unlinkSync(tmpFile); } catch {}
  const json = JSON.parse(result);
  if (json.code !== 0) throw new Error(json.msg || `Upload failed: ${json.code}`);
  const fileToken = json.data.file_token;

  const patchRes = curlApi('PATCH', `/open-apis/docx/v1/documents/${objToken}/blocks/${blockId}`, token, { replace_image: { token: fileToken } });
  return patchRes.code === 0;
}

// ─── 配置 ──────────────────────────────────────────────
const SPACE_ID = '7615178195469421499';
const PARENT_NODE = 'LaBgw4iypixpaFkrX9dcyV5Undh';
const HOMEPAGE_DOC = 'XaEVdjuYkomGyfxdMPpcGQItnbe';

// ═══════════════════════════════════════════════════════════
// 系列 1: 产区深度游
// ═══════════════════════════════════════════════════════════

const REGION_INTRO_BLOCKS = [
  img(),
  p(t('')),
  quote(
    b('产区深度游 · Region Explorer'),
    t('\n每期深入一个葡萄酒产区，聊风土、聊历史、聊代表酒庄。'),
    t('\n不是教科书式罗列，是带你「云游」产区的沉浸式体验。')
  ),
  p(t('')), hr(),

  h1('📋 系列说明'),
  p(t('')),
  p(b('更新频率：'), t('每两周一期（产区内容更深，需要更多篇幅）')),
  p(b('覆盖范围：')),
  li(t('经典旧世界：波尔多、勃艮第、托斯卡纳、里奥哈、莫泽尔……')),
  li(t('新世界明星：纳帕谷、巴罗萨、马尔堡、门多萨……')),
  li(t('新兴产区：宁夏贺兰山、格鲁吉亚、希腊圣托里尼……')),
  p(t('')),
  p(b('每期固定结构：')),
  ol(t('产区名片（位置、气候、面积、核心品种）')),
  ol(t('风土密码（土壤、海拔、微气候如何塑造风味）')),
  ol(t('历史脉络（产区如何走到今天）')),
  ol(t('分级制度（AOC / DOC / AVA 等当地体系）')),
  ol(t('代表酒庄 Top 5（从顶级到性价比）')),
  ol(t('必喝清单（3 款入门 + 2 款进阶）')),
  ol(t('旅行攻略（如果你真的想去）')),
  p(t('')), hr(),

  h1('📚 往期目录'),
  p(t('')),
  p(it('第一期内容已发布，更多产区即将解锁……')),
  p(t('')), hr(),
  p(t('')),
  quote(t('每一瓶好酒的背后，都有一片独特的土地。🗺️')),
];

// 第一期：波尔多
const REGION_EP01_BLOCKS = [
  img(),
  p(t('')),
  quote(
    b('产区深度游 · 第 1 期'),
    t('\n如果葡萄酒世界有一个「宇宙中心」，那一定是波尔多。'),
    t('\n它是标准的制定者、价格的风向标、每个酒客绕不过去的必修课。')
  ),
  p(t('')), hr(),

  // 产区名片
  h1('🏷️ 产区名片'),
  p(t('')),
  p(b('名称：'), t('Bordeaux（波尔多）')),
  p(b('国家：'), t('法国，西南部')),
  p(b('面积：'), t('约 11 万公顷，法国最大 AOC 产区')),
  p(b('年产量：'), t('约 7 亿瓶（全球每 6 瓶葡萄酒就有 1 瓶来自波尔多）')),
  p(b('气候：'), t('温和的海洋性气候，受大西洋和吉伦特河调节')),
  p(b('核心红葡萄品种：'), t('梅洛（Merlot）、赤霞珠（Cabernet Sauvignon）、品丽珠（Cabernet Franc）')),
  p(b('核心白葡萄品种：'), t('长相思（Sauvignon Blanc）、赛美蓉（Sémillon）')),
  p(t('')), hr(),

  // 风土密码
  h1('🌍 风土密码'),
  p(t('')),
  p(t('波尔多的秘密在于两条河：'), b('加龙河（Garonne）'), t('和'), b('多尔多涅河（Dordogne）'), t('。它们在波尔多城汇合成'), b('吉伦特河（Gironde）'), t('，把产区天然分成了「左岸」和「右岸」两个风味迥异的世界。')),
  p(t('')),

  h2('左岸（Left Bank）'),
  p(b('土壤：'), t('深厚的砾石层（Graves），排水极佳')),
  p(b('主角：'), t('赤霞珠（通常占 60-80%）')),
  p(b('风格：'), t('骨架坚实，单宁强劲，黑醋栗和雪松香气，年轻时「硬」，陈年后华丽')),
  p(b('代表产区：'), t('梅多克（Médoc）、圣朱利安（St-Julien）、波亚克（Pauillac）、玛歌（Margaux）、佩萨克-雷奥良（Pessac-Léognan）')),
  p(t('')),

  h2('右岸（Right Bank）'),
  p(b('土壤：'), t('黏土和石灰岩为主，保水性好')),
  p(b('主角：'), t('梅洛（通常占 70-90%）')),
  p(b('风格：'), t('圆润饱满，丝滑柔和，红色水果和巧克力香气，年轻时就好喝')),
  p(b('代表产区：'), t('圣爱美隆（Saint-Émilion）、波美侯（Pomerol）')),
  p(t('')),

  p(b('一句话总结：'), it('左岸像西装革履的绅士，右岸像温柔可靠的暖男。')),
  p(t('')), hr(),

  // 历史脉络
  h1('📜 历史脉络'),
  p(t('')),
  li(b('古罗马时期'), t(' —— 波尔多就开始种葡萄了，当时叫 Burdigala')),
  li(b('12 世纪'), t(' —— 阿基坦的埃莉诺嫁给英格兰国王亨利二世，波尔多成为英国人的「酒窖」，claret（波尔多红酒的英文名）就是这时候来的')),
  li(b('1855 年'), t(' —— 拿破仑三世主持了著名的「1855 分级」，列级庄制度诞生，至今只改过一次（1973 年木桐升级一级庄）')),
  li(b('20 世纪'), t(' —— 两次世界大战、根瘤蚜虫害、经济萧条，波尔多经历了低谷期')),
  li(b('1982 年份'), t(' —— Robert Parker 给出高分，现代波尔多「期酒」投资市场爆发')),
  li(b('2000 年代'), t(' —— 中国市场崛起，拉菲成为「硬通货」，波尔多再次站上巅峰')),
  li(b('2020 年代'), t(' —— 市场回归理性，中级庄和小众产区开始受到关注')),
  p(t('')), hr(),

  // 分级制度
  h1('🏅 分级制度'),
  p(t('')),
  p(t('波尔多有多个分级体系并存，这是最让新手头疼的地方。简单梳理：')),
  p(t('')),

  h2('1855 梅多克分级（最著名）'),
  p(b('一级庄（Premier Cru）：'), t('拉菲、拉图、玛歌、侯伯王、木桐 —— 5 大天王')),
  p(b('二级庄到五级庄：'), t('共 61 家，很多二三级庄性价比极高（如雄狮、碧尚男爵）')),
  p(it('💡 注意：这个分级 170 年没大改过，有些五级庄的实际品质早已超过三级庄。')),
  p(t('')),

  h2('圣爱美隆分级（右岸）'),
  p(b('Premier Grand Cru Classé A：'), t('欧颂（Ausone）、白马（Cheval Blanc）、金钟（Angélus）、柏菲（Pavie）')),
  p(b('Premier Grand Cru Classé B + Grand Cru Classé：'), t('约 60 多家')),
  p(it('💡 这个分级每 10 年修订一次，2022 年大洗牌引发争议，欧颂和白马退出评级。')),
  p(t('')),

  h2('波美侯（无官方分级）'),
  p(t('波美侯没有官方分级，但 '), b('柏图斯（Pétrus）'), t(' 和 '), b('里鹏（Le Pin）'), t(' 是公认的顶级，价格碾压大多数左岸一级庄。')),
  p(t('')), hr(),

  // 代表酒庄 Top 5
  h1('🏆 代表酒庄 Top 5'),
  p(t('')),

  h2('1. Château Lafite Rothschild（拉菲）'),
  p(b('产区：'), t('波亚克（左岸）')),
  p(b('风格：'), t('优雅内敛，香气复杂而不张扬，是波尔多「贵族气质」的代名词')),
  p(b('参考价：'), t('正牌 ¥3000-8000+（随年份波动大）')),
  p(b('入门选择：'), t('拉菲传奇波尔多（Légende）¥150-200，拉菲珍藏系列 ¥200-300')),
  p(t('')),

  h2('2. Château Margaux（玛歌）'),
  p(b('产区：'), t('玛歌（左岸）')),
  p(b('风格：'), t('波尔多最「女性化」的一级庄，丝滑、花香、极致优雅')),
  p(b('参考价：'), t('正牌 ¥2500-6000+')),
  p(b('平替思路：'), t('玛歌产区的中级庄，如 Château d\'Issan ¥300-400')),
  p(t('')),

  h2('3. Pétrus（柏图斯）'),
  p(b('产区：'), t('波美侯（右岸）')),
  p(b('风格：'), t('100% 梅洛，极致浓郁丝滑，黏土赋予的矿物质感独一无二')),
  p(b('参考价：'), t('¥25,000-50,000+（是的，你没看错）')),
  p(b('平替思路：'), t('波美侯其他酒庄，如 Château Gazin ¥500-800')),
  p(t('')),

  h2('4. Château Ducru-Beaucaillou（宝嘉龙）'),
  p(b('产区：'), t('圣朱利安（左岸）二级庄')),
  p(b('风格：'), t('公认的「超二级庄」，品质稳定逼近一级庄，性价比首选')),
  p(b('参考价：'), t('¥800-1500')),
  p(t('')),

  h2('5. Château Lynch-Bages（靓茨伯）'),
  p(b('产区：'), t('波亚克（左岸）五级庄')),
  p(b('风格：'), t('典型的五级庄升班马，浓郁奔放，波亚克性价比之王')),
  p(b('参考价：'), t('¥500-900')),
  p(t('')), hr(),

  // 必喝清单
  h1('🍷 必喝清单'),
  p(t('')),

  h2('入门 3 款（¥100-300）'),
  ol(b('Mouton Cadet Rouge'), t(' —— 木桐嘉棣，波尔多销量最大的品牌酒，¥100 左右，标准波尔多风味教科书')),
  ol(b('Château Greysac（Médoc Cru Bourgeois）'), t(' —— ¥120-150，中级庄的优秀代表，左岸经典风味')),
  ol(b('Château Tour Baladoz（Saint-Émilion Grand Cru）'), t(' —— ¥200-280，右岸入门，柔和易饮')),
  p(t('')),

  h2('进阶 2 款（¥500-1500）'),
  ol(b('Château Léoville-Las Cases'), t(' —— 雄狮，¥800-1200，「超二级庄」之首，被称为「左岸的拉图」')),
  ol(b('Château Canon（Saint-Émilion Premier Grand Cru Classé B）'), t(' —— ¥600-900，Chanel 旗下，近年品质飙升')),
  p(t('')), hr(),

  // 旅行攻略
  h1('✈️ 旅行攻略'),
  p(t('')),
  p(b('最佳时间：'), t('6 月（花期）或 9-10 月（收获季）')),
  p(b('怎么去：'), t('巴黎 TGV 高铁到波尔多 2 小时，波尔多市区有轨电车很方便')),
  p(t('')),
  p(b('必访体验：')),
  li(b('波尔多葡萄酒城（La Cité du Vin）'), t(' —— 地标建筑，互动式葡萄酒博物馆，半天可逛完')),
  li(b('梅多克骑行'), t(' —— 租自行车沿 D2 公路骑，路过拉菲、拉图、木桐，全程约 20 公里')),
  li(b('圣爱美隆小镇'), t(' —— 中世纪石头村，联合国世界遗产，镇上酒庄步行可达')),
  li(b('波美侯预约参观'), t(' —— 小产区不设游客中心，需提前邮件预约，柏图斯极难约')),
  p(t('')),
  p(b('预算参考：'), t('酒庄参观 €15-30/人，含品鉴；午餐配酒套餐 €40-80；住一晚 Airbnb 酒庄 €100-200')),
  p(t('')), hr(),

  p(t('')),
  quote(
    b('本期总结'),
    t('\n波尔多不是一个产区，而是一个宇宙。'),
    t('\n你可以花一辈子去探索它，也可以从一瓶 ¥100 的木桐嘉棣开始认识它。'),
    t('\n重要的不是从哪里开始，而是开始。'),
    t('\n\n—— 产区深度游 · 第 1 期 🗺️')
  ),
];

// ═══════════════════════════════════════════════════════════
// 系列 2: 餐酒实验室
// ═══════════════════════════════════════════════════════════

const LAB_INTRO_BLOCKS = [
  img(),
  p(t('')),
  quote(
    b('餐酒实验室 · Food & Wine Lab'),
    t('\n不是理论上「应该配什么」，而是实际吃喝后告诉你「配得怎么样」。'),
    t('\n每期一个餐酒主题，有成功有翻车，真实记录。')
  ),
  p(t('')), hr(),

  h1('📋 系列说明'),
  p(t('')),
  p(b('更新频率：'), t('每周或两周一期')),
  p(b('核心理念：'), t('配酒没有标准答案，只有「好不好吃」。所有搭配都是实测，不是照抄教科书。')),
  p(t('')),
  p(b('每期固定结构：')),
  ol(t('主题设定（今天吃什么 × 配什么酒）')),
  ol(t('选酒理由（为什么选这几款来配）')),
  ol(t('逐道配对记录（每道菜 × 每款酒的评分和体感）')),
  ol(t('最佳组合 & 翻车时刻')),
  ol(t('配酒心得（可以迁移到其他场景的经验）')),
  ol(t('花费明细（酒 + 食物的总成本）')),
  p(t('')),

  p(b('评分标准：')),
  li(b('⭐⭐⭐⭐⭐'), t(' 天作之合，互相升华')),
  li(b('⭐⭐⭐⭐'), t(' 很搭，明显加分')),
  li(b('⭐⭐⭐'), t(' 还行，不功不过')),
  li(b('⭐⭐'), t(' 有点别扭，但能喝')),
  li(b('⭐'), t(' 翻车现场，互相减分')),
  p(t('')), hr(),

  h1('📚 往期目录'),
  p(t('')),
  p(it('第一期内容已发布，更多实验即将开始……')),
  p(t('')), hr(),
  p(t('')),
  quote(t('最好的配酒，是让你忍不住再夹一口菜、再喝一口酒。🧪')),
];

// 第一期：火锅配酒
const LAB_EP01_BLOCKS = [
  img(),
  p(t('')),
  quote(
    b('餐酒实验室 · 第 1 期'),
    t('\n火锅 × 葡萄酒 —— 最不「教科书」的配酒挑战。'),
    t('\n辣锅、菌汤锅、番茄锅，分别配 6 款酒，看看谁能活着出来。')
  ),
  p(t('')), hr(),

  h1('🎯 实验设定'),
  p(t('')),
  p(b('场景：'), t('朋友聚餐，三味火锅（辣锅 / 菌汤锅 / 番茄锅）')),
  p(b('涮菜：'), t('肥牛、毛肚、鸭肠、虾滑、豆腐、土豆、茼蒿、粉丝')),
  p(b('蘸料：'), t('麻酱 + 油碟两种')),
  p(t('')),
  p(b('测试酒款（6 款）：')),
  ol(b('起泡酒：'), t('Cava Brut（西班牙卡瓦），¥80')),
  ol(b('干白：'), t('Marlborough Sauvignon Blanc（新西兰长相思），¥100')),
  ol(b('桃红：'), t('Provence Rosé（普罗旺斯桃红），¥120')),
  ol(b('轻酒体红：'), t('Beaujolais Villages（博若莱村庄级），¥90')),
  ol(b('中酒体红：'), t('Côtes du Rhône（罗讷河谷丘），¥100')),
  ol(b('重酒体红：'), t('Malbec Reserva（阿根廷马尔贝克珍藏），¥110')),
  p(t('')),
  p(b('总酒费：'), t('约 ¥600（6 瓶），人均约 ¥100-150')),
  p(t('')), hr(),

  h1('🔬 逐轮测试'),
  p(t('')),

  h2('Round 1: 辣锅'),
  p(it('测试食材：毛肚、鸭肠、肥牛（油碟蘸料）')),
  p(t('')),
  li(b('Cava 起泡酒 ⭐⭐⭐⭐'), t(' —— 气泡清爽感可以短暂缓解辣意，酸度切油碟的油腻。意外地搭！开局最佳。')),
  li(b('长相思 ⭐⭐⭐'), t(' —— 酸度够但收尾的草本感被辣味盖掉了，只剩下「冰的」这个优点。')),
  li(b('桃红 ⭐⭐⭐'), t(' —— 中规中矩，存在感不强，但也没翻车。')),
  li(b('博若莱 ⭐⭐⭐⭐'), t(' —— 果味清新，单宁几乎没有，冰镇后配辣锅出奇好喝。第二名。')),
  li(b('罗讷河谷 ⭐⭐'), t(' —— 酒精感和辣味叠加，嘴里在「烧」。不推荐。')),
  li(b('马尔贝克 ⭐'), t(' —— 翻车！高酒精 + 重单宁 + 辣椒 = 嘴唇发麻。完全互相打架。')),
  p(t('')),
  p(b('辣锅冠军：'), t('Cava 起泡酒，冰到 5°C 最佳')),
  p(t('')),

  h2('Round 2: 菌汤锅'),
  p(it('测试食材：各种菌菇、豆腐、虾滑（不蘸料，喝汤）')),
  p(t('')),
  li(b('Cava ⭐⭐⭐'), t(' —— 还是不错，但和菌菇的鲜味没有化学反应。')),
  li(b('长相思 ⭐⭐⭐⭐'), t(' —— 草本和矿物感与菌菇的泥土气息意外合拍！清爽的酸度和菌汤的浓郁互补。')),
  li(b('桃红 ⭐⭐⭐⭐'), t(' —— 比配辣锅好多了，莓果香和菌菇的复杂风味相映成趣。')),
  li(b('博若莱 ⭐⭐⭐⭐⭐'), t(' —— 本场最佳！佳美葡萄的蘑菇和泥土气息和菌汤天然同频。一口菌菇一口酒，停不下来。')),
  li(b('罗讷河谷 ⭐⭐⭐'), t(' —— 胡椒和香料感配菌菇还行，但稍显重了。')),
  li(b('马尔贝克 ⭐⭐'), t(' —— 依然太重，把菌菇的细腻鲜味全压住了。')),
  p(t('')),
  p(b('菌汤冠军：'), t('博若莱村庄级，不冰或微冰（12-14°C）')),
  p(t('')),

  h2('Round 3: 番茄锅'),
  p(it('测试食材：肥牛、虾滑、土豆、粉丝（麻酱蘸料）')),
  p(t('')),
  li(b('Cava ⭐⭐⭐⭐'), t(' —— 万金油选手，和番茄的酸度互相呼应，依然稳定。')),
  li(b('长相思 ⭐⭐⭐'), t(' —— 两个都酸，加在一起有点过了。')),
  li(b('桃红 ⭐⭐⭐⭐⭐'), t(' —— 全场最佳！桃红的莓果 + 番茄的酸甜 = 地中海式的快乐。麻酱的坚果香也和桃红很配。')),
  li(b('博若莱 ⭐⭐⭐⭐'), t(' —— 依然表现好，果味和番茄的甜度互相配合。')),
  li(b('罗讷河谷 ⭐⭐⭐⭐'), t(' —— 终于找到了主场！歌海娜的红色浆果和番茄是好朋友，胡椒感为肥牛加分。')),
  li(b('马尔贝克 ⭐⭐⭐'), t(' —— 配番茄锅里的肥牛终于不违和了，但还是觉得重。')),
  p(t('')),
  p(b('番茄锅冠军：'), t('普罗旺斯桃红，冰到 8-10°C')),
  p(t('')), hr(),

  h1('🏆 总结 & 心得'),
  p(t('')),

  h2('最终排名'),
  ol(b('博若莱村庄级'), t(' —— 火锅 MVP，三种锅底都能打。如果只带一瓶去火锅店，选它。')),
  ol(b('Cava 起泡酒'), t(' —— 万能搭配，尤其是辣锅。便宜又好用。')),
  ol(b('普罗旺斯桃红'), t(' —— 番茄锅最佳拍档，夏天火锅的不二之选。')),
  ol(b('新西兰长相思'), t(' —— 菌汤锅的惊喜发现。')),
  ol(b('罗讷河谷'), t(' —— 只适合番茄锅，其他锅底太重。')),
  ol(b('马尔贝克'), t(' —— 不适合火锅，下次带去吃烤肉。')),
  p(t('')),

  h2('配酒心得'),
  p(t('')),
  li(b('辣 = 低酒精 + 高酸 + 气泡'), t('。辣味会放大酒精的灼烧感，所以一定要选轻盈、冰凉、有酸度的。')),
  li(b('鲜 = 同频共振'), t('。菌菇的鲜味需要酒里也有相似的风味（泥土、蘑菇），博若莱就是天然匹配。')),
  li(b('酸 = 不要酸上加酸'), t('。番茄本身够酸了，配酒的酸度适中就好，桃红的平衡感最好。')),
  li(b('蘸料也很关键'), t('。油碟→需要酸度切油；麻酱→需要果味和坚果感呼应。')),
  li(b('温度比品种更重要'), t('。火锅桌上温度高，酒一定要冰够。红酒也可以冰镇！')),
  p(t('')), hr(),

  h1('💰 花费明细'),
  p(t('')),
  li(t('6 瓶酒：约 ¥600')),
  li(t('火锅（4 人份含锅底涮菜）：约 ¥400')),
  li(t('总计：约 ¥1000，4 人分摊 ¥250/人')),
  p(t('')),
  p(it('💡 性价比之选：如果预算有限，只买博若莱 + Cava 两瓶（¥170），够 4 个人喝，人均加 ¥40。')),
  p(t('')), hr(),

  p(t('')),
  quote(
    b('本期结论'),
    t('\n火锅配葡萄酒完全可行，关键是「轻、冰、酸」三字诀。'),
    t('\n忘掉那些「红酒配红肉」的教条吧——'),
    t('\n在热气腾腾的火锅面前，一杯冰镇的博若莱比什么拉菲都香。'),
    t('\n\n—— 餐酒实验室 · 第 1 期 🧪')
  ),
];

// ═══════════════════════════════════════════════════════════
// 系列 3: 酒友问答
// ═══════════════════════════════════════════════════════════

const QA_INTRO_BLOCKS = [
  img(),
  p(t('')),
  quote(
    b('酒友问答 · Wine Q&A'),
    t('\n收集真实的葡萄酒困惑，给出不装的回答。'),
    t('\n没有「你应该知道」的潜台词，每个问题都值得好好聊聊。')
  ),
  p(t('')), hr(),

  h1('📋 系列说明'),
  p(t('')),
  p(b('更新频率：'), t('每周一期，每期 5-8 个问题')),
  p(b('问题来源：'), t('真实用户提问、社交媒体高频话题、饭局上最常被问到的问题')),
  p(t('')),
  p(b('回答风格：')),
  li(t('不说废话，直接给答案')),
  li(t('给答案的同时解释原理（但不掉书袋）')),
  li(t('承认「不确定」和「见仁见智」的灰色地带')),
  li(t('配实用建议，不是只告诉你 why，还告诉你 how')),
  p(t('')), hr(),

  h1('📚 往期目录'),
  p(t('')),
  p(it('第一期内容已发布，更多问答即将上线……')),
  p(t('')), hr(),
  p(t('')),
  quote(t('没有愚蠢的问题，只有装懂的回答。❓')),
];

// 第一期：最常见的 8 个问题
const QA_EP01_BLOCKS = [
  img(),
  p(t('')),
  quote(
    b('酒友问答 · 第 1 期'),
    t('\n8 个被问到最多的葡萄酒问题。'),
    t('\n从「红酒要不要醒」到「挂杯说明酒好吗」，一次说清楚。')
  ),
  p(t('')), hr(),

  // Q1
  h1('Q1：红酒都需要醒酒吗？'),
  p(t('')),
  p(b('简短回答：'), t('不是。大部分红酒不需要醒。')),
  p(t('')),
  p(b('详细解释：')),
  p(t('只有这几种情况需要醒酒：')),
  li(b('年轻的高单宁红酒'), t('（如波尔多列级庄、巴罗洛、纳帕赤霞珠）—— 醒 30-60 分钟，让单宁柔化')),
  li(b('有沉淀的老酒'), t('（10 年以上）—— 但只需要「换瓶」去沉淀，不需要大面积接触空气。老酒醒太久反而会氧化崩掉')),
  p(t('')),
  p(t('以下情况'), b('不需要'), t('醒酒：')),
  li(t('¥200 以下的日常红酒 —— 开瓶直接喝最好')),
  li(t('博若莱、黑皮诺等轻酒体红 —— 醒了反而失去新鲜果味')),
  li(t('所有白葡萄酒和桃红 —— 直接冰镇开喝')),
  li(t('起泡酒 —— 醒了气泡就没了（这不是笑话，真有人这么干）')),
  p(t('')),
  p(b('实用建议：'), t('不确定要不要醒？先倒一杯尝尝。如果觉得「有点紧」「涩」「闷」，那就醒。如果已经好喝了，别画蛇添足。')),
  p(t('')), hr(),

  // Q2
  h1('Q2：挂杯越多说明酒越好？'),
  p(t('')),
  p(b('简短回答：'), t('不是。挂杯只能说明酒精度高或残糖高，和品质无关。')),
  p(t('')),
  p(b('详细解释：')),
  p(t('挂杯（又叫「酒泪」「酒腿」）是 '), b('Marangoni 效应'), t('：酒精蒸发速度比水快，杯壁上酒精蒸发后表面张力增大，酒液被「拉」上去形成液柱。')),
  p(t('')),
  p(t('所以挂杯明显只说明两件事：')),
  ol(t('酒精度高（14% 以上的酒挂杯都明显）')),
  ol(t('残糖高（甜酒也容易挂杯）')),
  p(t('')),
  p(t('一瓶 ¥30 的高酒精度餐酒可以比一瓶 ¥3000 的勃艮第挂杯更多。用挂杯判断品质，就像用车的重量判断车好不好一样荒谬。')),
  p(t('')),
  p(b('下次怎么办：'), t('有人在饭局上转杯看挂杯，点头说「好酒好酒」的时候……就让他说吧，别拆穿。😊')),
  p(t('')), hr(),

  // Q3
  h1('Q3：葡萄酒越贵越好喝吗？'),
  p(t('')),
  p(b('简短回答：'), t('到 ¥200 之前基本是。超过 ¥200，就不一定了。')),
  p(t('')),
  p(b('详细解释：')),
  p(t('¥50 和 ¥150 的酒有明显品质差距（葡萄来源、酿造工艺、橡木桶使用都不同）。但 ¥500 和 ¥5000 的差距？大部分人盲品分不出来。')),
  p(t('')),
  p(t('贵酒贵在哪？')),
  li(b('品牌溢价'), t(' —— 拉菲的名字值一半的钱')),
  li(b('稀缺性'), t(' —— 产量小自然贵（如勃艮第特级园）')),
  li(b('陈年潜力'), t(' —— 你买的不只是一瓶酒，是 20 年后的体验')),
  li(b('风土表达'), t(' —— 顶级酒追求的不是「好喝」而是「独特」')),
  p(t('')),
  p(b('实用建议：'), t('日常喝酒，¥100-300 区间性价比最高。想探索和学习，偶尔开一瓶 ¥500+ 的感受差距。至于 ¥5000 以上……等你有了自己的判断标准再考虑。')),
  p(t('')), hr(),

  // Q4
  h1('Q4：开了没喝完怎么保存？'),
  p(t('')),
  p(b('简短回答：'), t('塞回去，放冰箱，3 天内喝完。')),
  p(t('')),
  p(b('详细解释：')),
  p(t('开瓶后葡萄酒最大的敌人是'), b('氧化'), t('。具体保鲜时间：')),
  li(b('起泡酒'), t(' —— 当天喝完。即使有起泡酒瓶塞，第二天气泡也会明显减少')),
  li(b('白葡萄酒/桃红'), t(' —— 冰箱保存 2-3 天')),
  li(b('轻酒体红酒'), t(' —— 冰箱保存 2-3 天（喝之前提前拿出来回温 15 分钟）')),
  li(b('重酒体红酒'), t(' —— 室温阴凉处或冰箱 3-5 天（高单宁的酒抗氧化能力更强）')),
  li(b('加强酒（波特、雪莉）'), t(' —— 1-4 周都没问题')),
  p(t('')),
  p(b('保鲜神器：')),
  li(b('真空抽气塞（¥30-50）'), t(' —— 性价比最高的方案，抽掉瓶内空气延缓氧化')),
  li(b('惰性气体喷雾（¥100-200）'), t(' —— 喷入氩气/氮气覆盖酒面，专业侍酒师都用这个')),
  li(b('Coravin 取酒器（¥2000+）'), t(' —— 用针穿过软木塞取酒，不拔塞，可以保存数月。土豪方案。')),
  p(t('')), hr(),

  // Q5
  h1('Q5：软木塞和螺旋盖哪个好？'),
  p(t('')),
  p(b('简短回答：'), t('螺旋盖不代表酒差。大部分情况下螺旋盖更靠谱。')),
  p(t('')),
  p(b('详细解释：')),
  p(t('软木塞有个致命问题：'), b('TCA 污染'), t('（俗称「木塞味」），概率约 3-5%。就是说每开 20 瓶用软木塞的酒，可能有 1 瓶是坏的。闻起来像湿纸板或发霉地下室。')),
  p(t('')),
  p(t('螺旋盖的优势：')),
  li(t('零 TCA 风险')),
  li(t('密封性更好，酒质更稳定')),
  li(t('方便开启，不需要开瓶器')),
  li(t('新西兰、澳大利亚 90% 以上的酒用螺旋盖，包括顶级酒')),
  p(t('')),
  p(t('软木塞的优势：')),
  li(t('适合需要长期陈年（20 年+）的酒，微量透氧有助于缓慢演化')),
  li(t('仪式感（开瓶的「噗」一声确实很爽）')),
  p(t('')),
  p(b('结论：'), t('¥300 以下、打算 5 年内喝掉的酒，螺旋盖更好。需要长期陈年的高端酒，软木塞有它的意义。')),
  p(t('')), hr(),

  // Q6
  h1('Q6：年份越老越好吗？'),
  p(t('')),
  p(b('简短回答：'), t('绝对不是。大部分酒应该在 1-5 年内喝掉。')),
  p(t('')),
  p(b('详细解释：')),
  p(t('全世界 90% 以上的葡萄酒，设计出来就是让你'), b('买了尽快喝'), t('的。只有不到 5% 的酒有陈年潜力，不到 1% 的酒'), b('需要'), t('陈年才好喝。')),
  p(t('')),
  p(t('能陈年的酒需要满足：')),
  li(t('高单宁（赤霞珠、内比奥罗、丹魄）')),
  li(t('高酸度')),
  li(t('浓郁的风味物质')),
  li(t('好的年份和好的酿造')),
  p(t('')),
  p(t('不该陈年的酒放久了会怎样？果味消失，酸度变尖锐，颜色变棕，最后变成醋。')),
  p(t('')),
  p(b('实用建议：'), t('超市买的 ¥200 以下的酒，看到年份就买最新的。2023 年产的就买 2023，别刻意找「老年份」。')),
  p(t('')), hr(),

  // Q7
  h1('Q7：红酒加雪碧/可乐可以吗？'),
  p(t('')),
  p(b('简短回答：'), t('你的酒，你爱怎么喝怎么喝。但从品鉴角度来说，不建议。')),
  p(t('')),
  p(b('详细解释：')),
  p(t('加雪碧/可乐会带来几个问题：')),
  li(t('糖分完全掩盖了酒本身的风味层次')),
  li(t('碳酸加速酒精吸收，更容易上头')),
  li(t('如果是好酒，这个操作相当于往牛排上浇番茄酱——能吃，但可惜了')),
  p(t('')),
  p(t('但话说回来：')),
  li(t('如果你真的不喜欢红酒的涩味，加点确实更好入口')),
  li(t('西班牙人的 Sangria（桑格利亚）本质上就是红酒 + 水果 + 糖 + 气泡水')),
  li(t('日本流行的「红酒 highball」也是红酒加苏打水')),
  p(t('')),
  p(b('建议：'), t('与其加雪碧「拯救」一瓶你不喜欢的红酒，不如直接换一瓶你喜欢的。可能你只是还没遇到对的酒。试试莫斯卡托（甜的）、博若莱新酒（几乎不涩）、或者干脆喝桃红。')),
  p(t('')), hr(),

  // Q8
  h1('Q8：为什么同一款酒每次喝感觉不一样？'),
  p(t('')),
  p(b('简短回答：'), t('因为影响口感的变量太多了，不只是酒本身。')),
  p(t('')),
  p(b('主要变量：')),
  ol(b('温度'), t(' —— 同一款酒 12°C 和 22°C 喝起来差别巨大。太冷：果味封闭。太热：酒精冲鼻。')),
  ol(b('杯子'), t(' —— 纸杯、马克杯、专业酒杯，同一款酒的表现完全不同（主要影响闻香）')),
  ol(b('食物'), t(' —— 刚吃了辣/甜/咸的东西再喝酒，感受会变')),
  ol(b('你的身体状态'), t(' —— 感冒、疲劳、情绪低落都会影响味觉和嗅觉')),
  ol(b('开瓶时间'), t(' —— 第一杯和第三杯可能就不一样，酒在杯中也在变化')),
  ol(b('储存条件'), t(' —— 光照、温度波动、震动都会影响酒的状态')),
  ol(b('瓶差'), t(' —— 即使同一款酒同一年份，不同瓶之间也可能有微小差异')),
  p(t('')),
  p(b('所以：'), t('下次觉得「这酒上次喝更好喝啊」的时候，先别怪酒。想想今天的温度、杯子、吃了什么、心情怎么样。葡萄酒是一个「系统工程」。')),
  p(t('')), hr(),

  p(t('')),
  quote(
    b('本期总结'),
    t('\n葡萄酒的世界不需要权威和教条。'),
    t('\n你的舌头就是最好的评委，你的快乐就是唯一的标准。'),
    t('\n有问题随时问，没有蠢问题。'),
    t('\n\n—— 酒友问答 · 第 1 期 ❓')
  ),
];

// ═══════════════════════════════════════════════════════════
// 系列 4: 节日专题
// ═══════════════════════════════════════════════════════════

const SEASONAL_INTRO_BLOCKS = [
  img(),
  p(t('')),
  quote(
    b('节日专题 · Seasonal Specials'),
    t('\n不同季节、不同节日，该喝什么酒？怎么选、怎么配、怎么送？'),
    t('\n时令性内容，应景又实用。')
  ),
  p(t('')), hr(),

  h1('📋 系列说明'),
  p(t('')),
  p(b('更新频率：'), t('跟随节日和季节，全年约 10-12 期')),
  p(t('')),
  p(b('内容覆盖：')),
  li(b('传统节日'), t(' —— 春节、中秋、端午')),
  li(b('西方节日'), t(' —— 情人节、圣诞节、感恩节')),
  li(b('季节主题'), t(' —— 春日野餐、夏日消暑、秋日暖饮、冬日围炉')),
  li(b('特殊场景'), t(' —— 毕业季、婚礼季、年终聚会')),
  p(t('')),
  p(b('每期固定结构：')),
  ol(t('节日/季节特点分析')),
  ol(t('选酒思路和推荐（分预算档位）')),
  ol(t('配餐/配场景建议')),
  ol(t('送礼包装和话术（如果是送礼场景）')),
  ol(t('避坑提醒')),
  p(t('')), hr(),

  h1('📚 往期目录'),
  p(t('')),
  p(it('第一期内容已发布，更多专题将随节日更新……')),
  p(t('')), hr(),
  p(t('')),
  quote(t('好酒配好时节，每个季节都值得一杯。📅')),
];

// 第一期：春日野餐配酒指南
const SEASONAL_EP01_BLOCKS = [
  img(),
  p(t('')),
  quote(
    b('节日专题 · 第 1 期'),
    t('\n春天来了，是时候带上酒出去浪了。'),
    t('\n一篇搞定春日野餐的选酒、配食和装备。')
  ),
  p(t('')), hr(),

  h1('🌸 为什么春天要野餐配酒？'),
  p(t('')),
  p(t('冬天缩在家里喝了太多厚重的红酒，春天就该喝点轻快明亮的东西。户外阳光、微风、绿地，再加上一杯冰凉的酒——这是葡萄酒最好的「品鉴环境」。')),
  p(t('')),
  p(b('春日选酒三原则：')),
  ol(b('轻盈'), t(' —— 别带重单宁的赤霞珠了，在户外喝着累')),
  ol(b('冰凉'), t(' —— 气温回升，酒要有清爽感')),
  ol(b('便携'), t(' —— 螺旋盖优先，别到了草地发现忘带开瓶器')),
  p(t('')), hr(),

  h1('🍷 推荐酒款（按预算）'),
  p(t('')),

  h2('💰 经济之选（¥50-100/瓶）'),
  p(t('')),
  ol(b('Vinho Verde（葡萄牙绿酒）¥50-70'), t('\n微气泡、低酒精（9-11%）、柑橘清新。天生为户外而生的酒。螺旋盖常见。')),
  ol(b('Moscato d\'Asti（意大利莫斯卡托）¥60-90'), t('\n微甜微泡，蜜桃和白花香气，酒精度只有 5-6%。连不喝酒的朋友都会喜欢。')),
  ol(b('Côtes de Provence Rosé（普罗旺斯桃红）¥80-100'), t('\n浅粉色，草莓和西柚风味，骨干干爽。颜值即正义，拍照特别好看。')),
  p(t('')),

  h2('💰💰 品质之选（¥100-200/瓶）'),
  p(t('')),
  ol(b('Sancerre（桑塞尔长相思）¥150-200'), t('\n卢瓦尔河谷的标杆白，矿物感和柑橘交织，酸度明亮。配海鲜三明治绝了。')),
  ol(b('Chablis（夏布利）¥130-180'), t('\n勃艮第最北的产区，纯净矿物感的霞多丽，不过桶，清冽如泉水。')),
  ol(b('Grüner Veltliner（奥地利绿维特利纳）¥100-150'), t('\n白胡椒和青苹果风味，酸度活泼，最被低估的野餐白。')),
  p(t('')),

  h2('💰💰💰 仪式感之选（¥200-400/瓶）'),
  p(t('')),
  ol(b('Champagne Brut NV（无年份香槟）¥200-350'), t('\n野餐的终极仪式感。在草地上开一瓶香槟，幸福感直接拉满。推荐酩悦、凯歌、巴黎之花。')),
  ol(b('Etna Rosato（西西里埃特纳火山桃红）¥200-300'), t('\n火山土壤赋予的矿物感和酸度，比普罗旺斯桃红更有深度。懂酒的朋友会impressed。')),
  p(t('')), hr(),

  h1('🧺 配食建议'),
  p(t('')),
  p(b('野餐食物选择原则：'), t('便携、不需加热、手拿方便、味道互补')),
  p(t('')),

  h2('经典搭配组合'),
  p(t('')),
  li(b('绿酒/莫斯卡托 + 水果拼盘'), t('\n草莓、蓝莓、葡萄、切片橙子。简单直接的甜蜜搭配。')),
  p(t('')),
  li(b('桃红 + 法棍三明治'), t('\n火腿+芝士+生菜的经典法棍，桃红的酸度刚好解油腻。')),
  p(t('')),
  li(b('长相思/夏布利 + 海鲜冷盘'), t('\n烟熏三文鱼、虾仁、蟹肉棒。白酒的矿物感和海鲜是天生一对。')),
  p(t('')),
  li(b('香槟 + 一切'), t('\n香槟是万能搭配王。薯片、寿司、炸鸡、甚至麦当劳——香槟都能hold住。')),
  p(t('')),

  h2('中式野餐搭配'),
  p(t('')),
  li(b('桃红/绿酒 + 卤味拼盘'), t('\n卤鸡爪、鸭脖、毛豆，配冰凉的桃红或绿酒，比啤酒更有格调。')),
  li(b('莫斯卡托 + 糕点'), t('\n绿豆糕、桂花糕、蛋黄酥，微甜酒配中式点心很和谐。')),
  li(b('香槟 + 寿司外卖'), t('\n在草地上吃寿司喝香槟，日法混搭的浪漫。')),
  p(t('')), hr(),

  h1('🎒 野餐装备清单'),
  p(t('')),
  p(b('必备：')),
  li(t('保温袋 + 冰袋（酒一定要冰！户外温度会让酒迅速变温）')),
  li(t('开瓶器（如果带了软木塞的酒）—— 或者干脆只带螺旋盖的')),
  li(t('塑料酒杯或硅胶酒杯（别带玻璃杯去草地，碎了危险）')),
  li(t('野餐垫')),
  li(t('纸巾/湿巾（红酒洒了很难搞）')),
  p(t('')),
  p(b('加分项：')),
  li(t('蓝牙音箱（但请把音量控制在不打扰别人的程度）')),
  li(t('鲜花一束（和桃红放一起拍照，朋友圈点赞翻倍）')),
  li(t('奶酪刀 + 小砧板（如果带了奶酪和火腿）')),
  p(t('')), hr(),

  h1('⚠️ 避坑提醒'),
  p(t('')),
  li(b('别带需要醒酒的酒'), t(' —— 户外没有那个条件，也没那个耐心')),
  li(b('别带太贵的酒'), t(' —— 户外环境（温度、风、虫子）不是品鉴的理想条件，¥500 的酒在草地上喝和 ¥150 的差别不大')),
  li(b('别带整箱酒'), t(' —— 2-3 瓶足够 4 个人喝。喝太多你就走不回去了')),
  li(b('注意防晒'), t(' —— 不是说酒，是说你。喝着喝着忘了涂防晒霜是常有的事')),
  li(b('确认场地可以饮酒'), t(' —— 有些公园不允许，被保安赶走就尴尬了')),
  p(t('')), hr(),

  h1('💰 预算方案'),
  p(t('')),

  h2('方案 A：极简版（4 人 ¥200 以内）'),
  li(t('1 瓶绿酒（¥60）+ 1 瓶桃红（¥90）')),
  li(t('水果 + 面包 + 卤味（¥50）')),
  li(t('人均 ¥50')),
  p(t('')),

  h2('方案 B：精致版（4 人 ¥500 左右）'),
  li(t('1 瓶夏布利（¥150）+ 1 瓶桃红（¥100）+ 1 瓶莫斯卡托（¥70）')),
  li(t('三明治 + 奶酪 + 水果 + 甜点（¥150）')),
  li(t('人均 ¥120')),
  p(t('')),

  h2('方案 C：仪式感版（4 人 ¥800 左右）'),
  li(t('1 瓶香槟（¥300）+ 1 瓶桑塞尔（¥180）+ 1 瓶火山桃红（¥250）')),
  li(t('寿司外卖 + 烟熏三文鱼 + 奶酪拼盘（¥200）')),
  li(t('人均 ¥200，但朋友圈质量翻三倍')),
  p(t('')), hr(),

  p(t('')),
  quote(
    b('本期总结'),
    t('\n春日野餐不需要多贵的酒，'),
    t('\n需要的是对的酒、对的温度、对的人。'),
    t('\n一瓶冰凉的绿酒，一块野餐垫，一片绿地——'),
    t('\n这就是春天最好的味道。'),
    t('\n\n—— 节日专题 · 第 1 期 📅')
  ),
];

// ─── 图片 URL ──────────────────────────────────────────────

const IMAGES: Record<string, string> = {
  region_intro: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80', // 葡萄园
  region_ep01: 'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=1200&q=80', // 波尔多城堡
  lab_intro: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', // 餐桌配酒
  lab_ep01: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=1200&q=80', // 火锅
  qa_intro: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=1200&q=80', // 酒杯特写
  qa_ep01: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=80', // 品酒
  seasonal_intro: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=1200&q=80', // 户外
  seasonal_ep01: 'https://images.unsplash.com/photo-1526142684086-7ebd69df27a5?w=1200&q=80', // 野餐
};

// ─── 主流程 ──────────────────────────────────────────────

interface PageDef {
  parentNode: string;
  title: string;
  blocks: any[];
  coverKey: string;
}

async function createPage(token: string, def: PageDef): Promise<{ nodeToken: string; objToken: string } | null> {
  console.log(`\n创建: ${def.title}`);
  const nodeRes = curlApi('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, token, {
    obj_type: 'docx', node_type: 'origin', parent_node_token: def.parentNode, title: def.title,
  });
  if (nodeRes.code !== 0) {
    console.error(`  失败: ${nodeRes.msg} (${nodeRes.code})`);
    return null;
  }
  const nodeToken = nodeRes.data.node.node_token;
  const objToken = nodeRes.data.node.obj_token;
  console.log(`  node: ${nodeToken}, obj: ${objToken}`);
  await new Promise(r => setTimeout(r, 500));

  // 写 blocks
  const chunkSize = 30;
  let firstImgBlockId = '';
  for (let j = 0; j < def.blocks.length; j += chunkSize) {
    const chunk = def.blocks.slice(j, j + chunkSize);
    const res = curlApi('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, token, { children: chunk });
    if (res.code !== 0) {
      console.error(`    blocks ${j}-${j + chunk.length} 失败: ${res.msg}`);
    } else {
      console.log(`    blocks ${j + 1}-${j + chunk.length} ✓`);
      if (j === 0 && res.data?.children?.[0]) firstImgBlockId = res.data.children[0].block_id;
    }
    if (j + chunkSize < def.blocks.length) await new Promise(r => setTimeout(r, 300));
  }

  // 上传图片
  const imgUrl = IMAGES[def.coverKey];
  if (firstImgBlockId && imgUrl) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        console.log('  上传封面...');
        const buf = await downloadImage(imgUrl);
        const ok = uploadAndPatch(token, objToken, firstImgBlockId, buf, `${def.coverKey}.jpg`);
        console.log(ok ? '    封面 ✓' : '    封面 PATCH 失败');
        break;
      } catch (err: any) {
        if (attempt < 4) { console.log(`    重试 (${attempt + 1}/5)`); await new Promise(r => setTimeout(r, 2000)); }
        else console.error(`    封面失败: ${err.message}`);
      }
    }
  }

  return { nodeToken, objToken };
}

async function main() {
  console.log('🍷 葡萄酒知识库 - 创建 4 个持续更新系列\n');

  const userTokenFile = path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json');
  const tokenData = JSON.parse(fs.readFileSync(userTokenFile, 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) {
    console.error('Token 过期！请先运行: cd ~/startup-7steps && NODE_TLS_REJECT_UNAUTHORIZED=0 node feishu-auth.js');
    return;
  }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  const results: Record<string, { nodeToken: string; objToken: string }> = {};

  // ── 系列 1: 产区深度游 ──
  const region = await createPage(token, { parentNode: PARENT_NODE, title: '🗺️ 产区深度游', blocks: REGION_INTRO_BLOCKS, coverKey: 'region_intro' });
  if (!region) return;
  results['region'] = region;
  await new Promise(r => setTimeout(r, 500));

  const regionEp01 = await createPage(token, { parentNode: region.nodeToken, title: '第 1 期：波尔多 —— 葡萄酒世界的宇宙中心', blocks: REGION_EP01_BLOCKS, coverKey: 'region_ep01' });
  if (regionEp01) results['region_ep01'] = regionEp01;
  await new Promise(r => setTimeout(r, 500));

  // ── 系列 2: 餐酒实验室 ──
  const lab = await createPage(token, { parentNode: PARENT_NODE, title: '🧪 餐酒实验室', blocks: LAB_INTRO_BLOCKS, coverKey: 'lab_intro' });
  if (!lab) return;
  results['lab'] = lab;
  await new Promise(r => setTimeout(r, 500));

  const labEp01 = await createPage(token, { parentNode: lab.nodeToken, title: '第 1 期：火锅配酒大挑战 —— 6 款酒 × 3 种锅底', blocks: LAB_EP01_BLOCKS, coverKey: 'lab_ep01' });
  if (labEp01) results['lab_ep01'] = labEp01;
  await new Promise(r => setTimeout(r, 500));

  // ── 系列 3: 酒友问答 ──
  const qa = await createPage(token, { parentNode: PARENT_NODE, title: '❓ 酒友问答', blocks: QA_INTRO_BLOCKS, coverKey: 'qa_intro' });
  if (!qa) return;
  results['qa'] = qa;
  await new Promise(r => setTimeout(r, 500));

  const qaEp01 = await createPage(token, { parentNode: qa.nodeToken, title: '第 1 期：8 个最常见的葡萄酒问题', blocks: QA_EP01_BLOCKS, coverKey: 'qa_ep01' });
  if (qaEp01) results['qa_ep01'] = qaEp01;
  await new Promise(r => setTimeout(r, 500));

  // ── 系列 4: 节日专题 ──
  const seasonal = await createPage(token, { parentNode: PARENT_NODE, title: '📅 节日专题', blocks: SEASONAL_INTRO_BLOCKS, coverKey: 'seasonal_intro' });
  if (!seasonal) return;
  results['seasonal'] = seasonal;
  await new Promise(r => setTimeout(r, 500));

  const seasonalEp01 = await createPage(token, { parentNode: seasonal.nodeToken, title: '第 1 期：春日野餐配酒完全指南', blocks: SEASONAL_EP01_BLOCKS, coverKey: 'seasonal_ep01' });
  if (seasonalEp01) results['seasonal_ep01'] = seasonalEp01;
  await new Promise(r => setTimeout(r, 500));

  // ── 更新 Homepage ──
  console.log('\n\n更新 Homepage 导航...');
  const homepageBlocks: any[] = [];

  const seriesNav = [
    { name: '产区深度游', key: 'region', desc: '每期深入一个产区，风土、历史、酒庄、必喝清单', epKey: 'region_ep01', epName: '第 1 期：波尔多' },
    { name: '餐酒实验室', key: 'lab', desc: '实际配餐测试，有成功有翻车，真实记录', epKey: 'lab_ep01', epName: '第 1 期：火锅配酒' },
    { name: '酒友问答', key: 'qa', desc: '真实葡萄酒困惑，不装的回答', epKey: 'qa_ep01', epName: '第 1 期：8 个最常见问题' },
    { name: '节日专题', key: 'seasonal', desc: '应季应景的选酒、配餐、送礼指南', epKey: 'seasonal_ep01', epName: '第 1 期：春日野餐配酒' },
  ];

  for (const s of seriesNav) {
    const node = results[s.key];
    const ep = results[s.epKey];
    if (!node) continue;

    homepageBlocks.push(
      { block_type: 12, bullet: { elements: [
        { text_run: { content: s.name, text_element_style: { bold: true, link: { url: `https://hcn2vc1r2jus.feishu.cn/wiki/${node.nodeToken}` } } } },
        t(` —— ${s.desc}`),
      ], style: {} } },
    );
    if (ep) {
      homepageBlocks.push(
        { block_type: 12, bullet: { elements: [
          t('  └ '),
          { text_run: { content: s.epName, text_element_style: { bold: true, link: { url: `https://hcn2vc1r2jus.feishu.cn/wiki/${ep.nodeToken}` } } } },
        ], style: {} } },
      );
    }
  }

  homepageBlocks.push(p(t('')), hr());

  const addRes = curlApi('POST',
    `/open-apis/docx/v1/documents/${HOMEPAGE_DOC}/blocks/${HOMEPAGE_DOC}/children`,
    token,
    { children: homepageBlocks }
  );
  console.log(addRes.code === 0 ? '  Homepage 更新 ✓' : `  Homepage 更新失败: ${addRes.msg}`);

  // ── 输出总结 ──
  console.log('\n\n' + '═'.repeat(60));
  console.log('✅ 4 个系列全部创建完成！\n');

  const summary = [
    ['🗺️ 产区深度游', results['region']?.nodeToken],
    ['  └ 第 1 期：波尔多', results['region_ep01']?.nodeToken],
    ['🧪 餐酒实验室', results['lab']?.nodeToken],
    ['  └ 第 1 期：火锅配酒', results['lab_ep01']?.nodeToken],
    ['❓ 酒友问答', results['qa']?.nodeToken],
    ['  └ 第 1 期：8 个常见问题', results['qa_ep01']?.nodeToken],
    ['📅 节日专题', results['seasonal']?.nodeToken],
    ['  └ 第 1 期：春日野餐配酒', results['seasonal_ep01']?.nodeToken],
  ];
  for (const [name, nt] of summary) {
    if (nt) console.log(`${name}: https://hcn2vc1r2jus.feishu.cn/wiki/${nt}`);
  }
  console.log(`\nHomepage: https://hcn2vc1r2jus.feishu.cn/wiki/${PARENT_NODE}`);
}

main().catch(err => { console.error('错误:', err.message ?? err); process.exit(1); });
