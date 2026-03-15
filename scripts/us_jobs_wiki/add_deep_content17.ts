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
// 页面1：🤖 AI/ML产品职业路径（AI PM/AI Researcher/MLOps）
// ============================================================
const aiCareerBlocks: any[] = [
  p(t('来源：OpenAI/Anthropic/Google DeepMind官方招聘页面、Lenny\'s Newsletter AI PM专题、a16z Future of AI就业报告、Glassdoor AI Engineer薪资、Twitter/X上AI从业者讨论，2024年整合。', false, true)),
  hr(),
  h2('一、AI行业就业全景（2024年最新）'),
  h3('AI就业热度'),
  li(t('AI Engineer：LinkedIn最快增长职位，年增速超过50%（2023-2024）')),
  li(t('AI相关职位：2024年超过200万个活跃职位，薪资溢价比普通SWE高30-50%')),
  li(t('Generative AI：自2022年ChatGPT发布后，生成式AI职位爆炸式增长')),
  h3('主要玩家和就业目标'),
  li(t('前沿模型实验室：OpenAI、Anthropic、Google DeepMind、Meta AI（FAIR）、xAI')),
  li(t('大型科技AI团队：Google AI/Research、Microsoft Copilot、Amazon AWS AI')),
  li(t('AI Foundation层：NVIDIA（GPU/CUDA生态）、Hugging Face、Scale AI')),
  li(t('AI应用层：Midjourney、Perplexity、Character.ai、Cohere、Databricks')),
  li(t('垂直AI：Harvey（法律AI）、Abridge（医疗AI）、Glean（企业搜索）')),
  hr(),
  h2('二、主要AI职业方向'),
  h3('AI/ML Research Scientist（研究科学家）'),
  li(t('工作：开发新的ML算法、训练Foundation Models、发表顶会论文（NeurIPS/ICML/ICLR）')),
  li(t('要求：PhD通常必须（CMU/Stanford/MIT/Berkeley CS AI方向），顶会发表经历')),
  li(t('薪资：$250-400k+ total（OpenAI/Anthropic顶级研究员可达$500k-1M+）')),
  li(t('路径：Intern at AI lab→Research Scientist→Research Lead→VP Research')),
  h3('Applied Scientist/ML Engineer'),
  li(t('工作：把研究成果productionize，优化模型serving，开发AI产品功能')),
  li(t('要求：MS/PhD都可，需要强工程能力+ML理论基础')),
  li(t('薪资：$200-350k（FAANG Applied Scientist），Startup $180-280k')),
  li(t('技能栈：PyTorch/TensorFlow、Distributed Training、MLflow、Ray、CUDA')),
  h3('AI Product Manager（AI PM）'),
  li(t('工作：定义AI产品路线图，协调Research/Engineering/Design，管理AI功能上线')),
  li(t('特殊：比普通PM需要更强的技术理解——需要能和Researcher讨论model capability')),
  li(t('薪资：$200-320k（大厂AI PM），Startup可能有更多equity upside')),
  li(t('路径：普通PM做AI产品→AI PM，或ML Engineer转AI PM（需要补充产品技能）')),
  h3('MLOps/AI Platform Engineer'),
  li(t('工作：构建ML训练/推理基础设施，Feature Store，Model Registry，A/B Test平台')),
  li(t('需求爆炸：每家有AI功能的公司都需要MLOps工程师')),
  li(t('薪资：$200-300k，工具：MLflow、Kubeflow、Airflow、SageMaker、Vertex AI')),
  h3('AI Safety/Alignment Researcher'),
  li(t('工作：研究如何使AI系统安全可靠，interpretability、RLHF、Constitutional AI等')),
  li(t('代表机构：Anthropic（Constitutional AI）、OpenAI Alignment、DeepMind Safety')),
  li(t('薪资：$200-400k，非常稀缺，需要既懂ML又懂哲学/认知科学的复合人才')),
  hr(),
  h2('三、如何进入AI行业（按背景分）'),
  h3('CS/ML PhD背景'),
  li(t('顶级AI Lab：直接申请Research Internship（NeurIPS/ICML workshop论文是敲门砖）')),
  li(t('发表策略：哪怕arXiv预印本+GitHub代码也比没发表强很多')),
  li(t('冷邮件：给你感兴趣方向的Research Lead发邮件，附上你的论文/项目')),
  h3('MS CS背景（非PhD）'),
  li(t('ML Engineer路径：刷题+MLSys课程（CS294、CMU 11-785）+Kaggle竞赛')),
  li(t('项目展示：在Hugging Face Space或GitHub上开源LLM应用或fine-tuning项目')),
  li(t('Intern First：Databricks、Scale AI、Cohere的intern项目对MS开放')),
  h3('非CS背景转AI'),
  li(t('AI PM路径：从传统PM做有AI功能的产品，积累经验后转AI-focused团队')),
  li(t('AI Researcher（非ML）：法律AI、医疗AI等垂直领域，领域知识+基础ML理解')),
  li(t('AI Sales/Business：AI公司的GTM、Solution Architect、Customer Success也大量招募')),
  hr(),
  h2('四、面试准备'),
  h3('ML Engineer面试'),
  li(t('ML基础：反向传播、正则化、优化器（SGD/Adam）、过拟合处理')),
  li(t('系统设计：设计一个推荐系统、图片搜索系统、实时预测服务')),
  li(t('Coding：LeetCode Medium-Hard（比一般SWE要求略低，但ML实现题很多）')),
  li(t('大模型特定：Transformer架构细节、Attention机制、Fine-tuning vs RAG vs Prompt Engineering')),
  h3('AI PM面试'),
  li(t('AI产品设计："如何为ChatGPT设计一个代码审查功能？"')),
  li(t('指标：如何衡量AI功能的成功（Accuracy、Hallucination Rate、User Acceptance Rate）')),
  li(t('技术深度："解释一下RAG和Fine-tuning的区别，以及什么情况用哪个？"')),
  li(t('市场判断："AI写作助手的TAM是多少？WPS AI vs Notion AI的差异在哪？"')),
  h3('推荐学习资源'),
  li(t('课程：Stanford CS229（ML）、CS224N（NLP）、CS231N（CV）免费在YouTube')),
  li(t('实践：Fast.ai（快速上手）、Hugging Face课程（免费且实用）')),
  li(t('论文：Attention is All You Need、GPT-3、InstructGPT——必读基础论文')),
  li(t('书籍：《Designing Machine Learning Systems》（Chip Huyen）、《Hands-On ML》（Geron）')),
];

