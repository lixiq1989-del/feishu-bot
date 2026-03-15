/**
 * 正确流程：Puppeteer截图 → 创建空图片block → 上传图片(parent=block_id) → PATCH设置token
 */
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as puppeteer from 'puppeteer-core';

const SPACE_ID = '7616257743401323741';
const PARENT_NODE_TOKEN = 'KTMBwTfgvigXFckqfW0c16hVnib';
const DOMAIN = 'open.feishu.cn';
const LINK_DOMAIN = 'hcn2vc1r2jus.feishu.cn';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function getToken(): string {
  const raw = fs.readFileSync('/Users/simon/startup-7steps/.feishu-user-token.json', 'utf-8');
  return JSON.parse(raw).access_token;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function api(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: DOMAIN, path: urlPath, method,
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Step 2: 上传图片，parent_node = 图片block的block_id
async function uploadImageToBlock(imgPath: string, imageBlockId: string): Promise<string> {
  const token = getToken();
  const imgData = fs.readFileSync(imgPath);
  const filename = path.basename(imgPath);
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

  const parts: Buffer[] = [];
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file_name"\r\n\r\n${filename}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parent_type"\r\n\r\ndocx_image\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parent_node"\r\n\r\n${imageBlockId}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${imgData.length}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`));
  parts.push(imgData);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      path: '/open-apis/drive/v1/medias/upload_all',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        const parsed = JSON.parse(raw);
        console.log('  upload response:', JSON.stringify(parsed).slice(0, 200));
        if (parsed.code === 0) resolve(parsed.data?.file_token);
        else reject(new Error(`Upload failed: ${parsed.code} ${parsed.msg}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🧪 测试正确的截图+插入流程...\n');

  // 0. 截图（复用已有截图）
  const screenshotPath = '/tmp/levels_google.png';
  if (!fs.existsSync(screenshotPath)) {
    console.log('📸 截图...');
    const browser = await (puppeteer as any).launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('https://www.levels.fyi/companies/google/salaries/software-engineer', {
      waitUntil: 'networkidle2', timeout: 30000,
    });
    await sleep(3000);
    await page.screenshot({ path: screenshotPath });
    await browser.close();
  }
  console.log(`  ✅ 截图存在: ${screenshotPath}`);

  // 1. 创建测试页面
  console.log('\n📄 创建测试页面...');
  const createRes = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', node_type: 'origin',
    parent_node_token: PARENT_NODE_TOKEN,
    title: '🧪 测试-图片插入V2',
  });
  const node_token = createRes.data?.node?.node_token;
  const obj_token = createRes.data?.node?.obj_token;
  console.log(`  obj_token: ${obj_token}`);

  // 2. 先插入空图片block，拿到 block_id
  console.log('\n📦 创建空图片block...');
  const emptyBlockRes = await api('POST', `/open-apis/docx/v1/documents/${obj_token}/blocks/${obj_token}/children`, {
    children: [{ block_type: 27, image: {} }],
    index: 0,
  });
  console.log('  response:', JSON.stringify(emptyBlockRes).slice(0, 300));
  const imageBlockId = emptyBlockRes.data?.children?.[0]?.block_id;
  console.log(`  image block_id: ${imageBlockId}`);

  if (!imageBlockId) {
    console.log('❌ 无法获取image block_id，退出');
    return;
  }

  // 3. 上传图片，parent_node = imageBlockId
  console.log('\n📤 上传图片...');
  const fileToken = await uploadImageToBlock(screenshotPath, imageBlockId);
  console.log(`  ✅ file_token: ${fileToken}`);

  // 4. PATCH 图片block，设置 token
  console.log('\n🔧 PATCH image block...');
  const patchRes = await api('PATCH', `/open-apis/docx/v1/documents/${obj_token}/blocks/${imageBlockId}`, {
    replace_image: { token: fileToken },
  });
  console.log('  patch response:', JSON.stringify(patchRes).slice(0, 200));

  console.log(`\n🔗 测试页面: https://${LINK_DOMAIN}/wiki/${node_token}`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
