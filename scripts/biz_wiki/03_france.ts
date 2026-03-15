import { Page, h1, h2, h3, p, t, b, li, ol, hr, quote } from './blocks';

export const page: Page = {
  title: '法国/欧洲商科硕士 · 逐校逐项目详解',
  blocks: [
    h1('法国/欧洲商科硕士完全指南'),
    p(t('法国拥有独特的 Grande Ecole（精英商学院）体系，HEC Paris 常年全球前 5。欧洲商科国际化程度极高，学费低于英美，是性价比之选。')),
    p(b('关键优势：'), t('MiM/Grande Ecole 全球排名顶尖 + 学费低 30-50% + 含实习 + Talent Passport 工签。')),
    hr(),

    // ─── HEC Paris ───
    h2('HEC Paris'),
    p(t('巴黎高等商学院，法国第一，FT MiM 排名全球 #1，位于巴黎西南凡尔赛附近。')),

    h3('Master in Management (Grande Ecole / MiM)'),
    li(b('学制：'), t('2 年（含 6 个月实习）')),
    li(b('学费：'), t('约 €50,000（2 年总计）')),
    li(b('班级规模：'), t('约 300 人')),
    li(b('录取要求：'), t('GMAT 700+（均值 710）；IELTS 7.0+ / TOEFL 100+')),
    li(b('GPA：'), t('985 建议 85+，211 建议 87+')),
    li(b('工作经验：'), t('0-2 年（面向应届生或少量经验者）')),
    li(b('核心课程：'), t('战略、金融、营销、创业、数字化转型')),
    li(b('方向选择（第二年）：'), t('Finance、Strategy、Digital Innovation、Sustainability、Entrepreneurship 等 20+ 专业方向')),
    li(b('项目特色：'), t('FT MiM 排名全球 #1；含 6 个月实习（法国/国际均可）；交换项目覆盖全球 120+ 商学院')),
    li(b('就业数据：'), t('毕业 3 个月内就业率 95%+，平均起薪 €65,000+')),
    li(b('主要雇主：'), t('McKinsey、BCG、Bain、Goldman Sachs、LVMH、L\'Oréal、Google')),
    li(b('适合人群：'), t('顶尖本科应届生，目标咨询/金融/奢侈品')),

    h3('MSc International Finance'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 €38,000')),
    li(b('班级规模：'), t('约 90 人')),
    li(b('录取要求：'), t('GMAT 680+；IELTS 7.0+')),
    li(b('工作经验：'), t('0-3 年')),
    li(b('项目特色：'), t('FT 金融硕士排名全球前 3；与伦敦/纽约金融机构联系紧密')),
    li(b('就业方向：'), t('投行、资管、PE/VC')),

    h3('MSc Strategic Management'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 €33,000')),
    li(b('项目特色：'), t('战略咨询方向；MBB 咨询公司招聘活跃')),

    h3('MSc Marketing'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 €33,000')),
    li(b('项目特色：'), t('奢侈品营销+数字营销；巴黎奢侈品行业优势')),

    h3('MSc Innovation and Entrepreneurship'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 €33,000')),
    li(b('项目特色：'), t('HEC 创业生态 Station F（全球最大创业孵化器）合作')),

    h3('MSc Data Science for Business（与 Ecole Polytechnique 联合）'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 €38,000（2 年总计）')),
    li(b('项目特色：'), t('HEC 商业 + X 理工数据科学，双学位；极强技术+商业交叉')),
    li(b('适合人群：'), t('理工科背景，想做数据/AI + 商业')),
    hr(),

    // ─── INSEAD ───
    h2('INSEAD'),
    p(t('欧洲工商管理学院，全球最国际化商学院。枫丹白露（法国）+ 新加坡双校区。以 MBA 闻名，近年扩展硕士项目。')),

    h3('Master in Management (MiM)'),
    li(b('学制：'), t('14-16 个月')),
    li(b('学费：'), t('约 €45,000')),
    li(b('录取要求：'), t('GMAT 680+；IELTS 7.0+')),
    li(b('工作经验：'), t('0-2 年')),
    li(b('项目特色：'), t('全球最国际化的 MiM（70+ 国籍同学）；可在法国/新加坡两校区学习')),
    li(b('适合人群：'), t('想要极度国际化体验的应届生')),

    h3('Master in Finance (MFin)'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 €41,000')),
    li(b('工作经验：'), t('3+ 年金融经验')),
    li(b('项目特色：'), t('与 LBS MiF 定位类似，面向有经验的金融从业者')),
    hr(),

    // ─── ESSEC ───
    h2('ESSEC Business School'),
    p(t('ESSEC 高等经济商业学院，巴黎近郊，与 HEC 并称法国商科双雄。新加坡有分校区。')),

    h3('Master in Management (Grande Ecole)'),
    li(b('学制：'), t('2-3 年（含实习和交换）')),
    li(b('学费：'), t('约 €45,000（全程）')),
    li(b('录取要求：'), t('GMAT 650+；IELTS 7.0+')),
    li(b('项目特色：'), t('灵活学制（可选 2 年或 3 年含 gap year 实习）；新加坡校区可选')),
    li(b('方向：'), t('Finance / Marketing / Strategy / Entrepreneurship / Hospitality Management')),

    h3('MSc in Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €25,000')),
    li(b('项目特色：'), t('CFA 合作；学费性价比极高')),

    h3('MSc in Data Sciences and Business Analytics（与 CentraleSupélec 联合）'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €25,000')),
    li(b('项目特色：'), t('商学院+顶尖工程院校联合；数据科学+商业双学位')),

    h3('MSc in Marketing Management and Digital'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €22,000')),
    li(b('项目特色：'), t('数字营销+奢侈品营销；巴黎位置优势')),

    h3('MSc in Hospitality Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €22,000')),
    li(b('项目特色：'), t('法国酒店/奢侈品酒店管理强项')),
    hr(),

    // ─── ESCP ───
    h2('ESCP Business School'),
    p(t('ESCP 欧洲管理学院，世界上最古老的商学院（1819 年创立），6 个欧洲校区：巴黎/伦敦/柏林/马德里/都灵/华沙。')),

    h3('Master in Management (Grande Ecole / MiM)'),
    li(b('学制：'), t('2 年（可在 2-3 个校区轮换）')),
    li(b('学费：'), t('约 €40,000（2 年总计）')),
    li(b('录取要求：'), t('GMAT 650+；IELTS 7.0+')),
    li(b('项目特色：'), t('2 年可在 2-3 个欧洲城市学习（如巴黎+伦敦+柏林）；FT MiM 排名全球 Top 10')),
    li(b('适合人群：'), t('想体验多个欧洲城市和文化的应届生')),

    h3('MSc in Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €24,000')),
    li(b('项目特色：'), t('可选巴黎或伦敦校区')),

    h3('MSc in Digital Project Management & Consulting'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €22,000')),
    li(b('项目特色：'), t('数字化咨询方向')),

    h3('MSc in Marketing & Creativity'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €22,000')),

    h3('MSc in Big Data & Business Analytics'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €22,000')),
    li(b('项目特色：'), t('柏林或巴黎校区可选')),
    hr(),

    // ─── EDHEC ───
    h2('EDHEC Business School'),
    p(t('EDHEC 北方高等商学院，以金融硕士闻名，CFA 合作最深入的法国商学院。里尔/尼斯/巴黎校区。')),

    h3('MSc in Finance'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €30,000')),
    li(b('录取要求：'), t('GMAT 600+；IELTS 6.5+')),
    li(b('项目特色：'), t('FT 金融硕士排名全球前 5；CFA 合作项目（覆盖 CFA 1-2 级内容）；学费性价比极高')),
    li(b('方向：'), t('Financial Markets / Corporate Finance & Banking')),
    li(b('就业数据：'), t('平均起薪 €45,000-€55,000')),
    li(b('适合人群：'), t('目标 CFA + 金融行业，追求高排名+低学费')),

    h3('MSc in Financial Markets'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €28,000')),
    li(b('项目特色：'), t('金融市场交易方向')),

    h3('MSc in Data Analytics & Artificial Intelligence'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €25,000')),

    h3('MSc in Global Business Management'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 €22,000')),
    hr(),

    // ─── emlyon ───
    h2('emlyon Business School'),
    p(t('里昂高等商学院，位于里昂（法国第二大城市），以创业和数字化转型闻名。')),

    h3('MSc in Finance'),
    li(b('学制：'), t('18 个月')),
    li(b('学费：'), t('约 €28,000')),
    li(b('项目特色：'), t('含实习；里昂金融行业连接')),

    h3('MSc in Digital Marketing & Data Science'),
    li(b('学制：'), t('18 个月')),
    li(b('学费：'), t('约 €25,000')),
    li(b('项目特色：'), t('数字营销+数据科学交叉')),

    h3('Global BBA → MSc 路径'),
    li(b('项目特色：'), t('本硕连读选项，适合本科阶段规划')),
    hr(),

    // ─── IE Business School (西班牙) ───
    h2('IE Business School（西班牙马德里）'),
    p(t('IE 商学院，欧洲创业之王，位于马德里市中心。以创业和科技管理闻名。')),

    h3('Master in Management (MiM)'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 €38,000')),
    li(b('录取要求：'), t('GMAT 650+；IELTS 7.0+')),
    li(b('项目特色：'), t('FT MiM 排名全球前 10；极度创业导向；IE Venture Lab')),
    li(b('适合人群：'), t('有创业想法或目标创新/科技管理的应届生')),

    h3('Master in Finance'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 €42,000')),
    li(b('项目特色：'), t('金融科技方向强')),

    h3('Master in Business Analytics and Big Data'),
    li(b('学制：'), t('10 个月')),
    li(b('学费：'), t('约 €38,000')),
    li(b('项目特色：'), t('商业分析+大数据；与西班牙科技创业生态结合')),
    hr(),

    // ─── SDA Bocconi (意大利) ───
    h2('SDA Bocconi School of Management（意大利米兰）'),
    p(t('博科尼大学商学院，意大利第一商学院，位于米兰（时尚/奢侈品之都）。')),

    h3('MSc in Finance'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 €14,000/年（欧盟外学生约 €20,000/年）')),
    li(b('录取要求：'), t('GMAT 650+；IELTS 7.0+')),
    li(b('项目特色：'), t('学费极低（意大利公立体系）；FT 金融硕士排名前 15')),
    li(b('就业方向：'), t('投行、资管、咨询（伦敦/米兰为主）')),
    li(b('适合人群：'), t('追求极致性价比 + 好排名的金融方向学生')),

    h3('MSc in Management and Technology'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 €14,000-€20,000/年')),

    h3('MSc in Marketing Management'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 €14,000-€20,000/年')),
    li(b('项目特色：'), t('米兰奢侈品/时尚营销优势')),

    h3('MSc in Data Science and Business Analytics'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 €14,000-€20,000/年')),
    hr(),

    // ─── 通用信息 ───
    h2('法国/欧洲通用信息'),

    h3('签证与工作'),
    li(b('法国 APS 签证'), t('：硕士毕业后 1 年找工作')),
    li(b('Talent Passport'), t('：年薪 ≥ 法定最低工资 2 倍即可申请，4 年可续签')),
    li(b('法国学生打工'), t('：每年 964 小时（约 20 小时/周）')),
    li(b('西班牙'), t('：毕业后 1 年找工作签证')),
    li(b('意大利'), t('：毕业后 1 年找工作签证')),

    h3('费用对比（极具优势）'),
    li(t('Grande Ecole MiM（2 年）：€30,000-€50,000 学费')),
    li(t('MSc（1 年）：€20,000-€38,000 学费')),
    li(t('巴黎生活费：€1,200-€2,000/月')),
    li(t('非巴黎城市：€800-€1,200/月')),
    li(t('法国 CAF 住房补贴可覆盖 30-50% 房租')),
    li(b('2 年 MiM 总费用：约 40-58 万人民币'), t('（远低于英国 1 年 MSc）')),

    h3('法语问题'),
    li(t('所有推荐项目都是英语授课，不需要法语入学')),
    li(t('但日常生活和部分就业机会需要法语能力')),
    li(t('建议入学后开始学法语，A2-B1 水平即可日常交流')),
    li(t('如果目标留在法国工作，法语是重要加分项')),
    hr(),

    quote(b('选校提醒：'), t('法国/欧洲商科的隐藏价值在 MiM/Grande Ecole：FT 排名比很多英美 MSc 更高，学费却低一半。Bocconi 更是学费洼地。想要性价比，欧洲是最优选。')),
  ],
};
