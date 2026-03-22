<template>
  <div class="admin-dashboard">
    <div class="hero">
      <h1>后台管理中心</h1>
      <p>你好，{{ userStore.user?.nickname || userStore.user?.username }}，欢迎进入管理员控制台。</p>
    </div>

    <div class="admin-grid">
      <el-card class="admin-card" @click="goTo('/users')">
        <div class="card-title">用户管理</div>
        <div class="card-desc">维护用户、调整身份、管理账号状态</div>
      </el-card>

      <el-card class="admin-card" @click="goTo('/courses')">
        <div class="card-title">课程管理</div>
        <div class="card-desc">查看课程列表并执行课程维护操作</div>
      </el-card>

      <el-card class="admin-card" @click="goTo('/discussion')">
        <div class="card-title">讨论管理</div>
        <div class="card-desc">查看讨论区内容并处理异常信息</div>
      </el-card>

      <el-card class="admin-card" @click="goTo('/profile')">
        <div class="card-title">个人设置</div>
        <div class="card-desc">修改个人资料与安全信息</div>
      </el-card>
    </div>
  </div>
</template>

<script setup name="AdminDashboardPage">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const goTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.admin-dashboard {
  width: 100%;
  min-height: 100%;
  padding: 36px 28px;
  background: #ffffff;
  box-sizing: border-box;
}

.hero {
  padding: 36px 28px;
  border-radius: 18px;
  color: #ffffff;
  background: linear-gradient(135deg, #2e5a6f 0%, #4b8198 100%);
  box-shadow: 0 14px 30px rgba(46, 90, 111, 0.25);
}

.hero h1 {
  font-size: 30px;
  margin-bottom: 10px;
}

.hero p {
  font-size: 15px;
  opacity: 0.95;
}

.admin-grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.admin-card {
  cursor: pointer;
  border-radius: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.admin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.card-title {
  font-size: 18px;
  color: #1f2937;
  font-weight: 700;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}
</style>
