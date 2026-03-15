// 飞书 Docx Block 工厂函数（知识库版）
export { t, b, p, h1, h2, h3, li, ol, hr, quote } from '../blocks';
export type { Page, TextStyle } from '../blocks';

/** 表格块（由 run_kb_pages.ts 的 writeContent 处理） */
export function tableBlock(headers: string[], rows: string[][]) {
  return { __table: true as const, headers, rows };
}
