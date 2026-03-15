import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '📅 申请时间线 · 全年作战日历',
  blocks: [
    p(t('数据来源：Bright Network / TargetJobs / 各公司官网。英国校招遵循"Milkround"节奏，每年9月开闸，错过即等下一年。')),
    hr(),

    h2('英国校招总节奏（Milkround）'),
    p(t('与中国校招不同，英国是"提前一年"招聘——2026年9月入职的岗位，在2025年秋季就开始申请。大部分公司滚动录取（Rolling），名额满即止。')),

    tableBlock(
      ['时间', '重要事项', '优先级'],
      [
        ['8月底-9月', '四大（Deloitte Audit/Tax 9月22日）、投行暑期实习开放', '🔴 最高'],
        ['10月初', '四大Consulting/Tech/Advisory部门开放；BCG London开放（通常10月23日截止）', '🔴 最高'],
        ['10月中', 'McKinsey UK Business Analyst截止（通常10月）；PwC大量部门截止', '🔴 最高'],
        ['11月', 'Bain London截止；KPMG大部分项目截止；EY Graduate Programme截止', '🔴 最高'],
        ['12月', '四大部分名额补录；Grant Thornton等Tier 2截止', '🟡 高'],
        ['1-2月', 'L.E.K. Consulting、OC&C截止；Oliver Wyman等', '🟡 高'],
        ['3月以后', '少数公司Rolling继续；科技公司全年招聘', '🟢 中'],
      ]
    ),

    h2('四大详细申请时间（Deloitte UK 2025-2026）'),
    p(t('以下为Deloitte UK官网公布的2026年入职项目开放时间：')),

    tableBlock(
      ['部门/项目', '开放日期', '备注'],
      [
        ['Audit & Assurance', '9月22日', '最热门，额满最快，当天开放即可申请'],
        ['Actuarial', '9月22日 / 10月6日', '精算两批次开放'],
        ['Tax Consulting', '9月22日', '伦敦额度有限'],
        ['Business & Financial Advisory', '10月6日', '含Transaction Services'],
        ['Consulting', '10月6日', '战略咨询竞争最激烈'],
        ['Cyber, Data & Digital', '10月6日', '技术背景友好'],
        ['Technology', '9月22日 / 10月6日', '两批次'],
        ['Risk Advisory', '10月6日', ''],
        ['Spring into Deloitte', '11月10日', '一年级学生体验项目'],
      ]
    ),

    h2('MBB伦敦申请时间'),

    tableBlock(
      ['公司', '开放时间', '截止时间', '关键环节'],
      [
        ['McKinsey London BA', '通常7-8月', '通常10月（各年微调）', 'Solve游戏测评 + PEI + Case'],
        ['BCG London Associate', '9月10日（2025年数据）', '10月23日（2025年数据）', '数值测评 + Case面试'],
        ['BCG London Intern', '1月1日（2026年数据）', '1月22日', '仅限大三学生'],
        ['Bain London AC', '通常9月', '通常10-11月', 'Written Case + Case面试'],
      ]
    ),

    p(b('重要：'), t('以上时间每年会调整，以各公司官网为准。BCG明确说明"所有决定在截止日后统一发出，晚申不吃亏"，但其他公司大多是Rolling，越早越好。')),
    hr(),

    h2('投资银行申请时间'),

    tableBlock(
      ['公司', '全职分析师开放', '暑期实习开放', '备注'],
      [
        ['Goldman Sachs', '通常8-9月', '通常11月（次年实习）', '接受率约1.4-2%（IB）'],
        ['JP Morgan', '通常8-9月', '通常11月', '接受率约2-3%'],
        ['Barclays', '通常8-9月', '通常11月', '接受率约2.5-5%，最友好'],
        ['HSBC', '通常8-9月', '通常10-11月', 'HSBC重视亚洲背景'],
        ['Morgan Stanley', '通常9月', '通常11月', ''],
        ['UBS Global Banking', '通常9月', '通常11月', ''],
      ]
    ),

    h2('科技公司申请时间'),
    li(b('Amazon UK'), t('：全年滚动，Business/Operations岗位无固定截止')),
    li(b('Google UK'), t('：通常10-12月开放次年暑期实习；Business岗位全年')),
    li(b('Meta UK'), t('：通常9-11月')),
    li(b('Fintech（Revolut/Monzo/Wise）'), t('：全年Rolling，技术岗随时开放')),
    hr(),

    h2('快消/零售管培生时间'),

    tableBlock(
      ['公司', '开放时间', '截止时间', '项目名称'],
      [
        ['Unilever', '通常9月', '通常10-11月', 'Future Leaders Programme'],
        ['Diageo', '通常9月', '通常10-11月', 'Graduate Programme'],
        ['P&G', '全年Rolling', '无固定截止', 'Various'],
        ['L\'Oréal', '通常9月', '通常11月', 'Management Trainee'],
        ['Nestlé', '通常9月', '通常11月', 'Graduate Scheme'],
      ]
    ),

    hr(),

    h2('每月行动清单'),

    h3('7-8月（大三/硕士一年级）'),
    li(t('准备CV（一页，英式格式）和Cover Letter模板')),
    li(t('练习Numerical Reasoning（SHL、Kenexa平台）')),
    li(t('了解目标公司，读近期报告，准备Commercial Awareness')),
    li(t('参加公司Open Day、Insight Day，建立联系')),

    h3('9月（申请季开闸）'),
    li(b('立即行动'), t('：Deloitte Audit/Tax 22日开放，开放当天提交最好')),
    li(t('同步投递其他公司，做好申请追踪表（公司/部门/截止/进度）')),
    li(t('开始练习Case面试（至少8-10个Practice Case）')),

    h3('10月（冲刺月）'),
    li(b('最关键的一个月'), t('：BCG/McKinsey/四大Consulting全部在这个月截止')),
    li(t('每天做Numerical Test + Case练习')),
    li(t('准备5个完整STAR故事，每个都要有量化Result')),

    h3('11月（收尾月）'),
    li(t('Bain、KPMG、EY、投行大部分截止')),
    li(t('参加Assessment Centre（如果已过网测）')),
    li(t('快消/零售管培生截止')),

    h3('12月-次年1月（等待+补录）'),
    li(t('等待Offer，部分公司补录')),
    li(t('练习其他公司面试')),
    li(t('1月：L.E.K.、OC&C等精品咨询截止')),
    hr(),

    quote(b('关键提醒：'), t('英国很多公司是Rolling（滚动录取），名额满了就不收了，不等到截止日。建议开放后2周内提交。中国留学生的通病是"研究太久，提交太晚"——开放第一天能递就递。')),
  ],
};
