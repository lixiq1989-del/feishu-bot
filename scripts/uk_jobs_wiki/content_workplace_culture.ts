import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '🇬🇧 英国职场文化 & 中国留学生避坑指南',
  blocks: [
    p(t('来源：Reddit r/AskUK / r/UKJobs 真实帖子、expatriate研究报告、在英工作中国人真实经历分享。避免文化误解造成的隐形减分。')),
    hr(),

    h2('一、英国职场文化的核心逻辑'),
    p(t('英国职场看起来很客气（极度礼貌），但底层逻辑是：直接结果导向 + 边界清晰 + 低权力距离（对上级不过度尊重）。')),

    tableBlock(
      ['维度', '中国职场', '英国职场', '应对方式'],
      [
        ['对上级的态度', '非常尊重，不轻易提意见', '对Boss直呼其名，当面提不同意见正常', '要有自己的观点，不要只表示赞同'],
        ['沟通风格', '含蓄，不说No而是绕弯子', '礼貌但直接，"I disagree"完全正常', '听到"That\'s interesting"不一定是同意'],
        ['会议文化', '准备充分再发言，沉默是尊重', '边讨论边形成观点，会议是创造时间', '提前准备1-2个观点，开会时要发言'],
        ['反馈方式', '私下批评，公开表扬', '可公开批评但有建设性，也私下给', '被公开批评不是侮辱，是对你的重视'],
        ['工作时间', '隐性加班文化，在才显忠诚', '准时下班被接受，结果导向', '不要为了"显忠诚"留下来，要按时交付结果'],
        ['休假文化', '不太好意思请假', '年假是权利，充分利用是正常的', '按时请假，不要让上司担心你在牺牲'],
      ]
    ),

    hr(),

    h2('二、中国留学生最常见的10个文化误区'),

    h3('1. "我还是学生，没什么有价值的观点"——最致命的自我矮化'),
    li(t('英国面试官希望你有自己的商业观点，哪怕是学生。"我觉得Tesco的策略在高端市场上有明显短板，因为..."这比"我还在学习中"有力得多')),
    li(b('正确姿态：'), t('你的视角（国际学生、新鲜眼光、不同文化背景）本身就是价值')),

    h3('2. 面试时太谦虚，不敢说成就'),
    li(t('中国文化：说自己成就是不谦虚。英国面试：你不说自己做了什么，面试官永远不知道')),
    li(t('"Our team achieved X"在英国面试里等于零分——面试官听不到你的贡献')),
    li(b('正确说法：'), t('"I identified the problem, proposed the solution, and led implementation — the team then executed it. The result was X."')),

    h3('3. 避免冲突 vs 英国人说话的"礼貌否定"'),
    p(t('英国人有一套独特的委婉语言系统，中国留学生经常字面理解：')),

    tableBlock(
      ['英国人说', '真实意思'],
      [
        ['"That\'s quite interesting."', '我不太认同'],
        ['"I hear what you\'re saying."', '我完全不同意'],
        ['"With the greatest respect..."', '我认为你错了'],
        ['"You might want to consider..."', '你必须改这个'],
        ['"It\'s not too bad."', '这其实相当好'],
        ['"I\'ll bear it in mind."', '我不会做任何事情'],
        ['"Perhaps we could revisit this?"', '这个答案是No'],
      ]
    ),

    h3('4. 不主动参与小组讨论，等别人发言完才说话'),
    li(t('误区：沉默是礼貌，等别人说完是尊重。英国职场现实：沉默者被认为没有观点或没有贡献')),
    li(t('实际上，适度打断（"Can I add something here?"）是完全可接受的，比沉默更好')),
    li(b('目标：'), t('每5-7分钟在会议/讨论中至少发言一次，即使只是提问或总结别人的观点')),

    h3('5. 自我介绍太长、太正式'),
    li(t('"My name is [full name]. I come from [city] in China. I am currently studying MSc Finance at LSE. I am very hardworking and have excellent analytical skills."')),
    li(t('英国版：')),
    li(b('正确：'), t('"Hi, I\'m [first name] — I\'m in my first year of MSc Finance at LSE. Before this I interned at [company] doing [what]. I\'m particularly interested in the energy transition space right now."')),
    li(t('关键区别：短、自然、有具体内容、有一个能展开的话题')),

    h3('6. 没有Small Talk技能'),
    li(t('英国办公室文化里，茶水间/走廊/等电梯时的small talk是真实的人脉建设时间')),
    li(t('标准small talk话题：天气、周末计划、最近看的剧、足球（了解基础就够）')),
    li(t('禁忌话题（不要主动起）：政治立场、薪资、年龄、体重外貌')),
    li(b('入门句式：'), t('"Any big plans for the weekend?" / "How was your commute today?" / "Have you tried that new coffee place near the office?"')),

    h3('7. 对反馈/批评的反应过度），'),
    li(t('收到批评时中国学生常见反应：道歉过度（"I\'m so sorry, I should have..."）或沉默尴尬')),
    li(t('英国职场期望的反应：接受→理解→说明如何改进')),
    li(b('正确回应：'), t('"Thanks for the feedback — I can see that now. Going forward I\'ll make sure to [具体改变]."')),

    h3('8. Email和消息过于正式'),
    li(t('中国习惯：写正式的开头结尾，敬语，语气郑重')),
    li(t('英国日常工作邮件（内部）：极度简洁')),

    tableBlock(
      ['场景', '中式写法', '英式写法'],
      [
        ['内部沟通', '"尊敬的[Name]，您好！我想就...事宜请教您..."', '"Hi [First Name], quick question on X — [问题]? Thanks"'],
        ['向上级发邮件', '"[职位]您好，我是XXX，有件事想向您汇报..."', '"Hi [First Name], [一句话说事], happy to chat if helpful. Best, [Your name]"'],
        ['结尾', '"感谢您百忙之中抽出时间..."', '"Thanks" / "Best" / "Cheers" 即可'],
      ]
    ),

    h3('9. 混淆"关系文化"——英国没有关系，但有Network'),
    li(t('"关系"：在中国指私人情感绑定+利益交换的非正式关系网络')),
    li(t('"Network"（英国）：基于专业互助、共同利益的联系，更透明、更对等')),
    li(t('关键区别：在英国，直接说"I\'m applying for [role], would you be willing to put in a word for me?"反而更被接受——前提是你们已经建立了真实的专业联系')),
    li(t('不要试图"送礼"或做过度私人的事情来建立关系——英国的职业界限更清晰')),

    h3('10. 过度解释失败/失误'),
    li(t('被问"为什么你上次实习没有留用/为什么换了专业"等问题时，中国学生倾向于长篇大论解释')),
    li(b('正确做法：'), t('1-2句话解释事实 + 1句话说你学到什么 + 立即转向证明你现在的能力。不要超过60秒。')),

    hr(),

    h2('三、英国办公室潜规则'),

    h3('关于茶'),
    li(t('提供帮同事泡茶/咖啡是真实的好感建立方式（"Would anyone like a tea while I\'m making one?"）')),
    li(t('接受别人的offer（"Yes, please, milk and one sugar, thank you!"）也是friendly的表示')),
    li(t('注意：中国学生常说"No thank you"然后自己去倒，这无意中显得高冷')),

    h3('关于"How are you?"'),
    li(t('"How are you?" 在英国是打招呼，不是真实询问。回答是 "Good thanks, you?"')),
    li(t('不要真的回答你过得怎么样，除非是亲近的同事在私下聊天')),

    h3('关于加班文化'),
    li(t('四大和投行确实有加班文化，但这是行业潜规则，不是"英国普遍文化"')),
    li(t('对大部分公司（科技、快消、政府）：准时下班完全正常，5点半就可以离开')),
    li(t('不要在普通公司/部门"表演勤奋"，晚走不一定被欣赏，有时会被认为效率低')),

    hr(),

    h2('四、面试中的文化信号'),

    h3('面试官说"We\'ll be in touch" — 这是什么意思'),

    tableBlock(
      ['面试官表现', '通常信号（非100%准确）'],
      [
        ['面试延时超过预定时间', '他们对你感兴趣（愿意多聊）'],
        ['"We\'ll be in touch soon"但没说具体时间', '中性，不能判断'],
        ['面试结束时主动说下一步流程', '积极信号'],
        ['"We have a very competitive pool this year"', '可能是拒绝前的铺垫'],
        ['问你 "Do you have any other offers?"', '他们在评估你的时间压力，通常是积极信号'],
        ['面试官分享了个人经历', '表示他们认为你进入了下一轮'],
      ]
    ),

    hr(),

    quote(b('文化适应建议：'), t('不要试图变成英国人，而是要理解他们的逻辑。你的中国背景（多语言、全球视角、不同文化经历）在英国职场是加分项，前提是你能用他们能理解的方式表达出来。最快的方式：找一个英国同学/朋友/导师，让他们给你日常沟通方式的真实feedback。')),
  ],
};
