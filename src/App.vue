<template>
  <div class="app">
    <template v-if="isAuthPage">
      <div class="auth-container">
        <router-view />
      </div>
    </template>

    <template v-else-if="isAdminLayout">
      <div class="admin-layout" :class="{ collapsed: isSidebarCollapsed }">
        <aside class="admin-sidebar">
          <div class="sidebar-logo">EduSpring Admin</div>
          <el-menu
            router
            :default-active="activeMenu"
            class="sidebar-menu"
            :collapse="isSidebarCollapsed"
            :collapse-transition="false"
            background-color="#304156"
            text-color="#bfcbd9"
            active-text-color="#409eff"
          >
            <el-menu-item index="/admin">
              <el-icon><House /></el-icon>
              <template #title>后台首页</template>
            </el-menu-item>
            <el-menu-item index="/users">
              <el-icon><User /></el-icon>
              <template #title>用户管理</template>
            </el-menu-item>
            <el-menu-item index="/courses">
              <el-icon><Reading /></el-icon>
              <template #title>课程管理</template>
            </el-menu-item>
            <el-menu-item index="/discussion">
              <el-icon><ChatDotRound /></el-icon>
              <template #title>讨论管理</template>
            </el-menu-item>
            <el-menu-item index="/profile">
              <el-icon><Setting /></el-icon>
              <template #title>个人设置</template>
            </el-menu-item>
          </el-menu>
        </aside>

        <section class="admin-main">
          <header class="admin-header">
            <div class="admin-topbar">
              <div class="admin-topbar-left">
                <el-button class="collapse-btn" text @click="toggleSidebar">
                  <el-icon>
                    <Fold v-if="!isSidebarCollapsed" />
                    <Expand v-else />
                  </el-icon>
                </el-button>
                <el-breadcrumb separator="/" class="admin-breadcrumb">
                  <el-breadcrumb-item :to="{ path: '/admin' }">后台</el-breadcrumb-item>
                  <el-breadcrumb-item v-if="activeMenu !== '/admin'">{{ currentPageTitle }}</el-breadcrumb-item>
                </el-breadcrumb>
              </div>

              <div class="admin-user-box">
                <el-avatar :size="32" :src="userStore.user?.avatar || ''" class="admin-user-avatar">
                  {{ avatarFallback }}
                </el-avatar>
                <span class="admin-user-name">{{ displayName }}</span>
                <el-button type="primary" plain size="small" @click="handleLogout">登出</el-button>
              </div>
            </div>

            <div class="tags-view">
              <el-tag
                v-for="tag in visitedViews"
                :key="tag.path"
                class="tags-view-item"
                :effect="activeMenu === tag.path ? 'dark' : 'plain'"
                :closable="tag.path !== '/admin'"
                @click="goToTag(tag)"
                @close="closeTag(tag)"
              >
                {{ tag.title }}
              </el-tag>
            </div>
          </header>

          <main class="admin-content">
            <router-view v-slot="{ Component, route: currentRoute }">
              <transition name="route-fade" mode="out-in">
                <keep-alive :include="keepAliveViews">
                  <component :is="Component" :key="String(currentRoute.name || currentRoute.path)" />
                </keep-alive>
              </transition>
            </router-view>
          </main>
        </section>
      </div>
    </template>

    <template v-else>
      <el-header class="app-header">
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

      <div class="app-container">
        <router-view v-slot="{ Component, route: currentRoute }">
          <transition name="route-fade" mode="out-in">
            <keep-alive :include="keepAliveViews">
              <component :is="Component" :key="String(currentRoute.name || currentRoute.path)" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import {
  SwitchButton,
  Fold,
  Expand,
  House,
  User,
  Reading,
  ChatDotRound,
  Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isSidebarCollapsed = ref(false)

onMounted(() => {
  userStore.initUser()
})

const isAuthPath = (path) => ['/login', '/register'].includes(path)

const isAuthPage = computed(() => {
  return isAuthPath(route.path)
})

const isAdminLayout = computed(() => {
  return userStore.isLoggedIn && userStore.isAdmin && !isAuthPage.value
})

const activeMenu = computed(() => {
  if (route.path.startsWith('/discussion/')) {
    return '/discussion'
  }
  return route.path
})

const keepAliveViews = ['Courses', 'Scores', 'Discussion', 'Users', 'AdminDashboard']

const pageTitleMap = {
  '/admin': '后台首页',
  '/users': '用户管理',
  '/courses': '课程管理',
  '/discussion': '讨论管理',
  '/profile': '个人设置'
}

const currentPageTitle = computed(() => {
  return pageTitleMap[activeMenu.value] || '后台管理'
})

const visitedViews = ref([
  { path: '/admin', title: '后台首页' }
])

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

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const resolvePageTitle = (path) => {
  return pageTitleMap[path] || '页面'
}

const addVisitedView = (path) => {
  if (!path || !isAdminLayout.value) {
    return
  }
  if (visitedViews.value.some(item => item.path === path)) {
    return
  }
  visitedViews.value.push({
    path,
    title: resolvePageTitle(path)
  })
}

const goToTag = (tag) => {
  if (!tag?.path) return
  router.push(tag.path)
}

const closeTag = (tag) => {
  if (!tag?.path || tag.path === '/admin') {
    return
  }

  const index = visitedViews.value.findIndex(item => item.path === tag.path)
  if (index === -1) {
    return
  }

  const isClosingActive = activeMenu.value === tag.path
  visitedViews.value.splice(index, 1)

  if (isClosingActive) {
    const fallback = visitedViews.value[index - 1] || visitedViews.value[index] || visitedViews.value[0]
    router.push(fallback?.path || '/admin')
  }
}

watch(
  () => activeMenu.value,
  (menuPath) => {
    addVisitedView(menuPath)
  },
  { immediate: true }
)

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

html,
body,
#app {
  height: 100%;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  background: #f0f2f5;
}

