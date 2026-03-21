<template>
  <div class="register-container">
    <el-card class="register-card">
      <h1 class="register-title">注册账户</h1>
      <p class="register-subtitle">创建您的 EduSpring 账户</p>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="密码"
            prefix-icon="Lock"
            type="password"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="确认密码"
            prefix-icon="Lock"
            type="password"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="昵称"
            clearable
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="邮箱"
            prefix-icon="Message"
            clearable
          />
        </el-form-item>

        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="手机号"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="registerLoading"
            @click="handleRegister"
          >
            {{ registerLoading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <span>已有账户？</span>
        <el-link type="primary" @click="switchToLogin">前往登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup name="RegisterPage">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref(null)
const registerLoading = ref(false)
const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: '',
  phone: ''
})

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (registerForm.value.confirmPassword !== '') {
      registerFormRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请确认密码'))
  } else if (value !== registerForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateEmail = (rule, value, callback) => {
  if (value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback()
  } else {
    callback(new Error('邮箱格式不正确'))
  }
}

const validatePhone = (rule, value, callback) => {
  if (value === '' || /^1[3-9]\d{9}$/.test(value)) {
    callback()
  } else {
    callback(new Error('手机号格式不正确'))
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 20, message: '昵称长度不能超过 20 个字符', trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async valid => {
    if (!valid) return

    registerLoading.value = true
    const submitData = {
      username: registerForm.value.username,
      password: registerForm.value.password,
      nickname: registerForm.value.nickname,
      email: registerForm.value.email,
      phone: registerForm.value.phone
    }
    const result = await userStore.register(submitData)
    registerLoading.value = false

    if (result.success) {
      ElMessage.success(result.message)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      ElMessage.error(result.message)
    }
  })
}

const switchToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: #ffffff;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  border: none;
  background: white;
  animation: slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.register-card :deep(.el-card__body) {
  padding: 50px 35px;
}

.register-title {
  text-align: center;
  background: #87ceeb;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 1px;
}

.register-subtitle {
  text-align: center;
  color: #909399;
  margin-bottom: 35px;
  font-size: 15px;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.register-container :deep(.el-form-item) {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.register-container :deep(.el-input__wrapper) {
  border-radius: 10px;
  transition: all 0.3s ease;
  border-color: #e0e0e0;
  background: #fcfcfc;
}

.register-container :deep(.el-input__wrapper:hover) {
  border-color: var(--theme-primary);
  background: white;
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.08);
}

.register-container :deep(.el-input.is-focus .el-input__wrapper) {
  border-color: var(--theme-primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb), 0.15);
}

.register-container :deep(.el-input__prefix) {
  display: flex;
  align-items: center;
  color: var(--theme-primary);
  font-weight: 600;
  transition: color 0.3s ease;
}

.register-container :deep(.el-input.is-focus .el-input__prefix) {
  color: var(--theme-secondary);
}

.form-footer {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-top: 25px;
  transition: all 0.3s ease;
}

.form-footer span {
  margin-right: 8px;
  font-weight: 500;
}

.form-footer :deep(.el-link) {
  color: var(--theme-primary);
  font-weight: 700;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.form-footer :deep(.el-link:hover) {
  color: var(--theme-secondary);
  text-decoration: none;
}
</style>





