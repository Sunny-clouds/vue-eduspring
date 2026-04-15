<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="panel-form">
        <div class="brand-row">
          <div class="brand-badge">ES</div>
          <div class="brand-copy">
            <h1>EduSpring</h1>
            <p>Smart Learning Campus</p>
          </div>
        </div>

        <div class="form-area">
          <header class="form-header">
            <h2>欢迎回来</h2>
            <p>登录后继续你的学习任务与课堂互动。</p>
          </header>

          <el-form
            ref="loginFormRef"
            class="login-form"
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

            <el-form-item class="submit-row">
              <el-button
                class="submit-btn"
                type="primary"
                :loading="loginLoading"
                @click="handleLogin"
              >
                {{ loginLoading ? '登录中...' : '立即登录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="register-tip">
            <span>没有账户?</span>
            <el-link type="primary" @click="switchToRegister">立即注册</el-link>
          </div>
        </div>
      </section>

      <section class="panel-visual" aria-hidden="true">
        <div class="visual-overlay"></div>
        <div class="visual-content">
          <p class="pill">10,000+ 学员正在使用</p>
          <h3>
            让每一次登录
            <br>
            都成为成长的起点
          </h3>
          <p class="visual-sub">
            从课程学习、讨论互动到考试评估，统一在一个清晰高效的学习空间中完成。
          </p>
        </div>
      </section>
    </div>
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
      router.push(userStore.isAdmin ? '/admin' : '/home')
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
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.login-page {
  --brand-a: #0f766e;
  --brand-b: #0ea5a4;
  --brand-c: #f59e0b;
  --text-strong: #0f172a;
  --text-soft: #64748b;

  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: #f4f7fb;
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.login-shell {
  width: 100%;
  max-width: 1180px;
  min-height: 700px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
  border-radius: 28px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.14);
}

.panel-form {
  padding: 36px 44px 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.92);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-badge {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-weight: 800;
  background: var(--brand-a);
  box-shadow: 0 10px 22px rgba(15, 118, 110, 0.35);
}

.brand-copy h1 {
  margin: 0;
  font-size: 20px;
  color: var(--text-strong);
  line-height: 1.1;
}

.brand-copy p {
  margin: 2px 0 0;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-soft);
}

.form-area {
  width: 100%;
  max-width: 460px;
  margin: 20px auto 0;
}

.form-header h2 {
  margin: 0;
  font-size: 38px;
  color: var(--text-strong);
  letter-spacing: -0.02em;
}

.form-header p {
  margin: 10px 0 30px;
  color: var(--text-soft);
  font-size: 15px;
}

.login-form {
  animation: fade-up 0.55s ease-out;
}

.submit-row {
  margin-top: 4px;
}

.submit-btn {
  width: 100%;
  height: 46px;
  border: none;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-radius: 14px;
  background: var(--brand-a) !important;
  box-shadow: 0 14px 30px rgba(14, 165, 164, 0.34);
}

.register-tip {
  margin-top: 18px;
  text-align: center;
  font-size: 14px;
  color: var(--text-soft);
}

.register-tip span {
  margin-right: 6px;
}

.register-tip :deep(.el-link) {
  font-weight: 700;
  color: var(--brand-a);
}

.panel-visual {
  position: relative;
  background:
    linear-gradient(130deg, rgba(13, 148, 136, 0.38), rgba(6, 95, 70, 0.48)),
    url('https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80') center / cover;
}

.visual-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 74% 22%, rgba(251, 191, 36, 0.18), transparent 42%),
    radial-gradient(circle at 24% 74%, rgba(255, 255, 255, 0.11), transparent 44%);
}

.visual-content {
  position: absolute;
  left: 48px;
  right: 48px;
  bottom: 56px;
  color: #f8fafc;
}

.pill {
  display: inline-block;
  margin: 0 0 14px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.34);
}

.visual-content h3 {
  margin: 0;
  font-size: 46px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.visual-sub {
  margin: 16px 0 0;
  max-width: 420px;
  color: rgba(241, 245, 249, 0.95);
  font-size: 15px;
  line-height: 1.7;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 14px;
  min-height: 46px;
  border: 1px solid #dbe3ee;
  background: #f8fafc;
  box-shadow: none;
  transition: all 0.22s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #9fb4cc;
  background: #ffffff;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  border-color: var(--brand-b);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(14, 165, 164, 0.16);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .login-page {
    padding: 14px;
  }

  .login-shell {
    min-height: auto;
    grid-template-columns: 1fr;
    border-radius: 20px;
  }

  .panel-form {
    padding: 26px 20px;
  }

  .form-area {
    margin-top: 16px;
    max-width: 100%;
  }

  .form-header h2 {
    font-size: 30px;
  }

  .panel-visual {
    display: none;
  }
}

@media (max-width: 560px) {
  .form-header h2 {
    font-size: 26px;
  }
}

</style>







