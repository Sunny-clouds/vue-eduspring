<template>
  <div class="profile-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">个人中心</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="userForm" label-width="100px" v-loading="userLoading">
            <el-form-item label="头像">
              <div class="avatar-uploader-row">
                <el-avatar :size="72" :src="userForm.avatar || ''">
                  {{ getAvatarFallback() }}
                </el-avatar>
                <el-upload
                  class="avatar-uploader"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="handleAvatarChange"
                >
                  <el-button type="primary" plain>上传头像</el-button>
                </el-upload>
              </div>
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="userForm.username" disabled />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="userForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleUpdateProfile"
                :loading="updatingProfile"
              >
                保存
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <el-form :model="passwordForm" label-width="120px">
            <el-form-item label="旧密码" required>
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入旧密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" required>
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码（至少6个字符）"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" required>
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请确认新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleChangePassword"
                :loading="changingPassword"
              >
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="统计数据" name="statistics">
          <div v-if="!isStudent" class="admin-statistics-empty">
            当前管理员或教师账号不展示学生学习统计，也不会再请求学生选课与成绩接口。
          </div>
          <div v-else class="statistics" v-loading="statisticsLoading">
            <el-space wrap>
              <div class="stat-item">
                <div class="stat-label">选课数</div>
                <div class="stat-value">{{ statistics.coursesCount || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">完成课程</div>
                <div class="stat-value">{{ statistics.completedCourses || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">总学分</div>
                <div class="stat-value">{{ statistics.totalCredits || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">发布帖子</div>
                <div class="stat-value">{{ statistics.discussionCount || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">论坛回复</div>
                <div class="stat-value">{{ statistics.repliesCount || 0 }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">平均成绩</div>
                <div class="stat-value">{{ statistics.averageScore || '-' }}</div>
              </div>
            </el-space>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup name="ProfilePage">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { uploadApi } from '@/api/upload'
import { scoreApi } from '@/api/score'
import { studentCourseApi } from '@/api/studentCourse'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const isStudent = computed(() => userStore.isStudent)

const activeTab = ref('basic')
const userLoading = ref(false)
const userForm = ref({
  id: '',
  avatar: '',
  username: '',
  nickname: '',
  email: '',
  phone: ''
})

const getAvatarFallback = () => {
  const text = userForm.value.nickname || userForm.value.username || 'U'
  return String(text).trim().slice(0, 1).toUpperCase() || 'U'
}

const extractUploadResult = (response) => {
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
    return {
      url,
      path,
      name
    }
  }

  return {
    url: '',
    path: '',
    name: ''
  }
}

const handleAvatarChange = async (uploadFile) => {
  const rawFile = uploadFile?.raw
  if (!rawFile) {
    return
  }

  if (!String(rawFile.type || '').startsWith('image/')) {
    ElMessage.warning('请上传图片文件')
    return
  }

  const maxSize = 2 * 1024 * 1024
  if (rawFile.size > maxSize) {
    ElMessage.warning('头像大小不能超过 2MB')
    return
  }

  try {
    const response = await uploadApi.upload(rawFile, 'image')
    if (response?.code !== 1) {
      ElMessage.error(response?.msg || '头像上传失败')
      return
    }

    const uploadResult = extractUploadResult(response)
    const avatarUrl = uploadResult.url
    if (!avatarUrl) {
      ElMessage.error('头像上传成功，但未获取到图片地址')
      return
    }

    userForm.value.avatar = avatarUrl
    ElMessage.success('头像上传成功，点击保存后生效')
  } catch (error) {
    ElMessage.error(error.message || '头像上传失败')
  }
}

const updatingProfile = ref(false)
const changingPassword = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const statisticsLoading = ref(false)
const statistics = ref({
  coursesCount: 0,
  completedCourses: 0,
  totalCredits: 0,
  discussionCount: 0,
  repliesCount: 0,
  averageScore: '-'
})

const loadUserInfo = async () => {
  userLoading.value = true
  try {
    if (userStore.user) {
      userForm.value = {
        id: userStore.user.id || '',
        avatar: userStore.user.avatar || '',
        username: userStore.user.username || '',
        nickname: userStore.user.nickname || '',
        email: userStore.user.email || '',
        phone: userStore.user.phone || ''
      }
    } else {
      userStore.initUser()
      if (userStore.user) {
        userForm.value = {
          id: userStore.user.id || '',
          avatar: userStore.user.avatar || '',
          username: userStore.user.username || '',
          nickname: userStore.user.nickname || '',
          email: userStore.user.email || '',
          phone: userStore.user.phone || ''
        }
      } else {
        ElMessage.warning('未获取到用户信息，请重新登录')
      }
    }
  } catch (error) {
    ElMessage.error(error.message || '获取用户信息出错')
  } finally {
    userLoading.value = false
  }
}

const handleUpdateProfile = async () => {
  updatingProfile.value = true
  try {
    const result = await useUserStore().updateProfile(userForm.value)

    if (result.success) {
      ElMessage.success('更新成功')
    } else {
      ElMessage.error(result.message || '更新失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '更新出错')
  } finally {
    updatingProfile.value = false
  }
}

const handleChangePassword = async () => {
  if (!passwordForm.value.oldPassword) {
    ElMessage.warning('请输入旧密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.warning('新密码长度至少为6个字符')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('新密码与确认密码不一致')
    return
  }

  changingPassword.value = true
  try {
    const currentUser = userStore.user || {}
    const payload = {
      id: currentUser.id || userForm.value.id,
      password: passwordForm.value.newPassword,
      oldPassword: passwordForm.value.oldPassword
    }

    if (!payload.id) {
      ElMessage.error('未获取到用户ID，请重新登录后重试')
      return
    }

    const result = await userStore.setPassword(payload)
    if (result.success) {
      ElMessage.success('密码修改成功，请重新登录')
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }

      setTimeout(() => {
        userStore.logout()
        window.location.href = '/login'
      }, 1500)
    } else {
      ElMessage.error(result.message || '密码修改失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '修改密码出错')
  } finally {
    changingPassword.value = false
  }
}

const loadStatistics = async () => {
  if (!isStudent.value) {
    statistics.value = {
      coursesCount: 0,
      completedCourses: 0,
      totalCredits: 0,
      discussionCount: 0,
      repliesCount: 0,
      averageScore: '-'
    }
    return
  }

  statisticsLoading.value = true
  try {
    const nickname = userStore.user?.nickname
    const username = userStore.user?.username
    if (!nickname || !username) {
      statistics.value = {
        coursesCount: 0,
        completedCourses: 0,
        totalCredits: 0,
        discussionCount: 0,
        repliesCount: 0,
        averageScore: '-'
      }
      return
    }

    const [courseRes, scoreRes] = await Promise.allSettled([
      studentCourseApi.searchByUserName(nickname),
      scoreApi.getScoreByUserName(username)
    ])

    let courseList = []
    if (courseRes.status === 'fulfilled' && courseRes.value?.code === 1) {
      const data = courseRes.value.data
      if (Array.isArray(data?.rows)) {
        courseList = data.rows
      } else if (Array.isArray(data?.list)) {
        courseList = data.list
      } else if (Array.isArray(data)) {
        courseList = data
      }
    }

    let scoreList = []
    if (scoreRes.status === 'fulfilled' && scoreRes.value?.code === 1) {
      const data = scoreRes.value.data
      if (Array.isArray(data?.rows)) {
        scoreList = data.rows
      } else if (Array.isArray(data?.list)) {
        scoreList = data.list
      } else if (Array.isArray(data)) {
        scoreList = data
      }
    }

    const validScores = scoreList
      .map(item => Number(item.totalScore || item.examScore || 0))
      .filter(score => Number.isFinite(score) && score > 0)

    statistics.value = {
      coursesCount: courseList.length,
      completedCourses: courseList.filter(item => Number(item.progress) >= 100).length,
      totalCredits: 0,
      discussionCount: 0,
      repliesCount: 0,
      averageScore: validScores.length > 0
        ? (validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(2)
        : '-'
    }

    if (courseRes.status === 'rejected' && scoreRes.status === 'rejected') {
      ElMessage.warning('统计接口暂不可用，已显示默认值')
    }
  } catch (error) {
    statistics.value = {
      coursesCount: 0,
      completedCourses: 0,
      totalCredits: 0,
      discussionCount: 0,
      repliesCount: 0,
      averageScore: '-'
    }
  } finally {
    statisticsLoading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
  loadStatistics()
})
</script>

<style scoped>
.profile-container {
  width: 100%;
  padding: 30px;
  background: #ffffff;
  min-height: 100%;
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-container :deep(.el-card) {
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  width: 100%;
}

.profile-container :deep(.el-card:hover) {
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
}

.profile-container :deep(.el-card__header) {
  background: #87ceeb;
  color: white;
  border: none;
  padding: 24px;
  letter-spacing: 0.5px;
}

.profile-container :deep(.el-tabs__header) {
  border-bottom: 2px solid var(--theme-border-muted);
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.profile-container :deep(.el-tabs__active-bar) {
  background: #87ceeb;
  height: 4px;
  border-radius: 2px;
  transition: all 0.4s ease;
}

.profile-container :deep(.el-tabs__item) {
  font-weight: 600;
  color: #555;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.profile-container :deep(.el-tabs__item:hover) {
  color: var(--theme-primary);
}

.profile-container :deep(.el-tabs__item.is-active) {
  color: var(--theme-primary);
}

.admin-statistics-empty {
  padding: 28px 24px;
  border-radius: 12px;
  background: #f8fafc;
  color: #4b5563;
  line-height: 1.8;
  border: 1px solid #e5e7eb;
}

.profile-container :deep(.el-form-item__label) {
  font-weight: 700;
  color: #333;
  letter-spacing: 0.3px;
}

.profile-container :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  border-color: #e0e0e0;
}

.profile-container :deep(.el-input__wrapper:hover) {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.1);
}

.profile-container :deep(.el-input__wrapper.is-focus) {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.2);
}

.profile-container :deep(.el-input.is-focus) {
  --el-input-border-color: var(--theme-primary);
}

.profile-container :deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.2);
}

.profile-container :deep(.el-form-item) {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.avatar-uploader-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-uploader :deep(.el-upload) {
  display: inline-flex;
}

.statistics {
  padding: 20px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  width: 100%;
  animation: fadeIn 0.8s ease-out 0.2s backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.stat-item {
  padding: 30px 25px;
  background: #87ceeb;
  border-radius: 16px;
  min-width: 150px;
  text-align: center;
  color: white;
  box-shadow: 0 8px 20px rgba(var(--theme-primary-rgb), 0.2);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: #87ceeb;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.stat-item:hover::before {
  opacity: 1;
}

.stat-item:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 12px 35px rgba(var(--theme-primary-rgb), 0.35);
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>





