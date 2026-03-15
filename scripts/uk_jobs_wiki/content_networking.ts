import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '🤝 英国求职人脉网络实战手册',
  blocks: [
    p(t('来源：LinkedIn职场建议、Reddit r/UKJobs经验贴、Bright Network Network Building指南、真实成功内推案例分析。')),
    p(b('核心事实：'), t('英国约70%的职位通过网络人脉填充（非公开申请）。中国留学生的最大劣势不是语言或成绩，而是network太薄。')),
    hr(),

    h2('一、英国求职Network的三个层次'),

    tableBlock(
      ['层次', '关系类型', '获取方式', '对求职的价值'],
      [
        ['一度关系（直接认识）', '同学/导师/实习同事', '在校期间主动维护', '直接内推、内部信息、推荐信'],
        ['二度关系（朋友的朋友）', '校友、同学介绍的人', 'LinkedIn、校友会', '咖啡聊天、间接内推'],
        ['三度关系（陌生人）', '目标公司员工', 'Cold Outreach', '信息收集、长期关系培养'],
      ]
    ),

    hr(),

    h2('二、Insight Day / Spring Week——最被忽视的机会'),
    p(t('这是中国留学生最大的时间窗口浪费。大一大二的春季学期，很多公司开放1-5天的体验项目。')),

    h3('为什么Insight Day比发简历有价值10倍'),
    li(t('直接接触到公司员工甚至招聘经理，建立真实人脉')),
    li(t('参加者通常优先获得暑期实习邀请（部分公司是直通）')),
    li(t('了解内部文化，知道真正的工作是什么，写Cover Letter时能说出真实观察')),
    li(t('大部分参加者的背景比你想象的普通——Insight Day门槛比正式申请低很多')),

    tableBlock(
      ['公司', '项目名称', '时间', '申请时间', '面向'],
      [
        ['Goldman Sachs', 'Goldman Sachs Insight Week', '3月/4月', '1-2月申请', '大一/大二'],
        ['JP Morgan', 'Winning Women / Diverse Leaders', '春季', '秋季申请', '大一/大二'],
        ['Deloitte', 'Spring Into Deloitte', '春季', '秋季申请', '大一'],
        ['KPMG', 'Year in Industry', '全年', '随时', '有空档的学生'],
        ['McKinsey', 'McKinsey Insight', '全年不定期', '邮件注册', '大一/大二/硕士一年级'],
        ['BCG', 'BCG Gamma/Discover', '全年不定期', '随机邀请或申请', '多背景'],
        ['Barclays', 'Barclays Diversity Spring Programme', '春季', '1-2月', '大一/大二'],
      ]
    ),

    h3('如何最大化Insight Day的价值'),
    li(b('Before：'), t('研究参加者（LinkedIn查报名系统能看到的HR名字），准备2-3个真实问题')),
    li(b('During：'), t('每个session结束后都要和presenter/employee交换LinkedIn。不要等最后再统一要')),
    li(b('After（关键）：'), t('当晚发LinkedIn Connection Request + 消息："Hi [Name], it was great meeting you at [event] today. Particularly enjoyed your insights on [具体说一件事]. Would love to stay in touch."')),
    li(b('3个月后：'), t('开始正式申请时，给这些人发消息："I\'m applying to [role] — would it be okay to ask a few questions about the team?"')),

    hr(),

    h2('三、Coffee Chat（咖啡聊天）完整操作指南'),
    p(t('Cold Outreach在英国职场完全被接受，只要方式正确。每周花1-2小时做coffee chat，一个申请季积累下来就是10-20个真实人脉。')),

    h3('找谁聊——优先级排序'),
    li(b('最高价值：'), t('毕业1-3年的中国/国际学生，在你目标公司工作。他们最能理解你的处境，也最愿意分享')),
    li(b('高价值：'), t('毕业3-5年的校友（相同学校或相近学校），在你目标公司')),
    li(b('中等价值：'), t('目标公司的任何员工（不限背景），做你想做的岗位')),
    li(b('如何找：'), t('LinkedIn搜索：[公司名] + [学校名] + [毕业年份范围]；或学校校友数据库')),

    h3('LinkedIn Cold Outreach消息模板（有效vs无效）'),
    p(b('❌ 无效模板（太长、太正式、太露骨）：')),
    quote(t('"Dear Mr/Ms [Name], I am a MSc Finance student at LSE. I am very interested in joining Goldman Sachs IBD. Could you please tell me about the application process and what skills I need? I would also like to know if you can refer me. Thank you very much for your time."')),
    p(b('✅ 有效模板（简洁、具体、有人情味）：')),
    quote(t('"Hi [Name], I\'m a first-year MSc Finance student at LSE — came across your profile and noticed you made the move from [similar background] to Goldman\'s IBD team. I\'m exploring a similar path and would love to hear what the role is really like day-to-day. Would you be up for a 20-minute call sometime? Happy to work around your schedule!"')),

    h3('Coffee Chat中该问什么（和不该问什么）'),

    tableBlock(
      ['好问题', '不好的问题'],
      [
        ['"What does a typical Monday look like for you?"', '"Can you refer me for the Analyst role?"（太早）'],
        ['"What\'s something about the job that surprised you after you started?"', '"What\'s the salary?" （太直接且Google可查）'],
        ['"If you could go back and do one thing differently in the application process, what would it be?"', '"Do you think I have a good chance of getting in?"（让对方难答）'],
        ['"Are there any resources you\'d recommend beyond the company website?"', '"Can I put your name as a referral in my application?"（第一次见面问）'],
        ['"What\'s the team culture really like vs. what\'s on the website?"', '"How hard was it to get in and what\'s the rejection rate?"'],
      ]
    ),

    h3('跟进和维护（最关键但最被忽视的步骤）'),
    li(b('当天：'), t('发感谢消息（3-4句）："Great speaking with you today — particularly helpful to hear your thoughts on [具体话题]. I\'ll definitely look into [something they mentioned]."')),
    li(b('申请时：'), t('发消息告知："I submitted my application to [role] today — thought I\'d let you know and thank you again for the insights."')),
    li(b('收到结果时：'), t('无论成功还是失败，都告知结果。失败了："Unfortunately not this time, but I really appreciated your help — I\'ll keep going!"')),
    li(b('每隔3-6个月：'), t('发一条相关文章或新闻分享，保持联系，不要只在需要时才联系')),

    hr(),

    h2('四、LinkedIn主动被发现——Inbound Strategy'),
    p(t('与其每天刷新应聘网站，不如让招聘方主动找到你。')),

    h3('关键词优化（让Recruiter搜索到你）'),
    li(t('Headline写清楚：职能方向 + 学校 + 当前状态（如"Open to 2026 Graduate Roles in Consulting | MSc Finance @ LSE"）')),
    li(t('Skills section：填满，尤其是：Financial Analysis, Data Analysis, SQL, PowerPoint, Python, Consulting, Stakeholder Management')),
    li(t('"Open to Work"设为Recruiters Only：公司HR会用LinkedIn Recruiter搜索，Open to Work的候选人会被优先展示')),
    li(t('Education section：写清楚学位名称、成绩、相关课程（Relevant Coursework）')),

    h3('内容发布——被动建立credibility'),
    li(t('每2周发一条关于目标行业的观察（不需要很长，100-200字+1张图或图表）')),
    li(t('"I read the McKinsey report on AI adoption and found X particularly interesting because..."这类帖子对招聘方信号很强')),
    li(t('点赞/评论目标公司员工的帖子（但要有实质内容，不要只点赞）')),
    li(t('不需要成为"LinkedIn Influencer"，每月2-3条有观点的帖子就足够')),

    hr(),

    h2('五、校园资源——被严重低估的渠道'),

    h3('大学Careers Service'),
    li(t('每周有针对不同行业的workshop：投行技术准备、咨询Case练习、CV Review')),
    li(t('可以预约1:1 Career Consultant（通常有50分钟）：让他们Mock Interview你，效果远好于自己练')),
    li(t('很多大学有行业导师项目（Alumni Mentoring Programme）：直接匹配你到你目标行业的校友')),

    h3('学生社团（Trading Society / Consulting Society / Finance Society）'),
    li(t('这类社团有专门的Industry Talk，邀请公司员工来讲，结束后有networking session')),
    li(t('部分社团有内部Mock Interview体系，互相练Case或Competency')),
    li(t('在这类社团担任职位（VP of Consulting Society等）对CV和Networking都有帮助')),

    h3('公司宣讲会（Company Presentations）'),
    li(t('每年9-11月大量公司到各大学做宣讲，参加率不高的主要原因是不知道有这些活动')),
    li(t('如何知道：关注你的学校Careers Service邮件、LinkedIn页面、学生社团公告')),
    li(t('宣讲会结束的Q&A + Networking环节：和presenter交换LinkedIn，第二天发消息，和陌生人的Cold Outreach效果完全不同')),

    hr(),

    quote(b('Network总结：'), t('中国留学生的network劣势是真实存在的，但完全可以通过系统性努力弥补。Insight Day（大一大二）→ 宣讲会/Coffee Chat（大三/硕士一年级）→ 内推申请（申请季）。每一步都在积累，不要等到大三才开始。在英国，"谁帮你说话"有时比"你考了多高分"更重要。')),
  ],
};
