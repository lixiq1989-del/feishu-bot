/**
 * 📢 互联网赛道深度报告：广告与商业化（独立页）
 * 数据来源：QuestMobile 2025/2026年报告、腾讯/百度/字节财报
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
    const chunk = blocks.slice(i, i + 50);
    const r = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, { children: chunk });
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
  console.log('📝 写入：广告与商业化深度报告...\n');
  const { nodeToken, objToken } = await createNode('📢 广告与商业化：赛道深度报告（2024-2025）');
  console.log(`  ✅ ${nodeToken}\n  🔗 https://${DOMAIN}/wiki/${nodeToken}`);
  await sleep(800);

  await writeBlocks(objToken, [
    p(b('赛道定位：'), t('广告是中国互联网最核心的变现方式——2025年中国互联网广告市场规模7930.8亿元(+4.6%)。几乎所有互联网巨头的核心利润来源都是广告（字节跳动估算80%+收入来自广告，腾讯35%+，百度60%+，阿里40%+）。理解「广告与商业化」等于理解整个中国互联网的盈利逻辑。')),
    p(b('核心逻辑：'), t('互联网广告的本质是「用户注意力的定价与交易」。平台通过内容/服务获取用户时长（注意力），将注意力打包成广告位出售给品牌/商家。算法越精准，广告ROI越高，广告主越愿意出高价——这就是为什么AI正在重塑整个广告行业。')),
    p(b('适合商科岗位：'), t('商业化产品经理（广告系统设计）、广告销售（KA/SMB）、效果优化师、数据分析师（广告ROI分析）、程序化广告运营、品牌策略')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('一、行业基本概念'),
    h2('1.1 广告类型分类'),
    h3('按付费方式'),
    li(b('CPM（千次曝光计费）：'), t('品牌广告主流计费方式。品牌为1000次广告展示支付固定价格。抖音开屏广告CPM约100-300元，高端位置可达500元+')),
    li(b('CPC（按点击计费）：'), t('效果广告核心计费方式。广告主为每次点击支付费用。百度搜索广告平均CPC约2-5元，竞争激烈关键词可达50元+')),
    li(b('CPA（按转化计费）：'), t('广告主按实际转化（下载/注册/购买）付费。风险由平台承担，但平台需要极强的算法能力来保证转化效率')),
    li(b('OCPM（智能出价）：'), t('2024年最主流模式——广告主设定目标CPA，平台用AI自动优化出价和投放人群。字节巨量引擎和腾讯广告均以OCPM为核心')),
    h3('按广告形式'),
    li(b('信息流广告：'), t('嵌入在内容信息流中的广告（抖音视频流/微信朋友圈/微博首页）。是目前中国互联网广告最大的细分形式，占比超40%')),
    li(b('搜索广告：'), t('用户搜索关键词时展示的广告（百度搜索/淘宝搜索/抖音搜索）。搜索广告的优势是「用户意图明确」，转化率最高')),
    li(b('开屏广告：'), t('App启动时全屏展示的品牌广告。CPM最高但用户体验最差，正在被限制（工信部要求提供跳过按钮）')),
    li(b('视频广告（贴片/中插）：'), t('长视频平台（爱奇艺/腾讯视频）的核心广告形式。B站拒绝贴片广告以维护用户体验，选择了另一条变现路径')),
    h2('1.2 广告产业链'),
    li(b('广告主（Advertiser）：'), t('品牌主/商家/APP开发者。2025年汽车/游戏/电商是广告投放量最大的三个行业（来源：QuestMobile）')),
    li(b('代理商/4A公司：'), t('帮助广告主做策划和投放执行（WPP/阳狮/宏盟/中国本土代理）。AI自动化正在削弱代理商的价值——广告主越来越倾向直接在平台自助投放')),
    li(b('广告平台/DSP：'), t('字节巨量引擎、腾讯广告（AMS）、阿里妈妈、百度凤巢——四大广告平台瓜分中国80%+互联网广告预算')),
    li(b('SSP/媒体方：'), t('提供广告位的App/网站。穿山甲（字节旗下，联盟广告）、优量汇（腾讯旗下）是最大的广告联盟')),
    h2('1.3 必背核心指标'),
    li(b('eCPM（有效千次展示成本）：'), t('平台视角最核心指标。eCPM = 广告收入 / 展示次数 × 1000。越高代表广告变现效率越好。抖音信息流eCPM约80-150元，行业领先')),
    li(b('ROAS（广告支出回报率）：'), t('广告主视角最核心指标。ROAS = 广告带来的收入 / 广告花费。ROAS > 1代表赚钱，>3代表优秀投放效果')),
    li(b('CTR（点击率）：'), t('广告展示后被点击的比例。信息流广告平均CTR约1-3%，搜索广告3-8%')),
    li(b('CVR（转化率）：'), t('点击广告后完成目标行为的比例。电商广告平均CVR约2-5%（点击→购买）')),
    li(b('Fill Rate（填充率）：'), t('可用广告位中实际展示广告的比例。>90%代表广告需求旺盛')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('二、市场规模'),
    li(b('2025年中国互联网广告市场：'), t('7930.8亿元，同比+4.6%（来源：QuestMobile 2026年报告）')),
    li(b('全球互联网广告市场：'), t('2024年约3663亿美元（约2.6万亿人民币），CAGR 11.8%至2032年（来源：Business Research Insights）')),
    li(b('效果广告 vs 品牌广告：'), t('效果广告约占75%（5950亿元），品牌广告约占25%（1980亿元）。效果广告占比持续提升，品牌广告承压')),
    li(b('广告行业投放增速：'), t('2025年汽车行业广告同比+28%，游戏行业+35%，AI行业广告同比翻倍，是增速最快的新兴行业（来源：QuestMobile）')),
    h2('各平台广告收入估算'),
  ]);

  await writeTable(objToken,
    ['平台', '2025年广告收入（估算）', '同比增速', '核心广告产品', '数据来源'],
    [
      ['字节跳动', '约4000-4500亿元', '+15-20%', '巨量引擎/千川/穿山甲', '媒体估算（未上市）'],
      ['阿里妈妈', '约2500-2800亿元', '+5-8%', '直通车/万相台/UD', '阿里财报推算'],
      ['腾讯广告', '约1200亿元', '+17%', '微信广告/视频号广告/优量汇', '腾讯2025年Q4财报'],
      ['百度', '约700亿元', '-5%', '凤巢搜索广告/百度联盟', '百度2025年全年财报'],
      ['快手', '约600亿元', '+15%', '磁力引擎/电商广告', '快手2024年全年财报推算'],
      ['B站', '约100亿元', '+23%', '花火平台/效果广告', 'B站2025年全年财报'],
    ]
  );
  await sleep(400);

  await writeBlocks(objToken, [
    hr(),
    h1('三、竞争格局'),
    h2('3.1 四大广告平台'),
    h3('字节巨量引擎——效果广告之王'),
    p(t('字节跳动的广告收入估算全球第三（仅次于Google和Meta），中国第一。巨量引擎覆盖抖音/今日头条/西瓜视频/番茄小说+穿山甲联盟，日触达用户超6亿。「千川」（直播电商广告系统）是2024年增速最快的广告产品——AI自动生成素材+自动出价+自动优化，中小商家零门槛投放。')),
    h3('腾讯广告——社交+视频号双引擎'),
    p(t('腾讯2025年Q4广告收入410亿元(+17%)，全年估算约1200亿元。增长主力是视频号广告——视频号广告加载率从2023年的1%提升至2025年的3%+，仍有巨大提升空间（抖音约8-12%）。微信朋友圈广告是中国eCPM最高的广告位之一（CPM约200-400元），但展示频次受限（每天2-3条）。')),
    h3('阿里妈妈——电商广告最大市场'),
    p(t('阿里妈妈占中国互联网广告25.6%份额（淘宝/天猫广告），是单一平台份额最大的广告主。电商广告的核心优势是「离交易最近」——用户搜索商品时点击广告，转化率远高于内容平台。但拼多多/抖音电商正在分食这一市场。')),
    h3('百度凤巢——搜索广告下滑'),
    p(t('百度2025年全年营收1291亿元(-3%)，广告收入约700亿元。搜索广告受AI搜索冲击（用户用DeepSeek/豆包搜索，不点百度广告），结构性下滑。百度将重心转向AI云（2025年AI云收入300亿元，+34%），广告已不是其主要增长引擎。')),
    h2('3.2 竞争新变量：AI广告自动化'),
    p(t('2024-2025年最重要的行业变化：AI正在让广告投放从「人工优化」变为「机器自动化」。巨量引擎「一键成片」系统：AI自动生成广告素材（视频/图文）→ 自动测试多版本 → 自动选择最优投放人群 → 自动调整出价。中小广告主不再需要代理商，直接在平台自助投放。')),
    p(t('影响：（1）代理商/4A公司的价值被削弱，利润空间压缩；（2）广告投放门槛降低，更多中小企业成为广告主，扩大了市场总量；（3）AI优化导致eCPM持续上升，平台受益、广告主成本上升。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('四、行业发展趋势'),
    h2('趋势一：AI广告革命'),
    p(t('事实依据：2025年AI行业广告投放同比翻倍（QuestMobile），大模型厂商（豆包/文心/通义）春节红包营销合计投入超100亿元。AI既是广告行业的客户（AI厂商买广告拉用户），也是广告行业的工具（AI优化广告投放效率）。')),
    h2('趋势二：视频号广告是最大增量'),
    p(t('事实依据：微信视频号广告加载率从1%提升至3%+，腾讯Q4广告收入410亿元(+17%)。对标抖音（8-12%加载率），视频号还有3-4倍的提升空间。视频号商业化是2025-2027年中国广告市场最大的增量来源。')),
    h2('趋势三：效果广告持续挤压品牌广告'),
    p(t('事实依据：效果广告占比已达75%。品牌广告主（汽车/奢侈品/快消）越来越要求「品效合一」（既要品牌曝光也要可量化转化），传统CPM品牌广告预算被压缩。分众传媒等纯品牌广告媒体面临长期下行压力。')),
    h2('趋势四：搜索广告被AI搜索蚕食'),
    p(t('事实依据：2025年全球AI搜索月活超6.3亿（DeepSeek 2.6亿领跑），零点击搜索占52%。用户在AI对话中获取答案，不再需要点击搜索结果中的广告链接。百度搜索广告已开始下滑，Google也面临类似压力。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('五、主要玩家近期动态'),
    h2('5.1 字节跳动/巨量引擎'),
    li(b('2025年战略：'), t('全面AI化——「一键成片」（AI生成广告素材）+「智能出价」（OCPM自动化）使中小广告主投放门槛趋零。巨量引擎广告预算正在从PC端全面转向移动端+直播间')),
    li(b('千川广告系统：'), t('抖音电商专属广告平台，2024年GMV贡献可观。核心能力：直播间实时流量分配+AI自动出价+素材自动化测试。是抖音电商生态最重要的基础设施')),
    h2('5.2 腾讯广告'),
    li(b('2025年Q4广告：'), t('410亿元，同比+17%。增长主力：（1）视频号信息流广告；（2）小程序/公众号广告复苏；（3）微信搜一搜广告起量')),
    li(b('视频号商业化：'), t('视频号广告加载率持续提升（3%+ vs 抖音8-12%），是腾讯未来3年广告收入最确定的增长引擎。2025年视频号广告年化收入预估超300亿元')),
    h2('5.3 百度'),
    li(b('2025年全年：'), t('总营收1291亿元(-3%)。传统搜索广告下滑，AI云收入300亿元(+34%)成为新增长点。百度已从「广告公司」转型为「AI公司」')),
    li(b('文心一言对广告的影响：'), t('百度尝试在AI对话中嵌入广告（AI搜索赞助答案），但用户体验与商业化的平衡仍在探索中。长期看，AI可能重塑搜索广告的形态')),
    h2('5.4 B站广告'),
    li(b('2025年广告收入100.6亿元(+23%)：'), t('B站拒绝贴片广告，选择效果广告（花火商业合作+信息流效果广告）作为变现路径。2025年首次全年盈利（净利11.9亿元），证明非贴片广告模式可以盈利')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('六、求职视角：广告赛道商科岗位'),
    h2('6.1 核心岗位'),
    li(b('商业化产品经理：'), t('设计广告系统（竞价机制/广告格式/出价策略/反作弊）。核心挑战：在用户体验和广告收入之间找到最优平衡点。字节/腾讯/百度均有大量HC，是最核心的商业化岗位')),
    li(b('广告销售（KA/SMB）：'), t('KA（大客户销售）负责对接品牌广告主（宝洁/欧莱雅/BBA），谈年度框架协议；SMB（中小客户）负责批量服务中小商家，推动自助投放工具使用。KA销售薪资上限极高（年薪100万+），SMB走管理晋升路径')),
    li(b('效果优化师：'), t('帮助广告主优化广告素材、出价策略、投放人群。需要深度理解各平台算法逻辑（巨量引擎/腾讯广告/阿里妈妈各不相同）。AI自动化正在替代部分优化师工作，但顶级优化师仍不可替代')),
    li(b('数据分析师（广告方向）：'), t('分析广告投放效果（eCPM/CTR/CVR/ROAS），发现优化空间，输出策略建议。需要SQL+Python+BI工具（Tableau/QuickBI），广告数据岗位数据量大、维度丰富，适合数据驱动型人才')),
    h2('6.2 面试高频问题'),
    h3('Q1：为什么抖音的广告变现效率高于微信？'),
    li(b('用户时长：'), t('抖音日均使用100分钟+ vs 微信聊天场景中广告展示机会少。用户「沉浸式刷」短视频提供了更多广告展示机会')),
    li(b('广告加载率：'), t('抖音信息流广告约每5-8条内容插入1条广告（加载率8-12%），微信朋友圈每天仅2-3条（加载率<1%）')),
    li(b('算法精准度：'), t('抖音推荐算法基于用户完播率/互动率精准画像，广告精准匹配度高于微信（微信更多依赖社交关系数据）')),
    li(b('总结：'), t('抖音「高时长×高加载率×高精准度」= 极高的广告变现效率。微信的策略是「克制商业化以保护用户体验」，长期看两种策略各有利弊')),
    hr(),
    quote(t('数据来源：QuestMobile 2026年中国互联网广告报告、腾讯2025年Q4财报、百度2025年全年财报(2026.2)、B站2025年全年财报(2026.3)、Business Research Insights')),
  ]);

  console.log('\n✅ 广告与商业化深度报告写入完成！');
  console.log(`🔗 https://${DOMAIN}/wiki/${nodeToken}`);
}
main().catch(console.error);
