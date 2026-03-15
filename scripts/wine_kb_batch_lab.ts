/**
 * 餐酒实验室 批量创建 #2-20
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_batch_lab.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
const { execSync } = require('child_process');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) { const k = trimmed.slice(0, eqIdx).trim(); const v = trimmed.slice(eqIdx+1).trim(); if (!process.env[k]) process.env[k] = v; }
  }
}

function t(c: string, s?: any) { return { text_run: { content: c, text_element_style: s ?? {} } }; }
function b(c: string) { return t(c, { bold: true }); }
function it(c: string) { return t(c, { italic: true }); }
function p(...e: any[]) { return { block_type: 2, text: { elements: e, style: {} } }; }
function h1(s: string) { return { block_type: 3, heading1: { elements: [t(s)], style: {} } }; }
function h2(s: string) { return { block_type: 4, heading2: { elements: [t(s)], style: {} } }; }
function li(...e: any[]) { return { block_type: 12, bullet: { elements: e, style: {} } }; }
function ol(...e: any[]) { return { block_type: 13, ordered: { elements: e, style: {} } }; }
function hr() { return { block_type: 22, divider: {} }; }
function quote(...e: any[]) { return { block_type: 15, quote: { elements: e, style: {} } }; }
function img() { return { block_type: 27, image: {} }; }

function curlApi(method: string, apiPath: string, token: string, body?: any): any {
  const f = `/tmp/fb_${Date.now()}.json`;
  if (body) fs.writeFileSync(f, JSON.stringify(body));
  let cmd = `curl -sk --connect-timeout 30 --max-time 120 --retry 3 --retry-delay 2 -X ${method} "https://open.feishu.cn${apiPath}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`;
  if (body) cmd += ` -d @${f}`;
  for (let i = 0; i < 5; i++) {
    try { return JSON.parse(execSync(cmd, { encoding: 'utf-8', maxBuffer: 10*1024*1024, stdio: ['pipe','pipe','pipe'], timeout: 120000 })); }
    catch (err: any) { console.error(`  retry ${i+1}`); if (i < 4) execSync('sleep 3'); else return { code: -1, msg: 'failed' }; }
  }
}

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = (u: string, r = 0) => {
      if (r > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : require('http');
      mod.get(u, { rejectUnauthorized: false }, (res: any) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location, r+1);
        const chunks: Buffer[] = []; res.on('data', (c: Buffer) => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks))); res.on('error', reject);
      }).on('error', reject);
    };
    get(url);
  });
}

function uploadAndPatch(token: string, objToken: string, blockId: string, buf: Buffer, name: string) {
  const f = `/tmp/ws_${Date.now()}.jpg`; fs.writeFileSync(f, buf);
  const r = execSync(`curl -sk --retry 5 --retry-delay 3 --max-time 60 -X POST "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all" -H "Authorization: Bearer ${token}" -F "file_name=${name}" -F "parent_type=docx_image" -F "parent_node=${blockId}" -F "size=${buf.length}" -F "file=@${f};type=image/jpeg"`, { encoding: 'utf-8', stdio: ['pipe','pipe','pipe'], timeout: 120000 });
  try { fs.unlinkSync(f); } catch {}
  const j = JSON.parse(r); if (j.code !== 0) throw new Error(j.msg);
  curlApi('PATCH', `/open-apis/docx/v1/documents/${objToken}/blocks/${blockId}`, token, { replace_image: { token: j.data.file_token } });
}

const SPACE_ID = '7615178195469421499';
const PARENT_NODE = 'WEMtwW9AciRTzLkyHb8c4ek3noc'; // 餐酒实验室

interface PairingTest {
  food: string;
  wine: string;
  rating: number; // 1-5
  comment: string;
}

interface LabData {
  num: number;
  title: string;
  subtitle: string;
  setting: string;
  tests: PairingTest[];
  winner: string;
  lessons: string[];
  cost: { item: string; price: string }[];
  imgUrl: string;
}

function labToBlocks(d: LabData): any[] {
  const stars = (n: number) => '⭐'.repeat(n) + '☆'.repeat(5 - n);
  const blocks: any[] = [
    img(), p(t('')),
    quote(b(`餐酒实验室 · 第 ${d.num} 期`), t(`\n${d.subtitle}`)),
    p(t('')), hr(),
    h1('🧪 实验设定'), p(t('')),
    p(t(d.setting)),
    p(t('')), hr(),
    h1('🍽️ 逐轮测试'), p(t('')),
  ];
  for (const test of d.tests) {
    blocks.push(
      h2(`${test.food} × ${test.wine}`),
      p(b('评分：'), t(stars(test.rating))),
      p(t(test.comment)),
      p(t('')),
    );
  }
  blocks.push(hr(), h1('🏆 总结 & 心得'), p(t('')));
  blocks.push(p(b('本期最佳搭配：'), t(d.winner)), p(t('')));
  for (const l of d.lessons) blocks.push(li(t(l)));
  blocks.push(p(t('')), hr(), h1('💰 花费明细'), p(t('')));
  for (const c of d.cost) blocks.push(li(b(c.item), t(`  ${c.price}`)));
  blocks.push(p(t('')), hr(), p(t('')));
  blocks.push(quote(b('实验结论'), t(`\n${d.winner}\n\n—— 餐酒实验室 · 第 ${d.num} 期 🧪`)));
  return blocks;
}

const LABS: LabData[] = [
  {
    num: 2, title: '第 2 期：日料配酒实验', subtitle: '寿司、刺身、天妇罗，哪种酒才是日料的灵魂伴侣？',
    setting: '地点：日料居酒屋包间。食物：三文鱼寿司、金枪鱼刺身、虾天妇罗、鳗鱼饭、味噌汤。酒款：Chablis（夏布利）、新西兰长相思、意大利灰皮诺、Brut香槟、德国雷司令半干。温度统一冰镇至8-10°C。',
    tests: [
      { food: '三文鱼寿司', wine: 'Chablis 夏布利', rating: 5, comment: '教科书级搭配！夏布利的矿物感和柠檬酸度完美衬托三文鱼的油脂，收尾干净利落。酱油和芥末也不冲突。' },
      { food: '三文鱼寿司', wine: '新西兰长相思', rating: 3, comment: '长相思的热带果味和草本香有点抢戏，盖过了鱼肉的鲜味。酸度OK但风味不太搭。' },
      { food: '金枪鱼刺身', wine: '意大利灰皮诺', rating: 4, comment: '灰皮诺的淡雅花香和轻盈酒体跟金枪鱼的鲜甜很和谐。不惊艳但很舒服。' },
      { food: '金枪鱼刺身', wine: 'Brut 香槟', rating: 5, comment: '气泡把金枪鱼的鲜味提升了一个层次！而且香槟的酵母面包香增加了复杂度。强烈推荐。' },
      { food: '虾天妇罗', wine: '德国雷司令半干', rating: 5, comment: '天妇罗的酥脆面衣配雷司令的微甜和高酸，绝了！甜度中和了炸物的油腻，酸度清口。' },
      { food: '虾天妇罗', wine: 'Chablis 夏布利', rating: 4, comment: '也很好，但没有雷司令那种甜酸平衡带来的惊喜感。' },
      { food: '鳗鱼饭', wine: '新西兰长相思', rating: 2, comment: '鳗鱼酱汁太甜太浓，把长相思的果味完全压制了。不推荐。' },
      { food: '鳗鱼饭', wine: '德国雷司令半干', rating: 4, comment: '雷司令的甜度能跟鳗鱼酱汁对话，不会被压制。意外之喜。' },
      { food: '味噌汤', wine: 'Brut 香槟', rating: 3, comment: '味噌的发酵鲜味和香槟的酵母感有呼应，但汤的温度让冰镇香槟有点尴尬。' },
    ],
    winner: '虾天妇罗 × 德国雷司令半干——甜酸解腻的完美示范',
    lessons: [
      '日料配酒核心原则：高酸、低单宁、适度清爽',
      '夏布利几乎是万能日料搭档，矿物感和生鱼片天生一对',
      '香槟配刺身是隐藏大招，气泡提鲜效果明显',
      '有甜味酱汁的日料（鳗鱼饭、照烧）需要微甜的酒来应对',
      '避免用厚重红酒配日料，单宁会让鱼腥味放大',
    ],
    cost: [
      { item: '日料套餐（5道）', price: '¥268/人' },
      { item: 'Chablis William Fèvre', price: '¥198' },
      { item: '新西兰 Cloudy Bay 长相思', price: '¥168' },
      { item: '意大利 Santa Margherita 灰皮诺', price: '¥138' },
      { item: 'Moët Brut Impérial 375ml', price: '¥168' },
      { item: '德国 Dr. Loosen 雷司令半干', price: '¥108' },
      { item: '合计', price: '约 ¥1048（2人分摊 ¥524/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=800&q=80',
  },
  {
    num: 3, title: '第 3 期：烧烤配酒实验', subtitle: '撸串喝啤酒？试试撸串喝红酒吧！中式烧烤摊硬核测试。',
    setting: '地点：路边烧烤摊（有包间）。食物：羊肉串、牛肉串、烤茄子、烤生蚝、烤鸡翅、烤韭菜。酒款：马尔贝克（阿根廷）、歌海娜（GSM混酿）、黑皮诺（新西兰）、桃红（普罗旺斯）、起泡酒（Prosecco）、冰镇雷司令。',
    tests: [
      { food: '羊肉串', wine: '阿根廷马尔贝克', rating: 5, comment: '马尔贝克的浓郁黑果和烟熏感跟孜然羊肉简直天作之合！单宁包裹住羊肉的油脂，辣椒面的辣还能激活果味。' },
      { food: '羊肉串', wine: '新西兰黑皮诺', rating: 2, comment: '黑皮诺太优雅了，完全被孜然和辣椒面碾压。浪费。' },
      { food: '牛肉串', wine: 'GSM 混酿', rating: 5, comment: '歌海娜的胡椒香料感跟炭火牛肉极其搭配。南罗讷河谷风格的温暖果味让人停不下来。' },
      { food: '烤茄子', wine: '普罗旺斯桃红', rating: 4, comment: '烤茄子蒜泥的重口味居然被桃红的清爽酸度化解了。茄子的烟熏感和桃红的草莓味意外和谐。' },
      { food: '烤生蚝', wine: 'Prosecco 起泡酒', rating: 5, comment: '蒜蓉烤生蚝配冰镇Prosecco，气泡把蒜香和海鲜鲜味全部激活，一口一个幸福感爆棚。' },
      { food: '烤鸡翅', wine: '阿根廷马尔贝克', rating: 4, comment: '鸡翅的蜜汁酱料和马尔贝克的甜美果味互相加持。' },
      { food: '烤韭菜', wine: '冰镇雷司令', rating: 3, comment: '韭菜味道太冲，雷司令能部分化解但还是有点违和。不功不过。' },
    ],
    winner: '羊肉串 × 阿根廷马尔贝克——孜然遇上马尔贝克，烧烤界的天花板搭配',
    lessons: [
      '烧烤配酒的金科玉律：大口吃肉就要大酒，果味浓郁、单宁适中最佳',
      '马尔贝克和GSM混酿是烧烤的最佳拍档，价格还亲民',
      '海鲜烧烤用起泡酒或白酒，别用红酒',
      '太精致的酒（勃艮第黑皮诺）在烧烤面前毫无用武之地',
      '桃红是烧烤万金油——红白通吃，冰镇后尤其爽',
    ],
    cost: [
      { item: '烧烤（6种各两份）', price: '¥186' },
      { item: 'Trapiche 马尔贝克', price: '¥78' },
      { item: 'Famille Perrin GSM', price: '¥98' },
      { item: 'Cloudy Bay 黑皮诺', price: '¥228' },
      { item: '普罗旺斯 AIX 桃红', price: '¥138' },
      { item: 'Mionetto Prosecco', price: '¥88' },
      { item: 'Dr. Loosen 雷司令', price: '¥108' },
      { item: '合计', price: '约 ¥924（3人分摊 ¥308/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=800&q=80',
  },
  {
    num: 4, title: '第 4 期：粤菜配酒实验', subtitle: '广东人说「食得鲜」，鲜味和葡萄酒能碰撞出什么火花？',
    setting: '地点：粤菜酒楼。食物：白切鸡、脆皮烧鹅、虾饺、肠粉、干炒牛河。酒款：勃艮第白（Mâcon-Villages）、阿尔萨斯琼瑶浆、新西兰灰皮诺、Beaujolais博若莱、西班牙Verdejo。',
    tests: [
      { food: '白切鸡', wine: '勃艮第白 Mâcon-Villages', rating: 5, comment: '白切鸡蘸姜葱酱，配上Mâcon的圆润果味和淡淡黄油香，鸡肉的鲜甜被完美放大。这就是「鲜上加鲜」。' },
      { food: '白切鸡', wine: '博若莱 Beaujolais', rating: 4, comment: '佳美葡萄的轻盈红果跟白切鸡意外合拍。微凉饮用效果更好。' },
      { food: '脆皮烧鹅', wine: '阿尔萨斯琼瑶浆', rating: 5, comment: '烧鹅的焦脆皮和甜味酱汁，配琼瑶浆的荔枝玫瑰香，浓香对浓香，华丽至极！' },
      { food: '虾饺', wine: '新西兰灰皮诺', rating: 4, comment: '灰皮诺的清淡花果香不会抢虾饺的鲜味，柠檬酸度还能提鲜。' },
      { food: '虾饺', wine: '西班牙 Verdejo', rating: 4, comment: 'Verdejo的草本清香和矿物感跟虾饺也很搭，而且价格更亲民。' },
      { food: '肠粉', wine: '勃艮第白 Mâcon-Villages', rating: 3, comment: '肠粉本身味道淡，酱油的咸鲜跟白葡萄酒不冲突但也没惊喜。' },
      { food: '干炒牛河', wine: '博若莱 Beaujolais', rating: 4, comment: '博若莱的轻单宁和明亮果味跟镬气十足的牛河出奇搭配。酒体不重不会压过菜的烟火气。' },
    ],
    winner: '脆皮烧鹅 × 阿尔萨斯琼瑶浆——浓香撞浓香，港式大满足',
    lessons: [
      '粤菜配酒要尊重「鲜」字——避免高单宁红酒破坏鲜味',
      '勃艮第白是粤菜万能搭档，价格中等的 Mâcon 就够用',
      '琼瑶浆的浓郁花香跟烧腊类粤菜出乎意料地搭',
      '博若莱是唯一适合粤菜的红酒风格——轻盈、低单宁、微凉饮用',
      '点心类小吃适合清爽白酒，不需要太复杂的风味',
    ],
    cost: [
      { item: '粤菜套餐（5道）', price: '¥328' },
      { item: 'Mâcon-Villages Louis Latour', price: '¥148' },
      { item: '阿尔萨斯 Hugel 琼瑶浆', price: '¥168' },
      { item: '新西兰 Kumeu River 灰皮诺', price: '¥128' },
      { item: 'Beaujolais-Villages Duboeuf', price: '¥98' },
      { item: 'Verdejo Rueda DO', price: '¥78' },
      { item: '合计', price: '约 ¥948（3人分摊 ¥316/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
  {
    num: 5, title: '第 5 期：川菜配酒实验', subtitle: '麻辣鲜香 vs 葡萄酒——这可能是最刺激的一期。',
    setting: '地点：川菜馆。食物：麻婆豆腐、水煮鱼、回锅肉、宫保鸡丁、夫妻肺片。酒款：德国雷司令甜型（Spätlese）、阿尔萨斯灰皮诺、新西兰长相思、智利佳美娜、澳洲设拉子。',
    tests: [
      { food: '麻婆豆腐', wine: '德国雷司令 Spätlese', rating: 5, comment: '教科书级搭配！雷司令的甜度直接灭火，高酸清口，让花椒的麻和豆瓣酱的鲜都留了下来。' },
      { food: '麻婆豆腐', wine: '澳洲设拉子', rating: 1, comment: '灾难！辣椒+高酒精+高单宁=嘴巴着火。完全喝不下去。' },
      { food: '水煮鱼', wine: '德国雷司令 Spätlese', rating: 4, comment: '又是雷司令赢。甜度降辣，鱼肉的鲜味被保留了。' },
      { food: '水煮鱼', wine: '新西兰长相思', rating: 3, comment: '长相思的酸度能切辣但甜度不够，降火效果不如雷司令。' },
      { food: '回锅肉', wine: '智利佳美娜', rating: 4, comment: '惊喜！佳美娜的青椒味跟回锅肉的豆瓣香居然很搭，中等单宁包裹住五花肉油脂。' },
      { food: '宫保鸡丁', wine: '阿尔萨斯灰皮诺', rating: 4, comment: '灰皮诺的圆润口感跟花生和鸡丁很和谐，微辣不会压酒。' },
      { food: '夫妻肺片', wine: '新西兰长相思', rating: 3, comment: '红油和花椒还是太强，长相思只能勉强应对。' },
      { food: '夫妻肺片', wine: '德国雷司令 Spätlese', rating: 4, comment: '甜雷司令再次证明自己是辣菜克星。' },
    ],
    winner: '麻婆豆腐 × 德国雷司令 Spätlese——甜酸灭火，辣味伴侣',
    lessons: [
      '川菜配酒第一法则：带甜度！微甜白葡萄酒是辣菜最好的朋友',
      '绝对避免高酒精、高单宁的红酒配辣菜——会让辣感翻倍',
      '德国雷司令 Spätlese 是川菜的万能解药，价格还不贵',
      '不太辣的川菜（回锅肉、宫保鸡丁）可以试中等酒体红酒',
      '冰镇很重要——温度低能额外降低辣感',
    ],
    cost: [
      { item: '川菜（5道）', price: '¥218' },
      { item: 'Dr. Loosen Spätlese', price: '¥138' },
      { item: '阿尔萨斯 Trimbach 灰皮诺', price: '¥158' },
      { item: 'Villa Maria 长相思', price: '¥118' },
      { item: 'Montes 佳美娜', price: '¥98' },
      { item: 'Penfolds Koonunga Hill 设拉子', price: '¥98' },
      { item: '合计', price: '约 ¥828（2人分摊 ¥414/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=800&q=80',
  },
  {
    num: 6, title: '第 6 期：牛排配酒实验', subtitle: '不同部位、不同熟度、不同酒款——牛排配酒的终极答案。',
    setting: '地点：西餐厅牛排专门店。食物：菲力（medium rare）、西冷（medium）、肋眼（medium rare）、T骨（medium）。酒款：波尔多（梅多克）、纳帕赤霞珠、巴罗洛、阿根廷马尔贝克、澳洲设拉子、智利赤霞珠。',
    tests: [
      { food: '菲力（medium rare）', wine: '波尔多梅多克', rating: 5, comment: '经典中的经典。菲力的嫩滑配波尔多的优雅单宁，like silk on silk。波尔多的雪松和烟草香补充了菲力较淡的肉味。' },
      { food: '菲力（medium rare）', wine: '巴罗洛', rating: 4, comment: '巴罗洛的高酸和强单宁对菲力来说稍微重了，但玫瑰和焦油的复杂香气让体验很特别。' },
      { food: '西冷（medium）', wine: '纳帕赤霞珠', rating: 5, comment: '西冷的油脂带和肉味需要强壮的酒来匹配。纳帕赤霞珠的黑醋栗和橡木桶香跟西冷绝配。' },
      { food: '西冷（medium）', wine: '澳洲设拉子', rating: 4, comment: '设拉子的巧克力和黑胡椒味跟西冷也很搭，但酒精感稍高。' },
      { food: '肋眼（medium rare）', wine: '阿根廷马尔贝克', rating: 5, comment: '肋眼大理石纹的油脂遇上马尔贝克的柔顺单宁，完美平衡。蓝莓和李子的果味跟肉汁融为一体。' },
      { food: '肋眼（medium rare）', wine: '智利赤霞珠', rating: 4, comment: '智利赤霞珠的性价比在这里体现得淋漓尽致。¥80的酒配¥300的肉，毫不违和。' },
      { food: 'T骨（medium）', wine: '纳帕赤霞珠', rating: 5, comment: 'T骨两面的菲力和西冷，纳帕赤霞珠都能兼顾。这是最安全的牛排配酒选择。' },
      { food: 'T骨（medium）', wine: '波尔多梅多克', rating: 5, comment: '波尔多一样优秀。赤霞珠为主的波尔多和纳帕在牛排面前平分秋色。' },
    ],
    winner: '肋眼 × 阿根廷马尔贝克——油脂与柔顺单宁的完美交响',
    lessons: [
      '牛排配酒铁律：红肉配红酒，单宁越高油脂越需要',
      '菲力这种瘦嫩部位适合优雅型红酒（波尔多、巴罗洛）',
      '油脂丰富的肋眼/西冷需要果味浓郁的新世界酒',
      '赤霞珠是牛排的万能搭配——不管新世界旧世界都行',
      '马尔贝克是性价比之王——花波尔多1/3的价格获得90%的搭配效果',
      '熟度越高（medium以上），酒可以越厚重；rare的肉配优雅型酒更好',
    ],
    cost: [
      { item: '4种牛排套餐', price: '¥688' },
      { item: 'Château Greysac 梅多克', price: '¥168' },
      { item: 'Robert Mondavi 纳帕赤霞珠', price: '¥298' },
      { item: 'Fontanafredda Barolo', price: '¥268' },
      { item: 'Catena 马尔贝克', price: '¥138' },
      { item: 'Penfolds Bin 28 设拉子', price: '¥198' },
      { item: 'Concha y Toro 赤霞珠', price: '¥78' },
      { item: '合计', price: '约 ¥1836（3人分摊 ¥612/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
  },
  {
    num: 7, title: '第 7 期：海鲜大餐配酒实验', subtitle: '龙虾、生蚝、螃蟹——用最鲜的海味测试最配的酒。',
    setting: '地点：海鲜餐厅。食物：波士顿龙虾（芝士焗）、法国生蚝（生食）、大闸蟹（清蒸）、白灼虾、蒜蓉粉丝扇贝。酒款：Chablis Premier Cru、Muscadet、Sancerre长相思、Champagne Brut、阿尔巴利诺。',
    tests: [
      { food: '波士顿龙虾（芝士焗）', wine: 'Chablis Premier Cru', rating: 5, comment: '夏布利一级园的浓度刚好驾驭芝士焗龙虾。矿物感配龙虾鲜味，黄油感配芝士，堪称完美。' },
      { food: '波士顿龙虾（芝士焗）', wine: 'Champagne Brut', rating: 4, comment: '香槟的气泡和酵母感让龙虾更显奢华。但气泡会放大芝士的咸味，需要注意。' },
      { food: '法国生蚝', wine: 'Muscadet', rating: 5, comment: 'Muscadet和生蚝是法国最经典的搭配之一。酒里的海盐矿物感跟生蚝的海水味完全融为一体。' },
      { food: '法国生蚝', wine: 'Sancerre 长相思', rating: 4, comment: 'Sancerre的柑橘和打火石香跟生蚝也很好。酸度比Muscadet更明亮。' },
      { food: '大闸蟹', wine: '阿尔巴利诺', rating: 4, comment: '阿尔巴利诺的桃子杏子香和海风矿物感跟蟹肉的甜鲜搭配舒服。不过蟹膏部分需要更大的酒。' },
      { food: '大闸蟹', wine: 'Chablis Premier Cru', rating: 5, comment: '夏布利的厚度足够驾驭蟹膏的浓郁。柠檬酸度切开蟹的腥味。又是夏布利赢。' },
      { food: '白灼虾', wine: '阿尔巴利诺', rating: 5, comment: '白灼虾的原味鲜甜配阿尔巴利诺的清爽果味，简单纯粹的美好。' },
      { food: '蒜蓉粉丝扇贝', wine: 'Sancerre 长相思', rating: 4, comment: '长相思的草本清香跟蒜蓉不冲突，扇贝的鲜甜被酸度衬托。' },
    ],
    winner: '法国生蚝 × Muscadet——海洋的味道配海洋的酒',
    lessons: [
      '海鲜配酒铁律：白酒为主，矿物感越强越好',
      'Chablis是海鲜的全能选手，一级园的浓度足以驾驭各种做法',
      'Muscadet是生蚝的灵魂伴侣，价格还极其亲民（¥60-100）',
      '芝士焗/奶油浓酱做法的海鲜需要有一定橡木桶陈年的白酒',
      '清蒸/白灼的做法用最清爽的酒就好，别过度搭配',
    ],
    cost: [
      { item: '海鲜套餐（5道）', price: '¥588' },
      { item: 'Chablis Premier Cru Fourchaume', price: '¥258' },
      { item: 'Muscadet Sèvre et Maine', price: '¥78' },
      { item: 'Sancerre Pascal Jolivet', price: '¥188' },
      { item: 'Moët Brut Impérial 375ml', price: '¥168' },
      { item: 'Albariño Pazo de Señorans', price: '¥128' },
      { item: '合计', price: '约 ¥1408（3人分摊 ¥469/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80',
  },
  {
    num: 8, title: '第 8 期：意大利面配酒实验', subtitle: '番茄肉酱、白酱、海鲜面——一锅意面三种酒。',
    setting: '地点：意大利餐厅。食物：Bolognese番茄肉酱面、Carbonara培根蛋酱面、Vongole蛤蜊意面。酒款：Chianti Classico、Barbera d\'Alba、Vermentino、Soave。',
    tests: [
      { food: '番茄肉酱面', wine: 'Chianti Classico', rating: 5, comment: '番茄的酸跟Chianti的酸完美呼应！桑娇维塞的樱桃果味跟番茄酱汁简直同源。经典意大利搭配。' },
      { food: '番茄肉酱面', wine: 'Barbera d\'Alba', rating: 5, comment: '巴贝拉的高酸低单宁完美匹配番茄肉酱。酸度像是专为番茄设计的。' },
      { food: 'Carbonara 培根蛋酱面', wine: 'Vermentino', rating: 4, comment: 'Vermentino的柑橘和杏仁香跟蛋酱的浓郁形成清爽对比。白酒配白酱面是正确思路。' },
      { food: 'Carbonara 培根蛋酱面', wine: 'Barbera d\'Alba', rating: 4, comment: '巴贝拉的高酸切开了蛋酱的油腻，培根的烟熏味跟红酒也搭。红白都行。' },
      { food: 'Vongole 蛤蜊面', wine: 'Soave', rating: 5, comment: 'Soave的淡雅杏花香和矿物感跟蛤蜊的海水鲜味绝配。意大利白酒配意大利海鲜面，道理就这么简单。' },
      { food: 'Vongole 蛤蜊面', wine: 'Vermentino', rating: 4, comment: 'Vermentino也很好，地中海风格的白酒配海鲜面都不会出错。' },
    ],
    winner: '番茄肉酱面 × Chianti Classico——意大利的经典从不出错',
    lessons: [
      '意面配酒看酱汁！番茄酱=红酒，白酱/海鲜=白酒',
      '番茄酱的酸度需要同样高酸的酒——Chianti和Barbera是首选',
      '白酱面的油脂需要白酒的酸度来平衡',
      '海鲜面选矿物感强的意大利白酒（Soave/Vermentino/Gavi）',
      '最简单的法则：意大利菜配意大利酒，错不了',
    ],
    cost: [
      { item: '三款意面', price: '¥258' },
      { item: 'Chianti Classico Riserva', price: '¥158' },
      { item: 'Barbera d\'Alba Vietti', price: '¥128' },
      { item: 'Vermentino di Sardegna', price: '¥88' },
      { item: 'Soave Classico Pieropan', price: '¥108' },
      { item: '合计', price: '约 ¥740（2人分摊 ¥370/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
  {
    num: 9, title: '第 9 期：甜品配酒实验', subtitle: '巧克力、水果塔、提拉米苏——甜点遇上甜酒，是天堂还是腻味？',
    setting: '地点：法式甜品店。食物：黑巧克力蛋糕、草莓水果塔、提拉米苏、焦糖布丁。酒款：波特酒（Tawny Port）、Sauternes贵腐甜白、Moscato d\'Asti、Banyuls。',
    tests: [
      { food: '黑巧克力蛋糕', wine: 'Banyuls', rating: 5, comment: 'Banyuls的黑巧克力和咖啡风味跟巧克力蛋糕同频共振。法国人早就知道这个搭配了。' },
      { food: '黑巧克力蛋糕', wine: 'Tawny Port 波特', rating: 5, comment: '波特酒的焦糖坚果味跟黑巧克力的苦甜形成层次丰富的味觉体验。经典！' },
      { food: '草莓水果塔', wine: 'Moscato d\'Asti', rating: 5, comment: 'Moscato的蜜桃荔枝花香跟新鲜草莓互相辉映。微泡带来的清爽感让甜品不那么腻。' },
      { food: '草莓水果塔', wine: 'Sauternes 贵腐甜白', rating: 4, comment: '贵腐的杏酱蜂蜜味跟水果塔也搭，但可能甜度叠加有点过了。' },
      { food: '提拉米苏', wine: 'Tawny Port 波特', rating: 5, comment: '提拉米苏的咖啡和可可层次跟Tawny Port的焦糖、太妃糖、坚果完美融合。必须推荐。' },
      { food: '提拉米苏', wine: 'Banyuls', rating: 4, comment: 'Banyuls也行，但没有波特跟提拉米苏那种浑然天成的感觉。' },
      { food: '焦糖布丁', wine: 'Sauternes 贵腐甜白', rating: 5, comment: '焦糖布丁的焦糖苦甜跟Sauternes的蜂蜜杏仁味是神级搭配。贵腐的酸度完美平衡了甜腻。' },
    ],
    winner: '提拉米苏 × Tawny Port——咖啡可可遇上焦糖坚果',
    lessons: [
      '甜品配酒第一原则：酒的甜度必须≥甜品的甜度，否则酒会变酸',
      '巧克力类甜品配Banyuls或Port，深色配深色',
      '水果类甜品配Moscato或Sauternes，清爽配清爽',
      '焦糖/坚果类甜品配Tawny Port或Sauternes',
      'Moscato d\'Asti是甜品入门酒的王者——便宜好喝还低酒精',
    ],
    cost: [
      { item: '4款甜品', price: '¥228' },
      { item: 'Graham\'s 10年 Tawny Port', price: '¥168' },
      { item: 'Château Guiraud Sauternes 375ml', price: '¥188' },
      { item: 'Moscato d\'Asti Saracco', price: '¥88' },
      { item: 'Banyuls M. Chapoutier', price: '¥128' },
      { item: '合计', price: '约 ¥800（2人分摊 ¥400/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1558346547-4439467bd1d5?w=800&q=80',
  },
  {
    num: 10, title: '第 10 期：奶酪配酒矩阵', subtitle: '6种奶酪 × 6款酒 = 36种组合，用矩阵找出最佳搭配。',
    setting: '地点：奶酪专卖店品鉴室。奶酪：Brie（布里）、Comté（孔泰）、Roquefort（洛克福蓝纹）、Cheddar（切达）、Gouda（高达）、Chèvre（山羊奶酪）。酒款：Champagne、Sancerre、Beaujolais、Côtes du Rhône、Sauternes、Port。每种组合试吃一小口+一小口酒。',
    tests: [
      { food: 'Brie × Champagne', wine: 'Champagne', rating: 5, comment: 'Brie的奶油质地被气泡切开，同时增加了咸鲜层次。法国人的经典aperitif。' },
      { food: 'Comté × Beaujolais', wine: 'Beaujolais', rating: 5, comment: 'Comté的坚果甜味跟佳美葡萄的红果味意外和谐。微凉饮用效果最好。' },
      { food: 'Roquefort × Sauternes', wine: 'Sauternes', rating: 5, comment: '蓝纹奶酪的咸辣配贵腐的蜂蜜甜，这是全世界最经典的酒食搭配之一。甜咸碰撞的极致。' },
      { food: 'Cheddar × Côtes du Rhône', wine: 'Côtes du Rhône', rating: 4, comment: '陈年Cheddar的浓郁跟Côtes du Rhône的胡椒香料味很搭。简单好喝。' },
      { food: 'Gouda × Port', wine: 'Port', rating: 5, comment: '老Gouda的焦糖结晶配Port的甜蜜浓郁。两者的甜度和浓度级别完全匹配。' },
      { food: 'Chèvre × Sancerre', wine: 'Sancerre', rating: 5, comment: '卢瓦尔河谷的山羊奶酪配卢瓦尔河谷的长相思——同产区搭配法则的教科书案例。酸配酸，鲜配鲜。' },
    ],
    winner: 'Roquefort × Sauternes——咸甜碰撞的世界级经典搭配',
    lessons: [
      '奶酪配酒两大法则：(1)同产区搭配 (2)咸配甜、鲜配酸',
      '软质奶酪（Brie）配气泡酒或清爽白酒',
      '蓝纹奶酪（Roquefort）必须配甜酒——Sauternes或Port',
      '硬质奶酪（Comté/Gouda）红白都可以',
      '山羊奶酪配高酸白酒是铁律',
      '不确定的时候选Champagne——几乎跟所有奶酪都搭',
    ],
    cost: [
      { item: '6种奶酪拼盘', price: '¥258' },
      { item: 'Champagne Pol Roger', price: '¥298' },
      { item: 'Sancerre Domaine Vacheron', price: '¥188' },
      { item: 'Beaujolais-Villages Duboeuf', price: '¥98' },
      { item: 'Guigal Côtes du Rhône', price: '¥88' },
      { item: 'Sauternes Guiraud 375ml', price: '¥188' },
      { item: 'Graham\'s 10年 Tawny Port', price: '¥168' },
      { item: '合计', price: '约 ¥1286（4人分摊 ¥322/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=800&q=80',
  },
  {
    num: 11, title: '第 11 期：韩料配酒实验', subtitle: '烤肉蘸酱、泡菜、部队锅——韩剧里只喝烧酒？试试葡萄酒！',
    setting: '地点：韩式烤肉店。食物：五花肉烤肉、牛肋条烤肉、辣白菜、部队锅、韩式炸鸡。酒款：博若莱新酒、南非白诗南、德国雷司令干型、澳洲GSM、加州仙粉黛。',
    tests: [
      { food: '五花肉烤肉', wine: '博若莱新酒', rating: 5, comment: '五花肉配博若莱简直是天选之子！轻盈果味不抢蘸酱的风头，微凉的温度解油腻。连烤肉店老板都问这是什么酒。' },
      { food: '牛肋条烤肉', wine: '加州仙粉黛', rating: 4, comment: '仙粉黛的甜美莓果味跟烤肉酱汁的甜辣很搭。稍微有点重但可以接受。' },
      { food: '辣白菜', wine: '德国雷司令干型', rating: 4, comment: '泡菜的酸辣配雷司令的高酸，酸酸碰撞反而很清爽。比预期好得多。' },
      { food: '辣白菜', wine: '南非白诗南', rating: 3, comment: '白诗南能应付泡菜但没什么惊喜。中规中矩。' },
      { food: '部队锅', wine: '澳洲 GSM', rating: 3, comment: '部队锅太辣太咸，GSM的酒精感被辣味放大了。不推荐。' },
      { food: '部队锅', wine: '德国雷司令干型', rating: 4, comment: '又是雷司令救场。高酸低酒精是辣锅的好朋友。' },
      { food: '韩式炸鸡', wine: '南非白诗南', rating: 5, comment: '炸鸡配白诗南！白诗南的热带水果香跟炸鸡的甜辣酱绝配，酸度切开油腻。' },
    ],
    winner: '五花肉烤肉 × 博若莱新酒——轻盈解腻，烤肉新宠',
    lessons: [
      '韩式烤肉最佳搭档是轻盈红酒——博若莱、黑皮诺、多切托',
      '韩式炸鸡配白诗南或雷司令，酸度解油腻',
      '辣味韩餐还是老规矩：低酒精、高酸度、可以微甜',
      '烧酒的位置不可替代，但葡萄酒能提供更丰富的味觉层次',
      '韩式烤肉的蘸酱（芝麻油+盐）跟轻盈红酒不冲突',
    ],
    cost: [
      { item: '烤肉+火锅+炸鸡套餐', price: '¥368' },
      { item: 'Beaujolais Nouveau Duboeuf', price: '¥88' },
      { item: 'Ken Forrester 白诗南', price: '¥88' },
      { item: 'Dr. Loosen 雷司令干型', price: '¥108' },
      { item: 'D\'Arenberg GSM', price: '¥118' },
      { item: 'Ravenswood 仙粉黛', price: '¥108' },
      { item: '合计', price: '约 ¥878（3人分摊 ¥293/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=800&q=80',
  },
  {
    num: 12, title: '第 12 期：东南亚菜配酒实验', subtitle: '冬阴功、绿咖喱、越南粉——酸辣鲜甜的热带风味需要什么酒？',
    setting: '地点：泰越餐厅。食物：冬阴功汤、泰式绿咖喱鸡、越南牛肉粉、泰式芒果糯米饭、新加坡辣椒蟹。酒款：阿尔萨斯琼瑶浆、新西兰长相思、Torrontés（阿根廷）、Vinho Verde（葡萄牙绿酒）、德国雷司令半干。',
    tests: [
      { food: '冬阴功汤', wine: '阿尔萨斯琼瑶浆', rating: 5, comment: '冬阴功的柠檬草和高良姜跟琼瑶浆的荔枝玫瑰香形成了「香料对花香」的绝妙组合。甜度刚好平衡辣味。' },
      { food: '冬阴功汤', wine: '新西兰长相思', rating: 3, comment: '长相思的酸度能切辣，但草本味跟冬阴功的香料味有点打架。' },
      { food: '绿咖喱鸡', wine: '德国雷司令半干', rating: 5, comment: '绿咖喱的浓郁椰奶和辣味被雷司令的甜度温柔化解。高酸保持清爽，不会觉得腻。' },
      { food: '越南牛肉粉', wine: 'Vinho Verde', rating: 4, comment: '绿酒的轻盈微泡和低酒精跟越南粉的清淡鲜香很配。像是给牛肉粉加了一道柠檬。' },
      { food: '越南牛肉粉', wine: 'Torrontés', rating: 4, comment: 'Torrontés的花香跟越南粉的九层塔薄荷形成了有趣的草本花卉组合。' },
      { food: '芒果糯米饭', wine: '德国雷司令半干', rating: 5, comment: '甜配甜的典范。芒果的热带甜跟雷司令的蜜桃香互相辉映。' },
      { food: '辣椒蟹', wine: '阿尔萨斯琼瑶浆', rating: 4, comment: '琼瑶浆的甜度和浓郁花香能应对辣椒蟹的甜辣酱。但酱汁太浓时酒有点吃力。' },
    ],
    winner: '冬阴功 × 阿尔萨斯琼瑶浆——香料对花香，东西方的味觉对话',
    lessons: [
      '东南亚菜配酒关键词：芳香型白葡萄酒',
      '琼瑶浆和雷司令是东南亚菜的两大神器',
      '椰奶基底的菜需要微甜的酒来平衡',
      '酸辣型菜肴（冬阴功）需要花香型酒来「以香制辣」',
      '轻盈低酒精的酒（Vinho Verde）适合清淡的越南菜',
    ],
    cost: [
      { item: '东南亚菜（5道）', price: '¥298' },
      { item: 'Hugel 琼瑶浆', price: '¥168' },
      { item: 'Cloudy Bay 长相思', price: '¥168' },
      { item: 'Colomé Torrontés', price: '¥98' },
      { item: 'Aveleda Vinho Verde', price: '¥68' },
      { item: 'Dr. Loosen 雷司令半干', price: '¥108' },
      { item: '合计', price: '约 ¥908（3人分摊 ¥303/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=800&q=80',
  },
  {
    num: 13, title: '第 13 期：烤鸭配酒实验', subtitle: '全聚德式烤鸭配酒——薄饼、甜面酱、葱丝，哪种酒能接住这个组合？',
    setting: '地点：烤鸭店（片皮鸭）。食物：片皮鸭（薄饼卷葱丝+甜面酱）、鸭架汤、鸭肝、椒盐鸭舌。酒款：勃艮第黑皮诺（Bourgogne Rouge）、Côtes du Rhône、阿尔萨斯灰皮诺、新西兰黑皮诺、加州仙粉黛。',
    tests: [
      { food: '片皮鸭（薄饼卷）', wine: '勃艮第黑皮诺', rating: 5, comment: '黑皮诺的红果酸跟甜面酱的甜咸完美呼应！鸭皮的油脂被轻柔单宁包裹，樱桃和覆盆子的果香让每一口鸭肉都更鲜美。' },
      { food: '片皮鸭（薄饼卷）', wine: 'Côtes du Rhône', rating: 4, comment: '罗讷河谷的温暖果味和胡椒香料跟烤鸭也搭。比黑皮诺厚重一点，但甜面酱能Hold住。' },
      { food: '片皮鸭（薄饼卷）', wine: '加州仙粉黛', rating: 3, comment: '仙粉黛的甜美跟甜面酱的甜有点重复。不难喝但不如前两款有层次。' },
      { food: '鸭架汤', wine: '阿尔萨斯灰皮诺', rating: 4, comment: '鸭架汤的鲜美配灰皮诺的圆润口感，温暖舒服。像冬天的毛毯。' },
      { food: '鸭肝', wine: '新西兰黑皮诺', rating: 4, comment: '鸭肝的浓郁跟新西兰黑皮诺的果味和微甜形成了不错的平衡。' },
      { food: '椒盐鸭舌', wine: 'Côtes du Rhône', rating: 5, comment: '椒盐的香酥跟Côtes du Rhône的胡椒感同频了！鸭舌的弹牙口感配中等酒体红酒刚刚好。' },
    ],
    winner: '片皮鸭 × 勃艮第黑皮诺——甜面酱遇上红果酸，中法合璧的优雅',
    lessons: [
      '烤鸭配酒的核心是甜面酱——需要有果味和酸度的红酒来呼应',
      '黑皮诺是烤鸭的最佳选择：轻盈不压肉味，酸度配甜面酱',
      'Côtes du Rhône 是性价比替代方案',
      '避免太浓太甜的红酒——会跟甜面酱打架',
      '鸭的不同部位可以配不同的酒，一顿饭开两瓶最理想',
    ],
    cost: [
      { item: '烤鸭全套（含鸭架汤、鸭肝、鸭舌）', price: '¥388' },
      { item: 'Bourgogne Rouge Louis Jadot', price: '¥168' },
      { item: 'Guigal Côtes du Rhône', price: '¥88' },
      { item: 'Trimbach 灰皮诺', price: '¥158' },
      { item: 'Sileni 新西兰黑皮诺', price: '¥128' },
      { item: 'Ravenswood 仙粉黛', price: '¥108' },
      { item: '合计', price: '约 ¥1038（3人分摊 ¥346/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80',
  },
  {
    num: 14, title: '第 14 期：小龙虾配酒实验', subtitle: '蒜蓉、麻辣、十三香——夏天的小龙虾能配什么酒？',
    setting: '地点：小龙虾大排档。食物：蒜蓉小龙虾、麻辣小龙虾、十三香小龙虾。酒款：Prosecco、新西兰长相思、德国雷司令半干、普罗旺斯桃红、澳洲Moscato。',
    tests: [
      { food: '蒜蓉小龙虾', wine: 'Prosecco', rating: 5, comment: '冰镇Prosecco配蒜蓉小龙虾是夏夜最佳组合！气泡把蒜香提升，虾肉的甜被衬托得更鲜明。爽！' },
      { food: '蒜蓉小龙虾', wine: '新西兰长相思', rating: 4, comment: '长相思的草本酸香跟蒜蓉不冲突，柠檬般的清爽让虾更鲜。' },
      { food: '麻辣小龙虾', wine: '德国雷司令半干', rating: 5, comment: '老规矩——辣配甜。雷司令再次拿下麻辣赛道。花椒的麻被甜度温柔包裹。' },
      { food: '麻辣小龙虾', wine: '普罗旺斯桃红', rating: 3, comment: '桃红试图温柔应对辣味，但甜度不够，只能部分缓解。' },
      { food: '十三香小龙虾', wine: '普罗旺斯桃红', rating: 5, comment: '十三香不太辣但香料复杂，桃红的草莓香和清爽酸度完美匹配！冰镇到位的话，这是最佳搭配。' },
      { food: '十三香小龙虾', wine: '澳洲 Moscato', rating: 4, comment: 'Moscato的蜜桃花香跟十三香的复杂香料有趣呼应。甜度也合适。' },
    ],
    winner: '蒜蓉小龙虾 × Prosecco——夏夜的快乐就这么简单',
    lessons: [
      '小龙虾配酒看口味：蒜蓉配气泡/白酒，麻辣配甜酒，十三香配桃红',
      '冰镇是关键——所有配小龙虾的酒都要充分冰镇',
      '小龙虾手剥的吃法意味着你需要一只手拿杯——建议用大杯',
      'Prosecco的性价比在这里体现得淋漓尽致：¥60-80就够',
      '桃红是十三香口味的隐藏赢家',
    ],
    cost: [
      { item: '三种口味小龙虾各3斤', price: '¥468' },
      { item: 'Mionetto Prosecco', price: '¥88' },
      { item: 'Villa Maria 长相思', price: '¥118' },
      { item: 'Dr. Loosen 雷司令半干', price: '¥108' },
      { item: 'AIX 普罗旺斯桃红', price: '¥138' },
      { item: 'Brown Brothers Moscato', price: '¥68' },
      { item: '合计', price: '约 ¥988（4人分摊 ¥247/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1566995541428-f4e827e06c09?w=800&q=80',
  },
  {
    num: 15, title: '第 15 期：早午餐配酒实验', subtitle: 'Brunch不只有Mimosa——鸡蛋本尼迪克特、牛角包、水果碗能配什么酒？',
    setting: '地点：网红Brunch餐厅。食物：Eggs Benedict（班尼迪克蛋）、牛角包配黄油果酱、Açaí水果碗、烟熏三文鱼贝果。酒款：Champagne Brut、Crémant d\'Alsace、Moscato d\'Asti、Sancerre长相思。',
    tests: [
      { food: 'Eggs Benedict', wine: 'Champagne Brut', rating: 5, comment: '流心蛋黄+荷兰酱的浓郁被香槟的气泡和酸度完美切开。这就是为什么Brunch香槟是全世界的共识。' },
      { food: 'Eggs Benedict', wine: 'Crémant d\'Alsace', rating: 5, comment: '阿尔萨斯起泡酒的效果跟香槟几乎一样好，但价格只有1/3。性价比之选！' },
      { food: '牛角包', wine: 'Moscato d\'Asti', rating: 5, comment: '牛角包的黄油酥香配Moscato的蜜桃花香，像在花园里吃早餐。低酒精早上喝也没负担。' },
      { food: 'Açaí水果碗', wine: 'Moscato d\'Asti', rating: 4, comment: '水果配水果味的酒，自然和谐。但如果水果碗太甜，Moscato也会显甜。' },
      { food: '烟熏三文鱼贝果', wine: 'Sancerre 长相思', rating: 5, comment: '烟熏三文鱼的油脂和烟熏味被Sancerre的柑橘酸度和矿物感完美平衡。经典搭配。' },
      { food: '烟熏三文鱼贝果', wine: 'Champagne Brut', rating: 4, comment: '香槟也可以，但Sancerre的针对性更强。' },
    ],
    winner: 'Eggs Benedict × Champagne/Crémant——Brunch的灵魂就是气泡',
    lessons: [
      'Brunch配酒的核心：气泡酒！Champagne或Crémant都行',
      '不想喝酒精的选Moscato d\'Asti——5.5%的酒精度完全没压力',
      'Crémant是Brunch的性价比之王——¥80-120就能享受香槟级体验',
      '烟熏类食物配矿物感白酒（Sancerre/Chablis）',
      '早午餐不适合红酒——太早太重，破坏氛围',
    ],
    cost: [
      { item: 'Brunch 4道', price: '¥238' },
      { item: 'Moët Brut 375ml', price: '¥168' },
      { item: 'Crémant d\'Alsace Dopff', price: '¥98' },
      { item: 'Moscato d\'Asti Saracco', price: '¥88' },
      { item: 'Sancerre Pascal Jolivet', price: '¥188' },
      { item: '合计', price: '约 ¥780（2人分摊 ¥390/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800&q=80',
  },
  {
    num: 16, title: '第 16 期：外卖配酒实验', subtitle: '麦当劳、肯德基、必胜客——快餐真的能配葡萄酒吗？',
    setting: '地点：家里沙发。外卖：麦当劳巨无霸+薯条、肯德基吮指原味鸡、必胜客超级至尊披萨、麦当劳麦辣鸡腿堡。酒款：Prosecco、智利赤霞珠、普罗旺斯桃红、澳洲设拉子。',
    tests: [
      { food: '巨无霸+薯条', wine: '智利赤霞珠', rating: 4, comment: '巨无霸的牛肉饼和赤霞珠居然很搭！赤霞珠的单宁切掉了芝士和酱汁的油腻，黑醋栗味跟烤肉饼有呼应。' },
      { food: '巨无霸+薯条', wine: 'Prosecco', rating: 4, comment: '薯条蘸番茄酱配冰镇Prosecco？没想到吧，意外好吃！气泡解腻，酸度配番茄酱。' },
      { food: '吮指原味鸡', wine: '普罗旺斯桃红', rating: 5, comment: '桃红的清爽草莓味跟炸鸡的酥脆多汁形成了完美的夏日组合。冰镇桃红是炸鸡的真命天酒。' },
      { food: '吮指原味鸡', wine: '澳洲设拉子', rating: 3, comment: '设拉子太重了，盖过了炸鸡的风味。不推荐。' },
      { food: '超级至尊披萨', wine: '智利赤霞珠', rating: 5, comment: '番茄酱底+芝士+各种肉，这就是简化版的意大利菜。赤霞珠完全胜任。' },
      { food: '麦辣鸡腿堡', wine: '普罗旺斯桃红', rating: 4, comment: '辣味不重，桃红的酸度和清爽感正好解辣解腻。' },
    ],
    winner: '吮指原味鸡 × 普罗旺斯桃红——沙发上的小确幸',
    lessons: [
      '快餐配酒完全可行！别觉得不够「高级」',
      '汉堡=牛肉=红酒，披萨=番茄+芝士=红酒',
      '炸鸡是桃红的最佳拍档——全世界通用',
      '薯条配Prosecco是隐藏菜单，试过的人都说好',
      '快餐配酒选便宜的酒就行——¥50-100的酒最合适',
    ],
    cost: [
      { item: '三家外卖', price: '¥186' },
      { item: 'Mionetto Prosecco', price: '¥88' },
      { item: 'Concha y Toro 赤霞珠', price: '¥48' },
      { item: 'AIX 桃红 187ml×2', price: '¥96' },
      { item: 'Yellow Tail 设拉子', price: '¥48' },
      { item: '合计', price: '约 ¥466（2人分摊 ¥233/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1526142684086-7ebd69df27a5?w=800&q=80',
  },
  {
    num: 17, title: '第 17 期：素食配酒实验', subtitle: '蔬菜、豆腐、蘑菇——没有肉的餐桌，酒的舞台反而更大？',
    setting: '地点：素食餐厅。食物：凯撒沙拉（无培根版）、麻婆豆腐（素）、烤蘑菇拼盘、牛油果吐司。酒款：Sancerre长相思、意大利Soave、俄勒冈黑皮诺、南非白诗南。',
    tests: [
      { food: '凯撒沙拉', wine: 'Sancerre 长相思', rating: 5, comment: '沙拉的清脆蔬菜和柠檬汁配Sancerre的柑橘矿物感，像喝液态沙拉。完美清爽。' },
      { food: '凯撒沙拉', wine: '南非白诗南', rating: 4, comment: '白诗南的苹果梨味也跟沙拉搭，但没有Sancerre那种刀锋般的精准感。' },
      { food: '麻婆豆腐（素）', wine: '南非白诗南', rating: 4, comment: '素麻婆豆腐的辣度比肉版低，白诗南的圆润果味能应对。不需要甜型雷司令了。' },
      { food: '烤蘑菇拼盘', wine: '俄勒冈黑皮诺', rating: 5, comment: '蘑菇的泥土鲜味跟黑皮诺的森林底层气息简直是soul mate！这可能是素食配酒最经典的组合。' },
      { food: '烤蘑菇拼盘', wine: '意大利 Soave', rating: 3, comment: 'Soave太清淡，驾驭不了烤蘑菇的浓郁鲜味。' },
      { food: '牛油果吐司', wine: '意大利 Soave', rating: 5, comment: '牛油果的奶油质地配Soave的淡雅杏仁香，轻盈又满足。早午餐感满满。' },
    ],
    winner: '烤蘑菇 × 俄勒冈黑皮诺——森林里的灵魂邂逅',
    lessons: [
      '素食配酒的关键：匹配食物的重量感',
      '生食/沙拉配最清爽的白酒（长相思/Soave）',
      '蘑菇和黑皮诺是天作之合——因为它们都有泥土和森林气息',
      '豆腐类菜品看调味方式：辣味配微甜白酒，清炒配清爽白酒',
      '素食不等于只能喝白酒——轻盈红酒（黑皮诺/Beaujolais）完全适合',
    ],
    cost: [
      { item: '素食餐（4道）', price: '¥198' },
      { item: 'Sancerre Pascal Jolivet', price: '¥188' },
      { item: 'Soave Classico Pieropan', price: '¥108' },
      { item: 'Willamette Valley 黑皮诺', price: '¥178' },
      { item: 'Ken Forrester 白诗南', price: '¥88' },
      { item: '合计', price: '约 ¥760（2人分摊 ¥380/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=800&q=80',
  },
  {
    num: 18, title: '第 18 期：宵夜配酒实验', subtitle: '烤串、炒粉、卤味——深夜的碳水和蛋白质需要什么酒来陪伴？',
    setting: '地点：大排档/夜宵摊。食物：烤羊肉串、炒河粉、卤牛肉+卤鸡爪、烤韭菜、炒花甲。酒款：阿根廷马尔贝克、博若莱、冰镇桃红、Vinho Verde（葡萄牙绿酒）、澳洲设拉子。',
    tests: [
      { food: '烤羊肉串', wine: '阿根廷马尔贝克', rating: 5, comment: '第3期就验证过的黄金搭配。深夜撸串加马尔贝克，人生巅峰体验。孜然味和浓郁果味天作之合。' },
      { food: '炒河粉', wine: '博若莱', rating: 4, comment: '博若莱的轻盈跟镬气十足的炒河粉意外搭配。不会觉得酒太重，河粉的烟火气也不会压酒。' },
      { food: '炒河粉', wine: 'Vinho Verde', rating: 4, comment: '绿酒的微泡和清爽跟炒河粉的油气形成清爽对比。夏天宵夜首选。' },
      { food: '卤牛肉+卤鸡爪', wine: '澳洲设拉子', rating: 4, comment: '卤味的五香八角跟设拉子的香料感有共鸣。卤牛肉的浓郁跟设拉子的厚重势均力敌。' },
      { food: '卤牛肉+卤鸡爪', wine: '阿根廷马尔贝克', rating: 4, comment: '马尔贝克也行，但没有设拉子跟卤料那种香料层面的共鸣。' },
      { food: '烤韭菜', wine: '冰镇桃红', rating: 3, comment: '韭菜还是太冲了。桃红只能勉强应对。' },
      { food: '炒花甲', wine: 'Vinho Verde', rating: 5, comment: '花甲的鲜味和蒜香配绿酒的矿物微泡，完美的海鲜宵夜搭配！而且绿酒便宜。' },
    ],
    winner: '烤羊肉串 × 马尔贝克 + 炒花甲 × Vinho Verde（双冠军）',
    lessons: [
      '宵夜配酒要接地气——别带太贵的酒去大排档',
      '马尔贝克是深夜烤串永远的神',
      '博若莱和Vinho Verde是宵夜万金油——轻盈不上头',
      '卤味配有香料感的红酒（设拉子、GSM）',
      '花甲/海鲜宵夜配冰镇白酒或绿酒',
      '宵夜的核心是氛围——别太讲究，开心就好',
    ],
    cost: [
      { item: '宵夜五道', price: '¥168' },
      { item: 'Trapiche 马尔贝克', price: '¥78' },
      { item: 'Beaujolais Duboeuf', price: '¥88' },
      { item: 'AIX 桃红 375ml', price: '¥78' },
      { item: 'Aveleda Vinho Verde', price: '¥68' },
      { item: 'Yellow Tail 设拉子', price: '¥48' },
      { item: '合计', price: '约 ¥528（3人分摊 ¥176/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
  },
  {
    num: 19, title: '第 19 期：火鸡配酒实验', subtitle: '感恩节/圣诞火鸡大餐——北美传统配酒的中国实践。',
    setting: '地点：朋友家厨房。食物：烤火鸡（整只）、蔓越莓酱、土豆泥、烤蔬菜、南瓜派。酒款：俄勒冈黑皮诺、博若莱Villages、阿尔萨斯雷司令、加州霞多丽、Beaujolais Cru（Morgon）。',
    tests: [
      { food: '烤火鸡（白肉部分）', wine: '加州霞多丽', rating: 5, comment: '火鸡胸肉偏干瘦，加州霞多丽的奶油橡木桶风味刚好补充了丰润感。黄油烤火鸡配黄油感白酒。' },
      { food: '烤火鸡（腿肉部分）', wine: '俄勒冈黑皮诺', rating: 5, comment: '火鸡腿肉更浓郁多汁，黑皮诺的红果酸度和丝滑单宁完美搭配。这是美国感恩节的经典选择。' },
      { food: '火鸡 + 蔓越莓酱', wine: '博若莱 Villages', rating: 5, comment: '博若莱的红果味跟蔓越莓酱的酸甜简直同源！轻盈的酒体不会压过火鸡肉味。' },
      { food: '土豆泥', wine: '阿尔萨斯雷司令', rating: 4, comment: '土豆泥的奶油感配雷司令的酸度和矿物感，清爽不腻。' },
      { food: '烤蔬菜', wine: 'Beaujolais Cru Morgon', rating: 4, comment: 'Morgon的浓度比普通博若莱高一个级别，跟烤蔬菜的焦香和甜味很搭。' },
      { food: '南瓜派', wine: '阿尔萨斯雷司令', rating: 4, comment: '南瓜派的香料（肉桂、丁香）跟雷司令的花果香有趣呼应。微甜的晚收雷司令更好。' },
    ],
    winner: '烤火鸡腿 × 俄勒冈黑皮诺——感恩节的标准答案',
    lessons: [
      '火鸡配酒的关键：火鸡肉味淡，不要用太重的酒',
      '黑皮诺和博若莱是火鸡的最佳红酒选择',
      '加州霞多丽（带橡木桶的）配火鸡白肉特别好',
      '蔓越莓酱是配酒的桥梁——选有红果味的酒就对了',
      '一顿火鸡大餐建议准备2-3瓶不同的酒，配不同菜',
    ],
    cost: [
      { item: '烤火鸡全套（含配菜+南瓜派）', price: '¥488' },
      { item: 'Willamette Valley 黑皮诺', price: '¥178' },
      { item: 'Beaujolais-Villages Duboeuf', price: '¥98' },
      { item: 'Trimbach 雷司令', price: '¥128' },
      { item: 'Kendall-Jackson 加州霞多丽', price: '¥128' },
      { item: 'Beaujolais Cru Morgon Lapierre', price: '¥168' },
      { item: '合计', price: '约 ¥1188（4人分摊 ¥297/人）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=80',
  },
  {
    num: 20, title: '第 20 期：速食配酒实验', subtitle: '方便面、速冻饺子、自热锅——懒人美食也配拥有好酒。',
    setting: '地点：家里厨房。食物：日清合味道（海鲜味）、思念猪肉白菜水饺、海底捞自热小火锅（微辣）、统一老坛酸菜牛肉面。酒款：Prosecco、智利长相思、新西兰灰皮诺、西班牙Garnacha。',
    tests: [
      { food: '日清合味道（海鲜味）', wine: '智利长相思', rating: 4, comment: '海鲜味泡面的鲜味被长相思的柑橘酸度衬托了。面汤的油被酸度化解。没想到这么搭。' },
      { food: '日清合味道（海鲜味）', wine: 'Prosecco', rating: 4, comment: '气泡配面汤居然很爽！像给泡面加了一道柠檬苏打水。' },
      { food: '思念猪肉白菜水饺', wine: '新西兰灰皮诺', rating: 4, comment: '水饺的猪肉馅配灰皮诺的清淡果味刚好。蘸醋吃的时候酒的酸度也能匹配。' },
      { food: '思念猪肉白菜水饺', wine: '西班牙 Garnacha', rating: 5, comment: '惊喜！歌海娜的甜美红果和低单宁跟猪肉水饺特别搭。尤其蘸辣油的时候，果味能抵消一部分辣。' },
      { food: '海底捞自热小火锅', wine: '智利长相思', rating: 3, comment: '微辣底料加各种涮菜，长相思的酸度能清口但驾驭不了火锅的浓郁。' },
      { food: '海底捞自热小火锅', wine: '西班牙 Garnacha', rating: 4, comment: '歌海娜的温暖果味跟微辣火锅底料搭配不错。不太辣的话红酒可以上。' },
      { food: '老坛酸菜牛肉面', wine: 'Prosecco', rating: 4, comment: '酸菜的酸跟Prosecco的酸产生有趣共振，气泡还能缓解面汤的油腻。有点像酸菜配汽水的升级版。' },
    ],
    winner: '猪肉水饺 × 西班牙 Garnacha——速食界的意外之星',
    lessons: [
      '速食配酒的哲学：不需要贵酒，¥50-80就够了',
      '方便面配气泡酒或白酒——解油腻是第一需求',
      '水饺配歌海娜是新发现——低单宁红酒配猪肉很和谐',
      '自热火锅看辣度决定用白酒还是红酒',
      '速食+葡萄酒是一个人的高级享受——别小看独居美食',
      '最重要的是：任何食物都值得被认真对待',
    ],
    cost: [
      { item: '速食合集（4款）', price: '¥52' },
      { item: 'Mionetto Prosecco 187ml', price: '¥38' },
      { item: 'Casillero del Diablo 长相思', price: '¥48' },
      { item: 'Yealands 灰皮诺', price: '¥68' },
      { item: 'Campo Viejo Garnacha', price: '¥58' },
      { item: '合计', price: '约 ¥264（1人独享 ¥264）' },
    ],
    imgUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80',
  },
];

async function createPage(token: string, parentNode: string, title: string, blocks: any[], imgUrl: string) {
  console.log(`\n创建: ${title}`);
  const nodeRes = curlApi('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, token, {
    obj_type: 'docx', node_type: 'origin', parent_node_token: parentNode, title,
  });
  if (nodeRes.code !== 0) { console.error(`  失败: ${nodeRes.msg}`); return null; }
  const { node_token: nodeToken, obj_token: objToken } = nodeRes.data.node;
  console.log(`  node: ${nodeToken}`);
  await new Promise(r => setTimeout(r, 300));

  const chunkSize = 30;
  let firstImgBlockId = '';
  for (let j = 0; j < blocks.length; j += chunkSize) {
    const chunk = blocks.slice(j, j + chunkSize);
    const res = curlApi('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, token, { children: chunk });
    if (res.code !== 0) console.error(`  blocks ${j} 失败: ${res.msg}`);
    else { console.log(`  blocks ${j+1}-${j+chunk.length} ✓`); if (j === 0 && res.data?.children?.[0]) firstImgBlockId = res.data.children[0].block_id; }
    if (j + chunkSize < blocks.length) await new Promise(r => setTimeout(r, 200));
  }

  if (firstImgBlockId && imgUrl) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const buf = await downloadImage(imgUrl);
        uploadAndPatch(token, objToken, firstImgBlockId, buf, `lab_${Date.now()}.jpg`);
        console.log('  图片 ✓');
        break;
      } catch (err: any) {
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        else console.error(`  图片失败: ${err.message}`);
      }
    }
  }
  return { nodeToken, objToken };
}

async function main() {
  console.log('🧪 餐酒实验室 · 批量创建 #2-20\n');
  const tokenData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json'), 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) { console.error('Token 过期！'); return; }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  let created = 0;
  for (const lab of LABS) {
    const blocks = labToBlocks(lab);
    const result = await createPage(token, PARENT_NODE, lab.title, blocks, lab.imgUrl);
    if (result) created++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\n\n✅ 餐酒实验室 #2-20 完成！成功 ${created}/${LABS.length} 篇`);
}

main().catch(err => { console.error('错误:', err); process.exit(1); });
