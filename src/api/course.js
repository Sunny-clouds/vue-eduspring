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

  // ========== 课程资源相关 ==========

  // 根据课程ID获取课程资源
  getCourseResourceById(courseId) {
    const normalizedCourseId = Number(courseId)
    return request.get(`/api/courseResource/getCourseResourceById/${courseId}`, {
      params: {
        courseId: Number.isFinite(normalizedCourseId) ? normalizedCourseId : courseId
      },
      baseURL: ''
    })
  },

  // 上传课程资源（仅管理员/教师）
  saveCourseResource(data) {
    return request.post('/api/courseResource/save', data, {
      baseURL: ''
    })
  },

  // 删除课程资源（仅管理员/教师）
  deleteCourseResource(id) {
    return request.delete(`/api/courseResource/del/${id}`, {
      baseURL: ''
    })
  },

  // ========== 选课相关（调用studentCourse接口） ==========

  // 选课（依赖于studentCourse模块）
  selectCourse(studentId, courseId) {
    return request.post('/studentCourse/save', { studentId, courseId })
  },

  // 退课（依赖于studentCourse模块）
  dropCourse(id) {
    return request.delete(`/studentCourse/delByUserName/${id}`)
  }
}


