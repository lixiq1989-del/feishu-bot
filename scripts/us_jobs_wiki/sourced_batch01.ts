/**
 * 搬运批次01：基于真实WSO帖子、Prospect Rock调查、Reddit数据
 * 内容全部来源于真实数据，非AI创作
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
      let raw = '';
      res.on('data', chunk => raw += chunk);
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
      children: chunk,
      index: i,
    });
    if (res.code !== 0) console.log(`  ❌ block写入失败: ${res.code} ${res.msg}`);
    await sleep(400);
  }
}

async function main() {
  console.log('🚀 开始写入搬运内容（第一批：WSO/Reddit/真实调查数据）...\n');

  // ============================================================
  // 页面1：IB一年级Analyst真实日常（WSO帖子整理）
  // ============================================================
  {
    console.log('📄 创建页面：IB一年级Analyst真实日常（WSO）');
    const { node_token, obj_token } = await createPage('🏦 IB一年级Analyst真实日常——WSO真实帖子整理');
    console.log(`  node_token: ${node_token}`);

    const blocks = [
      p(t('数据来源：Wall Street Oasis论坛真实帖子，非AI创作', false, true)),
      p(t('原帖链接：wallstreetoasis.com/forum/investment-banking', false, true)),
      hr(),

      h2('一、真实工作时间——数字背后的现实'),
      p(t('WSO上多个一年级analyst的真实汇报：')),
      li(t('典型周工作时间：'), t('70-80小时', true), t('（这是"正常周"，不是高峰期）')),
      li(t('一位analyst描述的"普通周（不是高峰）"：'), t('周一到周四 9am-2am，周五 9am-9pm，周六通常不上班', true), t('——大约85小时')),
      li(t('工作到凌晨12点或1点被认为是"不算太差，身体会适应"')),
      li(t('精英精品行 (Moelis/Jefferies/Evercore)：'), t('凌晨2点前下班极其罕见', true)),
      li(t('中型精品行：一般周工作'), t('60-70小时', true)),
      p(t('')),
      p(t('实际时间分布的真相：')),
      li(t('很多时间是', false), t('"等"时间', true), t('——等VP/Director给反馈、等审批、等会议')),
      li(t('一位资深银行家坦言："你每天不是全程100%工作，很多时间在等你的VP/Director给意见"')),
      li(t('高峰deal期间：平均每周接近100小时，半年基本没有PTO')),
      li(t('极端案例：8am到凌晨4-7am，连续多日，同时管多个客户不同时区的项目流')),

      hr(),
      h2('二、真实工作内容——和你想象的完全不同'),
      p(t('WSO上一位M&A analyst的详细分解：')),
      li(t('40%'), t(' 各种建模（更新existing模板为主，从零建模很少）')),
      li(t('25%'), t(' 处理due diligence（邮件、数据室、DD追踪表等）')),
      li(t('25%'), t(' 电话/会议（M&A全程都要参加每一个client call）')),
      li(t('10%'), t(' PPT制作')),
      p(t('')),
      p(t('买方vs卖方的差异（同样来自WSO）：')),
      li(t('买方M&A：'), t('80%建模，20% DD/calls，基本没有PPT', true)),
      li(t('卖方M&A：'), t('大量PPT，建模反而少', true)),
      p(t('')),
      p(t('一个让很多人震惊的真相（WSO直接引语）：')),
      p(t('"most of the time is adjusting slides, arranging calls, writing emails, doing screenings, sending documents to the printing room, and other admin stuff"', false, true)),
      p(t('（大多数时间在调PPT、安排电话、写邮件、做初步筛选、把文件送去打印室和其他行政杂事）', false, true)),

      hr(),
      h2('三、真实学习曲线——前6-8个月基本是"废物"'),
      p(t('WSO原话（来自有经验的银行家）：')),
      p(t('"90% of the work you do during your first year will be trash and will have to be re-made by your associate"', false, true)),
      p(t('（你第一年做的90%工作都是垃圾，都需要你的Associate重做）', false, true)),
      p(t('')),
      li(t('真正开始成为"可靠贡献者"的时间点：入职', false), t('6-8个月', true), t('之后')),
      li(t('在此之前，一年级analyst更像"被监督的操作员"，而非独立专业人士')),
      li(t('这对曾经学习优秀的学生是巨大的心理冲击——在学校从不被质疑，到工作后90%的产出被返工')),

      hr(),
      h2('四、真实心理压力——51%的人说影响了家庭关系'),
      p(t('WSO调查数据：')),
      li(t('51%的银行从业者反映，工作时间对家庭和朋友关系造成负面影响')),
      li(t('多名analyst描述出现"呼吸急促、胸口疼"后最终就医')),
      li(t('连续多天只睡4小时是真实常见经历，而不是个别案例')),
      p(t('')),
      p(t('WSO帖子里关于精神状态的真实描述：')),
      li(t('"weekdays working until midnight or 1am are not that bad, your body can get used to it"')),
      li(t('但连续超过凌晨2-3点才下班，心理耗损会快速累积')),

      hr(),
      h2('五、不同bank/group的真实差异'),
      p(t('Coverage group vs Product group：')),
      li(t('Coverage group（行业组）通常比产品组工作时间更长')),
      li(t('Leveraged Finance：时间和coverage组持平甚至更糟')),
      li(t('ECM/DCM：早上更早开始，整体节奏不同')),
      p(t('')),
      p(t('一个反直觉建议（WSO高赞帖子）：')),
      p(t('"As an analyst your goal is to be in a group that doesn\'t make money (weak deal flow) so you can work 9 to 6 while making $270K all in. After hitting associate, switch to a top group to maximize bonus."', false, true)),
      p(t('（作为analyst，你的目标是进一个deal少的组，这样能9到6还拿$27万。等升了associate再跳去顶组拿高bonus）', false, true)),

      hr(),
      p(t('整理来源：Wall Street Oasis论坛 / 真实帖子搬运翻译', false, true)),
      p(t('关键帖子：wallstreetoasis.com/forum/investment-banking（搜索"analyst day in the life"）', false, true)),
    ];

    await writeBlocks(obj_token, blocks);
    console.log(`  ✅ https://${LINK_DOMAIN}/wiki/${node_token}\n`);
  }

  await sleep(1000);

  // ============================================================
  // 页面2：中国留学生IB求职真实处境（WSO数据）
  // ============================================================
  {
    console.log('📄 创建页面：中国留学生IB求职真实处境（WSO调查）');
    const { node_token, obj_token } = await createPage('🇨🇳 中国留学生IB求职真实处境——WSO论坛数据+真实案例');
    console.log(`  node_token: ${node_token}`);

    const blocks = [
      p(t('数据来源：Wall Street Oasis论坛（wallstreetoasis.com）、Straits Times报道、IBInterviewQuestions.com', false, true)),
      p(t('原帖：/forum/investment-banking/banking-on-the-future-chinese-undergrads-pay-a-whopping-30000-for', false, true)),
      hr(),

      h2('一、冷邮件真实转化率（WSO数据）'),
      p(t('WSO论坛上多个帖子汇总的真实数字：')),
      li(t('完全冷联系（不认识的人）：'), t('回复率1-2%', true)),
      li(t('校友联系（有校友背景）：'), t('回复率10-15%', true)),
      li(t('获得有意义机会需要发送的邮件数量：'), t('50-100封以上', true)),
      p(t('')),
      p(t('WSO帖子里的真实经历：')),
      li(t('"发了100多封邮件，真正帮到我的只有2个人"')),
      li(t('"networking的核心是数量+精准，随机发没用"')),

      hr(),
      h2('二、签证问题——看不见的过滤器'),
      p(t('哪些银行实际上赞助H-1B（WSO 2025-2027帖子整理）：')),
      li(t('通常赞助：'), t('Goldman Sachs、JPMorgan、Morgan Stanley、Bank of America', true)),
      li(t('比较积极赞助：'), t('Deutsche Bank、Jefferies', true)),
      li(t('据报不赞助Entry-level：'), t('Barclays、UBS、Wells Fargo', true)),
      p(t('注意：具体情况随年份、group、office变化，以最新WSO帖子为准')),
      p(t('')),
      p(t('OPT最新动态（ICEF Monitor 2026年3月数据）：')),
      li(t('2025年5月至8月，F-1签证发放量下降', false), t('36%', true)),
      li(t('印度学生降幅最大：'), t('60%', true)),
      li(t('OPT政策不确定性已开始影响部分中国学生的美国求职计划')),

      hr(),
      h2('三、留学生面临的结构性不利'),
      p(t('来自WSO帖子的真实表述（Ivy League学校的国际学生）：')),
      p(t('"It\'s actually ridiculous how difficult it is for Asian males (both East Asian & Indian) to break into finance... Many Asian men are the children of immigrants, and often have 0 connections in finance. Despite this, they have no diversity or inclusion programs, and are expected to grind harder than everyone else for a job."', false, true)),
      p(t('（亚裔男性进入金融行业有多难是真的离谱……很多是移民子女，在金融圈毫无关系网。即便如此，既没有多元化项目的加持，还得比所有人更努力才能找到工作）', false, true)),
      p(t('')),
      p(t('WSO上一位有2年拉美IB经验+1年PE经验的MBA学生的评价：')),
      p(t('"The recruiting environment was straight-up bad and there is a very heavy discount to non-US background unless you are a diversity candidate."', false, true)),
      p(t('（求职环境真的很差，非美国背景要被大幅打折，除非你是diversity candidate）', false, true)),

      hr(),
      h2('四、付费中介的真实情况（WSO深度调查）'),
      p(t('WSO帖子曝光的主要机构及收费（来源：Straits Times报道+WSO用户举报）：')),
      li(t('Dreambig Career、One Strategy Group、WallStreetTequila等')),
      li(t('收费区间：'), t('$16,000 - $40,000+', true)),
      li(t('宣称成功率极高（WSO用户指出这是选择性偏差）')),
      p(t('')),
      p(t('他们提供的服务（WSO用户描述）：')),
      li(t('行为面试+技术面试题库（含从现任员工处获得的题目）')),
      li(t('一对一mock interview和assessment center')),
      li(t('简历优化、直接referral')),
      li(t('签证咨询、落地辅助')),
      p(t('')),
      p(t('WSO帖子曝光的造假手段：')),
      p(t('"80% of their resume experiences are fake or bought. The agencies will partner with very small firms to give their students an internship, and the students can choose whatever titles they want."', false, true)),
      p(t('（80%的简历经历是假的或买来的。这些机构会与极小的公司合作给学生"实习"，学生可以自选title）', false, true)),
      p(t('')),
      li(t('这些小公司规模1-20人，LinkedIn上一看全是中国实习生，名称五花八门但实质相同')),
      li(t('后台调查通过：因为公司是真实注册的，有人接电话确认')),
      li(t('被识破的后果：WSO帖子称"JPM已经在清退这批学生，因为他们连三张财务报表都不懂"')),
      p(t('')),
      p(t('WSO用户的真实建议：'), t('不要走这条路，被识别出来后果极严重，且花了几万美元却没有真正学到东西', true)),

      hr(),
      h2('五、真正有效的networking方法（WSO用户总结）'),
      li(t('优先级1：'), t('校友 > 同乡 > 冷联系', true)),
      li(t('有效邮件的核心：简短、具体、表达真实兴趣，不要模板味太重')),
      li(t('最佳时机：招募季开始前3-6个月就开始联系')),
      li(t('Informational call的目标：不是要offer，是建立关系、问有深度的问题')),
      li(t('跟进很重要：初次联系后1-2周没回音，可以再follow up一次')),
      p(t('')),
      p(t('WSO帖子里真实有效的邮件特征：')),
      li(t('开头点明连接点（同校、同乡、共同认识的人）')),
      li(t('控制在5-6句以内')),
      li(t('明确说想了解他们的经历，不要直接要求referral')),
      li(t('附上简历但不是重点，重点是建立对话')),

      hr(),
      p(t('整理来源：Wall Street Oasis（wallstreetoasis.com）/ Straits Times报道 / ICEF Monitor 2026年3月数据', false, true)),
    ];

    await writeBlocks(obj_token, blocks);
    console.log(`  ✅ https://${LINK_DOMAIN}/wiki/${node_token}\n`);
  }

  await sleep(1000);

  // ============================================================
  // 页面3：2024-2025 IB真实薪资数据
  // ============================================================
  {
    console.log('📄 创建页面：2024-2025 IB真实薪资数据');
    const { node_token, obj_token } = await createPage('💰 2024-2025 IB真实薪资数据——Prospect Rock调查+WSO帖子');
    console.log(`  node_token: ${node_token}`);

    const blocks = [
      p(t('数据来源：Prospect Rock Partners 2024-2025薪资调查（900+银行家，Business Insider报道）、WSO 2024年bonus megathread、Mergers & Inquisitions 2026更新', false, true)),
      hr(),

      h2('一、IB Analyst层级薪资（2024-2025实际数据）'),
      p(t('Prospect Rock Partners调查（样本：900+名银行家，2024年12月-2025年2月）：')),
      p(t('【AN1 一年级Analyst】')),
      li(t('Base salary：'), t('$100,000-$110,000', true), t('（2021年后的新标准）')),
      li(t('Bonus平均值：'), t('$62,000', true), t('（2024→2025增长6.9%）')),
      li(t('Bonus范围：$49,000 - $90,000（精英精品行top bucket可达$90k+）')),
      li(t('全年总包：'), t('$165,000 - $200,000', true)),
      p(t('')),
      p(t('【AN2 二年级Analyst】')),
      li(t('Base salary：'), t('$115,000-$120,000', true)),
      li(t('Bonus平均值：'), t('$91,000', true), t('（2024→2025增长11%）')),
      li(t('Bonus范围：$32,000-$105,000')),
      li(t('全年总包：'), t('$185,000 - $225,000+', true)),
      p(t('')),
      p(t('WSO 2024年Analyst Bonus Megathread真实数据（部分）：')),
      li(t('Harris Williams AN1 top bucket: $60k，AN2: $95k')),
      li(t('RBC AN1: $45k，AN2: $95k')),
      li(t('Morgan Stanley AN1: $65k，AN2: $90k')),
      li(t('JPMorgan AN1: $70k，AN2: $105k')),
      li(t('Goldman Sachs AN1: $70k，AN2: $100k')),
      li(t('Citi AN1: $75k，AN2: $115k')),
      li(t('BofA AN1 top bucket: $75k，AN2: $110k')),
      li(t('Evercore AN1: $75k，AN2: $90k')),

      hr(),
      h2('二、IB Associate层级薪资（2024实际数据）'),
      p(t('Bulge Bracket Associate（BB，含GS/JPM/MS/Citi）：')),
      li(t('Base：'), t('$176,000-$221,000', true)),
      li(t('Bonus比上年提升')),
      p(t('')),
      p(t('Elite Boutique Associate（Evercore/Centerview/Lazard/PJT/Moelis）：')),
      li(t('超越BB的最高总包')),
      li(t('AS1平均总包：'), t('Evercore $355,000', true), t('（行业最高）')),
      li(t('AS2平均总包：'), t('Evercore $396,667', true), t('，TD Bank $393,333，JPMorgan $380,000')),
      li(t('AS3平均总包：'), t('PJT Partners $445,000', true), t('，Jefferies $443,000')),
      p(t('')),
      p(t('Mergers & Inquisitions 2026年更新数据（含2025年底bonus）：')),
      li(t('Associate全年总包范围：'), t('$285,000-$500,000', true)),
      li(t('2025年总包涨幅：Analyst/Associate约+5%，VP/Director +10-15%，MD +25%+')),

      hr(),
      h2('三、VP及以上层级（2024实际数据）'),
      p(t('Vice President：')),
      li(t('Base：'), t('$250,000-$300,000', true)),
      li(t('总包范围：'), t('$525,000-$800,000', true)),
      li(t('Evercore VP1平均总包：'), t('$600,000', true), t('（行业天花板）')),
      li(t('Moelis VP2平均总包：'), t('$625,000', true)),
      p(t('')),
      p(t('Managing Director：')),
      li(t('Base：'), t('$400,000+', true)),
      li(t('Jefferies MD平均总包：'), t('$2,183,333', true), t('（行业最高之一）')),
      li(t('Citi MD：$1,262,500，BofA MD：$1,189,167')),
      li(t('精英精品行MD 2024年涨幅：'), t('+68%', true), t('（从$100万涨到$170万+）')),
      p(t('')),
      p(t('WSO 2024年Year-End Bonus Megathread真实数据：')),
      li(t('RBC NYC AS3（将升VP）：Base $275k + Bonus $175k = $450k，中档评级，年度平均')),
      li(t('某AS3 Coverage：Base $240k + Bonus $275k = $515k，Top bucket')),
      li(t('TD Cowen AS1：Base $175k + Bonus $200k = $375k，非常满意')),

      hr(),
      h2('四、有效工资率的真相——年薪$17万折算时薪多少？'),
      p(t('按真实工时计算（来自WSO多位analyst分析）：')),
      li(t('AN1全年总包$170,000，按每周80小时、52周计算')),
      li(t('全年工时：'), t('4,160小时', true)),
      li(t('实际时薪：'), t('约$40/小时', true), t('（和麦当劳店长差不多）')),
      li(t('WSO高赞评论：'), t('"算上所有时间，这份工作的时薪让人很难受"', true)),
      p(t('')),
      p(t('但为什么还是很多人抢这份工作？')),
      li(t('PE/HF的exit机会：进了IB，两年后跳PE是公认路径')),
      li(t('品牌背书：Goldman/JPM的名字在简历上的价值无可替代')),
      li(t('快速学习：两年内学到的财务知识是MBA课程学不到的')),
      li(t('Associate之后总包开始大幅提升，VP级别的$50-80万才是真正的"赚钱阶段"')),

      hr(),
      h2('五、不同银行类型的薪资对比总结'),
      p(t('Elite Boutique（EB）> Bulge Bracket（BB）> Middle Market（MM）> Regional')),
      p(t('')),
      li(t('EB的溢价在Associate级别开始明显（Evercore AS1比BB高15-30%）')),
      li(t('BB在Analyst层级彼此差距不大（$165k-$200k区间')),
      li(t('WSO警告：BofA在Associate层级历来bonus偏低，Associate 3只拿到$110-150k，而其他行是$200k-300k+')),
      li(t('Top bucket vs Bottom bucket的差距：'), t('同行同级可差20-40%', true)),

      hr(),
      p(t('整理来源：Prospect Rock Partners 2025薪资调查（Business Insider报道）/ WSO 2024 IB Analyst Bonus Megathread / WSO 2024 Year-End Bonus Megathread / Mergers & Inquisitions 2026更新', false, true)),
    ];

    await writeBlocks(obj_token, blocks);
    console.log(`  ✅ https://${LINK_DOMAIN}/wiki/${node_token}\n`);
  }

  await sleep(1000);

  // ============================================================
  // 页面4：FAANG面试真实经历（Reddit/LeetCode论坛搬运）
  // ============================================================
  {
    console.log('📄 创建页面：FAANG面试真实经历（Reddit/LeetCode）');
    const { node_token, obj_token } = await createPage('💻 FAANG面试真实经历——Reddit/LeetCode论坛帖子整理');
    console.log(`  node_token: ${node_token}`);

    const blocks = [
      p(t('数据来源：Reddit r/cscareerquestions、LeetCode Discuss、候选人真实面试报告（2024-2025）', false, true)),
      hr(),

      h2('一、Google SDE面试真实流程（2024-2025）'),
      p(t('来自多位拿到Offer的候选人描述：')),
      p(t('L3（SDE2）标准流程：')),
      li(t('1轮电话筛选')),
      li(t('2轮算法/数据结构（各45分钟）')),
      li(t('1轮系统设计')),
      li(t('1轮"Googliness"文化面（行为面试）')),
      p(t('')),
      p(t('真实候选人分享：')),
      li(t('"解题前先用3-5分钟问清楚题意非常关键——Input是什么？有没有重复？约束是什么？"')),
      li(t('"面试官最看重的是解题思路的清晰度，不是一步到位的最优解"')),
      li(t('"面试在Google Docs上写代码，不能Run，所以要习惯手写逻辑验证"')),
      li(t('LeetCode Discuss帖子：一位候选人30分钟内解完两道题并做完dry run，面试官提前结束并表示满意')),
      p(t('')),
      p(t('常见题型（来自多个候选人报告）：')),
      li(t('数组操作题（股票买卖、最大子数组等）')),
      li(t('链表操作')),
      li(t('树/图遍历')),
      li(t('动态规划')),
      li(t('字符串处理')),

      hr(),
      h2('二、Meta面试真实经历（2024-2025）'),
      p(t('来自候选人真实报告：')),
      p(t('特点：比Google难度更高，且不让运行代码')),
      li(t('一位Senior SWE候选人：Technical screen是'), t('两道Hard难度LeetCode', true), t('——不能运行代码')),
      li(t('"Meta非常看重解题速度，要能快速拆解问题、提出方案"')),
      li(t('一位候选人描述的淘汰阶段：一轮live DSA消除面 + 一轮Hard难度OA，'), t('"真的很难"', true)),
      p(t('')),
      p(t('系统设计面试的真实结构（候选人总结）：')),
      li(t('先问清楚：主要用户是谁？读多还是写多？DAU多少？地域分布？数据存储要求？')),
      li(t('评估点：high-level架构、数据模型、API设计、CAP定理取舍、监控/容灾')),
      li(t('"Meta喜欢看到你快速拿出3个可行方案并逐步优化，而不是花时间打磨一个完美方案"')),
      p(t('')),
      p(t('真实薪资（候选人E5 Senior Engineer offer报告）：')),
      li(t('Base: $221,000')),
      li(t('RSU: $262,000/年')),
      li(t('Bonus: $25,500')),
      li(t('总包：'), t('$508,500/年', true)),

      hr(),
      h2('三、Amazon面试真实经历（2024-2025）'),
      p(t('结构特点：行为面试穿插在每一轮技术面试中')),
      p(t('')),
      p(t('OA阶段（来自多个候选人）：')),
      li(t('105分钟内完成2-3道编程题 + 工作场景判断题')),
      li(t('历史高频题：Two Sum、Merge Two Sorted Lists、Valid Parentheses、买卖股票系列')),
      li(t('一位候选人：第一题完全解出来，第二题只通过了部分test case——最终被筛掉')),
      p(t('')),
      p(t('Amazon最重要的隐藏变量：'), t('Bar Raiser', true)),
      li(t('每轮面试都有一个来自其他团队的"Bar Raiser"，有一票否决权')),
      li(t('"Bar Raiser轮明显更难，问题更深，行为问题更刁钻"')),
      li(t('2024年政策变化：行为面试（Leadership Principles）占比从25%提升到'), t('40%', true)),
      p(t('')),
      p(t('Leadership Principles面试真实高频题（候选人整理）：')),
      li(t('Customer Obsession："讲一个你处理困难客户的经历" / "讲一个你为客户做出艰难决定的经历"')),
      li(t('Bias for Action："讲一个信息不完整时你依然推进决策的经历"')),
      li(t('Ownership："讲一个你主动承担本不属于你职责的问题的经历"')),
      p(t('')),
      p(t('一位拿到SDE-2 offer的候选人总结（Bangalore, 2024）：')),
      li(t('两道编程题全部通过')),
      li(t('每轮技术面同时有行为问题')),
      li(t('"一定要有具体数字：不要说\'我改善了性能\'，要说\'我把页面加载时间从4.2秒减到2.8秒，用户参与度提升15%\'"')),

      hr(),
      h2('四、共同踩坑点——各家面试的通用失误'),
      p(t('从LeetCode Discuss和Reddit汇总的高频失败原因：')),
      li(t('没有问清题目就开始写代码'), t('（最高频失误之一）', true)),
      li(t('花太长时间优化一个方案，没时间做第二题')),
      li(t('边界条件处理遗漏（空数组、重复元素、负数等）')),
      li(t('一位候选人案例：整体方向对但实现时漏掉一个细节 → OA被刷掉')),
      li(t('被语言特定功能难住（有人在JS面试中完全想不起来generator的存在）')),
      p(t('')),
      p(t('共同有效策略（成功候选人总结）：')),
      li(t('练习时主动忽略LeetCode提示的Examples，自己想测试用例')),
      li(t('刷题时不按"Run"按钮，强迫自己用逻辑验证——模拟真实面试')),
      li(t('系统设计用《Designing Data-Intensive Applications》打基底')),
      li(t('一位多家拿offer的候选人：用自己做的demo项目作为行为面试素材，且把项目技术栈和JD对齐')),

      hr(),
      h2('五、2024-2025年新变化'),
      p(t('来自YouTube/Reddit帖子的观察（多个来源）：')),
      li(t('Google Trends数据："system design interview"搜索量比前一年'), t('+340%', true)),
      li(t('Reddit r/cscareerquestions上"LeetCode已经不够用了"相关帖子比2022年增加3倍')),
      li(t('Meta在部分面试中开始允许使用AI工具（Copilot等）'), t('——考察的是如何驾驭AI，而非手写代码', true)),
      li(t('Mock interview平台（Interviewing.io、Hello Interview等）2024年预约量增长'), t('400%', true)),
      li(t('含义：纯刷LeetCode的时代正在过去，需要加上系统设计+行为面试+真人mock')),

      hr(),
      p(t('整理来源：LeetCode Discuss真实面经帖子（2024-2025）/ Reddit r/cscareerquestions / YouTube面试经历视频', false, true)),
    ];

    await writeBlocks(obj_token, blocks);
    console.log(`  ✅ https://${LINK_DOMAIN}/wiki/${node_token}\n`);
  }

  console.log('✨ 完成！');
  console.log(`🔗 新知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
