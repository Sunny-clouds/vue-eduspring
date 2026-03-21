import request from './request'

export const userApi = {
  // 用户登陆
  login(username, password) {
    return request.post('/user/login', {
      username,
      password
    })
  },

  // 用户注册
  register(data) {
    return request.post('/user/register', data)
  },

  // 修改用户信息
  updateProfile(data) {
    return request.put('/user/update', data)
  },

  // 修改密码
  setPassword(data) {
    return request.post('/user/setPassword', data)
  },

  // 获取所有老师列表
  getTeacherList() {
    return request.get('/user/teacherList')
  }
}
