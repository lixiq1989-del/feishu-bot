// 飞书 Docx Block 工厂函数

export type TextStyle = { bold?: boolean; italic?: boolean; inline_code?: boolean };

export function textElement(content: string, style?: TextStyle) {
  return { text_run: { content, text_element_style: style ?? {} } };
}
export function boldElement(content: string) {
  return textElement(content, { bold: true });
}
export function paragraph(...elements: any[]) {
  return { block_type: 2, text: { elements, style: {} } };
}
export function h1(text: string) {
  return { block_type: 3, heading1: { elements: [textElement(text)], style: {} } };
}
export function h2(text: string) {
  return { block_type: 4, heading2: { elements: [textElement(text)], style: {} } };
}
export function h3(text: string) {
  return { block_type: 5, heading3: { elements: [textElement(text)], style: {} } };
}
export function bullet(...elements: any[]) {
  return { block_type: 12, bullet: { elements, style: {} } };
}
export function ordered(...elements: any[]) {
  return { block_type: 13, ordered: { elements, style: {} } };
}
export function divider() {
  return { block_type: 22, divider: {} };
}
export function quote(...elements: any[]) {
  return { block_type: 15, quote: { elements, style: {} } };
}

export type Page = {
  title: string;
  parent?: string;
  blocks: any[];
};
