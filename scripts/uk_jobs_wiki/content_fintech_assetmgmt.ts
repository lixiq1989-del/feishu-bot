import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '💳 英国金融科技 + 资管/PE 求职指南',
  blocks: [
    p(t('覆盖：Revolut / Monzo / Wise / Starling（金融科技）+ BlackRock / Schroders / Vanguard（资产管理）+ 英国PE/VC入门路径。数据来源：Glassdoor / LinkedIn / 公司官网 / Reddit r/FinancialCareers。')),
    hr(),

    h2('一、英国金融科技（Fintech）——求职全攻略'),
    p(t('英国是全球第二大Fintech中心（仅次于美国），伦敦Tech City集中了Revolut、Monzo、Wise、Starling、Checkout.com等独角兽和上市公司。')),

    tableBlock(
      ['公司', '估值/规模', '主要商科岗位', '薪资范围', '签证'],
      [
        ['Revolut', '估值£330亿（2024融资）', 'Business Analyst / Operations / Finance', '£45,000-£65,000 + Equity', '✅ 担保'],
        ['Monzo', '估值£43亿，约2500员工', 'Strategy / Analytics / Product Ops', '£40,000-£55,000 + Options', '✅ 担保'],
        ['Wise（上市）', '伦敦证交所上市，盈利', 'Finance / Partnerships / Growth', '£42,000-£58,000 + RSU', '✅ 担保'],
        ['Starling Bank', '估值£25亿，首家盈利数字银行', 'Strategy / Analytics / Risk', '£38,000-£52,000', '⚠️ 确认'],
        ['Checkout.com', '估值£110亿，支付独角兽', 'Partnerships / Enterprise Sales Support', '£45,000-£65,000', '✅ 担保'],
        ['Klarna（伦敦办公室）', 'BNPL领军，准备IPO', 'Merchant Success / Growth', '£40,000-£55,000', '⚠️ 确认'],
      ]
    ),

    h3('Revolut — 招聘特点和面试'),
    li(b('文化：'), t('极度快节奏，以"完成任务"为核心。Glassdoor评价两极分化——要么爱，要么受不了')),
    li(b('面试流程：'), t('在线测评（数字推理/逻辑）→ 电话面试 → 案例任务（Take-home）→ 终轮面试')),
    li(b('Take-home案例真实题（2024）：'), t('"Revolut在波兰的用户增长放缓。分析原因并给出90天行动计划（用提供的数据集）"')),
    li(b('终轮真实被问：'), t('"Revolut刚获得英国银行牌照，这对我们的战略意味着什么？""你认为Revolut的下一个最大的增长机会是什么？"')),
    li(b('重要：'), t('Revolut面试非常考察数据驱动思维，每个答案都要说"我会用什么指标衡量成功"')),

    h3('Monzo — 面试（更人性化，文化fit重要）'),
    li(b('招聘特点：'), t('Monzo明确说他们看"mission alignment"，要求你真心认可"普惠金融"理念')),
    li(b('面试真实题：'), t('"What\'s a financial product in the UK that you think is broken and Monzo could fix?"')),
    li(b('Take-home真实题：'), t('"Monzo的储蓄利率产品的用户激活率低于预期，分析提供的数据并提出建议"')),
    li(b('软技能面试：'), t('"How do you make complex financial topics understandable to non-finance users?" — Monzo非常重视communication clarity')),

    h3('Wise — 为什么独特（唯一盈利且上市的大型英国Fintech）'),
    li(b('Wise的核心是：'), t('低成本跨境支付。面试前要理解他们的定价逻辑和SWIFT体系的弊端')),
    li(b('面试真实题：'), t('"Wise的手续费透明化策略如何影响了我们在年轻用户中的信任度？你有什么数据证明？"')),
    li(b('案例题：'), t('"某个国家/地区的Wise转账量下降20%，你如何诊断？"（和Amazon LP风格类似，数据驱动）')),

    hr(),

    h2('二、资产管理（Asset Management）——英国求职路径'),

    tableBlock(
      ['公司', '类型', '英国规模', '应届岗位', '薪资'],
      [
        ['BlackRock', '全球最大资管£9.4万亿AUM', '约3000人（伦敦）', 'Analyst Programme（投资/运营/技术）', '£55,000-£70,000 + Bonus'],
        ['Schroders', '英国本土大型资管', '约4000人（全球）', 'Graduate Programme（多部门）', '£40,000-£50,000'],
        ['Vanguard UK', '被动投资巨头', '约600人', 'Graduate Analyst', '£45,000-£55,000'],
        ['Fidelity International', '主动投资，英国总部', '约1500人（英国）', 'Graduate Scheme', '£42,000-£52,000'],
        ['Legal & General（L&G）', '保险+资管综合体', '大型本土雇主', 'Graduate Programme', '£35,000-£45,000'],
        ['M&G Investments', '保险分拆出来的资管', '中型', 'Analyst', '£40,000-£50,000'],
      ]
    ),

    h3('资管面试的独特性——和投行不一样的地方'),
    li(b('更注重：'), t('投资观点（Investment Thesis）> 纯技术财务知识')),
    li(b('必考题型：'), t('"给我Pitch一只股票（或债券/基金）"')),
    li(b('行业观点：'), t('"你对当前利率周期的判断是什么？对英国股市有什么影响？"')),
    li(b('CFA备考建议：'), t('资管非常看重CFA，Level 1通过可以显著提升竞争力，哪怕是应届生')),

    h3('股票Pitch框架（资管面试必备）'),
    p(t('标准结构：推荐 + 公司简介 + 投资逻辑（3个核心驱动）+ 估值 + 风险 + 催化剂')),
    li(b('公司简介：'), t('1-2句话：公司做什么、规模、所在市场')),
    li(b('投资逻辑（核心）：'), t('3个看涨/看空的理由，要有数据支撑，比如"毛利率趋势/市场份额变化/管理层变动"')),
    li(b('估值：'), t('当前P/E vs 历史均值 vs 同行对比 → 说明便宜/贵的理由')),
    li(b('风险：'), t('最高的1-2个下行风险，以及为什么你认为已经Price in（或没有）')),
    li(b('催化剂：'), t('什么事件会在3-6个月内让市场认识到你的investment thesis？')),

    h3('BlackRock面试真实题（2024）'),
    li(t('"Pitch me a sector you\'re bullish on in Europe for the next 12 months." → 我选了欧洲防务（推了BAE Systems），解释了NATO 3.5% GDP支出承诺和供应链重建需求')),
    li(t('"BlackRock\'s Aladdin platform processes £18 trillion of assets. From a risk perspective, what\'s the systemic risk of this concentration?"')),
    li(t('"How would you explain volatility to a retail investor who just saw their portfolio drop 15%?"')),

    hr(),

    h2('三、英国私募股权（PE）——应届生如何进入'),
    p(t('英国PE对应届生几乎不开放直接招聘，主流路径是：IBD 2-3年 → MBA → PE，或IBD → PE without MBA（较少但存在）。')),

    tableBlock(
      ['路径', '难度', '时间', '适合人群'],
      [
        ['IBD Analyst → PE（非MBA）', '⭐⭐⭐⭐⭐', '2-3年工作经验后', '顶级IBD分析师，有超强Track Record'],
        ['IBD Analyst → MBA → PE Associate', '⭐⭐⭐⭐', '4-6年（含MBA）', '主流路径，占英国PE associate主体'],
        ['直接应届生招PE（极少）', '⭐⭐⭐⭐⭐', '校园招聘时', '只有少数Growth Equity/VC开放应届'],
        ['咨询 → PE', '⭐⭐⭐', '3-4年咨询后', 'Operational PE更看重咨询背景'],
      ]
    ),

    h3('英国有应届生项目的PE/VC公司（稀少但存在）'),
    li(b('Balderton Capital：'), t('伦敦顶级VC，偶尔招Principal/Analyst级别的毕业生')),
    li(b('Index Ventures：'), t('伦敦/日内瓦，有Analyst项目')),
    li(b('Permira：'), t('偶尔招Growth Equity Analyst（来自顶级大学商科/工程）')),
    li(b('Goldman Sachs Growth Equity：'), t('不走IBD路径，独立招聘')),
    li(b('实际建议：'), t('应届生先进IBD或咨询，2年后跳PE成功率远高于直接申请。先把IBD offer拿到手再考虑后续。')),

    h3('PE面试题（应届生如果拿到机会）'),
    li(t('"Walk me through an LBO of a UK mid-market business." → 用EBITDA × 8x进入，30%权益70%债务，5年内还40%债务，EBITDA增长20%，以9x退出 → 算IRR')),
    li(t('"What makes a good LBO target?" → 稳定可预测现金流 / 低资本支出需求 / 市场领导地位 / 管理层可激励 / 没有重大诉讼风险')),
    li(t('"You\'re looking at a UK healthcare services business. What are your first 5 due diligence questions?" → 客户集中度 / 监管风险 / 工资通胀对margin的影响 / NHS vs私立收入比例 / NHS等待名单政策变化')),

    hr(),

    quote(b('选择建议：'), t('如果你的目标是最大化长期收入：IBD → PE是最高天花板，但前几年极度辛苦。如果你想快速做有impact的工作：Fintech（Revolut/Wise）节奏快、成长快，但文化激烈。如果你想要稳定+有意义：资管（BlackRock/Schroders）节奏更可持续，CFA是通行证。别只看应届薪资，要算5年后的轨迹。')),
  ],
};
