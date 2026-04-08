<template>
  <div class="exam-student-paper-page">
    <el-card class="exam-student-paper-card" v-loading="loading">
      <template #header>
        <div class="page-header">
          <div>
            <div class="title">考试成绩列表</div>
            <div class="sub-title">查看并管理学生考试成绩</div>
          </div>
          <el-button plain @click="goBack">返回</el-button>
        </div>
      </template>

      <div class="meta-row">
        <span v-if="activityTitle">活动：{{ activityTitle }}</span>
        <span v-if="courseTitle">课程：{{ courseTitle }}</span>
      </div>

      <el-table
        :data="rows"
        stripe
        style="width: 100%"
        empty-text="暂无考试成绩"
      >
        <el-table-column label="序号" width="90" align="center">
          <template #default="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="nickName" label="学生姓名" min-width="240" />
        <el-table-column prop="attempt" label="考试次数" width="140" align="center" />
        <el-table-column prop="score" label="分数" width="140" align="center" />
        <el-table-column v-if="canOperate" label="操作" width="140" align="center">
          <template #default="scope">
            <el-button
              type="danger"
              link
              :disabled="deletingId === scope.row.backendId"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examApi } from '@/api/exam'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const deletingId = ref(null)
const rows = ref([])

const activityId = computed(() => Number(route.params.id))
const activityTitle = computed(() => String(route.query.activityTitle || '').trim())
const courseTitle = computed(() => String(route.query.courseTitle || '').trim())
const canOperate = computed(() => userStore.isAdmin || userStore.isTeacher)

const normalizeStudentPaperRows = (data) => {
  const list = Array.isArray(data?.rows)
    ? data.rows
    : (Array.isArray(data?.list)
      ? data.list
      : (Array.isArray(data) ? data : []))

  return list.map((item = {}) => {
    const backendId = Number(item.id)
    const attempt = Number(item.attempt)
    const score = Number(item.totalScore ?? item.score)
    return {
      backendId: Number.isFinite(backendId) && backendId > 0 ? backendId : null,
      nickName: String(item.nickName || item.nickname || item.name || '-').trim() || '-',
      attempt: Number.isFinite(attempt) ? attempt : 0,
      score: Number.isFinite(score) ? score : 0
    }
  })
}

const handleDelete = async (row) => {
  if (!canOperate.value) {
    ElMessage.warning('仅教师或管理员可执行删除操作')
    return
  }

  const backendId = Number(row?.backendId)
  if (!Number.isFinite(backendId) || backendId <= 0) {
    ElMessage.warning('未获取到有效成绩ID，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm('确认删除该学生考试成绩记录吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(error.message || '删除确认失败')
    return
  }

  deletingId.value = backendId
  try {
    const response = await examApi.delById(backendId)
    if (response?.code === 1) {
      rows.value = rows.value.filter(item => Number(item.backendId) !== backendId)
      ElMessage.success(response?.msg || '删除成功')
      return
    }
    ElMessage.warning(response?.msg || '删除失败')
  } catch (error) {
    ElMessage.error(error.message || '删除出错')
  } finally {
    deletingId.value = null
  }
}

const loadStudentPapers = async () => {
  if (!Number.isFinite(activityId.value) || activityId.value <= 0) {
    ElMessage.warning('活动ID无效，无法查询考试成绩')
    return
  }

  if (!canOperate.value) {
    ElMessage.warning('仅教师或管理员可查看考试成绩')
    return
  }

  loading.value = true
  try {
    const response = await examApi.getAllStudentPaper(activityId.value)
    if (response?.code === 1) {
      rows.value = normalizeStudentPaperRows(response?.data)
      ElMessage.success(`已获取考试成绩，共 ${rows.value.length} 条`)
      return
    }
    ElMessage.warning(response?.msg || '获取考试成绩失败')
  } catch (error) {
    ElMessage.error(error.message || '获取考试成绩出错')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  const cid = Number(route.query.courseId)
  if (Number.isFinite(cid) && cid > 0) {
    router.push({
      name: 'CourseLearn',
      params: { id: cid },
      query: {
        title: route.query.courseTitle || '',
        teacherName: route.query.teacherName || ''
      }
    })
    return
  }
  router.back()
}

onMounted(async () => {
  await loadStudentPapers()
})
</script>

<style scoped>
.exam-student-paper-page {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 10% 8%, rgba(46, 134, 255, 0.12), transparent 30%),
    radial-gradient(circle at 86% 6%, rgba(19, 191, 129, 0.1), transparent 24%),
    #f7fbff;
}

.exam-student-paper-card {
  max-width: 980px;
  margin: 0 auto;
  border-radius: 14px;
  border: 1px solid #dfe9f8;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2d3d;
}

.sub-title {
  margin-top: 4px;
  color: #6b7c93;
  font-size: 13px;
}

.meta-row {
  margin-bottom: 14px;
  color: #4a5f78;
  font-size: 14px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .exam-student-paper-page {
    padding: 14px;
  }
}
</style>