.app {
  height: 100vh;
  overflow: hidden;
}

.auth-container {
  height: 100%;
  background: #ffffff;
}

.admin-layout {
  display: flex;
  height: 100%;
  background: #f0f2f5;
  animation: adminLoginEnter 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-sidebar {
  width: 210px;
  background: #304156;
  transition: width 0.28s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  animation: adminSidebarEnter 0.36s ease-out;
}

.admin-layout.collapsed .admin-sidebar {
  width: 64px;
}

.sidebar-logo {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  font-size: 16px;
  color: #ffffff;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-menu {
  border-right: none;
  flex: 1;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #263445 !important;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  animation: adminMainEnter 0.45s ease-out;
}

.admin-header {
  background: #ffffff;
  border-bottom: 1px solid #dfe6ec;
}

.admin-topbar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 10px;
}

.admin-topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collapse-btn {
  font-size: 18px;
  color: #303133;
}

.page-title {
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

.admin-breadcrumb {
  margin-left: 4px;
}

.admin-breadcrumb :deep(.el-breadcrumb__inner.is-link),
.admin-breadcrumb :deep(.el-breadcrumb__inner) {
  color: #606266;
  font-weight: 500;
}

.admin-breadcrumb :deep(.el-breadcrumb__inner.is-link:hover) {
  color: #409eff;
}

.admin-user-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-user-avatar {
  background: #409eff;
  color: #ffffff;
  font-weight: 700;
}

.admin-user-name {
  color: #303133;
  font-size: 14px;
}

.admin-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background: #f0f2f5;
}

.tags-view {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid #f0f2f5;
  overflow-x: auto;
  background: #ffffff;
}

.tags-view-item {
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.app-header {
  background: #2e5a6f;
  border-bottom: 1px solid #3f7188;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
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
  display: inline-flex;
  align-items: center;
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  margin-right: 50px;
}

.nav-menu {
  flex: 1;
  border: none !important;
  background-color: transparent;
  --el-menu-text-color: #ffffff;
  --el-menu-hover-text-color: #ffffff;
  --el-menu-active-color: #ffffff;
}

.nav-menu :deep(.el-menu-item) {
  border: none !important;
  border-radius: 999px;
  transition: all 0.25s ease;
  color: #ffffff;
  font-weight: 600;
  padding: 0 18px !important;
  line-height: 42px;
}

.nav-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: #87ceeb !important;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.9);
  background: #87ceeb;
  color: #fff;
  font-weight: 700;
}

.nav-user-meta {
  display: flex;
  flex-direction: column;
}

.nav-user-name {
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
}

.nav-user-role {
  font-size: 12px;
  color: #ffffff;
}

.nav-logout {
  height: 32px;
  width: 32px;
  min-width: 32px;
  border: none;
  border-radius: 999px;
  padding: 0;
  color: #ffffff;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: width 0.22s ease, background-color 0.2s ease;
}

.nav-logout:hover {
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
  height: calc(100% - 70px);
  overflow: auto;
  background: var(--theme-surface-soft);
}

.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@keyframes adminLoginEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes adminSidebarEnter {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes adminMainEnter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 992px) {
  .admin-sidebar {
    width: 64px;
  }

  .sidebar-logo {
    font-size: 0;
    padding: 0;
    justify-content: center;
  }

  .admin-layout.collapsed .admin-sidebar {
    width: 64px;
  }

  .admin-user-name {
    display: none;
  }

  .admin-breadcrumb {
    display: none;
  }

  .nav-container {
    padding: 0 14px;
  }

  .nav-user-meta {
    display: none;
  }
}
</style>







