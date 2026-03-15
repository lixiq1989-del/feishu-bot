/**
 * 求职管理系统 - 飞书多维表格自动搭建脚本
 *
 * 6 张数据表，覆盖求职全闭环：
 *   1. 公司库 Companies       — 收集与筛选
 *   2. 岗位库 Roles           — JD 管理与优先级
 *   3. 投递 Pipeline          — 跟进与节奏
 *   4. JD解析 & 能力映射      — 面试三步法核心
 *   5. 面试准备 & 题库        — 训练 + 素材
 *   6. 面试复盘 & Follow-up   — 迭代 + 跟进
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/setup_job_hunting.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 加载 .env
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

// ─── helpers ────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const d = (s: string) => new Date(s).getTime();

// ─── field type constants ───────────────────────────────────────────
const TEXT = 1, NUMBER = 2, SELECT = 3, MULTI_SELECT = 4, DATE = 5, CHECKBOX = 7, URL_TYPE = 15;
const opts = (...names: string[]) => ({ options: names.map(name => ({ name })) });

// ─── table definitions ─────────────────────────────────────────────

const TABLES: Record<string, any> = {

  // ─── A. 公司库 Companies ──────────────────────────────
  公司库: {
    name: '公司库 Companies',
    default_view_name: '全部公司',
    fields: [
      { field_name: '公司名称', type: TEXT },
      { field_name: '行业/赛道', type: SELECT, property: opts('咨询', '互联网', '金融', '快消', '外企', '国企', '医药', '教育', '制造', '新能源', '其他') },
      { field_name: '地区', type: SELECT, property: opts('北京', '上海', '深圳', '广州', '杭州', '成都', '香港', '英国', '美国', '新加坡', '其他') },
      { field_name: '公司类型', type: SELECT, property: opts('MBB咨询', '四大', '头部互联网', '中厂', '外企500强', '国企/央企', '创业公司', '投行/基金', '其他') },
      { field_name: '官网/招聘页', type: URL_TYPE },
      { field_name: '内推人/联系人', type: TEXT },
      { field_name: '星标', type: CHECKBOX },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── B. 岗位库 Roles ─────────────────────────────────
  岗位库: {
    name: '岗位库 Roles',
    default_view_name: '全部岗位',
    fields: [
      { field_name: '岗位名称', type: TEXT },
      { field_name: '关联公司', type: TEXT },
      { field_name: 'JD 原文', type: TEXT },
      { field_name: 'JD 链接', type: URL_TYPE },
      { field_name: '职能方向', type: SELECT, property: opts('战略咨询', '管理咨询', '产品经理', '运营', '数据分析', '投研', '市场营销', '人力资源', '财务', '技术研发', '其他') },
      { field_name: '地区', type: SELECT, property: opts('北京', '上海', '深圳', '广州', '杭州', '成都', '香港', '英国', '美国', '新加坡', '其他') },
      { field_name: '优先级', type: SELECT, property: opts('S', 'A', 'B', 'C') },
      { field_name: '截止日期', type: DATE },
      { field_name: '招聘进度', type: SELECT, property: opts('未投', '已投', '笔试', '一面', '二面', '终面', 'Offer', '拒') },
      { field_name: '匹配度评分', type: NUMBER },
      { field_name: '关键要求标签', type: MULTI_SELECT, property: opts('SQL', 'Case', '英语', '数据分析', 'Python', 'Excel', '建模', '行业研究', '沟通表达', '领导力', '实习经历', '留学背景') },
      { field_name: '风险点', type: TEXT },
    ],
  },

  // ─── C. 投递 Pipeline ────────────────────────────────
  投递Pipeline: {
    name: '投递 Pipeline',
    default_view_name: '全部投递',
    fields: [
      { field_name: '投递ID', type: TEXT },
      { field_name: '关联岗位', type: TEXT },
      { field_name: '当前阶段', type: SELECT, property: opts('准备中', '已投递', '笔试', '一面', '二面', '终面', 'Offer', '拒', '暂停') },
      { field_name: '投递日期', type: DATE },
      { field_name: '下次动作', type: SELECT, property: opts('跟进邮件', '准备面试', '补材料', '等待结果', '复盘', '发Thank-you信', '无') },
      { field_name: '下次动作日期', type: DATE },
      { field_name: '投递渠道', type: SELECT, property: opts('官网', '内推', '猎头', '校招', 'LinkedIn', 'Boss直聘', '其他') },
      { field_name: '简历版本', type: SELECT, property: opts('咨询版', '产品版', '运营版', '数据版', '英文版', '通用版') },
      { field_name: 'Cover Letter 链接', type: URL_TYPE },
      { field_name: '备注', type: TEXT },
      { field_name: '需要提醒', type: CHECKBOX },
    ],
  },

  // ─── D. JD解析 & 能力映射 ────────────────────────────
  JD解析: {
    name: 'JD解析 & 能力映射',
    default_view_name: '全部解析',
    fields: [
      { field_name: 'JD解析ID', type: TEXT },
      { field_name: '关联岗位', type: TEXT },
      { field_name: 'JD 关键词提取', type: TEXT },
      { field_name: '岗位核心任务 Top5', type: TEXT },
      { field_name: '能力模型映射', type: MULTI_SELECT, property: opts('问题拆解', '结构化表达', '数据分析', '沟通影响', '领导力', '抗压', '商业敏感', '逻辑推理', '团队协作', '学习能力', '英语能力') },
      { field_name: '三步法-拆JD', type: TEXT },
      { field_name: '三步法-映射能力', type: TEXT },
      { field_name: '三步法-表达证据', type: TEXT },
      { field_name: '必考题预测', type: TEXT },
      { field_name: '风险点与补救', type: TEXT },
      { field_name: '一句话定位', type: TEXT },
    ],
  },

  // ─── E. 面试准备 & 题库 ─────────────────────────────
  面试题库: {
    name: '面试准备 & 题库',
    default_view_name: '全部题目',
    fields: [
      { field_name: '题目/模块', type: TEXT },
      { field_name: '题型', type: SELECT, property: opts('行为题', '动机题', '专业题', 'Case', '估算题', 'Fit题', '压力题') },
      { field_name: '关联岗位', type: TEXT },
      { field_name: '标准答案', type: TEXT },
      { field_name: '我的版本', type: TEXT },
      { field_name: '例子素材', type: TEXT },
      { field_name: '练习状态', type: SELECT, property: opts('未写', '已写', '已背', '已熟练') },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── F. 面试复盘 & Follow-up ────────────────────────
  面试复盘: {
    name: '面试复盘 & Follow-up',
    default_view_name: '全部复盘',
    fields: [
      { field_name: '复盘ID', type: TEXT },
      { field_name: '关联投递', type: TEXT },
      { field_name: '面试轮次', type: SELECT, property: opts('笔试', '一面', '二面', '终面', 'HR面', '群面', 'Partner面') },
      { field_name: '面试日期时间', type: DATE },
      { field_name: '面试官信息', type: TEXT },
      { field_name: '问题清单', type: TEXT },
      { field_name: '我的表现评分', type: NUMBER },
      { field_name: '做得好的点', type: TEXT },
      { field_name: '暴露的问题', type: TEXT },
      { field_name: '下次改进动作', type: TEXT },
      { field_name: 'Follow-up 邮件模板', type: TEXT },
      { field_name: '是否已发送', type: CHECKBOX },
      { field_name: 'Follow-up 截止时间', type: DATE },
    ],
  },
};

// ─── sample data ────────────────────────────────────────────────────

const DATA_公司库 = [
  { 公司名称: '麦肯锡', '行业/赛道': '咨询', 地区: '上海', 公司类型: 'MBB咨询', '内推人/联系人': '学长A（2024届入职）', 星标: true, 备注: '每年秋招9月开放' },
  { 公司名称: 'BCG 波士顿咨询', '行业/赛道': '咨询', 地区: '北京', 公司类型: 'MBB咨询', '内推人/联系人': '', 星标: true, 备注: '偏好理工+商科复合背景' },
  { 公司名称: '贝恩咨询', '行业/赛道': '咨询', 地区: '上海', 公司类型: 'MBB咨询', 星标: true, 备注: '文化偏 people-first' },
  { 公司名称: '字节跳动', '行业/赛道': '互联网', 地区: '北京', 公司类型: '头部互联网', '内推人/联系人': '实习同事B', 星标: true, 备注: '产品/运营/数据都在招' },
  { 公司名称: '腾讯', '行业/赛道': '互联网', 地区: '深圳', 公司类型: '头部互联网', 星标: false, 备注: 'CSIG/PCG 事业群' },
  { 公司名称: '中金公司', '行业/赛道': '金融', 地区: '北京', 公司类型: '投行/基金', 星标: false, 备注: '投行部/研究部' },
  { 公司名称: '宝洁 P&G', '行业/赛道': '快消', 地区: '广州', 公司类型: '外企500强', 星标: false, 备注: 'CBD/市场部经典管培' },
  { 公司名称: '高盛 Goldman Sachs', '行业/赛道': '金融', 地区: '香港', 公司类型: '投行/基金', '内推人/联系人': '', 星标: false, 备注: 'IBD/S&T/AM' },
];

const DATA_岗位库 = [
  { 岗位名称: 'Business Analyst（秋招）', 关联公司: '麦肯锡', 'JD 原文': '负责客户战略项目的数据分析与问题拆解，参与客户访谈，产出项目报告...', 职能方向: '战略咨询', 地区: '上海', 优先级: 'S', 截止日期: d('2026-09-30'), 招聘进度: '未投', 匹配度评分: 9, 关键要求标签: ['Case', '英语', '数据分析', '沟通表达', '领导力'], 风险点: 'Case 能力需要大量练习' },
  { 岗位名称: 'Associate Consultant', 关联公司: 'BCG 波士顿咨询', 职能方向: '战略咨询', 地区: '北京', 优先级: 'S', 截止日期: d('2026-10-15'), 招聘进度: '未投', 匹配度评分: 8, 关键要求标签: ['Case', '英语', '数据分析', '建模'], 风险点: '需要准备 Written Case' },
  { 岗位名称: '产品经理（校招）', 关联公司: '字节跳动', 'JD 原文': '负责产品需求分析、竞品调研、数据驱动决策...', 职能方向: '产品经理', 地区: '北京', 优先级: 'A', 截止日期: d('2026-10-31'), 招聘进度: '未投', 匹配度评分: 7, 关键要求标签: ['数据分析', '沟通表达', '实习经历'], 风险点: '需要突出产品 sense 和数据能力' },
  { 岗位名称: '数据分析师', 关联公司: '腾讯', 职能方向: '数据分析', 地区: '深圳', 优先级: 'A', 截止日期: d('2026-11-15'), 招聘进度: '未投', 匹配度评分: 7, 关键要求标签: ['SQL', 'Python', '数据分析', 'Excel'], 风险点: 'SQL 实操需加强' },
  { 岗位名称: '投行分析师', 关联公司: '中金公司', 职能方向: '投研', 地区: '北京', 优先级: 'B', 截止日期: d('2026-10-20'), 招聘进度: '未投', 匹配度评分: 6, 关键要求标签: ['建模', '行业研究', 'Excel', '英语'], 风险点: '缺少金融建模实操经验' },
  { 岗位名称: 'CBD 管培生', 关联公司: '宝洁 P&G', 职能方向: '市场营销', 地区: '广州', 优先级: 'B', 截止日期: d('2026-09-15'), 招聘进度: '未投', 匹配度评分: 6, 关键要求标签: ['英语', '沟通表达', '领导力'], 风险点: '快消行业了解不够深入' },
];

const DATA_投递Pipeline = [
  { 投递ID: 'MCK-BA-2026', 关联岗位: '麦肯锡-BA', 当前阶段: '准备中', 下次动作: '准备面试', 下次动作日期: d('2026-09-01'), 投递渠道: '官网', 简历版本: '咨询版', 备注: '先练 Case 再投', 需要提醒: true },
  { 投递ID: 'BCG-AC-2026', 关联岗位: 'BCG-AC', 当前阶段: '准备中', 下次动作: '准备面试', 下次动作日期: d('2026-09-15'), 投递渠道: '官网', 简历版本: '咨询版', 备注: 'Written Case 特训', 需要提醒: true },
  { 投递ID: 'BYTE-PM-2026', 关联岗位: '字节-产品经理', 当前阶段: '已投递', 投递日期: d('2026-08-20'), 下次动作: '等待结果', 下次动作日期: d('2026-09-05'), 投递渠道: '内推', 简历版本: '产品版', 备注: '内推人已提交', 需要提醒: true },
  { 投递ID: 'TX-DATA-2026', 关联岗位: '腾讯-数据分析', 当前阶段: '笔试', 投递日期: d('2026-08-15'), 下次动作: '准备面试', 下次动作日期: d('2026-09-10'), 投递渠道: '官网', 简历版本: '数据版', 备注: '笔试已通过，等面试通知', 需要提醒: true },
  { 投递ID: 'PG-CBD-2026', 关联岗位: '宝洁-CBD', 当前阶段: '一面', 投递日期: d('2026-08-01'), 下次动作: '准备面试', 下次动作日期: d('2026-09-03'), 投递渠道: '官网', 简历版本: '通用版', 备注: '一面是英文 BEI', 需要提醒: true },
];

const DATA_JD解析 = [
  {
    JD解析ID: 'JD-MCK-BA',
    关联岗位: '麦肯锡-BA',
    'JD 关键词提取': 'problem solving, data analysis, client engagement, structured thinking, leadership',
    '岗位核心任务 Top5': '1. 客户战略问题拆解\n2. 数据分析与洞察挖掘\n3. 客户访谈与沟通\n4. 项目报告撰写\n5. 团队协作与项目管理',
    能力模型映射: ['问题拆解', '结构化表达', '数据分析', '沟通影响', '领导力'],
    '三步法-拆JD': '维度1: 分析能力（权重最高）→ Case Interview 核心考察\n维度2: 沟通影响力 → 客户访谈/团队协作\n维度3: 领导力 → 团队项目管理经验',
    '三步法-映射能力': '分析能力 → 我的数据分析实习 + Case练习200+\n沟通力 → 社团主席经历/英文辩论\n领导力 → 带队比赛获奖经历',
    '三步法-表达证据': 'STAR1: 实习中用数据分析发现增长机会，带来15%转化提升\nSTAR2: 校园咨询社团带领5人团队完成3个pro-bono项目\nSTAR3: 英文辩论赛获最佳辩手',
    必考题预测: '1. Why consulting? Why McKinsey?\n2. Walk me through your resume\n3. Tell me about a time you led a team\n4. Case: 市场进入/利润下降/并购\n5. What questions do you have for me?',
    风险点与补救: '风险: Case练习量不够，估算类偏弱\n补救: 每天1个Case，重点练market sizing',
    一句话定位: '用数据驱动决策的复合背景候选人，擅长把复杂问题拆成可执行的行动方案',
  },
  {
    JD解析ID: 'JD-BYTE-PM',
    关联岗位: '字节-产品经理',
    'JD 关键词提取': '用户需求, 数据驱动, 竞品分析, AB测试, 产品迭代',
    '岗位核心任务 Top5': '1. 用户需求调研与分析\n2. 产品方案设计\n3. 数据埋点与效果分析\n4. 竞品调研\n5. 跨部门协调推进',
    能力模型映射: ['问题拆解', '数据分析', '沟通影响', '商业敏感', '学习能力'],
    '三步法-拆JD': '维度1: 产品感觉（核心）→ 能否发现用户痛点\n维度2: 数据能力 → 用数据验证假设\n维度3: 执行推动力 → 跨团队协调',
    '三步法-映射能力': '产品感觉 → 实习期间独立负责的功能迭代\n数据能力 → SQL+Python数据分析经验\n执行力 → 项目管理推进经历',
    '三步法-表达证据': 'STAR1: 实习中发现用户留存下降，分析数据后提出新功能方案，DAU提升8%\nSTAR2: 独立完成竞品分析报告，被产品总监采纳',
    必考题预测: '1. 你最喜欢的App，怎么改进？\n2. 设计一个XX产品的核心功能\n3. DAU下降了怎么排查？\n4. 描述一次你推动跨部门合作的经历',
    风险点与补救: '风险: 互联网产品实习经验偏少\n补救: 多做产品分析报告，准备3-5个产品拆解案例',
    一句话定位: '数据敏感+用户导向的产品候选人，擅长用数据发现问题并推动产品迭代',
  },
];

const DATA_面试题库 = [
  { '题目/模块': 'Why consulting?', 题型: '动机题', 关联岗位: '麦肯锡-BA / BCG-AC', 标准答案: '（参考框架）1. 行业热情 2. 能力匹配 3. 成长路径', 我的版本: '', 例子素材: '社团咨询项目经历 + 实习中解决问题的成就感', 练习状态: '未写' },
  { '题目/模块': 'Tell me about a time you led a team', 题型: '行为题', 关联岗位: '通用', 标准答案: 'STAR法则：Situation-Task-Action-Result', 我的版本: '', 例子素材: '社团主席 / 课程小组项目', 练习状态: '未写' },
  { '题目/模块': 'Market Sizing: 中国咖啡市场规模', 题型: '估算题', 关联岗位: '麦肯锡-BA / BCG-AC', 标准答案: '人口 × 渗透率 × 频次 × 客单价', 我的版本: '', 练习状态: '未写' },
  { '题目/模块': 'Case: 利润下降诊断', 题型: 'Case', 关联岗位: '麦肯锡-BA / BCG-AC', 标准答案: '利润 = 收入 - 成本 → 分别拆解', 我的版本: '', 练习状态: '未写' },
  { '题目/模块': 'DAU下降了怎么排查？', 题型: '专业题', 关联岗位: '字节-产品经理', 标准答案: '分维度排查：时间/渠道/地域/版本/功能模块', 我的版本: '', 练习状态: '未写' },
  { '题目/模块': '你最喜欢的App怎么改进？', 题型: '专业题', 关联岗位: '字节-产品经理', 标准答案: '用户-场景-痛点-方案-验证 框架', 我的版本: '', 练习状态: '未写' },
  { '题目/模块': 'Describe a conflict with a teammate', 题型: '行为题', 关联岗位: '通用', 标准答案: 'STAR + 强调沟通方式和结果', 我的版本: '', 练习状态: '未写' },
  { '题目/模块': 'Walk me through your resume', 题型: 'Fit题', 关联岗位: '通用', 标准答案: '2分钟版本：教育背景→实习/项目→why this role', 我的版本: '', 练习状态: '已写', 备注: '需要针对不同岗位调整侧重点' },
];

const DATA_面试复盘 = [
  {
    复盘ID: 'REV-PG-CBD-R1',
    关联投递: 'PG-CBD-2026',
    面试轮次: '一面',
    面试日期时间: d('2026-09-03'),
    面试官信息: 'Brand Manager, 约5年经验',
    问题清单: '1. Tell me about a time you influenced someone\n2. Describe your biggest failure\n3. Why P&G?\n4. Why CBD specifically?',
    我的表现评分: 7,
    做得好的点: '影响力的例子讲得很生动，面试官频频点头；Why P&G 准备充分',
    暴露的问题: 'failure 的例子太小，缺乏反思深度；英语有几次卡壳',
    下次改进动作: '1. 准备一个更有深度的failure故事\n2. 每天英语口语练习30分钟\n3. 录音回听自己的回答',
    'Follow-up 邮件模板': 'Dear [Interviewer],\n\nThank you for taking the time to speak with me today. I enjoyed learning about [specific topic discussed]...',
    是否已发送: false,
    'Follow-up 截止时间': d('2026-09-04'),
  },
  {
    复盘ID: 'REV-TX-DATA-EXAM',
    关联投递: 'TX-DATA-2026',
    面试轮次: '笔试',
    面试日期时间: d('2026-08-25'),
    面试官信息: '—（线上笔试）',
    问题清单: '1. SQL查询（3道）\n2. 数据分析案例题\n3. 概率统计\n4. 编程题',
    我的表现评分: 8,
    做得好的点: 'SQL和编程题完成度高，数据分析思路清晰',
    暴露的问题: '概率题有一道卡住了，花了太多时间',
    下次改进动作: '复习概率论基础（贝叶斯/条件概率）',
    是否已发送: true,
    'Follow-up 截止时间': d('2026-08-26'),
  },
];

// ─── table order ────────────────────────────────────────────────────
const TABLE_ORDER = [
  '公司库', '岗位库', '投递Pipeline', 'JD解析', '面试题库', '面试复盘',
];

// ─── data map ───────────────────────────────────────────────────────
const DATA_MAP: Record<string, any[]> = {
  公司库: DATA_公司库,
  岗位库: DATA_岗位库,
  投递Pipeline: DATA_投递Pipeline,
  JD解析: DATA_JD解析,
  面试题库: DATA_面试题库,
  面试复盘: DATA_面试复盘,
};

// ─── views to create ────────────────────────────────────────────────
const EXTRA_VIEWS: Array<{ table: string; name: string; type: any }> = [
  // 公司库
  { table: '公司库', name: '按行业分组', type: 'grid' },
  { table: '公司库', name: '星标公司', type: 'grid' },
  // 岗位库
  { table: '岗位库', name: 'S级岗位', type: 'grid' },
  { table: '岗位库', name: '按职能方向分组', type: 'grid' },
  { table: '岗位库', name: 'Deadline 日历', type: 'calendar' },
  // 投递 Pipeline
  { table: '投递Pipeline', name: 'Pipeline 看板', type: 'kanban' },
  { table: '投递Pipeline', name: '今日待办', type: 'grid' },
  { table: '投递Pipeline', name: '本周待办', type: 'grid' },
  { table: '投递Pipeline', name: '甘特图', type: 'gantt' },
  // JD 解析
  { table: 'JD解析', name: '按职能方向', type: 'grid' },
  // 面试题库
  { table: '面试题库', name: '按题型分组', type: 'grid' },
  { table: '面试题库', name: '未完成题目', type: 'grid' },
  // 面试复盘
  { table: '面试复盘', name: '待发送 Follow-up', type: 'grid' },
  { table: '面试复盘', name: '复盘日历', type: 'calendar' },
];

// ─── main ───────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   求职管理系统 - 飞书多维表格搭建            ║');
  console.log('║   6 张数据表 | 求职全闭环覆盖                ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ① 创建多维表格 App
  console.log('① 创建多维表格应用...');
  const appRes = await (client.bitable as any).app.create({
    data: { name: '求职管理系统' },
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

  // ② 创建 6 张数据表
  console.log('② 创建 6 张数据表...');
  const tableIds: Record<string, string> = {};

  for (const key of TABLE_ORDER) {
    const def = TABLES[key];
    if (!def) { console.log(`  [SKIP] ${key} - 无定义`); continue; }
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
  for (const key of TABLE_ORDER) {
    const tid = tableIds[key];
    const data = DATA_MAP[key];
    if (!tid || !data || data.length === 0) continue;

    const res = await client.bitable.appTableRecord.batchCreate({
      path: { app_token: appToken, table_id: tid },
      data: { records: data.map(fields => ({ fields })) },
    });
    const ok = res.code === 0;
    console.log(`  ${ok ? '[OK]' : '[FAIL]'} ${TABLES[key].name}: ${ok ? data.length + ' 条' : res.msg}`);
    await sleep(400);
  }

  // ④ 创建额外视图
  console.log('\n④ 创建视图...');
  for (const v of EXTRA_VIEWS) {
    const tid = tableIds[v.table];
    if (!tid) continue;
    try {
      const res = await client.bitable.appTableView.create({
        path: { app_token: appToken, table_id: tid },
        data: { view_name: v.name, view_type: v.type },
      });
      console.log(`  ${res.code === 0 ? '[OK]' : '[SKIP]'} ${TABLES[v.table].name} → ${v.name} (${v.type})`);
    } catch (e: any) {
      console.log(`  [SKIP] ${TABLES[v.table].name} → ${v.name}: ${e.message?.slice(0, 60)}`);
    }
    await sleep(200);
  }

  // ⑤ 汇总
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   搭建完成！                                 ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\n  访问: https://hcn2vc1r2jus.feishu.cn/base/${appToken}`);
  console.log(`  app_token: ${appToken}\n`);
  console.log('  数据表 (6):');
  for (const [key, tid] of Object.entries(tableIds)) {
    const count = DATA_MAP[key]?.length ?? 0;
    console.log(`    ${TABLES[key].name}: ${tid} (${count} 条示例数据)`);
  }
  console.log('\n  视图:');
  console.log('    公司库 → 全部公司 / 按行业分组 / 星标公司');
  console.log('    岗位库 → 全部岗位 / S级岗位 / 按职能方向分组 / Deadline日历');
  console.log('    投递Pipeline → 全部投递 / Pipeline看板 / 今日待办 / 本周待办 / 甘特图');
  console.log('    JD解析 → 全部解析 / 按职能方向');
  console.log('    面试题库 → 全部题目 / 按题型分组 / 未完成题目');
  console.log('    面试复盘 → 全部复盘 / 待发送Follow-up / 复盘日历');
  console.log('\n  提示:');
  console.log('    1. 「关联公司」「关联岗位」「关联投递」字段目前是文本类型');
  console.log('       → 在飞书界面中可手动改为「关联」字段以实现跨表联动');
  console.log('    2. 看板视图/日历视图创建后，需在飞书中手动配置分组字段和日期字段');
  console.log('    3. 筛选条件（如"S级岗位"）需在飞书界面中手动设置');
  console.log('');
}

run().catch(console.error);
