/**
 * 审美提升知识库 - 飞书文档自动创建
 *
 * 基于贡布里希《艺术的故事》方法论，构建完整的审美认知体系
 * 包含：方法论内核 + 7大板块 + 定价策略 + 冷启动计划
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/create_aesthetic_kb.ts
 */

import * as fs from 'fs';
import * as path from 'path';

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

const { client } = require('../src/client') as typeof import('../src/client');

// ─── 飞书 Docx Block 工厂函数 ─────────────────────────────────────

type TextStyle = { bold?: boolean; italic?: boolean; inline_code?: boolean };

function textElement(content: string, style?: TextStyle) {
  return { text_run: { content, text_element_style: style ?? {} } };
}
function boldElement(content: string) {
  return textElement(content, { bold: true });
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

// ─── 知识库内容 ──────────────────────────────────────────────────

const blocks: any[] = [

  // ══════════════════════════════════════════
  // 产品定位
  // ══════════════════════════════════════════
  h1('审美提升知识库 - 产品设计方案'),
  paragraph(
    boldElement('一句话定位：'),
    textElement('用贡布里希的思维方式，教普通人「像艺术家一样思考」—— 看得懂、说得出、用得上')
  ),
  paragraph(
    boldElement('理论根基：'),
    textElement('贡布里希《艺术的故事》—— 世界上最畅销的艺术入门书的核心方法论，重新翻译成年轻人听得懂的语言')
  ),
  divider(),

  h2('不是什么'),
  bullet(textElement('不是美术史课程（不用背年代和流派）')),
  bullet(textElement('不是灵感图库（Pinterest 已经够了）')),
  bullet(textElement('不是穿搭/家居导购（不卖货）')),
  bullet(textElement('不是"什么是好品味"的说教（贡布里希说了：没有高低之分）')),

  h2('是什么'),
  paragraph(textElement('一套审美思维操作系统 —— 5个观看工具 + 3个追问习惯 + 跨品类案例库 + 日常迁移指南')),
  divider(),

  // ══════════════════════════════════════════
  // 方法论内核
  // ══════════════════════════════════════════
  h1('方法论内核：贡布里希式审美认知体系'),
  quote(
    textElement('融合贡布里希《艺术的故事》的核心思想，构建一套「去焦虑、有逻辑、能迁移」的审美方法论。'),
    textElement('\n不是教你记住哪幅画好看，而是教你「像艺术家一样思考」。')
  ),

  h2('贡布里希五个核心洞察'),

  h3('1. "没有大写的艺术，只有艺术家"'),
  bullet(boldElement('翻译：'), textElement('别怕"看不懂"——艺术不是考试，是一个人在解决一个问题')),
  bullet(boldElement('解决的焦虑：'), textElement('"我看不懂是不是我太笨了"')),

  h3('2. 每一代艺术家都在回应上一代的问题'),
  bullet(boldElement('翻译：'), textElement('艺术史不是一堆名字，是一场接力赛——知道前一棒，就懂后一棒')),
  bullet(boldElement('解决的焦虑：'), textElement('"记不住这么多流派和风格"')),

  h3('3. "图式与修正"——看见是学出来的'),
  bullet(boldElement('翻译：'), textElement('你的审美不是天生的，是可以训练的。训练方法：先有框架，再用眼睛去验证')),
  bullet(boldElement('解决的焦虑：'), textElement('"别人天生有品味，我没有"')),

  h3('4. 没有高低之分，只有不同的追求'),
  bullet(boldElement('翻译：'), textElement('埃及壁画不比文艺复兴"差"——它们在解决不同的问题')),
  bullet(boldElement('解决的焦虑：'), textElement('"我是不是品味不行"')),

  h3('5. 理解"为什么"比记住"是什么"重要'),
  bullet(boldElement('翻译：'), textElement('不用背知识点，只要能问对一个问题："这个艺术家在试图解决什么？"')),
  bullet(boldElement('解决的焦虑：'), textElement('"看完就忘，记不住"')),
  divider(),

  // ══════════════════════════════════════════
  // 三层看方法论
  // ══════════════════════════════════════════
  h1('方法论结构：三层看'),
  paragraph(textElement('原来的方法论是「先看比例 → 再看颜色 → 最后看内容」，现在升级为三层：')),

  h2('第一层：怎么看（形式工具箱）—— "它长什么样"'),
  paragraph(textElement('用眼睛观察作品的形式语言，不带任何预判：')),
  bullet(boldElement('比例与分割：'), textElement('画面怎么"切"的？大小块对称吗？—— 绘画/建筑/摄影/电影/平面')),
  bullet(boldElement('色彩关系：'), textElement('用了几种颜色？冲突还是和谐？—— 绘画/电影/时装/品牌/空间')),
  bullet(boldElement('材质与质感：'), textElement('表面是什么感觉？粗糙/光滑/透明/厚重？—— 建筑/时装/产品/家居/包装')),
  bullet(boldElement('留白与密度：'), textElement('空的地方多还是满的地方多？—— 平面/建筑/音乐/摄影/空间')),
  bullet(boldElement('节奏与重复：'), textElement('有没有重复的元素？规律还是打破规律？—— 建筑/音乐/纺织/字体/动线')),
  quote(textElement('这一层对应贡布里希的"图式"——先建立一套观看框架')),

  h2('第二层：为什么（贡布里希追问法）—— "它为什么长这样"'),
  paragraph(textElement('这是贡布里希方法论最核心的贡献。看完形式之后，问三个问题：')),

  h3('追问一：它在解决什么问题？'),
  bullet(textElement('每个艺术家/设计师都在回应一个具体的问题')),
  bullet(textElement('例：印象派在解决"怎么画出真实的光"；包豪斯在解决"工业时代怎么让日用品好看"；乔布斯在解决"科技产品为什么非得丑"')),
  bullet(boldElement('知道了问题，作品的选择就都说得通了')),

  h3('追问二：它在和谁对话？'),
  bullet(textElement('艺术不是凭空出现的，每件作品都在回应前人或反叛前人')),
  bullet(textElement('例：毕加索的立体主义是在回应"只能从一个角度画"的限制；极简主义是在反叛波普的过度装饰；无印良品是在反叛消费主义的logo崇拜')),
  bullet(boldElement('知道了对话对象，就能理解它为什么"长这样"')),

  h3('追问三：它放弃了什么？'),
  bullet(textElement('贡布里希说：每一次艺术进步都有代价。选择了A就放弃了B')),
  bullet(textElement('例：印象派获得了光影，但放弃了轮廓的清晰；极简设计获得了高级感，但放弃了信息密度；安藤忠雄获得了空间的纯粹，但放弃了装饰的温暖')),
  bullet(boldElement('理解了"放弃"，才真正理解了"选择"')),
  quote(textElement('这一层对应贡布里希的"修正"——用问题去校验你的观看')),

  h2('第三层：跟我有什么关系（生活迁移）—— "我能用上什么"'),
  paragraph(textElement('把前两层的洞察迁移到日常生活：')),
  bullet(textElement('这个审美原则怎么用在我的穿搭/拍照/家居/PPT上？')),
  bullet(textElement('我日常做的审美选择，其实在"解决什么问题"？')),
  bullet(textElement('我能不能像这个艺术家一样，有意识地选择和放弃？')),
  quote(textElement('这一层是贡布里希思想的生活化延伸——审美不是欣赏能力，是决策能力')),
  divider(),

  // ══════════════════════════════════════════
  // 知识库结构
  // ══════════════════════════════════════════
  h1('知识库结构（7大板块）'),

  h2('板块一：审美操作系统（入门必读）'),
  quote(textElement('融合贡布里希思想的认知框架，看完你就有了一双新眼睛')),
  paragraph(boldElement('开篇：三个让你放下焦虑的真相')),
  ordered(textElement('没有"看不懂"的艺术——你只是还没问对问题')),
  ordered(textElement('审美不是天赋，是可训练的观看方式')),
  ordered(textElement('不存在"品味高低"，只有"解决不同问题"')),
  paragraph(boldElement('核心方法：三层看')),
  bullet(textElement('第一层 5 个形式工具（比例/色彩/材质/留白/节奏）')),
  bullet(textElement('第二层 3 个追问（解决什么问题/和谁对话/放弃了什么）')),
  bullet(textElement('第三层 1 个迁移（跟我的生活有什么关系）')),
  paragraph(boldElement('5 条贡布里希金句（审美认知锚点）')),
  bullet(textElement('每条配一个日常案例，让用户记住并能在生活中随时调用')),
  paragraph(boldElement('每个模块包含：')),
  bullet(textElement('1 篇核心概念文章（2000字，配图丰富，跨品类举例）')),
  bullet(textElement('5 个案例拆解（绘画、建筑、影像、设计、日常各1个）')),
  bullet(textElement('1 个"今日练习"可操作任务')),
  bullet(textElement('1 张速查卡片（可保存到手机）')),
  divider(),

  h2('板块二：八大品类审美指南（核心内容区）'),
  quote(textElement('不只是看画，审美渗透在一切视觉体验中')),

  h3('1. 绘画与视觉艺术'),
  bullet(textElement('三层看一幅画：形式 → 追问 → 迁移')),
  bullet(textElement('艺术史是一场接力赛：从乔托到毕加索，每一棒在解决什么问题（贡布里希叙事线）')),
  bullet(textElement('抽象画不是"乱画"——它在解决"绘画一定要像真的吗"这个问题')),
  bullet(textElement('为什么有些画值几个亿：不是因为好看，是因为它第一个解决了某个问题')),

  h3('2. 建筑与空间'),
  bullet(textElement('走进一栋建筑先看什么：体量 → 材质 → 光线 → 动线')),
  bullet(textElement('安藤忠雄为什么只用清水混凝土')),
  bullet(textElement('中式园林 vs 日式庭院 vs 北欧极简：三种空间哲学')),
  bullet(textElement('逛商场时训练空间审美（宜家/Aesop/Apple Store 对比）')),

  h3('3. 电影与影像'),
  bullet(textElement('一帧电影画面的审美拆解：构图 + 色调 + 光影')),
  bullet(textElement('王家卫的颜色 vs 是枝裕和的光 vs 韦斯·安德森的对称')),
  bullet(textElement('为什么有些短视频一看就"高级"')),
  bullet(textElement('用电影思维拍 vlog：景别、运镜、调色')),

  h3('4. 摄影'),
  bullet(textElement('手机摄影构图 5 法')),
  bullet(textElement('食物/人像/街拍/风景的审美要点各不同')),
  bullet(textElement('为什么你的照片总像"游客照"')),
  bullet(textElement('后期调色的审美逻辑（不是滤镜越多越好）')),

  h3('5. 平面与品牌设计'),
  bullet(textElement('一个 logo 为什么好看：几何感、留白、字体')),
  bullet(textElement('海报设计的视觉层级（你的眼睛先看哪里）')),
  bullet(textElement('为什么 Supreme 只用红白就封神')),
  bullet(textElement('日常能碰到的好设计：地铁标识/咖啡杯/书封面')),

  h3('6. 时装与穿搭'),
  bullet(textElement('3 色原则 / 材质统一法 / 身材比例视觉修正')),
  bullet(textElement('时装秀在看什么（不是看衣服，是看概念）')),
  bullet(textElement('快时尚 vs 设计师品牌的审美差距在哪')),
  bullet(textElement('山本耀司/川久保玲/三宅一生的设计哲学（读懂日本时装）')),

  h3('7. 产品与工业设计'),
  bullet(textElement('为什么苹果的产品"一眼就知道是苹果"')),
  bullet(textElement('好的产品设计 = 好用 + 好看 + 好摸')),
  bullet(textElement('包装设计的审美：开箱体验是怎么被设计出来的')),
  bullet(textElement('从宜家到 Vitra：家具审美的段位')),

  h3('8. 音乐与听觉审美（跨感官拓展）'),
  bullet(textElement('审美不只是视觉：旋律的比例、节奏的留白')),
  bullet(textElement('为什么坂本龙一的音乐听起来"干净"')),
  bullet(textElement('空间与声音的关系：教堂/音乐厅/咖啡馆')),
  bullet(textElement('给你的日常配一首"审美背景音乐"')),

  paragraph(boldElement('每个品类格式统一：'), textElement('入门概念 → 拆解方法 → 经典案例 → 日常练习')),
  divider(),

  h2('板块三：场景应用指南（实用刚需）'),
  quote(textElement('把框架落地到具体生活场景')),
  bullet(boldElement('拍照篇：'), textElement('手机摄影构图 5 法 / 食物怎么拍好看 / 旅行照避免游客感')),
  bullet(boldElement('穿搭篇：'), textElement('3 色原则 / 材质统一法 / 身材比例视觉修正')),
  bullet(boldElement('家居篇：'), textElement('租房也能有质感 / 小空间收纳美学 / 灯光是最便宜的装修')),
  bullet(boldElement('社交篇：'), textElement('朋友圈九宫格排版 / 逛展怎么看+怎么发 / 送礼审美')),
  bullet(boldElement('职场篇：'), textElement('PPT 视觉急救 / 简历排版 / 工位布置')),
  paragraph(boldElement('每个场景：'), textElement('问题 → 原理 → 步骤 → before/after 对比')),
  divider(),

  h2('板块四：经典拆解（每周更新，轮转品类）'),
  quote(textElement('用审美框架拆解各品类经典作品，积累跨领域审美直觉')),
  paragraph(textElement('每周 2 篇，8 个品类轮转（每月每个品类至少 1 篇）：')),
  bullet(boldElement('第 1 周：'), textElement('绘画《神奈川冲浪里》的比例与力量 / 建筑：光之教堂的一道缝为什么震撼')),
  bullet(boldElement('第 2 周：'), textElement('电影《花样年华》一帧画面的色彩心理 / 产品：AirPods 包装的开箱设计')),
  bullet(boldElement('第 3 周：'), textElement('摄影：薇薇安·迈尔的街拍为什么耐看 / 时装：一件 ISSEY MIYAKE 褶皱裙的几何美学')),
  bullet(boldElement('第 4 周：'), textElement('平面：纽约地铁标识系统的极简逻辑 / 音乐+空间：为什么 Blue Note 爵士封面这么经典')),
  paragraph(boldElement('每篇拆解格式（对应三层看）：')),
  ordered(boldElement('第一层 · 形式：'), textElement('比例/色彩/材质/留白/节奏，用眼睛看到了什么')),
  ordered(boldElement('第二层 · 追问：'), textElement('它在解决什么问题？和谁对话？放弃了什么？（贡布里希三问）')),
  ordered(boldElement('第三层 · 迁移：'), textElement('这个审美洞察怎么用到你的日常')),
  divider(),

  h2('板块五：审美词典（速查工具）'),
  quote(textElement('100 个审美关键词，每个 60 秒读完，跨品类举例')),
  paragraph(textElement('格式：关键词 → 一句话定义 → 跨品类例子')),
  bullet(boldElement('留白：'), textElement('不是空，是让重要的东西更重要。苹果官网 / 枯山水 / 德彪西的停顿 / 一张白底海报')),
  bullet(boldElement('对比：'), textElement('差异产生注意力。黑衣配红唇 / 清水混凝土配暖木 / 安静电影里突然的一声响')),
  bullet(boldElement('呼应：'), textElement('远处的细节和近处产生关联。围巾和袜子同色 / 建筑立面和室内地砖同材质 / 电影开头和结尾的同一个镜头')),
  bullet(boldElement('张力：'), textElement('快要崩但没崩的那个状态。巨浪将落未落 / 高跟鞋的倾斜角度 / 悬疑片的最后十分钟')),
  divider(),

  h2('板块六：审美日历（持续更新，品类轮转）'),
  quote(textElement('每天一个审美灵感，碎片时间也能涨审美')),
  paragraph(boldElement('每日一赏：'), textElement('一张图/一段视频/一首曲子 + 50 字点评（为什么好看/好听）')),
  bullet(textElement('周一绘画 / 周二建筑 / 周三电影 / 周四摄影 / 周五设计 / 周六时装 / 周日自由')),
  paragraph(boldElement('每周一问：'), textElement('一个跨品类思考题')),
  bullet(textElement('"星巴克和蓝瓶咖啡的空间设计差在哪？"')),
  bullet(textElement('"为什么故宫的红墙配黄瓦这么经典？"')),
  paragraph(boldElement('每月推荐：'), textElement('当月值得看的展览/电影/建筑/快闪店，附审美框架预习')),
  divider(),

  h2('板块七：工具包（会员专属）'),
  quote(textElement('拿来就用的实用资源')),
  bullet(textElement('配色卡合集（按场景分类：穿搭/家居/PPT/摄影后期）')),
  bullet(textElement('手机修图预设参数（VSCO/Lightroom 调色参考）')),
  bullet(textElement('逛展/看电影/逛建筑 记录模板')),
  bullet(textElement('审美自测表（视觉/空间/色彩/风格四维雷达图）')),
  bullet(textElement('城市审美散步路线（北京/上海/杭州/成都，标注值得看的建筑/店铺/街区）')),
  divider(),

  // ══════════════════════════════════════════
  // 定价策略
  // ══════════════════════════════════════════
  h1('定价策略'),
  h3('年卡：199 元/年'),
  bullet(textElement('全部 7 个板块 + 持续更新')),
  h3('季卡：79 元/季'),
  bullet(textElement('全部内容，按季付费')),
  h3('终身卡（早鸟）：399 元'),
  bullet(textElement('前 100 名限定，永久更新')),

  paragraph(boldElement('定价逻辑：')),
  bullet(textElement('199 元/年 = 0.55 元/天，低于一瓶水')),
  bullet(textElement('高于免费内容（小红书/B站），因为有结构化框架和持续更新')),
  bullet(textElement('低于线上课程（通常 299-999），因为是知识库不是课，没有直播/答疑的人力成本')),
  bullet(textElement('终身卡用于冷启动，制造紧迫感')),
  divider(),

  // ══════════════════════════════════════════
  // 更新节奏
  // ══════════════════════════════════════════
  h1('更新节奏'),
  bullet(boldElement('名作拆解：'), textElement('每周 1-2 篇，1-2 小时/篇')),
  bullet(boldElement('审美日历：'), textElement('每日更新，批量制作，15 分钟/条')),
  bullet(boldElement('场景指南：'), textElement('每月 2-3 篇，3-4 小时/篇')),
  bullet(boldElement('审美词典：'), textElement('积累到 100 个后低频更新，20 分钟/词条')),
  bullet(boldElement('工具包：'), textElement('每季度更新，集中制作')),
  divider(),

  // ══════════════════════════════════════════
  // 获客漏斗
  // ══════════════════════════════════════════
  h1('获客漏斗'),
  ordered(boldElement('小红书免费内容'), textElement('（审美框架帖）')),
  ordered(boldElement('私域引流'), textElement('（评论区 → 微信/企微）')),
  ordered(boldElement('免费试读 3 篇'), textElement('（建立信任）')),
  ordered(boldElement('知识库付费订阅'), textElement('（199 元/年）')),
  ordered(boldElement('持续增长'), textElement('（老用户续费 + 推荐返利）')),
  divider(),

  // ══════════════════════════════════════════
  // 冷启动计划
  // ══════════════════════════════════════════
  h1('冷启动计划'),
  bullet(boldElement('第 1-2 周：'), textElement('写完板块一（审美操作系统）+ 板块五（前 30 个词条）→ 知识库有基础内容量')),
  bullet(boldElement('第 3-4 周：'), textElement('写 5 篇场景指南 + 5 篇名作拆解 → 内容够丰富可以开卖')),
  bullet(boldElement('第 5 周起：'), textElement('开始卖，同时保持更新节奏')),
  bullet(boldElement('早鸟策略：'), textElement('前 50 名用户 99 元早鸟价，换取真实反馈和口碑传播')),

];

// ─── 向 Docx 文档写入 blocks ────────────────────────────────────

async function writeBlocks(documentId: string, blocks: any[]) {
  const chunkSize = 50;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const res = await client.docx.documentBlockChildren.create({
      path: { document_id: documentId, block_id: documentId },
      data: { children: chunk },
    } as any);
    if (res.code !== 0) {
      console.error(`  写入blocks失败 (${i}-${i + chunk.length}):`, res.msg, res.code);
    }
  }
}

// ─── 主流程 ──────────────────────────────────────────────────────

async function main() {
  console.log('开始创建「审美提升知识库」飞书文档...\n');

  const docRes = await (client.docx.document as any).create({
    data: { title: '审美提升知识库 - 产品设计方案（贡布里希方法论）' }
  });

  if (docRes.code !== 0) {
    console.error('创建文档失败:', docRes.msg, '| code:', docRes.code);
    return;
  }

  const docId = docRes.data?.document?.document_id!;
  console.log('文档创建成功，开始写入内容...');

  await writeBlocks(docId, blocks);

  const url = `https://hcn2vc1r2jus.feishu.cn/docx/${docId}`;
  console.log('\n全部完成！');
  console.log('─'.repeat(50));
  console.log(`文档地址：${url}`);
  console.log('─'.repeat(50));
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
