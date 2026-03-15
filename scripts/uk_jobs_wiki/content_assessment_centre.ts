import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '🏟️ Assessment Centre（AC）完全实战指南',
  blocks: [
    p(t('来源：Bright Network、The Student Room、Glassdoor AC Reviews、真实参加者复盘。AC是英国校招最终关卡，通过率通常20-40%。')),
    hr(),

    h2('一、什么是Assessment Centre'),
    p(t('AC（Assessment Centre）是英国四大、投行、大型企业校招的"终极关卡"——通常持续半天到一整天，包含4-6个不同评估环节，由2-4名评估官（Assessors）全程观察评分。')),

    tableBlock(
      ['公司类型', 'AC形式', '通常持续时长', '录取率'],
      [
        ['四大（Deloitte/KPMG/PwC）', '线上或线下AC，多环节', '半天（3-5小时）', '约25-40%（进入AC后）'],
        ['MBB咨询', '无传统AC，用多轮Case面试替代', '每轮45-60分钟', '约10-20%（最终关）'],
        ['投行（Goldman/Barclays等）', 'Superday（多轮1:1面试）', '半天（3-5轮面试）', '约20-35%'],
        ['快消管培（Unilever/P&G）', '线上AC，Game+Case+Interview', '全天或半天', '约30-50%'],
        ['科技大厂（Amazon等）', 'Loop面试（多轮独立面试官）', '4-5轮', '约15-25%'],
      ]
    ),

    hr(),

    h2('二、四大AC各环节详解'),

    h3('1. Group Exercise（小组讨论）——最难提前准备的环节'),
    p(t('通常4-6人一组，讨论一个商业问题，20-30分钟，评估官在旁边观察但不参与。')),
    p(b('评估维度（根据SHL评分框架）：')),
    li(b('贡献质量（Content）：'), t('你说的话是否推进了讨论？是洞察还是重复别人？')),
    li(b('协作（Collaboration）：'), t('是否主动邀请不发言的人说话？是否在别人观点上建立？')),
    li(b('推进讨论（Facilitation）：'), t('在讨论偏离时是否把话题带回来？在快结束时是否主动总结？')),
    li(b('倾听（Active Listening）：'), t('是否认真听别人说话？发言前是否先acknowledge对方的观点？')),
    p(b('高分行为vs低分行为对比：')),

    tableBlock(
      ['行为', '评级', '具体表现'],
      [
        ['主动structure讨论', '⭐⭐⭐⭐⭐', '"I suggest we start by defining our criteria, then evaluate each option — does that work for everyone?"'],
        ['Build on others', '⭐⭐⭐⭐⭐', '"Building on what Sarah said about cost, I\'d add that the timeline risk is equally important..."'],
        ['邀请沉默者发言', '⭐⭐⭐⭐', '"Tom, you haven\'t shared your thoughts yet — what\'s your take on Option 2?"'],
        ['时间管理提醒', '⭐⭐⭐⭐', '"We have about 5 minutes left — should we start converging on a recommendation?"'],
        ['主导但不垄断', '⭐⭐⭐', '有观点，但每次发言后给别人空间'],
        ['沉默观察到最后才总结', '⭐⭐', '评估官看到的是沉默，不是"等待时机"'],
        ['打断别人', '⭐', '即使你是对的，打断是最大减分项'],
        ['完全不发言', '❌', '无论多紧张，至少每5分钟要发言一次'],
      ]
    ),

    h3('2. Written Exercise（书面分析）'),
    p(t('给一份商业材料（案例/数据/邮件），30-45分钟内写分析报告或回复邮件。')),
    p(b('常见类型：')),
    li(b('分析报告型：'), t('给公司财务数据+市场报告，写一份给高管看的战略建议（1-2页）')),
    li(b('邮件回复型：'), t('给你一封来自客户或内部同事的邮件，要求你专业地回复')),
    li(b('商业提案型：'), t('给预算限制和多个方案，选择并撰写提案')),
    p(b('高分写作结构（无论题目如何，都适用）：')),
    li(b('Executive Summary（第一段）：'), t('一句话说清楚你的结论/建议。面试官先看这里。')),
    li(b('诊断/分析（2-3点）：'), t('每点用数据支撑，不超过2-3句，用bullet而非段落')),
    li(b('建议（有优先级）：'), t('给出1-3个有优先级的行动，每个附上理由和成功指标')),
    li(b('风险（1点）：'), t('说出最主要的风险和缓解方案，显示you\'ve thought it through')),
    p(b('时间管理（45分钟版本）：')),
    li(t('0-5分钟：快速浏览材料，用笔标出最重要的3个数字/信息')),
    li(t('5-15分钟：列提纲，确定结论是什么')),
    li(t('15-40分钟：写，控制字数（质量>数量）')),
    li(t('40-45分钟：检查格式、拼写、是否有结论')),

    h3('3. Case Study / Presentation（个人Case展示）'),
    p(t('给你30-45分钟准备，然后向评估官口头呈现分析结果（5-10分钟），再回答问题（10-15分钟）。')),
    p(b('Deloitte 2024真实AC Case题目：')),
    li(t('一家英国零售银行考虑是否在印度建立Technology Centre。给你运营成本、人才供给、监管风险数据。要求：建议 yes/no 并说明原因和实施路径。')),
    p(b('Presentation高分技巧：')),
    li(t('开场直接给结论：第一句就是你的建议。不要先铺背景。')),
    li(t('用3-4页纸（即使是口头呈现，也在草稿纸上列3-4个要点）')),
    li(t('每个论点用数据支撑，即使是估算数字，要说明假设')),
    li(t('结尾留20秒说"实施下一步"：显示你在想落地，不只是分析')),

    h3('4. Competency / Partner面试'),
    p(t('1:1面试，通常是公司Manager或Partner级别。在AC当天进行，与其他环节串行。')),
    p(b('AC Competency面试 vs 普通面试的区别：')),
    li(t('更聚焦：评估官已经看过你的Group Exercise和Written Exercise，可能会直接追问你的表现')),
    li(t('更直接："We noticed in the group exercise you took a while to contribute. Can you tell me why?"')),
    li(t('更考验一致性：你在CV/网申里说的故事，和面试里说的要一致，评估官会交叉比对')),

    hr(),

    h2('三、AC当天的实操建议'),

    h3('前一天'),
    li(t('再次读一遍目标公司最新的官网About Us和Recent News')),
    li(t('准备5个STAR故事，每个标注对应的能力维度（Leadership/Teamwork/Problem Solving）')),
    li(t('查看前往地点或登录线上AC系统的方式，不要第二天才发现问题')),
    li(t('准备好纸和笔（即使是线上AC，手边有纸笔用于思考很关键）')),

    h3('当天状态管理'),
    li(t('小组讨论开始前：快速扫一眼你旁边的人，记住名字，讨论时call their name')),
    li(t('第一个发言不一定最好：但在开场5分钟内一定要发言，否则后面越来越难插进去')),
    li(t('如果一时语塞：说"That\'s a good point — let me think about that for a second"，比沉默好')),
    li(t('不要试图讨好某个"强势"组员：评估官在观察每个人，你与强势组员对话的方式也在被评分')),

    h3('不同公司AC的特别注意事项'),

    tableBlock(
      ['公司', '特别注意', '典型雷区'],
      [
        ['Deloitte', 'Group Exercise后会有Debriefing，问你对自己的小组表现的自我评估', '自我评估太高（显得不自知）或太低（显得没信心）'],
        ['KPMG', 'Written Exercise非常考察Commercial Awareness，不是纯逻辑分析', '写法太学术，忘了audience是客户高管'],
        ['PwC', '整天都有非正式观察（包括午餐）', '在午餐时间只和中国同学聊，不和其他候选人交流'],
        ['Unilever', 'Strengths测评的结果会和当天观察交叉比对', '面试里的回答和Strengths测评结果明显矛盾'],
        ['Amazon', 'Loop面试每个面试官独立评分，不互相沟通（直到Debrief）', '对不同面试官讲同一个故事，因为你以为他们知道——他们不知道'],
      ]
    ),

    hr(),

    h2('四、AC后的跟进'),
    li(b('即使拿到Offer：'), t('发一封感谢邮件给AC协调员（不用发给每个面试官），2-3句即可，表示感谢和期待')),
    li(b('被拒后要Feedback：'), t('大部分公司会提供Feedback，务必要求。这是提升的最直接方式。')),
    li(b('复盘记录：'), t('当天晚上写下每个环节你觉得做得好/不好的点，下次AC用')),
    li(b('等待期：'), t('AC之后通常1-2周出结果。不要一直发邮件催促，但2周后未收到通知可以礼貌跟进一次')),

    hr(),

    quote(b('AC的本质：'), t('AC不是考试，是工作模拟。评估官在问的问题是："我愿意让这个人和我一起去客户现场吗？"所有环节都在回答这一个问题。镇定、自信、对别人genuinely感兴趣——这些比任何技术知识都重要。')),
  ],
};
