import * as fs from 'fs';
import * as https from 'https';

const SPACE_ID = '7615700879567506381';
const PARENT_NODE_TOKEN = 'Adh3w4XwCiMs2zkApVhcFdT0nFf';
const DOMAIN = 'open.feishu.cn';
const LINK_DOMAIN = 'hcn2vc1r2jus.feishu.cn';

function getToken(): string {
  const raw = fs.readFileSync('/Users/simon/startup-7steps/.feishu-user-token.json', 'utf-8');
  return JSON.parse(raw).access_token;
}

function api(method: string, path: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: DOMAIN,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function createPage(title: string, parentToken: string): Promise<string> {
  const res = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'doc',
    parent_node_token: parentToken,
    title,
  });
  const node_token = res.data?.node?.node_token;
  const obj_token = res.data?.node?.obj_token;
  console.log(`  node_token: ${node_token}`);
  console.log(`  obj_token: ${obj_token}`);
  return node_token;
}

async function main() {
  console.log('🚀 创建新知识库根节点...\n');

  // 创建根节点：真实搬运内容区
  const rootToken = await createPage('📦 真实素材区（WSO/Reddit/Levels.fyi搬运整理）', PARENT_NODE_TOKEN);
  console.log(`\n✅ 根节点创建成功`);
  console.log(`🔗 https://${LINK_DOMAIN}/wiki/${rootToken}`);
  console.log(`\n保存这个 node_token，后续所有搬运内容都挂在这个节点下：`);
  console.log(`PARENT_NODE_TOKEN = '${rootToken}'`);
}

main().catch(console.error);
