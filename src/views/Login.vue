<template>
  <div class="login-container">
    <el-card class="login-card">
      <h1 class="login-title">EduSpring 教育学习平台</h1>
      <p class="login-subtitle">欢迎登录</p>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            type="password"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="loginLoading"
            @click="handleLogin"
          >
            {{ loginLoading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <span>没有账户？</span>
        <el-link type="primary" @click="switchToRegister">立即注册</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup name="LoginPage">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loginLoading = ref(false)
const loginForm = ref({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async valid => {
    if (!valid) return

    loginLoading.value = true
    const result = await userStore.login(
      loginForm.value.username,
      loginForm.value.password
    )
    loginLoading.value = false

    if (result.success) {
      ElMessage.success('登录成功')
      router.push('/home')
    } else {
      ElMessage.error(result.message || 'Network Error')
    }
  })
}

const switchToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: #ffffff;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
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

.login-card :deep(.el-card__body) {
  padding: 50px 35px;
}

.login-title {
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

.login-subtitle {
  text-align: center;
  color: #909399;
  margin-bottom: 35px;
  font-size: 15px;
  letter-spacing: 0.5px;
  font-weight: 500;
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

:deep(.el-form-item) {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  transition: all 0.3s ease;
  border-color: #e0e0e0;
  background: #fcfcfc;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--theme-primary);
  background: white;
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.08);
}

:deep(.el-input.is-focus .el-input__wrapper) {
  border-color: var(--theme-primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb), 0.15);
}

:deep(.el-input__prefix) {
  display: flex;
  align-items: center;
  color: var(--theme-primary);
  font-weight: 600;
  transition: color 0.3s ease;
}

:deep(.el-input.is-focus .el-input__prefix) {
  color: var(--theme-secondary);
}

</style>







