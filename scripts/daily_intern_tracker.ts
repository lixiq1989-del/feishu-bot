/**
 * 互联网暑期实习每日追踪器
 *
 * 数据源：通过 Perplexity API 搜索最新互联网暑期实习信息
 * 存储：飞书多维表格，支持增量更新 & 去重
 * 推送：汇总结果发送到飞书群
 *
 * 用法：
 *   npm run intern              # 日常运行（搜索 + 写入已有表格）
 *   npm run intern:init         # 首次运行（创建表格 + 搜索 + 写入）
 *
 * 环境变量：
 *   PERPLEXITY_API_KEY          # Perplexity API key
 *   INTERN_TRACKER_APP_TOKEN    # 飞书表格 app_token（init 后自动生成）
 *   INTERN_TRACKER_TABLE_ID     # 飞书表格 table_id（init 后自动生成）
 *   CHAT_ID_JOBS                # 推送目标群（可选）
 */

// 手动加载 .env
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
  APP_TOKEN: process.env.INTERN_TRACKER_APP_TOKEN || '',
  TABLE_ID: process.env.INTERN_TRACKER_TABLE_ID || '',
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '',
  CHAT_ID: process.env.CHAT_ID_JOBS || '',

  QUERIES: [
    // 技术类
    '2026年或2027届互联网大厂暑期实习最新招聘信息，包括字节跳动、腾讯、阿里巴巴、美团、京东、拼多多、百度、快手、小红书、哔哩哔哩、网易。列出每家公司正在招聘的实习岗位名称、公司、城市、投递链接。只列当前仍在招聘的岗位。',
    '2026年或2027届AI和大模型方向暑期实习岗位，包括字节豆包、腾讯混元、阿里通义、百度文心、华为、小米、商汤、月之暗面、智谱、MiniMax等。列出岗位名称、公司、城市、投递链接。',
    '2026年或2027届互联网中厂暑期实习招聘，包括滴滴、携程、SHEIN、米哈游、莉莉丝、蔚来、小鹏、理想、大疆、OPPO、vivo、荣耀、联想等。列出岗位名称、公司、城市、投递链接。',
    '2026年或2027届外企科技公司中国区暑期实习招聘，包括微软、谷歌、苹果、英特尔、高通、英伟达、AMD、IBM、亚马逊AWS、SAP等。列出岗位名称、公司、城市、投递链接。',
    // 商科/非技术类
    '2026年或2027届互联网大厂商业分析、商分、数据分析暑期实习岗位，包括字节跳动、腾讯、阿里巴巴、美团、京东、拼多多、快手、小红书等。列出岗位名称、公司、城市、投递链接。',
    '2026年或2027届互联网大厂战略分析、战略规划、行业研究、投资分析暑期实习岗位，包括字节战略、腾讯战投、阿里战投、美团战略、京东战略等。列出岗位名称、公司、城市、投递链接。',
    '2026年或2027届互联网大厂产品经理、产品运营、用户增长暑期实习岗位，包括字节跳动、腾讯、阿里巴巴、美团、京东、快手、小红书、哔哩哔哩等。列出岗位名称、公司、城市、投递链接。',
    '2026年或2027届互联网大厂市场营销、品牌、公关、内容运营暑期实习岗位，包括字节跳动、腾讯、阿里巴巴、美团、京东、快手、小红书等。列出岗位名称、公司、城市、投递链接。',
    // 最新汇总
    '最近一周新开放的2026或2027届互联网暑期实习岗位，从牛客网、应届生求职网、校招日历等渠道搜集。列出岗位名称、公司、城市、来源链接。',
  ],
};

