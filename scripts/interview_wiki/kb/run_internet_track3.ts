/**
 * 🎮 互联网赛道深度报告：游戏（独立页）
 *
 * 结构：行业概念 → 市场规模 → 竞争格局 → 发展趋势 → 主要玩家近期动态 → 公司年报拆解 → 求职视角
 * 数据来源：网易财报(2026.3)、腾讯Q4财报、CADPA中国游戏产业报告、Sensor Tower
 *
 * 用法：
 *   cd ~/feishu-sdk
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 PATH="/usr/local/bin:$PATH" \
 *     node_modules/.bin/ts-node scripts/interview_wiki/kb/run_internet_track3.ts
 */

import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE   = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN   = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const SPACE_ID     = '7615113124324117443';
const PARENT_TOKEN = 'MjX7wHojriDgIrkrfjfcjr5TnPg';
const DOMAIN       = 'hcn2vc1r2jus.feishu.cn';

const t    = (c: string) => ({ text_run: { content: c, text_element_style: {} } });
const b    = (c: string) => ({ text_run: { content: c, text_element_style: { bold: true } } });
const p    = (...els: any[]) => ({ block_type: 2,  text:     { elements: els, style: {} } });
const h1   = (c: string)    => ({ block_type: 3,  heading1: { elements: [b(c)], style: {} } });
const h2   = (c: string)    => ({ block_type: 4,  heading2: { elements: [t(c)], style: {} } });
const h3   = (c: string)    => ({ block_type: 5,  heading3: { elements: [t(c)], style: {} } });
const hr   = ()             => ({ block_type: 22, divider: {} });
const li   = (...els: any[]) => ({ block_type: 12, bullet:  { elements: els, style: {} } });
const quote = (...els: any[]) => ({ block_type: 15, quote:  { elements: els, style: {} } });

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

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
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(d.slice(0, 300))); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function createNode(title: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', parent_wiki_token: PARENT_TOKEN, node_type: 'origin', title,
  });
  if (r?.code !== 0) throw new Error(`createNode failed: ${r?.code} ${r?.msg}`);
  return { nodeToken: r.data.node.node_token, objToken: r.data.node.obj_token };
}

async function writeBlocks(objToken: string, blocks: any[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += 50) {
    const chunk = blocks.slice(i, i + 50);
    const r = await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
      { children: chunk }
    );
    if (r?.code !== 0) console.error(`  ❌ blocks[${i}]: ${r?.code} ${r?.msg}`);
    if (i + 50 < blocks.length) await sleep(500);
  }
}

