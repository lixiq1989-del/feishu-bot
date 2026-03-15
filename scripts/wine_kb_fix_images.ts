/**
 * 修复所有葡萄酒知识库页面的图片
 * 找到空 image block → 下载图片 → 上传 → PATCH block 写入 token
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_fix_images.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

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
      if (attempt < 4) { console.log(`    curl 重试 (${attempt + 1}/5)...`); execSync('sleep 3'); }
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

function uploadAndGetToken(token: string, blockId: string, imageBuffer: Buffer, fileName: string): string {
  const tmpFile = `/tmp/wine_fix_${Date.now()}.jpg`;
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

const SPACE_ID = '7615178195469421499';
const PARENT_NODE = 'LaBgw4iypixpaFkrX9dcyV5Undh';

// 每个 obj_token 对应的封面图 URL
const DOC_IMAGES: Record<string, string> = {
  // Homepage
  'XaEVdjuYkomGyfxdMPpcGQItnbe': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80',
  // 完全指南 (多张图)
  'YsMSdOIGsoHNCfxny8xcCRNPnTh': 'MULTI',
  // 子页面封面图
  'TKGSdhMq7o1gpSx38CcczMh1nkb': 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=80', // 新手入门
  'XE7VdCGjwodTanx6rSacBaZJnFh': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80', // 旧新世界
  'In0Qds0rYo8axexOwu5cJ93Znyd': 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=1200&q=80', // 中国最爱
  'TFFtdFTRLoCTeixRykZcA790nzc': 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=1200&q=80', // 送礼
  'LaTSd26akoTBRIxKX58cbFkinJb': 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=80', // 产区
  'YL7JdHp3roOVH3xAbuKcPeFLnXb': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200&q=80', // 中餐
  'GSbPdC7X0osl1nx6XZ9cMVpjnFg': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', // 西餐
  'RR7zdeajToAWBCxEvGNcnPNhnTe': 'https://images.unsplash.com/photo-1596142813630-40ddcaf14fbe?w=1200&q=80', // 品种
  'LDNhdEnhPoWkunx8snDcml4Pnpc': 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=1200&q=80', // 年份
  'EZPUdi0Wvo5oiOxOrqYcMcGenDf': 'https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?w=1200&q=80', // 酒具
};

// 完全指南的多张图对应关系
const MAIN_DOC_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80',   // cover
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80',   // basics
  'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=1200&q=80',   // red
  'https://images.unsplash.com/photo-1566995541428-f2246c17cda1?w=1200&q=80',   // white
  'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&q=80',      // sparkling
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=80',      // winery
  'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=1200&q=80',   // scene
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',   // pairing
  'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=1200&q=80',      // recommend
];

async function fixDocImages(token: string, docId: string, imageUrl: string | string[]) {
  // 获取所有 blocks
  let allBlocks: any[] = [];
  let pageToken = '';
  while (true) {
    const url = `/open-apis/docx/v1/documents/${docId}/blocks?page_size=200${pageToken ? '&page_token=' + pageToken : ''}`;
    const res = curlApi('GET', url, token);
    if (res.code !== 0) { console.log(`  获取blocks失败: ${res.msg}`); return; }
    allBlocks.push(...(res.data.items || []));
    if (!res.data.has_more) break;
    pageToken = res.data.page_token;
  }

  // 找出空 image blocks
  const emptyImgs = allBlocks.filter(b => b.block_type === 27 && !b.image?.token);
  if (emptyImgs.length === 0) {
    console.log('  没有空图片块');
    return;
  }
  console.log(`  找到 ${emptyImgs.length} 个空图片块`);

  const urls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];

  for (let i = 0; i < emptyImgs.length; i++) {
    const imgBlock = emptyImgs[i];
    const url = urls[i] || urls[0];
    const blockId = imgBlock.block_id;

    try {
      console.log(`  [${i + 1}/${emptyImgs.length}] 下载图片...`);
      const buf = await downloadImage(url);
      console.log(`    上传到 block ${blockId}...`);
      const fileToken = uploadAndGetToken(token, blockId, buf, `wine_fix_${i}.jpg`);
      console.log(`    file_token: ${fileToken}`);

      // PATCH image block: replace_image
      const patchRes = curlApi('PATCH',
        `/open-apis/docx/v1/documents/${docId}/blocks/${blockId}`,
        token,
        { replace_image: { token: fileToken } }
      );
      if (patchRes.code === 0) {
        console.log(`    PATCH ✓`);
      } else {
        console.log(`    PATCH 失败: ${patchRes.msg} (${patchRes.code})`);
        // 尝试另一种 PATCH 格式
        const patchRes2 = curlApi('PATCH',
          `/open-apis/docx/v1/documents/${docId}/blocks/${blockId}`,
          token,
          { replace_image: { token: fileToken } }
        );
        if (patchRes2.code === 0) {
          console.log(`    replace_image PATCH ✓`);
        } else {
          console.log(`    replace_image 也失败: ${patchRes2.msg}`);
        }
      }
    } catch (err: any) {
      console.log(`    失败: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

async function main() {
  console.log('🖼️ 修复葡萄酒知识库图片...\n');

  const userTokenFile = path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json');
  const tokenData = JSON.parse(fs.readFileSync(userTokenFile, 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) {
    console.error('Token 过期');
    return;
  }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  // 修复所有有图片的页面
  const pages = Object.entries(DOC_IMAGES).filter(([_, v]) => v !== 'MULTI');
  for (const [docId, imgUrl] of pages) {
    console.log(`\n=== ${docId} ===`);
    await fixDocImages(token, docId, imgUrl);
  }

  // 修复完全指南（多张图）
  console.log('\n=== 完全指南（多图）===');
  await fixDocImages(token, 'YsMSdOIGsoHNCfxny8xcCRNPnTh', MAIN_DOC_IMAGES);

  console.log('\n\n✅ 所有图片修复完成！');
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
