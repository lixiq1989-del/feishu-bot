/**
 * 产区深度游 批量创建 #2-20
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_batch_region.ts
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
const PARENT_NODE = 'PbQgwm9gHiljlLkvsuKcNlibnqe'; // 产区深度游 series node

interface RegionData {
  num: number; title: string; subtitle: string;
  name: string; zhName: string; country: string; area: string; climate: string; grapes: string;
  terroir: string[]; history: string[];
  classification: string[];
  estates: {name: string; desc: string; price: string}[];
  wines: {name: string; desc: string}[];
  travel: string[];
  closing: string;
  imgUrl: string;
}

function regionToBlocks(r: RegionData): any[] {
  const blocks: any[] = [
    img(), p(t('')),
    quote(b(`产区深度游 · 第 ${r.num} 期`), t(`\n${r.subtitle}`)),
    p(t('')), hr(),
    h1('🏷️ 产区名片'), p(t('')),
    p(b('名称：'), t(r.name)), p(b('中文名：'), t(r.zhName)),
    p(b('国家：'), t(r.country)), p(b('面积：'), t(r.area)),
    p(b('气候：'), t(r.climate)), p(b('核心品种：'), t(r.grapes)),
    p(t('')), hr(),
    h1('🌍 风土密码'), p(t('')),
  ];
  for (const s of r.terroir) blocks.push(p(t(s)), p(t('')));
  blocks.push(hr(), h1('📜 历史脉络'), p(t('')));
  for (const h of r.history) blocks.push(li(t(h)));
  blocks.push(p(t('')), hr(), h1('🏅 分级/产区体系'), p(t('')));
  for (const c of r.classification) blocks.push(li(t(c)));
  blocks.push(p(t('')), hr(), h1('🏆 代表酒庄'), p(t('')));
  for (const e of r.estates) blocks.push(h2(e.name), p(t(e.desc)), p(b('参考价：'), t(e.price)), p(t('')));
  blocks.push(hr(), h1('🍷 必喝清单'), p(t('')));
  for (const w of r.wines) blocks.push(ol(b(w.name), t(` —— ${w.desc}`)));
  blocks.push(p(t('')), hr(), h1('✈️ 旅行攻略'), p(t('')));
  for (const tip of r.travel) blocks.push(li(t(tip)));
  blocks.push(p(t('')), hr(), p(t('')));
  blocks.push(quote(b('本期总结'), t(`\n${r.closing}\n\n—— 产区深度游 · 第 ${r.num} 期 🗺️`)));
  return blocks;
}

const REGIONS: RegionData[] = [
  {
    num: 2, title: '第 2 期：勃艮第 —— 黑皮诺的圣殿', subtitle: '一条金丘，一个品种，无数神话。全世界最贵的农田在这里。',
    name: 'Burgundy / Bourgogne', zhName: '勃艮第', country: '法国', area: '约 2.85 万公顷', climate: '大陆性气候，冬冷夏暖，春霜是主要风险', grapes: '红：黑皮诺 / 白：霞多丽',
    terroir: ['勃艮第的核心理念是「风土（Terroir）」至上——同一个品种，隔一条小路就能酿出完全不同的酒。', '金丘（Côte d\'Or）是勃艮第的精华所在：朝东或东南的斜坡，石灰岩和泥灰岩的复杂土壤，每一块田（climat）都被精确划分和命名。', '这里没有「品牌」的概念，只有「地块」的概念。一块 1.8 公顷的罗曼尼康帝（Romanée-Conti）地块，出产全世界最贵的葡萄酒。'],
    history: ['罗马时期开始种植', '中世纪修道院系统性划分地块，奠定今日格局', '大革命后庄园被拆分，形成今天的小农模式', '1936年法国 AOC 制度建立，勃艮第的分级被法律保护', '21世纪勃艮第价格飙升，部分特级园比波尔多一级庄更贵'],
    classification: ['大区级（Bourgogne）—— 最基础，¥100-250', '村庄级（Village）—— 标注村庄名如 Gevrey-Chambertin，¥250-600', '一级园（Premier Cru）—— 标注具体地块名，¥500-2000', '特级园（Grand Cru）—— 33块顶级地块，¥1000-100000+'],
    estates: [
      { name: 'Domaine de la Romanée-Conti (DRC)', desc: '勃艮第之王，全世界最贵的酒庄。每瓶数万起。', price: '¥20,000-200,000+' },
      { name: 'Domaine Leroy', desc: 'DRC的女庄主 Lalou Bize-Leroy 自立门户，品质直逼DRC。', price: '¥5,000-80,000' },
      { name: 'Domaine Armand Rousseau', desc: '热夫雷-尚贝坦最伟大的名庄。', price: '¥2,000-15,000' },
      { name: 'Joseph Drouhin', desc: '大酒商中的品质标杆，产品线广泛，入门款性价比高。', price: '大区级 ¥150-250' },
    ],
    wines: [
      { name: 'Bourgogne Pinot Noir', desc: '大区级入门，¥100-250，了解黑皮诺基本面' },
      { name: 'Gevrey-Chambertin Village', desc: '金丘最有名的村庄之一，¥300-600' },
      { name: 'Meursault (白)', desc: '最受欢迎的白勃艮第村庄，¥300-800' },
      { name: 'Chablis Premier Cru (白)', desc: '矿物感最强的霞多丽，¥200-500' },
    ],
    travel: ['最佳时间：9-10月收获季', '博纳济贫院（Hospices de Beaune）——勃艮第地标，每年11月举办慈善拍卖', '骑行金丘：从第戎到博纳约60公里，沿途经过所有著名村庄', '酒窖参观预约：大酒商（Drouhin/Bouchard）容易约，名庄（DRC/Leroy）几乎不对外开放'],
    closing: '勃艮第是葡萄酒的终极哲学：同一个品种，在不同的土地上，讲述不同的故事。它不适合入门，但如果你已经爱上葡萄酒，勃艮第就是你的终点站。',
    imgUrl: 'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=800&q=80',
  },
  {
    num: 3, title: '第 3 期：香槟区 —— 气泡的故乡', subtitle: '只有这里的酒才能叫「香槟」。其他地方的？请叫「起泡酒」。',
    name: 'Champagne', zhName: '香槟', country: '法国', area: '约 3.4 万公顷', climate: '法国最北的产区，大陆性气候边缘，冷凉', grapes: '黑皮诺、莫尼耶皮诺（红）、霞多丽（白）',
    terroir: ['香槟区的白垩土是关键——这种白色石灰岩像海绵一样储水，干旱时缓慢释放。同时赋予酒独特的矿物感和清爽酸度。', '冷凉气候意味着葡萄永远不会过度成熟，高酸是香槟气泡能如此精细的基础。', '传统法（Méthode Champenoise）：在瓶内二次发酵产生气泡，然后在酒泥上陈放至少15个月（年份香槟至少3年）。这个过程赋予了香槟面包、饼干的复杂风味。'],
    history: ['17世纪唐培里侬修士（Dom Pérignon）完善了香槟酿造技术', '19世纪凯歌夫人发明了转瓶除渣法', '1927年香槟产区边界被法律严格界定', '今天全球香槟年销量约3亿瓶，法国占一半消费量'],
    classification: ['NV（Non-Vintage）无年份——最常见，多年份混酿保持稳定风格', 'Vintage 年份香槟——只在好年份出产', 'Blanc de Blancs——纯霞多丽，最清爽', 'Blanc de Noirs——纯黑葡萄品种，更饱满', 'Rosé 桃红香槟——颜值担当', 'Prestige Cuvée 旗舰款——如唐培里侬、巴黎之花'],
    estates: [
      { name: 'Dom Pérignon', desc: '最著名的年份香槟，LVMH集团出品。每一瓶都是该年份的巅峰表达。', price: '¥1200-3000' },
      { name: 'Krug', desc: '香槟中的「劳斯莱斯」。NV 款（Grande Cuvée）就已经用 10+ 个年份混酿。', price: '¥1500-5000' },
      { name: 'Moët & Chandon', desc: '全球销量第一的香槟品牌。Impérial Brut 是庆祝的代名词。', price: '¥250-350' },
      { name: 'Veuve Clicquot', desc: '凯歌，标志性黄标。风格偏圆润饱满。', price: '¥280-380' },
    ],
    wines: [
      { name: 'Moët Impérial Brut', desc: '入门首选，稳定可靠，¥250-350' },
      { name: 'Billecart-Salmon Rosé', desc: '公认最好的桃红香槟之一，¥400-600' },
      { name: 'Pierre Gimonnet Blanc de Blancs', desc: '小农香槟，纯霞多丽，性价比极高，¥200-300' },
      { name: 'Bollinger Special Cuvée', desc: '007 邦德的最爱，饱满有力，¥300-450' },
    ],
    travel: ['从巴黎坐火车 45 分钟到兰斯（Reims）', '必访：兰斯大教堂（法国国王加冕处）+ 旁边的香槟酒窖', '埃佩尔奈（Épernay）的香槟大道——世界上最贵的一条街', '大品牌酒窖参观 €20-40/人含品鉴，小农需提前预约'],
    closing: '香槟不只是一种酒，它是一种态度：生活值得庆祝，每一天都值得。',
    imgUrl: 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=800&q=80',
  },
  {
    num: 4, title: '第 4 期：托斯卡纳 —— 文艺复兴之地的酒', subtitle: '佛罗伦萨的夕阳、丝柏树的山丘、桑娇维塞的酸樱桃——这就是托斯卡纳。',
    name: 'Tuscany / Toscana', zhName: '托斯卡纳', country: '意大利', area: '约 6.4 万公顷', climate: '地中海气候，温暖干燥的夏天，温和的冬天', grapes: '桑娇维塞（Sangiovese）为核心，还有国际品种（赤霞珠、梅洛）',
    terroir: ['托斯卡纳的丘陵地形让每个子产区都有独特的微气候。海拔从 100 到 600 米不等，高处更凉爽，低处更温暖。', '基安蒂经典（Chianti Classico）的石灰岩和页岩赋予桑娇维塞高酸度和矿物感。布鲁奈罗蒙塔奇诺（Brunello di Montalcino）更温暖干燥，出产更浓郁的风格。', '博格利（Bolgheri）靠近海岸，地中海微风让国际品种（赤霞珠）表现出色，催生了「超级托斯卡纳」运动。'],
    history: ['伊特鲁里亚人（公元前 8 世纪）就开始酿酒', '美第奇家族时期（文艺复兴），托斯卡纳酒成为欧洲宫廷珍品', '1716年科西莫三世划定基安蒂等产区边界——世界上最早的产区保护', '1970年代「超级托斯卡纳」革命：叛逆酿酒师用波尔多品种打破传统', 'Sassicaia 1985 年在 Decanter 评比中击败所有波尔多名庄'],
    classification: ['Chianti DOCG / Chianti Classico DOCG——桑娇维塞核心', 'Brunello di Montalcino DOCG——桑娇维塞的王者表达', 'Vino Nobile di Montepulciano DOCG——性价比之选', 'Bolgheri DOC——超级托斯卡纳的大本营', 'Super Tuscan（超托）——不遵循传统法规但品质顶级'],
    estates: [
      { name: 'Tenuta San Guido（Sassicaia）', desc: '超级托斯卡纳鼻祖。用波尔多品种在托斯卡纳酿出世界级名酒。', price: '¥1000-2500' },
      { name: 'Antinori（安东尼世家）', desc: '意大利最古老的酒业世家之一（626 年历史）。Tignanello 是另一款超托经典。', price: 'Tignanello ¥600-1000' },
      { name: 'Biondi-Santi', desc: 'Brunello 的发明者。风格极其传统，需要 20 年以上陈年。', price: '¥600-3000' },
      { name: 'Castello di Ama', desc: '基安蒂经典区的明星，同时也是当代艺术收藏馆。', price: '¥200-500' },
    ],
    wines: [
      { name: 'Chianti Classico Riserva', desc: '入门托斯卡纳的最佳选择，¥150-300' },
      { name: 'Rosso di Montalcino', desc: 'Brunello 的「小弟」，同品种但更早饮，¥120-250' },
      { name: 'Bolgheri Rosso', desc: '超托入门，波尔多品种风味，¥150-350' },
      { name: 'Vernaccia di San Gimignano (白)', desc: '托斯卡纳最好的白酒，清爽矿物，¥80-150' },
    ],
    travel: ['佛罗伦萨出发自驾最佳，基安蒂经典区就在城南', '圣吉米尼亚诺（San Gimignano）——中世纪塔楼小镇，边逛边品酒', '蒙塔奇诺——Brunello 产地，小镇城墙上看日落', '博格利——海岸线酒庄，Sassicaia 需提前数月预约'],
    closing: '托斯卡纳是意大利的灵魂——艺术、美食、葡萄酒在这里融为一体。来这里不只是为了喝酒，是为了体验一种生活方式。',
    imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
  {
    num: 5, title: '第 5 期：纳帕谷 —— 新世界的加州梦', subtitle: '1976 年巴黎审判，纳帕谷一战成名。从此「新世界也能酿好酒」不再是争论。',
    name: 'Napa Valley', zhName: '纳帕谷', country: '美国 · 加利福尼亚', area: '约 1.8 万公顷', climate: '地中海气候，温暖干燥，但受太平洋冷雾影响有多种微气候', grapes: '赤霞珠为王，还有梅洛、黑皮诺（Carneros）、霞多丽',
    terroir: ['纳帕谷虽然只有 50 公里长、8 公里宽，但拥有全球一半的土壤类型。从谷底到山腰，温度、土壤、光照全不同。', '卡内罗斯（Carneros）在南端最凉，适合黑皮诺和霞多丽。豪威尔山（Howell Mountain）在山上，火山岩土壤，出产最浓郁的赤霞珠。', '加州阳光充足意味着成熟度不是问题——纳帕的挑战是如何在浓郁中保持优雅。'],
    history: ['1960年代 Robert Mondavi 建立了纳帕第一家现代酒庄', '1976年「巴黎审判」盲品赛中 Stag\'s Leap 击败波尔多一级庄', '1980-90年代纳帕飞速发展，膜拜酒（Cult Wine）文化兴起', '21世纪纳帕赤霞珠均价超过波尔多，成为全球最贵产区之一', '2017/2020年加州山火对部分酒庄造成影响'],
    classification: ['Napa Valley AVA——产区总名', '16 个子产区 AVA：Oakville、Rutherford、Stags Leap District 等', '没有法国式的官方分级，但市场自发形成了「膜拜酒」层级', 'Opus One、Screaming Eagle、Harlan 等膜拜酒每瓶 ¥3000-30000'],
    estates: [
      { name: 'Opus One', desc: '罗斯柴尔德家族和 Robert Mondavi 的合作项目。纳帕最具仪式感的酒庄。', price: '¥2500-4000' },
      { name: 'Caymus', desc: '纳帕赤霞珠的代表之一。Special Selection 是旗舰。', price: '¥400-1500' },
      { name: 'Robert Mondavi', desc: '纳帕现代酿酒的奠基者。Reserve 系列是经典。', price: '¥300-800' },
      { name: 'Stag\'s Leap Wine Cellars', desc: '巴黎审判的冠军。S.L.V. 和 Fay 是两款传奇单一园。', price: '¥500-1500' },
    ],
    wines: [
      { name: 'Robert Mondavi Napa Valley Cabernet', desc: '入门纳帕赤霞珠，¥250-400' },
      { name: 'Beringer Knights Valley Cabernet', desc: '性价比好选择，¥150-250' },
      { name: 'Caymus Napa Valley Cabernet', desc: '浓郁饱满的纳帕代表，¥400-600' },
      { name: 'Schramsberg Blanc de Blancs', desc: '纳帕最好的起泡酒，¥200-350' },
    ],
    travel: ['旧金山北开车 1 小时到纳帕', '纳帕谷酒列车（Wine Train）——在火车上边品酒边看风景', 'Yountville 小镇——米其林餐厅密度全美最高', '预约制酒庄参观 $40-100/人，热门酒庄需提前数周预约'],
    closing: '纳帕谷证明了一件事：伟大的葡萄酒不一定需要几百年历史，需要的是好的风土和敢于挑战的人。',
    imgUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
  },
  {
    num: 6, title: '第 6 期：罗讷河谷 —— 从北到南的味觉光谱', subtitle: '北罗讷冷峻优雅，南罗讷热情奔放。同一条河，两个世界。',
    name: 'Rhône Valley', zhName: '罗讷河谷', country: '法国', area: '约 7.9 万公顷（法国第二大 AOC 产区）', climate: '北罗讷大陆性气候，南罗讷地中海气候', grapes: '北：西拉 / 南：歌海娜为主的混酿',
    terroir: ['北罗讷河谷：陡峭的花岗岩山坡，有些坡度超过60°，只能人工采摘。西拉在这里展现出冷峻的胡椒、熏肉和紫罗兰。', '南罗讷河谷：平坦的鹅卵石平原。巨大的圆石白天吸收太阳热量，夜间释放给葡萄。歌海娜为主的混酿，温暖、浓郁、香料丰富。', '密斯特拉风（Mistral）是整个罗讷河谷的关键——这种从北方吹来的干冷风让葡萄保持健康，减少病害。'],
    history: ['罗马时期就已种植，比波尔多历史更悠久', '14世纪教皇迁居阿维尼翁，推动了南罗讷（教皇新堡）的发展', '20世纪大部分时间被波尔多和勃艮第的光芒掩盖', '21世纪重新获得关注，尤其是北罗讷的罗第丘和埃米塔日价格飙升'],
    classification: ['北罗讷八大产区：Côte-Rôtie、Hermitage、Cornas 等', '南罗讷：Châteauneuf-du-Pape 最著名', 'Côtes du Rhône——大区级，覆盖南北，性价比之王', 'Côtes du Rhône-Villages——升级版大区级'],
    estates: [
      { name: 'E. Guigal', desc: '北罗讷之王。La La La 三款单一园（La Mouline/La Landonne/La Turque）是传奇。', price: '单一园 ¥2000-5000 / Côtes du Rhône ¥80-120' },
      { name: 'Château de Beaucastel', desc: '教皇新堡最伟大的酒庄之一。使用全部 13 个品种混酿。', price: '¥400-800' },
      { name: 'Jean-Louis Chave', desc: '埃米塔日产区的传奇家族，传承 500 年。', price: '¥800-3000' },
    ],
    wines: [
      { name: 'Guigal Côtes du Rhône', desc: '全世界最超值的法国红酒之一，¥80-120' },
      { name: 'Crozes-Hermitage', desc: '北罗讷入门西拉，¥100-250' },
      { name: 'Châteauneuf-du-Pape', desc: '南罗讷旗舰，¥200-600' },
      { name: 'Condrieu (白)', desc: '维欧尼白葡萄酒的巅峰，花香浓郁，¥300-600' },
    ],
    travel: ['里昂出发南下最方便（里昂本身就是美食之都）', '罗第丘的陡峭梯田非常壮观', '阿维尼翁——南罗讷中心，教皇宫和每年 7 月的戏剧节', '薰衣草季（6-7月）游普罗旺斯可以顺路访南罗讷酒庄'],
    closing: '罗讷河谷是法国的隐藏宝藏——没有波尔多的傲慢，没有勃艮第的天价，但品质丝毫不逊色。尤其是 Côtes du Rhône 大区级，是全世界最超值的法国红酒。',
    imgUrl: 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=800&q=80',
  },
  {
    num: 7, title: '第 7 期：皮埃蒙特 —— 巴罗洛的故乡', subtitle: '意大利的「勃艮第」。内比奥罗在这片山丘上创造了奇迹。',
    name: 'Piedmont / Piemonte', zhName: '皮埃蒙特', country: '意大利', area: '约 4.6 万公顷', climate: '大陆性气候，秋季多雾', grapes: '内比奥罗、巴贝拉、多切托、莫斯卡托',
    terroir: ['皮埃蒙特的名字意为「山脚下」——阿尔卑斯山环绕三面。朗格（Langhe）丘陵是核心产区，泥灰岩和石灰岩土壤。', '秋季著名的浓雾（Nebbia，内比奥罗名字的由来）延缓了葡萄成熟，赋予高酸度和复杂的芳香。'],
    history: ['萨伏伊王室统治时期奠定了葡萄酒传统', '19世纪意大利统一后皮埃蒙特酒成为国家象征', 'Biondi-Santi 家族确立了 Brunello 的标准酿造方式', '现代派 vs 传统派之争（大桶 vs 小桶）至今仍在继续'],
    classification: ['Barolo DOCG——酒中之王', 'Barbaresco DOCG——酒中之后', 'Barbera d\'Alba / d\'Asti——日常红酒', 'Moscato d\'Asti DOCG——甜白微泡', 'Roero Arneis DOCG——干白'],
    estates: [
      { name: 'Giacomo Conterno', desc: 'Barolo 传统派标杆。Monfortino 是意大利最伟大的酒之一。', price: 'Monfortino ¥5000+ / Cascina Francia ¥800-1500' },
      { name: 'Angelo Gaja', desc: '现代派领袖，把皮埃蒙特推向国际舞台。', price: '¥1500-5000' },
      { name: 'Bruno Giacosa', desc: '跨越传统和现代的大师。', price: '¥500-3000' },
    ],
    wines: [
      { name: 'Barbera d\'Alba', desc: '皮埃蒙特日常红酒，酸度活泼果味浓，¥80-200' },
      { name: 'Langhe Nebbiolo', desc: '入门内比奥罗，不满足 Barolo 法规但同品种，¥100-250' },
      { name: 'Barolo (入门酒庄)', desc: '选 Fontanafredda 或 Pio Cesare，¥250-400' },
      { name: 'Moscato d\'Asti', desc: '甜白微泡，¥60-120' },
    ],
    travel: ['都灵出发自驾约 1 小时到朗格产区', '白松露季（10-11月）是最佳访问时间', '阿尔巴（Alba）白松露节——全球美食家的朝圣地', '朗格丘陵被列为联合国世界文化遗产'],
    closing: '皮埃蒙特是意大利最讲究的产区。它不像托斯卡纳那样对游客友好，但正因如此，这里保留了最纯粹的意大利酿酒精神。',
    imgUrl: 'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=800&q=80',
  },
  {
    num: 8, title: '第 8 期：里奥哈 —— 西班牙的时间守护者', subtitle: '全世界最慷慨的产区：酒庄帮你把酒存好了，开瓶就是巅峰。',
    name: 'Rioja', zhName: '里奥哈', country: '西班牙', area: '约 6.6 万公顷', climate: '大陆性 + 大西洋 + 地中海三种气候交汇', grapes: '丹魄（Tempranillo）为主，歌海娜、格拉西亚诺、马苏埃洛',
    terroir: ['里奥哈被坎塔布里亚山脉保护，免受大西洋暴风侵袭。三个子产区风格不同：Rioja Alta 最凉爽优雅，Rioja Alavesa 最精致，Rioja Oriental（原 Baja）最温暖浓郁。', '美式橡木桶的广泛使用是里奥哈的标志——相比法式橡木，美式橡木带来更明显的香草、椰子和甜香料风味。'],
    history: ['罗马时期开始种植', '19世纪波尔多遭根瘤蚜虫害，波尔多酒商来里奥哈酿酒，带来了波尔多技术', '1925年里奥哈成为西班牙第一个 DOC 产区', '1991年升级为 DOCa（最高级别）', '2017/2018年开始推行单一园（Viñedo Singular）分级'],
    classification: ['Joven——年轻酒，不过桶或少量过桶', 'Crianza——至少陈年2年（1年在桶中）', 'Reserva——至少陈年3年（1年在桶中）', 'Gran Reserva——至少陈年5年（2年在桶中）', 'Viñedo Singular——新的单一园级别'],
    estates: [
      { name: 'López de Heredia', desc: '里奥哈传统派的极致。Viña Tondonia Gran Reserva 在桶中陈放 10 年以上。', price: '¥200-800' },
      { name: 'La Rioja Alta', desc: 'Reserva 904 和 Gran Reserva 890 是经典中的经典。', price: '¥250-600' },
      { name: 'Marqués de Riscal', desc: '里奥哈最古老的酒庄之一，Frank Gehry 设计的酒店是建筑奇观。', price: '¥100-400' },
    ],
    wines: [
      { name: 'CVNE Viña Real Reserva', desc: '性价比极高的 Reserva，¥120-180' },
      { name: 'La Rioja Alta Viña Ardanza Reserva', desc: '经典中的经典，¥150-250' },
      { name: 'López de Heredia Viña Tondonia Reserva', desc: '时间的艺术品，¥200-350' },
    ],
    travel: ['从毕尔巴鄂开车 1.5 小时', 'Marqués de Riscal 的 Frank Gehry 酒店值得一看', 'Haro 小镇——里奥哈的「酒庄一条街」', '6月底 Haro 的「葡萄酒之战」节日——互相泼红酒的狂欢'],
    closing: '里奥哈是全世界最体贴消费者的产区：帮你把酒存好、帮你把价格控制住、帮你省去了「该不该再放几年」的焦虑。打开就是最好的状态。',
    imgUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80',
  },
  {
    num: 9, title: '第 9 期：巴罗萨谷 —— 澳洲设拉子的心脏', subtitle: '南半球最古老的葡萄藤，全世界最浓郁的设拉子。',
    name: 'Barossa Valley', zhName: '巴罗萨谷', country: '澳大利亚 · 南澳', area: '约 1.3 万公顷', climate: '温暖的地中海气候，干燥少雨', grapes: '设拉子（Shiraz）为王，还有歌海娜、赤霞珠、慕合怀特',
    terroir: ['巴罗萨最珍贵的资产是老藤——有些设拉子藤蔓超过 150 年。澳洲从未遭受根瘤蚜虫害，这些老藤是全世界最古老的。', '谷底温暖，出产浓郁饱满的设拉子。周围山丘（如 Eden Valley）更凉爽，出产更优雅的风格和优质雷司令。'],
    history: ['1842年德国移民（西里西亚路德教徒）在此定居并种植葡萄', '保留了欧洲已经灭绝的老藤品种', '20世纪中期被视为「廉价酒」产区', '奔富 Grange 和翰斯科 Hill of Grace 改变了一切', '21世纪巴罗萨成为澳洲最高端产区之一'],
    classification: ['没有法国式的官方分级', 'Barossa Old Vine Charter 根据藤龄分级：Old Vine（35+年）、Survivor Vine（70+年）、Centenarian Vine（100+年）、Ancestor Vine（125+年）', '产区内分为 Barossa Valley（谷底温暖）和 Eden Valley（山丘凉爽）'],
    estates: [
      { name: 'Penfolds', desc: 'Grange 是澳洲酒的旗舰，全球最受追捧的设拉子。', price: 'Grange ¥3000+ / Bin 389 ¥280-380' },
      { name: 'Henschke', desc: 'Hill of Grace 来自 1860 年种植的老藤，澳洲最伟大的单一园。', price: 'Hill of Grace ¥3000+ / Mount Edelstone ¥500-800' },
      { name: 'Torbreck', desc: '老藤专家，RunRig 是旗舰。', price: '¥200-800' },
      { name: 'Peter Lehmann', desc: '巴罗萨「人民的酒庄」，品质稳定价格亲民。', price: '¥80-200' },
    ],
    wines: [
      { name: 'Peter Lehmann Barossa Shiraz', desc: '入门巴罗萨，果味奔放，¥80-130' },
      { name: 'Torbreck Woodcutter\'s Shiraz', desc: '性价比极高的巴罗萨设拉子，¥120-180' },
      { name: 'Henschke Mount Edelstone', desc: '进阶巴罗萨，优雅与力量兼具，¥500-800' },
    ],
    travel: ['阿德莱德市区开车 1 小时', '巴罗萨美食节（每年 4 月）', 'Maggie Beer 农庄——澳洲最著名的美食家的家', 'Jacob\'s Creek 游客中心——免费品鉴'],
    closing: '巴罗萨是澳洲酒的灵魂。那些扎根 150 年的老藤，经历了两次世界大战、经济萧条、酿酒潮流的变迁，依然在产出世界上最浓郁、最纯粹的设拉子。',
    imgUrl: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=80',
  },
  {
    num: 10, title: '第 10 期：马尔堡 —— 新西兰的长相思圣地', subtitle: '一个只有 40 年历史的产区，如何征服了全世界的味蕾。',
    name: 'Marlborough', zhName: '马尔堡', country: '新西兰 · 南岛', area: '约 2.7 万公顷', climate: '冷凉海洋性气候，全球同纬度最长日照', grapes: '长相思占 80%+，还有黑皮诺、霞多丽',
    terroir: ['马尔堡位于南岛东北角，被山脉三面环绕。Wairau 河谷是主要产区——河床冲积的鹅卵石和沙砾土壤排水极佳。', '关键因素是极端的昼夜温差：白天阳光充足促进糖分积累和风味发展，夜晚急速降温保住了酸度。结果：香气炸裂+酸度锐利。'],
    history: ['1973年 Montana（现 Brancott Estate）种下第一批长相思', '1985年 Cloudy Bay 创立，一酒成名', '2000年代新西兰长相思成为全球现象', '如今马尔堡占新西兰葡萄酒出口的 86%'],
    classification: ['没有分级制度', '主要按子产区区分：Wairau Valley（河谷，更热带水果）和 Southern Valleys（更草本矿物）', '品质主要靠品牌和酒庄声誉'],
    estates: [
      { name: 'Cloudy Bay', desc: '把马尔堡推向世界的先驱。', price: '¥180-250' },
      { name: 'Dog Point', desc: 'Cloudy Bay 前酿酒师自立门户。', price: '¥120-200' },
      { name: 'Greywacke', desc: '另一位 Cloudy Bay 元老创立，风格更饱满复杂。', price: '¥150-250' },
      { name: 'Craggy Range', desc: '也做马尔堡长相思，Te Muna 系列优秀。', price: '¥100-200' },
    ],
    wines: [
      { name: 'Brancott Estate Sauvignon Blanc', desc: '最便宜的马尔堡长相思之一，¥60-90' },
      { name: 'Oyster Bay Sauvignon Blanc', desc: '全球最畅销的新西兰酒，¥80-120' },
      { name: 'Cloudy Bay Sauvignon Blanc', desc: '马尔堡标杆，¥180-250' },
      { name: 'Felton Road Pinot Noir (Central Otago)', desc: '新西兰黑皮诺的巅峰（虽非马尔堡），¥250-450' },
    ],
    travel: ['从惠灵顿坐渡轮到皮克顿再开车 30 分钟', '大部分酒庄都欢迎 walk-in 品鉴', '布伦海姆（Blenheim）是产区中心小镇', '可以结合南岛自驾游顺路访问'],
    closing: '马尔堡证明了：在葡萄酒世界，历史不是必须的。一个只有 40 年历史的产区，凭借独特的风土和一个品种，就可以征服全世界。',
    imgUrl: 'https://images.unsplash.com/photo-1566995541428-f4e827e06c09?w=800&q=80',
  },
  {
    num: 11, title: '第 11 期：门多萨 —— 安第斯山下的马尔贝克帝国', subtitle: '海拔最高的葡萄园，全世界最好的马尔贝克。',
    name: 'Mendoza', zhName: '门多萨', country: '阿根廷', area: '约 15 万公顷', climate: '干旱大陆性气候，依靠安第斯山融雪灌溉', grapes: '马尔贝克为主，还有赤霞珠、邦达（Bonarda）',
    terroir: ['门多萨的葡萄园海拔 600-1500 米，是世界上海拔最高的产区之一。高海拔意味着更强的紫外线，葡萄皮更厚、颜色更深、风味更浓。', '安第斯山融雪是唯一的水源，酒庄通过灌溉系统精确控制用水。干燥气候几乎不需要打药，很多酒庄自然而然做到了有机种植。'],
    history: ['16世纪西班牙殖民者带来了葡萄', '1853年法国人把马尔贝克带到阿根廷', '20世纪大部分时间产量优先于品质', '1990年代品质革命开始，Catena 家族是先驱', '21世纪阿根廷马尔贝克成为全球第六大葡萄酒出口国'],
    classification: ['没有法国式分级', '主要按子产区区分：Luján de Cuyo（传统核心）、Uco Valley（高海拔新星）、Maipú 等', '高海拔（High Altitude）标注越来越受重视'],
    estates: [
      { name: 'Catena Zapata', desc: '阿根廷酒的「教父」。Nicolás Catena 是把马尔贝克推向世界的先驱。', price: '¥100-2000' },
      { name: 'Zuccardi', desc: 'Valle de Uco 的先锋。Zuccardi José 被评为世界最佳葡萄园之一。', price: '¥100-500' },
      { name: 'Achával-Ferrer', desc: '单一园马尔贝克的标杆。', price: '¥200-600' },
    ],
    wines: [
      { name: 'Catena Malbec', desc: '入门阿根廷马尔贝克的最佳选择，¥100-150' },
      { name: 'Zuccardi Serie A Malbec', desc: '性价比极好，¥80-120' },
      { name: 'Trapiche Broquel Malbec', desc: '超市常见，品质稳定，¥60-100' },
    ],
    travel: ['布宜诺斯艾利斯飞门多萨 2 小时', '安第斯山脚自驾酒庄路线风景壮美', 'Francis Mallmann 的烤肉餐厅（阿根廷国宝级厨师）', 'Uco Valley 的 Salentein 酒庄有艺术画廊'],
    closing: '门多萨告诉你：一个被法国淘汰的品种，在正确的土地上，可以绽放出超越原产地的光芒。马尔贝克不再是波尔多的配角，它是安第斯山的主角。',
    imgUrl: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=800&q=80',
  },
  {
    num: 12, title: '第 12 期：莫泽尔 —— 雷司令的圣殿', subtitle: '全世界最陡峭的葡萄园，全世界最精致的白葡萄酒。',
    name: 'Mosel', zhName: '莫泽尔', country: '德国', area: '约 8800 公顷', climate: '极北的冷凉气候，很多年份葡萄刚好成熟', grapes: '雷司令占 61%，还有穆勒-图尔高、白皮诺',
    terroir: ['莫泽尔河蜿蜒流过陡峭的板岩山谷，有些葡萄园坡度超过 65°，只能手工作业。这些陡坡是世界上最极端的种植环境之一。', '蓝色板岩是莫泽尔的灵魂——白天吸热晚上释放，帮助葡萄在极北纬度成熟。同时赋予雷司令标志性的「湿石头」矿物感。', '低酒精度（7-12%）是莫泽尔的特色。酸甜平衡的精妙程度在葡萄酒世界中无可匹敌。'],
    history: ['罗马时期开始在莫泽尔河谷种葡萄', '中世纪修道院发展了葡萄种植', '19世纪莫泽尔雷司令是世界上最贵的白葡萄酒（比波尔多还贵）', '20世纪因为甜酒不流行而陷入低谷', '21世纪精品酒庄复兴，莫泽尔再次获得世界顶级地位'],
    classification: ['VDP 分级（类似勃艮第）：Gutswein（酒庄级）→ Ortswein（村庄级）→ Erste Lage（一级园）→ Grosse Lage（特级园）', 'Prädikat 甜度分级：Kabinett → Spätlese → Auslese → BA → TBA → Eiswein', 'Trocken = 干型，Feinherb = 半干，没标注通常是半甜到甜'],
    estates: [
      { name: 'Egon Müller (Scharzhofberger)', desc: '全球最贵的白葡萄酒之一。TBA 单瓶拍卖过 €12,000。', price: 'Kabinett ¥500-800 / TBA 天价' },
      { name: 'Joh. Jos. Prüm (JJ Prüm)', desc: 'Wehlener Sonnenuhr 是莫泽尔最经典的地块之一。', price: '¥200-800' },
      { name: 'Dr. Loosen', desc: '全球推广德国雷司令的大功臣。品质高且价格合理。', price: '¥80-300' },
    ],
    wines: [
      { name: 'Dr. Loosen Blue Slate Riesling Kabinett', desc: '入门莫泽尔，¥80-120' },
      { name: 'Fritz Haag Brauneberger Juffer Spätlese', desc: '经典莫泽尔晚收，¥150-250' },
      { name: 'Markus Molitor Zeltinger Sonnenuhr', desc: '品质和性价比兼具，¥100-300' },
    ],
    travel: ['从科隆/法兰克福开车 2 小时', '莫泽尔河游船是经典体验', '特里尔（Trier）——德国最古老的城市，罗马遗迹', '9-10 月葡萄收获季访问最佳，很多酒庄对外开放品鉴'],
    closing: '莫泽尔雷司令是葡萄酒中的「水墨画」——不靠浓墨重彩，而靠留白和精妙的平衡打动你。如果你只喝过高酒精度的红酒，这里会颠覆你对葡萄酒的所有认知。',
    imgUrl: 'https://images.unsplash.com/photo-1558346547-4439467bd1d5?w=800&q=80',
  },
  {
    num: 13, title: '第 13 期：杜罗河谷 —— 波特酒的故乡', subtitle: '全世界最壮美的葡萄园梯田，联合国世界遗产。',
    name: 'Douro Valley', zhName: '杜罗河谷', country: '葡萄牙', area: '约 4.5 万公顷', climate: '炎热干燥的大陆性气候', grapes: '国产多瑞加（Touriga Nacional）、罗丽红等 80+ 个本土品种',
    terroir: ['杜罗河谷的梯田从河边一直延伸到山顶，有些已有数百年历史。片岩（schist）在极端温度下碎裂，葡萄根深入岩缝汲取水分。', '这里是葡萄牙最热的产区，夏天超过 40°C 是常事。但片岩保水能力强，加上高海拔地块的凉爽夜晚，保证了葡萄的品质。'],
    history: ['1756年成为世界上第一个有法律保护的葡萄酒产区', '18-19世纪波特酒贸易让英国酒商（Taylor\'s、Graham\'s）在此扎根', '21世纪干红葡萄酒（Douro DOC）成为新的增长点'],
    classification: ['Port（加强酒）：Ruby、Tawny、LBV、Vintage 等级', 'Douro DOC（干红/干白）：常规品质到顶级', '上杜罗（Douro Superior）、中杜罗（Cima Corgo）、下杜罗（Baixo Corgo）三个子产区'],
    estates: [
      { name: 'Quinta do Noval', desc: 'Nacional 来自未嫁接的老藤，全世界最稀有的波特酒之一。', price: 'Nacional ¥5000+ / LBV ¥150-250' },
      { name: 'Taylor\'s', desc: '波特酒的标杆品牌，品质极其稳定。', price: 'LBV ¥120-200 / 20年 Tawny ¥250-400' },
      { name: 'Niepoort', desc: '兼做波特和顶级干红，Batuta 和 Charme 是名作。', price: '干红 ¥200-600' },
    ],
    wines: [
      { name: 'Taylor\'s LBV Port', desc: '性价比最高的优质波特，¥120-200' },
      { name: 'Graham\'s 10 Year Tawny', desc: '焦糖坚果味的经典 Tawny，¥150-250' },
      { name: 'Quinta do Crasto Douro DOC', desc: '优秀的杜罗干红，¥100-200' },
    ],
    travel: ['从波尔图沿河上溯，火车或游船均可', '杜罗河谷梯田列入联合国世界遗产', '很多酒庄（Quinta）提供住宿和品鉴', '波尔图加亚区（Vila Nova de Gaia）——波特酒酒窖一条街'],
    closing: '杜罗河谷是世界上最壮观的葡萄酒风景。数百年来人类在悬崖上一层层垒起梯田，只为种出最好的葡萄。这里的每一瓶酒都有汗水的重量。',
    imgUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80',
  },
  {
    num: 14, title: '第 14 期：卢瓦尔河谷 —— 法国花园的酒', subtitle: '从大西洋吹来的风，带着白诗南、长相思和品丽珠的清新。',
    name: 'Loire Valley', zhName: '卢瓦尔河谷', country: '法国', area: '约 7 万公顷', climate: '海洋性到大陆性过渡，各子产区差异大', grapes: '白诗南、长相思、品丽珠、慕斯卡岱',
    terroir: ['卢瓦尔河是法国最长的河流（1000+ 公里），从中部一直流到大西洋。沿岸的产区从西到东气候和土壤各不相同。', '下游靠近大西洋的慕斯卡岱（Muscadet）清爽矿物，中游的武弗雷（Vouvray）和桑塞尔（Sancerre）是白酒标杆，上游有少量红酒。'],
    history: ['中世纪法国王室在卢瓦尔建夏宫，推动了葡萄种植', '文艺复兴时期卢瓦尔河谷的城堡群成为法国政治中心', '白诗南（Chenin Blanc）在这里有上千年历史', '如今卢瓦尔是法国最活跃的自然酒运动产区之一'],
    classification: ['Muscadet Sèvre et Maine——入海口的清爽白', 'Vouvray——白诗南的多面表达（干/半干/甜/起泡）', 'Sancerre & Pouilly-Fumé——长相思标杆', 'Chinon & Bourgueil——品丽珠红酒'],
    estates: [
      { name: 'Domaine Huet (Vouvray)', desc: '白诗南的殿堂级生产者。从干型到甜型，每一款都完美。', price: '¥200-600' },
      { name: 'Didier Dagueneau (Pouilly-Fumé)', desc: '已故传奇酿酒师，长相思达到DRC级别的精致。', price: '¥300-800' },
      { name: 'Nicolas Joly (Savennières)', desc: '生物动力法的先驱，Coulée de Serrant 是传奇单一园。', price: '¥250-500' },
    ],
    wines: [
      { name: 'Muscadet Sèvre et Maine sur Lie', desc: '配生蚝的完美白酒，¥50-100' },
      { name: 'Sancerre (白)', desc: '矿物感长相思标杆，¥150-250' },
      { name: 'Vouvray Sec', desc: '干型白诗南，蜂蜜和花香，¥100-200' },
      { name: 'Chinon Rouge', desc: '优雅的品丽珠红酒，¥80-150' },
    ],
    travel: ['巴黎 TGV 到图尔（Tours）1 小时', '卢瓦尔河谷城堡群——香波城堡、舍农索城堡等', '骑行是最佳游览方式，沿河自行车道非常完善', '丰富的奶酪文化——特别是山羊奶酪配桑塞尔长相思'],
    closing: '卢瓦尔河谷是法国最被低估的产区。它没有波尔多的声量和勃艮第的价格，但它有最丰富的多样性——从起泡到甜酒，从干白到红酒，一条河就是一个完整的葡萄酒世界。',
    imgUrl: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=800&q=80',
  },
  {
    num: 15, title: '第 15 期：阿尔萨斯 —— 法德混血的芳香天堂', subtitle: '法国的土地，德国的品种，独一无二的芳香白酒。',
    name: 'Alsace', zhName: '阿尔萨斯', country: '法国（与德国边境）', area: '约 1.55 万公顷', climate: '法国最干燥的产区之一，被孚日山脉庇护', grapes: '雷司令、琼瑶浆（Gewurztraminer）、灰皮诺、麝香',
    terroir: ['孚日山脉像一面墙挡住了大西洋的雨水，让阿尔萨斯成为法国降雨量最少的产区。充足的阳光和干燥的气候让芳香品种完美成熟。', '13种不同的土壤类型在这么小的区域内共存，从花岗岩到石灰岩到火山岩，每一种都给酒带来不同的个性。'],
    history: ['历史上在法国和德国之间反复易手', '种植德国品种（雷司令、琼瑶浆）但用法国方式酿造', '是法国唯一在酒标上标注品种名的 AOC 产区', '51个特级园（Grand Cru）是产区精华'],
    classification: ['Alsace AOC——基础级别', 'Alsace Grand Cru——51个特级园', 'Vendange Tardive（VT）——晚收', 'Sélection de Grains Nobles（SGN）——贵腐甜酒', 'Crémant d\'Alsace——传统法起泡酒'],
    estates: [
      { name: 'Domaine Weinbach', desc: '阿尔萨斯最优雅的生产者之一。', price: '¥200-600' },
      { name: 'Trimbach', desc: 'Clos Sainte Hune 是全世界最伟大的干型雷司令之一。', price: '¥100-1500' },
      { name: 'Zind-Humbrecht', desc: '生物动力法先驱，浓郁饱满的风格。', price: '¥150-500' },
    ],
    wines: [
      { name: 'Trimbach Riesling', desc: '经典干型阿尔萨斯雷司令，¥100-150' },
      { name: 'Hugel Gewurztraminer', desc: '琼瑶浆入门，荔枝玫瑰香气扑鼻，¥100-180' },
      { name: 'Crémant d\'Alsace', desc: '性价比最高的法国传统法起泡酒，¥60-120' },
    ],
    travel: ['斯特拉斯堡出发沿「阿尔萨斯酒之路」自驾', '科尔马（Colmar）——童话般的彩色小镇', '圣诞市场季（11-12月）是最佳访问时间', '阿尔萨斯美食：酸菜猪肉（Choucroute）配雷司令是当地国菜'],
    closing: '阿尔萨斯是法国最「不像法国」的产区——它有德国的品种、德国的酒瓶、德国的半木结构建筑，但酿出的是只有法国风土才能给予的丰富和优雅。',
    imgUrl: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800&q=80',
  },
  {
    num: 16, title: '第 16 期：宁夏贺兰山 —— 中国葡萄酒的未来', subtitle: '北纬 38°，贺兰山东麓。中国葡萄酒正在这里书写新篇章。',
    name: 'Helan Mountain East, Ningxia', zhName: '宁夏贺兰山东麓', country: '中国', area: '约 3.8 万公顷', climate: '大陆性干旱气候，日照充足，昼夜温差大', grapes: '赤霞珠为主，梅洛、蛇龙珠、霞多丽',
    terroir: ['贺兰山像屏障一样阻挡了腾格里沙漠的风沙，东麓形成了独特的洪积扇地形，砾石土壤排水极佳。', '海拔 1000-1200 米，年日照 3000 小时以上，昼夜温差 15-20°C——这些数据让全世界的葡萄酒专家兴奋。', '冬天需要埋土防冻（-20°C），这增加了巨大的人工成本，但也形成了独特的「年轻藤」特色。'],
    history: ['1984年第一家酒庄（西夏王）建立', '2011年 Jancis Robinson 撰文关注宁夏', '2013年 Decanter 大赛宁夏酒获金奖', '2021年国家级葡萄酒产区正式获批', '如今有 200+ 家酒庄，每年都有新酒庄涌现'],
    classification: ['没有法国式分级，但有产区自己的酒庄分级体系', '列级酒庄制度仿照波尔多', '主要子产区：金山、青铜峡、红寺堡、银川'],
    estates: [
      { name: '贺兰晴雪', desc: '加贝兰是中国第一款在 Decanter 获金奖的红酒。', price: '¥200-400' },
      { name: '银色高地', desc: '高源创立，Decanter 多次获奖，品质国际水准。', price: '¥200-500' },
      { name: '迦南美地', desc: '德国酿酒师王方创立，小雅和魔方系列获国际好评。', price: '¥150-400' },
      { name: '西鸽酒庄', desc: '投资规模大，品质提升快，N系列性价比好。', price: '¥80-300' },
    ],
    wines: [
      { name: '西鸽 N28 赤霞珠', desc: '宁夏入门，品质超预期，¥80-120' },
      { name: '贺兰晴雪 加贝兰', desc: '中国酒的标杆，¥200-300' },
      { name: '银色高地 阙歌', desc: '波尔多风格混酿，优雅平衡，¥200-400' },
    ],
    travel: ['银川河东机场出发，产区在市区西侧', '多数酒庄可以预约参观品鉴', '贺兰山岩画——3000-10000年前的古人类艺术', '结合沙漠体验：沙坡头或腾格里沙漠'],
    closing: '宁夏贺兰山东麓是全世界葡萄酒行业最关注的「新星」。它不需要和波尔多比历史，只需要用品质说话——而它已经开始说了。',
    imgUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
  },
  {
    num: 17, title: '第 17 期：南非斯泰伦博斯 —— 彩虹之国的葡萄酒心脏', subtitle: '350年酿酒历史，非洲大陆唯一的世界级产区。',
    name: 'Stellenbosch', zhName: '斯泰伦博斯', country: '南非', area: '约 1.6 万公顷', climate: '地中海气候，受两洋交汇影响', grapes: '赤霞珠、皮诺塔吉（Pinotage）、设拉子、霞多丽、白诗南',
    terroir: ['斯泰伦博斯位于开普敦以东 50 公里，被群山环绕。大西洋和印度洋在好望角交汇带来的冷风调节了温度。', '花岗岩和砂岩为主的土壤，多山的地形提供了丰富的朝向和海拔选择。近年来高海拔地块越来越受重视。'],
    history: ['1679年荷兰总督 Simon van der Stel 建立斯泰伦博斯', '南非是新世界最古老的葡萄酒产国之一（比澳洲早 150 年）', '种族隔离时期受到国际制裁，葡萄酒产业停滞', '1994年后重返国际市场，品质飞速提升'],
    classification: ['Wine of Origin (WO) 产区制度', 'Stellenbosch 是最著名的子产区', '其他重要产区：Franschhoek、Paarl、Swartland、Elgin', 'Cape Blend——混入皮诺塔吉的南非特色混酿'],
    estates: [
      { name: 'Kanonkop', desc: '南非最好的皮诺塔吉（Pinotage）和波尔多混酿。Paul Sauer 是旗舰。', price: '¥200-500' },
      { name: 'Rustenberg', desc: '300+ 年历史的庄园。Peter Barlow 赤霞珠是南非最好之一。', price: '¥150-500' },
      { name: 'Mullineux', desc: 'Swartland 的新星夫妻档，多次获评南非年度最佳酿酒师。', price: '¥150-500' },
    ],
    wines: [
      { name: 'Kanonkop Kadette', desc: '南非入门混酿，性价比极高，¥80-120' },
      { name: 'Meerlust Rubicon', desc: '经典波尔多风格混酿，¥200-300' },
      { name: 'Mullineux Old Vines White', desc: '白诗南老藤，独特又好喝，¥150-250' },
    ],
    travel: ['开普敦出发开车 40 分钟', '斯泰伦博斯小镇——充满荷兰殖民建筑的大学城', '酒庄午餐非常流行，风景绝佳', '可以结合好望角、桌山等开普敦经典行程'],
    closing: '南非葡萄酒是世界舞台上最被低估的玩家。350年的历史、独特的本土品种、令人惊叹的性价比——只要你愿意打开这扇门，惊喜不断。',
    imgUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
  },
  {
    num: 18, title: '第 18 期：俄勒冈 —— 新世界的勃艮第梦', subtitle: '当加州在追求力量时，俄勒冈选择了优雅。',
    name: 'Oregon (Willamette Valley)', zhName: '俄勒冈（威拉梅特谷）', country: '美国', area: '约 1.4 万公顷', climate: '温和的海洋性气候，比加州凉爽得多', grapes: '黑皮诺为王，还有灰皮诺、霞多丽',
    terroir: ['威拉梅特谷（Willamette Valley）和勃艮第在同一纬度（45°N）。火山岩和海底沉积物混合的土壤，比加州凉爽湿润得多。', '这里的黑皮诺不追求纳帕的浓缩，而追求勃艮第式的精致和层次。事实上，多位勃艮第名庄已经来此投资。'],
    history: ['1960年代先驱 David Lett 在所有人说「太冷了」的时候种下了黑皮诺', '1979年 Eyrie Vineyards 在巴黎盲品中击败勃艮第名庄', '勃艮第的 Joseph Drouhin 1987 年来此建 Domaine Drouhin Oregon', '如今威拉梅特谷被认为是勃艮第之外最好的黑皮诺产区之一'],
    classification: ['Willamette Valley AVA 下有 11 个子 AVA', 'Dundee Hills——最经典的子产区，火山岩土壤', 'Eola-Amity Hills——最凉爽，风格最紧致', 'Ribbon Ridge——最小的子 AVA，精品云集'],
    estates: [
      { name: 'Domaine Drouhin Oregon', desc: '勃艮第名庄的美国分支。Laurène 黑皮诺优雅动人。', price: '¥250-500' },
      { name: 'Eyrie Vineyards', desc: '俄勒冈黑皮诺的先驱。', price: '¥200-400' },
      { name: 'Beaux Frères', desc: 'Robert Parker 的前妹夫创立。', price: '¥300-600' },
    ],
    wines: [
      { name: 'Willamette Valley Vineyards Whole Cluster Pinot', desc: '入门俄勒冈黑皮诺，¥120-180' },
      { name: 'Domaine Drouhin Dundee Hills Pinot Noir', desc: '中档标杆，¥250-400' },
      { name: 'King Estate Pinot Gris', desc: '俄勒冈最好的灰皮诺，¥100-150' },
    ],
    travel: ['波特兰出发开车 1 小时到 Dundee Hills', '波特兰本身就是美国最好的美食城市之一', '酒庄品鉴费 $15-30，很多可以 walk-in', '秋天（9-10月）收获季最美'],
    closing: '俄勒冈选择了一条和加州完全不同的路——不追求浓郁和力量，而追求优雅和精致。在这个「bigger is better」的时代，俄勒冈的克制反而显得格外迷人。',
    imgUrl: 'https://images.unsplash.com/photo-1526142684086-7ebd69df27a5?w=800&q=80',
  },
  {
    num: 19, title: '第 19 期：索诺玛 —— 纳帕隔壁的低调邻居', subtitle: '比纳帕更大、更多样、更便宜、更低调。很多人觉得：也更好喝。',
    name: 'Sonoma County', zhName: '索诺玛', country: '美国 · 加利福尼亚', area: '约 2.4 万公顷（比纳帕大两倍）', climate: '从凉爽海岸到温暖内陆，微气候极其多样', grapes: '黑皮诺、霞多丽、仙粉黛、赤霞珠、西拉',
    terroir: ['索诺玛从太平洋海岸一直延伸到内陆山谷，拥有纳帕无法比拟的气候多样性。', '俄罗斯河谷（Russian River Valley）凉爽多雾，出产顶级黑皮诺和霞多丽。干溪谷（Dry Creek Valley）温暖，老藤仙粉黛是特色。亚历山大谷（Alexander Valley）的赤霞珠与纳帕风格接近但价格低得多。'],
    history: ['1812年俄罗斯人在此建立殖民地并种植葡萄', '比纳帕更早开始酿酒', '1976年巴黎审判的白葡萄酒冠军 Chateau Montelena 实际上横跨纳帕和索诺玛', '如今索诺玛以多样性和性价比著称'],
    classification: ['Sonoma County AVA 下有 18 个子 AVA', 'Russian River Valley——黑皮诺和霞多丽', 'Dry Creek Valley——仙粉黛', 'Alexander Valley——赤霞珠', 'Sonoma Coast——凉爽海岸黑皮诺'],
    estates: [
      { name: 'Williams Selyem', desc: '索诺玛黑皮诺的传奇。从车库酒起步到膜拜酒。', price: '¥300-800' },
      { name: 'Ridge Vineyards', desc: 'Monte Bello 赤霞珠是加州最伟大的酒之一。Zinfandel 也极好。', price: '¥150-600' },
      { name: 'Kistler', desc: '可能是美国最好的霞多丽生产者。', price: '¥300-600' },
    ],
    wines: [
      { name: 'La Crema Russian River Pinot Noir', desc: '入门俄罗斯河谷黑皮诺，¥150-250' },
      { name: 'Ridge Three Valleys Zinfandel', desc: '老藤仙粉黛经典，¥150-250' },
      { name: 'Jordan Alexander Valley Cabernet', desc: '优雅风格的赤霞珠，¥250-400' },
    ],
    travel: ['旧金山开车 1 小时', 'Healdsburg 小镇——索诺玛的时髦中心', '海岸线上的 Bodega Bay——吃海鲜配凉爽海岸黑皮诺', '比纳帕更悠闲、更少游客、更低品鉴费'],
    closing: '索诺玛就像那个低调但实力超强的同学——不争不抢，但认识它的人都知道它有多好。如果纳帕让你觉得「太贵了」，索诺玛几乎总能给你更好的性价比。',
    imgUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
  },
  {
    num: 20, title: '第 20 期：智利中央山谷 —— 新世界的性价比之王', subtitle: '安第斯山和太平洋之间的天赐之地。¥50-200 就能喝到惊喜。',
    name: 'Central Valley, Chile', zhName: '智利中央山谷', country: '智利', area: '约 13 万公顷', climate: '地中海气候，极度干旱，几乎不下雨', grapes: '赤霞珠、佳美娜（Carménère）、梅洛、长相思',
    terroir: ['智利是世界上最狭长的国家，安第斯山在东、太平洋在西，形成了天然的屏障。从未被根瘤蚜虫侵入，老藤保存完好。', '中央山谷是智利最大的产区，包含迈坡（Maipo）、拉佩尔（Rapel）、库里科（Curicó）等子产区。从山到海，温度和风格差异巨大。', '秘鲁寒流带来的冷雾让沿海地块保持凉爽，出产更优雅的风格。'],
    history: ['16世纪西班牙传教士带来了葡萄', '19世纪法国人带来了波尔多品种', '佳美娜在法国灭绝后，1994年在智利被「重新发现」', '21世纪智利成为全球第四大葡萄酒出口国'],
    classification: ['D.O. 产区制度（类似法国 AOC 但更宽松）', '主要子产区：Maipo（赤霞珠最佳）、Colchagua（佳美娜和西拉）、Casablanca（白葡萄酒和黑皮诺）', '从 Costa（海岸）到 Andes（安第斯山麓），风格不同'],
    estates: [
      { name: '活灵魂 Almaviva', desc: '智利和法国（木桐）的合作顶级酒。智利最贵的酒之一。', price: '¥500-1000' },
      { name: '桃乐丝智利 Miguel Torres', desc: '西班牙桃乐丝在智利的酒庄，品质稳定。', price: '¥60-200' },
      { name: '蒙特斯 Montes', desc: '紫天使（Purple Angel）让智利佳美娜走向世界。', price: '¥60-500' },
    ],
    wines: [
      { name: '红魔鬼 Casillero del Diablo', desc: '国民级智利酒，便利店常见，¥50-80' },
      { name: 'Montes Alpha Carménère', desc: '认识佳美娜的最佳入门，¥100-150' },
      { name: 'Santa Rita 120 Cabernet', desc: '超市性价比之王，¥40-60' },
    ],
    travel: ['圣地亚哥出发自驾即可到达多数产区', '迈坡谷距圣地亚哥仅 30 分钟车程', '卡萨布兰卡谷——海岸产区，清凉宜人', '很多酒庄提供免费或低价品鉴'],
    closing: '智利中央山谷是全世界性价比最高的葡萄酒产区之一。在这里，¥100 能买到其他国家 ¥300 的品质。如果你的预算有限但想喝好酒——智利永远是最安全的选择。',
    imgUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
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
        uploadAndPatch(token, objToken, firstImgBlockId, buf, `region_${Date.now()}.jpg`);
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
  console.log('🗺️ 产区深度游 · 批量创建 #2-20\n');
  const tokenData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json'), 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) { console.error('Token 过期！'); return; }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  let created = 0;
  for (const r of REGIONS) {
    const blocks = regionToBlocks(r);
    const result = await createPage(token, PARENT_NODE, r.title, blocks, r.imgUrl);
    if (result) created++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\n\n✅ 产区深度游 #2-20 完成！成功 ${created}/${REGIONS.length} 篇`);
}

main().catch(err => { console.error('错误:', err); process.exit(1); });
