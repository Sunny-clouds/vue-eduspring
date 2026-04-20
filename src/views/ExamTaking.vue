<template>
  <div class="exam-taking-page">
    <el-card class="exam-taking-card">
      <template #header>
        <div class="exam-header">
          <span class="title">考试页面</span>
          <el-button @click="goBack">返回考试信息</el-button>
        </div>
      </template>

      <div class="exam-status-panel">
        <div class="status-item">
          <div class="status-label">考试总时长</div>
          <div class="status-value">{{ totalDurationText }}</div>
        </div>
        <div class="status-item danger">
          <div class="status-label">剩余时间</div>
          <div class="status-value">{{ remainingTimeText }}</div>
        </div>
      </div>

      <div class="question-list" v-if="questions.length > 0">
        <div class="question-card" v-for="(item, index) in questions" :key="item.id || index">
          <div class="question-title-row">
            <div class="question-title">
              {{ index + 1 }}. {{ item.content || '未设置题干' }}
            </div>
            <el-tag size="small" effect="light" class="question-score-tag">
              {{ Number.isFinite(item.paperScore) ? item.paperScore : 0 }} 分
            </el-tag>
          </div>

          <div class="question-options" v-if="item.type === 1">
            <el-radio-group
              :model-value="getSingleAnswer(item.id)"
              @update:model-value="(val) => setSingleAnswer(item.id, val)"
            >
              <el-radio v-if="item.optionA" value="A" class="question-option">A. {{ item.optionA }}</el-radio>
              <el-radio v-if="item.optionB" value="B" class="question-option">B. {{ item.optionB }}</el-radio>
              <el-radio v-if="item.optionC" value="C" class="question-option">C. {{ item.optionC }}</el-radio>
              <el-radio v-if="item.optionD" value="D" class="question-option">D. {{ item.optionD }}</el-radio>
            </el-radio-group>
          </div>

          <div class="question-options" v-else-if="item.type === 2">
            <el-checkbox-group
              :model-value="getMultipleAnswer(item.id)"
              @update:model-value="(val) => setMultipleAnswer(item.id, val)"
            >
              <el-checkbox v-if="item.optionA" value="A" class="question-option">A. {{ item.optionA }}</el-checkbox>
              <el-checkbox v-if="item.optionB" value="B" class="question-option">B. {{ item.optionB }}</el-checkbox>
              <el-checkbox v-if="item.optionC" value="C" class="question-option">C. {{ item.optionC }}</el-checkbox>
              <el-checkbox v-if="item.optionD" value="D" class="question-option">D. {{ item.optionD }}</el-checkbox>
            </el-checkbox-group>
          </div>

          <div class="question-options" v-else-if="item.type === 3">
            <el-radio-group
              :model-value="getSingleAnswer(item.id)"
              @update:model-value="(val) => setSingleAnswer(item.id, val)"
            >
              <el-radio value="1" class="question-option">正确</el-radio>
              <el-radio value="0" class="question-option">错误</el-radio>
            </el-radio-group>
          </div>

          <div class="question-type-text">题型：{{ resolveTypeText(item.type) }}</div>
        </div>
      </div>

      <el-empty v-else description="未获取到试题，请返回后重试" />

      <div class="exam-actions" v-if="questions.length > 0">
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmitExam">提交试卷</el-button>
      </div>

    </el-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { studentAnswerApi } from '@/api/studentAnswer'
import { examApi } from '@/api/exam'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activityId = computed(() => Number(route.params.id))
const remainingSeconds = ref(0)
const totalDurationMinutes = ref(0)
const paperId = ref(null)
const questionCount = ref(0)
const questions = ref([])
const answerMap = ref({})
const isSubmitting = ref(false)
const hasAutoSubmitted = ref(false)
const sessionKeyRef = ref('')
const studentPaperId = ref(null)
const examStartAtRef = ref(0)
const studentPaperRef = ref({})
let timer = null

