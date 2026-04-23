<template>
  <div class="question-stats-page">
    <el-card class="question-stats-card">
      <template #header>
        <div class="exam-header">
          <span class="title">试题详情</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <div v-loading="loading" class="question-list">
        <div v-if="questionStats.length > 0">
          <div class="question-card" v-for="(stat, index) in questionStats" :key="stat.questionId || index">
            <div class="question-title-row">
              <div class="question-title">
                {{ index + 1 }}. {{ stat.content || '未设置题干' }}
              </div>
              <el-tag size="small" effect="light" class="question-type-tag">
                {{ resolveTypeText(stat.type) }}
              </el-tag>
            </div>

            <div class="question-options">
              <template v-if="Number(stat.type) === 3">
                <div class="stat-option-item">
                  <div class="option-label">正确</div>
                  <div class="stat-count">
                    <span class="count-number">{{ stat.totalTrue || 0 }}</span>
                    <span class="count-text">人</span>
                  </div>
                </div>
                <div class="stat-option-item">
                  <div class="option-label">错误</div>
                  <div class="stat-count">
                    <span class="count-number">{{ stat.totalFalse || 0 }}</span>
                    <span class="count-text">人</span>
                  </div>
                </div>
              </template>

              <template v-else>
                <div v-if="hasOptionA(stat)" class="stat-option-item">
                  <div class="option-label">A. {{ stat.optionA || '-' }}</div>
                  <div class="stat-count">
                    <span class="count-number">{{ stat.totalA || 0 }}</span>
                    <span class="count-text">人</span>
                  </div>
                </div>
                <div v-if="hasOptionB(stat)" class="stat-option-item">
                  <div class="option-label">B. {{ stat.optionB || '-' }}</div>
                  <div class="stat-count">
                    <span class="count-number">{{ stat.totalB || 0 }}</span>
                    <span class="count-text">人</span>
                  </div>
                </div>
                <div v-if="hasOptionC(stat)" class="stat-option-item">
                  <div class="option-label">C. {{ stat.optionC || '-' }}</div>
                  <div class="stat-count">
                    <span class="count-number">{{ stat.totalC || 0 }}</span>
                    <span class="count-text">人</span>
                  </div>
                </div>
                <div v-if="hasOptionD(stat)" class="stat-option-item">
                  <div class="option-label">D. {{ stat.optionD || '-' }}</div>
                  <div class="stat-count">
                    <span class="count-number">{{ stat.totalD || 0 }}</span>
                    <span class="count-text">人</span>
                  </div>
                </div>
              </template>
            </div>

            <div class="correct-answer-row">
              <span class="correct-answer-label">正确答案</span>
              <span class="correct-answer-value">{{ resolveCorrectAnswerText(stat) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无学生答题数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { studentAnswerApi } from '@/api/studentAnswer'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const questionStats = ref([])
const activityId = computed(() => Number(route.params.id))

const hasOptionA = (stat) => {
  return stat.optionA !== null && stat.optionA !== undefined && String(stat.optionA).trim() !== ''
}

const hasOptionB = (stat) => {
  return stat.optionB !== null && stat.optionB !== undefined && String(stat.optionB).trim() !== ''
}

const hasOptionC = (stat) => {
  return stat.optionC !== null && stat.optionC !== undefined && String(stat.optionC).trim() !== ''
}

const hasOptionD = (stat) => {
  return stat.optionD !== null && stat.optionD !== undefined && String(stat.optionD).trim() !== ''
}

const resolveTypeText = (type) => {
  const typeValue = Number(type)
  switch (typeValue) {
    case 1:
      return '单选题'
    case 2:
      return '多选题'
    case 3:
      return '判断题'
    default:
      return '-'
  }
}

const resolveCorrectAnswerText = (stat = {}) => {
  const typeValue = Number(stat.type)
  const answer = String(stat.correctAnswer || '').trim()
  if (!answer) {
    return '-'
  }

  if (typeValue === 3) {
    if (answer === '1') return '正确'
    if (answer === '0') return '错误'
  }

  return answer
}

const goBack = () => {
  const aid = Number(activityId.value)
  if (Number.isFinite(aid) && aid > 0) {
    router.push({
      name: 'ExamActivityInfo',
      params: { id: aid },
      query: {
        courseId: String(route.query.courseId || ''),
        courseTitle: route.query.courseTitle || '',
        teacherName: route.query.teacherName || '',
        activityTitle: String(route.query.activityTitle || '').trim(),
        bizId: String(route.query.bizId || '')
      }
    })
    return
  }
  router.back()
}

const loadQuestionStats = async () => {
  const paperId = Number(route.query.paperId)
  if (!Number.isFinite(paperId) || paperId <= 0) {
    ElMessage.error('试卷ID无效，无法获取试题详情')
    goBack()
    return
  }

  loading.value = true
  try {
    const response = await studentAnswerApi.getStudentAnswerByPaperId(paperId)
    if (response?.code === 1) {
      questionStats.value = Array.isArray(response?.data) ? response.data : []
      if (questionStats.value.length === 0) {
        ElMessage.info('暂无学生答题数据')
      }
    } else {
      ElMessage.error(response?.msg || '获取试题详情失败')
      goBack()
    }
  } catch (error) {
    ElMessage.error(error.message || '获取试题详情出错')
    goBack()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadQuestionStats()
})
</script>

<style scoped>
.question-stats-page {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 12% 8%, rgba(48, 145, 255, 0.12), transparent 28%),
    radial-gradient(circle at 88% 6%, rgba(40, 199, 111, 0.1), transparent 24%),
    #f6fbff;
}

.question-stats-card {
  max-width: 900px;
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

.question-list {
  min-height: 300px;
}

.question-card {
  border: 1px solid #dde9f8;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  background: #ffffff;
}

.question-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.question-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  line-height: 1.6;
  word-break: break-word;
  flex: 1;
}

.question-type-tag {
  margin-left: 12px;
  flex-shrink: 0;
}

.question-options {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

.stat-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f6fbff;
  border-radius: 8px;
  border: 1px solid #e4edf8;
  min-width: 0;
  width: 100%;
}

.option-label {
  font-size: 13px;
  color: #1f2d3d;
  flex: 0 1 auto;
  word-break: break-word;
}

.stat-count {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-left: 12px;
  white-space: nowrap;
}

.correct-answer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #b7eb8f;
  background: #f6ffed;
}

.correct-answer-label {
  font-size: 13px;
  font-weight: 600;
  color: #389e0d;
}

.correct-answer-value {
  font-size: 14px;
  font-weight: 700;
  color: #237804;
}

.count-number {
  font-size: 18px;
  font-weight: 700;
  color: #3080f0;
}

.count-text {
  font-size: 12px;
  color: #7a8ba5;
}

@media (max-width: 768px) {
  .question-stats-page {
    padding: 14px;
  }

  .question-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .question-type-tag {
    margin-left: 0;
    margin-top: 8px;
  }

  .correct-answer-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
