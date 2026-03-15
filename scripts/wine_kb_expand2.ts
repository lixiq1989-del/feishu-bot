/**
 * 葡萄酒知识库 - 第二批扩展子页面
 * 新增：西餐配酒、葡萄品种图鉴、年份速查表、酒具选购指南
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_expand2.ts
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

// ─── curl 工具 ──────────────────────────────────────────────

const { execSync } = require('child_process');

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

function uploadImage(token: string, blockId: string, imageBuffer: Buffer, fileName: string): string {
  const tmpFile = `/tmp/wine_img_${Date.now()}.jpg`;
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
  if (json.code === 0) return json.data.file_token;
  throw new Error(json.msg || `Upload failed: code ${json.code}`);
}

// ─── 子页面定义 ──────────────────────────────────────────────

interface SubPage {
  title: string;
  imageUrl?: string;
  blocks: any[];
}

const SUB_PAGES: SubPage[] = [
  // ═══ 1. 西餐配酒详细指南 ═══
  {
    title: '🍽️ 西餐配酒详细指南 —— 从前菜到甜点',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    blocks: [
      h1('西餐配酒详细指南'),
      p(t('西餐配酒有几百年历史，规则相对成熟。掌握这些搭配，你在任何西餐厅都能自信点酒。')),
      p(t('')),

      h2('核心原则'),
      ol(b('重量匹配'), t(' —— 轻菜配轻酒，重菜配重酒')),
      ol(b('风味互补'), t(' —— 酸配酸（番茄酱配高酸酒）、甜配甜（甜点配甜酒）')),
      ol(b('地域原则'), t(' —— 意大利菜配意大利酒，法餐配法国酒，往往不会出错')),
      ol(b('酱汁决定酒'), t(' —— 不是看主料是什么肉，而是看用什么酱')),
      p(t('')),

      h2('🥗 前菜 / 沙拉'),
      p(t('前菜通常清淡，需要清爽的酒来开胃。')),
      li(b('绿色沙拉/醋汁沙拉：'), t('长相思（高酸对高酸）、干型桃红')),
      li(b('生蚝/海鲜拼盘：'), t('夏布利、香槟、Muscadet —— 矿物感与海洋的天然搭配')),
      li(b('鹅肝/肉酱：'), t('苏玳贵腐（经典法餐搭配）、晚收雷司令')),
      li(b('布拉塔奶酪/卡普雷塞：'), t('灰皮诺、Vermentino —— 意大利白酒配意大利前菜')),
      li(b('火腿（Prosciutto/Jamón）：'), t('Fino 雪莉、Lambrusco 微泡、干型桃红')),
      p(t('')),

      h2('🍝 意面 / 意大利菜'),
      p(t('关键看酱汁，不是看面条形状。')),
      li(b('番茄酱底（Marinara/Arrabbiata）：'), t('桑娇维塞（Chianti）、丹魄 —— 高酸对高酸')),
      li(b('奶油酱底（Alfredo/Carbonara）：'), t('过桶霞多丽、Soave —— 奶油感对奶油感')),
      li(b('肉酱（Bolognese）：'), t('Chianti Classico、Montepulciano d\'Abruzzo')),
      li(b('松露/蘑菇：'), t('Nebbiolo（Barolo/Barbaresco）—— 泥土感互相呼应')),
      li(b('海鲜意面（Vongole）：'), t('Verdicchio、Gavi —— 意大利海边白酒')),
      li(b('Pizza Margherita：'), t('年轻的 Chianti 或任何中等酒体意大利红酒')),
      p(t('')),

      h2('🥩 牛排 / 烤肉'),
      p(t('牛排是葡萄酒最经典的搭配对象。')),
      li(b('菲力（Filet Mignon）：'), t('梅洛、勃艮第黑皮诺 —— 嫩肉配柔和的酒')),
      li(b('肋眼（Ribeye）：'), t('赤霞珠、马尔贝克 —— 油花丰富需要高单宁切油')),
      li(b('T骨/战斧：'), t('巴罗洛、纳帕赤霞珠 —— 大肉配大酒')),
      li(b('烤羊排：'), t('里奥哈丹魄、北罗讷西拉 —— 胡椒感配膻味')),
      li(b('BBQ肋排（甜酱）：'), t('仙粉黛（Zinfandel）—— 果酱感配甜酱')),
      p(t('')),
      p(b('牛排熟度与配酒：')),
      li(t('三分熟 → 单宁高一点（赤霞珠），血水能化解单宁')),
      li(t('五分熟 → 最百搭（梅洛、西拉都行）')),
      li(t('全熟 → 果味浓一点（马尔贝克、仙粉黛），弥补肉汁流失')),
      p(t('')),

      h2('🐟 海鲜'),
      li(b('生食（生蚝/Tartare）：'), t('夏布利、Muscadet、干型香槟 —— 矿物感 + 高酸')),
      li(b('白灼/清蒸鱼：'), t('长相思、Vermentino —— 清爽不抢味')),
      li(b('煎三文鱼：'), t('勃艮第黑皮诺 —— 红酒配鱼的经典例外')),
      li(b('龙虾/蟹（黄油酱）：'), t('过桶霞多丽、Viognier —— 黄油对黄油')),
      li(b('炸鱼薯条：'), t('香槟、起泡酒 —— 气泡切油脂，绝配')),
      li(b('海鲜浓汤（Bouillabaisse）：'), t('普罗旺斯桃红 —— 法国南部菜配法国南部酒')),
      p(t('')),

      h2('🍗 禽类'),
      li(b('烤鸡/白切鸡：'), t('霞多丽、白皮诺（Pinot Blanc）')),
      li(b('鸭胸/鸭腿：'), t('黑皮诺 —— 全球公认的天作之合')),
      li(b('火鸡（感恩节）：'), t('博若莱新酒、俄勒冈黑皮诺、半干雷司令')),
      li(b('鸡肝酱：'), t('Gewürztraminer（琼瑶浆）、半甜雷司令')),
      p(t('')),

      h2('🧀 奶酪'),
      p(t('奶酪配酒是一门独立的学问。核心：'), b('越浓的奶酪配越重的酒。')),
      li(b('新鲜软质（Mozzarella/Burrata）：'), t('灰皮诺、Prosecco')),
      li(b('花皮软质（Brie/Camembert）：'), t('香槟、勃艮第霞多丽')),
      li(b('半硬质（Gruyère/Comté）：'), t('侏罗黄酒（Vin Jaune）、干型雪莉')),
      li(b('硬质（Parmigiano/Manchego）：'), t('Barolo、Rioja Reserva —— 浓郁对浓郁')),
      li(b('蓝纹（Roquefort/Gorgonzola）：'), t('苏玳贵腐、波特酒 —— 咸甜碰撞是终极搭配')),
      li(b('山羊奶酪（Chèvre）：'), t('桑赛尔长相思 —— 同产区经典组合')),
      p(t('')),

      h2('🍫 甜点'),
      p(b('铁律：酒的甜度必须 ≥ 甜点的甜度，'), t('否则酒会变苦变酸。')),
      li(b('巧克力蛋糕/熔岩蛋糕：'), t('年份波特酒、Banyuls')),
      li(b('焦糖布丁/提拉米苏：'), t('PX 雪莉、Vin Santo')),
      li(b('水果塔/夏洛特：'), t('莫斯卡托、晚收雷司令')),
      li(b('蓝莓派/黑森林：'), t('Brachetto d\'Acqui（意大利甜红泡）')),
      li(b('冰淇淋：'), t('莫斯卡托、冰酒 —— 冰对冰')),
      p(t('')),

      h2('🍷 一顿完整西餐怎么配？'),
      p(b('示范：法式正餐四道菜')),
      ol(b('前菜（生蚝）：'), t('一杯夏布利')),
      ol(b('鱼（煎鲈鱼黄油酱）：'), t('勃艮第霞多丽')),
      ol(b('主菜（烤羊排）：'), t('波尔多左岸（赤霞珠为主）')),
      ol(b('甜点（焦糖布丁）：'), t('苏玳贵腐')),
      p(t('')),
      quote(t('在西餐厅不知道点什么酒？告诉侍酒师你点了什么菜和预算，让他推荐。\n这不丢人，反而是最懂行的做法 —— 侍酒师存在的意义就是帮你选酒。')),
    ],
  },

  // ═══ 2. 葡萄品种图鉴 ═══
  {
    title: '🍇 葡萄品种图鉴 —— 18 个你该认识的品种',
    imageUrl: 'https://images.unsplash.com/photo-1596142813630-40ddcaf14fbe?w=1200&q=80',
    blocks: [
      h1('葡萄品种图鉴'),
      p(t('全球有超过 10,000 个葡萄品种，但真正常见的不到 20 个。认识这些，你就能看懂 90% 的酒。')),
      p(t('')),

      h2('🔴 红葡萄品种'),
      p(t('')),

      h3('1. 赤霞珠（Cabernet Sauvignon）'),
      p(b('一句话：'), t('葡萄酒之王，浓郁强劲')),
      li(b('香气：'), t('黑加仑、雪松、烟草、青椒（未成熟时）')),
      li(b('酒体：'), t('重')),
      li(b('单宁：'), t('高')),
      li(b('酸度：'), t('中高')),
      li(b('核心产区：'), t('波尔多左岸、纳帕谷、智利、澳洲库纳瓦拉')),
      li(b('配餐：'), t('牛排、烤羊、硬质奶酪')),
      li(b('入门酒：'), t('奔富 Bin 407（¥500）、长城五星（¥200）')),
      p(t('')),

      h3('2. 梅洛（Merlot）'),
      p(b('一句话：'), t('最友好的红酒，柔和圆润')),
      li(b('香气：'), t('李子、巧克力、樱桃、丝绒质感')),
      li(b('酒体：'), t('中到重')),
      li(b('单宁：'), t('中')),
      li(b('核心产区：'), t('波尔多右岸（圣埃美隆、波美侯）、智利、华盛顿州')),
      li(b('配餐：'), t('意面、烤鸡、Pizza —— 百搭')),
      li(b('入门酒：'), t('干露红魔鬼梅洛（¥60）')),
      p(t('')),

      h3('3. 黑皮诺（Pinot Noir）'),
      p(b('一句话：'), t('优雅细腻的"红酒中的公主"')),
      li(b('香气：'), t('樱桃、草莓、玫瑰、蘑菇（陈年后）')),
      li(b('酒体：'), t('轻到中')),
      li(b('单宁：'), t('低')),
      li(b('核心产区：'), t('勃艮第、新西兰、俄勒冈、德国（Spätburgunder）')),
      li(b('配餐：'), t('鸭肉、三文鱼、蘑菇、松露')),
      li(b('入门酒：'), t('云雾之湾黑皮诺（¥200）、路易拉图勃艮第（¥300）')),
      li(it('难种、低产、对气候极其敏感，所以好的黑皮诺往往很贵')),
      p(t('')),

      h3('4. 西拉/设拉子（Syrah/Shiraz）'),
      p(b('一句话：'), t('浓烈奔放，胡椒与黑莓的碰撞')),
      li(b('香气：'), t('黑胡椒、黑莓、烟熏、培根')),
      li(b('酒体：'), t('重')),
      li(b('单宁：'), t('中高')),
      li(b('核心产区：'), t('北罗讷（Syrah）、巴罗萨谷（Shiraz）')),
      li(b('配餐：'), t('BBQ、烤肉、炖牛肉')),
      li(b('区别：'), t('法国叫 Syrah 偏优雅胡椒味；澳洲叫 Shiraz 偏果酱甜美')),
      li(b('入门酒：'), t('奔富 Bin 28（¥200）')),
      p(t('')),

      h3('5. 马尔贝克（Malbec）'),
      p(b('一句话：'), t('阿根廷国酒，饱满浓郁')),
      li(b('香气：'), t('紫罗兰、黑莓、巧克力、咖啡')),
      li(b('酒体：'), t('中到重')),
      li(b('核心产区：'), t('阿根廷门多萨（高海拔 = 好马尔贝克）')),
      li(b('配餐：'), t('烤牛肉、阿根廷烤肉、墨西哥菜')),
      li(b('入门酒：'), t('卡氏家族马尔贝克（¥150）')),
      p(t('')),

      h3('6. 内比奥罗（Nebbiolo）'),
      p(b('一句话：'), t('意大利酒王品种，高酸高单宁')),
      li(b('香气：'), t('玫瑰、焦油、樱桃、皮革、松露')),
      li(b('酒体：'), t('中（但单宁极高，像穿了盔甲的轻骑兵）')),
      li(b('核心产区：'), t('皮埃蒙特（Barolo = "意大利酒王"、Barbaresco）')),
      li(b('配餐：'), t('松露意面、炖肉、陈年硬质奶酪')),
      li(it('颜色浅但味道浓，是最"骗人"的品种')),
      p(t('')),

      h3('7. 桑娇维塞（Sangiovese）'),
      p(b('一句话：'), t('意大利种植最广的品种，酸度之王')),
      li(b('香气：'), t('酸樱桃、番茄、草药、泥土')),
      li(b('酒体：'), t('中')),
      li(b('核心产区：'), t('托斯卡纳（Chianti、Brunello di Montalcino）')),
      li(b('配餐：'), t('番茄意面、Pizza、烤蔬菜 —— 意大利菜的灵魂伴侣')),
      li(b('入门酒：'), t('Chianti Classico（¥100-200）')),
      p(t('')),

      h3('8. 丹魄（Tempranillo）'),
      p(b('一句话：'), t('西班牙国酒，橡木桶味的皮革感')),
      li(b('香气：'), t('樱桃、皮革、香草、烟草')),
      li(b('核心产区：'), t('里奥哈、杜罗河谷')),
      li(b('配餐：'), t('伊比利亚火腿、烤乳猪、炖肉')),
      li(b('性价比：'), t('里奥哈 Crianza/Reserva 100-200 元，品质远超价格')),
      p(t('')),

      h3('9. 歌海娜（Grenache/Garnacha）'),
      p(b('一句话：'), t('南法和西班牙的主力，温暖果香')),
      li(b('香气：'), t('草莓、覆盆子、白胡椒、薰衣草')),
      li(b('酒体：'), t('中到重')),
      li(b('核心产区：'), t('教皇新堡（混酿主力）、普里奥拉特')),
      li(b('特点：'), t('单独装瓶少见，通常和西拉、慕合怀特混酿（GSM）')),
      p(t('')),

      h3('10. 仙粉黛（Zinfandel）'),
      p(b('一句话：'), t('加州标志品种，果酱炸弹')),
      li(b('香气：'), t('黑莓果酱、黑胡椒、甘草、肉桂')),
      li(b('酒体：'), t('重（酒精度常超 15%）')),
      li(b('核心产区：'), t('加州洛迪、索诺玛')),
      li(b('配餐：'), t('BBQ 排骨、甜酱烤肉、辣味菜')),
      li(it('White Zinfandel（白仙粉黛）是另一个东西 —— 便宜的粉色甜酒')),
      hr(),

      h2('⚪ 白葡萄品种'),
      p(t('')),

      h3('11. 霞多丽（Chardonnay）'),
      p(b('一句话：'), t('百变女王，从清爽到浓郁都能驾驭')),
      li(b('不过桶：'), t('青苹果、柑橘、矿物感（代表：夏布利）')),
      li(b('过桶：'), t('黄油、奶油、烤面包、香草（代表：纳帕霞多丽）')),
      li(b('核心产区：'), t('勃艮第、夏布利、纳帕谷、澳洲')),
      li(b('配餐：'), t('不过桶配海鲜，过桶配奶油酱/白肉')),
      li(b('入门酒：'), t('夏布利一级园（¥200）、蒙大维（¥150）')),
      p(t('')),

      h3('12. 长相思（Sauvignon Blanc）'),
      p(b('一句话：'), t('最清爽的白酒，青草与百香果')),
      li(b('香气：'), t('青草、百香果、柑橘、青椒')),
      li(b('酒体：'), t('轻')),
      li(b('酸度：'), t('高')),
      li(b('核心产区：'), t('新西兰马尔堡（果味炸弹）、卢瓦尔河桑赛尔（矿物感）')),
      li(b('配餐：'), t('沙拉、山羊奶酪、寿司、白灼虾')),
      li(b('入门酒：'), t('云雾之湾（¥180）')),
      p(t('')),

      h3('13. 雷司令（Riesling）'),
      p(b('一句话：'), t('最有陈年潜力的白酒，从干到甜全覆盖')),
      li(b('香气：'), t('青柠、蜂蜜、白桃、汽油味（陈年后的标志）')),
      li(b('酒体：'), t('轻到中')),
      li(b('核心产区：'), t('德国摩泽尔、阿尔萨斯、澳洲伊甸谷')),
      li(b('德国分级速查：'), t('Kabinett（最轻）→ Spätlese → Auslese → BA → TBA（最甜）')),
      li(b('配餐：'), t('辣菜、泰国菜、川菜（甜酸感压制辣味）')),
      li(b('入门酒：'), t('Dr. Loosen 蓝色雷司令（¥120）')),
      p(t('')),

      h3('14. 灰皮诺（Pinot Grigio/Pinot Gris）'),
      p(b('一句话：'), t('轻松易饮的日常白酒')),
      li(b('意大利版（Pinot Grigio）：'), t('清爽、简单、柑橘味')),
      li(b('法国版（Pinot Gris）：'), t('更丰满、蜂蜜、梨')),
      li(b('配餐：'), t('沙拉、清淡意面、作为开胃酒')),
      p(t('')),

      h3('15. 琼瑶浆（Gewürztraminer）'),
      p(b('一句话：'), t('最芳香的白酒，荔枝玫瑰炸弹')),
      li(b('香气：'), t('荔枝、玫瑰、姜、土耳其软糖')),
      li(b('酒体：'), t('中到重（白酒里算重的）')),
      li(b('核心产区：'), t('阿尔萨斯')),
      li(b('配餐：'), t('中餐（！）、泰国菜、印度菜 —— 芳香型白酒是亚洲菜的绝配')),
      p(t('')),

      h3('16. 维欧尼（Viognier）'),
      p(b('一句话：'), t('丰满芳香的白酒，杏子与花香')),
      li(b('香气：'), t('杏子、桃子、金银花')),
      li(b('酒体：'), t('重（白酒里最重的之一）')),
      li(b('核心产区：'), t('北罗讷（Condrieu）、加州、澳洲')),
      li(b('配餐：'), t('龙虾黄油酱、咖喱鸡')),
      p(t('')),

      h3('17. 赛美蓉（Sémillon）'),
      p(b('一句话：'), t('波尔多白酒和贵腐甜酒的灵魂')),
      li(b('干型：'), t('柠檬、蜡质感（猎人谷）')),
      li(b('甜型：'), t('蜂蜜、杏脯、藏红花（苏玳贵腐）')),
      li(b('特点：'), t('陈年后会发展出烤面包和蜂蜡的复杂香气')),
      p(t('')),

      h3('18. 麝香（Muscat/Moscato）'),
      p(b('一句话：'), t('最像葡萄味的葡萄酒，甜蜜易饮')),
      li(b('香气：'), t('葡萄、蜜桃、荔枝、橙花')),
      li(b('代表：'), t('Moscato d\'Asti（微泡甜酒，5-6%酒精度）')),
      li(b('配餐：'), t('水果、甜点，或者单喝当"快乐水"')),
      li(b('入门酒：'), t('小蝴蝶莫斯卡托（¥60-80）')),
      p(t('')),

      quote(t('不需要一次记住所有品种。\n建议：每次买酒时有意识地试一个新品种，一年下来你就认识它们了。')),
    ],
  },

  // ═══ 3. 年份速查表 ═══
  {
    title: '📅 年份速查表 —— 哪些年该买，哪些年别碰',
    imageUrl: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=1200&q=80',
    blocks: [
      h1('年份速查表'),
      p(t('年份代表这一年的天气条件。好年份 = 葡萄成熟好 = 酒的品质高。但年份只对中高端酒有意义，100 元以下的酒不用看年份。')),
      p(t('')),

      h2('📖 先懂几个概念'),
      li(b('好年份（Great Vintage）：'), t('生长季阳光充足、雨水适中、采收期天气好')),
      li(b('差年份（Off Vintage）：'), t('雨水过多、阳光不足、采收期遇雨')),
      li(b('世纪年份（Vintage of the Century）：'), t('几十年一遇的完美年份')),
      li(it('同一年份不同产区可以差很大 —— 波尔多好年不代表勃艮第也好')),
      p(t('')),

      h2('🇫🇷 波尔多（Bordeaux）'),
      p(t('波尔多是最看年份的产区，好坏年份价格差距可达数倍。')),
      p(t('')),
      h3('近 20 年好年份'),
      li(b('⭐⭐⭐ 世纪级：'), t('2005、2009、2010、2016、2019、2022')),
      li(b('⭐⭐ 优秀：'), t('2006、2014、2015、2018、2020')),
      li(b('⭐ 不错：'), t('2008、2012、2017')),
      p(t('')),
      h3('建议回避'),
      li(t('2007、2011、2013 —— 雨水多，品质一般')),
      p(t('')),
      p(b('性价比技巧：'), t('2014、2017 这种"次好年份"，酒庄品质依然在线，但价格比 2015/2016 便宜 30-50%。')),
      hr(),

      h2('🇫🇷 勃艮第（Burgundy）'),
      p(t('勃艮第比波尔多更看年份，因为黑皮诺极其敏感。')),
      p(t('')),
      h3('红酒好年份'),
      li(b('⭐⭐⭐ 顶级：'), t('2005、2009、2010、2015、2019、2020、2022')),
      li(b('⭐⭐ 优秀：'), t('2012、2016、2017、2018')),
      p(t('')),
      h3('白酒好年份'),
      li(b('⭐⭐⭐ 顶级：'), t('2010、2014、2017、2019、2020')),
      li(b('⭐⭐ 优秀：'), t('2012、2015、2022')),
      p(t('')),
      p(b('特别提醒：'), t('2021 勃艮第因霜冻产量极低，品质其实不错但价格被炒高，性价比低。')),
      hr(),

      h2('🇮🇹 意大利'),
      p(t('')),
      h3('皮埃蒙特（Barolo/Barbaresco）'),
      li(b('⭐⭐⭐ 顶级：'), t('2010、2013、2016、2019、2020')),
      li(b('⭐⭐ 优秀：'), t('2006、2007、2015、2017、2018')),
      p(t('')),
      h3('托斯卡纳（Chianti/Brunello）'),
      li(b('⭐⭐⭐ 顶级：'), t('2006、2010、2015、2016、2019')),
      li(b('⭐⭐ 优秀：'), t('2007、2012、2013、2018')),
      hr(),

      h2('🇪🇸 西班牙（里奥哈）'),
      li(b('⭐⭐⭐ 顶级：'), t('2004、2005、2010、2011、2016、2019')),
      li(b('⭐⭐ 优秀：'), t('2006、2009、2014、2015、2018')),
      p(t('')),
      p(it('里奥哈酒标上的 Crianza/Reserva/Gran Reserva 比年份更重要 —— Gran Reserva 只在好年份酿造。')),
      hr(),

      h2('🇺🇸 纳帕谷（Napa Valley）'),
      li(b('⭐⭐⭐ 顶级：'), t('2007、2012、2013、2016、2018、2019、2021')),
      li(b('⭐⭐ 优秀：'), t('2005、2006、2010、2014、2015、2022')),
      p(t('')),
      p(b('注意：'), t('2017 和 2020 受加州山火影响，部分酒有烟熏污染（Smoke Taint），购买前建议查看评分。')),
      hr(),

      h2('🇦🇺 澳大利亚'),
      h3('巴罗萨谷（Barossa Valley）'),
      li(b('⭐⭐⭐ 顶级：'), t('2006、2010、2012、2013、2018、2019、2021')),
      li(b('⭐⭐ 优秀：'), t('2005、2008、2014、2016')),
      p(t('')),
      p(it('奔富 Grange 的好年份：2008、2010、2018 是近年公认三大年份。')),
      hr(),

      h2('🇨🇱🇦🇷 南美'),
      p(t('南美气候稳定，年份差异相对较小。')),
      h3('智利'),
      li(b('优秀年份：'), t('2007、2010、2013、2015、2017、2018')),
      h3('阿根廷（门多萨）'),
      li(b('优秀年份：'), t('2006、2010、2013、2017、2019、2020')),
      p(t('')),
      p(it('南美酒的性价比优势：即使不是顶级年份，品质波动也不大。放心买。')),
      hr(),

      h2('📊 年份实用建议'),
      p(t('')),
      ol(b('100 元以内的酒：'), t('完全不用看年份，买最新年份就好')),
      ol(b('100-500 元的酒：'), t('差年份打折买反而性价比高')),
      ol(b('500 元以上的酒：'), t('认真看年份，好年份值得多花钱')),
      ol(b('收藏/投资：'), t('只买世纪年份的名庄正牌')),
      p(t('')),
      quote(t('年份不是一切。好的酿酒师能在差年份做出好酒，差的酿酒师在好年份也能搞砸。\n年份只是参考因素之一，不要被年份绑架。')),
    ],
  },

  // ═══ 4. 酒具选购指南 ═══
  {
    title: '🛠️ 酒具选购指南 —— 杯子比酒重要？',
    imageUrl: 'https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?w=1200&q=80',
    blocks: [
      h1('酒具选购指南'),
      p(t('好的酒具能让同一瓶酒好喝 30%。这不是玄学，是物理和化学。')),
      p(t('')),

      h2('🍷 酒杯 —— 最值得投资的酒具'),
      p(t('')),

      h3('为什么杯子这么重要？'),
      li(b('杯肚大小'), t(' → 决定酒液与空气接触面积 → 影响香气释放')),
      li(b('杯口收窄程度'), t(' → 决定香气聚拢程度 → 影响你闻到的香气浓度')),
      li(b('杯壁薄厚'), t(' → 影响酒液入口的体验 → 薄杯壁让酒更"优雅"')),
      li(b('杯梗长度'), t(' → 防止手温传递到酒液 → 尤其白酒和香槟很重要')),
      p(t('')),

      h3('四种必备杯型'),
      p(t('')),
      p(b('1. 波尔多杯（Bordeaux Glass）')),
      li(t('杯肚大、杯身高、杯口略收')),
      li(t('适合：赤霞珠、梅洛、西拉、马尔贝克 —— 所有浓郁红酒')),
      li(t('原理：大杯肚让浓郁红酒充分呼吸，杯口引导酒液到舌中后部（感受单宁）')),
      li(b('推荐：'), t('Riedel Vinum Bordeaux（¥200/对）—— 性价比之王')),
      p(t('')),
      p(b('2. 勃艮第杯（Burgundy Glass）')),
      li(t('杯肚最大最圆、杯口明显收窄')),
      li(t('适合：黑皮诺、内比奥罗 —— 香气细腻的红酒')),
      li(t('原理：大肚子最大化香气释放，收口把细腻香气锁住')),
      li(b('推荐：'), t('Riedel Vinum Burgundy（¥200/对）')),
      p(t('')),
      p(b('3. 白葡萄酒杯（White Wine Glass）')),
      li(t('比红酒杯小、杯口更窄')),
      li(t('适合：霞多丽、长相思、雷司令 —— 所有白葡萄酒')),
      li(t('原理：小杯身保持低温，窄杯口聚拢清新果香')),
      li(b('推荐：'), t('Riedel Vinum Sauvignon Blanc（¥180/对）')),
      p(t('')),
      p(b('4. 香槟杯')),
      li(b('笛形杯（Flute）：'), t('细长，保持气泡持久。适合观赏和派对')),
      li(b('郁金香杯（Tulip）：'), t('比笛形略宽，能闻到更多香气。适合品鉴')),
      li(it('专业品酒师越来越多用白葡萄酒杯喝香槟，因为香气更丰富')),
      p(t('')),

      h3('酒杯品牌推荐'),
      li(b('入门（¥50-150/对）：'), t('IKEA 365+（别笑，形状合理就行）、Ocean')),
      li(b('进阶（¥150-400/对）：'), t('Riedel Vinum 系列 —— 专业杯型的性价比之选')),
      li(b('发烧（¥400-1000/只）：'), t('Riedel Superleggero、Zalto —— 手工吹制，薄如蝉翼')),
      li(b('土豪（¥1000+/只）：'), t('Lobmeyr、Riedel Sommeliers —— 博物馆级工艺')),
      p(t('')),
      p(b('终极建议：'), t('如果只买一种杯子，买一对大号的波尔多杯。红白都能用，万能。')),
      hr(),

      h2('🔧 开瓶器'),
      p(t('')),

      h3('1. 侍者之友（Waiter\'s Friend / Sommelier Knife）'),
      li(t('专业侍酒师都用这种，小巧便携')),
      li(t('两段式更好用（两个支点更省力）')),
      li(b('推荐：'), t('Pulltap\'s 双关节（¥30-50）—— 全球餐厅标配')),
      li(b('进阶：'), t('Laguiole（拉吉奥尔）手工刀（¥300-2000）—— 法国手工艺品，颜值巅峰')),
      p(t('')),

      h3('2. 兔耳开瓶器（Rabbit / Lever）'),
      li(t('夹住瓶口，上下一拉就开')),
      li(t('适合手力小的人或需要频繁开瓶')),
      li(b('推荐：'), t('Rabbit 原版（¥200）')),
      p(t('')),

      h3('3. Ah-So（双片式）'),
      li(t('两片薄金属片插入瓶口两侧，旋转拔出')),
      li(t('专门用于老酒（老酒瓶塞容易碎裂）')),
      li(it('用法需要练习，但一旦学会非常帅')),
      p(t('')),

      h3('4. 电动开瓶器'),
      li(t('按一下自动拔塞')),
      li(t('送长辈/怕麻烦的人首选')),
      li(b('推荐：'), t('小米/京造电动开瓶器（¥50-100）')),
      p(t('')),
      p(b('不推荐：'), t('T型开瓶器（太费力）、气压开瓶器（有安全隐患）')),
      hr(),

      h2('🫗 醒酒器'),
      p(t('')),
      h3('什么酒需要醒？'),
      li(b('需要：'), t('年轻的浓郁红酒（赤霞珠、巴罗洛、高端设拉子）')),
      li(b('可选：'), t('中等酒体红酒（梅洛、桑娇维塞）')),
      li(b('不需要：'), t('白葡萄酒、起泡酒、轻酒体红酒、老酒（老酒用窄口醒酒器轻倒即可）')),
      p(t('')),

      h3('醒酒器选择'),
      li(b('宽底型（Classic Decanter）：'), t('大面积接触空气，适合年轻浓郁红酒。最实用')),
      li(b('天鹅型（Swan Decanter）：'), t('颈长、底宽，倒酒优雅。适合宴请')),
      li(b('U型/蛇形：'), t('造型好看但难清洗。适合展示')),
      p(t('')),
      li(b('推荐：'), t('Riedel Merlot Decanter（¥200-300）—— 经典宽底，好洗好用')),
      li(it('没有醒酒器？把酒倒进一个大水壶里也行，原理一样')),
      hr(),

      h2('🧊 其他实用酒具'),
      p(t('')),
      li(b('真空保鲜塞（Vacu Vin）：'), t('¥30-50，抽出瓶中空气延长保鲜。开了喝不完必备')),
      li(b('酒温计：'), t('¥20-50，夹在酒瓶外壁测温度。强迫症必备')),
      li(b('倒酒片（Drop Stop）：'), t('¥10/包，薄膜片卷成卷插瓶口，防滴漏。实用小神器')),
      li(b('冰桶/冰袖：'), t('¥30-100，白酒和起泡酒的餐桌伴侣')),
      li(b('香槟塞：'), t('¥20-50，开了的起泡酒必须用专用塞。普通瓶塞塞不住')),
      li(b('酒柜：'), t('¥500-5000+，认真存酒才需要。入门推荐 12 瓶小酒柜')),
      p(t('')),

      h2('💰 新手推荐套装'),
      p(b('总预算 ¥300 以内搞定全套：')),
      ol(t('Riedel Vinum 波尔多杯一对 ¥200')),
      ol(t('Pulltap\'s 开瓶器 ¥30')),
      ol(t('Vacu Vin 真空塞 ¥30')),
      ol(t('Drop Stop 倒酒片 ¥10')),
      p(t('')),
      quote(t('酒具是为了让喝酒更方便、更享受，不是为了装。\n用 IKEA 的杯子喝 DRC 也不丢人，用 Zalto 喝黄尾袋鼠也没问题。\n重要的是享受那一杯酒。')),
    ],
  },
];

// ─── 主流程 ──────────────────────────────────────────────────

const SPACE_ID = '7615178195469421499';
const PARENT_NODE = 'LaBgw4iypixpaFkrX9dcyV5Undh';

async function main() {
  console.log('🍷 开始创建第二批扩展子页面...\n');

  // 获取 token
  const userTokenFile = path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json');
  let token: string;
  if (fs.existsSync(userTokenFile)) {
    const tokenData = JSON.parse(fs.readFileSync(userTokenFile, 'utf-8'));
    const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
    if (elapsed < tokenData.expires_in - 60) {
      token = tokenData.access_token;
      console.log(`User OAuth Token (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);
    } else {
      console.error('Token 过期，请先运行 feishu-auth.js 重新授权');
      return;
    }
  } else {
    console.error('未找到 token 文件');
    return;
  }

  for (let i = 0; i < SUB_PAGES.length; i++) {
    const page = SUB_PAGES[i];
    console.log(`\n[${i + 1}/${SUB_PAGES.length}] 创建: ${page.title}`);

    // 1. 创建 wiki 节点
    const nodeRes = curlApi('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, token, {
      obj_type: 'docx', node_type: 'origin', parent_node_token: PARENT_NODE, title: page.title,
    });
    if (nodeRes.code !== 0) {
      console.error(`  创建失败: ${nodeRes.msg} (${nodeRes.code})`);
      continue;
    }
    const nodeToken = nodeRes.data.node.node_token;
    const docId = nodeRes.data.node.obj_token;
    console.log(`  节点: ${nodeToken}`);

    // 2. 写入 blocks
    const hasImage = !!page.imageUrl;
    const allBlocks = hasImage ? [img(), ...page.blocks] : page.blocks;

    const chunkSize = 30;
    let imageBlockId = '';
    for (let j = 0; j < allBlocks.length; j += chunkSize) {
      const chunk = allBlocks.slice(j, j + chunkSize);
      const res = curlApi('POST', `/open-apis/docx/v1/documents/${docId}/blocks/${docId}/children`, token, { children: chunk });
      if (res.code !== 0) {
        console.error(`  blocks ${j}-${j + chunk.length} 失败: ${res.msg}`);
      } else {
        console.log(`  blocks ${j + 1}-${j + chunk.length} ✓`);
        if (j === 0 && hasImage && res.data?.children?.[0]) {
          imageBlockId = res.data.children[0].block_id;
        }
      }
      if (j + chunkSize < allBlocks.length) await new Promise(r => setTimeout(r, 300));
    }

    // 3. 上传图片
    if (hasImage && imageBlockId && page.imageUrl) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          console.log(`  上传封面图...`);
          const buf = await downloadImage(page.imageUrl);
          uploadImage(token, imageBlockId, buf, `wine_sub2_${i}.jpg`);
          console.log(`  封面图 ✓`);
          break;
        } catch (err: any) {
          if (attempt < 4) { console.log(`  图片重试 (${attempt + 1}/5)`); await new Promise(r => setTimeout(r, 2000)); }
          else console.error(`  封面图失败: ${err.message}`);
        }
      }
    }

    console.log(`  ✅ https://hcn2vc1r2jus.feishu.cn/wiki/${nodeToken}`);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n\n🎉 第二批子页面创建完成！');
  console.log(`知识库首页：https://hcn2vc1r2jus.feishu.cn/wiki/${PARENT_NODE}`);
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
