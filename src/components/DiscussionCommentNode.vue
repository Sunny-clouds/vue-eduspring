<template>
  <div class="comment-item" :class="{ 'child-item': depth > 0 }">
    <div class="comment-avatar">
      <el-avatar :size="avatarSize" :src="comment.avatar">
        {{ (comment.username || '匿').slice(0, 1) }}
      </el-avatar>
    </div>

    <div class="comment-main">
      <div class="comment-author-line">
        <span class="comment-author">{{ comment.username || '匿名用户' }}</span>
      </div>

      <div class="comment-content">
        <span v-if="depth > 0" class="reply-relation">回复 {{ parentUsername || '匿名用户' }}：</span>
        <span>{{ comment.content }}</span>
      </div>

      <div class="comment-actions">
        <span class="comment-time">{{ comment.createTime || '-' }}</span>

        <el-button
          v-if="comment.id !== undefined && comment.id !== null"
          class="comment-action comment-like-action"
          type="primary"
          link
          :loading="likingCommentId === comment.id"
          @click="$emit('like', comment)"
        >
          <svg class="like-heart-icon" viewBox="0 0 1024 1024" aria-hidden="true">
            <path
              d="M512 896L176 560c-82-82-82-216 0-298s216-82 298 0l38 38 38-38c82-82 216-82 298 0s82 216 0 298L512 896z"
              fill="none"
              stroke="currentColor"
              stroke-width="64"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ Number(comment.likeCount || 0) }}</span>
        </el-button>

        <el-button
          v-if="comment.id !== undefined && comment.id !== null"
          class="comment-action"
          type="primary"
          link
          @click="$emit('reply', comment)"
        >
          回复
        </el-button>

        <el-button
          v-if="canDeleteReply(comment)"
          class="comment-action"
          type="danger"
          link
          :loading="deletingCommentId === comment.id"
          @click="$emit('delete', comment)"
        >
          删除
        </el-button>
      </div>

      <div
        v-if="isReplyingCurrent"
        :id="`inline-reply-${comment.id}`"
        class="inline-reply-box"
      >
        <div class="inline-reply-tip">回复 @{{ comment.username || '匿名用户' }}：</div>
        <el-input
          :model-value="replyDraft"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="请输入回复内容"
          @update:model-value="$emit('update-reply-draft', $event)"
        />
        <div class="inline-reply-actions">
          <el-button
            type="primary"
            size="small"
            :loading="sendingReply"
            @click="$emit('submit-reply')"
          >
            发送
          </el-button>
          <el-button size="small" @click="$emit('cancel-reply')">取消</el-button>
        </div>
      </div>

      <div v-if="showToggle" class="reply-toggle" @click="expanded = !expanded">
        {{ expanded ? '收起回复' : `展开 ${childrenCount} 条回复` }}
      </div>

      <div
        v-if="expanded && hasChildren"
        class="child-replies"
        :class="{ 'child-replies-flat': depth > 0 }"
      >
        <DiscussionCommentNode
          v-for="child in comment.children"
          :key="child.id"
          :comment="child"
          :depth="nextDepth"
          :parent-username="comment.username || '匿名用户'"
          :liking-comment-id="likingCommentId"
          :deleting-comment-id="deletingCommentId"
          :replying-comment-id="replyingCommentId"
          :reply-draft="replyDraft"
          :sending-reply="sendingReply"
          :can-delete-reply="canDeleteReply"
          @like="$emit('like', $event)"
          @reply="$emit('reply', $event)"
          @delete="$emit('delete', $event)"
          @update-reply-draft="$emit('update-reply-draft', $event)"
          @submit-reply="$emit('submit-reply')"
          @cancel-reply="$emit('cancel-reply')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-env vue/setup-compiler-macros */
import { computed, ref } from 'vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  },
  parentUsername: {
    type: String,
    default: ''
  },
  likingCommentId: {
    type: [Number, String, null],
    default: null
  },
  deletingCommentId: {
    type: [Number, String, null],
    default: null
  },
  replyingCommentId: {
    type: [Number, String, null],
    default: null
  },
  replyDraft: {
    type: String,
    default: ''
  },
  sendingReply: {
    type: Boolean,
    default: false
  },
  canDeleteReply: {
    type: Function,
    required: true
  }
})

defineEmits([
  'like',
  'reply',
  'delete',
  'update-reply-draft',
  'submit-reply',
  'cancel-reply'
])

const expanded = ref(props.depth > 0)

const hasChildren = computed(() => Array.isArray(props.comment?.children) && props.comment.children.length > 0)
const childrenCount = computed(() => (hasChildren.value ? props.comment.children.length : 0))
const avatarSize = computed(() => (props.depth > 0 ? 30 : 36))
const parentUsername = computed(() => props.parentUsername)
const nextDepth = computed(() => (props.depth > 0 ? 1 : props.depth + 1))
const isReplyingCurrent = computed(() => Number(props.replyingCommentId) === Number(props.comment?.id))
const showToggle = computed(() => hasChildren.value && props.depth === 0)
</script>

<style scoped>
.comment-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f2f5;
}

.child-item {
  padding: 12px 0;
  border-bottom: none;
}

.comment-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-author-line {
  margin-bottom: 6px;
}

.comment-author {
  font-size: 14px;
  color: #61666d;
  font-weight: 600;
}

.comment-content {
  color: #18191c;
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-relation {
  color: #409eff;
  margin-right: 2px;
}

.comment-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.comment-time {
  font-size: 12px;
  color: #9499a0;
}

.comment-action {
  padding: 0;
  min-height: auto;
  color: #9499a0;
}

.comment-action:hover {
  color: #409eff;
}

.comment-like-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.like-heart-icon {
  width: 14px;
  height: 14px;
  color: currentColor;
}

.reply-toggle {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
  user-select: none;
}

.inline-reply-box {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #ebeef5;
}

.inline-reply-tip {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.inline-reply-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.child-replies {
  margin-top: 10px;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f6f7f8;
}

.child-replies-flat {
  margin-left: -42px;
  background: transparent;
  padding: 0;
}
</style>
