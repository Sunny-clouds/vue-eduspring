import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/user'
import { normalizeRoleCode } from '@/utils/role'

// 用户对象归一化，保证 store 内字段稳定。
const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') {
    return null
  }
  return {
    ...user,
    role_code: normalizeRoleCode(user?.role_code ?? user?.roleCode)
  }
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const token = ref('')
  const isLoggedIn = computed(() => !!token.value)
  const roleCode = computed(() => normalizeRoleCode(user.value?.role_code))
  const isAdmin = computed(() => roleCode.value === 'admin')
  const isTeacher = computed(() => roleCode.value === 'teacher')
  const isStudent = computed(() => roleCode.value === 'student')

  // 初始化用户信息
  const initUser = () => {
    // 启动时从本地恢复登录态。
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    if (savedUser) {
      user.value = normalizeUser(JSON.parse(savedUser))
    }
    if (savedToken) {
      token.value = savedToken
    }
  }

  // 登陆
  const login = async (username, password) => {
    try {
      const response = await userApi.login(username, password)
      if (response.code === 1) {
        const userData = normalizeUser({
          ...(response.data || {}),
          password
        })
        user.value = userData
        token.value = userData?.token || ''
        // 登录成功后持久化，支持刷新后免登。
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', userData?.token || '')
        return { success: true }
      } else {
        return { success: false, message: response.msg || '登陆失败' }
      }
    } catch (error) {
      let errorMsg = 'Network Error'
      if (error.message) {
        errorMsg = error.message
      } else if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg
      } else if (typeof error === 'string') {
        errorMsg = error
      }
      return { success: false, message: errorMsg }
    }
  }

  // 注册
  const register = async (formData) => {
    try {
      const response = await userApi.register(formData)
      if (response.code === 1) {
        return { success: true, message: '注册成功，请登陆' }
      } else {
        return { success: false, message: response.msg || '注册失败，账号已存在' }
      }
    } catch (error) {
      let errorMsg = 'Network Error'
      if (error.message) {
        errorMsg = error.message
      } else if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg
      } else if (typeof error === 'string') {
        errorMsg = error
      }
      return { success: false, message: errorMsg }
    }
  }

  // 登出
  const logout = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      const response = await userApi.updateProfile(profileData)
      if (response.code === 1) {
        user.value = normalizeUser({ ...user.value, ...profileData })
        // 资料更新后同步本地缓存。
        localStorage.setItem('user', JSON.stringify(user.value))
        return { success: true, message: '更新成功' }
      } else {
        return { success: false, message: response.msg || '更新失败' }
      }
    } catch (error) {
      return { success: false, message: error.message || '更新出错' }
    }
  }

  // 修改密码
  const setPassword = async ({ id, password, oldPassword }) => {
    try {
      const response = await userApi.setPassword({
        id,
        password,
        oldPassword
      })
      if (response.code === 1) {
        user.value = normalizeUser({ ...user.value, password })
        // 密码更新后维持本地 user 与内存一致。
        localStorage.setItem('user', JSON.stringify(user.value))
        return { success: true, message: response.msg || '密码修改成功' }
      }
      return { success: false, message: response.msg || '密码修改失败' }
    } catch (error) {
      return { success: false, message: error.message || '密码修改出错' }
    }
  }
  return {
    user,
    token,
    isLoggedIn,
    roleCode,
    isAdmin,
    isTeacher,
    isStudent,
    initUser,
    login,
    register,
    logout,
    updateProfile,
    setPassword
  }
})
