import { client } from './client';

/** 获取主日历 ID */
export async function getPrimaryCalendar() {
  return client.calendar.calendar.primary({});
}

/** 获取日历事件列表 */
export async function listEvents(calendarId: string, startTime: string, endTime: string) {
  return client.calendar.calendarEvent.list({
    path: { calendar_id: calendarId },
    params: {
      start_time: startTime,  // unix 时间戳字符串，如 "1700000000"
      end_time: endTime,
      page_size: 50,
    },
  });
}

/** 创建日历事件 */
export async function createEvent(
  calendarId: string,
  summary: string,
  startTime: string,
  endTime: string,
  description?: string
) {
  return client.calendar.calendarEvent.create({
    path: { calendar_id: calendarId },
    data: {
      summary,
      description,
      start_time: { timestamp: startTime },
      end_time: { timestamp: endTime },
    },
  });
}

/** 删除日历事件 */
export async function deleteEvent(calendarId: string, eventId: string) {
  return client.calendar.calendarEvent.delete({
    path: { calendar_id: calendarId, event_id: eventId },
  });
}
