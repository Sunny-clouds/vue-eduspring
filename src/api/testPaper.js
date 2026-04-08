import request from './request'

export const testPaperApi = {
  // 新增试卷
  saveTestPaper(data) {
    return request.post('/testPaper/saveTestPaper', data)
  },

  // 自动组卷
  autoGenerateTestPaper(data) {
    return request.post('/testPaper/autoGenerateTestPaper', data)
  },

  // 获取试卷信息
  getTestPaperById(id) {
    return request.get(`/testPaper/getTestPaperById/${id}`)
  }
}
