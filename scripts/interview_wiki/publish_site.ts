/**
 * 通用网站内容发布脚本（按主题分栏目）
 * 用法: ts-node publish_site.ts <site_prefix> <site_display_name> [parent_node_token]
 * 例: ts-node publish_site.ts mc2 "Management Consulted（补充）"
 *     ts-node publish_site.ts igo "IGotAnOffer"
 *     ts-node publish_site.ts mcp "MConsultingPrep"
 */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
const { SocksProxyAgent } = require('socks-proxy-agent');
const SOCKS_AGENT = new SocksProxyAgent('socks5h://127.0.0.1:7897');

// ─── .env ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '..', '.env');
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

const APP_ID = process.env.FEISHU_APP_ID!;
const APP_SECRET = process.env.FEISHU_APP_SECRET!;
const TOKEN_FILE = path.resolve(__dirname, '..', '..', '..', 'startup-7steps', '.feishu-user-token.json');
const SPACE_ID = '7616033289844821185';
const ROOT_NODE = 'W1ohwQfKviDg3IkeV68c0N0bnyc';

let USER_TOKEN = '';

function apiOnce(method: string, apiPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'open.feishu.cn', path: apiPath, method,
      agent: SOCKS_AGENT,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': String(Buffer.byteLength(data)) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', (c: string) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function api(method: string, apiPath: string, body?: any): Promise<any> {
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      return await apiOnce(method, apiPath, body);
    } catch (e: any) {
      const isNetwork = e.message?.includes('socket disconnected') || e.message?.includes('ECONNRESET') || e.message?.includes('ETIMEDOUT');
      if (isNetwork && attempt < 3) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
}

// Upload image to Feishu drive and return file_token
function uploadImageFromBuffer(buf: Buffer, ext: string, fileName: string, parentToken: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
      const mimeTypes: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
      const mime = mimeTypes[ext] || 'image/jpeg';

      const parts: Buffer[] = [];
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file_name"\r\n\r\n${fileName}\r\n`));
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parent_type"\r\n\r\ndocx_image\r\n`));
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parent_node"\r\n\r\n${parentToken}\r\n`));
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${buf.length}\r\n`));
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mime}\r\n\r\n`));
      parts.push(buf);
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
      const body = Buffer.concat(parts);

      const req = https.request({
        hostname: 'open.feishu.cn',
        path: '/open-apis/drive/v1/medias/upload_all',
        method: 'POST',
        agent: SOCKS_AGENT,
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': String(body.length),
        },
        rejectUnauthorized: false,
      }, res => {
        let d = '';
        res.on('data', (c: string) => d += c);
        res.on('end', () => {
          try {
            const r = JSON.parse(d);
            if (r.code === 0 && r.data?.file_token) resolve(r.data.file_token);
            else resolve(null);
          } catch { resolve(null); }
        });
      });
      req.on('error', () => resolve(null));
      req.write(body);
      req.end();
    } catch { resolve(null); }
  });
}

