import { message, bitable, document, calendar, user } from './src/index';

async function main() {

  // ── 1. 发消息 ──────────────────────────────────────────
  // 发文本消息给用户（需要 open_id，从飞书后台或 contact API 获取）
  // await message.sendTextToUser('ou_xxxxxxxx', '你好！');

  // 发文本消息到群（chat_id 从群设置里拿）
  // await message.sendTextToChat('oc_xxxxxxxx', '大家好！');

  // 发富文本消息
  // await message.sendRichText('oc_xxxxxxxx', '日报标题', [
  //   ['今天完成了以下工作：'],
  //   ['1. 接入飞书 API'],
  //   ['2. 完成多维表格同步'],
  // ]);


  // ── 2. 多维表格 ────────────────────────────────────────
  // app_token 从多维表格 URL 里拿：https://xxx.feishu.cn/base/{app_token}/...
  // table_id  从表格设置里看，或者通过 API 列出

  // 读取所有记录
  // const records = await bitable.getRecords('bascnxxxxxxxx', 'tblxxxxxxxx');
  // console.log(records);

  // 新增一条记录
  // await bitable.addRecord('bascnxxxxxxxx', 'tblxxxxxxxx', {
  //   '姓名': '张三',
  //   '状态': '进行中',
  //   '日期': Date.now(),
  // });

  // 批量新增
  // await bitable.batchAddRecords('bascnxxxxxxxx', 'tblxxxxxxxx', [
  //   { '姓名': '李四', '状态': '待开始' },
  //   { '姓名': '王五', '状态': '已完成' },
  // ]);


  // ── 3. 文档 ────────────────────────────────────────────
  // document_id 从文档 URL 里拿：https://xxx.feishu.cn/docx/{document_id}

  // 读文档内容
  // const blocks = await document.getDocBlocks('doxcnxxxxxxxx');
  // console.log(blocks);

  // 创建新文档
  // const doc = await document.createDoc('我的新文档');
  // console.log(doc.data?.document?.document_id);


  // ── 4. 日历 ────────────────────────────────────────────
  // 获取主日历
  // const cals = await calendar.getPrimaryCalendar();
  // const calId = cals.data?.calendars?.[0]?.calendar?.calendar_id ?? '';

  // 创建日历事件（时间用 Unix 时间戳字符串）
  // const now = Math.floor(Date.now() / 1000);
  // await calendar.createEvent(
  //   calId,
  //   '团队周会',
  //   String(now + 3600),        // 1 小时后开始
  //   String(now + 5400),        // 1.5 小时后结束
  //   '本周进度同步'
  // );


  // ── 5. 用户信息 ────────────────────────────────────────
  // 通过手机号查 open_id
  // const u = await user.getUserByMobile('+8613800000000');
  // console.log(u.data?.user?.open_id);

}

main().catch(console.error);