// ============================================================
// 页面2：📣 市场营销/数字营销/增长职业路径
// ============================================================
const marketingCareerBlocks: any[] = [
  p(t('来源：HubSpot State of Marketing 2024、Glassdoor Marketing职位薪资、Google Analytics认证项目、LinkedIn Marketing Solutions就业数据、Growth.Design案例库，2024年整合。', false, true)),
  hr(),
  h2('一、美国营销行业版图'),
  h3('为什么营销对中国学生有机会'),
  li(t('中国市场知识：对中国消费行为/社交媒体的理解在跨境电商、中国市场进入方面极有价值')),
  li(t('数字营销分析化：现代营销需要强数据能力——正是很多中国学生的优势')),
  li(t('创意+分析：AI工具降低了创意门槛，分析能力成为差异化核心')),
  h3('营销职位类型'),
  li(t('Brand Marketing：品牌策略、定位、创意活动、消费者洞察')),
  li(t('Performance/Growth Marketing：付费广告、SEO/SEM、用户获取（UA）、ROI优化')),
  li(t('Product Marketing（PMM）：产品上市策略、竞品分析、销售赋能材料')),
  li(t('Content Marketing：内容策略、社交媒体、SEO内容、思想领导力')),
  li(t('Marketing Analytics：营销效果测量、Attribution建模、A/B测试')),
  hr(),
  h2('二、各营销方向详解'),
  h3('Product Marketing Manager（PMM）— 最受商科学生欢迎'),
  li(t('工作：产品上市（Go-to-Market）战略、竞品定位、销售团队培训材料')),
  li(t('与PM区别：PM定义"做什么"，PMM定义"怎么卖"')),
  li(t('核心技能：市场研究、竞品分析、消费者洞察、GTM执行、Pricing策略')),
  li(t('薪资：$90-150k（大厂PMM），Startup $80-120k但有equity')),
  li(t('代表公司：Salesforce PMM、HubSpot PMM、Google PMM、Stripe PMM')),
  h3('Growth Marketing/Performance Marketing'),
  li(t('工作：管理付费获客（Google Ads/Facebook/TikTok）、SEO、Email Marketing、CRO（转化率优化）')),
  li(t('核心指标：CAC（用户获取成本）、LTV（用户生命周期价值）、ROAS（广告支出回报）')),
  li(t('技能栈：Google Analytics 4、Meta Ads Manager、Klaviyo、HubSpot、SQL查询')),
  li(t('薪资：$70-120k，Startup里growth角色职责极广但薪资和equity有弹性')),
  h3('Marketing Analytics'),
  li(t('工作：用数据支撑营销决策——Attribution建模、实验设计、Dashboard建设')),
  li(t('工具：SQL（必须）、Python/R、Tableau、Mixpanel、Amplitude')),
  li(t('热门领域：DTC（直接面对消费者）品牌的Analytics，电商的Marketing Mix Modeling')),
  li(t('薪资：$80-130k，数据能力强的Marketing人才供不应求')),
  hr(),
  h2('三、核心工具和认证'),
  h3('免费必学工具'),
  li(t('Google Analytics 4（GA4）：免费，GA4认证是基础门槛')),
  li(t('Google Ads、Meta Ads Manager：分别有免费认证，是Performance Marketing标配')),
  li(t('HubSpot Academy：CRM/Inbound Marketing免费认证，内容质量高')),
  li(t('Semrush/Ahrefs：SEO分析，有免费试用')),
  h3('推荐认证（按重要程度）'),
  li(t('Google Analytics 4 Certification（必须）：基础，很多职位要求')),
  li(t('Meta Blueprint：Facebook/Instagram广告认证')),
  li(t('HubSpot Content Marketing Certification：内容营销系统认证')),
  li(t('Google Ads Search/Display Certification：付费广告专业认证')),
  li(t('Salesforce Marketing Cloud Email Specialist：B2B营销工具')),
  hr(),
  h2('四、进入营销行业的策略'),
  h3('对商科学生'),
  li(t('Marketing课程之外：找实际项目——学生营销协会的执行项目、给local business的pro bono营销')),
  li(t('Portfolio：做一个Google Sites/Behance，展示你做过的Campaign（有数据的案例）')),
  li(t('MBA路径：Brand Manager（P&G/Unilever/J&J等CPG公司大量招MBA）')),
  h3('对数据背景学生'),
  li(t('Marketing Analytics是甜点：用数据能力进入营销，薪资比纯文科营销高很多')),
  li(t('做个数据项目：用公开电商数据做Attribution分析，展示在简历/GitHub')),
  h3('对中国学生的特别机会'),
  li(t('TikTok/ByteDance营销相关职位：最懂TikTok用户行为的人，中国背景是显著优势')),
  li(t('Shein/Temu等中国跨境电商美国营销团队：大量招募')),
  li(t('中国市场进入咨询：帮助美国品牌进入中国市场的Marketing职位（需要深度中国消费知识）')),
];

