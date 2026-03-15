import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '🛂 签证路径完全指南（PSW → SWV → PR）',
  blocks: [
    p(t('数据来源：UK Home Office、UKCISA、真实签证申请者经验（Reddit r/ukvisa、r/UKJobs）。最后更新：2026年3月。签证政策频繁变动，以Home Office官网为准。')),
    hr(),

    h2('一、全景图：留英工作的三条主要路径'),

    tableBlock(
      ['签证类型', '适用人群', '有效期', '薪资要求', '雇主担保'],
      [
        ['Graduate Route（PSW）', '英国大学毕业生', '本科/硕士2年；博士3年', '无（第一年可低薪/无薪）', '不需要'],
        ['Skilled Worker Visa（SWV）', 'PSW到期或直接从海外来', '最长5年（可续签）', '£41,700/年（2025年7月起）', '必须（雇主是Sponsor）'],
        ['Global Talent Visa', '顶尖学者/研究者/艺术家', '最长5年', '无固定要求', '需要被认可机构背书'],
      ]
    ),

    hr(),

    h2('二、Graduate Route（PSW后留工作签）——最主要路径'),

    h3('PSW基本条件'),
    li(b('学历要求：'), t('必须是英国大学颁发的本科、硕士或博士学位（需要亲自在英国完成课程）')),
    li(b('申请时机：'), t('毕业后（收到学位证书）可申请，通常6月毕业10月前可拿到PSW')),
    li(b('有效期：'), t('本科/硕士2年；博士3年')),
    li(b('工作限制：'), t('PSW期间可以做任何工作（任何职位/薪资），不需要雇主担保')),
    li(b('不能做的事：'), t('不能做大部分公共基金岗位（如NHS临床岗）；不能开设自己的公司作为主要收入来源')),

    h3('PSW的黄金策略'),
    p(b('策略一：PSW期间找到SWV担保的Offer')),
    li(t('在PSW有效期内拿到一个年薪≥£41,700且雇主是licensed sponsor的Offer')),
    li(t('在PSW到期前申请SWV（可以提前最多3个月申请）')),
    li(t('这是最主流的路径，成功率最高')),
    p(b('策略二：PSW期间积累经验→提升薪资→再转SWV')),
    li(t('先在任意公司工作，积累1-2年经验，然后跳槽到薪资≥£41,700且可担保的公司')),
    li(t('适合：先从低薪entry-level做起，2年内升到符合SWV要求的级别')),
    p(b('策略三：PSW结束但没有Offer→回国or延签？')),
    li(t('PSW到期无法续签，也不能在英国"等待"。必须在PSW有效期内切换到SWV或离境')),
    li(t('不建议等到最后几周才处理，至少提前3个月确认Offer的担保状态')),

    hr(),

    h2('三、Skilled Worker Visa（SWV）——详细解读'),

    h3('2025年7月新规：薪资门槛大幅提升'),

    tableBlock(
      ['类别', '旧门槛（2024年前）', '新门槛（2025年7月起）', '说明'],
      [
        ['一般SWV最低薪资', '£26,200', '£41,700', '几乎翻倍，大量应届生岗位受影响'],
        ['新入职者（New Entrant）豁免', '£20,960', '£33,400', '35岁以下/应届毕业生/换工作轨道可享受'],
        ['每周工时豁免', '£10.75/小时', '£15.88/小时', '针对Part-time岗位的换算'],
        ['Shortage Occupation豁免', '可低于一般门槛20%', '已大幅缩减适用范围', '2024年调整后SOL范围大幅缩小'],
      ]
    ),

    h3('"New Entrant"豁免条件（应届生重要）'),
    p(t('如果你符合New Entrant条件，薪资门槛降至£33,400而非£41,700。适用条件：')),
    li(t('在申请前12个月内从英国大学毕业')),
    li(t('切换签证轨道（如从学生签或PSW切换到SWV）')),
    li(t('35岁以下')),
    li(b('注意：'), t('New Entrant豁免只适用于初次申请SWV，续签时需满足完整薪资要求')),

    h3('哪些公司可以担保SWV（Sponsor）'),
    li(b('如何查：'), t('UK Visas and Immigration维护着一份"Register of Licensed Sponsors"名单，在gov.uk可以下载最新版')),
    li(b('四大：'), t('Deloitte、KPMG（仅部分）、EY、PwC都是licensed sponsors，但具体哪些项目担保需确认')),
    li(b('MBB：'), t('McKinsey、BCG、Bain均担保')),
    li(b('投行：'), t('所有Bulge Bracket（Goldman、JP Morgan等）均担保')),
    li(b('科技大厂：'), t('Amazon、Google、Meta、Microsoft均担保')),
    li(b('中小公司：'), t('不一定是licensed sponsor，申请前务必确认。可直接在gov.uk搜索公司名')),

    hr(),

    h2('四、各公司签证政策现实'),

    tableBlock(
      ['公司', '官方立场', '实际操作', '注意事项'],
      [
        ['Deloitte UK', '官网说支持SWV担保', '大部分Graduate项目担保，但流程较慢', '拿到Offer后立即确认担保部门'],
        ['KPMG UK', '仅担保伦敦Audit和Tax', '其他部门明确不担保', '申请前必须确认该项目是否在担保名单'],
        ['EY UK', '中等，部分项目担保', '历史上有"内部配额"限制国际生数量的反馈', '比Deloitte和PwC更难确认'],
        ['PwC UK', '部分项目担保', 'Technology部门更友好，Tax次之', '申请时可直接问招聘团队'],
        ['McKinsey London', '全面担保', '历史记录良好，流程完善', '无需担心，但要保证薪资达线'],
        ['Goldman Sachs', '全面担保', '大公司流程完整', 'GS薪资(£65-75k base)远超门槛'],
        ['HSBC', '全面担保，积极招募国际学生', '最友好，亚裔员工比例高', '双语优势明显'],
        ['Amazon UK', '全面担保', '大公司流程完整，效率一般', '注意不同business unit的薪资差异'],
      ]
    ),

    hr(),

    h2('五、PSW → SWV转换的实操时间线'),

    h3('理想时间线（以硕士2026年6月毕业为例）'),
    li(b('2025年9月起：'), t('开始申请Graduate Scheme（此时仍是学生签，PSW还没有）')),
    li(b('2026年6月：'), t('毕业，拿到学位证书')),
    li(b('2026年7-8月：'), t('申请Graduate Route，审批通常3-8周，拿到PSW')),
    li(b('2026年9月起：'), t('用PSW开始工作，同时继续找SWV担保的Offer（如果还没有）')),
    li(b('2027年9月前：'), t('必须有SWV Offer或已提交SWV申请（在PSW到期前）')),
    li(b('2028年9月（PSW到期）：'), t('如果没有切换，必须离境或有其他签证')),

    h3('SWV申请流程（雇主担保）'),
    li(b('Step 1：'), t('雇主确认是Licensed Sponsor，发给你"Certificate of Sponsorship（CoS）"号码')),
    li(b('Step 2：'), t('在gov.uk提交SWV申请，填写CoS号码、工作信息、薪资')),
    li(b('Step 3：'), t('支付签证费（£748/年，最长5年）+ Immigration Health Surcharge（£1,035/年，目前约£5,175 for 5年）')),
    li(b('Step 4：'), t('预约生物特征采集（Biometrics Appointment）')),
    li(b('Step 5：'), t('等待审批（通常2-8周，Fast Track服务5个工作日）')),
    li(b('总费用估算：'), t('签证费£748 × 年数 + IHS £1,035 × 年数 + 申请费£239 ≈ 5年约£9,500（自费）')),
    p(b('重要：'), t('大部分Tier 1雇主（四大、MBB、投行）会报销签证费用，但IHS通常需要自己承担')),

    hr(),

    h2('六、长期路径：SWV → ILR（永居）→ 英国国籍'),

    tableBlock(
      ['里程碑', '条件', '时间线'],
      [
        ['Indefinite Leave to Remain（ILR/永居）', '连续5年合法居留（SWV/PSW均算）', '最快毕业后6-7年'],
        ['英国国籍（入籍）', 'ILR后持续居留满1年', '最快毕业后7-8年'],
        ['High Potential Individual（HPI）签证', 'QS前50名校毕业，可免担保直接在英工作2年', '与PSW类似但面向海外毕业生'],
      ]
    ),

    h3('PR计算注意事项'),
    li(t('时间计算：学生签期间不算（除非学生签+PSW+SWV连续不断5年）')),
    li(t('出境限制：每12个月不能离境超过180天，否则连续居留被打断')),
    li(t('所有签证类型的5年可以叠加计算，不需要5年都是同一种签证')),
    li(t('"Continuous residency"：允许短期出境，但不能有超过180天的单次或累计空档')),

    hr(),

    quote(b('最重要的一条：'), t('PSW期间不要浪费时间。2年很短，如果第一年就在低薪岗位打工，第二年再开始找SWV担保的工作，时间非常紧张。理想路径是：毕业前已经有了一个担保Offer（通过在校期间的申请获得），PSW开始后直接入职，完全不需要担心签证问题。')),
  ],
};
