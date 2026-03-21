import request from './request'

// 学生选课接口封装。
export const studentCourseApi = {
  // 获取所有学生选课信息（分页）
  getAll(pageNum = 1, pageSize = 10) {
    return request.get('/studentCourse/getAll', { params: { pageNum, pageSize } })
  },

  // 根据学生姓名查询选课信息（别名）
  searchByUserName(nickname) {
    // 同时携带 nickname / userName，兼容后端参数名差异。
    return request.get('/studentCourse/getByUserName', { params: { nickname, userName: nickname } })
  }
}
