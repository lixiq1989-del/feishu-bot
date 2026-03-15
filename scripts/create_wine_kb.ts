/**
 * 葡萄酒知识库 - 飞书文档自动创建（含配图）
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/create_wine_kb.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

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

// 全部用 curl 调 API，避免 node TLS 不稳定问题

// ─── 飞书 Docx Block 工厂函数 ─────────────────────────────────────

type TextStyle = { bold?: boolean; italic?: boolean; inline_code?: boolean };

function textElement(content: string, style?: TextStyle) {
  return { text_run: { content, text_element_style: style ?? {} } };
}
function boldElement(content: string) {
  return textElement(content, { bold: true });
}
function italicElement(content: string) {
  return textElement(content, { italic: true });
}
function paragraph(...elements: any[]) {
  return { block_type: 2, text: { elements, style: {} } };
}
function h1(text: string) {
  return { block_type: 3, heading1: { elements: [textElement(text)], style: {} } };
}
function h2(text: string) {
  return { block_type: 4, heading2: { elements: [textElement(text)], style: {} } };
}
function h3(text: string) {
  return { block_type: 5, heading3: { elements: [textElement(text)], style: {} } };
}
function bullet(...elements: any[]) {
  return { block_type: 12, bullet: { elements, style: {} } };
}
function ordered(...elements: any[]) {
  return { block_type: 13, ordered: { elements, style: {} } };
}
function divider() {
  return { block_type: 22, divider: {} };
}
function quote(...elements: any[]) {
  return { block_type: 15, quote: { elements, style: {} } };
}
// 空 image block 占位符，后续通过 upload 填充
function imageBlock(key: string) {
  return { block_type: 27, image: {}, __image_key: key } as any;
}

// ─── 图片下载 & 上传 ──────────────────────────────────────────────

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = (u: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : require('http');
      mod.get(u, { rejectUnauthorized: false }, (res: any) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, redirects + 1);
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    get(url);
  });
}

// 获取 tenant access token (用 curl 避免 node TLS 问题)
function getTenantToken(): string {
  const { execSync } = require('child_process');
  const body = JSON.stringify({ app_id: process.env.FEISHU_APP_ID, app_secret: process.env.FEISHU_APP_SECRET });
  const tmpFile = '/tmp/feishu_auth_body.json';
  fs.writeFileSync(tmpFile, body);
  for (let i = 0; i < 5; i++) {
    try {
      const result = execSync(
        `curl -sk --retry 3 --retry-delay 2 -X POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal -H "Content-Type: application/json" -d @${tmpFile}`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000 }
      );
      const json = JSON.parse(result);
      if (json.code === 0) return json.tenant_access_token;
      throw new Error(json.msg);
    } catch (err: any) {
      if (i < 4) { console.log(`  token 获取重试 (${i + 1}/5)...`); execSync('sleep 3'); }
      else throw err;
    }
  }
  throw new Error('Failed to get token');
}

// curl 封装：用 curl 做 API 请求，带重试
function curlApi(method: string, apiPath: string, token: string, body?: any): any {
  const { execSync } = require('child_process');
  let cmd = `curl -sk --retry 3 --retry-delay 2 -X ${method} "https://open.feishu.cn${apiPath}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`;
  const tmpFile = body ? `/tmp/feishu_body_${Date.now()}.json` : '';
  if (body) {
    fs.writeFileSync(tmpFile, JSON.stringify(body));
    cmd += ` -d @${tmpFile}`;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 });
      return JSON.parse(result);
    } catch (err: any) {
      if (attempt < 4) {
        console.log(`  curl 重试 (${attempt + 1}/5)...`);
        execSync('sleep 3');
      } else throw err;
    }
  }
}

function uploadImageToBlock(token: string, docId: string, imageBuffer: Buffer, fileName: string): string {
  const { execSync } = require('child_process');
  const tmpFile = `/tmp/wine_img_${Date.now()}.jpg`;
  fs.writeFileSync(tmpFile, imageBuffer);
  const result = execSync(
    `curl -sk --retry 3 --retry-delay 2 -X POST "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all" ` +
    `-H "Authorization: Bearer ${token}" ` +
    `-F "file_name=${fileName}" ` +
    `-F "parent_type=docx_image" ` +
    `-F "parent_node=${docId}" ` +
    `-F "size=${imageBuffer.length}" ` +
    `-F "file=@${tmpFile};type=image/jpeg"`,
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000 }
  );
  try { fs.unlinkSync(tmpFile); } catch {}
  const json = JSON.parse(result);
  if (json.code === 0) return json.data.file_token;
  throw new Error(json.msg || `Upload failed: code ${json.code}`);
}

// ─── 配图 URL 列表（Unsplash 免费图片）─────────────────────────────

const IMAGES: Record<string, string> = {
  'cover': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80',        // 红酒杯
  'basics': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80',       // 品酒
  'red': 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=1200&q=80',          // 红葡萄酒
  'white': 'https://images.unsplash.com/photo-1566995541428-f2246c17cda1?w=1200&q=80',        // 白葡萄酒
  'sparkling': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&q=80',       // 香槟
  'winery': 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=80',          // 酒庄葡萄园
  'pairing': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',      // 餐酒搭配
  'scene': 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=1200&q=80',        // 社交场景
  'recommend': 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=1200&q=80',       // 酒架
};

// ─── 知识库内容 ──────────────────────────────────────────────────

function buildBlocks(): any[] {
  const img = (key: string) => imageBlock(key);

  const blocks: any[] = [

    // ══════════════════════════════════════════
    // 封面 & 导读
    // ══════════════════════════════════════════
    h1('🍷 葡萄酒完全指南'),
    paragraph(
      boldElement('写给不懂酒但想喝好酒的你'),
      textElement(' —— 从入门到会选、会配、会聊')
    ),
    img('cover'),
    paragraph(textElement('')),
    quote(
      textElement('葡萄酒没有那么复杂。你不需要考证、不需要背产区、不需要装腔作势。'),
      textElement('\n这份指南帮你搞懂最核心的知识，'),
      boldElement('让你在任何场合都能自信地选酒、配酒、聊酒。')
    ),
    divider(),

    // ══════════════════════════════════════════
    // 第一章：基础知识
    // ══════════════════════════════════════════
    h1('一、葡萄酒基础知识 —— 读懂酒标的 5 个关键词'),
    img('basics'),
    paragraph(textElement('')),
    paragraph(textElement('每瓶酒的性格，可以用这 5 个维度来描述。搞懂它们，你就能"读懂"一瓶酒。')),
    paragraph(textElement('')),

    h2('1. 酒体（Body）—— 酒的"重量感"'),
    paragraph(
      textElement('就像牛奶 vs 水的区别。'),
      boldElement('轻酒体'),
      textElement('像脱脂牛奶，清爽轻盈；'),
      boldElement('中等酒体'),
      textElement('像全脂牛奶，圆润平衡；'),
      boldElement('重酒体'),
      textElement('像奶油，浓郁厚重。')
    ),
    bullet(boldElement('轻酒体代表：'), textElement('雷司令、灰皮诺、博若莱')),
    bullet(boldElement('中等酒体代表：'), textElement('黑皮诺、梅洛、霞多丽')),
    bullet(boldElement('重酒体代表：'), textElement('赤霞珠、西拉、马尔贝克')),
    paragraph(textElement('')),

    h2('2. 单宁（Tannin）—— 酒的"涩感"'),
    paragraph(
      textElement('喝浓茶时嘴里那种干涩收缩感，就是单宁。单宁来自葡萄皮和橡木桶，是红酒特有的"骨架"。')
    ),
    bullet(boldElement('高单宁：'), textElement('赤霞珠、内比奥罗、丹魄 —— 需要配牛排等高蛋白食物来"化解"')),
    bullet(boldElement('低单宁：'), textElement('黑皮诺、佳美 —— 单喝也很顺滑')),
    bullet(italicElement('小窍门：单宁高的酒适合醒酒 30-60 分钟再喝')),
    paragraph(textElement('')),

    h2('3. 酸度（Acidity）—— 酒的"活力"'),
    paragraph(
      textElement('酸度是让酒"活"起来的关键。酸度高的酒清爽开胃，酸度低的酒柔和圆润。')
    ),
    bullet(boldElement('高酸代表：'), textElement('长相思、雷司令、桑娇维塞（意大利 Chianti）')),
    bullet(boldElement('低酸代表：'), textElement('维欧尼、仙粉黛')),
    bullet(italicElement('记住一条：酸度高的酒＝百搭配餐酒，酸度能切油解腻')),
    paragraph(textElement('')),

    h2('4. 酒精度（Alcohol）—— 酒的"暖意"'),
    paragraph(textElement('酒精度直接影响酒的饱满感和"辣喉感"。')),
    bullet(boldElement('低酒精度（< 12.5%）：'), textElement('莫斯卡托、雷司令 —— 清凉易饮，适合入门')),
    bullet(boldElement('中酒精度（12.5-14%）：'), textElement('大多数葡萄酒 —— 平衡经典')),
    bullet(boldElement('高酒精度（> 14%）：'), textElement('澳洲西拉、阿玛罗尼、仙粉黛 —— 浓烈饱满')),
    paragraph(textElement('')),

    h2('5. 甜度（Sweetness）—— 酒的"甜蜜光谱"'),
    paragraph(textElement('从骨干（Bone Dry）到甜腻，葡萄酒有完整的甜度光谱：')),
    bullet(boldElement('干型（Dry）：'), textElement('绝大多数红酒和干白，残糖 < 4g/L —— "不甜"')),
    bullet(boldElement('半干（Off-Dry）：'), textElement('微甜，如很多雷司令 —— 入门友好')),
    bullet(boldElement('半甜：'), textElement('明显甜感，如晚收雷司令')),
    bullet(boldElement('甜型：'), textElement('贵腐酒、冰酒、波特酒 —— 配甜点绝配')),
    bullet(italicElement('新手友好提示：觉得红酒太涩？先从半干型白葡萄酒入手')),
    divider(),

    // ══════════════════════════════════════════
    // 第二章：葡萄酒分类
    // ══════════════════════════════════════════
    h1('二、葡萄酒分类 —— 找到你的"命中注定"'),
    paragraph(textElement('')),

    h2('🔴 红葡萄酒 —— "主角光环"'),
    img('red'),
    paragraph(textElement('')),
    paragraph(textElement('红酒占全球葡萄酒消费量的 55%，是最主流的品类。核心品种：')),
    paragraph(textElement('')),

    h3('赤霞珠（Cabernet Sauvignon）—— 红酒之王'),
    bullet(boldElement('关键词：'), textElement('浓郁、高单宁、黑加仑、雪松')),
    bullet(boldElement('产区：'), textElement('波尔多左岸、纳帕谷、智利中央谷')),
    bullet(boldElement('适合：'), textElement('配牛排、烤羊排等红肉')),
    bullet(boldElement('入门酒款：'), textElement('奔富 Bin 407、长城五星、拉菲传说')),
    paragraph(textElement('')),

    h3('黑皮诺（Pinot Noir）—— 红酒中的"林黛玉"'),
    bullet(boldElement('关键词：'), textElement('优雅、轻盈、樱桃、花香')),
    bullet(boldElement('产区：'), textElement('勃艮第、新西兰马尔堡、俄勒冈')),
    bullet(boldElement('适合：'), textElement('三文鱼、蘑菇、鸡肉、独酌')),
    bullet(boldElement('入门酒款：'), textElement('云雾之湾黑皮诺、路易拉图')),
    paragraph(textElement('')),

    h3('梅洛（Merlot）—— 最友好的红酒'),
    bullet(boldElement('关键词：'), textElement('柔和、圆润、李子、巧克力')),
    bullet(boldElement('产区：'), textElement('波尔多右岸（圣埃美隆）、智利、华盛顿州')),
    bullet(boldElement('适合：'), textElement('意面、烤鸡、Pizza —— 百搭')),
    bullet(boldElement('入门酒款：'), textElement('干露红魔鬼梅洛、圣埃美隆副牌')),
    paragraph(textElement('')),

    h3('西拉/设拉子（Syrah/Shiraz）—— 最"猛"的红酒'),
    bullet(boldElement('关键词：'), textElement('浓烈、黑胡椒、黑莓、烟熏')),
    bullet(boldElement('产区：'), textElement('罗讷河谷（法国）、巴罗萨谷（澳洲）')),
    bullet(boldElement('适合：'), textElement('烤肉、BBQ、炖肉')),
    bullet(boldElement('入门酒款：'), textElement('奔富 Bin 28、嘉伯乐巴罗萨设拉子')),
    paragraph(textElement('')),

    h3('马尔贝克（Malbec）—— 阿根廷国酒'),
    bullet(boldElement('关键词：'), textElement('饱满、紫罗兰、黑莓、巧克力')),
    bullet(boldElement('产区：'), textElement('门多萨（阿根廷）、卡奥尔（法国）')),
    bullet(boldElement('适合：'), textElement('烤牛肉、墨西哥菜')),
    bullet(boldElement('入门酒款：'), textElement('卡氏家族马尔贝克、Norton')),
    paragraph(textElement('')),

    h2('⚪ 白葡萄酒 —— "夏天的味道"'),
    img('white'),
    paragraph(textElement('')),

    h3('霞多丽（Chardonnay）—— 白酒女王'),
    bullet(boldElement('关键词：'), textElement('百变（从清爽到浓郁）、苹果、柑橘、黄油（过桶）')),
    bullet(boldElement('产区：'), textElement('勃艮第（夏布利）、纳帕谷、澳洲')),
    bullet(boldElement('适合：'), textElement('海鲜、白肉、奶油意面')),
    bullet(boldElement('入门酒款：'), textElement('夏布利一级园、William Fèvre、蒙大维')),
    paragraph(textElement('')),

    h3('长相思（Sauvignon Blanc）—— 最清爽的白酒'),
    bullet(boldElement('关键词：'), textElement('清爽、高酸、青草、柑橘、百香果')),
    bullet(boldElement('产区：'), textElement('卢瓦尔河谷（桑赛尔）、马尔堡（新西兰）')),
    bullet(boldElement('适合：'), textElement('沙拉、生蚝、白灼虾、寿司')),
    bullet(boldElement('入门酒款：'), textElement('云雾之湾长相思、帕斯卡桑赛尔')),
    paragraph(textElement('')),

    h3('雷司令（Riesling）—— 最容易喝的白酒'),
    bullet(boldElement('关键词：'), textElement('高酸、花香、蜂蜜、矿物感')),
    bullet(boldElement('产区：'), textElement('德国摩泽尔、阿尔萨斯、澳洲伊甸谷')),
    bullet(boldElement('适合：'), textElement('泰国菜、川菜（酸甜平衡辣味）、鹅肝')),
    bullet(boldElement('入门酒款：'), textElement('Dr. Loosen 蓝色雷司令、修士楼')),
    paragraph(textElement('')),

    h2('🫧 起泡酒 —— "快乐水"'),
    img('sparkling'),
    paragraph(textElement('')),

    h3('香槟（Champagne）—— 起泡酒之王'),
    bullet(boldElement('关键词：'), textElement('法国香槟区专属、酵母、烤面包、优雅气泡')),
    bullet(boldElement('推荐：'), textElement('酩悦 Moët（入门）、唐培里侬（进阶）、库克（收藏）')),
    paragraph(textElement('')),

    h3('普罗塞克（Prosecco）—— 意大利国民起泡'),
    bullet(boldElement('关键词：'), textElement('清新、果香、青苹果、花香')),
    bullet(boldElement('推荐：'), textElement('价格亲民（50-150 元），日常开瓶首选')),
    paragraph(textElement('')),

    h3('卡瓦（Cava）—— 西班牙性价比之王'),
    bullet(boldElement('关键词：'), textElement('香槟法酿造、价格只有香槟 1/3')),
    bullet(boldElement('推荐：'), textElement('Freixenet、Codorníu')),
    paragraph(textElement('')),

    h3('莫斯卡托（Moscato d\'Asti）—— 小甜水'),
    bullet(boldElement('关键词：'), textElement('微甜、低酒精（5-6%）、蜜桃、荔枝')),
    bullet(boldElement('适合：'), textElement('不喝酒的人、饭后甜点、闺蜜聚会')),
    paragraph(textElement('')),

    h2('🌹 桃红葡萄酒（Rosé）—— "颜值即正义"'),
    bullet(boldElement('关键词：'), textElement('清爽、草莓、西柚、夏天的味道')),
    bullet(boldElement('代表产区：'), textElement('普罗旺斯（法国）')),
    bullet(boldElement('适合：'), textElement('沙拉、海鲜、户外野餐、下午茶')),
    bullet(italicElement('桃红不是红酒兑白酒！它是红葡萄短时间浸泡果皮的产物。颜色越浅，越清爽。')),
    paragraph(textElement('')),

    h2('🍯 甜酒 & 加强酒 —— "液体黄金"'),
    bullet(boldElement('贵腐酒（Sauternes）：'), textElement('波尔多苏玳产区，蜂蜜、杏脯，配鹅肝一绝 —— 滴金庄园是顶级')),
    bullet(boldElement('冰酒（Icewine）：'), textElement('加拿大/德国，葡萄在藤上自然冰冻后压榨，极甜')),
    bullet(boldElement('波特酒（Port）：'), textElement('葡萄牙，加烈甜酒，配巧克力和奶酪')),
    bullet(boldElement('雪莉酒（Sherry）：'), textElement('西班牙，从干到甜都有，Fino 配火腿绝配')),
    divider(),

    // ══════════════════════════════════════════
    // 第三章：世界名庄
    // ══════════════════════════════════════════
    h1('三、世界知名酒庄 —— "朝圣清单"'),
    img('winery'),
    paragraph(textElement('')),

    h2('🇫🇷 法国 —— 葡萄酒的圣地'),
    paragraph(textElement('')),

    h3('波尔多五大名庄（1855 分级）'),
    ordered(boldElement('拉菲酒庄（Château Lafite Rothschild）'), textElement(' —— 波雅克村，优雅含蓄的典范')),
    ordered(boldElement('拉图酒庄（Château Latour）'), textElement(' —— 强劲浓郁，陈年潜力最强')),
    ordered(boldElement('玛歌酒庄（Château Margaux）'), textElement(' —— "波尔多的凡尔赛"，最优雅')),
    ordered(boldElement('木桐酒庄（Château Mouton Rothschild）'), textElement(' —— 每年请艺术家设计酒标')),
    ordered(boldElement('侯伯王酒庄（Château Haut-Brion）'), textElement(' —— 最古老的名庄，格拉夫产区')),
    paragraph(textElement('')),

    h3('勃艮第传奇'),
    bullet(boldElement('罗曼尼·康帝（DRC）'), textElement(' —— 全球最贵的酒，黑皮诺之神')),
    bullet(boldElement('勒桦酒庄（Domaine Leroy）'), textElement(' —— 生物动力法先驱')),
    bullet(boldElement('亨利·贾伊（Henri Jayer）'), textElement(' —— 已故传奇酿酒师，酒款天价')),
    paragraph(textElement('')),

    h3('其他法国名庄'),
    bullet(boldElement('白马酒庄'), textElement('（圣埃美隆 A 级）、'), boldElement('欧颂酒庄'), textElement('（圣埃美隆 A 级）')),
    bullet(boldElement('帕图斯（Pétrus）'), textElement(' —— 波美侯之王，100% 梅洛')),
    bullet(boldElement('滴金酒庄（Château d\'Yquem）'), textElement(' —— 贵腐甜酒之王')),
    paragraph(textElement('')),

    h2('🇮🇹 意大利 —— 多元与个性'),
    bullet(boldElement('安东尼世家（Antinori）'), textElement(' —— 超级托斯卡纳先驱，天娜（Tignanello）是代表作')),
    bullet(boldElement('嘉雅（Gaja）'), textElement(' —— 巴巴莱斯科之王，意大利现代酿酒教父')),
    bullet(boldElement('萨西凯亚（Sassicaia）'), textElement(' —— 超级托斯卡纳鼻祖')),
    bullet(boldElement('碧安帝山迪（Biondi-Santi）'), textElement(' —— 布鲁内洛的发明者')),
    paragraph(textElement('')),

    h2('🇪🇸 西班牙 —— 性价比天堂'),
    bullet(boldElement('贝加西西里亚（Vega Sicilia）'), textElement(' —— "西班牙的拉菲"，Unico 是旗舰')),
    bullet(boldElement('平古斯（Pingus）'), textElement(' —— 西班牙膜拜酒，丹魄品种')),
    bullet(boldElement('瑞格尔侯爵（Marqués de Riscal）'), textElement(' —— 里奥哈老牌名庄，弗兰克·盖里设计的酒店超美')),
    paragraph(textElement('')),

    h2('🇺🇸 美国 —— 新世界之光'),
    bullet(boldElement('啸鹰（Screaming Eagle）'), textElement(' —— 纳帕谷膜拜酒，年产 500 箱，一瓶难求')),
    bullet(boldElement('作品一号（Opus One）'), textElement(' —— 罗斯柴尔德家族 × 蒙大维，中美合璧')),
    bullet(boldElement('鹿跃酒庄（Stag\'s Leap）'), textElement(' —— 1976 巴黎审判赢了法国酒的传奇')),
    bullet(boldElement('哈兰酒庄（Harlan Estate）'), textElement(' —— 纳帕谷的"拉菲"')),
    paragraph(textElement('')),

    h2('🇦🇺 澳大利亚 —— 大胆奔放'),
    bullet(boldElement('奔富（Penfolds）'), textElement(' —— Grange 是澳洲酒王，Bin 系列是国民品牌')),
    bullet(boldElement('翰斯科酒庄（Henschke）'), textElement(' —— Hill of Grace，百年老藤设拉子')),
    bullet(boldElement('御兰堡（Yalumba）'), textElement(' —— 澳洲最古老家族酒庄')),
    paragraph(textElement('')),

    h2('🇨🇱 智利 & 🇦🇷 阿根廷'),
    bullet(boldElement('活灵魂（Almaviva）'), textElement(' —— 智利酒王，木桐 × 干露合作')),
    bullet(boldElement('桑塔丽塔（Santa Rita）'), textElement(' —— Casa Real 是旗舰')),
    bullet(boldElement('卡氏家族（Catena Zapata）'), textElement(' —— 阿根廷马尔贝克标杆')),
    divider(),

    // ══════════════════════════════════════════
    // 第四章：品牌导航
    // ══════════════════════════════════════════
    h1('四、品牌导航 —— 从超市到拍卖行'),
    paragraph(textElement('')),

    h2('💰 入门友好（50-150 元）'),
    paragraph(textElement('超市和电商常见，品质稳定，适合日常饮用：')),
    bullet(boldElement('干露（Concha y Toro）'), textElement(' —— 红魔鬼系列，智利最大酒企')),
    bullet(boldElement('黄尾袋鼠（Yellow Tail）'), textElement(' —— 澳洲入门酒代名词')),
    bullet(boldElement('奔富洛神山庄（Penfolds Rawson\'s Retreat）'), textElement(' —— 奔富入门线')),
    bullet(boldElement('拉菲传说（Légende）'), textElement(' —— 拉菲家族入门线')),
    bullet(boldElement('蒙大维木桥（Woodbridge）'), textElement(' —— 纳帕谷品牌入门价')),
    paragraph(textElement('')),

    h2('💰💰 进阶之选（150-500 元）'),
    paragraph(textElement('品质明显提升，可以感受产区和品种特色：')),
    bullet(boldElement('奔富 Bin 系列'), textElement(' —— Bin 28/128/389，澳洲经典')),
    bullet(boldElement('路易拉图（Louis Latour）'), textElement(' —— 勃艮第大厂，性价比不错')),
    bullet(boldElement('云雾之湾（Cloudy Bay）'), textElement(' —— 新西兰长相思标杆')),
    bullet(boldElement('安东尼世家（Antinori）'), textElement(' —— 意大利超托入门')),
    bullet(boldElement('Torres'), textElement(' —— 西班牙百年家族，Gran Coronas 性价比高')),
    paragraph(textElement('')),

    h2('💰💰💰 品鉴级（500-2000 元）'),
    paragraph(textElement('开始进入"好酒"的世界：')),
    bullet(boldElement('奔富 Bin 407/707'), textElement(' —— 澳洲赤霞珠典范')),
    bullet(boldElement('作品一号（Opus One）'), textElement(' —— 纳帕谷标杆混酿')),
    bullet(boldElement('天娜（Tignanello）'), textElement(' —— 超级托斯卡纳代表')),
    bullet(boldElement('木桐副牌（Le Petit Mouton）'), textElement(' —— 感受名庄风格的入口')),
    bullet(boldElement('沙普蒂尔（Chapoutier）'), textElement(' —— 罗讷河谷名家')),
    paragraph(textElement('')),

    h2('💰💰💰💰 收藏级（2000 元以上）'),
    paragraph(textElement('膜拜酒、名庄正牌、年份珍品：')),
    bullet(boldElement('拉菲正牌'), textElement(' —— ¥5,000-15,000，波尔多硬通货')),
    bullet(boldElement('奔富 Grange'), textElement(' —— ¥3,000-8,000，澳洲酒王')),
    bullet(boldElement('罗曼尼·康帝'), textElement(' —— ¥50,000+，全球最贵')),
    bullet(boldElement('啸鹰'), textElement(' —— ¥15,000+，纳帕膜拜酒')),
    bullet(boldElement('帕图斯'), textElement(' —— ¥15,000-40,000，波美侯之王')),
    divider(),

    // ══════════════════════════════════════════
    // 第五章：场景配酒
    // ══════════════════════════════════════════
    h1('五、场景配酒指南 —— 什么场合喝什么酒'),
    img('scene'),
    paragraph(textElement('')),

    h2('🤝 商务宴请'),
    paragraph(boldElement('核心原则：安全、有面子、不出错')),
    bullet(boldElement('首选：'), textElement('波尔多名庄副牌（300-800 元），既有品牌认知度，价格也不夸张')),
    bullet(boldElement('次选：'), textElement('奔富 Bin 389/407，在中国认知度极高')),
    bullet(boldElement('起泡酒开场：'), textElement('酩悦香槟（500-600 元），仪式感满分')),
    bullet(italicElement('避雷：不要选太小众的酒，对方可能不认识，反而尴尬')),
    paragraph(textElement('')),

    h2('💕 浪漫约会'),
    paragraph(boldElement('核心原则：好看、好喝、有故事可聊')),
    bullet(boldElement('红酒：'), textElement('黑皮诺（优雅不上头）—— 推荐新西兰或勃艮第村级')),
    bullet(boldElement('白酒：'), textElement('长相思或雷司令（清爽适合聊天）')),
    bullet(boldElement('加分项：'), textElement('桃红葡萄酒（颜值高、适合拍照）、莫斯卡托（微甜不醉人）')),
    bullet(italicElement('话题加成：选一瓶有故事的酒（如 1976 巴黎审判的鹿跃酒庄），边喝边聊')),
    paragraph(textElement('')),

    h2('👨‍👩‍👧‍👦 家庭聚餐'),
    paragraph(boldElement('核心原则：好入口、众口能调')),
    bullet(boldElement('红酒：'), textElement('梅洛或马尔贝克（柔和不涩，老少咸宜）')),
    bullet(boldElement('白酒：'), textElement('半干型雷司令（微甜，不喝酒的人也能接受）')),
    bullet(boldElement('不喝酒的家人：'), textElement('莫斯卡托（5-6% 酒精度，像果汁）')),
    bullet(boldElement('预算：'), textElement('100-200 元足够，重量不重价')),
    paragraph(textElement('')),

    h2('🍖 烧烤 / 派对'),
    paragraph(boldElement('核心原则：大口喝、不心疼')),
    bullet(boldElement('红酒：'), textElement('澳洲设拉子或阿根廷马尔贝克 —— 果味浓、配烤肉一绝')),
    bullet(boldElement('起泡：'), textElement('普罗塞克或卡瓦 —— 便宜好喝，一人一瓶也不心疼')),
    bullet(boldElement('桃红：'), textElement('冰镇普罗旺斯桃红 —— 户外派对颜值担当')),
    bullet(boldElement('预算：'), textElement('50-100 元/瓶，多买几瓶')),
    paragraph(textElement('')),

    h2('🌙 一个人的夜晚'),
    paragraph(boldElement('核心原则：舒服、放松、不浪费')),
    bullet(boldElement('推荐：'), textElement('黑皮诺或霞多丽 —— 优雅不刺激，配音乐和书正好')),
    bullet(boldElement('实用技巧：'), textElement('买半瓶装（375ml），一个人刚好一晚')),
    bullet(boldElement('保存：'), textElement('开瓶后塞回瓶塞放冰箱，红酒 3 天内、白酒 5 天内喝完')),
    paragraph(textElement('')),

    h2('🎉 庆祝 / 节日'),
    paragraph(boldElement('核心原则：仪式感、分享感')),
    bullet(boldElement('必选：'), textElement('香槟或优质起泡酒 —— 开瓶声就是仪式感')),
    bullet(boldElement('推荐：'), textElement('酩悦（经典）、唐培里侬（隆重）、Ruinart（小众高级）')),
    bullet(boldElement('配菜：'), textElement('生蚝、鱼子酱、草莓都是好搭档')),
    divider(),

    // ══════════════════════════════════════════
    // 第六章：食物搭配
    // ══════════════════════════════════════════
    h1('六、食物搭配 —— "吃什么配什么"速查表'),
    img('pairing'),
    paragraph(textElement('')),
    paragraph(
      boldElement('三条万能法则：'),
    ),
    ordered(boldElement('红酒配红肉，白酒配白肉'), textElement(' —— 最经典的入门法则')),
    ordered(boldElement('酸度配油脂'), textElement(' —— 酸度高的酒能解腻（如长相思配炸鱼薯条）')),
    ordered(boldElement('甜度 ≥ 食物甜度'), textElement(' —— 甜品要配比它更甜的酒，否则酒会发苦')),
    paragraph(textElement('')),

    h2('🥩 牛排 / 烤肉'),
    bullet(boldElement('最佳：'), textElement('赤霞珠、马尔贝克、西拉')),
    bullet(boldElement('为什么：'), textElement('高单宁遇到蛋白质会变柔和，互相成就')),
    bullet(boldElement('具体推荐：'), textElement('奔富 Bin 389 + 五分熟菲力，经典CP')),
    paragraph(textElement('')),

    h2('🐟 海鲜'),
    bullet(boldElement('生食（生蚝/刺身）：'), textElement('夏布利、长相思、干型香槟')),
    bullet(boldElement('烤/煎海鲜：'), textElement('霞多丽（过桶）、维欧尼')),
    bullet(boldElement('小龙虾/辣味海鲜：'), textElement('半干型雷司令（甜度压制辣味）')),
    paragraph(textElement('')),

    h2('🍝 意面 / Pizza'),
    bullet(boldElement('番茄酱底：'), textElement('桑娇维塞（Chianti）、丹魄')),
    bullet(boldElement('奶油酱底：'), textElement('霞多丽（过桶）')),
    bullet(boldElement('Pizza：'), textElement('几乎所有中等酒体红酒都行 —— 梅洛、黑皮诺')),
    paragraph(textElement('')),

    h2('🥟 中餐'),
    paragraph(textElement('中餐配酒是最有挑战的，因为味道复杂多变：')),
    bullet(boldElement('粤菜（清淡）：'), textElement('长相思、雷司令 —— 清爽不抢味')),
    bullet(boldElement('川菜/湘菜（辣）：'), textElement('半干雷司令、莫斯卡托 —— 甜度降辣感')),
    bullet(boldElement('红烧/东坡肉（浓油赤酱）：'), textElement('赤霞珠、马尔贝克 —— 浓对浓')),
    bullet(boldElement('火锅：'), textElement('起泡酒（气泡清口）或冰镇雷司令')),
    bullet(boldElement('烤鸭：'), textElement('黑皮诺 —— 鸭肉和黑皮诺是天作之合')),
    paragraph(textElement('')),

    h2('🍣 日料'),
    bullet(boldElement('寿司/刺身：'), textElement('夏布利、长相思、干型起泡')),
    bullet(boldElement('天妇罗：'), textElement('干型雷司令（酸度切油脂）')),
    bullet(boldElement('烤物/铁板烧：'), textElement('黑皮诺、轻酒体赤霞珠')),
    paragraph(textElement('')),

    h2('🧀 奶酪'),
    bullet(boldElement('软质奶酪（布里/卡芒贝尔）：'), textElement('霞多丽、香槟')),
    bullet(boldElement('硬质奶酪（帕玛森/格鲁耶尔）：'), textElement('赤霞珠、巴罗洛')),
    bullet(boldElement('蓝纹奶酪：'), textElement('苏玳贵腐甜酒 —— 咸甜碰撞，经典搭配')),
    paragraph(textElement('')),

    h2('🍫 甜点'),
    bullet(boldElement('巧克力：'), textElement('波特酒、巴纽尔斯甜酒')),
    bullet(boldElement('水果塔/蛋糕：'), textElement('莫斯卡托、晚收雷司令')),
    bullet(boldElement('焦糖/太妃糖：'), textElement('托卡伊贵腐酒、PX 雪莉')),
    divider(),

    // ══════════════════════════════════════════
    // 第七章：畅销酒推荐
    // ══════════════════════════════════════════
    h1('七、畅销酒推荐 —— 闭眼入不踩雷'),
    img('recommend'),
    paragraph(textElement('')),

    h2('💵 100 元以内 —— 日常口粮酒'),
    paragraph(textElement('别小看这个价位，有很多好喝的酒：')),
    paragraph(textElement('')),
    ordered(boldElement('干露红魔鬼梅洛'), textElement('（智利）约 60 元 —— 柔和易饮，超市王者')),
    ordered(boldElement('黄尾袋鼠设拉子'), textElement('（澳洲）约 50 元 —— 果味浓郁，入门无压力')),
    ordered(boldElement('奔富洛神山庄赤霞珠'), textElement('（澳洲）约 70 元 —— 奔富入门，品质稳定')),
    ordered(boldElement('蒙太奇长相思'), textElement('（智利）约 50 元 —— 清爽白葡萄酒，冰镇后绝佳')),
    ordered(boldElement('王朝半干白'), textElement('（中国）约 40 元 —— 国产良心，配中餐不错')),
    paragraph(textElement('')),

    h2('💵💵 100-300 元 —— 请客不丢面'),
    paragraph(textElement('品质跃升明显，可以感受到产区特色：')),
    paragraph(textElement('')),
    ordered(boldElement('奔富 Bin 28 设拉子'), textElement('（澳洲）约 200 元 —— 经典之作，在中国无人不知')),
    ordered(boldElement('拉菲传说波尔多'), textElement('（法国）约 150 元 —— 拉菲入门，送礼有面子')),
    ordered(boldElement('云雾之湾长相思'), textElement('（新西兰）约 180 元 —— 白葡萄酒天花板之一')),
    ordered(boldElement('Dr. Loosen 蓝色雷司令'), textElement('（德国）约 120 元 —— 最好喝的入门雷司令')),
    ordered(boldElement('Freixenet Cordon Negro 卡瓦'), textElement('（西班牙）约 100 元 —— 起泡酒性价比之王')),
    ordered(boldElement('卡氏家族马尔贝克'), textElement('（阿根廷）约 150 元 —— 阿根廷标杆')),
    paragraph(textElement('')),

    h2('💵💵💵 300-800 元 —— 品鉴入门'),
    paragraph(textElement('开始进入"认真喝酒"的世界：')),
    paragraph(textElement('')),
    ordered(boldElement('奔富 Bin 389'), textElement('（澳洲）约 350 元 —— "穷人的 Grange"，超值')),
    ordered(boldElement('天娜 Tignanello'), textElement('（意大利）约 650 元 —— 超级托斯卡纳代表')),
    ordered(boldElement('路易拉图勃艮第黑皮诺'), textElement('（法国）约 300 元 —— 勃艮第入门')),
    ordered(boldElement('酩悦香槟'), textElement('（法国）约 350 元 —— 香槟入门首选')),
    ordered(boldElement('贝加西西里亚 Alion'), textElement('（西班牙）约 500 元 —— 西班牙名庄副牌')),
    paragraph(textElement('')),

    h2('💵💵💵💵 800 元以上 —— 人生需要仪式感'),
    paragraph(textElement('这些酒值得在特别的日子开一瓶：')),
    paragraph(textElement('')),
    ordered(boldElement('奔富 Bin 707'), textElement('（澳洲）约 1,200 元 —— 澳洲赤霞珠巅峰')),
    ordered(boldElement('作品一号 Opus One'), textElement('（美国）约 2,500 元 —— 中美联姻的传奇')),
    ordered(boldElement('唐培里侬香槟'), textElement('（法国）约 2,000 元 —— 香槟中的 LVMH')),
    ordered(boldElement('拉菲副牌 Carruades de Lafite'), textElement('（法国）约 2,000 元 —— 名庄入门体验')),
    ordered(boldElement('奔富 Grange'), textElement('（澳洲）约 4,000 元 —— 澳洲酒王，值得一试')),
    divider(),

    // ══════════════════════════════════════════
    // 附录
    // ══════════════════════════════════════════
    // ══════════════════════════════════════════
    // 第八章：品鉴方法
    // ══════════════════════════════════════════
    h1('八、品鉴入门 —— 三步学会"像行家一样喝酒"'),
    paragraph(textElement('你不需要考 WSET 证书，只要掌握这三步，就能在任何场合自信地品酒。')),
    paragraph(textElement('')),

    h2('👀 第一步：看（See）'),
    bullet(boldElement('倾斜杯子 45°'), textElement('，对着白色背景观察颜色')),
    bullet(boldElement('红酒：'), textElement('紫红色 = 年轻，砖红/橙色边缘 = 陈年。颜色越深通常酒体越重')),
    bullet(boldElement('白酒：'), textElement('浅稻草色 = 年轻清爽，金黄色 = 陈年或过桶')),
    bullet(boldElement('挂杯/酒腿：'), textElement('酒液沿杯壁流下的"泪滴"越多越慢，说明酒精度和/或糖分越高')),
    paragraph(textElement('')),

    h2('👃 第二步：闻（Smell）'),
    bullet(textElement('先不摇杯，闻一下 —— 这是酒最"安静"的状态')),
    bullet(boldElement('然后轻轻旋转杯子'), textElement('，让酒液与空气接触，释放更多香气')),
    bullet(boldElement('第一层香气（果香）：'), textElement('黑加仑、樱桃、柑橘、苹果…这些来自葡萄本身')),
    bullet(boldElement('第二层香气（酿造）：'), textElement('黄油、奶油、面包 —— 来自橡木桶和发酵')),
    bullet(boldElement('第三层香气（陈年）：'), textElement('皮革、烟草、蘑菇、泥土 —— 时间的馈赠')),
    bullet(italicElement('小技巧：闻到什么就说什么，没有标准答案。"我闻到草莓味"比"黑皮诺的典型特征"更真实')),
    paragraph(textElement('')),

    h2('👅 第三步：尝（Taste）'),
    bullet(textElement('小啜一口，让酒液在口腔里"滚"一圈')),
    bullet(boldElement('前味（Attack）：'), textElement('入口的第一印象 —— 甜度、酸度')),
    bullet(boldElement('中味（Mid-palate）：'), textElement('主体感受 —— 果味、单宁、酒体')),
    bullet(boldElement('余味（Finish）：'), textElement('咽下后的持续感 —— 好酒的余味可以持续 30 秒以上')),
    paragraph(textElement('')),
    paragraph(boldElement('品酒时问自己四个问题：')),
    ordered(textElement('酸度高不高？（嘴里有没有分泌口水的感觉）')),
    ordered(textElement('单宁强不强？（舌头和牙龈有没有干涩感）')),
    ordered(textElement('酒体轻还是重？（像水还是像牛奶）')),
    ordered(textElement('余味长不长？（味道停留多久）')),
    paragraph(textElement('')),
    quote(
      textElement('记住：品酒不是考试，没有对错。你的感受就是最好的答案。'),
      textElement('\n如果你觉得一瓶酒好喝，那它就是好酒 —— 不管别人怎么打分。')
    ),
    divider(),

    // ══════════════════════════════════════════
    // 第九章：Wine Spectator 2025 榜单
    // ══════════════════════════════════════════
    h1('九、2025 全球年度好酒 —— Wine Spectator Top 10'),
    paragraph(
      textElement('Wine Spectator 是全球最权威的葡萄酒杂志之一，每年从上万款酒中选出 Top 100。'),
      textElement('2025 年的榜单覆盖了法国、美国、意大利、智利等产区，平均评分 93 分。')
    ),
    paragraph(textElement('')),

    h2('🏆 2025 年度之酒：Château Giscours Margaux 2022'),
    paragraph(
      textElement('波尔多玛歌产区的三级庄，'),
      boldElement('95 分 / 约 $68（≈490 元）'),
      textElement('。这是自 2019 年以来首次由波尔多酒登顶。赤霞珠为主的混酿，花香、经典果味、精致优雅。')
    ),
    bullet(italicElement('这个价位能买到年度之酒，性价比炸裂')),
    paragraph(textElement('')),

    h2('📋 完整 Top 10'),
    paragraph(textElement('')),
    ordered(boldElement('Château Giscours Margaux 2022'), textElement(' —— 95分 $68 | 波尔多玛歌，年度之酒')),
    ordered(boldElement('Aubert Chardonnay UV-SL 2023'), textElement(' —— 96分 $100 | 索诺玛海岸霞多丽')),
    ordered(boldElement('Ridge Lytton Springs 2023'), textElement(' —— 95分 $56 | 加州干溪谷混酿，性价比之选')),
    ordered(boldElement('Williams Selyem Pinot Noir 2023'), textElement(' —— 96分 $72 | 俄罗斯河谷黑皮诺')),
    ordered(boldElement('Château Beau-Séjour Bécot 2022'), textElement(' —— 96分 $85 | 圣埃美隆一级 B')),
    ordered(boldElement('Clos Apalta 2021'), textElement(' —— 96分 $170 | 智利顶级混酿')),
    ordered(boldElement('Produttori del Barbaresco 2021'), textElement(' —— 94分 $57 | 皮埃蒙特巴巴莱斯科，高分低价！')),
    ordered(boldElement('Wayfarer Pinot Noir 2023'), textElement(' —— 索诺玛海岸庄园黑皮诺')),
    ordered(boldElement('Castello di Ama Chianti Classico 2021'), textElement(' —— 意大利基安蒂经典珍藏')),
    ordered(boldElement('Ferrando Châteauneuf-du-Pape 2022'), textElement(' —— 94分 $108 | 罗讷河谷教皇新堡')),
    paragraph(textElement('')),

    paragraph(boldElement('从榜单看趋势：')),
    bullet(textElement('波尔多强势回归年度第一')),
    bullet(textElement('加州黑皮诺和霞多丽持续霸榜')),
    bullet(textElement('意大利酒占了 20 席（Top 100 中），托斯卡纳领衔')),
    bullet(textElement('$60 以下也有 34 款上榜 —— 好酒不一定贵')),
    divider(),

    h1('附录：实用小贴士'),
    paragraph(textElement('')),

    h2('🌡️ 饮用温度指南'),
    bullet(boldElement('起泡酒/甜酒：'), textElement('6-8°C（冰箱冷藏 2-3 小时）')),
    bullet(boldElement('白葡萄酒/桃红：'), textElement('8-12°C（冰箱冷藏 1-2 小时）')),
    bullet(boldElement('轻酒体红酒（黑皮诺）：'), textElement('14-16°C（可以稍微冰一下）')),
    bullet(boldElement('重酒体红酒（赤霞珠）：'), textElement('16-18°C（室温偏凉即可，不要加热！）')),
    paragraph(textElement('')),

    h2('🍷 醒酒指南'),
    bullet(boldElement('不需要醒酒：'), textElement('白葡萄酒、起泡酒、轻酒体红酒')),
    bullet(boldElement('醒 30 分钟：'), textElement('年轻的中等酒体红酒（梅洛、黑皮诺 3 年内）')),
    bullet(boldElement('醒 1-2 小时：'), textElement('浓郁红酒（赤霞珠、西拉、巴罗洛）')),
    bullet(italicElement('没有醒酒器？倒进大杯子里晃一晃也行')),
    paragraph(textElement('')),

    h2('📦 存酒建议'),
    bullet(textElement('横放（让酒液接触瓶塞，防止干燥漏气）')),
    bullet(textElement('避光、避震、恒温（12-15°C 最佳）')),
    bullet(textElement('没有酒柜？放在家里最凉快、最暗的角落')),
    bullet(boldElement('关键：'), textElement('100 元以内的酒不用存，买来就喝！只有高端酒才有陈年价值')),
    paragraph(textElement('')),

    h2('📖 看懂酒标 —— 5 秒速读法'),
    ordered(boldElement('产区'), textElement(' —— 越小越好（"波雅克" > "波尔多" > "法国"）')),
    ordered(boldElement('年份'), textElement(' —— 不是越老越好，查一下当年产区天气如何')),
    ordered(boldElement('品种'), textElement(' —— 新世界酒标通常会写品种名，旧世界只写产区')),
    ordered(boldElement('酒精度'), textElement(' —— 快速判断酒体轻重')),
    ordered(boldElement('酒庄/品牌'), textElement(' —— 认准可靠的名字')),
    paragraph(textElement('')),

    quote(
      boldElement('最后一句话：'),
      textElement('\n葡萄酒最重要的规则只有一条 —— '),
      boldElement('你喜欢喝的，就是好酒。'),
      textElement('\n不用在意别人的评价和打分，喝自己开心的酒，配自己爱吃的菜，这就够了。🍷')
    ),
  ].filter(Boolean); // 过滤掉 null 的图片块

  return blocks;
}

// ─── 向 Docx 文档写入 blocks ────────────────────────────────────

// 返回 image key -> block_id 映射
async function writeBlocks(token: string, documentId: string, blocks: any[]): Promise<Record<string, string>> {
  const imageBlockMap: Record<string, string> = {};
  const chunkSize = 30;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    // 记录哪些位置是 image block
    const imageKeysInChunk: { idx: number; key: string }[] = [];
    const cleanChunk = chunk.map((b: any, idx: number) => {
      if (b.__image_key) {
        imageKeysInChunk.push({ idx, key: b.__image_key });
        return { block_type: 27, image: {} };
      }
      return b;
    });

    const res = curlApi('POST', `/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children`, token, { children: cleanChunk });
    if (res.code !== 0) {
      console.error(`  写入blocks失败 (${i}-${i + cleanChunk.length}):`, res.msg, res.code);
    } else {
      console.log(`  写入 blocks ${i + 1}-${i + cleanChunk.length} 成功`);
      // 提取 image block_id
      if (res.data?.children && imageKeysInChunk.length > 0) {
        for (const { idx, key } of imageKeysInChunk) {
          const child = res.data.children[idx];
          if (child?.block_id) {
            imageBlockMap[key] = child.block_id;
            console.log(`    📷 image block "${key}" -> ${child.block_id}`);
          }
        }
      }
    }
    if (i + chunkSize < blocks.length) await new Promise(r => setTimeout(r, 300));
  }
  return imageBlockMap;
}

// ─── 主流程 ──────────────────────────────────────────────────────

async function main() {
  // 支持传入已创建的 docId 来跳过创建步骤
  const existingDocId = process.argv[2] || '';

  console.log('🍷 开始创建「葡萄酒知识库」飞书文档...\n');

  // 1. 获取 token：优先使用 user OAuth token，fallback tenant token
  console.log('获取 access token...');
  let tenantToken: string;
  const userTokenFile = path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json');
  if (fs.existsSync(userTokenFile)) {
    const tokenData = JSON.parse(fs.readFileSync(userTokenFile, 'utf-8'));
    const savedAt = new Date(tokenData.saved_at).getTime();
    const elapsed = (Date.now() - savedAt) / 1000;
    if (elapsed < tokenData.expires_in - 60) {
      tenantToken = tokenData.access_token;
      console.log(`使用 User OAuth Token (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)`);
    } else {
      console.log('User token 已过期，使用 tenant token...');
      tenantToken = getTenantToken();
    }
  } else {
    tenantToken = getTenantToken();
  }
  console.log('Token 获取成功');

  // 2. 在知识库中创建 wiki 节点
  const SPACE_ID = '7615178195469421499';  // 葡萄酒鉴赏知识库
  const PARENT_NODE = 'LaBgw4iypixpaFkrX9dcyV5Undh';  // Homepage

  let docId: string;
  let nodeToken: string;
  if (existingDocId) {
    docId = existingDocId;
    nodeToken = '';
    console.log(`复用已有文档: ${docId}\n`);
  } else {
    console.log('在知识库中创建 wiki 节点...');
    const nodeRes = curlApi('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, tenantToken, {
      obj_type: 'docx',
      node_type: 'origin',
      parent_node_token: PARENT_NODE,
      title: '🍷 葡萄酒完全指南 —— 从入门到会选会配会聊',
    });
    if (nodeRes.code !== 0) {
      console.error('创建节点失败:', nodeRes.msg, '| code:', nodeRes.code);
      console.error('请确保 App 已加入知识库为编辑成员！');
      return;
    }
    nodeToken = nodeRes.data?.node?.node_token;
    docId = nodeRes.data?.node?.obj_token;
    console.log(`Wiki 节点创建成功: node=${nodeToken}, doc=${docId}\n`);
  }

  // 3. 写入文档内容（含空 image 占位块）
  console.log('开始写入文档内容...');
  const blocks = buildBlocks();
  const imageBlockMap = await writeBlocks(tenantToken, docId, blocks);

  console.log(`\n文字内容写入完成，共 ${blocks.length} 个 blocks`);
  console.log(`图片占位块: ${Object.keys(imageBlockMap).length} 个\n`);

  // 4. 下载并上传图片到对应 image block
  if (Object.keys(imageBlockMap).length > 0) {
    console.log('开始下载并上传配图...');
    let uploadOk = 0;
    for (const [key, blockId] of Object.entries(imageBlockMap)) {
      const imgUrl = IMAGES[key];
      if (!imgUrl) continue;
      let retries = 3;
      while (retries > 0) {
        try {
          console.log(`  下载 ${key}...`);
          const buffer = await downloadImage(imgUrl);
          console.log(`  上传 ${key} (${(buffer.length / 1024).toFixed(0)}KB) -> block ${blockId}...`);
          // 上传图片到对应 image block（parent_node = block_id）
          uploadImageToBlock(tenantToken, blockId, buffer, `wine_${key}.jpg`);
          console.log(`  ✓ ${key} 上传成功`);
          uploadOk++;
          break;
        } catch (err: any) {
          retries--;
          console.error(`  ✗ ${key} 失败: ${err.message}${retries > 0 ? '，重试...' : ''}`);
          if (retries > 0) await new Promise(r => setTimeout(r, 1500));
        }
      }
      await new Promise(r => setTimeout(r, 500));
    }
    console.log(`\n图片上传完成 (${uploadOk}/${Object.keys(imageBlockMap).length})`);
  }

  const wikiUrl = nodeToken
    ? `https://hcn2vc1r2jus.feishu.cn/wiki/${nodeToken}`
    : `https://hcn2vc1r2jus.feishu.cn/docx/${docId}`;
  console.log('\n✅ 全部完成！');
  console.log('─'.repeat(50));
  console.log(`知识库地址：${wikiUrl}`);
  console.log('─'.repeat(50));
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
