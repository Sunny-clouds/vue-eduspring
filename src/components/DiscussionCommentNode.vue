<template>
  <div class="comment-item" :class="{ 'child-item': depth > 0 }">
    <div class="reply-header">
      <div class="reply-user">
        <el-avatar :size="avatarSize" :src="comment.avatar">
          {{ (comment.username || '匿').slice(0, 1) }}
        </el-avatar>
        <span class="reply-author">{{ comment.username || '匿名用户' }}</span>
      </div>
      <span class="reply-time">{{ comment.createTime }}</span>
    </div>

    <div class="reply-content">
      <div v-if="depth > 0" class="reply-relation">
        {{ comment.username || '匿名用户' }} 回复 {{ parentUsername || '匿名用户' }}
      </div>
      {{ comment.content }}
    </div>

    <el-button
      v-if="comment.id !== undefined && comment.id !== null"
      class="reply-like-btn"
      type="primary"
      plain
      size="small"
      @click="$emit('like', comment)"
      :loading="likingCommentId === comment.id"
    >
      <span class="heart-icon" aria-hidden="true">❤</span>
      <span>{{ Number(comment.likeCount || 0) }}</span>
    </el-button>

    <el-button
      v-if="comment.id !== undefined && comment.id !== null"
      class="reply-action-btn"
      type="primary"
      link
      @click="$emit('reply', comment)"
    >
      回复
    </el-button>

    <el-button
      v-if="canDeleteReply(comment)"
      class="reply-action-btn"
      type="danger"
      link
      :loading="deletingCommentId === comment.id"
      @click="$emit('delete', comment)"
    >
      删除
    </el-button>

    <el-button
      v-if="hasChildren"
      class="reply-action-btn"
      type="primary"
      link
      @click="expanded = !expanded"
    >
      {{ expanded ? '收起评论' : `展开回复(${childrenCount})` }}
    </el-button>

    <div v-if="expanded && hasChildren" class="child-replies">
      <DiscussionCommentNode
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :depth="depth + 1"
        :parent-username="comment.username || '匿名用户'"
        :liking-comment-id="likingCommentId"
        :deleting-comment-id="deletingCommentId"
        :can-delete-reply="canDeleteReply"
        @like="$emit('like', $event)"
        @reply="$emit('reply', $event)"
        @delete="$emit('delete', $event)"
      />
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
  canDeleteReply: {
    type: Function,
    required: true
  }
})

defineEmits(['like', 'reply', 'delete'])

const expanded = ref(false)

const hasChildren = computed(() => Array.isArray(props.comment?.children) && props.comment.children.length > 0)
const childrenCount = computed(() => (hasChildren.value ? props.comment.children.length : 0))
const avatarSize = computed(() => (props.depth > 0 ? 30 : 36))
const parentUsername = computed(() => props.parentUsername)
</script>

<style scoped>
.comment-item {
  padding: 24px;
  border: 2px solid #ebeef5;
  border-radius: 12px;
  margin-bottom: 16px;
  background: white;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.comment-item:hover {
  border-color: var(--theme-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(var(--theme-primary-rgb), 0.15);
}

.child-item {
  margin-top: 12px;
  margin-bottom: 0;
  padding: 12px;
  border-radius: 10px;
  background: #fafcff;
  border: 1px solid #edf2f7;
  box-shadow: none;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.reply-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reply-author {
  font-weight: 700;
  color: var(--theme-primary);
  letter-spacing: 0.3px;
}

.reply-time {
  color: #909399;
  font-size: 13px;
  font-weight: 500;
}

.reply-content {
  line-height: 1.8;
  color: #333;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  font-weight: 500;
}

.reply-relation {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.reply-like-btn {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.reply-action-btn {
  margin-top: 10px;
  margin-left: 10px;
}

.heart-icon {
  color: #f56c6c;
  font-size: 14px;
  line-height: 1;
}

.child-replies {
  margin-top: 14px;
  margin-left: 26px;
  border-left: 2px solid #ebeef5;
  padding-left: 14px;
}
</style>
