import { Page, h2, h3, p, t, b, li, hr, quote } from '../biz_wiki/blocks';

const tableBlock = (headers: string[], rows: string[][]) =>
  ({ __table: true as const, headers, rows });

export const page: Page = {
  title: '📄 英国CV + LinkedIn实战指南',
  blocks: [
    p(t('来源：Bright Network、目标就业（TargetJobs）、Reddit r/UKJobs、The Student Room 实战经验汇总。')),
    hr(),

    h2('一、英国CV的核心逻辑（与中文简历的本质区别）'),

    tableBlock(
      ['维度', '中文简历', '英国CV'],
      [
        ['长度', '1-2页，越详细越好', '严格1页，超出即减分'],
        ['照片', '通常需要', '绝对不要放（防歧视法律）'],
        ['个人信息', '年龄/性别/籍贯常见', '只需姓名+联系方式+LinkedIn'],
        ['语气', '客观描述', '主动动词开头，第一人称不用写'],
        ['成绩', '可以只列学位', 'GPA/分类（2:1/First）必须写清楚'],
        ['兴趣爱好', '可有可无', '必须有，且要具体（不能写"读书旅游"）'],
        ['字体', '宋体/微软雅黑', 'Times New Roman/Garamond，10-11pt'],
      ]
    ),

    h2('二、英国CV结构模板'),

    h3('第一块：Personal Details'),
    li(b('姓名：'), t('居中，比正文大2pt，可加粗')),
    li(b('联系方式：'), t('手机 | 邮箱 | LinkedIn URL（缩短后的个人链接）')),
    li(b('地址：'), t('写城市即可（如London, UK），不用详细地址')),
    li(b('不要写：'), t('年龄、照片、国籍（除非你有工作权限且想强调）')),

    h3('第二块：Education（教育经历，最前面）'),
    li(t('大学名称 + 学位名称 + 年份（如 2023–2025）')),
    li(t('成绩分类：如 Predicted First Class Honours / Merit（Pass/Merit/Distinction体系）')),
    li(t('相关课程（如有）：只列与岗位相关的3-4门')),
    li(t('学位论文（如有）：一句话说题目和方法')),
    li(b('关键：'), t('英国雇主非常看重 2:1 vs 2:2 的区别。大部分Graduate Scheme要求至少2:1。如果是国内本科，注明GPA和百分位')),

    h3('第三块：Work Experience（从近到远排列）'),
    li(b('格式：'), t('公司名称 + 岗位 + 时间 + 地点（一行）→ 下面3-4个bullet')),
    li(b('每条bullet开头用动词：'), t('Analysed / Developed / Led / Delivered / Reduced / Increased / Coordinated')),
    li(b('必须量化：'), t('"Reduced processing time by 30%" 远比 "Improved efficiency" 有力')),
    li(b('中国实习经验：'), t('英国雇主看得懂四大、McKinsey、腾讯、阿里。写清楚公司规模或行业知名度')),

    h3('第四块：Skills & Interests'),
    li(b('Languages：'), t('Mandarin Chinese (Native), English (Fluent), French (Intermediate)')),
    li(b('Technical：'), t('Python, SQL, Excel (advanced), PowerPoint, Tableau')),
    li(b('Interests（最常被忽视）：'), t('要具体！"Playing competitive chess（国家级别说清楚）"比"读书"有力。可以是：管弦乐队第一小提琴手、马拉松完赛、学生辩论队')),

    hr(),

    h2('三、实战：如何用STAR写一条Experience Bullet'),

    p(t('原版（差）："Assisted in market research for consulting project"')),
    p(t('改进版（好）："Conducted primary research across 15 B2B clients to size a £50M UK market entry opportunity, informing a recommended go-to-market strategy adopted by the client"')),

    tableBlock(
      ['STAR元素', '对应内容', '字数'],
      [
        ['Action（A）', '"Conducted primary research"', '主要内容，最长'],
        ['Scale（T）', '"across 15 B2B clients"', '增加可信度'],
        ['Result（R）', '"£50M market opportunity"', '数字量化结果'],
        ['Impact（I）', '"adopted by the client"', '实际影响力'],
      ]
    ),

    hr(),

    h2('四、LinkedIn在英国求职中的真实用法'),

    h3('为什么LinkedIn在英国是刚需'),
    li(t('英国约70%的职位通过人脉网络填充（LinkedIn数据）')),
    li(t('招聘方主动搜索候选人（Recruiter Account）是常规操作')),
    li(t('Spring Week / Insight Day 的后续跟进都通过LinkedIn')),
    li(t('互联网上的英国HR几乎100%在LinkedIn上活跃')),

    h3('Profile优化：7个关键要素'),
    li(b('头像：'), t('商务照，光线好，背景干净。不要用KTV或旅游照')),
    li(b('Banner/背景图：'), t('换成专业相关（行业图/你参加过的活动图）')),
    li(b('Headline（最重要）：'), t('不要只写"Student at LSE"——要写"MSc Finance @ LSE | Interested in M&A and Private Equity | Open to 2026 Graduate Roles"')),
    li(b('About（摘要）：'), t('3-4句话说清楚：你是谁 + 你的背景 + 你在找什么。第一行很关键，未展开时只显示前2行')),
    li(b('Experience：'), t('和CV保持一致，但可以略详细')),
    li(b('Featured：'), t('置顶你最好的项目成果、文章或公开演讲')),
    li(b('Open to Work：'), t('可以设置为"Recruiters Only"而不是公开显示，避免现任雇主看到')),

    h3('主动出击：Cold Outreach正确打法'),
    p(t('很多中国留学生不敢发消息给陌生人——但Cold Outreach在英国职场完全被接受，只要做法对。')),

    li(b('第一步：'), t('找目标公司的应届生/毕业2-3年的校友（同校更好）')),
    li(b('Connection Request消息模板（字数≤200字）：')),
    p(t('"Hi [Name], I\'m a first-year MSc Finance student at LSE and am really interested in a career in [industry]. I noticed you work at [Company] after graduating from [University] — would love to hear about your experience there. Would you be open to a 20-minute chat sometime? Totally understand if you\'re busy!"')),
    li(b('绝对不要：'), t('一开口就问"Can you refer me?"，或者发超长邮件')),
    li(b('跟进：'), t('Coffee chat之后发感谢消息，并在申请时说"I spoke with [Name]"——这会在面试中被提到')),

    h3('申请季如何用LinkedIn找信息'),
    li(t('搜索"[Company] [Role] Graduate"筛选毕业1-3年的人，看他们的Career Path')),
    li(t('关注目标公司的LinkedIn主页，招聘信息会在这里首发')),
    li(t('加入群组：UK Graduate Jobs, The Student Room Jobs等')),
    li(t('查看"People Also Viewed"：找到类似背景成功入职的人，学习他们的Profile')),

    hr(),

    h2('五、Cover Letter：英国版 vs 中国版'),

    tableBlock(
      ['元素', '说明', '常见错误'],
      [
        ['Why this company', '具体说你对该公司的了解，不要泛泛说"leading firm"', '所有信封信一模一样，公司名词变了其他都没变'],
        ['Why this role', '说你的哪个具体经历让你对这个职能感兴趣', '写的是职位描述的重复'],
        ['Why you', '1-2个具体经历证明你有核心能力', '没有例子，全是"I am passionate about..."'],
        ['Length', '严格不超过1页，300-400字为佳', '超过1页，或者写了不到200字'],
        ['Tone', '自信、直接，但不傲慢', '过于谦虚（"Although I may not have..."）'],
      ]
    ),

    h3('Cover Letter开头怎么写（正确 vs 错误）'),
    p(b('❌ 错误：'), t('"I am writing to apply for the position of Analyst at Deloitte UK. I am a highly motivated and enthusiastic student..."')),
    p(b('✅ 正确：'), t('"Deloitte\'s work on the restructuring of [recent high-profile case] is exactly the type of transformation advisory I want to build my career around. After completing a data analytics internship at [Company] where I led a process improvement that reduced costs by £50k, I\'m eager to bring the same commercial rigour to Deloitte\'s Consulting practice."')),

    hr(),

    quote(b('核心提醒：'), t('英国CV和LinkedIn不是两个独立的东西，是一个系统。CV用于申请，LinkedIn用于被发现和建立人脉。两者信息一致，风格互补。在英国，一个整洁的1页CV + 一个优化的LinkedIn主页，胜过一份中国式10页简历。')),
  ],
};
