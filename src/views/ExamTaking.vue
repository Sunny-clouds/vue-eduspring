<template>
  <div class="exam-taking-page">
    <el-card class="exam-taking-card">
      <template #header>
        <div class="exam-header">
          <span class="title">考试页面</span>
          <el-button @click="goBack">返回考试信息</el-button>
        </div>
      </template>

      <el-result
        icon="info"
        title="已进入考试页面"
        sub-title="这里可以继续接入试题加载、计时、交卷等考试流程"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activityId = computed(() => Number(route.params.id))

const goBack = () => {
  router.push({
    name: 'ExamActivityInfo',
    params: { id: activityId.value },
    query: {
      courseId: route.query.courseId || '',
      courseTitle: route.query.courseTitle || '',
      teacherName: route.query.teacherName || ''
    }
  })
}
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
</style>
