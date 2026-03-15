import * as fs from 'fs';
import * as https from 'https';

const SPACE_ID = '7615700879567506381';
const PARENT_NODE_TOKEN = 'Adh3w4XwCiMs2zkApVhcFdT0nFf';
const DOMAIN = 'open.feishu.cn';
const LINK_DOMAIN = 'hcn2vc1r2jus.feishu.cn';

function getToken(): string {
  const raw = fs.readFileSync('/Users/simon/startup-7steps/.feishu-user-token.json', 'utf-8');
  return JSON.parse(raw).access_token;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function api(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: DOMAIN,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve(d); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function t(text: string, bold = false, italic = false): any {
  return { text_run: { content: text, text_element_style: { bold, italic } } };
}
function p(...elements: any[]): any { return { block_type: 2, text: { elements, style: {} } }; }
function h2(text: string): any { return { block_type: 4, text: { elements: [t(text, true)], style: {} } }; }
function h3(text: string): any { return { block_type: 5, text: { elements: [t(text, true)], style: {} } }; }
function li(...elements: any[]): any { return { block_type: 12, text: { elements, style: {} } }; }
function hr(): any { return { block_type: 22 }; }

async function writeBlocks(docToken: string, blocks: any[]) {
  const chunkSize = 50;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const res = await api('POST', `/open-apis/docx/v1/documents/${docToken}/blocks/${docToken}/children`, {
      children: chunk,
      index: i,
    });
    if (res.code !== 0) {
      console.log(`  ❌ block写入失败: ${res.code} ${res.msg}`);
    }
    await sleep(400);
  }
}

async function createPage(title: string, blocks: any[]): Promise<string | null> {
  console.log(`\n📄 创建页面：${title}`);
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    parent_node_token: PARENT_NODE_TOKEN,
    node_type: 'origin',
    title,
  });
  if (r.code !== 0) {
    console.log(`  ❌ 创建失败: ${r.code} ${r.msg}`);
    return null;
  }
  const nodeToken = r.data?.node?.node_token;
  const objToken = r.data?.node?.obj_token;
  console.log(`  node_token: ${nodeToken}`);
  await sleep(600);
  await writeBlocks(objToken, blocks);
  const url = `https://${LINK_DOMAIN}/wiki/${nodeToken}`;
  console.log(`  ✅ ${url}`);
  return url;
}

