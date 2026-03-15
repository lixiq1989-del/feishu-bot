const { Client } = require('@larksuiteoapi/node-sdk');
const client = new Client({ appId: 'cli_a92832aa14b9dcef', appSecret: 'uSmMRMe4pWO9119iD3SVdh5044TsqVyX' });

async function run() {
  // List root folder files
  const res = await client.drive.file.list({
    params: { folder_token: '', order_by: 'EditedTime', direction: 'DESC', page_size: 50 },
  });

  if (res.code !== 0) {
    console.log('Error:', res.msg, res.code);
    // Try search instead
    const searchRes = await client.drive.file.list({
      params: { page_size: 50 },
    });
    console.log('Search result:', JSON.stringify(searchRes.data, null, 2).slice(0, 2000));
    return;
  }

  const files = res.data?.files || [];
  console.log('找到', files.length, '个文件:');
  files.forEach(f => {
    console.log(`  [${f.type}] ${f.name} | token: ${f.token}`);
  });
}

run().catch(e => console.error(e.message || e));