const totalDurationText = computed(() => {
  const minutes = Number(totalDurationMinutes.value)
  return Number.isFinite(minutes) && minutes > 0 ? `${minutes} 分钟` : '-'
})

const remainingTimeText = computed(() => {
  const total = Math.max(0, Number(remainingSeconds.value) || 0)
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})

const resolveTypeText = (type) => {
  const value = Number(type)
  if (value === 1) return '单选题'
  if (value === 2) return '多选题'
  if (value === 3) return '判断题'
  return '未知题型'
}

const sortChoiceValues = (values) => {
  const orderMap = { A: 1, B: 2, C: 3, D: 4 }
  const source = Array.isArray(values) ? values : []
  const normalized = source
    .map(item => String(item || '').trim().toUpperCase())
    .filter(item => orderMap[item])
  const unique = Array.from(new Set(normalized))
  return unique.sort((a, b) => orderMap[a] - orderMap[b])
}

const getSingleAnswer = (questionId) => {
  const value = answerMap.value[questionId]
  return typeof value === 'string' ? value : ''
}

const setSingleAnswer = (questionId, value) => {
  answerMap.value[questionId] = String(value || '')
}

const getMultipleAnswer = (questionId) => {
  const value = answerMap.value[questionId]
  return Array.isArray(value) ? value : []
}

const setMultipleAnswer = (questionId, value) => {
  answerMap.value[questionId] = sortChoiceValues(value)
}

const buildSubmitAnswers = () => {
  return questions.value
    .map((item = {}) => {
      const questionId = Number(item.id)
      const type = Number(item.type)
      const raw = answerMap.value[questionId]

      if (!Number.isFinite(questionId) || questionId <= 0) {
        return null
      }

      if (type === 2) {
        const values = sortChoiceValues(raw)
        return {
          id: questionId,
          type,
          answer: values.join(',')
        }
      }

      if (type === 3) {
        const value = String(raw || '').trim()
        return {
          id: questionId,
          type,
          // 判断题按后端约定：1=正确，0=错误。
          answer: value === '1' ? '1' : (value === '0' ? '0' : '')
        }
      }

      return {
        id: questionId,
        type,
        answer: String(raw || '').trim()
      }
    })
    .filter((item) => item && item.answer !== '')
}

const getUnansweredCount = () => {
  const answeredQuestionIds = new Set(buildSubmitAnswers().map((item) => Number(item.id)))
  return questions.value.filter((item = {}) => !answeredQuestionIds.has(Number(item.id))).length
}

