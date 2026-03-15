/**
 * 小红书评论批量抓取 → 飞书表格
 * 使用 Puppeteer + CDP 拦截，从搜索页点击笔记触发评论加载
 *
 * 用法：
 *   npm run xhs:comments -- --keyword "秋招求职,咨询求职,商科求职" --count 10 --cookie-file ~/.xhs_cookie
 *   npm run xhs:comments -- --url "链接1,链接2" --cookie-file ~/.xhs_cookie
 */

import puppeteer, { Page, CDPSession } from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';

// 加载 .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    const eq = line.indexOf('=');
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

import { client } from '../src/client';
import { batchAddRecords } from '../src/bitable';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

interface Comment {
  content: string;
  user_nickname: string;
  like_count: number;
  create_time: number;
  sub_comments: Comment[];
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    parsed[args[i].replace(/^--/, '')] = args[i + 1] || '';
  }
  return parsed;
}

function extractNoteId(url: string): string {
  const m = url.match(/([a-f0-9]{24})/);
  if (m) return m[1];
  throw new Error('无法提取 note_id: ' + url);
}

interface NoteCard {
  noteId: string;
  likes: number;
  title: string;
}

// ─── 搜索关键词 → 收集笔记卡片并按热度排序 ───
async function searchAndCollectCards(page: Page, keyword: string, count: number): Promise<string[]> {
  console.log(`\n搜索: "${keyword}" (目标 ${count} 篇热帖)...`);
  // sort=popular_descending 按最热排序
  await page.goto(
    `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes&sort=popular_descending`,
    { waitUntil: 'load', timeout: 60000 },
  );
  await sleep(5000);

  // 多滚动几次加载更多卡片（加载约 60+ 篇供筛选）
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 1200));
    await sleep(2000);
  }

  // 从 DOM 提取每个卡片的 noteId + 点赞数
  const cards: NoteCard[] = await page.evaluate(() => {
    const results: { noteId: string; likes: number; title: string }[] = [];
    const sections = document.querySelectorAll('section.note-item');
    for (const sec of Array.from(sections)) {
      // 提取 noteId
      const link = sec.querySelector('a[href*="/explore/"]') as HTMLAnchorElement;
      if (!link) continue;
      const m = link.href.match(/explore\/([a-f0-9]{24})/);
      if (!m) continue;
      const noteId = m[1];
      if (results.some(r => r.noteId === noteId)) continue;

      // 提取点赞数（卡片底部的数字）
      let likes = 0;
      // 尝试多种选择器找点赞数
      const likeEl = sec.querySelector('.like-wrapper .count')
        || sec.querySelector('[class*="like"] [class*="count"]')
        || sec.querySelector('.footer .like-wrapper span:last-child')
        || sec.querySelector('[class*="engag"] span')
        || sec.querySelector('.count');
      if (likeEl) {
        const text = (likeEl as HTMLElement).innerText?.trim() || '';
        if (text.includes('万')) {
          likes = parseFloat(text) * 10000;
        } else {
          likes = parseInt(text.replace(/[^\d]/g, '')) || 0;
        }
      }

      // 如果上面没拿到，尝试从 footer 区域的所有 span 中找数字
      if (likes === 0) {
        const footer = sec.querySelector('.footer, [class*="footer"], [class*="info"]');
        if (footer) {
          const spans = footer.querySelectorAll('span');
          for (const s of Array.from(spans)) {
            const t = (s as HTMLElement).innerText?.trim() || '';
            if (/^\d/.test(t)) {
              const n = t.includes('万') ? parseFloat(t) * 10000 : parseInt(t.replace(/[^\d]/g, ''));
              if (n > likes) likes = n;
            }
          }
        }
      }

      // 提取标题
      const titleEl = sec.querySelector('.title, [class*="title"], a.title span');
      const title = (titleEl as HTMLElement)?.innerText?.trim() || '';

      // 过滤掉营销/招人/带课帖子
      const spamKeywords = ['私信', '带你', '招人', '招募', '收费', '报名', '加我', '找我', '付费', '课程', '训练营', '辅导', '内推码'];
      if (spamKeywords.some(k => title.includes(k))) continue;

      results.push({ noteId, likes, title });
    }
    return results;
  });

  // 按点赞数降序排序
  cards.sort((a, b) => b.likes - a.likes);

  // 取前 count 篇
  const topCards = cards.slice(0, count);
  console.log(`  找到 ${cards.length} 篇笔记，过滤后按热度取前 ${topCards.length} 篇:`);
  topCards.forEach((c, i) => {
    console.log(`    ${i + 1}. [${c.likes}赞] ${c.title.substring(0, 40) || c.noteId}`);
  });

  return topCards.map(c => c.noteId);
}

