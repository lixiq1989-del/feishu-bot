/**
 * 内容加工台 — 本地网页工作台
 *
 * 用法：
 *   npm run web
 *   然后浏览器打开 http://localhost:4000
 *
 * 功能：
 *   - 点击「搜索今日内容」拉取5条优质链接
 *   - 点击「加工」调 AI 提炼核心观点 + 面试用法
 *   - 点击「存入知识库」保存到飞书 Bitable
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

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

import { runDailyCuration } from './daily_curation';
import { getTodayState, loadState, saveState } from '../src/curation_state';
import { processCurationItem } from '../src/curation_processor';
import { client } from '../src/client';

const PORT = 4000;

// ─── 路由处理 ──────────────────────────────────────────────────────

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // 静态 HTML
  if (method === 'GET' && (url === '/' || url === '/index.html')) {
    const htmlPath = path.resolve(__dirname, '..', 'src', 'web', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // API: 获取今日内容
  if (method === 'GET' && url === '/api/today') {
    const state = getTodayState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items: state?.items || [], date: state?.date || null }));
    return;
  }

  // API: 搜索今日内容
  if (method === 'POST' && url === '/api/search') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    try {
      // 用一个临时 chatId 占位（web 模式不推送到飞书）
      await runDailyCuration('__web__');
      const state = getTodayState();
      res.end(JSON.stringify({ ok: true, items: state?.items || [] }));
    } catch (err: any) {
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // API: 加工某一条
  if (method === 'POST' && url?.startsWith('/api/process/')) {
    const idx = parseInt(url.split('/').pop() || '0');
    const state = getTodayState();
    const item = state?.items.find(i => i.index === idx);

    if (!item) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '找不到该条目' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    try {
      const result = await processCurationItem(item);
      // 标记已加工
      item.processed = true;
      if (state) saveState(state);
      res.end(JSON.stringify({ ok: true, result }));
    } catch (err: any) {
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // API: 存入知识库
  if (method === 'POST' && url?.startsWith('/api/save/')) {
    const idx = parseInt(url.split('/').pop() || '0');
    const body = await readBody(req);
    let processedContent = '';
    try { processedContent = JSON.parse(body).content || ''; } catch {}

    const state = getTodayState();
    const item = state?.items.find(i => i.index === idx);

    res.writeHead(200, { 'Content-Type': 'application/json' });

    if (!item) {
      res.end(JSON.stringify({ ok: false, error: '找不到该条目' }));
      return;
    }

    try {
      const appToken = process.env.INSIGHT_APP_TOKEN;
      const tableId = process.env.INSIGHT_TABLE_ID;

      if (appToken && tableId) {
        await client.bitable.appTableRecord.create({
          path: { app_token: appToken, table_id: tableId },
          data: {
            fields: {
              '标题': item.title,
              '核心结论': processedContent.slice(0, 2000),
              '来源链接': item.url,
              '日期': Date.now(),
              '状态': '已存档',
            },
          },
        });
        item.savedToLibrary = true;
        if (state) saveState(state);
        res.end(JSON.stringify({ ok: true, message: '已存入飞书知识库' }));
      } else {
        // 无 Bitable 配置时存本地 JSON
        const localLibPath = path.resolve(__dirname, '..', 'knowledge_library.json');
        let lib: any[] = [];
        if (fs.existsSync(localLibPath)) {
          try { lib = JSON.parse(fs.readFileSync(localLibPath, 'utf-8')); } catch {}
        }
        lib.push({
          date: new Date().toISOString().slice(0, 10),
          title: item.title,
          category: item.category,
          url: item.url,
          content: processedContent,
        });
        fs.writeFileSync(localLibPath, JSON.stringify(lib, null, 2));
        item.savedToLibrary = true;
        if (state) saveState(state);
        res.end(JSON.stringify({ ok: true, message: '已存入本地知识库（knowledge_library.json）' }));
      }
    } catch (err: any) {
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
  });
}

// ─── 启动 ─────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (err: any) {
    console.error('[Web] 请求处理失败:', err.message);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`\n🖥️  内容加工台已启动`);
  console.log(`   打开浏览器访问: http://localhost:${PORT}`);
  console.log(`\n   功能说明：`);
  console.log(`   • 搜索今日内容 → Perplexity 实时搜索`);
  console.log(`   • 加工 → DeepSeek/Claude AI 提炼`);
  console.log(`   • 存入知识库 → ${process.env.INSIGHT_APP_TOKEN ? '飞书 Bitable' : '本地 knowledge_library.json'}\n`);

  // 自动打开浏览器
  const { exec } = require('child_process');
  exec(`open http://localhost:${PORT}`);
});
