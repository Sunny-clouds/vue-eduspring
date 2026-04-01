<template>
  <div class="question-bank-page">
    <el-card class="question-bank-card">
      <template #header>
        <div class="card-header">
          <span class="title">教师题库</span>
          <el-button type="primary" @click="openCreateDialog">新增题目</el-button>
        </div>
      </template>

      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="按题干搜索"
          clearable
          class="search-input"
        />
        <el-select v-model="filterType" placeholder="按题型筛选" clearable class="course-filter">
          <el-option
            v-for="type in typeOptions"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
        <el-button @click="resetFilter">重置</el-button>
      </div>

      <el-table :data="pagedQuestions" v-loading="loading" stripe border>
        <el-table-column prop="displayId" label="序号" width="80" />
        <el-table-column prop="title" label="课程" min-width="160" show-overflow-tooltip />
        <el-table-column label="题型" width="100" align="center">
          <template #default="scope">
            {{ formatTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="content" label="题干" min-width="260" show-overflow-tooltip />
        <el-table-column label="答案" width="90" align="center">
          <template #default="scope">
            {{ formatAnswerText(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分值" width="90" align="center" />
        <el-table-column label="难度" width="110" align="center">
          <template #default="scope">
            {{ formatDifficultyText(scope.row.difficulty) }}
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="170" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="filteredQuestions.length"
          :page-size="pageSize"
          :current-page="pageNum"
          :page-sizes="[10, 20, 50]"
          @update:current-page="handleCurrentPageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑题目' : '新增题目'"
      width="760px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="95px">
        <el-form-item label="题型" prop="type">
          <el-select v-model="form.type" placeholder="请选择题型">
            <el-option
              v-for="option in typeFormOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="请选择课程" filterable>
            <el-option
              v-for="course in courseOptions"
              :key="course.value"
              :label="course.label"
              :value="course.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题干" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-row v-if="requiresOptionInputs" :gutter="12">
          <el-col :span="12">
            <el-form-item label="选项A" prop="optionA">
              <el-input v-model="form.optionA" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选项B" prop="optionB">
              <el-input v-model="form.optionB" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选项C" prop="optionC">
              <el-input v-model="form.optionC" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选项D" prop="optionD">
              <el-input v-model="form.optionD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col v-if="!isShortAnswerType" :span="8">
            <el-form-item label="正确答案" prop="correctAnswer">
              <el-select
                v-model="form.correctAnswer"
                placeholder="选择答案"
                :multiple="isMultipleChoiceType"
                :collapse-tags="isMultipleChoiceType"
                collapse-tags-tooltip
              >
                <el-option
                  v-for="option in correctAnswerOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分值" prop="score">
              <el-input-number v-model="form.score" :min="1" :max="100" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="form.difficulty" placeholder="请选择难度">
                <el-option
                  v-for="option in difficultyFormOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="解析" prop="analysis">
          <el-input v-model="form.analysis" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { questionApi } from '@/api/question'
import { courseApi } from '@/api/course'
import { addDisplayId, normalizeTableData } from '@/utils/table'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.isTeacher)
const currentTeacherId = computed(() => {
  const id = Number(userStore.user?.id)
  return Number.isFinite(id) ? id : null
})

const currentOperatorId = computed(() => {
  const id = Number(userStore.user?.id)
  return Number.isFinite(id) ? id : null
})

const loading = ref(false)
const submitting = ref(false)
const questionList = ref([])
const courseOptions = ref([])
const courseMap = ref({})

const keyword = ref('')
const filterType = ref('')
const pageNum = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref(buildDefaultForm())

const typeTextMap = {
  1: '单选',
  2: '多选',
  3: '判断',
  4: '简答'
}

const difficultyTextMap = {
  1: '简单',
  2: '中等',
  3: '困难'
}

const typeFormOptions = [
  { value: 1, label: '单选' },
  { value: 2, label: '多选' },
  { value: 3, label: '判断' },
  { value: 4, label: '简答' }
]

const difficultyFormOptions = [
  { value: 1, label: '简单' },
  { value: 2, label: '中等' },
  { value: 3, label: '困难' }
]

const defaultAnswerOptions = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' }
]

const judgeAnswerOptions = [
  { label: '正确', value: '1' },
  { label: '错误', value: '0' }
]

const currentUserAliases = computed(() => {
  const nickname = String(userStore.user?.nickname || '').trim().toLowerCase()
  const username = String(userStore.user?.username || '').trim().toLowerCase()
  return [nickname, username].filter(Boolean)
})

const isShortAnswerType = computed(() => Number(form.value.type) === 4)
const isMultipleChoiceType = computed(() => Number(form.value.type) === 2)
const requiresOptionInputs = computed(() => {
  const type = Number(form.value.type)
  return type === 1 || type === 2
})

const parseMultiAnswer = (value) => {
  const orderMap = { A: 1, B: 2, C: 3, D: 4 }

  const normalize = (items) => {
    const unique = Array.from(new Set(items))
    return unique
      .filter(item => orderMap[item])
      .sort((a, b) => orderMap[a] - orderMap[b])
  }

  if (Array.isArray(value)) {
    return normalize(value
      .map(item => String(item || '').trim().toUpperCase())
      .filter(Boolean))
  }

  return normalize(String(value || '')
    .split(/[,，\s]+/)
    .map(item => item.trim().toUpperCase())
    .filter(Boolean))
}

const validateOptionField = (optionLabel) => {
  return (_rule, value, callback) => {
    if (!requiresOptionInputs.value) {
      callback()
      return
    }

    if (String(value || '').trim()) {
      callback()
      return
    }

    callback(new Error(`请输入选项${optionLabel}`))
  }
}

const validateCorrectAnswer = (_rule, value, callback) => {
  if (isShortAnswerType.value) {
    callback()
    return
  }

  if (isMultipleChoiceType.value) {
    if (Array.isArray(value) && value.length > 0) {
      callback()
      return
    }
    callback(new Error('请选择正确答案'))
    return
  }

  if (String(value || '').trim()) {
    callback()
    return
  }

  callback(new Error('请选择正确答案'))
}

const rules = {
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  content: [{ required: true, message: '请输入题干', trigger: 'blur' }],
  optionA: [{ validator: validateOptionField('A'), trigger: 'blur' }],
  optionB: [{ validator: validateOptionField('B'), trigger: 'blur' }],
  optionC: [{ validator: validateOptionField('C'), trigger: 'blur' }],
  optionD: [{ validator: validateOptionField('D'), trigger: 'blur' }],
  correctAnswer: [{ validator: validateCorrectAnswer, trigger: 'change' }],
  score: [{ required: true, message: '请输入分值', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

function buildDefaultForm() {
  return {
    id: undefined,
    type: '',
    courseId: '',
    content: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    analysis: '',
    score: 1,
    difficulty: '',
    createUser: currentOperatorId.value ?? ''
  }
}

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

const normalizeQuestionRow = (row = {}) => {
  const title = row.title ?? row.courseTitle ?? row.courseName ?? ''
  const courseId = row.courseId ?? row.course_id ?? ''
  const nickname = row.nickname ?? row.createUser ?? row.create_user ?? ''
  return {
    ...row,
    id: row.id,
    type: row.type ?? '',
    title,
    courseId,
    content: row.content ?? '',
    optionA: row.optionA ?? '',
    optionB: row.optionB ?? '',
    optionC: row.optionC ?? '',
    optionD: row.optionD ?? '',
    correctAnswer: row.correctAnswer ?? '',
    analysis: row.analysis ?? '',
    score: row.score ?? 1,
    difficulty: row.difficulty ?? '',
    nickname,
    createUser: nickname,
    createTime: formatDateTime(row.createTime),
    updateTime: formatDateTime(row.updateTime),
    courseName: courseMap.value[String(courseId)] || String(title || courseId || '-')
  }
}

const typeOptions = computed(() => {
  const set = new Set()
  questionList.value.forEach((item = {}) => {
    const type = Number(item.type)
    if (Number.isFinite(type) && typeTextMap[type]) {
      set.add(type)
    }
  })
  return Array.from(set).sort((a, b) => a - b).map((value) => ({
    value,
    label: typeTextMap[value]
  }))
})

const correctAnswerOptions = computed(() => {
  return Number(form.value.type) === 3 ? judgeAnswerOptions : defaultAnswerOptions
})

const formatTypeText = (value) => {
  const code = Number(value)
  return typeTextMap[code] || String(value || '-')
}

const formatDifficultyText = (value) => {
  const code = Number(value)
  return difficultyTextMap[code] || String(value || '-')
}

const formatAnswerText = (row = {}) => {
  const typeCode = Number(row.type)
  if (typeCode === 2) {
    const values = parseMultiAnswer(row.correctAnswer)
    return values.length > 0 ? values.join(',') : '-'
  }

  const answer = String(row.correctAnswer ?? '').trim()
  if (typeCode === 3) {
    if (answer === '1') {
      return '正确'
    }
    if (answer === '0') {
      return '错误'
    }
  }
  return answer || '-'
}

const filteredQuestions = computed(() => {
  const contentKeyword = String(keyword.value || '').trim().toLowerCase()
  const hasTypeFilter = filterType.value !== '' && filterType.value !== null && filterType.value !== undefined
  const selectedType = hasTypeFilter ? Number(filterType.value) : null

  return questionList.value.filter((item) => {
    const matchKeyword = !contentKeyword || String(item.content || '').toLowerCase().includes(contentKeyword)
    const itemType = Number(item.type)
    const matchType = selectedType === null || (Number.isFinite(selectedType) && itemType === selectedType)
    return matchKeyword && matchType
  })
})

const pagedQuestions = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  const end = start + pageSize.value
  return addDisplayId(filteredQuestions.value.slice(start, end), pageNum.value, pageSize.value)
})

const loadCourses = async () => {
  try {
    if (isTeacher.value && !Number.isFinite(currentTeacherId.value)) {
      courseOptions.value = []
      courseMap.value = {}
      ElMessage.warning('未获取到教师信息，请重新登录')
      return
    }

    const response = isTeacher.value && Number.isFinite(currentTeacherId.value)
      ? await courseApi.getByTeaId(currentTeacherId.value)
      : await courseApi.getAllCourses()
    if (response?.code !== 1) {
      return
    }
    const { rows } = normalizeTableData(response.data)
    const options = rows.map((item) => ({
      value: String(item.id),
      label: item.title || item.courseName || `课程${item.id}`
    }))
    courseOptions.value = options
    courseMap.value = options.reduce((acc, item) => {
      acc[item.value] = item.label
      return acc
    }, {})

    if (isTeacher.value && options.length === 0) {
      ElMessage.warning('当前教师名下暂无课程，请先创建课程')
    }
  } catch (error) {
    ElMessage.warning(error.message || '获取课程列表失败')
  }
}

const ensureCoursesLoaded = async () => {
  if (courseOptions.value.length > 0) {
    return
  }
  await loadCourses()
}

const resolveCourseValueForEdit = (row = {}) => {
  const directCourseId = String(row.courseId || '').trim()
  if (directCourseId) {
    return directCourseId
  }

  const courseTitle = String(row.title || '').trim()
  if (!courseTitle) {
    return ''
  }

  const matched = courseOptions.value.find((item = {}) => String(item.label || '').trim() === courseTitle)
  return matched ? String(matched.value) : ''
}

const loadQuestions = async () => {
  loading.value = true
  try {
    const response = await questionApi.getAllExamTitle()
    if (response?.code === 1) {
      const { rows } = normalizeTableData(response.data)
      const normalizedRows = rows.map(normalizeQuestionRow)
      if (userStore.isTeacher && !userStore.isAdmin) {
        questionList.value = normalizedRows.filter((item = {}) => {
          const creator = String(item.nickname || item.createUser || '').trim().toLowerCase()
          return currentUserAliases.value.includes(creator)
        })
      } else {
        questionList.value = normalizedRows
      }
      pageNum.value = 1
      return
    }
    ElMessage.error(response?.msg || '获取题库失败')
  } catch (error) {
    ElMessage.error(error.message || '获取题库出错')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  keyword.value = ''
  filterType.value = ''
  pageNum.value = 1
}

const handleCurrentPageChange = (value) => {
  pageNum.value = value
}

const handlePageSizeChange = (value) => {
  pageSize.value = value
  pageNum.value = 1
}

const openCreateDialog = async () => {
  await ensureCoursesLoaded()
  isEdit.value = false
  form.value = buildDefaultForm()
  dialogVisible.value = true
}

const openEditDialog = async (row) => {
  await ensureCoursesLoaded()
  const typeCode = Number(row.type)
  isEdit.value = true
  form.value = {
    id: row.id,
    type: typeCode || '',
    courseId: resolveCourseValueForEdit(row),
    content: row.content || '',
    optionA: row.optionA || '',
    optionB: row.optionB || '',
    optionC: row.optionC || '',
    optionD: row.optionD || '',
    correctAnswer: typeCode === 3
      ? String(row.correctAnswer ?? '')
      : (typeCode === 2
        ? parseMultiAnswer(row.correctAnswer)
        : String(row.correctAnswer || '').toUpperCase()),
    analysis: row.analysis || '',
    score: Number(row.score || 1),
    difficulty: Number(row.difficulty) || '',
    createUser: currentOperatorId.value ?? row.createUser ?? ''
  }
  dialogVisible.value = true
}

const buildPayload = () => {
  const typeCode = Number(form.value.type)
  const answerValue = String(form.value.correctAnswer ?? '').trim()
  const normalizedAnswer = typeCode === 3
    ? (answerValue === '1' ? 1 : 0)
    : (typeCode === 2
      ? parseMultiAnswer(form.value.correctAnswer).join(',')
      : answerValue)

  return {
    ...(isEdit.value ? { id: form.value.id } : {}),
    type: Number(form.value.type),
    courseId: Number(form.value.courseId),
    content: form.value.content,
    optionA: form.value.optionA,
    optionB: form.value.optionB,
    optionC: form.value.optionC,
    optionD: form.value.optionD,
    ...(typeCode === 4 ? {} : { correctAnswer: normalizedAnswer }),
    analysis: form.value.analysis,
    score: Number(form.value.score),
    difficulty: Number(form.value.difficulty),
    createUser: currentOperatorId.value ?? Number(form.value.createUser)
  }
}

watch(
  () => form.value.type,
  (nextType) => {
    if (Number(nextType) === 4) {
      form.value.optionA = ''
      form.value.optionB = ''
      form.value.optionC = ''
      form.value.optionD = ''
    }

    if (Number(nextType) === 3) {
      form.value.optionA = ''
      form.value.optionB = ''
      form.value.optionC = ''
      form.value.optionD = ''
      if (form.value.correctAnswer !== '1' && form.value.correctAnswer !== '0') {
        form.value.correctAnswer = ''
      }
      return
    }

    if (Number(nextType) === 2) {
      form.value.correctAnswer = parseMultiAnswer(form.value.correctAnswer)
      return
    }

    if (form.value.correctAnswer === '1' || form.value.correctAnswer === '0') {
      form.value.correctAnswer = ''
      return
    }

    if (Array.isArray(form.value.correctAnswer)) {
      form.value.correctAnswer = form.value.correctAnswer[0] || ''
    }
  }
)

const handleSubmit = async () => {
  if (!formRef.value) {
    return
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }

    submitting.value = true
    try {
      const payload = buildPayload()
      const response = isEdit.value
        ? await questionApi.updateExamTitle(payload)
        : await questionApi.saveExamTitle(payload)

      if (response?.code === 1) {
        ElMessage.success(isEdit.value ? '题目更新成功' : '题目新增成功')
        dialogVisible.value = false
        await loadQuestions()
        return
      }
      ElMessage.error(response?.msg || '保存失败')
    } catch (error) {
      ElMessage.error(error.message || '保存出错')
    } finally {
      submitting.value = false
    }
  })
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该题目吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    const response = await questionApi.delExamTitle(row.id)
    if (response?.code === 1) {
      ElMessage.success('删除成功')
      await loadQuestions()
      return
    }
    ElMessage.error(response?.msg || '删除失败')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(async () => {
  if (!userStore.isTeacher && !userStore.isAdmin) {
    ElMessage.warning('仅教师可访问题库管理')
    router.push('/home')
    return
  }
  await loadQuestions()
})
</script>

<style scoped>
.question-bank-page {
  width: 100%;
  min-height: 100%;
  padding: 12px 0 20px;
  box-sizing: border-box;
  background: #ffffff;
}

.question-bank-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 20px;
  font-weight: bold;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.search-input {
  width: 240px;
}

.course-filter {
  width: 220px;
}

.pagination-wrap {
  margin-top: 16px;
  text-align: right;
}
</style>
