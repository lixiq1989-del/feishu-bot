/**
 * 每日精选状态管理
 * 存储当天推送的内容列表，供 bot 回复时查询
 */

import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = path.resolve(__dirname, '..', '.curation_state.json');

export interface CurationItem {
  index: number;       // 1-based
  title: string;
  summary: string;     // 一句话摘要
  url: string;
  category: string;    // interview / strategy / insight
  processed: boolean;  // 是否已加工
  savedToLibrary: boolean;
}

export interface CurationState {
  date: string;        // YYYY-MM-DD
  items: CurationItem[];
  chatId: string;
}

export function loadState(): CurationState | null {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state: CurationState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function getTodayState(): CurationState | null {
  const state = loadState();
  const today = new Date().toISOString().slice(0, 10);
  if (!state || state.date !== today) return null;
  return state;
}

export function markProcessed(index: number) {
  const state = loadState();
  if (!state) return;
  const item = state.items.find(i => i.index === index);
  if (item) {
    item.processed = true;
    saveState(state);
  }
}

export function markSaved(index: number) {
  const state = loadState();
  if (!state) return;
  const item = state.items.find(i => i.index === index);
  if (item) {
    item.savedToLibrary = true;
    saveState(state);
  }
}
