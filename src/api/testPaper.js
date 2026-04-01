import request from './request'

export const testPaperApi = {
  // 获取试卷信息
  getTestPaperById(id) {
    return request.get(`/testPaper/getTestPaperById/${id}`)
  }
}
