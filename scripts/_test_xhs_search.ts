import * as https from 'https';
import * as fs from 'fs';

const cookie = fs.readFileSync(process.env.HOME + '/.xhs_cookie', 'utf-8').trim();

function fetchPage(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.xiaohongshu.com',
      path,
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // 先测试评论 API
  const testNoteId = '6997e6cb000000001a024170'; // 从推荐页拿到的
  console.log('=== 测试评论 API ===');
  const commentUrl = `https://edith.xiaohongshu.com/api/sns/web/v2/comment/page?note_id=${testNoteId}&cursor=&top_comment_id=&image_formats=jpg,webp,avif`;
  const commentRes = await new Promise<any>((resolve, reject) => {
    const req = https.request(commentUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        'Referer': 'https://www.xiaohongshu.com/',
        'Origin': 'https://www.xiaohongshu.com',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
  console.log('comment API code:', commentRes.code, 'msg:', commentRes.msg || '');
  if (commentRes.data?.comments) {
    console.log('评论数:', commentRes.data.comments.length);
    commentRes.data.comments.slice(0, 3).forEach((c: any, i: number) => {
      console.log(`  ${i + 1}. ${c.user_info?.nickname}: ${c.content?.substring(0, 50)}`);
    });
  } else {
    console.log('response:', JSON.stringify(commentRes).substring(0, 300));
  }

  console.log('\n=== 测试搜索页 SSR ===');
  const html = await fetchPage('/search_result/?keyword=%E7%A7%8B%E6%8B%9B%E6%B1%82%E8%81%8C&source=web_search_result_notes');
  console.log('html length:', html.length);

  const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
  if (!stateMatch) {
    console.log('no __INITIAL_STATE__');
    // 看看是否有其他 script 中的数据
    const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
    console.log('script tags:', scripts.length);
    console.log(html.substring(0, 1000));
    return;
  }

  const stateStr = stateMatch[1].replace(/undefined/g, 'null');
  const state = JSON.parse(stateStr);

  console.log('top keys:', Object.keys(state));

  // 重点看 search
  const search = state.search || {};
  console.log('\nsearch keys:', Object.keys(search));
  console.log('search.feeds type:', typeof search.feeds, Array.isArray(search.feeds) ? search.feeds.length : '');

  if (Array.isArray(search.feeds)) {
    search.feeds.slice(0, 10).forEach((item: any, i: number) => {
      const nc = item.note_card || item;
      const id = item.id || item.note_id || nc.note_id || 'N/A';
      const title = nc.display_title || nc.title || 'no title';
      const likes = nc.interact_info?.liked_count || nc.liked_count || '?';
      console.log(`${i + 1}. [${id}] ${title} (likes: ${likes})`);
    });
  } else if (search.feeds && typeof search.feeds === 'object') {
    console.log('search.feeds keys:', Object.keys(search.feeds).slice(0, 10));
    // 可能是 map
    const keys = Object.keys(search.feeds);
    keys.slice(0, 5).forEach(k => {
      const item = search.feeds[k];
      console.log(k, '->', typeof item, item?.note_card?.display_title || item?.display_title || '');
    });
  }

  // 也看 searchFeedsWrapper
  if (search.searchFeedsWrapper) {
    console.log('\nsearchFeedsWrapper:', typeof search.searchFeedsWrapper);
    if (typeof search.searchFeedsWrapper === 'object') {
      console.log('keys:', Object.keys(search.searchFeedsWrapper).slice(0, 10));
    }
  }

  // 深入探索结构
  for (const key of Object.keys(state)) {
    const val = state[key];
    if (typeof val === 'object' && val !== null) {
      const subkeys = Object.keys(val);
      console.log(`\n${key} (${subkeys.length} keys):`, subkeys.slice(0, 20).join(', '));

      // 找包含 note 的数据
      for (const sk of subkeys) {
        const sv = val[sk];
        if (Array.isArray(sv) && sv.length > 0 && typeof sv[0] === 'object') {
          const first = sv[0];
          const firstKeys = Object.keys(first);
          if (firstKeys.includes('note_card') || firstKeys.includes('id') || firstKeys.includes('note_id')) {
            console.log(`  -> ${sk} 是笔记数组，长度:`, sv.length);
            sv.slice(0, 5).forEach((item: any, i: number) => {
              const nc = item.note_card || item;
              console.log(`     ${i + 1}. ${nc.display_title || nc.title || 'no title'} | id: ${item.id || item.note_id || nc.note_id || 'N/A'}`);
              if (nc.interact_info) {
                console.log(`        likes: ${nc.interact_info.liked_count}, comments: ${nc.interact_info.comment_count}`);
              }
            });
          }
        }
      }
    }
  }
}

main().catch(console.error);