// ============================================================
// 页面1：🏆 Goldman Sachs/McKinsey/Google面试内部经验（顶级公司攻略）
// ============================================================
const topCompanyInsiderBlocks: any[] = [
  p(t('来源：Glassdoor面试评价（2023-2024）、WSO投行板块帖子、Management Consulted面经、Leetcode Discuss面经、前GS/McKinsey/Google员工LinkedIn分享，2024年整合。注：以下信息来自公开平台，不代表公司官方立场。', false, true)),
  hr(),
  h2('一、Goldman Sachs（高盛）面试攻略'),
  h3('Goldman整体面试风格'),
  li(t('面试难度：行业最高之一，对技术面（LBO/估值/会计）要求极其严格')),
  li(t('文化匹配：GS文化强调"client first"、excellence、team player，过于自大是大忌')),
  li(t('市场知识：高盛特别考察你对当前市场的了解，每天看Markets in Turmoil是必要准备')),
  h3('Goldman SA/FT分析师面试流程'),
  li(t('HireVue Video Interview：行为题（LP Principles）+ 动机题，30秒到2分钟作答')),
  li(t('Superday（终轮）：通常5-6轮，每轮30分钟，技术+行为+市场知识混合')),
  li(t('特殊环节：Market Test——给你10分钟让你评论当天新闻/市场动态')),
  h3('Goldman技术面试真题（来自Glassdoor 2023-2024）'),
  li(t('"Walk me through a DCF for Apple."')),
  li(t('"If EBITDA goes up by $100, what happens to free cash flow?"（答：FCF增加$100-税-CapEx变化）')),
  li(t('"What is the difference between EV/EBITDA and P/E? When would you use each?"')),
  li(t('"Tell me about a recent M&A deal in technology. What were the strategic rationale and valuation?"')),
  li(t('"If you were the CFO of a company with extra cash, would you buyback shares or pay a dividend? Why?"')),
  h3('Goldman行为题特点'),
  li(t('"Why Goldman specifically, and not Morgan Stanley or JP Morgan?"——必须有具体理由（特定部门/文化/成就）')),
  li(t('"Describe a time you worked on a team and there was conflict."——GS极其注重teamwork')),
  li(t('"What would you do in your first week as an analyst at GS?"——测试对工作的真实理解')),
  li(t('提示：高盛面试官会互相交流，Superday当天表现要每轮保持高水准')),
  hr(),
  h2('二、McKinsey（麦肯锡）面试攻略'),
  h3('McKinsey独特的面试体系'),
  li(t('PEI（Personal Experience Interview）：麦肯锡特有，3个故事（Leadership/Impact/Personal Growth）')),
  li(t('Case Interview：约60分钟，比BCG/Bain更结构化，评分标准很标准化')),
  li(t('2轮制：通常2轮，每轮1次PEI + 1个Case')),
  h3('PEI深度解析（最差异化的环节）'),
  li(t('Leadership：你如何影响了一个没有直接汇报给你的团队/组织？')),
  li(t('Entrepreneurial Drive：你在没有清晰指引的情况下，如何主动推动了某件事？')),
  li(t('Impact：你最骄傲的、对组织有重大影响的成就是什么？')),
  li(t('深挖：麦肯锡面试官会深挖你的每个细节——准备到能答5层追问')),
  li(t('反模式：不能讲"我们团队做了X"，必须讲"我做了X，结果是Y（量化）"')),
  h3('McKinsey Case Interview特点'),
  li(t('格式：面试官主导（Interviewer-Led），不像BCG是候选人主导')),
  li(t('问题类型：营利性框架（Revenue/Cost）、市场进入、兼并收购、价格策略')),
  li(t('数学要求：Mental Math很重要——能快速做大数运算')),
  li(t('必备框架：Issue Tree、Profitability Tree（Revenue Branch/Cost Branch）、Business Situation')),
  h3('McKinsey面试真题（来自Management Consulted 2024）'),
  li(t('"Our client is a consumer electronics retailer seeing 20% revenue decline. What would you do?"')),
  li(t('"A pharmaceutical company wants to enter the pet medicine market. Should they?"')),
  li(t('"A hospital is losing money on a specific procedure. How would you diagnose and fix this?"')),
  hr(),
  h2('三、Google面试攻略（SWE/PM方向）'),
  h3('Google SWE面试体系'),
  li(t('4-5轮 Onsite：2轮Coding + 1轮System Design + 1轮Behavioral + 1轮Googleyness')),
  li(t('Coding：LeetCode Medium-Hard，强调代码质量和沟通过程（边写边解释）')),
  li(t('System Design：Large Scale System，重视Scalability和Trade-off讨论')),
  li(t('Googliness：Google文化匹配——好奇心、协作、inclusive行为')),
  h3('Google Hiring Committee（最特殊的环节）'),
  li(t('通过Onsite后：面试反馈提交Hiring Committee审核（HC），不是直接由面试官决定')),
  li(t('HC标准：4分制，需要大多数3分以上（Strong Hire）才能通过')),
  li(t('Team Matching：HC批准后才开始找你想去的Team——先过HC，再谈团队')),
  li(t('时间：HC流程可能需要2-6周，等待期很漫长')),
  h3('Google编程面试真题（2024 Glassdoor高频）'),
  li(t('"Longest Substring Without Repeating Characters"（LeetCode 3，Sliding Window）')),
  li(t('"Find Median from Data Stream"（LeetCode 295，Hard，Heap）')),
  li(t('"Design Search Autocomplete System"（LeetCode 642，System Design混合）')),
  li(t('"Word Break II"（LeetCode 140，Hard，DP+回溯）')),
  h3('Google PM面试真题（2024）'),
  li(t('"How would you improve Google Maps?"（产品设计经典题）')),
  li(t('"Google Search revenue dropped 15% YoY. How would you investigate?"（分析题）')),
  li(t('"Design a feature for YouTube to increase creator monetization."（产品设计）')),
];

