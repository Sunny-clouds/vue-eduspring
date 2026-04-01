<template>
  <div class="discussion-detail-container" :class="{ inline: isInline }">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button type="primary" @click="goBack">{{ isInline ? '返回活动主页' : '返回' }}</el-button>
        </div>
      </template>

      <div class="discussion-header" v-if="activityData">
        <h1 class="discussion-title">{{ activityData.title }}</h1>
      </div>

      <el-divider>回复</el-divider>

      <div class="replies-list" v-loading="commentsLoading">
        <div
          v-for="comment in pagedComments"
          :key="comment.id"
          class="reply-item"
        >
          <div class="reply-avatar">
            <img
              v-if="comment.avatar"
              :src="comment.avatar"
              alt="头像"
              class="reply-avatar-image"
            />
            <span v-else>{{ String(comment.userName || '匿').slice(0, 1) }}</span>
          </div>
          <div class="reply-item-main">
            <div class="reply-meta">
              <span class="reply-author">{{ comment.userName }}</span>
              <span class="reply-time">{{ formatCommentTime(comment.createTime) }}</span>
            </div>
            <div class="reply-content">{{ comment.content }}</div>
          </div>
        </div>

        <el-empty
          v-if="pagedComments.length === 0 && !commentsLoading"
          description="暂无回复"
        />
      </div>

      <el-pagination
        v-if="commentsTotal > pageSize"
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="commentsTotal"
        layout="total, sizes, prev, pager, next"
        style="text-align: right; margin-top: 20px"
        @update:current-page="(val) => { currentPage = val }"
        @update:page-size="(val) => { pageSize = val }"
      />

      <el-divider />

      <div class="reply-form">
        <el-input
          v-model="newCommentText"
          type="textarea"
          rows="4"
          placeholder="写下你的回复..."
          maxlength="500"
          show-word-limit
          :disabled="postingComment || isActivityEnded"
        />
        <div class="reply-form-actions">
          <span v-if="isActivityEnded" class="reply-disabled-tip">活动已结束，当前不可回复</span>
          <el-button
            type="primary"
            @click="handleSubmitComment"
            :loading="postingComment"
            :disabled="isActivityEnded"
          >
            发送回复
          </el-button>
        </div>
      </div>

    </el-card>
  </div>
</template>

<script setup name="ActivityDiscussionDetailPage">
/* eslint-env vue/setup-compiler-macros */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { activityApi } from '@/api/activity'
import { ElMessage } from 'element-plus'

const props = defineProps({
  inlineActivityId: { type: Number, default: null },
  inlineTitle: { type: String, default: '' },
  inlineType: { type: Number, default: null },
  inlineStartTime: { type: String, default: '' },
  inlineEndTime: { type: String, default: '' }
})
const emit = defineEmits(['back'])

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const commentsLoading = ref(false)
const postingComment = ref(false)
const activityData = ref(null)
const commentsList = ref([])
const newCommentText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const activityId = computed(() => {
  if (props.inlineActivityId != null) return Number(props.inlineActivityId)
  return Number(route.params.id)
})
const isInline = computed(() => props.inlineActivityId != null)
const currentUserId = computed(() => Number(userStore.user?.id || 0))

const commentsTotal = computed(() => commentsList.value.length)
const pagedComments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return commentsList.value.slice(start, end)
})
const isActivityEnded = computed(() => {
  const endTime = String(activityData.value?.endTime || '').trim()
  if (!endTime) {
    return false
  }
  const normalized = endTime.includes('T') ? endTime : endTime.replace(' ', 'T')
  const endTimestamp = new Date(normalized).getTime()
  return Number.isFinite(endTimestamp) ? Date.now() > endTimestamp : false
})

const TYPE_MAP = { 1: '作业', 2: '考试', 3: '讨论', 4: '签到' }

