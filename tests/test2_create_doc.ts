/**
 * 测试用例 2：新建飞书文档并写入内容
 */

import { client } from '../src/client';

async function run() {
  console.log('--- 测试2：新建飞书文档 ---');

  // 1. 创建文档
  const createRes = await client.docx.document.create({
    data: {
      title: `[测试文档] API 接入验证 ${new Date().toLocaleDateString('zh-CN')}`,
    },
  });

  if (createRes.code !== 0) {
    console.error('❌ 创建文档失败:', createRes.msg, '| code:', createRes.code);
    return;
  }

  const docId = createRes.data?.document?.document_id!;
  console.log('✅ 文档创建成功');
  console.log('   document_id:', docId);
  console.log(`   访问地址：https://open.feishu.cn/docx/${docId}`);

  // 2. 向文档根块追加两个段落（documentBlockChildren.create）
  const blockRes = await client.docx.documentBlockChildren.create({
    path: {
      document_id: docId,
      block_id: docId,  // 根块 ID 与 document_id 相同
    },
    params: { document_revision_id: -1 },
    data: {
      children: [
        {
          block_type: 2,
          text: {
            elements: [
              {
                text_run: {
                  content: '这是通过飞书 API 写入的测试内容。',
                },
              },
            ],
            style: {},
          },
        },
        {
          block_type: 2,
          text: {
            elements: [
              {
                text_run: {
                  content: `写入时间：${new Date().toLocaleString('zh-CN')}`,
                },
              },
            ],
            style: {},
          },
        },
      ],
      index: 0,
    },
  });

  if (blockRes.code === 0) {
    console.log('✅ 内容写入成功，块数:', blockRes.data?.children?.length);
  } else {
    console.error('❌ 写入内容失败:', blockRes.msg, '| code:', blockRes.code);
  }
}

run().catch(console.error);
