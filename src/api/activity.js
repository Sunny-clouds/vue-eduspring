import request from './request'

export const activityApi = {
  // 按课程 ID 获取活动（兼容分页参数）
  getAllByCourseId(id, pageNum, pageSize) {
    const hasPaging = pageNum !== undefined || pageSize !== undefined
    if (hasPaging) {
      return request.get(`/activity/getAllById/${id}`, {
        params: {
          pageNum,
          pageSize
        }
      })
    }
    return request.get(`/activity/getAllById/${id}`)
  },

  // 兼容旧调用
  getAllById(id) {
    return this.getAllByCourseId(id)
  },

  // 发布活动信息
  save(data) {
    return request.post('/activity/save', data)
  },

  // 删除活动信息
  delById(id) {
    return request.delete(`/activity/delById/${id}`)
  },

  // 回复活动评论
  saveComment(data) {
    return request.post('/activity/saveComment', data)
  },

  // 根据活动 ID 查看评论
  getCommentById(id) {
    return request.get(`/activity/getCommentById/${id}`)
  },

  // 修改活动开始和结束时间
  setStartAndEndTime(data) {
    return request.put('/activity/setStartAndEndTime', data)
  }
}
