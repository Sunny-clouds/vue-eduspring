import request from './request'

export const scoreApi = {
  // 分页获取所有学生科目的成绩信息
  getScores(pageNum = 1, pageSize = 10) {
    return request.get('/score/getAll', { params: { pageNum, pageSize } })
  },

  // 根据学生姓名查询成绩
  getScoreByUserName(nickname) {
    return request.get('/score/getScoreByUserName', { params: { nickname, username: nickname, userName: nickname } })
  },

  // 根据课程名查询成绩
  getScoreByCourseId(title, pageNum = 1, pageSize = 10) {
    return request.get('/score/getScoreByTitle', { params: { title, pageNum, pageSize } })
  },

  // 修改成绩
  setScore(scoreData) {
    return request.post('/score/setScore', null, { params: scoreData })
  },

  // 兼容旧调用命名
  addScore(scoreData) {
    return request.post('/score/setScore', null, { params: scoreData })
  },

  updateScore(scoreData) {
    return request.post('/score/setScore', null, { params: scoreData })
  },

  deleteScore(id) {
    return request.post('/score/setScore', null, { params: { id } })
  },

  // 当前后端未提供独立统计接口，前端可由列表数据聚合统计。
  getScoreStatistics(pageNum = 1, pageSize = 100) {
    return request.get('/score/getAll', { params: { pageNum, pageSize } })
  }
}
