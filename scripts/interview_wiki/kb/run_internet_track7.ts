/**
 * ☁️ 互联网赛道深度报告：云计算（独立页）
 * 数据来源：信通院云计算蓝皮书、Canalys、阿里/腾讯/百度财报、汇丰研究
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
  console.log('📝 写入：云计算深度报告...\n');
  const { nodeToken, objToken } = await createNode('☁️ 云计算：赛道深度报告（2024-2025）');
  console.log(`  ✅ ${nodeToken}\n  🔗 https://${DOMAIN}/wiki/${nodeToken}`);
  await sleep(800);

  await writeBlocks(objToken, [
    p(b('赛道定位：'), t('云计算是互联网企业的「基础设施」——所有数字化服务（从微信消息到AI大模型训练）都运行在云上。2024年全球云计算市场达6929亿美元(+20%)，中国公有云IaaS市场阿里云/华为云/腾讯云三巨头合计份额约60%（来源：Canalys 2025 Q1）。AI时代，云计算从「IT基础设施」升级为「AI算力平台」，迎来新一轮高速增长。')),
    p(b('核心逻辑：'), t('云计算的商业模式是「卖算力和服务」——企业不再自建服务器机房，而是按需租用云厂商的计算/存储/网络资源。AI大模型训练和推理需要海量GPU算力，使得「智算云」成为2024-2025年增速最快的云计算子赛道。')),
    p(b('适合商科岗位：'), t('云销售/客户经理（ToB大客户销售）、解决方案架构师（需求分析+方案设计）、产品经理（云产品设计）、战略分析、投资研究员（云计算/SaaS板块）')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('一、行业基本概念'),
    h2('1.1 云计算分层'),
    li(b('IaaS（基础设施即服务）：'), t('提供虚拟服务器、存储、网络。类似「出租毛坯房」——用户自己装修（部署软件）。阿里云ECS、腾讯云CVM是典型IaaS产品。中国IaaS市场最成熟，三巨头格局稳定')),
    li(b('PaaS（平台即服务）：'), t('提供开发/运行平台（数据库/中间件/AI开发平台）。类似「出租精装房」——用户拎包入住（直接开发应用）。阿里云ModelArts、百度智能云千帆是AI PaaS典型产品')),
    li(b('SaaS（软件即服务）：'), t('直接提供可用软件（CRM/ERP/协作工具）。类似「酒店式公寓」——用户直接使用。中国SaaS市场不成熟（相比美国Salesforce/Snowflake等），企业付费意愿偏低')),
    h2('1.2 核心商业模式'),
    h3('按量付费（Pay-as-you-go）'),
    p(t('用户按实际使用的计算/存储/网络资源付费（按小时/秒计费）。适合中小企业和弹性需求。优点：灵活；缺点：成本不可预测。')),
    h3('包年包月（Reserved Instance）'),
    p(t('用户预付费购买1-3年的云资源使用权，享受30-60%折扣。适合大企业稳定负载。这是云厂商最重要的收入来源——锁定长期客户。')),
    h3('AI算力服务（MaaS/智算云）'),
    p(t('2024年新增重要模式：企业购买GPU算力进行大模型训练/推理（按GPU小时或Token计费）。阿里云、百度智能云、火山引擎均提供GPU云服务。这是增速最快的云收入类型。')),
    h2('1.3 必背核心指标'),
    li(b('市场份额（IaaS）：'), t('阿里云33-36%，华为云16-18%，腾讯云9-10%（来源：Canalys 2025 Q1 / 信通院2025 Q3）')),
    li(b('ARR（年经常性收入）：'), t('云计算核心财务指标——代表已签约客户的年化收入。ARR增速代表业务健康度')),
    li(b('客户数/大客户占比：'), t('阿里云服务超400万企业客户，大客户（年付费100万+）贡献约60%收入')),
    li(b('智能算力（EFLOPS）：'), t('中国2024年智能算力725.3 EFLOPS(+74.1%)，但上架率不足60%（来源：信通院2025年报告）')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('二、市场规模'),
    li(b('全球云计算市场：'), t('2024年达6929亿美元(+20%)，亚太地区885.3亿美元。预计CAGR 19.70%至2032年（来源：Fortune Business Insights）')),
    li(b('全球TOP3：'), t('AWS 37.7%、Azure 23.9%、Google Cloud 12.0%。阿里云全球份额7.2%（第四），华为云4.1%（来源：2025年8月全球IaaS数据）')),
    li(b('中国公有云IaaS TOP3：'), t('阿里云33%、华为云18%、腾讯云10%（2025 Q1，来源：Canalys）。三者合计约60%份额')),
    li(b('运营商云（新势力）：'), t('天翼云（中国电信）2025年H1收入573亿元，在政务/国企市场领先。运营商云在政务云/G端市场份额超过互联网云厂商')),
    li(b('AI算力需求：'), t('训练占比将从目前下降至27.4%，推理占比升至72.6%。推理需求的爆发将驱动云计算新一轮增长')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('三、竞争格局'),
    h2('3.1 中国云计算竞争格局'),
  ]);

  await writeTable(objToken,
    ['厂商', '2025 Q1份额', '核心优势', '客户群', 'AI布局'],
    [
      ['阿里云', '33%', '技术领先+开发者生态最大', '互联网/零售/金融', '通义千问+3800亿投资'],
      ['华为云', '18%', '全栈技术(昇腾芯片/鲲鹏)', '政务/制造/运营商', 'ModelArts+昇腾AI芯片'],
      ['腾讯云', '10%', '微信生态+游戏/音视频能力', '游戏/社交/金融', '混元大模型+企业微信AI'],
      ['火山引擎(字节)', '~15%（第二梯队）', '大数据/推荐系统+AI', '内容/电商/互联网', '豆包大模型+AI应用'],
      ['天翼云(中国电信)', '政务领先', '运营商网络+国企背景', '政务/国企/城市大脑', '国产化替代方案'],
      ['百度智能云', '~5%', 'AI最早布局+搜索数据', '工业/医疗/自动驾驶', '文心大模型+Apollo'],
    ]
  );
  await sleep(400);

  await writeBlocks(objToken, [
    h2('3.2 关键竞争变量'),
    h3('变量一：AI算力需求爆发'),
    p(t('AI训练/推理需要大量GPU算力。谁能提供最多/最好/最便宜的GPU云服务，谁就能赢得AI时代的云计算市场份额。阿里云宣布未来3年投入3800亿元于云/AI基础设施，这是中国云计算史上最大的投资承诺。')),
    h3('变量二：国产化替代'),
    p(t('美国芯片出口管制（限制NVIDIA高端GPU对华销售）推动中国企业转向国产芯片（华为昇腾/寒武纪）。华为云凭借全栈国产化（昇腾芯片+鲲鹏服务器+欧拉操作系统）在政务/国企市场获得独特优势。')),
    h3('变量三：从IaaS到MaaS'),
    p(t('云计算正从「卖基础设施（IaaS）」向「卖AI模型服务（MaaS）」转型。企业不再自建AI团队，而是直接调用云厂商的大模型API。这使得大模型能力成为云厂商的核心竞争力，而不仅仅是服务器数量。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('四、行业发展趋势'),
    h2('趋势一：AI驱动云计算新增长周期'),
    p(t('事实依据：百度智能云Q4 AI相关收入同比+143%，阿里云AI收入高速增长。AI不仅是云计算的「客户」（企业租GPU训练AI），也是云计算的「产品」（云厂商卖AI API服务）。AI+云的飞轮效应正在形成。')),
    h2('趋势二：腾讯云实现规模化盈利'),
    p(t('事实依据：马化腾在2025年员工大会确认腾讯云整体实现规模化盈利（来源：36氪报道），此前经历「割肉百亿」的投资期。腾讯云盈利意味着中国云计算行业正在从「烧钱抢份额」进入「理性盈利」阶段。')),
    h2('趋势三：智算中心上架率待提升'),
    p(t('事实依据：中国2024年智能算力725.3 EFLOPS(+74.1%)，但上架率不足60%，部分区域智算中心上架率<40%（来源：信通院）。算力供给过剩+结构性错配（训练vs推理需求比例失衡）是当前最大问题。')),
    h2('趋势四：端侧AI vs 云AI竞争'),
    p(t('事实依据：2025年AI PC渗透率38%、AI手机50%。端侧AI（在本地设备运行AI模型）减少了对云端算力的依赖。长期看，轻量级AI推理将迁移到端侧，重量级训练/复杂推理仍需云端——云厂商需要向「高价值AI服务」转型。')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('五、主要玩家近期动态'),
    h2('5.1 阿里云'),
    li(b('3800亿投资：'), t('阿里宣布未来3年投入超3800亿元于云/AI基础设施。这一金额约等于阿里巴巴2024全年利润的6-7倍，显示AI战略的决心')),
    li(b('通义千问+阿里云绑定：'), t('企业使用通义千问API必须通过阿里云，AI模型是云计算获客的「钩子产品」。30+行业落地案例正在从POC转向规模化部署')),
    li(b('市场领导地位：'), t('中国公有云IaaS 33-36%份额稳居第一，但华为云/火山引擎正在缩小差距')),
    h2('5.2 华为云'),
    li(b('全栈国产化：'), t('昇腾AI芯片+鲲鹏服务器+欧拉操作系统+GaussDB数据库。在美国芯片管制下，华为云「国产替代」叙事极具吸引力')),
    li(b('政务/国企市场：'), t('政务云市场华为云份额领先，城市大脑、数字政府是核心场景。运营商客户（中国移动/电信/联通）也是华为云基本盘')),
    li(b('份额提升：'), t('从2024 H1的13%提升至2025 Q1的18%（Canalys数据），增速领先阿里云')),
    h2('5.3 腾讯云'),
    li(b('规模化盈利：'), t('2025年整体实现盈利（马化腾确认），此前投入超百亿建设数据中心和AI算力')),
    li(b('差异化优势：'), t('音视频云（全球领先）、游戏云（腾讯游戏生态）、企业微信+腾讯会议SaaS。微信生态导流是腾讯云独特的获客路径')),
    li(b('AI布局：'), t('混元大模型通过腾讯云向B端开放；企业微信AI助手是ToB市场的核心场景')),
    h2('5.4 百度智能云'),
    li(b('Q4 AI收入+143%：'), t('百度智能云是百度转型AI的核心载体。2025年AI云收入300亿元(+34%)（来源：百度2025年全年财报）')),
    li(b('行业聚焦：'), t('工业质检（准确率99.5%）、自动驾驶（Apollo）、医疗AI。百度云走「行业垂直深耕」路线，而非与阿里/腾讯拼IaaS规模')),
    hr(),
  ]);

  await writeBlocks(objToken, [
    h1('六、求职视角：云计算赛道商科岗位'),
    h2('6.1 核心岗位'),
    li(b('云销售/客户经理：'), t('ToB大客户销售——签约大型企业采购云服务（年合同通常100万-1亿+）。云销售的薪资结构：底薪+高提成（合同金额的2-5%），顶级云销售年薪可达200-500万')),
    li(b('解决方案架构师：'), t('介于技术和商务之间——根据客户业务需求设计云+AI方案。需要懂业务流程+云产品能力。薪资高于纯销售和纯技术，是云计算行业最受欢迎的岗位之一')),
    li(b('产品经理（云产品）：'), t('设计云服务的功能/定价/体验。云PM需要理解ToB客户需求（与ToC PM思维差异大）——企业要的是「稳定/安全/合规/低成本」，而非「好玩/酷炫」')),
    li(b('商业分析/战略分析：'), t('分析ARR/客户留存/利润率/市场份额，输出战略建议。云计算的战略分析需要理解ToB SaaS/IaaS的财务模型（LTV/CAC/Net Dollar Retention）')),
    h2('6.2 面试高频问题'),
    h3('Q1：阿里云为什么能在中国市占率第一？'),
    li(b('先发优势：'), t('2009年成立（中国最早的云厂商），积累了15年的技术和客户资源。淘宝/天猫/支付宝等阿里内部业务提供了全球最大规模的「练兵场」')),
    li(b('开发者生态：'), t('阿里云开发者社区最大（中国），开源项目最多。开发者在学校学的就是阿里云，进入企业后自然推荐阿里云')),
    li(b('AI卡位：'), t('通义千问开源策略+3800亿投资，确保在AI时代继续领跑。AI是云计算下一阶段增长的核心驱动力')),
    h3('Q2：为什么中国SaaS市场远不如美国成熟？'),
    li(b('企业付费意愿低：'), t('中国企业（尤其中小企业）习惯「免费/低价」，不愿为软件付订阅费。美国企业IT预算占收入3-5%，中国不到1%')),
    li(b('定制化需求多：'), t('中国企业流程差异大，标准化SaaS难以满足需求，导致SaaS公司不得不做定制开发（拉低利润率）')),
    li(b('巨头挤压：'), t('阿里钉钉/腾讯企业微信/飞书免费提供协作工具，挤压了中小SaaS公司的生存空间')),
    hr(),
    quote(t('数据来源：Canalys 2025 Q1中国云市场报告、信通院《云计算蓝皮书2025》、阿里巴巴投资者日公告、百度2025年全年财报(2026.2)、腾讯2025年员工大会(36氪报道)、Fortune Business Insights全球云市场报告')),
  ]);

  console.log('\n✅ 云计算深度报告写入完成！');
  console.log(`🔗 https://${DOMAIN}/wiki/${nodeToken}`);
}
main().catch(console.error);