// ============================================================
// 页面3：🏥 医疗健康数据/Health Tech职业路径
// ============================================================
const healthTechBlocks: any[] = [
  p(t('来源：HIMSS Healthcare IT Workforce Report、Rock Health数字健康就业报告、Glassdoor Health Informatics薪资、Epic Systems官网招聘信息、CMS Medicare数据分析职位，2024年整合。', false, true)),
  hr(),
  h2('一、医疗健康数据行业概况'),
  h3('为什么Healthcare Data是热门方向'),
  li(t('数据爆炸：电子病历（EHR）全面普及产生海量数据，分析需求暴增')),
  li(t('监管压力：CMS、FDA数据要求推动医院/药企大量招募数据人才')),
  li(t('AI医疗：医疗影像AI、药物发现AI、临床决策支持AI——每个方向都需要数据人才')),
  li(t('H-1B友好：大型医疗机构（医院/保险公司）有稳定的H-1B赞助历史')),
  h3('行业主要参与者'),
  li(t('医疗IT公司：Epic Systems（最大EHR公司）、Cerner（Oracle Health）、Meditech')),
  li(t('健康险公司：UnitedHealth/Optum、Anthem/Elevance、Cigna、CVS Aetna')),
  li(t('医疗数据公司：Veeva Systems、IQVIA、Symphony Health、Komodo Health')),
  li(t('数字健康创业：Hims & Hers、Noom、Headspace Health、Cerebral')),
  li(t('政府/学术医疗：NIH、CDC、AHA、大学医疗中心（Mayo Clinic、Cleveland Clinic）')),
  hr(),
  h2('二、主要职位类型'),
  h3('Health Data Analyst/Healthcare Analyst'),
  li(t('工作：分析患者结局、运营效率、成本控制，支持临床和管理决策')),
  li(t('数据来源：EHR数据（Epic、Cerner）、Medicare/Medicaid索赔数据、临床试验数据')),
  li(t('工具：SQL（必须）、Python/R、Tableau/Power BI、SAS（传统医疗机构常用）')),
  li(t('薪资：$65-100k，大型医院系统/保险公司')),
  h3('Health Informatics/Clinical Informatics'),
  li(t('工作：管理医疗信息系统，优化EHR工作流，培训临床人员使用数字工具')),
  li(t('资格证：RHIA（Registered Health Information Administrator）、CPHIMS认证加分')),
  li(t('薪资：$75-120k，稳定性强，医院IT部门常年招募')),
  h3('Healthcare Data Scientist/ML Engineer'),
  li(t('工作：开发预测模型（患者再住院率、慢病风险分层、手术结局预测）')),
  li(t('特殊数据类型：时序数据（生命体征）、自然语言（病历Note）、影像数据（CT/MRI）')),
  li(t('薪资：$120-180k，稀缺人才，比一般DS高因为领域知识要求')),
  li(t('代表机构：Google Health、Apple Health、Mayo Clinic AI、Johns Hopkins AI Lab')),
  h3('Health Economics/Outcomes Research（HEOR）'),
  li(t('工作：评估药物/医疗设备的经济价值，支持保险定价决策，服务FDA/CMS')),
  li(t('背景：经济学/公共卫生/统计学硕士+')),
  li(t('雇主：IQVIA、Evidera、Analysis Group（咨询）、大型制药公司')),
  hr(),
  h2('三、特殊数据：Medicare/Medicaid数据分析'),
  h3('公开数据资源'),
  li(t('CMS Data：Medicare索赔数据（100%覆盖Medicare受益人）是医疗研究金矿')),
  li(t('HCUP（Healthcare Cost and Utilization Project）：住院/急诊数据')),
  li(t('NHANES、NHIS：全国健康调研数据')),
  li(t('All-Payer Claims Databases（APCD）：各州综合支付数据')),
  h3('如何利用公开数据做项目'),
  li(t('下载CMS Medicare Part D药品数据，分析opioid处方模式（有很多现成文献可参考）')),
  li(t('用HCUP NIS数据分析某DRG（诊断相关组）的住院成本变化趋势')),
  li(t('这类项目在简历上极有说服力，展示Healthcare domain knowledge+数据分析能力')),
  hr(),
  h2('四、求职策略'),
  h3('推荐资格证书'),
  li(t('CPHIMS（Certified Professional in Health Informatics and Information Management）')),
  li(t('RHIA（Registered Health Information Administrator）：最认可的HIM认证')),
  li(t('Six Sigma Green Belt：运营改进在医疗系统很受欢迎')),
  li(t('Epic认证：如果目标是医疗IT实施顾问，Epic证书是门票')),
  h3('波士顿/旧金山的Healthcare Hub优势'),
  li(t('波士顿（Kendall Square）：生物科技+医疗IT最密集，Harvard/MGH、Partners HealthCare')),
  li(t('旧金山：Flatiron Health、Verily（Google）、Stripe Health（医疗支付）')),
  li(t('芝加哥/明尼阿波利斯：UnitedHealth Group大本营，大量Healthcare Analytics职位')),
  h3('对中国学生的机会'),
  li(t('中美医疗数据比较研究：有公共卫生背景的中国学生在研究型机构有独特视角')),
  li(t('远程医疗/数字健康：中国有全球最大的远程医疗使用经验，在美国该行业也在快速增长')),
];