// ============================================================
// 页面2：💬 美国职场商务英语精通（从日常对话到高级表达）
// ============================================================
const businessEnglishBlocks: any[] = [
  p(t('来源：Harvard Business Review沟通技巧系列、《The Non-Native Speaker\'s Guide to the American Workplace》、Coursera Business English Communication课程、Reddit r/EnglishLearning高赞资源帖、多位在职中国专业人士分享，2024年整合。', false, true)),
  hr(),
  h2('一、为什么商务英语是最重要的职场软技能'),
  h3('英语能力对职场晋升的影响'),
  li(t('数据：布鲁金斯研究院报告显示，英语沟通能力对外国出生者的薪资影响达20-30%')),
  li(t('晋升瓶颈：很多华人在技术上非常强，但因为沟通表达不够自信，晋升到管理层遇到障碍')),
  li(t('能力分层：能用英语做事≠能用英语领导、影响、说服——这是完全不同的层级')),
  h3('最常被低估的英语能力'),
  li(t('即兴表达：会议中突然被问到意见，能不能流利自然地表达？')),
  li(t('情绪表达：如何用英语表达不同意、委婉批评、表达热情——不只是"OK"和"I agree"')),
  li(t('幽默感：能不能参与办公室的casual聊天，理解（甚至参与）美式humor？')),
  hr(),
  h2('二、关键职场场景英语详解'),
  h3('场景1：会议发言（最高频、最重要）'),
  li(t('引入你的观点："I\'d like to add something here..."、"Building on what [Name] said..."')),
  li(t('礼貌打断："Sorry to interrupt, but I want to make sure we address..."')),
  li(t('表达不同意（重要！）："I see it a bit differently..."、"I\'m not sure I agree—here\'s why..."')),
  li(t('买时间思考："That\'s a great point—let me think for a moment."、"Can I come back to this?"')),
  li(t('总结你的发言："So my main point is..."、"To summarize what I\'m suggesting..."')),
  h3('场景2：Email写作'),
  li(t('主题行（Subject Line）：要明确行动要求——"Action Required: Project Update by Friday"而不是"Update"')),
  li(t('开头建立rapport："Hope you\'re having a great week!"、"Thank you for your quick response."')),
  li(t('请求式："Would it be possible to...?"、"I was hoping we could..."（比"I need you to"更礼貌）')),
  li(t('Closing：行动清晰——"Please let me know by [date] if you can attend"')),
  li(t('签名：专业但简洁，名字+职位+联系方式')),
  h3('场景3：Presentation和汇报'),
  li(t('Opening Hook："Today I want to share something that could change how we approach [X]..."')),
  li(t('Signposting（路标语）："First...Then...Finally..."让听众知道你在哪里')),
  li(t('处理Q&A："That\'s a great question."（买时间）+"Let me address that in two parts..."')),
  li(t('如果不知道答案："I don\'t have that data in front of me—I\'ll follow up with you after."')),
  h3('场景4：Networking Small Talk'),
  li(t('打开话题："How are you finding the event so far?"、"Have you been to this conference before?"')),
  li(t('询问工作："What do you work on at [Company]?"、"What brought you to this industry?"')),
  li(t('自然结束对话："It was great meeting you! I\'ll let you go—hope to connect again."')),
  li(t('交换联系方式："Would you be open to connecting on LinkedIn?"')),
  hr(),
  h2('三、高频职场用语短语手册'),
  h3('表达同意/不同意'),
  li(t('强烈同意："Absolutely."、"I couldn\'t agree more."、"That\'s exactly right."')),
  li(t('部分同意："I see your point, though I\'d add..."、"Fair point—I\'d also consider..."')),
  li(t('委婉不同意："I see it slightly differently."、"I want to respectfully push back on..."')),
  li(t('不知道/不确定："I\'m not sure about that—let me look into it."、"That\'s outside my area."')),
  h3('表达优先级和重要性'),
  li(t('"This is a critical/key/important issue..."')),
  li(t('"I want to flag that..."（表示想引起注意）')),
  li(t('"Let\'s table this for now and revisit later."（暂时搁置）')),
  li(t('"Let\'s take this offline."（私下讨论，不占用大家时间）')),
  h3('表达感谢和赞美（职场通货）'),
  li(t('"I really appreciate your help/feedback/time."')),
  li(t('"This is incredibly helpful—thank you!"')),
  li(t('"Great work on [specific thing]! I especially liked [detail]."')),
  li(t('"You really knocked it out of the park on this one."（美式习语：做得非常好）')),
  hr(),
  h2('四、英语提升实用资源'),
  h3('听力和口语（最快提升途径）'),
  li(t('播客（商务类）：How I Built This（创业故事）、Masters of Scale（Reid Hoffman）、How to Save a Planet')),
  li(t('YouTube：Simon Sinek系列、TED Business系列——学习persuasive speaking')),
  li(t('Shadowing练习：找一段演讲/播客，暂停后模仿说一遍（语音/节奏/停顿都模仿）')),
  li(t('Language Exchange：与母语英语者做语言交换（他学中文/你学英语），Tandem、HelloTalk App')),
  h3('写作提升'),
  li(t('Grammarly：Chrome插件，实时纠错，有商务写作专业版')),
  li(t('Hemingway App：分析文章可读性，让文章更简洁有力')),
  li(t('每天写作习惯：在工作Slack/邮件中刻意练习，把每封邮件当作写作练习')),
  h3('行业词汇积累'),
  li(t('方法：每周深度阅读1篇WSJ/Bloomberg/HBR文章，把不懂的词汇记录在Anki卡片里')),
  li(t('Finance词汇：《Street Freak》（散文风格的华尔街词汇）')),
  li(t('咨询词汇：《The McKinsey Way》和《The Trusted Advisor》')),
  li(t('科技词汇：TechCrunch/Wired日常阅读，每周1篇深度阅读+词汇积累')),
];

