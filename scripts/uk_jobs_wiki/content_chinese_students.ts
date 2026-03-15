import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '🇨🇳 中国留学生求职专题',
  blocks: [
    p(t('数据来源：HEPI（Higher Education Policy Institute）、SCMP、Sheffield Hallam研究报告、Reddit r/UKJobs真实帖子。')),
    hr(),

    h2('一、残酷现实：数字不会说谎'),

    tableBlock(
      ['指标', '数据', '来源'],
      [
        ['中国学生占英国国际生比例', '约22%', 'UKCISA 2024'],
        ['毕业后留英就业比例（国际生）', '约10%', 'HEPI 2023报告'],
        ['从未获得过就业支持的中国学生', '约80%', 'HEPI调研'],
        ['中国学生每年缴纳学费总额', '£23亿', 'HEPI 2023'],
        ['PSW申请人数（2022-23学年）', '约14.9万', 'Home Office数据'],
        ['Skilled Worker Visa最低薪资门槛（2025年7月起）', '£41,700', 'Home Office新规'],
      ]
    ),

    p(b('核心矛盾：'), t('中国学生是英国高校最大的国际生群体、最重要的财务来源，但在就业市场的支持和结果却远远落后。')),
    hr(),

    h2('二、中国留学生求职的独特障碍'),

    h3('1. 签证路径复杂'),
    li(b('Graduate Route（PSW）：'), t('毕业后可自由工作2年（硕士），无需雇主担保。但2年后必须切换到Skilled Worker Visa（SWV）')),
    li(b('SWV门槛（2025年7月起）：'), t('最低薪资£41,700（此前£38,700），应届生很多Graduate Scheme刚好踩线或不达线')),
    li(b('哪些公司真正担保签证：'), t('MBB（担保）、四大（部分项目担保）、大型投行（担保）、中小公司（多数不担保）')),
    li(b('四大签证现实：'), t('KPMG UK仅担保伦敦Audit和Tax项目；EY、PwC部分项目担保；Deloitte整体较友好')),

    h3('2. 文化与语言障碍'),
    li(t('英国面试重视"soft skills"：闲聊（small talk）、自信表达、直接沟通——这些在中式教育中基本没有训练')),
    li(t('Competency题要求用"I"而非"We"——集体主义背景的中国学生天然倾向说团队，面试官会认为贡献不清晰')),
    li(t('Group Exercise：英国学生从小有Model UN/辩论队经验，中国学生在组织发言和打断方面明显弱势')),
    li(t('Cover Letter：中文写作讲究谦虚含蓄，英式Cover Letter要求自信、直接展示成就——完全反向的文化逻辑')),

    h3('3. 网络资源（Network）不足'),
    li(t('英国招聘高度依赖"内推"（Referral）：调查显示约70%的职位通过网络人脉填充，而非公开申请')),
    li(t('Insight Day / Spring Week（大一大二）：这是建立内推关系的最佳窗口，但多数中国留学生大三才开始关注')),
    li(t('LinkedIn在英国是刚需：不是装门面的平台，而是被招聘方主动搜索候选人的渠道')),
    li(t('校友网络：中国学生在英国校友网络中连接度低，很少利用同学/学长的内推优势')),

    h3('4. 申请时机错误'),
    li(b('最大误区：'), t('等课程结束/考完试再投简历——英国校招是"提前一年"，错过9-10月的申请窗口，基本等下一年')),
    li(t('Milkround节奏：2026年9月入职的岗位，在2025年9月就开始申请，部分Rolling岗位10月就满额')),
    li(t('\"研究完了再投\"的陷阱：在申请季反复打磨简历，导致在最优窗口期错失额度')),

    hr(),

    h2('三、哪些公司对中国/国际学生相对友好'),

    tableBlock(
      ['公司', '签证担保', '国际生友好度', '备注'],
      [
        ['HSBC', '✅ 担保', '⭐⭐⭐⭐⭐', '明确重视亚洲背景，中英双语是加分项'],
        ['Deloitte UK', '✅ 部分项目', '⭐⭐⭐⭐', '整体最友好的四大'],
        ['McKinsey London', '✅ 担保', '⭐⭐⭐⭐', '看重分析能力，学历背景看重牛剑LSE'],
        ['BCG London', '✅ 担保', '⭐⭐⭐⭐', '相对多元化，亚裔录取比例高于行业均值'],
        ['Amazon UK', '✅ 担保', '⭐⭐⭐⭐', 'LP面试对有备而来的中国学生相对公平'],
        ['Unilever', '✅ 担保', '⭐⭐⭐⭐', '快消中签证最友好的，全球轮岗机会'],
        ['Goldman Sachs', '✅ 担保', '⭐⭐⭐', '接受率极低，但制度透明'],
        ['KPMG UK', '⚠️ 仅伦敦Audit/Tax', '⭐⭐⭐', '只有两个项目担保，其他项目不担保'],
        ['中小型咨询/精品IB', '❌ 多数不担保', '⭐⭐', '国际生需提前确认签证政策'],
      ]
    ),

    hr(),

    h2('四、真实案例：成功路径拆解'),

    h3('案例一：985本科 → LSE MSc → Deloitte Consulting'),
    li(t('时间线：8月底准备简历 → 9月22日开放当天提交Deloitte → 10月参加AC → 11月拿Offer')),
    li(t('关键：提前准备了3个量化的STAR故事，Numerical Test提前用JobTestPrep练了2周')),
    li(t('Visa：Deloitte为该项目提供SWV担保')),

    h3('案例二：英本 → Barclays IBD'),
    li(t('时间线：9月初提交申请 → HireVue → Superday（共3轮面试）→ 11月Offer')),
    li(t('关键：大三参加了Barclays Spring Internship，获得了内部推荐人')),
    li(t('教训：Barclays明确说接受国际学生，但要确认具体部门的担保政策')),

    h3('案例三：非Russell Group → 毕业两年无果 → 转战HSBC（MSc后）'),
    li(t('背景：第一次求职季（2024）错过了9-10月申请窗口，以为可以随时投')),
    li(t('转折：读MSc时参加了HSBC Insight Day，建立了联系，并在当年10月第一周就提交了申请')),
    li(t('结果：2025年11月拿到HSBC Global Banking offer，Visa担保')),

    hr(),

    h2('五、给中国留学生的具体建议'),

    h3('在时间线上'),
    li(b('大一/大二：'), t('参加Insight Day / Spring Week是最大的杠杆——一次体验项目 = 内推+面试经验+面试官认识你')),
    li(b('大三9月前：'), t('CV、Cover Letter模板准备好，Numerical Test刷完第一轮，不要等开学后再准备')),
    li(b('9月开放第一周：'), t('能投就投，不要等完美版简历。Deloitte Audit第一天开放名额最多，之后滚动减少')),

    h3('在签证策略上'),
    li(t('PSW两年要用好：优先找能转SWV担保的雇主，或者在2年内晋升到£41,700+的薪资级别')),
    li(t('提前确认：每个公司申请前要查清楚该部门是否真的担保签证，不要等到Offer才发现不担保')),
    li(t('Shortage Occupation List（SOL）：2024年调整后范围大幅缩小，不要假设自己的岗位在SOL上')),

    h3('在面试准备上'),
    li(t('Small talk练习：每周看BBC或The Guardian新闻，练习用两三句话解释一个新闻事件的商业影响')),
    li(t('STAR故事一定量化：\"提升了20%\"比\"有所改善\"有力10倍，每个故事准备好数字')),
    li(t('Group Exercise：录视频复盘，中国学生通病是发言时不build on others，只输出自己的观点')),
    li(t('Case面试：一定要think out loud，面试官需要看到你的思维过程，不是只要最终答案')),

    hr(),

    quote(b('最后说一句：'), t('英国求职市场对中国留学生并不排斥，但它非常不\"等你准备好了再来\"。时机、签证、网络人脉——这三件事比简历内容本身更能决定结果。开始得越早，选择越多。')),
  ],
};