// ============================================================
// 页面4：📱 社交媒体/内容创作/影响者经济职业路径
// ============================================================
const contentCreatorCareerBlocks: any[] = [
  p(t('来源：Creator Economy Report 2024（SignalFire）、Influencer Marketing Hub行业报告、TikTok/YouTube官方Creator Academy、Glassdoor内容创作相关职位薪资，2024年整合。', false, true)),
  hr(),
  h2('一、创作者经济与相关职业机会'),
  h3('行业规模'),
  li(t('Creator Economy市场规模：$250B（2024），预计2027年达$480B')),
  li(t('全职创作者：全球超过5000万人，美国约200万全职创作者')),
  li(t('平台就业：YouTube/TikTok/Instagram的Creator Support、Partnership等职位大量增加')),
  h3('非创作者也能进入的相关职位'),
  li(t('Creator Partnerships：平台方（YouTube、TikTok）的创作者关系维护团队')),
  li(t('Influencer Marketing Manager：品牌方或MCN机构的网红营销管理')),
  li(t('Content Strategy：企业内部的内容规划和社交媒体运营')),
  li(t('Creator Fund/VC：专注投资创作者经济的基金（如Andreessen Horowitz的Creator Fund）')),
  hr(),
  h2('二、平台方职位详解'),
  h3('YouTube/Google Creator Partnerships'),
  li(t('工作：维护和发展顶级YouTuber的关系，帮助他们成长，管理政策合规')),
  li(t('背景：销售/BD背景，或有内容平台经验，懂YouTube生态')),
  li(t('薪资：$90-140k base（Google薪资体系）')),
  li(t('特别：对中国学生，如果负责中文内容/华语市场，中文能力是核心资产')),
  h3('TikTok/ByteDance Creator Operations'),
  li(t('工作：平台创作者激励政策执行、头部创作者BD、内容质量监控')),
  li(t('背景：内容平台运营经验，了解TikTok算法和内容趋势')),
  li(t('特别：TikTok在美国是最大雇主之一，中文背景的员工有更多晋升通道')),
  li(t('薪资：$80-130k，总部在Culver City（LA）和NYC')),
  h3('Meta Creator Monetization'),
  li(t('工作：帮助Facebook/Instagram创作者的变现，推广新功能')),
  li(t('薪资：$100-150k（Meta薪资体系偏高）')),
  hr(),
  h2('三、品牌侧Influencer Marketing职位'),
  h3('Influencer Marketing Manager（品牌方）'),
  li(t('工作：识别合适的网红合作伙伴、谈判合同、管理Campaign执行、测量ROI')),
  li(t('核心技能：网红筛选（真实粉丝vs刷量）、合同谈判、Campaign管理、数据分析')),
  li(t('工具：AspireIQ、Grin、CreatorIQ、HYPR、Social Blade')),
  li(t('薪资：$60-100k，大品牌（耐克/L\'Oreal/Unilever）内部团队')),
  h3('MCN（多频道网络）职位'),
  li(t('代表机构：Viral Nation、NeoReach、Digital Brand Architects（DBA）')),
  li(t('职位：Talent Manager（管理创作者）、Campaign Manager（执行品牌合作）')),
  li(t('薪资：$50-90k，但commission让部分人赚很多')),
  h3('面向中文市场的特殊机会'),
  li(t('小红书/微博/抖音美国推广：帮助美国品牌进入中国社交媒体，需要双语精通')),
  li(t('华人达人MCN：北美华人创作者生态正在崛起，管理华人KOL的机构需要熟悉两边文化的人')),
  li(t('跨境电商+内容：Shein/Temu/TikTok Shop的创作者伙伴项目需要运营人员')),
  hr(),
  h2('四、以内容为核心的职业建立策略'),
  h3('为什么建议有副业内容'),
  li(t('差异化：对于商科学生，有一个专注领域的内容账号（求职、金融、科技）能极大提升可见度')),
  li(t('练习英语沟通：强迫自己用英语输出，是最好的英语提升方式')),
  li(t('建立品牌：可能成为你被伯乐发现的途径（LinkedIn帖子被VP看到→ Informational Chat→ Offer）')),
  h3('如何建立个人内容品牌（商科学生版）'),
  li(t('平台选择：LinkedIn（职业）+ Twitter/X（行业观点）是最适合商科学生的')),
  li(t('内容策略：分享你对行业的观察、面试经历（匿名化）、市场分析笔记')),
  li(t('一致性>完美：每周2-3条有实质内容的帖子，3个月后开始有显著效果')),
  li(t('真实>营销：分享真实经历（包括失败）比"成功学"帖子更容易获得真实互动')),
];