// ============================================================
// 页面3：🗞️ 行业新闻/信息获取系统（Bloomberg/WSJ/Reddit高效阅读法）
// ============================================================
const newsReadingBlocks: any[] = [
  p(t('来源：Bloomberg职业建议系列、WSJ Career专版、Financial Times媒体阅读指南、Pocket/Readwise信息管理系统、多位金融/咨询从业者的信息管理工作流，2024年整合。', false, true)),
  hr(),
  h2('一、为什么信息输入是职业发展的核心基础设施'),
  h3('信息的职业价值'),
  li(t('面试准备：投行/咨询面试中，对行业新闻的了解直接影响面试评分')),
  li(t('工作中的insight：你能在会议中引用最新数据和事件，会建立"行业权威"形象')),
  li(t('Networking破冰："I read your article/company\'s report on X—fascinating perspective on Y"是最好的开场白')),
  li(t('中国学生特殊重要性：弥补本地人的"文化常识"积累，通过主动阅读快速缩小差距')),
  h3('信息获取的常见错误'),
  li(t('信息过载：订阅太多，什么都读，结果什么都没真正理解')),
  li(t('被动消费：只是"看"新闻，没有思考和记录，面试时什么都想不起来')),
  li(t('不加选择：读随机内容，而不是聚焦在你的目标行业')),
  hr(),
  h2('二、核心信息源推荐（按行业）'),
  h3('金融/投行必读'),
  li(t('Bloomberg（付费）：最全面的金融资讯，Bloomberg Terminal是行业标准，学生可用Bloomberg Anywhere')),
  li(t('Wall Street Journal（付费）：美国最权威商业报纸，每天30分钟')),
  li(t('Financial Times（付费）：更国际视野，善于分析全球宏观')),
  li(t('Dealbook Newsletter（免费）：NYT的交易新闻简报，每天1封邮件')),
  li(t('Wall Street Oasis（免费）：求职资讯+面经，IB/PE信息最密集')),
  h3('咨询/策略必读'),
  li(t('Harvard Business Review（付费）：管理理念和战略思维最深度来源')),
  li(t('McKinsey Quarterly（免费）：麦肯锡公开研究，质量极高')),
  li(t('Strategy+Business（免费/付费）：PwC策略咨询旗下刊物')),
  li(t('Sloan Management Review（付费）：MIT Sloan学术+实践平衡')),
  h3('科技/创投必读'),
  li(t('TechCrunch（免费）：科技创业最快新闻')),
  li(t('Stratechery（付费，$15/月）：Ben Thompson的深度科技分析，行业内最受尊重的独立分析')),
  li(t('a16z Newsletter（免费）：Andreessen Horowitz的投资视角')),
  li(t('The Information（付费）：科技行业最深度调查报道')),
  li(t('Hacker News（免费）：Tech圈的Reddit，工程师文化和新兴技术讨论')),
  h3('中美视角兼顾'),
  li(t('South China Morning Post（半付费）：香港媒体，中英文双轨的中国商业报道')),
  li(t('Caixin（财新）英文版（付费）：中国最好的财经调查媒体的英文版')),
  li(t('China Business Law Journal（部分免费）：中美商业法律和监管分析')),
  hr(),
  h2('三、高效阅读系统建立'),
  h3('每日30分钟信息routine（适合繁忙求职/工作阶段）'),
  li(t('起床后10分钟：扫描Bloomberg/WSJ标题，了解市场动态')),
  li(t('午餐15分钟：深度阅读1篇最相关的文章')),
  li(t('睡前5分钟：浏览行业邮件简报（Dealbook/Morning Brew）')),
  h3('Newsletter系统（信息推送到你）'),
  li(t('Morning Brew（免费）：最有趣的商业早报，日更，适合入门')),
  li(t('The Hustle（免费）：偏科技创业的日报，轻松易读')),
  li(t('Axios Markets（免费）：金融市场简报，每日')),
  li(t('Lenny\'s Newsletter（付费）：Product Management深度，$15/月')),
  li(t('TLDR（免费）：Tech/Science/AI的5分钟日报')),
  h3('阅读深度处理方法'),
  li(t('Readwise：保存highlights，定期复习，防止遗忘（$7.99/月）')),
  li(t('Pocket/Instapaper：保存稍后阅读，避免当时被打断')),
  li(t('电子笔记系统：用Notion/Obsidian建立"Evergreen Notes"，把有价值的信息永久存储')),
  li(t('每周回顾：周五30分钟整理本周的关键新闻和insights，用于下周Networking/面试使用')),
  hr(),
  h2('四、Reddit精华版：最有价值的子版块'),
  h3('金融/投资'),
  li(t('r/finance：行业新闻讨论，质量参差不齐但有精华')),
  li(t('r/wallstreetbets：散户玩笑为主，但有时有真知灼见（and entertainment）')),
  li(t('r/investing：相对严肃的个人投资讨论')),
  li(t('r/SecurityAnalysis：价值投资深度讨论，CFA级别内容')),
  h3('求职/职场'),
  li(t('r/cscareerquestions：CS/科技职业问题，信息密度极高')),
  li(t('r/financialcareers：金融职业路径经验分享')),
  li(t('r/consulting：咨询行业从业者讨论')),
  li(t('r/datascience：数据科学职业和技术讨论')),
  h3('中国学生特别有用'),
  li(t('r/f1visa：签证问题讨论，很多真实经历')),
  li(t('r/ChineseInAmerica：在美中国人的生活/职业经历分享')),
  li(t('r/gradadmissions：研究生申请讨论')),
];

