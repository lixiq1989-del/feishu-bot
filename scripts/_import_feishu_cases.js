/**
 * Import missing cases from Feishu bitable into cases.json
 * Maps Chinese field names & school names to English
 */
const { Client } = require('@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const client = new Client({ appId: 'cli_a92832aa14b9dcef', appSecret: 'uSmMRMe4pWO9119iD3SVdh5044TsqVyX' });
const APP = 'TLG4bjbj1aPJTts80facSED3nAe';

const CASE_TABLES = [
  { name: '英国', id: 'tbl3pL9XJxu9eqSE', country: 'UK' },
  { name: '澳洲', id: 'tblyf74PZOd1bVuC', country: 'Australia' },
  { name: '港新', id: 'tblfOsRRG5r0JmOv', country: 'HK/SG' },
  { name: '美国', id: 'tbl36Rh2n10PLbVB', country: 'US' },
];

// Chinese school name -> English name mapping (built from existing programs.json + cases.json)
const SCHOOL_NAME_MAP = {};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchAll(tableId, tableName) {
  const records = [];
  let pageToken = undefined;
  let page = 0;
  while (true) {
    const params = { page_size: 200 };
    if (pageToken) params.page_token = pageToken;
    let res;
    for (let retry = 0; retry < 3; retry++) {
      try {
        res = await client.bitable.appTableRecord.list({
          path: { app_token: APP, table_id: tableId },
          params,
        });
        break;
      } catch (e) {
        console.log(`  重试 ${retry + 1}/3...`);
        await sleep(2000 * (retry + 1));
      }
    }
    if (!res || res.code !== 0) { console.error('Error:', res?.msg || 'no response'); break; }
    records.push(...(res.data?.items || []));
    page++;
    if (page % 10 === 0) console.log(`  ${tableName}: ${records.length} 条已拉取...`);
    if (!res.data?.has_more) break;
    pageToken = res.data.page_token;
    await sleep(100);
  }
  return records;
}

function buildSchoolNameMap() {
  // Build from programs.json (has normalized_school_name)
  const programs = JSON.parse(fs.readFileSync(path.join(__dirname, '../../uk-masters-tool/data/programs.json'), 'utf8'));
  const schoolNames = new Set();
  programs.forEach(p => schoolNames.add(p.school_name));

  // Build from cases.json existing school names
  const cases = JSON.parse(fs.readFileSync(path.join(__dirname, '../../uk-masters-tool/data/cases.json'), 'utf8'));
  cases.forEach(c => { if (c.school_name) schoolNames.add(c.school_name); });

  // Manual Chinese -> English mapping for common schools
  const manual = {
    '帝国理工学院': 'Imperial College London',
    '伦敦政治经济学院': 'London School of Economics',
    '伦敦大学学院': 'University College London',
    '牛津大学': 'University of Oxford',
    '剑桥大学': 'University of Cambridge',
    '华威大学': 'University of Warwick',
    '爱丁堡大学': 'University of Edinburgh',
    '曼彻斯特大学': 'University of Manchester',
    '伦敦国王学院': "King's College London",
    '布里斯托大学': 'University of Bristol',
    '格拉斯哥大学': 'University of Glasgow',
    '伯明翰大学': 'University of Birmingham',
    '利兹大学': 'University of Leeds',
    '谢菲尔德大学': 'University of Sheffield',
    '诺丁汉大学': 'University of Nottingham',
    '南安普顿大学': 'University of Southampton',
    '杜伦大学': 'Durham University',
    '利物浦大学': 'University of Liverpool',
    '纽卡斯尔大学': 'Newcastle University',
    '埃克塞特大学': 'University of Exeter',
    '兰卡斯特大学': 'Lancaster University',
    '约克大学': 'University of York',
    '巴斯大学': 'University of Bath',
    '拉夫堡大学': 'Loughborough University',
    '卡迪夫大学': 'Cardiff University',
    '伦敦玛丽女王大学': 'Queen Mary University of London',
    '苏塞克斯大学': 'University of Sussex',
    '萨里大学': 'University of Surrey',
    '雷丁大学': 'University of Reading',
    '莱斯特大学': 'University of Leicester',
    '伦敦城市大学': 'City University of London',
    '贝尔法斯特女王大学': "Queen's University Belfast",
    '考文垂大学': 'Coventry University',
    '阿伯丁大学': 'University of Aberdeen',
    '斯特拉斯克莱德大学': 'University of Strathclyde',
    '赫瑞瓦特大学': 'Heriot-Watt University',
    '肯特大学': 'University of Kent',
    '阿斯顿大学': 'Aston University',
    '圣安德鲁斯大学': 'University of St Andrews',
    '牛津布鲁克斯大学': 'Oxford Brookes University',
    '哈德斯菲尔德大学': 'University of Huddersfield',
    '德蒙福特大学': 'De Montfort University',
    '威斯敏斯特大学': 'University of Westminster',
    '东安格利亚大学': 'University of East Anglia',
    '斯旺西大学': 'Swansea University',
    '诺森比亚大学': 'Northumbria University',
    '布鲁内尔大学': 'Brunel University London',
    '埃塞克斯大学': 'University of Essex',
    '普利茅斯大学': 'University of Plymouth',
    '基尔大学': 'Keele University',
    '林肯大学': 'University of Lincoln',
    '赫尔大学': 'University of Hull',
    '金斯顿大学': 'Kingston University',
    '克兰菲尔德大学': 'Cranfield University',
    '班戈大学': 'Bangor University',
    '布里斯托尔大学': 'University of Bristol',
    '雪菲尔大学': 'University of Sheffield',
    '伯明翰城市大学': 'Birmingham City University',
    // Australia
    '墨尔本大学': 'University of Melbourne',
    '悉尼大学': 'University of Sydney',
    '新南威尔士大学': 'University of New South Wales',
    '澳大利亚国立大学': 'Australian National University',
    '昆士兰大学': 'University of Queensland',
    '莫纳什大学': 'Monash University',
    '西澳大学': 'University of Western Australia',
    '阿德莱德大学': 'University of Adelaide',
    '悉尼科技大学': 'University of Technology Sydney',
    '麦考瑞大学': 'Macquarie University',
    '迪肯大学': 'Deakin University',
    '昆士兰科技大学': 'Queensland University of Technology',
    '皇家墨尔本理工大学': 'RMIT University',
    '格里菲斯大学': 'Griffith University',
    '卧龙岗大学': 'University of Wollongong',
    '纽卡斯尔大学（澳洲）': 'University of Newcastle (Australia)',
    '塔斯马尼亚大学': 'University of Tasmania',
    '科廷大学': 'Curtin University',
    '南澳大学': 'University of South Australia',
    '西悉尼大学': 'Western Sydney University',
    '詹姆斯库克大学': 'James Cook University',
    '拉筹伯大学': 'La Trobe University',
    '弗林德斯大学': 'Flinders University',
    '邦德大学': 'Bond University',
    '堪培拉大学': 'University of Canberra',
    '斯威本科技大学': 'Swinburne University of Technology',
    // HK
    '香港大学': 'University of Hong Kong',
    '香港科技大学': 'Hong Kong University of Science and Technology',
    '香港中文大学': 'Chinese University of Hong Kong',
    '香港城市大学': 'City University of Hong Kong',
    '香港理工大学': 'Hong Kong Polytechnic University',
    '香港浸会大学': 'Hong Kong Baptist University',
    '香港岭南大学': 'Lingnan University',
    '香港教育大学': 'Education University of Hong Kong',
    // Singapore
    '新加坡国立大学': 'National University of Singapore',
    '南洋理工大学': 'Nanyang Technological University',
    '新加坡管理大学': 'Singapore Management University',
    '新加坡管理学院': 'Singapore Institute of Management',
    // US
    '哥伦比亚大学': 'Columbia University',
    '纽约大学': 'New York University',
    '波士顿大学': 'Boston University',
    '约翰霍普金斯大学': 'Johns Hopkins University',
    '乔治城大学': 'Georgetown University',
    '南加州大学': 'University of Southern California',
    '芝加哥大学': 'University of Chicago',
    '宾夕法尼亚大学': 'University of Pennsylvania',
    '杜克大学': 'Duke University',
    '密歇根大学': 'University of Michigan',
    '加州大学伯克利分校': 'University of California Berkeley',
    '加州大学洛杉矶分校': 'University of California Los Angeles',
    '西北大学': 'Northwestern University',
    '罗切斯特大学': 'University of Rochester',
    '圣路易斯华盛顿大学': 'Washington University in St. Louis',
    '波士顿学院': 'Boston College',
    '布兰迪斯大学': 'Brandeis University',
    '东北大学': 'Northeastern University',
    '福特汉姆大学': 'Fordham University',
    '罗格斯大学': 'Rutgers University',
    '伊利诺伊大学香槟分校': 'University of Illinois Urbana-Champaign',
    '卡内基梅隆大学': 'Carnegie Mellon University',
    // France
    'ESSEC商学院': 'ESSEC Business School',
    'HEC巴黎': 'HEC Paris',
    'ESCP商学院': 'ESCP Business School',
    '里昂商学院': 'EM Lyon Business School',
    '巴黎高等商学院': 'HEC Paris',
  };

  Object.assign(SCHOOL_NAME_MAP, manual);
}

async function run() {
  buildSchoolNameMap();
  console.log('学校映射表:', Object.keys(SCHOOL_NAME_MAP).length, '所');

  // Load existing cases
  const casesPath = path.join(__dirname, '../../uk-masters-tool/data/cases.json');
  const existingCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  console.log('现有 cases.json:', existingCases.length, '条');

  // Build dedup set from existing
  const existingKeys = new Set();
  existingCases.forEach(c => {
    const key = (c.school_name || '').toLowerCase() + '|' + (c.program_name || '').toLowerCase() + '|' + (c.applicant_background_school || '').toLowerCase() + '|' + (c.applicant_gpa || '');
    existingKeys.add(key);
  });

  let maxId = Math.max(...existingCases.map(c => c.id || 0));
  let added = 0;
  let skippedDup = 0;
  let skippedNoSchool = 0;
  const unmappedSchools = {};

  for (const table of CASE_TABLES) {
    console.log(`\n拉取 ${table.name}...`);
    const records = await fetchAll(table.id, table.name);
    console.log(`  ${records.length} 条`);

    for (const r of records) {
      const f = r.fields;
      const cnSchool = (f['学校'] || '').trim();
      const enSchool = SCHOOL_NAME_MAP[cnSchool] || cnSchool; // fallback to Chinese name

      if (!cnSchool) { skippedNoSchool++; continue; }

      // Check if we have an English mapping
      if (!SCHOOL_NAME_MAP[cnSchool] && /[\u4e00-\u9fa5]/.test(cnSchool)) {
        unmappedSchools[cnSchool] = (unmappedSchools[cnSchool] || 0) + 1;
      }

      const programName = (f['专业'] || '').trim();
      const bgSchool = (f['本科学校'] || '').trim();
      const gpa = (f['均分'] || '').toString().trim();

      // Dedup check
      const key = enSchool.toLowerCase() + '|' + programName.toLowerCase() + '|' + bgSchool.toLowerCase() + '|' + gpa;
      if (existingKeys.has(key)) { skippedDup++; continue; }
      existingKeys.add(key);

      maxId++;
      existingCases.push({
        id: maxId,
        school_name: enSchool,
        program_name: programName,
        program_url: null,
        applicant_country: 'China',
        applicant_background_school: bgSchool,
        applicant_background_tier: f['层次'] || null,
        applicant_major: f['本科专业'] || null,
        applicant_gpa: gpa || null,
        applicant_language_score: null,
        applicant_gmat_gre: null,
        applicant_internships: null,
        applicant_work_experience: null,
        applicant_extra_background: null,
        admission_result: 'admitted',
        scholarship_result: null,
        entry_year: null,
        source_platform: 'Feishu Bitable',
        source_url: null,
        case_summary: null,
        confidence_score: 3,
        last_updated: '2026-03-14',
        notes: `Imported from Feishu ${table.name} table`,
      });
      added++;
    }
  }

  console.log('\n导入结果:');
  console.log('  新增:', added, '条');
  console.log('  重复跳过:', skippedDup, '条');
  console.log('  无学校名跳过:', skippedNoSchool, '条');
  console.log('  最终总计:', existingCases.length, '条');

  // Show unmapped schools
  const unmappedEntries = Object.entries(unmappedSchools).sort((a, b) => b[1] - a[1]);
  console.log('\n未映射中文学校名 Top 30 (将用原名):');
  unmappedEntries.slice(0, 30).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
  console.log('  共', unmappedEntries.length, '所未映射学校');

  // Save
  fs.writeFileSync(casesPath, JSON.stringify(existingCases, null, 2));
  console.log('\ncases.json 已保存');
}

run().catch(e => console.error(e.message || e));
