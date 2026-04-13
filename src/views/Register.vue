<template>
  <div class="register-page">
    <div class="register-shell">
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
            <h2>创建账号</h2>
            <p>填写基础信息，快速开启你的在线学习旅程。</p>
          </header>

          <el-form
            ref="registerFormRef"
            class="register-form"
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
                prefix-icon="UserFilled"
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
                prefix-icon="Iphone"
                clearable
              />
            </el-form-item>

            <el-form-item class="submit-row">
              <el-button
                class="submit-btn"
                type="primary"
                :loading="registerLoading"
                @click="handleRegister"
              >
                {{ registerLoading ? '注册中...' : '立即注册' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <span>已有账户?</span>
            <el-link type="primary" @click="switchToLogin">前往登录</el-link>
          </div>
        </div>
      </section>

      <section class="panel-visual" aria-hidden="true">
        <div class="visual-overlay"></div>
        <div class="visual-content">
          <p class="pill">加入 10,000+ 学员社区</p>
          <h3>
            从今天开始
            <br>
            定义你的学习节奏
          </h3>
          <p class="visual-sub">
            EduSpring 为你提供课程、讨论、考试与成绩的一体化学习体验，让成长路径更清晰。
          </p>
        </div>
      </section>
    </div>
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
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.register-page {
  --brand-a: #0f766e;
  --brand-b: #0ea5a4;
  --text-strong: #0f172a;
  --text-soft: #64748b;

  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background:
    radial-gradient(circle at 15% 14%, rgba(15, 118, 110, 0.2) 0, transparent 36%),
    radial-gradient(circle at 86% 82%, rgba(251, 191, 36, 0.2) 0, transparent 34%),
    linear-gradient(145deg, #f8fafc 0%, #f1f5f9 55%, #ecfeff 100%);
  font-family: 'Manrope', 'Segoe UI', sans-serif;
}

.register-shell {
  width: 100%;
  max-width: 1220px;
  min-height: 760px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
  border-radius: 28px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.14);
}

.panel-form {
  padding: 36px 44px 30px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.84));
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
  background: linear-gradient(135deg, var(--brand-a), var(--brand-b));
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
  max-width: 470px;
  margin: 16px auto 0;
}

.form-header h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 38px;
  letter-spacing: -0.02em;
}

.form-header p {
  margin: 10px 0 28px;
  color: var(--text-soft);
  font-size: 15px;
}

.register-form {
  animation: fade-up 0.55s ease-out;
}

.submit-row {
  margin-top: 4px;
  margin-bottom: 14px;
}

.submit-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, var(--brand-a), var(--brand-b)) !important;
  box-shadow: 0 14px 30px rgba(14, 165, 164, 0.34);
}

.form-footer span {
  margin-right: 6px;
}

.form-footer :deep(.el-link) {
  color: var(--brand-a);
  font-weight: 700;
}

.panel-visual {
  position: relative;
  background:
    linear-gradient(130deg, rgba(13, 148, 136, 0.36), rgba(6, 95, 70, 0.46)),
    url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80') center / cover;
}

.visual-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 72% 24%, rgba(251, 191, 36, 0.18), transparent 42%),
    radial-gradient(circle at 22% 78%, rgba(255, 255, 255, 0.11), transparent 44%);
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

.register-page :deep(.el-form-item) {
  margin-bottom: 18px;
}

.register-page :deep(.el-input__wrapper) {
  border-radius: 14px;
  min-height: 46px;
  border: 1px solid #dbe3ee;
  background: #f8fafc;
  box-shadow: none;
  transition: all 0.22s ease;
}

.register-page :deep(.el-input__wrapper:hover) {
  border-color: #9fb4cc;
  background: #ffffff;
}

.register-page :deep(.el-input.is-focus .el-input__wrapper) {
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
  .register-page {
    padding: 14px;
  }

  .register-shell {
    min-height: auto;
    grid-template-columns: 1fr;
    border-radius: 20px;
  }

  .panel-form {
    padding: 26px 20px;
  }

  .form-area {
    max-width: 100%;
    margin-top: 14px;
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





