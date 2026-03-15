import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '📈 投行技术面试速成包（财务/估值/市场）',
  blocks: [
    p(t('来源：Wall Street Oasis、Mergers & Inquisitions、Investment Banking Prep（IBP）、真实Superday面试复盘。英国投行技术面试必考知识点。')),
    hr(),

    h2('一、三张财务报表：必须能背下来的联动关系'),
    p(b('面试官最爱的陷阱题：'), t('"如果折旧增加£100，三张报表怎么变？"')),

    tableBlock(
      ['报表', '直接影响', '变化方向'],
      [
        ['利润表 (P&L)', 'EBIT = 折旧增加，税前利润减少100', '利润减少100（假设税率25%，净利润减少75）'],
        ['现金流量表 (CFS)', '经营活动：净利润-75，折旧回加+100', '经营活动现金流净增加+25'],
        ['资产负债表 (B/S)', '资产：PP&E减少100（累计折旧+100）', '负债/权益：留存收益减少75（净利润少了75）'],
      ]
    ),

    p(b('核心公式：')),
    li(b('EBITDA'), t('= 净利润 + 利息 + 税 + 折旧 + 摊销')),
    li(b('自由现金流（UFCF）'), t('= EBITDA - 税 - CapEx - △运营资本变化 + 折旧摊销（非现金）')),
    li(b('股权价值（Equity Value）'), t('= 企业价值（EV）- 净负债（Net Debt）+ 现金')),

    hr(),

    h2('二、DCF估值：一步步能讲清楚'),
    p(t('Superday必考。面试官想听的不是结论，是你的思维过程。')),

    h3('DCF五步走'),
    li(b('Step 1 — 预测UFCF：'), t('通常预测5-10年，基于收入增速、EBITDA margin、CapEx/收入比、营运资本需求')),
    li(b('Step 2 — 计算WACC：'), t('WACC = Ke × E/(D+E) + Kd × D/(D+E) × (1-t)')),
    li(b('Step 3 — 计算Terminal Value：'), t('Gordon Growth Model: TV = FCF × (1+g) / (WACC - g)，或用Exit Multiple法（EBITDA × 倍数）')),
    li(b('Step 4 — 折现求EV：'), t('把所有年度FCF + Terminal Value折现到今天')),
    li(b('Step 5 — Bridge to Equity Value：'), t('EV - Net Debt + Cash + Minority Interest 调整 = Equity Value → ÷ 稀释股本 = 每股价值')),

    tableBlock(
      ['关键假设', '通常范围', '敏感性'],
      [
        ['WACC', '7-12%（成熟行业低，科技/PE高）', '±1% WACC对估值影响约10-20%'],
        ['Terminal Growth Rate (g)', '1.5-3%（成熟市场）', '不能超过GDP增速，否则不合逻辑'],
        ['预测期', '5年（成熟）/ 10年（高增长）', '越长假设不确定性越高'],
        ['Exit Multiple', '行业EV/EBITDA中位数', '通常比GGM更常用（可验证性高）'],
      ]
    ),

    p(b('高频追问：'), t('"为什么用UFCF而不是LFCF（Levered FCF）做DCF？"')),
    p(t('答：UFCF是资产层面的现金流，独立于资本结构。WACC已经把资本结构考虑进去了。用UFCF+WACC是一致的。如果用LFCF就应该用权益资本成本Ke折现，但资本结构会随时间变化，更难处理。')),

    hr(),

    h2('三、可比公司分析（Comps）+ 并购倍数'),

    h3('常用估值倍数'),

    tableBlock(
      ['倍数', '公式', '适用场景', '英国典型范围'],
      [
        ['EV/EBITDA', 'EV ÷ EBITDA', '最通用，资本结构无关', '咨询/专业服务8-12x；零售4-7x；科技15-25x'],
        ['EV/Revenue', 'EV ÷ Revenue', '盈利不稳定/早期成长', '高增长科技2-10x；成熟行业0.5-2x'],
        ['P/E', 'Stock Price ÷ EPS', '成熟盈利公司，金融', '英国市场整体约12-16x'],
        ['P/B', 'Stock Price ÷ Book Value', '银行/金融机构', '银行通常0.8-1.5x'],
        ['EV/EBIT', 'EV ÷ EBIT', '资本密集度差异大时', '排除折旧差异影响'],
      ]
    ),

    h3('为什么并购要支付溢价？（高频考题）'),
    li(b('控制权溢价：'), t('获得管理决策权，通常20-30%溢价于当前股价')),
    li(b('协同效应（Synergies）：'), t('成本协同（重叠部门/采购）+ 收入协同（交叉销售/新市场）')),
    li(b('信息不对称：'), t('买方认为自己的估值比市场更准确')),
    li(b('竞争压力：'), t('拍卖过程中竞价抬高价格')),

    h3('增厚/稀释分析（Accretion/Dilution）'),
    p(t('全股票并购时：如果收购方P/E > 被收购方P/E，通常增厚（EPS上升）。反之稀释。')),
    li(b('公式：'), t('Pro Forma EPS = (收购方净利润 + 目标净利润 + Synergies - 整合成本) ÷ 新总股数')),
    li(b('如果用现金收购：'), t('要考虑失去的利息收入（机会成本）vs 获得的净利润')),

    hr(),

    h2('四、LBO基础（杠杆收购）'),
    p(t('PE面试必考，投行面试加分项。')),

    h3('LBO的基本逻辑'),
    p(t('PE用少量自有权益（通常30-40%）+ 大量债务（60-70%）收购公司，用目标公司的现金流还债，5-7年后出售获得回报。')),
    li(b('进入：'), t('EV = 权益 + 债务 → 通常按EBITDA × 8-12x估值进入')),
    li(b('持有期：'), t('偿还债务 + 提升EBITDA（运营改善）+ 倍数扩张（估值提升）')),
    li(b('退出：'), t('Strategic Sale / IPO / Secondary PE → IRR = (退出EV - 退出净债 ≈ 权益价值)^(1/n) - 1')),

    tableBlock(
      ['价值创造来源', '定义', '2024年重要性'],
      [
        ['债务偿还（Debt paydown）', '用EBITDA还债，权益比例自然上升', '利率高，杠杆效应下降'],
        ['EBITDA增长', '收入增长 + margin改善', '最核心，71%的PE回报来自此（Bain数据）'],
        ['估值倍数扩张（Multiple expansion）', '退出倍数 > 进入倍数', '利率高环境下倍数扩张空间有限'],
      ]
    ),

    h3('LBO关键指标'),
    li(b('IRR（内部回报率）：'), t('PE目标通常20-25%+ IRR；如果5年翻3倍约25% IRR')),
    li(b('MOIC（投资回报倍数）：'), t('退出权益价值 ÷ 进入权益投入；通常目标2.5-3x+（5年）')),
    li(b('Break-even分析：'), t('最差情景下EBITDA下降多少、债务还能服务？')),

    hr(),

    h2('五、高频Technical问答（真实Superday被问到）'),

    h3('会计类'),
    li(b('Q: '), t('"If inventory write-down happens, how do the three statements change?" — P&L：COGS增加→利润减少；B/S：存货减少，留存收益减少；CFS：营运资本减少→经营现金流增加')),
    li(b('Q: '), t('"What is goodwill and when does it arise?" — 并购溢价超出净资产公允价值的部分。如果goodwill减值，则P&L出现impairment charge，B/S goodwill资产减少')),
    li(b('Q: '), t('"Why can a company have negative shareholders\' equity?" — 累计亏损超过注入资本，或大量回购股票（如麦当劳）')),

    h3('市场/宏观类'),
    li(b('Q: '), t('"How do rising interest rates affect M&A activity?" — 融资成本上升→LBO回报下降→PE活动减少；同时公司估值通常下降（WACC上升）；债券市场相对吸引力上升')),
    li(b('Q: '), t('"What\'s your view on the current UK equity market?" — 英国vs美国估值折价（P/E约12x vs 20x），原因：能源/金融重仓、增长预期低、地缘政治/脱欧不确定性；但也有观点认为这是价值机会')),
    li(b('Q: '), t('"A company\'s share price has dropped 30% today. What could have caused it?" — 盈利预警 / 管理层丑闻 / 竞争格局变化 / 宏观利率突变 / 监管罚款 / 大股东减持')),

    hr(),

    quote(b('备考路径建议：'), t('Week 1：把三张报表联动背熟（用折旧题练习）→ Week 2：DCF + Comps → Week 3：LBO基础 + M&A → Week 4：模拟面试。投行面试技术题只考已知知识，不会考你研究型问题。熟练程度 > 深度。Wall Street Oasis和Mergers&Inquisitions的免费题库足够。')),
  ],
};
