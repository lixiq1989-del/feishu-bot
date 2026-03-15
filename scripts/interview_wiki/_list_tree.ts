import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as os from 'os';

const TOKEN_FILE = path.join(os.homedir(), 'startup-7steps', '.feishu-user-token.json');
const USER_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).access_token;
const SPACE_ID = '7615113124324117443';

function api(method: string, urlPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: urlPath,
      method,
      headers: { 'Authorization': `Bearer ${USER_TOKEN}`, 'Content-Type': 'application/json' },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function listAll(parentToken: string, indent: string) {
  let pageToken = '';
  do {
    let url = `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes?page_size=50`;
    if (parentToken) url += `&parent_node_token=${parentToken}`;
    if (pageToken) url += `&page_token=${pageToken}`;
    const r = await api('GET', url);
    if (r.code !== 0) { console.error('Error:', r.msg); return; }
    for (const item of r.data?.items ?? []) {
      console.log(`${indent}${item.title} | node=${item.node_token} | obj=${item.obj_token}`);
      if (item.has_child) {
        await listAll(item.node_token, indent + '  ');
      }
    }
    pageToken = r.data?.has_more ? r.data.page_token : '';
  } while (pageToken);
}

listAll('', '').catch(console.error);
