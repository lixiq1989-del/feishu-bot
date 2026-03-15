import puppeteer from 'puppeteer-core';
import * as fs from 'fs';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
async function main() {
  const cookie = fs.readFileSync(process.env.HOME + '/.xhs_cookie', 'utf-8').trim();
  const cookies = cookie.split(';').map(c => {
    const [name, ...rest] = c.trim().split('=');
    return { name: name.trim(), value: rest.join('=').trim(), domain: '.xiaohongshu.com' };
  }).filter((c: any) => c.name && c.value);
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setCookie(...cookies);
  await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  await page.goto('https://www.xiaohongshu.com/search_result?keyword=%E6%B1%82%E8%81%8C%E5%BF%83%E6%80%81&source=web_search_result_notes&sort=popular_descending', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const url = page.url();
  console.log('Final URL:', url);
  console.log('Is captcha:', url.includes('captcha'));
  await browser.close();
}
main().catch(console.error);
