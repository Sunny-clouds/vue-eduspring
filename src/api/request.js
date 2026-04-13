import axios from 'axios'

// 统一清洗 token，避免前后空白导致鉴权失败。
const normalizeAuthToken = (token) => {
  if (!token) {
    return ''
  }

  return String(token).trim()
}

// 统一读取接口基地址：
// - 开发环境默认走 /api（由 devServer 代理）
// - 生产环境优先走环境变量，未配置时回退到 /api
const apiBaseURL = process.env.NODE_ENV === 'production'
  ? (process.env.VUE_APP_API_BASE_URL || '/api')
  : '/api'

// 创建 axios 实例
// 开发环境使用相对路径（通过代理）
// 生产环境可以配置绝对路径
const instance = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    config.headers = config.headers || {}

    if (config?.skipAuth) {
      // skipAuth 场景下显式移除鉴权头。
      if (config.headers) {
        delete config.headers.token
        delete config.headers.Authorization
      }
      return config
    }

    // 从 localStorage 获取 token 并添加到请求头
    const token = normalizeAuthToken(localStorage.getItem('token'))
    if (token) {
      config.headers.token = token
      if (config.headers.Authorization) {
        delete config.headers.Authorization
      }
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
instance.interceptors.response.use(
  response => response.data,
  error => {
    const requestUrl = String(error.config?.url || '')
    const isLoginRequest = /\/user\/login(?:\?|$)/.test(requestUrl)
    const status = error.response?.status

    if (error.response?.status === 401 && !isLoginRequest) {
      // token 过期，清除本地 token 并跳转到登陆页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    const responseData = error.response?.data
    const responseText = typeof responseData === 'string' ? responseData.trim() : ''
    const responseObj = responseData && typeof responseData === 'object' ? responseData : {}
    const isCredentialError = isLoginRequest && (status === 401 || status === 403)
    // 提供更详细的错误信息（兼容后端异常常见字段）。
    const errorMessage = (isCredentialError ? '账号或密码错误' : '') ||
          responseObj.msg ||
          responseObj.message ||
          responseObj.error ||
          responseText ||
                        (status === 413 ? '上传文件过大，请联系管理员调整服务端上传大小限制' : '') ||
                        (status === 403 ? '当前账号无权访问该接口' : '') ||
                        error.message ||
                        '网络请求失败，请检查后端服务是否运行'
    return Promise.reject({
      message: errorMessage,
      status,
      originalError: error
    })
  }
)

export default instance