// ─── 每次从搜索页新鲜加载，点击指定笔记拦截评论 API ───
// 每次调用都重新导航到搜索页，保证点击事件能触发评论加载
async function fetchNoteComments(
  page: Page,
  cdp: CDPSession,
  searchUrl: string,
  noteId: string,
): Promise<{ title: string; comments: Comment[] }> {
  const comments: Comment[] = [];
  let title = noteId.substring(0, 8);
  let hasMore = true;

  const responseHandler = async (event: any) => {
    const url: string = event.response.url;
    if (url.includes('comment/page') || url.includes('comment/sub')) {
      try {
        const body = await cdp.send('Network.getResponseBody', { requestId: event.requestId });
        const data = JSON.parse(body.body);
        if (data.data?.comments) {
          for (const c of data.data.comments) {
            comments.push({
              content: c.content || '',
              user_nickname: c.user_info?.nickname || '未知',
              like_count: parseInt(c.like_count) || 0,
              create_time: c.create_time || Math.floor(Date.now() / 1000),
              sub_comments: (c.sub_comments || []).map((s: any) => ({
                content: s.content || '',
                user_nickname: s.user_info?.nickname || '未知',
                like_count: parseInt(s.like_count) || 0,
                create_time: s.create_time || Math.floor(Date.now() / 1000),
                sub_comments: [],
              })),
            });
          }
          if (!data.data.has_more) hasMore = false;
        }
      } catch {}
    }
    if (url.includes('note_info') || url.includes('/feed')) {
      try {
        const body = await cdp.send('Network.getResponseBody', { requestId: event.requestId });
        const data = JSON.parse(body.body);
        const t = data.data?.items?.[0]?.note_card?.title
          || data.data?.title
          || data.data?.note?.title;
        if (t) title = t;
      } catch {}
    }
  };

  cdp.on('Network.responseReceived', responseHandler);

  // 每次重新导航搜索页，确保点击事件触发评论 API
  await page.goto(searchUrl, { waitUntil: 'load', timeout: 60000 });
  await sleep(4000);

  // 逐步滚动，找到目标卡片后用真实鼠标点击
  let bounds: { x: number; y: number } | null = null;
  for (let scroll = 0; scroll < 12 && !bounds; scroll++) {
    const result = await page.evaluate((targetId: string) => {
      const sections = document.querySelectorAll('section.note-item');
      const ids: string[] = [];
      for (const sec of Array.from(sections)) {
        const link = sec.querySelector('a[href*="/explore/"]') as HTMLAnchorElement;
        const m = link?.href.match(/explore\/([a-f0-9]{24})/);
        if (m) ids.push(m[1]);
        const cover = sec.querySelector('a.cover') as HTMLAnchorElement;
        if (cover && cover.href.includes(targetId)) {
          cover.scrollIntoView({ behavior: 'instant', block: 'center' });
          const rect = cover.getBoundingClientRect();
          if (rect.width > 0) {
            return { found: true, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: sections.length, ids };
          }
        }
      }
      return { found: false, x: 0, y: 0, count: sections.length, ids };
    }, noteId);
    if (result.found) {
      bounds = { x: result.x, y: result.y };
    } else {
      if (scroll === 0) console.log(`  页面有 ${result.count} 个卡片, 未匹配 ${noteId}`);
      await page.evaluate(() => window.scrollBy(0, 1200));
      await sleep(1200);
    }
  }

  if (!bounds) {
    console.log('  未找到卡片，跳过');
    cdp.off('Network.responseReceived', responseHandler);
    return { title, comments: [] };
  }

  // 用真实鼠标事件点击（触发 XHS 的 Vue 事件监听）
  await sleep(300);
  await page.mouse.click(bounds.x, bounds.y);

  // 等待弹窗加载 + 评论 API
  await sleep(8000);

  // 滚动评论区加载更多
  let scrolls = 0;
  let noNewCount = 0;
  while (hasMore && scrolls < 10 && noNewCount < 3) {
    const prevCount = comments.length;
    await page.evaluate(() => {
      const selectors = [
        '.note-scroller', '[class*="comment"]', '[class*="scroll"]', '[class*="detail"]',
      ];
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach(el => {
          (el as HTMLElement).scrollTop += 700;
        });
      }
      window.scrollBy(0, 700);
    });
    await sleep(3000 + Math.random() * 2000);
    if (comments.length === prevCount) noNewCount++;
    else noNewCount = 0;
    scrolls++;
  }

  cdp.off('Network.responseReceived', responseHandler);

  // 关闭弹窗
  const afterUrl = page.url();
  if (afterUrl.includes('/explore/' + noteId)) {
    await page.goBack({ waitUntil: 'load', timeout: 30000 }).catch(() => {});
  } else {
    await page.keyboard.press('Escape');
  }
  await sleep(1000);

  return { title, comments };
}

