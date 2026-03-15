/**
 * 海外咨询求职情报挖掘 · 第1轮
 * 母源：Management Consulted + IGotAnOffer
 * 挖掘日期：2026-03-12
 */
import { type Page, h1, h2, h3, p, t, b, li, ol, hr, quote } from './blocks';

function tableBlock(headers: string[], rows: string[][]) {
  return { __table: true as const, headers, rows };
}

export const page: Page = {
  title: '海外情报挖掘·第1轮：Management Consulted × IGotAnOffer',
  parent: 'Part 5：海外咨询求职情报库',
  blocks: [
    h1('海外情报挖掘·第1轮'),
    p(b('挖掘日期：'), t('2026-03-12')),
    p(b('母源：'), t('Management Consulted（咨询求职头部站点） + IGotAnOffer（方法论体系最完整的prep站点）')),
    p(b('筛选标准：'), t('优先深度指南 > 真实经验 > 方法论总结。排除纯SEO文、无案例浅文、广告页。')),
    hr(),

    // ═══════════════════════════════════════════
    // 第1篇
    // ═══════════════════════════════════════════
    h2('① Case Interview: Complete Prep Guide (2025)'),

    tableBlock(
      ['字段', '内容'],
      [
        ['平台', 'Management Consulted'],
        ['作者', 'Management Consulted 编辑团队'],
        ['链接', 'https://managementconsulted.com/case-interview/'],
        ['内容类型', '旗舰级方法论指南'],
        ['适合人群', '新手入门 → 中级提升均适用'],
        ['目标公司', '通用（MBB + T2 均覆盖）'],
        ['目标阶段', 'Case Interview 全流程'],
      ]
    ) as any,

    h3('内容结构'),
    li(t('8大case组件拆解：problem capture → framework → data request → math → insights → recommendation')),
    li(t('Framework使用哲学：强调"框架是工具不是模板"，明确反对死记硬背Porter\'s Five Forces然后硬套')),
    li(t('Case Math四步法：recap → structure → run numbers → develop insights')),
    li(t('练习量标准：顶级候选人需完成30-50次完整verbal case practice')),

    h3('核心经验 / 可复用方法'),
    ol(b('"Framework as guide, not script"哲学'), t(' — 面试官最反感的就是候选人把所有case往一个框架里塞。核心技能是"听完题后现场搭建适配框架"')),
    ol(b('Case Math不是算对就行'), t(' — 面试官评估的是"你能不能把思考过程说出来"，四步法解决的是沟通问题而非计算问题')),
    ol(b('McKinsey要精确到个位数，BCG/Bain可以适当四舍五入'), t(' — 这是firm-specific的关键差异')),
    ol(b('自我评估四维度：'), t('structure / communication / quantitative accuracy / creative problem-solving')),

    h3('适合改写给中国学生吗？'),
    p(b('非常适合。'), t('中国学生最常见的两个问题——"背框架"和"只算不说"——这篇文章直接解决。可改写为"Case Interview的4个致命误区"类型的小红书/公众号文章。')),
    hr(),

    // ═══════════════════════════════════════════
    // 第2篇
    // ═══════════════════════════════════════════
    h2('② 5 Tips for McKinsey Case Interview'),

    tableBlock(
      ['字段', '内容'],
      [
        ['平台', 'Management Consulted'],
        ['作者', 'Management Consulted 编辑团队'],
        ['链接', 'https://managementconsulted.com/5-tips-for-mckinsey-case-interview/'],
        ['内容类型', 'Firm-specific深度指南'],
        ['适合人群', '冲MBB / 冲McKinsey'],
        ['目标公司', 'McKinsey'],
        ['目标阶段', 'Case Interview + PEI'],
      ]
    ) as any,

    h3('内容结构'),
    li(t('McKinsey interviewer-led格式详解（与BCG/Bain candidate-led的本质区别）')),
    li(t('5个McKinsey特有要求：极致结构化、精确计算、30秒思考停顿、二三层级insight、answer-first表达')),
    li(t('Pyramid Principle在面试中的实战应用')),
    li(t('与Barbara Minto金字塔原理的关联')),

    h3('核心经验 / 可复用方法'),
    ol(b('McKinsey的"结构化"不只是开头搭框架'), t(' — 它贯穿笔记、数学、brainstorming、结论的每一个环节。面试官在评估你整个思维过程是否有组织')),
    ol(b('Answer-first表达法'), t(' — 先说结论再说理由。"Here is what I recommend" → 然后用supporting arguments支撑。这和大多数人"先分析后给结论"的习惯完全相反')),
    ol(b('数学精度要求'), t(' — McKinsey要求算到个位数（不能四舍五入到十位），这反映了其风控文化')),
    ol(b('"Deeper insights"'), t(' — McKinsey不满足于表面分析，会追问"so what"和"why does this matter"')),

    h3('适合改写给中国学生吗？'),
    p(b('极度适合。'), t('中国学生最容易踩的坑就是"用BCG的方式准备McKinsey"。可改写为"McKinsey面试和BCG/Bain到底有什么不同？5个你必须知道的差异"，是小红书爆款选题。')),
    hr(),

    // ═══════════════════════════════════════════
    // 第3篇
    // ═══════════════════════════════════════════
    h2('③ McKinsey Case Interview: The Only Post You\'ll Need to Read'),

    tableBlock(
      ['字段', '内容'],
      [
        ['平台', 'IGotAnOffer'],
        ['作者', 'IGotAnOffer 编辑团队'],
        ['链接', 'https://igotanoffer.com/blogs/mckinsey-case-interview-blog/115672708-mckinsey-case-interview-preparation-the-only-post-youll-need-to-read'],
        ['内容类型', '旗舰级firm-specific全流程指南'],
        ['适合人群', '冲McKinsey的全阶段候选人'],
        ['目标公司', 'McKinsey'],
        ['目标阶段', '申请 → Case → PEI → Offer'],
      ]
    ) as any,

    h3('内容结构'),
    li(t('McKinsey interviewer-led面试的5部分标准流程：Situation → Framework Question → Quantitative Question → Creativity Question → Recommendation')),
    li(t('McKinsey三大核心评估维度：problem-solving ability / communication skills / personal experience alignment')),
    li(t('PEI（Personal Experience Interview）详解：4个反复出现的主题，每个主题准备2-3个故事')),
    li(t('官方练习case推荐：Diconsa, Electro-Light, GlobaPharm, "Transforming a National Education System"')),
    li(t('沉默是red flag的明确警告')),

    h3('核心经验 / 可复用方法'),
    ol(b('McKinsey面试的5段式结构是固定的'), t(' — 掌握每段的评估重点，比盲目刷题有效10倍')),
    ol(b('PEI不是"附加题"'), t(' — 至少占10分钟（first + second round都有），而且是独立评估维度')),
    ol(b('McKinsey官方公开了4个练习case'), t(' — 多数候选人不知道或没认真做，这是免费的"真题"')),
    ol(b('沉默 = 红旗'), t(' — 哪怕在想，也要说出来"Let me think about this for a moment"')),

    h3('适合改写给中国学生吗？'),
    p(b('非常适合。'), t('可拆成两篇："McKinsey面试的5个固定环节（附官方真题链接）" + "PEI怎么准备？McKinsey最看重的4类故事"。中国学生普遍忽视PEI，以为case做好就行，这是最大盲区。')),
    hr(),

    // ═══════════════════════════════════════════
    // 第4篇
    // ═══════════════════════════════════════════
    h2('④ Common Case Interview Frameworks (and how to create your own)'),

    tableBlock(
      ['字段', '内容'],
      [
        ['平台', 'IGotAnOffer'],
        ['作者', 'IGotAnOffer 编辑团队'],
        ['链接', 'https://igotanoffer.com/blogs/mckinsey-case-interview-blog/118288068-case-interviews-frameworks-comprehensive-guide'],
        ['内容类型', '方法论 + 实操指南'],
        ['适合人群', '新手到中级（尤其适合从"背框架"过渡到"搭框架"的阶段）'],
        ['目标公司', '通用'],
        ['目标阶段', 'Case Interview框架阶段'],
      ]
    ) as any,

    h3('内容结构'),
    li(t('7大常用框架详解：Profitability / 4Ps / Porter\'s Five Forces / Market Entry / M&A / Pricing / Problem Solving')),
    li(t('每个框架配真实case演示（McKinsey + Bain源）')),
    li(t('框架定制化方法论（Framework Development Method）：extract main elements → break into components → communicate structure')),
    li(t('行业特定定制示例（retail vs healthcare vs tech）')),
    li(t('Marc Cosentino《Case in Point》方法的批判性评价')),

    h3('核心经验 / 可复用方法'),
    ol(b('"面试官一眼就能看出你在套框架"'), t(' — 这是被扣分最多的行为之一')),
    ol(b('Framework Development Method三步法'), t('：①从题目中提取核心要素 → ②拆解为子组件 → ③清晰表达给面试官。这个方法可以现场用于任何case')),
    ol(b('行业定制化'), t('：零售case加入foot traffic / store footprint；医疗case加入regulatory hurdles / patient adoption — 这体现的是business acumen')),
    ol(b('7个框架不是用来"选一个套上去"的'), t('，而是用来"拆零件重新组装"的')),

    h3('适合改写给中国学生吗？'),
    p(b('极其适合。'), t('中国学生最大的框架误区就是"背→选→套"。可改写为"Case Interview框架的正确用法：不是选框架，是造框架"，直击痛点。')),
    hr(),

    // ═══════════════════════════════════════════
    // 第5篇
    // ═══════════════════════════════════════════
    h2('⑤ STAR Method: Should it be Used in Fit Interviews?'),

    tableBlock(
      ['字段', '内容'],
      [
        ['平台', 'Management Consulted'],
        ['作者', 'Management Consulted 编辑团队'],
        ['链接', 'https://managementconsulted.com/star-method/'],
        ['内容类型', 'Behavioral / Fit Interview方法论'],
        ['适合人群', '所有人（尤其是fit interview薄弱的候选人）'],
        ['目标公司', '通用（MBB + T2）'],
        ['目标阶段', 'Fit / Behavioral Interview'],
      ]
    ) as any,

    h3('内容结构'),
    li(t('STAR方法的正确理解：它是隐形结构，不是填空模板')),
    li(t('Situation选择策略：不是选"最牛的经历"，而是选"能展示咨询相关能力的经历"')),
    li(t('Action环节的核心：展示decision-making under uncertainty — 解释为什么选A而不是B或C')),
    li(t('坏STAR vs 好STAR的对比：机械感 vs 故事感')),
    li(t('三类behavioral问题分型：direct questions / story questions / tricky questions')),

    h3('核心经验 / 可复用方法'),
    ol(b('顶级fit回答不会宣布"这是我的situation"'), t(' — 它像讲故事一样自然流淌，STAR结构在后台无形运行')),
    ol(b('Situation选择 = 策略决策'), t(' — 你选什么故事，决定了你能展示什么能力。不要默认选"最impressive的"，要选"最能讨论problem-solving / leadership / stakeholder management的"')),
    ol(b('Tricky questions的评估对象是"判断力+真实性"'), t(' — 不要把失败包装成"学习经验"，要展示真正的反思和行为改变')),
    ol(b('Action环节要暴露思考过程'), t(' — 面试官要看到你在不确定环境下如何做判断，而不是"我执行了一个方案"')),

    h3('适合改写给中国学生吗？'),
    p(b('非常适合。'), t('中国学生fit interview两大问题：①太机械（像背答案）②选故事不策略（只挑"最牛"的讲）。可改写为"Fit Interview的秘密：面试官听的不是你有多牛，而是你怎么想"。')),
    hr(),

    // ═══════════════════════════════════════════
    // 本轮总结
    // ═══════════════════════════════════════════
    h2('本轮挖掘总结'),

    h3('最值得沉淀的方法论'),
    li(t('"框架是工具不是模板" + Framework Development Method三步法')),
    li(t('Answer-first表达法（Pyramid Principle在面试中的应用）')),
    li(t('Case Math四步法（recap → structure → run numbers → develop insights）')),
    li(t('STAR隐形化：结构在后台运行，前台是自然叙事')),

    h3('MBB三家的核心差异'),
    li(b('McKinsey：'), t('interviewer-led，精确计算，answer-first，极致结构化，PEI深度追问')),
    li(b('BCG：'), t('candidate-led，创造力优先，对话式，鼓励定制框架，重视非典型case')),
    li(b('Bain：'), t('实用主义，关系导向，重人格和团队协作，面试中后段可能转为自由对话')),

    h3('中国学生最大盲区'),
    li(t('PEI准备不足：以为case做好就行，忽视行为面占10-30分钟')),
    li(t('Fit Interview机械化：像背答案而不是讲故事')),
    li(t('背框架硬套：面试官一眼看穿，直接扣分')),
    li(t('不知道McKinsey有官方练习case（Diconsa等4个免费真题）')),
    li(t('McKinsey vs BCG准备方式混用：interviewer-led和candidate-led需要完全不同的策略')),

    h3('可直接改写的爆款选题'),
    ol(t('"McKinsey vs BCG面试到底有什么不同？5个关键差异"')),
    ol(t('"Case Interview框架的正确用法：不是选框架，是造框架"')),
    ol(t('"Fit Interview的秘密：面试官听的不是你有多牛，而是你怎么想"')),
    ol(t('"PEI怎么准备？McKinsey最看重的4类故事"')),
    ol(t('"Case Interview的4个致命误区（附McKinsey官方免费真题）"')),

    h3('下一轮计划'),
    li(t('母源：CaseCoach + PrepLounge（补充firm差异和社区视角）')),
    li(t('或切换到：Reddit r/consulting + Medium（抓真实候选人复盘帖）')),
  ],
};