const normalizeActivityData = (item = {}) => {
  const startTime = item.startTime || item.beginTime || item.startAt || ''
  const endTime = item.endTime || item.finishTime || item.endAt || ''
  const startMs = startTime ? new Date(startTime).getTime() : null
  const endMs = endTime ? new Date(endTime).getTime() : null
  const now = Date.now()

  let statusText = '进行中'
  if (startMs && now < startMs) {
    statusText = '未开始'
  } else if (endMs && now > endMs) {
    statusText = '已结束'
  }

  const typeCode = Number(item.type ?? item.activityType ?? 3)
  return {
    ...item,
    title: String(item.activityName || item.title || item.name || '活动讨论').trim(),
    typeCode,
    typeLabel: TYPE_MAP[typeCode] || '活动',
    startTime,
    endTime,
    content: String(item.content || item.description || '').trim(),
    timeRangeText: startTime && endTime ? `${startTime} ~ ${endTime}` : (startTime || endTime || '时间待定'),
    statusText
  }
}

const normalizeComments = (rows) => {
  const resolveMediaUrl = (rawUrl = '') => {
    const value = String(rawUrl || '').trim()
    if (!value) {
      return ''
    }
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value
    }
    if (value.startsWith('/api/')) {
      return value
    }
    if (value.startsWith('/')) {
      return `/api${value}`
    }
    return `/api/${value}`
  }

  const resolveCommentTime = (item = {}) => {
    const raw = item.submitTime ?? item.createTime ?? item.commentTime ?? item.create_date ?? item.createDate ?? item.gmtCreate ?? item.addTime ?? item.sendTime ?? item.time ?? item.ts
    if (raw === undefined || raw === null || raw === '') {
      return ''
    }
    if (typeof raw === 'number') {
      return raw > 1e12 ? raw : raw * 1000
    }
    const value = String(raw).trim()
    if (!value) {
      return ''
    }
    if (/^\d+$/.test(value)) {
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) {
        return ''
      }
      return numeric > 1e12 ? numeric : numeric * 1000
    }
    return value
  }

  return rows.map((item = {}, index) => ({
    ...item,
    id: item.id ?? item.commentId ?? index,
    userId: Number(item.userId ?? item.studentId ?? item.uid ?? item.authorId ?? 0),
    userName: String(
      item.userName || item.nickname || item.username || item.user?.nickname || item.user?.userName || item.user?.username || '匿名用户'
    ),
    avatar: resolveMediaUrl(
      item.avatar || item.avatarUrl || item.userAvatar || item.headImg || item.headImage || item.user?.avatar || item.user?.avatarUrl || ''
    ),
    createTime: resolveCommentTime(item),
    content: String(item.content || item.comment || item.text || '')
  }))
}

const formatCommentTime = (timeStr) => {
  if (!timeStr) return '-'
  try {
    if (typeof timeStr === 'number') {
      return new Date(timeStr).toLocaleString('zh-CN')
    }
    const value = String(timeStr).trim()
    const normalized = value.includes('T') ? value : value.replace(' ', 'T')
    const timestamp = new Date(normalized).getTime()
    if (!Number.isFinite(timestamp)) {
      return value
    }
    return new Date(timestamp).toLocaleString('zh-CN')
  } catch {
    return String(timeStr)
  }
}

const goBack = () => {
  if (isInline.value) {
    emit('back')
    return
  }
  router.back()
}

