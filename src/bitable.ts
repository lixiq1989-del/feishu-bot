import { client } from './client';

/** 获取多维表格所有记录 */
export async function getRecords(appToken: string, tableId: string) {
  const records: any[] = [];
  let pageToken: string | undefined;

  do {
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: appToken, table_id: tableId },
      params: { page_size: 100, page_token: pageToken },
    });
    records.push(...(res.data?.items ?? []));
    pageToken = res.data?.page_token;
  } while (pageToken);

  return records;
}

/** 新增一条记录 */
export async function addRecord(appToken: string, tableId: string, fields: Record<string, any>) {
  return client.bitable.appTableRecord.create({
    path: { app_token: appToken, table_id: tableId },
    data: { fields },
  });
}

/** 批量新增记录（最多 500 条/次） */
export async function batchAddRecords(appToken: string, tableId: string, rows: Record<string, any>[]) {
  return client.bitable.appTableRecord.batchCreate({
    path: { app_token: appToken, table_id: tableId },
    data: { records: rows.map(fields => ({ fields })) },
  });
}

/** 更新一条记录 */
export async function updateRecord(
  appToken: string,
  tableId: string,
  recordId: string,
  fields: Record<string, any>
) {
  return client.bitable.appTableRecord.update({
    path: { app_token: appToken, table_id: tableId, record_id: recordId },
    data: { fields },
  });
}

/** 删除一条记录 */
export async function deleteRecord(appToken: string, tableId: string, recordId: string) {
  return client.bitable.appTableRecord.delete({
    path: { app_token: appToken, table_id: tableId, record_id: recordId },
  });
}

/** 获取表格字段列表 */
export async function getFields(appToken: string, tableId: string) {
  return client.bitable.appTableField.list({
    path: { app_token: appToken, table_id: tableId },
  });
}
