<template>
  <div class="scores-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">成绩管理</span>
        </div>
      </template>

      <div v-if="!isStudent" class="filter-bar">
        <el-input
          v-model="searchUserName"
          placeholder="输入学生姓名搜索成绩"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearchByUserName"
        />
        <el-button type="primary" @click="handleSearchByUserName">搜索学生</el-button>

        <el-select
          v-model="selectedCourseTitle"
          placeholder="选择课程查看学生成绩"
          clearable
          style="width: 240px"
          :loading="coursesLoading"
          @change="handleSelectCourse"
        >
          <el-option
            v-for="course in teacherCourses"
            :key="course.id"
            :label="course.title || course.name"
            :value="course.title || course.name"
          />
        </el-select>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table
        :data="displayedScores"
        stripe
        style="width: 100%"
        v-loading="scoresLoading"
        :row-key="(row) => row.backendId || row.displayId"
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
        <el-table-column v-if="canManageScores" label="操作" width="120" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openScoreDialog(scope.row)">录入成绩</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="scores-mobile-list" v-loading="scoresLoading">
        <div
          v-for="item in displayedScores"
          :key="item.backendId || item.displayId"
          class="scores-mobile-card"
        >
          <div class="scores-mobile-title">{{ item.title || '-' }}</div>
          <div class="scores-mobile-meta">
            <span>ID：{{ item.displayId }}</span>
            <span>学生：{{ item.userName || '-' }}</span>
            <span>教师：{{ item.teacherName || '-' }}</span>
          </div>
          <div class="scores-mobile-grid">
            <span>平时：{{ item.usualScore ?? '-' }}</span>
            <span>考试：{{ item.examScore ?? '-' }}</span>
            <span>等级：{{ item.gradeLevel || '-' }}</span>
            <el-tag :type="getScoreType(item.totalScore)">总分 {{ item.totalScore ?? '-' }}</el-tag>
          </div>
          <div class="scores-mobile-remark">备注：{{ item.remark || '-' }}</div>
          <div v-if="canManageScores" class="scores-mobile-actions">
            <el-button type="primary" size="small" @click="openScoreDialog(item)">录入成绩</el-button>
          </div>
        </div>

        <el-empty
          v-if="!scoresLoading && displayedScores.length === 0"
          description="暂无成绩数据"
        />
      </div>

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
          <el-form-item label="学生姓名">
            <el-input v-model="scoreForm.userName" disabled />
          </el-form-item>
          <el-form-item label="平时成绩" required>
            <el-input-number v-model="scoreForm.usualScore" :min="0" :max="100" :precision="1" :step="0.5" />
          </el-form-item>
          <el-form-item label="考试成绩">
            <el-input-number v-model="scoreForm.examScore" disabled :min="0" :max="100" :precision="1" :step="0.5" />
          </el-form-item>
          <el-form-item label="总成绩">
            <el-input v-model="calculatedTotalScore" disabled />
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
import { courseApi } from '@/api/course'
import { useUserStore } from '@/stores/user'
import { normalizeTableData, addDisplayId } from '@/utils/table'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
// 教师/管理员可录入成绩；学生仅查看。
const canManageScores = computed(() => userStore.isTeacher || userStore.isAdmin)
const isStudent = computed(() => userStore.isStudent)
const scores = ref([])
const scoresLoading = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchUserName = ref('')
const selectedCourseTitle = ref('')
const teacherCourses = ref([])
const coursesLoading = ref(false)
const skipNextPaginationChange = ref(false)
const scoreDialogVisible = ref(false)
const savingScore = ref(false)
const scoreForm = ref({
  backendId: '',
  studentId: 1,
  userName: '',
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

// 计算总成绩：平时成绩 * 40% + 考试成绩 * 60%
const calculatedTotalScore = computed(() => {
  const usualScore = Number(scoreForm.value.usualScore) || 0
  const examScore = Number(scoreForm.value.examScore) || 0
  const total = usualScore * 0.4 + examScore * 0.6
  return total.toFixed(1)
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
  if (scoresLoading.value) {
    return
  }
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
    const response = await scoreApi.getScoreByNameTeacher(username)
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

const handleSelectCourse = async () => {
  const title = selectedCourseTitle.value.trim()
  if (!title) {
    // 如果清空选择，回到加载全部成绩
    if (currentPage.value !== 1 || pageSize.value !== 10) {
      skipNextPaginationChange.value = true
      currentPage.value = 1
      pageSize.value = 10
    }
    loadScores()
    return
  }

  scoresLoading.value = true
  try {
    // 调用根据课程名查询成绩的接口
    const response = await scoreApi.getScoreByCourseId(title, 1, 100)

    if (response.code === 1) {
      const { rows } = normalizeTableData(response.data)
      scores.value = rows
      total.value = rows.length
      if (currentPage.value !== 1 || pageSize.value !== 100) {
        skipNextPaginationChange.value = true
        currentPage.value = 1
        pageSize.value = 100
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
  selectedCourseTitle.value = ''
  if (currentPage.value !== 1 || pageSize.value !== 10) {
    skipNextPaginationChange.value = true
    currentPage.value = 1
    pageSize.value = 10
  }
  loadScores()
}

const loadTeacherCourses = async () => {
  if (isStudent.value) {
    return
  }

  const teacherId = userStore.user?.id
  if (!Number.isFinite(teacherId) || teacherId <= 0) {
    return
  }

  coursesLoading.value = true
  try {
    const response = await courseApi.getByTeaId(teacherId)
    if (response.code === 1) {
      const courseList = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.rows) ? response.data.rows : [])
      teacherCourses.value = courseList
    } else {
      ElMessage.warning('获取课程列表失败')
    }
  } catch (error) {
    ElMessage.warning(error.message || '获取课程列表出错')
  } finally {
    coursesLoading.value = false
  }
}

const openScoreDialog = (row) => {
  // 录入弹窗使用行数据做兜底转换，避免空值导致提交异常。
  scoreForm.value = {
    backendId: row.backendId || row.id || '',
    studentId: Number(row.studentId) || 1,
    userName: row.userName || '-',
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

  if (!scoreForm.value.backendId) {
    ElMessage.warning('缺少成绩ID')
    return
  }

  // 提交 ScoreDto 对象，包含 id、usualScore、remark
  savingScore.value = true
  try {
    const response = await scoreApi.setScore({
      id: scoreForm.value.backendId,
      usualScore: scoreForm.value.usualScore,
      remark: scoreForm.value.remark || ''
    })

    if (response.code === 1) {
      ElMessage.success('成绩保存成功')
      scoreDialogVisible.value = false
      loadScores()
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
  loadTeacherCourses()
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

.scores-mobile-list {
  display: none;
}

@media (max-width: 768px) {
  .scores-container :deep(.el-table) {
    display: none;
  }

  .scores-mobile-list {
    display: grid;
    gap: 10px;
  }

  .scores-mobile-card {
    border: 1px solid #e4ecf7;
    border-radius: 12px;
    background: #ffffff;
    padding: 12px;
  }

  .scores-mobile-title {
    font-size: 15px;
    font-weight: 700;
    color: #1f2d3d;
  }

  .scores-mobile-meta {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    color: #5f7285;
    font-size: 12px;
  }

  .scores-mobile-grid {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    color: #334155;
    font-size: 13px;
  }

  .scores-mobile-remark {
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
  }

  .scores-mobile-actions {
    margin-top: 8px;
  }
}
</style>