async function writeTable(objToken: string, headers: string[], rows: string[][]): Promise<void> {
  const numRows = rows.length + 1;
  const numCols = headers.length;
  const tableRes = await api('POST',
    `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }] }
  );
  if (tableRes?.code !== 0) { console.error('  ❌ 表格:', tableRes?.code, tableRes?.msg); return; }
  const cellIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols);
    const colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;
    const elem = rowIdx === 0 ? b(content) : t(content);
    await api('POST',
      `/open-apis/docx/v1/documents/${objToken}/blocks/${cellIds[idx]}/children`,
      { children: [p(elem)] }
    );
    await sleep(110);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

async function main() {
  console.log('📝 写入：游戏赛道深度报告...\n');

  const { nodeToken, objToken } = await createNode('🎮 游戏：赛道深度报告（2024-2025）');
  console.log(`  ✅ ${nodeToken}`);
  console.log(`  🔗 https://${DOMAIN}/wiki/${nodeToken}`);
  await sleep(800);

  await writeBlocks(objToken, [
    p(b('赛道定位：'), t('游戏是中国互联网最早实现大规模商业化的赛道，2024年市场规模3257.83亿元，用户规模6.74亿人。腾讯+网易双寡头格局稳固（CR2=64.7%），但「出海」成为2024-2025年最重要的增量战场——2025年中国游戏海外收入达204.5亿美元，全球份额持续提升。')),
    p(b('核心逻辑：'), t('游戏商业化本质是「注意力的极致变现」。游戏用户平均每天游玩2-3小时，在所有娱乐方式中用户粘性最高、付费意愿最强。商业化路径：F2P（免费下载+内购）是主流，皮肤/角色/道具是核心变现。顶级IP（王者荣耀/原神）形成品牌效应，用户LTV极高。')),
    p(b('适合商科岗位：'), t('游戏运营（活动策划/用户运营）、商业化产品经理、数据分析师（用户行为/付费分析）、战略分析（并购/出海）、投资研究员（游戏板块）')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('一、行业基本概念'),
    h2('1.1 游戏产业链结构'),
    li(b('上游—研发层：'), t('游戏研发商负责内容创作，包括引擎开发（Unity/虚幻）、美术、策划、程序。研发是游戏产业最重要的壁垒——顶级游戏研发周期3-5年，投入数亿元。腾讯/网易自有研发工作室+收购全球顶尖工作室双轨并行')),
    li(b('中游—发行层：'), t('游戏发行商负责渠道对接、营销推广、服务器运维、内容运营。国内「买量」（向抖音/微信买广告流量获取新用户）是发行最大成本中心，单个手游买量预算动辄亿级')),
    li(b('下游—渠道层：'), t('苹果App Store（30%抽成）、安卓（华为应用市场/小米应用商店/OPPO应用市场，抽成50%）、微信小游戏（6%/30%抽成）。渠道高额抽成是制约手游利润率的重要因素')),
    li(b('变现层：'), t('内购（道具/皮肤/抽卡）是主流，广告（超休闲游戏）次之，订阅（Xbox/PS+等主机游戏）在海外成熟市场占比提升')),
    h2('1.2 核心商业模式'),
    h3('F2P（免费游玩+内购）'),
    p(t('中国游戏主流商业模式。游戏免费下载，通过「皮肤」（外观）、「英雄/角色」、「强化道具」、「抽卡池」等实现变现。核心逻辑：绝大多数用户不付费（LTV≈0），少数重度玩家（鲸鱼用户）贡献80%以上收入。因此游戏运营核心是识别和留住高付费用户。')),
    h3('开放世界/买断制（海外市场增长点）'),
    p(t('《黑神话悟空》2024年8月发布，首月销量超1800万套（70美元/套），证明中国研发团队可以做出全球顶级买断制游戏。米哈游原神采用「买断+F2P」混合模式，全球月流水稳定在10亿元以上。')),
    h3('小游戏（微信生态快速变现）'),
    p(t('微信小游戏2024年市场规模超610亿元。核心优势：零下载门槛（微信内即开即玩）、社交裂变（好友排行榜）、广告变现（超休闲品类）。腾讯从中抽取6-30%收入，是微信生态最重要的新变现方式之一。')),
    h2('1.3 必背核心指标'),
    li(b('DAU/MAU：'), t('日/月活跃用户数。王者荣耀DAU约8000万，原神全球MAU约5000万')),
    li(b('付费率（付费用户/MAU）：'), t('国内手游平均付费率3-5%，高品质游戏可达8-12%')),
    li(b('ARPPU（付费用户平均收入）：'), t('ARPPU = 月流水 / 付费用户数。高ARPPU代表重度用户黏性强')),
    li(b('LTV（生命周期价值）：'), t('玩家从安装到流失期间的总付费金额。LTV > CAC是游戏可持续经营的基本条件')),
    li(b('次日留存/7日留存：'), t('衡量游戏品质的核心指标。次留>40%视为优质，次留<20%产品可能有问题')),
    li(b('月流水（MR）：'), t('所有玩家当月付费总额。王者荣耀月流水约40-60亿元（旺季），是全球收入最高的单款游戏之一')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('二、市场规模'),
    li(b('2024年中国游戏市场销售收入：'), t('3257.83亿元，同比+7.53%（来源：中国音数协/CADPA 2024年中国游戏产业报告）')),
    li(b('2025年中国游戏市场预估：'), t('超3508亿元（501亿美元），同比+7.68%（来源：CADPA/Newzoo）')),
    li(b('移动游戏占比：'), t('73.29%，是绝对主力；PC游戏22.28%；主机游戏占比小但增速最快（+86.33%）')),
    li(b('海外市场：'), t('2025年中国游戏海外收入204.5亿美元，同比+10.23%。主要市场：美国32.31%、日本16.35%（来源：CADPA 2025年报告）')),
    li(b('全球市场规模：'), t('2025年全球游戏市场3604.3亿美元，亚太地区1661.9亿美元占46.11%；中国是亚太最大单一市场')),
    li(b('小游戏：'), t('2025年微信小游戏市场规模预计突破610亿元，是增速最快的细分赛道')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('三、竞争格局'),
    h2('3.1 市场结构：双寡头+独立游戏崛起'),
    p(t('腾讯（47.5%份额）+网易（17.2%份额）CR2=64.7%，牢牢控制中国游戏市场超六成份额（来源：2024年移动游戏市场研究报告）。第一梯队（年收入100亿+）还包括米哈游、三七互娱、世纪华通。')),
    p(t('2024年最大变化：《黑神话悟空》（游戏科学）和《Marvel Rivals》（网易旗下第二工作室NetEase Games）证明中国游戏研发已达全球顶级水平，掀起「国产3A游戏」讨论。')),
    h2('3.2 主要玩家竞争矩阵'),
  ]);

  await writeTable(objToken,
    ['公司', '市场份额/规模', '核心产品', '竞争优势', '海外布局'],
    [
      ['腾讯游戏', '47.5%（国内移动游戏）', '王者荣耀/和平精英/DNF', '最大用户基础+微信入口+全球收购', '全球工作室收购（Riot/Supercell/Epic股权）'],
      ['网易游戏', '17.2%（国内移动游戏）', 'Marvel Rivals/逆水寒/蛋仔派对', '研发能力强+自研IP丰富', 'Marvel Rivals全球爆款（2024年Q4）'],
      ['米哈游', '第一梯队(100亿+)', '原神/崩坏：星穹铁道/绝区零', '全球化精品策略+二次元核心圈', '全球月流水超10亿元，日本/美国强势'],
      ['三七互娱', '第一梯队(100亿+)', '斗罗大陆/寻道大千（小游戏）', '发行能力强+小游戏布局领先', '海外发行经验丰富'],
      ['游戏科学', '新晋顶级', '黑神话：悟空', '首款国产3A，首月销量1800万套', '全球PC/主机同步发售'],
      ['莉莉丝游戏', '中等规模', 'AFK系列/万国觉醒', '出海策略领先，全球化收入超国内', '北美/欧洲市场深度运营'],
    ]
  );
  await sleep(400);

  await writeBlocks(objToken, [
    h2('3.3 腾讯游戏的特殊地位'),
    p(t('腾讯游戏的护城河不仅来自「王者荣耀」等爆款IP，更来自其全球收购战略：持有Riot Games（英雄联盟/Valorant）100%股权、Supercell（部落冲突）84%股权、Epic Games（堡垒之夜引擎）40%股权。这意味着腾讯的游戏收入横跨全球，任何一款全球爆款都可能是腾讯收益。')),
    p(t('但腾讯游戏的隐患在于「王者荣耀」老化——2024年王者荣耀国内流水同比下滑，需要新爆款填补。腾讯开放平台（微信游戏）是新增量，但抽成较低、培育周期长。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('四、行业发展趋势（2025-2027）'),
    h2('趋势一：出海是未来最大增量'),
    p(t('事实依据：2025年中国游戏海外收入204.5亿美元（+10.23%），且前100移动游戏中SLG策略类占49.97%，中国游戏在全球SLG细分市场是毋庸置疑的霸主（来源：CADPA/Sensor Tower）。')),
    p(t('趋势判断：国内市场存量博弈激烈，出海是中型游戏公司的生死线。能做出「文化本地化」产品（而非直接翻译）的公司才能在欧美日主流市场立足。Marvel Rivals是2024年最好的例子——网易将漫威IP+团队射击玩法完美结合，首周1000万玩家。')),
    h2('趋势二：AI加速游戏研发与个性化'),
    p(t('事实依据：腾讯/网易/米哈游均已公布AI辅助研发工具（AI生成美术资产、AI NPC对话、AI关卡生成）。网易「伏羲实验室」AI研究已商用于游戏内NPC行为和剧情生成。')),
    p(t('趋势判断：AI将使游戏研发成本下降30-50%（美术/音效/测试环节），但顶级创意导演仍是不可替代的核心资产。AI还将催生「永久更新」型游戏——内容无限生成，用户永不离开。')),
    h2('趋势三：主机游戏与3A游戏崛起'),
    p(t('事实依据：《黑神话悟空》2024年8月发布，首月销量1800万套，PS5版单日销量打破中国地区记录。中国主机游戏市场2025年增速+86.33%，是增速最快的子品类（来源：CADPA）。')),
    p(t('趋势判断：「中国能做3A游戏」的心智已打开，接下来会有更多大型工作室投入主机/PC高品质项目。但国内主机渗透率仍低（3%左右），出海才是3A项目的核心市场。')),
    h2('趋势四：小游戏/超休闲游戏持续高增'),
    p(t('事实依据：2025年微信小游戏市场超610亿元，《寻道大千》（三七互娱）等小游戏月流水超3亿元。小游戏「零安装门槛+社交裂变」在下沉市场获客成本极低。')),
    p(t('趋势判断：小游戏将从「游戏外围」进入主流视野，并向中度游戏延伸。腾讯从小游戏抽取收入的能力持续增强，这是微信生态最重要的新变现方式。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('五、主要玩家近期动态'),
    h2('5.1 腾讯游戏'),
    li(b('2025年Q4游戏收入：'), t('567亿元，同比+15%（来源：腾讯2025年Q4财报）。国内游戏收入受益于《无畏契约》（Valorant国服）和《王者荣耀》新赛季；国际游戏收入受Riot/Supercell旗下产品拉动')),
    li(b('微信小游戏：'), t('2025年微信小游戏用户超5亿，月活超1亿。腾讯正在打造「小游戏生态联盟」，拉拢更多中小研发商')),
    li(b('出海战略：'), t('通过Level Infinite品牌（腾讯游戏海外发行）在欧美市场建立品牌认知。《PUBG Mobile》全球累计下载超10亿次，是中国出海最成功的单款游戏')),
    li(b('版号管控：'), t('国内游戏版号审批趋严，腾讯单月可获版号数量有限，推动腾讯将更多精力投入海外市场和小游戏（无需版号）')),
    h2('5.2 网易游戏'),
    li(b('2025年全年财报：'), t('总营收1126亿元(+6.9%)，游戏业务921亿元(+10.1%)（来源：网易2025年全年财报，2026年3月）')),
    li(b('Marvel Rivals爆款：'), t('2024年12月发布，首周玩家突破1000万，上市后持续位居Steam畅销榜前五。证明网易能打造全球竞技游戏爆款——这是此前网易最大的市场担忧（研发能力是否能出口）')),
    li(b('蛋仔派对：'), t('2024年春节活动日活破4000万，是国内休闲派对游戏最大产品；依托网易游戏基础设施，LTV极高')),
    li(b('海外布局：'), t('北美收购Quantic Dream（底特律：变人开发商），拓展高质量叙事游戏储备；日本设立研发工作室，专注二次元RPG本地化')),
    h2('5.3 米哈游'),
    li(b('原神：'), t('2024年全球月流水稳定在8-12亿元人民币区间（Sensor Tower估算）。公会功能+世界探索+新角色迭代保持用户活跃度。全球玩家超1亿注册账号')),
    li(b('崩坏：星穹铁道：'), t('2023年发布后成为米哈游第二款全球爆款，月流水峰值超原神；日本/韩国市场表现尤其强劲')),
    li(b('绝区零：'), t('2024年发布，都市动作RPG新品类，首月流水超2亿美元。米哈游三款产品同时保持月亿元+流水，是中国游戏公司最惊人的成就之一')),
    h2('5.4 游戏科学（黑神话悟空）'),
    li(b('2024年8月发布：'), t('首款国产3A游戏，售价约70美元/套，首月销量超1800万套，流水超12亿美元。TGA 2024年度游戏提名')),
    li(b('PS5版本：'), t('PS5版2025年初发布，中国地区单日销量记录刷新。证明国内有3A主机游戏市场')),
    li(b('影响：'), t('掀起「国产3A游戏」投资热潮，多家大型游戏公司宣布重型主机游戏研发计划；游戏科学获腾讯追加投资')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('六、公司年报深度拆解'),
    h2('6.1 网易 2025年全年财报（2026年3月发布）'),
    li(b('总营收：'), t('1126亿元，同比+6.9%')),
    li(b('游戏业务：'), t('921亿元，同比+10.1%。Marvel Rivals国际版带动海外游戏收入高速增长。手游端《蛋仔派对》和《逆水寒》是国内收入主力')),
    li(b('有道教育：'), t('持续贡献稳定收入，AI教育产品（有道AI学习助手）是新增长点；但体量相对游戏主业较小')),
    li(b('网易云音乐：'), t('2024年继续盈利，月活用户2亿+；音乐版权成本压力减轻，利润率改善')),
    quote(t('投资逻辑：Marvel Rivals的全球爆款打破了市场对「网易无法做全球竞技游戏」的预期折价。下一催化剂：原神竞品《燕云十六声》全球上线（2025年）是否能复制米哈游成功路径。')),
    h2('6.2 腾讯游戏业务解读（来自腾讯2025年Q4财报）'),
    li(b('Q4游戏收入：'), t('567亿元，同比+15%。国内游戏收入+14%（受益于新品和存量IP更新）；国际游戏收入+16%（Riot Games和Supercell表现强劲）')),
    li(b('全年游戏收入：'), t('估算约1900-2100亿元（腾讯未单独披露，含国内外游戏，2025年全年数据）。腾讯游戏收入全球第一')),
    li(b('战略看点：'), t('腾讯2025年游戏战略重点：（1）微信小游戏平台化（从流量变现到生态建设）；（2）国际收购整合（已有Riot/Supercell/Epic股权）；（3）AI赋能研发效率')),
    quote(t('投资逻辑：腾讯游戏是全球规模最大的游戏业务，但「王者荣耀」老化是持续压力。关注新爆款（无畏契约国服/新IP）是否能填补存量流水下滑。腾讯整体估值较低（P/E 15-18x），游戏+广告双引擎是核心价值来源。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('七、求职视角：游戏赛道商科岗位分析'),
    h2('7.1 核心岗位地图'),
    li(b('游戏运营（活动策划/用户运营）：'), t('设计游戏内活动（节日活动/联名活动/赛季更新），提升用户活跃度和付费率。需要深度理解玩家心理和游戏内经济系统。腾讯/网易/米哈游均有大量HC')),
    li(b('商业化策划：'), t('设计付费体系（皮肤定价/抽卡概率/礼包设计），核心是「最大化付费用户ARPPU而不流失玩家」。对博弈论、行为经济学有一定要求')),
    li(b('数据分析师：'), t('游戏行业数据岗位质量高——用户行为数据极丰富（每次点击都有记录），分析维度包括留存/付费/渠道/A-B测试。SQL+Python是必备')),
    li(b('发行/出海运营：'), t('负责游戏在特定区域（北美/东南亚/日本）的推广、应用市场优化（ASO）、社区运营。出海经验+英语/日语能力溢价显著')),
    li(b('投资研究（游戏板块）：'), t('覆盖腾讯/网易/米哈游（未上市）/三七互娱等，核心能力是月流水数据追踪和新品上线预期差分析')),
    h2('7.2 面试高频问题'),
    h3('Q1：如何判断一款新游戏是否值得投入市场推广资源？'),
    quote(t('问题本质：考察游戏产品判断力和商业化思维')),
    li(b('第一步（产品质量判断）：'), t('次日留存（Benchmark：40%+为优质）、7日留存（25%+）、玩家评价关键词分析。这些数据在「软上线」（灰度测试）阶段可获得，决策先于大规模买量')),
    li(b('第二步（市场空间判断）：'), t('品类市场天花板（SLG/角色扮演/休闲各有不同）、竞品现状（是否有霸主、是否有差异化空间）、目标用户付费能力')),
    li(b('第三步（ROI测算）：'), t('预期CAC（获客成本，基于类似品类历史数据）vs 预期LTV（付费率×ARPPU×平均生命周期）。LTV/CAC > 3是健康门槛')),
    li(b('结论：'), t('留存数据好+品类空间大+ROI测算可行 → 值得大规模投放。任何一项不达标都需要先优化产品或重新定位市场')),
    h3('Q2：中国游戏出海为什么在SLG品类特别成功？'),
    quote(t('问题本质：考察行业认知深度和商业洞察')),
    li(b('SLG产品特点：'), t('策略类游戏（如《万国觉醒》/《率土之滨》）用户生命周期极长（2-5年），ARPPU极高（重度鲸鱼用户单人消费数万元），适合在海外成熟市场高价格带运营')),
    li(b('中国公司优势：'), t('中国厂商经历了国内残酷的用户运营竞争，把活动策划、付费体系设计、公会经济打磨至极致，直接移植海外效果更好')),
    li(b('文化穿透力：'), t('SLG游戏核心是「称霸世界」+「联盟合作」，这个主题的文化普适性强，不需要深度本地化即可吸引全球玩家')),
    li(b('结论：'), t('SLG是中国游戏出海最成功的品类，因为它恰好契合中国公司的运营强项+产品品类的全球文化普适性。未来需要警惕TikTok禁令类似的监管风险对海外运营的冲击')),
    hr(),
    quote(t('数据来源：中国音数协/CADPA《2024年中国游戏产业报告》、CADPA《2025年中国游戏产业报告》、网易2025年全年财报(2026.3)、腾讯2025年Q4财报、Sensor Tower、Newzoo全球游戏市场报告')),
  ]);

  console.log('\n✅ 游戏赛道深度报告写入完成！');
  console.log(`🔗 https://${DOMAIN}/wiki/${nodeToken}`);
}

main().catch(console.error);
