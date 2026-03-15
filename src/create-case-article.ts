import { client } from './client';

async function main() {
  // 1. 创建文档
  const createRes = await client.docx.document.create({
    data: { title: 'Wharton Case 解析｜Skedasky Farms：当白葡萄酒庄遇上增长瓶颈' },
  });

  const docId = createRes.data?.document?.document_id;
  if (!docId) {
    console.error('Failed to create document');
    process.exit(1);
  }
  console.log('Document created:', docId);

  // 2. 获取文档根 block
  const docInfo = await client.docx.document.get({
    path: { document_id: docId },
  });

  // 根 block_id 就是 document_id
  const rootBlockId = docId;

  // 构建所有 blocks
  const blocks: any[] = [];

  // --- 导语 ---
  blocks.push(textBlock('这是 Wharton Consulting Club Casebook 2022 的第一个 Case，也是最适合 Case 新手入门的案例之一。难度标注为 Easy，但麻雀虽小五脏俱全——涵盖了盈利分析（Profitability）和市场进入（Market Entry）两大经典题型。'));
  blocks.push(textBlock(''));
  blocks.push(textBlock('下面我们从咨询师的视角，完整拆解这道题。'));

  // --- 一、案例背景 ---
  blocks.push(headingBlock('一、案例背景：一家加州白葡萄酒庄的困境', 2));
  blocks.push(textBlock(''));
  blocks.push(textBlock('Skedasky Farm 是一家加州白葡萄酒生产商，业务覆盖种植、酿造、销售和分销全链条。近年来行业整体增长停滞，CEO 希望提高收入和利润。'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('关键信息梳理', 3));
  blocks.push(bulletBlock('自有葡萄园，种植所有葡萄'));
  blocks.push(bulletBlock('加州本地有加工设施（场内+附近大型工厂）'));
  blocks.push(bulletBlock('销售渠道：经销商 + 部分州内直销'));
  blocks.push(bulletBlock('产品线：从廉价盒装酒到高端瓶装酒'));
  blocks.push(bulletBlock('行业高度分散，市场份额与区域内其他主要酒庄相当'));
  blocks.push(textBlock(''));
  blocks.push(textBlock('咨询师的第一反应：行业增长停滞 + 分散市场 + 全产业链 = 既要守住现有利润，又要找新增长点。这不是一个简单的"砍成本"或者"涨价"就能解决的问题。'));

  // --- 二、分析框架 ---
  blocks.push(headingBlock('二、分析框架：三条腿走路', 2));
  blocks.push(textBlock(''));
  blocks.push(textBlock('面对"增收+增利"的双重目标，标准的 Profitability 框架（Revenue - Cost）是起点，但不够。我们需要一个更有针对性的结构：'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('第一条腿：现有收入优化（Current Revenue Streams）', 3));
  blocks.push(bulletBlock('价格策略：价格弹性分析、按品质/类型差异定价、散装 vs 单瓶策略'));
  blocks.push(bulletBlock('销量提升：争夺货架份额、拓展经销商网络、加大营销投入、推出会员制'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('第二条腿：新收入来源（New Revenue Streams）', 3));
  blocks.push(bulletBlock('新产品：红酒、起泡酒、烈酒、啤酒、餐酒搭配'));
  blocks.push(bulletBlock('新业务模式：酒庄旅游、品酒体验、婚礼活动场地、向其他企业出售葡萄'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('第三条腿：成本削减（Cost Reductions）', 3));
  blocks.push(bulletBlock('固定成本：延长设备使用寿命、谈判保险费率、降低 SG&A、探索土地机会成本'));
  blocks.push(bulletBlock('可变成本：降低包装成本、提升生产效率、降低人工和分销成本'));
  blocks.push(textBlock(''));
  blocks.push(textBlock('这个框架的亮点在于：没有套用通用模板，而是根据 Skedasky 的具体业务特征（全产业链酒庄）量身定制了分析维度。面试中，这种定制化思维是加分项。'));

  // --- 三、定价分析 ---
  blocks.push(headingBlock('三、深入分析 Q1：涨价还是降价？', 2));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('题目', 3));
  blocks.push(textBlock('Skedasky 考虑调整中端瓶装酒的价格。当前数据：'));
  blocks.push(bulletBlock('年销量 10,000 瓶，单价 $20'));
  blocks.push(bulletBlock('涨价 10% → 销量降 10%'));
  blocks.push(bulletBlock('降价 10% → 销量增 10%'));
  blocks.push(bulletBlock('（需要主动问：利润率多少？答案是 50%，即成本 $10/瓶）'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('计算过程', 3));
  blocks.push(textBlock(''));
  blocks.push(textBlock('当前状态：$20 × 10,000 瓶 - $10 × 10,000 = $100,000 利润'));
  blocks.push(textBlock(''));
  blocks.push(textBlock('涨价 10%：$22 × 9,000 - $10 × 9,000 = $108,000（+8%）'));
  blocks.push(textBlock(''));
  blocks.push(textBlock('降价 10%：$18 × 11,000 - $10 × 11,000 = $88,000（-12%）'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('结论', 3));
  blocks.push(textBlock('应该涨价。8% 的利润增长很可观，而且这还只是中端产品线——如果高端线的价格弹性更低，涨价空间可能更大。'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('面试加分点', 3));
  blocks.push(bulletBlock('主动要求利润率/成本数据，而不是等面试官给'));
  blocks.push(bulletBlock('先说计算思路，再动手算——"我打算分别算涨价和降价后的利润，然后比较"'));
  blocks.push(bulletBlock('算完不要停，给出 business insight："涨价 8% 的利润提升，几乎不需要额外投入，是最快见效的策略"'));
  blocks.push(bulletBlock('可以延伸讨论：涨价是否会影响品牌定位？竞争对手会不会趁机抢客户？'));

  // --- 四、多元化分析 ---
  blocks.push(headingBlock('四、深入分析 Q2：要不要做啤酒？', 2));
  blocks.push(textBlock(''));
  blocks.push(textBlock('Skedasky 认为自己也可以生产和销售啤酒。这是一道典型的 Brainstorming 题，考的是思维的全面性和结构化。'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('支持做啤酒的理由', 3));
  blocks.push(textBlock(''));
  blocks.push(textBlock('收入协同：'));
  blocks.push(bulletBlock('吸引新客户群体（啤酒消费者和葡萄酒消费者画像不同）'));
  blocks.push(bulletBlock('利用现有品牌资产'));
  blocks.push(bulletBlock('酒+啤套餐销售、品酒会员价值提升'));
  blocks.push(textBlock(''));
  blocks.push(textBlock('运营协同：'));
  blocks.push(bulletBlock('物流和分销可以共享，产生规模经济'));
  blocks.push(bulletBlock('部分酿造设备可复用'));
  blocks.push(bulletBlock('现有渠道关系可直接利用'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('反对做啤酒的理由', 3));
  blocks.push(textBlock(''));
  blocks.push(textBlock('商业风险：'));
  blocks.push(bulletBlock('资本投入大（新生产线、新包装、新营销）'));
  blocks.push(bulletBlock('品牌稀释——消费者不认为你是"啤酒品牌"'));
  blocks.push(bulletBlock('竞争对手在两个市场同时反击'));
  blocks.push(bulletBlock('缺乏啤酒行业的专业知识和经验'));
  blocks.push(textBlock(''));
  blocks.push(textBlock('运营挑战：'));
  blocks.push(bulletBlock('需要全新的生产线'));
  blocks.push(bulletBlock('包装体系完全不同'));
  blocks.push(bulletBlock('营销投入大幅增加'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('我的判断', 3));
  blocks.push(textBlock('不建议。核心原因是品牌认知的跨越成本太高。消费者对"加州精品葡萄酒"有天然好感，但对"葡萄酒庄做的啤酒"会有认知障碍。更好的策略是在酒类品类内横向扩展——比如做红酒、起泡酒、rosé，这些才是"低跨越成本"的品类延伸。'));

  // --- 五、进入策略 ---
  blocks.push(headingBlock('五、深入分析 Q3：如果非要做啤酒，怎么进？', 2));
  blocks.push(textBlock(''));
  blocks.push(textBlock('这是一道经典的 Market Entry 题型。三种进入方式各有利弊：'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('自建（Organic）', 3));
  blocks.push(bulletBlock('优势：完全掌控、无整合问题'));
  blocks.push(bulletBlock('劣势：耗时长、资本密集、缺乏专业知识导致失败率高'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('收购（Acquisition）', 3));
  blocks.push(bulletBlock('优势：现成的设施和团队、可借用被收购方品牌'));
  blocks.push(bulletBlock('劣势：整合难度大（文化冲突）、收购成本可能很高'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('合资（Joint Venture）', 3));
  blocks.push(bulletBlock('优势：风险共担、快速获得对方专业能力'));
  blocks.push(bulletBlock('劣势：控制权有限、合作伙伴之间可能产生管理冲突'));
  blocks.push(textBlock(''));
  blocks.push(headingBlock('我的建议', 3));
  blocks.push(textBlock('如果非做不可，建议 Joint Venture。原因是 Skedasky 完全没有啤酒经验，自建成功率太低；全资收购对一家区域性酒庄来说财务压力过大；JV 可以用最小的代价试水，验证市场反应后再决定是否加大投入。'));

  // --- 六、总结 ---
  blocks.push(headingBlock('六、这道 Case 教会我们什么', 2));
  blocks.push(textBlock(''));
  blocks.push(orderedBlock('Profitability Case 不等于"收入-成本"。好的答案要结合行业特征定制框架，而不是背模板。'));
  blocks.push(orderedBlock('数学题的重点不是算术，而是 business sense。算完数字后，能不能给出有说服力的商业判断，才是区分好坏的关键。'));
  blocks.push(orderedBlock('Brainstorming 要有结构，但更要有立场。列完 pros & cons 之后，面试官一定会问"So what?"——你必须给出自己的建议，并用逻辑支撑。'));
  blocks.push(orderedBlock('Market Entry 三种方式（自建/收购/合资）是标配知识，但选哪个要结合客户的具体情况：财务实力、行业经验、时间紧迫度。'));
  blocks.push(textBlock(''));
  blocks.push(textBlock('下一篇我们来看 Case 2: TissueCo——一个纯粹的 Profitability 案例，看看纸巾公司怎么提升利润率。'));

  // 3. 批量创建 blocks
  // 飞书 API 限制每次最多 50 个 children
  const batchSize = 50;
  for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    await client.docx.documentBlock.childrenBatchCreate({
      path: { document_id: docId, block_id: rootBlockId },
      data: {
        children: batch,
        index: -1,
      },
    });
  }

  console.log('Article created successfully!');
  console.log(`URL: https://hcn2vc1r2jus.feishu.cn/docx/${docId}`);
}

function textBlock(text: string) {
  return {
    block_type: 2, // text
    text: {
      elements: [{ text_run: { content: text } }],
      style: {},
    },
  };
}

function headingBlock(text: string, level: number) {
  // heading2 = block_type 4, heading3 = block_type 5, etc
  const blockType = level + 2;
  return {
    block_type: blockType,
    heading2: level === 2 ? { elements: [{ text_run: { content: text } }], style: {} } : undefined,
    heading3: level === 3 ? { elements: [{ text_run: { content: text } }], style: {} } : undefined,
  };
}

function bulletBlock(text: string) {
  return {
    block_type: 12, // bullet
    bullet: {
      elements: [{ text_run: { content: text } }],
      style: {},
    },
  };
}

function orderedBlock(text: string) {
  return {
    block_type: 13, // ordered
    ordered: {
      elements: [{ text_run: { content: text } }],
      style: {},
    },
  };
}

main().catch(console.error);
