import request from './request'

export const examApi = {
  // 根据业务 ID（考试ID）获取考试信息
  getExamByBizId(bizId) {
    return request.get(`/exam/getExamByBizId/${bizId}`)
  },

  // 根据学生ID与试卷ID查询学生成绩信息
  getScoreByStudentIdAndPaperId(studentId, paperId) {
    return request.get(`/exam/getScoreByStudentIdAndPaperId/${studentId}/${paperId}`)
  },

  // 删除学生考试信息（studentPaper）
  delById(id) {
    return request.delete(`/exam/delById/${id}`)
  },

  // 按活动ID查询所有学生考试成绩
  getAllStudentPaper(activityId) {
    return request.get(`/exam/getAllStudentPaper/${activityId}`)
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