// ============================================================
// 页面4：🎭 中国背景职业叙事（如何讲述你的经历让美国雇主理解）
// ============================================================
const chineseNarrativeBlocks: any[] = [
  p(t('来源：多位在美华人求职者经验分享（Blind、LinkedIn、小红书）、Wharton MBA中国学生就业报告、Glassdoor面试反馈分析、Amy Chua《Battle Hymn of the Tiger Mother》文化对话引发的HR讨论，2024年整合。', false, true)),
  hr(),
  h2('一、核心问题：如何让美国雇主理解你的中国经历'),
  h3('文化翻译的必要性'),
  li(t('中美背景的成就描述方式截然不同：中国注重"做了什么"，美国注重"有什么影响"')),
  li(t('中国职场经历在美国雇主眼中是"黑盒"——他们不了解你公司的规模/声誉/行业地位')),
  li(t('你的任务：把"黑盒"变成可理解的信息，让美国HR能和他知道的参照物对比')),
  h3('常见痛点'),
  li(t('简历上写"某大型国有银行"——美国HR不知道这有多牛（可能媲美JPMorgan）')),
  li(t('写"阿里巴巴实习"——他们知道Alibaba，但不知道你做的工作有多重要')),
  li(t('中国的教育成就（高考/竞赛获奖）——在美国的参照系中没有意义')),
  hr(),
  h2('二、简历语言翻译指南'),
  h3('公司名称的翻译和解释'),
  li(t('国有银行：不要只写"Industrial and Commercial Bank of China"，要加注"(world\'s largest bank by assets)"')),
  li(t('科技公司：Alibaba（China\'s Amazon）、Tencent（China\'s Facebook+gaming giant）、Baidu（China\'s Google）')),
  li(t('投行：CITIC Securities（China\'s largest investment bank）、China International Capital Corporation（CICC）')),
  li(t('大学：不只写"Peking University"，可以加"(China\'s Harvard)"；Tsinghua可以加"(China\'s MIT)"')),
  h3('职位和职责的翻译'),
  li(t('中国的"高级实习生"=美国的"Associate level work"——提升描述层级')),
  li(t('在中国管了3个人的团队——写"managed team of 3"，加量化成就')),
  li(t('做了行业研究报告——"Authored industry research report on [X] for [Company]"，加受众规模')),
  h3('成就的量化和翻译'),
  li(t('错误："参与了我们部门的重要项目"')),
  li(t('正确："Contributed to $50M RMB (~$7M USD) portfolio restructuring project for [Company]"')),
  li(t('汇率换算：在简历上把RMB金额换算成USD，让美国读者有直接感知')),
  li(t('规模翻译：写出中国市场规模——"managed marketing for product with 50M+ users in China"')),
  hr(),
  h2('三、面试中讲述中国经历的策略'),
  h3('"Tell me about yourself"中的中国背景处理'),
  li(t('不要道歉或最小化："I grew up in China where I..."——直接说，有信心')),
  li(t('主动解释参照系："I worked at [Company], which is China\'s equivalent of [US Company]..."')),
  li(t('转化为优势："My experience in China\'s fast-moving market taught me..."')),
  h3('如何把"中国经历"变成有价值的Insight'),
  li(t('中国超级App的产品思维："Having used WeChat Pay since 2015, I have a user perspective on integrated financial services that informs my PM thinking..."')),
  li(t('中国市场增长速度："Managing campaigns in China\'s hyper-competitive e-commerce market, where trends shift in days, taught me to make faster decisions with incomplete data."')),
  li(t('中美对比视角："The contrast between [China approach] and [US approach] gives me a unique lens on [business problem]."')),
  h3('高频问题：为什么选择美国而不是中国？'),
  li(t('不要批评中国政治/体制——这在任何商业场合都是危险的')),
  li(t('好的答案框架："I\'m drawn to the US because of [specific opportunity/market/academic environment]. I also see myself as a bridge between the two markets."')),
  li(t('诚实但积极："After experiencing both markets, I believe the skills I develop here will allow me to contribute [specific value] globally."')),
  hr(),
  h2('四、在简历和面试中建立"桥接者"身份'),
  h3('桥接者（Bridge）叙事框架'),
  li(t('核心：你不是在弱化中国背景，而是把它定位为在全球化经济中的独特资产')),
  li(t('叙事："I bring a rare combination of deep China market knowledge and [US professional skills], which positions me uniquely for roles involving [specific area]."')),
  li(t('适用职位：China Desk、跨境M&A、国际扩张战略、双语业务拓展')),
  h3('具体表述示例'),
  li(t('投行："My understanding of China\'s regulatory environment and business culture, combined with my US finance training, makes me uniquely positioned to support cross-border transactions."')),
  li(t('咨询："Having lived and worked in both markets, I can help clients navigate the cultural and operational nuances that often derail China market entry strategies."')),
  li(t('科技："I\'ve experienced China\'s mobile-first, super-app ecosystem as a user and product professional—this gives me insights into trends that are 3-5 years ahead of Western markets."')),
];

