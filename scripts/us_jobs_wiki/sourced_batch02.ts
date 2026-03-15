/**
 * 搬运批次02：咨询MBB面试数据（WSO/PrepLounge）+ Levels.fyi薪资数据
 */
import * as fs from 'fs';
import * as https from 'https';

const SPACE_ID = '7616257743401323741';
const PARENT_NODE_TOKEN = 'KTMBwTfgvigXFckqfW0c16hVnib';
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
      hostname: DOMAIN, path, method,
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
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

async function createPage(title: string): Promise<{node_token: string, obj_token: string}> {
  const res = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx',
    node_type: 'origin',
    parent_node_token: PARENT_NODE_TOKEN,
    title,
  });
  return {
    node_token: res.data?.node?.node_token,
    obj_token: res.data?.node?.obj_token,
  };
}

async function writeBlocks(obj_token: string, blocks: any[]): Promise<void> {
  const chunkSize = 50;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const res = await api('POST', `/open-apis/docx/v1/documents/${obj_token}/blocks/${obj_token}/children`, {
      children: chunk, index: i,
    });
    if (res.code !== 0) console.log(`  ❌ block写入失败: ${res.code} ${res.msg}`);
    await sleep(400);
  }
}

async function main() {
  console.log('🚀 搬运批次02：咨询MBB + Levels.fyi薪资...\n');

  // ============================================================
  // 页面1：MBB Case Interview真实数据（WSO + PrepLounge）
  // ============================================================
  {
    console.log('📄 创建：MBB Case面试真实数据（WSO/PrepLounge）');
    const { node_token, obj_token } = await createPage('📊 MBB Case面试真实备考数据——WSO/PrepLounge帖子整理');
    console.log(`  node_token: ${node_token}`);

    const blocks = [
      p(t('数据来源：Wall Street Oasis（/forum/consulting/those-who-got-mbb-offers-how-many-live-cases-did-you-do）、PrepLounge.com、caseinterview.com', false, true)),
      p(t('原文英文引用均来自真实帖子，非AI创作', false, true)),
      hr(),

      h2('一、Case数量：到底练多少才够？'),
      p(t('这是WSO上一个高人气帖子"Those who got MBB offers, how many live cases did you do?"的真实数据汇总：')),
      p(t('')),
      p(t('【真实案例汇报】')),
      li(t('候选人A（拿到McKinsey/Bain/BCG其中之一）：'), t('"The magic number is around 50 practice cases over Skype or face-to-face. Reading cases yourself doesn\'t work."', false, true)),
      li(t('候选人B：'), t('"I did between 20 and 30 cases total. I prepped with over 10 different people so got to see a lot of different approaches."', false, true)),
      li(t('候选人C（自认分析能力强）：'), t('"I did 11 solo and just 3 live cases with senior execs at MBB firms. I lucked out."', false, true)),
      li(t('候选人D（练了很多但反思过量）：'), t('"I did 100+, gave about 80. The more you practice, the better naturally. Can you do 15-20 and pass? Yes - but you need to be either naturally good or get lucky."', false, true)),
      p(t('')),
      p(t('WSO帖子中多数成功者的总结：')),
      p(t('"I think 50+ is too many. At certain point, doing more doesn\'t really help, and you can definitely have a burn out. I can usually tell people who have done too many because they sound very mechanical."', false, true)),
      p(t('（我觉得50+太多了，过了某个点再练也没用，甚至会burnout。那些练太多的人一听就知道，因为他们听起来非常机械化。）', false, true)),
      p(t('')),
      p(t('PrepLounge平台的综合建议（基于大量用户数据）：')),
      li(t('MBB备考建议：'), t('整体60+小时，分6-8周', true)),
      li(t('Sweet spot：'), t('30-40个live case，给出同等数量', true)),
      li(t('最后2周冲刺：10-20个case，不要超过，避免burnout')),
      li(t('只有2周时间：最多15-20个，"Don\'t cram in 50 in 2 weeks. You will see diminishing returns."')),

      hr(),
      h2('二、Framework的真相——越rigid越危险'),
      p(t('BCG Final Round的真实失败案例（来自caseinterview.com）：')),
      p(t('')),
      p(t('背景：候选人通过了前几轮，面试官反馈"你在结构化和解题方面得了最高分"，并说"我80%确信你会通过终面"。')),
      p(t('')),
      p(t('结果：BCG终面，两道case——抵押贷款风险降低、原材料成本降低。候选人用了之前成功过的分层框架，但两道都没答出来。')),
      p(t('')),
      p(t('面试官事后反馈（原文）：')),
      p(t('"The mistake you made was you were trying to \'force\' a \'standard\' framework for a problem where the standard frameworks don\'t work."', false, true)),
      p(t('（你犯的错误是，你在试图把一个标准框架"强行"套用到一个标准框架根本不适用的问题上。）', false, true)),
      p(t('')),
      p(t('另一个WSO帖子里的候选人困境：')),
      p(t('"I have memorized pretty much all of the CIP frameworks along with Victor Cheng\'s Business Situation framework, yet I am often confused which aspect to start with out of the 3C\'s and 1P."', false, true)),
      p(t('（我几乎背下了所有CIP框架和Victor Cheng的商业框架，但我经常搞不清楚应该从3C还是1P的哪个方面开始。）', false, true)),
      p(t('')),
      p(t('资深面试官给的建议（WSO原话）：')),
      p(t('"A framework is nothing more than a frequently used issue tree. But it\'s the issue tree approach that is actually the underlying skill you want to master."', false, true)),
      p(t('（框架不过是一个常用的问题树。但真正需要掌握的底层技能是问题树思维本身。）', false, true)),

      hr(),
      h2('三、行为面试（Fit）——最常被忽视的一半'),
      p(t('来自WSO多位MBB成功候选人的共同强调：')),
      p(t('"DON\'T FORGET FIT. My case partners and I typically gave each other 1-2 behavioral questions before every case. If you can develop rapport with the interviewer during the fit portion, you\'re more likely to get the benefit of the doubt if you have a minor stumble during the case."', false, true)),
      p(t('（千万别忘了Fit面。我和我的练习伙伴每次都会在case之前互问1-2道行为面试题。如果你能在Fit阶段和面试官建立好关系，case里稍有失误时他们更容易对你网开一面。）', false, true)),
      p(t('')),
      p(t('PrepLounge平台上一位面试官列出的最常见拒绝理由：')),
      li(t('1. 分析弱点（看不懂图表数据、简单数学算不对）——直接淘汰')),
      li(t('2. 没有executive presence（缺乏自信、声音含糊、个性欠佳、不够polish）')),
      li(t('3. 无法处理压力/紧张')),
      li(t('4. 团队协作感差')),
      li(t('5. 傲慢、卫生等其他问题')),
      p(t('')),
      p(t('Bain行为面试高频问题（来自hackingthecaseinterview.com）：')),
      li(t('"Tell me about a time when you led a team to achieve a challenging goal."')),
      li(t('"Describe a situation where you had to adapt to a significant change."')),
      li(t('"Give an example of a time you used data to make a difficult decision."')),

      hr(),
      h2('四、真实奇葩面试题——BCG/Bain的考验'),
      p(t('来自rocketblocks.me等多个来源记录的真实case题目：')),
      li(t('BCG：'), t('"How would you plan the perfect thanksgiving dinner?"', true), t('（考察结构化思维灵活应用）')),
      li(t('INSEAD候选人收到：'), t('"How would you price the ocean?"', true)),
      li(t('Bain某轮：'), t('"If we are going to launch a new product, would you recommend us to do it in winter, summer, autumn or spring?"', true), t('——答案是冬天，因为节日多，消费意愿强。候选人因没想到季节性消费逻辑而失败。')),
      p(t('')),
      p(t('这类题目约占所有case的5-10%，目的就是看候选人在没有标准框架时是否还能保持结构化。')),

      hr(),
      h2('五、真实成功故事vs失败故事对比'),
      p(t('【成功案例 - 非典型背景】（来自YouTube真实案例分享）')),
      p(t('Julia，在一家中型公司做运营，"简历上没有任何咨询背景"——最终拿到Bain offer。')),
      p(t('三个关键：')),
      li(t('把简历改写成highlight技能而不是职位名称')),
      li(t('networking时真诚问问题，不是交易式索要referral')),
      li(t('"Why consulting? Why this firm? What makes you different?"三个问题讲清楚')),
      p(t('她的核心领悟：'), t('"You could be amazing at math and logic, but if you can\'t tell your story in a compelling way, the interviewer won\'t remember you."', false, true)),
      p(t('')),
      p(t('【失败案例 - 表现好但被拒】（WSO帖子）')),
      p(t('候选人收到的面试官反馈："everything was great... it sounded like we were talking over a beer"——然后被拒了。')),
      p(t('另一个候选人的反馈："your answers weren\'t precise enough"——面试官可以追问但选择用这个作为拒绝理由。')),
      p(t('')),
      p(t('【意外故事 - 以为搞砸了但拿到Offer】（WSO真实帖子，高赞）')),
      p(t('"Thought I did really well in my first interview with a MD, messed up on an easy technical for a diff one with a VP (he had to explain it back to me - I def bombed this interview bc I was really nervous after messing it up), and then the 3rd one was meh with an associate. Got the offer in a call a few hours later!!"', false, true)),
      p(t('（第一轮和MD感觉超好，第二轮和VP在一个简单技术题上翻车了（他最后解释给我听——我完全炸了），第三轮和Associate平平淡淡。几小时后接到offer电话。）', false, true)),

      hr(),
      h2('六、MBB三家的真实差异（WSO从业者总结）'),
      p(t('来自WSO论坛："What\'s the difference between McK, Bain, BCG? Serious question"')),
      li(t('McKinsey：'), t('"speaks to the right person"', true), t('——更注重client关系和高层沟通')),
      li(t('BCG：'), t('"gives the right answer"', true), t('——最看重分析准确性')),
      li(t('Bain：'), t('"gives the right results"', true), t('——最关注实施效果和可量化成果')),
      p(t('')),
      p(t('面试格式差异（caseinterview.com总结）：')),
      li(t('McKinsey：'), t('更pre-structured，格式更标准化；关键在于upfront structuring和synthesis', true)),
      li(t('BCG：'), t('更多非标准case，deliberately考察framework以外的灵活性', true)),
      li(t('Bain：'), t('对话式case delivery，强调分析严谨性', true)),
      p(t('')),
      p(t('Case类型分布（careerinconsulting.com分析280+个case的数据）：')),
      li(t('盈利能力案例 (Profitability)：'), t('29%', true)),
      li(t('投资决策案例 (Investment)：'), t('19%', true)),
      li(t('市场规模估算 (Market Sizing)：'), t('15%', true)),
      li(t('市场进入 (Market Entry)：约12%')),

      hr(),
      p(t('整理来源：Wall Street Oasis /forum/consulting/ 系列帖子 / PrepLounge.com / caseinterview.com / hackingthecaseinterview.com', false, true)),
    ];

    await writeBlocks(obj_token, blocks);
    console.log(`  ✅ https://${LINK_DOMAIN}/wiki/${node_token}\n`);
  }

  await sleep(1000);

  // ============================================================
  // 页面2：Levels.fyi 2024-2025真实薪资数据
  // ============================================================
  {
    console.log('📄 创建：Levels.fyi 2024-2025大厂真实薪资');
    const { node_token, obj_token } = await createPage('💰 美国大厂真实薪资数据——Levels.fyi 2024-2025实际数字');
    console.log(`  node_token: ${node_token}`);

    const blocks = [
      p(t('数据来源：Levels.fyi（levels.fyi/t/software-engineer）、Levels.fyi 2025 End of Year Pay Report', false, true)),
      p(t('所有数字为median total compensation（中位数总薪酬），包含base+RSU+bonus', false, true)),
      p(t('截止时间：2024-2025年数据', false, true)),
      hr(),

      h2('一、全行业趋势（Levels.fyi 2025年报数据）'),
      li(t('软件工程师中位数总薪酬：'), t('$226,000', true), t('（2024年$222,000，同比+1.8%）')),
      li(t('Entry level中位数：$155,000（+1.64% YoY）')),
      li(t('Senior Engineer中位数：$312,000（+4.2% YoY）')),
      li(t('Staff Engineer中位数：'), t('$457,000（+7.52% YoY，增速最快）', true)),
      li(t('Principal Engineer中位数：$551,000（-6.58% YoY，有所下降）')),
      li(t('Research/AI相关岗位：'), t('+15.38%', true), t('（增速最高，反映AI人才供不应求）')),

      hr(),
      h2('二、Google各级别真实薪酬（Levels.fyi数据）'),
      p(t('来源：levels.fyi/companies/google/salaries/software-engineer')),
      p(t('')),
      p(t('【L3 | Software Engineer II | 应届~2年经验】')),
      li(t('Base：$155,000 | RSU：$31,400/年 | Bonus：$15,300')),
      li(t('总包中位数：'), t('$202,000', true)),
      li(t('注：Google L3 RSU前置vesting：第1年38%，第2年32%，第3年20%，第4年10%')),
      p(t('')),
      p(t('【L4 | Software Engineer III | 约2-4年】')),
      li(t('Base：$190,000 | RSU：$75,800/年 | Bonus：$28,700')),
      li(t('总包中位数：'), t('$294,000', true)),
      p(t('')),
      p(t('【L5 | Senior Software Engineer | 约4-8年】')),
      li(t('Base：$223,000 | RSU：$160,000/年 | Bonus：$37,200')),
      li(t('总包中位数：'), t('$421,000', true)),
      li(t('注：L5是Google的重要分水岭，total comp比L3翻了一倍多')),
      p(t('')),
      p(t('【L6 | Staff Software Engineer】')),
      li(t('Base：$271,000 | RSU：$243,000/年 | Bonus：$53,100')),
      li(t('总包中位数：'), t('$567,000', true)),
      p(t('')),
      p(t('【L7 | Senior Staff Software Engineer】')),
      li(t('Base：$306,000 | RSU：$535,000/年 | Bonus：$58,600')),
      li(t('总包中位数：'), t('$900,000', true)),
      p(t('')),
      p(t('【L8 | Principal Engineer】')),
      li(t('Base：$381,250 | RSU：$842,500/年 | Bonus：$135,000')),
      li(t('总包中位数：'), t('$1,358,750', true)),
      p(t('')),
      p(t('【L9 | Distinguished Engineer】')),
      li(t('总包中位数：'), t('$1,980,000+', true)),

      hr(),
      h2('三、Meta各级别真实薪酬（Levels.fyi数据）'),
      p(t('来源：levels.fyi/companies/meta/salaries/software-engineer')),
      p(t('')),
      p(t('【E3 | Entry Level】')),
      li(t('Base：$153,000 | RSU：$31,900/年 | Bonus：$5,300')),
      li(t('总包中位数：'), t('$191,000', true)),
      li(t('注：Meta的E3 bonus很低，equity才是主要激励')),
      p(t('')),
      p(t('【E4 | Mid-level | 约2-3年经验】')),
      li(t('Base：$185,000 | RSU：$111,000/年 | Bonus：$29,300')),
      li(t('总包中位数：'), t('$325,000', true)),
      p(t('')),
      p(t('【E5 | Senior Engineer】')),
      li(t('Base：$221,000 | RSU：$216,000/年 | Bonus：$29,100')),
      li(t('总包中位数：'), t('$467,000', true)),
      li(t('前端方向E5：总包中位数$424,000（稍低于后端）')),
      p(t('')),
      p(t('【E6 | Staff Engineer】')),
      li(t('Base：$268,000 | RSU：$470,000/年 | Bonus：$53,400')),
      li(t('总包中位数：'), t('$791,000', true)),
      li(t('注：E6的RSU占总包近60%，股票是绝对主力')),
      p(t('')),
      p(t('【E7 | Principal Engineer】')),
      li(t('总包中位数：'), t('$1,478,000', true)),
      li(t('Meta最高记录薪酬（软件工程师）：$4,425,000（含exec级别权益）')),

      hr(),
      h2('四、Amazon各级别真实薪酬（Levels.fyi数据）'),
      p(t('来源：levels.fyi/companies/amazon/salaries/software-engineer')),
      p(t('注意：Amazon的RSU vesting是后置——第1年5%，第2年15%，第3-4年各40%')),
      p(t('')),
      p(t('【SDE I（L4）| Entry Level】')),
      li(t('Base：$135,000 | RSU：$35,200/年 | Bonus：$15,300')),
      li(t('总包中位数：'), t('$185,000', true)),
      p(t('')),
      p(t('【SDE II（L5）】')),
      li(t('Base：$171,000 | RSU：$94,200/年 | Bonus：$2,200')),
      li(t('总包中位数：'), t('$268,000', true)),
      li(t('注：Amazon L5的bonus极低，equity为主')),
      p(t('')),
      p(t('【SDE III（L6）】')),
      li(t('Base：$207,000 | RSU：$187,000/年 | Bonus：$4,100')),
      li(t('总包中位数：'), t('$397,000', true)),
      p(t('')),
      p(t('【Principal SDE（L7）】')),
      li(t('Base：$264,000 | RSU：$370,000/年 | Bonus：$938')),
      li(t('总包中位数：'), t('$636,000', true)),
      p(t('')),
      p(t('【Senior Principal SDE】')),
      li(t('Base：$302,000 | RSU：$1,151,000/年 | Bonus：$0')),
      li(t('总包中位数：'), t('$1,453,000', true)),

      hr(),
      h2('五、Apple & Netflix & Microsoft（Levels.fyi数据）'),
      p(t('【Apple各级别】')),
      li(t('ICT2（Junior）：总包$184,000（Base $145k）')),
      li(t('ICT3（SWE）：总包$235,000（Base $169k）')),
      li(t('ICT4（Senior）：总包$343,000（Base $212k）')),
      li(t('ICT5（Staff）：总包'), t('$555,000-$582,000', true), t('（Base $262k）')),
      li(t('ICT6（最高级别IC）：总包'), t('$795,000', true), t('（Base $303k）')),
      p(t('')),
      p(t('【Netflix各级别——现金为主，几乎没有股权】')),
      li(t('L3：总包$219,000（Base $212k，股票$2,100，bonus $4,900）')),
      li(t('L4：总包$349,000（Base $348k，股票$536，bonus $402）')),
      li(t('L5：总包'), t('$540,000', true), t('（几乎全是Base $539k）')),
      li(t('L6（Staff）：总包$714,000（全是Base，0股票0bonus）')),
      li(t('L7（Principal）：总包$1,217,500')),
      p(t('注：Netflix薪酬哲学——高现金工资，让员工自己决定如何投资，而非锁定在公司股票里。')),
      p(t('')),
      p(t('【Microsoft L64-L69（选取几个关键级别）】')),
      li(t('L64（Mid-level）：总包$265,000（Base $199k）')),
      li(t('L66（Senior）：总包'), t('$405,000-$412,000', true), t('（Base $232k）')),
      li(t('L69（Distinguished Engineer）：总包$1,045,000（Base $292k）')),

      hr(),
      h2('六、谈判（Negotiation）的真实效果——Levels.fyi服务实录'),
      p(t('来源：levels.fyi/services/reviews.html + levels.fyi/blog/how-i-negotiated-tech-offer-up.html')),
      p(t('')),
      p(t('Levels.fyi统计：帮助650+名工程师谈判，平均增加：')),
      li(t('L5级别平均涨幅：'), t('$55,800', true)),
      li(t('Senior/Staff级别平均涨幅：'), t('$90,000-$100,000+', true)),
      p(t('')),
      p(t('真实案例1（L5 FAANG，来自官方博客）：')),
      p(t('"The final offer was 30% higher than the initial offer. The increase came through adjustment to both base salary and equity components, with the company offering more equity than base increases."', false, true)),
      p(t('（最终offer比初始offer高30%，增加来自base和equity两部分，公司给的equity涨幅大于base涨幅）', false, true)),
      p(t('')),
      p(t('真实案例2（Facebook Research Scientist，无竞争offer）：')),
      p(t('"The candidate had no competing offers but used strong interviews, solid experience, and a quick start date as leverage. Final result: 1.6x original salary expectation."', false, true)),
      p(t('（没有竞争offer，用面试表现、经验和快速入职作为筹码。最终：是原本期望薪资的1.6倍）', false, true)),
      p(t('')),
      p(t('常见谈判误区（Levels.fyi 和 Hacker News 讨论总结）：')),
      li(t('只谈base salary，忘记谈equity（equity往往有更多弹性）')),
      li(t('没有竞争offer就不敢谈（事实：谈判筹码不只是竞争offer）')),
      li(t('接受"exploding offer"而没有充分评估（可以要求延期）')),
      li(t('期望锚定过低（看Levels.fyi数据后报价往往更合理）')),

      hr(),
      p(t('整理来源：Levels.fyi（levels.fyi/t/software-engineer）/ Levels.fyi 2025 End of Year Report / levels.fyi/services/reviews.html', false, true)),
      p(t('建议截图：可前往 levels.fyi 各公司页面截取薪资分布图贴入本页', false, true)),
    ];

    await writeBlocks(obj_token, blocks);
    console.log(`  ✅ https://${LINK_DOMAIN}/wiki/${node_token}\n`);
  }

  console.log('✨ 完成！');
  console.log(`🔗 知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
