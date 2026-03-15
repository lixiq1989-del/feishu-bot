/**
 * 🤖 互联网赛道深度报告：大模型与AI应用（独立页）
 * 数据来源：百度/阿里/字节财报、QuestMobile、信通院
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
    const req = https.request({ hostname: 'open.feishu.cn', path: urlPath, method,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}`, 'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }, rejectUnauthorized: false,
    }, res => { let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(d.slice(0, 300))); } }); });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}
async function createNode(title: string): Promise<{ nodeToken: string; objToken: string }> {
  const r = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', parent_wiki_token: PARENT_TOKEN, node_type: 'origin', title });
  if (r?.code !== 0) throw new Error(`createNode failed: ${r?.code} ${r?.msg}`);
  return { nodeToken: r.data.node.node_token, objToken: r.data.node.obj_token };
}
async function writeBlocks(objToken: string, blocks: any[]): Promise<void> {
  for (let i = 0; i < blocks.length; i += 50) {
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, { children: blocks.slice(i, i + 50) });
    if (r?.code !== 0) console.error(`  ❌ blocks[${i}]: ${r?.code} ${r?.msg}`);
    if (i + 50 < blocks.length) await sleep(500);
  }
}
async function writeTable(objToken: string, headers: string[], rows: string[][]): Promise<void> {
  const numRows = rows.length + 1, numCols = headers.length;
  const tableRes = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`,
    { children: [{ block_type: 31, table: { property: { row_size: numRows, column_size: numCols } } }] });
  if (tableRes?.code !== 0) { console.error('  ❌ 表格:', tableRes?.code, tableRes?.msg); return; }
  const cellIds: string[] = tableRes.data?.children?.[0]?.children ?? [];
  const allContent = [headers, ...rows];
  for (let idx = 0; idx < cellIds.length; idx++) {
    const rowIdx = Math.floor(idx / numCols), colIdx = idx % numCols;
    const content = allContent[rowIdx]?.[colIdx] ?? '';
    if (!content) continue;
    await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${cellIds[idx]}/children`,
      { children: [p(rowIdx === 0 ? b(content) : t(content))] });
    await sleep(110);
  }
  console.log(`  ✓ 表格 ${numRows}×${numCols}`);
}

async function main() {
  console.log('📝 写入：大模型与AI应用深度报告...\n');
  const { nodeToken, objToken } = await createNode('🤖 大模型与AI应用：赛道深度报告（2024-2025）');
  console.log(`  ✅ ${nodeToken}\n  🔗 https://${DOMAIN}/wiki/${nodeToken}`);
  await sleep(800);

  await writeBlocks(objToken, [
    p(b('赛道定位：'), t('大模型/AI应用是2024-2026年中国互联网最热的赛道——没有之一。2026年2月中国大模型周调用量达5.16万亿Token，全球占比61%，首次超过美国。字节豆包MAU 3.15亿、阿里通义千问MAU 2.03亿、DeepSeek MAU 1.94亿——C端AI应用已进入「亿级用户」时代。互联网大厂纷纷将AI定义为「公司级战略」，投入规模空前。')),
    p(b('核心逻辑：'), t('AI大模型的商业化路径：C端（面向消费者的AI助手/搜索）通过「免费拉量+订阅变现」、B端（面向企业的AI云服务）通过「API调用+行业解决方案」变现。当前阶段所有大厂仍在烧钱抢占用户心智（2025年春节红包大战合计投入100亿+），商业化尚处早期。')),
    p(b('适合商科岗位：'), t('AI产品经理（C端AI应用/B端AI解决方案）、商业分析师（AI ROI/用户增长分析）、战略分析（AI投资/并购）、AI销售/解决方案顾问（B端）、投资研究员（AI赛道）')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('一、行业基本概念'),
    h2('1.1 大模型是什么？'),
    p(t('大语言模型（LLM）是基于Transformer架构、通过海量文本数据训练的AI系统，能够理解和生成自然语言。核心能力包括：对话（ChatGPT/豆包）、代码生成（Copilot）、图像生成（Midjourney/DALL-E）、视频生成（Sora/可灵）、搜索增强（Perplexity/DeepSeek）等。')),
    p(t('中国大模型「百模大战」从2023年开始，2025年进入淘汰赛——存活的核心玩家集中在字节、阿里、百度、腾讯、DeepSeek、月之暗面（Kimi）等。创业公司多数已被淘汰或被收购。')),
    h2('1.2 产业链结构'),
    li(b('基础设施层（算力）：'), t('GPU芯片（NVIDIA A100/H100，中国受出口管制）、智算中心（各地政府+大厂建设）。中国2024年智能算力达725.3 EFLOPS(+74.1%)，但上架率不足60%，存在结构性错配（来源：信通院）')),
    li(b('模型层（大模型本体）：'), t('基础大模型（GPT-4o/Claude/DeepSeek-V3/通义千问3.0）。第一梯队：百度文心4.5/5.0、通义千问2.5/3.0、字节豆包/云雀')),
    li(b('应用层（面向用户/企业）：'), t('C端AI应用（豆包/文心一言/通义千问App）、B端AI解决方案（AI客服/AI质检/AI编程/AI营销）。应用层是商业化的主要落脚点')),
    h2('1.3 核心商业模式'),
    h3('C端：免费+订阅'),
    p(t('豆包/DeepSeek免费使用（靠广告+增值服务变现），通义千问/文心一言有Pro付费版（约20-30元/月）。2025年C端AI应用付费率仍极低（<5%），核心在于先占用户再想变现。中国AI厂商2025年春节红包营销合计投入超100亿元（阿里60亿+字节15-20亿+腾讯10亿+百度5亿）——全部用于C端拉新。')),
    h3('B端：API + 行业解决方案'),
    p(t('企业按API调用量付费（按Token计费），或购买行业定制解决方案（如AI客服/AI质检/AI营销）。阿里通义千问已落地30+行业，零售供应链效率提升40%、制造质检成本降35%（来源：阿里云报告）。B端是AI赚钱的主要来源，但销售周期长、定制化程度高。')),
    h3('云计算绑定'),
    p(t('AI模型训练/推理都需要大量算力，绑定云服务是大厂AI变现的重要路径。阿里云AI相关收入高速增长，百度智能云Q4同比+143%。「卖铲子」（AI+云）比「挖金子」（AI应用本身）可能更赚钱。')),
    h2('1.4 必背核心指标'),
    li(b('MAU/DAU：'), t('月/日活跃用户数。豆包MAU 3.15亿（2026年初），通义千问2.03亿，DeepSeek 1.94-2.6亿')),
    li(b('Token调用量：'), t('2026年2月中国大模型周调用量5.16万亿Token，全球占比61%，首超美国（来源：什么值得买/信通院）')),
    li(b('推理成本（$/M tokens）：'), t('AI模型处理每百万Token的成本。DeepSeek以极低推理成本（$0.14/M tokens输入）震惊行业，比GPT-4o便宜100倍+')),
    li(b('开源下载量：'), t('通义千问开源模型下载3710万次，衍生超20万个模型。开源是中国AI差异化竞争策略')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('二、市场规模'),
    li(b('全球大模型市场：'), t('2024年超1800亿美元，中国占比超35%（来源：腾讯云开发者社区）')),
    li(b('中国AI大模型C端：'), t('2025年主要AI应用合计MAU超10亿（去重后约5亿独立用户）。商业化处于早期，付费用户占比<5%')),
    li(b('中国AI云/智算：'), t('百度智能云AI相关收入2025年约300亿元(+34%)，阿里云AI收入高速增长。AI是云计算行业最大增量')),
    li(b('算力基础设施：'), t('中国2024年智能算力725.3 EFLOPS(+74.1%)。阿里宣布未来三年投入超3800亿元于云/AI基础设施（来源：阿里2025年报告）')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('三、竞争格局'),
    h2('3.1 中国AI大模型第一梯队'),
  ]);

  await writeTable(objToken,
    ['公司/产品', 'MAU（2026初）', '核心模型', '差异化定位', '商业化路径'],
    [
      ['字节豆包', '3.15亿', '豆包/云雀', 'AI+内容（抖音/剪映整合）', 'C端流量→广告/增值服务'],
      ['阿里通义千问', '2.03亿(+553%)', '通义千问3.0', 'AI+电商+云（行业落地最广）', 'B端API+阿里云绑定'],
      ['DeepSeek', '1.94-2.6亿', 'DeepSeek-V3/R1', '极低成本+开源+推理优化', '开源生态+API服务'],
      ['百度文心', '887万(独立)/2亿+(助手)', '文心4.5/5.0', 'AI+搜索+工业质检', '百度App内嵌+智能云'],
      ['腾讯混元/元宝', '日活4054万(春节)', '混元大模型', 'AI+社交+企业（微信生态）', '腾讯云+企业微信'],
      ['月之暗面(Kimi)', '约5000万', 'Kimi/Moonshot', '长文本处理+学术搜索', 'C端订阅+API'],
    ]
  );
  await sleep(400);

  await writeBlocks(objToken, [
    h2('3.2 DeepSeek现象'),
    p(t('DeepSeek（深度求索）是2025年最受关注的中国AI公司。核心突破：以极低训练成本（传闻仅$600万，远低于GPT-4o的$100M+）训练出接近顶尖水平的大模型。DeepSeek-V3推理成本为$0.14/M tokens输入，比GPT-4o便宜100倍+。这一成本优势震惊全球，被称为「AI的拼多多时刻」。')),
    p(t('DeepSeek的意义：（1）证明中国AI即使在芯片受限条件下也能通过算法创新追赶前沿；（2）将AI推理成本拉到极低，加速B端企业AI落地（用得起了）；（3）引发全球AI股市波动——NVIDIA市值一度蒸发超$5000亿。')),
    h2('3.3 字节豆包为什么是用户量第一？'),
    p(t('字节的优势：（1）抖音/剪映的巨大用户基础直接导流——用户在剪映中用AI生成字幕/特效，在抖音中用AI搜索；（2）「AI+内容」场景天然契合短视频生态；（3）字节推荐算法积累的海量用户数据使AI个性化效果更好；（4）春节红包15-20亿元投入获客。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('四、行业发展趋势（2025-2027）'),
    h2('趋势一：从「百模大战」到「Agent时代」'),
    p(t('事实依据：2025年AI行业关键词从「大模型」转向「AI Agent」——能自主规划、执行多步骤任务的AI系统。所有大厂（字节/阿里/腾讯/百度）均已发布Agent开发平台。Agent将从「AI助手」升级为「AI员工」，自动完成数据分析、客服、内容创作等工作。')),
    h2('趋势二：开源vs闭源——中国走开源路线'),
    p(t('事实依据：通义千问开源模型下载3710万次，DeepSeek完全开源。中国AI与美国AI的最大战略差异：中国大厂普遍选择开源（扩大生态）而非闭源（锁定用户）。开源降低B端客户门槛，加速行业采用，同时通过云计算/API变现。')),
    h2('趋势三：推理成本崩塌→AI全面普及'),
    p(t('事实依据：DeepSeek将推理成本降至$0.14/M tokens，通义千问/百度也在跟进降价。推理成本下降意味着：（1）更多中小企业用得起AI；（2）AI应用场景从高价值任务（翻译/编程）扩展到低价值高频次任务（客服/数据录入）；（3）AI渗透率从<5%向50%+迈进。')),
    h2('趋势四：AI+硬件（端侧AI）'),
    p(t('事实依据：2025年AI PC渗透率38%，AI手机渗透率50%（来源：信通院）。端侧AI（在手机/PC本地运行AI模型，无需云端）将减少对云AI的依赖，同时创造新场景（实时翻译/离线AI助手/智能摄影）。对云厂商是挑战，对芯片厂商（高通/联发科/苹果）是机会。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('五、主要玩家近期动态'),
    h2('5.1 字节跳动 — 豆包'),
    li(b('MAU 3.15亿：'), t('全球第二大AI应用（仅次于ChatGPT约4亿MAU），春节前后日活峰值1.45亿，单月新增2700万')),
    li(b('AI+内容生态：'), t('剪映AI（自动字幕/特效/文生视频）+ 抖音AI搜索 + 豆包对话。字节的AI战略核心是「让AI无处不在地融入已有产品」')),
    li(b('火山引擎：'), t('字节云计算/AI平台，面向B端提供大模型API和AI应用开发工具。在云计算市场份额约15%（第二梯队）')),
    h2('5.2 阿里巴巴 — 通义千问'),
    li(b('MAU 2.03亿(+553%)：'), t('增速最快的AI应用，受益于春节红包60亿元营销投入。2026年2月全球第三大AI应用')),
    li(b('B端落地最广：'), t('已落地30+行业，标杆案例：零售供应链效率提升40%、制造质检成本降35%。开源模型下载3710万次，衍生超20万个模型')),
    li(b('3800亿投资：'), t('阿里宣布未来三年投入超3800亿元于云/AI基础设施——这是中国AI最大的单一投资承诺')),
    h2('5.3 百度 — 文心一言'),
    li(b('独立App MAU 887万（大幅下滑）：'), t('文心一言独立App用户急剧萎缩，但「百度App AI助手」（嵌入式）用户超2亿。百度策略从独立AI App转向「AI融入百度搜索」')),
    li(b('AI+搜索：'), t('百度搜索页面嵌入AI生成答案，质检准确率99.5%。但面临DeepSeek/豆包等AI搜索的直接竞争')),
    li(b('百度智能云：'), t('2025年AI云收入300亿元(+34%)，Q4同比+143%。AI是百度转型的核心——从广告公司变为AI云公司')),
    h2('5.4 DeepSeek'),
    li(b('1.94-2.6亿MAU：'), t('2025年AI搜索领域用户量第一。完全开源+极低成本的策略吸引了大量开发者和企业用户')),
    li(b('技术突破：'), t('DeepSeek-V3在多项基准测试中达到GPT-4o水平，推理成本低100倍+。引发全球AI行业对「中国AI效率」的重新评估')),
    li(b('商业化路径：'), t('API调用服务（按Token计费）+ 企业定制解决方案。开源策略类似「先让所有人用，再从头部客户收费」')),
    h2('5.5 腾讯 — 混元/元宝'),
    li(b('混元大模型：'), t('春节日活4054万（元宝App），在大模型排名中居第一梯队。腾讯AI策略更偏B端（企业微信AI/腾讯云AI）')),
    li(b('AI+社交：'), t('微信AI助手（内测中）、企业微信AI客服、腾讯会议AI纪要。腾讯的AI落地优势在于12亿微信用户的社交场景')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('六、求职视角：AI赛道商科岗位'),
    h2('6.1 核心岗位'),
    li(b('AI产品经理：'), t('2025年最热门PM岗位。C端AI PM负责用户体验/功能迭代/增长（类似互联网PM），B端AI PM负责行业解决方案设计/客户需求分析。不需要会写代码，但需要理解AI能力边界和prompt engineering')),
    li(b('AI解决方案顾问/销售：'), t('向企业客户推介AI解决方案（AI客服/AI质检/AI营销），帮助客户做POC（概念验证）和ROI测算。薪资高于传统IT销售20-30%，核心在于既懂业务又懂技术')),
    li(b('商业分析师（AI方向）：'), t('分析AI产品的用户增长/留存/付费转化数据，评估不同AI功能的ROI。需要SQL+Python+对AI产品逻辑的深度理解')),
    li(b('战略分析/投资研究：'), t('评估AI赛道投资机会、竞争格局演变、技术路线判断。TMT投研团队对AI方向研究员需求极大，核心能力是快速学习+深度分析+行业人脉')),
    h2('6.2 面试高频问题'),
    h3('Q1：DeepSeek为什么能以极低成本训练出接近GPT-4o的模型？'),
    li(b('算法创新：'), t('MoE（混合专家模型）架构——模型参数虽大（671B），但推理时只激活一小部分参数，大幅降低计算量')),
    li(b('工程优化：'), t('极致的显存优化和并行训练策略，在有限GPU（传闻约2000张H800）上实现高效训练')),
    li(b('数据质量：'), t('更注重高质量训练数据筛选（数据质量>数据数量），减少了无效训练的算力浪费')),
    li(b('商业启示：'), t('AI竞争不仅是「谁有更多GPU」，更是「谁能更聪明地使用GPU」。DeepSeek证明算法创新可以弥补硬件劣势，这对中国AI在芯片受限环境下的竞争策略意义重大')),
    h3('Q2：AI大模型的商业化为什么这么难？'),
    li(b('C端问题：'), t('用户愿意用免费AI，但不愿意付费（付费率<5%）。AI助手的「替代性」太强——用户可以随时切换到另一个免费AI')),
    li(b('B端问题：'), t('企业AI落地需要深度定制（每个行业/公司的数据和流程不同），标准化产品难以满足需求。销售周期长（6-12个月），但LTV高')),
    li(b('成本问题：'), t('训练一次大模型需要数千万美元GPU算力，而收入远不能覆盖。目前所有中国AI大模型公司都在烧钱，盈利时间点不确定')),
    li(b('破局方向：'), t('AI+云绑定（卖算力比卖AI更赚钱）、Agent自动化（让AI替代人工完成高价值任务）、行业垂直化（医疗AI/金融AI/法律AI收费更高）')),
    hr(),
    quote(t('数据来源：QuestMobile/信通院2026年报告、百度2025年全年财报(2026.2)、腾讯2025年Q4财报、阿里巴巴投资公告、DeepSeek技术论文、各公司官方公告')),
  ]);

  console.log('\n✅ 大模型与AI应用深度报告写入完成！');
  console.log(`🔗 https://${DOMAIN}/wiki/${nodeToken}`);
}
main().catch(console.error);
