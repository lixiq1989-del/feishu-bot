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
    if (res.code !== 0) {
      console.error('Error fetching:', res.msg);
      break;
    }
    const items = res.data?.items || [];
    records.push(...items);
    if (!res.data?.has_more) break;
    pageToken = res.data.page_token;
  }
  return records;
}

async function run() {
  // Fetch first few records to see field structure
  const sampleRes = await client.bitable.appTableRecord.list({
    path: { app_token: APP, table_id: CASE_TABLES[0].id },
    params: { page_size: 3 },
  });
  const sampleFields = sampleRes.data?.items?.[0]?.fields || {};
  console.log('字段列表:', Object.keys(sampleFields).join(', '));
  console.log('样本记录:', JSON.stringify(sampleFields, null, 2).slice(0, 1000));

  // Fetch all records from all tables
  const allRecords = [];
  for (const table of CASE_TABLES) {
    console.log(`\n拉取 ${table.name}...`);
    const records = await fetchAll(table.id);
    console.log(`  获取 ${records.length} 条`);
    allRecords.push(...records.map(r => ({ ...r.fields, _table: table.name })));
  }

  console.log('\n飞书总计:', allRecords.length, '条');

  // Create unique keys and dedup
  const unique = new Map();
  for (const r of allRecords) {
    // Try to create a reasonable key - need to figure out field names first
    const school = r['学校'] || r['school_name'] || r['申请学校'] || '';
    const program = r['项目'] || r['program_name'] || r['申请项目'] || '';
    const bgSchool = r['本科院校'] || r['applicant_background_school'] || r['背景院校'] || '';
    const gpa = r['GPA'] || r['applicant_gpa'] || '';
    const key = `${school}|${program}|${bgSchool}|${gpa}`;
    if (!unique.has(key)) {
      unique.set(key, r);
    }
  }

  console.log('飞书去重后:', unique.size, '条');

  // Compare with current cases.json
  const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '../../uk-masters-tool/data/cases.json'), 'utf8'));
  console.log('当前 cases.json:', cases.length, '条');

  // Create keys for cases.json
  const caseKeys = new Set();
  cases.forEach(c => {
    const key = `${c.school_name}|${c.program_name}|${c.applicant_background_school}|${c.applicant_gpa}`;
    caseKeys.add(key);
  });
  console.log('cases.json 去重:', caseKeys.size, '条');

  // Check how many feishu records are not in cases.json
  let missing = 0;
  for (const [key] of unique) {
    if (!caseKeys.has(key)) missing++;
  }
  console.log('飞书中不在 cases.json 的:', missing, '条');
}

run().catch(e => console.error(e.message || e));
