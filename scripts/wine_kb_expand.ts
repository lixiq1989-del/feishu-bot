/**
 * 葡萄酒知识库 - 扩展子页面
 * 在已有的完全指南基础上，创建更多独立子页面，丰富知识库目录
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_expand.ts
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
  // ═══ 1. 新手快速入门 ═══
  {
    title: '🔰 新手 3 分钟入门 —— 看完就能去买酒',
    imageUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=80',
    blocks: [
      h1('新手 3 分钟入门'),
      p(t('不想看长文？这一页帮你搞定最核心的知识。')),
      p(t('')),

      h2('第一个问题：红的还是白的？'),
      li(b('喜欢吃肉 →'), t(' 红葡萄酒（赤霞珠、梅洛）')),
      li(b('喜欢海鲜/清淡 →'), t(' 白葡萄酒（长相思、霞多丽）')),
      li(b('都行/夏天 →'), t(' 桃红或起泡酒')),
      li(b('不喝酒的人 →'), t(' 莫斯卡托（像果汁，5% 酒精度）')),
      p(t('')),

      h2('第二个问题：花多少钱？'),
      li(b('50-100 元：'), t('干露红魔鬼、黄尾袋鼠 —— 超市随便买，不踩雷')),
      li(b('100-200 元：'), t('奔富 Bin 28、拉菲传说 —— 请客有面子')),
      li(b('200-500 元：'), t('奔富 Bin 389、云雾之湾 —— 开始品出差异了')),
      li(b('500+：'), t('作品一号、天娜 —— 特殊场合再买')),
      p(t('')),

      h2('第三个问题：怎么喝？'),
      ol(b('温度：'), t('白酒冰镇（8-12°C），红酒室温偏凉（16-18°C）')),
      ol(b('醒酒：'), t('高端红酒开瓶后等 30 分钟再喝，入门酒不用')),
      ol(b('杯子：'), t('没有专业酒杯？用大一点的水杯也行，别用纸杯')),
      ol(b('配菜：'), t('红酒配红肉，白酒配白肉，记住这一条就够了')),
      p(t('')),

      h2('第四个问题：怎么装？'),
      p(t('三句话让你在任何酒局不露怯：')),
      ol(t('"这瓶酒果香很浓" —— 闻到水果味就说')),
      ol(t('"单宁挺重的" —— 感觉涩就说（只用于红酒）')),
      ol(t('"回味很长" —— 咽下去还有味道就说')),
      p(t('')),
      quote(t('记住：没人能喝出所有味道，专家也经常互相 disagree。自信地说你的感受就好。')),
    ],
  },

  // ═══ 2. 旧世界 vs 新世界 ═══
  {
    title: '🌍 旧世界 vs 新世界 —— 两种风格的碰撞',
    imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80',
    blocks: [
      h1('旧世界 vs 新世界'),
      p(t('葡萄酒世界最大的分界线，不是红酒 vs 白酒，而是'), b('旧世界 vs 新世界'), t('。')),
      p(t('')),

      h2('🏰 旧世界（Old World）'),
      p(b('代表国家：'), t('法国、意大利、西班牙、德国、葡萄牙')),
      p(t('')),
      h3('风格特点'),
      li(t('强调「风土」（Terroir）—— 土壤、气候、地形决定酒的个性')),
      li(t('酒标写产区名而非葡萄品种（如"Bourgogne"而非"Pinot Noir"）')),
      li(t('风格偏优雅内敛、高酸度、矿物感')),
      li(t('分级制度严格（法国 AOC、意大利 DOCG）')),
      p(t('')),
      h3('代表产区'),
      li(b('法国波尔多：'), t('混酿之王，赤霞珠+梅洛，适合配红肉')),
      li(b('法国勃艮第：'), t('黑皮诺圣地，优雅细腻，价格跨度巨大')),
      li(b('意大利托斯卡纳：'), t('桑娇维塞为主，Chianti 是经典配意面酒')),
      li(b('西班牙里奥哈：'), t('丹魄品种，橡木桶陈年味，性价比极高')),
      li(b('德国摩泽尔：'), t('雷司令天堂，从干到甜都有')),
      p(t('')),

      h2('🌏 新世界（New World）'),
      p(b('代表国家：'), t('美国、澳大利亚、智利、阿根廷、新西兰、南非')),
      p(t('')),
      h3('风格特点'),
      li(t('强调「品种」（Varietal）—— 酒标直接写葡萄品种名')),
      li(t('风格偏果味浓郁、酒体饱满、容易理解')),
      li(t('酿酒师创新自由度高，不受传统束缚')),
      li(t('性价比通常更高')),
      p(t('')),
      h3('代表产区'),
      li(b('美国纳帕谷：'), t('赤霞珠天花板，浓郁奔放，有"美国波尔多"之称')),
      li(b('澳洲巴罗萨谷：'), t('设拉子之乡，浓烈果酱感，奔富的大本营')),
      li(b('智利中央谷：'), t('赤霞珠和佳美娜的天堂，性价比之王')),
      li(b('阿根廷门多萨：'), t('马尔贝克的灵魂产区，高海拔造就独特风味')),
      li(b('新西兰马尔堡：'), t('长相思标杆，清爽果香，百香果炸弹')),
      p(t('')),

      h2('📊 一句话总结'),
      li(b('想喝「优雅含蓄」→'), t(' 旧世界（法国、意大利）')),
      li(b('想喝「奔放好懂」→'), t(' 新世界（澳洲、智利、美国）')),
      li(b('想性价比 →'), t(' 新世界（尤其智利、阿根廷）')),
      li(b('想装逼 →'), t(' 旧世界（勃艮第、波尔多）')),
      p(t('')),
      quote(t('实际上没有高低之分，只有风格差异。真正的行家两边都喝。\n不确定选哪个？去超市各买一瓶同品种的新旧世界对比喝，马上就懂了。')),
    ],
  },

  // ═══ 3. 中国人最常喝的 10 款酒 ═══
  {
    title: '🇨🇳 中国人最爱的 10 款葡萄酒',
    imageUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=1200&q=80',
    blocks: [
      h1('中国人最爱的 10 款葡萄酒'),
      p(t('基于电商销量、社交媒体热度和餐厅出镜率，这 10 款酒是中国消费者最常买的。')),
      p(t('')),

      h2('1. 奔富 Bin 389'),
      li(b('价格：'), t('约 350 元')),
      li(b('产区：'), t('澳洲南澳')),
      li(b('风格：'), t('赤霞珠+设拉子混酿，浓郁饱满，黑加仑+巧克力')),
      li(b('为什么火：'), t('被称为"穷人的 Grange"，送礼自饮都合适，品牌认知度极高')),
      p(t('')),

      h2('2. 拉菲传说（Légende）'),
      li(b('价格：'), t('约 150 元')),
      li(b('产区：'), t('法国波尔多')),
      li(b('风格：'), t('中等酒体，红果+香料，柔顺易饮')),
      li(b('为什么火：'), t('"拉菲"两个字在中国有无与伦比的品牌力')),
      p(t('')),

      h2('3. 干露红魔鬼 梅洛'),
      li(b('价格：'), t('约 60 元')),
      li(b('产区：'), t('智利中央谷')),
      li(b('风格：'), t('柔和圆润，李子+巧克力，不涩不酸')),
      li(b('为什么火：'), t('超市出镜率最高的进口酒，入门零门槛')),
      p(t('')),

      h2('4. 黄尾袋鼠 设拉子'),
      li(b('价格：'), t('约 50 元')),
      li(b('产区：'), t('澳洲东南')),
      li(b('风格：'), t('果味炸弹，黑莓+香草，甜美易饮')),
      li(b('为什么火：'), t('包装醒目，价格亲民，入门酒代名词')),
      p(t('')),

      h2('5. 奔富 Bin 407'),
      li(b('价格：'), t('约 500 元')),
      li(b('产区：'), t('澳洲南澳')),
      li(b('风格：'), t('纯赤霞珠，黑加仑+雪松+薄荷，结构感强')),
      li(b('为什么火：'), t('商务宴请首选，"不知道喝什么就买 407"')),
      p(t('')),

      h2('6. 酩悦香槟（Moët & Chandon）'),
      li(b('价格：'), t('约 350 元')),
      li(b('产区：'), t('法国香槟区')),
      li(b('风格：'), t('柑橘+白桃+烤面包，优雅气泡')),
      li(b('为什么火：'), t('庆祝仪式感的代名词，开瓶声就是氛围感')),
      p(t('')),

      h2('7. 长城五星赤霞珠'),
      li(b('价格：'), t('约 200 元')),
      li(b('产区：'), t('中国河北沙城')),
      li(b('风格：'), t('中等酒体，红果+轻微橡木味')),
      li(b('为什么火：'), t('国产标杆，国宴用酒，支持国货')),
      p(t('')),

      h2('8. 云雾之湾 长相思'),
      li(b('价格：'), t('约 180 元')),
      li(b('产区：'), t('新西兰马尔堡')),
      li(b('风格：'), t('百香果+青草+柑橘，清爽高酸')),
      li(b('为什么火：'), t('白葡萄酒天花板之一，女性消费者最爱')),
      p(t('')),

      h2('9. 张裕解百纳'),
      li(b('价格：'), t('约 80 元')),
      li(b('产区：'), t('中国山东烟台')),
      li(b('风格：'), t('中等酒体，红果+微甜，易饮')),
      li(b('为什么火：'), t('中国最大葡萄酒品牌，100年历史')),
      p(t('')),

      h2('10. 卡氏家族 马尔贝克'),
      li(b('价格：'), t('约 150 元')),
      li(b('产区：'), t('阿根廷门多萨')),
      li(b('风格：'), t('紫罗兰+黑莓+巧克力，饱满浓郁')),
      li(b('为什么火：'), t('阿根廷标杆，性价比极高，配烤肉一绝')),
    ],
  },

  // ═══ 4. 送礼选酒指南 ═══
  {
    title: '🎁 送礼选酒指南 —— 不同场合送什么酒',
    imageUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=1200&q=80',
    blocks: [
      h1('送礼选酒指南'),
      p(t('送酒是一门学问。选对了锦上添花，选错了尴尬收场。')),
      p(t('')),

      h2('👔 送领导/客户'),
      p(b('核心：品牌要响，包装要好')),
      li(b('500-1000 元：'), t('奔富 Bin 407/707（中国认知度第一）')),
      li(b('1000-3000 元：'), t('拉菲副牌 Carruades、作品一号 Opus One')),
      li(b('3000+：'), t('拉菲正牌、奔富 Grange')),
      li(it('禁忌：别送太小众的酒，对方不认识等于白送')),
      p(t('')),

      h2('👨‍👩‍👧 送长辈/父母'),
      p(b('核心：好喝、不涩、有品牌')),
      li(b('推荐：'), t('长城五星（国产有面子）、奔富 Bin 28（软甜易饮）')),
      li(b('加分：'), t('配个礼盒 + 酒具套装')),
      li(it('禁忌：别送高单宁的酒（如巴罗洛），老人觉得太涩')),
      p(t('')),

      h2('💕 送女朋友/闺蜜'),
      p(b('核心：颜值高、好喝、有故事')),
      li(b('推荐：'), t('莫斯卡托（甜甜的像果汁）、普罗旺斯桃红（拍照好看）')),
      li(b('进阶：'), t('酩悦粉红香槟（浪漫满分）')),
      li(it('禁忌：别送大瓶红酒，看着像请客用的')),
      p(t('')),

      h2('🎓 送年轻朋友'),
      p(b('核心：有趣、好玩、不装')),
      li(b('推荐：'), t('Freixenet 卡瓦起泡（黑金瓶超酷）、黄尾袋鼠礼盒')),
      li(b('创意：'), t('买两瓶不同品种的，让他对比喝，比礼盒更有心')),
      p(t('')),

      h2('🏠 乔迁之喜'),
      p(b('核心：寓意好、够隆重')),
      li(b('推荐：'), t('香槟（开瓶庆祝新家）、波尔多名庄副牌（有收藏价值）')),
      li(b('加分：'), t('选年份和搬家年份一样的酒')),
      p(t('')),

      h2('💰 预算速查表'),
      li(b('100-200 元：'), t('拉菲传说、奔富 Bin 28、干露红魔鬼豪华版')),
      li(b('200-500 元：'), t('奔富 Bin 389、酩悦香槟、长城桑干')),
      li(b('500-1000 元：'), t('奔富 Bin 407/707、天娜、木桐副牌')),
      li(b('1000-3000 元：'), t('作品一号、唐培里侬、拉菲副牌')),
      li(b('3000+：'), t('拉菲正牌、奔富 Grange、罗曼尼·康帝村级')),
    ],
  },

  // ═══ 5. 在家如何存酒 ═══
  {
    title: '🏠 在家如何存酒 —— 不用酒柜也能存好酒',
    blocks: [
      h1('在家如何存酒'),
      p(t('你不需要一个昂贵的恒温酒柜。掌握这几条原则，家里的角落也能存酒。')),
      p(t('')),

      h2('🌡️ 温度 —— 最重要的因素'),
      li(b('理想温度：'), t('12-15°C')),
      li(b('可接受范围：'), t('10-20°C（温差大比温度高更伤酒）')),
      li(b('大忌：'), t('放厨房（温度高且波动大）、放车里（夏天能到 60°C）')),
      li(it('核心原则：恒温比低温更重要。一个稳定 18°C 的地方好过忽高忽低的冰箱')),
      p(t('')),

      h2('💡 避光'),
      li(t('紫外线会加速酒的氧化，让酒"老化"')),
      li(t('这就是为什么大多数葡萄酒瓶是深色的')),
      li(b('解决：'), t('放在壁橱、衣柜底层、床底下 —— 任何暗处')),
      p(t('')),

      h2('📐 横放'),
      li(t('软木塞的酒一定要横放 —— 让酒液接触瓶塞，防止干燥进气')),
      li(t('螺旋盖的酒可以竖放，不用担心')),
      li(b('没有酒架？'), t(' 用纸箱侧放也行')),
      p(t('')),

      h2('🔇 避震'),
      li(t('震动会打乱酒里的化学反应，影响陈年')),
      li(t('别放在洗衣机旁边、冰箱上面')),
      p(t('')),

      h2('💧 湿度'),
      li(b('理想：'), t('60-70% 相对湿度')),
      li(t('太干燥会让软木塞收缩进气')),
      li(b('在北方干燥地区：'), t(' 在旁边放一碗水')),
      p(t('')),

      h2('⏰ 什么酒值得存？'),
      li(b('不值得存（买来就喝）：'), t('100 元以下的酒、大多数白葡萄酒、桃红、莫斯卡托')),
      li(b('可以存 3-5 年：'), t('200-500 元的好年份红酒')),
      li(b('可以存 10 年+：'), t('名庄正牌、高端赤霞珠、巴罗洛、好年份勃艮第')),
      p(t('')),

      h2('📱 开瓶后怎么保存？'),
      li(b('红酒：'), t('塞回瓶塞（或用真空塞），室温放 3 天内喝完')),
      li(b('白酒/桃红：'), t('塞回瓶塞放冰箱，5 天内喝完')),
      li(b('起泡酒：'), t('用起泡酒塞，冰箱放 1-2 天（气泡会跑掉）')),
      li(it('终极方案：喝不完就做菜！红酒炖牛肉、白酒蒸鱼都是好去处')),
    ],
  },

  // ═══ 6. 常见误区 ═══
  {
    title: '❌ 葡萄酒 10 大常见误区',
    blocks: [
      h1('葡萄酒 10 大常见误区'),
      p(t('这些错误观念你可能至少信过一半。')),
      p(t('')),

      h2('误区 1："酒越贵越好"'),
      p(b('真相：'), t('200 元以上的酒和 2000 元的酒，盲品时很多人分不出来。价格差异更多来自产量、品牌和稀缺性，而非绝对口感差异。')),
      p(t('')),

      h2('误区 2："年份越老越好"'),
      p(b('真相：'), t('95% 的葡萄酒设计为在 1-3 年内喝掉。只有顶级酒才有陈年潜力。一瓶 80 元的酒放 10 年只会变难喝。')),
      p(t('')),

      h2('误区 3："挂杯越多酒越好"'),
      p(b('真相：'), t('挂杯（酒腿）只说明酒精度和/或残糖高，跟品质没直接关系。14% 的便宜酒比 12.5% 的勃艮第挂杯更多。')),
      p(t('')),

      h2('误区 4："红酒配红肉，白酒配白肉"是铁律'),
      p(b('真相：'), t('这只是基本框架。黑皮诺配三文鱼（红配鱼）很经典，霞多丽配鸡肉（白配白肉）也常见。核心是酒和食物的"重量感"匹配。')),
      p(t('')),

      h2('误区 5："红酒要在室温下喝"'),
      p(b('真相：'), t('"室温"是指欧洲古堡的室温（16-18°C），不是你家空调 25°C。红酒偏凉喝更好，可以冰箱放 15 分钟。')),
      p(t('')),

      h2('误区 6："加冰块没品"'),
      p(b('真相：'), t('热天喝桃红或普通红酒加冰完全没问题。在法国南部，当地人也这么喝。别往 DRC 里加冰就行。')),
      p(t('')),

      h2('误区 7："螺旋盖 = 便宜酒"'),
      p(b('真相：'), t('新西兰、澳洲的高端酒很多都用螺旋盖，因为它能完美隔绝空气，不会出现软木塞污染（TCA）。螺旋盖是技术进步。')),
      p(t('')),

      h2('误区 8："所有红酒都需要醒酒"'),
      p(b('真相：'), t('年轻的入门红酒不需要醒酒。只有高单宁、高酒精度的年轻红酒或者老年份酒才需要。过度醒酒反而让酒氧化变差。')),
      p(t('')),

      h2('误区 9："进口酒一定比国产酒好"'),
      p(b('真相：'), t('中国宁夏、新疆产区已经获得国际大奖。贺兰山东麓的赤霞珠品质不输新世界同价位。盲目迷信进口是不对的。')),
      p(t('')),

      h2('误区 10："82 年的拉菲最好"'),
      p(b('真相：'), t('1982 确实是波尔多好年份，但拉菲最好的年份还有 2000、2009、2010、2016。而且"82 年拉菲"的梗更多是影视剧带来的认知偏差。')),
    ],
  },

  // ═══ 7. 看懂酒标 ═══
  {
    title: '🏷️ 看懂酒标 —— 5 秒读懂一瓶酒的身份证',
    blocks: [
      h1('看懂酒标'),
      p(t('酒标就是酒的身份证。学会看酒标，你在超市就能自己挑酒。')),
      p(t('')),

      h2('🇫🇷 法国酒标（最复杂）'),
      p(t('法国酒标不写葡萄品种，只写产区。所以你得知道产区 = 什么品种。')),
      li(b('Château xxx：'), t('"酒庄"名，波尔多常见')),
      li(b('Appellation xxx Contrôlée (AOC)：'), t('产区名。"xxx"越小越好')),
      li(b('Grand Cru / Premier Cru：'), t('分级。Grand Cru 最高')),
      li(b('Mis en bouteille au château：'), t('"在酒庄装瓶"，品质保障')),
      p(t('')),
      p(b('常见产区 = 品种速查：')),
      li(t('Bourgogne = 红是黑皮诺，白是霞多丽')),
      li(t('Bordeaux 左岸 = 赤霞珠为主')),
      li(t('Bordeaux 右岸 = 梅洛为主')),
      li(t('Chablis = 霞多丽（不过桶）')),
      li(t('Sancerre = 长相思')),
      p(t('')),

      h2('🇮🇹 意大利酒标'),
      li(b('DOCG：'), t('最高等级（Barolo, Chianti Classico）')),
      li(b('Riserva：'), t('陈年时间更长，品质更高')),
      li(b('Classico：'), t('产区核心地带')),
      p(t('')),

      h2('🌏 新世界酒标（最简单）'),
      p(t('直接写品种名 + 产区 + 年份 + 酒精度，一目了然。')),
      p(t('')),

      h2('📊 酒标最值得看的 3 个信息'),
      ol(b('产区'), t(' —— 越小越具体越好')),
      ol(b('年份'), t(' —— 波尔多好年份：2015/2016/2019/2022')),
      ol(b('酒精度'), t(' —— <12.5% 轻盈，12.5-14% 中等，>14% 浓郁')),
      p(t('')),
      quote(t('别被花哨的酒标设计迷惑。很多最好的酒用最朴素的酒标。')),
    ],
  },

  // ═══ 8. 全球产区地图 ═══
  {
    title: '🗺️ 全球葡萄酒产区地图',
    imageUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=80',
    blocks: [
      h1('全球葡萄酒产区地图'),
      p(t('葡萄酒产区分布在南北纬 30-50 度之间。')),
      p(t('')),

      h2('🇫🇷 法国'),
      h3('波尔多'), li(b('左岸：'), t('赤霞珠为主（梅多克、波雅克、玛歌）')), li(b('右岸：'), t('梅洛为主（圣埃美隆、波美侯）')),
      h3('勃艮第'), li(t('红 = 黑皮诺，白 = 霞多丽。分级：大区→村庄→一级园→特级园')),
      h3('罗讷河谷'), li(b('北罗讷：'), t('西拉（Côte-Rôtie, Hermitage）')), li(b('南罗讷：'), t('歌海娜混酿（Châteauneuf-du-Pape）')),
      h3('其他'), li(t('香槟区、卢瓦尔河谷、阿尔萨斯')),
      hr(),

      h2('🇮🇹 意大利'),
      li(b('皮埃蒙特：'), t('巴罗洛"意大利酒王"、巴巴莱斯科')),
      li(b('托斯卡纳：'), t('Chianti、Brunello、超级托斯卡纳')),
      li(b('威尼托：'), t('阿玛罗尼、普罗塞克')),
      hr(),

      h2('🇪🇸 西班牙'),
      li(b('里奥哈：'), t('丹魄，橡木桶味，性价比极高')),
      li(b('普里奥拉特：'), t('歌海娜老藤')),
      hr(),

      h2('🇺🇸 美国'),
      li(b('纳帕谷：'), t('赤霞珠之都')), li(b('索诺玛：'), t('黑皮诺和霞多丽')), li(b('俄勒冈：'), t('美国最好的黑皮诺')),
      hr(),

      h2('🇦🇺 澳大利亚'),
      li(b('巴罗萨谷：'), t('设拉子之都')), li(b('猎人谷：'), t('赛美蓉')), li(b('玛格丽特河：'), t('波尔多风格混酿')),
      hr(),

      h2('🇨🇱🇦🇷 南美'),
      li(b('智利中央谷：'), t('赤霞珠性价比之王')), li(b('阿根廷门多萨：'), t('马尔贝克圣地')),
      hr(),

      h2('🇳🇿 新西兰'),
      li(b('马尔堡：'), t('全球最好的长相思')), li(b('中奥塔哥：'), t('世界最南端黑皮诺')),
      hr(),

      h2('🇨🇳 中国'),
      li(b('宁夏贺兰山东麓：'), t('最受关注产区，已获多项国际大奖')),
      li(b('新疆：'), t('日照充足')), li(b('山东烟台：'), t('张裕大本营')), li(b('云南：'), t('高海拔潜力产区')),
    ],
  },

  // ═══ 9. 葡萄酒与健康 ═══
  {
    title: '🫀 葡萄酒与健康 —— 科学怎么说',
    blocks: [
      h1('葡萄酒与健康'),
      p(t('"每天一杯红酒有益健康"——科学怎么说？')),
      p(t('')),

      h2('✅ 适量饮用的潜在好处'),
      li(b('白藜芦醇：'), t('抗氧化物质，实验室显示抗炎和保护心血管作用')),
      li(b('地中海饮食：'), t('适量红酒是其组成之一')),
      p(t('')),

      h2('⚠️ 但科学也说...'),
      li(b('无"安全"饮酒量：'), t('2023年WHO立场：最佳饮酒量是零')),
      li(b('白藜芦醇含量极低：'), t('要达到有效剂量得喝几百瓶')),
      li(b('酒精是1类致癌物'), t('')),
      p(t('')),

      h2('🧭 理性建议'),
      li(t('不喝酒的人没理由开始喝')),
      li(t('喝酒控制在每天 1 杯（150ml）以内')),
      li(t('不要空腹喝，配餐更健康')),
      li(b('核心：'), t('把葡萄酒当享受，不是处方')),
    ],
  },

  // ═══ 10. 开始品酒之旅 ═══
  {
    title: '🚀 如何开始你的品酒之旅',
    blocks: [
      h1('如何开始你的品酒之旅'),
      p(t('')),

      h2('🎯 第 1-2 周：找口味'),
      ol(t('买 4 瓶不同品种：赤霞珠、黑皮诺、长相思、雷司令')),
      ol(t('每瓶慢慢喝，记下喜欢和不喜欢的')),
      ol(t('确定偏好：浓郁 vs 清爽、干型 vs 偏甜')),
      p(t('')),

      h2('🎯 第 3-4 周：探索产区'),
      ol(t('同一品种不同产区对比（法国 vs 澳洲赤霞珠）')),
      ol(t('试不同的食物搭配')),
      p(t('')),

      h2('🎯 第 2-3 月：提升'),
      ol(t('参加线下品酒会')),
      ol(t('买 200-400 元的酒感受品质提升')),
      ol(t('下载 Vivino APP 扫酒标看评分')),
      p(t('')),

      h2('📱 推荐工具'),
      li(b('Vivino：'), t('扫酒标看评分')),
      li(b('Wine-Searcher：'), t('查价格和评分')),
      li(b('小红书：'), t('搜"葡萄酒推荐"')),
      p(t('')),

      h2('🛒 在哪买酒'),
      li(b('线下：'), t('Ole\'精品超市、山姆、Costco')),
      li(b('电商：'), t('京东自营、天猫国际')),
      li(b('专业：'), t('也买酒、红酒世界')),
      li(it('避雷：朋友圈代购慎买，假酒重灾区')),
      p(t('')),

      quote(t('葡萄酒世界很大，不需要急着学完。\n每次打开一瓶新酒，都是一次小旅行。\n享受过程比记住知识点重要得多。\n\n干杯！🥂')),
    ],
  },

  // ═══ 11. 中餐配酒详细指南 ═══
  {
    title: '🥢 中餐配酒详细指南 —— 八大菜系怎么配',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200&q=80',
    blocks: [
      h1('中餐配酒详细指南'),
      p(t('中餐口味复杂，是全世界最难配酒的菜系。但掌握几个原则，你也能配得很好。')),
      p(t('')),

      h2('核心原则'),
      ol(b('酸度解油腻'), t(' —— 油大的菜配高酸的酒')),
      ol(b('甜度压辣味'), t(' —— 辣菜配微甜或果味浓的酒')),
      ol(b('轻配轻，重配重'), t(' —— 清淡的菜配轻酒体，浓味的菜配重酒体')),
      ol(b('气泡是万能'), t(' —— 不知道配什么就开起泡酒')),
      p(t('')),

      h2('🍜 粤菜（广东）'),
      p(t('清淡鲜美，讲究食材本味')),
      li(b('白切鸡/蒸鱼：'), t('长相思、夏布利（清爽不抢味）')),
      li(b('叉烧：'), t('黑皮诺（甜鲜碰撞）')),
      li(b('煲仔饭：'), t('中等酒体红酒（梅洛）')),
      li(b('点心/早茶：'), t('起泡酒、干型桃红')),
      p(t('')),

      h2('🌶️ 川菜/湘菜'),
      p(t('麻辣为主，酒精度高的酒会放大辣味')),
      li(b('火锅/麻辣烫：'), t('冰镇起泡酒（气泡清口）、半干雷司令')),
      li(b('水煮鱼/毛血旺：'), t('莫斯卡托（甜度压辣）')),
      li(b('回锅肉/辣子鸡：'), t('果味浓的马尔贝克或仙粉黛')),
      li(it('核心：辣菜 = 低酒精度 + 微甜/果味重')),
      p(t('')),

      h2('🍲 鲁菜/北方菜'),
      p(t('酱香浓郁，大味道')),
      li(b('红烧肉/东坡肉：'), t('赤霞珠、马尔贝克（浓对浓）')),
      li(b('糖醋鱼/锅包肉：'), t('半干雷司令（甜酸对甜酸）')),
      li(b('葱爆羊肉：'), t('西拉/设拉子（胡椒感配膻味）')),
      p(t('')),

      h2('🥬 江浙菜（淮扬菜）'),
      p(t('甜鲜为主，精致细腻')),
      li(b('东坡肉/红烧肉：'), t('梅洛、仙粉黛')),
      li(b('清蒸大闸蟹：'), t('干型雷司令、夏布利（高酸解蟹黄的腻）')),
      li(b('狮子头：'), t('黑皮诺')),
      li(b('小笼包：'), t('起泡酒')),
      p(t('')),

      h2('🍖 烧烤/东北菜'),
      li(b('烤串/烤肉：'), t('澳洲设拉子（果味+烟熏味绝配）')),
      li(b('锅包肉：'), t('半干白')),
      li(b('杀猪菜/酸菜炖粉条：'), t('果味浓的红酒或冰镇啤酒风格的起泡酒')),
      p(t('')),

      h2('🦆 北京烤鸭'),
      p(t('这道菜值得单独拎出来说：')),
      li(b('最佳搭配：'), t('勃艮第黑皮诺 —— 鸭肉和黑皮诺是全球公认的天作之合')),
      li(b('次选：'), t('桃红葡萄酒（清爽解腻）')),
      li(b('预算选择：'), t('新西兰或俄勒冈的黑皮诺（200元左右）')),
      p(t('')),

      quote(t('中餐配酒没有绝对的对错。以上只是参考，最好的搭配是你自己试出来的。\n建议：下次吃饭多带两瓶不同的酒，大家一起试，一起讨论，这才是最好的学习方式。')),
    ],
  },
];

// ─── 主流程 ──────────────────────────────────────────────────

const SPACE_ID = '7615178195469421499';
const PARENT_NODE = 'LaBgw4iypixpaFkrX9dcyV5Undh';

async function main() {
  console.log('🍷 开始扩展葡萄酒知识库子页面...\n');

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
    console.log(`\n[${ i + 1}/${SUB_PAGES.length}] 创建: ${page.title}`);

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

    // 2. 写入 blocks（如有图片占位）
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
        // 第一个 chunk 的第一个 block 如果是图片
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
          uploadImage(token, imageBlockId, buf, `wine_sub_${i}.jpg`);
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

  console.log('\n\n🎉 所有子页面创建完成！');
  console.log(`知识库首页：https://hcn2vc1r2jus.feishu.cn/wiki/${PARENT_NODE}`);
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
