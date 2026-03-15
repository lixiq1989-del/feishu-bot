/**
 * Fix import:
 * 1. Import US table (different field names)
 * 2. Fix unmapped Chinese school names in existing cases
 */
const { Client } = require('@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const client = new Client({ appId: 'cli_a92832aa14b9dcef', appSecret: 'uSmMRMe4pWO9119iD3SVdh5044TsqVyX' });
const APP = 'TLG4bjbj1aPJTts80facSED3nAe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Additional school name mappings
const EXTRA_MAP = {
  '悉尼新南威尔士大学': 'University of New South Wales',
  '新南威尔士大学悉尼分校': 'University of New South Wales',
  '蒙纳士大学': 'Monash University',
  '澳国立大学': 'Australian National University',
  '西澳大利亚大学': 'University of Western Australia',
  '伦敦大学国王学院': "King's College London",
  '香港中文大学（深圳校区）': 'Chinese University of Hong Kong Shenzhen',
  '伦敦大学金史密斯学院': 'Goldsmiths University of London',
  '伦敦大学玛丽皇后学院': 'Queen Mary University of London',
  '科廷大学新加坡校区': 'Curtin University',
  '伦敦艺术大学': 'University of the Arts London',
  '伦敦艺术大学-北京办事处': 'University of the Arts London',
  '伦敦艺术大学-上海办事处': 'University of the Arts London',
  '创意艺术大学': 'University for the Creative Arts',
  '博尔顿大学': 'University of Bolton',
  '曼彻斯特城市大学': 'Manchester Metropolitan University',
  '格拉斯哥艺术学院': 'Glasgow School of Art',
  '思克莱德大学': 'University of Strathclyde',
  '詹姆斯·库克大学': 'James Cook University',
  '香港都会大学': 'Hong Kong Metropolitan University',
  '伦敦布鲁内尔大学': 'Brunel University London',
  '罗汉普顿大学': 'University of Roehampton',
  '东英吉利大学': 'University of East Anglia',
  '邓迪大学': 'University of Dundee',
  '布莱顿大学': 'University of Brighton',
  '伯恩茅斯大学': 'Bournemouth University',
  '诺丁汉特伦特大学': 'Nottingham Trent University',
  '伦敦大学皇家霍洛威学院': 'Royal Holloway University of London',
  '斯特灵大学': 'University of Stirling',
  '香港浸会大学（北师大港浸会联合国际学院）': 'Hong Kong Baptist University',
  '伦敦城市大学': 'City University of London',
  '谢菲尔德哈勒姆大学': 'Sheffield Hallam University',
  '利物浦约翰摩尔斯大学': 'Liverpool John Moores University',
  '伦敦南岸大学': 'London South Bank University',
  '安格利亚鲁斯金大学': 'Anglia Ruskin University',
  '中央兰开夏大学': 'University of Central Lancashire',
  '德比大学': 'University of Derby',
  '罗伯特戈登大学': 'Robert Gordon University',
  '伍斯特大学': 'University of Worcester',
  '利兹贝克特大学': 'Leeds Beckett University',
  '伦敦都市大学': 'London Metropolitan University',
  '索尔福德大学': 'University of Salford',
  '西英格兰大学': 'University of the West of England',
  '密德萨斯大学': 'Middlesex University',
  '提赛德大学': 'Teesside University',
  '格鲁斯特大学': 'University of Gloucestershire',
  '桑德兰大学': 'University of Sunderland',
  '坎特伯雷基督教会大学': 'Canterbury Christ Church University',
  '切斯特大学': 'University of Chester',
  '北安普顿大学': 'University of Northampton',
  // US schools
  '斯蒂文斯理工学院': 'Stevens Institute of Technology',
  '亚利桑那州立大学': 'Arizona State University',
  '威斯康星大学奥什科什分校': 'University of Wisconsin Oshkosh',
  '康涅狄格大学': 'University of Connecticut',
  '佛罗里达大学': 'University of Florida',
  '德克萨斯大学奥斯汀分校': 'University of Texas at Austin',
  '明尼苏达大学': 'University of Minnesota',
  '普渡大学': 'Purdue University',
  '俄亥俄州立大学': 'Ohio State University',
  '印第安纳大学': 'Indiana University',
  '匹兹堡大学': 'University of Pittsburgh',
  '雪城大学': 'Syracuse University',
  '马里兰大学': 'University of Maryland',
  '威斯康星大学麦迪逊分校': 'University of Wisconsin Madison',
  '佐治亚理工学院': 'Georgia Institute of Technology',
  '弗吉尼亚大学': 'University of Virginia',
  '北卡罗来纳大学教堂山分校': 'University of North Carolina at Chapel Hill',
  '圣母大学': 'University of Notre Dame',
  '范德堡大学': 'Vanderbilt University',
  '莱斯大学': 'Rice University',
  '埃默里大学': 'Emory University',
  '塔夫茨大学': 'Tufts University',
  '维克森林大学': 'Wake Forest University',
  '佩珀代因大学': 'Pepperdine University',
  '加州大学圣地亚哥分校': 'University of California San Diego',
  '加州大学戴维斯分校': 'University of California Davis',
  '加州大学圣巴巴拉分校': 'University of California Santa Barbara',
  '加州大学欧文分校': 'University of California Irvine',
};

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

async function run() {
  const casesPath = path.join(__dirname, '../../uk-masters-tool/data/cases.json');
  const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  console.log('当前 cases.json:', cases.length, '条');

  // Step 1: Fix unmapped school names in existing cases
  let fixedNames = 0;
  cases.forEach(c => {
    if (EXTRA_MAP[c.school_name]) {
      c.school_name = EXTRA_MAP[c.school_name];
      fixedNames++;
    }
  });
  console.log('修复学校名:', fixedNames, '条');

  // Step 2: Import US table
  console.log('\n拉取 美国表...');
  const usRecords = await fetchAll('tbl36Rh2n10PLbVB', '美国');
  console.log('  获取', usRecords.length, '条');

  // Build dedup keys
  const existingKeys = new Set();
  cases.forEach(c => {
    const key = (c.school_name || '').toLowerCase() + '|' + (c.program_name || '').toLowerCase() + '|' + (c.applicant_background_school || '').toLowerCase() + '|' + (c.applicant_gpa || '');
    existingKeys.add(key);
  });

  let maxId = Math.max(...cases.map(c => c.id || 0));
  let added = 0, skipped = 0, skipUndergrad = 0;

  for (const r of usRecords) {
    const f = r.fields;
    // US table fields: 院校, 专业, 本科, 均分, 本科专业, 本科层次, 类型, 类型细分
    const type = f['类型'] || '';
    // Skip undergraduate applications
    if (type === '本科申请') { skipUndergrad++; continue; }

    const cnSchool = (f['院校'] || '').trim();
    if (!cnSchool) { skipped++; continue; }
    const enSchool = EXTRA_MAP[cnSchool] || cnSchool;

    const programName = (f['专业'] || '').trim();
    const bgSchool = (f['本科'] || '').trim();
    const gpa = (f['均分'] || '').toString().trim();
    const tier = (f['本科层次'] || '').trim();

    const key = enSchool.toLowerCase() + '|' + programName.toLowerCase() + '|' + bgSchool.toLowerCase() + '|' + gpa;
    if (existingKeys.has(key)) { skipped++; continue; }
    existingKeys.add(key);

    maxId++;
    cases.push({
      id: maxId,
      school_name: enSchool,
      program_name: programName,
      program_url: null,
      applicant_country: 'China',
      applicant_background_school: bgSchool,
      applicant_background_tier: tier || null,
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
      notes: 'Imported from Feishu 美国 table',
    });
    added++;
  }

  console.log('\n美国表导入结果:');
  console.log('  新增:', added, '条');
  console.log('  跳过（重复/空）:', skipped, '条');
  console.log('  跳过（本科申请）:', skipUndergrad, '条');
  console.log('  最终总计:', cases.length, '条');

  fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
  console.log('\ncases.json 已保存');
}

run().catch(e => console.error(e.message || e));
