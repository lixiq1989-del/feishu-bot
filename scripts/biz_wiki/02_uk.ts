import { Page, h1, h2, h3, p, t, b, li, ol, hr, quote } from './blocks';

export const page: Page = {
  title: '英国商科硕士 · 逐校逐项目详解',
  blocks: [
    h1('英国商科硕士完全指南'),
    p(t('英国是中国学生商科留学第二大目的地。1 年制硕士时间短、QS 排名友好、PSW 签证 2 年。本篇逐校拆解每个硕士项目。')),
    p(b('关键优势：'), t('1 年拿硕士 + PSW 2 年工签 + QS 排名回国认可度高。')),
    hr(),

    // ─── LBS ───
    h2('London Business School (LBS)'),
    p(t('伦敦商学院，欧洲 MBA 第一，金融硕士全球顶尖。位于伦敦摄政公园旁。')),

    h3('Masters in Finance (MiF)'),
    li(b('学制：'), t('10-16 个月（Full-time）/ 22 个月（Part-time）')),
    li(b('学费：'), t('约 £52,000（Full-time 总计）')),
    li(b('班级规模：'), t('约 80 人')),
    li(b('录取要求：'), t('GMAT 700+（均值 710）；IELTS 7.5+')),
    li(b('GPA：'), t('建议 3.6+/4.0（国内 85+）')),
    li(b('工作经验：'), t('要求至少 3 年金融行业经验（Pre-experience 不收）')),
    li(b('核心课程：'), t('资产管理、企业金融、金融工程、FinTech、Private Equity')),
    li(b('项目特色：'), t('全球金融硕士 FT 排名 #1；伦敦金融城位置；校友网络顶级')),
    li(b('就业数据：'), t('平均起薪 £85,000+，90%+ 就业率')),
    li(b('主要雇主：'), t('Goldman Sachs、JPMorgan、Blackstone、McKinsey、Bain')),
    li(b('适合人群：'), t('有 3+ 年金融工作经验，想升职/转型的职场人')),

    h3('Masters in Management (MiM)'),
    li(b('学制：'), t('12-16 个月')),
    li(b('学费：'), t('约 £42,000（总计）')),
    li(b('班级规模：'), t('约 200 人')),
    li(b('录取要求：'), t('GMAT 680+（均值 700）；IELTS 7.5+')),
    li(b('工作经验：'), t('0-1 年（面向应届生或极少工作经验）')),
    li(b('项目特色：'), t('FT MiM 排名全球 Top 5；可选海外交换（30+ 合作院校）')),
    li(b('就业数据：'), t('平均起薪 £55,000+，3 个月就业率 90%+')),
    li(b('主要行业：'), t('咨询 35% / 金融 25% / 科技 20%')),
    li(b('适合人群：'), t('顶尖本科应届生，目标咨询/金融')),

    h3('Masters in Financial Analysis (MFA)'),
    li(b('学制：'), t('12 个月')),
    li(b('学费：'), t('约 £46,000（总计）')),
    li(b('录取要求：'), t('GMAT 680+；IELTS 7.5+')),
    li(b('工作经验：'), t('0-2 年')),
    li(b('项目特色：'), t('CFA 合作项目，覆盖 CFA 1-3 级内容；偏投资分析方向')),
    li(b('适合人群：'), t('目标 CFA + 买方/卖方分析师')),

    h3('Masters in Analytics and Management (MAM)'),
    li(b('学制：'), t('12 个月')),
    li(b('学费：'), t('约 £42,000（总计）')),
    li(b('录取要求：'), t('GMAT 680+；IELTS 7.5+')),
    li(b('项目特色：'), t('数据分析+商业管理交叉，适合数据驱动决策方向')),
    hr(),

    // ─── Oxford Said ───
    h2('Oxford Saïd Business School'),
    p(t('牛津大学赛德商学院，牛津品牌+小班教学+全球校友网络。')),

    h3('MSc Financial Economics'),
    li(b('学制：'), t('9 个月')),
    li(b('学费：'), t('约 £52,000（总计）')),
    li(b('班级规模：'), t('约 75 人')),
    li(b('录取要求：'), t('GMAT 720+（均值 730）；IELTS 7.5+（单项 7.0+）')),
    li(b('GPA：'), t('First Class（一等荣誉）或同等水平，国内建议 88+')),
    li(b('核心课程：'), t('资产定价、公司金融、衍生品、量化方法、金融计量')),
    li(b('项目特色：'), t('牛津品牌最大化；极度学术化；9 个月快速毕业')),
    li(b('就业数据：'), t('平均起薪 £75,000+，主要去向投行/资管/咨询')),
    li(b('主要雇主：'), t('Goldman Sachs、McKinsey、Lazard、Rothschild、BCG')),
    li(b('适合人群：'), t('学术背景极强（985 Top + GPA 88+），目标投行/咨询')),

    h3('MSc in Major Programme Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £48,000')),
    li(b('项目特色：'), t('大型项目管理方向，独特定位，偏基建/工程管理')),

    h3('Diplomas in Financial Strategy / Organisational Leadership'),
    li(b('学制：'), t('各 12 个月（Part-time）')),
    li(b('项目特色：'), t('在职高管项目，需工作经验')),
    hr(),

    // ─── Cambridge Judge ───
    h2('Cambridge Judge Business School'),
    p(t('剑桥大学贾奇商学院，剑桥品牌+创业生态+小班制。')),

    h3('MPhil in Finance'),
    li(b('学制：'), t('9 个月')),
    li(b('学费：'), t('约 £48,000（总计）')),
    li(b('班级规模：'), t('约 35 人（极小班）')),
    li(b('录取要求：'), t('GMAT 720+；IELTS 7.5+（单项 7.0+）')),
    li(b('GPA：'), t('First Class 或同等，国内建议 88+')),
    li(b('核心课程：'), t('实证金融、公司金融理论、衍生品、金融计量、行为金融')),
    li(b('项目特色：'), t('极度学术化，接近 MPhil/PhD 预科；班级极小，教授一对一指导')),
    li(b('就业方向：'), t('投行、对冲基金、资管、PhD 深造')),
    li(b('适合人群：'), t('数学/金融尖子生，考虑 PhD 或顶尖金融岗位')),

    h3('MPhil in Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £45,000（总计）')),
    li(b('班级规模：'), t('约 40 人')),
    li(b('录取要求：'), t('GMAT 680+；IELTS 7.5+')),
    li(b('项目特色：'), t('研究导向管理学，适合未来学术方向或咨询')),

    h3('MPhil in Technology Policy'),
    li(b('学制：'), t('1 年')),
    li(b('项目特色：'), t('科技+政策+商业交叉，独特定位')),
    hr(),

    // ─── LSE ───
    h2('London School of Economics (LSE)'),
    p(t('伦敦政治经济学院，社科之王，金融/经济学术声誉顶尖。位于伦敦市中心。')),

    h3('MSc Finance'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 £42,000（总计）')),
    li(b('班级规模：'), t('约 120 人')),
    li(b('录取要求：'), t('GMAT 700+（推荐但非必须）；IELTS 7.0+（单项 6.5+）')),
    li(b('GPA：'), t('First Class 或 Upper Second Class，国内 985 建议 85+，211 建议 87+')),
    li(b('核心课程：'), t('公司金融、资产定价、衍生品、固定收益、金融计量经济学')),
    li(b('项目特色：'), t('学术声誉极高；与伦敦金融城紧密合作；研究导向')),
    li(b('就业数据：'), t('平均起薪 £60,000-£70,000')),
    li(b('主要雇主：'), t('JPMorgan、Goldman Sachs、Morgan Stanley、HSBC、Barclays')),
    li(b('适合人群：'), t('金融/经济背景，学术成绩优秀，目标投行/资管')),

    h3('MSc Finance and Economics'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 £42,000')),
    li(b('项目特色：'), t('金融+宏观经济交叉，适合政策/央行/国际组织方向')),

    h3('MSc Accounting and Finance'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 £38,000')),
    li(b('项目特色：'), t('会计+金融双修；不要求本科会计背景')),
    li(b('适合人群：'), t('想做金融但也想有会计基础')),

    h3('MSc Risk and Finance'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 £42,000')),
    li(b('项目特色：'), t('风险管理+金融交叉；适合银行风控/保险精算方向')),

    h3('MSc Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £35,000')),
    li(b('录取要求：'), t('GMAT 推荐（非必须）；IELTS 7.0+')),
    li(b('项目特色：'), t('接受非商科背景；偏学术/研究导向')),
    li(b('适合人群：'), t('非商科背景想转商科，看重 LSE 品牌')),

    h3('MSc Marketing'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £35,000')),
    li(b('项目特色：'), t('学术化营销，偏消费者行为/数据分析')),

    h3('MSc Data Science and Business Analytics（与统计系联合）'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £38,000')),
    li(b('项目特色：'), t('统计/数据科学+商业应用；需较强编程/数学背景')),
    hr(),

    // ─── Imperial ───
    h2('Imperial College Business School'),
    p(t('帝国理工商学院，理工科背景+商业，位于伦敦南肯辛顿。')),

    h3('MSc Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £40,000（总计）')),
    li(b('班级规模：'), t('约 100 人')),
    li(b('录取要求：'), t('GMAT 推荐 680+（非强制）；IELTS 7.0+（单项 6.5+）')),
    li(b('GPA：'), t('985/211 建议 82+，双非 85+')),
    li(b('核心课程：'), t('公司金融、投资管理、衍生品定价、金融科技')),
    li(b('项目特色：'), t('帝国理工理工底蕴+金融；CFA 合作；Bloomberg 实验室')),
    li(b('就业数据：'), t('平均起薪 £50,000-£60,000')),
    li(b('适合人群：'), t('理工/金融背景，目标伦敦金融岗位')),

    h3('MSc Finance & Accounting'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £38,000')),
    li(b('项目特色：'), t('金融+会计双修；接受非相关背景')),

    h3('MSc Business Analytics'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £38,000')),
    li(b('录取要求：'), t('IELTS 7.0+；需有定量背景（数学/统计/编程）')),
    li(b('核心课程：'), t('数据科学、机器学习、优化、统计建模、商业应用项目')),
    li(b('项目特色：'), t('帝国理工 CS/工程学科交叉优势明显')),
    li(b('就业方向：'), t('科技公司/咨询/金融数据岗')),

    h3('MSc International Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £34,000')),
    li(b('项目特色：'), t('接受任何本科背景；适合转商科的理工科学生')),

    h3('MSc Strategic Marketing'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £34,000')),
    li(b('项目特色：'), t('数据驱动营销策略；帝国理工量化方法加持')),

    h3('MSc Risk Management and Financial Engineering'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £40,000')),
    li(b('项目特色：'), t('金融工程+风险管理；偏量化，需强数学背景')),
    li(b('适合人群：'), t('数学/物理/工程背景，目标量化金融/风控')),
    hr(),

    // ─── Warwick ───
    h2('Warwick Business School (WBS)'),
    p(t('华威大学商学院，FT 金融硕士全英第一，位于英格兰中部考文垂附近。')),

    h3('MSc Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £38,000（总计）')),
    li(b('班级规模：'), t('约 100 人')),
    li(b('录取要求：'), t('GMAT 推荐 650+（非必须）；IELTS 7.0+（至少两项 7.0+）')),
    li(b('GPA：'), t('985/211 建议 82+，双非 85+')),
    li(b('核心课程：'), t('投资管理、公司金融、衍生品、实证金融、行为金融')),
    li(b('项目特色：'), t('FT 金融硕士排名全英第一/全球前 10；CFA 合作')),
    li(b('就业数据：'), t('平均起薪 £45,000-£55,000')),
    li(b('适合人群：'), t('金融/经济背景，目标金融行业')),

    h3('MSc Finance and Economics'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £36,000')),
    li(b('项目特色：'), t('金融+经济学双修，偏宏观/政策方向')),

    h3('MSc Business Analytics'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £36,000')),
    li(b('项目特色：'), t('数据分析+商业应用；与行业合作 Capstone 项目')),

    h3('MSc Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £34,000')),
    li(b('项目特色：'), t('接受任何背景；FT MiM 排名全球前 20')),

    h3('MSc Marketing and Strategy'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £34,000')),
    li(b('项目特色：'), t('营销+战略双修')),

    h3('MSc Accounting and Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £36,000')),
    li(b('项目特色：'), t('ACCA/CIMA 免考科目')),
    hr(),

    // ─── Manchester ───
    h2('Manchester Alliance Manchester Business School'),
    p(t('曼彻斯特大学联盟曼彻斯特商学院，三重认证（AACSB/EQUIS/AMBA），工业城市，性价比高。')),

    h3('MSc Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £33,000（总计）')),
    li(b('录取要求：'), t('GMAT 推荐（非必须）；IELTS 7.0+（写作 6.5+）')),
    li(b('GPA：'), t('985/211 建议 80+，双非 83+')),
    li(b('项目特色：'), t('CFA 合作；性价比高于伦敦院校')),

    h3('MSc Quantitative Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £33,000')),
    li(b('项目特色：'), t('偏量化方向，需强数学背景')),

    h3('MSc Business Analytics: Operational Research and Risk Analysis'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £30,000')),
    li(b('项目特色：'), t('运筹学+数据分析+风险管理交叉，独特定位')),

    h3('MSc Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £28,000')),
    li(b('项目特色：'), t('接受非商科背景转商科')),

    h3('MSc Marketing'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £28,000')),

    h3('MSc Accounting and Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £30,000')),
    hr(),

    // ─── Edinburgh ───
    h2('University of Edinburgh Business School'),
    p(t('爱丁堡大学商学院，苏格兰首府，QS 全球 Top 30，环境优美。')),

    h3('MSc Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £35,000')),
    li(b('录取要求：'), t('IELTS 7.0+（单项 6.0+）；GPA 985/211 建议 80+')),
    li(b('项目特色：'), t('CFA 合作；苏格兰金融中心（Royal Bank of Scotland 总部）')),

    h3('MSc Accounting and Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £33,000')),

    h3('MSc Business Analytics'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £35,000')),

    h3('MSc Marketing'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £30,000')),

    h3('MSc Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £28,000')),
    hr(),

    // ─── KCL ───
    h2('King\'s College London (KCL) King\'s Business School'),
    p(t('伦敦国王学院商学院，位于伦敦市中心，近年发展迅速。')),

    h3('MSc Finance (Asset Pricing / Corporate Finance)'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £35,000')),
    li(b('录取要求：'), t('IELTS 7.0+；GPA 985/211 建议 82+')),
    li(b('项目特色：'), t('可选资产定价或公司金融方向；伦敦核心位置')),

    h3('MSc Finance Analytics'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £35,000')),
    li(b('项目特色：'), t('金融+数据分析交叉')),

    h3('MSc Banking and Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £33,000')),
    li(b('项目特色：'), t('偏银行业务方向')),

    h3('MSc Digital Marketing'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £30,000')),
    li(b('项目特色：'), t('数字营销+数据分析')),
    hr(),

    // ─── Bayes / Cass ───
    h2('Bayes Business School (City, University of London)'),
    p(t('原 Cass Business School，位于伦敦金融城心脏地带，金融/精算/保险传统强校。')),

    h3('MSc Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £32,000')),
    li(b('录取要求：'), t('IELTS 7.0+；GPA 建议 80+')),
    li(b('项目特色：'), t('紧邻 Bank of England 和各大投行；Bloomberg 实验室')),

    h3('MSc Banking and International Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £32,000')),

    h3('MSc Quantitative Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £32,000')),
    li(b('项目特色：'), t('需强数学背景；金融城地理优势')),

    h3('MSc Investment Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £32,000')),
    li(b('项目特色：'), t('CFA 合作项目；投资管理方向')),

    h3('MSc Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £28,000')),

    h3('MSc Marketing Strategy and Innovation'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £28,000')),
    hr(),

    // ─── Bath ───
    h2('University of Bath School of Management'),
    p(t('巴斯大学管理学院，英国商科排名常年前 10，小而精的学校。')),

    h3('MSc in Accounting and Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £30,000')),
    li(b('项目特色：'), t('CIMA/ACCA 免考；英国本土排名极高')),

    h3('MSc in Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £30,000')),

    h3('MSc in Marketing'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £28,000')),

    h3('MSc in Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 £28,000')),
    hr(),

    // ─── 通用信息 ───
    h2('英国商科硕士通用信息'),

    h3('申请时间线'),
    li(b('9-10 月'), t('：大部分项目开放申请')),
    li(b('11-1 月'), t('：申请高峰，热门项目建议此时提交')),
    li(b('2-4 月'), t('：后续轮次，部分项目已满')),
    li(b('关键提醒'), t('：英国多数项目滚动录取（Rolling），先到先得！')),

    h3('学校认可名单（China List）'),
    p(t('英国很多学校对中国本科有"认可院校名单"，不在名单上可能直接被拒。')),
    li(t('LSE：接受大部分 985/211，双非需极高 GPA（90+）')),
    li(t('Imperial：有内部 Tier 1/2 分级')),
    li(t('Warwick：明确公布认可名单')),
    li(t('Edinburgh/Manchester/KCL：都有自己的名单，申请前务必核实')),

    h3('签证与工作'),
    li(b('Graduate Route (PSW)'), t('：硕士毕业后 2 年无条件工签')),
    li(b('Skilled Worker Visa'), t('：PSW 到期后可转，需雇主担保，年薪 £38,700+')),
    li(b('在读打工'), t('：每周 20 小时')),

    h3('费用总结'),
    li(t('顶尖项目（LBS/Oxford/Cambridge）：£45,000-£52,000 学费')),
    li(t('第二梯队（LSE/Imperial/Warwick）：£35,000-£42,000 学费')),
    li(t('伦敦生活费：£1,500-£2,500/月')),
    li(t('非伦敦生活费：£1,000-£1,500/月')),
    li(t('1 年总费用估算：£45,000-£75,000（约 40-65 万人民币）')),
    hr(),

    quote(b('选校提醒：'), t('英国商科选校三个关键：1) QS 排名（回国认可度）2) 地理位置（伦敦 vs 非伦敦就业差异大）3) 认可名单（确认你的本科被接受）。')),
  ],
};