const loadActivityData = async () => {
  if (!Number.isFinite(activityId.value) || activityId.value <= 0) {
    ElMessage.error('活动ID无效')
    goBack()
    return
  }

  loading.value = true
  try {
    activityData.value = normalizeActivityData({
      id: activityId.value,
      title: props.inlineTitle || route.query.title || '活动讨论',
      type: props.inlineType ?? Number(route.query.type || 3),
      startTime: props.inlineStartTime || route.query.startTime || '',
      endTime: props.inlineEndTime || route.query.endTime || '',
      content: route.query.content || ''
    })
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  if (!Number.isFinite(activityId.value)) {
    return
  }

  commentsLoading.value = true
  try {
    const response = await activityApi.getCommentById(activityId.value)
    if (response?.code === 1) {
      const rows = Array.isArray(response.data?.rows)
        ? response.data.rows
        : (Array.isArray(response.data?.list)
          ? response.data.list
          : (Array.isArray(response.data) ? response.data : []))
      commentsList.value = normalizeComments(rows)
      currentPage.value = 1
    } else {
      commentsList.value = []
      ElMessage.warning(response?.msg || '加载回复失败')
    }
  } catch (error) {
    commentsList.value = []
    ElMessage.error(error.message || '加载回复出错')
  } finally {
    commentsLoading.value = false
  }
}

const handleSubmitComment = async () => {
  if (isActivityEnded.value) {
    ElMessage.warning('活动已结束，不能继续回复')
    return
  }

  const content = String(newCommentText.value || '').trim()
  if (!content) {
    ElMessage.warning('请输入回复内容')
    return
  }
  if (!Number.isFinite(currentUserId.value) || currentUserId.value <= 0) {
    ElMessage.error('未获取到用户信息，请重新登录')
    return
  }

  postingComment.value = true
  try {
    const response = await activityApi.saveComment({
      activityId: activityId.value,
      studentId: currentUserId.value,
      content
    })
    if (response?.code === 1) {
      ElMessage.success('回复成功')
      newCommentText.value = ''
      await loadComments()
    } else {
      ElMessage.error(response?.msg || '回复失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '回复出错')
  } finally {
    postingComment.value = false
  }
}

onMounted(async () => {
  await loadActivityData()
  await loadComments()
})

watch(() => props.inlineActivityId, async (newId) => {
  if (newId != null) {
    commentsList.value = []
    await loadActivityData()
    await loadComments()
  }
})
</script>

<style scoped>
.discussion-detail-container {
  width: 100%;
  padding: 30px;
  background:
    radial-gradient(circle at 8% 8%, rgba(135, 206, 235, 0.2), transparent 24%),
    radial-gradient(circle at 94% 4%, rgba(74, 144, 226, 0.16), transparent 18%),
    linear-gradient(180deg, #f6fbff 0%, #ffffff 52%);
  min-height: 100%;
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  overflow: hidden;
}

.discussion-detail-container.inline {
  padding: 0;
  background: transparent;
  animation: none;
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

.discussion-detail-container :deep(.el-card) {
  border: 1px solid #e8f3fe;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(20, 56, 92, 0.08);
  transition: all 0.35s ease;
  width: 100%;
}

.discussion-detail-container :deep(.el-card:hover) {
  box-shadow: 0 18px 38px rgba(20, 56, 92, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.discussion-detail-container :deep(.el-card__header) {
  background: linear-gradient(110deg, #7cc9ea 0%, #64b4e6 50%, #5da8db 100%);
  color: white;
  border: none;
  padding: 18px 24px;
}

.discussion-header {
  margin-bottom: 22px;
  padding: 24px 28px;
  background: linear-gradient(145deg, #f2f9ff 0%, #ffffff 100%);
  border-radius: 18px;
  border: 1px solid #dceefe;
  position: relative;
  overflow: hidden;
}

.discussion-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #17324d;
  line-height: 1.3;
}

.replies-list {
  min-height: 120px;
}

.reply-item {
  padding: 14px;
  border: 1px solid #e8f0f7;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  transition: all 0.22s ease;
}

.reply-item:hover {
  border-color: #cde4f7;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(31, 84, 132, 0.08);
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #8ec9f0 0%, #67afe3 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
}

.reply-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reply-item-main {
  width: 100%;
  min-width: 0;
}

.reply-meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.reply-author {
  font-size: 15px;
  font-weight: 700;
  color: #26445f;
}

.reply-time {
  font-size: 13px;
  color: #8a9fb4;
}

.reply-content {
  font-size: 14px;
  color: #425f79;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-form {
  margin-top: 14px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #dceefe;
  background: linear-gradient(180deg, #f6fbff 0%, #ffffff 100%);
}

.reply-form-actions {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.reply-disabled-tip {
  font-size: 13px;
  color: #d66b2d;
}

.discussion-detail-container :deep(.el-textarea__inner) {
  border-radius: 10px;
  border-color: #d7e8f7;
}

.discussion-detail-container :deep(.el-button--primary) {
  background: linear-gradient(90deg, #4ea8df 0%, #5b9ae0 100%);
  border: none;
}

@media (max-width: 768px) {
  .discussion-detail-container {
    padding: 14px;
  }

  .discussion-title {
    font-size: 24px;
  }

  .discussion-header {
    padding: 18px;
  }

  .reply-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
