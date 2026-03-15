const { Client } = require('@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const client = new Client({ appId: 'cli_a92832aa14b9dcef', appSecret: 'uSmMRMe4pWO9119iD3SVdh5044TsqVyX' });
const APP = 'TLG4bjbj1aPJTts80facSED3nAe';

const CASE_TABLES = [
  { name: '英国', id: 'tbl3pL9XJxu9eqSE' },
  { name: '澳洲', id: 'tblyf74PZOd1bVuC' },
  { name: '港新', id: 'tblfOsRRG5r0JmOv' },
  { name: '美国', id: 'tbl36Rh2n10PLbVB' },
];

async function fetchAll(tableId) {
  const records = [];
  let pageToken = undefined;
  while (true) {
    const params = { page_size: 500 };
    if (pageToken) params.page_token = pageToken;
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: APP, table_id: tableId },
      params,
    });
    if (res.code !== 0) { console.error('Error:', res.msg); break; }
    records.push(...(res.data?.items || []));
    if (!res.data?.has_more) break;
    pageToken = res.data.page_token;
  }
  return records;
}

function normalize(s) {
  return (s || '').toString().trim().toLowerCase();
}

async function run() {
  // Fetch all from Feishu
  const allFeishu = [];
  for (const table of CASE_TABLES) {
    console.log(`拉取 ${table.name}...`);
    const records = await fetchAll(table.id);
    console.log(`  ${records.length} 条`);
    records.forEach(r => {
      const f = r.fields;
      allFeishu.push({
        school: normalize(f['学校']),
        program: normalize(f['专业']),
        bgSchool: normalize(f['本科学校']),
        gpa: normalize(f['均分']),
        _table: table.name,
        _raw: f,
      });
    });
  }
  console.log('\n飞书总计:', allFeishu.length);

  // Dedup Feishu by key
  const feishuUnique = new Map();
  for (const r of allFeishu) {
    const key = `${r.school}|${r.program}|${r.bgSchool}|${r.gpa}`;
    if (!feishuUnique.has(key)) feishuUnique.set(key, r);
  }
  console.log('飞书去重后:', feishuUnique.size);

  // Load cases.json and create keys using the CHINESE field mapping
  const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '../../uk-masters-tool/data/cases.json'), 'utf8'));
  console.log('cases.json:', cases.length);

  // cases.json uses: school_name, program_name, applicant_background_school, applicant_gpa
  // Feishu uses: 学校, 专业, 本科学校, 均分
  // The school names in cases.json are in English (e.g., "University of Birmingham")
  // While Feishu has Chinese names (e.g., "格拉斯哥大学")
  // So we need a different approach - just check by school_cn + program + bg_school + gpa

  // Let's see what cases.json school_name looks like
  const sampleSchools = new Set();
  cases.slice(0, 20).forEach(c => sampleSchools.add(c.school_name));
  console.log('\ncases.json school_name 样本:', [...sampleSchools].join(', '));

  // And feishu
  const feishuSchools = new Set();
  allFeishu.slice(0, 20).forEach(r => feishuSchools.add(r.school));
  console.log('飞书 学校 样本:', [...feishuSchools].join(', '));

  // Check if cases.json has any Chinese school names
  const hasChinese = cases.filter(c => /[\u4e00-\u9fa5]/.test(c.school_name || '')).length;
  const hasEnglish = cases.filter(c => /[a-zA-Z]/.test(c.school_name || '')).length;
  console.log('\ncases.json 中文学校名:', hasChinese, '条');
  console.log('cases.json 英文学校名:', hasEnglish, '条');

  // Check feishu
  const feishuChinese = allFeishu.filter(r => /[\u4e00-\u9fa5]/.test(r.school)).length;
  const feishuEnglish = allFeishu.filter(r => /[a-zA-Z]/.test(r.school)).length;
  console.log('飞书 中文学校名:', feishuChinese, '条');
  console.log('飞书 英文学校名:', feishuEnglish, '条');

  // Try matching by bgSchool + gpa + program (ignoring school name language diff)
  const caseKeys = new Set();
  cases.forEach(c => {
    const key = normalize(c.applicant_background_school) + '|' + normalize(c.applicant_gpa) + '|' + normalize(c.program_name);
    caseKeys.add(key);
  });

  let matched = 0, missing = 0;
  const missingExamples = [];
  for (const [, r] of feishuUnique) {
    const key = r.bgSchool + '|' + r.gpa + '|' + r.program;
    if (caseKeys.has(key)) {
      matched++;
    } else {
      missing++;
      if (missingExamples.length < 10) {
        missingExamples.push(r._raw);
      }
    }
  }

  console.log('\n匹配结果（用 bgSchool+gpa+program 做 key）:');
  console.log('  匹配上:', matched);
  console.log('  未匹配:', missing);

  if (missingExamples.length > 0) {
    console.log('\n未匹配样本:');
    missingExamples.forEach((ex, i) => {
      console.log(`  ${i+1}. ${ex['学校']} | ${ex['专业']} | ${ex['本科学校']} | GPA ${ex['均分']} | 层次 ${ex['层次']}`);
    });
  }

  // Also check: how many feishu records have 层次 !== '硕士'
  const tierDist = {};
  allFeishu.forEach(r => {
    const tier = r._raw['层次'] || '未知';
    tierDist[tier] = (tierDist[tier] || 0) + 1;
  });
  console.log('\n飞书 层次 分布:');
  Object.entries(tierDist).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
}

run().catch(e => console.error(e.message || e));
