/**
 * 创建「商科面试三步法」飞书知识库
 * 结构：
 *   0. 导读 · 欢迎
 *   1. Part 1：认知破局
 *   2. Part 2：三步法框架
 *     2.1  Step 1 拆JD
 *     2.2  Step 2 对能力
 *     2.3  Step 3 三类表达
 *       └ 3.1  行为面试
 *       └ 3.2  业务面试 / Case
 *       └ 3.3  简历
 *   3. Part 4：高频题应用
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载 .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { client } = require('../src/client') as typeof import('../src/client');

// ─── 飞书 Docx Block 工厂函数 ─────────────────────────────────────

type TextStyle = { bold?: boolean; italic?: boolean; inline_code?: boolean };

function textElement(content: string, style?: TextStyle) {
  return {
    text_run: {
      content,
      text_element_style: style ?? {},
    },
  };
}

function boldElement(content: string) {
  return textElement(content, { bold: true });
}

function paragraph(...elements: any[]) {
  return {
    block_type: 2,
    text: { elements, style: {} },
  };
}

function h1(text: string) {
  return {
    block_type: 3,
    heading1: { elements: [textElement(text)], style: {} },
  };
}

function h2(text: string) {
  return {
    block_type: 4,
    heading2: { elements: [textElement(text)], style: {} },
  };
}

function h3(text: string) {
  return {
    block_type: 5,
    heading3: { elements: [textElement(text)], style: {} },
  };
}

function bullet(...elements: any[]) {
  return {
    block_type: 12,
    bullet: { elements, style: {} },
  };
}

function ordered(...elements: any[]) {
  return {
    block_type: 13,
    ordered: { elements, style: {} },
  };
}

function divider() {
  return { block_type: 22, divider: {} };
}

function quote(...elements: any[]) {
  return {
    block_type: 15,
    quote: { elements, style: {} },
  };
}

// ─── 知识库内容定义 ──────────────────────────────────────────────

const pages: Array<{
  title: string;
  parent?: string; // parent page title, for nesting
  blocks: any[];
}> = [

  // ══════════════════════════════════════════
  // 0. 导读
  // ══════════════════════════════════════════
  {
    title: '导读 · 欢迎使用',
    blocks: [
      h1('欢迎来到商科面试三步法'),
      paragraph(
        textElement('这是一份专为 '),
        boldElement('商科求职学生'),
        textElement(' 设计的面试系统。')
      ),
      paragraph(textElement(
        '很多同学面试失败，不是因为不够聪明，也不是因为经历不够好。'
        + '真正的问题是：不知道面试在考什么。'
      )),
      divider(),
      h2('这套方法帮你做三件事'),
      bullet(boldElement('看懂'), textElement(' 任何 JD 背后想要的能力')),
      bullet(boldElement('找到'), textElement(' 你已经具备的经历和能力')),
      bullet(boldElement('表达'), textElement(' 在不同场景准确说出来')),
      divider(),
      h2('知识库结构'),
      ordered(boldElement('Part 1：认知破局'), textElement(' — 理解面试的底层逻辑，建立正确的备考心智')),
      ordered(boldElement('Part 2：三步法框架'), textElement(' — 核心方法：拆JD → 对能力 → 三类表达（行为/Case/简历）')),
      ordered(boldElement('Part 4：高频题应用'), textElement(' — 用三步法拆解高频题，直接上手练')),
      divider(),
      h2('使用建议'),
      ordered(textElement('先读 Part 1，建立正确认知')),
      ordered(textElement('找到你的目标 JD，走一遍三步法（Part 2）')),
      ordered(textElement('在 Part 3 找对应战场的操作手册')),
      ordered(textElement('用 Part 4 高频题做最终检验')),
      divider(),
      quote(boldElement('核心一句话：'), textElement('所有面试题，本质上只是在用不同方式考你同一套能力。')),
    ],
  },

  // ══════════════════════════════════════════
  // 1. Part 1：认知破局
  // ══════════════════════════════════════════
  {
    title: 'Part 1：认知破局 · 面试的本质',
    blocks: [
      h1('Part 1：认知破局'),
      quote(textElement('你不是不会面试，是你不知道面试在考什么。')),
      divider(),

      h2('一、为什么背题没用'),
      paragraph(textElement(
        '大多数学生的备考方式是：收集题库 → 背答案 → 面试时"套答案"。'
      )),
      paragraph(textElement('这种方式有三个致命缺陷：')),
      bullet(textElement('面试官一眼能看出来你在背稿，你的回答会变得僵硬、缺乏细节')),
      bullet(textElement('题目千变万化，背不完。换个问法你就懵了')),
      bullet(textElement('你背的是"别人的答案"，不是你自己的经历和能力')),
      paragraph(textElement(
        '本质问题：背题是在解决"怎么说"，但你根本不知道"考什么"。'
      )),
      divider(),

      h2('二、面试到底在考什么'),
      paragraph(textElement(
        '无论是行为面试、Case面试，还是简历筛选，面试官实质上只在验证一件事：'
      )),
      quote(boldElement('你有没有这个岗位需要的能力？')),
      paragraph(textElement('这个"能力"，就是 '), boldElement('胜任力模型（Competency Model）'), textElement('。')),
      paragraph(textElement(
        '所有的面试题，都是能力的具体"考题形式"。'
        + '同一个能力，可以用行为题问、可以用Case考、也可以在简历里看。'
      )),
      divider(),

      h2('三、什么是胜任力模型'),
      paragraph(textElement(
        '胜任力模型是企业用来定义"什么样的人能做好这个岗位"的框架。'
        + '通常分两类：'
      )),
      bullet(boldElement('通用能力'), textElement(
        '：所有商科岗位都需要的能力，如逻辑分析、沟通表达、问题解决、团队协作、结果导向'
      )),
      bullet(boldElement('专业能力'), textElement(
        '：特定岗位/行业的专业技能，如咨询的框架思维、投行的财务分析、市场的数据运营'
      )),
      paragraph(textElement(
        '读懂 JD，就是在找这两类能力。'
        + '备好经历，就是给每个能力配上你的"证明"。'
      )),
      divider(),

      h2('四、三步法的底层逻辑'),
      paragraph(textElement('基于上面的认知，我们设计了一套三步突击法：')),
      ordered(boldElement('Step 1 拆JD'), textElement(' — 从 JD 中提炼出考察的能力清单')),
      ordered(boldElement('Step 2 对能力'), textElement(' — 把你的经历和能力清单做匹配')),
      ordered(boldElement('Step 3 会表达'), textElement(' — 在三个战场（行为/Case/简历）分别表达')),
      paragraph(textElement(
        '这三步，覆盖了从"备考"到"上场"的完整链路。'
        + '你只需要做一遍，所有类型的面试题都有了答法。'
      )),
      divider(),
      quote(boldElement('记住这句话：'), textElement(
        '我不教你背题，我教你让所有题都变简单。'
      )),
    ],
  },

  // ══════════════════════════════════════════
  // 2. Part 2：三步法框架（概览）
  // ══════════════════════════════════════════
  {
    title: 'Part 2：三步法框架总览',
    blocks: [
      h1('三步法框架：JD → 能力 → 表达'),
      paragraph(textElement(
        '三步法是整套体系的核心骨架。在做具体备考前，先用三步法梳理出你的"作战计划"。'
      )),
      divider(),

      h2('三步法一览'),
      ordered(boldElement('Step 1：拆JD（看考什么）'), textElement(
        '\n从招聘描述中提炼：业务是什么 / 需要什么能力 / 会怎么考'
      )),
      ordered(boldElement('Step 2：对能力（你有没有）'), textElement(
        '\n把你的经历和第一步提炼的能力清单做匹配，找出强项和短板'
      )),
      ordered(boldElement('Step 3：会表达（怎么说）'), textElement(
        '\n在三个战场（行为面试 / Case面试 / 简历）分别把能力表达出来'
      )),
      divider(),

      h2('Step 3 为什么要拆成三个战场'),
      paragraph(textElement(
        '很多同学在"表达"这一层卡住，是因为把三类表达混在一起，不知道从哪下手。'
      )),
      paragraph(textElement('三类表达本质上是三个不同的战场：')),
      bullet(boldElement('行为面试'), textElement('：用过去的经历来证明能力（讲故事）')),
      bullet(boldElement('Case面试'), textElement('：在现场展示分析能力（解题）')),
      bullet(boldElement('简历'), textElement('：用静态文本提前展示能力（书面表达）')),
      paragraph(textElement(
        '三个战场，不同的规则，不同的准备方法，需要分开练习。'
      )),
      divider(),

      h2('快速上手：一次完整备考的流程'),
      ordered(textElement('拿到目标公司/岗位的JD')),
      ordered(textElement('用 Step 1 拆JD 模板，提炼能力清单（约30分钟）')),
      ordered(textElement('用 Step 2 对能力，找出你的强项经历（约1小时）')),
      ordered(textElement('根据面试类型，进入对应的 Step 3 战场深度练习')),
      paragraph(textElement(
        '建议在面试前3-5天做一次完整梳理，之后每天重复Step 3的对应内容。'
      )),
    ],
  },

  // ══════════════════════════════════════════
  // 2.1 Step 1：拆JD
  // ══════════════════════════════════════════
  {
    title: 'Step 1：拆JD（看考什么）',
    parent: 'Part 2：三步法框架总览',
    blocks: [
      h1('Step 1：拆 JD'),
      quote(textElement('拆JD的目的：把模糊的招聘描述，变成清晰的"考察能力清单"。')),
      divider(),

      h2('一、为什么要拆JD'),
      paragraph(textElement(
        '大多数同学看JD只是为了"了解公司/岗位"，然后就去准备通用答案。'
        + '但真正的备考应该从JD出发，因为JD里隐藏了面试官几乎所有的考察点。'
      )),
      divider(),

      h2('二、JD的三层结构'),
      paragraph(textElement('任何JD都可以拆成三层：')),
      ordered(boldElement('业务是什么'), textElement(
        '\n公司/部门在做什么业务？这个岗位在业务链条里扮演什么角色？\n'
        + '→ 帮你理解"背景"，准备业务类问题'
      )),
      ordered(boldElement('要什么能力'), textElement(
        '\n职责描述和任职要求里藏着的能力关键词\n'
        + '→ 这才是面试真正考的东西'
      )),
      ordered(boldElement('会怎么问'), textElement(
        '\n根据能力反推面试题型：通用能力 → 行为题，专业能力 → Case题/简历\n'
        + '→ 帮你预判面试形式'
      )),
      divider(),

      h2('三、能力关键词提取方法'),
      paragraph(textElement('读JD时，圈出所有"动词+名词"结构的描述，例如：')),
      bullet(textElement('"负责市场数据分析" → 数据分析能力')),
      bullet(textElement('"协调跨部门资源" → 跨部门沟通 / 资源整合能力')),
      bullet(textElement('"独立完成客户尽调" → 独立工作能力 + 尽职调查专业技能')),
      bullet(textElement('"驱动项目落地" → 项目管理 + 结果导向')),
      paragraph(textElement(
        '把这些能力归类到通用能力 or 专业能力，就是你的考察清单。'
      )),
      divider(),

      h2('四、拆JD实战模板'),
      paragraph(boldElement('【JD拆解工作表】')),
      paragraph(textElement('使用方法：找到目标JD，填入下表')),
      paragraph(textElement('─────────────────────────────')),
      paragraph(boldElement('Part A：业务理解')),
      bullet(textElement('公司/部门主营业务：___________')),
      bullet(textElement('该岗位在业务链条的位置：___________')),
      bullet(textElement('岗位的核心交付物是什么：___________')),
      paragraph(textElement('─────────────────────────────')),
      paragraph(boldElement('Part B：能力清单')),
      bullet(textElement('通用能力（从职责描述中提取）：\n  1. ___  2. ___  3. ___')),
      bullet(textElement('专业能力（从任职要求中提取）：\n  1. ___  2. ___  3. ___')),
      paragraph(textElement('─────────────────────────────')),
      paragraph(boldElement('Part C：预判面试题型')),
      bullet(textElement('通用能力会用行为题考：预判3道行为题 → ___')),
      bullet(textElement('专业能力会用Case or 简历考：准备方向 → ___')),
      divider(),

      h2('五、实战示例：某咨询公司 Analyst JD'),
      paragraph(boldElement('JD 原文关键句（节选）：')),
      bullet(textElement('"参与客户咨询项目，进行市场研究和数据分析"')),
      bullet(textElement('"协助构建分析框架，撰写客户报告"')),
      bullet(textElement('"与团队成员及客户保持高效沟通"')),
      bullet(textElement('"要求：逻辑思维清晰，能在压力下工作"')),
      paragraph(boldElement('拆解结果：')),
      bullet(textElement('业务：咨询项目，核心交付是分析报告')),
      bullet(textElement('通用能力：逻辑分析、压力下工作、团队沟通')),
      bullet(textElement('专业能力：框架构建、数据分析、报告写作')),
      bullet(textElement('预判题型：行为题（压力/团队）+ Case（框架）+ 简历（数据经历）')),
    ],
  },

  // ══════════════════════════════════════════
  // 2.2 Step 2：对能力
  // ══════════════════════════════════════════
  {
    title: 'Step 2：对能力（你有没有）',
    parent: 'Part 2：三步法框架总览',
    blocks: [
      h1('Step 2：对能力'),
      quote(textElement('对能力的目的：把你的经历和JD的能力清单做匹配，找出强项和短板。')),
      divider(),

      h2('一、为什么要"对"能力'),
      paragraph(textElement(
        '很多同学有不错的实习/项目经历，但面试时说不清楚自己会什么。'
        + '原因是：没有把经历和能力关联起来。'
      )),
      paragraph(textElement(
        '"对能力"这一步，就是在建立这种连接：从经历出发找能力，从能力出发找经历。'
      )),
      divider(),

      h2('二、这些能力从哪里来'),
      paragraph(textElement(
        '商科面试的能力要求，并不是各家公司随意设定的。'
        + '它们背后有一套成熟的人力资源框架，被各大企业普遍引用：'
      )),
      bullet(boldElement('P&G 八大问'), textElement('：领导力、问题解决、创新、影响力、执行力、团队协作、分析思维、适应性')),
      bullet(boldElement('McKinsey PEI'), textElement('：个人影响力（Personal Impact）、创业精神（Entrepreneurial Drive）、达成目标（Achieving）、与他人共事（Working with Others）')),
      bullet(boldElement('Amazon 领导力原则（LP）'), textElement('：客户至上、有所担当、勤俭节约、主人翁意识、刨根问底、发明创造……共16条')),
      bullet(boldElement('ByteDance 价值观'), textElement('：追求极致、务实敢为、开放谦逊、坦诚清晰、始终创业')),
      paragraph(textElement(
        '虽然叫法不同，但这些框架考察的底层能力高度重叠。'
        + '我们把它们合并整理为9大核心能力，覆盖商科几乎所有主流岗位。'
      )),
      divider(),

      h2('三、九大核心能力详解'),
      paragraph(textElement('每个能力包含：定义 / 三个体现维度 / 优秀表现 vs 待提升表现')),
      divider(),

      // ── 能力1：逻辑分析
      h3('① 逻辑分析'),
      paragraph(
        boldElement('定义：'),
        textElement('结构化拆解复杂问题，找到关键变量，用数据和推理得出有说服力的结论。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('问题拆解 — 能将大问题拆成互相独立、完全穷尽的子问题（MECE）')),
      bullet(textElement('假设驱动 — 先形成假设，再收集数据验证，而非盲目收集信息')),
      bullet(textElement('数据推导 — 用数字和事实支撑结论，而非靠感觉判断')),
      paragraph(boldElement('✅ 优秀表现：')),
      bullet(textElement('"我把这个问题拆成收入端和成本端，先从收入端找最大的影响因素……"')),
      bullet(textElement('遇到新问题时，先问"目标是什么"，再问"有哪些可能原因"，有条不紊')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('直接给结论，说不清楚思考过程')),
      bullet(textElement('分析全是定性描述，没有数字支撑')),
      divider(),

      // ── 能力2：沟通表达
      h3('② 沟通表达'),
      paragraph(
        boldElement('定义：'),
        textElement('清晰准确地传递信息，主动倾听并理解对方意图，根据受众调整表达方式。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('结构化表达 — 先说结论，再展开细节（金字塔原理）')),
      bullet(textElement('倾听与理解 — 在回答前确认理解正确，不打断，主动提问澄清')),
      bullet(textElement('适配受众 — 面对技术团队讲数据，面对高管讲影响，面对客户讲价值')),
      paragraph(boldElement('✅ 优秀表现：')),
      bullet(textElement('面试时开口就说"我想先确认一下我的理解对不对……"')),
      bullet(textElement('汇报时说"结论是X，原因有三点，第一……"，不绕弯子')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('讲经历时东一句西一句，面试官听完不知道重点是什么')),
      bullet(textElement('不敢问清楚题意，模糊作答')),
      divider(),

      // ── 能力3：问题解决
      h3('③ 问题解决'),
      paragraph(
        boldElement('定义：'),
        textElement('识别问题根本原因，设计有效解决方案，并在资源/时间约束下推动落地。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('根因诊断 — 不停留在表面现象，追问到可改变的根本原因')),
      bullet(textElement('方案生成 — 能提出多个备选方案，评估利弊后做出选择')),
      bullet(textElement('执行迭代 — 执行中遇到阻力时，能调整策略而不是放弃')),
      paragraph(boldElement('✅ 优秀表现：')),
      bullet(textElement('遇到问题先问"为什么"5次，找到可操作的根因')),
      bullet(textElement('提出方案时说"我有A/B两个选项，A的优势是……，我建议A，因为……"')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('看到表面问题就直接处理，根因没解决，问题反复出现')),
      bullet(textElement('遇到阻力就停下来等别人解决')),
      divider(),

      // ── 能力4：团队协作
      h3('④ 团队协作'),
      paragraph(
        boldElement('定义：'),
        textElement('在团队环境中主动贡献，有效协调分歧，建立信任关系以推动共同目标。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('主动贡献 — 不等待分配，主动识别团队需要并补位')),
      bullet(textElement('协调冲突 — 面对意见分歧，能倾听各方，找到共识或做出合理决策')),
      bullet(textElement('建立信任 — 说到做到，信息透明，让团队成员愿意依赖你')),
      paragraph(boldElement('✅ 优秀表现：')),
      bullet(textElement('主动承担没人愿意做的工作，或在关键时刻站出来填补空缺')),
      bullet(textElement('团队意见不一致时，能主动总结各方观点，推动讨论走向决策')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('只做分配给自己的任务，对团队整体状态不关心')),
      bullet(textElement('遇到冲突就回避，或只维护自己的立场')),
      divider(),

      // ── 能力5：结果导向
      h3('⑤ 结果导向'),
      paragraph(
        boldElement('定义：'),
        textElement('设定清晰目标，持续跟踪进度，主动排除障碍，确保最终交付。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('目标设定 — 把模糊任务转化为可衡量的具体目标')),
      bullet(textElement('跟踪管理 — 定期回顾进度，识别风险，及时调整')),
      bullet(textElement('主动推进 — 遇到阻碍时不依赖别人推动，自己想办法')),
      paragraph(boldElement('✅ 优秀表现：')),
      bullet(textElement('接到任务第一件事是明确"什么时候/交付什么/衡量标准是什么"')),
      bullet(textElement('项目遇到阻力时，主动找解决办法并汇报，而不是等结果')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('任务做完了，但不知道结果怎么样、有没有达到目标')),
      bullet(textElement('遇到障碍第一反应是"这不是我的问题"')),
      divider(),

      // ── 能力6：领导力与影响力
      h3('⑥ 领导力与影响力'),
      paragraph(
        boldElement('定义：'),
        textElement('在没有正式权力的情况下，通过远见、沟通和信任影响他人，带动团队朝目标前进。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('方向引领 — 能在模糊情况下提出清晰的方向和优先级')),
      bullet(textElement('激励他人 — 了解团队成员的诉求，激发他们的主动性')),
      bullet(textElement('资源整合 — 在没有直接权力时，也能协调所需资源')),
      paragraph(boldElement('✅ 优秀表现（对应 McKinsey PEI "Personal Impact"）：')),
      bullet(textElement('商赛/项目中，虽然没有头衔，但大家自然听你的')),
      bullet(textElement('能识别团队情绪低落的节点并主动干预，保持士气')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('只在有正式头衔时才"领导"，没头衔就跟着别人走')),
      bullet(textElement('靠指令驱动，而不是靠说服和激励')),
      divider(),

      // ── 能力7：抗压与适应
      h3('⑦ 抗压与适应'),
      paragraph(
        boldElement('定义：'),
        textElement('在时间压力、模糊信息或频繁变化的环境中保持效能，灵活调整策略。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('压力管理 — 高压下保持冷静，不让情绪影响判断和行动')),
      bullet(textElement('模糊容忍 — 在信息不完整时也能推进，不依赖完美条件')),
      bullet(textElement('快速响应 — 情况变化时能快速调整，不僵化执行原计划')),
      paragraph(boldElement('✅ 优秀表现：')),
      bullet(textElement('实习期间同时对接3个项目，通过优先级排序完成交付，没有出错')),
      bullet(textElement('面试中被追问一个不确定的问题，坦诚说"这里我不确定，我的假设是……"')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('压力大时变得沉默或焦虑，工作效率明显下降')),
      bullet(textElement('计划有变就手足无措，需要别人告诉下一步怎么做')),
      divider(),

      // ── 能力8：学习成长
      h3('⑧ 学习成长'),
      paragraph(
        boldElement('定义：'),
        textElement('主动寻求新知识和技能，将反馈转化为可观察的行为改变，并将学到的东西迁移到新场景。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('求知欲 — 主动探索超出当前任务范围的知识')),
      bullet(textElement('反馈接受 — 面对批评时不防御，能提炼出行动要点')),
      bullet(textElement('知识迁移 — 能把一个领域学到的方法用到另一个领域')),
      paragraph(boldElement('✅ 优秀表现（对应 Amazon "Learn and Be Curious"）：')),
      bullet(textElement('在没有人要求的情况下，主动学了XX技能，并在项目中用上了')),
      bullet(textElement('能说出"我收到反馈X，我做了Y改变，结果是Z"的完整故事')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('被批评时先解释为什么，而不是先听完')),
      bullet(textElement('每次都只做熟悉的事，不主动尝试新方法')),
      divider(),

      // ── 能力9：客户/用户导向
      h3('⑨ 客户/用户导向'),
      paragraph(
        boldElement('定义：'),
        textElement('从客户/用户视角出发思考和决策，深度理解其需求，并持续创造真实价值。')
      ),
      paragraph(boldElement('三个体现维度：')),
      bullet(textElement('需求洞察 — 能区分用户说的"想要什么"和真正"需要什么"')),
      bullet(textElement('同理心 — 站在用户/客户角度感受问题，不以自己的视角代替用户视角')),
      bullet(textElement('价值验证 — 推出解决方案后持续追踪效果，是否真的解决了问题')),
      paragraph(boldElement('✅ 优秀表现（对应 P&G "Consumer Passion"，Amazon "Customer Obsession"）：')),
      bullet(textElement('描述自己的项目时，能清晰说出"我的用户是谁，他们的核心痛点是什么"')),
      bullet(textElement('在分析方案时，会主动问"这对用户来说意味着什么"')),
      paragraph(boldElement('❌ 待提升表现：')),
      bullet(textElement('做决策时只从业务角度出发，不考虑用户感受')),
      bullet(textElement('把完成KPI当目标，不关心用户实际上得到了什么价值')),
      divider(),

      h2('四、经历盘点：能力矩阵'),
      paragraph(textElement(
        '用以下矩阵，把你的每段经历和9大能力做匹配，'
        + '找出哪些能力有2个以上经历支撑（强项），哪些还是空白（短板）。'
      )),
      paragraph(boldElement('能力矩阵填写方法：')),
      bullet(textElement('行：你的所有经历（实习 / 课程项目 / 商赛 / 社团 / 志愿服务）')),
      bullet(textElement('列：9大核心能力')),
      bullet(textElement('填写：有对应经历的格子打 ✅，并写1句具体说明')),
      paragraph(boldElement('示例：')),
      bullet(textElement('XX咨询实习 × 逻辑分析：✅ 用MECE拆解零售客户市场进入路径')),
      bullet(textElement('XX商业大赛 × 团队协作：✅ 担任队长，协调组内意见分歧，最终获奖')),
      bullet(textElement('XX咨询实习 × 客户导向：✅ 独立访谈5名用户，识别出被忽视的核心需求')),
      paragraph(textElement(
        '填完矩阵后：强项多备1-2个备选故事，短板优先找替代经历（课程作业、个人项目都算）。'
      )),
    ],
  },

  // ══════════════════════════════════════════
  // 2.3 Step 3：三类表达（概览）
  // ══════════════════════════════════════════
  {
    title: 'Step 3：三类表达（怎么说）',
    parent: 'Part 2：三步法框架总览',
    blocks: [
      h1('Step 3：三类表达'),
      quote(textElement('你有能力，还需要在对的战场，用对的方式说出来。')),
      divider(),

      h2('三个战场，三套规则'),
      paragraph(textElement(
        '"表达"不是一件事，而是三件事。三类表达各有规则，需要分开准备：'
      )),
      ordered(
        boldElement('行为面试（讲经历）'),
        textElement('\n本质：用过去的故事，证明你有某种能力\n规则：真实、具体、有结构')
      ),
      ordered(
        boldElement('业务面试（做Case）'),
        textElement('\n本质：在面试现场展示你的思维过程\n规则：结构清晰、有框架、能推导结论')
      ),
      ordered(
        boldElement('简历（静态表达）'),
        textElement('\n本质：用一页纸，提前展示你的能力匹配度\n规则：JD映射、量化成果、专业呈现')
      ),
      divider(),

      h2('如何判断用哪个战场'),
      bullet(textElement('"讲一个你解决困难的经历" → 行为面试')),
      bullet(textElement('"如果你是XX公司的CMO，你会怎么做？" → Case面试')),
      bullet(textElement('"投递简历/初筛" → 简历战场')),
      bullet(textElement('很多公司会同时考三种，在 Part 3 里分别深入学习')),
      divider(),

      h2('三个战场的联系'),
      paragraph(textElement(
        '三个战场考察的底层能力是相同的（都来自JD）。'
        + '区别只在于表达形式。'
      )),
      paragraph(textElement(
        '做好 Step 1 和 Step 2，你已经有了能力清单和对应的经历。'
        + '接下来只需要把同一个"能力+经历"，包装成三个战场需要的形式。'
      )),
    ],
  },

  // ══════════════════════════════════════════
  // 3.1 行为面试（挂在 Step 3 下）
  // ══════════════════════════════════════════
  {
    title: '3.1 行为面试（讲经历）',
    parent: 'Step 3：三类表达（怎么说）',
    blocks: [
      h1('3.1 行为面试：怎么讲经历'),
      quote(textElement('行为面试的本质：用过去的行为，预测未来的表现。')),
      divider(),

      h2('一、行为面试是什么'),
      paragraph(textElement(
        '行为面试（Behavioral Interview）是最常见的面试形式。'
        + '面试官通过询问你"过去做过什么"来判断你的能力。'
      )),
      paragraph(textElement('常见问法：')),
      bullet(textElement('"讲一个你遇到挑战/困难的经历"')),
      bullet(textElement('"说一个你在团队中发挥作用的例子"')),
      bullet(textElement('"有没有在有限时间内完成高难度任务的经历？"')),
      paragraph(textElement(
        '逻辑：如果你过去能做到，未来大概率也能做到。'
        + '所以你的"故事"就是你能力的"证明"。'
      )),
      divider(),

      h2('二、如何选经历'),
      paragraph(textElement(
        '选经历的核心原则：选那些能清晰展示目标能力，且有具体行动和结果的经历。'
      )),
      paragraph(boldElement('好经历的三个特征：')),
      bullet(boldElement('具体'), textElement('：有真实的场景、角色、数字')),
      bullet(boldElement('行动导向'), textElement('：重点在你做了什么，而不只是发生了什么')),
      bullet(boldElement('有结果'), textElement('：能说出来的结果（量化更好）')),
      paragraph(boldElement('常用经历来源：')),
      bullet(textElement('实习 / 兼职（最有说服力）')),
      bullet(textElement('课程项目 / 毕业论文')),
      bullet(textElement('竞赛 / 商业大赛')),
      bullet(textElement('社团 / 学生会担任要职')),
      bullet(textElement('志愿服务 / 海外经历')),
      divider(),

      h2('三、七维故事结构（STOALRR）'),
      paragraph(textElement(
        '传统STAR框架只有4个维度，容易让故事缺乏深度。'
        + '我们推荐7维结构，让你的故事更真实、更完整、更有说服力：'
      )),
      ordered(
        boldElement('S - Situation（背景）'),
        textElement('\n什么时候？在哪个团队/项目？你的角色是什么？\n→ 1-2句，快速交代场景，不要过多')
      ),
      ordered(
        boldElement('T - Task（任务）'),
        textElement('\n你具体负责什么？核心目标是什么？\n→ 1-2句，明确你的职责和成功标准')
      ),
      ordered(
        boldElement('O - Obstacle（障碍）★ 关键升级'),
        textElement('\n你遇到了什么具体困难/挑战？为什么这是个难题？\n→ 1-2句，这是STAR缺失的关键！没有障碍，故事就没有张力')
      ),
      ordered(
        boldElement('A - Action（行动）'),
        textElement('\n你做了什么？每个决策背后的理由是什么？\n→ 这是重点，3-5句，体现你的思考过程和判断力')
      ),
      ordered(
        boldElement('R - Result（结果）'),
        textElement('\n最终结果是什么？有没有数字？对团队/项目的影响是什么？\n→ 2-3句，量化结果优先，没有数字也要说清楚影响范围')
      ),
      ordered(
        boldElement('L - Lessons（复盘）'),
        textElement('\n你从这件事里学到了什么？如果重来，你会做什么不同的决定？\n→ 1-2句，展示自我认知和成长心态')
      ),
      ordered(
        boldElement('R - Relevance（关联）'),
        textElement('\n这个经历说明你具备哪个能力？这个能力在这个岗位如何发挥？\n→ 1句，主动帮面试官做连接，不要让他猜')
      ),
      paragraph(textElement(
        'A（行动）是最重要的部分，占60-70%的时间。'
        + 'O（障碍）是新增的升级点：没有障碍的故事不真实，'
        + '而且面试官无法看到你如何应对困难、展现判断力。'
      )),
      divider(),

      h2('四、1分钟 vs 3分钟版本'),
      paragraph(textElement(
        '根据题目和面试节奏，你需要有两个版本的故事：'
      )),
      paragraph(boldElement('1分钟版本（简版）：')),
      bullet(textElement('S+T 合并，1句话交代背景')),
      bullet(textElement('O 一句话说清楚最大的挑战')),
      bullet(textElement('A 说2-3个关键动作')),
      bullet(textElement('R 1句话结果 + 1句反思')),
      bullet(textElement('适用：面试官追问 / 需要举例说明某个观点')),
      paragraph(boldElement('3分钟版本（完整版）：')),
      bullet(textElement('完整7维（STOALRR）展开')),
      bullet(textElement('A 的每个步骤都说清楚决策原因')),
      bullet(textElement('R 包含量化结果 + L 反思 + R 关联岗位')),
      bullet(textElement('适用：主面试，专门问"讲一个经历"的题')),
      divider(),

      h2('五、高频行为面试题 + 能力对照'),
      paragraph(textElement('以下是商科面试最常见的行为题类型：')),
      ordered(boldElement('挑战/困难类'), textElement('：考察抗压 + 问题解决')),
      ordered(boldElement('领导力/推动类'), textElement('：考察结果导向 + 影响力')),
      ordered(boldElement('团队/冲突类'), textElement('：考察协作 + 沟通')),
      ordered(boldElement('失败/错误类'), textElement('：考察反思 + 成长心态')),
      ordered(boldElement('数据/分析类'), textElement('：考察逻辑 + 专业能力')),
      ordered(boldElement('学习/陌生领域类'), textElement('：考察学习能力 + 适应性')),
      paragraph(textElement(
        '在 Part 4 里，每类题都有完整的拆解示范。'
      )),
      divider(),

      h2('六、行为面试常见错误'),
      bullet(textElement('太多背景（S）太少行动（A）：面试官要看你做了什么，不是发生了什么')),
      bullet(textElement('用"我们"代替"我"：面试官在评估你个人的贡献')),
      bullet(textElement('结果模糊：尽量量化，"有所提升"不如"转化率提升15%"')),
      bullet(textElement('选一个和能力不匹配的经历：先想清楚考什么，再选对应经历')),
    ],
  },

  // ══════════════════════════════════════════
  // 3.2 业务面试 / Case
  // ══════════════════════════════════════════
  {
    title: '3.2 业务面试（做Case）',
    parent: 'Step 3：三类表达（怎么说）',
    blocks: [
      h1('3.2 业务面试：怎么做Case'),
      quote(textElement('Case面试的本质：展示你在压力下，如何系统地思考和解决问题。')),
      divider(),

      h2('一、Case面试是什么'),
      paragraph(textElement(
        'Case面试（商业案例面试）常见于咨询/投行/互联网战略等岗位。'
        + '面试官会给一个真实或虚拟的商业问题，要求你现场分析。'
      )),
      paragraph(textElement('典型题型：')),
      bullet(textElement('"某零售连锁近两年利润下滑30%，可能是什么原因？怎么解决？"')),
      bullet(textElement('"XX公司想进入东南亚市场，你会怎么评估？"')),
      bullet(textElement('"一家外卖平台的用户留存率下降，你如何诊断？"')),
      paragraph(textElement(
        '面试官不是在考你有没有答案，而是在看你的思考过程是否结构清晰。'
      )),
      divider(),

      h2('二、Case面试六步法'),
      paragraph(textElement(
        '六步法覆盖了从拿到题目到给出建议的完整过程，'
        + '每一步都有明确的目标和输出，帮你在面试现场不慌不乱：'
      )),
      ordered(
        boldElement('Step 1：理解题目（Clarify）'),
        textElement('\n• 复述题目，确认你的理解是否正确\n• 问清楚目标（要解决什么？）和约束（有什么限制？）\n• 话术："让我先复述一下题目……我理解对了吗？"')
      ),
      ordered(
        boldElement('Step 2：定义问题（Define）'),
        textElement('\n• 把模糊题目转化为清晰的分析命题\n• 明确"我们要回答的核心问题是X"\n• 例："核心问题是：过去12个月利润下滑20%，根本原因是什么，如何改善？"')
      ),
      ordered(
        boldElement('Step 3：分解问题（Decompose）'),
        textElement('\n• 用MECE框架把核心问题拆成子问题\n• 大声说出你的拆解思路，让面试官看到你的逻辑\n• 例："我把利润下滑拆成收入端和成本端，先看哪个波动更大"')
      ),
      ordered(
        boldElement('Step 4：分析推导（Analyze）'),
        textElement('\n• 逐一深入分析每个模块\n• 主动向面试官要数据（"能给我去年的收入数字吗？"）\n• 用数字支撑推断，区分"已知事实"和"我的假设"')
      ),
      ordered(
        boldElement('Step 5：综合判断（Synthesize）'),
        textElement('\n• 整合各模块分析结论\n• 找到关键杠杆（哪个因素影响最大？）\n• 例："分析下来，主要问题在成本端——原材料成本上升15%是最大驱动因素"')
      ),
      ordered(
        boldElement('Step 6：输出建议（Recommend）'),
        textElement('\n• 先说结论，再说原因（金字塔原则）\n• 给出有优先级的具体行动建议，而不是"视情况而定"\n• 预判潜在风险和执行障碍\n• 例："我建议优先做A，因为……；同步可以考虑B，但风险是……"')
      ),
      divider(),

      h2('三、常用框架工具箱'),
      paragraph(textElement('框架不是模板，是帮你思考的工具。不要硬套，要理解逻辑。')),
      h3('利润分析框架'),
      bullet(textElement('利润 = 收入 - 成本')),
      bullet(textElement('收入 = 价格 × 销量')),
      bullet(textElement('销量 = 用户数 × 购买频次 × 单次购买量')),
      bullet(textElement('成本分固定成本和变动成本')),
      h3('市场进入框架'),
      bullet(textElement('市场规模 / 增长趋势')),
      bullet(textElement('竞争格局（Porter五力）')),
      bullet(textElement('进入方式（自建/收购/合作）')),
      bullet(textElement('自身能力匹配度')),
      h3('增长框架（互联网常用）'),
      bullet(textElement('增长 = 新增用户 + 存量用户留存 + 变现效率')),
      bullet(textElement('用户旅程：获客 → 激活 → 留存 → 变现 → 传播（AARRR）')),
      h3('根因分析框架（5Why）'),
      bullet(textElement('连续追问5个"为什么"，找到根本原因')),
      bullet(textElement('避免停留在表面症状，直到找到可改变的根因')),
      divider(),

      h2('四、Case面试实战技巧'),
      paragraph(boldElement('提问技巧：')),
      bullet(textElement('主动确认：面试前先复述问题，确认你理解对了')),
      bullet(textElement('数据提问：判断不了时，主动向面试官要数据（"能给我提供一下去年的收入数据吗？"）')),
      bullet(textElement('适度提问：提问要有目的，不要随便问')),
      paragraph(boldElement('思考过程展示：')),
      bullet(textElement('"我先把这个问题拆成两部分来分析……"')),
      bullet(textElement('"根据这个数据，我的假设是……"')),
      bullet(textElement('"这里有两种可能，我先排除X，因为……"')),
      paragraph(boldElement('结论输出：')),
      bullet(textElement('结论要有立场，不要只描述不判断')),
      bullet(textElement('建议要具体，最好有优先级（"我建议先做A，因为……"）')),
      divider(),

      h2('五、Case面试常见错误'),
      bullet(textElement('直接给结论，没有展示过程：面试官要看思维，不只是答案')),
      bullet(textElement('框架套死：用了框架但没有分析，每个格子写几个字就完了')),
      bullet(textElement('不敢提问：模糊的问题可以（应该）澄清，这是逻辑严谨的表现')),
      bullet(textElement('思维太窄：只想到一个角度就停了，要主动问自己"还有其他可能吗？"')),
      bullet(textElement('结论模糊：避免"视情况而定"，即使有前提条件，也要明确表态')),
    ],
  },

  // ══════════════════════════════════════════
  // 3.3 简历
  // ══════════════════════════════════════════
  {
    title: '3.3 简历（静态表达）',
    parent: 'Step 3：三类表达（怎么说）',
    blocks: [
      h1('3.3 简历：静态表达的艺术'),
      quote(textElement('简历不是履历表，是你用一页纸展示给面试官的"能力匹配度说明书"。')),
      divider(),

      h2('一、简历的本质'),
      paragraph(textElement(
        '大多数人写简历的逻辑是：把自己做过的事情列出来。'
        + '但面试官看简历的逻辑是：这个人有没有我需要的能力？'
      )),
      paragraph(textElement('这中间有一个巨大的gap：')),
      bullet(textElement('你在描述"做了什么"')),
      bullet(textElement('面试官在寻找"会什么"')),
      paragraph(textElement(
        '好的简历，是从面试官的视角出发，把你的经历翻译成能力语言。'
      )),
      divider(),

      h2('二、JD → 简历映射方法'),
      paragraph(textElement('写简历前，先拿到目标JD，做一个映射：')),
      ordered(textElement('提取JD中的能力关键词（用 Step 1 的方法）')),
      ordered(textElement('检查你的简历每条经历，问：这条经历体现了哪个关键词？')),
      ordered(textElement('如果某个JD关键词在简历里没有对应，考虑：是否有经历可以改写来体现？')),
      ordered(textElement('优先放那些和JD能力高度匹配的经历，弱相关的经历压缩或删掉')),
      paragraph(textElement(
        '目标：面试官扫一眼你的简历，就能看到JD要求的所有关键词。'
      )),
      divider(),

      h2('三、Bullet 写作公式'),
      paragraph(textElement('每一条工作/项目经历，建议用以下公式写：')),
      quote(
        boldElement('动词（行动）'),
        textElement(' + '),
        boldElement('工作内容'),
        textElement(' + '),
        boldElement('数字/结果'),
        textElement(' + '),
        boldElement('（可选）使用的方法/工具')
      ),
      paragraph(boldElement('❌ 弱版本：')),
      bullet(textElement('负责数据分析相关工作')),
      bullet(textElement('协助团队完成项目')),
      paragraph(boldElement('✅ 强版本：')),
      bullet(textElement('使用SQL和Python分析用户购买行为，识别出3个高价值用户群体，支撑产品团队制定差异化运营策略')),
      bullet(textElement('独立搭建竞对分析框架（4个维度、12个指标），完成5家竞争对手的系统性研究，最终建议写入客户最终报告')),
      paragraph(textElement('关键点：数字代表规模感，动词代表自主性，方法代表专业性。')),
      divider(),

      h2('四、怎么显得"像咨询/投行"'),
      paragraph(textElement('不同行业对简历的期待不同。以咨询/投行为例：')),
      paragraph(boldElement('咨询简历的特点：')),
      bullet(textElement('结构化：每条经历一看就有逻辑层次')),
      bullet(textElement('"驱动/推动/主导"（说明你有initiative）')),
      bullet(textElement('框架词汇：MECE、关键杠杆、根因分析')),
      bullet(textElement('量化到细节：不只是"提升30%"，还要说清楚"从X到Y"')),
      paragraph(boldElement('投行简历的特点：')),
      bullet(textElement('突出财务/数据能力：建模、估值、尽调')),
      bullet(textElement('强调交易/项目体量：金额、规模、周期')),
      bullet(textElement('呈现技术工具：Excel/VBA、Bloomberg、Python')),
      divider(),

      h2('五、简历常见错误'),
      bullet(textElement('一份简历投所有公司：不同岗位的JD不同，简历应该对应微调')),
      bullet(textElement('只写职责，不写成果：面试官不关心你做了什么，关心你做出了什么')),
      bullet(textElement('时间顺序堆砌：按重要性（和JD相关性）排序，不要按时间顺序')),
      bullet(textElement('形容词滥用："出色的沟通能力""极强的学习能力" → 删掉，用事实证明')),
      bullet(textElement('超过一页：除非是MBA或高级职位，校招简历控制在一页以内')),
    ],
  },

  // ══════════════════════════════════════════
  // 4. Part 4：高频题应用
  // ══════════════════════════════════════════
  {
    title: 'Part 4：高频题应用',
    blocks: [
      h1('Part 4：高频题应用'),
      paragraph(textElement(
        '这一节用"三步法"的视角，拆解商科面试中最高频的几道题。'
        + '每道题都有"考什么 → 用什么经历 → 怎么说"的完整示范。'
      )),
      divider(),

      h2('一、自我介绍（1-3分钟）'),
      paragraph(boldElement('考什么：')),
      bullet(textElement('初印象：是否清晰、自信、有逻辑')),
      bullet(textElement('与岗位的匹配度：你的背景是否和这个职位有关联')),
      bullet(textElement('主动引导：你想让面试官问什么')),
      paragraph(boldElement('结构建议：')),
      ordered(textElement('一句话定位（我是谁）：学校/专业/核心标签')),
      ordered(textElement('关键经历高光（我做过什么）：1-2段最相关的经历，每段1句话')),
      ordered(textElement('为什么在这里（我为什么想来）：和岗位的连接')),
      paragraph(boldElement('示例：')),
      quote(textElement(
        '"我是XX大学金融专业大四学生，主要在咨询和数据方向有经历。'
        + '大三在XX咨询参与了两个项目，负责市场调研和竞对分析。'
        + '之前还在一家互联网公司做了战略实习，做增长数据分析。'
        + '我对商业问题特别感兴趣，尤其喜欢从数据里找策略方向，'
        + '所以对贵司的战略咨询岗非常感兴趣。"'
      )),
      divider(),

      h2('二、为什么选择这个行业/公司'),
      paragraph(boldElement('考什么：')),
      bullet(textElement('是否真的了解这个行业（知识准备）')),
      bullet(textElement('动机是否真实、可持续（不只是"钱多"）')),
      bullet(textElement('是否有具体的连接点（你的经历如何引领你来这里）')),
      paragraph(boldElement('结构建议：')),
      ordered(textElement('行业认知（你对这个行业的理解是什么）')),
      ordered(textElement('个人连接（什么经历让你对这个行业产生兴趣）')),
      ordered(textElement('为什么是这家公司（公司特殊性）')),
      paragraph(boldElement('常见错误：')),
      bullet(textElement('只说"这个行业发展潜力大"→ 太泛，所有行业都可以这样说')),
      bullet(textElement('背公司介绍 → 面试官比你更了解自家公司')),
      bullet(textElement('没有个人经历支撑 → 显得不真实')),
      divider(),

      h2('三、你的优缺点'),
      paragraph(boldElement('考什么：')),
      bullet(textElement('自我认知：你是否了解自己')),
      bullet(textElement('真实性：是否说的是真实的优缺点，而不是"表演"')),
      bullet(textElement('成长心态：面对缺点，有没有改进行动')),
      paragraph(boldElement('优点回答逻辑：')),
      bullet(textElement('说1个和岗位最相关的优点')),
      bullet(textElement('给一个具体例子（STAR mini版）')),
      bullet(textElement('连接到这个岗位会如何发挥这个优点')),
      paragraph(boldElement('缺点回答逻辑：')),
      bullet(textElement('选一个真实的缺点（不要说"我太追求完美"）')),
      bullet(textElement('解释你如何意识到这个缺点')),
      bullet(textElement('说你在做什么来改进')),
      divider(),

      h2('四、你的职业规划'),
      paragraph(boldElement('考什么：')),
      bullet(textElement('目标感：你有没有想清楚要去哪里')),
      bullet(textElement('与岗位的关联：这个工作是否在你的职业路径上')),
      bullet(textElement('务实性：计划是否可执行，还是天马行空')),
      paragraph(boldElement('结构建议（3-5年版本）：')),
      ordered(textElement('短期（1-2年）：在这个岗位想学什么、做到什么程度')),
      ordered(textElement('中期（3-5年）：希望承担什么样的角色/责任')),
      ordered(textElement('连接：为什么这个职位是实现目标的关键一步')),
      paragraph(boldElement('注意：')),
      bullet(textElement('不需要说"我要成为CEO"，但需要有方向感')),
      bullet(textElement('职业规划要和岗位逻辑自洽，而不是明显跨行')),
      divider(),

      h2('五、讲一个你解决困难的经历（综合题）'),
      paragraph(textElement(
        '这是最综合的行为题，几乎所有商科面试都会问到。'
        + '用完整的 STOALRR 七维结构回答，参见 3.1 行为面试章节。'
      )),
      paragraph(boldElement('准备建议：')),
      bullet(textElement('准备2-3个不同类型的"困难经历"，避免重复')),
      bullet(textElement('每个经历对应不同的能力：逻辑、领导力、抗压、协作')),
      bullet(textElement('每个都要有清晰的 A（行动）和 R（结果）')),
      divider(),

      quote(
        boldElement('最后提醒：'),
        textElement(
          '面试准备不是背答案，是系统地梳理你的经历和能力，'
          + '让你面对任何问题都有料可讲、有理可依。'
          + '三步法用一次，所有面试你都不慌。'
        )
      ),
    ],
  },

];

// ─── 向 Docx 文档写入 blocks ────────────────────────────────────

async function writeBlocks(documentId: string, blocks: any[]) {
  // 批量写入，每次最多50块
  const chunkSize = 50;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);
    const res = await client.docx.documentBlockChildren.create({
      path: { document_id: documentId, block_id: documentId },
      data: { children: chunk },
    } as any);
    if (res.code !== 0) {
      console.error(`  ❌ 写入blocks失败 (${i}-${i + chunk.length}):`, res.msg, res.code);
    }
  }
}

// ─── 主流程 ──────────────────────────────────────────────────────
//
// 策略：用 docx.document.create 创建独立文档（tenant token 可用），
// 绕开 wiki 权限限制。创建完成后输出所有文档链接，可手动移入知识库。

async function main() {
  console.log('🚀 开始创建「商科面试三步法」文档...\n');

  const results: Array<{ title: string; parent?: string; url: string }> = [];

  for (const page of pages) {
    const indent = page.parent ? '  ' : '';
    console.log(`${indent}📄 创建：${page.title}`);

    // 创建空文档
    const docRes = await (client.docx.document as any).create({
      data: { title: page.title }
    });

    if (docRes.code !== 0) {
      console.error(`  ❌ 创建文档失败:`, docRes.msg, '| code:', docRes.code);
      continue;
    }

    const docId = docRes.data?.document?.document_id!;

    // 写入内容
    await writeBlocks(docId, page.blocks);
    const url = `https://hcn2vc1r2jus.feishu.cn/docx/${docId}`;
    results.push({ title: page.title, parent: page.parent, url });
    console.log(`${indent}  ✅ ${url}`);
  }

  console.log('\n✨ 全部完成！共创建', results.length, '个文档');
  console.log('\n📋 文档目录（按层级排序，请手动移入知识库）：');
  console.log('─'.repeat(60));
  for (const r of results) {
    const prefix = r.parent ? '    └ ' : '';
    console.log(`${prefix}${r.title}`);
    console.log(`${prefix}  ${r.url}`);
  }
}

main().catch(console.error);