// ============================================================
// 页面5：🌍 移民后的长期职业规划（绿卡/公民身份/职业发展）
// ============================================================
const longTermCareerBlocks: any[] = [
  p(t('来源：USCIS官方绿卡数据、National Foundation for American Policy H-1B研究报告、Immigration Lawyers Podcast、Glassdoor薪资长期增长数据、多位华人移民15年职业轨迹整理，2024年。', false, true)),
  hr(),
  h2('一、签证到绿卡：完整路径规划'),
  h3('OPT→H-1B→绿卡的标准路径'),
  li(t('毕业后：OPT工作1年（STEM OPT：额外2年，共3年）')),
  li(t('H-1B：每年4月抽签（Cap：65000名额+20000高等学历名额），大约50%抽中率')),
  li(t('H-1B期间：申请绿卡（通常EB-2或EB-3），中国人排队积压严重（目前等待30年+）')),
  li(t('EB-1A（杰出成就）：无排队，但标准很高，适合真正的行业顶尖人才')),
  li(t('EB-1B（杰出研究人员）：需要雇主担保，中国排队约2-3年（相比EB-2好很多）')),
  li(t('EB-2 NIW（国家利益豁免）：无需雇主，中国排队10年+，近年越来越多人申请')),
  h3('2024年绿卡现状（中国大陆出生）'),
  li(t('EB-2/EB-3 China：Priority Date约在2010-2012年，意味着新申请要等约30年')),
  li(t('EB-1A/EB-1B：没有国别排队（除非超过7%总量），是中国人最快路径')),
  li(t('AC21换雇主保留Priority Date：持有I-485未决时，换工作6个月后可AC21保留排队日期')),
  li(t('EB-1A申请策略：专注积累符合USCIS标准的证明材料（引用、奖项、媒体报道、评审经历）')),
  hr(),
  h2('二、H-1B抽签策略和风险管理'),
  h3('提高中签率的方法'),
  li(t('高等学历池：US Master/PhD学位申请高等学历池，中签率约60%（普通池约30%）')),
  li(t('Cap-Exempt雇主：大学/研究机构/非盈利不受H-1B Cap限制，可以随时申请')),
  li(t('O-1A签证：卓越能力签证，无Cap，但申请难度高，需要专业移民律师')),
  li(t('L-1签证：跨国公司内部调动，需要在海外关联公司工作1年+')),
  h3('H-1B未中签的应对方案'),
  li(t('继续用OPT工作（STEM OPT最多3年，期间可以继续参加下年抽签）')),
  li(t('去加拿大或第三国绕道（Canada Global Talent Stream→加拿大PR→美国TN或重新抽签）')),
  li(t('回国工作积累1年以上→L-1B申请进入Cap-Exempt渠道')),
  li(t('找Cap-Exempt雇主：在大学做Research Scientist，等绿卡排队期间）')),
  hr(),
  h2('三、长期职业发展规划（10年维度）'),
  h3('第一阶段（0-3年）：打基础'),
  li(t('目标：拿到H-1B，在第一份工作证明自己，积累领域专业能力')),
  li(t('专注：做好本职工作+学会美国职场规则+开始建立人脉')),
  li(t('不要分心：这阶段签证焦虑+工作压力已经很大，不要同时做太多事')),
  h3('第二阶段（3-7年）：加速积累'),
  li(t('目标：晋升到中层（Manager/Senior IC），开始有实质性影响力')),
  li(t('行动：考虑是否需要MBA/额外学位，寻找sponsor关系，考虑横向转行机会')),
  li(t('签证：积极推进绿卡申请（EB-1方向），记录符合条件的成就')),
  h3('第三阶段（7-15年）：领导力建设'),
  li(t('目标：进入高级管理层或成为行业专家/思想领袖')),
  li(t('选择：继续大公司IC轨道 vs 小公司C-Suite vs 创业 vs 回国发展')),
  li(t('绿卡/公民身份：如果走EB-1路径可能已经拿到PR，5年PR后可申请公民')),
  hr(),
  h2('四、关键财务决策（长期规划）'),
  h3('工作早期的关键财务决策'),
  li(t('最大化401(k)：至少要达到公司match的最大限额，free money不要放弃')),
  li(t('Roth IRA vs Traditional IRA：年轻时税率低，Roth IRA更有利（每年$7000 limit）')),
  li(t('RSU归属策略：RSU归属时要及时卖掉（大量持有雇主股票是集中风险）')),
  li(t('紧急基金：3-6个月生活费的紧急储备，对签证身份不稳定的人尤其重要')),
  h3('H-1B持有者的特殊财务注意'),
  li(t('社保税缴纳：H-1B需要缴纳Social Security和Medicare税（OPT不需要）')),
  li(t('如果换工作：确认新雇主H-1B Transfer已批准（或至少提交）再离开前雇主')),
  li(t('不能做的事：H-1B期间不能自雇、不能做兼职（除非兼职也有H-1B）')),
  li(t('备用资金：建议在账户保留相当于6个月生活费的存款，应对签证纠纷/失业期间')),
  h3('绿卡持有后的财务变化'),
  li(t('投资自由度大幅增加：可以使用全部退休账户类型，可以自雇开公司')),
  li(t('税务居民身份更稳定：全球收入税申报（美国公民/PR），需要了解FBAR规则')),
  li(t('房产购买时机：大多数人选择在绿卡批准后、或至少H-1B稳定后购买房产')),
];

async function main() {
  console.log('🚀 开始写入深度内容（第十七批）...');

  await createPage('🤖 AI/ML产品职业路径（AI PM/Research Scientist/MLOps）', aiCareerBlocks);
  await createPage('📣 市场营销/数字营销/增长职业路径（Performance到Analytics）', marketingCareerBlocks);
  await createPage('🏥 医疗健康数据/Health Tech职业路径（EHR/HEOR/数字健康）', healthTechBlocks);
  await createPage('📱 社交媒体/内容创作/影响者经济相关职位攻略', contentCreatorCareerBlocks);
  await createPage('🌍 移民长期职业规划（H-1B→绿卡→职业跃升完整路径）', longTermCareerBlocks);

  console.log('\n✨ 完成！');
  console.log(`🔗 知识库：https://${LINK_DOMAIN}/wiki/${PARENT_NODE_TOKEN}`);
}

main().catch(console.error);
