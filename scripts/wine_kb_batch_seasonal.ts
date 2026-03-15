/**
 * 节日专题 批量创建 #2-20
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_batch_seasonal.ts
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
const PARENT_NODE = 'TCApwrGeyi2mSRkD74lcfzuUnsb'; // 节日专题

interface WineRec { name: string; type: string; why: string; price: string; }
interface SeasonalData {
  num: number; title: string; subtitle: string;
  intro: string;
  wines: WineRec[];
  menu: { dish: string; wine: string }[];
  buyTips: string;
  etiquette: string;
  imgUrl: string;
}

function seasonalToBlocks(d: SeasonalData): any[] {
  const blocks: any[] = [
    img(), p(t('')),
    quote(b(`节日专题 · 第 ${d.num} 期`), t(`\n${d.subtitle}`)),
    p(t('')), hr(),
    p(t(d.intro)), p(t('')), hr(),
    h1('🍷 推荐酒单'), p(t('')),
  ];
  for (const w of d.wines) {
    blocks.push(h2(w.name));
    blocks.push(p(b('类型：'), t(w.type)));
    blocks.push(p(b('为什么选它：'), t(w.why)));
    blocks.push(p(b('参考价格：'), t(w.price)));
    blocks.push(p(t('')));
  }
  blocks.push(hr(), h1('🍽️ 菜酒搭配'), p(t('')));
  for (const m of d.menu) {
    blocks.push(li(b(m.dish), t(' → '), t(m.wine)));
  }
  blocks.push(p(t('')), hr(), h1('🛒 购买建议'), p(t('')), p(t(d.buyTips)));
  blocks.push(p(t('')), hr(), h1('🎉 礼仪小贴士'), p(t('')), p(t(d.etiquette)));
  blocks.push(p(t('')), hr(), p(t('')));
  blocks.push(quote(b('节日专题'), t(`\n愿美酒与佳节相伴，每一杯都是好时光。\n\n—— 节日专题 · 第 ${d.num} 期 📅`)));
  return blocks;
}

const SEASONS: SeasonalData[] = [
  {
    num: 2, title: '第 2 期：情人节浪漫用酒', subtitle: '二月十四，一杯好酒胜过千言万语',
    imgUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80',
    intro: '情人节的酒不需要最贵，需要的是能营造氛围、让两个人都愉快的那一款。起泡酒的欢快气泡、桃红的浪漫粉色、精致红酒的深沉复杂——每种都有其适合的情人节场景。',
    wines: [
      { name: '普罗旺斯桃红', type: '桃红葡萄酒', why: '粉红色天然浪漫，清爽果香两个人都容易喜欢，价格也不贵，是情人节家庭晚餐的首选。', price: '¥100-180/瓶' },
      { name: '香槟 / Crémant 起泡酒', type: '起泡酒', why: '开香槟的仪式感让情人节有了专属感。真香槟价格较高，Crémant 是完美平替，150元以内也能喝到很好的起泡酒。', price: '¥100-400/瓶' },
      { name: '勃艮第黑皮诺（新西兰平替）', type: '红葡萄酒', why: '丝滑单宁和草莓红果香，优雅而不厚重，适合烛光晚餐的轻松氛围，不会让人昏昏欲睡。', price: '¥150-300/瓶' },
      { name: '意大利 Moscato d\'Asti', type: '微甜起泡白', why: '低酒精（约5.5%）、微甜带气泡，像白桃苏打水，对不太喝酒的另一半特别友好。', price: '¥80-150/瓶' },
    ],
    menu: [
      { dish: '生蚝/海鲜拼盘', wine: '香槟或夏布利白葡萄酒' },
      { dish: '牛排', wine: '勃艮第村庄级黑皮诺或优质博若莱' },
      { dish: '意大利面（奶油/番茄系）', wine: '普罗旺斯桃红或意大利灰皮诺' },
      { dish: '甜点 / 草莓蛋糕', wine: 'Moscato d\'Asti 微甜起泡酒' },
    ],
    buyTips: '情人节前一周备酒，避免临时缺货。普罗旺斯桃红在天猫/京东搜索"AIX桃红"或"Miraval桃红"有正品保证。香槟推荐LVMH旗下的 Moët 或 Veuve Clicquot，价格透明不易被坑。',
    etiquette: '家里开酒：提前1小时冰镇白酒和桃红（8-10℃），红酒提前30分钟从冰箱取出回温到16℃。开香槟时用布包住瓶口，轻轻旋转瓶身而非木塞，让气压自然推出，"噗"一声优雅又安全。',
  },
  {
    num: 3, title: '第 3 期：春节团圆饭配酒', subtitle: '年夜饭上的那杯酒，要让全家人都满意',
    imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    intro: '春节年夜饭是中国最重要的饮食场合，既要有仪式感，又要适合老中青各年龄段，还要和各种中国菜搭配。这不是最容易的选酒场景，但以下方案经过验证，全家基本都满意。',
    wines: [
      { name: '国产高端起泡酒 / Prosecco', type: '起泡酒', why: '开席前端出来，气泡和喜庆感完美配合，老人和孩子也可以喝一小口，不会醉。国产起泡酒（如夏桐）本土化做得不错。', price: '¥100-200/瓶' },
      { name: '梅洛或赤霞珠混酿（波尔多风格）', type: '红葡萄酒', why: '年夜饭少不了红烧肉、红烧鱼、卤味，波尔多风格的红酒单宁适中，果味浓郁，和这些菜非常搭，而且老一辈对"法国红酒"有天然好感。', price: '¥150-300/瓶' },
      { name: '德国或法国阿尔萨斯白酒（微甜）', type: '白葡萄酒', why: '清蒸鱼、白切鸡等清鲜菜肴的绝配。选微甜风格让不喜欢干型白酒的人也能接受。', price: '¥120-250/瓶' },
      { name: '黄酒 + 葡萄酒组合', type: '混搭', why: '春节完全可以中西结合：开席来起泡酒，吃饭配黄酒（跟大多数中国菜都搭），收尾来一杯甜酒。尊重长辈喝惯的口味，又有新体验。', price: '视选择而定' },
    ],
    menu: [
      { dish: '凉菜拼盘', wine: '起泡酒开场' },
      { dish: '清蒸鱼', wine: '阿尔萨斯雷司令或夏布利' },
      { dish: '红烧肉 / 卤味', wine: '梅洛为主的波尔多混酿' },
      { dish: '火锅（汤底收尾）', wine: '冰镇德国雷司令半干，甜度解辣' },
      { dish: '年糕/汤圆（甜点）', wine: '半瓶贵腐甜白或晚收型雷司令' },
    ],
    buyTips: '春节前2周备酒，以免年前断货。买2-3瓶不同类型：一瓶起泡（开场用）、一两瓶红酒（主菜）、一瓶白酒（配鱼虾）。总预算300-600元可以覆盖6-8人桌。',
    etiquette: '给长辈敬酒时，葡萄酒杯比白酒杯更显格调，但不要强迫不喝酒的人喝。给老人倒酒七分满就好，保留随时添加的仪式。主人先举杯，说完祝酒词后大家同饮，这比什么年份产区都重要。',
  },
  {
    num: 4, title: '第 4 期：端午节配酒', subtitle: '粽子和葡萄酒，意外的美妙组合',
    imgUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
    intro: '端午喝粽子配葡萄酒？听起来违和，但实际上非常好搭。甜粽配甜白、咸粽配果味红酒、五花肉粽配勃艮第——我们把端午这天最常吃的食物逐一配对，结果让人惊喜。',
    wines: [
      { name: '德国 Kabinett 或 Spätlese 雷司令', type: '白葡萄酒（微甜）', why: '豆沙粽、蜜枣粽这类甜粽，配德国雷司令的微甜和高酸，甜而不腻，喝完一口还想再来一口粽子。', price: '¥80-200/瓶' },
      { name: '博若莱村庄级（微凉饮用）', type: '红葡萄酒', why: '五花肉粽、鲜肉粽油脂丰富，博若莱的轻盈红果酸度解腻，冰凉后喝更爽。', price: '¥100-180/瓶' },
      { name: '普罗旺斯桃红', type: '桃红', why: '端午户外活动多，桃红是野餐和聚会的全能选手，冰镇后和各种粽子都能搭，不踩雷。', price: '¥100-180/瓶' },
      { name: '雄黄酒（传统）', type: '中国传统', why: '传统上端午喝雄黄酒辟邪，现代意义上是一种文化仪式感。可以少量配合葡萄酒一起，东西方结合体验一下。', price: '传统自酿或特色酒' },
    ],
    menu: [
      { dish: '甜粽（豆沙/蜜枣）', wine: '德国Kabinett雷司令' },
      { dish: '咸肉粽（五花肉）', wine: '博若莱新酒冰镇饮用' },
      { dish: '蛋黄肉粽', wine: '普罗旺斯桃红或意大利白' },
      { dish: '碱水粽（原味蘸糖）', wine: '香槟或Prosecco起泡酒' },
    ],
    buyTips: '端午时节天气渐热，所有酒冰镇后喝效果更好，包括清淡的红酒。提前冰箱冷藏1-2小时。桃红和白酒8-10℃喝，博若莱12-14℃喝（比普通红酒低一点）。',
    etiquette: '端午是家庭节日，不用刻意搞品酒仪式，放松享受就好。如果家里有孩子，可以开一瓶气泡水配成"假香槟"让孩子参与举杯的仪式感，他们会很开心。',
  },
  {
    num: 5, title: '第 5 期：中秋赏月配酒', subtitle: '月饼、茶、还是葡萄酒？今年试试新组合',
    imgUrl: 'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=800&q=80',
    intro: '中秋月饼甜、咸、油脂丰富，传统配茶是有原因的——茶能解腻提神。葡萄酒能做到同样的事，高酸、轻盈、微甜的类型反而比大多数人想象中更搭月饼。',
    wines: [
      { name: '贵腐甜白（苏玳入门款）', type: '甜白葡萄酒', why: '甜月饼（莲蓉、红豆沙）用甜对甜，贵腐的蜂蜜橙皮香气和月饼甜香融为一体。苏玳入门款约150-300元，值得试试。', price: '¥150-350/375ml' },
      { name: '香槟/起泡酒', type: '起泡酒', why: '月饼油腻，气泡最擅长解腻。一口月饼一口香槟，比单纯喝茶更有层次感，适合年轻家庭的中秋聚会。', price: '¥100-400/瓶' },
      { name: '阿尔萨斯琼瑶浆（微甜）', type: '白葡萄酒', why: '荔枝玫瑰的浓郁香气，和五仁月饼、果仁月饼出人意料地搭。芳香型白酒是月饼的隐藏好搭档。', price: '¥120-250/瓶' },
      { name: '澳大利亚加强版橙酒（Rutherglen Muscat）', type: '加强甜酒', why: '葡萄干、太妃糖、咖啡的复杂甜香，配豆沙类传统口味月饼堪称绝配。小杯慢饮，一瓶可以喝很久。', price: '¥150-250/500ml' },
    ],
    menu: [
      { dish: '莲蓉蛋黄月饼', wine: '苏玳贵腐甜白' },
      { dish: '五仁月饼', wine: '阿尔萨斯琼瑶浆' },
      { dish: '冰皮月饼（现代款）', wine: '香槟或Moscato气泡酒' },
      { dish: '广式叉烧酥', wine: '普罗旺斯桃红' },
    ],
    buyTips: '中秋节前一周是买月饼的高峰，葡萄酒可以同步下单。推荐在天猫LVMH官方旗舰店或1919酒类直供买正品。甜白和加强酒开瓶后可以保存较久（1-2周），一家人慢慢喝完。',
    etiquette: '中秋赏月是放松时刻，随意就好。酒杯不用太讲究，大号水杯也行。传递月饼时可以顺便帮大家倒酒，这比任何侍酒词都更有人情味。',
  },
  {
    num: 6, title: '第 6 期：夏日清凉白酒指南', subtitle: '35℃的天气，什么酒最解暑？',
    imgUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    intro: '夏天喝酒的核心诉求：解渴、解暑、清爽。红酒的单宁在热天显得粗糙，这个季节是白葡萄酒、桃红和起泡酒的主场。以下是按使用场景分类的夏季酒单。',
    wines: [
      { name: '新西兰马尔堡长相思', type: '白葡萄酒', why: '热带水果+青草的清爽香气，超高酸度配合冰镇后极其解暑。云雾之湾是入门标杆，200元以内的其他马尔堡品牌性价比也很高。', price: '¥80-200/瓶' },
      { name: '德国摩泽尔雷司令 QbA', type: '白葡萄酒（微甜）', why: '低酒精（8-9%）、高酸、微甜，喝起来像高级柠檬水，完全没有喝酒的负担感。夏天午后的最佳选择。', price: '¥80-150/瓶' },
      { name: '普罗旺斯桃红', type: '桃红', why: '夏天最万能的酒，冰镇后颜色好看口感清爽，配烧烤、沙拉、海鲜都很自然。法国南部人夏天最爱。', price: '¥100-200/瓶' },
      { name: 'Aperol Spritz 组合', type: '鸡尾酒/起泡', why: 'Aperol（意大利开胃苦酒）+Prosecco+苏打水+冰块+橙片，颜色鲜橙，低酒精，苦甜清爽，是欧洲夏日最流行的饮品，近年在中国也很火。', price: 'Aperol约¥100 + Prosecco约¥80' },
    ],
    menu: [
      { dish: '生蚝 / 冰镇海鲜', wine: '夏布利或马尔堡长相思' },
      { dish: '烤玉米 / 烧烤时蔬', wine: '普罗旺斯桃红或Aperol Spritz' },
      { dish: '沙拉/三明治', wine: '雷司令或轻盈灰皮诺' },
      { dish: '冷面/凉皮', wine: '冰镇德国雷司令半干' },
    ],
    buyTips: '夏天白酒消耗量大，可以考虑箱购（6瓶）。推荐"量贩"选择：①西班牙Verdejo 6瓶装约500元 ②意大利Pinot Grigio 6瓶约480元。储存时避开太阳直射，空调房最好。',
    etiquette: '夏日户外聚会，不用坚持红酒大杯。折叠椅+冰桶+白酒，随时随地都是好场合。提醒大家多喝水——酒精在热天脱水更快，建议喝一杯酒配一杯水。',
  },
  {
    num: 7, title: '第 7 期：秋季配酒——丰收的味道', subtitle: '秋天的美食最多，秋天的酒也最丰富',
    imgUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
    intro: '秋天是葡萄成熟的季节，也是最适合饮酒的时节。气温转凉，可以开始喝红酒了；秋季食材（螃蟹、大闸蟹、蘑菇、松露、野味）和葡萄酒的搭配格外精彩。',
    wines: [
      { name: '勃艮第村庄级白酒（霞多丽）', type: '白葡萄酒', why: '秋蟹季必备！大闸蟹配霞多丽是中国葡萄酒文化的新经典。白酒的酸度和矿物感与蟹肉的鲜甜完美共鸣。', price: '¥200-400/瓶' },
      { name: '意大利Barbera d\'Asti', type: '红葡萄酒', why: '秋季的蘑菇意面、松露烩饭、野味需要有泥土感的红酒。Barbera酸度高、果味浓，正是意大利秋季餐桌的主角。', price: '¥100-200/瓶' },
      { name: '勃艮第黑皮诺（秋季品鉴）', type: '红葡萄酒', why: '秋天天气转凉，是品鉴细腻红酒的最佳时机。秋季的菌菇、野味食材和黑皮诺的泥土感天生一对。', price: '¥200-600/瓶' },
      { name: '橙酒（Amber Wine）', type: '橙酒', why: '用白葡萄带皮发酵，颜色橙黄，单宁感强于普通白酒。秋季的烤蔬菜、豆腐、发酵食物配橙酒意外地好。', price: '¥150-350/瓶' },
    ],
    menu: [
      { dish: '大闸蟹', wine: '勃艮第白酒（Mâcon或更高级别）' },
      { dish: '蘑菇意面 / 松露', wine: 'Barbera或博若莱村庄级' },
      { dish: '红烧羊肉', wine: '西班牙里奥哈Reserva或朗格多克红酒' },
      { dish: '烤南瓜 / 秋季蔬菜', wine: '阿尔萨斯灰皮诺或橙酒' },
    ],
    buyTips: '秋天是品酒旺季，进口酒商经常有秋季品鉴活动，报名参加是同等费用下提升知识的最好机会。大闸蟹季节（9-11月）要提前在酒商预定勃艮第白酒，这段时间特别热销。',
    etiquette: '秋季室温适中，白酒从冰箱取出15分钟后喝（约10-12℃），红酒室温直接开喝（15-18℃）。大闸蟹宴的开场最好用起泡酒，清爽开胃，之后转入白酒或轻盈红酒。',
  },
  {
    num: 8, title: '第 8 期：圣诞节派对用酒', subtitle: '全年最需要起泡酒的时刻',
    imgUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80',
    intro: '圣诞节是西方最大的节日，在中国也成了聚会和庆祝的理由。圣诞派对的核心：够多（人多需要大量）、够有仪式感（开香槟必须有）、够适合各种人（从不喝酒的到老饕）。',
    wines: [
      { name: '香槟 NV（非年份款）', type: '起泡酒', why: '圣诞派对的灵魂。Moët白星、Veuve Clicquot黄标在国内容易买到，价格相对透明，开瓶瞬间把气氛拉满。', price: '¥250-500/瓶' },
      { name: 'Crémant d\'Alsace', type: '起泡酒', why: '香槟的最佳平替，传统法酿造，细腻气泡，价格便宜一半。阿尔萨斯Crémant通常有迷人的花香，适合大量购入派对用。', price: '¥100-180/瓶' },
      { name: '热红酒（Mulled Wine）材料包', type: '加热红酒', why: '圣诞节的标志性饮品。用普通红酒加香料（肉桂、丁香、橙皮）加热，暖胃暖心，冬日派对必备。提前做好一大锅，随时舀。', price: '底酒约¥50-80/瓶 + 香料' },
      { name: '意大利Dolcetto或博若莱新酒', type: '轻盈红酒', why: '圣诞聚餐的食物通常丰盛油腻，轻盈红酒比厚重赤霞珠更适合持续喝而不会太醉。Dolcetto的樱桃果味和圣诞氛围很搭。', price: '¥80-150/瓶' },
    ],
    menu: [
      { dish: '熏三文鱼前菜', wine: '香槟或夏布利' },
      { dish: '烤火鸡 / 烤鸡', wine: '轻盈霞多丽或博若莱村庄级' },
      { dish: '圣诞布丁 / 姜饼', wine: '波特酒或苏玳甜白' },
      { dish: '奶酪拼盘', wine: '红酒（软质奶酪）或波特酒（蓝纹奶酪）' },
    ],
    buyTips: '圣诞聚会按人头算：①起泡酒1瓶/3-4人（用于开场） ②红/白酒1瓶/2人（配餐用） ③甜酒/加强酒1瓶/8-10人（配甜点）。提前1周到电商平台采购，圣诞前2天可能缺货。',
    etiquette: '派对开场：主人倒香槟举杯，说一句"Cheers，圣诞快乐"，这比任何祝酒词都够用。派对进行中不用管什么温度杯型，有酒有人有笑声就是完美的圣诞。',
  },
  {
    num: 9, title: '第 9 期：冬季暖心热红酒', subtitle: '一锅热红酒，整个冬天都温暖了',
    imgUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80',
    intro: '热红酒（Mulled Wine）起源于欧洲中世纪，用红酒加香料煮热驱寒。如今它已是北欧圣诞市集的标志，也是中国冬日家庭聚会越来越流行的饮品。好消息：做法极其简单。',
    wines: [
      { name: '热红酒底酒（果味浓郁的红酒）', type: '制作材料', why: '选果味浓郁的廉价红酒：澳大利亚西拉、西班牙加尔纳恰、智利赤霞珠都行。不需要贵的，煮了之后细节都消失了，果味浓才是关键。', price: '¥30-60/瓶' },
      { name: 'Glühwein 德国热葡萄酒（成品）', type: '即饮款', why: '超市或天猫可以直接买到德国成品热葡萄酒，加热就喝，方便。适合第一次尝试或懒得自己调的场合。', price: '¥60-100/瓶' },
      { name: '热白酒版（Glühwein Weiß）', type: '热白葡萄酒', why: '较少人知道的版本，用白葡萄酒+接骨木花糖浆+柠檬皮+肉桂做成，口感比红色版更清爽，喜欢白酒的人一定要试试。', price: '底酒约¥40-80/瓶' },
      { name: '苹果西打热饮（无醇版）', type: '无酒精', why: '苹果汁+肉桂+丁香+橙皮加热，口感和热红酒相似但无酒精，适合不喝酒的家人参与。', price: '苹果汁约¥20-30' },
    ],
    menu: [
      { dish: '烤红薯 / 糖炒栗子', wine: '热红酒（传统款）' },
      { dish: '火锅（鸳鸯锅）', wine: '冰镇德国雷司令（冷热对比很爽）' },
      { dish: '炖羊肉 / 羊蝎子', wine: '热红酒或浓郁西拉' },
      { dish: '姜饼/香料饼干', wine: '热白葡萄酒' },
    ],
    buyTips: '自制热红酒配方（4人份）：红酒750ml + 肉桂棒2根 + 丁香5-8粒 + 八角1个 + 橙子1个切片 + 冰糖/蜂蜜2-3勺。小火加热至70℃（不要沸腾），15分钟后过滤倒入杯中，撒橙皮。',
    etiquette: '热红酒最好用带把手的马克杯或耐热玻璃杯，避免烫手。聚会上架一锅热红酒在桌边，让大家自己动手舀，比服务员来倒更有温度和参与感。',
  },
  {
    num: 10, title: '第 10 期：户外野餐配酒', subtitle: '好天气、好风景、好酒，一个都不能少',
    imgUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
    intro: '野餐用酒有其特殊的要求：① 携带方便 ② 不需要精确控温 ③ 在户外阳光下看起来好看 ④ 任何食物都能搭。以下是专门为野餐场景优化的选酒指南。',
    wines: [
      { name: '普罗旺斯桃红（细腰瓶）', type: '桃红', why: '野餐颜值担当，粉色酒液装在透明瓶里，阳光一照就是画面。而且搭配什么野餐食物都不会出错，冰块桶镇着随时可喝。', price: '¥100-200/瓶' },
      { name: '意大利Prosecco或Frizzante', type: '轻盈起泡', why: '气泡在户外特别解暑，Frizzante（微泡款）比Spumante（全泡款）气泡少一点，户外倒酒时不会溢出来，更实用。', price: '¥80-150/瓶' },
      { name: '螺旋盖白葡萄酒', type: '白葡萄酒', why: '野餐没带开瓶器时的救星。新西兰、澳大利亚很多好酒用螺旋盖，反而是高品质的体现，不是廉价货的标志。', price: '¥80-180/瓶' },
      { name: '三升袋装葡萄酒（Box Wine）', type: '大容量', why: '人多的野餐，袋装酒最实用——轻便、不怕摔、有氧化保护囊。西班牙和智利有质量不错的袋装酒，折算下来约15元/杯，性价比极高。', price: '¥80-150/3升' },
    ],
    menu: [
      { dish: '法棍面包 + 奶酪', wine: '普罗旺斯桃红或轻盈白酒' },
      { dish: '冷切肉（火腿、烤鸡）', wine: 'Prosecco或口感轻盈的红酒' },
      { dish: '水果沙拉', wine: 'Moscato甜型起泡酒' },
      { dish: '寿司/三明治', wine: '螺旋盖长相思' },
    ],
    buyTips: '野餐装备：①便携冰桶或冰袋（白酒桃红必须保持凉） ②塑料或硅胶酒杯（碎了不危险）③螺旋盖酒（省去开瓶器）④小号冰块袋。提前1天冷藏白酒和桃红，出发时连冰桶一起装上。',
    etiquette: '户外喝酒更随意，不用讲究礼仪。但要注意：①不要把酒瓶/酒杯放在草地上让别人绊倒 ②离开时带走所有垃圾（包括瓶子和瓶盖）③公共公园如有禁酒规定请遵守。',
  },
  {
    num: 11, title: '第 11 期：生日庆祝选酒', subtitle: '给最重要的人选一瓶有纪念意义的酒',
    imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    intro: '生日是全年最值得用好酒的时刻之一。选生日酒的逻辑和选普通礼物不同——要考虑纪念意义、对方偏好，以及那个"记得这个生日"的特殊感。',
    wines: [
      { name: '出生年份的酒', type: '各类型', why: '最有意义的生日礼物：找一瓶对方出生年份的酒。勃艮第老年份、波特酒、雪莉酒都能找到20-30年前的年份。网络搜索"vintage wine [年份]"或联系专业酒商。', price: '视年份和产区，¥200-2000+' },
      { name: '香槟（带祝语刻字服务）', type: '起泡酒', why: '很多香槟品牌提供个性化刻字服务，在瓶身刻上生日祝语，开瓶前就是专属礼物。', price: '¥300-600/瓶+刻字费' },
      { name: '当年首推酒款（当年Best Buys）', type: '各类', why: '找对方生日当年的年份，看看酒评家给哪个产区打了高分，买一瓶"见证同一年"的酒。', price: '视选择' },
      { name: '对方最喜欢品种/产区的好酒', type: '个性化', why: '如果知道对方喜欢勃艮第，就买比平时贵一档的勃艮第；喜欢起泡酒，就买一瓶真香槟。品质升级比换新类型更安全。', price: '视选择' },
    ],
    menu: [
      { dish: '生日蛋糕（甜）', wine: 'Moscato d\'Asti或Demi-Sec香槟' },
      { dish: '生日大餐（牛排）', wine: '主人公最爱的红酒' },
      { dish: '生日聚餐（中餐）', wine: '起泡酒开场 + 清爽白/红酒配餐' },
      { dish: '甜点拼盘', wine: '半瓶苏玳或晚收型雷司令' },
    ],
    buyTips: '找出生年份酒的方法：①联系专业葡萄酒进口商说明需求 ②在酒仙网、1919搜索具体年份 ③波特酒（特别是年份波特Vintage Port）是找老年份最容易的类型，可以保存50年以上。',
    etiquette: '生日开酒时让寿星先闻先尝，这是专属于他/她的时刻。拍一张酒标和蛋糕的合影留念。如果是特别重要的年份酒，开瓶前可以讲讲这瓶酒的故事，让礼物有了更深的意义。',
  },
  {
    num: 12, title: '第 12 期：商务宴请用酒', subtitle: '公司请客，点酒这件事关系到你的职业形象',
    imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    intro: '商务宴请的选酒原则和个人喝酒完全不同：安全感>探索感，稳妥>惊喜，易于谈话>需要专注品鉴。选错酒不会破坏一顿商务饭，但选对酒能为你的专业形象加分。',
    wines: [
      { name: '波尔多列级庄入门或中级庄', type: '红葡萄酒', why: '"法国红酒"在商务场合是最安全的信号。波尔多的列级庄名字对方可能听过，即使不了解葡萄酒的人也能感受到正式感。选二三四五级酒庄的入门款约400-800元，既体面又不夸张。', price: '¥300-800/瓶' },
      { name: '年份香槟（开场用）', type: '起泡酒', why: '重要谈判或签约前开一瓶年份香槟，仪式感十足，无论对方懂不懂葡萄酒都能感受到重视。', price: '¥400-800/瓶' },
      { name: '阿尔萨斯白酒或勃艮第白', type: '白葡萄酒', why: '中餐商务宴中，如果有海鲜类菜肴较多，法国白酒是比红酒更好的选择，体现懂酒，也更配菜。', price: '¥200-500/瓶' },
      { name: '国产高端酒（张裕解百纳特级精选）', type: '国产红酒', why: '如果对方是国内客户或传统行业，国产优质红酒有时比进口酒更拉近距离，避免"炫耀"感。', price: '¥150-300/瓶' },
    ],
    menu: [
      { dish: '冷菜 / 前菜', wine: '香槟或年份白葡萄酒' },
      { dish: '海鲜主菜', wine: '勃艮第白或阿尔萨斯雷司令' },
      { dish: '红肉主菜', wine: '波尔多红酒（主角）' },
      { dish: '点心 / 甜点', wine: '贵腐甜白（小酒杯）' },
    ],
    buyTips: '商务用酒最好在信誉好的实体酒商或官方旗舰店购买，保留购买凭证。点餐前可以把酒单拍照用手机搜索市场价，防止餐厅定价过高。如果不确定，直接请侍酒师说明预算让他推荐，体现尊重也体现懂行。',
    etiquette: '商务饭局选酒礼仪：① 让对方先尝，而非主人先喝 ② 替对方倒酒时倒三分之一杯就够，随时可以补 ③ 不要强迫不喝酒的人 ④ 结束时说"今天的酒不错"是最好的收尾，不需要深入品评。',
  },
  {
    num: 13, title: '第 13 期：婚礼用酒指南', subtitle: '人生最重要的宴席，酒怎么选',
    imgUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
    intro: '婚宴用酒面临的挑战：宾客年龄和口味差异大，数量通常不少，预算有限制，而且白酒往往还是主角。如何在白酒主导的婚宴上合理加入葡萄酒，让喜欢葡萄酒的宾客也满意，是一道实际问题。',
    wines: [
      { name: '起泡酒（Prosecco，箱购）', type: '起泡酒', why: '婚礼开场用起泡酒举杯敬祝福，仪式感和幸福感爆棚，价格也合理。10桌婚宴大概需要3-5箱（30-50瓶）Prosecco作为开场用。', price: '¥70-120/瓶，箱购可优惠' },
      { name: '进口干红（波尔多风格大品牌）', type: '红葡萄酒', why: '婚宴中提供葡萄酒选择的必选。选大品牌（奔富、蒙特斯）或清晰产区的酒（如卡斯特雷普或类似），宾客辨识度高，不会踩雷。', price: '¥80-150/瓶，婚宴批量采购有折扣' },
      { name: '女方桌专属桃红', type: '桃红', why: '女性来宾通常更喜欢桃红的色泽和清爽口感。为新娘桌或部分女性较多的桌准备一两瓶桃红，体现细心。', price: '¥100-180/瓶' },
      { name: '非年份香槟（新人举杯专用）', type: '起泡酒', why: '婚礼蛋糕切蛋糕、新人对饮时专用一瓶真香槟，拍照好看，仪式感无可替代，哪怕其他桌都是Prosecco。', price: '¥250-400/瓶，1-2瓶够' },
    ],
    menu: [
      { dish: '婚宴冷盘', wine: '起泡酒（Prosecco开场）' },
      { dish: '白灼虾 / 蒸鱼', wine: '干白葡萄酒（少量提供）' },
      { dish: '红烧肉 / 红烧鸡', wine: '进口干红' },
      { dish: '婚礼蛋糕', wine: '新人专属香槟' },
    ],
    buyTips: '婚宴采购建议：① 提前2-3个月联系进口商谈批量折扣，通常20箱以上有5-10%折扣 ② 按"白酒为主、葡萄酒为辅"规划，约30%的桌提供葡萄酒选项就够 ③ 备多少：平均每桌1.5瓶，10桌需约15瓶 ④ 多备10-20%防止不够。',
    etiquette: '婚宴上服务员倒酒时，不用每桌都精确控温。普通温度（18-22℃）喝红酒，冰桶里的白酒和起泡酒冷了就拿出来，不用过于讲究。新人最重要的任务是享受这一天，葡萄酒只是增色的工具。',
  },
  {
    num: 14, title: '第 14 期：跨年倒计时用酒', subtitle: '12点钟声响起时，你手里应该拿什么',
    imgUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80',
    intro: '跨年是全年除了婚礼/重要纪念日之外，最适合打开香槟的时刻。全世界的人都在这一刻举杯，你选什么酒陪自己迎接新年？',
    wines: [
      { name: '香槟（Moët/Veuve/Billecart-Salmon）', type: '起泡酒', why: '跨年的标配。Moët白星价格相对透明，容易买到正品；Veuve Clicquot黄标有辨识度；Billecart-Salmon Rose是懂酒人的选择。', price: '¥250-600/瓶' },
      { name: 'Crémant d\'Alsace Rose（桃红起泡）', type: '粉色起泡', why: '倒计时时拍出来颜色好看，价格150元左右，性价比远超大多数香槟，口感同样细腻。', price: '¥120-180/瓶' },
      { name: '当年最后一瓶收藏好酒', type: '任何类型', why: '用一瓶你今年最喜欢的酒跨年，是对这一年最好的告别。不用贵，是你喜欢的就好。', price: '视选择' },
      { name: '限量版新年特别款', type: '各品牌特别款', why: '很多品牌会推出新年限量装，附赠礼盒、礼品袋，颜值高。Dom Pérignon等品牌每年都有艺术家联名款，收藏价值高。', price: '¥300-1000+' },
    ],
    menu: [
      { dish: '跨年小食（薯片/饼干）', wine: '香槟，气泡提升一切零食的体验' },
      { dish: '跨年大餐（任何菜系）', wine: '年中最喜欢的那瓶酒' },
      { dish: '倒计时举杯', wine: '香槟或Crémant，非它不可' },
      { dish: '新年零点后', wine: '随意，喝高兴就好' },
    ],
    buyTips: '跨年香槟最好在12月上旬购买，跨年前一周很多经典款会断货或涨价。网上购买注意商家资质，非旗舰店的香槟假货率较高，建议在品牌官方旗舰店或知名酒商购买。',
    etiquette: '12点举杯时：① 提前5分钟开香槟，别等到倒计时结束才开（手忙脚乱）② 每个人杯中都要有一口酒，包括不喝酒的——用果汁或气泡水代替 ③ "新年快乐"四个字比任何祝酒词都有力量。',
  },
  {
    num: 15, title: '第 15 期：母亲节父亲节礼物酒', subtitle: '送给父母的那瓶酒，怎么选才有心意',
    imgUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80',
    intro: '给父母送酒要考虑两个维度：他们的口味（很多长辈不喝葡萄酒）和你们一起喝的可能性（最好的酒是两代人共享的那瓶）。',
    wines: [
      { name: '中低酒精起泡酒（给妈妈）', type: '起泡/微甜', why: '母亲节：妈妈不一定喝干红，但起泡酒或微甜白酒通常接受度高。推荐Moscato（低酒精微甜）或普罗旺斯桃红（颜值高）。配一束花，比单纯送酒更有心意。', price: '¥80-200/瓶' },
      { name: '优质中国白酒（给爸爸）', type: '中国白酒', why: '父亲节：很多爸爸喝惯了白酒，送一瓶他平时舍不得买的好白酒（如茅台飞天、五粮液精品），比送葡萄酒更贴心。', price: '¥300-1500' },
      { name: '波尔多优质红酒（懂酒的父母）', type: '红葡萄酒', why: '如果父母喝葡萄酒，升一档的波尔多是最稳妥的礼物。送一支品质好的中级庄（Cru Bourgeois），配一张手写卡，胜过一千块钱的保健品。', price: '¥200-500/瓶' },
      { name: '"让我们一起喝"——带一瓶回家', type: '行动礼物', why: '最好的礼物是亲自回家，带一瓶酒陪父母吃一顿饭。选一款他们以前没喝过的，你来讲解，让父母感受到你的成长和心意。', price: '任意预算' },
    ],
    menu: [
      { dish: '母亲节家常菜（清淡）', wine: '阿尔萨斯白酒或桃红' },
      { dish: '父亲节红烧肉', wine: '中等酒体红酒或他喜欢的白酒' },
      { dish: '两代人的庆祝饭', wine: '起泡酒开场，各自喜好配餐' },
      { dish: '甜点/蛋糕', wine: 'Moscato或贵腐甜白小杯' },
    ],
    buyTips: '母亲节/父亲节时节（5月/6月）天气转热，注意运输过程中酒的温度。网购优先选择有冷链服务的酒商。礼盒包装一定要选——给父母的礼物，外在用心和内在同样重要。',
    etiquette: '和父母喝酒时，不要刻意显摆葡萄酒知识，聊聊这瓶酒是哪里的就好。最重要的是坐在一起喝这件事本身，而不是喝什么。',
  },
  {
    num: 16, title: '第 16 期：国庆长假户外配酒', subtitle: '七天假期，从城市到郊外，每一天都有合适的酒',
    imgUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
    intro: '国庆十月，天高气爽，是全年户外活动最密集的时段。根据不同活动场景——露营、爬山、城市打卡、家庭聚会——我们分别推荐合适的酒。',
    wines: [
      { name: '螺旋盖长相思（露营必备）', type: '白葡萄酒', why: '露营不带开瓶器怎么办？螺旋盖解决问题。新西兰马尔堡长相思清爽好喝，螺旋盖方便携带，哪怕被包压扁了拿出来还能喝。', price: '¥80-150/瓶' },
      { name: '袋装三升红酒（大型营地聚会）', type: '大容量', why: '十几个人的露营，袋装酒最实用。西班牙或智利的3升箱装红酒，折算15-20元/杯，够喝一晚，带起来比一箱散瓶轻多了。', price: '¥80-150/3升' },
      { name: '桃红（城市打卡/高颜值场景）', type: '桃红', why: '国庆城市打卡，在网红咖啡馆或观景台拍照，一杯粉色桃红颜值爆棚。随时可以装进有盖保温杯带着走。', price: '¥100-200/瓶' },
      { name: '精选单支好酒（家庭聚会收尾）', type: '任意类型', why: '长假最后一天，买一瓶平时舍不得喝的好酒，一家人坐下来慢慢喝，给假期画上好的句号。', price: '¥200-500/瓶' },
    ],
    menu: [
      { dish: '烧烤（营地）', wine: '马尔贝克或西拉，果味浓郁配炭火' },
      { dish: '方便面/军粮（爬山收尾）', wine: '热红酒或袋装红酒，暖胃' },
      { dish: '城市餐厅', wine: '随菜选酒，普通规则' },
      { dish: '家庭聚餐（长假末）', wine: '那一瓶珍藏的好酒' },
    ],
    buyTips: '国庆假期前提前备酒：① 露营用螺旋盖或袋装酒 ② 家庭聚会用1-2箱普通餐酒 ③ 特别场合用1-2瓶好酒。10月正值各大酒商的秋季大促，经常有买赠活动，是一年中最好的囤酒时机。',
    etiquette: '户外喝酒注意：① 爬山/骑行中不喝酒，到目的地安顿好再喝 ② 露营开车回城前确认完全清醒（通常需要6-8小时才能完全代谢） ③ 户外饮酒多喝水，防止脱水。',
  },
  {
    num: 17, title: '第 17 期：秋冬进阶红酒季', subtitle: '天气越冷，越适合喝浓郁的红酒',
    imgUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
    intro: '秋冬是红酒最舒适的季节。气温低于18℃时，厚重红酒的单宁感更顺滑，果味更饱满。这一期我们推荐几款秋冬专属的进阶红酒，以及如何把它们喝出最佳状态。',
    wines: [
      { name: '意大利巴罗洛（Barolo）入门款', type: '红葡萄酒', why: '"葡萄酒之王"——内比奥罗酿成，单宁强劲，需要时间软化。入门款（约300-500元）在秋冬配红肉炖菜，是全年最惊艳的组合之一。提前1小时开瓶醒酒。', price: '¥300-600/瓶' },
      { name: '罗讷河谷北部西拉（Crozes-Hermitage）', type: '红葡萄酒', why: '北罗讷西拉：黑胡椒+紫罗兰+熏肉，是比澳大利亚西拉更细腻的版本。秋冬配烤羊排、炖野猪，欧式的氛围感。', price: '¥200-400/瓶' },
      { name: '葡萄牙Douro Red（杜罗河红酒）', type: '红葡萄酒', why: '被低估的冬日红酒。Douro非加强版干红浓郁有力，价格比同品质法意酒便宜很多，深色水果+烟草+泥土感，配炖肉和腊味绝了。', price: '¥100-250/瓶' },
      { name: '波特酒（Tawny Port）', type: '加强酒', why: '冬日壁炉旁的完美伴侣。Tawny Port（棕色波特）有坚果焦糖太妃糖香，小杯慢饮，温度15℃左右，配坚果、巧克力或完全不配任何东西，都是享受。', price: '¥150-300/瓶' },
    ],
    menu: [
      { dish: '红酒炖牛肉', wine: '巴罗洛或Crozes-Hermitage' },
      { dish: '烤羊排', wine: '罗讷河谷红酒或里奥哈Reserva' },
      { dish: '猪肘/炖蹄膀', wine: '杜罗河红酒或朗格多克红酒' },
      { dish: '核桃/榛子/黑巧克力', wine: 'Tawny Port小杯' },
    ],
    buyTips: '巴罗洛是进阶爱好者的必经之路，建议选择La Morra或Barolo村的入门款（而非整个DOCG区域笼统标注的），品质更稳定。在天猫/京东上认准意大利直邮或知名进口商旗舰店购买。',
    etiquette: '秋冬喝厚重红酒最佳温度：巴罗洛17-19℃（比一般红酒稍高），波特酒16-18℃。先醒酒1小时，用大肚球形杯，慢慢喝，感受它随时间的变化——好酒一小时后往往比刚开瓶更好。',
  },
  {
    num: 18, title: '第 18 期：年会聚餐如何选酒', subtitle: '公司年会、尾牙、部门聚餐，不同预算的实用指南',
    imgUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
    intro: '每年12月至次年1月是年会季。公司年会用酒和个人选酒完全不同的逻辑：要考虑大多数人的接受度、预算限制、数量需求，以及"不出错"比"出彩"更重要。',
    wines: [
      { name: '奔富洛神山庄红酒（10人以下小团队）', type: '红葡萄酒', why: '澳大利亚奔富品牌国内辨识度高，价格透明（120-150元/瓶），果味浓郁易饮，适合大多数人口味，不容易踩雷。', price: '¥100-150/瓶' },
      { name: '智利蒙特斯Alpha（中型聚餐）', type: '红葡萄酒', why: '蒙特斯Alpha赤霞珠是国内最熟悉的进口红酒之一，价格约180-220元，大家认识这个牌子，自动增加质感。', price: '¥150-220/瓶' },
      { name: 'Prosecco起泡酒（开场必备）', type: '起泡酒', why: '年会开场举杯，Prosecco最合适：气氛好、价格不贵、可以当水喝。建议每桌1瓶起泡酒开场，然后换红酒配餐。', price: '¥80-120/瓶' },
      { name: '白酒+葡萄酒双轨制（大型年会）', type: '混搭策略', why: '大型年会（50人以上）建议白酒+葡萄酒并行提供，让不同喝法的人都有选择。白酒选中端品牌，葡萄酒选知名进口品牌。', price: '综合预算' },
    ],
    menu: [
      { dish: '冷盘/海鲜拼盘', wine: 'Prosecco起泡酒' },
      { dish: '热炒主菜', wine: '中等酒体红酒' },
      { dish: '大鱼大肉（年会硬菜）', wine: '波尔多风格浓郁红酒' },
      { dish: '甜点/水果', wine: '微甜起泡或小杯甜白' },
    ],
    buyTips: '年会批量采购技巧：① 提前一个月联系供应商谈量价 ② 进口酒可找1919酒类直供等B2B平台 ③ 按"每桌2-3瓶红酒+1瓶起泡"计算 ④ 多备20%应对意外消耗 ⑤ 要求供应商提供发票，公司报销更方便。',
    etiquette: '年会是放松庆祝的场合，不是品酒活动。侍酒礼仪简化到最低：开瓶→倒酒→举杯→祝大家新年快乐。领导先举杯，大家跟随，全场一起喝，这才是年会酒的精髓。',
  },
  {
    num: 19, title: '第 19 期：情侣纪念日专属酒单', subtitle: '第一次约会、一周年、五年、十年，每个里程碑都有专属的酒',
    imgUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    intro: '纪念日是一年中除了生日最值得花心思选酒的时刻。不同的纪念日阶段，关系的状态和庆祝方式不同，酒的选择也应该随之进化。',
    wines: [
      { name: '初次约会 → Prosecco或轻盈桃红', type: '起泡/桃红', why: '第一次正式约会：轻松、低压力、容易喝，不要选需要"认真品鉴"的酒。Prosecco或普罗旺斯桃红，让对话流畅，不让酒变成话题的障碍。', price: '¥80-150/瓶' },
      { name: '一周年 → 对方出生年份的酒', type: '有意义的酒', why: '一周年值得用心准备。找一瓶对方出生年份的红酒或波特酒，讲讲这年发生的事，结合你们认识的故事，这比贵酒更有记忆点。', price: '¥150-500/瓶' },
      { name: '五周年 → 顶级勃艮第/波尔多名庄', type: '升级红酒', why: '五年是重要里程碑，值得认真升级。开一瓶平时不会轻易打开的好酒，让这个纪念日有特殊的重量感。', price: '¥400-1000+/瓶' },
      { name: '十周年 → 十年陈年老酒', type: '陈年老酒', why: '恰好同年份的十年老酒（如2015年的波尔多中级庄，到2025年喝），和你们的感情一样，随着时间而更醇厚。寻找同年份老酒是浪漫的仪式。', price: '¥300-800/瓶' },
    ],
    menu: [
      { dish: '约会前菜/生蚝', wine: '香槟或夏布利' },
      { dish: '约会主菜/牛排', wine: '按纪念日等级选择红酒' },
      { dish: '甜点/提拉米苏', wine: 'Moscato或贵腐小杯' },
      { dish: '餐后（慵懒时刻）', wine: '波特酒或小酌威士忌' },
    ],
    buyTips: '找对应年份的酒：① 联系专业葡萄酒进口商告知需求年份 ② 波特酒（特别是LBV Late Bottled Vintage）是最容易找到特定年份的类型 ③ 提前2-3个月开始找，好年份的老酒库存有限。',
    etiquette: '纪念日喝酒的重点不在喝什么，在于为什么喝。开瓶前说一两句关于这瓶酒的故事，然后举杯说你想说的话——这个简单的仪式，会让这瓶酒永远留在你们的记忆里。',
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
        uploadAndPatch(token, objToken, firstImgBlockId, buf, `seasonal_${Date.now()}.jpg`);
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
  console.log('📅 节日专题 · 批量创建 #2-20\n');
  const tokenData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json'), 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) { console.error('Token 过期！'); return; }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  let created = 0;
  for (const s of SEASONS) {
    const blocks = seasonalToBlocks(s);
    const result = await createPage(token, PARENT_NODE, s.title, blocks, s.imgUrl);
    if (result) created++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\n\n✅ 节日专题 #2-20 完成！成功 ${created}/${SEASONS.length} 篇`);
}

main().catch(err => { console.error('错误:', err); process.exit(1); });
