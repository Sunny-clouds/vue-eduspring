<template>
  <div class="home-container">
    <div class="header-section">
      <h1>你好，{{ userStore.user?.nickname || userStore.user?.username }}！</h1>
      <p>欢迎来到 EduSpring 教育学习平台</p>
    </div>

    <div class="grid-container">
      <!-- 快速导航卡片 -->
      <el-card class="nav-card" @click="goTo('/courses')">
        <div class="card-content">
          <i class="icon">📚</i>
          <h3>课程中心</h3>
          <p>浏览和选择课程</p>
        </div>
      </el-card>

      <el-card class="nav-card" @click="goTo('/scores')">
        <div class="card-content">
          <i class="icon">📊</i>
          <h3>成绩管理</h3>
          <p>查看您的成绩</p>
        </div>
      </el-card>

      <el-card class="nav-card" @click="goTo('/discussion')">
        <div class="card-content">
          <i class="icon">💬</i>
          <h3>讨论区</h3>
          <p>参与学习讨论</p>
        </div>
      </el-card>

      <el-card class="nav-card" @click="goTo('/profile')">
        <div class="card-content">
          <i class="icon">👤</i>
          <h3>个人中心</h3>
          <p>管理个人信息</p>
        </div>
      </el-card>
    </div>

    <!-- 用户信息卡片 -->
    <el-card class="info-card">
      <template #header>
        <span>个人信息</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ userStore.user?.username }}
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ userStore.user?.nickname || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ userStore.user?.email || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ userStore.user?.phone || '未设置' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup name="HomePage">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 导航到指定页面
const goTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.home-container {
  width: 100%;
  padding: 40px 30px;
  background: #ffffff;
  min-height: 100%;
  animation: slideUp 0.35s ease;
  box-sizing: border-box;
  overflow: visible;
}

@keyframes slideUp {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.header-section {
  text-align: center;
  margin-bottom: 50px;
  padding: 50px 30px;
  background: #87ceeb;
  border-radius: 20px;
  color: white;
  box-shadow: 0 15px 40px rgba(var(--theme-primary-rgb), 0.3);
  animation: fadeInDown 0.45s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.header-section h1 {
  font-size: 42px;
  color: #fff;
  margin-bottom: 15px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.header-section p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
  font-weight: 300;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 28px;
  margin-bottom: 40px;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  overflow: visible;
  position: relative;
  z-index: 2;
}

.nav-card {
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  height: 100%;
  border: none;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  transform-origin: center;
  will-change: transform, box-shadow;
  animation: cardEnter 0.6s ease-out backwards;
}

.nav-card :deep(.el-card__body) {
  padding: 0;
  overflow: hidden;
}

.nav-card:nth-child(1) { animation-delay: 0.1s; }
.nav-card:nth-child(2) { animation-delay: 0.2s; }
.nav-card:nth-child(3) { animation-delay: 0.3s; }
.nav-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.nav-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: #87ceeb;
  transition: height 0.3s ease;
  z-index: 1;
}

.nav-card:hover::before {
  height: 8px;
}

.nav-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.16);
  z-index: 5;
}

.card-content {
  text-align: center;
  padding: 40px 25px;
  width: 100%;
  box-sizing: border-box;
}

.icon {
  font-size: 48px;
  display: block;
  margin-bottom: 20px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.nav-card:hover .icon {
  transform: scale(1.2) rotate(10deg);
}

.nav-card h3 {
  font-size: 22px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 700;
  transition: color 0.3s ease;
  letter-spacing: 0.5px;
}

.nav-card:hover h3 {
  color: var(--theme-primary);
}

.nav-card p {
  font-size: 14px;
  color: #909399;
  transition: all 0.3s ease;
  font-weight: 400;
  line-height: 1.5;
}

.nav-card:hover p {
  color: #666;
}

.info-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: fadeInUp 0.8s ease-out 0.5s backwards;
  width: 100%;
  position: relative;
  z-index: 1;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.el-card__header) {
  background: #87ceeb;
  color: white;
  border: none;
  font-weight: 700;
  font-size: 18px;
  padding: 22px 24px;
  letter-spacing: 0.5px;
}

:deep(.el-descriptions__content) {
  background-color: #fafbfc;
}

:deep(.el-descriptions__label) {
  background-color: var(--theme-table-head);
  font-weight: 700;
  color: #333;
}

:deep(.el-descriptions__cell) {
  padding: 16px 24px;
}

:deep(.el-descriptions__item) {
  transition: all 0.3s ease;
}

:deep(.el-descriptions__item:hover) {
  background-color: var(--theme-surface-soft);
}
</style>







