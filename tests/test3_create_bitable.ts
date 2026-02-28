/**
 * 测试用例 3：新建多维表格 + 建字段 + 写入一条记录
 *
 * 准备工作：
 *   1. 开通权限：bitable:app（读写多维表格）
 *   2. 无需提前准备任何 ID，本脚本全自动：
 *      创建 App → 获取默认 Table → 添加字段 → 写入测试记录
 *
 * 注意：仅操作本脚本新建的表格，不会动你已有的任何文档/表格
 */

import { client } from '../src/client';

async function run() {
  console.log('--- 测试3：新建多维表格 ---');

  // 1. 创建多维表格 App
  const appRes = await (client.bitable as any).app.create({
    data: {
      name: `[测试表格] 新能源日报 ${new Date().toLocaleDateString('zh-CN')}`,
    },
  });

  if (appRes.code !== 0) {
    console.error('❌ 创建多维表格失败:', appRes.msg, '| code:', appRes.code);
    console.log('请确认已开通 bitable:app 权限');
    return;
  }

  const appToken = appRes.data?.app?.app_token!;
  console.log('✅ 多维表格创建成功');
  console.log('   app_token:', appToken);
  console.log(`   访问地址：https://open.feishu.cn/base/${appToken}`);

  // 2. 获取默认 Table（创建时自动生成一个）
  const tableListRes = await client.bitable.appTable.list({
    path: { app_token: appToken },
  });

  const tableId = tableListRes.data?.items?.[0]?.table_id!;
  console.log('   table_id:', tableId);

  // 3. 添加字段：日期、标题、要点（默认已有一个文本字段，追加其余字段）
  const fields: Array<{ field_name: string; type: number }> = [
    { field_name: '日期', type: 5 },    // 5 = 日期时间
    { field_name: '标题', type: 1 },    // 1 = 文本（主字段已有，追加这个作为副标题）
    { field_name: '要点', type: 1 },    // 1 = 文本
    { field_name: '来源', type: 1 },    // 1 = 文本
  ];

  for (const f of fields) {
    const fieldRes = await client.bitable.appTableField.create({
      path: { app_token: appToken, table_id: tableId },
      data: f,
    });
    if (fieldRes.code === 0) {
      console.log(`   ✅ 字段「${f.field_name}」创建成功`);
    } else {
      console.log(`   ⚠️  字段「${f.field_name}」: ${fieldRes.msg}`);
    }
  }

  // 4. 写入一条测试记录
  const now = Date.now();
  const recordRes = await client.bitable.appTableRecord.create({
    path: { app_token: appToken, table_id: tableId },
    data: {
      fields: {
        '日期': now,
        '标题': '新能源行业 API 接入测试',
        '要点': '✅ 飞书多维表格 Bitable API 接通，支持自动写入结构化数据',
        '来源': 'Claude Code + lark-mcp',
      },
    },
  });

  if (recordRes.code === 0) {
    console.log('✅ 测试记录写入成功，record_id:', recordRes.data?.record?.record_id);
    console.log('\n🎉 全部完成！后续可直接说：');
    console.log('   "把今日要点写入飞书表格" → 自动追加记录到指定 app_token 的表');
  } else {
    console.error('❌ 写入记录失败:', recordRes.msg, '| code:', recordRes.code);
  }

  console.log('\n--- 汇总 ---');
  console.log('app_token :', appToken);
  console.log('table_id  :', tableId);
}

run().catch(console.error);
