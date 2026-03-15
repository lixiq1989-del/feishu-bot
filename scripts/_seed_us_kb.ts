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

const APP_TOKEN = 'DcSGbjcT7afyWfsvQHYczOY0nve';
const TABLE_ID = 'tblrBGhMOjI1bXdl';
const d = (s: string) => new Date(s).getTime();

const data = [
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
    标题: 'Goldman Sachs IBD 2025 Full-time offer薪资数据',
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
    标题: 'How to ask for a referral on LinkedIn - template that works',
    来源平台: 'LinkedIn',
    行业: ['通用'],
    主题: ['内推/Referral'],
    核心观点: '关键：不要直接问"能帮我内推吗"，先建立联系，聊对方经历，再提请求。模板：说明共同点→表达对公司真实兴趣→具体请求→感谢。',
    录入日期: d('2026-03-10'),
    质量评分: 4,
    已用于创作: false,
  },
];

(async () => {
  const res = await client.bitable.appTableRecord.batchCreate({
    path: { app_token: APP_TOKEN, table_id: TABLE_ID },
    data: { records: data.map(fields => ({ fields })) },
  });
  console.log(res.code === 0 ? `[OK] 插入 ${data.length} 条` : `[FAIL] ${res.msg}`);
})().catch(console.error);
