import request from './request'

// 兼容 rows/list/array 三类列表返回。
const normalizeRows = (data) => {
  if (Array.isArray(data?.rows)) {
    return data.rows
  }

  if (Array.isArray(data?.list)) {
    return data.list
  }

  if (Array.isArray(data)) {
    return data
  }

  return []
}

// 兼容不同后端对“评论列表”字段的命名差异。
const normalizeReplyRows = (data) => {
  const candidates = [
    data?.comments,
    data?.commentList,
    data?.replyList,
    data?.replies,
    data?.rows,
    data?.list,
    data
  ]

  for (const item of candidates) {
    if (Array.isArray(item)) {
      return item
    }
  }

  return []
}

function normalizeReplyItem(item = {}) {
  // 递归规范化 children，保证组件渲染字段一致。
  const children = Array.isArray(item?.children)
    ? item.children.map(child => normalizeReplyItem(child))
    : []

  return {
    ...item,
    id: item.id ?? item.commentId ?? item.replyId,
    userId: item.userId ?? item.uid ?? item.authorId ?? item.fromUserId,
    parentId: item.parentId ?? item.pid ?? item.parentCommentId ?? 0,
    username: item.username || item.nickname || item.userName || item.authorName || '匿名用户',
    avatar: item.avatar || item.avatarUrl || item.headImg || item.headImage || '',
    content: item.content || item.commentContent || item.replyContent || '',
    createTime: item.createTime || item.commentTime || item.replyTime || '',
    likeCount: Number(item.likeCount ?? item.likes ?? 0),
    children
  }
}

export const discussionApi = {
  // 分页查询所有帖子（后端接口）
  getAll(pageNum = 1, pageSize = 10) {
    return request.get('/discussion/getAll', { params: { pageNum, pageSize } })
  },

  // 根据课程名分页查询帖子
  getByCourseName(courseName, pageNum = 1, pageSize = 10) {
    const keyword = String(courseName || '').trim()
    return request.get('/discussion/getByCourseName', {
      params: { courseName: keyword, pageNum, pageSize }
    })
  },

  // 根据标题分页查询帖子
  async getByTitle(title, pageNum = 1, pageSize = 10) {
    const keyword = String(title || '').trim()

    try {
      return await request.get('/discussion/getByTitle', {
        params: { title: keyword, pageNum, pageSize }
      })
    } catch (error) {
      // 后端未实现 getByTitle 时，回退到 getAll 并在前端做标题过滤。
      const shouldFallback = String(error?.status || '') === '404' || /not\s*found|未找到|无权访问该接口/i.test(error?.message || '')

      if (!shouldFallback) {
        throw error
      }

      const allResp = await request.get('/discussion/getAll', {
        params: { pageNum: 1, pageSize: 1000 }
      })

      if (allResp?.code !== 1) {
        return allResp
      }

      const rows = normalizeRows(allResp.data)
      const filteredRows = keyword
        ? rows.filter(item => String(item?.title || '').toLowerCase().includes(keyword.toLowerCase()))
        : rows

      const safePageNum = Math.max(1, Number(pageNum) || 1)
      const safePageSize = Math.max(1, Number(pageSize) || 10)
      const start = (safePageNum - 1) * safePageSize
      const end = start + safePageSize

      return {
        code: 1,
        msg: 'success(fallback)',
        data: {
          rows: filteredRows.slice(start, end),
          total: filteredRows.length
        }
      }
    }
  },

  // 获取帖子详情（后端无单帖详情接口时，前端通过列表兜底）
  async getDiscussionDetail(id, title = '') {
    if (title && String(title).trim()) {
      const response = await this.getByTitle(String(title).trim(), 1, 20)

      if (response?.code === 1) {
        const rows = normalizeRows(response.data)
        const target = Array.isArray(rows)
          ? rows.find(item => String(item.id) === String(id)) || rows[0] || null
          : null
        return {
          ...response,
          data: target
        }
      }

      return response
    }

    const response = await request.get('/discussion/getAll', { params: { pageNum: 1, pageSize: 1000 } })
    if (response?.code !== 1) {
      return response
    }

    const rows = normalizeRows(response.data)
    const target = Array.isArray(rows)
      ? rows.find(item => String(item.id) === String(id)) || null
      : null

    return {
      ...response,
      data: target
    }
  },

  // 按标题 + 课程名组合搜索（后端无组合接口时，前端兜底）
  async getByTitleAndCourseName(title, courseName, pageNum = 1, pageSize = 10) {
    const titleKeyword = String(title || '').trim().toLowerCase()
    const courseKeyword = String(courseName || '').trim().toLowerCase()

    const allResp = await request.get('/discussion/getAll', {
      params: { pageNum: 1, pageSize: 1000 }
    })

    if (allResp?.code !== 1) {
      return allResp
    }

    const rows = normalizeRows(allResp.data)
    const filteredRows = rows.filter((item) => {
      const titleText = String(item?.title || '').toLowerCase()
      const courseText = String(item?.courseName || item?.courseTitle || item?.titleCourse || '').toLowerCase()
      return titleText.includes(titleKeyword) && courseText.includes(courseKeyword)
    })

    const safePageNum = Math.max(1, Number(pageNum) || 1)
    const safePageSize = Math.max(1, Number(pageSize) || 10)
    const start = (safePageNum - 1) * safePageSize
    const end = start + safePageSize

    return {
      code: 1,
      msg: 'success(fallback)',
      data: {
        rows: filteredRows.slice(start, end),
        total: filteredRows.length
      }
    }
  },

  // 删除帖子（后端接口）
  deleteDiscussion(id) {
    return request.delete(`/discussion/del/${id}`)
  },

  // 兼容旧命名
  addDiscussion(data) {
    return request.post('/discussion/save', data)
  },

  // 添加帖子（后端接口）
  save(data) {
    return request.post('/discussion/save', data)
  },

  // 发布评论/回复
  addReply(payloadOrPostId, contentArg = '') {
    // 同时兼容 addReply(postId, content) 与 addReply(payload) 两种调用方式。
    const payload = (payloadOrPostId && typeof payloadOrPostId === 'object')
      ? payloadOrPostId
      : {
          postId: payloadOrPostId,
          content: contentArg
        }

    return request.post('/discussion/saveComment', {
      postId: Number(payload?.postId),
      userId: Number(payload?.userId),
      parentId: Number(payload?.parentId || 0),
      content: String(payload?.content || '')
    })
  },

  // 帖子点赞
  postLike(id) {
    return request.get(`/discussion/postLike/${id}`)
  },

  // 评论点赞
  commentLike(id) {
    return request.get(`/discussion/commentLike/${id}`)
  },

  // 删除评论
  deleteComment(id) {
    return request.delete(`/discussion/delComment/${id}`)
  },

  // 兼容旧命名
  deleteReply(id) {
    return request.delete(`/discussion/delComment/${id}`)
  },

  // 获取评论树并做字段归一，供递归组件直接消费。
  getReplies(discussionId, params = {}) {
    return request.get(`/discussion/comments/${discussionId}`, { params }).then((response) => {
      if (response?.code !== 1) {
        return response
      }

      const rows = normalizeReplyRows(response?.data).map(normalizeReplyItem)

      return {
        ...response,
        data: {
          ...(response?.data || {}),
          rows,
          total: Number(response?.data?.total ?? response?.data?.count ?? rows.length)
        }
      }
    })
  }
}

