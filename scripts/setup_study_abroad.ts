/**
 * 留学申请管理系统 - 飞书多维表格自动搭建脚本
 *
 * 14 张数据表，覆盖留学申请全生命周期：
 *   0. 申请总览 — 首页进度一览
 *   1. 学校库      2. 项目库      3. 我的选校清单
 *   4. 材料清单    5. 进度计划    6. 版本更新记录
 *   7. 个人背景档案  8. 标化考试追踪  9. 文书管理
 *  10. 推荐信管理   11. 面试记录    12. Offer 对比
 *  13. 费用追踪
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node scripts/setup_study_abroad.ts
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
const d = (s: string) => new Date(s).getTime(); // date string → ms

// ─── field type constants ───────────────────────────────────────────
const TEXT = 1, NUMBER = 2, SELECT = 3, MULTI_SELECT = 4, DATE = 5, CHECKBOX = 7, URL_TYPE = 15;
const opts = (...names: string[]) => ({ options: names.map(name => ({ name })) });

// ─── table definitions ─────────────────────────────────────────────

const TABLES: Record<string, any> = {

  // ─── 0. 申请总览 ──────────────────────────────────
  申请总览: {
    name: '申请总览',
    default_view_name: '全局进度',
    fields: [
      { field_name: '环节', type: TEXT },
      { field_name: '完成状态', type: SELECT, property: opts('未开始', '进行中', '已完成') },
      { field_name: '关键指标', type: TEXT },
      { field_name: '目标', type: TEXT },
      { field_name: '截止日期', type: DATE },
      { field_name: '完成日期', type: DATE },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 1. 学校库 ────────────────────────────────────
  学校库: {
    name: '学校库',
    default_view_name: '全部学校',
    fields: [
      { field_name: '学校名称', type: TEXT },
      { field_name: '英文名', type: TEXT },
      { field_name: '地区', type: SELECT, property: opts('美国', '英国', '中国香港', '新加坡', '澳大利亚', '加拿大', '欧洲', '日本') },
      { field_name: 'QS 2025 排名', type: NUMBER },
      { field_name: '学校类型', type: MULTI_SELECT, property: opts('综合大学', '理工院校', '商学院', '文理学院', '艺术院校') },
      { field_name: '我的选校名单', type: CHECKBOX },
      { field_name: '官网', type: URL_TYPE },
      { field_name: '地址', type: TEXT },
      { field_name: '简介', type: TEXT },
    ],
  },

  // ─── 2. 项目库 ────────────────────────────────────
  项目库: {
    name: '项目库',
    default_view_name: '全部项目',
    fields: [
      { field_name: '项目名称', type: TEXT },
      { field_name: '学校', type: TEXT },
      { field_name: '学位类型', type: SELECT, property: opts('硕士', '博士', 'MBA', '本科') },
      { field_name: '专业方向', type: SELECT, property: opts('计算机科学', '数据科学', '金融', '商科/管理', '工程', '教育', '法律', '传媒', '设计', '人文社科', '理学', '医学', '其他') },
      { field_name: '地区', type: SELECT, property: opts('美国', '英国', '中国香港', '新加坡', '澳大利亚', '加拿大', '欧洲', '日本') },
      { field_name: '学制', type: TEXT },
      { field_name: '学费(参考)', type: TEXT },
      { field_name: '语言要求', type: TEXT },
      { field_name: 'GPA 要求', type: TEXT },
      { field_name: 'GRE/GMAT', type: TEXT },
      { field_name: '申请截止日期', type: DATE },
      { field_name: '项目官网', type: URL_TYPE },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 3. 我的选校清单 ─────────────────────────────
  我的选校清单: {
    name: '我的选校清单',
    default_view_name: '全部申请',
    fields: [
      { field_name: '项目名称', type: TEXT },
      { field_name: '学校', type: TEXT },
      { field_name: '地区', type: SELECT, property: opts('美国', '英国', '中国香港', '新加坡', '澳大利亚', '加拿大', '欧洲') },
      { field_name: '申请状态', type: SELECT, property: opts('待定', '准备中', '已递交', '面试中', '已录取', '已拒绝', '放弃') },
      { field_name: '定位', type: SELECT, property: opts('冲刺', '匹配', '保底') },
      { field_name: '申请截止日期', type: DATE },
      { field_name: '结果通知日期', type: DATE },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 4. 材料清单 ──────────────────────────────────
  材料清单: {
    name: '材料清单',
    default_view_name: '材料总览',
    fields: [
      { field_name: '项目名称', type: TEXT },
      { field_name: '状态', type: SELECT, property: opts('未开始', '进行中', '已完成') },
      { field_name: 'PS/个人陈述', type: CHECKBOX },
      { field_name: 'CV/简历', type: CHECKBOX },
      { field_name: '推荐信', type: CHECKBOX },
      { field_name: '小作文/补充文书', type: CHECKBOX },
      { field_name: '成绩单', type: CHECKBOX },
      { field_name: '语言成绩', type: CHECKBOX },
      { field_name: 'GRE/GMAT', type: CHECKBOX },
      { field_name: '实习/工作证明', type: CHECKBOX },
      { field_name: '作品集', type: CHECKBOX },
      { field_name: '网申填写', type: CHECKBOX },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 5. 进度计划 ──────────────────────────────────
  进度计划: {
    name: '进度计划',
    default_view_name: '任务列表',
    fields: [
      { field_name: '任务名称', type: TEXT },
      { field_name: '关联项目', type: TEXT },
      { field_name: '阶段', type: SELECT, property: opts('前期准备', '选校研究', '语言考试', '文书准备', '材料准备', '网申填写', '面试准备', '等待结果', '签证行前') },
      { field_name: '开始日期', type: DATE },
      { field_name: '截止日期', type: DATE },
      { field_name: '状态', type: SELECT, property: opts('未开始', '进行中', '已完成', '已逾期') },
      { field_name: '优先级', type: SELECT, property: opts('高', '中', '低') },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 6. 版本更新记录 ─────────────────────────────
  版本更新记录: {
    name: '版本更新记录',
    default_view_name: '更新日志',
    fields: [
      { field_name: '版本号', type: TEXT },
      { field_name: '更新日期', type: DATE },
      { field_name: '更新类型', type: SELECT, property: opts('新增功能', '优化调整', '修复问题', '数据更新') },
      { field_name: '更新说明', type: TEXT },
    ],
  },

  // ─── 7. 个人背景档案 ─────────────────────────────
  个人背景档案: {
    name: '个人背景档案',
    default_view_name: '背景总览',
    fields: [
      { field_name: '项目', type: TEXT },
      { field_name: '类别', type: SELECT, property: opts('学术成绩', '标化考试', '科研经历', '实习经历', '课外活动', '竞赛获奖', '技能证书') },
      { field_name: '详情', type: TEXT },
      { field_name: '数值/分数', type: TEXT },
      { field_name: '时间', type: DATE },
      { field_name: '对申请的价值', type: SELECT, property: opts('核心亮点', '加分项', '普通', '需要弥补') },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 8. 标化考试追踪 ─────────────────────────────
  标化考试追踪: {
    name: '标化考试追踪',
    default_view_name: '考试记录',
    fields: [
      { field_name: '考试名称', type: TEXT },
      { field_name: '考试类型', type: SELECT, property: opts('TOEFL', 'IELTS', 'GRE', 'GMAT', '多邻国', 'PTE') },
      { field_name: '考试日期', type: DATE },
      { field_name: '报名截止日期', type: DATE },
      { field_name: '出分日期', type: DATE },
      { field_name: '总分', type: NUMBER },
      { field_name: '小分明细', type: TEXT },
      { field_name: '目标分数', type: NUMBER },
      { field_name: '是否达标', type: CHECKBOX },
      { field_name: '是否送分', type: CHECKBOX },
      { field_name: '送分学校', type: TEXT },
      { field_name: '费用', type: NUMBER },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 9. 文书管理 ──────────────────────────────────
  文书管理: {
    name: '文书管理',
    default_view_name: '文书列表',
    fields: [
      { field_name: '文书标题', type: TEXT },
      { field_name: '文书类型', type: SELECT, property: opts('PS/SOP', 'CV', '推荐信草稿', '小作文', 'Diversity Essay', 'Why School', '其他') },
      { field_name: '目标学校', type: TEXT },
      { field_name: '版本号', type: TEXT },
      { field_name: '状态', type: SELECT, property: opts('初稿', '修改中', '待审阅', '定稿') },
      { field_name: '字数', type: NUMBER },
      { field_name: '修改人/审阅人', type: TEXT },
      { field_name: '修改意见', type: TEXT },
      { field_name: '文件链接', type: URL_TYPE },
      { field_name: '最后更新日期', type: DATE },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 10. 推荐信管理 ──────────────────────────────
  推荐信管理: {
    name: '推荐信管理',
    default_view_name: '推荐信跟踪',
    fields: [
      { field_name: '记录标题', type: TEXT },
      { field_name: '推荐人姓名', type: TEXT },
      { field_name: '推荐人职位', type: TEXT },
      { field_name: '推荐人邮箱', type: TEXT },
      { field_name: '目标学校', type: TEXT },
      { field_name: '沟通状态', type: SELECT, property: opts('未联系', '已联系', '已同意', '已拒绝') },
      { field_name: '提交状态', type: SELECT, property: opts('未提交', '已提交', '已确认') },
      { field_name: '提交截止日期', type: DATE },
      { field_name: '是否需要催促', type: CHECKBOX },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 11. 面试记录 ────────────────────────────────
  面试记录: {
    name: '面试记录',
    default_view_name: '面试列表',
    fields: [
      { field_name: '面试标题', type: TEXT },
      { field_name: '学校/项目', type: TEXT },
      { field_name: '面试形式', type: SELECT, property: opts('视频', '电话', '现场', '录制视频') },
      { field_name: '面试日期', type: DATE },
      { field_name: '面试时间', type: TEXT },
      { field_name: '面试官', type: TEXT },
      { field_name: '准备状态', type: SELECT, property: opts('未准备', '准备中', '已准备') },
      { field_name: '常见问题准备', type: TEXT },
      { field_name: '面试反馈', type: TEXT },
      { field_name: '结果', type: SELECT, property: opts('待定', '通过', '未通过') },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 12. Offer 对比 ──────────────────────────────
  Offer对比: {
    name: 'Offer 对比',
    default_view_name: '对比总览',
    fields: [
      { field_name: '学校项目', type: TEXT },
      { field_name: '录取结果', type: SELECT, property: opts('Offer(有奖)', 'AD(无奖)', 'Waitlist', 'Reject') },
      { field_name: '奖学金', type: TEXT },
      { field_name: '年学费', type: NUMBER },
      { field_name: '生活费预估(年)', type: NUMBER },
      { field_name: '总花费预估', type: NUMBER },
      { field_name: '项目排名', type: NUMBER },
      { field_name: '就业数据', type: TEXT },
      { field_name: '地理位置评分', type: SELECT, property: opts('很满意', '满意', '一般', '不满意') },
      { field_name: '我的倾向', type: SELECT, property: opts('首选', '备选', '放弃') },
      { field_name: '回复截止日期', type: DATE },
      { field_name: '已接受', type: CHECKBOX },
      { field_name: '备注', type: TEXT },
    ],
  },

  // ─── 13. 费用追踪 ────────────────────────────────
  费用追踪: {
    name: '费用追踪',
    default_view_name: '费用明细',
    fields: [
      { field_name: '费用项目', type: TEXT },
      { field_name: '类别', type: SELECT, property: opts('考试费', '申请费', '材料费', '签证费', '押金', '机票', '其他') },
      { field_name: '金额(元)', type: NUMBER },
      { field_name: '支付日期', type: DATE },
      { field_name: '关联学校', type: TEXT },
      { field_name: '是否已支付', type: CHECKBOX },
      { field_name: '支付方式', type: SELECT, property: opts('信用卡', '支付宝', '银行转账', '其他') },
      { field_name: '是否可退', type: CHECKBOX },
      { field_name: '备注', type: TEXT },
    ],
  },
};

// ─── sample data ────────────────────────────────────────────────────

const DATA_申请总览 = [
  { 环节: '自我评估', 完成状态: '已完成', 关键指标: 'GPA 3.8/4.0', 目标: '梳理完毕', 备注: '背景档案已填写' },
  { 环节: 'TOEFL 考试', 完成状态: '已完成', 关键指标: '105 分 (R28 L27 S23 W27)', 目标: '100+', 完成日期: d('2026-07-15'), 备注: '第2次达标' },
  { 环节: 'GRE 考试', 完成状态: '进行中', 关键指标: '318 分（第1次）', 目标: '325+', 截止日期: d('2026-08-31'), 备注: '已报名8月第2次' },
  { 环节: '选校定位', 完成状态: '进行中', 关键指标: '6/8 所确定', 目标: '8所', 截止日期: d('2026-08-15'), 备注: '冲刺3+匹配3+保底2' },
  { 环节: 'CV 定稿', 完成状态: '进行中', 关键指标: 'v2 修改中', 目标: '定稿', 截止日期: d('2026-09-15'), 备注: '' },
  { 环节: 'PS 文书', 完成状态: '未开始', 关键指标: '0/8 定稿', 目标: '8篇', 截止日期: d('2026-11-15'), 备注: '' },
  { 环节: '推荐信', 完成状态: '未开始', 关键指标: '0/3 位确认', 目标: '3位推荐人', 截止日期: d('2026-10-31'), 备注: '' },
  { 环节: '网申提交', 完成状态: '未开始', 关键指标: '0/8 已提交', 目标: '8所全部提交', 截止日期: d('2027-01-15'), 备注: '' },
  { 环节: '面试', 完成状态: '未开始', 关键指标: '—', 目标: '—', 备注: '部分学校可能有面试' },
  { 环节: 'Offer 决定', 完成状态: '未开始', 关键指标: '—', 目标: '确认1所', 截止日期: d('2027-04-15'), 备注: 'April 15 Decision' },
  { 环节: '签证 & 行前', 完成状态: '未开始', 关键指标: '—', 目标: '签证获批', 截止日期: d('2027-08-15'), 备注: '' },
];

const DATA_学校库 = [
  { 学校名称: '麻省理工学院', 英文名: 'MIT', 地区: '美国', 'QS 2025 排名': 1, 学校类型: ['综合大学', '理工院校'], 我的选校名单: false, 地址: 'Cambridge, MA, USA', 简介: '全球顶尖理工院校，工程与计算机领域世界第一' },
  { 学校名称: '斯坦福大学', 英文名: 'Stanford University', 地区: '美国', 'QS 2025 排名': 2, 学校类型: ['综合大学'], 我的选校名单: true, 地址: 'Stanford, CA, USA', 简介: '硅谷创业文化发源地，跨学科研究顶尖' },
  { 学校名称: '哈佛大学', 英文名: 'Harvard University', 地区: '美国', 'QS 2025 排名': 4, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Cambridge, MA, USA', 简介: '世界最知名高等学府，人文社科商科顶尖' },
  { 学校名称: '加州大学伯克利分校', 英文名: 'UC Berkeley', 地区: '美国', 'QS 2025 排名': 12, 学校类型: ['综合大学'], 我的选校名单: true, 地址: 'Berkeley, CA, USA', 简介: '公立大学之首，CS/EECS 全球领先' },
  { 学校名称: '卡内基梅隆大学', 英文名: 'CMU', 地区: '美国', 'QS 2025 排名': 36, 学校类型: ['综合大学', '理工院校'], 我的选校名单: true, 地址: 'Pittsburgh, PA, USA', 简介: 'CS/AI/机器人领域世界领先' },
  { 学校名称: '哥伦比亚大学', 英文名: 'Columbia University', 地区: '美国', 'QS 2025 排名': 8, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'New York, NY, USA', 简介: '常春藤盟校，地处纽约，金融/传媒资源丰富' },
  { 学校名称: '加州理工学院', 英文名: 'Caltech', 地区: '美国', 'QS 2025 排名': 10, 学校类型: ['理工院校'], 我的选校名单: false, 地址: 'Pasadena, CA, USA', 简介: '小而精的顶尖理工院校，科研实力超群' },
  { 学校名称: '宾夕法尼亚大学', 英文名: 'UPenn', 地区: '美国', 'QS 2025 排名': 11, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Philadelphia, PA, USA', 简介: '沃顿商学院所在地，商科/计算机强' },
  { 学校名称: '牛津大学', 英文名: 'University of Oxford', 地区: '英国', 'QS 2025 排名': 3, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Oxford, UK', 简介: '英语世界最古老大学，学术传统深厚' },
  { 学校名称: '剑桥大学', 英文名: 'University of Cambridge', 地区: '英国', 'QS 2025 排名': 5, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Cambridge, UK', 简介: '全球顶尖综合研究型大学，理工科尤为突出' },
  { 学校名称: '帝国理工学院', 英文名: 'Imperial College London', 地区: '英国', 'QS 2025 排名': 6, 学校类型: ['理工院校'], 我的选校名单: true, 地址: 'London, UK', 简介: '英国理工科Top1，工程/商科/医学顶尖' },
  { 学校名称: '伦敦大学学院', 英文名: 'UCL', 地区: '英国', 'QS 2025 排名': 9, 学校类型: ['综合大学'], 我的选校名单: true, 地址: 'London, UK', 简介: '伦敦大学联盟核心，教育/建筑/法律强势' },
  { 学校名称: '伦敦政治经济学院', 英文名: 'LSE', 地区: '英国', 'QS 2025 排名': 50, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'London, UK', 简介: '社科/经济/金融/法律领域全球顶尖' },
  { 学校名称: '爱丁堡大学', 英文名: 'University of Edinburgh', 地区: '英国', 'QS 2025 排名': 27, 学校类型: ['综合大学'], 我的选校名单: true, 地址: 'Edinburgh, UK', 简介: '苏格兰最高学府，AI/NLP 研究突出' },
  { 学校名称: '曼彻斯特大学', 英文名: 'University of Manchester', 地区: '英国', 'QS 2025 排名': 34, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Manchester, UK', 简介: '红砖大学之首，工程/商科实力强劲' },
  { 学校名称: '新加坡国立大学', 英文名: 'NUS', 地区: '新加坡', 'QS 2025 排名': 8, 学校类型: ['综合大学'], 我的选校名单: true, 地址: 'Singapore', 简介: '亚洲Top1综合大学，工程/商科/计算机一流' },
  { 学校名称: '南洋理工大学', 英文名: 'NTU', 地区: '新加坡', 'QS 2025 排名': 15, 学校类型: ['综合大学', '理工院校'], 我的选校名单: false, 地址: 'Singapore', 简介: '年轻但发展极快的亚洲理工强校' },
  { 学校名称: '香港大学', 英文名: 'HKU', 地区: '中国香港', 'QS 2025 排名': 17, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Hong Kong', 简介: '亚洲历史最悠久高等学府之一，法律/商科突出' },
  { 学校名称: '香港科技大学', 英文名: 'HKUST', 地区: '中国香港', 'QS 2025 排名': 47, 学校类型: ['理工院校'], 我的选校名单: true, 地址: 'Hong Kong', 简介: '理工/商科均属世界一流，创业氛围浓厚' },
  { 学校名称: '香港中文大学', 英文名: 'CUHK', 地区: '中国香港', 'QS 2025 排名': 36, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Hong Kong', 简介: '双语教学传统，人文/商科/传媒强势' },
  { 学校名称: '香港城市大学', 英文名: 'CityU', 地区: '中国香港', 'QS 2025 排名': 62, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Hong Kong', 简介: '商科/数据科学/创意媒体特色突出' },
  { 学校名称: '墨尔本大学', 英文名: 'University of Melbourne', 地区: '澳大利亚', 'QS 2025 排名': 13, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Melbourne, Australia', 简介: '澳洲Top1综合大学，研究实力雄厚' },
  { 学校名称: '悉尼大学', 英文名: 'University of Sydney', 地区: '澳大利亚', 'QS 2025 排名': 18, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Sydney, Australia', 简介: '澳洲最古老大学，学科齐全' },
  { 学校名称: '新南威尔士大学', 英文名: 'UNSW Sydney', 地区: '澳大利亚', 'QS 2025 排名': 19, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Sydney, Australia', 简介: '工程/商科/计算机澳洲顶尖' },
  { 学校名称: '多伦多大学', 英文名: 'University of Toronto', 地区: '加拿大', 'QS 2025 排名': 25, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Toronto, Canada', 简介: '加拿大Top1，AI/深度学习研究重镇(Hinton)' },
  { 学校名称: '不列颠哥伦比亚大学', 英文名: 'UBC', 地区: '加拿大', 'QS 2025 排名': 38, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Vancouver, Canada', 简介: '加拿大西部最强综合大学，环境优美' },
  { 学校名称: '苏黎世联邦理工学院', 英文名: 'ETH Zurich', 地区: '欧洲', 'QS 2025 排名': 7, 学校类型: ['理工院校'], 我的选校名单: false, 地址: 'Zurich, Switzerland', 简介: '欧陆最强理工院校，爱因斯坦母校' },
  { 学校名称: '东京大学', 英文名: 'University of Tokyo', 地区: '日本', 'QS 2025 排名': 32, 学校类型: ['综合大学'], 我的选校名单: false, 地址: 'Tokyo, Japan', 简介: '日本最高学府，理工/文科均顶尖' },
];

const DATA_项目库 = [
  { 项目名称: 'MSCS - Computer Science', 学校: '卡内基梅隆大学', 学位类型: '硕士', 专业方向: '计算机科学', 地区: '美国', 学制: '2年', '学费(参考)': '$55,000/年', 语言要求: 'TOEFL 100+', 'GPA 要求': '3.5+/4.0', 'GRE/GMAT': 'GRE 必须', 申请截止日期: d('2026-12-15'), 备注: 'CS Top3，AI/ML方向极强' },
  { 项目名称: 'Master of Science in CS', 学校: '斯坦福大学', 学位类型: '硕士', 专业方向: '计算机科学', 地区: '美国', 学制: '1.5-2年', '学费(参考)': '$60,000/年', 语言要求: 'TOEFL 100+', 'GPA 要求': '3.5+/4.0', 'GRE/GMAT': 'GRE 建议 325+', 申请截止日期: d('2026-12-01'), 备注: '极度竞争，录取率<5%' },
  { 项目名称: 'MEng in EECS', 学校: '加州大学伯克利分校', 学位类型: '硕士', 专业方向: '计算机科学', 地区: '美国', 学制: '1年', '学费(参考)': '$55,000/年', 语言要求: 'TOEFL 90+', 'GPA 要求': '3.5+/4.0', 'GRE/GMAT': 'GRE 可选', 申请截止日期: d('2027-01-06'), 备注: '一年制就业导向项目' },
  { 项目名称: 'MSc Computing', 学校: '帝国理工学院', 学位类型: '硕士', 专业方向: '计算机科学', 地区: '英国', 学制: '1年', '学费(参考)': '£38,000', 语言要求: 'IELTS 7.0 (单项6.5)', 'GPA 要求': '85+/100 (211)', 'GRE/GMAT': '不要求', 申请截止日期: d('2027-01-15'), 备注: '英国CS最强项目之一，rolling录取' },
  { 项目名称: 'MSc Finance', 学校: '伦敦政治经济学院', 学位类型: '硕士', 专业方向: '金融', 地区: '英国', 学制: '10个月', '学费(参考)': '£42,000', 语言要求: 'IELTS 7.0 (阅读7)', 'GPA 要求': '85+/100', 'GRE/GMAT': 'GMAT 700+/GRE 325+', 申请截止日期: d('2027-01-07'), 备注: '全球Top5金融硕士项目' },
  { 项目名称: 'MBA', 学校: '哈佛大学', 学位类型: 'MBA', 专业方向: '商科/管理', 地区: '美国', 学制: '2年', '学费(参考)': '$75,000/年', 语言要求: 'TOEFL 109+', 'GPA 要求': '3.7+/4.0', 'GRE/GMAT': 'GMAT 730+', 申请截止日期: d('2027-01-04'), 备注: '全球Top MBA，需3-5年工作经验' },
  { 项目名称: 'MSc Data Science', 学校: '牛津大学', 学位类型: '硕士', 专业方向: '数据科学', 地区: '英国', 学制: '1年', '学费(参考)': '£35,000', 语言要求: 'IELTS 7.5 (单项7)', 'GPA 要求': '一等学位/90+', 'GRE/GMAT': '不要求', 申请截止日期: d('2027-01-20'), 备注: '交叉学科背景受欢迎' },
  { 项目名称: 'MSc Computer Science', 学校: '香港科技大学', 学位类型: '硕士', 专业方向: '计算机科学', 地区: '中国香港', 学制: '1年', '学费(参考)': 'HK$165,000', 语言要求: 'TOEFL 80+/IELTS 6.5', 'GPA 要求': '80+/100', 'GRE/GMAT': '不要求', 申请截止日期: d('2027-02-01'), 备注: '性价比高，就业去向好' },
  { 项目名称: 'MSc Business Analytics', 学校: '新加坡国立大学', 学位类型: '硕士', 专业方向: '商科/管理', 地区: '新加坡', 学制: '1年', '学费(参考)': 'SGD 50,000', 语言要求: 'TOEFL 85+/IELTS 6.0', 'GPA 要求': '3.0+/4.0', 'GRE/GMAT': 'GMAT 建议', 申请截止日期: d('2027-03-15'), 备注: '亚洲商业分析顶尖项目' },
  { 项目名称: 'MSc Financial Engineering', 学校: '哥伦比亚大学', 学位类型: '硕士', 专业方向: '金融', 地区: '美国', 学制: '1.5年', '学费(参考)': '$65,000/年', 语言要求: 'TOEFL 100+', 'GPA 要求': '3.5+/4.0', 'GRE/GMAT': 'GRE 必须', 申请截止日期: d('2027-02-01'), 备注: '量化金融强项，地处华尔街' },
  { 项目名称: 'MSc Computer Science', 学校: '伦敦大学学院', 学位类型: '硕士', 专业方向: '计算机科学', 地区: '英国', 学制: '1年', '学费(参考)': '£35,000', 语言要求: 'IELTS 7.0 (单项6.5)', 'GPA 要求': '85+/100', 'GRE/GMAT': '不要求', 申请截止日期: d('2027-03-01'), 备注: 'UCL CS 排名英国前三' },
  { 项目名称: 'Master of Finance', 学校: '香港大学', 学位类型: '硕士', 专业方向: '金融', 地区: '中国香港', 学制: '1年', '学费(参考)': 'HK$396,000', 语言要求: 'TOEFL 80+/IELTS 6.5', 'GPA 要求': '80+/100', 'GRE/GMAT': 'GMAT 建议', 申请截止日期: d('2026-10-16'), 备注: '港校金融最强，国际化程度高' },
  { 项目名称: 'MSc Artificial Intelligence', 学校: '爱丁堡大学', 学位类型: '硕士', 专业方向: '计算机科学', 地区: '英国', 学制: '1年', '学费(参考)': '£38,000', 语言要求: 'IELTS 7.0 (单项6.5)', 'GPA 要求': '85+/100', 'GRE/GMAT': '不要求', 申请截止日期: d('2027-01-15'), 备注: 'NLP/AI 研究全球知名' },
  { 项目名称: 'Master of Data Science', 学校: '墨尔本大学', 学位类型: '硕士', 专业方向: '数据科学', 地区: '澳大利亚', 学制: '2年', '学费(参考)': 'AUD 48,000/年', 语言要求: 'IELTS 6.5 (单项6.0)', 'GPA 要求': 'H2A/75+', 'GRE/GMAT': '不要求', 申请截止日期: d('2027-01-31'), 备注: '澳洲最强数据科学项目' },
  { 项目名称: 'MSc Management', 学校: '香港中文大学', 学位类型: '硕士', 专业方向: '商科/管理', 地区: '中国香港', 学制: '1年', '学费(参考)': 'HK$260,000', 语言要求: 'TOEFL 79+/IELTS 6.5', 'GPA 要求': '80+/100', 'GRE/GMAT': '不要求', 申请截止日期: d('2027-02-28'), 备注: '港校商科传统强项' },
];

const DATA_选校清单 = [
  { 项目名称: 'MSCS - Computer Science', 学校: '卡内基梅隆大学', 地区: '美国', 申请状态: '准备中', 定位: '冲刺', 申请截止日期: d('2026-12-15'), 备注: '最想去的学校' },
  { 项目名称: 'Master of Science in CS', 学校: '斯坦福大学', 地区: '美国', 申请状态: '准备中', 定位: '冲刺', 申请截止日期: d('2026-12-01'), 备注: '' },
  { 项目名称: 'MEng in EECS', 学校: '加州大学伯克利分校', 地区: '美国', 申请状态: '准备中', 定位: '冲刺', 申请截止日期: d('2027-01-06'), 备注: '' },
  { 项目名称: 'MSc Computing', 学校: '帝国理工学院', 地区: '英国', 申请状态: '准备中', 定位: '匹配', 申请截止日期: d('2027-01-15'), 备注: 'rolling 录取，尽早提交' },
  { 项目名称: 'MSc Artificial Intelligence', 学校: '爱丁堡大学', 地区: '英国', 申请状态: '准备中', 定位: '匹配', 申请截止日期: d('2027-01-15'), 备注: 'AI方向首选' },
  { 项目名称: 'MSc Computer Science', 学校: '伦敦大学学院', 地区: '英国', 申请状态: '待定', 定位: '匹配', 申请截止日期: d('2027-03-01'), 备注: '' },
  { 项目名称: 'MSc Computer Science', 学校: '香港科技大学', 地区: '中国香港', 申请状态: '准备中', 定位: '保底', 申请截止日期: d('2027-02-01'), 备注: '性价比选择' },
  { 项目名称: 'MSc Business Analytics', 学校: '新加坡国立大学', 地区: '新加坡', 申请状态: '待定', 定位: '匹配', 申请截止日期: d('2027-03-15'), 备注: '跨方向申请' },
];

const DATA_材料清单 = [
  { 项目名称: 'CMU MSCS', 状态: '进行中', 'PS/个人陈述': true, 'CV/简历': true, 推荐信: true, '小作文/补充文书': false, 成绩单: true, 语言成绩: true, 'GRE/GMAT': true, '实习/工作证明': false, 作品集: false, 网申填写: false, 备注: 'PS 第二稿修改中' },
  { 项目名称: 'Stanford MSCS', 状态: '进行中', 'PS/个人陈述': true, 'CV/简历': true, 推荐信: false, '小作文/补充文书': false, 成绩单: true, 语言成绩: true, 'GRE/GMAT': true, '实习/工作证明': false, 作品集: false, 网申填写: false, 备注: '推荐信还差一封' },
  { 项目名称: 'UCB MEng', 状态: '进行中', 'PS/个人陈述': true, 'CV/简历': true, 推荐信: true, '小作文/补充文书': false, 成绩单: true, 语言成绩: true, 'GRE/GMAT': false, '实习/工作证明': true, 作品集: false, 网申填写: false, 备注: '' },
  { 项目名称: 'IC MSc Computing', 状态: '进行中', 'PS/个人陈述': true, 'CV/简历': true, 推荐信: false, '小作文/补充文书': false, 成绩单: true, 语言成绩: true, 'GRE/GMAT': false, '实习/工作证明': false, 作品集: false, 网申填写: false, 备注: '' },
  { 项目名称: 'Edinburgh MSc AI', 状态: '进行中', 'PS/个人陈述': true, 'CV/简历': true, 推荐信: false, '小作文/补充文书': false, 成绩单: true, 语言成绩: true, 'GRE/GMAT': false, '实习/工作证明': false, 作品集: false, 网申填写: false, 备注: '' },
  { 项目名称: 'UCL MSc CS', 状态: '未开始', 'PS/个人陈述': false, 'CV/简历': true, 推荐信: false, '小作文/补充文书': false, 成绩单: true, 语言成绩: true, 'GRE/GMAT': false, '实习/工作证明': false, 作品集: false, 网申填写: false, 备注: '' },
  { 项目名称: 'HKUST MSc CS', 状态: '未开始', 'PS/个人陈述': false, 'CV/简历': true, 推荐信: false, '小作文/补充文书': false, 成绩单: true, 语言成绩: true, 'GRE/GMAT': false, '实习/工作证明': false, 作品集: false, 网申填写: false, 备注: '' },
  { 项目名称: 'NUS Business Analytics', 状态: '未开始', 'PS/个人陈述': false, 'CV/简历': false, 推荐信: false, '小作文/补充文书': false, 成绩单: false, 语言成绩: true, 'GRE/GMAT': false, '实习/工作证明': false, 作品集: false, 网申填写: false, 备注: '' },
];

const DATA_进度计划 = [
  { 任务名称: 'TOEFL/IELTS 考试备考', 关联项目: '通用', 阶段: '语言考试', 开始日期: d('2026-03-01'), 截止日期: d('2026-07-31'), 状态: '进行中', 优先级: '高', 备注: '目标 TOEFL 105+' },
  { 任务名称: 'GRE 备考与考试', 关联项目: '通用', 阶段: '语言考试', 开始日期: d('2026-04-01'), 截止日期: d('2026-08-31'), 状态: '进行中', 优先级: '高', 备注: '目标 325+' },
  { 任务名称: '暑期实习/科研', 关联项目: '通用', 阶段: '前期准备', 开始日期: d('2026-06-01'), 截止日期: d('2026-08-31'), 状态: '未开始', 优先级: '高' },
  { 任务名称: '选校研究与定位', 关联项目: '通用', 阶段: '选校研究', 开始日期: d('2026-06-01'), 截止日期: d('2026-08-15'), 状态: '未开始', 优先级: '高', 备注: '确定8所学校' },
  { 任务名称: 'CV 定稿', 关联项目: '通用', 阶段: '文书准备', 开始日期: d('2026-08-01'), 截止日期: d('2026-09-15'), 状态: '未开始', 优先级: '高' },
  { 任务名称: 'PS 初稿（美国方向）', 关联项目: 'CMU/Stanford/UCB', 阶段: '文书准备', 开始日期: d('2026-08-15'), 截止日期: d('2026-09-30'), 状态: '未开始', 优先级: '高' },
  { 任务名称: 'PS 初稿（英国方向）', 关联项目: 'IC/UCL/Edinburgh', 阶段: '文书准备', 开始日期: d('2026-09-01'), 截止日期: d('2026-10-15'), 状态: '未开始', 优先级: '中' },
  { 任务名称: '联系推荐人 & 推荐信', 关联项目: '通用', 阶段: '材料准备', 开始日期: d('2026-09-01'), 截止日期: d('2026-10-31'), 状态: '未开始', 优先级: '高', 备注: '至少3位推荐人' },
  { 任务名称: '成绩单 & WES认证', 关联项目: '通用', 阶段: '材料准备', 开始日期: d('2026-09-01'), 截止日期: d('2026-10-15'), 状态: '未开始', 优先级: '中' },
  { 任务名称: 'Stanford 网申提交', 关联项目: 'Stanford MSCS', 阶段: '网申填写', 开始日期: d('2026-11-01'), 截止日期: d('2026-12-01'), 状态: '未开始', 优先级: '高', 备注: 'Deadline: Dec 1' },
  { 任务名称: 'CMU 网申提交', 关联项目: 'CMU MSCS', 阶段: '网申填写', 开始日期: d('2026-11-15'), 截止日期: d('2026-12-15'), 状态: '未开始', 优先级: '高' },
  { 任务名称: 'UCB 网申提交', 关联项目: 'UCB MEng', 阶段: '网申填写', 开始日期: d('2026-12-01'), 截止日期: d('2027-01-06'), 状态: '未开始', 优先级: '高' },
  { 任务名称: 'IC 网申提交', 关联项目: 'IC MSc Computing', 阶段: '网申填写', 开始日期: d('2026-11-01'), 截止日期: d('2027-01-15'), 状态: '未开始', 优先级: '中', 备注: 'Rolling，越早越好' },
  { 任务名称: 'Edinburgh 网申提交', 关联项目: 'Edinburgh MSc AI', 阶段: '网申填写', 开始日期: d('2026-12-01'), 截止日期: d('2027-01-15'), 状态: '未开始', 优先级: '中' },
  { 任务名称: 'HKUST 网申提交', 关联项目: 'HKUST MSc CS', 阶段: '网申填写', 开始日期: d('2027-01-01'), 截止日期: d('2027-02-01'), 状态: '未开始', 优先级: '中' },
  { 任务名称: 'UCL 网申提交', 关联项目: 'UCL MSc CS', 阶段: '网申填写', 开始日期: d('2027-01-15'), 截止日期: d('2027-03-01'), 状态: '未开始', 优先级: '低' },
  { 任务名称: 'NUS 网申提交', 关联项目: 'NUS BA', 阶段: '网申填写', 开始日期: d('2027-02-01'), 截止日期: d('2027-03-15'), 状态: '未开始', 优先级: '低' },
  { 任务名称: '面试准备（Mock）', 关联项目: '通用', 阶段: '面试准备', 开始日期: d('2027-01-15'), 截止日期: d('2027-03-15'), 状态: '未开始', 优先级: '中' },
  { 任务名称: '等待录取结果', 关联项目: '通用', 阶段: '等待结果', 开始日期: d('2027-02-01'), 截止日期: d('2027-04-15'), 状态: '未开始', 优先级: '低' },
  { 任务名称: '确认 Offer & 交押金', 关联项目: '通用', 阶段: '等待结果', 开始日期: d('2027-04-01'), 截止日期: d('2027-04-15'), 状态: '未开始', 优先级: '高', 备注: 'April 15 decision' },
  { 任务名称: '签证申请 & 行前准备', 关联项目: '通用', 阶段: '签证行前', 开始日期: d('2027-05-01'), 截止日期: d('2027-08-15'), 状态: '未开始', 优先级: '中' },
];

const DATA_版本更新 = [
  { 版本号: 'v1.0', 更新日期: d('2026-03-04'), 更新类型: '新增功能', 更新说明: '初始版本：14张数据表，覆盖留学申请全生命周期' },
  { 版本号: 'v1.1', 更新日期: d('2026-03-04'), 更新类型: '数据更新', 更新说明: '填入28所院校数据、15个热门项目，含QS2025排名' },
  { 版本号: 'v1.2', 更新日期: d('2026-03-04'), 更新类型: '优化调整', 更新说明: '新增甘特图/看板/画册/日历等多视图，优化移动端体验' },
];

const DATA_个人背景 = [
  { 项目: '本科 GPA', 类别: '学术成绩', 详情: 'XX大学 计算机科学与技术', '数值/分数': '3.8/4.0 (WES)', 时间: d('2026-06-01'), 对申请的价值: '核心亮点' },
  { 项目: '核心课程成绩', 类别: '学术成绩', 详情: '数据结构A+, 算法A, 机器学习A, 操作系统A-', '数值/分数': '核心课 GPA 3.9', 对申请的价值: '核心亮点' },
  { 项目: 'TOEFL 成绩', 类别: '标化考试', 详情: '第2次考试达标', '数值/分数': '105 (R28 L27 S23 W27)', 时间: d('2026-07-15'), 对申请的价值: '加分项' },
  { 项目: 'GRE 成绩', 类别: '标化考试', 详情: '第1次考试，准备第2次', '数值/分数': '318 (V155 Q163 AW3.5)', 时间: d('2026-06-20'), 对申请的价值: '需要弥补', 备注: '目标 325+' },
  { 项目: '暑期科研', 类别: '科研经历', 详情: '本校ML实验室，NLP方向，参与论文撰写', '数值/分数': '—', 时间: d('2025-08-01'), 对申请的价值: '核心亮点' },
  { 项目: '字节跳动实习', 类别: '实习经历', 详情: '后端开发实习，3个月', '数值/分数': '—', 时间: d('2025-07-01'), 对申请的价值: '加分项' },
  { 项目: 'ACM-ICPC 区域赛', 类别: '竞赛获奖', 详情: '铜牌', '数值/分数': '—', 时间: d('2025-11-01'), 对申请的价值: '加分项' },
  { 项目: '开源项目贡献', 类别: '课外活动', 详情: 'GitHub 500+ stars 个人项目', '数值/分数': '—', 对申请的价值: '加分项' },
];

const DATA_考试追踪 = [
  { 考试名称: 'TOEFL 第1次', 考试类型: 'TOEFL', 考试日期: d('2026-05-10'), 出分日期: d('2026-05-20'), 总分: 98, 小分明细: 'R26 L25 S21 W26', 目标分数: 105, 是否达标: false, 是否送分: false, 费用: 2100, 备注: '口语需提高' },
  { 考试名称: 'TOEFL 第2次', 考试类型: 'TOEFL', 考试日期: d('2026-07-15'), 出分日期: d('2026-07-25'), 总分: 105, 小分明细: 'R28 L27 S23 W27', 目标分数: 105, 是否达标: true, 是否送分: true, 送分学校: 'CMU, Stanford, UCB, Columbia', 费用: 2100, 备注: '达标！' },
  { 考试名称: 'GRE 第1次', 考试类型: 'GRE', 考试日期: d('2026-06-20'), 出分日期: d('2026-07-05'), 总分: 318, 小分明细: 'V155 Q163 AW3.5', 目标分数: 325, 是否达标: false, 是否送分: false, 费用: 1665, 备注: 'Verbal 需提高' },
  { 考试名称: 'GRE 第2次', 考试类型: 'GRE', 考试日期: d('2026-08-25'), 报名截止日期: d('2026-08-11'), 目标分数: 325, 是否达标: false, 是否送分: false, 费用: 1665, 备注: '已报名' },
];

const DATA_文书管理 = [
  { 文书标题: 'CV v1', 文书类型: 'CV', 目标学校: '通用', 版本号: 'v1', 状态: '修改中', 字数: 0, 修改人: '自己', 最后更新日期: d('2026-08-10'), 备注: '初稿完成' },
  { 文书标题: 'CMU PS v1', 文书类型: 'PS/SOP', 目标学校: 'CMU', 版本号: 'v1', 状态: '初稿', 字数: 850, 修改人: '自己', 备注: '围绕AI/ML研究经历' },
  { 文书标题: 'Stanford PS v1', 文书类型: 'PS/SOP', 目标学校: 'Stanford', 版本号: 'v1', 状态: '初稿', 字数: 900, 修改人: '自己', 备注: '' },
  { 文书标题: 'IC PS v1', 文书类型: 'PS/SOP', 目标学校: 'IC', 版本号: 'v1', 状态: '初稿', 字数: 750, 修改人: '自己', 备注: '英国PS格式不同' },
  { 文书标题: 'Why CMU Essay', 文书类型: 'Why School', 目标学校: 'CMU', 版本号: 'v1', 状态: '初稿', 字数: 300, 修改人: '自己', 备注: '' },
];

const DATA_推荐信 = [
  { 记录标题: '王教授 → CMU', 推荐人姓名: '王教授', 推荐人职位: '副教授/ML实验室导师', 推荐人邮箱: 'wang@example.edu', 目标学校: 'CMU', 沟通状态: '已同意', 提交状态: '未提交', 提交截止日期: d('2026-12-10'), 是否需要催促: false },
  { 记录标题: '王教授 → Stanford', 推荐人姓名: '王教授', 推荐人职位: '副教授/ML实验室导师', 推荐人邮箱: 'wang@example.edu', 目标学校: 'Stanford', 沟通状态: '已同意', 提交状态: '未提交', 提交截止日期: d('2026-11-25'), 是否需要催促: false },
  { 记录标题: '李老师 → CMU', 推荐人姓名: '李老师', 推荐人职位: '教授/算法课教师', 推荐人邮箱: 'li@example.edu', 目标学校: 'CMU', 沟通状态: '已联系', 提交状态: '未提交', 提交截止日期: d('2026-12-10'), 是否需要催促: false, 备注: '等待回复' },
  { 记录标题: '张经理 → UCB', 推荐人姓名: '张经理', 推荐人职位: '字节跳动实习主管', 推荐人邮箱: 'zhang@example.com', 目标学校: 'UCB', 沟通状态: '未联系', 提交状态: '未提交', 提交截止日期: d('2026-12-30'), 是否需要催促: false, 备注: '实习表现推荐' },
];

const DATA_面试 = [
  { 面试标题: 'CMU MSCS 面试（预期）', '学校/项目': 'CMU MSCS', 面试形式: '视频', 准备状态: '未准备', 常见问题准备: '1. Tell me about your research\n2. Why CMU?\n3. Career goals', 备注: 'CMU CS 一般不面试，但需准备' },
  { 面试标题: 'IC MSc Computing 面试', '学校/项目': 'IC MSc Computing', 面试形式: '视频', 准备状态: '未准备', 常见问题准备: '1. 技术问题（算法/数据结构）\n2. 项目经历\n3. Why Imperial?', 备注: 'IC 可能会有技术面' },
];

const DATA_Offer = [
  { 学校项目: 'CMU MSCS', 录取结果: 'AD(无奖)', 年学费: 385000, '生活费预估(年)': 180000, 总花费预估: 1130000, 项目排名: 1, 就业数据: 'CS硕士平均起薪$120k+', 地理位置评分: '满意', 我的倾向: '首选', 回复截止日期: d('2027-04-15'), 已接受: false, 备注: '示例数据 — 实际录取后填写' },
  { 学校项目: 'IC MSc Computing', 录取结果: 'Offer(有奖)', 奖学金: 'Dean\'s Scholarship £5,000', 年学费: 350000, '生活费预估(年)': 200000, 总花费预估: 545000, 项目排名: 5, 就业数据: '毕业生平均起薪£45k', 地理位置评分: '很满意', 我的倾向: '备选', 回复截止日期: d('2027-04-01'), 已接受: false, 备注: '示例数据' },
];

const DATA_费用 = [
  { 费用项目: 'TOEFL 第1次报名费', 类别: '考试费', '金额(元)': 2100, 支付日期: d('2026-04-15'), 是否已支付: true, 支付方式: '支付宝', 是否可退: false },
  { 费用项目: 'TOEFL 第2次报名费', 类别: '考试费', '金额(元)': 2100, 支付日期: d('2026-06-20'), 是否已支付: true, 支付方式: '支付宝', 是否可退: false },
  { 费用项目: 'GRE 第1次报名费', 类别: '考试费', '金额(元)': 1665, 支付日期: d('2026-05-10'), 是否已支付: true, 支付方式: '信用卡', 是否可退: false },
  { 费用项目: 'GRE 第2次报名费', 类别: '考试费', '金额(元)': 1665, 支付日期: d('2026-07-30'), 是否已支付: true, 支付方式: '信用卡', 是否可退: false },
  { 费用项目: 'TOEFL 送分（4所）', 类别: '考试费', '金额(元)': 800, 支付日期: d('2026-07-25'), 是否已支付: true, 支付方式: '信用卡', 是否可退: false, 关联学校: 'CMU/Stanford/UCB/Columbia' },
  { 费用项目: 'WES 成绩认证', 类别: '材料费', '金额(元)': 1600, 支付日期: d('2026-09-01'), 是否已支付: false, 备注: '美国学校需要' },
  { 费用项目: 'CMU 申请费', 类别: '申请费', '金额(元)': 550, 关联学校: 'CMU', 是否已支付: false, 支付方式: '信用卡', 是否可退: false },
  { 费用项目: 'Stanford 申请费', 类别: '申请费', '金额(元)': 900, 关联学校: 'Stanford', 是否已支付: false, 支付方式: '信用卡', 是否可退: false },
  { 费用项目: 'UCB 申请费', 类别: '申请费', '金额(元)': 900, 关联学校: 'UCB', 是否已支付: false, 支付方式: '信用卡', 是否可退: false },
  { 费用项目: 'IC 申请费', 类别: '申请费', '金额(元)': 600, 关联学校: 'IC', 是否已支付: false, 支付方式: '信用卡', 是否可退: false },
  { 费用项目: 'Edinburgh 申请费', 类别: '申请费', '金额(元)': 400, 关联学校: 'Edinburgh', 是否已支付: false, 支付方式: '信用卡', 是否可退: false },
];

// ─── table order for creation (determines sidebar order) ────────────
const TABLE_ORDER = [
  '申请总览', '学校库', '项目库', '我的选校清单', '材料清单', '进度计划',
  '个人背景档案', '标化考试追踪', '文书管理', '推荐信管理',
  '面试记录', 'Offer对比', '费用追踪', '版本更新记录',
];

// ─── data map ───────────────────────────────────────────────────────
const DATA_MAP: Record<string, any[]> = {
  申请总览: DATA_申请总览,
  学校库: DATA_学校库,
  项目库: DATA_项目库,
  我的选校清单: DATA_选校清单,
  材料清单: DATA_材料清单,
  进度计划: DATA_进度计划,
  版本更新记录: DATA_版本更新,
  个人背景档案: DATA_个人背景,
  标化考试追踪: DATA_考试追踪,
  文书管理: DATA_文书管理,
  推荐信管理: DATA_推荐信,
  面试记录: DATA_面试,
  Offer对比: DATA_Offer,
  费用追踪: DATA_费用,
};

// ─── views to create ────────────────────────────────────────────────
const EXTRA_VIEWS: Array<{ table: string; name: string; type: any }> = [
  { table: '学校库', name: '学校卡片', type: 'gallery' },
  { table: '学校库', name: '院校查询', type: 'form' },
  { table: '项目库', name: '项目查询', type: 'form' },
  { table: '我的选校清单', name: '申请看板', type: 'kanban' },
  { table: '材料清单', name: '快速填写', type: 'form' },
  { table: '进度计划', name: '申请时间线（甘特图）', type: 'gantt' },
  { table: '进度计划', name: 'Deadline 日历', type: 'calendar' },
  { table: '标化考试追踪', name: '考试日历', type: 'calendar' },
];

// ─── main ───────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   留学申请管理系统 - 飞书多维表格搭建        ║');
  console.log('║   14 张数据表 | 全生命周期覆盖               ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ① 创建多维表格 App
  console.log('① 创建多维表格应用...');
  const appRes = await (client.bitable as any).app.create({
    data: { name: 'DIY 留学申请管理系统' },
  });
  if (appRes.code !== 0) {
    console.error('  创建失败:', appRes.msg, '| code:', appRes.code);
    return;
  }
  const appToken = appRes.data?.app?.app_token!;
  console.log(`  app_token: ${appToken}`);
  console.log(`  链接: https://hcn2vc1r2jus.feishu.cn/base/${appToken}\n`);

  // 获取默认表（创建 app 时自动生成）
  const defRes = await client.bitable.appTable.list({ path: { app_token: appToken } });
  const defaultTableId = defRes.data?.items?.[0]?.table_id;

  // ② 创建 14 张数据表
  console.log('② 创建 14 张数据表...');
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
      console.log(`  [OK] ${key} → ${tableIds[key]}`);
    } else {
      console.error(`  [FAIL] ${key}: ${res.msg}`);
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
    console.log(`  ${ok ? '[OK]' : '[FAIL]'} ${key}: ${ok ? data.length + ' 条' : res.msg}`);
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
      console.log(`  ${res.code === 0 ? '[OK]' : '[SKIP]'} ${v.table} → ${v.name} (${v.type})`);
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
  console.log(`  app_token: ${appToken}\n`);
  console.log('  数据表 (14):');
  for (const [name, tid] of Object.entries(tableIds)) {
    const count = DATA_MAP[name]?.length ?? 0;
    console.log(`    ${name}: ${tid} (${count} 条)`);
  }
  console.log('\n  视图:');
  console.log('    申请总览 → 全局进度');
  console.log('    学校库 → 全部学校 / 学校卡片(画册) / 院校查询(表单)');
  console.log('    项目库 → 全部项目 / 项目查询(表单)');
  console.log('    选校清单 → 全部申请 / 申请看板');
  console.log('    材料清单 → 材料总览 / 快速填写(表单)');
  console.log('    进度计划 → 任务列表 / 申请时间线(甘特图) / Deadline日历');
  console.log('    考试追踪 → 考试记录 / 考试日历');
  console.log('    文书/推荐信/面试/Offer/费用 → 各自默认视图');
  console.log('');
}

run().catch(console.error);
