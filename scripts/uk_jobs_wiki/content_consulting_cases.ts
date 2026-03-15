import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '🧩 咨询公司真实Case题库（MBB + Tier 2）',
  blocks: [
    p(t('来源：Management Consulted、CaseCoach、Reddit r/consulting、Glassdoor、The Case Interview Bible，以及真实面试者分享。按公司整理真实题目和答题结构。')),
    hr(),

    // ═══════════════════════════════════════════════
    h2('McKinsey London — 真实Case题库'),
    // ═══════════════════════════════════════════════

    h3('2024年真实Case题（已知）'),
    li(b('题目1 — NHS盈利能力：'), t('"你的客户是NHS Trust，过去3年成本超支15%，当局要求在不降低护理质量的前提下削减8%成本。你怎么做？"')),
    p(b('破题结构：')),
    li(t('先拆解成本结构：人员 / 药品耗材 / 基础设施 / 行政IT')),
    li(t('识别可控vs不可控成本（临床路径、用药决策 vs 薪资协议）')),
    li(t('标杆对比（Benchmarking）：同类NHS Trust的成本是多少')),
    li(t('建议优先级：削减行政层而非临床，同时做流程优化（等待时间、出院流程）')),

    li(b('题目2 — 零售商数字化：'), t('"一家英国中型超市链（300家门店，年收入£2B），线上销售占比只有5%，竞争对手平均15%。你被聘来帮他们制定数字化战略。"')),
    p(b('破题结构：')),
    li(t('先诊断原因：技术/配送基础设施不足？产品选择？用户体验？定价？')),
    li(t('市场细分：哪类消费者在线上买，他们现在去哪买（Ocado/Tesco/Amazon Fresh）？')),
    li(t('方案：自建vs合作（如Deliveroo/Uber Eats/Ocado白标）；优先城市还是全国？')),
    li(t('风险：蚕食线下销售、利润率下降（线上履约成本高于店内）')),

    li(b('题目3 — PE退出策略：'), t('"PE客户持有一家英国中型物流公司（£50M EBITDA），想在18个月内退出。你来评估退出路径和估值。"')),
    p(b('破题结构：')),
    li(t('退出路径：Strategic sale / Secondary PE / IPO（市场窗口）/ 分拆出售')),
    li(t('估值参考：行业EV/EBITDA倍数（物流通常6-10x）→ EV = £300-500M')),
    li(t('提升估值路径：18个月能做什么？收购补强、客户结构优化、EBITDA margin提升')),
    li(t('买家圈定：哪类战略买家会感兴趣（DHL、XPO、Kuehne+Nagel）')),

    h3('McKinsey PEI — 按主题的完整例题'),

    tableBlock(
      ['PEI主题', '面试官实际提问', '最常见的追问'],
      [
        ['Leadership（领导力）', '"Tell me about a time you changed the direction of a team that was heading the wrong way."', '"How did you know it was the wrong direction?" / "What resistance did you face?" / "What was the actual outcome in numbers?"'],
        ['Impact（影响力）', '"Tell me about the most significant impact you\'ve had in a professional setting."', '"What exactly did you personally do?" / "How do you know it was you vs the team?" / "What would have happened without your intervention?"'],
        ['Entrepreneurial Drive', '"Tell me about a time you identified an opportunity and pursued it against the odds."', '"Why did you believe in it when others didn\'t?" / "What would you do differently?" / "What did you fail at?"'],
      ]
    ),

    p(b('McKinsey的PEI最爱追问量化：'), t('每个故事必须准备好数字。"改善了"不够，要说"降低成本23%"、"团队从7人完成了原本需要12人的工作量"。')),
    hr(),

    // ═══════════════════════════════════════════════
    h2('BCG London — 真实Case题库'),
    // ═══════════════════════════════════════════════

    h3('2024年真实Case题'),
    li(b('题目1 — 能源公司战略：'), t('"一家英国传统能源公司（主要是天然气）营收下降，面临监管压力要求减排50%（2030年）。他们应该如何转型？"')),
    p(b('BCG风格破题（更注重创意和多角度）：')),
    li(t('先问：公司的核心能力是什么（勘探/基础设施/零售/贸易）？这决定转型方向')),
    li(t('转型选项：天然气→氢气（利用现有基础设施）/ 零售端转售能源 / 并购可再生能源资产 / 退出传统业务出售')),
    li(t('外部视角：欧洲同类公司（E.ON、BP、Shell）的转型路径是什么，能借鉴什么？')),
    li(t('财务约束：转型资本支出 vs 现有业务现金流的权衡')),

    li(b('题目2 — 英国大学战略：'), t('"一家中等排名英国大学（QS 101-200）国际学生申请量同比下降20%，而顶级大学（牛剑LSE）国际生申请量仍在增长。问题出在哪，你有什么建议？"')),
    p(b('破题结构：')),
    li(t('诊断申请量下降原因：全球需求（英国学费政策/签证/汇率）vs 该大学竞争力（排名/专业/就业率）')),
    li(t('细分市场：哪个地区/专业下降最多？中国学生？印度学生？特定专业？')),
    li(t('解决方案：差异化定位（不和顶校正面竞争）、与企业合作强化就业、开设Pathway课程、在目标市场加强品牌')),

    li(b('题目3 — 零售Market Sizing：'), t('"估算英国宠物护理市场的规模。"')),
    p(b('BCG Market Sizing标准路径：')),
    li(t('英国总户数 ~2900万 → 养宠物比例约50% = 1450万户')),
    li(t('细分：养猫 ~30% / 养狗 ~30% / 其他 ~10%')),
    li(t('年均支出：养狗户约£1,200（食品+兽医+护理）；养猫户约£800')),
    li(t('总市场：(870万×£1,200) + (870万×£800) ≈ £104亿 + £70亿 ≈ £174亿')),
    li(t('BCG评委在意的：拆解逻辑的完整性 > 数字的精确性，过程中要说出假设')),

    h3('Casey AI — 如何应对（BCG特有）'),
    p(t('Casey是BCG的AI对话测评，很多人第一次见会慌。以下是实战策略：')),
    li(b('开场structure：'), t('收到题目后先停5秒，说"Let me structure my thinking — I see three main areas to explore here..."')),
    li(b('主动澄清：'), t('问Casey："Before I dive in, can I confirm — is the primary goal to improve profitability or market share?"')),
    li(b('数字估算：'), t('碰到数据缺口要大胆假设并说明理由："I\'ll assume the market is growing at ~5% based on industry norms..."')),
    li(b('时间控制：'), t('25分钟内要走完：问题诊断→假设→数据要求→结论建议。不要在第一部分停太久')),
    li(b('结尾：'), t('主动总结："To summarise: the root cause appears to be X, and I\'d recommend prioritising Y because..."')),
    hr(),

    // ═══════════════════════════════════════════════
    h2('Bain London — 真实Case题库'),
    // ═══════════════════════════════════════════════

    h3('2024年真实Written Case'),
    p(t('Bain Written Case是英国咨询面试独有的环节。2024年London真实题目：')),
    li(b('题目：'), t('一家英国premium巧克力品牌，过去2年销售增速放缓（从18%降至6%），竞争对手（比利时品牌）开始进入英国市场。给出一份战略建议。')),
    p(b('提供的材料包括（90分钟内分析）：')),
    li(t('该品牌过去3年的P&L（营收/毛利率/渠道分布）')),
    li(t('消费者调研：品牌认知度、购买频率、主要竞品')),
    li(t('渠道数据：超市 / 独立零售 / 电商各自的增长率')),
    li(t('竞争对手信息：进入价格点、目标渠道、营销投入')),
    p(b('高分Written Case的结构：')),
    li(t('第一部分：诊断（2-3个bullet，用数据说明核心问题，不是全部重复材料）')),
    li(t('第二部分：建议（2-3个有优先级的行动，每个有时间线和资源要求）')),
    li(t('第三部分：风险（最高的1-2个风险，以及如何缓解）')),
    li(b('关键：'), t('Bain的评分标准是"Would I send this recommendation to a client CEO?"，要够直接、够简洁')),

    h3('Bain口头Case — 2024真实题'),
    li(b('题目1：'), t('"一家英国连锁健身房（Planet Fitness style）想进入英国市场。你怎么评估这个机会？"')),
    li(b('题目2：'), t('"英国一家大型保险公司发现其汽车险的赔付率上升了5个百分点，从70%到75%。为什么？应该怎么办？"')),
    li(b('题目3：'), t('"一家私募基金考虑投资一家英国线上二手车平台（类似Cazoo）。做一个初步的投资评估。"')),

    hr(),

    // ═══════════════════════════════════════════════
    h2('Tier 2咨询 — Oliver Wyman / LEK / OC&C / Roland Berger'),
    // ═══════════════════════════════════════════════

    h3('Oliver Wyman London — 真实题'),
    p(t('OW专长：金融服务、保险、交通、公共部门。面试Case通常在这些行业。')),
    li(b('Case题1：'), t('"一家英国汽车保险公司的综合成本率（Combined Ratio）从95%上升到103%（>100%意味着承保亏损）。诊断原因并提建议。"')),
    p(b('破题要点：')),
    li(t('Combined Ratio = Loss Ratio + Expense Ratio。先拆分是哪部分上升')),
    li(t('Loss Ratio上升：赔付频率增加？还是单次赔付金额增加？→ 骗保/气候事件/汽车修理成本上升')),
    li(t('Expense Ratio上升：获客成本？理赔处理成本？')),
    li(t('建议：精算模型重新定价 / 风险选择（不接高风险客户）/ 再保险策略')),

    li(b('Case题2：'), t('"一家欧洲铁路运营商想在英国开设新的高速线路。初步评估。"')),
    li(b('Fit面试特色问题：'), t('"OW比MBB小很多，你会更快承担重要工作。但资源也更少。这个tradeoff对你来说是什么感受？"')),

    h3('L.E.K. Consulting London — 真实题'),
    p(t('LEK专长：PE due diligence、医疗健康、消费品、媒体。截止通常1-2月。')),
    li(b('Case题1（PE Due Diligence风格）：'), t('"PE客户正在考虑收购一家英国专业医疗诊所连锁（40家，£30M EBITDA）。你需要做一个市场评估。"')),
    p(b('LEK Case特色：比MBB更注重行业数据和增长驱动因素')),
    li(t('先问：哪个专科？（皮肤科/骨科/眼科各有不同增长逻辑）')),
    li(t('市场规模拆解：英国私立医疗市场总量 → 该专科占比 → 可寻址市场')),
    li(t('增长驱动：NHS等待名单长度（核心驱动）、老龄化、收入水平')),
    li(t('竞争格局：谁是主要整合者？估值倍数区间？')),

    li(b('Case题2（消费品）：'), t('"一家英国天然食品品牌在超市的货架空间被削减了15%。影响有多大？如何应对？"')),
    li(b('Fit题：'), t('"LEK做大量PE Advisory，你会接触到很多财务数字。你有多强的财务分析能力，举个具体例子？"')),

    h3('OC&C Strategy Consultants London — 真实题'),
    p(t('OC&C专长：零售/消费、媒体/电信、PE。规模小，班级更小，截止通常1-2月。')),
    li(b('Case题1：'), t('"英国一家大型连锁书店（Waterstones类型）在考虑是否进入网络出版/有声书市场。战略可行性评估。"')),
    li(b('Case题2：'), t('"一个英国体育联赛（足球联赛外）的版权收入停滞。如何开拓新的收入流？"')),
    p(b('OC&C面试的独特之处：')),
    li(t('面试官会打断你的case，突然问"What if the market data shows X instead?"——考察你在新信息下调整的能力')),
    li(t('非常看重行业passion："你对零售/消费行业真的感兴趣吗？给我讲一个你最近观察到的有意思的零售现象。"')),

    h3('Roland Berger London — 真实题'),
    p(t('RB专长：汽车/工业、欧洲市场、政府咨询。相对更看重欧洲/德语系背景。')),
    li(b('Case题1：'), t('"一家德国汽车OEM的英国经销商网络在电动化趋势下利润下降40%。应该如何重构经销商商业模式？"')),
    li(b('Case题2：'), t('"英国政府委托评估：将伦敦城市机场扩建是否具有商业可行性和社会效益？"')),
    p(b('RB面试特点：')),
    li(t('会问你对欧洲工业政策的看法（如欧盟碳边境调节机制、欧洲防务支出增加对工业的影响）')),
    li(t('"Roland Berger有很强的欧洲大陆基因。你有没有在欧洲工作/学习的经历或愿望？"')),

    hr(),

    h2('Case面试结构总结：各公司风格对比'),

    tableBlock(
      ['公司', 'Case风格', '最看重', '时长', '特色环节'],
      [
        ['McKinsey', '问题驱动，推理链要严谨', 'PEI故事量化 + 思维清晰度', '4-6轮，每轮45min', 'Solve在线测评 + PEI'],
        ['BCG', '开放性更强，创意思维', 'Casey AI适应能力 + 多角度视角', '2-3轮', 'Casey AI对话测评'],
        ['Bain', '注重Fit，团队契合度高', 'Written Case + 行业理解深度', '2-3轮 + Written', 'Written Case（90min）'],
        ['OW', '行业深度（金融/保险/交通）', '财务分析能力', '2-3轮', '无特殊，传统Case格式'],
        ['LEK', 'PE DD风格，数据密集', '增长驱动和市场规模量化', '2-3轮', '常有图表解读'],
        ['OC&C', '灵活，会中途变更数据', '行业Passion + 快速调整', '1-2轮', '面试官主动打断测试'],
        ['RB', '欧洲工业视角', '欧洲市场/政策理解', '1-2轮', '更多讨论而非结构化Case'],
      ]
    ),

    hr(),

    quote(b('终极备考建议：'), t('McKinsey看重PEI量化+Solve，提前用官方practice做2轮。BCG看重Casey，把Casey当真人练2-3次。Bain Written Case提前找模拟题做限时练习。Tier 2（OW/LEK/OC&C）更看重行业知识深度，面试前读2-3篇该公司的行业报告。所有公司都会追问——备好每个故事的"具体数字"。')),
  ],
};
