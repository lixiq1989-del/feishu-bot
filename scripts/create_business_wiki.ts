/**
 * 商科留学知识库 - 飞书文档自动创建
 *
 * 覆盖 6 大留学目的地：美国 / 英国 / 法国 / 新加坡 / 香港 / 澳大利亚
 * 每个地区包含：院校概览、热门项目、申请要求、费用、签证、就业
 * 另有跨地区通用模块：选校策略、标化考试、文书、时间线
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/create_business_wiki.ts
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

// ─── 知识库内容定义 ──────────────────────────────────────────────

const pages: Array<{
  title: string;
  parent?: string;
  blocks: any[];
}> = [

  // ══════════════════════════════════════════
  // 0. 导读
  // ══════════════════════════════════════════
  {
    title: '商科留学知识库 · 导读',
    blocks: [
      h1('商科留学完全指南'),
      paragraph(
        textElement('这是一份面向 '),
        boldElement('中国学生'),
        textElement(' 的商科留学系统知识库，覆盖全球 6 大热门留学目的地。')
      ),
      paragraph(textElement(
        '无论你是大二开始规划、大四紧急申请、还是工作几年后想读 MBA，'
        + '这里都有你需要的信息。'
      )),
      divider(),

      h2('覆盖地区'),
      bullet(boldElement('美国'), textElement(' — M7 商学院、T15 MBA、金融硕士、商业分析')),
      bullet(boldElement('英国'), textElement(' — LBS、牛剑、帝国理工、华威，1 年制硕士')),
      bullet(boldElement('法国/欧洲'), textElement(' — HEC、ESSEC、ESCP，Grande Ecole 体系')),
      bullet(boldElement('新加坡'), textElement(' — NUS、NTU、SMU，亚洲金融中心')),
      bullet(boldElement('中国香港'), textElement(' — 港大、港科、港中文，背靠大湾区')),
      bullet(boldElement('澳大利亚'), textElement(' — 墨大、UNSW、悉尼大学，移民友好')),
      divider(),

      h2('知识库结构'),
      ordered(boldElement('地区篇'), textElement(' — 每个地区一个完整模块：院校、项目、申请、费用、签证、就业')),
      ordered(boldElement('通用篇'), textElement(' — 跨地区适用：选校策略、标化考试、文书写作、时间线规划')),
      ordered(boldElement('对比篇'), textElement(' — 多地区横向对比，帮你做最终决策')),
      divider(),

      h2('使用建议'),
      ordered(textElement('先读「选校策略」，明确自己的定位和目标')),
      ordered(textElement('精读 1-2 个目标地区的完整模块')),
      ordered(textElement('用「对比篇」做最终决策')),
      ordered(textElement('按「时间线」倒推，开始行动')),
      divider(),
      quote(
        boldElement('核心理念：'),
        textElement('商科留学不是选一所学校，是选一条职业路径。先想清楚"毕业后做什么"，再决定"去哪读"。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 1. 美国篇
  // ══════════════════════════════════════════
  {
    title: '美国商科留学 · 总览',
    blocks: [
      h1('美国商科留学完全指南'),
      paragraph(textElement(
        '美国拥有全球最强的商学院体系。MBA 发源地，金融硕士、商业分析等专业硕士项目也极具竞争力。'
        + '对于追求顶尖教育资源和国际化职业发展的学生，美国是首选。'
      )),
      divider(),

      h2('一、为什么选美国'),
      bullet(textElement('全球商学院排名前 20 中，美国占 12-15 席')),
      bullet(textElement('MBA 是职业转型最强跳板，咨询/金融/科技三大行业校招体系成熟')),
      bullet(textElement('STEM 认证项目可获 3 年 OPT，在美就业机会最大化')),
      bullet(textElement('校友网络全球最强，终身受益')),
      divider(),

      h2('二、顶尖商学院一览'),
      h3('M7（最顶尖七校）'),
      ordered(boldElement('Harvard Business School (HBS)'), textElement(' — 案例教学鼻祖，通用管理之王')),
      ordered(boldElement('Stanford GSB'), textElement(' — 创业圣地，硅谷核心')),
      ordered(boldElement('Wharton (UPenn)'), textElement(' — 金融最强，规模最大')),
      ordered(boldElement('Chicago Booth'), textElement(' — 学术最强，灵活选课')),
      ordered(boldElement('Kellogg (Northwestern)'), textElement(' — 营销之王，团队文化')),
      ordered(boldElement('Columbia Business School'), textElement(' — 纽约核心，金融投行')),
      ordered(boldElement('MIT Sloan'), textElement(' — 科技+金融，创新驱动')),

      h3('T8-T15'),
      bullet(boldElement('Haas (UC Berkeley)'), textElement(' — 湾区位置，创业文化')),
      bullet(boldElement('Yale SOM'), textElement(' — 社会影响力，非营利')),
      bullet(boldElement('Stern (NYU)'), textElement(' — 纽约心脏，金融+奢侈品')),
      bullet(boldElement('Tuck (Dartmouth)'), textElement(' — 小而精，校友网络紧密')),
      bullet(boldElement('Fuqua (Duke)'), textElement(' — Team Fuqua 文化，医疗管理强')),
      bullet(boldElement('Ross (Michigan)'), textElement(' — Action-based learning')),
      bullet(boldElement('Darden (UVA)'), textElement(' — 案例教学，通用管理')),
      bullet(boldElement('Anderson (UCLA)'), textElement(' — 洛杉矶，娱乐+科技')),
      divider(),

      h2('三、热门项目类型'),
      h3('Full-time MBA（2 年制）'),
      bullet(textElement('学制：2 年（部分可 accelerated 16 个月）')),
      bullet(textElement('工作经验：平均 5 年，范围 3-7 年')),
      bullet(textElement('适合：职业转型、加速晋升')),
      bullet(textElement('学费：2 年约 $150,000-$170,000')),

      h3('金融硕士 (MFin/MSF)'),
      bullet(textElement('代表项目：MIT MFin、Princeton MFin、Vanderbilt MSF')),
      bullet(textElement('学制：10-18 个月')),
      bullet(textElement('适合：金融/经济背景，目标投行/资管')),
      bullet(textElement('多数有 STEM 认证')),

      h3('商业分析 (MSBA/MBAn)'),
      bullet(textElement('代表项目：MIT MBAn、UCLA MSBA、UT Austin MSBA、Duke MQM')),
      bullet(textElement('学制：10-12 个月')),
      bullet(textElement('适合：数理背景，目标数据/科技/咨询')),
      bullet(textElement('几乎全部 STEM 认证')),

      h3('管理学硕士 (MiM/MMS)'),
      bullet(textElement('代表项目：Duke MMS、Michigan MAcc')),
      bullet(textElement('学制：10-12 个月')),
      bullet(textElement('适合：应届生，无需工作经验')),
      divider(),

      h2('四、申请要求'),
      h3('GMAT/GRE'),
      bullet(textElement('M7 MBA：GMAT 均值 730+，建议中国学生 740+')),
      bullet(textElement('T8-T15 MBA：GMAT 均值 710-730，建议 720+')),
      bullet(textElement('专业硕士：GMAT 700+ 或 GRE 325+')),
      bullet(textElement('GMAT Focus Edition（新版）已全面推行，总分 205-805')),

      h3('语言成绩'),
      bullet(textElement('TOEFL：Top 10 建议 105+（口语 25+）；Top 15 建议 100+')),
      bullet(textElement('IELTS：建议 7.5+（口语 7.0+）')),

      h3('GPA'),
      bullet(textElement('M7：建议 3.7+/4.0（国内 88+）')),
      bullet(textElement('T8-T15：建议 3.5+/4.0（国内 85+）')),
      bullet(textElement('985/211 院校有一定加分')),

      h3('其他材料'),
      bullet(textElement('推荐信：MBA 需 2 封（至少 1 封直属上司）')),
      bullet(textElement('文书：每校 1-3 篇，核心考察 career goals + why this school')),
      bullet(textElement('面试：多数 MBA 为邀请制，部分可主动申请')),
      divider(),

      h2('五、申请时间线（秋季入学）'),
      bullet(boldElement('Round 1'), textElement('：9 月初 — 录取率最高，国际生强烈建议 R1')),
      bullet(boldElement('Round 2'), textElement('：1 月初 — 主力轮次，竞争最激烈')),
      bullet(boldElement('Round 3'), textElement('：3-4 月 — 名额有限，不推荐国际生')),
      paragraph(textElement('专业硕士项目通常采用滚动录取或 2-4 轮截止日期。')),
      divider(),

      h2('六、费用概览'),
      h3('学费'),
      bullet(textElement('MBA（2 年）：$150,000-$170,000')),
      bullet(textElement('MFin/MSF：$55,000-$90,000')),
      bullet(textElement('MSBA：$55,000-$85,000')),

      h3('生活费（月均）'),
      bullet(textElement('纽约/旧金山：$3,000-$5,000')),
      bullet(textElement('波士顿/洛杉矶：$2,500-$4,000')),
      bullet(textElement('芝加哥/费城：$2,000-$3,500')),
      bullet(textElement('小城市（Ann Arbor 等）：$1,500-$2,500')),

      h3('奖学金'),
      bullet(textElement('Merit-based：Top MBA 大多提供，覆盖 25%-100% 学费')),
      bullet(textElement('Booth/Kellogg/Stern 较慷慨；HBS/Stanford 主要 need-based')),
      bullet(textElement('专业硕士奖学金较少，$5,000-$30,000 不等')),
      divider(),

      h2('七、签证与工作'),
      h3('OPT（毕业后工作许可）'),
      bullet(textElement('普通 OPT：12 个月')),
      bullet(textElement('STEM OPT 延期：额外 24 个月')),
      bullet(boldElement('STEM 项目总计可获 36 个月工作时间'), textElement(' — 选校时务必确认 STEM 认证')),

      h3('H-1B 工作签证'),
      bullet(textElement('年度配额 85,000，中签率约 25-30%/次')),
      bullet(textElement('STEM OPT 期间可参加 3 次抽签，累计中签率约 60-70%')),
      bullet(textElement('咨询公司（MBB）和大型科技公司通常 Day 1 sponsor')),

      h3('MBA 就业数据'),
      bullet(textElement('M7 平均起薪：$175,000-$190,000 + 签约奖金 $30,000+')),
      bullet(textElement('3 个月就业率：90-95%')),
      bullet(textElement('主要行业：咨询 30% / 金融 25% / 科技 25%')),
      divider(),

      h2('八、中国学生专属建议'),
      ordered(boldElement('STEM 认证是选校第一考量'), textElement(' — 直接影响你能否留美工作')),
      ordered(boldElement('Round 1 申请'), textElement(' — 国际生 R1 录取率显著高于 R2')),
      ordered(boldElement('差异化定位'), textElement(' — 避免"金融+实习+高分"的同质化简历')),
      ordered(boldElement('口语是面试生命线'), textElement(' — Mock interview 至少 10 次')),
      ordered(boldElement('选校要分层'), textElement(' — Dream 2-3 / Target 3-4 / Safety 2-3')),
      divider(),
      quote(
        boldElement('一句话总结：'),
        textElement('美国商科 = 最强资源 + 最高学费 + 最复杂签证。适合目标明确、愿意投入的申请者。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 2. 英国篇
  // ══════════════════════════════════════════
  {
    title: '英国商科留学 · 总览',
    blocks: [
      h1('英国商科留学完全指南'),
      paragraph(textElement(
        '英国是中国学生商科留学的第二大目的地。1 年制硕士时间短、性价比高，'
        + '加上 PSW 签证恢复，近年热度持续上升。'
      )),
      divider(),

      h2('一、为什么选英国'),
      bullet(textElement('1 年制硕士，时间成本低，快速拿学位')),
      bullet(textElement('伦敦 = 欧洲金融中心，金融就业机会丰富')),
      bullet(textElement('PSW 签证（Graduate Route）：毕业后可留英工作 2 年')),
      bullet(textElement('QS 排名友好，对回国求职有帮助')),
      bullet(textElement('不需要 GMAT/GRE 的项目较多（专业硕士）')),
      divider(),

      h2('二、顶尖商学院'),
      h3('第一梯队'),
      ordered(boldElement('London Business School (LBS)'), textElement(' — 欧洲 MBA 第一，金融就业无敌')),
      ordered(boldElement('Oxford Said'), textElement(' — 牛津品牌，1 年 MBA，金融+咨询')),
      ordered(boldElement('Cambridge Judge'), textElement(' — 剑桥品牌，创业生态强')),

      h3('第二梯队'),
      bullet(boldElement('Imperial College Business School'), textElement(' — 理工科背景强，金融+分析')),
      bullet(boldElement('Warwick Business School (WBS)'), textElement(' — 金融硕士全英第一')),
      bullet(boldElement('LSE'), textElement(' — 社科之王，金融/经济学术声誉极高')),
      bullet(boldElement('Manchester Alliance'), textElement(' — 工业城市，性价比高')),
      bullet(boldElement('Edinburgh Business School'), textElement(' — 苏格兰第一，排名稳定')),
      bullet(boldElement('KCL King\'s Business School'), textElement(' — 伦敦位置，新兴崛起')),
      bullet(boldElement('Cass / Bayes (City, University of London)'), textElement(' — 金融城心脏，精算/金融强')),
      divider(),

      h2('三、热门项目'),
      h3('MBA'),
      bullet(textElement('LBS MBA：15-21 个月，学费约 £100,000，GMAT 均值 710')),
      bullet(textElement('Oxford MBA：1 年制，学费约 £69,000，GMAT 均值 690')),
      bullet(textElement('Cambridge MBA：1 年制，学费约 £67,000，GMAT 均值 690')),

      h3('金融硕士 (MSc Finance)'),
      bullet(boldElement('LBS MFin'), textElement('：10-16 个月，需工作经验，学费约 £52,000')),
      bullet(boldElement('Oxford MSc Financial Economics'), textElement('：9 个月，学费约 £52,000')),
      bullet(boldElement('LSE MSc Finance'), textElement('：10 个月，学费约 £42,000')),
      bullet(boldElement('Imperial MSc Finance'), textElement('：1 年，学费约 £40,000')),
      bullet(boldElement('Warwick MSc Finance'), textElement('：1 年，学费约 £38,000')),
      bullet(boldElement('Cambridge MPhil Finance'), textElement('：1 年，学费约 £48,000')),

      h3('管理学硕士 (MSc Management / MiM)'),
      bullet(textElement('LBS MiM：适合应届生，FT 排名全球前 5')),
      bullet(textElement('LSE MSc Management：1 年，学术导向')),
      bullet(textElement('Imperial MSc Management：1 年，带实习选项')),
      bullet(textElement('Warwick MSc Management：1 年，性价比高')),

      h3('商业分析 (MSc Business Analytics)'),
      bullet(textElement('Imperial MSc Business Analytics：1 年，数据+商业')),
      bullet(textElement('Manchester MSc Business Analytics：1 年')),
      bullet(textElement('Warwick MSc Business Analytics：1 年')),
      bullet(textElement('UCL MSc Business Analytics：1 年')),
      divider(),

      h2('四、申请要求'),
      h3('学术背景'),
      bullet(textElement('顶尖项目（LBS/Oxford/Cambridge）：985/211 均分 85+，双非 88-90+')),
      bullet(textElement('第二梯队：985/211 均分 80+，双非 85+')),
      bullet(textElement('英国对本科院校背景较敏感，部分学校有"认可院校名单"')),

      h3('GMAT/GRE'),
      bullet(textElement('MBA 项目：必须提交，LBS 建议 700+，Oxford/Cambridge 680+')),
      bullet(textElement('金融硕士：LBS/Oxford 需要，LSE/Imperial/Warwick 推荐但非必须')),
      bullet(textElement('管理学/分析硕士：多数不要求 GMAT')),

      h3('语言成绩'),
      bullet(textElement('IELTS：总分 7.0+，单项 6.5+（LBS/Oxford 要求 7.5）')),
      bullet(textElement('TOEFL：100+（部分学校更偏好 IELTS）')),

      h3('其他'),
      bullet(textElement('推荐信：1-2 封（学术或职业）')),
      bullet(textElement('PS/文书：1 篇 Personal Statement，部分学校有额外 essay')),
      bullet(textElement('面试：顶尖项目多为邀请制')),
      divider(),

      h2('五、申请时间线'),
      bullet(boldElement('9-10 月'), textElement('：第一轮开放，部分项目滚动录取')),
      bullet(boldElement('11-1 月'), textElement('：主要申请高峰，热门项目建议此时提交')),
      bullet(boldElement('2-4 月'), textElement('：后续轮次，部分项目已满')),
      bullet(boldElement('6-7 月'), textElement('：最后补录机会')),
      paragraph(textElement('英国多数项目采用滚动录取（Rolling Admission），先到先得，建议尽早申请。')),
      divider(),

      h2('六、费用概览'),
      h3('学费'),
      bullet(textElement('MBA：£60,000-£100,000')),
      bullet(textElement('MSc Finance：£35,000-£52,000')),
      bullet(textElement('MSc Management：£30,000-£45,000')),
      bullet(textElement('MSc 商业分析：£30,000-£42,000')),

      h3('生活费（月均）'),
      bullet(textElement('伦敦：£1,500-£2,500')),
      bullet(textElement('其他城市（曼城/爱丁堡/华威）：£1,000-£1,500')),
      bullet(textElement('英国官方建议：伦敦 £1,334/月，非伦敦 £1,023/月（签证最低要求）')),

      h3('1 年总费用估算'),
      bullet(textElement('伦敦顶尖项目：£60,000-£80,000（约 55-70 万人民币）')),
      bullet(textElement('非伦敦项目：£40,000-£55,000（约 35-50 万人民币）')),
      divider(),

      h2('七、签证与工作'),
      h3('学生签证 (Student Visa)'),
      bullet(textElement('签证费：£490')),
      bullet(textElement('IHS 医疗附加费：£776/年')),
      bullet(textElement('在读期间可打工 20 小时/周')),

      h3('毕业生签证 (Graduate Route / PSW)'),
      bullet(boldElement('硕士毕业：2 年工作签证'), textElement('，无需雇主担保')),
      bullet(textElement('博士毕业：3 年')),
      bullet(textElement('可自由就业，无行业/薪资限制')),
      bullet(textElement('到期后可转 Skilled Worker Visa（需雇主担保，年薪 £38,700+）')),

      h3('就业数据'),
      bullet(textElement('LBS MBA 平均起薪：£90,000-£100,000')),
      bullet(textElement('MSc Finance 起薪：£45,000-£65,000')),
      bullet(textElement('主要行业：金融服务、咨询、科技')),
      bullet(textElement('伦敦金融城 + 金丝雀码头 = 欧洲最大金融就业市场')),
      divider(),

      h2('八、中国学生建议'),
      ordered(boldElement('尽早申请'), textElement(' — 滚动录取意味着越早越有优势')),
      ordered(boldElement('院校名单'), textElement(' — 确认目标学校是否接受你的本科院校')),
      ordered(boldElement('实习至关重要'), textElement(' — 英国 1 年硕士期间实习机会少，建议提前准备')),
      ordered(boldElement('PSW 要珍惜'), textElement(' — 2 年时间要主动找工作，不要浪费')),
      ordered(boldElement('回国认可度'), textElement(' — QS 前 100 院校回国最有竞争力')),
      divider(),
      quote(
        boldElement('一句话总结：'),
        textElement('英国商科 = 时间短 + 排名好 + PSW 加持。适合追求效率和性价比的申请者。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 3. 法国/欧洲篇
  // ══════════════════════════════════════════
  {
    title: '法国/欧洲商科留学 · 总览',
    blocks: [
      h1('法国/欧洲商科留学完全指南'),
      paragraph(textElement(
        '法国拥有全球顶尖的商学院体系（Grande Ecole），HEC Paris 常年位居全球前 5。'
        + '欧洲商学院的国际化程度极高，学费相对英美更低，是性价比之选。'
      )),
      divider(),

      h2('一、为什么选法国/欧洲'),
      bullet(textElement('HEC Paris、INSEAD 全球顶尖，FT 排名长期前 5')),
      bullet(textElement('学费比英美低 30-50%，部分公立学校几乎免费')),
      bullet(textElement('Grande Ecole 学位在欧洲认可度极高')),
      bullet(textElement('申根签证覆盖 27 国，实习和就业选择广')),
      bullet(textElement('毕业后可获 1-2 年工作签证（Talent Passport）')),
      bullet(textElement('生活成本比伦敦/纽约低')),
      divider(),

      h2('二、顶尖商学院'),
      h3('法国'),
      ordered(boldElement('HEC Paris'), textElement(' — 法国第一，全球 MBA 前 5，MiM 第一')),
      ordered(boldElement('INSEAD'), textElement(' — 1 年制 MBA，全球最国际化（枫丹白露+新加坡双校区）')),
      ordered(boldElement('ESSEC Business School'), textElement(' — 巴黎，MiM/金融强')),
      ordered(boldElement('ESCP Business School'), textElement(' — 欧洲最古老商学院，6 国校区')),
      ordered(boldElement('EDHEC'), textElement(' — 金融硕士强，里尔/尼斯')),
      ordered(boldElement('emlyon Business School'), textElement(' — 里昂，创业+数字化')),
      ordered(boldElement('SKEMA'), textElement(' — 多校区（法国/中国/美国/巴西）')),

      h3('其他欧洲'),
      bullet(boldElement('IE Business School'), textElement(' — 西班牙马德里，创业之王')),
      bullet(boldElement('IESE'), textElement(' — 西班牙巴塞罗那，案例教学')),
      bullet(boldElement('SDA Bocconi'), textElement(' — 意大利米兰，时尚/奢侈品管理')),
      bullet(boldElement('Rotterdam School of Management (RSM)'), textElement(' — 荷兰，供应链/物流')),
      bullet(boldElement('St. Gallen'), textElement(' — 瑞士，MiM 全球前 3')),
      bullet(boldElement('Mannheim Business School'), textElement(' — 德国，MBA 德国第一')),
      divider(),

      h2('三、热门项目'),
      h3('Master in Management (MiM / Grande Ecole)'),
      paragraph(textElement(
        'MiM 是欧洲商学院的王牌项目，适合应届生或少量工作经验者。'
        + 'FT 全球 MiM 排名前 10 中，法国学校占 4-5 席。'
      )),
      bullet(boldElement('HEC MiM (Grande Ecole)'), textElement('：2 年，学费约 €50,000，FT 排名 #1')),
      bullet(boldElement('ESSEC Grande Ecole'), textElement('：2-3 年（含实习），学费约 €45,000')),
      bullet(boldElement('ESCP MiM'), textElement('：2 年，可选 2-3 个校区轮换，学费约 €40,000')),

      h3('MBA'),
      bullet(boldElement('INSEAD MBA'), textElement('：1 年（10 个月），学费约 €98,000，GMAT 均值 710')),
      bullet(boldElement('HEC MBA'), textElement('：16 个月，学费约 €82,000，GMAT 均值 690')),
      bullet(boldElement('IE MBA'), textElement('：1 年，学费约 €75,000')),
      bullet(boldElement('IESE MBA'), textElement('：15 个月，学费约 €95,000')),

      h3('金融硕士 (MSc Finance)'),
      bullet(boldElement('HEC MSc International Finance'), textElement('：10 个月，FT 金融硕士排名前 3')),
      bullet(boldElement('ESSEC MSc in Finance'), textElement('：1 年')),
      bullet(boldElement('EDHEC MSc in Finance'), textElement('：1 年，CFA 合作项目')),

      h3('其他热门项目'),
      bullet(textElement('HEC MSc Marketing / MSc Strategic Management')),
      bullet(textElement('ESSEC MSc in Data Sciences & Business Analytics')),
      bullet(textElement('Bocconi MSc in Finance / Management')),
      bullet(textElement('ESCP MSc in Digital Project Management & Consulting')),
      divider(),

      h2('四、申请要求'),
      h3('MiM / Grande Ecole'),
      bullet(textElement('GPA：985/211 均分 80+，双非 85+')),
      bullet(textElement('GMAT：HEC 建议 700+，ESSEC/ESCP 650+')),
      bullet(textElement('语言：雅思 7.0+ 或托福 100+；部分法语授课项目需 DELF B2')),
      bullet(textElement('实习/课外活动经历被高度重视')),

      h3('MBA'),
      bullet(textElement('工作经验：INSEAD 平均 6 年，HEC 平均 5-6 年')),
      bullet(textElement('GMAT：INSEAD 建议 700+，HEC 680+')),
      bullet(textElement('面试：多轮，包括小组面试和个人面试')),

      h3('申请时间线'),
      bullet(textElement('多数项目采用 3-5 轮截止日期')),
      bullet(textElement('第 1-2 轮（10-12 月）录取率最高')),
      bullet(textElement('INSEAD 有 8-9 月、11 月、1 月、3 月四轮')),
      divider(),

      h2('五、费用概览'),
      h3('学费'),
      bullet(textElement('MiM / Grande Ecole：€30,000-€50,000（2 年总计）')),
      bullet(textElement('MBA：€70,000-€98,000（1 年）')),
      bullet(textElement('MSc（1 年）：€20,000-€40,000')),

      h3('生活费（月均）'),
      bullet(textElement('巴黎：€1,200-€2,000')),
      bullet(textElement('里昂/马赛/图卢兹：€800-€1,200')),
      bullet(textElement('马德里/巴塞罗那：€900-€1,400')),
      bullet(textElement('米兰：€1,000-€1,500')),
      bullet(textElement('法国政府住房补贴（CAF）可覆盖 30-50% 房租')),

      h3('性价比对比'),
      paragraph(textElement(
        'HEC MiM 2 年总费用约 €65,000-€75,000（约 50-58 万人民币），'
        + '远低于英国 1 年 MSc + 生活费（约 55-70 万人民币），且学制更长、含实习。'
      )),
      divider(),

      h2('六、签证与工作'),
      h3('学生签证 (VLS-TS)'),
      bullet(textElement('法国学生签证允许每年打工 964 小时（约 20 小时/周）')),
      bullet(textElement('实习签证（Convention de Stage）学校协助办理')),

      h3('毕业后工作'),
      bullet(boldElement('APS 签证'), textElement('：毕业后 1 年找工作签证')),
      bullet(boldElement('Talent Passport'), textElement('：硕士毕业 + 年薪 ≥ 法定最低工资 2 倍即可申请，4 年可续签')),
      bullet(textElement('欧盟蓝卡：适用于高薪技术岗位')),

      h3('就业市场'),
      bullet(textElement('INSEAD MBA 平均起薪：€95,000-€110,000')),
      bullet(textElement('HEC MiM 毕业起薪：€55,000-€70,000')),
      bullet(textElement('金融中心：巴黎（法国）、伦敦（跨区域）、法兰克福（德国）')),
      bullet(textElement('咨询公司、奢侈品集团（LVMH/开云）、能源/工业巨头是主要雇主')),
      divider(),

      h2('七、中国学生建议'),
      ordered(boldElement('MiM 性价比极高'), textElement(' — 排名好 + 学费低 + 含实习，适合应届生')),
      ordered(boldElement('法语是加分项'), textElement(' — 虽然项目英语授课，但日常生活和部分就业需法语')),
      ordered(boldElement('实习是必修课'), textElement(' — 法国 Grande Ecole 项目通常包含 4-6 个月实习')),
      ordered(boldElement('奢侈品/时尚管理'), textElement(' — 法国独有优势，LVMH/Kering 等总部在巴黎')),
      ordered(boldElement('双校区项目'), textElement(' — ESCP 等可在多个欧洲城市学习，拓展视野')),
      divider(),
      quote(
        boldElement('一句话总结：'),
        textElement('法国/欧洲商科 = 高排名 + 低学费 + 国际化体验。MiM 是隐藏宝藏。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 4. 新加坡篇
  // ══════════════════════════════════════════
  {
    title: '新加坡商科留学 · 总览',
    blocks: [
      h1('新加坡商科留学完全指南'),
      paragraph(textElement(
        '新加坡是亚洲金融中心，地理位置连接中国和东南亚。'
        + '顶尖大学排名高，学制短，华人文化圈适应快，是商科留学的高性价比选择。'
      )),
      divider(),

      h2('一、为什么选新加坡'),
      bullet(textElement('NUS/NTU 常年 QS 全球前 15，亚洲前 3')),
      bullet(textElement('全球金融中心（与纽约、伦敦并列），银行/基金总部密集')),
      bullet(textElement('英语教学 + 华人占比 75%，文化适应成本低')),
      bullet(textElement('学制短（1-1.5 年），费用比英美低 40-60%')),
      bullet(textElement('地理位置：飞中国 4-5 小时，辐射东南亚市场')),
      bullet(textElement('毕业后可申请 EP/SP 工作准证，就业政策相对友好')),
      divider(),

      h2('二、三大商学院'),
      h3('1. NUS Business School（新加坡国立大学）'),
      bullet(textElement('QS 2025 全球 #8，亚洲第一')),
      bullet(textElement('MBA：15 个月，学费约 S$70,000，FT 排名亚洲前 3')),
      bullet(textElement('MSc Finance/Marketing/Business Analytics/Supply Chain 等')),
      bullet(textElement('与耶鲁/UCLA 等有双学位项目')),

      h3('2. NTU Nanyang Business School（南洋理工大学）'),
      bullet(textElement('QS 2025 全球 #15，工科背景强')),
      bullet(textElement('Nanyang MBA：12 个月，学费约 S$68,000')),
      bullet(textElement('MSc Accountancy / MSc Finance / MSc Marketing Science 等')),
      bullet(textElement('与 St. Gallen/Waseda 有双学位合作')),

      h3('3. SMU Lee Kong Chian School of Business（新加坡管理大学）'),
      bullet(textElement('商科专精，位于市中心金融区')),
      bullet(textElement('MSc in Applied Finance 亚洲排名顶尖')),
      bullet(textElement('MSc Quantitative Finance / MSc in Management / EMBA')),
      bullet(textElement('与顶尖企业合作紧密，实习资源丰富')),
      divider(),

      h2('三、热门项目'),
      h3('MBA'),
      bullet(boldElement('NUS MBA'), textElement('：15 个月，S$70,000，GMAT 均值 670，平均工作经验 6 年')),
      bullet(boldElement('Nanyang MBA'), textElement('：12 个月，S$68,000，GMAT 均值 660，双学位可选')),
      bullet(boldElement('INSEAD Singapore'), textElement('：INSEAD 新加坡校区，1 年 MBA，与枫丹白露校区相同学位')),

      h3('专业硕士（1-1.5 年）'),
      bullet(boldElement('NUS MSc Finance'), textElement('：1 年，S$50,000，量化金融方向')),
      bullet(boldElement('NUS MSc Business Analytics'), textElement('：1 年，S$48,000，数据分析')),
      bullet(boldElement('NUS MSc Marketing Analytics and Insights'), textElement('：1 年')),
      bullet(boldElement('NTU MSc Finance'), textElement('：1 年，S$45,000')),
      bullet(boldElement('NTU MSc Accountancy'), textElement('：1 年，S$38,000')),
      bullet(boldElement('SMU MSc Applied Finance'), textElement('：1 年，S$48,000')),
      bullet(boldElement('SMU MSc Quantitative Finance'), textElement('：1 年，S$42,000')),
      divider(),

      h2('四、申请要求'),
      h3('学术背景'),
      bullet(textElement('NUS/NTU：985/211 均分 85+，双非 88+')),
      bullet(textElement('SMU：985/211 均分 80+，双非 85+')),

      h3('GMAT/GRE'),
      bullet(textElement('MBA：GMAT 650+（NUS 建议 680+）')),
      bullet(textElement('MSc Finance/Analytics：GMAT 650+ 或 GRE 320+')),
      bullet(textElement('部分 MSc 项目不强制要求 GMAT')),

      h3('语言成绩'),
      bullet(textElement('IELTS 6.5-7.0 / TOEFL 85-100')),
      bullet(textElement('部分项目对英语本科授课的学生免语言成绩')),

      h3('申请时间线'),
      bullet(textElement('大部分项目每年 10 月开放，1-3 月截止')),
      bullet(textElement('NUS/NTU 采用滚动录取，建议 11-12 月前提交')),
      bullet(textElement('8 月/1 月两个入学季（部分项目）')),
      divider(),

      h2('五、费用概览'),
      h3('学费'),
      bullet(textElement('MBA：S$60,000-$70,000（约 30-35 万人民币）')),
      bullet(textElement('MSc（1 年）：S$38,000-$50,000（约 20-25 万人民币）')),

      h3('生活费（月均）'),
      bullet(textElement('住房（单间/合租）：S$800-$1,500')),
      bullet(textElement('餐饮（食阁为主）：S$400-$800')),
      bullet(textElement('交通：S$80-$150')),
      bullet(textElement('月均总计：S$1,500-$2,500')),

      h3('1 年总费用估算'),
      bullet(textElement('MSc 项目：S$55,000-$80,000（约 28-40 万人民币）')),
      bullet(boldElement('性价比极高'), textElement('，约为英国的 60-70%，美国的 40-50%')),
      divider(),

      h2('六、签证与工作'),
      h3('学生准证 (Student Pass)'),
      bullet(textElement('由学校代为申请，费用约 S$90')),
      bullet(textElement('在读期间可打工但有限制（需学校批准）')),

      h3('毕业后工作'),
      bullet(boldElement('Long Term Visit Pass (LTVP)'), textElement('：毕业后自动获得 1 年找工作签证')),
      bullet(boldElement('Employment Pass (EP)'), textElement('：月薪 S$5,000+，白领工作签证')),
      bullet(boldElement('S Pass'), textElement('：月薪 S$3,150+，中等技能岗位')),
      bullet(textElement('新加坡就业市场紧凑，3-6 个月内找到工作是常态')),

      h3('就业数据'),
      bullet(textElement('NUS MBA 平均起薪：S$110,000-$130,000/年')),
      bullet(textElement('MSc Finance 起薪：S$60,000-$85,000/年')),
      bullet(textElement('主要雇主：DBS、OCBC、淡马锡、GIC、MBB 咨询、科技公司')),
      bullet(textElement('金融+科技岗位需求旺盛')),
      divider(),

      h2('七、中国学生建议'),
      ordered(boldElement('华人社会但要主动融入'), textElement(' — 虽然文化接近，但职场以英语为主')),
      ordered(boldElement('提前找实习'), textElement(' — 新加坡重视实习经验，尽早投递')),
      ordered(boldElement('利用地理优势'), textElement(' — 辐射东南亚市场，适合做区域化发展')),
      ordered(boldElement('NUS vs NTU vs SMU'), textElement(' — NUS 综合最强，NTU 工程+商科，SMU 金融专精')),
      ordered(boldElement('考虑 PR 路径'), textElement(' — 工作 2-3 年后可申请永久居民')),
      divider(),
      quote(
        boldElement('一句话总结：'),
        textElement('新加坡商科 = 亚洲金融中心 + QS 排名高 + 费用低 + 文化适应快。最具性价比的商科留学选择之一。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 5. 香港篇
  // ══════════════════════════════════════════
  {
    title: '中国香港商科留学 · 总览',
    blocks: [
      h1('中国香港商科留学完全指南'),
      paragraph(textElement(
        '香港是中国学生商科留学的热门选择。距离近、学制短（1 年）、'
        + '排名高、背靠大湾区，毕业后可获 IANG 签证留港工作。'
      )),
      divider(),

      h2('一、为什么选香港'),
      bullet(textElement('港大/港科/港中文 QS 排名全球前 50')),
      bullet(textElement('1 年制硕士，时间成本最低')),
      bullet(textElement('学费和生活费低于英美（但高于新加坡）')),
      bullet(textElement('中英双语环境，国际化 + 大湾区发展机遇')),
      bullet(textElement('IANG 签证：毕业后无条件留港 2 年')),
      bullet(textElement('距内地 1 小时飞行，方便家人探访')),
      divider(),

      h2('二、四大商学院'),
      h3('1. HKU Business School（香港大学）'),
      bullet(textElement('QS 2025 全球 #17，综合排名香港第一')),
      bullet(textElement('MBA：14 个月，学费 HK$588,000')),
      bullet(textElement('MSc Finance / MSc Business Analytics / MEcon 等')),
      bullet(textElement('品牌认可度最高，回国就业强')),

      h3('2. HKUST Business School（香港科技大学）'),
      bullet(textElement('QS 2025 全球 #47，商科排名亚洲前列')),
      bullet(textElement('MBA：16 个月，学费 HK$600,000，FT 排名亚洲 Top 5')),
      bullet(textElement('MSc Finance / MSc Business Analytics / MSc Global Operations 等')),
      bullet(textElement('学术声誉极强，金融工程方向突出')),

      h3('3. CUHK Business School（香港中文大学）'),
      bullet(textElement('QS 2025 全球 #36')),
      bullet(textElement('MBA：12 个月，学费 HK$560,000')),
      bullet(textElement('MSc Finance / MSc Marketing / MSc Business Analytics 等')),
      bullet(textElement('与内地联系紧密，校友网络强')),

      h3('4. CityU College of Business（香港城市大学）'),
      bullet(textElement('QS 2025 全球 #62')),
      bullet(textElement('MSc Finance / MSc Business Analytics / MSc Marketing 等')),
      bullet(textElement('学费相对较低，性价比高')),
      bullet(textElement('位于九龙核心区，交通便利')),
      divider(),

      h2('三、热门项目'),
      h3('金融硕士 (MSc Finance)'),
      bullet(boldElement('HKU MSc Finance'), textElement('：1 年，HK$396,000，竞争最激烈')),
      bullet(boldElement('HKUST MSc Finance'), textElement('：1 年，HK$340,000，偏量化')),
      bullet(boldElement('CUHK MSc Finance'), textElement('：1 年，HK$300,000')),
      bullet(boldElement('CityU MSc Finance'), textElement('：1 年，HK$247,500')),

      h3('商业分析 (MSc BA)'),
      bullet(boldElement('HKU MSc Business Analytics'), textElement('：1 年，HK$330,000')),
      bullet(boldElement('HKUST MSc Business Analytics'), textElement('：1 年，HK$300,000')),
      bullet(boldElement('CUHK MSc Business Analytics'), textElement('：1 年，HK$280,000')),

      h3('市场营销 (MSc Marketing)'),
      bullet(textElement('CUHK MSc Marketing：1 年，HK$270,000')),
      bullet(textElement('CityU MSc Marketing：1 年，HK$218,400')),
      bullet(textElement('HKUST MSc Global Operations：含营销方向')),

      h3('MBA'),
      bullet(textElement('HKU/HKUST MBA：FT 排名亚洲 Top 10')),
      bullet(textElement('学费：HK$560,000-$600,000')),
      bullet(textElement('工作经验要求：平均 5-6 年')),

      h3('经济学 / 会计'),
      bullet(textElement('HKU MEcon：1 年，HK$216,000，性价比极高')),
      bullet(textElement('HKUST MSc Accounting：1 年，对接 CPA')),
      divider(),

      h2('四、申请要求'),
      h3('学术背景'),
      bullet(textElement('港大/港科：985 均分 85+，211 均分 87+，双非 90+')),
      bullet(textElement('港中文：985 均分 82+，211 均分 85+，双非 87+')),
      bullet(textElement('城大：985 均分 80+，211 均分 82+，双非 85+')),
      bullet(textElement('金融/商业分析项目竞争最激烈，门槛更高')),

      h3('GMAT/GRE'),
      bullet(textElement('MBA：GMAT 650+（HKUST 建议 680+）')),
      bullet(textElement('MSc Finance：GMAT 680+ 有竞争力')),
      bullet(textElement('其他 MSc：推荐但非必须，提交 700+ 有显著加分')),

      h3('语言成绩'),
      bullet(textElement('IELTS 6.5+（单项 5.5+）/ TOEFL 80+')),
      bullet(textElement('顶尖项目建议 IELTS 7.0+ / TOEFL 100+')),
      bullet(textElement('部分项目对英语授课本科免语言要求')),

      h3('申请时间线'),
      bullet(boldElement('主轮（9-12 月）'), textElement('：大部分项目 9-10 月开放，先到先得')),
      bullet(boldElement('第二轮（1-3 月）'), textElement('：部分项目仍接受申请')),
      bullet(boldElement('补录（4-6 月）'), textElement('：少量名额')),
      paragraph(textElement('香港几乎所有项目都是滚动录取，极度先到先得。建议 10-11 月完成申请。')),
      divider(),

      h2('五、费用概览'),
      h3('学费（1 年）'),
      bullet(textElement('MBA：HK$560,000-$600,000（约 51-55 万人民币）')),
      bullet(textElement('MSc Finance：HK$250,000-$400,000（约 23-36 万人民币）')),
      bullet(textElement('MSc BA/Marketing：HK$220,000-$330,000（约 20-30 万人民币）')),
      bullet(textElement('MEcon：HK$216,000（约 20 万人民币，高性价比）')),

      h3('生活费（月均）'),
      bullet(textElement('住房：HK$5,000-$10,000（校外合租/单间）')),
      bullet(textElement('餐饮：HK$3,000-$5,000')),
      bullet(textElement('交通：HK$500-$1,000')),
      bullet(textElement('月均总计：HK$10,000-$16,000')),

      h3('1 年总费用估算'),
      bullet(textElement('MSc 项目：HK$350,000-$550,000（约 32-50 万人民币）')),
      bullet(textElement('MBA：HK$700,000-$800,000（约 64-73 万人民币）')),
      divider(),

      h2('六、签证与工作'),
      h3('学生签证'),
      bullet(textElement('由学校代办，费用 HK$530')),
      bullet(textElement('在读期间可实习（需申请 No Objection Letter）')),

      h3('IANG 签证（非本地毕业生留港就业）'),
      bullet(boldElement('毕业后无条件获得 2 年 IANG 签证'), textElement('，无需 offer')),
      bullet(textElement('之后续签模式：2+3+3 年')),
      bullet(textElement('连续居港 7 年可申请永久居民')),
      bullet(textElement('2024 年起"高才通"计划：全球百强大学毕业生可直接获得 2 年签证')),

      h3('就业数据'),
      bullet(textElement('MSc Finance 起薪：HK$25,000-$40,000/月（约 23,000-36,000 人民币）')),
      bullet(textElement('MBA 起薪：HK$50,000-$80,000/月')),
      bullet(textElement('主要行业：银行/金融、咨询、科技')),
      bullet(textElement('主要雇主：汇丰、中金、高盛、摩根、德勤、腾讯、阿里')),
      divider(),

      h2('七、中国学生建议'),
      ordered(boldElement('极度先到先得'), textElement(' — 9-10 月开放就要提交，晚了名额就没了')),
      ordered(boldElement('实习经历权重高'), textElement(' — 香港学校非常看重相关实习')),
      ordered(boldElement('留港 vs 回内地'), textElement(' — 两条路都可行，提前想清楚')),
      ordered(boldElement('大湾区机遇'), textElement(' — 香港+深圳+广州，跨境发展空间大')),
      ordered(boldElement('申请量极大'), textElement(' — 热门项目录取率可低至 5-10%，注意分层申请')),
      divider(),
      quote(
        boldElement('一句话总结：'),
        textElement('香港商科 = 离家近 + 排名高 + IANG 签证 + 大湾区机遇。适合不想走太远但想要国际化学历的同学。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 6. 澳大利亚篇
  // ══════════════════════════════════════════
  {
    title: '澳大利亚商科留学 · 总览',
    blocks: [
      h1('澳大利亚商科留学完全指南'),
      paragraph(textElement(
        '澳大利亚是中国学生第三大留学目的地。八大院校 QS 排名稳定前 100，'
        + '毕业后可获 2-4 年工作签证（PSW），移民政策相对友好。'
      )),
      divider(),

      h2('一、为什么选澳大利亚'),
      bullet(textElement('八大院校全部进入 QS 全球前 100')),
      bullet(textElement('2 年制硕士可获 3 年 PSW 工签（偏远地区 4 年）')),
      bullet(textElement('移民政策友好，商科部分专业可走技术移民')),
      bullet(textElement('申请门槛相对灵活，双非学生友好')),
      bullet(textElement('2 月/7 月双入学季，时间灵活')),
      bullet(textElement('时差与中国仅 2-3 小时')),
      divider(),

      h2('二、八大商学院'),
      h3('第一梯队'),
      ordered(boldElement('Melbourne Business School (墨尔本大学)'), textElement(' — QS #13，综合最强，MBA 澳洲第一')),
      ordered(boldElement('UNSW Business School (新南威尔士大学)'), textElement(' — QS #19，金融/会计强，悉尼 CBD')),
      ordered(boldElement('University of Sydney Business School'), textElement(' — QS #18，品牌强，综合商科')),

      h3('第二梯队'),
      bullet(boldElement('Monash Business School'), textElement(' — QS #37，墨尔本，商科全面')),
      bullet(boldElement('ANU College of Business and Economics'), textElement(' — QS #30，堪培拉，偏远地区加分')),
      bullet(boldElement('UQ Business School (昆士兰大学)'), textElement(' — QS #40，布里斯班')),
      bullet(boldElement('UWA Business School (西澳大学)'), textElement(' — QS #77，珀斯，矿业/能源')),
      bullet(boldElement('University of Adelaide Business School'), textElement(' — QS #89，偏远地区加分')),
      divider(),

      h2('三、热门项目'),
      h3('Master of Finance'),
      bullet(boldElement('墨大 Master of Finance'), textElement('：1.5-2 年，AUD $50,000/年')),
      bullet(boldElement('UNSW Master of Finance'), textElement('：1.5 年，AUD $48,000/年')),
      bullet(boldElement('悉大 Master of Commerce (Finance)'), textElement('：2 年，AUD $52,000/年')),

      h3('Master of Business Analytics'),
      bullet(boldElement('墨大 Master of Business Analytics'), textElement('：1 年，AUD $50,000')),
      bullet(boldElement('UNSW Master of Business Analytics'), textElement('：1.5 年，AUD $48,000/年')),
      bullet(boldElement('Monash Master of Business Analytics'), textElement('：1.5-2 年，AUD $46,000/年')),

      h3('Master of Management / Commerce'),
      bullet(boldElement('墨大 Master of Management'), textElement('：2 年，AUD $48,000/年')),
      bullet(boldElement('悉大 Master of Commerce'), textElement('：2 年，可选 Finance/Marketing/Analytics 方向')),
      bullet(boldElement('UNSW Master of Commerce'), textElement('：1.5-2 年，灵活选方向')),

      h3('Master of Professional Accounting'),
      bullet(textElement('几乎所有八大都有 MPA 项目')),
      bullet(textElement('通常 1.5-2 年，满足 CPA Australia 认证要求')),
      bullet(textElement('适合转专业学生，移民加分职业')),

      h3('MBA'),
      bullet(boldElement('Melbourne MBA'), textElement('：1 年 Full-time，AUD $89,000，FT 排名澳洲第一')),
      bullet(boldElement('AGSM MBA (UNSW)'), textElement('：16 个月，AUD $86,000')),
      bullet(textElement('Monash MBA / UQ MBA 等')),
      divider(),

      h2('四、申请要求'),
      h3('学术背景'),
      bullet(textElement('墨大/悉大：985 均分 80+，211 均分 82+，双非 85-87+')),
      bullet(textElement('UNSW：985/211 均分 76+，双非 80-85+')),
      bullet(textElement('Monash/UQ：985/211 均分 75+，双非 80+')),
      bullet(textElement('澳洲对双非学生相对友好，门槛低于英国和香港')),

      h3('GMAT/GRE'),
      bullet(textElement('大部分 MSc/Master 项目不需要 GMAT/GRE')),
      bullet(textElement('MBA 项目：推荐 GMAT 600+（墨大建议 650+）')),
      bullet(textElement('提交高 GMAT 分数可增加奖学金机会')),

      h3('语言成绩'),
      bullet(textElement('IELTS 6.5+（单项 6.0+）— 大部分商科硕士要求')),
      bullet(textElement('墨大部分项目要求 IELTS 7.0+')),
      bullet(textElement('TOEFL 79-94+（视学校而定）')),
      bullet(textElement('语言不达标可读语言班（Pathway）')),

      h3('申请时间线'),
      bullet(boldElement('2 月入学'), textElement('：前一年 7-10 月申请')),
      bullet(boldElement('7 月入学'), textElement('：当年 1-3 月申请')),
      bullet(textElement('澳洲申请通常无轮次限制，但热门项目建议提前 6 个月')),
      bullet(textElement('Con-offer（有条件录取）机制灵活，可先拿 offer 后补材料')),
      divider(),

      h2('五、费用概览'),
      h3('学费（每年）'),
      bullet(textElement('MBA：AUD $80,000-$90,000')),
      bullet(textElement('Master of Finance/Commerce：AUD $45,000-$55,000')),
      bullet(textElement('Master of Accounting：AUD $42,000-$50,000')),
      bullet(textElement('Master of BA：AUD $45,000-$52,000')),

      h3('生活费（月均）'),
      bullet(textElement('悉尼/墨尔本：AUD $2,000-$3,000')),
      bullet(textElement('布里斯班/堪培拉：AUD $1,500-$2,200')),
      bullet(textElement('阿德莱德/珀斯：AUD $1,200-$1,800')),

      h3('2 年总费用估算'),
      bullet(textElement('悉尼/墨尔本：AUD $140,000-$170,000（约 65-80 万人民币）')),
      bullet(textElement('其他城市：AUD $110,000-$140,000（约 50-65 万人民币）')),
      bullet(textElement('可在读期间打工（每两周 48 小时），补贴生活费')),
      divider(),

      h2('六、签证与工作'),
      h3('学生签证 (Subclass 500)'),
      bullet(textElement('签证费：AUD $710')),
      bullet(textElement('OSHC 强制医保：约 AUD $500-$700/年')),
      bullet(textElement('可打工：每两周最多 48 小时，假期无限制')),

      h3('毕业工签 (PSW - Post-Study Work)'),
      bullet(boldElement('2 年制硕士：3 年 PSW 工签')),
      bullet(boldElement('1 年制硕士：仅 18 个月 PSW'), textElement('（2024 年新政策收紧）')),
      bullet(boldElement('偏远地区加 1-2 年'), textElement('：如 Adelaide、Perth、Brisbane 等')),
      bullet(textElement('年龄限制：申请时不超过 50 岁')),

      h3('移民路径'),
      bullet(boldElement('189 独立技术移民'), textElement('：会计/审计在职业列表上，但竞争激烈')),
      bullet(boldElement('190 州担保'), textElement('：各州有不同的紧缺职业列表')),
      bullet(boldElement('491 偏远地区签证'), textElement('：偏远地区读书+工作有额外加分')),
      bullet(textElement('工作经验 + 英语成绩（PTE/IELTS 8 分）是关键加分项')),

      h3('就业数据'),
      bullet(textElement('商科硕士平均起薪：AUD $65,000-$85,000/年')),
      bullet(textElement('MBA 起薪：AUD $100,000-$130,000/年')),
      bullet(textElement('主要行业：四大会计所、银行、咨询、科技')),
      bullet(textElement('主要雇主：CBA、ANZ、Westpac、NAB、Deloitte、PwC、EY、KPMG')),
      divider(),

      h2('七、中国学生建议'),
      ordered(boldElement('选 2 年制项目'), textElement(' — 1 年制 PSW 已缩短至 18 个月，2 年制 = 3 年工签')),
      ordered(boldElement('考虑偏远地区'), textElement(' — ANU（堪培拉）、Adelaide 有移民加分且学费低')),
      ordered(boldElement('双非友好'), textElement(' — 澳洲八大对双非学生门槛低于英港，申请成功率高')),
      ordered(boldElement('Con-offer 提前锁定'), textElement(' — 先拿有条件录取，后补语言成绩')),
      ordered(boldElement('打工补贴生活'), textElement(' — 合法打工每小时 AUD $23+，可覆盖部分生活费')),
      ordered(boldElement('移民要趁早规划'), textElement(' — 读书期间就要了解 EOI 加分规则')),
      divider(),
      quote(
        boldElement('一句话总结：'),
        textElement('澳大利亚商科 = 排名稳 + 门槛灵活 + 长期工签 + 移民可能。适合想留海外发展的同学。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 7. 选校策略（通用）
  // ══════════════════════════════════════════
  {
    title: '选校策略 · 如何确定目标',
    blocks: [
      h1('选校策略：如何确定你的目标'),
      paragraph(textElement(
        '商科留学不是"选学校"，是"选路径"。先想清楚三个问题，选校就清晰了。'
      )),
      divider(),

      h2('第一步：明确职业目标'),
      paragraph(textElement('毕业后想做什么？这决定了你应该去哪。')),
      bullet(boldElement('投行/金融'), textElement(' → 美国 Wharton/Columbia/Stern、英国 LBS/LSE、香港 HKU/HKUST')),
      bullet(boldElement('咨询'), textElement(' → 美国 M7 MBA、法国 INSEAD/HEC、英国 LBS/Oxford')),
      bullet(boldElement('科技/产品'), textElement(' → 美国 Stanford/MIT/Haas、新加坡 NUS')),
      bullet(boldElement('数据分析'), textElement(' → 美国 MIT MBAn/UCLA MSBA、英国 Imperial/Warwick')),
      bullet(boldElement('回国大厂/金融'), textElement(' → 香港三大、新加坡 NUS/NTU、英国 G5')),
      bullet(boldElement('移民定居'), textElement(' → 澳大利亚八大、新加坡')),
      bullet(boldElement('奢侈品/时尚'), textElement(' → 法国 HEC/ESSEC、意大利 Bocconi')),
      divider(),

      h2('第二步：评估自身条件'),
      h3('背景自评清单'),
      ordered(textElement('本科院校（985/211/双非/海本）')),
      ordered(textElement('GPA（转换为 4.0 制或百分制）')),
      ordered(textElement('GMAT/GRE 成绩（或预估）')),
      ordered(textElement('语言成绩（IELTS/TOEFL）')),
      ordered(textElement('工作/实习经验（年限+行业+公司）')),
      ordered(textElement('预算（学费+生活费，家庭可支持金额）')),
      ordered(textElement('时间安排（何时入学，是否 gap）')),
      divider(),

      h2('第三步：选校分层'),
      paragraph(textElement('无论申请哪个地区，都要做分层：')),
      bullet(boldElement('Dream（冲刺）2-3 所'), textElement(' — 有一定距离但值得试')),
      bullet(boldElement('Target（目标）3-4 所'), textElement(' — 条件匹配，录取概率 50%+')),
      bullet(boldElement('Safety（保底）2-3 所'), textElement(' — 大概率录取，能接受')),
      paragraph(textElement('总共申请 7-10 个项目是比较合理的数量。')),
      divider(),

      h2('六大地区横向对比'),
      h3('费用对比（1 年 MSc Finance 总费用，含生活费）'),
      bullet(boldElement('美国'), textElement('：80-120 万人民币（学费高+生活费高）')),
      bullet(boldElement('英国'), textElement('：40-60 万人民币（1 年制性价比）')),
      bullet(boldElement('法国'), textElement('：25-45 万人民币（学费低+生活补贴）')),
      bullet(boldElement('新加坡'), textElement('：28-40 万人民币（学费低+生活费适中）')),
      bullet(boldElement('香港'), textElement('：30-50 万人民币（学费适中+住房贵）')),
      bullet(boldElement('澳大利亚'), textElement('：50-80 万人民币（2 年制学费×2）')),

      h3('毕业后工签对比'),
      bullet(boldElement('美国'), textElement('：OPT 12 个月（STEM 项目 36 个月），需抽签 H1B')),
      bullet(boldElement('英国'), textElement('：PSW 2 年，无条件')),
      bullet(boldElement('法国'), textElement('：APS 1 年 + Talent Passport 4 年')),
      bullet(boldElement('新加坡'), textElement('：LTVP 1 年 + EP/SP 工签')),
      bullet(boldElement('香港'), textElement('：IANG 2 年，无条件')),
      bullet(boldElement('澳大利亚'), textElement('：PSW 2-4 年，可走移民')),

      h3('回国认可度对比'),
      bullet(boldElement('美国 M7/T15 MBA'), textElement(' — 最高认可度')),
      bullet(boldElement('英国 G5 + LBS'), textElement(' — 非常高')),
      bullet(boldElement('香港三大'), textElement(' — 非常高，大湾区尤甚')),
      bullet(boldElement('新加坡 NUS/NTU'), textElement(' — 高，尤其金融行业')),
      bullet(boldElement('法国 HEC/INSEAD'), textElement(' — 高，但国内知名度不如英美')),
      bullet(boldElement('澳洲八大'), textElement(' — 中等偏上，QS 排名加分')),
      divider(),

      quote(
        boldElement('决策公式：'),
        textElement('最终选择 = 职业目标 × 预算 × 个人偏好。没有"最好"的选择，只有"最适合你"的选择。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 8. 标化考试指南
  // ══════════════════════════════════════════
  {
    title: '标化考试 · GMAT / GRE / IELTS / TOEFL',
    blocks: [
      h1('标化考试完全指南'),
      paragraph(textElement(
        '标化考试是商科留学的敲门砖。考什么、考几分、什么时候考，这里全部讲清楚。'
      )),
      divider(),

      h2('一、GMAT vs GRE：考哪个？'),
      h3('GMAT Focus Edition（2024 年新版）'),
      bullet(textElement('总分 205-805，三部分：Quantitative / Verbal / Data Insights')),
      bullet(textElement('时长 2 小时 15 分钟')),
      bullet(textElement('商学院首选，尤其 MBA 项目')),
      bullet(textElement('适合：目标明确是商科，尤其 MBA/金融')),

      h3('GRE'),
      bullet(textElement('总分 260-340，三部分：Verbal / Quantitative / Analytical Writing')),
      bullet(textElement('几乎所有商学院都接受 GRE')),
      bullet(textElement('适合：同时申请商科+其他专业，或 verbal 不强想避免 GMAT')),

      h3('建议'),
      bullet(boldElement('只申商科'), textElement(' → GMAT（更有针对性，部分学校更偏好）')),
      bullet(boldElement('商科+其他'), textElement(' → GRE（一考多用）')),
      bullet(boldElement('数学强 verbal 弱'), textElement(' → GRE（verbal 相对容易拿分）')),
      divider(),

      h2('二、GMAT 目标分数'),
      bullet(boldElement('M7 MBA'), textElement('：730+（Focus 版 655+）')),
      bullet(boldElement('T8-T15 MBA'), textElement('：700+（Focus 版 635+）')),
      bullet(boldElement('顶尖 MSc Finance'), textElement('：700+（LBS/Oxford/HKU）')),
      bullet(boldElement('一般 MSc'), textElement('：650+（有就好，越高越好）')),
      bullet(boldElement('不需要 GMAT 的地区'), textElement('：大部分澳洲/部分英国 MSc 不要求')),
      divider(),

      h2('三、语言考试：IELTS vs TOEFL'),
      h3('IELTS'),
      bullet(textElement('总分 9 分，听说读写四项')),
      bullet(textElement('英国/澳洲/香港/新加坡/欧洲更常用')),
      bullet(textElement('口语为真人对话，对部分学生更友好')),

      h3('TOEFL iBT'),
      bullet(textElement('总分 120 分，听说读写四项')),
      bullet(textElement('美国院校首选')),
      bullet(textElement('机考，口语对着电脑说')),

      h3('目标分数'),
      bullet(boldElement('美国 Top 15'), textElement('：TOEFL 105+ / IELTS 7.5+')),
      bullet(boldElement('英国 Top'), textElement('：IELTS 7.0+（LBS/Oxford 7.5+）')),
      bullet(boldElement('香港'), textElement('：IELTS 6.5-7.0+ / TOEFL 80-100+')),
      bullet(boldElement('新加坡'), textElement('：IELTS 6.5-7.0 / TOEFL 85-100')),
      bullet(boldElement('澳洲'), textElement('：IELTS 6.5+（墨大部分 7.0+）')),
      bullet(boldElement('法国'), textElement('：IELTS 6.5-7.0 / TOEFL 90-100')),
      divider(),

      h2('四、备考时间线建议'),
      ordered(boldElement('申请前 12-18 个月'), textElement('：开始准备 GMAT/GRE，目标 3-6 个月出分')),
      ordered(boldElement('申请前 8-12 个月'), textElement('：GMAT/GRE 首考，不理想继续刷分')),
      ordered(boldElement('申请前 6-10 个月'), textElement('：准备 IELTS/TOEFL，目标 2-3 个月出分')),
      ordered(boldElement('申请前 3-6 个月'), textElement('：所有标化出分，开始写文书')),
      paragraph(textElement('GMAT 和 TOEFL/IELTS 可以同时准备，但建议 GMAT 优先（难度更大）。')),
      divider(),

      h2('五、考试有效期'),
      bullet(textElement('GMAT：5 年')),
      bullet(textElement('GRE：5 年')),
      bullet(textElement('TOEFL：2 年')),
      bullet(textElement('IELTS：2 年')),
      paragraph(textElement('注意语言成绩有效期较短，不要考太早。')),
      divider(),
      quote(
        boldElement('考试策略：'),
        textElement('标化是门槛，不是决定因素。达到目标分数线后，把时间花在文书和面试上，回报更大。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 9. 文书与面试
  // ══════════════════════════════════════════
  {
    title: '文书写作与面试准备',
    blocks: [
      h1('文书写作与面试准备'),
      paragraph(textElement(
        '标化考试是硬门槛，文书和面试才是决定录取的软实力。'
        + '这部分教你怎么写出真实有力的文书，怎么在面试中留下好印象。'
      )),
      divider(),

      h2('一、文书核心逻辑'),
      paragraph(textElement('所有商学院文书，本质上在回答三个问题：')),
      ordered(boldElement('你是谁？'), textElement(' — 背景、经历、价值观')),
      ordered(boldElement('你要去哪？'), textElement(' — 短期和长期职业目标')),
      ordered(boldElement('为什么是我们？'), textElement(' — 这所学校怎么帮你到达目标')),
      paragraph(textElement('三个问题必须形成一条清晰的逻辑线。')),
      divider(),

      h2('二、MBA 文书常见题目'),
      h3('Career Goals Essay'),
      bullet(textElement('What are your short-term and long-term goals?')),
      bullet(textElement('How will [School] MBA help you achieve them?')),
      bullet(boldElement('关键'), textElement('：目标要具体+可信，不要空泛')),

      h3('Personal Essay'),
      bullet(textElement('HBS: "What else would you like us to know?"')),
      bullet(textElement('Stanford: "What matters most to you, and why?"')),
      bullet(boldElement('关键'), textElement('：展示真实自我，不是展示成就')),

      h3('Why This School'),
      bullet(textElement('必须做学校研究，提到具体的课程/教授/俱乐部/校友')),
      bullet(boldElement('关键'), textElement('：不能通用模板套用，每校一版')),
      divider(),

      h2('三、MSc 文书（Personal Statement）'),
      bullet(textElement('通常 1 篇 500-1000 字')),
      bullet(textElement('重点：学术背景 + 相关经历 + 为什么选这个项目 + 职业规划')),
      bullet(textElement('比 MBA 文书更看重学术和技术能力')),
      bullet(textElement('实习经历和项目经验要用数据说话')),
      divider(),

      h2('四、中国学生文书常见问题'),
      ordered(boldElement('太泛'), textElement(' — "我对金融充满热情"→ 换成具体故事和数据')),
      ordered(boldElement('太像简历'), textElement(' — 文书不是罗列经历，是讲为什么做和学到什么')),
      ordered(boldElement('目标不够具体'), textElement(' — "想在金融行业发展"→ "想在 PE 做跨境并购"')),
      ordered(boldElement('Why School 太敷衍'), textElement(' — "贵校排名高"→ 提到具体课程/教授/活动')),
      ordered(boldElement('缺乏自我反思'), textElement(' — 只讲成功不讲失败和成长')),
      divider(),

      h2('五、推荐信'),
      h3('选推荐人原则'),
      bullet(boldElement('了解你'), textElement(' — 能讲具体故事，不是泛泛赞美')),
      bullet(boldElement('职位不是最重要的'), textElement(' — 直属上司 > 公司高管（不认识你）')),
      bullet(textElement('MBA：至少 1 封工作推荐信（直属 supervisor）')),
      bullet(textElement('MSc：学术推荐信 + 实习上司推荐信组合')),

      h3('如何沟通'),
      ordered(textElement('提前 2 个月告知推荐人')),
      ordered(textElement('提供你的简历、目标学校列表、文书初稿')),
      ordered(textElement('告诉推荐人你希望被强调的能力和故事')),
      ordered(textElement('不要替推荐人写（学校能看出来）')),
      divider(),

      h2('六、面试准备'),
      h3('面试形式'),
      bullet(boldElement('邀请制'), textElement('：学校审阅申请后邀请（HBS/Stanford/Wharton）')),
      bullet(boldElement('开放制'), textElement('：主动申请面试（部分 Booth/Kellogg）')),
      bullet(boldElement('视频面试'), textElement('：Kellogg Video Essays / 一些 MSc 项目')),

      h3('面试准备要点'),
      ordered(boldElement('Walk me through your resume'), textElement(' — 2 分钟版本，结构清晰')),
      ordered(boldElement('Why MBA / Why this school'), textElement(' — 与文书一致但更自然')),
      ordered(boldElement('Behavioral questions'), textElement(' — 用 STAR 框架（Situation-Task-Action-Result）')),
      ordered(boldElement('Career goals'), textElement(' — 简短有力，逻辑清晰')),
      ordered(boldElement('Questions for interviewer'), textElement(' — 准备 3-5 个好问题')),

      h3('中国学生面试建议'),
      bullet(boldElement('不要背稿'), textElement(' — 自然对话，允许停顿思考')),
      bullet(boldElement('多做 Mock'), textElement(' — 至少 5-10 次真人模拟面试')),
      bullet(boldElement('练习用英文讲故事'), textElement(' — 不是翻译中文，是用英文思维')),
      bullet(boldElement('展示个性'), textElement(' — 面试不只是考能力，也是看文化匹配')),
      divider(),
      quote(
        boldElement('文书+面试核心：'),
        textElement('做真实的自己，讲真实的故事，有清晰的逻辑。不要试图成为"完美申请者"，要成为"有特点的申请者"。')
      ),
    ],
  },

  // ══════════════════════════════════════════
  // 10. 时间线规划
  // ══════════════════════════════════════════
  {
    title: '申请时间线 · 从零到录取',
    blocks: [
      h1('申请时间线：从零到录取'),
      paragraph(textElement(
        '商科留学申请是一个 12-18 个月的系统工程。以下是一份完整的时间线，'
        + '按照"秋季入学"倒推。'
      )),
      divider(),

      h2('申请前 18-24 个月（大二下 / 大三上）'),
      bullet(textElement('明确留学意向，了解各地区基本情况')),
      bullet(textElement('开始提升 GPA（均分每提升 1 分都有价值）')),
      bullet(textElement('积累实习经验（寒暑假实习 1-2 段）')),
      bullet(textElement('初步了解 GMAT/GRE，购买备考资料')),
      divider(),

      h2('申请前 12-18 个月（大三上下）'),
      bullet(boldElement('GMAT/GRE 集中备考'), textElement('，目标 3-6 个月出分')),
      bullet(textElement('暑假安排高质量实习（大厂/外资/目标行业）')),
      bullet(textElement('初步选校：确定 2-3 个目标地区')),
      bullet(textElement('参加学校 Info Session / 线上 Webinar')),
      bullet(textElement('确定推荐人并建立联系')),
      divider(),

      h2('申请前 6-12 个月（大三下 / 大四上）'),
      bullet(boldElement('IELTS/TOEFL 备考出分')),
      bullet(textElement('最终选校名单确定（7-10 个项目）')),
      bullet(textElement('开始写文书初稿')),
      bullet(textElement('与推荐人正式沟通推荐信')),
      bullet(textElement('准备申请材料（成绩单、学位证明等）')),
      divider(),

      h2('申请前 3-6 个月'),
      bullet(boldElement('文书反复修改'), textElement('（至少 3-5 稿）')),
      bullet(textElement('推荐信完成并提交')),
      bullet(textElement('完善简历')),
      bullet(textElement('准备面试（mock interview）')),
      divider(),

      h2('申请季（9 月 - 1 月）'),
      bullet(boldElement('Round 1（9-10 月）'), textElement('：提交 Dream School')),
      bullet(boldElement('Round 2（12-1 月）'), textElement('：提交 Target School')),
      bullet(textElement('面试邀请到来，准备面试')),
      bullet(textElement('跟踪申请状态，及时补充材料')),
      divider(),

      h2('录取后（2-6 月）'),
      bullet(textElement('比较 offer，做最终决策（部分学校有 deposit deadline）')),
      bullet(textElement('申请签证')),
      bullet(textElement('找住房、预订机票')),
      bullet(textElement('加入新生群，认识未来同学')),
      bullet(textElement('离职/交接（在职申请者）')),
      divider(),

      h2('不同地区时间差异'),
      bullet(boldElement('美国 MBA'), textElement('：严格按 Round 走，R1 = 9 月，R2 = 1 月')),
      bullet(boldElement('英国'), textElement('：滚动录取，9 月开放即可提交')),
      bullet(boldElement('香港'), textElement('：极度先到先得，10-11 月必须提交')),
      bullet(boldElement('新加坡'), textElement('：10 月开放，1-3 月截止')),
      bullet(boldElement('法国'), textElement('：3-5 轮，第 1 轮 10-11 月')),
      bullet(boldElement('澳洲'), textElement('：双入学季（2 月/7 月），提前 6 个月申请')),
      divider(),

      quote(
        boldElement('最重要的一条：'),
        textElement('不要等到"准备好了"才开始申请。完美主义是申请的最大敌人。先提交，再完善。')
      ),
    ],
  },

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
  console.log('开始创建「商科留学知识库」文档...\n');

  const results: Array<{ title: string; parent?: string; url: string }> = [];

  for (const page of pages) {
    const indent = page.parent ? '  ' : '';
    console.log(`${indent}创建：${page.title}`);

    const docRes = await (client.docx.document as any).create({
      data: { title: page.title }
    });

    if (docRes.code !== 0) {
      console.error(`  创建文档失败:`, docRes.msg, '| code:', docRes.code);
      continue;
    }

    const docId = docRes.data?.document?.document_id!;

    await writeBlocks(docId, page.blocks);
    const url = `https://hcn2vc1r2jus.feishu.cn/docx/${docId}`;
    results.push({ title: page.title, parent: page.parent, url });
    console.log(`${indent}  done ${url}`);

    // 避免限流
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n全部完成！共创建', results.length, '个文档');
  console.log('\n文档目录：');
  console.log('─'.repeat(60));
  for (const r of results) {
    const prefix = r.parent ? '    └ ' : '';
    console.log(`${prefix}${r.title}`);
    console.log(`${prefix}  ${r.url}`);
  }
  console.log('─'.repeat(60));
  console.log('\n提示：以上文档已创建为独立文档。');
  console.log('请在飞书中手动创建知识库空间，然后将这些文档移入知识库。');
  console.log('或使用 setup_wiki.ts 脚本在已有知识库空间中创建目录结构。');
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
