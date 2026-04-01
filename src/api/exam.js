import request from './request'

export const examApi = {
  // 根据活动 ID 获取考试信息
  getExamByActivityId(activityId) {
    return request.get(`/exam/getExamByActivityId/${activityId}`)
  },

  // 新增考试信息
  saveExam(data) {
    return request.post('/exam/saveExam', data)
  },

  // 修改考试信息
  updateExam(data) {
    return request.post('/exam/updateExam', data)
  }
}
