import puppeteer from 'puppeteer-core';
import * as fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const cookie = fs.readFileSync(process.env.HOME + '/.xhs_cookie', 'utf-8').trim();

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');

  const cookies = cookie.split(';').map(c => {
    const [name, ...rest] = c.trim().split('=');
    return { name: name.trim(), value: rest.join('=').trim(), domain: '.xiaohongshu.com' };
  }).filter(c => c.name && c.value);
  await page.setCookie(...cookies);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // 拦截评论 API
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');

  const commentData: any[] = [];
  cdp.on('Network.responseReceived', async (event) => {
    const url = event.response.url;
    if (url.includes('comment/page') || url.includes('comment/sub')) {
      console.log('  [评论API] status=' + event.response.status);
      try {
        const body = await cdp.send('Network.getResponseBody', { requestId: event.requestId });
        const data = JSON.parse(body.body);
        if (data.data?.comments) {
          commentData.push(...data.data.comments);
          console.log('  拿到 ' + data.data.comments.length + ' 条评论!');
          data.data.comments.slice(0, 3).forEach((c: any, i: number) => {
            console.log('    ' + (i + 1) + '. ' + c.user_info?.nickname + ': ' + c.content?.substring(0, 60));
          });
        }
      } catch {}
    }
  });

  // 搜索页 -> 点击笔记
  console.log('打开搜索页...');
  await page.goto('https://www.xiaohongshu.com/search_result?keyword=%E7%A7%8B%E6%8B%9B%E6%B1%82%E8%81%8C&source=web_search_result_notes', {
    waitUntil: 'load',
    timeout: 60000,
  });
  await new Promise(r => setTimeout(r, 5000));

  // 点击第一个笔记
  const clicked = await page.evaluate(() => {
    const card = document.querySelector('section.note-item a.cover') as HTMLElement;
    if (card) { card.click(); return 'card'; }
    const link = document.querySelector('a[href*="/explore/"]') as HTMLElement;
    if (link) { link.click(); return 'link'; }
    return 'none';
  });
  console.log('点击:', clicked);

  // 等弹窗加载 + 评论
  await new Promise(r => setTimeout(r, 8000));
  console.log('评论数:', commentData.length);

  // 截图
  await page.screenshot({ path: '/tmp/xhs_click.png', fullPage: true });
  console.log('截图: /tmp/xhs_click.png');

  // 弹窗内滚动
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      document.querySelectorAll('[class*="scroll"], [class*="detail"], [class*="container"]').forEach(c => {
        (c as HTMLElement).scrollTop += 500;
      });
      window.scrollBy(0, 500);
    });
    await new Promise(r => setTimeout(r, 3000));
    console.log('滚动 ' + (i + 1) + ', 评论: ' + commentData.length);
  }

  console.log('\n总共: ' + commentData.length + ' 条评论');
  await browser.close();
}

main().catch(console.error);
