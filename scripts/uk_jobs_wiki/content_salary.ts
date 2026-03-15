import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

export const page: Page = {
  title: '💰 英国薪资与生活成本数据',
  blocks: [
    p(t('数据来源：Glassdoor UK / LinkedIn Salary / Bright Network / 官方薪资披露。更新时间：2025-2026。')),
    p(t('注意：以下均为 Base Salary（税前底薪），不含奖金、RSU、Pension 等福利。')),
    hr(),

    h2('各行业应届生薪资对比（伦敦）'),

    h3('咨询'),
    li(b('MBB（McKinsey / BCG / Bain）'), t('：£52,000-£62,000')),
    li(b('四大咨询（Deloitte / PwC / EY / KPMG Consulting）'), t('：£38,000-£45,000')),
    li(b('Tier 2 咨询（Oliver Wyman / A.T. Kearney / Roland Berger）'), t('：£45,000-£55,000')),
    li(b('小型精品咨询'), t('：£32,000-£42,000')),

    h3('投资银行 Investment Banking'),
    li(b('BB IBD（Goldman / JP Morgan / Morgan Stanley / BofA / Barclays）'), t('：£65,000-£75,000（含签约奖金后更高）')),
    li(b('BB Markets / Sales & Trading'), t('：£60,000-£70,000')),
    li(b('BB Technology / Operations'), t('：£50,000-£60,000')),
    li(b('Boutique IB（Lazard / Rothschild / Evercore）'), t('：£58,000-£68,000')),
    li(b('Signing Bonus（IBD）'), t('：£20,000-£40,000（年度奖金可达底薪 50-100%）')),

    h3('科技大厂 Big Tech（伦敦）'),
    li(b('Google / Meta / Apple（Business/Operations）'), t('：£55,000-£75,000 + RSU')),
    li(b('Amazon（Business Analyst / PM）'), t('：£45,000-£58,000 + RSU')),
    li(b('Microsoft（Business/Finance）'), t('：£45,000-£55,000 + Bonus')),
    li(b('SDE（Software Engineer）'), t('：£65,000-£90,000 + RSU')),
    li(b('Scale-up / Fintech（Revolut / Monzo / Wise）'), t('：£45,000-£65,000 + Equity')),

    h3('四大审计/税务/财务咨询'),
    li(b('Audit（审计）伦敦'), t('：£32,000-£38,000')),
    li(b('Tax 伦敦'), t('：£33,000-£40,000')),
    li(b('Deals / Transaction Services'), t('：£36,000-£44,000')),

    h3('金融服务 Financial Services'),
    li(b('资产管理 Asset Management（BlackRock / Vanguard / Schroders）'), t('：£45,000-£60,000')),
    li(b('私募股权 Private Equity（入门）'), t('：£60,000-£80,000')),
    li(b('商业银行 Retail/Commercial Banking'), t('：£28,000-£38,000')),
    li(b('保险精算 Actuarial'), t('：£35,000-£45,000')),

    h3('快消 FMCG / 零售'),
    li(b('Unilever / Diageo / P&G（Management Trainee）'), t('：£32,000-£38,000 + Bonus')),
    li(b('M&S / Tesco / Sainsbury\'s（商业类）'), t('：£28,000-£34,000')),

    h3('政府 / 公共部门'),
    li(b('Fast Stream（政府精英项目）'), t('：£30,000-£32,000（有职业晋升快的优势）')),
    li(b('NHS / 教育类'), t('：£24,000-£30,000')),
    hr(),

    h2('伦敦 vs 其他城市薪资差异'),
    p(t('伦敦薪资比其他城市高出约 20-30%，但生活成本也高。非伦敦岗位薪资参考：')),
    li(b('曼彻斯特'), t('：通常比伦敦低 10-15%（四大、咨询均有大型办公室）')),
    li(b('爱丁堡'), t('：低 10-15%（金融服务中心，RBS/Standard Life）')),
    li(b('伯明翰'), t('：低 15-20%（四大均在此设分部）')),
    li(b('利兹'), t('：低 15-20%（金融服务业集中）')),
    hr(),

    h2('生活成本对比'),

    h3('伦敦生活成本（月均估算）'),
    li(b('租房（Zone 2-3 单间）'), t('：£1,200-£1,800')),
    li(b('租房（Zone 1 或市中心）'), t('：£1,800-£2,500+')),
    li(b('交通（月票 Zone 1-2）'), t('：£174.4')),
    li(b('餐饮'), t('：£400-£600（自己做饭+偶尔外食）')),
    li(b('手机/网络'), t('：£30-£50')),
    li(b('合计（Zone 2 合租）'), t('：约 £1,800-£2,400/月')),

    h3('曼彻斯特生活成本（月均估算）'),
    li(b('租房（市中心单间）'), t('：£800-£1,200')),
    li(b('交通（月票）'), t('：约 £80-£100')),
    li(b('餐饮'), t('：£350-£500')),
    li(b('合计'), t('：约 £1,300-£1,800/月')),

    h3('爱丁堡生活成本（月均估算）'),
    li(b('租房（市中心单间）'), t('：£800-£1,100')),
    li(b('合计'), t('：约 £1,200-£1,700/月')),
    hr(),

    h2('净收入计算（实际到手）'),
    p(t('英国所得税：Personal Allowance £12,570（免税）→ £12,571-£50,270 税率 20%（Basic Rate）→ £50,271-£125,140 税率 40%（Higher Rate）')),
    p(t('National Insurance（NI）：£12,570 以上部分交 8%（Employee NI）')),

    h3('常见薪资档位实际到手（月均）'),
    li(b('£32,000（四大Audit）'), t('：约 £2,150-£2,200/月到手')),
    li(b('£38,000（四大Consulting/Tax）'), t('：约 £2,480-£2,550/月到手')),
    li(b('£45,000（Tier 2咨询/科技）'), t('：约 £2,870-£2,950/月到手')),
    li(b('£55,000（MBB/BB IBD起步）'), t('：约 £3,400-£3,500/月到手')),
    li(b('£70,000（BB IBD分析师）'), t('：约 £4,100-£4,200/月到手')),
    hr(),

    h2('薪资增长预期'),

    h3('四大晋升路径'),
    li(b('Analyst（应届）'), t('£32,000-£42,000 → Senior（2-3年）→ Manager（4-6年） → Senior Manager → Director → Partner')),
    li(b('Manager 薪资'), t('：伦敦约 £65,000-£85,000')),
    li(b('Director'), t('：£100,000-£130,000')),

    h3('MBB 晋升路径'),
    li(b('BA（3年）'), t('→ 通常去读 MBA 或转 Senior Associate')),
    li(b('Senior Associate / Engagement Manager'), t('：£85,000-£120,000')),
    li(b('Principal → Partner'), t('：£200,000-£500,000+')),

    h3('投行晋升路径'),
    li(b('Analyst（2-3年）'), t('→ Associate（需 MBA 或内部晋升）')),
    li(b('Associate 薪资'), t('：£90,000-£120,000 + 奖金')),
    li(b('VP'), t('：£150,000-£200,000 + 奖金')),
    hr(),

    h2('签证相关薪资门槛'),
    li(b('Skilled Worker Visa 最低薪资：'), t('£38,700（2024年起新规，较之前大幅提升）')),
    li(b('含通货膨胀后效果：'), t('部分 Graduate Scheme 的薪资刚好踩线，需确认雇主愿意担保')),
    li(b('Graduate Route PSW：'), t('前 2 年无薪资门槛，但 PSW 到期后转 SWV 需达到 £38,700')),
    li(b('短缺职业清单（Shortage Occupation List）：'), t('部分职业可享薪资折扣，但 2024 年调整后范围缩小，请核实最新版本')),
    hr(),

    quote(b('薪资总结：'), t('如果你的目标是最大化薪资，IBD → PE 是最高通道，但工作强度极大；MBB 咨询 → 战略方向是平衡型；科技大厂（含RSU）总包常超过咨询。不要只看 Base，要算 Total Compensation 和工作生活质量。')),
  ],
};
