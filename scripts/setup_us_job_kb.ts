/**
 * 美国商科求职 · 内容知识库
 *
 * 2 张数据表：
 *   1. 内容库  — 从 Reddit/Blind/LinkedIn 等收集的一手内容
 *   2. 选题库  — 基于知识库生成的帖子选题
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/setup_us_job_kb.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) {
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

import { client } from '../src/client';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const TEXT = 1, NUMBER = 2, SELECT = 3, MULTI_SELECT = 4, DATE = 5, CHECKBOX = 7, URL_TYPE = 15;
const opts = (...names: string[]) => ({ options: names.map(name => ({ name })) });

// ─── 表格定义 ────────────────────────────────────────────────────────

const TABLE_内容库 = {
  name: '内容库',
  default_view_name: '全部内容',
  fields: [
    { field_name: '标题', type: TEXT },
    { field_name: '来源平台', type: SELECT, property: opts('Reddit', 'Blind', 'Glassdoor', 'LinkedIn', 'YouTube', 'Twitter/X', '其他') },
    { field_name: '行业', type: MULTI_SELECT, property: opts('咨询 MBB/Big4', '投行/金融', '科技大厂 FAANG', '快消/零售', '医疗健康', '地产/基建', '通用') },
    { field_name: '主题', type: MULTI_SELECT, property: opts('简历/CV', '求职信/Cover Letter', '网申时间线', '内推/Referral', '面试 Behavioral', '面试 Case', 'Technical 面试', '薪资/谈薪', 'Offer选择', 'OPT/Visa', '美国职场文化', '中国人踩坑', '行业趋势') },
    { field_name: '核心观点', type: TEXT },
    { field_name: '原始链接', type: URL_TYPE },
    { field_name: '录入日期', type: DATE },
    { field_name: '质量评分', type: NUMBER },
    { field_name: '已用于创作', type: CHECKBOX },
    { field_name: '备注', type: TEXT },
  ],
};

const TABLE_选题库 = {
  name: '选题库',
  default_view_name: '全部选题',
  fields: [
    { field_name: '选题标题', type: TEXT },
    { field_name: '目标读者痛点', type: TEXT },
    { field_name: '平台', type: MULTI_SELECT, property: opts('小红书', '微信公众号', '抖音', 'B站', '知乎') },
    { field_name: '内容形式', type: SELECT, property: opts('干货攻略', '避坑指南', '亲历故事', '数据盘点', '工具模板', '问答FAQ') },
    { field_name: '关联行业', type: MULTI_SELECT, property: opts('咨询 MBB/Big4', '投行/金融', '科技大厂 FAANG', '快消/零售', '通用') },
    { field_name: '关联主题', type: MULTI_SELECT, property: opts('简历/CV', '求职信/Cover Letter', '网申时间线', '内推/Referral', '面试 Behavioral', '面试 Case', 'Technical 面试', '薪资/谈薪', 'OPT/Visa', '美国职场文化', '中国人踩坑') },
    { field_name: '知识来源摘要', type: TEXT },
    { field_name: '状态', type: SELECT, property: opts('待写', '写作中', '已完成', '已发布') },
    { field_name: '发布日期', type: DATE },
    { field_name: '备注', type: TEXT },
  ],
};

// ─── 示例数据 ────────────────────────────────────────────────────────

const d = (s: string) => new Date(s).getTime();

const DATA_内容库 = [
  {
    标题: 'McKinsey BA面试：interviewer-led vs interviewee-led case 区别',
    来源平台: 'Reddit',
    行业: ['咨询 MBB/Big4'],
    主题: ['面试 Case'],
    核心观点: 'McKinsey用interviewer-led，面试官引导每步。BCG/Bain用interviewee-led，候选人主导结构。前者更考察反应速度，后者更考察框架完整性。',
    录入日期: d('2026-03-01'),
    质量评分: 5,
    已用于创作: false,
  },
  {
    标题: 'Goldman Sachs IBD 2025 Full-time offer薪资数据（Blind汇总）',
    来源平台: 'Blind',
    行业: ['投行/金融'],
    主题: ['薪资/谈薪', 'Offer选择'],
    核心观点: 'GS IBD NY base $110k + signing $20k + first-year bonus ~50-80%. 总comp约$180-210k. 注意bonus比例高，需考虑风险。',
    录入日期: d('2026-03-05'),
    质量评分: 4,
    已用于创作: false,
  },
  {
    标题: 'OPT申请时间线：毕业前90天开始，关键节点不能错',
    来源平台: 'Reddit',
    行业: ['通用'],
    主题: ['OPT/Visa'],
    核心观点: '毕业前90天可提交OPT申请，最早开始日期是毕业后60天内，STEM OPT可额外延期24个月。DSO提交→USCIS审批通常3-5个月，务必早申请。',
    录入日期: d('2026-03-08'),
    质量评分: 5,
    已用于创作: false,
  },
  {
    标题: '为什么中国留学生总在Behavioral面试中失败',
    来源平台: 'LinkedIn',
    行业: ['通用'],
    主题: ['面试 Behavioral', '中国人踩坑'],
    核心观点: '3个常见失误：1)故事太短没细节 2)用"我们"而非"我" 3)结果没有量化数据。美国面试官想听到个人主导力，不是集体成就。',
    录入日期: d('2026-03-10'),
    质量评分: 5,
    已用于创作: false,
  },
  {
    标题: 'How to ask for a referral on LinkedIn - template that actually works',
    来源平台: 'LinkedIn',
    行业: ['通用'],
    主题: ['内推/Referral'],
    核心观点: '关键：不要直接问"能帮我内推吗"，先建立联系，聊对方经历，再提请求。模板：说明共同点→表达对公司真实兴趣→具体请求（内推/30分钟聊天）→感谢。',
    录入日期: d('2026-03-10'),
    质量评分: 4,
    已用于创作: false,
  },
];

const DATA_选题库 = [
  {
    选题标题: '中国留学生做McKinsey Case面试，这3个坑99%的人都踩过',
    目标读者痛点: '不知道MBB case面试跟国内不一样，准备方向错误',
    平台: ['小红书'],
    内容形式: '避坑指南',
    关联行业: ['咨询 MBB/Big4'],
    关联主题: ['面试 Case', '中国人踩坑'],
    状态: '待写',
  },
  {
    选题标题: '2025年美国投行IBD真实薪资：base/bonus/signing全拆解',
    目标读者痛点: '不知道美国投行实际到手多少，被高base迷惑',
    平台: ['小红书', '知乎'],
    内容形式: '数据盘点',
    关联行业: ['投行/金融'],
    关联主题: ['薪资/谈薪'],
    状态: '待写',
  },
  {
    选题标题: 'OPT申请避坑：留学生最常犯的5个错误，错过就是错过',
    目标读者痛点: 'OPT流程不熟悉，时间节点搞错导致无法工作',
    平台: ['小红书'],
    内容形式: '干货攻略',
    关联行业: ['通用'],
    关联主题: ['OPT/Visa'],
    状态: '待写',
  },
  {
    选题标题: '为什么你的Behavioral面试总过不了？美国HR说了实话',
    目标读者痛点: '行为面试屡战屡败，不知道问题出在哪',
    平台: ['小红书', '微信公众号'],
    内容形式: '亲历故事',
    关联行业: ['通用'],
    关联主题: ['面试 Behavioral', '中国人踩坑'],
    状态: '待写',
  },
  {
    选题标题: '在LinkedIn上要内推，这个模板回复率超高',
    目标读者痛点: '不知道怎么开口要内推，怕被拒',
    平台: ['小红书'],
    内容形式: '工具模板',
    关联行业: ['通用'],
    关联主题: ['内推/Referral'],
    状态: '待写',
  },
];

// ─── 视图定义 ────────────────────────────────────────────────────────

const EXTRA_VIEWS: Array<{ table: string; name: string; type: 'grid' | 'kanban' | 'gallery' | 'gantt' | 'form' }> = [
  { table: '内容库', name: '按行业分组', type: 'grid' },
  { table: '内容库', name: '高质量内容 (4-5分)', type: 'grid' },
  { table: '内容库', name: '未用于创作', type: 'grid' },
  { table: '选题库', name: '待写选题', type: 'grid' },
  { table: '选题库', name: '按平台分组', type: 'grid' },
  { table: '选题库', name: '创作看板', type: 'kanban' },
];

// ─── main ───────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   美国商科求职 · 内容知识库                  ║');
  console.log('║   内容库 + 选题库                            ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ① 创建多维表格
  console.log('① 创建多维表格...');
  const appRes = await (client.bitable as any).app.create({
    data: { name: '美国商科求职 · 内容知识库' },
  });
  if (appRes.code !== 0) {
    console.error('  创建失败:', appRes.msg, '| code:', appRes.code);
    return;
  }
  const appToken = appRes.data?.app?.app_token!;
  console.log(`  app_token: ${appToken}`);
  console.log(`  链接: https://hcn2vc1r2jus.feishu.cn/base/${appToken}\n`);

  // 获取默认表
  const defRes = await client.bitable.appTable.list({ path: { app_token: appToken } });
  const defaultTableId = defRes.data?.items?.[0]?.table_id;

  // ② 创建 2 张数据表
  console.log('② 创建数据表...');
  const tableIds: Record<string, string> = {};

  for (const [key, def] of [['内容库', TABLE_内容库], ['选题库', TABLE_选题库]] as [string, any][]) {
    const res = await client.bitable.appTable.create({
      path: { app_token: appToken },
      data: { table: def },
    });
    if (res.code === 0) {
      tableIds[key] = res.data?.table_id!;
      console.log(`  [OK] ${def.name} → ${tableIds[key]}`);
    } else {
      console.error(`  [FAIL] ${def.name}: ${res.msg}`);
    }
    await sleep(300);
  }

  // 删除默认表
  if (defaultTableId) {
    await client.bitable.appTable.delete({
      path: { app_token: appToken, table_id: defaultTableId },
    });
    console.log('  [OK] 默认空表已删除');
  }

  // ③ 写入示例数据
  console.log('\n③ 写入示例数据...');
  for (const [key, data] of [['内容库', DATA_内容库], ['选题库', DATA_选题库]] as [string, any[]][]) {
    const tid = tableIds[key];
    if (!tid) continue;
    const res = await client.bitable.appTableRecord.batchCreate({
      path: { app_token: appToken, table_id: tid },
      data: { records: data.map(fields => ({ fields })) },
    });
    const ok = res.code === 0;
    console.log(`  ${ok ? '[OK]' : '[FAIL]'} ${key}: ${ok ? data.length + ' 条' : res.msg}`);
    await sleep(400);
  }

  // ④ 创建视图
  console.log('\n④ 创建视图...');
  for (const v of EXTRA_VIEWS) {
    const tid = tableIds[v.table];
    if (!tid) continue;
    try {
      const res = await client.bitable.appTableView.create({
        path: { app_token: appToken, table_id: tid },
        data: { view_name: v.name, view_type: v.type },
      });
      console.log(`  ${res.code === 0 ? '[OK]' : '[SKIP]'} ${v.table} → ${v.name}`);
    } catch (e: any) {
      console.log(`  [SKIP] ${v.table} → ${v.name}: ${e.message?.slice(0, 60)}`);
    }
    await sleep(200);
  }

  // ⑤ 汇总
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   搭建完成！                                 ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\n  访问: https://hcn2vc1r2jus.feishu.cn/base/${appToken}`);
  console.log(`\n  内容库: ${tableIds['内容库']} (${DATA_内容库.length} 条示例)`);
  console.log(`  选题库: ${tableIds['选题库']} (${DATA_选题库.length} 条示例)`);
  console.log('\n  视图:');
  console.log('    内容库 → 全部内容 / 按行业分组 / 高质量内容 / 未用于创作');
  console.log('    选题库 → 全部选题 / 待写选题 / 按平台分组 / 内容日历');
  console.log('\n  下一步:');
  console.log('    1. 在「内容库」持续录入 Reddit/Blind/LinkedIn 内容');
  console.log('    2. 「未用于创作」视图找灵感 → 生成选题填入「选题库」');
  console.log('    3. 「待写选题」+ 「内容日历」管理创作节奏');
  console.log('');
}

run().catch(console.error);
