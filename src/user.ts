import { client } from './client';

/** 通过手机号获取用户信息 */
export async function getUserByMobile(mobile: string) {
  return client.contact.user.getByMobile({
    params: { mobile },
  });
}

/** 通过 open_id 获取用户信息 */
export async function getUserById(openId: string) {
  return client.contact.user.get({
    path: { user_id: openId },
    params: { user_id_type: 'open_id' },
  });
}

/** 获取部门成员列表 */
export async function getDeptUsers(departmentId: string) {
  return client.contact.user.findByDepartment({
    params: {
      department_id: departmentId,
      department_id_type: 'department_id',
      user_id_type: 'open_id',
    },
  });
}
