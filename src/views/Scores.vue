<template>
  <div class="scores-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">成绩管理</span>
        </div>
      </template>

      <div class="statistics" v-loading="statisticsLoading">
        <el-space>
          <div class="stat-item">
            <div class="stat-label">平均成绩</div>
            <div class="stat-value">{{ statistics.averageScore || '-' }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最高成绩</div>
            <div class="stat-value">{{ statistics.maxScore || '-' }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最低成绩</div>
            <div class="stat-value">{{ statistics.minScore || '-' }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">已完成课程</div>
            <div class="stat-value">{{ statistics.completedCourses || 0 }}</div>
          </div>
        </el-space>
      </div>

      <el-divider />

      <div v-if="!isStudent" class="filter-bar">
        <el-input
          v-model="searchUserName"
          placeholder="输入学生姓名搜索成绩"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearchByUserName"
        />
        <el-button type="primary" @click="handleSearchByUserName">搜索学生</el-button>

        <el-input
          v-model="searchCourseTitle"
          placeholder="输入课程名搜索成绩"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearchByCourseId"
        />
        <el-button type="primary" @click="handleSearchByCourseId">搜索课程</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table
        :data="displayedScores"
        stripe
        style="width: 100%"
        v-loading="scoresLoading"
      >
        <el-table-column prop="displayId" label="ID" width="80" />
        <el-table-column prop="userName" label="学生名" width="100" />
        <el-table-column prop="title" label="课程名称" />
        <el-table-column prop="usualScore" label="平时成绩" width="100" align="center" />
        <el-table-column prop="examScore" label="考试成绩" width="100" align="center" />
        <el-table-column prop="totalScore" label="总成绩" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getScoreType(scope.row.totalScore)">
              {{ scope.row.totalScore }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gradeLevel" label="等级" width="80" align="center" />
        <el-table-column prop="teacherName" label="授课老师" width="100" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column v-if="canManageScores" label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openScoreDialog(scope.row)">录入成绩</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        style="text-align: right; margin-top: 20px"
        @update:current-page="(val) => { currentPage = val }"
        @update:page-size="(val) => { pageSize = val }"
        @change="handlePaginationChange"
      />

      <el-dialog v-model="scoreDialogVisible" title="录入/修改成绩" width="520px">
        <el-form :model="scoreForm" label-width="100px">
          <el-form-item label="ID">
            <el-input v-model="scoreForm.displayId" disabled />
          </el-form-item>
          <el-form-item label="学生ID" required>
            <el-input-number v-model="scoreForm.studentId" :min="1" />
          </el-form-item>
          <el-form-item label="平时成绩" required>
            <el-input-number v-model="scoreForm.usualScore" :min="0" :max="100" :precision="1" :step="0.5" />
          </el-form-item>
          <el-form-item label="考试成绩" required>
            <el-input-number v-model="scoreForm.examScore" :min="0" :max="100" :precision="1" :step="0.5" />
          </el-form-item>
          <el-form-item label="教师ID" required>
            <el-input-number v-model="scoreForm.teacherId" :min="1" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="scoreForm.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="scoreDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingScore" @click="handleSaveScore">保存</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup name="ScoresPage">
import { computed, ref, onMounted } from 'vue'
import { scoreApi } from '@/api/score'
import { useUserStore } from '@/stores/user'
import { normalizeTableData, addDisplayId } from '@/utils/table'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
// 教师/管理员可录入成绩；学生仅查看。
const canManageScores = computed(() => userStore.isTeacher || userStore.isAdmin)
const isStudent = computed(() => userStore.isStudent)
const scores = ref([])
const scoresLoading = ref(false)
const statisticsLoading = ref(false)
const statistics = ref({
  averageScore: '-',
  maxScore: '-',
  minScore: '-',
  completedCourses: 0
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchUserName = ref('')
const searchCourseTitle = ref('')
const skipNextPaginationChange = ref(false)
const scoreDialogVisible = ref(false)
const savingScore = ref(false)
const scoreForm = ref({
  backendId: '',
  displayId: '',
  studentId: 1,
  usualScore: 0,
  examScore: 0,
  teacherId: 1,
  remark: ''
})

// 展示层统一使用 displayId，避免直接显示后端主键。
const displayedScores = computed(() => {
  return addDisplayId(scores.value, currentPage.value, pageSize.value, (item) => ({
    ...item,
    backendId: item.id
  }))
})

const getCurrentNickname = () => String(userStore.user?.nickname || '').trim()

const handlePaginationChange = () => {
  // 搜索或重置主动改分页时，跳过一次自动触发，避免重复请求。
  if (skipNextPaginationChange.value) {
    skipNextPaginationChange.value = false
    return
  }
  loadScores()
}

const loadScores = async () => {
  scoresLoading.value = true
  try {
    // 学生固定查询本人；教师/管理员按分页查询全部。
    const nickname = getCurrentNickname()
    if (isStudent.value && !nickname) {
      ElMessage.warning('未获取到当前用户信息，请重新登录')
      return
    }

    const response = isStudent.value
      ? await scoreApi.getScoreByUserName(nickname)
      : await scoreApi.getScores(currentPage.value, pageSize.value)

    if (response.code === 1) {
      const { rows, total: count } = normalizeTableData(response.data)
      scores.value = rows
      total.value = count
    } else {
      ElMessage.error(response.msg || '获取成绩列表失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取成绩列表出错')
  } finally {
    scoresLoading.value = false
  }
}

const loadStatistics = async () => {
  statisticsLoading.value = true
  try {
    // 统计与列表复用同一数据源，减少额外接口依赖。
    const nickname = getCurrentNickname()
    if (isStudent.value && !nickname) {
      statistics.value = {
        averageScore: '-',
        maxScore: '-',
        minScore: '-',
        completedCourses: 0
      }
      return
    }

    const response = isStudent.value
      ? await scoreApi.getScoreByUserName(nickname)
      : await scoreApi.getScores(1, 100)

    if (response.code === 1) {
      const data = response.data
      let scoresList = []
      if (data?.rows) {
        scoresList = Array.isArray(data.rows) ? data.rows : []
      } else {
        scoresList = Array.isArray(data) ? data : (Array.isArray(data?.list) ? data.list : [])
      }

      if (Array.isArray(scoresList) && scoresList.length > 0) {
        const scores = scoresList.map(item => item.totalScore || 0).filter(s => s > 0)
        statistics.value = {
          averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '-',
          maxScore: scores.length > 0 ? Math.max(...scores) : '-',
          minScore: scores.length > 0 ? Math.min(...scores) : '-',
          completedCourses: scoresList.length
        }
      }
    }
  } catch (error) {
    ElMessage.error(error.message || '获取成绩统计出错')
  } finally {
    statisticsLoading.value = false
  }
}

const getScoreType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return ''
  if (score >= 60) return 'warning'
  return 'danger'
}

const handleSearchByUserName = async () => {
  if (isStudent.value) {
    ElMessage.warning('学生账号仅可查询本人成绩')
    return
  }

  const username = searchUserName.value.trim()
  if (!username) {
    ElMessage.warning('请输入学生姓名')
    return
  }

  // 用户名搜索后重置到第一页，确保展示结果与页码一致。
  scoresLoading.value = true
  try {
    const response = await scoreApi.getScoreByUserName(username)
    if (response.code === 1) {
      const { rows, total: count } = normalizeTableData(response.data)
      scores.value = rows
      total.value = count
      if (currentPage.value !== 1) {
        skipNextPaginationChange.value = true
        currentPage.value = 1
      }
    } else {
      ElMessage.error(response.msg || '查询成绩失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '查询成绩出错')
  } finally {
    scoresLoading.value = false
  }
}

const handleSearchByCourseId = async () => {
  const title = searchCourseTitle.value.trim()
  if (!title) {
    ElMessage.warning('请输入课程名')
    return
  }

  scoresLoading.value = true
  try {
    const nickname = getCurrentNickname()
    if (isStudent.value && !nickname) {
      ElMessage.warning('未获取到当前用户信息，请重新登录')
      return
    }

    // 学生无课程搜索接口时，走本人成绩后端返回并在前端过滤。
    const response = isStudent.value
      ? await scoreApi.getScoreByUserName(nickname)
      : await scoreApi.getScoreByCourseId(title, 1, 5)

    if (response.code === 1) {
      const { rows } = normalizeTableData(response.data)
      const filteredRows = isStudent.value
        ? rows.filter(item => String(item?.title || '').toLowerCase().includes(title.toLowerCase()))
        : rows

      scores.value = filteredRows
      total.value = filteredRows.length
      if (currentPage.value !== 1 || pageSize.value !== 5) {
        skipNextPaginationChange.value = true
        currentPage.value = 1
        pageSize.value = 5
      }
    } else {
      ElMessage.error(response.msg || '查询成绩失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '查询成绩出错')
  } finally {
    scoresLoading.value = false
  }
}

const resetSearch = () => {
  // 重置搜索条件和分页参数后重新拉取默认列表。
  searchUserName.value = ''
  searchCourseTitle.value = ''
  if (currentPage.value !== 1 || pageSize.value !== 10) {
    skipNextPaginationChange.value = true
    currentPage.value = 1
    pageSize.value = 10
  }
  loadScores()
}

const openScoreDialog = (row) => {
  // 录入弹窗使用行数据做兜底转换，避免空值导致提交异常。
  scoreForm.value = {
    backendId: row.backendId || row.id || '',
    displayId: row.displayId || '',
    studentId: Number(row.studentId) || 1,
    usualScore: Number(row.usualScore) || 0,
    examScore: Number(row.examScore) || 0,
    teacherId: Number(row.teacherId) || Number(userStore.user?.id) || 1,
    remark: row.remark || ''
  }
  scoreDialogVisible.value = true
}

const handleSaveScore = async () => {
  if (!canManageScores.value) {
    ElMessage.warning('仅教师或管理员账号可录入成绩')
    return
  }

  if (!scoreForm.value.backendId || !scoreForm.value.studentId) {
    ElMessage.warning('缺少成绩ID或学生ID')
    return
  }

  // 提交统一映射为后端 setScore 所需参数结构。
  savingScore.value = true
  try {
    const response = await scoreApi.setScore({
      id: scoreForm.value.backendId,
      studentId: scoreForm.value.studentId,
      usualScore: scoreForm.value.usualScore,
      examScore: scoreForm.value.examScore,
      teacherId: scoreForm.value.teacherId,
      remark: scoreForm.value.remark || ''
    })

    if (response.code === 1) {
      ElMessage.success('成绩保存成功')
      scoreDialogVisible.value = false
      loadScores()
      loadStatistics()
    } else {
      ElMessage.error(response.msg || '成绩保存失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '成绩保存出错')
  } finally {
    savingScore.value = false
  }
}

onMounted(() => {
  loadScores()
  loadStatistics()
})
</script>

<style scoped>
.scores-container {
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

.scores-container :deep(.el-card) {
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  width: 100%;
}

.scores-container :deep(.el-card:hover) {
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

.scores-container :deep(.el-card__header) {
  background: #87ceeb;
  color: white;
  border: none;
  padding: 24px;
  letter-spacing: 0.5px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 8px 0 18px;
}

.statistics {
  margin-bottom: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
  color: white;
  box-shadow: 0 8px 20px rgba(var(--theme-primary-rgb), 0.2);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: center;
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

.scores-container :deep(.el-divider) {
  background-color: var(--theme-border-muted);
  margin: 30px 0;
  transition: all 0.3s ease;
}

.scores-container :deep(.el-table) {
  background-color: transparent;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  table-layout: auto;
}

.scores-container :deep(.el-table__wrapper) {
  overflow-x: auto;
  overflow-y: hidden;
}

.scores-container :deep(.el-table__header th) {
  background-color: var(--theme-table-head);
  color: #333;
  font-weight: 700;
  border-bottom: 2px solid var(--theme-primary);
  transition: all 0.3s ease;
}

.scores-container :deep(.el-table__header th:hover) {
  background-color: var(--theme-table-head-hover);
}

.scores-container :deep(.el-table__body tr:hover > td) {
  background-color: var(--theme-surface-soft) !important;
  transition: background-color 0.3s ease;
}

.scores-container :deep(.el-table__body tr) {
  background-color: white;
  transition: all 0.3s ease;
}

.scores-container :deep(.el-tag) {
  border: none;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.scores-container :deep(.el-tag:hover) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.scores-container :deep(.el-tag.is-success) {
  background: #87ceeb;
  color: white;
}

.scores-container :deep(.el-tag.is-warning) {
  background: #87ceeb;
  color: white;
}

.scores-container :deep(.el-tag.is-danger) {
  background: #87ceeb;
  color: white;
}

.scores-container :deep(.el-pagination) {
  margin-top: 25px;
  text-align: right;
  transition: all 0.3s ease;
}

.scores-container :deep(.el-pagination button:hover) {
  color: var(--theme-primary);
}
</style>





