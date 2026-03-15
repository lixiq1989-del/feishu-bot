import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

export const page: Page = {
  title: '💬 真实面经 & 求职经验分享',
  blocks: [
    p(t('来源：Reddit r/GradJob、r/FinancialCareers、r/UKJobs、Glassdoor Interview Reviews、The Student Room论坛。以下均为真实分享，非虚构。')),
    hr(),

    // ──────────────────────────────────────────────
    h2('一、四大面经'),
    // ──────────────────────────────────────────────

    h3('Deloitte Consulting — 2024 AC复盘（成功拿Offer）'),
    quote(b('分享者背景：'), t('UCL Management Science MSc，无英国工作经验，曾在上海四大实习8个月')),
    p(b('申请时间线：')),
    li(t('10月8日：Deloitte Consulting开放，当天提交')),
    li(t('10月14日：收到网测邀请（数字推理+情景判断，用SHL平台）')),
    li(t('10月22日：网测完成，当天收到视频面试邀请')),
    li(t('11月5日：完成HireVue视频面试（3道题，每题2分钟）')),
    li(t('11月19日：收到AC邀请，时间定在12月3日')),
    li(t('12月3日：线上AC（小组讨论60min + 个人Case 45min + Partner面试 30min）')),
    li(t('12月11日：收到Offer电话')),
    p(b('AC最难的部分 — 小组讨论：')),
    li(t('题目：4个数字化转型方案，预算£2M，选2个方案并说明理由')),
    li(t('我的策略：先主动Structure讨论框架（用了3分钟），提出用"战略影响×可行性"矩阵评估')),
    li(t('被评估的点：你的贡献有没有推进讨论？有没有bring in不说话的人？有没有在时间快到时提醒大家总结？')),
    li(b('教训：'), t('有一个组员一直打断别人，我没有直接对抗他，而是说"That\'s a great point, let me add to that and then we should hear from [另一个人]"——评估官事后说这个处理很好')),
    p(b('Partner面试问了什么：')),
    li(t('"你最近读了什么和咨询相关的报告或新闻？有什么自己的看法？"')),
    li(t('"你如果是Deloitte的Partner，在AI浪潮下你最担心的一件事是什么？"')),
    li(t('"你在上海四大实习最有挑战性的一个项目是什么，你个人做了什么？"')),
    p(b('拿Offer后被告知：'), t('评委最看重的是你的commercial awareness和面试中的composure（镇定感）。技术能力只要过线就够了，没有人因为数字推理满分拿到Offer。')),

    h3('KPMG Audit — 2024 AC复盘（第一次失败，第二次成功）'),
    quote(b('分享者背景：'), t('University of Exeter Accounting & Finance本科，成绩2:1，英国本土生')),
    p(b('第一次失败（2023年秋）：')),
    li(t('在AC的书面练习中，写的太长、太学术，忘了格式是写给客户的，不是写给教授的')),
    li(t('Group Exercise：说得太多，没有listen，其他人说话时我在准备自己下一句')),
    p(b('第二次成功（2024年秋）：')),
    li(t('书面练习：改成了"Executive Summary"风格，bullet points，每条都有数据支撑')),
    li(t('Group Exercise：强迫自己在别人说话时做笔记，每次发言先说"Building on what [Name] said..."')),
    li(t('"在第二轮AC中，我比第一次说了更少的话，但每句话都更有分量"')),
    p(b('关于KPMG的Commercial Awareness题：')),
    li(t('被问：最近一个对KPMG客户影响最大的宏观事件是什么？')),
    li(t('回答：英国利率周期拐点对KPMG审计客户（尤其房地产和零售）的资产减值影响，并提到FRC对审计质量的监管压力')),
    li(b('评委反馈：'), t('这个回答很好，大部分候选人只说泛泛的"AI影响"，你说了具体客户层面的影响')),

    hr(),

    // ──────────────────────────────────────────────
    h2('二、MBB面经'),
    // ──────────────────────────────────────────────

    h3('McKinsey London BA — 2024春季 拿Offer复盘'),
    quote(b('分享者背景：'), t('Oxford PPE本科，辅修经济史，在学期间做过3个暑期实习（PE分析师+政府部门+McKinsey Summer Scholar）')),
    p(b('Solve Game备考：')),
    li(t('官网免费practice做了3遍，每次都计时')),
    li(t('"Solve不是考知识，是考在信息量超载的情况下，你能不能快速找到最重要的变量"')),
    li(t('不要尝试"算出"最优解，而是要做假设然后快速验证')),
    p(b('Case面试复盘（共4轮）：')),
    li(b('Round 1 Case — 盈利能力：'), t('英国传统媒体公司，广告收入下降22%。用Profitability Tree拆解，识别出核心是数字广告抢份额，而非整体广告市场萎缩')),
    li(b('Round 1 PEI — Leadership：'), t('"Tell me about a time you persuaded a team to change direction." 被追问了5层，最终追到"你怎么知道你是对的而不是固执？"——这是McKinsey最难的PEI追问之一')),
    li(b('Round 2 Case — M&A：'), t('PE考虑收购一家儿童教育科技公司，做市场规模+竞争格局评估')),
    li(b('Round 2 PEI — Entrepreneurial Drive：'), t('说了在大一创办学生创业孵化器的经历，量化了"帮助了14个团队，其中3个获得了外部融资"')),
    li(b('Final Round（2轮）：'), t('分别是一个数字化转型Case（英国零售银行）和一个Public Sector Case（英国铁路效率）')),
    p(b('最重要的一条建议：')),
    quote(t('"McKinsey面试官不是在找一个聪明人。他们在找一个他们愿意让其坐在客户面前的人。你的Case答得多好是其次，你在压力下的镇定感、你处理不确定信息的方式、你能不能在10秒内给出一个清晰结论——这些才是核心。"')),

    h3('BCG London Associate — 2023秋 拿Offer复盘'),
    quote(b('分享者背景：'), t('LSE Finance MSc，本科在曼大，曾在Morgan Stanley做过Summer Analyst（未转正）')),
    p(b('Casey AI如何过：')),
    li(t('收到Casey邀请后，先找了两个做过Casey的学长模拟了题型')),
    li(t('"Casey的题目比口头Case更开放，它会问\'你认为这家公司最大的问题是什么\'，然后跟着你的答案往下走"')),
    li(t('我在开头花了2分钟说了framework，Casey接受了，然后一直在我的framework里追问')),
    li(t('关键：Casey会问你"为什么？"——不断追问，直到你给出数据支撑或承认是假设')),
    p(b('口头Case + Fit面试：')),
    li(t('Case 1：英国私立学校面对政府VAT征税（新法规），如何应对')),
    li(t('Case 2：一个市场sizing题（英国外卖市场规模）')),
    li(t('Fit被问：BCG文化是"合作而非竞争"，你怎么理解这句话？举一个你体现这个价值观的例子。')),
    li(b('教训：'), t('MS实习没有转正，面试官直接问了："Morgan Stanley为什么没有给你return offer？"——准备好这个问题，诚实说，并说明你从中学到了什么')),

    h3('Bain London AC — 2024 Written Case复盘（被拒）'),
    quote(b('分享者背景：'), t('Warwick Business School学生，分享了一次Bain Written Case的失败经历，希望帮助后来者')),
    p(b('Written Case（90分钟）题目：')),
    li(t('一家英国连锁咖啡品牌（Pret类型），计划扩张到德国市场。材料包括：英国财务数据、德国咖啡市场报告、潜在竞争对手分析、三个进入选项')),
    p(b('我做错了什么：')),
    li(t('用了整整30分钟读材料，剩下只有60分钟写')),
    li(t('写了4页，太详细，覆盖了所有材料，但没有清晰的建议')),
    li(t('最终的建议是"需要更多分析才能判断"——这是最致命的错误')),
    p(b('正确做法（事后复盘）：')),
    li(t('前15分钟：快速浏览材料，标出最重要的2-3个数字/结论')),
    li(t('15-30分钟：列出结构，确定建议是什么（不能是"需要更多信息"）')),
    li(t('30-90分钟：写，目标是1-2页，清晰的建议 + 3个理由 + 最高风险')),
    quote(t('"Bain Written Case考察的是你能不能在信息不完整的情况下做决定，并为它辩护。不是考察你能不能把所有材料都复述一遍。"')),

    hr(),

    // ──────────────────────────────────────────────
    h2('三、投行面经'),
    // ──────────────────────────────────────────────

    h3('Goldman Sachs IBD London — 2024 Superday复盘（成功）'),
    quote(b('分享者背景：'), t('Imperial College London Maths本科，提前一年做了GS Spring Insight，获得了内推')),
    p(b('技术题被问到的原题：')),
    li(t('"Walk me through a DCF." → 我从UFCF开始讲，讲了3分钟，中间被打断问WACC的计算 → 继续讲Terminal Value两种方法 → 最后被问：DCF最大的局限性是什么？')),
    li(t('"A company has EV of £500M, net debt of £100M, and 50M diluted shares. What\'s the stock price?" → £8/share（先算出Equity Value = 500-100 = £400M，再除以50M股）')),
    li(t('"You\'re advising a company on whether to use its cash to buy back shares or make an acquisition. What factors do you consider?" → 估值（自己股票便宜还是目标公司便宜）/ 战略价值 / 税务效率 / 财务灵活性')),
    p(b('被问到的Market知识题：')),
    li(t('"What\'s the FTSE 100 trading at right now?" → 我说了7,600（2024年水平），并提了英国市场估值折价于美国市场及原因')),
    li(t('"What\'s the Bank of England base rate and what do you think will happen next?" → 我说了5.25%，并讲了通胀路径和降息预期')),
    li(b('教训：'), t('提前背好FTSE、10年期国债收益率、BOE利率、近期重大交易。面试当天早上看一遍金融时报。')),

    h3('Barclays IBD — 2024 Superday（被拒后第二次成功）'),
    quote(b('分享者背景：'), t('University of Edinburgh Finance学生，第一次Superday失败，第二年重新申请成功')),
    p(b('第一次被拒的原因（Feedback）：')),
    li(t('"Your technical knowledge was solid, but we didn\'t feel your answers to \'Why Barclays\' were convincing enough."')),
    li(t('"在Superday你见了4个banker，其中一个直接问你\'你在Goldman和Barclays之间会怎么选？\'——我说了错误的答案，犹豫了太久，显得不够committed"')),
    p(b('第二次的改进：')),
    li(t('深度研究Barclays最近6个月的重大交易（M&A advisory、DCM发行）')),
    li(t('在"Why Barclays"里提到了Barclays在Takeover Panel和某个具体交易中的作用')),
    li(t('第一次失败后保持联系的Barclays内部人给我做了mock interview')),
    quote(t('"第二次Superday明显感受到他们更感兴趣。同样的技术题，但我这次答完了会主动说\'This reminds me of the recent [deal name] where Barclays advised...\'——这个习惯把我和其他候选人区分开了。"')),

    hr(),

    // ──────────────────────────────────────────────
    h2('四、科技公司面经'),
    // ──────────────────────────────────────────────

    h3('Amazon UK Business Analyst — 2024 面经（成功）'),
    quote(b('分享者背景：'), t('中国留学生，Nottingham University Business学生，通过校园宣讲认识了Amazon Campus Ambassador')),
    p(b('面试共3轮：')),
    li(b('轮1 — HR筛选：'), t('20分钟，讲背景，问"Tell me about a time you delivered results under a tight deadline"')),
    li(b('轮2 — Loop面试1（Customer Obsession + Dive Deep）：'), t('"Tell me about a time you went out of your way for a customer" → 追问5层，每次都问"What specifically did you do?" → 然后是一道SQL题：在订单表里找过去7天重复购买的用户ID')),
    li(b('轮3 — Loop面试2（Ownership + Deliver Results）：'), t('"Describe a time you identified a process improvement without being asked." → 我讲了在实习中发现Excel报告可以自动化的经历，结果节省了团队每周4小时 → 面试官问：如果当时你没有权限推进这个改进，你会怎么做？')),
    p(b('Amazon面试的独特坑：')),
    li(t('他们会在你说"我们"的时候直接打断："What did YOU specifically do?"——准备每个故事时把"我们"全换成"我"')),
    li(t('不要提没有量化结果的故事。Amazon最爱的句式："As a result, X metric improved by Y%."')),
    li(t('LP准备：16条LP要每条都有一个故事，不能有空白')),

    h3('Google Business Operations — 2024（3轮后被拒，分享给后来者）'),
    quote(b('分享者背景：'), t('ICL Engineering学生，申请Google Business Operations Analyst')),
    p(b('被问的真实问题：')),
    li(t('Behavioral: "Tell me about a time you used data to influence a key stakeholder."')),
    li(t('Case: "Google Search revenue has grown 5% YoY but is below the 12% internal target. How do you diagnose this?"')),
    li(t('Analytical: "You have two A/B test results: Test A shows 3% CTR improvement (n=10,000), Test B shows 1.5% improvement (n=100,000). Which do you trust more and why?"')),
    p(b('最终被拒的Feedback（少见）：')),
    li(t('"Your analytical framework was strong, but we wanted to see more initiative — when you described past experiences, you tended to describe what the team did, not specifically what you personally initiated."')),
    quote(t('"Google面试的精髓：他们要找的人是会主动发现问题、主动解决问题的人。每个故事的核心要是\'我主动发现了X，然后我采取了Y行动\'——不是\'公司让我做了Z\'。"')),

    hr(),

    // ──────────────────────────────────────────────
    h2('五、快消/零售管培面经'),
    // ──────────────────────────────────────────────

    h3('Unilever Future Leaders — 2024（成功），中国留学生视角'),
    quote(b('分享者背景：'), t('QMUL Marketing本科，中国留学生，PSW持有者')),
    p(b('Strengths面试里最难的题：')),
    li(t('"What would your closest friends say about you that might surprise us?" — 我回答：他们会说我在处理冲突上比表面看起来更直接。然后讲了一个我主动处理团队矛盾的经历')),
    li(t('"When do you feel most alive at work?" — 我讲了在实习中第一次独立主导一个消费者调研项目，从设计问卷到分析数据到呈现结论，那种"全链路"的感觉')),
    li(t('"Is there a Unilever brand you\'d like to work on? Why, and what would you change?" — 我说了Dove，并提出他们在中国市场的定位在当地"美白文化"中有冲突，建议本地化策略')),
    p(b('关于签证：')),
    li(t('Unilever HR在AC第一天就主动问了签证状态，没有等我先提')),
    li(t('"他们态度非常open，说\'我们每年都有国际学生，只要你是PSW就没有问题，两年到期前我们会帮你走SWV流程\'"')),
    li(b('建议：'), t('不要等到面试最后才提签证。第一轮电话面试时主动说清楚PSW状态，避免后期浪费时间')),

    hr(),

    quote(b('面经的使用方式：'), t('看面经不是为了背答案，而是为了理解"评估官在看什么"。同一道题，成功和失败的候选人给的答案可能差不多，但成功者的回答有量化数据、有具体行动、有清晰影响。这才是差距所在。')),
  ],
};
