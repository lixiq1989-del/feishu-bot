import { Page, h1, h2, h3, p, t, b, li, ol, hr, quote } from './blocks';

export const page: Page = {
  title: '澳大利亚商科硕士 · 逐校逐项目详解',
  blocks: [
    h1('澳大利亚商科硕士完全指南'),
    p(t('澳洲八大全部进入 QS 前 100，毕业后可获 2-4 年 PSW 工签，移民政策相对友好。双非学生门槛低于英港，是性价比较高的选择。')),
    p(b('关键优势：'), t('QS 排名稳 + 双非友好 + 长期工签 + 移民可能 + 可打工补贴生活。')),
    p(b('关键提醒：'), t('选 2 年制项目！2024 新政后 1 年制硕士 PSW 仅 18 个月，2 年制 = 3 年 PSW。')),
    hr(),

    // ─── 墨大 ───
    h2('University of Melbourne（墨尔本大学）'),
    p(t('QS 2025 全球 #13，澳洲综合排名第一。Melbourne Business School 是澳洲最强商学院。')),

    h3('Master of Finance'),
    li(b('学制：'), t('1.5 年 / 2 年（视本科背景）')),
    li(b('学费：'), t('约 AUD $50,000/年')),
    li(b('录取要求：'), t('GMAT 推荐 630+（非必须）；IELTS 6.5+（单项 6.0+）')),
    li(b('GPA：'), t('985 建议 80+，211 建议 82+，双非 85+')),
    li(b('核心课程：'), t('公司金融、资产定价、衍生品、投资组合、金融计量')),
    li(b('项目特色：'), t('CFA 合作项目；墨尔本金融中心；2 年制可拿 3 年 PSW')),
    li(b('就业数据：'), t('平均起薪 AUD $70,000-$85,000/年')),
    li(b('主要雇主：'), t('CBA、ANZ、Macquarie、NAB、Westpac')),
    li(b('适合人群：'), t('金融/经济背景，想留澳发展')),

    h3('Master of Management'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $48,000/年')),
    li(b('录取要求：'), t('IELTS 6.5+；不需要 GMAT')),
    li(b('GPA：'), t('985/211 建议 78+，双非 82+')),
    li(b('方向选择：'), t('Finance / Marketing / Accounting / HRM')),
    li(b('项目特色：'), t('2 年制 = 3 年 PSW；接受任何本科背景转商科')),
    li(b('适合人群：'), t('非商科背景想转商科，或想要 2 年学制拿长 PSW')),

    h3('Master of Business Analytics'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 AUD $50,000（总计）')),
    li(b('录取要求：'), t('IELTS 7.0+；需有定量背景')),
    li(b('GPA：'), t('985/211 建议 80+，双非 85+')),
    li(b('项目特色：'), t('1 年快速毕业但 PSW 仅 18 个月；墨大品牌强')),
    li(b('注意：'), t('如果想要长 PSW，考虑 2 年的 Master of Management（选 Analytics 方向）')),

    h3('Master of Marketing'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $46,000/年')),
    li(b('项目特色：'), t('品牌管理+数字营销；墨尔本消费品市场')),

    h3('Master of Enterprise'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 AUD $48,000')),
    li(b('项目特色：'), t('创业+创新管理方向')),
    hr(),

    // ─── UNSW ───
    h2('UNSW Business School（新南威尔士大学）'),
    p(t('QS 2025 全球 #19。位于悉尼，金融/会计方向澳洲最强之一。')),

    h3('Master of Finance'),
    li(b('学制：'), t('1.5 年')),
    li(b('学费：'), t('约 AUD $48,000/年')),
    li(b('录取要求：'), t('IELTS 7.0+（单项 6.0+）；GMAT 不要求')),
    li(b('GPA：'), t('985/211 建议 76+，双非 80+')),
    li(b('核心课程：'), t('公司金融、投资管理、金融建模、衍生品')),
    li(b('项目特色：'), t('悉尼 CBD 位置；CFA 合作；UNSW 金融学术声誉极强')),
    li(b('就业数据：'), t('平均起薪 AUD $70,000-$85,000/年')),
    li(b('适合人群：'), t('金融背景，目标悉尼金融行业')),

    h3('Master of Commerce'),
    li(b('学制：'), t('1.5 年 / 2 年（取决于本科背景）')),
    li(b('学费：'), t('约 AUD $48,000/年')),
    li(b('方向选择：'), t('Finance / Marketing / HRIS / Business Analytics')),
    li(b('录取要求：'), t('IELTS 7.0+；GPA 985/211 建议 72+，双非 76+')),
    li(b('项目特色：'), t('2 年制可选多个方向；灵活度高')),
    li(b('适合人群：'), t('想要灵活选方向 + 2 年学制')),

    h3('Master of Financial Analysis'),
    li(b('学制：'), t('1 年')),
    li(b('学费：'), t('约 AUD $48,000')),
    li(b('项目特色：'), t('CFA 深度合作（覆盖 CFA 1-3 级内容）')),

    h3('Master of Professional Accounting'),
    li(b('学制：'), t('1.5 年')),
    li(b('学费：'), t('约 AUD $46,000/年')),
    li(b('项目特色：'), t('CPA Australia + CAANZ 认证；转会计首选')),

    h3('Master of Professional Accounting (Extension)'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $46,000/年')),
    li(b('项目特色：'), t('2 年制 = 3 年 PSW；会计在技术移民职业列表上')),
    li(b('适合人群：'), t('转会计 + 想要移民路径')),

    h3('Master of Business Analytics'),
    li(b('学制：'), t('1.5 年')),
    li(b('学费：'), t('约 AUD $48,000/年')),
    li(b('项目特色：'), t('数据分析+商业决策；UNSW 数据科学/工程学院交叉')),
    hr(),

    // ─── 悉大 ───
    h2('University of Sydney Business School'),
    p(t('QS 2025 全球 #18。悉尼最古老的大学，品牌极强，位于市中心附近。')),

    h3('Master of Commerce'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $52,000/年')),
    li(b('方向选择：'), t('Finance / Business Analytics / Marketing / Accounting / Business Law')),
    li(b('录取要求：'), t('IELTS 7.0+；GPA 985/211 建议 78+，双非 82+')),
    li(b('项目特色：'), t('2 年制 = 3 年 PSW；方向灵活可选多个；悉大品牌回国认可度最高')),
    li(b('就业数据：'), t('Finance 方向平均起薪 AUD $65,000-$80,000/年')),
    li(b('适合人群：'), t('想要悉大品牌 + 灵活方向 + 长 PSW')),

    h3('Master of Professional Accounting'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $50,000/年')),
    li(b('项目特色：'), t('CPA/CAANZ 认证；2 年制适合移民规划')),

    h3('Master of Business Administration (Professional, non-MBA track)'),
    p(t('注：这里特指 Master of Management 等非 MBA 管理类项目。')),
    hr(),

    // ─── Monash ───
    h2('Monash Business School'),
    p(t('QS 2025 全球 #37。墨尔本第二所顶尖大学，商科项目全面。')),

    h3('Master of Banking and Finance'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $46,000/年')),
    li(b('录取要求：'), t('IELTS 6.5+；GPA 985/211 建议 75+，双非 78+')),
    li(b('项目特色：'), t('银行+金融双修；CFA 合作')),
    li(b('适合人群：'), t('目标银行/金融服务行业')),

    h3('Master of Applied Finance'),
    li(b('学制：'), t('1-2 年')),
    li(b('学费：'), t('约 AUD $46,000/年')),
    li(b('项目特色：'), t('应用型金融硕士，偏实践')),

    h3('Master of Business Analytics'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $46,000/年')),
    li(b('项目特色：'), t('Monash 数据科学/IT 学院交叉资源')),

    h3('Master of Professional Accounting'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $44,000/年')),
    li(b('项目特色：'), t('CPA Australia 认证')),

    h3('Master of Marketing'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $44,000/年')),

    h3('Master of Management'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $44,000/年')),
    li(b('项目特色：'), t('接受任何背景转商科')),
    hr(),

    // ─── ANU ───
    h2('ANU College of Business and Economics（澳洲国立大学）'),
    p(t('QS 2025 全球 #30。位于堪培拉（首都），政策/经济研究方向强。堪培拉属偏远地区，PSW 额外 +1-2 年。')),

    h3('Master of Finance'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $47,000/年')),
    li(b('录取要求：'), t('IELTS 6.5+；GPA 985/211 建议 75+，双非 78+')),
    li(b('项目特色：'), t('2 年 = 3 年 PSW + 偏远地区额外 1-2 年 = 最长 5 年工签')),
    li(b('适合人群：'), t('想要最长工签 + 移民优势')),

    h3('Master of Applied Finance'),
    li(b('学制：'), t('1.5 年')),
    li(b('学费：'), t('约 AUD $47,000/年')),

    h3('Master of Financial Management'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $47,000/年')),
    li(b('项目特色：'), t('金融管理方向，接受非金融背景')),

    h3('Master of Commerce'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $45,000/年')),
    li(b('方向：'), t('Finance / Accounting / Business Information Systems')),

    h3('Master of Professional Accounting'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $45,000/年')),
    li(b('项目特色：'), t('CPA 认证 + 堪培拉偏远地区移民加分')),

    h3('Master of Applied Data Analytics'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $45,000/年')),
    li(b('项目特色：'), t('ANU 统计/计算学院交叉')),
    hr(),

    // ─── UQ ───
    h2('UQ Business School（昆士兰大学）'),
    p(t('QS 2025 全球 #40。位于布里斯班，气候温暖，生活成本较悉尼/墨尔本低。')),

    h3('Master of Commerce (MCom)'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $44,000/年')),
    li(b('方向：'), t('Applied Finance / Professional Accounting / Information Systems / Business Analytics')),
    li(b('录取要求：'), t('IELTS 6.5+；GPA 985/211 建议 75+，双非 78+')),
    li(b('项目特色：'), t('方向灵活；布里斯班生活成本低；2 年制 PSW 3 年')),

    h3('Master of Business'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $42,000/年')),
    li(b('项目特色：'), t('接受非商科背景')),

    h3('Master of Financial Mathematics'),
    li(b('学制：'), t('1.5 年')),
    li(b('学费：'), t('约 AUD $44,000/年')),
    li(b('项目特色：'), t('数学+金融交叉；偏量化')),
    hr(),

    // ─── Adelaide ───
    h2('University of Adelaide Business School'),
    p(t('QS 2025 全球 #89。位于阿德莱德（偏远地区），学费低 + PSW 长 + 移民加分多。')),

    h3('Master of Finance'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $44,000/年')),
    li(b('录取要求：'), t('IELTS 6.5+；GPA 建议 75+')),
    li(b('项目特色：'), t('偏远地区 = PSW 4 年 + 移民加分 + 生活成本低')),

    h3('Master of Professional Accounting'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $42,000/年')),
    li(b('项目特色：'), t('会计+移民最佳路径之一')),

    h3('Master of Applied Finance'),
    li(b('学制：'), t('1.5 年')),
    li(b('学费：'), t('约 AUD $44,000/年')),

    h3('Master of Commerce'),
    li(b('学制：'), t('2 年')),
    li(b('学费：'), t('约 AUD $42,000/年')),
    li(b('方向：'), t('Accounting / Finance / Marketing')),
    hr(),

    // ─── UWA ───
    h2('UWA Business School（西澳大学）'),
    p(t('QS 2025 全球 #77。位于珀斯（偏远地区），矿业/能源行业强。')),

    h3('Master of Commerce'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $42,000/年')),
    li(b('方向：'), t('Finance / Marketing / Business Information and Logistics')),
    li(b('项目特色：'), t('偏远地区 = PSW 4 年；珀斯矿业/能源公司就业机会')),

    h3('Master of Professional Accounting'),
    li(b('学制：'), t('1.5 年 / 2 年')),
    li(b('学费：'), t('约 AUD $40,000/年')),
    hr(),

    // ─── 通用信息 ───
    h2('澳洲通用信息'),

    h3('申请时间线'),
    li(b('2 月入学'), t('：前一年 7-10 月申请')),
    li(b('7 月入学'), t('：当年 1-3 月申请')),
    li(t('澳洲申请无严格轮次，先到先得')),
    li(b('Con-offer'), t('：可先拿有条件录取，后补语言/毕业证明')),
    li(t('建议提前 6 个月申请')),

    h3('PSW 工签（极重要）'),
    li(b('2 年制硕士'), t('：3 年 PSW')),
    li(b('1 年制/1.5 年制硕士'), t('：18 个月 PSW（2024 新政缩短）')),
    li(b('偏远地区额外 +1-2 年'), t('：堪培拉/阿德莱德/珀斯/布里斯班等')),
    li(b('最长可达 4-5 年'), t('（2 年制 + 偏远地区）')),
    p(b('结论：'), t('强烈建议选 2 年制项目。1.5 年制如果学校允许也可以，但 PSW 只有 18 个月。')),

    h3('移民路径'),
    li(b('189 独立技术移民'), t('：会计/审计在职业列表上')),
    li(b('190 州担保'), t('：各州紧缺职业不同')),
    li(b('491 偏远地区签证'), t('：偏远地区读书+工作有额外加分')),
    li(b('加分项'), t('：年龄（25-32 岁最佳）+ 英语（PTE/IELTS 8 分）+ 工作经验 + 学历')),

    h3('费用总结'),
    li(t('学费：AUD $40,000-$52,000/年')),
    li(t('悉尼/墨尔本生活费：AUD $2,000-$3,000/月')),
    li(t('其他城市生活费：AUD $1,200-$2,000/月')),
    li(b('2 年总费用：约 55-80 万人民币（悉尼/墨尔本）')),
    li(b('2 年总费用：约 40-60 万人民币（其他城市）')),
    li(t('可打工每两周 48 小时，时薪 AUD $23+，可覆盖部分生活费')),

    h3('澳洲 vs 其他地区优势'),
    li(b('双非最友好'), t('：澳洲八大对双非学生录取门槛远低于英港')),
    li(b('最长工签'), t('：3-5 年 PSW（英国 2 年，香港 2 年）')),
    li(b('移民可能'), t('：唯一有明确移民路径的主流留学目的地')),
    li(b('Con-offer'), t('：可先锁定位置，后补条件')),
    hr(),

    quote(b('选校提醒：'), t('澳洲商科选校核心 = 2 年学制 + 城市选择。想留澳：选偏远地区（ANU/Adelaide/UWA）拿最长 PSW + 移民加分。想回国：选墨大/UNSW/悉大 QS 排名最高。')),
  ],
};