// ─── 类型 ────────────────────────────────────────────────────────
interface InternPosting {
  title: string;
  company: string;
  location: string;
  source: string;
  url: string;
  date: string;
  startDate: string;   // 开始投递时间
  deadline: string;     // 截止投递时间
  jd: string;           // 岗位描述/要求
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
        content: `You are a job listing assistant specializing in Chinese tech company internships. Return ONLY a valid JSON array, nothing else — no markdown, no explanation, no code fences.

Each element must be an object with exactly these keys:
{"title":"岗位名称","company":"公司名","location":"城市","source":"来源平台","url":"投递链接或空字符串","startDate":"开始投递日期(YYYY-MM-DD格式,未知则空字符串)","deadline":"截止投递日期(YYYY-MM-DD格式,未知则空字符串,招满即止写招满即止)","jd":"岗位描述和要求,包括职责、技能要求、学历要求等,100-300字"}

Return 10-20 real, currently active internship postings. Include start/deadline dates and job descriptions when available. Respond with the raw JSON array only.`,
      },
      { role: 'user', content: userPrompt },
    ],
    search_recency_filter: 'week',
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
function parseInterns(text: string): InternPosting[] {
  const today = new Date().toISOString().slice(0, 10);
  const jobs: InternPosting[] = [];

  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
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
              startDate: String(item.startDate || ''),
              deadline: String(item.deadline || ''),
              jd: String(item.jd || ''),
            });
          }
        }
      }
    } catch { /* fallback below */ }
  }

  if (jobs.length === 0) {
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
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
          startDate: '',
          deadline: '',
          jd: '',
        });
      }
    }
  }

  return jobs;
}

// ─── 去重 ────────────────────────────────────────────────────────
function dedup(jobs: InternPosting[]): InternPosting[] {
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
    data: { name: '互联网暑期实习追踪 · Daily' },
  });

  if (appRes.code !== 0) {
    throw new Error(`创建表格失败: ${appRes.msg}`);
  }

  const appToken = appRes.data?.app?.app_token!;
  console.log(`✅ 表格创建成功`);
  console.log(`   https://hcn2vc1r2jus.feishu.cn/base/${appToken}\n`);

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
    { field_name: '类别', type: 3 },  // 单选：大厂/AI/中厂/外企
    { field_name: '来源', type: 1 },
    { field_name: '链接', type: 15 },
    { field_name: '岗位JD', type: 1 },
    { field_name: '开始投递', type: 1 },
    { field_name: '截止投递', type: 1 },
    { field_name: '抓取日期', type: 5 },
    { field_name: '状态', type: 3 },   // 单选：未投递/已投递/面试中/已拿offer
  ];

  for (const f of fields) {
    await client.bitable.appTableField.create({
      path: { app_token: appToken, table_id: tableId },
      data: f,
    });
  }
  console.log('✅ 字段创建完成（岗位名/公司/地点/类别/来源/链接/抓取日期/状态）\n');

  return { appToken, tableId };
}

// ─── 写入飞书表格 ────────────────────────────────────────────────
async function writeToFeishu(jobs: InternPosting[], appToken: string, tableId: string, category: string) {
  if (jobs.length === 0) return 0;

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
            '类别': category,
            '来源': j.source,
            ...(j.url ? { '链接': { link: j.url, text: j.title } } : {}),
            ...(j.jd ? { '岗位JD': j.jd } : {}),
            ...(j.startDate ? { '开始投递': j.startDate } : {}),
            ...(j.deadline ? { '截止投递': j.deadline } : {}),
            '抓取日期': new Date(j.date).getTime(),
            '状态': '未投递',
          },
        })),
      },
    });

    if (res.code === 0) {
      total += batch.length;
      // debug: 检查第一条写入结果
      if (i === 0 && res.data?.records?.[0]) {
        const sample = res.data.records[0].fields as any;
        console.log(`   [debug] 首条写入: 岗位名=${sample['岗位名']}, 公司=${sample['公司']}, JD=${(sample['岗位JD']||'').slice(0,30)}`);
      }
    } else {
      console.error(`   写入失败 (${i + 1}~): code=${res.code} ${res.msg}`);
      // debug: 打印第一条记录看看
      if (batch[0]) console.error(`   [debug] 首条数据:`, JSON.stringify(batch[0]).slice(0, 200));
    }
  }

  return total;
}

