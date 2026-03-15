/**
 * 每周一酒 批量创建 #2-20
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_batch_weekly.ts
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
function h3(s: string) { return { block_type: 5, heading3: { elements: [t(s)], style: {} } }; }
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
    try {
      const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10*1024*1024, stdio: ['pipe','pipe','pipe'], timeout: 120000 });
      return JSON.parse(result);
    } catch (err: any) {
      console.error(`  curl error attempt ${i+1}: ${err.message?.slice(0, 200)}`);
      if (i < 4) execSync('sleep 3'); else return { code: -1, msg: 'curl failed after 5 attempts' };
    }
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
  const r = execSync(`curl -sk --retry 5 --retry-delay 3 -X POST "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all" -H "Authorization: Bearer ${token}" -F "file_name=${name}" -F "parent_type=docx_image" -F "parent_node=${blockId}" -F "size=${buf.length}" -F "file=@${f};type=image/jpeg"`, { encoding: 'utf-8', stdio: ['pipe','pipe','pipe'], timeout: 60000 });
  try { fs.unlinkSync(f); } catch {}
  const j = JSON.parse(r); if (j.code !== 0) throw new Error(j.msg);
  const pr = curlApi('PATCH', `/open-apis/docx/v1/documents/${objToken}/blocks/${blockId}`, token, { replace_image: { token: j.data.file_token } });
  return pr.code === 0;
}

const SPACE_ID = '7615178195469421499';
const PARENT_NODE = 'PMmzwQhhaihc66kIJ7Zck50HnNh'; // 每周一酒 series node

interface WineData {
  num: number; title: string; subtitle: string;
  name: string; zhName: string; region: string; grape: string; vintage: string; abv: string; price: string; score: string;
  story: string[];
  nose: string; palate: string; finish: string;
  foodCn: [string, string][]; foodWest: [string, string][];
  temp: string; decant: string; glass: string; age: string;
  buy: [string, string][]; warning: string;
  similar: [string, string][];
  closing: string;
  imgUrl: string;
}

function wineToBlocks(w: WineData): any[] {
  const blocks: any[] = [
    img(), p(t('')),
    quote(b(`每周一酒 · 第 ${w.num} 期`), t(`\n${w.subtitle}`)),
    p(t('')), hr(),
    h1('🏷️ 酒款档案'), p(t('')),
    p(b('酒名：'), t(w.name)), p(b('中文名：'), t(w.zhName)),
    p(b('产区：'), t(w.region)), p(b('品种：'), t(w.grape)),
    p(b('年份：'), t(w.vintage)), p(b('酒精度：'), t(w.abv)),
    p(b('价格区间：'), t(w.price)), p(b('评分参考：'), t(w.score)),
    p(t('')), hr(),
    h1('🏰 酒庄故事'), p(t('')),
  ];
  for (const s of w.story) blocks.push(p(t(s)), p(t('')));
  blocks.push(hr(), h1('🍷 品鉴笔记'), p(t('')));
  blocks.push(p(b('闻香：'), t(w.nose)));
  blocks.push(p(b('入口：'), t(w.palate)));
  blocks.push(p(b('余味：'), t(w.finish)));
  blocks.push(p(t('')), hr(), h1('🍽️ 配餐建议'), p(t('')), h2('🥢 中餐'));
  for (const [f, d] of w.foodCn) blocks.push(li(b(f), t(` —— ${d}`)));
  blocks.push(p(t('')), h2('🍽️ 西餐'));
  for (const [f, d] of w.foodWest) blocks.push(li(b(f), t(` —— ${d}`)));
  blocks.push(p(t('')), hr(), h1('🌡️ 饮用建议'), p(t('')));
  blocks.push(p(b('适饮温度：'), t(w.temp)));
  blocks.push(p(b('醒酒：'), t(w.decant)));
  blocks.push(p(b('杯型：'), t(w.glass)));
  blocks.push(p(b('陈年潜力：'), t(w.age)));
  blocks.push(p(t('')), hr(), h1('🛒 购买渠道'), p(t('')));
  for (const [ch, pr] of w.buy) blocks.push(li(b(ch), t(` —— ${pr}`)));
  blocks.push(p(t('')), p(t('⚠️ '), b('提醒：'), t(w.warning)));
  blocks.push(p(t('')), hr(), h1('🔄 同类推荐'), p(t('')));
  for (const [n, d] of w.similar) blocks.push(li(b(n), t(` —— ${d}`)));
  blocks.push(p(t('')), hr(), p(t('')));
  blocks.push(quote(b('本期总结'), t(`\n${w.closing}\n\n—— 每周一酒 · 第 ${w.num} 期 🍷`)));
  return blocks;
}

const WINES: WineData[] = [
  {
    num: 2, title: '第 2 期：拉菲传奇波尔多 —— 名门的平价入口', subtitle: '拉菲集团的入门款，¥150 就能喝到「拉菲」二字背后的基本功。',
    name: 'Légende Bordeaux Rouge', zhName: '拉菲传奇波尔多红', region: '法国 · 波尔多', grape: '赤霞珠为主，混酿梅洛', vintage: '2021', abv: '13.5%', price: '¥130-180', score: 'Wine Spectator 87',
    story: ['拉菲罗斯柴尔德集团（Domaines Barons de Rothschild）在大名鼎鼎的一级庄拉菲之外，推出了「传奇（Légende）」系列——用波尔多各地的优质葡萄，以拉菲的酿造标准打造一款让普通人也喝得起的酒。', '不要把它当拉菲来喝，把它当「波尔多标准教科书」来喝，你会发现它非常称职：该有的黑醋栗、雪松、适中的单宁，全都在。'],
    nose: '黑醋栗、红樱桃、淡淡的香草和橡木', palate: '中等酒体，单宁柔和，黑色浆果和一点烟草味，酸度平衡', finish: '中等长度，干净利落，微微的苦巧克力',
    foodCn: [['红烧排骨', '酱香和果香互补'], ['葱爆羊肉', '赤霞珠的结构感配羊肉的膻鲜'], ['酱鸭', '波尔多混酿和酱味很搭']],
    foodWest: [['意面配肉酱', '经典搭配，不会出错'], ['汉堡', '日常餐酒配日常西餐'], ['烤鸡', '酒体不重，不会压过鸡肉']],
    temp: '16-18°C', decant: '不需要，开瓶即饮', glass: '波尔多杯', age: '1-3 年内饮用最佳',
    buy: [['京东自营', '¥138-168'], ['天猫旗舰店', '¥150 左右'], ['山姆', '偶尔有售 ¥130']],
    warning: '拉菲传奇也有假货，注意买官方授权渠道。',
    similar: [['木桐嘉棣 Mouton Cadet', '¥90-120，同级别波尔多品牌酒'], ['玛歌红亭 Pavillon Rouge', '¥180-250，玛歌副牌入门']],
    closing: '拉菲传奇不会让你惊艳，但它会让你明白「波尔多」这三个字是什么味道。入门首选，不丢人。',
    imgUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80',
  },
  {
    num: 3, title: '第 3 期：干露红魔鬼 —— 智利酒的国民之选', subtitle: '全中国卖得最好的智利酒，便利店常客，但你真的了解它吗？',
    name: 'Casillero del Diablo Cabernet Sauvignon', zhName: '干露红魔鬼赤霞珠', region: '智利 · 中央山谷', grape: '赤霞珠 Cabernet Sauvignon', vintage: '2022', abv: '13.5%', price: '¥50-80', score: 'Wine Spectator 86',
    story: ['干露酒庄（Concha y Toro）创立于 1883 年，是智利最大的葡萄酒集团。「红魔鬼」的名字来自一个传说：庄主 Don Melchor 发现有人偷喝酒窖的酒，于是散布谣言说酒窖里住着魔鬼，从此再没人敢进去偷酒。', '红魔鬼系列是入门智利酒的标杆，年销上亿瓶。它不追求复杂度，追求的是「每一口都不让你失望」的稳定性。'],
    nose: '成熟黑莓、红辣椒、淡淡的薄荷和巧克力', palate: '中等酒体，柔顺果味为主，单宁轻柔，入口易饮', finish: '短到中等，甜美果味收尾',
    foodCn: [['回锅肉', '果味浓郁配微辣的回锅肉很搭'], ['糖醋排骨', '酒的甜美和糖醋的酸甜互相呼应'], ['烤串', '便利店红酒+烤串=深夜最佳组合']],
    foodWest: [['披萨', '番茄基底配智利赤霞珠天然合拍'], ['BBQ', '果味配烧烤永远不出错'], ['汉堡薯条', '不要想太多，干就完了']],
    temp: '16°C', decant: '不需要', glass: '任何杯子都行，甚至纸杯', age: '买了就喝，不用存',
    buy: [['便利店', '全家/7-11 常年有售 ¥60-80'], ['京东', '¥50-65，经常有满减'], ['盒马', '¥55-70']],
    warning: '不用担心假货，红魔鬼产量大且价格低，造假利润不够。',
    similar: [['黄尾袋鼠', '¥40-60，澳洲的「国民酒」'], ['桃乐丝公牛血', '¥50-70，西班牙同档位经典']],
    closing: '红魔鬼不是用来品鉴的，是用来享受的。冰箱里常备一瓶，下班回家开一杯，比任何仪式感都治愈。',
    imgUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
  },
  {
    num: 4, title: '第 4 期：云雾之湾长相思 —— 新西兰的味觉炸弹', subtitle: '如果你还没喝过新西兰长相思，你错过了白葡萄酒最震撼的体验之一。',
    name: 'Cloudy Bay Sauvignon Blanc', zhName: '云雾之湾长相思', region: '新西兰 · 马尔堡', grape: '长相思 Sauvignon Blanc', vintage: '2023', abv: '13%', price: '¥180-250', score: 'Wine Spectator 91',
    story: ['Cloudy Bay 创立于 1985 年，几乎以一己之力把新西兰葡萄酒推上了世界舞台。创始人 David Hohnen 从澳洲来到马尔堡（Marlborough），被这里极端纯净的自然环境震撼，决定在此酿酒。', '马尔堡的秘密是：冷凉气候 + 超长日照 + 干燥秋天。葡萄成熟缓慢，积累了极其浓郁的芳香物质，同时保持了尖锐的酸度。结果就是——闻一下就炸裂的香气。'],
    nose: '百香果、青柠、青草、接骨木花、矿石——香气像开了挂一样扑面而来', palate: '酒体轻到中等，酸度如激光般锐利，热带水果和草本味在舌尖跳跃', finish: '中长余味，矿物感和柑橘持续不退',
    foodCn: [['白切鸡', '长相思的酸度配白切鸡的原味，清爽绝配'], ['清蒸鱼', '柑橘和鱼肉天生一对'], ['虾饺/水晶虾仁', '酸度切虾的甜，互相升华']],
    foodWest: [['生蚝', '经典中的经典，长相思+生蚝=完美'], ['山羊奶酪沙拉', '法国人发明的搭配，新西兰酒更好用'], ['烟熏三文鱼', '草本感和烟熏味层层递进']],
    temp: '8-10°C，冰透再喝', decant: '绝对不需要', glass: '白葡萄酒杯（小杯口聚拢香气）', age: '1-2 年内喝掉，这酒要的就是新鲜',
    buy: [['京东自营', '¥198-230'], ['天猫', '¥200 左右'], ['精品酒商', '偶尔有平行进口 ¥160-180']],
    warning: '开瓶后当天喝完，这酒氧化很快。',
    similar: [['灰岩长相思 Greywacke', '¥150-200，Cloudy Bay 前酿酒师自立门户'], ['狗角长相思 Dog Point', '¥120-160，马尔堡另一经典']],
    closing: '如果你一直觉得白葡萄酒「淡而无味」，让 Cloudy Bay 改变你的偏见。一口下去，你会知道什么叫「白酒也能有爆发力」。',
    imgUrl: 'https://images.unsplash.com/photo-1566995541428-f4e827e06c09?w=800&q=80',
  },
  {
    num: 5, title: '第 5 期：莫斯卡托甜白 —— 不喝酒的人也会爱上的酒', subtitle: '5-6% 的酒精度，蜜桃白花香气，微甜微泡——这是葡萄酒世界的「甜蜜入门票」。',
    name: "Moscato d'Asti DOCG", zhName: '莫斯卡托甜白微泡', region: '意大利 · 皮埃蒙特 · 阿斯蒂', grape: '小粒白麝香 Moscato Bianco', vintage: '2023', abv: '5.5%', price: '¥60-120', score: '适饮型酒款，不适用评分体系',
    story: ['Moscato d\'Asti 产自意大利皮埃蒙特的阿斯蒂地区——没错，就是出巴罗洛和巴巴莱斯科的那个皮埃蒙特。同一片土地，既能酿出最严肃的红酒，也能酿出最甜蜜的白酒。', '和一般起泡酒不同，Moscato d\'Asti 只有微微的气泡（frizzante），瓶内压力只有 1-2 个大气压（香槟是 5-6 个），所以口感更柔和，像在喝蜜桃汽水——但比汽水高级一百倍。'],
    nose: '白桃、荔枝、橙花、蜂蜜、玫瑰花瓣——香到不像酒', palate: '入口微甜，气泡细腻，像蜜桃苏打水的高级版。酸度刚好平衡甜度，不会腻', finish: '短而清爽，收尾干净，让你想再喝一口',
    foodCn: [['水果拼盘', '蜜桃味配真水果，甜蜜加倍'], ['绿豆糕/桂花糕', '中式甜点的最佳伴侣'], ['港式甜品（杨枝甘露/芒果班戟）', '热带水果风味互相呼应']],
    foodWest: [['提拉米苏', '甜配甜，经典意式组合'], ['水果塔', '莓果类甜品和莫斯卡托绝配'], ['早午餐', '代替含羞草鸡尾酒，更轻松']],
    temp: '6-8°C，冰到透心凉', decant: '想都不要想', glass: '笛形杯或随便什么杯子', age: '买最新年份，当年喝完',
    buy: [['京东搜「莫斯卡托」', '¥60-120，品牌很多'], ['盒马', '经常有 ¥69 的好选择'], ['Costco', '偶尔有大牌低价']],
    warning: '认准 Moscato d\'Asti DOCG（不是普通的 Asti Spumante，后者气泡更多但品质参差不齐）。',
    similar: [['Brachetto d\'Acqui', '¥80-120，红色莫斯卡托，草莓味的微泡甜红'], ['德国雷司令 Spätlese', '¥80-150，晚收甜白，蜂蜜和杏子味']],
    closing: '莫斯卡托是给所有「我不喝酒」的人准备的后门。一口下去，他们就会说：「这个……好像还不错？」',
    imgUrl: 'https://images.unsplash.com/photo-1558346547-4439467bd1d5?w=800&q=80',
  },
  {
    num: 6, title: '第 6 期：木桐嘉棣 —— 波尔多销量之王', subtitle: '全世界卖得最多的波尔多葡萄酒。每年 1500 万瓶，它凭什么？',
    name: 'Mouton Cadet Rouge', zhName: '木桐嘉棣红', region: '法国 · 波尔多', grape: '梅洛为主，赤霞珠、品丽珠混酿', vintage: '2021', abv: '13.5%', price: '¥80-120', score: 'Wine Spectator 85',
    story: ['1930 年，木桐酒庄的 Baron Philippe de Rothschild 做了一个大胆决定：把酒庄不够格进入正牌的葡萄酒单独装瓶出售，取名 Mouton Cadet（嘉棣＝小儿子）。', '这个「副产品」后来成了波尔多历史上最成功的品牌酒。如今木桐嘉棣早已不用木桐酒庄的葡萄，而是从整个波尔多产区精选原料。它的使命是：让全世界人用最低的门槛喝到靠谱的波尔多。'],
    nose: '红色浆果、李子、淡淡的橡木和香料', palate: '轻到中等酒体，单宁柔和，果味亲和。典型的「好喝不累」', finish: '短，干净，微微的甘草',
    foodCn: [['红烧鱼', '波尔多配红烧菜永远不出错'], ['卤味拼盘', '当开胃酒配卤味，轻松自在'], ['炒饭/炒面', '日常中餐的万能搭配']],
    foodWest: [['肉酱意面', '番茄肉酱配波尔多是入门标配'], ['烤鸡翅', '聚会必备'], ['奶酪拼盘', '中等强度奶酪最合适']],
    temp: '16-18°C', decant: '不需要', glass: '波尔多杯', age: '1-3 年，即买即饮',
    buy: [['京东', '¥88-110'], ['天猫', '¥90-120'], ['进口超市', '¥100 左右']],
    warning: '注意区分木桐嘉棣和木桐正牌（Château Mouton Rothschild），后者 ¥3000+。',
    similar: [['拉菲传奇', '¥130-180，同级别竞品'], ['龙船波尔多', '¥60-90，更便宜的波尔多选择']],
    closing: '木桐嘉棣是波尔多的「麦当劳」——不是贬义，是说它在全世界任何地方都能给你稳定的品质和合理的价格。',
    imgUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
  },
  {
    num: 7, title: '第 7 期：桃乐丝公牛血 —— 西班牙的国民红酒', subtitle: '一头公牛、一个世纪、一瓶不到 ¥70 的西班牙经典。',
    name: 'Torres Sangre de Toro', zhName: '桃乐丝公牛血', region: '西班牙 · 加泰罗尼亚', grape: '歌海娜 Garnacha + 佳丽酿 Cariñena', vintage: '2021', abv: '13.5%', price: '¥50-70', score: 'Wine Spectator 85',
    story: ['桃乐丝（Torres）家族自 1870 年开始在加泰罗尼亚酿酒。公牛血（Sangre de Toro＝Bull\'s Blood）是他们最畅销的酒款，每瓶瓶颈上都挂着一只小公牛装饰。', '1979 年的「巴黎葡萄酒奥林匹克」盲品赛上，桃乐丝的高端酒 Mas La Plana 击败了拉图和侯伯王，震惊世界。从此桃乐丝成为西班牙品质的代名词。而公牛血就是他们家最亲民的作品。'],
    nose: '成熟红莓、黑樱桃、肉桂、甘草、地中海香草', palate: '中等酒体，歌海娜的温暖果味为主，柔顺易饮，有一点香料的辛辣', finish: '中等，暖暖的香料余味',
    foodCn: [['新疆大盘鸡', '香料配香料，天然搭档'], ['烤羊腿', '歌海娜的温暖感和羊肉的膻鲜绝配'], ['番茄牛腩', '西班牙酒配番茄菜永远正确']],
    foodWest: [['西班牙海鲜饭', '产区搭配，文化上就是一对'], ['披萨', '歌海娜的果味和番茄奶酪很搭'], ['烤蔬菜', '素食友好']],
    temp: '15-17°C', decant: '不需要', glass: '通用红酒杯', age: '即买即饮',
    buy: [['京东', '¥55-70'], ['天猫', '¥50-65'], ['进口超市', '¥60 左右']],
    warning: '注意瓶颈的小公牛是正品标志，假货通常没有。',
    similar: [['红魔鬼', '¥50-80，智利同价位'], ['黄尾袋鼠', '¥40-60，澳洲同价位']],
    closing: '公牛血是你酒柜里应该常备的「救急酒」。朋友突然来访、下班想喝一杯、做菜需要红酒——¥60 解决一切。',
    imgUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
  },
  {
    num: 8, title: '第 8 期：蒙特斯紫天使 —— 智利酒的天花板', subtitle: '当智利酒不再只是「性价比」，而是真正站上世界顶级舞台。',
    name: 'Montes Purple Angel', zhName: '蒙特斯紫天使', region: '智利 · 科尔查瓜谷', grape: '佳美娜 Carménère 92% + 小维多 Petit Verdot 8%', vintage: '2020', abv: '14.5%', price: '¥350-500', score: 'Wine Spectator 93 / Robert Parker 95',
    story: ['蒙特斯（Montes）创立于 1988 年，创始人 Aurelio Montes 被称为「智利葡萄酒的教父」。他在所有人都不看好的陡峭山坡上种葡萄，酿出了改写智利酒历史的作品。', '紫天使是全世界最贵的佳美娜（Carménère）——这个品种原产波尔多，19 世纪根瘤蚜虫灾后在法国几乎灭绝，却在智利重获新生。紫天使证明了佳美娜不只是「替代梅洛」，它本身就是伟大品种。'],
    nose: '黑莓、蓝莓、紫罗兰、黑巧克力、烟丝、焦糖', palate: '酒体饱满但不失优雅，黑色水果浓郁如酱，单宁丝滑，佳美娜特有的绿胡椒和草本调性增加复杂度', finish: '超长余味，巧克力和香料持续绽放，收尾微甜',
    foodCn: [['烤牛排/铁板牛柳', '酒体饱满配高级牛肉'], ['东坡肉', '浓郁酒体对浓郁肉香'], ['酱骨头', '深度风味互相碰撞']],
    foodWest: [['炭烤战斧牛排', '旗舰酒配旗舰菜'], ['松露料理', '复杂对复杂'], ['黑巧克力', '收尾小食，完美呼应酒里的巧克力味']],
    temp: '17-18°C', decant: '建议醒酒 1 小时以上', glass: '波尔多大杯', age: '可陈年 10-15 年，2020 年份现饮或再放都好',
    buy: [['京东自营', '¥380-480'], ['天猫旗舰店', '¥400-500'], ['精品酒商', '¥350-420']],
    warning: '记得醒酒，不醒的话浪费了这酒一半的潜力。',
    similar: [['蒙特斯欧法 M', '¥200-280，同酒庄次旗舰'], ['活灵魂 Almaviva', '¥500-800，智利和法国合作的顶级酒']],
    closing: '紫天使告诉你一个道理：不要用产地定义品质。智利酒不只有 ¥50 的日常餐酒，也有让全世界闭嘴的大师之作。',
    imgUrl: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=800&q=80',
  },
  {
    num: 9, title: '第 9 期：黄尾袋鼠 —— 全球销量第一的澳洲酒', subtitle: '曾经改变美国葡萄酒市场的格局，靠的不是品质惊人，而是「让不喝酒的人也愿意买」。',
    name: 'Yellow Tail Shiraz', zhName: '黄尾袋鼠设拉子', region: '澳大利亚 · 新南威尔士', grape: '设拉子 Shiraz', vintage: '2022', abv: '13.5%', price: '¥40-60', score: 'N/A（不参与专业评分）',
    story: ['Yellow Tail 由意大利移民 Casella 家族创立于 1969 年。2001 年正式推出 Yellow Tail 品牌时，没有人预见到它会成为美国史上增长最快的葡萄酒品牌。', '它的成功秘诀不是「酿得好」而是「卖得好」：简单的袋鼠标签、水果味突出易饮、价格亲民、在超市货架上一眼就能认出来。黄尾袋鼠让数百万美国人第一次把葡萄酒放进购物车。'],
    nose: '甜美的黑莓、李子、香草、一点棉花糖', palate: '轻到中等酒体，几乎没有单宁，甜美果味为主，像喝果汁加强版', finish: '短，甜美，无负担',
    foodCn: [['铁板/烤肉', '不需要思考的搭配'], ['麻辣烫', '冰一下配麻辣烫，比啤酒有格调'], ['炸鸡', '肥宅快乐水的升级版']],
    foodWest: [['BBQ', '澳洲酒+烧烤=国民组合'], ['薯片/零食', '沙发酒，配什么都行'], ['芝士汉堡', '快餐搭配']],
    temp: '14-16°C，可以稍微冰一下', decant: '千万别', glass: '随意', age: '现买现喝',
    buy: [['各大超市', '¥45-60'], ['京东', '¥39-55'], ['拼多多', '¥35-45']],
    warning: '不要对它有超出价格的期待，它的任务是让你喝得开心，仅此而已。',
    similar: [['杰卡斯', '¥40-60，同为澳洲入门'], ['红魔鬼', '¥50-80，智利同级别']],
    closing: '黄尾袋鼠不是「好酒」，但它是「对的酒」——在对的时间、对的场景，它比任何高分酒都合适。有时候喝酒就是图个开心，别想太多。',
    imgUrl: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=80',
  },
  {
    num: 10, title: '第 10 期：酩悦香槟 —— 庆祝时刻的代名词', subtitle: '从拿破仑到 F1 领奖台，酩悦可能是这个星球上出镜率最高的酒。',
    name: 'Moët & Chandon Impérial Brut', zhName: '酩悦皇家干型香槟', region: '法国 · 香槟区', grape: '黑皮诺、莫尼耶皮诺、霞多丽', vintage: 'NV（无年份）', abv: '12%', price: '¥250-350', score: 'Wine Spectator 90',
    story: ['酩悦（Moët & Chandon）创立于 1743 年，是香槟区最大的酒庄，也是 LVMH 集团的明珠。拿破仑是它的超级粉丝——每次出征前都要来酒庄拿酒。Impérial（皇家）这个名字就是为了纪念拿破仑。', 'F1 赛车领奖台上喷的香槟？大概率就是酩悦。好莱坞电影里开的香槟？八成也是。酩悦不只是一瓶酒，它是「庆祝」这个概念的视觉符号。'],
    nose: '青苹果、白桃、面包酵母、杏仁、柑橘皮', palate: '气泡细腻绵密，酸度明亮但不尖锐，果味和面包味平衡得教科书级。入口欢快，让人不自觉微笑', finish: '中长余味，柑橘和杏仁饼干',
    foodCn: [['清蒸帝王蟹', '香槟配蟹肉是顶级享受'], ['白灼虾', '气泡清爽配虾的甜'], ['点心/虾饺', '早茶配香槟=最时髦的周末']],
    foodWest: [['生蚝', '永恒经典'], ['炸鸡', '看似违和实则绝配，气泡解油腻'], ['鱼子酱', '终极奢华搭配']],
    temp: '6-8°C，冰桶里放 20 分钟', decant: '不需要', glass: '郁金香形香槟杯（不要用碟形杯，气泡散太快）', age: 'NV 香槟买了 1-2 年内喝最好',
    buy: [['京东自营', '¥268-330'], ['天猫', '¥280-350'], ['免税店', '¥200-250，出国时记得带']],
    warning: '开瓶时手按住瓶塞慢慢旋转瓶身，别让瓶塞飞出去（香槟瓶内压力 6 个大气压，瓶塞速度可达 60km/h）。',
    similar: [['凯歌 Veuve Clicquot', '¥280-380，更圆润饱满'], ['巴黎之花 Perrier-Jouët', '¥300-400，更花香优雅']],
    closing: '人生值得庆祝的时刻比你以为的多。升职要庆祝，周五要庆祝，今天天气好也可以庆祝。开一瓶酩悦，给平凡的日子加一点气泡。',
    imgUrl: 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=800&q=80',
  },
  {
    num: 11, title: '第 11 期：奔富 Bin 28 —— Bin 389 的「弟弟」', subtitle: '纯设拉子、更低价格、更容易入口。如果 389 是正装出席，28 就是周末的卫衣牛仔裤。',
    name: 'Penfolds Bin 28 Kalimna Shiraz', zhName: '奔富 Bin 28 卡琳娜设拉子', region: '澳大利亚 · 南澳', grape: '设拉子 Shiraz 100%', vintage: '2021', abv: '14.5%', price: '¥180-250', score: 'James Halliday 93',
    story: ['Bin 28 以南澳的 Kalimna 葡萄园命名，这块园是奔富 1945 年买的，也是 Grange 最早使用的葡萄来源之一。', '和 Bin 389 的「双品种混酿追求平衡」不同，Bin 28 是纯粹的设拉子宣言：浓郁、奔放、不加修饰的南澳阳光味道。如果 389 是「理性之选」，28 就是「感性之选」。'],
    nose: '蓝莓酱、黑胡椒、肉桂、甘草、烤面包', palate: '饱满多汁，果味爆棚，单宁中等偏软，设拉子的辛辣感明显但不刺激', finish: '中等余味，胡椒和巧克力',
    foodCn: [['孜然烤肉', '胡椒配孜然，南澳配新疆'], ['红烧牛尾', '浓郁对浓郁'], ['叉烧/蜜汁烤排', '果味甜美配蜜汁']],
    foodWest: [['BBQ 烤排骨', '不需要理由'], ['汉堡', '日常搭配'], ['蓝纹奶酪', '大胆搭配，互相激发']],
    temp: '16-18°C', decant: '醒 20-30 分钟更好', glass: '波尔多杯或通用红酒杯', age: '5-8 年陈年潜力',
    buy: [['京东自营', '¥198-240'], ['天猫', '¥200-260'], ['山姆', '约 ¥200']],
    warning: '和 389 一样注意防伪。',
    similar: [['奔富 Bin 150', '¥250-320，单一产区 Marananga 设拉子'], ['禾富金标设拉子', '¥150-200，同产区替代']],
    closing: 'Bin 28 是给那些喜欢 389 但觉得「能不能再便宜点、再果味浓一点」的人准备的。答案是：可以。',
    imgUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80',
  },
  {
    num: 12, title: '第 12 期：路易拉图勃艮第黑皮诺 —— 法国红的另一面', subtitle: '如果波尔多是力量，勃艮第就是优雅。这是你理解「另一个法国」的入口。',
    name: 'Louis Latour Bourgogne Pinot Noir', zhName: '路易拉图勃艮第黑皮诺', region: '法国 · 勃艮第', grape: '黑皮诺 Pinot Noir 100%', vintage: '2021', abv: '13%', price: '¥150-220', score: 'Wine Spectator 87',
    story: ['路易拉图（Louis Latour）家族自 1797 年开始在勃艮第酿酒，是产区最大的酒商之一。他们拥有勃艮第最大的特级园面积（包括大名鼎鼎的 Corton-Charlemagne）。', '这款大区级勃艮第是路易拉图的入门款。别小看「大区级」——在勃艮第，即使是最基础的级别，也比其他很多产区的中端酒更讲究。'],
    nose: '红樱桃、草莓、紫罗兰、一点泥土和蘑菇', palate: '轻到中等酒体，单宁细腻如丝，酸度清新明亮。不是靠力量，而是靠层次取胜', finish: '中长余味，红色水果和一丝矿物感',
    foodCn: [['白斩鸡', '黑皮诺的轻酒体配鸡肉完美'], ['清蒸鲈鱼', '别被「红酒配红肉」束缚，黑皮诺配鱼很好'], ['蟹粉豆腐', '细腻配细腻']],
    foodWest: [['鸭胸肉', '黑皮诺配鸭是经典中的经典'], ['蘑菇烩饭', '酒里有蘑菇味，盘里也有'], ['三文鱼', '黑皮诺是少数能配鱼的红酒']],
    temp: '14-16°C，比波尔多低一点', decant: '不需要', glass: '勃艮第杯（大肚球形），杯型很重要', age: '2-5 年，不需要久放',
    buy: [['京东', '¥158-220'], ['天猫', '¥160-200'], ['精品酒商', '¥150-180']],
    warning: '勃艮第假酒也不少，特别是高端村庄级以上。大区级相对安全。',
    similar: [['布夏父子 Bouchard Père & Fils', '¥130-180，另一个勃艮第大酒商'], ['尚维尔 Joseph Drouhin', '¥140-200，优质大区勃艮第']],
    closing: '喝完波尔多觉得「葡萄酒就是这样了吗」？勃艮第会告诉你：不，还有一个完全不同的宇宙等你探索。路易拉图就是那扇门。',
    imgUrl: 'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=800&q=80',
  },
  {
    num: 13, title: '第 13 期：马尔堡长相思合集 —— 新西兰最亮的名片', subtitle: '除了 Cloudy Bay，马尔堡还有一堆好喝到飞起的长相思等你解锁。',
    name: 'Marlborough Sauvignon Blanc（产区合集）', zhName: '马尔堡长相思精选', region: '新西兰 · 马尔堡', grape: '长相思 Sauvignon Blanc', vintage: '2023', abv: '12.5-13.5%', price: '¥80-200', score: '多款 88-92',
    story: ['马尔堡（Marlborough）位于新西兰南岛的东北角。1973 年 Montana 酒庄在这里种下第一批长相思，从此改写了世界白葡萄酒的版图。', '如今马尔堡占了新西兰葡萄酒产量的 77%，其中绝大部分是长相思。这里的特殊之处在于：南半球最长的日照时间 + 凉爽的夜晚 = 缓慢成熟 + 极致香气。'],
    nose: '百香果、青柠、番石榴、割草味、燧石矿物感（具体因品牌不同而有差异）', palate: '高酸度、中等酒体、热带水果和柑橘类风味的万花筒', finish: '清爽持久，矿物和柑橘尾调',
    foodCn: [['白灼海鲜', '酸度切鲜味'], ['凉拌菜', '夏天的清爽组合'], ['越南/泰国菜', '热带水果味配东南亚风味']],
    foodWest: [['生蚝/贝类', '经典搭配'], ['沙拉', '最健康的配酒方案'], ['意式海鲜', '百搭']],
    temp: '8-10°C', decant: '不需要', glass: '白葡萄酒杯', age: '1-3 年内喝完',
    buy: [['京东搜马尔堡长相思', '¥80-200 各价位都有'], ['精品酒商', '可以找到小众精品'], ['新西兰直邮', '有些酒国内买不到']],
    warning: '买最新年份，长相思不需要陈年。',
    similar: [['卢瓦尔河谷桑塞尔', '¥150-250，法国风格的长相思，更矿物更克制'], ['南非长相思', '¥80-150，介于法国和新西兰之间']],
    closing: '马尔堡长相思就像一个性格开朗的好朋友——见面就能聊起来，永远充满活力，让你心情好。夏天冰箱里没有它是不完整的。',
    imgUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
  },
  {
    num: 14, title: '第 14 期：巴罗洛 —— 意大利酒王', subtitle: '「意大利的勃艮第」、「酒中之王、王中之酒」—— 巴罗洛的名号不是吹的。',
    name: 'Barolo DOCG', zhName: '巴罗洛', region: '意大利 · 皮埃蒙特 · 朗格', grape: '内比奥罗 Nebbiolo 100%', vintage: '2019', abv: '14%', price: '¥250-600+', score: '因酒庄不同 90-98',
    story: ['巴罗洛产区只有 2000 多公顷——还没北京一个大型社区面积大。但就是这么小的地方，酿出了意大利最伟大的红酒。', '内比奥罗（Nebbiolo）这个品种极其挑剔：只在皮埃蒙特的特定山丘上才能完全成熟，离开这片土地它就「不行了」。这也是为什么巴罗洛不可复制——世界上没有第二个地方能种出同样的内比奥罗。'],
    nose: '玫瑰花瓣、焦油、樱桃干、松露、甘草、烟草——极其复杂', palate: '高酸度、高单宁、但有极其精细的红色水果核心。第一口可能被单宁吓到，但多喝几口会发现层次像洋葱一样一层层打开', finish: '超长余味，焦油和玫瑰持续 30 秒以上',
    foodCn: [['红烧牛肉/炖牛腩', '需要同等分量的浓郁菜品'], ['酱鸭/卤水鹅', '五香和巴罗洛的复杂风味呼应'], ['松茸/牛肝菌', '松露味对松露味']],
    foodWest: [['白松露意面', '巴罗洛的终极搭配，每年秋天的意大利仪式'], ['炖牛肉/焖小牛腱', '传统皮埃蒙特家常菜'], ['陈年帕玛森奶酪', '两个都需要时间沉淀的好东西']],
    temp: '17-18°C', decant: '年轻的巴罗洛强烈建议醒酒 1-2 小时', glass: '大号勃艮第杯', age: '顶级可陈年 30 年以上，入门款也建议 5-10 年',
    buy: [['精品酒商', '¥250-600，品质差异大'], ['京东', '搜「巴罗洛」¥300 左右有不错的选择'], ['意大利直邮', '¥200-400 能买到好酒']],
    warning: '便宜的巴罗洛可能很粗糙——这是一个「一分钱一分货」特别明显的产区。至少 ¥300 起步。',
    similar: [['巴巴莱斯科 Barbaresco', '¥200-500，巴罗洛的「妹妹」，更柔和一点'], ['兰格内比奥罗 Langhe Nebbiolo', '¥120-200，不满足巴罗洛法规但同品种']],
    closing: '巴罗洛不是给新手喝的——但如果你已经喝过几十款酒，觉得「差不多就这样了」，那么巴罗洛会重新打开你的世界。它是葡萄酒的终极考卷。',
    imgUrl: 'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=800&q=80',
  },
  {
    num: 15, title: '第 15 期：里奥哈陈酿 —— 西班牙的时间艺术', subtitle: '全世界最慷慨的产区：酒庄替你把酒存好了，打开就是巅峰状态。',
    name: 'Rioja Reserva / Gran Reserva', zhName: '里奥哈珍藏/特级珍藏', region: '西班牙 · 里奥哈', grape: '丹魄 Tempranillo 为主', vintage: 'Reserva 2018 / Gran Reserva 2015', abv: '13.5-14%', price: 'Reserva ¥120-250 / Gran Reserva ¥200-500', score: '因酒庄不同 88-95',
    story: ['里奥哈（Rioja）是西班牙最古老、最著名的葡萄酒产区，陈酿制度全世界独一无二：Reserva 至少陈年 3 年（其中 1 年在橡木桶），Gran Reserva 至少 5 年（其中 2 年在桶中）。', '这意味着什么？当你从货架上拿起一瓶里奥哈 Gran Reserva 时，它已经在酒庄里静静陈放了 5 年以上。打开就能喝到一款完美成熟的酒——不需要你自己存、不需要等。这是世界上最对消费者友好的产区。'],
    nose: '红樱桃干、皮革、香草、烟草、椰子、肉桂——美式橡木桶带来的温暖甜美', palate: '中等酒体，单宁已被时间打磨得柔滑如天鹅绒。酸度优美，红色水果和橡木完美融合', finish: '长余味，皮革和甘草慢慢退去',
    foodCn: [['烤乳猪/脆皮猪肘', '陈酿的柔和单宁配脆皮猪肉'], ['卤牛肉', '酱香和桶香互相映衬'], ['煲仔饭', '锅巴的焦香和橡木味呼应']],
    foodWest: [['西班牙火腿 Jamón', '产区搭配，天作之合'], ['烤羊排', '丹魄的皮革感和羊肉经典搭配'], ['焗蜗牛', '南法/西班牙经典前菜']],
    temp: '16-17°C', decant: 'Reserva 不太需要，Gran Reserva 醒 30 分钟', glass: '波尔多杯', age: '已经在最佳状态，买了就喝',
    buy: [['京东搜里奥哈', '¥120-400 各档位'], ['精品酒商', '¥150-350 有很多好选择'], ['西班牙直邮', '价格更低']],
    warning: '认准 DOCa Rioja 标志。Crianza（新酿）级别可以跳过，直接从 Reserva 开始。',
    similar: [['杜罗河谷 Douro', '¥100-250，葡萄牙的丹魄近亲'], ['里贝拉德杜罗 Ribera del Duero', '¥150-400，西班牙另一个丹魄天堂']],
    closing: '里奥哈是最适合「不想等、直接喝好酒」的人的产区。别人的酒让你等 10 年，里奥哈替你等好了。这不是偷懒，这是西班牙式的优雅。',
    imgUrl: 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=800&q=80',
  },
  {
    num: 16, title: '第 16 期：基安蒂经典 —— 意大利餐桌上的灵魂', subtitle: '草编瓶的时代过去了，今天的基安蒂是认真的。',
    name: 'Chianti Classico DOCG', zhName: '基安蒂经典', region: '意大利 · 托斯卡纳', grape: '桑娇维塞 Sangiovese 80-100%', vintage: '2021', abv: '13-14%', price: '¥100-250', score: '因酒庄 87-93',
    story: ['基安蒂（Chianti）曾经是廉价意大利红酒的代名词——那种装在草编瓶（fiasco）里的酸涩红酒。但从 1990 年代开始，基安蒂经历了一场品质革命。', '今天的 Chianti Classico（经典基安蒂，酒标上有黑公鸡标志）只产自佛罗伦萨和锡耶纳之间的核心山丘。它不再便宜也不再粗糙，而是展现出桑娇维塞葡萄最正宗的面貌。'],
    nose: '酸樱桃、红醋栗、紫罗兰、干燥香草、托斯卡纳泥土', palate: '中等酒体，高酸度（这是桑娇维塞的标签），单宁中等偏紧实，樱桃和香草味明亮', finish: '中长余味，酸樱桃和一丝苦杏仁',
    foodCn: [['番茄炒蛋', '意大利酒配番茄基底的菜天然绝配'], ['红烧茄子', '酸度切茄子的油腻'], ['披萨', '基安蒂+披萨=意大利国民组合']],
    foodWest: [['佛罗伦萨牛排', '产区经典搭配'], ['番茄肉酱意面', '教科书搭配'], ['硬质奶酪', '佩科里诺/帕玛森']],
    temp: '16-18°C', decant: 'Riserva 级别醒 30 分钟', glass: '通用红酒杯', age: '普通款 2-5 年，Riserva 5-10 年',
    buy: [['京东', '¥100-250'], ['精品酒商', '¥120-200 有很多好选择'], ['进口超市', '¥130-180']],
    warning: '注意区分 Chianti 和 Chianti Classico——后者才是核心产区，品质更高，认准黑公鸡标志。',
    similar: [['布鲁奈罗 Brunello di Montalcino', '¥250-600，托斯卡纳的「巴罗洛」'], ['蒙特普恰诺贵族酒 Vino Nobile', '¥120-250，另一个桑娇维塞产区']],
    closing: '基安蒂教你一个道理：不要用过去的印象定义一款酒。给它一次机会，你会发现曾经被低估的东西，如今可能最物超所值。',
    imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
  {
    num: 17, title: '第 17 期：阿根廷马尔贝克 —— 南美的紫色名片', subtitle: '在法国被淘汰的品种，在阿根廷找到了第二春。浓郁、性感、直给。',
    name: 'Malbec Mendoza', zhName: '门多萨马尔贝克', region: '阿根廷 · 门多萨', grape: '马尔贝克 Malbec', vintage: '2022', abv: '14-14.5%', price: '¥80-200', score: '因品牌不同 86-93',
    story: ['马尔贝克原产法国卡奥尔（Cahors），在波尔多是被嫌弃的「补充品种」。1853 年，法国农学家 Michel Pouget 把它带到了阿根廷门多萨。', '安第斯山脉海拔 600-1500 米的葡萄园、极强的紫外线、巨大的昼夜温差——这些条件让马尔贝克在阿根廷爆发出了在法国从未展现的潜力。如今阿根廷马尔贝克已经成为独立的风格标杆，不需要再和法国比较。'],
    nose: '黑莓、蓝莓、紫罗兰、可可、黑胡椒、烟熏', palate: '酒体饱满，果味浓郁如果酱但有足够的酸度支撑。单宁比赤霞珠柔和得多，不涩但有质感', finish: '中长余味，巧克力和紫罗兰',
    foodCn: [['烤全羊', '阿根廷国菜 Asado 配马尔贝克'], ['红烧肉', '浓郁配浓郁'], ['孜然牛肉', '辛辣的风味互相呼应']],
    foodWest: [['烤牛排', '阿根廷牛排+马尔贝克=国家级搭配'], ['烤肉拼盘', '不需要解释'], ['黑巧克力', '酒里有可可味，盘里也有']],
    temp: '16-18°C', decant: '中高端款醒 30 分钟', glass: '波尔多杯', age: '普通款即饮，高端款可陈年 5-10 年',
    buy: [['京东搜马尔贝克', '¥80-200 选择很多'], ['天猫', '¥90-180'], ['Costco', '经常有好的马尔贝克特价']],
    warning: '选择海拔标注的更好——High Altitude / Altitude Series 通常品质更高。',
    similar: [['智利佳美娜', '¥80-200，南美另一个独特品种'], ['澳洲设拉子', '¥80-200，另一个「浓郁流派」的代表']],
    closing: '马尔贝克是给「我喜欢浓郁的酒但不想花太多钱」的人准备的最佳答案。¥100 就能买到让你满意的浓缩风味。',
    imgUrl: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=800&q=80',
  },
  {
    num: 18, title: '第 18 期：德国雷司令 —— 被严重低估的伟大品种', subtitle: '很多专业人士认为雷司令是世界上最伟大的白葡萄品种。没有「之一」。',
    name: 'Riesling Kabinett / Spätlese', zhName: '雷司令珍藏/晚收', region: '德国 · 莫泽尔/莱茵高', grape: '雷司令 Riesling 100%', vintage: '2022', abv: '8-12%', price: '¥80-200', score: '因酒庄 88-95',
    story: ['雷司令在德国已有 600 多年历史。莫泽尔（Mosel）河谷陡峭的板岩坡地上，雷司令展现出了其他产区无法复制的精致和复杂。', '雷司令之所以被专业人士推崇，是因为它是最能表达「风土」的白葡萄品种——不同地块、不同年份、不同甜度级别，每一瓶都不同。而且好的雷司令可以陈年 20-50 年，这在白葡萄酒中几乎独一无二。'],
    nose: '青柠、白桃、蜂蜜、汽油味（陈年后出现，是好事不是坏事）、板岩矿物', palate: '关键词是「张力」——极高的酸度和恰到好处的甜度之间的完美平衡。入口像走钢丝，精彩绝伦', finish: '超长余味，矿物和柑橘在舌尖跳了很久',
    foodCn: [['广式烧鹅', '微甜雷司令配脆皮烧鹅是神级搭配'], ['蟹黄系列', '酸度切蟹的腥，甜度配蟹的鲜'], ['辣子鸡', '微甜雷司令是少数能配辣菜的酒']],
    foodWest: [['鹅肝', '甜雷司令配鹅肝是法国人发明的经典'], ['亚洲融合菜', '雷司令的酸甜平衡和亚洲风味最搭'], ['蓝纹奶酪', '甜配咸，教科书搭配']],
    temp: '8-10°C', decant: '不需要', glass: '雷司令专用杯或白葡萄酒杯', age: 'Kabinett 3-10 年，Spätlese 5-20 年',
    buy: [['精品酒商', '¥80-200，德国酒专业渠道更靠谱'], ['京东', '¥100-200'], ['Wine-Searcher', '搜名庄']],
    warning: '德国酒标复杂，记住：Kabinett（最清爽）→ Spätlese（晚收微甜）→ Auslese（精选甜）→ TBA/BA（极甜贵族酒）。入门从 Kabinett 或 Spätlese 开始。',
    similar: [['阿尔萨斯雷司令', '¥100-200，法国版雷司令，更干更饱满'], ['奥地利雷司令', '¥100-250，介于德国和法国之间']],
    closing: '如果你只喝过干型白葡萄酒，试一次德国 Spätlese 雷司令——那种酸甜平衡的快感，会让你重新定义「白酒能有多好喝」。',
    imgUrl: 'https://images.unsplash.com/photo-1558346547-4439467bd1d5?w=800&q=80',
  },
  {
    num: 19, title: '第 19 期：教皇新堡 —— 罗讷河谷的王者', subtitle: '教皇住过的地方，13 个品种的混酿魔法，法国南部最威严的产区。',
    name: 'Châteauneuf-du-Pape', zhName: '教皇新堡', region: '法国 · 南罗讷河谷', grape: '歌海娜为主，最多可混酿 13 个品种', vintage: '2020', abv: '14.5-15.5%', price: '¥200-600+', score: '因酒庄 88-100',
    story: ['14 世纪，教廷从罗马搬到了法国阿维尼翁（Avignon），教皇们在附近建了夏宫并种了葡萄，这就是「教皇新堡」（Châteauneuf-du-Pape＝教皇的新城堡）名字的由来。', '教皇新堡允许使用 13 个品种混酿（红白都算），这在法国产区中独一无二。但大多数酒庄以歌海娜为核心，加上西拉、慕合怀特等品种。最著名的是地上铺满的大鹅卵石——白天吸热，晚上释放，让葡萄额外成熟。'],
    nose: '黑莓、李子干、薰衣草、百里香、皮革、普罗旺斯草药——南法的味道全在这杯酒里', palate: '酒体饱满到令人惊叹，酒精度高但被浓郁果味包裹不觉得灼烧。草药和香料带来复杂度', finish: '极长余味，草药和矿物感',
    foodCn: [['羊蝎子火锅', '浓烈配浓烈'], ['酱牛肉', '草药和酱香互相成就'], ['红焖鹿肉/兔肉', '重口味野味配教皇新堡']],
    foodWest: [['普罗旺斯炖菜', '产区风味的完美呼应'], ['烤羊腿配迷迭香', '草药系搭配'], ['陈年奶酪', '浓缩配浓缩']],
    temp: '17-18°C', decant: '强烈建议醒酒 1 小时', glass: '波尔多大杯', age: '可陈年 10-20 年',
    buy: [['精品酒商', '¥200-600'], ['京东搜教皇新堡', '¥250-400 有不错的选择'], ['Wine-Searcher', '搜名庄如 Beaucastel、Vieux Télégraphe']],
    warning: '注意酒精度——教皇新堡常年 15% 以上，喝慢一点。',
    similar: [['吉恭达斯 Gigondas', '¥120-250，教皇新堡的「穷亲戚」，性价比极高'], ['罗讷河谷丘 Côtes du Rhône', '¥60-120，入门南罗讷']],
    closing: '教皇新堡是法国南部的王冠——它不像波尔多那样冷峻，也不像勃艮第那样含蓄。它是热情的、奔放的、慷慨的，就像地中海的阳光。',
    imgUrl: 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=800&q=80',
  },
  {
    num: 20, title: '第 20 期：波特酒 —— 甜蜜的终点站', subtitle: '加强酒里的王者，一杯能喝一晚上。最适合冬夜壁炉前的那一口甜。',
    name: 'Port Wine (Tawny / Ruby / LBV)', zhName: '波特酒', region: '葡萄牙 · 杜罗河谷', grape: '多品种：国产多瑞加、罗丽红等 80+ 种', vintage: 'Tawny 10/20年 / LBV 2018', abv: '19-22%', price: 'Ruby ¥80-150 / Tawny 10年 ¥150-300 / LBV ¥120-250', score: '因类型和品牌 85-97',
    story: ['17 世纪英法交恶，英国人没法从波尔多买酒，转向了葡萄牙。为了让酒能在漫长的海运中保持稳定，他们往红酒里加白兰地终止发酵——波特酒（Port）就此诞生。', '加白兰地意味着：甜度保留（发酵没完成，糖分还在）+ 酒精度升高（19-22%）+ 耐储存。一瓶打开的波特酒可以放 1-2 个月不坏。这是全世界最适合「一个人慢慢喝」的酒。'],
    nose: 'Ruby/LBV：黑莓、樱桃、巧克力、香料 / Tawny：焦糖、坚果、太妃糖、干果、蜂蜜', palate: '甜！但不是腻的甜，是被高酒精和丰富风味平衡的甜。Tawny 更顺滑焦糖味，Ruby/LBV 更浓郁水果味', finish: '超长余味，温暖甜蜜如冬夜的毯子',
    foodCn: [['月饼', '中秋配波特酒，甜配甜的东西方碰撞'], ['核桃/杏仁等坚果', 'Tawny 的坚果味配真坚果'], ['巧克力', 'Ruby Port 配黑巧是经典']],
    foodWest: [['蓝纹奶酪', '全世界最经典的波特酒搭配'], ['黑巧克力蛋糕', '甜配甜，互相升华'], ['焦糖布丁', 'Tawny Port 的完美终点']],
    temp: 'Ruby/LBV 14-16°C / Tawny 12-14°C（可以稍冰）', decant: 'LBV 和 Vintage Port 需要醒和去沉淀，其他不需要', glass: '波特酒杯（小杯，因为酒精高）或甜酒杯', age: 'Tawny 和 Ruby 已调配好即饮。Vintage Port 可陈年 50 年以上',
    buy: [['京东搜波特酒', 'Taylor\'s/Graham\'s/Sandeman 是大牌'], ['精品酒商', '¥100-300 有很多好选择'], ['免税店', '经常有好价格']],
    warning: '每次只倒 60-80ml，这酒酒精度接近 20%，别当红酒那样喝。',
    similar: [['雪莉酒 Sherry', '¥80-250，西班牙的加强酒，干型为主'], ['马德拉 Madeira', '¥100-300，葡萄牙另一款加强酒，更酸更焦糖']],
    closing: '波特酒是葡萄酒之旅的「甜蜜终点站」。当你喝遍了干红干白，试试这个19世纪英国绅士最爱的饭后酒——你会发现，葡萄酒还有一个你从未探索的甜蜜维度。',
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
        uploadAndPatch(token, objToken, firstImgBlockId, buf, `wine_${Date.now()}.jpg`);
        console.log('  图片 ✓');
        break;
      } catch (err: any) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000)); }
        else console.error(`  图片失败: ${err.message}`);
      }
    }
  }
  return { nodeToken, objToken };
}

async function main() {
  console.log('🍷 每周一酒 · 批量创建 #2-20\n');
  const tokenData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json'), 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) { console.error('Token 过期！'); return; }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  let created = 0;
  for (const w of WINES) {
    const blocks = wineToBlocks(w);
    const result = await createPage(token, PARENT_NODE, w.title, blocks, w.imgUrl);
    if (result) created++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\n成功创建 ${created}/${WINES.length} 篇`);

  console.log('\n\n✅ 每周一酒 #2-20 全部创建完成！');
}

main().catch(err => { console.error('错误:', err); process.exit(1); });
