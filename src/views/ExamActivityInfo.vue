<template>
  <div class="exam-info-page">
    <el-card class="exam-info-card" v-loading="loading">
      <template #header>
        <div class="exam-header">
          <div>
            <div class="title">考试信息</div>
            <div class="sub-title">请先确认考试规则，再开始考试</div>
          </div>
          <el-button plain @click="goBack">返回</el-button>
        </div>
      </template>

      <div class="paper-title-block">
        <div class="paper-title-label">试卷标题</div>
        <div class="paper-title-text">{{ examDetail.title || '-' }}</div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">考试时长</div>
          <div class="metric-value">{{ examDetail.durationText }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">考试总分</div>
          <div class="metric-value">{{ examDetail.totalScoreText }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">允许重考</div>
          <div class="metric-value">{{ examDetail.allowRetakeText }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">最大次数</div>
          <div class="metric-value">{{ examDetail.maxAttemptText }}</div>
        </div>
        <div class="metric-card full">
          <div class="metric-label">是否立即显示成绩</div>
          <div class="metric-value">{{ examDetail.showResultText }}</div>
        </div>
      </div>

      <div class="actions">
        <el-button
          v-if="canEditExamConfig"
          plain
          @click="goStudentPapers"
        >
          查看所有学生考试成绩
        </el-button>
        <el-button
          v-if="canEditExamConfig"
          plain
          :disabled="!isExamNotStarted || updating"
          @click="openEditDialog"
        >
          修改考试信息
        </el-button>
        <el-button type="primary" size="large" :loading="loadingMyScore" @click="startExam">{{ primaryActionText }}</el-button>
      </div>

      <div v-if="isStudent && hasOwnScore" class="my-score-card">
        <div class="my-score-label">我的成绩</div>
        <div class="my-score-value">{{ ownScoreText.score }}</div>
        <div v-if="ownScoreText.attempt" class="my-score-attempt">考试次数：{{ ownScoreText.attempt }}</div>
      </div>

      <el-dialog
        v-model="editDialogVisible"
        title="修改考试信息"
        width="520px"
        :close-on-click-modal="false"
      >
        <el-form label-width="120px" @submit.prevent="handleUpdateExam">
          <el-form-item label="考试时长" required>
            <el-select v-model="editForm.durationText" style="width: 100%" placeholder="请选择考试时长">
              <el-option v-for="item in durationTextOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="考试总分" required>
            <el-input v-model="editForm.totalScore" placeholder="请输入考试总分" />
          </el-form-item>
          <el-form-item label="允许重考" required>
            <el-select v-model="editForm.allowRetakeText" style="width: 100%" placeholder="请选择是否允许重考">
              <el-option v-for="item in yesNoOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="最大考试次数" required>
            <el-select v-model="editForm.maxAttemptText" style="width: 100%" placeholder="请选择最大考试次数">
              <el-option v-for="item in maxAttemptTextOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="立即显示成绩" required>
            <el-select v-model="editForm.showResultText" style="width: 100%" placeholder="请选择是否立即显示成绩">
              <el-option v-for="item in yesNoOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false" :disabled="updating">取消</el-button>
          <el-button type="primary" :loading="updating" @click="handleUpdateExam">保存</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examApi } from '@/api/exam'
import { testPaperApi } from '@/api/testPaper'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const updating = ref(false)
const loadingMyScore = ref(false)
const editDialogVisible = ref(false)
const examDetailRaw = ref({})
const ownScoreText = ref({
  score: '',
  attempt: ''
})
const editForm = ref({
  durationText: '60分钟',
  totalScore: '',
  allowRetakeText: '否',
  maxAttemptText: '1次',
  showResultText: '是'
})

const activityId = computed(() => Number(route.params.id))
const bizId = computed(() => {
  const fromQuery = Number(route.query.bizId)
  return Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : null
})
const canEditExamConfig = computed(() => userStore.isAdmin || userStore.isTeacher)
const isStudent = computed(() => userStore.isStudent)

const mapDurationTextToNumber = {
  '30分钟': 30,
  '60分钟': 60,
  '90分钟': 90,
  '120分钟': 120
}
const mapAllowRetakeTextToNumber = { '否': 0, '是': 1 }
const mapMaxAttemptTextToNumber = { '1次': 1, '2次': 2, '3次': 3 }
const mapShowResultTextToNumber = { '否': 0, '是': 1 }
const durationTextOptions = Object.keys(mapDurationTextToNumber)
const yesNoOptions = ['否', '是']
const maxAttemptTextOptions = Object.keys(mapMaxAttemptTextToNumber)

const resolvePaperId = (detail = {}) => {
  const candidates = [
    detail.paperId,
    detail.testPaperId,
    detail.paper_id,
    detail.test_paper_id
  ]
  for (const value of candidates) {
    const id = Number(value)
    if (Number.isFinite(id) && id > 0) {
      return id
    }
  }
  return null
}

const resolveSessionPayload = (activityIdValue) => {
  const key = `exam-session-${activityIdValue}`
  try {
    const raw = sessionStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : null
    return { key, data: parsed }
  } catch (error) {
    return { key, data: null }
  }
}

const resolveStudentPaper = (paperData = {}) => {
  if (!paperData || typeof paperData !== 'object') {
    return null
  }
  const candidates = [
    paperData.studentPaper,
    paperData.studentPaperDto,
    paperData.paperSession,
    paperData.studentExamPaper
  ]
  for (const item of candidates) {
    if (item && typeof item === 'object') {
      return item
    }
  }
  return null
}

const resolveUsedAttemptCount = (detail = {}) => {
  const candidates = [
    detail.usedAttempts,
    detail.attemptCount,
    detail.currentAttempt,
    detail.studentAttempt,
    detail.studentAttempts,
    detail.attempt,
    detail.submitCount,
    detail.studentPaper?.attempt,
    detail.studentPaperDto?.attempt
  ]

  for (const value of candidates) {
    const count = Number(value)
    if (Number.isFinite(count) && count >= 0) {
      return count
    }
  }

  return null
}

const hasReachedMaxAttemptByFrontend = (detail = {}) => {
  const maxAttempt = Number(detail.maxAttempts ?? detail.maxAttempt)
  if (!Number.isFinite(maxAttempt) || maxAttempt <= 0) {
    return false
  }

  const usedAttempt = resolveUsedAttemptCount(detail)
  if (!Number.isFinite(usedAttempt)) {
    return false
  }

  return usedAttempt >= maxAttempt
}

const parseDateTime = (value = '') => {
  const text = String(value || '').trim()
  if (!text) {
    return null
  }
  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const ms = new Date(normalized).getTime()
  return Number.isFinite(ms) ? ms : null
}

const isExamNotStarted = computed(() => {
  const fromRoute = parseDateTime(route.query.startTime)
  const fromDetail = parseDateTime(examDetailRaw.value?.startTime)
  const startMs = fromRoute ?? fromDetail
  if (!Number.isFinite(startMs)) {
    return false
  }
  return Date.now() < startMs
})

const isExamEnded = computed(() => {
  const fromRoute = parseDateTime(route.query.endTime)
  const fromDetail = parseDateTime(examDetailRaw.value?.endTime)
  const endMs = fromRoute ?? fromDetail
  if (!Number.isFinite(endMs)) {
    return false
  }
  return Date.now() > endMs
})

const canShowStudentScoreNow = computed(() => {
  const showResult = Number(examDetailRaw.value?.showResult)
  return showResult === 1
})

const showEndedStudentScoreCard = computed(() => isStudent.value && isExamEnded.value)
const hasOwnScore = computed(() => String(ownScoreText.value?.score || '').trim() !== '')

const primaryActionText = computed(() => {
  if (showEndedStudentScoreCard.value) {
    return '查看我的成绩'
  }
  if (canEditExamConfig.value) {
    return '查看试题'
  }
  return '开始考试'
})

const resolveCurrentStudentId = () => {
  const user = userStore.user || {}
  const candidates = [user.id, user.userId, user.uid, user.studentId, route.query.studentId]
  for (const value of candidates) {
    const sid = Number(value)
    if (Number.isFinite(sid) && sid > 0) {
      return sid
    }
  }
  return null
}

const normalizeOwnScoreValue = (data) => {
  const rows = Array.isArray(data?.rows)
    ? data.rows
    : (Array.isArray(data?.list) ? data.list : null)
  const source = rows && rows.length > 0
    ? rows[0]
    : (data?.scoreDto || data?.studentScore || data)
  const score = Number(source?.totalScore ?? source?.score ?? source?.examScore)
  const attempt = Number(source?.attempt ?? source?.studentAttempt ?? source?.attemptCount ?? data?.attempt)
  return {
    score: Number.isFinite(score) ? String(score) : '',
    attempt: Number.isFinite(attempt) && attempt > 0 ? String(attempt) : ''
  }
}

const loadOwnScoreForPanel = async () => {
  ownScoreText.value = { score: '', attempt: '' }
  if (!isStudent.value || !canShowStudentScoreNow.value) {
    return
  }

  const studentId = resolveCurrentStudentId()
  if (!Number.isFinite(studentId) || studentId <= 0) {
    return
  }

  const paperId = resolvePaperId(examDetailRaw.value)
  if (!Number.isFinite(paperId) || paperId <= 0) {
    return
  }

  try {
    const response = await examApi.getScoreByStudentIdAndPaperId(studentId, paperId)
    if (response?.code !== 1) {
      return
    }
    ownScoreText.value = normalizeOwnScoreValue(response?.data)
  } catch (error) {
    // Ignore errors for panel rendering to avoid noisy prompts.
  }
}

const loadOwnScore = async () => {
  if (!showEndedStudentScoreCard.value) {
    ElMessage.warning('当前不是已结束考试，无法查看成绩')
    return
  }
  if (!canShowStudentScoreNow.value) {
    ElMessage.warning('老师未开启立即显示成绩，暂时无法查看')
    return
  }

  const studentId = resolveCurrentStudentId()
  if (!Number.isFinite(studentId) || studentId <= 0) {
    ElMessage.warning('未获取到当前学生ID，无法查询成绩')
    return
  }

  const paperId = resolvePaperId(examDetailRaw.value)
  if (!Number.isFinite(paperId) || paperId <= 0) {
    ElMessage.warning('未获取到试卷ID，无法查询成绩')
    return
  }

  loadingMyScore.value = true
  try {
    const response = await examApi.getScoreByStudentIdAndPaperId(studentId, paperId)
    if (response?.code === 1) {
      const scoreData = normalizeOwnScoreValue(response?.data)
      const scoreText = scoreData?.score || '-'
      const attemptText = scoreData?.attempt || '-'
      const title = String(examDetailRaw.value?.title || '-').trim() || '-'
      const totalScore = Number(examDetailRaw.value?.totalScore)
      const totalScoreText = Number.isFinite(totalScore) ? `${totalScore}` : '-'
      const attemptDisplay = attemptText !== '-' ? `<br/>考试次数：${attemptText}` : ''
      await ElMessageBox.alert(
        `考试：${title}<br/>总分：${totalScoreText}<br/>我的成绩：${scoreText}${attemptDisplay}`,
        '考试成绩',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '知道了',
          type: 'success'
        }
      )
      return
    }
    ElMessage.warning(response?.msg || '查询成绩失败')
  } catch (error) {
    ElMessage.error(error.message || '查询成绩出错')
  } finally {
    loadingMyScore.value = false
  }
}

const examDetail = computed(() => {
  const detail = examDetailRaw.value || {}
  const allowRetake = Number(detail.allowRetake)
  const showResult = Number(detail.showResult)
  const duration = Number(detail.duration)
  const totalScore = Number(detail.totalScore)
  const maxAttempt = Number(detail.maxAttempts ?? detail.maxAttempt)

  return {
    title: detail.title || '-',
    durationText: Number.isFinite(duration) ? `${duration} 分钟` : '-',
    totalScoreText: Number.isFinite(totalScore) ? `${totalScore}` : '-',
    allowRetakeText: allowRetake === 1 ? '是' : (allowRetake === 0 ? '否' : '-'),
    maxAttemptText: Number.isFinite(maxAttempt) ? `${maxAttempt}` : '-',
    showResultText: showResult === 1 ? '是' : (showResult === 0 ? '否' : '-')
  }
})

const loadExamInfo = async () => {
  if (!Number.isFinite(bizId.value)) {
    ElMessage.warning('考试ID无效')
    return
  }

  loading.value = true
  try {
    const response = await examApi.getExamByBizId(bizId.value)
    if (response?.code === 1) {
      examDetailRaw.value = response.data || {}
      return
    }
    ElMessage.warning(response?.msg || '获取考试信息失败')
  } catch (error) {
    ElMessage.error(error.message || '获取考试信息出错')
  } finally {
    loading.value = false
  }
}

const openEditDialog = () => {
  if (!canEditExamConfig.value) {
    ElMessage.warning('仅教师或管理员可修改考试信息')
    return
  }
  if (!isExamNotStarted.value) {
    ElMessage.warning('考试已开始或已结束，无法修改考试信息')
    return
  }

  const detail = examDetailRaw.value || {}
  const duration = Number(detail.duration)
  const allowRetake = Number(detail.allowRetake)
  const maxAttempt = Number(detail.maxAttempt ?? detail.maxAttempts)
  const showResult = Number(detail.showResult)
  const totalScore = Number(detail.totalScore)

  editForm.value = {
    durationText: durationTextOptions.find(item => mapDurationTextToNumber[item] === duration) || '60分钟',
    totalScore: Number.isFinite(totalScore) ? String(totalScore) : '',
    allowRetakeText: allowRetake === 1 ? '是' : '否',
    maxAttemptText: maxAttemptTextOptions.find(item => mapMaxAttemptTextToNumber[item] === maxAttempt) || '1次',
    showResultText: showResult === 1 ? '是' : '否'
  }
  editDialogVisible.value = true
}

const handleUpdateExam = async () => {
  if (!canEditExamConfig.value) {
    ElMessage.warning('仅教师或管理员可修改考试信息')
    return
  }
  if (!isExamNotStarted.value) {
    ElMessage.warning('考试已开始或已结束，无法修改考试信息')
    return
  }

  const totalScore = Number(editForm.value.totalScore)
  const duration = mapDurationTextToNumber[editForm.value.durationText]
  const allowRetake = mapAllowRetakeTextToNumber[editForm.value.allowRetakeText]
  const maxAttempt = mapMaxAttemptTextToNumber[editForm.value.maxAttemptText]
  const showResult = mapShowResultTextToNumber[editForm.value.showResultText]
  const currentExamId = Number(examDetailRaw.value?.id ?? examDetailRaw.value?.examId ?? 0)
  const currentPaperId = Number(examDetailRaw.value?.paperId ?? examDetailRaw.value?.testPaperId ?? 0)

  if (!Number.isFinite(duration)) {
    ElMessage.warning('请选择考试时长')
    return
  }
  if (!Number.isFinite(totalScore)) {
    ElMessage.warning('请输入正确的考试总分')
    return
  }
  if (!Number.isFinite(allowRetake) || !Number.isFinite(maxAttempt) || !Number.isFinite(showResult)) {
    ElMessage.warning('考试配置不完整')
    return
  }
  if (!Number.isFinite(currentExamId) || currentExamId <= 0) {
    ElMessage.warning('未获取到考试ID，无法修改考试信息')
    return
  }
  if (!Number.isFinite(currentPaperId) || currentPaperId <= 0) {
    ElMessage.warning('未获取到试卷ID，无法修改考试信息')
    return
  }

  updating.value = true
  try {
    const response = await examApi.updateExam({
      id: currentExamId,
      activityId: activityId.value,
      paperId: currentPaperId,
      duration,
      totalScore,
      allowRetake,
      maxAttempt,
      showResult
    })
    if (response?.code === 1) {
      ElMessage.success(response?.msg || '考试信息修改成功')
      editDialogVisible.value = false
      await loadExamInfo()
    } else {
      ElMessage.error(response?.msg || '考试信息修改失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '考试信息修改出错')
  } finally {
    updating.value = false
  }
}

const goBack = () => {
  const cid = Number(route.query.courseId)
  if (Number.isFinite(cid)) {
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

const goStudentPapers = () => {
  const aid = Number(activityId.value)
  if (!Number.isFinite(aid) || aid <= 0) {
    ElMessage.warning('活动ID无效，无法进入考试成绩页')
    return
  }

  router.push({
    name: 'ExamStudentPapers',
    params: { id: aid },
    query: {
      courseId: String(route.query.courseId || ''),
      courseTitle: route.query.courseTitle || '',
      teacherName: route.query.teacherName || '',
      activityTitle: String(route.query.activityTitle || examDetailRaw.value?.title || '').trim()
    }
  })
}

const startExam = async () => {
  if (showEndedStudentScoreCard.value) {
    await loadOwnScore()
    return
  }

  const aid = Number(activityId.value)
  if (!Number.isFinite(aid)) {
    ElMessage.warning('活动ID无效，无法开始考试')
    return
  }

  const paperId = resolvePaperId(examDetailRaw.value)
  if (!Number.isFinite(paperId)) {
    ElMessage.warning('未获取到试卷ID，无法开始考试')
    return
  }

  if (canEditExamConfig.value) {
    router.push({
      name: 'QuestionStats',
      params: { id: aid },
      query: {
        paperId: String(paperId),
        courseId: String(route.query.courseId || ''),
        courseTitle: route.query.courseTitle || '',
        teacherName: route.query.teacherName || '',
        activityTitle: String(route.query.activityTitle || examDetailRaw.value?.title || '').trim(),
        bizId: String(bizId.value || '')
      }
    })
    return
  }

  const duration = Number(examDetailRaw.value?.duration)
  if (!Number.isFinite(duration) || duration <= 0) {
    ElMessage.warning('未获取到考试总时长，无法开始考试')
    return
  }

  const existingSession = resolveSessionPayload(aid)
  const existingStartAt = Number(existingSession?.data?.startAt)
  const existingDuration = Number(existingSession?.data?.duration)
  const existingPaperId = Number(existingSession?.data?.paperId)
  const existingStudentPaperId = Number(
    existingSession?.data?.studentPaperId
    ?? existingSession?.data?.studentpaperId
    ?? existingSession?.data?.studentPaper?.id
  )
  const existingSubmitStatus = String(existingSession?.data?.submitStatus || '').trim().toLowerCase()
  const isSessionActive = Number.isFinite(existingStartAt)
    && existingStartAt > 0
    && Number.isFinite(existingDuration)
    && existingDuration > 0
    && (Date.now() < existingStartAt + existingDuration * 60 * 1000)
    && existingSubmitStatus !== 'submitted'

  if (isSessionActive && Number.isFinite(existingPaperId) && existingPaperId > 0) {
    router.push({
      name: 'ExamTaking',
      params: { id: aid },
      query: {
        courseId: route.query.courseId || '',
        courseTitle: route.query.courseTitle || '',
        teacherName: route.query.teacherName || '',
        bizId: String(bizId.value || ''),
        showResult: String(Number(examDetailRaw.value?.showResult) || 0),
        paperId: String(existingPaperId),
        studentPaperId: Number.isFinite(existingStudentPaperId) && existingStudentPaperId > 0
          ? String(existingStudentPaperId)
          : '',
        duration: String(existingDuration),
        startAt: String(existingStartAt),
        sessionKey: existingSession.key
      }
    })
    return
  }

  if (hasReachedMaxAttemptByFrontend(examDetailRaw.value)) {
    ElMessage.warning('已达到本次考试最大尝试次数，无法继续作答')
    return
  }

  try {
    await ElMessageBox.confirm(
      `本次考试总时长为 ${duration} 分钟，确认开始考试吗？`,
      '开始考试确认',
      {
        type: 'warning',
        confirmButtonText: '确认开始',
        cancelButtonText: '再看看'
      }
    )
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(error.message || '确认开始考试失败')
    return
  }

  loading.value = true
  try {
    const paperResponse = await testPaperApi.getTestPaperById(paperId)
    if (paperResponse?.code !== 1) {
      ElMessage.error('开始考试失败，请稍后重试')
      return
    }

    const resolvedStudentPaper = resolveStudentPaper(paperResponse?.data || {})
    const resolvedStudentPaperId = Number(
      resolvedStudentPaper?.id
      ?? paperResponse?.data?.studentPaperId
      ?? paperResponse?.data?.studentpaperId
    )

    const startAt = Date.now()
    const sessionKey = existingSession.key
    sessionStorage.setItem(sessionKey, JSON.stringify({
      activityId: aid,
      paperId,
      showResult: Number(examDetailRaw.value?.showResult) === 1 ? 1 : 0,
      studentPaperId: Number.isFinite(resolvedStudentPaperId) && resolvedStudentPaperId > 0
        ? resolvedStudentPaperId
        : null,
      studentPaper: resolvedStudentPaper || null,
      duration,
      startAt,
      paperData: paperResponse?.data || {}
    }))

    router.push({
      name: 'ExamTaking',
      params: { id: aid },
      query: {
        courseId: route.query.courseId || '',
        courseTitle: route.query.courseTitle || '',
        teacherName: route.query.teacherName || '',
        bizId: String(bizId.value || ''),
        showResult: String(Number(examDetailRaw.value?.showResult) || 0),
        paperId: String(paperId),
        studentPaperId: Number.isFinite(resolvedStudentPaperId) && resolvedStudentPaperId > 0
          ? String(resolvedStudentPaperId)
          : '',
        duration: String(duration),
        startAt: String(startAt),
        sessionKey
      }
    })
  } catch (error) {
    ElMessage.error('已达到本次考试最大尝试次数，无法继续作答')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadExamInfo()
  await loadOwnScoreForPanel()
})
</script>

<style scoped>
.exam-info-page {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 12% 8%, rgba(48, 145, 255, 0.12), transparent 28%),
    radial-gradient(circle at 88% 6%, rgba(40, 199, 111, 0.1), transparent 24%),
    #f6fbff;
}

.exam-info-card {
  max-width: 820px;
  margin: 0 auto;
  border-radius: 14px;
  border: 1px solid #e4edf8;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}

.exam-header {
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

.paper-title-block {
  padding: 14px 16px;
  border: 1px solid #d9e8f8;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
}

.paper-title-label {
  font-size: 12px;
  color: #7a8ba5;
}

.paper-title-text {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
  color: #20344a;
}

.metrics-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  border: 1px solid #dde9f8;
  border-radius: 10px;
  padding: 12px;
  background: #ffffff;
}

.metric-card.full {
  grid-column: 1 / -1;
}

.metric-label {
  font-size: 12px;
  color: #7a8ba5;
}

.metric-value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
  color: #1f3b5b;
}

.actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.my-score-card {
  margin-top: 14px;
  border: 1px solid #cbe5d3;
  background: linear-gradient(180deg, #f2fbf4 0%, #ffffff 100%);
  border-radius: 10px;
  padding: 12px;
}

.my-score-label {
  font-size: 12px;
  color: #5f7a66;
}

.my-score-value {
  margin-top: 6px;
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
  color: #14532d;
}

.my-score-attempt {
  margin-top: 8px;
  font-size: 12px;
  color: #5f7a66;
}

@media (max-width: 768px) {
  .exam-info-page {
    padding: 14px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>





