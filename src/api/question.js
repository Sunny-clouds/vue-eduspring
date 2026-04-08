import request from './request'

const sortMultiAnswer = (value) => {
  const orderMap = { A: 1, B: 2, C: 3, D: 4 }
  const raw = Array.isArray(value)
    ? value
    : String(value || '').split(/[,，\s]+/)

  const normalized = raw
    .map(item => String(item || '').trim().toUpperCase())
    .filter(item => orderMap[item])

  const unique = Array.from(new Set(normalized))
  return unique.sort((a, b) => orderMap[a] - orderMap[b]).join(',')
}

const normalizeQuestionPayload = (data = {}) => {
  const payload = { ...(data || {}) }
  const type = Number(payload.type)
  if (type === 2) {
    payload.correctAnswer = sortMultiAnswer(payload.correctAnswer)
  }
  return payload
}

export const questionApi = {
  // 新增题目
  saveExamTitle(data) {
    return request.post('/question/saveExamTitle', normalizeQuestionPayload(data))
  },

  // 修改题目
  updateExamTitle(data) {
    return request.post('/question/updateExamTitle', normalizeQuestionPayload(data))
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
