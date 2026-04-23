<template>
  <div class="homework-page">
    <el-card class="homework-card" v-loading="loadingExisting">
      <template #header>
        <div class="page-header">
          <div>
            <div class="title">{{ isActivityEnded ? '查看作业' : '提交作业' }}</div>
            <div class="sub-title">
              {{ isActivityEnded ? '活动已结束，仅可查看自己已提交的内容' : '可在下方输入新内容，提交后覆盖上次作业' }}
            </div>
          </div>
          <el-button plain @click="goBack">返回</el-button>
        </div>
      </template>

      <div class="meta-row">
        <span v-if="activityTitle">活动：{{ activityTitle }}</span>
        <span v-if="courseTitle">课程：{{ courseTitle }}</span>
      </div>

      <el-alert
        v-if="!isStudent"
        type="warning"
        show-icon
        :closable="false"
        title="仅学生可查看或提交作业"
      />

      <template v-else>
        <el-alert
          v-if="isActivityEnded"
          class="block-alert"
          type="warning"
          show-icon
          :closable="false"
          title="活动已结束，当前不能再提交作业"
        />

        <section class="section-block">
          <div class="section-title">我已提交的作业</div>
          <el-empty
            v-if="!hasExistingHomework"
            :description="isActivityEnded ? '活动已结束，你还没有提交过这次作业' : '你还没有提交过这次作业'"
          />
          <el-input
            v-else
            :model-value="existingContent"
            type="textarea"
            :rows="10"
            readonly
            disabled
          />
        </section>

        <section v-if="!isActivityEnded" class="section-block">
          <div class="section-title">新的提交内容</div>
          <el-alert
            v-if="hasExistingHomework"
            class="replace-alert"
            type="info"
            show-icon
            :closable="false"
            title="提交后会覆盖你上次提交的作业内容"
          />

          <el-form label-position="top" @submit.prevent="handleSubmit">
            <el-form-item label="作业内容" required>
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="12"
                maxlength="5000"
                show-word-limit
                placeholder="请输入新的作业内容"
              />
            </el-form-item>

            <div class="actions">
              <el-button @click="goBack">取消</el-button>
              <el-button type="primary" :loading="submitting" @click="handleSubmit">提交作业</el-button>
            </div>
          </el-form>
        </section>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { homeWorkApi } from '@/api/homeWork'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const form = ref({
  content: ''
})
const existingContent = ref('')
const loadingExisting = ref(false)
const submitting = ref(false)
const hasExistingHomework = ref(false)

const isStudent = computed(() => userStore.isStudent)
const activityId = computed(() => Number(route.params.id))
const courseId = computed(() => Number(route.query.courseId))
const activityTitle = computed(() => String(route.query.activityTitle || '').trim())
const courseTitle = computed(() => String(route.query.courseTitle || '').trim())
const isActivityEnded = computed(() => {
  if (String(route.query.ended || '').trim() === '1') {
    return true
  }
  const endTime = String(route.query.endTime || '').trim()
  if (!endTime) {
    return false
  }
  const normalized = endTime.includes('T') ? endTime : endTime.replace(' ', 'T')
  const timestamp = new Date(normalized).getTime()
  return Number.isFinite(timestamp) ? Date.now() > timestamp : false
})

const resolveCurrentStudentId = () => {
  const user = userStore.user || {}
  const candidates = [user.id, user.userId, user.uid, user.studentId]
  for (const value of candidates) {
    const id = Number(value)
    if (Number.isFinite(id) && id > 0) {
      return id
    }
  }
  return null
}

const goBack = () => {
  const cid = Number(courseId.value)
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

const loadExistingHomework = async () => {
  if (!isStudent.value) {
    return
  }

  const aid = Number(activityId.value)
  const cid = Number(courseId.value)
  const studentId = resolveCurrentStudentId()
  if (!Number.isFinite(aid) || aid <= 0 || !Number.isFinite(cid) || cid <= 0 || !Number.isFinite(studentId) || studentId <= 0) {
    return
  }

  loadingExisting.value = true
  try {
    const response = await homeWorkApi.getByStudentIdAndCourseId({
      activityId: aid,
      courseId: cid,
      studentId
    })
    if (response?.code !== 1) {
      return
    }

    const data = response?.data || {}
    const content = String(data.content || data.homeWorkContent || data.homeworkContent || '').trim()
    hasExistingHomework.value = !!content
    existingContent.value = content
  } catch (error) {
    ElMessage.warning(error.message || '获取已提交作业失败')
  } finally {
    loadingExisting.value = false
  }
}

const handleSubmit = async () => {
  if (!isStudent.value) {
    ElMessage.warning('仅学生可提交作业')
    return
  }

  if (isActivityEnded.value) {
    ElMessage.warning('活动已结束，不能再提交作业')
    return
  }

  const aid = Number(activityId.value)
  if (!Number.isFinite(aid) || aid <= 0) {
    ElMessage.warning('活动ID无效，无法提交作业')
    return
  }

  const cid = Number(courseId.value)
  if (!Number.isFinite(cid) || cid <= 0) {
    ElMessage.warning('课程ID无效，无法提交作业')
    return
  }

  const studentId = resolveCurrentStudentId()
  if (!Number.isFinite(studentId) || studentId <= 0) {
    ElMessage.warning('未获取到当前学生ID，无法提交作业')
    return
  }

  const content = String(form.value.content || '').trim()
  if (!content) {
    ElMessage.warning('请输入新的作业内容')
    return
  }

  if (hasExistingHomework.value) {
    try {
      await ElMessageBox.confirm('你已提交过本次作业，确认用当前输入内容覆盖上次提交吗？', '覆盖确认', {
        type: 'warning',
        confirmButtonText: '确认覆盖',
        cancelButtonText: '取消'
      })
    } catch (error) {
      if (error === 'cancel' || error === 'close') {
        return
      }
      ElMessage.error(error.message || '覆盖确认失败')
      return
    }
  }

  submitting.value = true
  try {
    const response = await homeWorkApi.save({
      activityId: aid,
      courseId: cid,
      studentId,
      content
    })
    if (response?.code === 1) {
      hasExistingHomework.value = true
      existingContent.value = content
      form.value.content = ''
      ElMessage.success(response?.msg || '作业提交成功')
      return
    }
    ElMessage.warning(response?.msg || '作业提交失败')
  } catch (error) {
    ElMessage.error(error.message || '作业提交出错')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadExistingHomework()
})
</script>

<style scoped>
.homework-page {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 12% 8%, rgba(48, 145, 255, 0.12), transparent 28%),
    radial-gradient(circle at 88% 6%, rgba(40, 199, 111, 0.1), transparent 24%),
    #f6fbff;
}

.homework-card {
  max-width: 860px;
  margin: 0 auto;
  border-radius: 14px;
  border: 1px solid #e4edf8;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
  margin-bottom: 18px;
  color: #4a5f78;
  font-size: 14px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.block-alert,
.replace-alert {
  margin-bottom: 16px;
}

.section-block + .section-block {
  margin-top: 24px;
}

.section-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .homework-page {
    padding: 14px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
