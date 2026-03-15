// 飞书 Docx Block 工厂函数
export type TextStyle = { bold?: boolean; italic?: boolean; inline_code?: boolean };
export function t(content: string, style?: TextStyle) {
  return { text_run: { content, text_element_style: style ?? {} } };
}
export function b(content: string) { return t(content, { bold: true }); }
export function p(...elements: any[]) {
  return { block_type: 2, text: { elements, style: {} } };
}
export function h1(text: string) {
  return { block_type: 3, heading1: { elements: [t(text)], style: {} } };
}
export function h2(text: string) {
  return { block_type: 4, heading2: { elements: [t(text)], style: {} } };
}
export function h3(text: string) {
  return { block_type: 5, heading3: { elements: [t(text)], style: {} } };
}
export function li(...elements: any[]) {
  return { block_type: 12, bullet: { elements, style: {} } };
}
export function ol(...elements: any[]) {
  return { block_type: 13, ordered: { elements, style: {} } };
}
export function hr() { return { block_type: 22, divider: {} }; }
export function quote(...elements: any[]) {
  return { block_type: 15, quote: { elements, style: {} } };
}
export type Page = { title: string; parent?: string; blocks: any[] };

/** 快捷生成一个项目介绍块（多个 bullet） */
export function programBlock(name: string, details: string[]) {
  return [
    h3(name),
    ...details.map(d => li(t(d))),
  ];
}
