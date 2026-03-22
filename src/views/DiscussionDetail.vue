<template>
  <div class="discussion-detail-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button type="primary" @click="goBack">返回</el-button>
        </div>
      </template>

      <div class="discussion-header" v-if="discussion">
        <h1 class="discussion-title">{{ discussion.title }}</h1>
        <div class="discussion-meta">
          <span>作者：{{ discussion.username }}</span>
          <span>|</span>
          <span>发布时间：{{ discussion.createTime }}</span>
        </div>
        <div class="discussion-actions">
          <el-button class="stat-btn" type="primary" plain @click="handlePostLike" :loading="likingPost">
            <svg class="heart-icon" viewBox="0 0 1024 1024" aria-hidden="true">
              <path
                d="M512 896L176 560c-82-82-82-216 0-298s216-82 298 0l38 38 38-38c82-82 216-82 298 0s82 216 0 298L512 896z"
                fill="none"
                stroke="currentColor"
                stroke-width="64"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>{{ Number(discussion.likeCount || 0) }}</span>
          </el-button>
          <div class="stat-display">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ Number(discussion.commentCount || repliesTotal || 0) }}</span>
          </div>
        </div>
        <el-divider />
        <div class="discussion-content">
          {{ discussion.content }}
        </div>
      </div>

      <el-divider>回复</el-divider>

      <div class="replies-list" v-loading="repliesLoading">
        <DiscussionCommentNode
          v-for="reply in replies"
          :key="reply.id"
          :comment="reply"
          :depth="0"
          :liking-comment-id="likingCommentId"
          :deleting-comment-id="deletingCommentId"
          :replying-comment-id="replyingToCommentId"
          :reply-draft="replyContent"
          :sending-reply="sendingReply"
          :can-delete-reply="canDeleteReply"
          @like="handleCommentLike"
          @reply="handlePrepareReply"
          @delete="handleDeleteComment"
          @update-reply-draft="updateInlineReplyDraft"
          @submit-reply="handleSendInlineReply"
          @cancel-reply="clearReplyTarget"
        />

        <el-empty
          v-if="replies.length === 0 && !repliesLoading"
          description="暂无回复"
        />
      </div>

      <el-pagination
        v-if="repliesTotal > pageSize"
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="repliesTotal"
        layout="total, sizes, prev, pager, next"
        style="text-align: right; margin-top: 20px"
        @update:current-page="(val) => { currentPage = val }"
        @update:page-size="(val) => { pageSize = val }"
        @change="loadReplies"
      />

      <el-divider />

      <div class="reply-form">
        <el-input
          v-model="rootReplyContent"
          type="textarea"
          rows="4"
          placeholder="写下你的评论..."
          maxlength="500"
          show-word-limit
        />
        <el-button
          type="primary"
          style="margin-top: 10px"
          @click="handleSendRootReply"
          :loading="sendingReply"
        >
          发送回复
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup name="DiscussionDetailPage">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { discussionApi } from '@/api/discussion'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import DiscussionCommentNode from '@/components/DiscussionCommentNode.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const discussion = ref(null)
const replies = ref([])
const loading = ref(false)
const repliesLoading = ref(false)
const sendingReply = ref(false)
const likingPost = ref(false)
const likingCommentId = ref(null)
const deletingCommentId = ref(null)
const replyContent = ref('')
const rootReplyContent = ref('')
const replyingToCommentId = ref(0)

const currentPage = ref(1)
const pageSize = ref(10)
const repliesTotal = ref(0)

const discussionId = route.params.id
// 用于“作者本人可删除评论”的权限判断。
const currentUserId = computed(() => Number(userStore.user?.id || 0))