// Download an image from URL to local path
function downloadImageToBuffer(url: string, depth = 0): Promise<{buf: Buffer, ext: string} | null> {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http') || depth > 3) { resolve(null); return; }
    const mod = url.startsWith('https') ? https : http;
    const timer = setTimeout(() => resolve(null), 20000);
    mod.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.google.com/' },
      rejectUnauthorized: false,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timer);
        downloadImageToBuffer(res.headers.location, depth + 1).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { clearTimeout(timer); resolve(null); return; }
      const ct = res.headers['content-type'] || '';
      const extMap: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
      const ext = extMap[ct.split(';')[0].trim()] || (url.match(/\.(png|jpg|jpeg|gif|webp)/i) || [])[1] || 'jpg';
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        clearTimeout(timer);
        const buf = Buffer.concat(chunks);
        if (buf.length > 500) resolve({ buf, ext });
        else resolve(null);
      });
    }).on('error', () => { clearTimeout(timer); resolve(null); });
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function refreshToken(silent = false) {
  const saved = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  const savedAt = new Date(saved.saved_at).getTime();
  const expiresAt = savedAt + (saved.expires_in - 300) * 1000;
  if (Date.now() < expiresAt) {
    if (!silent) console.log('✓ Token 有效');
    USER_TOKEN = saved.access_token;
    return;
  }
  console.log('⏳ 刷新 Token...');
  const appResp: any = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET });
    const req = https.request({
      hostname: 'open.feishu.cn', path: '/open-apis/auth/v3/app_access_token/internal', method: 'POST',
      agent: SOCKS_AGENT,
      headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)) },
      rejectUnauthorized: false,
    }, res => { let d = ''; res.on('data', (c: string) => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(body); req.end();
  });
  const appToken = appResp.app_access_token;
  if (!appToken) throw new Error(`app_access_token失败`);
  const refreshResp: any = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ grant_type: 'refresh_token', refresh_token: saved.refresh_token });
    const req = https.request({
      hostname: 'open.feishu.cn', path: '/open-apis/authen/v1/oidc/refresh_access_token', method: 'POST',
      agent: SOCKS_AGENT,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appToken}`, 'Content-Length': String(Buffer.byteLength(body)) },
      rejectUnauthorized: false,
    }, res => { let d = ''; res.on('data', (c: string) => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(body); req.end();
  });
  if (refreshResp.code !== 0) throw new Error(`刷新失败，请重新授权: cd ~/startup-7steps && NODE_TLS_REJECT_UNAUTHORIZED=0 node feishu-auth.js`);
  const result = { access_token: refreshResp.data.access_token, refresh_token: refreshResp.data.refresh_token, expires_in: refreshResp.data.expires_in, token_type: refreshResp.data.token_type, saved_at: new Date().toISOString() };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(result, null, 2));
  USER_TOKEN = result.access_token;
  console.log('✅ Token 刷新成功');
}

function parseInline(text: string) {
  // Feishu limits text_run content to 2000 chars
  const MAX = 1800;
  const elements: any[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const addEl = (content: string, style?: any) => {
      while (content.length > MAX) {
        const chunk = content.slice(0, MAX);
        content = content.slice(MAX);
        elements.push(style ? { text_run: { content: chunk, text_element_style: style } } : { text_run: { content: chunk } });
      }
      if (content) elements.push(style ? { text_run: { content, text_element_style: style } } : { text_run: { content } });
    };
    if (match[2]) addEl(match[2], { bold: true });
    else if (match[3]) addEl(match[3], { italic: true });
    else if (match[4]) addEl(match[4]);
  }
  if (!elements.length) elements.push({ text_run: { content: text.slice(0, MAX) } });
  return elements;
}

// Image placeholder in blocks - will be replaced with actual file_token after upload
interface ImagePlaceholder {
  blockIndex: number;
  imageUrl: string;
  localPath?: string;
}

function mdToBlocks(markdown: string): { blocks: any[], imagePlaceholders: ImagePlaceholder[] } {
  const blocks: any[] = [];
  const imagePlaceholders: ImagePlaceholder[] = [];

  for (const line of markdown.split('\n')) {
    if (!line.trim()) continue;

    // Check for image: ![alt](url)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      const imgUrl = imgMatch[2];
      // Skip relative URLs, tracking pixels and tiny icons
      if (!imgUrl.startsWith('http')) continue;
      if (imgUrl.includes('facebook.com') || imgUrl.includes('linkedin.com/collect') ||
          imgUrl.includes('doubleclick') || imgUrl.includes('google-analytics') ||
          imgUrl.includes('gravatar') || imgUrl.includes('data:image') ||
          imgUrl.includes('pixel') || imgUrl.includes('1x1')) continue;

      imagePlaceholders.push({ blockIndex: blocks.length, imageUrl: imgUrl });
      // Placeholder block - will be replaced
      blocks.push({ block_type: 27, image: { token: '__PLACEHOLDER__', width: 600, height: 400 } });
      continue;
    }

    const h1 = line.match(/^# (.+)$/);
    if (h1) { blocks.push({ block_type: 3, heading1: { elements: parseInline(h1[1]), style: {} } }); continue; }
    const h2 = line.match(/^## (.+)$/);
    if (h2) { blocks.push({ block_type: 4, heading2: { elements: parseInline(h2[1]), style: {} } }); continue; }
    const h3 = line.match(/^### (.+)$/);
    if (h3) { blocks.push({ block_type: 5, heading3: { elements: parseInline(h3[1]), style: {} } }); continue; }
    const h4 = line.match(/^#### (.+)$/);
    if (h4) { blocks.push({ block_type: 6, heading4: { elements: parseInline(h4[1]), style: {} } }); continue; }
    if (/^-{3,}$/.test(line.trim())) { blocks.push({ block_type: 22, divider: {} }); continue; }
    const bul = line.match(/^[-*] (.+)$/);
    if (bul) { blocks.push({ block_type: 12, bullet: { elements: parseInline(bul[1]), style: {} } }); continue; }
    const ord = line.match(/^\d+\. (.+)$/);
    if (ord) { blocks.push({ block_type: 13, ordered: { elements: parseInline(ord[1]), style: {} } }); continue; }
    // Split very long lines into multiple paragraph blocks (Feishu limit)
    if (line.length > 3600) {
      const words = line.split(' ');
      let chunk = '';
      for (const word of words) {
        if (chunk.length + word.length + 1 > 3600) {
          if (chunk) blocks.push({ block_type: 2, text: { elements: parseInline(chunk.trim()), style: {} } });
          chunk = word;
        } else {
          chunk += (chunk ? ' ' : '') + word;
        }
      }
      if (chunk) blocks.push({ block_type: 2, text: { elements: parseInline(chunk.trim()), style: {} } });
    } else {
      blocks.push({ block_type: 2, text: { elements: parseInline(line), style: {} } });
    }
  }
  return { blocks, imagePlaceholders };
}

async function createNode(title: string, parentToken: string) {
  const res = await api('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, {
    obj_type: 'docx', node_type: 'origin', parent_node_token: parentToken, title,
  });
  if (res.code !== 0) throw new Error(`创建失败 "${title}": ${res.code} ${res.msg}`);
  return { nodeToken: res.data.node.node_token, objToken: res.data.node.obj_token };
}

async function writeBlocks(objToken: string, blocks: any[]) {
  await sleep(400);
  const lr = await api('GET', `/open-apis/docx/v1/documents/${objToken}/blocks?page_size=5`);
  const rootId = lr.data?.items?.[0]?.block_id;
  if (!rootId) throw new Error('获取根block失败');
  let insertedCount = 0;
  for (let i = 0; i < blocks.length; i += 20) {
    const chunk = blocks.slice(i, i + 20);
    const wr = await api('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${rootId}/children`, { children: chunk, index: insertedCount });
    if (wr.code !== 0) {
      console.error(`  ⚠️ 写入失败 ${i}: ${wr.code} ${wr.msg}`);
    } else {
      insertedCount += chunk.length;
    }
    if (i + 20 < blocks.length) await sleep(300);
  }
}

