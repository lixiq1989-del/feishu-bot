/**
 * 葡萄酒知识库 - 重组目录结构
 * 创建分类目录节点，把现有子页面移到对应目录下
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_reorganize.ts
 */

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

const { execSync } = require('child_process');

function curlApi(method: string, apiPath: string, token: string, body?: any): any {
  let cmd = `curl -sk --retry 3 --retry-delay 2 -X ${method} "https://open.feishu.cn${apiPath}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`;
  if (body) {
    const tmpFile = `/tmp/feishu_body_${Date.now()}.json`;
    fs.writeFileSync(tmpFile, JSON.stringify(body));
    cmd += ` -d @${tmpFile}`;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 });
      return JSON.parse(result);
    } catch (err: any) {
      if (attempt < 4) { console.log(`  curl 重试 (${attempt + 1}/5)...`); execSync('sleep 3'); }
      else throw err;
    }
  }
}

const SPACE_ID = '7615178195469421499';
const PARENT_NODE = 'LaBgw4iypixpaFkrX9dcyV5Undh';

// 现有子页面 node_token 映射
const NODES = {
  '完全指南': 'BzK6w2p5BibAsbkmDNNcDDvMn8g',
  '新手入门': 'MSYpwDSCXi6kVvkeiTacHQTXnLg',
  '旧新世界': 'Y72vwob1kihKtZk38GrcyuTEnqe',
  '中国最爱': 'QcZgwnz2zixdGqkVbYccTowrnph',
  '送礼': 'J8MNwzOW6iAmSEkbYyucwmGrntb',
  '存酒': 'LRmSw4LYEieooikR80hc3en9nZf',
  '误区': 'NcxXw2hkaiec4Bk11Wtc7EFjnAf',
  '酒标': 'B27zw2k5Gi2Dm0kVJWYcNbzgnPA',
  '产区': 'GvxCw7CYViEf4Gk0N8VcuDLtnYd',
  '健康': 'PUz5wYPjoiTq27kU0mJcOLwTnFe',
  '品酒之旅': 'V8MxwWwBUi26ngkEYT5csnQXnPc',
  '中餐': 'JPyywf6gBiJmHbktwNLcVhT6nMc',
  '西餐': 'KbpnwjfYRisDU3kniYOci2frnI7',
  '品种': 'FKjVw8QbXiZvxfkLsgVcFJTsnph',
  '年份': 'JqdIweFFtia94xkzvfncW8Oanpe',
  '酒具': 'PfhLwKbpDiRsKvkpW3mcQrRYnMd',
};

// 目录结构：先创建分类节点，再把子页面 move 进去
const CATEGORIES = [
  {
    title: '🔰 入门篇',
    children: ['新手入门', '误区', '酒标', '酒具'],
  },
  {
    title: '🍇 品种与产区',
    children: ['品种', '旧新世界', '产区', '年份'],
  },
  {
    title: '🍽️ 配酒指南',
    children: ['中餐', '西餐'],
  },
  {
    title: '🛒 选酒实用',
    children: ['中国最爱', '送礼'],
  },
  {
    title: '🏠 生活方式',
    children: ['存酒', '健康', '品酒之旅'],
  },
];

async function main() {
  console.log('🍷 重组知识库目录结构...\n');

  const userTokenFile = path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json');
  const tokenData = JSON.parse(fs.readFileSync(userTokenFile, 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) {
    console.error('Token 过期');
    return;
  }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  for (const cat of CATEGORIES) {
    console.log(`\n📁 创建目录: ${cat.title}`);

    // 创建目录节点
    const nodeRes = curlApi('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, token, {
      obj_type: 'docx', node_type: 'origin', parent_node_token: PARENT_NODE, title: cat.title,
    });
    if (nodeRes.code !== 0) {
      console.error(`  创建失败: ${nodeRes.msg} (${nodeRes.code})`);
      continue;
    }
    const catNodeToken = nodeRes.data.node.node_token;
    console.log(`  节点: ${catNodeToken}`);
    await new Promise(r => setTimeout(r, 300));

    // 移动子页面到该目录下
    for (const childKey of cat.children) {
      const childNodeToken = NODES[childKey as keyof typeof NODES];
      if (!childNodeToken) {
        console.error(`  找不到节点: ${childKey}`);
        continue;
      }
      console.log(`  移动: ${childKey} → ${cat.title}`);
      const moveRes = curlApi('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes/${childNodeToken}/move`, token, {
        target_parent_token: catNodeToken,
        target_space_id: SPACE_ID,
      });
      if (moveRes.code === 0) {
        console.log(`    ✓`);
      } else {
        console.error(`    ✗ ${moveRes.msg} (${moveRes.code})`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('\n\n✅ 目录重组完成！');
  console.log(`知识库首页：https://hcn2vc1r2jus.feishu.cn/wiki/${PARENT_NODE}`);
  console.log('\n最终结构：');
  console.log('Homepage');
  console.log('├── 📖 葡萄酒完全指南');
  for (const cat of CATEGORIES) {
    const isLast = cat === CATEGORIES[CATEGORIES.length - 1];
    console.log(`${isLast ? '└' : '├'}── ${cat.title}`);
    for (let i = 0; i < cat.children.length; i++) {
      const childIsLast = i === cat.children.length - 1;
      console.log(`${isLast ? ' ' : '│'}   ${childIsLast ? '└' : '├'}── ${cat.children[i]}`);
    }
  }
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
