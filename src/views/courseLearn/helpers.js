export const activityTypeOptions = [
  { value: 1, label: '作业' },
  { value: 2, label: '考试' },
  { value: 3, label: '讨论' },
  { value: 4, label: '签到' }
]

export const examFieldTextNumberMap = {
  duration: {
    '30分钟': 30,
    '60分钟': 60,
    '90分钟': 90,
    '120分钟': 120
  },
  allowRetake: {
    '否': 0,
    '是': 1
  },
  maxAttempts: {
    '1次': 1,
    '2次': 2,
    '3次': 3
  },
  showResults: {
    '否': 0,
    '是': 1
  }
}

export const examCreateDefaultsText = {
  duration: '60分钟',
  allowRetake: '否',
  maxAttempts: '1次',
  showResults: '是'
}

export const examDurationTextOptions = Object.keys(examFieldTextNumberMap.duration)
export const allowRetakeTextOptions = Object.keys(examFieldTextNumberMap.allowRetake)
export const maxAttemptsTextOptions = Object.keys(examFieldTextNumberMap.maxAttempts)
export const showResultsTextOptions = Object.keys(examFieldTextNumberMap.showResults)

export const detectUploadType = (fileName = '') => {
  const name = String(fileName || '').toLowerCase()
  if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(name)) return 'image'
  if (/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/.test(name)) return 'video'
  return 'doc'
}

export const deriveResourceNameFromFileName = (fileName = '') => {
  const trimmed = String(fileName || '').trim()
  if (!trimmed) {
    return ''
  }
  const dotIndex = trimmed.lastIndexOf('.')
  if (dotIndex <= 0) {
    return trimmed
  }
  return trimmed.slice(0, dotIndex)
}

export const getVideoDurationSeconds = (file) => {
  return new Promise((resolve) => {
    try {
      const objectUrl = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = objectUrl

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl)
        video.removeAttribute('src')
      }

      video.onloadedmetadata = () => {
        const duration = Math.max(0, Math.round(Number(video.duration) || 0))
        cleanup()
        resolve(duration)
      }

      video.onerror = () => {
        cleanup()
        resolve(0)
      }
    } catch (error) {
      resolve(0)
    }
  })
}

export const formatResourceType = (value = '', fileName = '') => {
  const type = String(value || '').toLowerCase()
  if (type.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName)) return '图片'
  if (type.includes('video') || /\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i.test(fileName)) return '视频'
  return '文档'
}

export const resolveBasePreviewCategory = (typeText = '', url = '') => {
  if (typeText.includes('视频') || /\.(mp4|webm|ogg|mov|m4v|avi)$/.test(url)) {
    return 'video'
  }
  if (typeText.includes('图片') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(url)) {
    return 'image'
  }
  return 'doc'
}

export const detectPreviewType = (row = {}) => {
  const typeText = String(row.resourceType || '').toLowerCase()
  const url = String(row.resourceUrl || '').toLowerCase()
  return resolveBasePreviewCategory(typeText, url)
}

export const detectPreviewMode = (row = {}) => {
  const typeText = String(row.resourceType || row.type || '').toLowerCase()
  const url = String(row.resourceUrl || '').toLowerCase()
  const baseCategory = resolveBasePreviewCategory(typeText, url)

  if (baseCategory !== 'doc') {
    return baseCategory
  }
  if (typeText.includes('pdf') || /\.pdf($|\?)/.test(url)) {
    return 'pdf'
  }
  if (typeText.includes('文档') || /\.(doc|docx|ppt|pptx|xls|xlsx)$/.test(url)) {
    return 'office'
  }
  return 'doc'
}

export const resolvePreviewFrameUrl = (mode, url) => {
  if (!url) {
    return ''
  }
  if (mode === 'office') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
  }
  return url
}

export const formatFileSize = (size) => {
  const value = Number(size || 0)
  if (!Number.isFinite(value) || value <= 0) {
    return '-'
  }
  if (value < 1024) {
    return `${value} B`
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(2)} KB`
  }
  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`
  }
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export const formatDurationLabel = (seconds) => {
  const total = Number(seconds || 0)
  if (!Number.isFinite(total) || total <= 0) {
    return ''
  }
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export const parseDateTimeValue = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) {
    return NaN
  }
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  return new Date(normalized).getTime()
}

export const formatMemberStatus = (status) => {
  if (status === 1 || status === '1') return '学习中'
  if (status === 2 || status === '2') return '已完成'
  if (status === 0 || status === '0') return '已退课'
  return '已选课'
}

export const normalizeActivityRows = (data) => {
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

export const extractCreatedId = (responseData) => {
  const candidates = [
    responseData,
    responseData?.id,
    responseData?.activityId,
    responseData?.testPaperId,
    responseData?.paperId,
    responseData?.examId,
    responseData?.data?.id,
    responseData?.data?.activityId,
    responseData?.data?.testPaperId,
    responseData?.data?.paperId,
    responseData?.data?.examId
  ]

  for (const value of candidates) {
    const id = Number(value)
    if (Number.isFinite(id) && id > 0) {
      return id
    }
  }
  return null
}

export const formatNowDateTime = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

export const resolveBadgeText = (category, name = '') => {
  if (category === 'video') return 'V'
  if (category === 'image') return 'I'

  const lower = String(name || '').toLowerCase()
  if (/\.pdf$/.test(lower)) return 'PDF'
  if (/\.(doc|docx)$/.test(lower)) return 'W'
  if (/\.(ppt|pptx)$/.test(lower)) return 'P'
  if (/\.(xls|xlsx)$/.test(lower)) return 'X'
  if (/\.(txt|md)$/.test(lower)) return 'T'
  return 'D'
}

export const extractUploadResult = (response) => {
  const upload = response?.upload
  if (upload && typeof upload === 'object') {
    return {
      url: upload.url || upload.path || '',
      path: upload.path || upload.url || '',
      name: upload.name || ''
    }
  }

  const data = response?.data
  if (typeof data === 'string') {
    return {
      url: data,
      path: data,
      name: ''
    }
  }

  if (data && typeof data === 'object') {
    const url = data.url || data.fileUrl || data.path || data.filePath || ''
    const path = data.path || data.filePath || url || ''
    const name = data.name || data.fileName || data.originName || ''
    return { url, path, name }
  }

  return { url: '', path: '', name: '' }
}

export const normalizeCourseRows = (data) => {
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
