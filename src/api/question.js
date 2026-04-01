import request from './request'

export const questionApi = {
  // 新增题目
  saveExamTitle(data) {
    return request.post('/question/saveExamTitle', data)
  },

  // 修改题目
  updateExamTitle(data) {
    return request.post('/question/updateExamTitle', data)
  },

  // 获取题库所有题目信息
  getAllExamTitle() {
    return request.get('/question/getAllExamTitle')
  },

  // 根据 ID 删除题库题目
  delExamTitle(id) {
    return request.get(`/question/delExamTitle/${id}`)
  }
}
