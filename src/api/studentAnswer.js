import request from './request'

export const studentAnswerApi = {
  // 提交考试作答（PublishStudentExamDto）
  saveStudentAnswer(publishStudentExamDto) {
    return request.post(
      '/studentAnswer/saveStudentAnswer',
      JSON.stringify(publishStudentExamDto || {}),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  },

  // 获取试卷的学生答题统计（StudentAnswerVo列表）
  getStudentAnswerByPaperId(paperId) {
    return request.get(`/studentAnswer/getStudentAnswerByPaperId/${paperId}`)
  }
}
