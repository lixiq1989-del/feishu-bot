import { client } from './client';

/** 获取文档基本信息 */
export async function getDocInfo(documentId: string) {
  return client.docx.document.get({
    path: { document_id: documentId },
  });
}

/** 获取文档所有块内容 */
export async function getDocBlocks(documentId: string) {
  const blocks: any[] = [];
  let pageToken: string | undefined;

  do {
    const res = await client.docx.documentBlock.list({
      path: { document_id: documentId },
      params: { page_size: 200, page_token: pageToken },
    });
    blocks.push(...(res.data?.items ?? []));
    pageToken = res.data?.page_token;
  } while (pageToken);

  return blocks;
}

/** 创建新文档 */
export async function createDoc(title: string, folderToken?: string) {
  return client.docx.document.create({
    data: {
      title,
      folder_token: folderToken,
    },
  });
}