const loadDiscussionDetail = async () => {
  loading.value = true
  try {
    // title 作为兜底检索条件，兼容后端缺少单帖详情接口的场景。
    const response = await discussionApi.getDiscussionDetail(discussionId, route.query.title)
    if (response.code === 1) {
      discussion.value = response.data || null
      if (!discussion.value) {
        ElMessage.warning('未查询到该帖子详情')
      }
    } else {
      ElMessage.error(response.msg || '获取帖子详情失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取帖子详情出错')
  } finally {
    loading.value = false
  }
}

const loadReplies = async () => {
  repliesLoading.value = true
  try {
    // 回复列表按分页参数获取，保持与分页控件状态一致。
    const response = await discussionApi.getReplies(discussionId, {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    if (response.code === 1) {
      const rows = Array.isArray(response?.data?.rows) ? response.data.rows : []
      replies.value = rows

      repliesTotal.value = Number(response?.data?.total || rows.length)
    } else {
      ElMessage.warning(response.msg || '获取回复失败')
    }
  } catch (error) {
    ElMessage.warning(error.message || '获取回复列表失败')
  } finally {
    repliesLoading.value = false
  }
}

const sendReply = async ({ parentId = 0, contentSource = '' } = {}) => {
  // 提交前做最小输入校验，避免发送空内容。
  const content = String(contentSource || '').trim()
  if (!content) {
    ElMessage.warning('请输入回复内容')
    return
  }

  const currentUserId = Number(userStore.user?.id)
  if (!Number.isFinite(currentUserId)) {
    ElMessage.warning('未获取到当前用户信息，请重新登录后再试')
    return
  }

  sendingReply.value = true
  try {
    const response = await discussionApi.addReply({
      postId: Number(discussionId),
      userId: currentUserId,
      // parentId=0 表示一级评论；>0 表示回复某条评论。
      parentId: Number(parentId || 0),
      content
    })
    if (response?.code === 1) {
      ElMessage.success('回复成功')
      if (Number(parentId || 0) > 0) {
        replyContent.value = ''
        clearReplyTarget()
      } else {
        rootReplyContent.value = ''
      }
      await loadReplies()
      await loadDiscussionDetail()
    } else {
      ElMessage.error(response?.msg || '回复失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '回复出错')
  } finally {
    sendingReply.value = false
  }
}

const handleSendInlineReply = async () => {
  await sendReply({
    parentId: Number(replyingToCommentId.value || 0),
    contentSource: replyContent.value
  })
}

const handleSendRootReply = async () => {
  await sendReply({
    parentId: 0,
    contentSource: rootReplyContent.value
  })
}

const handlePrepareReply = (reply) => {
  if (!reply || reply.id === undefined || reply.id === null) {
    return
  }
  // 记录被回复目标，供提交时生成 parentId。
  replyingToCommentId.value = Number(reply.id)
  replyContent.value = ''

  nextTick(() => {
    const target = document.getElementById(`inline-reply-${reply.id}`)
    if (!target) {
      return
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })

    const input = target.querySelector('textarea')
    if (input && typeof input.focus === 'function') {
      input.focus()
    }
  })
}

const updateInlineReplyDraft = (value) => {
  replyContent.value = String(value || '')
}

const clearReplyTarget = () => {
  // 恢复为发布一级评论状态。
  replyingToCommentId.value = 0
}

const handlePostLike = async () => {
  likingPost.value = true
  try {
    const response = await discussionApi.postLike(discussionId)
    if (response?.code === 1) {
      ElMessage.success('点赞成功')
      await loadDiscussionDetail()
    } else {
      ElMessage.error(response?.msg || '点赞失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '点赞出错')
  } finally {
    likingPost.value = false
  }
}

const handleCommentLike = async (reply) => {
  if (!reply || reply.id === undefined || reply.id === null) {
    ElMessage.warning('评论ID不存在，无法点赞')
    return
  }

  likingCommentId.value = reply.id
  try {
    const response = await discussionApi.commentLike(reply.id)
    if (response?.code === 1) {
      ElMessage.success('评论点赞成功')
      await loadReplies()
    } else {
      ElMessage.error(response?.msg || '评论点赞失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '评论点赞出错')
  } finally {
    likingCommentId.value = null
  }
}

const canDeleteReply = (reply) => {
  if (!reply || reply.id === undefined || reply.id === null) {
    return false
  }

  // 管理员/教师可删任意评论；学生仅可删除自己评论。
  if (userStore.isAdmin || userStore.isTeacher) {
    return true
  }

  return Number(reply.userId || 0) === currentUserId.value
}

const handleDeleteComment = async (reply) => {
  if (!canDeleteReply(reply)) {
    ElMessage.warning('无权限删除该评论')
    return
  }

  try {
    await ElMessageBox.confirm('删除后不可恢复，确认删除该评论吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })

    deletingCommentId.value = reply.id
    const response = await discussionApi.deleteComment(reply.id)
    if (response?.code === 1) {
      ElMessage.success('评论删除成功')
      await loadReplies()
      await loadDiscussionDetail()
    } else {
      ElMessage.error(response?.msg || '评论删除失败')
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(error.message || '评论删除出错')
  } finally {
    deletingCommentId.value = null
  }
}

const goBack = () => {
  // 保持浏览历史返回体验。
  router.back()
}

onMounted(() => {
  loadDiscussionDetail()
  loadReplies()
})
</script>

<style scoped>
.discussion-detail-container {
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

.discussion-detail-container :deep(.el-card) {
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  width: 100%;
}

.discussion-detail-container :deep(.el-card:hover) {
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.discussion-detail-container :deep(.el-card__header) {
  background: #87ceeb;
  color: white;
  border: none;
  padding: 24px;
}

.discussion-header {
  margin-bottom: 30px;
  padding: 35px 30px;
  background: #87ceeb;
  border-radius: 16px;
  color: white;
  box-shadow: 0 8px 25px rgba(var(--theme-primary-rgb), 0.2);
  transition: all 0.3s ease;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.discussion-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  line-height: 1.4;
}

.discussion-meta {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  font-weight: 500;
}

.discussion-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.stat-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.heart-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
  font-size: 14px;
  line-height: 1;
}

.stat-display {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-weight: 600;
}

.discussion-content {
  padding: 28px;
  background: white;
  border-radius: 12px;
  border-left: 5px solid var(--theme-primary);
  line-height: 1.8;
  color: #333;
  font-size: 15px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-top: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.discussion-content:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.replies-list {
  padding: 4px 6px;
  background: #ffffff;
  border-radius: 10px;
  margin-bottom: 30px;
  animation: fadeIn 0.8s ease-out 0.3s backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.reply-form {
  padding: 28px;
  background: white;
  border-radius: 12px;
  border: 2px dashed var(--theme-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out 0.4s backwards;
}

.reply-target-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #606266;
  font-size: 13px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reply-form:hover {
  border-color: var(--theme-secondary);
  box-shadow: 0 6px 18px rgba(var(--theme-primary-rgb), 0.12);
}

.discussion-detail-container :deep(.el-divider) {
  background-color: var(--theme-border-muted);
  margin: 28px 0;
  transition: all 0.3s ease;
}

.discussion-detail-container :deep(.el-divider__text) {
  color: var(--theme-primary);
  font-weight: 700;
  letter-spacing: 0.3px;
}

.discussion-detail-container :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.discussion-detail-container :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.1);
}

.discussion-detail-container :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.2);
}

.discussion-detail-container :deep(.el-textarea__inner:focus) {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.1);
}

.discussion-detail-container :deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.discussion-detail-container :deep(.el-pagination) {
  margin-top: 25px;
  text-align: right;
}

.discussion-detail-container :deep(.el-pagination button:hover) {
  color: var(--theme-primary);
}

.discussion-detail-container :deep(.el-empty) {
  padding: 40px 20px;
}
</style>





