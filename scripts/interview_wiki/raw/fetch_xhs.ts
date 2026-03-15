/**
 * 小红书咨询面试内容爬虫 v3
 *
 * 策略：连接用户 Chrome，拦截 XHS API 响应获取数据
 *
 * 步骤1：启动 Chrome（先关闭所有 Chrome 窗口）
 *   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *     --remote-debugging-port=9222 \
 *     --user-data-dir="$HOME/.xhs_chrome_profile" \
 *     https://www.xiaohongshu.com
 *
 * 步骤2：在 Chrome 中登录小红书后，运行此脚本
 *   cd ~/feishu-sdk
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 npx ts-node scripts/interview_wiki/raw/fetch_xhs.ts
 */

import { chromium, Page, CDPSession } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const DIR = path.resolve(__dirname, 'xhs');
const IMG_DIR = path.resolve(DIR, 'images');

const KEYWORDS = [
  '咨询面试',
  '咨询面试 case',
  '麦肯锡 面试经验',
  'BCG 面试',
  '贝恩 面试',
  'MBB 求职',
  'case interview',
  '咨询行为面试 behavioral',
  '咨询 框架 case',
  '管理咨询 面经',
  '咨询笔试',
  '咨询 简历',
];

const MAX_PER_KEYWORD = 20;

interface XhsNote {
  id: string;
  title: string;
  desc: string;
  author: string;
  likes: string;
  images: string[];
  tags: string[];
  keyword: string;
  type: string;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function rand(min: number, max: number) { return min + Math.random() * (max - min); }

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Referer': 'https://www.xiaohongshu.com/',
      },
      rejectUnauthorized: false,
    }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        downloadImage(res.headers.location, filepath).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { resolve(false); return; }
      const ws = fs.createWriteStream(filepath);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve(true); });
      ws.on('error', () => resolve(false));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(15000, () => { req.destroy(); resolve(false); });
  });
}

/**
 * 在页面上拦截 XHR/fetch 响应
 * 搜索页面的 API: /api/sns/web/v1/search/notes
 * 笔记详情 API: /api/sns/web/v1/feed
 */
async function setupNetworkCapture(page: Page) {
  const captured: { url: string; body: any }[] = [];

  // 用 CDP 拦截网络响应
  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');

  const pendingBodies: Map<string, any> = new Map();

  client.on('Network.responseReceived', (params: any) => {
    const url = params.response.url;
    if (url.includes('/api/sns/web/') && params.response.status === 200) {
      pendingBodies.set(params.requestId, url);
    }
  });

  client.on('Network.loadingFinished', async (params: any) => {
    const url = pendingBodies.get(params.requestId);
    if (!url) return;
    pendingBodies.delete(params.requestId);
    try {
      const result = await client.send('Network.getResponseBody', { requestId: params.requestId });
      const body = JSON.parse(result.body);
      captured.push({ url, body });
    } catch {}
  });

  return { captured, client };
}

function extractNotesFromSearchResponse(data: any): any[] {
  const notes: any[] = [];
  try {
    const items = data?.data?.items || data?.data?.notes || [];
    for (const item of items) {
      const note = item?.note_card || item?.note || item;
      if (note) {
        notes.push({
          id: note.note_id || note.id || item.id,
          title: note.display_title || note.title || '',
          desc: note.desc || '',
          type: note.type || item.model_type || '',
          user: note.user || {},
          interact_info: note.interact_info || {},
          image_list: note.image_list || note.imageList || [],
          tag_list: note.tag_list || note.tagList || [],
        });
      }
    }
  } catch {}
  return notes;
}

function extractNoteFromFeedResponse(data: any): any | null {
  try {
    const items = data?.data?.items || [];
    for (const item of items) {
      const note = item?.note_card || item;
      if (note) return note;
    }
  } catch {}
  return null;
}