const saveStudentAnswers = async () => {
  const currentStudentPaperId = Number(studentPaperId.value)
  if (!Number.isFinite(currentStudentPaperId) || currentStudentPaperId <= 0) {
    throw new Error('未获取到 studentPaperId，无法提交学生答案')
  }

  const existingStudentPaper = studentPaperRef.value || {}
  const currentStudentId = Number(existingStudentPaper.studentId ?? userStore.user?.id)
  if (!Number.isFinite(currentStudentId) || currentStudentId <= 0) {
    throw new Error('未获取到 studentId，无法提交学生答案')
  }

  const answers = buildSubmitAnswers()
  const studentAnswerDtos = answers
    .map((item) => {
      const questionId = Number(item.id)
      const studentAnswer = String(item.answer || '').trim()
      if (!Number.isFinite(questionId) || questionId <= 0 || !studentAnswer) {
        return null
      }

      return {
        id: null,
        studentPaperId: currentStudentPaperId,
        studentId: currentStudentId,
        questionId,
        studentAnswer
      }
    })
    .filter(Boolean)

  if (studentAnswerDtos.length <= 0) {
    return
  }

  const pad2 = (num) => String(num).padStart(2, '0')
  const formatDateTime = (value) => {
    const dt = new Date(value)
    if (!Number.isFinite(dt.getTime())) {
      return null
    }
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`
  }

  const currentActivityId = Number(existingStudentPaper.activityId ?? activityId.value)
  const currentPaperId = Number(existingStudentPaper.paperId ?? paperId.value)
  const currentAttempt = Number(existingStudentPaper.attempt)
  const currentTotalScore = Number(existingStudentPaper.totalScore)
  const startTimeText = existingStudentPaper.startTime || formatDateTime(Number(examStartAtRef.value))
  const submitTimeText = formatDateTime(Date.now())

  const studentPaper = {
    id: currentStudentPaperId,
    studentId: Number.isFinite(currentStudentId) && currentStudentId > 0 ? currentStudentId : null,
    activityId: Number.isFinite(currentActivityId) && currentActivityId > 0 ? currentActivityId : null,
    paperId: Number.isFinite(currentPaperId) && currentPaperId > 0 ? currentPaperId : null,
    attempt: Number.isFinite(currentAttempt) && currentAttempt > 0 ? currentAttempt : null,
    totalScore: Number.isFinite(currentTotalScore) ? currentTotalScore : null,
    startTime: startTimeText,
    submitTime: submitTimeText
  }

  const publishStudentExamDto = {
    studentAnswerDtos,
    studentPaper
  }

  const response = await studentAnswerApi.saveStudentAnswer(publishStudentExamDto)
  if (response?.code !== 1) {
    throw new Error(response?.msg || '学生答案提交失败')
  }

  return response?.data
}

const normalizePaperQuestions = (paperData = {}) => {
  let rows = []
  if (Array.isArray(paperData)) {
    rows = paperData
  } else if (Array.isArray(paperData?.rows)) {
    rows = paperData.rows
  } else if (Array.isArray(paperData?.list)) {
    rows = paperData.list
  } else if (Array.isArray(paperData?.questions)) {
    rows = paperData.questions
  } else if (Array.isArray(paperData?.questionList)) {
    rows = paperData.questionList
  }

  return rows
    .map((item = {}, index) => {
      const sortValue = Number(item.sort)
      return {
        id: Number(item.id),
        type: Number(item.type),
        content: String(item.content || '').trim(),
        optionA: String(item.optionA || '').trim(),
        optionB: String(item.optionB || '').trim(),
        optionC: String(item.optionC || '').trim(),
        optionD: String(item.optionD || '').trim(),
        paperScore: Number(item.paperScore ?? 0),
        sort: Number.isFinite(sortValue) ? sortValue : index + 1
      }
    })
    .filter((item) => Number.isFinite(item.id) && item.id > 0)
    .sort((a, b) => a.sort - b.sort)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const normalizeOwnScoreValue = (data) => {
  // If data is directly a number (score value), return it
  const directScore = Number(data)
  if (Number.isFinite(directScore)) {
    return String(directScore)
  }

  const rows = Array.isArray(data?.rows)
    ? data.rows
    : (Array.isArray(data?.list) ? data.list : null)
  const source = rows && rows.length > 0
    ? rows[0]
    : (data?.scoreDto || data?.studentScore || data?.studentPaper || data?.data || data)
  const score = Number(
    source?.totalScore
    ?? source?.score
    ?? source?.examScore
    ?? data?.totalScore
    ?? data?.score
    ?? data?.examScore
  )
  return Number.isFinite(score) ? String(score) : '-'
}

const resolveShowResultFlag = async () => {
  const fromQuery = Number(route.query.showResult)
  if (fromQuery === 1 || fromQuery === 0) {
    return fromQuery === 1
  }

  const sessionKey = String(sessionKeyRef.value || '')
  if (sessionKey) {
    try {
      const raw = sessionStorage.getItem(sessionKey)
      const parsed = raw ? JSON.parse(raw) : null
      const fromSession = Number(parsed?.showResult)
      if (fromSession === 1 || fromSession === 0) {
        return fromSession === 1
      }
    } catch (error) {
      // Ignore parse errors and continue fallback.
    }
  }

  const bizId = Number(route.query.bizId)
  if (!Number.isFinite(bizId) || bizId <= 0) {
    return false
  }

  try {
    const response = await examApi.getExamByBizId(bizId)
    if (response?.code === 1) {
      return Number(response?.data?.showResult) === 1
    }
  } catch (error) {
    // Ignore API errors and keep default behavior.
  }

  return false
}

const showScoreAfterSubmitIfNeeded = async (scoreData) => {
  const canShowResultNow = await resolveShowResultFlag()
  if (!canShowResultNow) {
    return
  }

  try {
    const scoreText = normalizeOwnScoreValue(scoreData)
    await ElMessageBox.alert(
      `已提交成功<br/>我的成绩：${scoreText}`,
      '考试成绩',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '知道了',
        type: 'success'
      }
    )
  } catch (error) {
    ElMessage.warning(error.message || '成绩展示失败，请稍后在考试信息页查看')
  }
}

const navigateBackToExamInfo = () => {
  router.push({
    name: 'ExamActivityInfo',
    params: { id: activityId.value },
    query: {
      courseId: route.query.courseId || '',
      courseTitle: route.query.courseTitle || '',
      teacherName: route.query.teacherName || '',
      bizId: route.query.bizId || ''
    }
  })
}

const finalizeSubmitExam = async ({ reason = 'manual', tipText = '试卷提交成功', scoreData = null } = {}) => {
  const sessionKey = String(sessionKeyRef.value || '')
  const answers = buildSubmitAnswers()

  if (sessionKey) {
    try {
      const raw = sessionStorage.getItem(sessionKey)
      const parsed = raw ? JSON.parse(raw) : {}
      sessionStorage.setItem(sessionKey, JSON.stringify({
        ...parsed,
        submittedAt: Date.now(),
        submitReason: reason,
        submitStatus: 'submitted',
        answers
      }))
    } catch (error) {
      // Ignore session write errors and continue submit flow.
    }
  }

  ElMessage.success(tipText)
  await showScoreAfterSubmitIfNeeded(scoreData)
  navigateBackToExamInfo()
}

const handleSubmitExam = async () => {
  if (isSubmitting.value || hasAutoSubmitted.value) {
    return
  }

  const unansweredCount = getUnansweredCount()
  if (unansweredCount > 0) {
    try {
      await ElMessageBox.confirm(
        `还有 ${unansweredCount} 题未作答，确认现在提交吗？`,
        '提交确认',
        {
          type: 'warning',
          confirmButtonText: '提交',
          cancelButtonText: '继续作答'
        }
      )
    } catch (error) {
      if (error === 'cancel' || error === 'close') {
        return
      }
      ElMessage.error(error.message || '提交确认失败')
      return
    }
  }

  isSubmitting.value = true
  stopTimer()
  try {
    const scoreData = await saveStudentAnswers()
    await finalizeSubmitExam({ reason: 'manual', tipText: '试卷提交成功', scoreData })
  } catch (error) {
    ElMessage.error(error.message || '提交试卷失败')
  } finally {
    isSubmitting.value = false
  }
}

const autoSubmitExam = async () => {
  if (hasAutoSubmitted.value || isSubmitting.value) {
    return
  }

  hasAutoSubmitted.value = true
  isSubmitting.value = true
  stopTimer()
  try {
    const scoreData = await saveStudentAnswers()
    await finalizeSubmitExam({ reason: 'timeout', tipText: '考试时间到，已自动交卷', scoreData })
  } catch (error) {
    ElMessage.error(error.message || '自动交卷失败，请联系老师处理')
  } finally {
    isSubmitting.value = false
  }
}

const startCountdown = (durationMinutes, startAtMs) => {
  const minutes = Number(durationMinutes)
  const startAt = Number(startAtMs)
  if (!Number.isFinite(minutes) || minutes <= 0 || !Number.isFinite(startAt) || startAt <= 0) {
    ElMessage.warning('考试时间参数无效，无法启动倒计时')
    return
  }

  totalDurationMinutes.value = minutes
  const endAt = startAt + minutes * 60 * 1000

  const tick = () => {
    const left = Math.max(0, Math.floor((endAt - Date.now()) / 1000))
    remainingSeconds.value = left
    if (left <= 0) {
      autoSubmitExam()
    }
  }

  tick()
  stopTimer()
  timer = setInterval(tick, 1000)
}

const goBack = () => {
  navigateBackToExamInfo()
}

onMounted(() => {
  const aid = Number(activityId.value)
  const sessionKey = String(route.query.sessionKey || `exam-session-${aid}`)
  sessionKeyRef.value = sessionKey
  const duration = Number(route.query.duration)
  const startAt = Number(route.query.startAt)
  examStartAtRef.value = Number.isFinite(startAt) && startAt > 0 ? startAt : 0
  const currentPaperId = Number(route.query.paperId)
  paperId.value = Number.isFinite(currentPaperId) ? currentPaperId : null
  const currentStudentPaperId = Number(route.query.studentPaperId)
  studentPaperId.value = Number.isFinite(currentStudentPaperId) && currentStudentPaperId > 0
    ? currentStudentPaperId
    : null

  if (sessionKey) {
    try {
      const raw = sessionStorage.getItem(sessionKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        studentPaperRef.value = parsed?.studentPaper && typeof parsed.studentPaper === 'object'
          ? parsed.studentPaper
          : {}
        const parsedStartAt = Number(parsed?.startAt)
        if (Number.isFinite(parsedStartAt) && parsedStartAt > 0) {
          examStartAtRef.value = parsedStartAt
        }
        const parsedPaperId = Number(parsed?.paperId)
        if (Number.isFinite(parsedPaperId) && parsedPaperId > 0) {
          paperId.value = parsedPaperId
        }
        const parsedStudentPaperId = Number(
          parsed?.studentPaperId
          ?? parsed?.studentpaperId
          ?? parsed?.studentPaper?.id
          ?? parsed?.paperId
        )
        if (Number.isFinite(parsedStudentPaperId) && parsedStudentPaperId > 0) {
          studentPaperId.value = parsedStudentPaperId
        }
        const normalizedQuestions = normalizePaperQuestions(parsed?.paperData || {})
        questions.value = normalizedQuestions
        questionCount.value = normalizedQuestions.length

        const cachedAnswers = parsed?.answers
        if (Array.isArray(cachedAnswers)) {
          answerMap.value = cachedAnswers.reduce((acc, item = {}) => {
            const qid = Number(item.id)
            const qtype = Number(item.type)
            if (!Number.isFinite(qid) || qid <= 0) {
              return acc
            }
            if (qtype === 2) {
              acc[qid] = sortChoiceValues(String(item.answer || '')
                .split(',')
                .map(v => v.trim())
                .filter(Boolean))
            } else {
              acc[qid] = String(item.answer || '')
            }
            return acc
          }, {})
        }
      }
    } catch (error) {
      questions.value = []
      questionCount.value = 0
    }
  }

  startCountdown(duration, startAt)
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<style scoped>
.exam-taking-page {
  width: 100%;
  min-height: 100%;
  padding: 20px;
  box-sizing: border-box;
  background: #ffffff;
}

.exam-taking-card {
  max-width: 760px;
  margin: 0 auto;
}

.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 20px;
  font-weight: 700;
}

.exam-status-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.status-item {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 10px;
  padding: 12px;
}

.status-item.danger {
  border-color: #fecaca;
  background: #fef2f2;
}

.status-label {
  color: #64748b;
  font-size: 13px;
}

.status-value {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1;
  font-weight: 700;
  color: #0f172a;
}

.question-list {
  display: grid;
  gap: 12px;
  margin-bottom: 14px;
}

.question-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  padding: 12px;
}

.question-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.question-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
}

.question-score-tag {
  flex-shrink: 0;
}

.question-options {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.question-option {
  color: #334155;
  font-size: 13px;
  line-height: 1.5;
  background: #f8fafc;
  border-radius: 8px;
  padding: 6px 10px;
}

.question-type-text {
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}

.exam-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .exam-status-panel {
    grid-template-columns: 1fr;
  }
}
</style>
