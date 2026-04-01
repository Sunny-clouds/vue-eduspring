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
        <el-button type="primary" size="large" @click="startExam">开始考试</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { examApi } from '@/api/exam'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const examDetailRaw = ref({})

const activityId = computed(() => Number(route.params.id))

const examDetail = computed(() => {
  const detail = examDetailRaw.value || {}
  const allowRetake = Number(detail.allowRetake)
  const showResult = Number(detail.showResult)
  const duration = Number(detail.duration)
  const totalScore = Number(detail.totalScore)
  const maxAttempt = Number(detail.maxAttempt)

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
  if (!Number.isFinite(activityId.value)) {
    ElMessage.warning('活动ID无效')
    return
  }

  loading.value = true
  try {
    const response = await examApi.getExamByActivityId(activityId.value)
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

const startExam = () => {
  const aid = Number(activityId.value)
  if (!Number.isFinite(aid)) {
    ElMessage.warning('活动ID无效，无法开始考试')
    return
  }

  router.push({
    name: 'ExamTaking',
    params: { id: aid },
    query: {
      courseId: route.query.courseId || '',
      courseTitle: route.query.courseTitle || '',
      teacherName: route.query.teacherName || ''
    }
  })
}

onMounted(async () => {
  await loadExamInfo()
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
  text-align: right;
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
