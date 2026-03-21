import axios from 'axios'

// 统一清洗 token，避免前后空白导致鉴权失败。
const normalizeAuthToken = (token) => {
  if (!token) {
    return ''
  }

  return String(token).trim()
}

// 创建 axios 实例
// 开发环境使用相对路径（通过代理）
// 生产环境可以配置绝对路径
const instance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? 'http://localhost:8080' : '/api',
  timeout: 10000
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
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
      // 同时兼容后端读取 token / Authorization 两种方式。
      config.headers.token = token
      config.headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
instance.interceptors.response.use(
  response => response.data,
  error => {
    const status = error.response?.status

    if (error.response?.status === 401) {
      // token 过期，清除本地 token 并跳转到登陆页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // 提供更详细的错误信息
    const errorMessage = error.response?.data?.msg ||
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
