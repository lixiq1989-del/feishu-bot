/**
 * 咨询 & 商科岗位每日投递信息追踪器
 *
 * 数据源：通过 Perplexity API 搜索各大招聘平台的最新岗位
 * 存储：飞书多维表格，支持增量更新 & 去重
 *
 * 用法：
 *   npm run jobs              # 日常运行（搜索 + 写入已有表格）
 *   npm run jobs:init         # 首次运行（创建表格 + 搜索 + 写入）
 *
 * 环境变量：
 *   PERPLEXITY_API_KEY        # Perplexity API key
 *   JOB_TRACKER_APP_TOKEN     # 飞书表格 app_token（init 后自动生成）
 *   JOB_TRACKER_TABLE_ID      # 飞书表格 table_id（init 后自动生成）
 */
// 手动加载 .env（项目没有 dotenv 依赖）
import * as fs from 'fs';
import * as path from 'path';
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

import { client } from '../src/client';
import * as https from 'https';

// ─── 配置 ────────────────────────────────────────────────────────
const CONFIG = {
  APP_TOKEN: process.env.JOB_TRACKER_APP_TOKEN || '',
  TABLE_ID: process.env.JOB_TRACKER_TABLE_ID || '',
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '',

  // 搜索 prompt — 每组会发一次 Perplexity 请求
  QUERIES: [
    '2026年最新咨询公司校招和社招岗位，包括MBB（麦肯锡、BCG、贝恩）、四大咨询（德勤、普华永道、安永、毕马威）、罗兰贝格、奥纬、埃森哲等。列出具体岗位名称、公司、城市、来源网站链接。',
    '2026年最新商业分析师、商分、行业研究、战略分析相关校招岗位，包括互联网大厂（字节、腾讯、阿里、美团）和传统企业。列出具体岗位名称、公司、城市、来源网站链接。',
    '列出10到20条2026年中国最新投行和券商校招岗位信息，包括中金公司、中信证券、华泰证券、国泰君安、招商证券、高盛、摩根士丹利等。每条包含岗位名称、公司、城市、来源。',
    '2026年最新快消管培生招聘，包括宝洁、联合利华、欧莱雅、玛氏、雀巢等。列出具体岗位名称、公司、城市、来源网站链接。',
    '2026年最新咨询实习和商科实习岗位，适合在校大学生。列出具体岗位名称、公司、城市、来源网站链接。',
  ],
};

// ─── 类型 ────────────────────────────────────────────────────────
interface JobPosting {
  title: string;
  company: string;
  location: string;
  source: string;
  url: string;
  date: string;
}

