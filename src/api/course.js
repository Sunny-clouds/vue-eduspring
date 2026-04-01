import request from './request'

// 课程与选课接口统一封装。
export const courseApi = {
  // ========== 课程相关 ==========

  // 获取所有课程（支持分页参数）
  getAll(pageNum = 1, pageSize = 10) {
    return request.get('/course/getAll', { params: { pageNum, pageSize } })
  },

  // 获取所有课程（不传分页）
  getAllCourses() {
    return request.get('/course/getAll')
  },

  // 根据课程名查询课程信息（支持分页）
  getByTitle(title, pageNum = 1, pageSize = 10) {
    // 标题查询仍走后端分页接口，避免前端全量过滤。
    return request.get('/course/getByTitle', { params: { title, pageNum, pageSize } })
  },

  // 添加课程
  save(data) {
    return request.post('/course/save', data)
  },

  // 修改课程信息
  updateCourse(data) {
    return request.put('/course/updateCourse', data)
  },

  // 删除课程
  delete(id) {
    return request.delete(`/course/del/${id}`)
  },

  // 根据教师 ID 查询课程
  getByTeaId(id) {
    return request.get(`/course/getByTeaId/${id}`)
  },

  // ========== 课程资源相关 ==========

  // 根据课程ID获取课程资源
  getCourseResourceById(courseId) {
    return request.get(`/courseResource/getCourseResourceById/${courseId}`)
  },

  // 上传课程资源（仅管理员/教师）
  saveCourseResource(data) {
    return request.post('/courseResource/save', data)
  },

  // 删除课程资源（仅管理员/教师）
  deleteCourseResource(id) {
    return request.delete(`/courseResource/del/${id}`)
  },

  // ========== 选课相关（调用studentCourse接口） ==========

  // 选课（依赖于studentCourse模块）
  selectCourse(studentId, courseId) {
    return request.post('/studentCourse/save', { studentId, courseId })
  },

  // 退课（依赖于studentCourse模块）
  dropCourse(id) {
    return request.delete(`/studentCourse/delByUserName/${id}`)
  },

  // 兼容旧调用命名
  getCourseByTitle(title, pageNum = 1, pageSize = 10) {
    return request.get('/course/getByTitle', { params: { title, pageNum, pageSize } })
  },

  addCourse(data) {
    return request.post('/course/save', data)
  },

  deleteCourse(id) {
    return request.delete(`/course/del/${id}`)
  },

  getCourseResources(courseId) {
    return request.get(`/courseResource/getCourseResourceById/${courseId}`)
  },

  deleteResource(id) {
    return request.delete(`/courseResource/del/${id}`)
  }
}


