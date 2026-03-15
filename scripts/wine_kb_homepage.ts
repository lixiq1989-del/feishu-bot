/**
 * 葡萄酒知识库 - 更新 Homepage 导航页
 * 删除默认模板内容，写入知识库目录导航
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_homepage.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// 加载 .env
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

function t(content: string, style?: any) { return { text_run: { content, text_element_style: style ?? {} } }; }
function b(content: string) { return t(content, { bold: true }); }
function it(content: string) { return t(content, { italic: true }); }
function link(content: string, nodeToken: string) {
  return { text_run: { content, text_element_style: { bold: true, link: { url: `https://hcn2vc1r2jus.feishu.cn/wiki/${nodeToken}` } } } };
}
function p(...elements: any[]) { return { block_type: 2, text: { elements, style: {} } }; }
function h1(text: string) { return { block_type: 3, heading1: { elements: [t(text)], style: {} } }; }
function h2(text: string) { return { block_type: 4, heading2: { elements: [t(text)], style: {} } }; }
function li(...elements: any[]) { return { block_type: 12, bullet: { elements, style: {} } }; }
function hr() { return { block_type: 22, divider: {} }; }
function quote(...elements: any[]) { return { block_type: 15, quote: { elements, style: {} } }; }
function img() { return { block_type: 27, image: {} }; }

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

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = (u: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : require('http');
      mod.get(u, { rejectUnauthorized: false }, (res: any) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location, redirects + 1);
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    get(url);
  });
}

function uploadImage(token: string, blockId: string, imageBuffer: Buffer, fileName: string): string {
  const tmpFile = `/tmp/wine_img_${Date.now()}.jpg`;
  fs.writeFileSync(tmpFile, imageBuffer);
  const result = execSync(
    `curl -sk --retry 5 --retry-delay 3 -X POST "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all" ` +
    `-H "Authorization: Bearer ${token}" ` +
    `-F "file_name=${fileName}" -F "parent_type=docx_image" -F "parent_node=${blockId}" ` +
    `-F "size=${imageBuffer.length}" -F "file=@${tmpFile};type=image/jpeg"`,
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 }
  );
  try { fs.unlinkSync(tmpFile); } catch {}
  const json = JSON.parse(result);
  if (json.code === 0) return json.data.file_token;
  throw new Error(json.msg || `Upload failed: code ${json.code}`);
}

// ─── Homepage 内容 ──────────────────────────────────────────────

const DOC_ID = 'XaEVdjuYkomGyfxdMPpcGQItnbe';

// 要删除的默认模板 block ids
const OLD_BLOCK_IDS = [
  'doxcnj4ai701CtnLbpqPOPu1iFK',
  'doxcnwiOEMCnvgJ6uWE19J8lW0g',
  'doxcnl9KEZJQ2cLcrYulNpaP0qf',
  'doxcnPLZAeBZOoJ0SgPSmbV3zXc',
  'doxcnHQuEP0chreT0RfA8O3opag',
  'doxcn4ciRc31NXAwADGokaZUnze',
  'doxcn11pm7c13PocuKAjhr5lcHe',
  'doxcnxncqK983lwX5bBpUIGTa1e',
  'doxcnREqVf7YThWxhyM9fQPYm6c',
];

const HOMEPAGE_BLOCKS = [
  // 封面图
  img(),

  // 标题和介绍
  p(t('')),
  quote(
    b('写给不懂酒但想喝好酒的你'),
    t('\n从零开始，帮你搞懂选酒、配酒、品酒、存酒的全部知识。'),
    t('\n不需要背产区、不需要考证，看完就能用。')
  ),
  p(t('')),
  hr(),

  // 📖 完全指南
  h1('📖 完全指南'),
  p(t('一篇文章覆盖所有核心知识，从基础概念到品鉴方法，适合系统学习。')),
  li(link('🍷 葡萄酒完全指南', 'BzK6w2p5BibAsbkmDNNcDDvMn8g'), t(' —— 基础知识 · 品种分类 · 名庄 · 品牌 · 场景配酒 · 食物搭配 · 畅销酒推荐 · 品鉴方法 · 年度榜单')),
  p(t('')),
  hr(),

  // 🔰 入门篇
  h1('🔰 入门篇'),
  p(t('刚接触葡萄酒？从这里开始。')),
  p(t('')),
  li(link('🔰 新手 3 分钟入门', 'MSYpwDSCXi6kVvkeiTacHQTXnLg'), t(' —— 看完就能去超市买酒，4 个问题搞定')),
  li(link('❌ 10 大常见误区', 'NcxXw2hkaiec4Bk11Wtc7EFjnAf'), t(' —— "挂杯越多越好"？"年份越老越好"？都是错的')),
  li(link('🏷️ 看懂酒标', 'B27zw2k5Gi2Dm0kVJWYcNbzgnPA'), t(' —— 5 秒读懂一瓶酒的身份证，法国/意大利/新世界酒标解读')),
  li(link('🛠️ 酒具选购指南', 'PfhLwKbpDiRsKvkpW3mcQrRYnMd'), t(' —— 杯子、开瓶器、醒酒器怎么选，新手 300 元搞定全套')),
  p(t('')),
  hr(),

  // 🍇 品种与产区
  h1('🍇 品种与产区'),
  p(t('了解品种和产区，是进阶的第一步。')),
  p(t('')),
  li(link('🍇 葡萄品种图鉴', 'FKjVw8QbXiZvxfkLsgVcFJTsnph'), t(' —— 18 个最常见品种详解，一句话记住每个品种的个性')),
  li(link('🌍 旧世界 vs 新世界', 'Y72vwob1kihKtZk38GrcyuTEnqe'), t(' —— 法国优雅 vs 澳洲奔放，风格差异一文搞懂')),
  li(link('🗺️ 全球产区地图', 'GvxCw7CYViEf4Gk0N8VcuDLtnYd'), t(' —— 法国/意大利/西班牙/美国/澳洲/南美/中国，各产区代表品种')),
  li(link('📅 年份速查表', 'JqdIweFFtia94xkzvfncW8Oanpe'), t(' —— 波尔多/勃艮第/纳帕/巴罗萨，哪些年该买哪些年别碰')),
  p(t('')),
  hr(),

  // 🍽️ 配酒指南
  h1('🍽️ 配酒指南'),
  p(t('吃什么配什么酒，什么场合喝什么酒。')),
  p(t('')),
  li(link('🥢 中餐配酒', 'JPyywf6gBiJmHbktwNLcVhT6nMc'), t(' —— 粤菜/川菜/鲁菜/江浙菜/烧烤/北京烤鸭，八大菜系详细配酒方案')),
  li(link('🍽️ 西餐配酒', 'KbpnwjfYRisDU3kniYOci2frnI7'), t(' —— 从前菜到甜点，牛排/海鲜/意面/奶酪，一顿完整西餐怎么配')),
  p(t('')),
  hr(),

  // 🛒 选酒实用
  h1('🛒 选酒实用'),
  p(t('买什么酒、送什么酒，看这里。')),
  p(t('')),
  li(link('🇨🇳 中国人最爱的 10 款酒', 'QcZgwnz2zixdGqkVbYccTowrnph'), t(' —— 基于电商销量和社交热度，最常买的 10 款酒详解')),
  li(link('🎁 送礼选酒指南', 'J8MNwzOW6iAmSEkbYyucwmGrntb'), t(' —— 送领导/父母/女友/朋友/乔迁，不同场合不同预算怎么选')),
  p(t('')),
  hr(),

  // 🏠 生活方式
  h1('🏠 生活方式'),
  p(t('让葡萄酒成为生活的一部分。')),
  p(t('')),
  li(link('🏠 在家如何存酒', 'LRmSw4LYEieooikR80hc3en9nZf'), t(' —— 不用酒柜也能存好酒，温度/避光/横放/湿度全解')),
  li(link('🫀 葡萄酒与健康', 'PUz5wYPjoiTq27kU0mJcOLwTnFe'), t(' —— "每天一杯红酒有益健康"是真的吗？科学怎么说')),
  li(link('🚀 如何开始品酒之旅', 'V8MxwWwBUi26ngkEYT5csnQXnPc'), t(' —— 从第一周到第三个月的进阶路线，推荐工具和购买渠道')),
  p(t('')),
  hr(),

  p(t('')),
  quote(
    b('葡萄酒最重要的规则只有一条 ——'),
    t('\n你喜欢喝的，就是好酒。'),
    t('\n不用在意别人的评价和打分，喝自己开心的酒，配自己爱吃的菜。'),
    t('\n\n干杯！🥂')
  ),
];

async function main() {
  console.log('🍷 更新 Homepage 导航页...\n');

  const userTokenFile = path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json');
  const tokenData = JSON.parse(fs.readFileSync(userTokenFile, 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) {
    console.error('Token 过期');
    return;
  }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  // 1. 删除现有内容（batch delete）
  console.log('清空现有内容...');
  const listRes = curlApi('GET', `/open-apis/docx/v1/documents/${DOC_ID}/blocks?page_size=50`, token);
  if (listRes.code === 0) {
    const childCount = listRes.data.items[0]?.children?.length ?? 0;
    if (childCount > 0) {
      const delRes = curlApi('DELETE', `/open-apis/docx/v1/documents/${DOC_ID}/blocks/${DOC_ID}/children/batch_delete`, token, {
        start_index: 0, end_index: childCount,
      });
      console.log(delRes.code === 0 ? `  删除 ${childCount} 个 blocks ✓` : `  删除失败: ${delRes.msg}`);
    } else {
      console.log('  已经是空的');
    }
  }

  // 2. 写入新内容
  console.log('\n写入导航内容...');
  const chunkSize = 30;
  let imageBlockId = '';
  for (let j = 0; j < HOMEPAGE_BLOCKS.length; j += chunkSize) {
    const chunk = HOMEPAGE_BLOCKS.slice(j, j + chunkSize);
    const res = curlApi('POST', `/open-apis/docx/v1/documents/${DOC_ID}/blocks/${DOC_ID}/children`, token, { children: chunk });
    if (res.code !== 0) {
      console.error(`  blocks ${j}-${j + chunk.length} 失败: ${res.msg}`);
    } else {
      console.log(`  blocks ${j + 1}-${j + chunk.length} ✓`);
      if (j === 0 && res.data?.children?.[0]) {
        imageBlockId = res.data.children[0].block_id;
      }
    }
    if (j + chunkSize < HOMEPAGE_BLOCKS.length) await new Promise(r => setTimeout(r, 300));
  }

  // 3. 上传封面图
  if (imageBlockId) {
    const coverUrl = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80';
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        console.log('\n上传封面图...');
        const buf = await downloadImage(coverUrl);
        uploadImage(token, imageBlockId, buf, 'wine_homepage_cover.jpg');
        console.log('封面图 ✓');
        break;
      } catch (err: any) {
        if (attempt < 4) { console.log(`  图片重试 (${attempt + 1}/5)`); await new Promise(r => setTimeout(r, 2000)); }
        else console.error(`  封面图失败: ${err.message}`);
      }
    }
  }

  console.log('\n✅ Homepage 更新完成！');
  console.log('https://hcn2vc1r2jus.feishu.cn/wiki/LaBgw4iypixpaFkrX9dcyV5Undh');
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
