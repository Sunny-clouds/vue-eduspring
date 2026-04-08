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
  }
}