async function main() {
  for (const d of [DIR, IMG_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }

  console.log('🚀 小红书咨询面试内容爬虫 v3');
  console.log(`   关键词: ${KEYWORDS.length} 个`);
  console.log(`   输出: ${DIR}\n`);

  // 连接 Chrome
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  } catch {
    console.error('❌ 无法连接 Chrome！请先启动：');
    console.error('  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\');
    console.error('    --remote-debugging-port=9222 \\');
    console.error('    --user-data-dir="$HOME/.xhs_chrome_profile" \\');
    console.error('    https://www.xiaohongshu.com');
    process.exit(1);
  }

  const context = browser.contexts()[0];
  const page = await context.newPage();

  // 设置网络拦截
  const { captured } = await setupNetworkCapture(page);

  // === 阶段1：搜索，收集笔记列表 ===
  const allNotes: Map<string, XhsNote> = new Map();

  for (const keyword of KEYWORDS) {
    console.log(`\n🔍 搜索: "${keyword}"`);
    captured.length = 0; // 清空

    const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch {}
    await sleep(5000);

    // 滚动加载更多内容
    for (let i = 0; i < 5; i++) {
      try { await page.evaluate(() => window.scrollBy(0, 800)); } catch {}
      await sleep(1500 + rand(500, 1500));
    }

    // 再等一下让 API 请求完成
    await sleep(2000);

    // 从拦截的 API 响应中提取笔记
    let found = 0;
    for (const cap of captured) {
      if (cap.url.includes('/search/notes') || cap.url.includes('/search/')) {
        const notes = extractNotesFromSearchResponse(cap.body);
        for (const n of notes) {
          if (!n.id || allNotes.has(n.id)) continue;
          if (found >= MAX_PER_KEYWORD) break;
          const images: string[] = [];
          for (const img of (n.image_list || [])) {
            const u = img.url_default || img.info_list?.[0]?.url || img.url || '';
            if (u) images.push(u);
          }
          const tags: string[] = [];
          for (const tag of (n.tag_list || [])) {
            if (tag.name) tags.push(`#${tag.name}`);
          }
          allNotes.set(n.id, {
            id: n.id,
            title: n.title || '',
            desc: n.desc || '',
            author: n.user?.nickname || n.user?.nick_name || '',
            likes: String(n.interact_info?.liked_count || n.interact_info?.likedCount || ''),
            images,
            tags,
            keyword,
            type: n.type || '',
          });
          found++;
        }
      }
    }

    console.log(`   捕获到 ${captured.length} 个API响应，提取 ${found} 篇笔记`);

    // 如果 API 拦截没结果，试试从渲染后的 DOM 提取
    if (found === 0) {
      try {
        const domNotes = await page.evaluate(() => {
          const results: any[] = [];
          // 尝试从页面上的笔记卡片提取
          document.querySelectorAll('section.note-item, [data-note-id]').forEach(el => {
            const noteId = el.getAttribute('data-note-id');
            const title = el.querySelector('[class*="title"]')?.textContent?.trim();
            if (noteId) results.push({ id: noteId, title: title || '' });
          });
          // 从链接提取
          if (results.length === 0) {
            document.querySelectorAll('a[href*="/explore/"]').forEach(a => {
              const href = (a as HTMLAnchorElement).href;
              const m = href.match(/\/explore\/([a-f0-9]{24})/);
              if (m) results.push({ id: m[1], title: a.textContent?.trim()?.slice(0, 100) || '' });
            });
          }
          return results;
        });
        for (const n of domNotes.slice(0, MAX_PER_KEYWORD)) {
          if (!allNotes.has(n.id)) {
            allNotes.set(n.id, {
              id: n.id, title: n.title, desc: '', author: '', likes: '',
              images: [], tags: [], keyword, type: '',
            });
            found++;
          }
        }
        if (found > 0) console.log(`   DOM 补充: +${found} 篇`);
      } catch {}
    }

    await sleep(rand(3000, 6000));
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📋 搜索阶段完成：共 ${allNotes.size} 篇笔记`);
  console.log(`${'═'.repeat(50)}\n`);

  // === 阶段2：逐个访问笔记详情页，获取完整内容和高清图片 ===
  const results: XhsNote[] = [];
  let idx = 0;

  for (const [noteId, note] of allNotes) {
    idx++;

    // 跳过已抓取的
    const jsonPath = path.join(DIR, `${noteId}.json`);
    if (fs.existsSync(jsonPath)) {
      console.log(`[${idx}/${allNotes.size}] ${noteId} ⏭️ 已存在`);
      try { results.push(JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))); } catch {}
      continue;
    }

    console.log(`[${idx}/${allNotes.size}] ${note.title?.slice(0, 40) || noteId}`);

    // 如果搜索阶段已经有完整内容（desc 非空），直接用
    if (note.desc && note.images.length > 0) {
      // 下载图片
      const localImgs = await downloadNoteImages(noteId, note.images);
      saveNote(note, localImgs);
      results.push(note);
      console.log(`   ✅ (缓存) ${note.desc.length}字 ${localImgs.length}图`);
      continue;
    }

    // 否则访问详情页获取完整数据
    captured.length = 0;
    try {
      await page.goto(`https://www.xiaohongshu.com/explore/${noteId}`, {
        waitUntil: 'domcontentloaded', timeout: 20000,
      });
    } catch {}
    await sleep(4000 + rand(1000, 3000));

    // 从 API 响应提取
    let enriched = false;
    for (const cap of captured) {
      if (cap.url.includes('/feed') || cap.url.includes('/note/')) {
        try {
          const items = cap.body?.data?.items || [];
          for (const item of items) {
            const n = item?.note_card || item;
            if (!n) continue;
            note.title = n.title || n.display_title || note.title;
            note.desc = n.desc || note.desc;
            note.author = n.user?.nickname || n.user?.nick_name || note.author;
            note.likes = String(n.interact_info?.liked_count || note.likes);
            if (n.image_list?.length) {
              note.images = [];
              for (const img of n.image_list) {
                const u = img.url_default || img.info_list?.[0]?.url || img.url || '';
                if (u) note.images.push(u);
              }
            }
            if (n.tag_list?.length) {
              note.tags = [];
              for (const tag of n.tag_list) {
                if (tag.name) note.tags.push(`#${tag.name}`);
              }
            }
            enriched = true;
            break;
          }
        } catch {}
      }
    }

    // 如果 API 没捕获到，从 DOM 提取
    if (!enriched) {
      try {
        const domData = await page.evaluate(() => {
          const title = document.querySelector('#detail-title')?.textContent?.trim()
            || document.querySelector('[class*="title"]')?.textContent?.trim() || '';
          const descEl = document.querySelector('#detail-desc');
          let desc = '';
          if (descEl) {
            desc = descEl.innerText || descEl.textContent || '';
          }
          const author = document.querySelector('.username')?.textContent?.trim()
            || document.querySelector('[class*="author"]')?.textContent?.trim() || '';

          // 图片：从轮播或图片容器
          const images: string[] = [];
          document.querySelectorAll('[class*="swiper"] img, [class*="carousel"] img, [class*="slide"] img, .note-image img').forEach(img => {
            const src = (img as HTMLImageElement).src || img.getAttribute('data-src') || '';
            if (src && src.includes('http') && !src.includes('avatar') && !images.includes(src)) {
              images.push(src);
            }
          });
          // 备用
          if (images.length === 0) {
            document.querySelectorAll('img[src*="xhscdn"], img[src*="sns-webpic"]').forEach(img => {
              const src = (img as HTMLImageElement).src;
              if (src && !src.includes('avatar') && !src.includes('emoji') && !images.includes(src)) {
                images.push(src);
              }
            });
          }

          const tags: string[] = [];
          document.querySelectorAll('a[href*="/page/topics/"]').forEach(a => {
            const t = a.textContent?.trim();
            if (t) tags.push(t.startsWith('#') ? t : `#${t}`);
          });

          return { title, desc, author, images, tags };
        });
        if (domData.title) note.title = domData.title;
        if (domData.desc) note.desc = domData.desc;
        if (domData.author) note.author = domData.author;
        if (domData.images.length > 0) note.images = domData.images;
        if (domData.tags.length > 0) note.tags = domData.tags;
        enriched = !!(domData.title || domData.desc);
      } catch (e: any) {
        console.log(`   ⚠️ DOM提取失败: ${e.message?.slice(0, 40)}`);
      }
    }

    if (!note.desc && !note.title) {
      console.log('   ⏭️ 无内容');
      continue;
    }

    // 下载图片
    const localImgs = await downloadNoteImages(noteId, note.images);
    saveNote(note, localImgs);
    results.push(note);
    console.log(`   ✅ "${note.title?.slice(0, 25)}" ${note.desc.length}字 ${localImgs.length}图`);

    await sleep(rand(2000, 5000));
  }

  // === 保存汇总 ===
  const summary = {
    scraped_at: new Date().toISOString(),
    keywords: KEYWORDS,
    total: results.length,
    notes: results.map(n => ({
      id: n.id, title: n.title, author: n.author, likes: n.likes,
      keyword: n.keyword, chars: n.desc.length, imgs: n.images.length,
      tags: n.tags,
    })),
  };
  fs.writeFileSync(path.join(DIR, '_summary.json'), JSON.stringify(summary, null, 2));

  // 合并 Markdown
  const grouped: Record<string, XhsNote[]> = {};
  for (const note of results) {
    (grouped[note.keyword] ??= []).push(note);
  }
  let allMd = `# 小红书 · 咨询面试内容合集\n\n`;
  allMd += `> 抓取: ${new Date().toLocaleString('zh-CN')} | 共 ${results.length} 篇\n\n---\n\n`;
  for (const [kw, notes] of Object.entries(grouped)) {
    allMd += `## 🔍 ${kw}\n\n`;
    for (const n of notes) {
      allMd += `### ${n.title}\n\n`;
      allMd += `> 👤 ${n.author} | ❤️ ${n.likes} | ${n.tags.join(' ')}\n\n`;
      allMd += n.desc + '\n\n---\n\n';
    }
  }
  fs.writeFileSync(path.join(DIR, '_all_notes.md'), allMd);

  // 生成为 publish_site.ts 可用的 txt 格式
  for (const note of results) {
    const slug = note.id;
    let txt = `# ${note.title}\n\n`;
    txt += `**作者:** ${note.author}  |  **点赞:** ${note.likes}\n\n`;
    if (note.tags.length) txt += `${note.tags.join(' ')}\n\n`;
    txt += '---\n\n';
    txt += note.desc + '\n';
    fs.writeFileSync(`/tmp/xhs_${slug}.txt`, txt);
  }

  await page.close();

  const imgCount = fs.readdirSync(IMG_DIR).filter(f => !f.startsWith('.')).length;
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🎉 完成！`);
  console.log(`   笔记: ${results.length} 篇`);
  console.log(`   图片: ${imgCount} 张 (${IMG_DIR})`);
  console.log(`   输出: ${DIR}`);
  console.log(`   汇总: ${path.join(DIR, '_all_notes.md')}`);
  console.log(`   发布: /tmp/xhs_*.txt (可用 publish_site.ts 发布到飞书)`);
  console.log(`${'═'.repeat(50)}`);
}

async function downloadNoteImages(noteId: string, imageUrls: string[]): Promise<string[]> {
  const local: string[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const imgUrl = imageUrls[i];
    const ext = imgUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg';
    const file = `${noteId}_${i}.${ext}`;
    const fpath = path.join(IMG_DIR, file);
    if (!fs.existsSync(fpath)) {
      const ok = await downloadImage(imgUrl, fpath);
      if (ok) local.push(`images/${file}`);
    } else {
      local.push(`images/${file}`);
    }
  }
  return local;
}

function saveNote(note: XhsNote, localImages: string[]) {
  // JSON
  fs.writeFileSync(path.join(DIR, `${note.id}.json`), JSON.stringify(note, null, 2));
  // Markdown
  let md = `# ${note.title}\n\n`;
  md += `> 作者: ${note.author} | 点赞: ${note.likes}\n`;
  md += `> 来源: https://www.xiaohongshu.com/explore/${note.id}\n`;
  md += `> 搜索词: ${note.keyword}\n`;
  if (note.tags.length) md += `> 标签: ${note.tags.join(' ')}\n`;
  md += `\n---\n\n${note.desc}\n`;
  if (localImages.length) {
    md += '\n---\n\n## 图片\n\n';
    for (const img of localImages) md += `![](${img})\n\n`;
  }
  fs.writeFileSync(path.join(DIR, `${note.id}.md`), md);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
