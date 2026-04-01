import request from './request'

// 学生选课接口封装。
export const studentCourseApi = {
  // 获取所有学生选课信息（分页）
  getAll(pageNum = 1, pageSize = 10) {
    return request.get('/studentCourse/getAll', { params: { pageNum, pageSize } })
  },

  // 根据学生姓名查询选课信息
  getByUserName(nickname) {
    // 同时携带 nickname / userName，兼容后端参数名差异。
    return request.get('/studentCourse/getByUserName', { params: { nickname, userName: nickname } })
  },

  // 根据选课 ID 删除选课信息
  deleteById(id) {
    return request.delete(`/studentCourse/delByUserName/${id}`)
  },

  // 添加选课信息
  save(data) {
    return request.post('/studentCourse/save', data)
  },

  // 修改选课进度
  update(data) {
    return request.put('/studentCourse/update', data)
  },

  // 根据课程 ID 查询该课程下选课学生
  getCourseById(id, pageNum = 1, pageSize = 10) {
    return request.get('/studentCourse/getCourseById', { params: { id, pageNum, pageSize } })
  },

  // 兼容旧调用命名
  searchByUserName(nickname) {
    return request.get('/studentCourse/getByUserName', { params: { nickname, userName: nickname } })
  },

  getAllSelections(pageNum = 1, pageSize = 10) {
    return request.get('/studentCourse/getAll', { params: { pageNum, pageSize } })
  },

  getSelectionsByUsername(nickname) {
    return request.get('/studentCourse/getByUserName', { params: { nickname, userName: nickname } })
  },

  getCoursesByStudentName(nickname) {
    return request.get('/studentCourse/getByUserName', { params: { nickname, userName: nickname } })
  },

  selectCourse(studentId, courseId) {
    return request.post('/studentCourse/save', { studentId, courseId })
  },

  dropCourse(id) {
    return request.delete(`/studentCourse/delByUserName/${id}`)
  },

  updateProgress(id, progress) {
    return request.put('/studentCourse/update', { id, progress })
  }
}