// ─── 创建飞书表格 ───
async function createBitable(name: string) {
  console.log('\n创建飞书表格...');
  const now = new Date().toLocaleDateString('zh-CN');
  const res = await client.bitable.app.create({
    data: { name: `XHS评论_${name.substring(0, 15)}_${now}` },
  });
  const appToken = res.data?.app?.app_token;
  if (!appToken) throw new Error('创建表格失败');

  const tables = await client.bitable.appTable.list({ path: { app_token: appToken } });
  const tableId = tables.data?.items?.[0]?.table_id;
  if (!tableId) throw new Error('获取表格ID失败');

  const fields = await client.bitable.appTableField.list({ path: { app_token: appToken, table_id: tableId } });
  const existing = fields.data?.items || [];

  if (existing[0]) {
    await client.bitable.appTableField.update({
      path: { app_token: appToken, table_id: tableId, field_id: existing[0].field_id! },
      data: { field_name: '关键词', type: 1 },
    });
  }

  for (const f of [
    { field_name: '笔记标题', type: 1 },
    { field_name: '笔记链接', type: 15 },
    { field_name: '用户昵称', type: 1 },
    { field_name: '评论内容', type: 1 },
    { field_name: '点赞数', type: 2 },
    { field_name: '类型', type: 3, ui_type: 'SingleSelect' as any },
    { field_name: '回复对象', type: 1 },
  ]) {
    await client.bitable.appTableField.create({
      path: { app_token: appToken, table_id: tableId },
      data: f as any,
    });
  }

  for (let i = 1; i < existing.length; i++) {
    try {
      await client.bitable.appTableField.delete({
        path: { app_token: appToken, table_id: tableId, field_id: existing[i].field_id! },
      });
    } catch {}
  }

  console.log('✓ 飞书表格: https://hcn2vc1r2jus.feishu.cn/base/' + appToken);
  return { appToken, tableId };
}

// ─── 写入飞书 ───
async function writeToFeishu(
  appToken: string, tableId: string,
  keyword: string, noteTitle: string, noteUrl: string, comments: Comment[],
) {
  const rows: Record<string, any>[] = [];
  for (const c of comments) {
    rows.push({
      '关键词': keyword,
      '笔记标题': noteTitle,
      '笔记链接': { link: noteUrl, text: noteTitle },
      '用户昵称': c.user_nickname,
      '评论内容': c.content,
      '点赞数': c.like_count,
      '类型': '主评论',
      '回复对象': '',
    });
    for (const sub of c.sub_comments) {
      rows.push({
        '关键词': keyword,
        '笔记标题': noteTitle,
        '笔记链接': { link: noteUrl, text: noteTitle },
        '用户昵称': sub.user_nickname,
        '评论内容': sub.content,
        '点赞数': sub.like_count,
        '类型': '回复',
        '回复对象': c.user_nickname,
      });
    }
  }
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    await batchAddRecords(appToken, tableId, rows.slice(i, i + batchSize));
  }
  return rows.length;
}

