const { Client } = require('@larksuiteoapi/node-sdk');
const client = new Client({ appId: 'cli_a92832aa14b9dcef', appSecret: 'uSmMRMe4pWO9119iD3SVdh5044TsqVyX' });

const APP_TOKEN = 'TLG4bjbj1aPJTts80facSED3nAe';

async function run() {
  // List all tables
  const tablesRes = await client.bitable.appTable.list({
    path: { app_token: APP_TOKEN },
  });

  if (tablesRes.code !== 0) {
    console.log('Error:', tablesRes.msg, tablesRes.code);
    return;
  }

  const tables = tablesRes.data?.items || [];
  console.log('表格数量:', tables.length);
  console.log('');

  let totalRecords = 0;

  for (const table of tables) {
    // Get record count for each table
    const recordRes = await client.bitable.appTableRecord.list({
      path: { app_token: APP_TOKEN, table_id: table.table_id },
      params: { page_size: 1 },
    });

    const total = recordRes.data?.total || 0;
    totalRecords += total;
    console.log(`  ${table.name} (${table.table_id}): ${total} 条`);
  }

  console.log('\n总计:', totalRecords, '条');
}

run().catch(e => console.error(e.message || e));