// ─── Perplexity API 调用 ─────────────────────────────────────────
async function queryPerplexity(userPrompt: string): Promise<{ text: string; urls: string[] }> {
  const apiKey = CONFIG.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('缺少 PERPLEXITY_API_KEY 环境变量');

  const body = JSON.stringify({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `You are a job listing assistant. Return ONLY a valid JSON array, nothing else — no markdown, no explanation, no code fences.

Each element must be an object with exactly these keys:
{"title":"岗位名称","company":"公司名","location":"城市","source":"来源平台","url":"链接或空字符串"}

Return 10-20 real, currently active job postings. Respond with the raw JSON array only.`,
      },
      { role: 'user', content: userPrompt },
    ],
    search_recency_filter: 'month',
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.perplexity.ai',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message || JSON.stringify(json.error)));
            return;
          }
          const text = json.choices?.[0]?.message?.content || '';
          const citations: string[] = json.citations || [];
          resolve({ text, urls: citations });
        } catch (e: any) {
          reject(new Error(`解析响应失败: ${e.message}\n${data.slice(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── 从 Perplexity 返回文本中提取岗位 ────────────────────────────
function parseJobs(text: string, fallbackUrls: string[]): JobPosting[] {
  const today = new Date().toISOString().slice(0, 10);
  const jobs: JobPosting[] = [];

  // 清理 markdown 代码块
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // 尝试提取 JSON 数组
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const arr = JSON.parse(jsonMatch[0]);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item.title && item.company) {
            jobs.push({
              title: String(item.title).slice(0, 100),
              company: String(item.company).slice(0, 50),
              location: String(item.location || '—').slice(0, 30),
              source: String(item.source || '—').slice(0, 30),
              url: String(item.url || ''),
              date: today,
            });
          }
        }
      }
    } catch {
      // JSON 解析失败，走文本解析
    }
  }

  // 如果 JSON 解析失败或为空，尝试按行提取
  if (jobs.length === 0) {
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      // 尝试匹配 "公司 - 岗位 - 城市" 格式
      const match = line.match(/[•\-\d.]\s*(?:\*{0,2})([^-—–|]+?)\s*[-—–|]\s*([^-—–|]+?)(?:\s*[-—–|]\s*([^-—–|\n]+))?/);
      if (match) {
        const [, part1, part2, part3] = match;
        jobs.push({
          title: part2.replace(/\*+/g, '').trim().slice(0, 100),
          company: part1.replace(/\*+/g, '').trim().slice(0, 50),
          location: (part3 || '—').replace(/\*+/g, '').trim().slice(0, 30),
          source: '—',
          url: '',
          date: today,
        });
      }
    }
  }

  return jobs;
}

// ─── 去重 ────────────────────────────────────────────────────────
function dedup(jobs: JobPosting[]): JobPosting[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${j.title}|${j.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── 与已有记录去重 ───────────────────────────────────────────────
async function getExistingKeys(appToken: string, tableId: string): Promise<Set<string>> {
  const keys = new Set<string>();
  let pageToken: string | undefined;

  do {
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: appToken, table_id: tableId },
      params: { page_size: 100, ...(pageToken ? { page_token: pageToken } : {}) },
    });
    if (res.code !== 0) break;
    for (const r of res.data?.items || []) {
      const f = r.fields as any;
      const title = f?.['岗位名'];
      const company = f?.['公司'];
      if (title && company) {
        keys.add(`${title}|${company}`.toLowerCase());
      }
    }
    pageToken = res.data?.page_token;
  } while (pageToken);

  return keys;
}

// ─── 创建表格 ────────────────────────────────────────────────────
async function createTable(): Promise<{ appToken: string; tableId: string }> {
  console.log('📋 创建飞书多维表格...\n');

  const appRes = await (client.bitable as any).app.create({
    data: { name: '咨询商科岗位追踪 · Daily' },
  });

  if (appRes.code !== 0) {
    throw new Error(`创建表格失败: ${appRes.msg}`);
  }

  const appToken = appRes.data?.app?.app_token!;
  console.log(`✅ 表格创建成功`);
  console.log(`   https://hcn2vc1r2jus.feishu.cn/base/${appToken}\n`);

  // 获取默认表
  const tableListRes = await client.bitable.appTable.list({
    path: { app_token: appToken },
  });
  const tableId = tableListRes.data?.items?.[0]?.table_id!;

  // 重命名默认第一列
  const existingFields = await client.bitable.appTableField.list({
    path: { app_token: appToken, table_id: tableId },
  });
  const defaultTextField = existingFields.data?.items?.find(f => f.field_name === '文本');
  if (defaultTextField) {
    await client.bitable.appTableField.update({
      path: { app_token: appToken, table_id: tableId, field_id: defaultTextField.field_id! },
      data: { field_name: '岗位名', type: 1 },
    });
  }

  // 删除不需要的默认字段
  const fieldsToDelete = existingFields.data?.items?.filter(
    f => ['单选', '日期', '附件'].includes(f.field_name!)
  ) || [];
  for (const f of fieldsToDelete) {
    await client.bitable.appTableField.delete({
      path: { app_token: appToken, table_id: tableId, field_id: f.field_id! },
    });
  }

  // 创建新字段
  const fields = [
    { field_name: '公司', type: 1 },
    { field_name: '地点', type: 1 },
    { field_name: '来源', type: 3 },
    { field_name: '链接', type: 15 },
    { field_name: '抓取日期', type: 5 },
    { field_name: '状态', type: 3 },
  ];

  for (const f of fields) {
    await client.bitable.appTableField.create({
      path: { app_token: appToken, table_id: tableId },
      data: f,
    });
  }
  console.log('✅ 字段创建完成（岗位名/公司/地点/来源/链接/抓取日期/状态）\n');

  return { appToken, tableId };
}

// ─── 写入飞书 ────────────────────────────────────────────────────
async function writeToFeishu(jobs: JobPosting[], appToken: string, tableId: string) {
  if (jobs.length === 0) {
    console.log('📭 没有新岗位，跳过写入');
    return;
  }

  const BATCH = 20;
  let total = 0;

  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    const res = await client.bitable.appTableRecord.batchCreate({
      path: { app_token: appToken, table_id: tableId },
      data: {
        records: batch.map(j => ({
          fields: {
            '岗位名': j.title,
            '公司': j.company,
            '地点': j.location,
            '来源': j.source,
            ...(j.url ? { '链接': { link: j.url, text: j.title } } : {}),
            '抓取日期': new Date(j.date).getTime(),
            '状态': '未投递',
          },
        })),
      },
    });

    if (res.code === 0) {
      total += batch.length;
      console.log(`   写入 ${i + 1}~${Math.min(i + BATCH, jobs.length)} 条 ✅`);
    } else {
      console.error(`   写入失败 (${i + 1}~): ${res.msg}`);
    }
  }

  console.log(`\n📊 共写入 ${total} 条新岗位`);
}

// ─── 主流程 ──────────────────────────────────────────────────────
async function main() {
  const isInit = process.argv.includes('--init');
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\n🔍 咨询 & 商科岗位追踪器`);
  console.log(`   日期: ${today}`);
  console.log(`   查询组数: ${CONFIG.QUERIES.length}\n`);

  // 1. 确定表格
  let appToken = CONFIG.APP_TOKEN;
  let tableId = CONFIG.TABLE_ID;

  if (isInit || !appToken || !tableId) {
    const result = await createTable();
    appToken = result.appToken;
    tableId = result.tableId;
    console.log(`💡 请将以下配置保存到 .env：`);
    console.log(`   JOB_TRACKER_APP_TOKEN=${appToken}`);
    console.log(`   JOB_TRACKER_TABLE_ID=${tableId}\n`);
  }

  // 2. 获取已有记录（用于去重）
  console.log('📖 读取已有记录...');
  const existingKeys = await getExistingKeys(appToken, tableId);
  console.log(`   已有 ${existingKeys.size} 条记录\n`);

  // 3. 通过 Perplexity 搜索岗位
  console.log('🔎 通过 Perplexity 搜索最新岗位...\n');
  let allJobs: JobPosting[] = [];

  for (let i = 0; i < CONFIG.QUERIES.length; i++) {
    const query = CONFIG.QUERIES[i];
    const label = query.slice(0, 30) + '...';
    console.log(`   [${i + 1}/${CONFIG.QUERIES.length}] ${label}`);

    try {
      const { text, urls } = await queryPerplexity(query);
      const jobs = parseJobs(text, urls);
      console.log(`   → 解析出 ${jobs.length} 条岗位`);
      allJobs.push(...jobs);
    } catch (err: any) {
      console.error(`   ⚠ 查询失败: ${err.message}`);
    }

    // 间隔避免限流
    if (i < CONFIG.QUERIES.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 4. 去重
  allJobs = dedup(allJobs);
  console.log(`\n📋 去重后共 ${allJobs.length} 条`);

  // 过滤已有
  const newJobs = allJobs.filter(j => {
    const key = `${j.title}|${j.company}`.toLowerCase();
    return !existingKeys.has(key);
  });
  console.log(`🆕 其中新增 ${newJobs.length} 条\n`);

  // 5. 写入飞书
  await writeToFeishu(newJobs, appToken, tableId);

  console.log(`\n✅ 完成！表格地址：`);
  console.log(`   https://hcn2vc1r2jus.feishu.cn/base/${appToken}`);
}

main().catch(console.error);