// ─── 主流程 ───
async function main() {
  const args = parseArgs();

  if (!args.keyword && !args.url && !args['url-file']) {
    console.log(`
小红书评论批量抓取 → 飞书表格

用法：
  npm run xhs:comments -- --keyword "秋招求职,咨询求职,商科求职" --count 10 --cookie-file ~/.xhs_cookie
  npm run xhs:comments -- --url "链接1,链接2" --cookie-file ~/.xhs_cookie
    `);
    return;
  }

  let cookie = args.cookie || '';
  if (args['cookie-file']) {
    cookie = fs.readFileSync(args['cookie-file'].replace('~', process.env.HOME || ''), 'utf-8').trim();
  }
  if (!cookie) { console.error('需要 --cookie 或 --cookie-file'); return; }

  const cookies = cookie.split(';').map(c => {
    const [name, ...rest] = c.trim().split('=');
    return { name: name.trim(), value: rest.join('=').trim(), domain: '.xiaohongshu.com' };
  }).filter(c => c.name && c.value);

  const countPerKw = parseInt(args.count || '10');
  const keywords = args.keyword ? args.keyword.split(',').map(k => k.trim()).filter(Boolean) : [];

  // 先创建飞书表格（在浏览器启动前，避免资源竞争导致连接失败）
  let appToken = '', tableId = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const tableName = keywords.join('+') || 'custom';
      ({ appToken, tableId } = await createBitable(tableName));
      break;
    } catch (e: any) {
      if (attempt === 3) throw e;
      console.log(`  飞书表格创建失败，5s 后重试 (${attempt}/3)...`);
      await sleep(5000);
    }
  }

  console.log('启动浏览器...');
  const headless = args.headless !== 'false';
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: headless,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');
  await page.setCookie(...cookies);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');

  try {
    // 先访问首页热身（模拟正常用户行为，避免触发反爬验证）
    console.log('热身访问首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'load', timeout: 60000 });
    await sleep(4000);
    // 随机滚动几次
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 300 + Math.random() * 400));
      await sleep(1500);
    }
    await sleep(3000);

    let totalComments = 0;
    let totalNotes = 0;

    // 按关键词逐个处理
    for (const keyword of keywords) {
      // 搜索并收集笔记 ID
      const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes&sort=popular_descending`;
      const noteIds = await searchAndCollectCards(page, keyword, countPerKw);

      // 逐个重新导航搜索页点击笔记抓评论
      const topNotes = noteIds.slice(0, countPerKw);
      for (let i = 0; i < topNotes.length; i++) {
        const noteId = topNotes[i];
        totalNotes++;
        console.log(`\n[${keyword}] ${i + 1}/${topNotes.length} - ${noteId}`);

        try {
          const { title, comments } = await fetchNoteComments(page, cdp, searchUrl, noteId);
          const mainCount = comments.length;
          const subCount = comments.reduce((sum, c) => sum + c.sub_comments.length, 0);
          console.log(`  "${title}" - ${mainCount} 主评论 + ${subCount} 回复`);

          if (mainCount > 0) {
            const noteUrl = `https://www.xiaohongshu.com/explore/${noteId}`;
            const rowCount = await writeToFeishu(appToken, tableId, keyword, title, noteUrl, comments);
            totalComments += rowCount;
            console.log(`  ✓ 写入 ${rowCount} 条`);
          }
        } catch (e: any) {
          console.error(`  ✗ ${e.message}`);
        }

        // 笔记间休息（搜索页重载已有等待，再加 3-6s）
        if (i < topNotes.length - 1) {
          const wait = 3 + Math.random() * 3;
          console.log(`  休息 ${wait.toFixed(0)}s...`);
          await sleep(wait * 1000);
        }
      }

      // 关键词间休息（随机 20-35s，降低被限速风险）
      if (keywords.indexOf(keyword) < keywords.length - 1) {
        const kwWait = 20 + Math.random() * 15;
        console.log(`\n关键词切换，休息 ${kwWait.toFixed(0)}s...`);
        await sleep(kwWait * 1000);
      }
    }

    // 处理直接指定的 URL
    if (args.url) {
      const urls = args.url.split(',').map(u => u.trim()).filter(Boolean);
      for (let i = 0; i < urls.length; i++) {
        try {
          const noteId = extractNoteId(urls[i]);
          totalNotes++;
          console.log(`\n[url] ${i + 1}/${urls.length} - ${noteId}`);
          // 对于直接 URL，先导航到首页再跳转到搜索页触发评论
          const urlSearchPage = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent('求职')}&source=web_search_result_notes&sort=popular_descending`;
          const { title, comments } = await fetchNoteComments(page, cdp, urlSearchPage, noteId);
          const mainCount = comments.length;
          const subCount = comments.reduce((sum, c) => sum + c.sub_comments.length, 0);
          console.log(`  "${title}" - ${mainCount} 主评论 + ${subCount} 回复`);
          if (mainCount > 0) {
            const rowCount = await writeToFeishu(appToken, tableId, 'custom', title, urls[i], comments);
            totalComments += rowCount;
            console.log(`  ✓ 写入 ${rowCount} 条`);
          }
        } catch (e: any) {
          console.error(`  ✗ ${e.message}`);
        }
        if (i < urls.length - 1) await sleep(10000 + Math.random() * 5000);
      }
    }

    console.log('\n' + '─'.repeat(40));
    console.log(`完成! ${totalNotes} 篇笔记, ${totalComments} 条评论`);
    console.log(`飞书表格: https://hcn2vc1r2jus.feishu.cn/base/${appToken}`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