// ─── 按 slug 关键词自动分类 ──────────────────────────────────────
interface CategoryRule {
  name: string;
  keywords: string[];
}

const CATEGORIES: CategoryRule[] = [
  { name: '🏢 McKinsey 面试',     keywords: ['mckinsey', 'pei', 'psg', 'solve', 'lilli', 'imbellus'] },
  { name: '🏢 BCG 面试',          keywords: ['bcg', 'casey', 'platinion', 'gamma'] },
  { name: '🏢 Bain 面试',         keywords: ['bain', 'hirevue', 'sova', 'meseekna'] },
  { name: '🏢 Deloitte 面试',     keywords: ['deloitte'] },
  { name: '🏢 其他咨询公司',      keywords: ['accenture', 'kearney', 'oliver-wyman', 'ey-parthenon', 'ey-', 'lek', 'pwc', 'kpmg', 'roland-berger', 'strategyand', 'alixpartners', 'simon-kucher', 'fti', 'capital-one', 'zs-associate', 'boutique'] },
  { name: '🧩 Case 框架与方法',   keywords: ['framework', 'profitability', 'market-entry', 'market-sizing', 'pricing', 'merger', 'acquisition', 'mece', 'issue-tree', 'porter', 'growth-strategy'] },
  { name: '📊 Case 数学',         keywords: ['math', 'mental-math', 'finance-concept', 'chart'] },
  { name: '📋 Case Interview 总论', keywords: ['case-interview', 'case-study', 'case-example', 'case-prep', 'case-tip', 'types-of-case', '6-types', 'written-case', 'group-case', 'phone-video', 'case-library', 'brain-teaser'] },
  { name: '🤝 Fit / Behavioral',  keywords: ['fit-interview', 'behavioral', 'star', 'culture-fit', 'why-consulting', 'why-mckinsey', 'why-bcg', 'why-bain', 'tell-me', 'questions-to-ask', 'consulting-interview-question'] },
  { name: '💡 思维方法论',         keywords: ['pyramid', 'storytelling', 'mece', 'what-is-mece'] },
  { name: '📄 简历与申请',        keywords: ['resume', 'cover-letter', 'networking', 'application-deadline', 'dress-code', 'how-to-get-into', 'target-school', 'gpa', 'phd', 'experienced-hire', 'internship', 'fellowship'] },
  { name: '📊 薪资与排名',        keywords: ['salary', 'consulting-firms', 'top-consulting', 'ranking', 'prestige', 'work-life', 'best-consulting'] },
  { name: '🏢 行业与职业发展',    keywords: ['career-path', 'exit-opportunit', 'what-do-consultant', 'what-is-management', 'consulting-vs', 'up-or-out', 'lifestyle', 'travel', 'management-consulting-what', 'operations-consulting', 'technology-consulting', 'non-profit', 'internal-corporate', 'mbb-really', 'top-3-vs-big-4', 'geography', 'industry', 'darkside', 'dating', 'day-in-life', 'quit'] },
  { name: '🧪 在线测评',          keywords: ['online-case', 'online-test', 'online-assessment', 'assessment', 'aptitude', 'psychometric', 'reasoning', 'personality', 'shl', 'pymetrics', 'cubiks', 'saville', 'birkman', 'korn-ferry', 'mercer', 'aon', 'wonderlic', 'predictive-index', 'game-based', 'cognitive', 'in-tray', 'verbal-reasoning', 'numerical', 'inductive', 'deductive', 'abstract', 'mechanical', 'spatial', 'diagrammatic', 'critical-thinking', 'situational', 'error-checking', 'watson-glaser', 'cappfinity', 'pearson', 'cut-e'] },
  { name: '🏭 企业测评（非咨询）', keywords: ['coca-cola', 'philip-morris', 'unilever', 'ibm', 'siemens', 'wells-fargo', 'bank-of-america', 'exxonmobil', 'honeywell', 'ubs', 'goldman', 'macquarie', 'barclays', 'deutsche-bank', 'jp-morgan', 'morgan-stanley', 'ford', 'airbus', 'anheuser', 'bmw', 'walmart', 'pg-assessment', 'amazon', 'google', 'facebook', 'why-amazon', 'why-facebook', 'why-google', 'product-manager', 'ibew', 'nhs'] },
];

