import { Page, h1, h2, h3, p, t, b, li, ol, hr, quote } from './blocks';

export const page: Page = {
  title: '面试准备进阶 · 各校题库与实战技巧',
  blocks: [
    h1('面试准备进阶：各校题库与实战技巧'),
    p(t('拿到面试邀请说明你的硬件已经过关，面试是最后一道关。这篇整理了各校面试形式、高频题目和实战技巧，帮你从容应对。')),
    hr(),

    // ─── 一、面试形式 ───
    h2('一、各学校面试形式大全'),

    h3('真人面试（Live Interview）'),
    li(t('面试官为 Admissions 团队成员、教授或校友')),
    li(t('形式：Zoom/Skype 视频、现场面试（部分学校在中国设面试点）')),
    li(b('代表学校'), t('：LBS、Oxford、Cambridge、HEC、MIT Sloan、Columbia、HKU、HKUST')),
    li(b('时长'), t('：20-45 分钟')),
    li(b('特点'), t('：有互动，可以根据你的回答追问；最能展示个人魅力')),

    h3('Kira Talent（AI 录制面试）'),
    li(t('系统随机出题，限时准备（30-60 秒）+ 限时回答（60-120 秒）')),
    li(t('录制视频，由 Admissions 团队事后观看评估')),
    li(b('代表学校'), t('：Rotman、Schulich、部分欧洲商学院')),
    li(b('特点'), t('：不能重录，第一遍就是最终版；需要适应对着摄像头说话')),

    h3('HireVue（AI 视频面试）'),
    li(t('类似 Kira，但更多用于求职场景；部分商学院也采用')),
    li(b('代表学校'), t('：部分美国商学院')),
    li(b('特点'), t('：可能有 AI 分析面部表情和语调（保持自然、微笑）')),

    h3('Video Essay（视频短文）'),
    li(t('给你一个题目，录制 1-2 分钟的视频回答')),
    li(b('代表学校'), t('：HEC、Kellogg、Yale SOM')),
    li(b('特点'), t('：通常只有 1-2 次录制机会；提前练习很重要')),

    h3('Group Discussion / Group Interview'),
    li(t('与其他申请者一起讨论一个案例或话题')),
    li(b('代表学校'), t('：ESSEC、部分法国 Grande Ecole、SMU')),
    li(b('特点'), t('：考察团队合作和领导力；不要抢话但也不能沉默')),

    h3('Written Test / Case Study'),
    li(t('现场或线上完成一个案例分析或写作任务')),
    li(b('代表学校'), t('：SMU（Admissions Test）、部分法国学校')),
    li(b('特点'), t('：考察逻辑思维和书面表达')),
    hr(),

    // ─── 二、高频题库 ───
    h2('二、高频面试题库'),

    h3('必问题（每个学校都会问）'),
    ol(b('Walk me through your resume / Tell me about yourself')),
    p(t('准备 2 分钟版本：教育背景 → 关键实习经历 → 为什么申请这个项目 → 职业目标。不要复述简历，要讲故事。')),

    ol(b('Why this program / Why our school?')),
    p(t('必须具体！提到 2-3 个项目特色：具体课程名、教授研究方向、行业合作、校友网络、地理位置优势。')),

    ol(b('What are your short-term and long-term career goals?')),
    p(t('短期（毕业后 2-3 年）：具体行业 + 具体职能。长期（5-10 年）：更大的愿景。两者之间要有逻辑联系。')),

    ol(b('Why do you want to study abroad / Why not stay in China?')),
    p(t('说国际化视野、特定教育资源、职业发展机会。不要说"国内竞争太激烈"或"就想出去看看"。')),

    h3('行为面试题（Behavioral Questions）'),
    ol(b('Tell me about a time you led a team')),
    ol(b('Tell me about a challenge you overcame')),
    ol(b('Tell me about a time you failed and what you learned')),
    ol(b('Describe a situation where you had to work with someone difficult')),
    ol(b('Tell me about your most impactful project/achievement')),
    p(t('全部用 STAR 框架回答：Situation → Task → Action → Result。每个故事准备 2 分钟版本。')),

    h3('专业知识题（部分学校）'),
    li(b('Finance 项目'), t('：What is DCF? / Explain the Black-Scholes model / What drives stock prices?')),
    li(b('BA 项目'), t('：How would you use data to solve XX problem? / What is regression analysis?')),
    li(b('Marketing 项目'), t('：How would you launch a new product in China? / What is a brand strategy?')),
    li(b('Management 项目'), t('：What makes a good leader? / How do you handle conflicts in a team?')),

    h3('压力面试题'),
    ol(b('What is your biggest weakness?')),
    p(t('说一个真实的弱点 + 你正在怎么改进。不要说"我太追求完美了"这种假弱点。')),

    ol(b('Why should we choose you over other candidates?')),
    p(t('说你的独特贡献：独特的背景组合、文化视角、行业经验。不要贬低其他候选人。')),

    ol(b('What if you don\'t get admitted?')),
    p(t('展示成熟度：有备选方案，但表达对这个项目的强烈意愿。')),
    hr(),

    // ─── 三、各校面试特点 ───
    h2('三、重点学校面试特点'),

    h3('LBS（London Business School）'),
    li(t('校友面试为主，30-45 分钟，形式轻松但内容深入')),
    li(t('非常看重 Career Goals 的清晰度和可行性')),
    li(t('会深入追问你的实习经历细节，尤其是领导力和个人观点')),
    li(t('注意：LBS 面试通过率约 50-60%，不是走过场')),
    li(b('WSO 面经'), t('：面试像对话，会问你对项目的看法、最近的新闻、个人领导经历，约 45 分钟到 1 小时')),

    h3('Oxford Saïd'),
    li(t('Admissions 团队面试，在线或现场')),
    li(t('会问 Why Oxford specifically（而不只是 Why UK）')),
    li(t('喜欢有独特经历和清晰自我认知的学生')),
    li(b('WSO 面经'), t('：先是常规问题，然后会涉及博弈论、概率和经济/金融问题，重点考察思考过程而非标准答案')),
    li(b('GMAT 要求'), t('：Oxford MFE 极度学术化，通常要求一等学位 + GMAT 720+，非常注重量化能力')),

    h3('HEC Paris'),
    li(t('通常包含：个人面试 + Video Essay')),
    li(t('面试约 25 分钟，Zoom 进行，面试官通常是招生主管 + 校友 2 人')),
    li(b('GMAT Club 面经'), t('：开场比较常规（自我介绍、Why HEC），然后会自然过渡到你的具体经历，更像对话而非审讯')),
    li(b('技术 vs 动机'), t('：有金融背景的申请者会被问更多技术问题（非常难），无金融背景的主要问动机类问题')),
    li(t('Video Essay：1 分钟准备 + 1 分钟录制，不可重录')),
    li(b('真实反馈'), t('：面试前会先和学生大使聊天，氛围轻松，不用太紧张。被描述为\"非常愉快的体验\"')),
    li(b('常见问题'), t('：自我介绍 / 为什么选你的本科专业 / Why MiM / Why Europe / 如何适应法国 / 你有什么问题')),

    h3('MIT Sloan'),
    li(t('行为面试为主（BBI - Behavioral Based Interview）')),
    li(t('邀请制，通过率较高（70%+）')),
    li(t('重点考察 Innovation、Impact、Community Contribution')),

    h3('Columbia'),
    li(t('校友面试或 Admissions 面试')),
    li(t('会问你对纽约金融行业的了解')),
    li(t('Career Goals 必须非常具体')),
    li(b('真实案例'), t('：一位中国学生 GPA 3.48 + GMAT 760，被问了很多关于为什么选 Columbia 而非其他纽约学校的问题')),

    h3('Imperial College London'),
    li(t('MSc Finance 使用视频面试系统')),
    li(b('面试形式'), t('：6 个问题从题库随机抽取，涵盖行为题和金融相关题')),
    li(t('每题有准备时间，然后录制回答')),
    li(t('不能重录，需要提前大量练习')),

    h3('HKU / HKUST'),
    li(t('Admissions 团队或教授面试，15-25 分钟')),
    li(t('偏学术，可能问专业知识')),
    li(t('会问 Why Hong Kong / 毕业后是否考虑留港')),

    h3('NUS / NTU'),
    li(t('不是所有项目都有面试')),
    li(t('有面试的通常在线 20 分钟')),
    li(t('比较友好，更像一次对话')),
    hr(),

    // ─── 四、STAR 框架 ───
    h2('四、STAR 框架实战'),
    p(t('STAR 是回答行为面试题的标准框架。每个答案控制在 2 分钟内。')),

    h3('框架拆解'),
    li(b('S - Situation'), t('：简短交代背景（10%）')),
    li(b('T - Task'), t('：你的具体任务/角色是什么（10%）')),
    li(b('A - Action'), t('：你做了什么（50%）← 重点！')),
    li(b('R - Result'), t('：结果如何，最好有数据（30%）')),

    h3('示例：领导力故事'),
    li(b('S'), t('：大三暑假在某投行实习，团队负责一个并购项目的尽职调查')),
    li(b('T'), t('：我被分配负责协调 3 个分析师完成财务建模部分')),
    li(b('A'), t('：我建立了每日同步机制，创建了标准化的模板，主动承担了最复杂的估值部分')),
    li(b('R'), t('：提前 2 天完成任务，模型被直接用于客户展示，收到 MD 的书面表扬')),

    h3('准备建议'),
    li(t('准备 5-8 个不同主题的 STAR 故事（领导力/挑战/失败/团队合作/创新）')),
    li(t('每个故事可以根据不同问题灵活调整角度')),
    li(t('写下来 → 反复练习 → 不要背稿而是记住关键点')),
    hr(),

    // ─── 五、Case Interview ───
    h2('五、Case Interview 基础'),
    p(t('部分商科项目（尤其是 MiM/Management）可能包含简单的 Case Interview。')),

    h3('常见 Case 类型'),
    li(b('Market Sizing'), t('：估算中国每年卖出多少杯咖啡？')),
    li(b('Profitability'), t('：某公司利润下降，分析原因')),
    li(b('Market Entry'), t('：某品牌是否应该进入中国市场？')),

    h3('应对策略'),
    li(t('使用结构化框架（但不要死板套用）')),
    li(t('大声说出你的思考过程（比最终答案更重要）')),
    li(t('做合理假设并说明理由')),
    li(t('Case in Point / Victor Cheng 的书是入门经典')),
    hr(),

    // ─── 六、Group Discussion ───
    h2('六、Group Discussion 技巧'),
    p(t('部分欧洲商学院和新加坡 SMU 有 Group Discussion 环节。')),

    h3('角色选择'),
    li(b('开场者'), t('：第一个发言定义问题框架 → 展示领导力')),
    li(b('总结者'), t('：最后总结讨论 → 展示概括能力')),
    li(b('调和者'), t('：当讨论偏题或冲突时拉回来 → 展示团队合作')),

    h3('注意事项'),
    li(t('不要抢话、打断别人')),
    li(t('不要沉默超过 3 分钟')),
    li(t('引用/回应别人的观点（\"Building on what XX said...\"）')),
    li(t('如果有人一直沉默，邀请他发言（\"XX, what do you think?\"）')),
    li(t('保持友好、积极的态度')),
    hr(),

    // ─── 七、面试后 ───
    h2('七、面试后：Thank You Email'),

    h3('什么时候发'),
    li(t('面试结束后 24 小时内发送')),

    h3('发给谁'),
    li(t('面试官（如果有邮箱的话）+ Admissions Office')),

    h3('怎么写'),
    li(t('3-5 句话即可，不要太长')),
    li(b('内容'), t('：感谢面试机会 → 提到面试中印象深刻的一个讨论点 → 重申你对项目的热情')),
    li(b('例如'), t('：Thank you for taking the time to speak with me today about the MSc Finance program. I particularly enjoyed our discussion about [specific topic]. This conversation further strengthened my enthusiasm for joining [school name]. I look forward to hearing from you.')),

    h3('Thank You Email 不会决定录取，但展示了专业和礼貌'),
    li(t('真人面试一定要发')),
    li(t('Kira/HireVue 录制面试通常不需要发')),
    hr(),

    // ─── 八、面试硬件准备 ───
    h2('八、线上面试硬件与环境'),
    li(b('网络'), t('：有线网络 > WiFi，提前测试稳定性')),
    li(b('摄像头'), t('：确保光线充足，脸部清晰可见')),
    li(b('背景'), t('：干净整洁的墙面或书架，不要用虚拟背景')),
    li(b('着装'), t('：Smart Casual 到 Business Casual（衬衫即可，不需要西装）')),
    li(b('设备'), t('：提前测试 Zoom/Teams/Skype，确保麦克风和音频正常')),
    li(b('时区'), t('：确认面试时间是哪个时区！设好闹钟提前 15 分钟上线')),
    li(b('备份方案'), t('：手机热点备用，万一网络断了可以切换')),
    hr(),

    quote(b('面试核心：'), t('面试不是考试，而是一次对话。展示真实的你比展示完美的你更重要。招生官见过太多\"模板回答\"了，他们想看到有个性、有思考、有热情的申请者。多练习、少背稿、保持自然。')),
  ],
};