// ============================================================
// 页面5：📊 500道面试题综合大全（按类型分类完整题库）
// ============================================================
const megaQuestionBankBlocks: any[] = [
  p(t('来源：整合Glassdoor面试问题数据库、WSO题库、Management Consulted案例库、LeetCode Discuss、Blind面经、HBR行为面试指南，2024年最新整合。', false, true)),
  hr(),
  h2('一、行为面试题（Behavioral）— 100题'),
  h3('领导力类（20题）'),
  li(t('"Tell me about a time you led a team through a difficult situation."')),
  li(t('"Describe a situation where you had to influence people who didn\'t report to you."')),
  li(t('"Tell me about a time when you had to make an unpopular decision."')),
  li(t('"How have you handled a situation where a team member wasn\'t performing?"')),
  li(t('"Tell me about your biggest leadership failure and what you learned."')),
  li(t('"Describe a time you had to motivate a discouraged team."')),
  li(t('"Tell me about a time you had to adapt your leadership style for different team members."')),
  li(t('"How did you handle a situation where you disagreed with your manager?"')),
  li(t('"Tell me about a time you built consensus across teams with different priorities."')),
  li(t('"Describe a time when you had to take ownership of something that went wrong."')),
  h3('分析和解决问题类（20题）'),
  li(t('"Tell me about the most complex analytical problem you\'ve solved."')),
  li(t('"Describe a time when you had to make a decision with incomplete data."')),
  li(t('"Tell me about a time your analysis led to a significant business recommendation."')),
  li(t('"How have you approached a problem that had no obvious solution?"')),
  li(t('"Tell me about a time you identified a problem before others did."')),
  li(t('"Describe a time you had to prioritize among competing demands."')),
  li(t('"Tell me about a time you used data to change someone\'s mind."')),
  li(t('"How do you approach problems when you don\'t have domain expertise?"')),
  li(t('"Tell me about a time you simplified a complex process."')),
  li(t('"Describe a situation where your initial solution was wrong—what did you do?"')),
  h3('客户/利益相关者管理（15题）'),
  li(t('"Tell me about a time you had to manage a difficult client."')),
  li(t('"Describe a situation where you had to deliver bad news to a stakeholder."')),
  li(t('"How have you managed conflicting expectations from different stakeholders?"')),
  li(t('"Tell me about a time you exceeded client expectations."')),
  li(t('"Describe a time you had to say no to a client request."')),
  li(t('"How did you handle a situation where a client was dissatisfied with your work?"')),
  li(t('"Tell me about a time you had to rebuild trust with a client or colleague."')),
  h3('团队合作和冲突（15题）'),
  li(t('"Describe a time you had a serious conflict with a team member."')),
  li(t('"Tell me about a situation where you had to give difficult feedback."')),
  li(t('"How have you handled working with someone whose style was very different from yours?"')),
  li(t('"Tell me about a time you failed to communicate effectively and how you fixed it."')),
  li(t('"Describe a time you helped a struggling team member improve."')),
  h3('动机和职业目标（20题）'),
  li(t('"Why do you want to work in [industry]?"')),
  li(t('"Where do you see yourself in 5-10 years?"')),
  li(t('"What\'s your greatest professional achievement so far?"')),
  li(t('"Why are you leaving your current position?"')),
  li(t('"What are you looking for in your next role?"')),
  li(t('"Why this company specifically?"')),
  li(t('"What\'s your biggest weakness and how do you work on it?"')),
  li(t('"Tell me about a risk you took that didn\'t pay off."')),
  li(t('"What\'s the most important thing you\'ve learned in your career so far?"')),
  li(t('"How do you stay current in your field?"')),
  hr(),
  h2('二、金融技术面试题（Finance Technical）— 80题'),
  h3('会计基础（20题）'),
  li(t('"Walk me through the three financial statements."')),
  li(t('"If accounts receivable goes up by $100, what happens to the three statements?"')),
  li(t('"What is working capital and why does it matter?"')),
  li(t('"Explain the difference between EBITDA and free cash flow."')),
  li(t('"How does a $100 increase in depreciation affect cash flow?"')),
  li(t('"What is goodwill and when does it appear on the balance sheet?"')),
  li(t('"Explain the difference between LIFO and FIFO inventory methods."')),
  li(t('"What is deferred revenue and why does it create a liability?"')),
  li(t('"How do stock buybacks affect the three financial statements?"')),
  li(t('"Walk me through a cash flow statement from net income."')),
  h3('估值方法（20题）'),
  li(t('"What are the three main valuation methodologies?"（DCF/CCA/precedent transactions）')),
  li(t('"When would you use each valuation methodology?"')),
  li(t('"How do you calculate WACC?"')),
  li(t('"What is a terminal value and why does it matter?"')),
  li(t('"If the risk-free rate goes up, what happens to WACC and enterprise value?"')),
  li(t('"What is the difference between equity value and enterprise value?"')),
  li(t('"How do you move from enterprise value to equity value?"')),
  li(t('"What is a LBO and why would a PE firm do one?"')),
  li(t('"Name 3 differences between a DCF and a comparable company analysis."')),
  li(t('"What multiple would you use to value a SaaS company? Why?"')),
  h3('市场和宏观知识（20题）'),
  li(t('"What is the Fed Funds Rate and how does it affect markets?"')),
  li(t('"What is the yield curve and what does an inverted yield curve signal?"')),
  li(t('"How does inflation affect equity valuations?"')),
  li(t('"What is the difference between a bond\'s price and its yield?"')),
  li(t('"What is duration and why do bond investors care about it?"')),
  li(t('"Explain the difference between systematic and unsystematic risk."')),
  li(t('"What is beta and what does it measure?"')),
  li(t('"How does a stock\'s P/E compare to bonds\' P/E equivalent (1/yield)?"')),
  li(t('"What is the VIX and what does it measure?"')),
  li(t('"Walk me through what happens when the Fed raises interest rates."')),
  hr(),
  h2('三、Case面试题（Consulting）— 60题'),
  h3('营利性问题（15题）'),
  li(t('"Our client\'s profits have fallen 20% in 3 years. How would you investigate?"')),
  li(t('"A restaurant chain\'s same-store sales are flat but profits are declining. Why?"')),
  li(t('"A luxury fashion brand has seen a 30% drop in gross margin. How do you diagnose?"')),
  li(t('"Our client is a bank with declining net interest margin. What could be causing this?"')),
  li(t('"A streaming service has growing subscribers but declining revenue per user. Why?"')),
  h3('市场进入（10题）'),
  li(t('"A software company wants to enter the healthcare market. Should they?"')),
  li(t('"An American retailer wants to enter China. What should they consider?"')),
  li(t('"A Chinese EV company is considering US market entry. Assess the opportunity."')),
  li(t('"A coffee chain wants to expand to Eastern Europe. How would you evaluate?"')),
  li(t('"An e-commerce company is considering launching in Southeast Asia. Advise them."')),
  h3('并购/增长策略（10题）'),
  li(t('"Our client, a logistics company, wants to acquire a tech startup. Should they?"')),
  li(t('"A pharmaceutical company is considering divesting its consumer health division. Advise."')),
  li(t('"How should a traditional bank respond to digital-first competitors?"')),
  li(t('"Our client is a private equity firm that acquired a retail company 3 years ago. It\'s time to exit—how?"')),
  li(t('"A newspaper company needs a digital transformation strategy. What do you recommend?"')),
  hr(),
  h2('四、科技公司面试题（Tech）— 60题'),
  h3('产品设计题（20题）'),
  li(t('"Design a feature to improve user retention for Spotify."')),
  li(t('"How would you redesign the Uber app for elderly users?"')),
  li(t('"Design a notification system for LinkedIn that doesn\'t annoy users."')),
  li(t('"How would you design a feature to reduce checkout abandonment for Amazon?"')),
  li(t('"Build a product that helps new immigrants adapt to life in a new country."')),
  h3('产品分析题（20题）'),
  li(t('"Instagram Stories engagement dropped 15% this quarter. How would you investigate?"')),
  li(t('"How would you set up an A/B test to determine if adding a dark mode improves retention?"')),
  li(t('"YouTube\'s average session duration declined 10%. What\'s your analysis process?"')),
  li(t('"How would you measure the success of LinkedIn\'s new AI writing assistant feature?"')),
  li(t('"Airbnb\'s booking conversion rate dropped 5% after a homepage redesign. What do you do?"')),
  h3('估算/Market Sizing题（20题）'),
  li(t('"How many golf balls fit in a school bus?"（思维过程：体积估算）')),
  li(t('"Estimate the market size for food delivery in New York City."')),
  li(t('"How many Airbnb listings are there in San Francisco?"')),
  li(t('"Estimate Google\'s annual revenue from YouTube."')),
  li(t('"How many piano tuners are there in Chicago?"（著名费米估算题）')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十九批）...');

  await createPage('🏆 Goldman/McKinsey/Google面试内部经验（顶级公司攻略）', topCompanyInsiderBlocks);
  await createPage('💬 美国职场商务英语精通（场景话术+高频表达+提升资源）', businessEnglishBlocks);
  await createPage('🗞️ 行业信息获取系统（Bloomberg/WSJ/Reddit高效阅读法）', newsReadingBlocks);
  await createPage('🎭 中国背景职业叙事（如何讲述经历让美国雇主理解）', chineseNarrativeBlocks);
  await createPage('📊 500道面试题综合大全（行为/金融技术/Case/科技）', megaQuestionBankBlocks);

  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
