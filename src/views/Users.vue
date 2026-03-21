<template>
  <div class="users-page">
    <div class="users-container">
      <el-card class="users-card">
        <template #header>
          <span class="title">用户管理</span>
        </template>
        <div class="toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入用户名查询"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">查询用户</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        <div class="table-wrap">
          <el-table :data="sortedUserList" style="width: 100%" v-loading="loading" class="users-table" size="large" border stripe>
        <el-table-column prop="displayId" label="ID" width="80" />
        <el-table-column label="头像" width="90" align="center">
          <template #default="scope">
            <el-image
              v-if="scope.row.avatar"
              :src="scope.row.avatar"
              :preview-src-list="[scope.row.avatar]"
              :initial-index="0"
              preview-teleported
              fit="cover"
              class="table-avatar-image"
            />
            <el-avatar v-else :size="36">
              {{ getAvatarFallback(scope.row) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="nickname" label="昵称" min-width="150" />
        <el-table-column prop="email" label="邮箱" min-width="260" />
        <el-table-column prop="phone" label="手机号" min-width="180" />
        <el-table-column prop="role" label="角色" min-width="120" />
        <el-table-column label="状态" width="110" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" effect="light">
              {{ scope.row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="190" />
        <el-table-column prop="updateTime" label="修改时间" min-width="190" />
        <el-table-column label="操作" min-width="320" fixed="right">
          <template #default="scope">
            <el-space>
              <el-dropdown @command="(roleCode) => handleSetRole(scope.row, roleCode)">
                <el-button size="small" type="primary" plain>修改身份</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="admin">设为管理员</el-dropdown-item>
                    <el-dropdown-item command="teacher">设为教师</el-dropdown-item>
                    <el-dropdown-item command="student">设为学生</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <el-button
                size="small"
                :type="scope.row.status === 1 ? 'warning' : 'success'"
                @click="handleToggleStatus(scope.row)"
              >
                {{ scope.row.status === 1 ? '禁用账号' : '启用账号' }}
              </el-button>

              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
          </el-table>
        </div>
        <div style="margin-top: 16px; text-align: right;">
          <el-pagination
            background
            layout="prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="pageNum"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { adminApi } from '@/api/admin'
import { addDisplayId } from '@/utils/table'
import { normalizeRoleCode, roleCodeToDisplay } from '@/utils/role'
import { ElMessage, ElMessageBox } from 'element-plus'

const userList = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const searchKeyword = ref('')

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const normalizeUserRow = (row = {}) => {
  const normalizedStatus = Number(row.status)

  return {
    id: row.id ?? '',
    avatar: row.avatar || '',
    username: row.username || row.userName || '',
    nickname: row.nickname || row.nickName || '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role || row.roleCode || row.role_code || '',
    status: Number.isNaN(normalizedStatus) ? 1 : normalizedStatus,
    statusText: Number(normalizedStatus) === 0 ? '禁用' : '启用',
    createTime: formatDateTime(row.createTime),
    updateTime: formatDateTime(row.updateTime),
    raw: { ...row }
  }
}

const getAvatarFallback = (row = {}) => {
  const text = row.nickname || row.username || 'U'
  return String(text).trim().slice(0, 1).toUpperCase() || 'U'
}

const sortedUserList = computed(() => {
  return addDisplayId(userList.value, pageNum.value, pageSize.value)
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const keyword = String(searchKeyword.value || '').trim()
    const res = keyword
      ? await adminApi.getByNickName(keyword)
      : await adminApi.getUsers(pageNum.value, pageSize.value)

    if (res.code === 1 && res.data) {
      if (keyword) {
        const raw = Array.isArray(res.data)
          ? res.data
          : (res.data?.rows || res.data?.records || res.data?.list || (res.data ? [res.data] : []))
        const rows = Array.isArray(raw) ? raw : []
        userList.value = rows.map(normalizeUserRow)
        total.value = rows.length
      } else {
        const rows = res.data.rows || res.data.records || res.data.list || []
        userList.value = Array.isArray(rows) ? rows.map(normalizeUserRow) : []
        total.value = res.data.total || 0
      }
    } else {
      ElMessage.error(res.msg || '没有此用户信息')
    }
  } catch (e) {
    ElMessage.error(e.message || '请求出错')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val) => {
  pageNum.value = val
  fetchUsers()
}

const handleSearch = () => {
  pageNum.value = 1
  fetchUsers()
}

const resetSearch = () => {
  searchKeyword.value = ''
  pageNum.value = 1
  fetchUsers()
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除用户 ${row.username || row.id} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })

    const res = await adminApi.deleteById(row.id)
    if (res?.code === 1) {
      ElMessage.success('删除成功')
      fetchUsers()
      return
    }

    ElMessage.error(res?.msg || '删除失败')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

const handleSetRole = async (row, roleCode) => {
  const currentRoleCode = normalizeRoleCode(row.role)
  if (currentRoleCode === roleCode) {
    ElMessage.info('该用户已是当前身份')
    return
  }

  try {
    const res = await adminApi.setRole(row.id, roleCode)
    if (res?.code === 1) {
      row.role = roleCodeToDisplay(roleCode)
      row.raw = { ...row.raw, role: row.role, roleCode }
      ElMessage.success('身份修改成功')
      return
    }
    ElMessage.error(res?.msg || '身份修改失败')
  } catch (error) {
    ElMessage.error(error?.message || '身份修改失败')
  }
}

const handleToggleStatus = async (row) => {
  const nextStatus = row.status === 1 ? 0 : 1

  try {
    const res = await adminApi.setStatus(row.id, nextStatus)
    if (res?.code === 1) {
      row.status = nextStatus
      row.statusText = nextStatus === 1 ? '启用' : '禁用'
      row.raw = { ...row.raw, status: nextStatus }
      ElMessage.success(nextStatus === 1 ? '账号已启用' : '账号已禁用')
      return
    }

    ElMessage.error(res?.msg || '状态更新失败')
  } catch (error) {
    ElMessage.error(error?.message || '状态更新失败')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-page {
  width: 100%;
  min-height: 100%;
  padding: 12px 0 20px;
  box-sizing: border-box;
  background: #ffffff;
}

.users-container {
  max-width: 2200px;
  width: calc(100vw - 24px);
  margin: 0 auto;
  animation: pageFadeIn 0.4s ease-out;
}

.users-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.users-card :deep(.el-card__body) {
  padding: 14px 10px 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.search-input {
  width: 280px;
}

.users-card:hover {
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
  border-radius: 10px;
}

.users-table {
  min-width: 1860px;
}

.users-table :deep(.el-table__cell) {
  padding: 10px 0;
}

.users-table :deep(.el-table__header-wrapper th) {
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
}

.users-table :deep(.cell) {
  padding: 0 18px;
  line-height: 22px;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
}

.table-avatar-image {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: zoom-in;
  border: 1px solid #e5e7eb;
}

.title {
  font-size: 20px;
  font-weight: bold;
}
</style>