function categorize(slug: string): string {
  const s = slug.toLowerCase();
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (s.includes(kw)) return cat.name;
    }
  }
  return '📁 其他';
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const prefix = process.argv[2];
  const siteName = process.argv[3];
  const parentNode = process.argv[4] || ROOT_NODE;

  if (!prefix || !siteName) {
    console.error('用法: ts-node publish_site.ts <prefix> <site_name> [parent_node]');
    process.exit(1);
  }

  await refreshToken();

  // Find all files with this prefix (.txt or .md)
  const allFiles = fs.readdirSync('/tmp')
    .filter(f => f.startsWith(`${prefix}_`) && (f.endsWith('.txt') || f.endsWith('.md')) && !f.includes('_imgs'))
    .map(f => `/tmp/${f}`)
    .sort();

  console.log(`\n找到 ${allFiles.length} 篇 ${siteName} 文章`);

  // Group by category
  const groups: Record<string, string[]> = {};
  for (const file of allFiles) {
    const slug = path.basename(file).replace(/\.(txt|md)$/, '').replace(`${prefix}_`, '');
    const cat = categorize(slug);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(file);
  }

  console.log('\n分类统计:');
  for (const [cat, files] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${cat}: ${files.length} 篇`);
  }

  // Create site folder
  const { nodeToken: siteNode } = await createNode(`📂 ${siteName}`, parentNode);
  console.log(`\n✓ 网站目录: ${siteNode}`);
  await sleep(500);

  // Create category folders and publish articles
  let totalSuccess = 0;
  const catEntries = Object.entries(groups).sort((a, b) => {
    // Sort categories in a logical order
    const order = CATEGORIES.map(c => c.name);
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  for (const [catName, files] of catEntries) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📂 ${catName} (${files.length} 篇)`);

    const { nodeToken: catNode } = await createNode(catName, siteNode);
    await sleep(400);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const slug = path.basename(file).replace(/\.(txt|md)$/, '').replace(`${prefix}_`, '');
      // Try to extract title from first line (# Title), fallback to slug
      const rawForTitle = fs.readFileSync(file, 'utf-8');
      const firstLine = rawForTitle.split('\n')[0];
      const title = firstLine.startsWith('# ') ? firstLine.slice(2).trim() : slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      console.log(`  [${i + 1}/${files.length}] ${title}`);
      // Refresh token before every article to prevent expiry during long image processing
      await refreshToken(true);

      let retries = 0;
      while (retries <= 3) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          const { blocks: allBlocks, imagePlaceholders } = mdToBlocks(raw);
          const blocks = allBlocks.slice(0, 500);
          if (blocks.length === 0) { console.log('  ⏭️ 空'); break; }

          const { objToken } = await createNode(title, catNode);

          // Upload images and replace placeholders (all in-memory, no disk write)
          let imgCount = 0;
          for (const ph of imagePlaceholders) {
            if (ph.blockIndex >= blocks.length) continue;
            // Download image into memory and upload directly (no disk write)
            const imgName = `${slug}_img${ph.blockIndex}`;
            const imgData = await downloadImageToBuffer(ph.imageUrl);
            if (imgData) {
              const fileToken = await uploadImageFromBuffer(imgData.buf, imgData.ext, `${imgName}.${imgData.ext}`, objToken);
              if (fileToken) {
                blocks[ph.blockIndex] = { block_type: 27, image: { token: fileToken, width: 600, height: 400 } };
                imgCount++;
              } else {
                blocks[ph.blockIndex] = { block_type: 2, text: { elements: [{ text_run: { content: ' ' } }], style: {} } };
              }
            } else {
              blocks[ph.blockIndex] = { block_type: 2, text: { elements: [{ text_run: { content: ' ' } }], style: {} } };
            }
            await sleep(200);
          }

          // Filter out placeholder blocks that weren't replaced
          const finalBlocks = blocks.filter((b: any) => !(b.block_type === 27 && b.image?.token === '__PLACEHOLDER__'));

          await writeBlocks(objToken, finalBlocks);
          totalSuccess++;
          console.log(`  ✅${imgCount > 0 ? ` (${imgCount} 图)` : ''}`);
          await sleep(400);
          break; // success
        } catch (e: any) {
          const isNetwork = e.message?.includes('socket disconnected') || e.message?.includes('ECONNRESET') || e.message?.includes('ETIMEDOUT');
          if (isNetwork && retries < 3) {
            retries++;
            console.warn(`  ⚡ 网络断开，重试 ${retries}/3...`);
            await sleep(3000 * retries);
          } else {
            console.error(`  ❌ ${e.message}`);
            break;
          }
        }
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ ${siteName}: ${totalSuccess}/${allFiles.length} 篇发布成功`);
  console.log(`📖 https://hcn2vc1r2jus.feishu.cn/wiki/${siteNode}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
