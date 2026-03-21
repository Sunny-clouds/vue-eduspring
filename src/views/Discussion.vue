<template>
  <div class="discussion-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">讨论区</span>
          <el-button type="success" @click="openCreateDialog">
            发布新帖
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-input
          v-model="searchTitle"
          placeholder="请输入帖子标题"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearchByTitle"
        />
        <el-button type="primary" @click="handleSearchByTitle">按标题搜索</el-button>
        <el-input
          v-model="searchCourseName"
          placeholder="请输入课程名称"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearchByCourseName"
        />
        <el-button type="primary" @click="handleSearchByCourseName">按课程搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table
        :data="displayedDiscussions"
        stripe
        style="width: 100%"
        v-loading="loading"
        row-key="backendId"
        :default-expand-all="false"
      >
        <el-table-column prop="displayId" label="ID" width="80" />
        <el-table-column prop="title" label="帖子标题" min-width="300">
          <template #default="scope">
            <el-link type="primary" @click="viewDiscussion(scope.row)">
              {{ scope.row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="作者" width="100" />
        <el-table-column prop="courseName" label="所属课程" min-width="150" show-overflow-tooltip />
        <el-table-column prop="content" label="内容预览" min-width="250" show-overflow-tooltip />
        <el-table-column prop="commentCount" label="回复数" width="80" align="center" />
        <el-table-column prop="likeCount" label="点赞数" width="80" align="center" />
        <el-table-column prop="createTime" label="发布时间" width="180" />
        <el-table-column v-if="canManageDiscussion" label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              :loading="deletingDiscussionId === scope.row.backendId"
              @click="handleDeleteDiscussion(scope.row.backendId)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        style="text-align: right; margin-top: 20px"
        @update:current-page="(val) => { currentPage = val }"
        @update:page-size="(val) => { pageSize = val }"
        @change="loadDiscussions"
      />
    </el-card>

    <el-dialog
      v-model="showCreateDialog"
      title="发布新帖"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="newDiscussionForm" @submit.prevent="handleCreateDiscussion">
        <el-form-item label="所属课程" required>
          <el-select
            v-model="newDiscussionForm.courseId"
            placeholder="请选择课程"
            filterable
            clearable
            :loading="coursesLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in courseOptions"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="帖子标题" required>
          <el-input
            v-model="newDiscussionForm.title"
            placeholder="请输入帖子标题"
            clearable
          />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="newDiscussionForm.content"
            type="textarea"
            rows="5"
            placeholder="请输入帖子内容"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleCreateDiscussion"
          :loading="creatingDiscussion"
        >
          发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DiscussionPage">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { discussionApi } from '@/api/discussion'
import { courseApi } from '@/api/course'
import { useUserStore } from '@/stores/user'
import { normalizeTableData, addDisplayId } from '@/utils/table'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
// 仅教师/管理员允许删除帖子。
const canManageDiscussion = computed(() => userStore.isAdmin || userStore.isTeacher)

const discussions = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchTitle = ref('')
const searchCourseName = ref('')
const deletingDiscussionId = ref(null)
const courseOptions = ref([])
const coursesLoading = ref(false)

const showCreateDialog = ref(false)
const creatingDiscussion = ref(false)
const newDiscussionForm = ref({
  courseId: null,
  courseName: '',
  title: '',
  content: ''
})

// 统一生成前端展示序号，并兼容课程字段命名差异。
const displayedDiscussions = computed(() => {
  return addDisplayId(discussions.value, currentPage.value, pageSize.value, (item) => ({
    ...item,
    backendId: item.id,
    courseName: item.courseName || item.courseTitle || item.titleCourse || '-'
  }))
})

const loadCourseOptions = async () => {
  coursesLoading.value = true
  try {
    const response = await courseApi.getAllCourses()
    if (response?.code !== 1) {
      ElMessage.error(response?.msg || '获取课程列表失败')
      return
    }

    const { rows } = normalizeTableData(response.data)
    courseOptions.value = rows
      .map((item = {}) => ({
        id: Number(item.id),
        title: item.title || item.courseTitle || item.courseName || ''
      }))
      .filter(item => Number.isFinite(item.id) && !!item.title)
  } catch (error) {
    ElMessage.error(error.message || '获取课程列表出错')
  } finally {
    coursesLoading.value = false
  }
}

const openCreateDialog = async () => {
  showCreateDialog.value = true
  if (courseOptions.value.length === 0) {
    await loadCourseOptions()
  }
}

const loadDiscussions = async () => {
  loading.value = true
  try {
    // 按“标题 + 课程名”优先，其次单条件，最后全量分页。
    const titleKeyword = searchTitle.value.trim()
    const courseKeyword = searchCourseName.value.trim()
    let response

    if (titleKeyword && courseKeyword) {
      response = await discussionApi.getByTitleAndCourseName(
        titleKeyword,
        courseKeyword,
        currentPage.value,
        pageSize.value
      )
    } else if (titleKeyword) {
      response = await discussionApi.getByTitle(titleKeyword, currentPage.value, pageSize.value)
    } else if (courseKeyword) {
      response = await discussionApi.getByCourseName(courseKeyword, currentPage.value, pageSize.value)
    } else {
      response = await discussionApi.getAll(currentPage.value, pageSize.value)
    }

    if (response.code === 1) {
      const { rows, total: count } = normalizeTableData(response.data)
      discussions.value = rows
      total.value = count
    } else {
      ElMessage.error(response.msg || '获取讨论列表失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取讨论列表出错')
  } finally {
    loading.value = false
  }
}

const handleSearchByTitle = async () => {
  if (!searchTitle.value.trim()) {
    ElMessage.warning('请输入帖子标题')
    return
  }

  // 两个搜索框互斥，避免组合条件与单条件混用。
  searchCourseName.value = ''
  currentPage.value = 1
  await loadDiscussions()
}

const handleSearchByCourseName = async () => {
  if (!searchCourseName.value.trim()) {
    ElMessage.warning('请输入课程名称')
    return
  }

  // 两个搜索框互斥，避免组合条件与单条件混用。
  searchTitle.value = ''
  currentPage.value = 1
  await loadDiscussions()
}

const resetSearch = () => {
  searchTitle.value = ''
  searchCourseName.value = ''
  currentPage.value = 1
  loadDiscussions()
}

const handleDeleteDiscussion = async (id) => {
  if (!canManageDiscussion.value) {
    ElMessage.warning('仅教师或管理员可删除帖子')
    return
  }

  try {
    await ElMessageBox.confirm('删除后不可恢复，确认删除该帖子吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })

    deletingDiscussionId.value = id
    const response = await discussionApi.deleteDiscussion(id)
    if (response.code === 1) {
      ElMessage.success('帖子删除成功')
      await loadDiscussions()
    } else {
      ElMessage.error(response.msg || '帖子删除失败')
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(error.message || '帖子删除出错')
  } finally {
    deletingDiscussionId.value = null
  }
}

const handleCreateDiscussion = async () => {
  // 发帖前先做前端最小校验，避免无效请求。
  const currentUserId = Number(userStore.user?.id)
  if (!Number.isFinite(currentUserId)) {
    ElMessage.warning('未获取到当前用户信息，请重新登录后再试')
    return
  }

  if (!Number.isFinite(Number(newDiscussionForm.value.courseId))) {
    ElMessage.warning('请选择所属课程')
    return
  }
  if (!newDiscussionForm.value.title.trim()) {
    ElMessage.warning('请输入帖子标题')
    return
  }
  if (!newDiscussionForm.value.content.trim()) {
    ElMessage.warning('请输入帖子内容')
    return
  }

  creatingDiscussion.value = true
  try {
    const selectedCourse = courseOptions.value.find(item => item.id === Number(newDiscussionForm.value.courseId))
    const response = await discussionApi.save({
      ...newDiscussionForm.value,
      userId: currentUserId,
      courseId: Number(newDiscussionForm.value.courseId),
      courseName: selectedCourse?.title || ''
    })
    if (response.code === 1) {
      ElMessage.success('发布成功')
      showCreateDialog.value = false
      resetForm()
      currentPage.value = 1
      loadDiscussions()
    } else {
      ElMessage.error(response.msg || '发布失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '发布出错')
  } finally {
    creatingDiscussion.value = false
  }
}

const viewDiscussion = (row) => {
  // 详情页通过 query 传标题，便于详情接口做兜底检索。
  router.push({
    path: `/discussion/${row.backendId || row.id}`,
    query: {
      title: row.title || ''
    }
  })
}

const resetForm = () => {
  newDiscussionForm.value = {
    courseId: null,
    courseName: '',
    title: '',
    content: ''
  }
}

onMounted(() => {
  loadDiscussions()
})
</script>

<style scoped>
.discussion-container {
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

.discussion-container :deep(.el-card) {
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  width: 100%;
}

.discussion-container :deep(.el-card:hover) {
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  width: 100%;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
}

.discussion-container :deep(.el-card__header) {
  background: #87ceeb;
  color: white;
  border: none;
  padding: 24px;
  letter-spacing: 0.5px;
}

.discussion-container :deep(.el-table) {
  background-color: transparent;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  table-layout: auto;
}

.discussion-container :deep(.el-table__wrapper) {
  overflow-x: auto;
  overflow-y: hidden;
}

.discussion-container :deep(.el-table__header th) {
  background-color: var(--theme-table-head);
  color: #333;
  font-weight: 700;
  border-bottom: 2px solid var(--theme-primary);
  transition: all 0.3s ease;
}

.discussion-container :deep(.el-table__header th:hover) {
  background-color: var(--theme-table-head-hover);
}

.discussion-container :deep(.el-table__body tr:hover > td) {
  background-color: var(--theme-surface-soft) !important;
  transition: background-color 0.3s ease;
}

.discussion-container :deep(.el-table__body tr) {
  background-color: white;
  transition: all 0.3s ease;
}

.discussion-container :deep(.el-link) {
  color: var(--theme-primary);
  font-weight: 600;
  transition: all 0.3s ease;
}

.discussion-container :deep(.el-link:hover) {
  color: var(--theme-secondary);
  text-decoration: none;
}

.discussion-container :deep(.el-pagination) {
  margin-top: 25px;
  text-align: right;
  transition: all 0.3s ease;
}

.discussion-container :deep(.el-pagination button:hover) {
  color: var(--theme-primary);
}

.discussion-container :deep(.el-dialog) {
  border-radius: 16px;
}

.discussion-container :deep(.el-dialog__header) {
  background: #87ceeb;
  color: white;
  border: none;
  border-radius: 16px 16px 0 0;
  padding: 24px;
}

.discussion-container :deep(.el-dialog__title) {
  color: white;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
}

.discussion-container :deep(.el-dialog__close) {
  color: white;
  transition: all 0.3s ease;
}

.discussion-container :deep(.el-dialog__close:hover) {
  color: var(--theme-surface-soft);
}

.discussion-container :deep(.el-dialog__body) {
  padding: 28px 24px;
}

.discussion-container :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--theme-border-muted);
  background: #fafbfc;
}

.discussion-container :deep(.el-form-item__label) {
  font-weight: 600;
  color: #333;
  letter-spacing: 0.3px;
}

.discussion-container :deep(.el-form-item) {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.discussion-container :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.discussion-container :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.1);
}

.discussion-container :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.2);
}

.discussion-container :deep(.el-textarea__inner:focus) {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.1);
}
</style>





