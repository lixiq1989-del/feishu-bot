import puppeteer from 'puppeteer-core';
import * as fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const NOTE_ID = '65f110140000000012031397'; // from商科求职 results

async function main() {
  const cookie = fs.readFileSync(process.env.HOME + '/.xhs_cookie', 'utf-8').trim();
  const cookies = cookie.split(';').map(c => {
    const [name, ...rest] = c.trim().split('=');
    return { name: name.trim(), value: rest.join('=').trim(), domain: '.xiaohongshu.com' };
  }).filter(c => c.name && c.value);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
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

  const apiCalls: string[] = [];
  cdp.on('Network.responseReceived', (event) => {
    const url = event.response.url;
    if (url.includes('xiaohongshu.com') || url.includes('edith.')) {
      apiCalls.push(url);
    }
  });

  console.log('Navigating to note...');
  await page.goto(`https://www.xiaohongshu.com/explore/${NOTE_ID}`, { waitUntil: 'load', timeout: 60000 });
  
  // Wait and scroll
  await new Promise(r => setTimeout(r, 5000));
  
  // Scroll down to trigger comment loading
  await page.evaluate(() => {
    document.querySelectorAll('[class*="scroll"]').forEach(el => {
      (el as HTMLElement).scrollTop += 1000;
    });
    window.scrollBy(0, 1000);
  });
  
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== API calls ===');
  apiCalls.forEach(u => console.log(u));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/note_debug.png', fullPage: false });
  console.log('\nScreenshot saved to /tmp/note_debug.png');
  
  await browser.close();
}

main().catch(console.error);
