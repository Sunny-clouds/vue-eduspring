import request from './request'

// 用户管理相关接口封装，保持与后端路径一一对应。
export const adminApi = {
  // 分页查询所有用户（别名）
  getUsers(pageNum = 1, pageSize = 10) {
    return request.get('/admin/selUser', { params: { pageNum, pageSize } })
  },

  // 根据id删除用户
  deleteById(id) {
    return request.delete(`/admin/delById/${id}`)
  },

  // 根据昵称查询用户
  getByNickName(nickname) {
    return request.get('/admin/getByNickName', { params: { nickname } })
  },

  // 设置用户身份（角色）
  setRole(id, role) {
    return request.put(`/admin/setRole/${id}/${role}`)
  },

  // 设置账号状态
  setStatus(id, status) {
    // status: 1=启用, 0=禁用
    return request.put(`/admin/setStatus/${id}/${status}`)
  }
}
