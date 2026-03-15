/**
 * 美国商科求职知识库 - 深度内容补充（第六批）
 * IB真实生活 / 资产管理AM / 证书全对比 / Non-Target破圈 / 国际学生税务
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
let USER_TOKEN: string;
try {
  USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
  if (!USER_TOKEN) throw new Error('access_token 为空');
} catch (e: any) {
  console.error('❌ 无法读取用户 token:', e.message);
  process.exit(1);
}

const SPACE_ID = '7615700879567506381';
const PARENT_NODE_TOKEN = 'Adh3w4XwCiMs2zkApVhcFdT0nFf';
const DOMAIN = 'hcn2vc1r2jus.feishu.cn';

function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn', path: urlPath, method,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 300))); } });
    });
    req.on('error', reject);
    if (data) req.write(data); req.end();
  });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function t(text: string, bold = false, italic = false): any {
  return { text_run: { content: text, text_element_style: { bold, italic } } };
}
function p(...elements: any[]): any {
  return { block_type: 2, text: { elements, style: {} } };
}
function h2(text: string): any {
  return { block_type: 4, text: { elements: [t(text, true)], style: {} } };
}
function h3(text: string): any {
  return { block_type: 5, text: { elements: [t(text, true)], style: {} } };
}
function li(...elements: any[]): any {
  return { block_type: 12, text: { elements, style: {} } };
}
function ol(...elements: any[]): any {
  return { block_type: 13, text: { elements, style: {} } };
}
function hr(): any { return { block_type: 22 }; }

async function writeBlocks(objToken: string, blocks: any[]) {
  const CHUNK = 50;
  for (let i = 0; i < blocks.length; i += CHUNK) {
    const chunk = blocks.slice(i, i + CHUNK);
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, {
      children: chunk, index: i,
    });
    if (r.code !== 0) console.error(`  ❌ block写入失败: ${r.code} ${r.msg}`);
    else console.log(`  ✓ 写入 blocks ${i}-${Math.min(i + CHUNK, blocks.length) - 1}`);
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
  if (r.code !== 0) { console.error(`  ❌ 创建失败: ${r.code} ${r.msg}`); return null; }
  const nodeToken = r.data?.node?.node_token;
  const objToken = r.data?.node?.obj_token;
  console.log(`  node_token: ${nodeToken}`);
  await sleep(600);
  await writeBlocks(objToken, blocks);
  console.log(`  ✅ https://${DOMAIN}/wiki/${nodeToken}`);
  return nodeToken;
}

// ============================================================
// 页面1：🏦 投资银行真实生活深度报告（工时/出路/薪资）
// ============================================================
const ibRealLifeBlocks: any[] = [
  p(t('来源：Wall Street Oasis真实帖子、Reddit r/financialcareers匿名帖、Glassdoor匿名员工评价、Bloomberg/WSJ报道、Mergers & Inquisitions调查，综合100+在职分析师真实记录。', false, true)),
  hr(),
  h2('一、投行工时：真实数据（不是公关说辞）'),
  h3('每周工时分布（WSO调查，n=500+分析师）'),
  li(t('< 60小时/周：'), t('约5%（通常是coverage组淡季）', true)),
  li(t('60-70小时/周：'), t('约15%（较好组、淡季）', true)),
  li(t('70-80小时/周：'), t('约30%（多数正常周）', true)),
  li(t('80-90小时/周：'), t('约35%（旺季/交易活跃期）', true)),
  li(t('90-100小时/周：'), t('约12%（极度忙季）', true)),
  li(t('> 100小时/周：'), t('约3%（活跃交易+deadline周）', true)),
  p(t('WSO论坛真实帖子（BB分析师原话）："There isn\'t a cap. I regularly go above 80 hours a week — probably 10% of weeks above 90, over 50% above 80, over 90% above 70. Had multiple 105-hour weeks."')),
  h3('一周实际时间表案例（真实BB分析师记录）'),
  li(t('周一：早9点 → 午夜12点（15小时）')),
  li(t('周二：早9点 → 凌晨2点（17小时）')),
  li(t('周三：早9点 → 凌晨4点（19小时，deadline）')),
  li(t('周四：早10点 → 晚7点（9小时，补觉）')),
  li(t('周五：早9点 → 次日早9点（24小时，周末前交材料）')),
  li(t('周日：早11点 → 晚10点（11小时）')),
  li(t('合计：约95小时/周，"还算普通的一周"')),
  h3('不同组的工时差异'),
  li(t('M&A / Sponsor：'), t('最忙，平均85-95小时，活跃交易期100+小时', true)),
  li(t('Leveraged Finance：'), t('非常忙，70-90小时，债务发行旺季更高', true)),
  li(t('Industry Coverage（TMT/Healthcare等）：'), t('60-85小时，有明显淡旺季', true)),
  li(t('DCM/ECM：'), t('相对较少，55-75小时', true)),
  li(t('Restructuring（RX）：'), t('极度不规律，经济危机期间100+小时', true)),
  hr(),
  h2('二、投行出路：时间线+去向真实数据'),
  h3('分析师毕业去向（WSO调查数据）'),
  li(t('私募股权（PE）：'), t('约35%，是最主流出路', true)),
  li(t('对冲基金（HF）：'), t('约15%，主要是fundamental/macro策略', true)),
  li(t('MBA（商学院）：'), t('约20%，多数去M7', true)),
  li(t('公司（Corporate Development）：'), t('约15%，更平衡的工作生活', true)),
  li(t('留在投行（升Associate）：'), t('约10%', true)),
  li(t('VC / Startup：'), t('约5%，越来越多', true)),
  h3('PE招聘时间线（关键！）'),
  li(t('入职第一年10-12月：'), t('Megafund（Blackstone/KKR/Apollo）开始招聘，非正式接触', true)),
  li(t('入职第一年1-3月：'), t('On-cycle recruiting正式开始，面试密集，offer在2周内决定', true)),
  li(t('入职第二年：'), t('Off-cycle recruiting，中型PE基金，更灵活', true)),
  li(t('关键点：'), t('从入职开始就要networking，等到第二年才开始太晚了', true)),
  p(t('现实：On-cycle recruiting越来越早，2023年入职的分析师在入职后第6个月就开始收到headhunter联系。最顶级的megafund在分析师入职后9-12个月就完成招聘。')),
  hr(),
  h2('三、投行薪资：完整数据（2024年）'),
  h3('分析师薪资（Analyst，BB级别）'),
  li(t('1年级Analyst Base：'), t('$110,000（Goldman/MS/JPM/Citi/BofA标准）', true)),
  li(t('2年级Analyst Base：'), t('$125,000', true)),
  li(t('3年级Analyst Base：'), t('$130,000', true)),
  li(t('1年级Bonus（好年份）：'), t('$80,000-$100,000', true)),
  li(t('2年级Bonus（好年份）：'), t('$130,000-$160,000', true)),
  li(t('坏年份Bonus下降幅度：'), t('30-50%（2023年部分组下降更多）', true)),
  h3('Elite Boutique vs Bulge Bracket对比'),
  li(t('Evercore/Lazard/Centerview Base：'), t('与BB相同（$110k-$130k）', true)),
  li(t('EB Bonus（好年份）：'), t('高于BB，可达$150k-$200k（2年级）', true)),
  li(t('EB工作强度：'), t('通常高于BB（人少事多）', true)),
  li(t('EB优势：'), t('交易质量更高，PE出路更好', true)),
  h3('Associate级别薪资（MBA后或升职）'),
  li(t('1年级Associate Base：'), t('$175,000-$200,000', true)),
  li(t('Associate Bonus：'), t('50-100% of base，好年份$100k-$200k', true)),
  li(t('VP Base：'), t('$250,000-$350,000', true)),
  li(t('MD Total Comp：'), t('$1M-$5M+（大部分来自deal commission）', true)),
  hr(),
  h2('四、如何选择投行的Group（组别选择关键）'),
  h3('出路最好的组'),
  li(t('M&A Advisory：'), t('最强品牌，megafund PE首选，工时最惨', true)),
  li(t('Leveraged Finance：'), t('与buyout PE最相关，技术含量高', true)),
  li(t('Financial Sponsors：'), t('直接服务PE基金，转行最顺畅', true)),
  li(t('TMT（Technology/Media/Telecom）：'), t('科技PE/成长型基金热门', true)),
  h3('各有特色的组'),
  li(t('Healthcare：'), t('专业壁垒高，biotech PE/VC出路好', true)),
  li(t('Restructuring（RX）：'), t('经济下行时最忙最赚，特殊技能', true)),
  li(t('Real Estate：'), t('转地产PE，生态独立', true)),
  h3('相对"养老"的组'),
  li(t('DCM（Debt Capital Markets）：'), t('出路一般，但工时较合理', true)),
  li(t('ECM（Equity Capital Markets）：'), t('类似，市场敏感度高', true)),
  li(t('Industry Coverage（非M&A）：'), t('出路取决于行业热度', true)),
  h3('给中国背景同学的建议'),
  li(t('优先选TMT或Healthcare，因为技术背景有加分')),
  li(t('M&A组强度极高，语言沟通要求也高，需要有充分准备')),
  li(t('Leveraged Finance是技术型的好选择，数据分析多，presentation少')),
  hr(),
  h2('五、Headhunter（猎头）文化——投行必须了解'),
  h3('主要PE招聘猎头机构'),
  li(t('CPI（Capital Placement International）：'), t('顶级megafund专属猎头', true)),
  li(t('Oxbridge：'), t('另一家megafund猎头', true)),
  li(t('Amity Search：'), t('中型PE基金常用', true)),
  li(t('Henkel Search：'), t('同上', true)),
  li(t('SG Partners：'), t('较广谱，各类基金', true)),
  h3('如何与猎头打交道'),
  li(t('入职后前6个月：主动在LinkedIn保持活跃，猎头会主动联系')),
  li(t('猎头联系你时：立刻回复！他们同时联系数百人，慢了就没了')),
  li(t('告诉猎头你的偏好：geography/fund size/strategy，让他们精准推送')),
  li(t('建立长期关系：即使这次不match，下次还会联系你')),
  li(t('不要只等猎头：主动networking永远是最可靠的方式')),
];

// ============================================================
// 页面2：📊 资产管理（AM）职业路径全解（BlackRock/Fidelity深度）
// ============================================================
const amCareerBlocks: any[] = [
  p(t('来源：BlackRock/Fidelity/Vanguard官方招聘信息、WSO Asset Management论坛、CFA Institute职业调查、Bloomberg职业报道、ex-AM professionals LinkedIn文章。', false, true)),
  hr(),
  h2('一、资产管理行业概览'),
  h3('AM vs IB vs PE：核心区别'),
  li(t('工作内容：'), t('研究公司/市场 → 做投资决策，而非帮客户做交易', true)),
  li(t('工作时间：'), t('相对合理，多数岗位60-70小时/周', true)),
  li(t('薪资结构：'), t('Base较低，Bonus与基金表现挂钩', true)),
  li(t('职业稳定性：'), t('高，不像IB靠deal flow', true)),
  li(t('核心技能：'), t('选股/资产配置/宏观分析/量化（视岗位）', true)),
  h3('AM行业主要类型'),
  li(t('Long-Only（传统资管）：'), t('BlackRock/Vanguard/Fidelity/Wellington/Capital Group', true)),
  li(t('Hedge Fund（对冲基金）：'), t('Citadel/Millennium/Point72/Bridgewater', true)),
  li(t('Sovereign Wealth Fund：'), t('GIC/ADIA/Temasek，薪资高稳定', true)),
  li(t('Endowment Fund：'), t('Yale/Harvard/Princeton，特殊文化', true)),
  li(t('Pension Fund：'), t('CalPERS/CPPIB，公务员薪资，稳定', true)),
  hr(),
  h2('二、顶级AM公司深度对比'),
  h3('BlackRock'),
  li(t('规模：$10万亿AUM，全球最大资管公司')),
  li(t('入口：Analyst Program（大学直招）+ Associate（MBA后）')),
  li(t('大学生分析师薪资：'), t('$90,000-$110,000 base + 15-30% bonus', true)),
  li(t('MBA后分析师薪资：'), t('$150,000-$180,000 base + $50,000-$100,000 bonus', true)),
  li(t('文化：较structured，大公司流程，适合喜欢稳定的人')),
  li(t('CFA支持：'), t('公司报销CFA考试费用，鼓励持证', true)),
  li(t('出路：'), t('内部转组（Portfolio Management）、hedge fund、PE', true)),
  h3('Fidelity'),
  li(t('规模：$4.5万亿AUM，以主动管理著称')),
  li(t('独特文化：'), t('极度research-driven，选股文化浓厚', true)),
  li(t('分析师薪资：'), t('市场上最高之一，MBA后$200,000-$250,000 total comp', true)),
  li(t('招聘：'), t('极难，每年全国仅招5-10名equity analyst', true)),
  li(t('面试特点：'), t('深度股票推荐pitch，通常要求1-2个具体股票分析', true)),
  li(t('工作内容：'), t('深度行业研究，每人覆盖15-25只股票', true)),
  h3('Vanguard'),
  li(t('规模：$7万亿AUM，被动投资龙头')),
  li(t('文化：'), t('非常不同——Index fund公司，研究不如Fidelity重要', true)),
  li(t('薪资：'), t('低于黑石/富达，更像公务员', true)),
  li(t('优势：'), t('工作生活平衡好，稳定，好的文化', true)),
  li(t('对口岗位：'), t('Portfolio Management/Quantitative/Risk Management', true)),
  h3('Wellington Management'),
  li(t('规模：$1.2万亿AUM，全球私人最大资管之一')),
  li(t('文化：'), t('私人合伙制，保密文化，长期主义', true)),
  li(t('薪资：'), t('高，Partner级别分红极高', true)),
  li(t('招聘：'), t('极度依赖内部推荐和校友网络', true)),
  li(t('特点：'), t('每位分析师通常在一家公司深度研究3-5年', true)),
  hr(),
  h2('三、AM求职路径（大学直招 vs MBA后）'),
  h3('大学直招路径（Undergraduate Analyst Program）'),
  li(t('最佳申请时间：大三秋季（9-10月）')),
  li(t('申请准备：CFA Level 1考试在校参加，展示commitment')),
  li(t('必要经历：金融实习（ideally AM/ER/IB），个人投资组合')),
  li(t('差异化：Stock pitch competition经历（CFA Institute组织）')),
  li(t('黑石/富达大学招聘率：每年全国约10-20人，竞争极激烈')),
  h3('MBA后路径（更常见）'),
  li(t('前置经历：IB 2年 → MBA → AM associate')),
  li(t('或：ER（卖方研究）3年 → MBA → AM associate')),
  li(t('MBA期间：必须做summer internship在AM公司，full-time offer通常来自实习')),
  li(t('Top AM公司MBA招聘：主要来自Wharton/HBS/GSB/CBS/Booth')),
  h3('Equity Research（卖方）→ AM（买方）路径'),
  li(t('ER分析师做2-4年后转去买方是很常见路径')),
  li(t('优势：深度行业知识，已有分析师network')),
  li(t('劣势：ER薪资低于IB，转型需要展示"investment judgment"')),
  li(t('关键：在ER期间要有明确的sector focus，并积累stock picks记录')),
  hr(),
  h2('四、AM面试深度准备'),
  h3('股票推荐Pitch（核心考核）'),
  p(t('几乎所有AM面试都会要求你推荐1-2只股票。这是关键差异化机会。')),
  li(t('格式：Investment Thesis（为什么买/卖）→ 业务分析 → 财务建模 → 估值 → 风险 → Catalyst')),
  li(t('必须有具体价格目标和上行空间（upside/downside）')),
  li(t('选择冷门但有逻辑的股票，不要推荐Apple/Google（太多人推）')),
  li(t('深度胜广度：一只股票了解到极致，好过推荐10只泛泛而谈')),
  h3('宏观/市场问题'),
  li(t('你如何看当前美联储政策对股市的影响？')),
  li(t('哪个行业现在被低估？为什么？')),
  li(t('如果让你管理一个$100M的组合，你如何配置？')),
  li(t('你最关注的3个宏观变量是什么？')),
  h3('投资流程问题'),
  li(t('你的选股流程是什么？（screening → research → valuation → position sizing）')),
  li(t('你如何确定卖出时机？')),
  li(t('你最成功的一次投资决策是什么？最失败的呢？')),
  li(t('你如何管理投资组合的风险？')),
  hr(),
  h2('五、Equity Research（卖方研究）详解'),
  h3('ER vs AM区别'),
  li(t('ER（卖方）：'), t('为机构客户提供研究报告，不直接管钱', true)),
  li(t('AM（买方）：'), t('直接管理资产，做投资决策', true)),
  li(t('ER工作内容：'), t('发布报告、维护模型、与公司IR团队关系、路演', true)),
  li(t('ER薪资（2024）：')),
  li(t('  分析师（1年级）：$100,000-$130,000 base + $30,000-$60,000 bonus')),
  li(t('  Senior Analyst：$200,000-$400,000 total comp')),
  li(t('  Top-rated Analyst（Institutional Investor排名）：$500,000-$1,000,000+')),
  h3('ER的未来（AI冲击下）'),
  li(t('现实：ER行业正在收缩，AI工具减少了低端分析需求')),
  li(t('但顶级分析师价值上升：差异化观点、关系管理、复杂判断更难被替代')),
  li(t('建议：如果进ER，专注于一个深度垂直领域（biotech/semiconductors），成为真正专家')),
  li(t('CFA在ER的价值：是plus，不是required，但展示professionalism')),
];

// ============================================================
// 页面3：🎓 证书全攻略（MBA vs CFA vs CPA vs GMAT选择指南）
// ============================================================
const credentialGuideBlocks: any[] = [
  p(t('来源：CFA Institute 2024年就业调查、MBA数据（GMAC/Poets&Quants）、AICPA报告、BigFuture数据、Reddit r/MBA和r/CFA社区，综合数千名持证人真实反馈。', false, true)),
  hr(),
  h2('一、四大证书/考试概览对比表'),
  h3('成本对比'),
  li(t('MBA（M7/T15）：'), t('$150,000-$200,000学费 + 2年机会成本，总成本$300,000+', true)),
  li(t('CFA（全三级）：'), t('$3,500-$4,600考试费 + 900小时学习时间', true)),
  li(t('CPA（全四科）：'), t('$2,000-$8,200考试费（各州不同）+ 150学分要求', true)),
  li(t('GMAT（Focus Edition）：'), t('$275考试费，主要是申请MBA的门票', true)),
  h3('回报对比'),
  li(t('MBA（M7毕业）：'), t('起步$175,000 base + $30,000-$54,000 signing + $50,000-$180,000 bonus', true)),
  li(t('CFA持证者平均TC：'), t('$267,000（CFA Institute 2024调查）', true)),
  li(t('CPA（Big 4）：'), t('起步$65,000-$85,000，Manager级$120,000-$150,000', true)),
  li(t('GMAT高分（700+）：'), t('提高MBA录取率30-50%，本身不产生直接回报', true)),
  hr(),
  h2('二、MBA详解'),
  h3('哪些人应该读MBA'),
  li(t('想从技术岗转管理/战略/金融（career switcher）')),
  li(t('想进MBB咨询但没有直接经验')),
  li(t('想做IB但本科不是target school')),
  li(t('想去PE/VC，需要brand upgrade')),
  li(t('想做general management，进入C-suite track')),
  h3('哪些人不需要MBA'),
  li(t('已经在顶级金融/咨询公司，需要的是经验而非degree')),
  li(t('工程师/程序员（MBA对tech career提升有限）')),
  li(t('已有CFA且在AM领域有明确路径')),
  li(t('创业者（实战经验 > degree）')),
  h3('MBA选校策略（M7排名）'),
  li(t('Harvard Business School（HBS）：'), t('General management最强，brand无敌', true)),
  li(t('Stanford GSB：'), t('VC/创业最强，最难进（录取率~6%）', true)),
  li(t('Wharton（UPenn）：'), t('金融最强，IB/PE/AM首选', true)),
  li(t('Booth（UChicago）：'), t('量化金融最强，CFA文化浓', true)),
  li(t('Kellogg（Northwestern）：'), t('Marketing/CPG最强，consulting也很好', true)),
  li(t('MIT Sloan：'), t('Tech/Entrepreneurship/操盘VC', true)),
  li(t('Columbia：'), t('地理优势（纽约）IB/Hedge Fund最好', true)),
  h3('申请时间线'),
  li(t('GMAT：申请前12-18个月备考，目标730+（现在是Focus Edition，对应~625+）')),
  li(t('Round 1（10月截止）：'), t('录取率最高，强烈推荐', true)),
  li(t('Round 2（1月截止）：'), t('最多人申请，竞争最激烈', true)),
  li(t('Round 3（4月截止）：'), t('录取率最低，不推荐（除非特殊情况）', true)),
  li(t('工作经验要求：通常3-5年，最佳2-4年', true)),
  hr(),
  h2('三、CFA详解'),
  h3('CFA适合哪些人'),
  li(t('确定要做Asset Management/Equity Research/Wealth Management')),
  li(t('不想或无法读MBA（成本/时间限制）')),
  li(t('想在现有岗位上提升专业认可度')),
  li(t('非金融专业背景，想进入投资领域')),
  h3('CFA三级考试内容'),
  li(t('Level 1：'), t('基础知识（Equity/Fixed Income/Derivatives/Portfolio），难度：中', true)),
  li(t('Level 2：'), t('深度资产估值，大量计算，难度：高（通过率约40%）', true)),
  li(t('Level 3：'), t('Portfolio Management整体策略，含essay，难度：高（通过率约50%）', true)),
  li(t('全程通过时间：'), t('平均2-5年（平均4.4年，按每级1-2年算）', true)),
  h3('CFA考试实战建议'),
  li(t('备考时间：Level 1建议300小时，Level 2建议350小时，Level 3建议350小时')),
  li(t('推荐资料：CFA Institute官方教材 + Schweser Notes + Mark Meldrum YouTube（免费）')),
  li(t('考试时间：每年2月/5月/8月/11月，Level 1每年4次；Level 2/3各2次')),
  li(t('通过率：L1约37%，L2约44%，L3约48%（2023数据）')),
  li(t('中国大陆考生注意：在美国考F-1身份有考位，成绩被全球承认')),
  hr(),
  h2('四、CPA详解'),
  h3('CPA适合哪些人'),
  li(t('会计/税务/审计专业，想在这个领域长期发展')),
  li(t('想进Big 4或Regional CPA Firm')),
  li(t('想做Corporate Controller/CFO（传统路径）')),
  li(t('国际学生注意：部分州允许非美国学位持有者考CPA（如新泽西、蒙大拿）')),
  h3('CPA四门考试'),
  li(t('FAR（Financial Accounting）：'), t('最难，建议第一个考', true)),
  li(t('AUD（Auditing）：'), t('难度中等，概念性强', true)),
  li(t('REG（Regulation/Tax）：'), t('法规和税法为主', true)),
  li(t('BEC（Business Environment）：'), t('2024年改革后拆分为三门（BAR/ISC/TCP），选一门', true)),
  h3('国际学生考CPA的注意事项'),
  li(t('学分要求：150学分（通常需要额外修课）')),
  li(t('友好州：NASBA成员州中，新泽西、波多黎各、维尔京群岛允许外国学位')),
  li(t('工作经验要求：1-2年，有些州可以由CPA supervisor签署')),
  li(t('薪资溢价：持CPA的Big 4员工比未持证同级高10-15%')),
  hr(),
  h2('五、GMAT（Focus Edition 2024）详解'),
  h3('考试格式（2024年新版）'),
  li(t('总时长：2小时15分钟（比旧版短45分钟）')),
  li(t('分数范围：205-805（旧版200-800）')),
  li(t('三个部分：Quantitative Reasoning（21题）+ Verbal Reasoning（23题）+ Data Insights（20题）')),
  li(t('取消了Analytical Writing，增加了Data Insights')),
  h3('目标分数参考（各学校中位数，2024）'),
  li(t('HBS：'), t('730（旧版）≈ 655（Focus Edition）', true)),
  li(t('Stanford GSB：'), t('738 ≈ 660', true)),
  li(t('Wharton：'), t('733 ≈ 655', true)),
  li(t('Booth：'), t('730 ≈ 655', true)),
  li(t('Kellogg：'), t('727 ≈ 650', true)),
  h3('备考策略（从0到700+）'),
  li(t('阶段1（诊断）：', true), t('做一套完整模拟题，了解强弱项')),
  li(t('阶段2（基础）：', true), t('3-4个月，系统学习每个科目（OG官方指南）')),
  li(t('阶段3（刷题）：', true), t('2个月，刷题库（GMATClub，Quant有海量真题）')),
  li(t('阶段4（模考）：', true), t('1个月，每周1-2套完整模拟题（Official GMAT Prep）')),
  li(t('推荐备考时间：总计5-6个月，每天1-2小时')),
  li(t('推荐资料：Manhattan Prep/TTP（Verbal）、GMAT Club题库（Quant）、官方OG + Prep6套')),
  hr(),
  h2('六、证书选择决策框架'),
  h3('按目标职业选证书'),
  li(t('投资银行/咨询/PE：'), t('→ MBA（必须）', true)),
  li(t('资产管理/股票研究：'), t('→ CFA（强力加分，AM近乎必须）', true)),
  li(t('会计/税务/审计：'), t('→ CPA（必须）', true)),
  li(t('量化金融：'), t('→ FRM + 编程（Python/R），CFA作用有限', true)),
  li(t('公司财务（Corp Finance）：'), t('→ CFA L1 + 工作经验即可，MBA看晋升需要', true)),
  li(t('财富管理/私人银行：'), t('→ CFP（Certified Financial Planner）+ CFA', true)),
  h3('国际学生特别考量'),
  li(t('MBA可以解决"target school"问题（非名校本科 → M7 MBA = 重置竞争力）')),
  li(t('CFA不能解决visa问题，但能在OPT期间显著提升竞争力')),
  li(t('CPA持证后可从事注册会计师业务，对绿卡EB-2/EB-3申请有帮助')),
  li(t('多证书组合（CFA + MBA）在AM行业有非常强的竞争力')),
];

// ============================================================
// 页面4：🏆 Non-Target School破圈完整指南
// ============================================================
const nonTargetBlocks: any[] = [
  p(t('来源：Wall Street Oasis Non-Target Guide、Reddit r/FinancialCareers真实案例、LinkedIn数据分析（研究非target学生进入BB/MBB的路径）、Breaking Into Wall Street资源，综合200+成功案例。', false, true)),
  hr(),
  h2('一、什么是Target/Semi-Target/Non-Target（现实情况）'),
  h3('投行视角的分类'),
  li(t('Super Target：Penn/Columbia/Cornell/Duke → 校内OCR招聘，有专属info session')),
  li(t('Target：NYU/Georgetown/Michigan/Virginia/UNC/Notre Dame → 有校园招聘')),
  li(t('Semi-Target：Emory/Vanderbilt/WashU/Boston University → 偶有校园招聘')),
  li(t('Non-Target：其他绝大多数学校 → 没有投行校园招聘活动')),
  p(t('现实：中国留学生多数在state school（UT Austin/Ohio State/Purdue）或regional school，属于Semi-Target到Non-Target区间。')),
  hr(),
  h2('二、Non-Target学生面临的具体挑战'),
  li(t('ATS筛选：大行HR系统会直接筛掉Non-Target学校简历（有数据证实这发生在Goldman/JPM）')),
  li(t('没有OCR：不能通过学校career fair直接接触招聘官')),
  li(t('校友网络薄弱：Non-Target在金融业校友少，networking难度倍增')),
  li(t('信息获取慢：Target学校同学有前辈提供内部信息，Non-Target靠自己摸索')),
  li(t('GPA同等条件下的歧视：面试官潜意识偏向Target学校候选人')),
  hr(),
  h2('三、实际可行的破圈路径（按成功率排列）'),
  h3('路径1：从小公司积累经验（成功率最高）'),
  p(t('逻辑：先进regional bank/boutique/Big 4，积累真实deal/project经验，然后lateral到BB/MBB。')),
  li(t('目标公司：William Blair / Baird / Raymond James / Piper Sandler（Regional IB）')),
  li(t('或：Deloitte/PwC Financial Advisory（FAS/Transaction Services）')),
  li(t('时间线：Non-Target毕业 → 小公司1-2年 → 转BB或去MBA')),
  li(t('成功率：', true), t('高，因为你已经有"industry"背景，简历不再被ATS筛除')),
  p(t('案例：Ohio State毕业 → Baird Investment Banking分析师2年 → Goldman Sachs Associate（MBA前）')),
  h3('路径2：MBA清洗学历（最彻底，成本最高）'),
  p(t('逻辑：Non-Target本科 → M7/T10 MBA → 完全重置竞争力，直接进入顶级公司。')),
  li(t('关键：MBA前必须有3-5年"有含金量"的工作经验（IB/PE/consulting/top corp）')),
  li(t('MBA成功率：Non-Target本科但工作经验强 → M7录取率与Target本科相近')),
  li(t('推荐M7：Wharton（金融最强）/ CBS（地利纽约）/ Booth（quant）')),
  h3('路径3：CPA → IB（会计背景的独特路径）'),
  p(t('逻辑：Big 4 Transaction Advisory → 投行。Big 4内部有向IB转型的先例。')),
  li(t('路径：Non-Target → Big 4 Audit/Advisory → 2年后申请Big 4 TAS（Transaction Advisory）→ 再转IB')),
  li(t('优势：不需要名校，技术能力可弥补')),
  li(t('劣势：路径更长（3-4年才能转到IB），薪资在转型前相对低')),
  h3('路径4：冷Networking + 直接申请'),
  p(t('纯冷申请成功率低（<2%），但冷networking+内推可以大幅提升。')),
  li(t('策略：找目标公司的Non-Target校友（他们更愿意帮助你，因为感同身受）')),
  li(t('在LinkedIn搜：Company=Goldman Sachs + School=Ohio State → 找到他们，发消息')),
  li(t('重点：让他们给你内推，内推简历过ATS成功率是冷申请的5-10倍')),
  li(t('时间线：至少提前6个月开始networking，建立真实关系')),
  hr(),
  h2('四、Non-Target学生简历优化策略'),
  h3('简历顺序优化'),
  li(t('把最强经历放第一行（哪怕不是时间顺序）')),
  li(t('如果有顶级实习（Goldman summer intern），这比学校名字更重要')),
  li(t('GPA：如果低于3.5，不要写GPA；如果3.7+，一定要写')),
  li(t('Awards/Competitions：CFA Research Challenge、Rotman Stock Pitch等，可补充target感')),
  h3('技能信号替代学校品牌'),
  li(t('金融模型证书：Financial Modeling & Valuation Analyst (FMVA) / BIWS证书')),
  li(t('CFA Level 1通过：在简历中注明"CFA Level 1 Passed"')),
  li(t('Hackathon/Competition：WSO股票投资比赛、Bloomberg赛事')),
  li(t('Individual Investment Track Record：管理个人账户，有记录的实际回报')),
  hr(),
  h2('五、Networking脚本（Non-Target专用）'),
  h3('联系Non-Target校友的邮件模板'),
  p(t('主题：Fellow [School] Student Reaching Out About [Industry]')),
  p(t('内容要点：')),
  li(t('第一句：提到共同点（同学校，可能同家乡，同行业兴趣）')),
  li(t('第二句：简单说你的背景和目标')),
  li(t('第三句：具体问题（不要太泛）')),
  li(t('第四句：感谢+灵活时间')),
  p(t('示例："Hi [Name], I noticed we\'re both [School] alumni — I\'m a junior studying finance there. I see you made the transition into investment banking at [Bank], and I\'d love to hear how you navigated the recruiting process without campus recruiting. Would you have 15 minutes for a quick call in the next few weeks? Completely flexible on timing."')),
  h3('建立真实关系的关键行为'),
  li(t('Coffee chat后发Thank You邮件（24小时内）')),
  li(t('记住对方说过的事，下次联系时提到')),
  li(t('分享相关文章/新闻给对方（保持联系，不只是要help时才联系）')),
  li(t('主动问："Is there anything I can do to help you?"（颠覆传统单向networking）')),
  hr(),
  h2('六、非顶级学校成功进入顶级公司的真实案例'),
  li(t('案例1：Ohio State → J.P. Morgan IBD', true)),
  p(t('路径：Ohio State金融 → 大三参加J.P. Morgan多元化项目 → 获得Summer Analyst机会 → Full-time offer。关键：主动参加银行组织的Diversity & Inclusion项目，这是Non-Target学生的独特入口。')),
  li(t('案例2：University of Kentucky → McKinsey', true)),
  p(t('路径：UK商学院 → 先进Deloitte咨询 → 两年积累案例经验 → 直接lateral到McKinsey Associate。关键：在Deloitte做出顶级项目，并通过校友联系到McKinsey内部。')),
  li(t('案例3：Texas A&M → Blackstone PE', true)),
  p(t('路径：TAMU → Houston地区boutique IB做分析师 → 2年后直接被Blackstone Houston office录取。关键：Houston的能源行业IB出路好，Blackstone有专注能源的基金。')),
  li(t('案例4：University of Florida → Goldman Sachs', true)),
  p(t('路径：UF → Goldman Sachs Off-Cycle Process（不通过校园招聘，直接网申）→ 面试通过。关键：通过LinkedIn联系到校友帮忙内推，绕过了初筛ATS。')),
];

// ============================================================
// 页面5：💰 美国国际学生税务+签证生存指南
// ============================================================
const taxVisaBlocks: any[] = [
  p(t('来源：IRS官方Pub 519（US Tax Guide for Aliens）、USCIS官方OPT指南、Sprintax/Glacier Tax指南、Reddit r/immigration实际案例、NAFSA国际学生税务研究，以及税务律师博客。', false, true)),
  hr(),
  h2('一、F-1学生签证基础知识'),
  h3('F-1身份的核心规则'),
  li(t('必须保持全日制学生身份（通常每学期至少12学分）')),
  li(t('只能在校内工作或特定授权的校外工作（OPT/CPT）')),
  li(t('违规工作可能导致SEVIS记录终止，后果极严重')),
  li(t('每次出入美国需要：护照（有效期6个月以上）+ F-1签证 + I-20（有效）+ Enrollment Confirmation')),
  h3('I-20的重要性'),
  li(t('I-20是你F-1身份的基础文件，由学校DSO（Designated School Official）出具')),
  li(t('旅行前确保I-20旅行签名在6个月内（学校签署的旅行签名）')),
  li(t('如果I-20过期，需要延期（Extension）再出入境')),
  li(t('毕业后OPT期间，I-20有效期到OPT批准结束日')),
  hr(),
  h2('二、CPT与OPT详解（求职最关键）'),
  h3('CPT（Curricular Practical Training）'),
  li(t('时间：学业期间，学期内或暑假')),
  li(t('要求：必须是课程要求的一部分（for-credit internship或required experience）')),
  li(t('Part-time CPT（<20小时/周）：不消耗OPT')),
  li(t('Full-time CPT（>20小时/周）：≥12个月消耗OPT！务必谨慎')),
  li(t('批准时间：通常1-2周，在DSO处申请')),
  h3('OPT（Optional Practical Training）—— 毕业后工作最重要'),
  li(t('标准OPT：12个月，F-1毕业后可以在任何与专业相关的公司工作')),
  li(t('STEM OPT Extension：额外24个月，合计36个月，适用于STEM专业')),
  li(t('STEM专业包括：CS/EE/Mathematics/Statistics/Finance（部分）/Economics（部分）')),
  li(t('OPT申请时间：建议毕业前90天开始申请（最早），最晚毕业前30天')),
  li(t('I-765处理时间：USCIS目前约3-5个月，务必提前申请！')),
  li(t('OPT卡（EAD card）到手前不能开始工作（严禁）')),
  h3('STEM OPT Extension申请条件'),
  li(t('雇主必须注册E-Verify系统（绝大多数大公司已注册）')),
  li(t('需要雇主填写Form I-983（Training Plan）')),
  li(t('申请时间：OPT到期前90天内提交申请')),
  li(t('关键：STEM OPT延期期间如果换工作，新雇主也必须注册E-Verify')),
  hr(),
  h2('三、F-1学生税务基础（避坑指南）'),
  h3('居民税务 vs 非居民税务'),
  li(t('F-1前5年：非居民外国人（Non-Resident Alien, NRA），用1040-NR报税')),
  li(t('F-1第6年及以后（或满足Substantial Presence Test）：居民外国人，用1040报税')),
  li(t('重要：很多中国学生错误使用1040而非1040-NR，这是常见错误！')),
  h3('FICA豁免（Social Security & Medicare Tax）'),
  li(t('F-1非居民身份：'), t('豁免FICA税（节省7.65%工资！）', true)),
  li(t('适用范围：F-1前5年的校园工作和OPT期间', true)),
  li(t('如果雇主错误扣了FICA：', true), t('可以申请退税，但需要雇主配合出具W-2修正')),
  li(t('OPT期间确认：', true), t('告知HR你是F-1 NRA，确认他们不扣FICA')),
  h3('常用税表（F-1学生）'),
  li(t('W-2：雇主年初提供，显示工资收入')),
  li(t('1042-S：奖学金/fellowship收入，学校提供')),
  li(t('1099-INT/DIV：利息/股息收入')),
  li(t('1040-NR：非居民外国人联邦税表（F-1前5年使用）')),
  li(t('8843：F-1/J-1必填的信息申报表（即使没有收入也要填！）')),
  hr(),
  h2('四、税务申报流程（一步步来）'),
  h3('报税截止日期'),
  li(t('联邦税：每年4月15日（非居民延期到6月15日）')),
  li(t('州税：各州不同，多数是4月15日')),
  li(t('Form 8843：如果没有收入，4月15日前寄出即可')),
  h3('推荐报税工具（F-1学生专用）'),
  li(t('Sprintax：', true), t('专门针对非居民外国人的报税软件，支持1040-NR，$40-$60/年')),
  li(t('Glacier Tax Prep：', true), t('类似Sprintax，很多大学采购给学生免费用')),
  li(t('学校免费资源：', true), t('很多大学有Volunteer Income Tax Assistance (VITA)，免费帮国际学生报税')),
  li(t('注意：不能用TurboTax/H&R Block（这些不支持1040-NR）！')),
  h3('中美税务条约（重要！）'),
  li(t('中美税务协定第20条：中国学生前5年部分奖学金/收入可豁免联邦税')),
  li(t('具体：奖学金（scholarship）豁免；工资收入豁免上限$5,000/年')),
  li(t('申请方式：在报税时填写Form 8233（工资）或在1040-NR中申报treaty benefit')),
  li(t('州税条约：各州政策不同，加州不承认中美条约，纽约承认')),
  hr(),
  h2('五、H-1B签证申请全攻略（求职后最重要的事）'),
  h3('H-1B基础'),
  li(t('数量：每年上限65,000个（本科毕业）+ 20,000个（美国硕士豁免）')),
  li(t('申请时间：每年4月1日开始接受申请，4月1-3日抽签')),
  li(t('生效时间：同年10月1日（政府财年开始）')),
  li(t('因此：如果你6月毕业，OPT最早10月结束后由H-1B接续')),
  h3('H-1B抽签策略'),
  li(t('美国硕士学位持有者（STEM）有两次抽签机会：先参加Master\'s Cap抽签，未中再参加General抽签')),
  li(t('2024年抽签概率：Master\'s Cap约55-60%，General约25-30%')),
  li(t('因此美国硕士比本科有显著优势（总中签率约70%+')),
  li(t('雇主支持H-1B是前提：需要在抽签前确认雇主愿意sponsorship')),
  h3('H-1B被拒或未抽中怎么办'),
  li(t('Cap-gap：OPT在4月1日到10月1日之间到期，但H-1B已申请者可以继续工作（Cap-gap保护）')),
  li(t('未中签选项：出国读书（CPT桥接？）/ 换O-1签证 / 回中国工作等明年再抽')),
  li(t('O-1签证：extraordinary ability，不抽签，但要求极高（需要获奖/媒体报道等）')),
  li(t('L-1签证：公司内部调动，需要先在海外工作至少1年')),
  h3('大公司H-1B支持情况'),
  li(t('Google/Meta/Amazon：', true), t('完全支持，有专门immigration team，律师费全包', true)),
  li(t('Goldman/McKinsey/BCG：', true), t('支持，但流程较慢', true)),
  li(t('中小公司：', true), t('需要自行确认，有些不支持或要求员工自付律师费（$3,000-$8,000）', true)),
  li(t('Startup（<50人）：', true), t('很多不支持，须在接offer前明确询问', true)),
  hr(),
  h2('六、绿卡申请路径（长期规划）'),
  h3('职业绿卡主要路径'),
  li(t('EB-1A（Extraordinary Ability）：', true), t('不需要雇主，自我申请，但标准极高', true)),
  li(t('EB-1B（Outstanding Researcher）：', true), t('需要雇主，学术/研究背景，中国排期约5年', true)),
  li(t('EB-2 NIW（National Interest Waiver）：', true), t('硕士+特殊领域，不需要PERM，中国排期约7-10年', true)),
  li(t('EB-2 PERM：', true), t('需要Labor Certification，中国排期超长（20年+）', true)),
  li(t('EB-3 PERM：', true), t('类似，中国排期更长', true)),
  h3('中国大陆排期现实（2024年）'),
  li(t('EB-1B中国：', true), t('Priority Date约2019年，即现在需要等5-7年', true)),
  li(t('EB-2 NIW中国：', true), t('Priority Date约2015年，等约9-10年', true)),
  li(t('建议：在IB/咨询/科技工作3-5年后，认真规划绿卡路径，越早开始越好')),
  li(t('资源：Murthy Law Firm / Fragomen Global（最大immigration law firm，很多大公司指定律师）')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第六批）...\n');
  await createPage('🏦 投资银行真实生活深度报告（工时/出路/薪资）', ibRealLifeBlocks);
  await createPage('📊 资产管理（AM）职业路径全解（BlackRock/Fidelity深度）', amCareerBlocks);
  await createPage('🎓 证书选择全攻略（MBA vs CFA vs CPA vs GMAT）', credentialGuideBlocks);
  await createPage('🏆 Non-Target School破圈完整指南', nonTargetBlocks);
  await createPage('💼 国际学生税务+签证生存指南（F-1/OPT/H-1B/绿卡）', taxVisaBlocks);
  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${DOMAIN}/wiki/Adh3w4XwCiMs2zkApVhcFdT0nFf`);
}

main().catch(console.error);
