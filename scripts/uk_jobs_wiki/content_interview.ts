import { Page, h2, h3, p, t, b, li, ol, hr, quote } from '../biz_wiki/blocks';

export const page: Page = {
  title: '🎯 面试题库与通关指南',
  blocks: [
    p(t('英国商科面试主要分四类：Competency-Based（CBI）/ Strengths-Based（SBI）/ Case Study / Group Exercise。本页拆解每类的核心逻辑和高频题目。')),
    hr(),

    h2('一、Competency-Based Interview（CBI）'),
    p(t('最常见的面试类型，考察你过去的行为来预测未来表现。使用 STAR 结构回答：Situation → Task → Action → Result。')),

    h3('STAR 框架详解'),
    li(b('S - Situation：'), t('简短交代背景（2-3句），不要超过30秒')),
    li(b('T - Task：'), t('你的具体职责/目标是什么')),
    li(b('A - Action：'), t('你"个人"采取了什么行动（用"I"而非"We"）')),
    li(b('R - Result：'), t('量化结果！"提升了 20%"比"有所改善"有力10倍')),
    p(t('中国留学生最常犯的错：Action 和 Result 太模糊，要提前准备3-5个带数据的核心故事。')),

    h3('高频 Competency 题目（按主题）'),

    h3('领导力 Leadership'),
    li(t('Tell me about a time you led a team through a challenging situation.')),
    li(t('Describe a situation where you had to motivate others.')),
    li(t('Give an example of when you had to make a decision without full information.')),
    p(b('准备提示：'), t('不一定是正式"领导"角色，项目组长、学生社团负责人都算；重点是你如何影响别人行动。')),

    h3('团队合作 Teamwork'),
    li(t('Tell me about a time you worked in a diverse team with different opinions.')),
    li(t('Describe a situation where you had a conflict with a team member. How did you resolve it?')),
    li(t('Give an example of when you had to compromise to achieve a team goal.')),
    p(b('准备提示：'), t('冲突题是陷阱题——不要让自己显得总是对的，重点是"我怎么理解对方视角然后找到解决方案"。')),

    h3('问题解决 Problem Solving'),
    li(t('Tell me about a time you identified a problem that others had missed.')),
    li(t('Describe a situation where you had to analyse a large amount of data to make a decision.')),
    li(t('Give an example of when things didn\'t go as planned. What did you do?')),

    h3('商业意识 Commercial Awareness'),
    li(t('Why do you want to work in [consulting/finance/technology]?')),
    li(t('Tell me about a business or news story that has caught your attention recently.')),
    li(t('What do you see as the biggest challenge facing our industry in the next 3 years?')),
    p(b('准备提示：'), t('这类题必须结合目标公司最新动态。四大问AI/数字化转型；咨询问行业趋势；投行问市场行情。')),

    h3('压力与韧性 Resilience'),
    li(t('Tell me about a time you failed. What did you learn?')),
    li(t('Describe a situation where you had to manage multiple competing deadlines.')),
    li(t('Give an example of when you received critical feedback. How did you respond?')),
    p(b('准备提示：'), t('失败题不要选太小的失败（"我迟到了"），也不要无法收场（"我让整个项目失败了"）。选一个有真实影响但最终有学习的经历。')),
    hr(),

    h2('二、Strengths-Based Interview（SBI）'),
    p(t('越来越多公司（PwC、AVIVA、角子机）转向 Strengths-Based 面试。不问过去，问"你享受做什么""什么让你充满能量"。')),

    h3('SBI 核心逻辑'),
    p(t('面试官在找你真正擅长且热爱的事，而不是你背好的故事。没有标准答案，但需要真诚+具体。')),

    h3('高频 SBI 题目'),
    li(t('What do you enjoy most about working with others?')),
    li(t('When do you feel most energised at work or studying?')),
    li(t('What kind of work do you find easiest?')),
    li(t('Tell me about something you have done that you are proud of.')),
    li(t('Do you prefer working independently or as part of a team?')),
    li(t('What would your friends say is your greatest strength?')),
    li(t('Is there anything you can just pick up and get good at quickly?')),

    h3('SBI 应对策略'),
    li(b('不要背剧本：'), t('回答要自然，面试官会追问，背稿一追就露')),
    li(b('联系岗位：'), t('回答要和你申请的角色有关联，比如"我喜欢分析数据"对应 Analyst 岗位')),
    li(b('真实的能量点：'), t('回答"什么让你充满能量"时，说真话，面试官能感受到真假')),
    hr(),

    h2('三、Case Study 面试'),
    p(t('主要在咨询（MBB / 四大 Consulting / EY-P）面试中出现，也越来越多出现在投行和科技公司。')),

    h3('Case 结构框架（MECE 原则）'),
    li(b('1. 确认问题：'), t('复述题目，确认目标，问1-2个澄清问题')),
    li(b('2. 建立框架：'), t('列出分析维度（利润树/3C/4P/Porter五力等）')),
    li(b('3. 优先排序：'), t('说明先分析哪个分支，为什么')),
    li(b('4. 数据计算：'), t('大声说出思路，别在脑子里算完再说结论')),
    li(b('5. 综合结论：'), t('自信给出建议，带上"如果需要进一步了解，我还想看..."')),

    h3('常见 Case 类型'),
    li(b('盈利能力下降：'), t('→ 收入端/成本端拆解 → 外部/内部原因 → 解决方案')),
    li(b('市场进入：'), t('→ 市场吸引力（规模/增速/竞争）→ 公司能力匹配 → 进入方式（自建/收购/合作）')),
    li(b('定价策略：'), t('→ 成本基础定价/竞争参考定价/价值定价 → 客户细分')),
    li(b('并购判断：'), t('→ 战略契合度 → 财务回报 → 整合风险 → Synergies')),
    li(b('运营改善：'), t('→ 流程诊断 → 瓶颈定位 → 优先级排序')),

    h3('Market Sizing（市场估算）'),
    p(t('中国留学生最容易失分的环节——不是因为算错，而是结构不清。')),
    li(b('标准路径：'), t('人口基数 → 目标人群比例 → 使用频率 → 单次金额 → 总规模')),
    li(b('例题：'), t('估算伦敦每天喝咖啡的市场规模')),
    li(t('伦敦人口 ~900万 → 成年人 ~700万 → 每天喝咖啡人群 ~50% = 350万人 → 平均 1.2 杯/天 → 均价 £3.5 → 每天约 £1,470万')),
    li(b('关键：'), t('数字合理即可，过程结构清晰比精确更重要')),

    h3('Case 面试中国留学生常见问题'),
    li(t('过于沉默：面试官在等你思考过程，要边做边说（Think out loud）')),
    li(t('框架套用太死板：先理解问题再选框架，不要一上来就画"3C"')),
    li(t('不主动假设：没数据时大胆说"我假设..."，面试官会纠正你')),
    li(t('不敢给结论：咨询面试最忌讳含糊，要清晰说出建议')),
    hr(),

    h2('四、Group Exercise（小组练习）'),
    p(t('四大 Assessment Centre 必有环节，也在 Graduate Scheme AC 中频繁出现。')),

    h3('小组练习类型'),
    li(b('讨论型：'), t('给一个商业问题，小组讨论并达成共识，时间约 20-30 分钟')),
    li(b('角色扮演型：'), t('每人拿到不同信息，需要整合信息后共同决策')),
    li(b('优先级排序：'), t('给出多个选项，小组决定优先级顺序并说明理由')),

    h3('评分维度'),
    li(b('贡献质量：'), t('你的观点是否有价值，不是只要说话就好')),
    li(b('倾听与回应：'), t('能否接着别人的话往下说，不要自说自话')),
    li(b('推进讨论：'), t('在讨论偏离时能否把话题带回来')),
    li(b('时间管理：'), t('快结束时提醒大家"我们还有5分钟，先确认一下结论"')),

    h3('中国留学生小组练习常见坑'),
    li(t('"我先不说，等大家都说完再总结"——评分员看到的是沉默，不是"等待时机"')),
    li(t('抢着主导然后打断别人——适度主导，不要垄断')),
    li(t('全程只讲自己的观点，不 build on others——这是英国职场最看重的协作能力')),
    li(t('语速太快、口音太重——在英国面试，清晰表达比华丽词汇更重要')),
    hr(),

    h2('五、Online Tests 攻略'),

    h3('数字推理（Numerical Reasoning）'),
    p(t('SHL / Kenexa / Cubiks 是最常见平台，通常给图表/数据，限时回答。')),
    li(b('备考工具：'), t('JobTestPrep（付费但最全）/ Assessment Day（免费）/ SHL 官网免费练习')),
    li(b('常见坑：'), t('时间紧，先做能做的，跳过复杂计算题；答案通常不需要精确计算，估算到接近选项即可')),

    h3('情景判断（Situational Judgement Test / SJT）'),
    p(t('给工作场景，选择"最好"和"最差"的应对方式。答案没有完全客观，但有规律。')),
    li(b('核心逻辑：'), t('英国职场价值观：直接沟通 > 回避冲突；请求帮助 > 一个人扛着；先确认再行动 > 想当然')),
    li(b('备考：'), t('找目标公司的公司价值观，SJT 答案与其高度匹配')),

    h3('HireVue 视频面试'),
    p(t('自动化视频面试，AI 分析你的表情/语速/用词，越来越普遍。')),
    li(b('准备：'), t('提前测试摄像头、光线、网络；穿正装；背景干净')),
    li(b('技巧：'), t('说话适中偏慢，保持眼神看摄像头（不是屏幕），每题准备好再点开始')),
    li(b('时间：'), t('通常每题 1-2 分钟，准备时间 30 秒；提前想好结构')),
    hr(),

    quote(b('面试备考路线图：'), t('第 1-2 周准备 5 个 STAR 故事 → 第 3 周做 2 套 Numerical Test → 第 4 周做 Case 练习 → 面试前一天看目标公司最新新闻。不要试图临时抱佛脚，6 周是最低准备周期。')),
  ],
};
