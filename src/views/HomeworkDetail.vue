<template>
  <div class="homework-detail-page">
    <el-card class="homework-detail-card" v-loading="loading">
      <template #header>
        <div class="page-header">
          <div>
            <div class="title">作业详情</div>
            <div class="sub-title">查看学生提交的作业内容</div>
          </div>
          <el-button plain @click="goBack">返回</el-button>
        </div>
      </template>

      <div class="meta-row">
        <span v-if="activityTitle">活动：{{ activityTitle }}</span>
        <span v-if="courseTitle">课程：{{ courseTitle }}</span>
      </div>

      <el-alert
        v-if="!canViewHomework"
        type="warning"
        show-icon
        :closable="false"
        title="仅老师和管理员可查看作业详情"
      />

      <el-table
        v-else
        :data="rows"
        stripe
        style="width: 100%"
        empty-text="暂无作业提交记录"
      >
        <el-table-column label="序号" width="90" align="center">
          <template #default="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="studentName" label="学生姓名" min-width="160" />
        <el-table-column prop="content" label="作业内容" min-width="360" show-overflow-tooltip />
        <el-table-column prop="submitTime" label="提交时间" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { homeWorkApi } from '@/api/homeWork'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const rows = ref([])

const activityId = computed(() => Number(route.params.id))
const courseId = computed(() => Number(route.query.courseId))
const activityTitle = computed(() => String(route.query.activityTitle || '').trim())
const courseTitle = computed(() => String(route.query.courseTitle || '').trim())
const canViewHomework = computed(() => userStore.isTeacher || userStore.isAdmin)

const normalizeDateTime = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (typeof value === 'number') {
    const timestamp = value > 1e12 ? value : value * 1000
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const text = String(value).trim()
  if (!text) {
    return '-'
  }
  if (/^\d+$/.test(text)) {
    const numeric = Number(text)
    const timestamp = numeric > 1e12 ? numeric : numeric * 1000
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const timestamp = new Date(normalized).getTime()
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString('zh-CN') : text
}

const normalizeRows = (data) => {
  const list = Array.isArray(data?.rows)
    ? data.rows
    : (Array.isArray(data?.list)
      ? data.list
      : (Array.isArray(data) ? data : []))

  return list.map((item = {}, index) => ({
    id: Number(item.id ?? item.homeWorkId ?? index + 1),
    studentName: String(
      item.studentName
      || item.nickName
      || item.nickname
      || item.userName
      || item.username
      || item.student?.nickName
      || item.student?.nickname
      || item.student?.userName
      || '-'
    ).trim() || '-',
    content: String(item.content || item.homeWorkContent || item.homeworkContent || '-').trim() || '-',
    submitTime: normalizeDateTime(
      item.submitTime
      ?? item.createTime
      ?? item.createDate
      ?? item.gmtCreate
      ?? item.addTime
    )
  }))
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

const loadHomeworkList = async () => {
  if (!canViewHomework.value) {
    ElMessage.warning('仅老师和管理员可查看作业详情')
    return
  }

  const aid = Number(activityId.value)
  if (!Number.isFinite(aid) || aid <= 0) {
    ElMessage.warning('活动ID无效，无法查询作业详情')
    return
  }

  const cid = Number(courseId.value)
  if (!Number.isFinite(cid) || cid <= 0) {
    ElMessage.warning('课程ID无效，无法查询作业详情')
    return
  }

  loading.value = true
  try {
    const response = await homeWorkApi.getAll({
      activityId: aid,
      courseId: cid
    })
    if (response?.code === 1) {
      rows.value = normalizeRows(response?.data)
      return
    }
    ElMessage.warning(response?.msg || '获取作业详情失败')
  } catch (error) {
    ElMessage.error(error.message || '获取作业详情出错')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadHomeworkList()
})
</script>

<style scoped>
.homework-detail-page {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 10% 8%, rgba(46, 134, 255, 0.12), transparent 30%),
    radial-gradient(circle at 86% 6%, rgba(19, 191, 129, 0.1), transparent 24%),
    #f7fbff;
}

.homework-detail-card {
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
  margin-bottom: 14px;
  color: #4a5f78;
  font-size: 14px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .homework-detail-page {
    padding: 14px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
