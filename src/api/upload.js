import request from './request'

// 兼容字符串与对象两类上传返回结构。
const resolveUploadResult = (response) => {
  const payload = response?.data

  if (typeof payload === 'string') {
    return {
      url: payload,
      path: payload,
      name: ''
    }
  }

  const source = payload && typeof payload === 'object' ? payload : {}
  const url = source.url || source.fileUrl || source.path || source.filePath || ''
  const path = source.path || source.filePath || url || ''
  const name = source.name || source.fileName || source.originName || ''

  return {
    url,
    path,
    name
  }
}

// 根据显式 type、MIME 或扩展名推断上传分类。
const resolveUploadType = (file, type) => {
  const explicit = String(type || '').trim().toLowerCase()
  if (explicit === 'image' || explicit === 'video' || explicit === 'doc') {
    return explicit
  }

  const mimeType = String(file?.type || explicit).trim().toLowerCase()
  if (mimeType.startsWith('image/')) {
    return 'image'
  }
  if (mimeType.startsWith('video/')) {
    return 'video'
  }
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('officedocument') ||
    mimeType.includes('msword') ||
    mimeType.includes('spreadsheetml') ||
    mimeType.includes('presentationml')
  ) {
    return 'doc'
  }

  const fileName = String(file?.name || '').toLowerCase()
  if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(fileName)) {
    return 'image'
  }
  if (/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/.test(fileName)) {
    return 'video'
  }

  return 'doc'
}

export const uploadApi = {
  // 统一文件上传接口：POST /api/upload/upload
  upload(file, type) {
    const formData = new FormData()
    const uploadType = resolveUploadType(file, type)
    formData.append('file', file)
    formData.append('type', uploadType)

    return request.post('/api/upload/upload', formData, {
      baseURL: '',
      // 大文件上传不使用全局 10s 超时，避免传输过程中被前端中断。
      timeout: 0,
      // 兼容 axios 在部分运行时对体积限制的检查。
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then((response) => {
      // 返回 upload + data 双结构，兼容旧代码读取路径。
      const normalized = resolveUploadResult(response)
      return {
        ...response,
        upload: normalized,
        data: {
          ...(typeof response?.data === 'object' && response?.data !== null ? response.data : {}),
          ...normalized
        }
      }
    })
  },

  // 兼容旧命名
  uploadFile(file, type) {
    return this.upload(file, type)
  }
}
