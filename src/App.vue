<template>
  <div class="app">
    <!-- 导航栏 -->
    <el-header v-if="showNavbar" class="app-header">
      <div class="nav-container">
        <div class="nav-logo">EduSpring</div>
        <el-menu
          router
          mode="horizontal"
          :default-active="activeMenu"
          class="nav-menu"
        >
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item index="/courses">课程</el-menu-item>
          <el-menu-item index="/scores">成绩</el-menu-item>
          <el-menu-item index="/discussion">讨论</el-menu-item>
          <el-menu-item index="/profile">个人中心</el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/users">用户管理</el-menu-item>
        </el-menu>
        <div class="nav-user">
          <el-avatar :size="36" :src="userStore.user?.avatar || ''" class="nav-user-avatar">
            {{ avatarFallback }}
          </el-avatar>
          <div class="nav-user-meta">
            <div class="nav-user-name">{{ displayName }}</div>
            <div class="nav-user-role">{{ roleLabel }}</div>
          </div>
          <el-button class="nav-logout" @click="handleLogout" aria-label="登出">
            <el-icon><SwitchButton /></el-icon>
            <span class="nav-logout-text">登出</span>
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 页面内容 -->
    <div class="app-container" :class="{ 'app-container-auth': isAuthPage }">
      <router-view v-slot="{ Component, route: currentRoute }">
        <component
          v-if="isAuthPath(currentRoute.path)"
          :is="Component"
          :key="String(currentRoute.name || currentRoute.path)"
        />
        <transition v-else name="route-fade" mode="out-in">
          <keep-alive :include="keepAliveViews">
            <component :is="Component" :key="String(currentRoute.name || currentRoute.path)" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 初始化用户信息
onMounted(() => {
  userStore.initUser()
})

// 判断是否显示导航栏
const showNavbar = computed(() => {
  return userStore.isLoggedIn && !['/login', '/register'].includes(route.path)
})

const isAuthPath = (path) => ['/login', '/register'].includes(path)

const isAuthPage = computed(() => {
  return isAuthPath(route.path)
})

// 获取当前活跃菜单
const activeMenu = computed(() => {
  return route.path
})

const keepAliveViews = ['Courses', 'Scores', 'Discussion', 'Users']

const displayName = computed(() => {
  return userStore.user?.nickname || userStore.user?.username || '用户'
})

const avatarFallback = computed(() => {
  return String(displayName.value).trim().slice(0, 1).toUpperCase() || 'U'
})

const roleLabel = computed(() => {
  if (userStore.isAdmin) {
    return '管理员'
  }
  if (userStore.isTeacher) {
    return '教师'
  }
  if (userStore.isStudent) {
    return '学生'
  }

  return '普通用户'
})

// 登出
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已登出')
  router.push('/login')
}
</script>

<style>
:root {
  --theme-primary: #87ceeb;
  --theme-secondary: #87ceeb;
  --theme-primary-rgb: 135, 206, 235;
  --theme-surface-soft: #eaf6fd;
  --theme-surface-accent: #d8eefb;
  --theme-table-head: #dff1fc;
  --theme-table-head-hover: #cfe9fa;
  --theme-border-muted: #b9ddf2;
  --el-color-primary: #409eff;
  --el-color-primary-light-3: #79bbff;
  --el-color-primary-light-5: #a0cfff;
  --el-color-primary-light-7: #c6e2ff;
  --el-color-primary-light-8: #d9ecff;
  --el-color-primary-light-9: #ecf5ff;
  --el-color-primary-dark-2: #337ecc;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--theme-surface-soft);
  overflow: hidden;
}

html,
body,
#app {
  height: 100%;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  background: #2e5a6f;
  border-bottom: 1px solid #3f7188;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  height: 70px;
  padding: 0 30px;
  width: 100%;
}

.nav-logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  margin-right: 50px;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.nav-logo::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #87ceeb;
  box-shadow: 0 0 0 6px rgba(var(--theme-primary-rgb), 0.14);
}

.nav-menu {
  flex: 1;
  border: none !important;
  background-color: transparent;
  --el-menu-text-color: #ffffff;
  --el-menu-hover-text-color: #ffffff;
  --el-menu-active-color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.nav-menu :deep(.el-menu-item) {
  border: none !important;
  border-radius: 999px;
  transition: all 0.25s ease;
  color: #ffffff;
  font-weight: 600;
  padding: 0 18px !important;
  height: auto;
  line-height: 42px;
  margin: 0;
}

.nav-menu :deep(.el-menu-item:hover) {
  background-color: rgba(var(--theme-primary-rgb), 0.1) !important;
  color: #ffffff;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: #87ceeb !important;
  box-shadow: 0 8px 16px rgba(var(--theme-primary-rgb), 0.25);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  padding: 0;
}

.nav-user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.16);
  background: #87ceeb;
  color: #fff;
  font-weight: 700;
}

.nav-user-meta {
  display: flex;
  flex-direction: column;
  min-width: 88px;
  margin-right: 2px;
}

.nav-user-name {
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
  line-height: 1.2;
}

.nav-user-role {
  font-size: 12px;
  color: #ffffff;
  line-height: 1.2;
  margin-top: 2px;
}

.nav-logout {
  height: 32px;
  width: 32px;
  min-width: 32px;
  border: none;
  border-radius: 999px;
  padding: 0;
  font-weight: 600;
  color: #ffffff;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  overflow: hidden;
  transition: width 0.22s ease, color 0.2s ease, background-color 0.2s ease;
}

.nav-logout:hover {
  color: #ffffff;
  background-color: rgba(var(--theme-primary-rgb), 0.14);
  width: 74px;
  justify-content: flex-start;
  padding: 0 10px;
  gap: 6px;
}

.nav-logout-text {
  max-width: 0;
  opacity: 0;
  white-space: nowrap;
  font-size: 13px;
  transition: max-width 0.2s ease, opacity 0.16s ease;
}

.nav-logout:hover .nav-logout-text {
  max-width: 34px;
  opacity: 1;
}

.app-container {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  background: var(--theme-surface-soft);
  width: 100%;
}

.app-container-auth {
  background: #ffffff;
}

.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity 0.34s cubic-bezier(0.22, 1, 0.36, 1), transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), filter 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}

.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
  transform: scale(0.985);
  filter: blur(2px);
}

.route-fade-enter-to,
.route-fade-leave-from {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

@media (max-width: 992px) {
  .nav-container {
    padding: 0 14px;
    height: 64px;
  }

  .nav-logo {
    font-size: 18px;
    margin-right: 18px;
  }

  .nav-menu :deep(.el-menu-item) {
    padding: 0 12px !important;
    line-height: 36px;
    font-size: 13px;
  }

  .nav-menu {
    overflow-x: auto;
    gap: 6px;
  }

  .nav-user {
    padding: 0;
    gap: 8px;
  }

  .nav-user-meta {
    display: none;
  }

  .nav-logout {
    height: 28px;
    width: 28px;
    min-width: 28px;
    padding: 0;
    font-size: 12px;
  }

  .nav-logout:hover {
    width: 28px;
    justify-content: center;
    padding: 0;
    gap: 0;
  }

  .nav-logout-text {
    display: none;
  }
}
</style>