// ─── 推送飞书群消息 ──────────────────────────────────────────────
async function pushToChat(chatId: string, summary: string) {
  if (!chatId) return;

  await client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify({
        config: { wide_screen_mode: true },
        header: {
          title: { tag: 'plain_text', content: '🔍 互联网暑期实习 · 每日更新' },
          template: 'blue',
        },
        elements: [
          { tag: 'markdown', content: summary },
          { tag: 'hr' },
          { tag: 'markdown', content: `📅 更新时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}` },
        ],
      }),
    },
  });
}

// ─── 主流程 ──────────────────────────────────────────────────────
const CATEGORIES = ['互联网大厂', 'AI/大模型', '互联网中厂', '外企科技', '商业分析', '战略/投资', '产品/运营', '市场/品牌', '最新开放'];

async function main() {
  const isInit = process.argv.includes('--init');
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\n🔍 互联网暑期实习追踪器`);
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
    console.log(`   INTERN_TRACKER_APP_TOKEN=${appToken}`);
    console.log(`   INTERN_TRACKER_TABLE_ID=${tableId}\n`);
  }

  // 2. 获取已有记录（用于去重）
  console.log('📖 读取已有记录...');
  const existingKeys = await getExistingKeys(appToken, tableId);
  console.log(`   已有 ${existingKeys.size} 条记录\n`);

  // 3. 通过 Perplexity 搜索岗位
  console.log('🔎 通过 Perplexity 搜索最新暑期实习...\n');
  let totalNew = 0;
  const summaryParts: string[] = [];

  for (let i = 0; i < CONFIG.QUERIES.length; i++) {
    const query = CONFIG.QUERIES[i];
    const category = CATEGORIES[i] || '其他';
    console.log(`   [${i + 1}/${CONFIG.QUERIES.length}] ${category}`);

    try {
      const { text, urls } = await queryPerplexity(query);
      const jobs = parseInterns(text);
      const dedupedJobs = dedup(jobs);

      // 过滤已有
      const newJobs = dedupedJobs.filter(j => {
        const key = `${j.title}|${j.company}`.toLowerCase();
        return !existingKeys.has(key);
      });

      console.log(`   → 解析 ${jobs.length} 条，去重后 ${dedupedJobs.length} 条，新增 ${newJobs.length} 条`);

      // 写入
      if (newJobs.length > 0) {
        const written = await writeToFeishu(newJobs, appToken, tableId, category);
        totalNew += written;

        // 加入已有集合防止后续重复
        for (const j of newJobs) {
          existingKeys.add(`${j.title}|${j.company}`.toLowerCase());
        }

        // 汇总摘要
        const top5 = newJobs.slice(0, 5);
        summaryParts.push(
          `**${category}** (+${newJobs.length}条)\n` +
          top5.map(j => `- ${j.company} · ${j.title} · ${j.location}`).join('\n') +
          (newJobs.length > 5 ? `\n- ...等${newJobs.length - 5}条` : '')
        );
      }
    } catch (err: any) {
      console.error(`   ⚠ 查询失败: ${err.message}`);
    }

    // 间隔避免限流
    if (i < CONFIG.QUERIES.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n📊 共新增 ${totalNew} 条实习岗位`);
  console.log(`   表格地址: https://hcn2vc1r2jus.feishu.cn/base/${appToken}\n`);

  // 4. 推送到群
  if (totalNew > 0 && CONFIG.CHAT_ID) {
    const summary = summaryParts.join('\n\n') +
      `\n\n📊 今日共新增 **${totalNew}** 条\n[查看完整表格](https://hcn2vc1r2jus.feishu.cn/base/${appToken})`;
    console.log('📤 推送到飞书群...');
    await pushToChat(CONFIG.CHAT_ID, summary);
    console.log('✅ 推送完成');
  } else if (totalNew === 0) {
    console.log('📭 今日无新增岗位，跳过推送');
  }

  console.log('\n✅ 完成！');
}

main().catch(console.error);
