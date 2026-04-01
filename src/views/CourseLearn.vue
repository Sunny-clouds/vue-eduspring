<template>
  <div class="course-learn-container">
    <el-card v-loading="pageLoading">
      <template #header>
        <div class="learn-header">
          <div>
            <div class="learn-title">课程学习页</div>
            <div class="learn-meta">{{ courseTitle || '未命名课程' }} <span v-if="teacherName">| 讲师：{{ teacherName }}</span></div>
          </div>
          <el-button class="learn-back-btn" type="primary" plain @click="goBack">返回课程中心</el-button>
        </div>
      </template>

      <div class="resource-toolbar" v-if="canManageResources">
        <el-button type="primary" :loading="uploadingResource" @click="openUploadDialog">上传资源</el-button>
      </div>

      <div class="resource-toolbar" v-else>
        <el-button
          v-if="isStudent"
          type="primary"
          :loading="selectingCourse"
          :disabled="selectedInCurrentCourse"
          @click="handleSelectCurrentCourse"
        >
          {{ selectedInCurrentCourse ? '已选课' : '选课' }}
        </el-button>
      </div>

      <div class="detail-categories">
        <button
          type="button"
          class="category-item"
          :class="{ active: activeCategory === 'resource' }"
          @click="activeCategory = 'resource'"
        >
          资源（{{ totalResourceCount }}）
        </button>
        <button
          v-if="canViewAllCategories"
          type="button"
          class="category-item"
          :class="{ active: activeCategory === 'member' }"
          @click="activeCategory = 'member'"
        >
          成员（{{ memberTotal }}）
        </button>
        <button
          v-if="canViewAllCategories"
          type="button"
          class="category-item"
          :class="{ active: activeCategory === 'activity' }"
          @click="handleActivityTabClick"
        >
          活动（{{ activityCount }}）
        </button>
        <button
          v-if="canViewAllCategories"
          type="button"
          class="category-item"
          :class="{ active: activeCategory === 'message' }"
          @click="activeCategory = 'message'"
        >
          消息（{{ messageCount }}）
        </button>
      </div>

      <div v-if="activeCategory === 'resource'">
        <div class="resource-overview" v-loading="resourceLoading">
          <div class="resource-overview-main">
            <div class="resource-overview-title">资源学习进度（经验值）</div>
            <div class="resource-progress-row">
              <div class="resource-progress-track">
                <div class="resource-progress-fill" :style="{ width: `${resourceProgressPercent}%` }" />
              </div>
              <div class="resource-progress-percent">{{ resourceProgressPercent }}%</div>
            </div>
          </div>
          <div class="resource-overview-stat">
            <div class="stat-title">已学习资源个数</div>
            <div class="stat-value">{{ learnedResourceCount }}</div>
          </div>
          <div class="resource-overview-stat">
            <div class="stat-title">资源总个数</div>
            <div class="stat-value">{{ totalResourceCount }}</div>
          </div>
        </div>

        <div class="resource-search-bar">
          <el-input
            v-model="resourceKeyword"
            clearable
            placeholder="根据资源名称搜索"
          />
        </div>

        <div class="resource-sections" v-loading="resourceLoading">
          <div v-for="group in filteredResourceGroups" :key="group.key" class="resource-group">
            <div class="resource-group-header" @click="toggleGroup(group.key)">
              <span class="resource-group-title">{{ group.title }}（0 / {{ group.items.length }}）</span>
              <span class="resource-group-arrow">{{ groupCollapsed[group.key] ? '⌄' : '⌃' }}</span>
            </div>

            <div v-show="!groupCollapsed[group.key]" class="resource-group-body">
              <div
                v-for="item in group.items"
                :key="item.backendId || item.displayId"
                class="resource-item-row"
                :class="{ 'resource-item-row-disabled': !canAccessResources }"
                @click="handleResourceClick(item)"
              >
                <div class="resource-item-left">
                  <div class="resource-thumb" :class="`thumb-${item.previewCategory}`">▶</div>
                  <div class="resource-item-content">
                    <button
                      type="button"
                      class="resource-item-title"
                      :title="item.resourceName"
                      :disabled="!canAccessResources"
                      @click.stop="handleResourceClick(item)"
                    >
                      {{ item.resourceName }}
                    </button>
                    <div class="resource-item-meta">
                      <span>允许下载</span>
                      <span>|</span>
                      <span>{{ item.sizeText }}</span>
                      <span v-if="item.durationText">|</span>
                      <span v-if="item.durationText">{{ item.durationText }}</span>
                      <span>|</span>
                      <span>{{ item.createTime }}</span>
                    </div>
                  </div>
                </div>

                <div class="resource-item-actions">
                  <el-button
                    class="resource-link"
                    link
                    :disabled="!canAccessResources"
                    @click.stop="handleResourceClick(item)"
                  >
                    信息
                  </el-button>
                  <el-button
                    class="resource-link"
                    link
                    :disabled="!canAccessResources"
                    @click.stop="handleResourceDownload(item)"
                  >
                    下载
                  </el-button>
                  <el-button
                    v-if="canManageResources"
                    type="danger"
                    link
                    :loading="deletingResourceId === item.backendId"
                    @click.stop="handleDeleteCourseResource(item)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-if="!resourceLoading && filteredResourceGroups.length === 0" description="暂无课程资源" />
      </div>

      <div v-else-if="canViewAllCategories && activeCategory === 'member'" class="member-panel" v-loading="memberLoading">
        <div class="member-panel-header">
          <div class="member-panel-title">成员（{{ memberTotal }}）</div>
        </div>

        <div
          class="member-panel-body"
          v-if="courseMembers.length > 0"
        >
          <div class="member-list">
            <button
              v-for="(member, index) in courseMembers"
              :key="member.uid"
              type="button"
              class="member-list-item"
              :class="{ active: !isStudent && activeMemberId === member.uid, 'member-list-item-readonly': isStudent }"
              @click="handleMemberClick(member.uid)"
            >
              <div class="member-rank" :class="index < 3 ? `member-rank-top${index + 1}` : ''">{{ index + 1 }}</div>
              <div class="member-avatar">
                <img v-if="member.avatar" :src="member.avatar" alt="头像" class="member-avatar-image" />
                <span v-else>{{ member.initial }}</span>
              </div>
              <div class="member-list-text">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-account">账号：{{ member.username }}</div>
              </div>
              <div class="member-score">{{ member.experienceText !== '-' ? member.experienceText + ' 经验值' : '-' }}</div>
            </button>
          </div>

          <div class="member-detail" v-if="activeMember">
            <div class="member-detail-header">
              <div class="member-avatar large">
                <img v-if="activeMember.avatar" :src="activeMember.avatar" alt="头像" class="member-avatar-image" />
                <span v-else>{{ activeMember.initial }}</span>
              </div>
              <div>
                <div class="member-detail-name">{{ activeMember.name }}</div>
                <div class="member-detail-account">账号：{{ activeMember.username }}</div>
              </div>
            </div>

            <div class="member-metrics">
              <div class="member-metric-item">
                <div class="label">学习进度</div>
                <div class="value">{{ activeMember.progressText }}</div>
              </div>
              <div class="member-metric-item">
                <div class="label">经验值</div>
                <div class="value">{{ activeMember.experienceText }}</div>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="该课程暂无选课成员" />

        <div class="member-pagination" v-if="memberTotal > 0">
          <el-pagination
            :current-page="memberPage"
            :page-size="memberPageSize"
            :page-sizes="[10, 20, 50]"
            :total="memberTotal"
            layout="total, sizes, prev, pager, next"
            @update:current-page="(val) => { memberPage = val }"
            @update:page-size="(val) => { memberPageSize = val; memberPage = 1 }"
            @change="loadCourseMembers"
          />
        </div>
      </div>

      <div v-else-if="canViewAllCategories && activeCategory === 'activity'" class="activity-panel">
        <template v-if="!activeActivityRow">
        <div class="activity-toolbar" v-loading="activityLoading">
          <el-button
            v-if="canPublishActivity"
            type="primary"
            @click="openActivityDialog"
          >
            发布活动
          </el-button>
        </div>

        <el-table
          v-loading="activityLoading"
          :data="displayedActivities"
          stripe
          style="width: 100%"
          empty-text="暂无活动"
          :row-class-name="() => 'activity-click-row'"
          @row-click="goActivityComments"
        >
          <el-table-column label="活动标题" min-width="280">
            <template #default="scope">
              <div class="activity-title-cell">
                <span>{{ scope.row.title || '-' }}</span>
                <el-tag :type="scope.row.ended ? 'info' : 'success'" size="small" effect="light">
                  {{ scope.row.activityProgressText }}
                </el-tag>
                <el-tag
                  v-if="scope.row.showStudentUrgentTip"
                  type="warning"
                  size="small"
                  effect="light"
                >
                  {{ scope.row.urgentTipText }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="typeText" label="类型" width="100" align="center" />
          <el-table-column prop="scoreText" label="分数" width="90" align="center" />
          <el-table-column prop="commentCount" label="参加人数" width="90" align="center" />
          <el-table-column prop="startTime" label="活动开始时间" width="180" />
          <el-table-column prop="endTime" label="活动结束时间" width="180" />
          <el-table-column v-if="canPublishActivity" label="操作" width="230" align="center" fixed="right">
            <template #default="scope">
              <el-button
                v-if="canPublishActivity"
                link
                type="primary"
                class="activity-edit-time-btn"
                :disabled="updatingActivityTime"
                @click.stop="openEditActivityTimeDialog(scope.row)"
              >
                修改时间
              </el-button>
              <el-button
                v-if="canPublishActivity"
                link
                type="warning"
                :disabled="scope.row.ended"
                :loading="endingActivityId === scope.row.backendId"
                @click.stop="handleEndActivity(scope.row)"
              >
                结束活动
              </el-button>
              <el-button
                v-if="canPublishActivity"
                link
                type="danger"
                :loading="deletingActivityId === scope.row.backendId"
                @click.stop="handleDeleteActivity(scope.row.backendId)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        </template>

        <ActivityDiscussionDetail
          v-else
          :inline-activity-id="Number(activeActivityRow.backendId || activeActivityRow.id)"
          :inline-title="activeActivityRow.title || ''"
          :inline-type="Number(activeActivityRow.type || activeActivityRow.activityType || activeActivityRow.activity_type || 0)"
          :inline-start-time="activeActivityRow.startTime || ''"
          :inline-end-time="activeActivityRow.endTime || ''"
          @back="activeActivityRow = null"
        />
      </div>

      <div v-else-if="canViewAllCategories && activeCategory === 'message'" class="category-placeholder">
        <el-empty description="消息模块开发中" />
      </div>

      <el-dialog
        v-model="showActivityDialog"
        title="发布活动"
        width="560px"
        :close-on-click-modal="false"
      >
        <el-form label-width="90px" @submit.prevent="handleCreateActivity">
          <el-form-item label="活动标题" required>
            <el-input
              v-model="activityForm.title"
              placeholder="请输入活动标题"
              clearable
            />
          </el-form-item>
          <el-form-item label="活动类型" required>
            <el-select
              v-model="activityForm.type"
              placeholder="请选择活动类型"
              style="width: 100%"
            >
              <el-option
                v-for="item in activityTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="活动分数" required>
            <el-input
              v-model="activityForm.score"
              placeholder="请输入活动分数"
            />
          </el-form-item>
          <el-form-item label="活动时间" required class="activity-time-form-item">
            <div class="activity-time-range">
              <div class="activity-time-block">
                <div class="activity-time-label">开始</div>
                <el-date-picker
                  v-model="activityForm.startTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择开始时间"
                  style="width: 100%"
                  :disabled-date="disableStartDate"
                />
              </div>
              <span class="activity-time-separator">至</span>
              <div class="activity-time-block">
                <div class="activity-time-label">结束</div>
                <el-date-picker
                  v-model="activityForm.endTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择结束时间"
                  style="width: 100%"
                  :disabled-date="disableEndDate"
                />
              </div>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showActivityDialog = false" :disabled="creatingActivity">取消</el-button>
          <el-button type="primary" :loading="creatingActivity" @click="handleCreateActivity">发布</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="showEditActivityTimeDialog"
        title="修改活动时间"
        width="560px"
        :close-on-click-modal="false"
      >
        <el-form label-width="90px" @submit.prevent="handleUpdateActivityTime">
          <el-form-item label="活动标题">
            <el-input :model-value="editActivityTimeForm.title" disabled />
          </el-form-item>
          <el-form-item label="活动时间" required class="activity-time-form-item">
            <div class="activity-time-range">
              <div class="activity-time-block">
                <div class="activity-time-label">开始</div>
                <el-date-picker
                  v-model="editActivityTimeForm.startTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择开始时间"
                  style="width: 100%"
                  :disabled-date="disableEditStartDate"
                />
              </div>
              <span class="activity-time-separator">至</span>
              <div class="activity-time-block">
                <div class="activity-time-label">结束</div>
                <el-date-picker
                  v-model="editActivityTimeForm.endTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择结束时间"
                  style="width: 100%"
                  :disabled-date="disableEditEndDate"
                />
              </div>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showEditActivityTimeDialog = false" :disabled="updatingActivityTime">取消</el-button>
          <el-button type="primary" :loading="updatingActivityTime" @click="handleUpdateActivityTime">保存</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="previewDialogVisible"
        :title="previewTitle || '在线预览'"
        width="900px"
        class="preview-dialog"
        @close="handlePreviewClose"
      >
        <div class="preview-container">
          <video
            v-if="previewType === 'video'"
            ref="previewVideoRef"
            :src="previewUrl"
            @loadedmetadata="handlePreviewVideoLoaded"
            controls
            class="preview-video"
          />

          <img
            v-else-if="previewType === 'image'"
            :src="previewUrl"
            class="preview-image"
            alt="资源预览"
          />

          <iframe
            v-else-if="previewType === 'pdf' || previewType === 'office'"
            :src="previewFrameUrl"
            class="preview-iframe"
            frameborder="0"
          />

          <div v-else class="preview-fallback">
            <div class="preview-fallback-title">当前文件暂不支持内嵌预览</div>
            <el-button type="primary" @click="openPreviewInNewTab">新窗口打开</el-button>
          </div>
        </div>

        <div class="preview-tip" v-if="previewType === 'pdf'">
          PDF 预览依赖浏览器内置阅读器，若无法显示请使用“新窗口打开”。
        </div>

        <template #footer>
          <el-button @click="handlePreviewClose">关闭</el-button>
          <el-button type="primary" @click="openPreviewInNewTab">新窗口打开</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="uploadDialogVisible"
        title="上传课程资源"
        width="520px"
        :close-on-click-modal="false"
      >
        <el-form label-width="90px">
          <el-form-item label="资源名称">
            <el-input
              v-model="resourceNameInput"
              placeholder="请输入资源名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="上传文件">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :limit="1"
              :on-change="handleSelectUploadFile"
              accept="*"
              :disabled="uploadingResource"
            >
              <el-button type="primary" plain>选择文件</el-button>
            </el-upload>
            <span class="selected-file-name">{{ selectedUploadFileName || '未选择文件' }}</span>
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="uploadDialogVisible = false" :disabled="uploadingResource">取消</el-button>
          <el-button type="primary" :loading="uploadingResource" @click="handleUploadCourseResource">
            确认上传
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup name="CourseLearnPage">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { courseApi } from '@/api/course'
import { uploadApi } from '@/api/upload'
import { studentCourseApi } from '@/api/studentCourse'
import { activityApi } from '@/api/activity'
import ActivityDiscussionDetail from '@/views/ActivityDiscussionDetail.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pageLoading = ref(false)
const resourceLoading = ref(false)
const memberLoading = ref(false)
const selectingCourse = ref(false)
const selectedInCurrentCourse = ref(false)
const uploadingResource = ref(false)
const deletingResourceId = ref(null)
const courseResourceList = ref([])
const resourceNameInput = ref('')
const uploadDialogVisible = ref(false)
const selectedUploadFile = ref(null)
const selectedUploadFileName = ref('')
const resourceKeyword = ref('')
const previewDialogVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')
const previewType = ref('doc')
const previewFrameUrl = ref('')
const previewVideoRef = ref(null)
const previewPositionMap = ref({})
const activeCategory = ref('resource')
const activityCount = ref(0)
const messageCount = ref(0)
const activityLoading = ref(false)
const activeActivityRow = ref(null)
const creatingActivity = ref(false)
const deletingActivityId = ref(null)
const endingActivityId = ref(null)
const showActivityDialog = ref(false)
const showEditActivityTimeDialog = ref(false)
const updatingActivityTime = ref(false)
const editActivityTimeForm = ref({
  activityId: null,
  title: '',
  startTime: '',
  endTime: ''
})
const activityTypeOptions = [
  { value: 1, label: '作业' },
  { value: 2, label: '考试' },
  { value: 3, label: '讨论' },
  { value: 4, label: '签到' }
]
const activityTotal = ref(0)
const activities = ref([])
const activityForm = ref({
  title: '',
  type: '',
  score: '',
  startTime: '',
  endTime: ''
})
const courseMembers = ref([])
const activeMemberId = ref(null)
const memberPage = ref(1)
const memberPageSize = ref(10)
const memberTotal = ref(0)
const groupCollapsed = ref({
  video: false,
  doc: false,
  image: false,
  other: false
})

const courseId = computed(() => Number(route.params.id))
const courseTitle = computed(() => String(route.query.title || '').trim())
const teacherName = computed(() => String(route.query.teacherName || '').trim())
const isStudent = computed(() => userStore.isStudent)
const canManageResources = computed(() => userStore.isAdmin || userStore.isTeacher)
const canPublishActivity = computed(() => userStore.isAdmin || userStore.isTeacher)
const canAccessResources = computed(() => !isStudent.value || selectedInCurrentCourse.value)
const canViewAllCategories = computed(() => !isStudent.value || selectedInCurrentCourse.value)
const currentUserName = computed(() => String(userStore.user?.username || userStore.user?.userName || '').trim())
const currentUserNickname = computed(() => String(userStore.user?.nickname || userStore.user?.nickName || '').trim())
const currentTeacherId = computed(() => {
  const id = Number(userStore.user?.id)
  return Number.isFinite(id) ? id : null
})
const studentSelfMember = computed(() => {
  const username = currentUserName.value
  const nickname = currentUserNickname.value
  return courseMembers.value.find((item = {}) => {
    if (username && item.username === username) {
      return true
    }
    return !!(nickname && item.name === nickname)
  }) || null
})
const activeMember = computed(() => {
  if (isStudent.value) {
    return studentSelfMember.value
  }
  return courseMembers.value.find(item => item.uid === activeMemberId.value) || null
})
const displayedActivities = computed(() => {
  return activities.value.map((item = {}) => {
    const typeNumber = Number(item.type ?? item.activityType ?? item.activity_type)
    const typeText = activityTypeOptions.find(option => option.value === typeNumber)?.label || '-'
    const endTimeRaw = String(item.endTime || item.end_time || '').trim()
    const normalizedEndTime = endTimeRaw && !endTimeRaw.includes('T') ? endTimeRaw.replace(' ', 'T') : endTimeRaw
    const endTimestamp = new Date(normalizedEndTime).getTime()
    const remainingMs = Number.isFinite(endTimestamp) ? endTimestamp - Date.now() : NaN
    const ended = Number.isFinite(endTimestamp) ? Date.now() > endTimestamp : false
    const endingSoon = Number.isFinite(remainingMs) && remainingMs > 0 && remainingMs <= 24 * 60 * 60 * 1000
    return {
    ...item,
    backendId: item.id,
    username: item.username || item.nickname || item.userName || item.creatorName || '匿名用户',
    startTime: item.startTime || item.start_time || item.createTime || '-',
    endTime: item.endTime || item.end_time || '-',
    ended,
    endingSoon,
    activityProgressText: ended ? '已结束' : '正在进行',
    showStudentUrgentTip: isStudent.value && endingSoon,
    urgentTipText: '不足1天，及时参加',
    typeText,
    scoreText: Number.isFinite(Number(item.score)) ? Number(item.score) : '-',
    commentCount: Number(
      item.participantCount ?? item.joinCount ?? item.attendCount ?? item.memberCount ?? item.studentCount ?? item.commentCount ?? 0
    )
    }
  })
})

const handleMemberClick = (uid) => {
  if (isStudent.value) {
    return
  }
  activeMemberId.value = uid
}

const handleActivityTabClick = () => {
  activeCategory.value = 'activity'
  activeActivityRow.value = null
}

const goBack = () => {
  router.push('/courses')
}

const detectUploadType = (fileName = '') => {
  const name = String(fileName || '').toLowerCase()
  if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(name)) return 'image'
  if (/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/.test(name)) return 'video'
  return 'doc'
}

const getVideoDurationSeconds = (file) => {
  return new Promise((resolve) => {
    try {
      const objectUrl = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = objectUrl

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl)
        video.removeAttribute('src')
      }

      video.onloadedmetadata = () => {
        const duration = Math.max(0, Math.round(Number(video.duration) || 0))
        cleanup()
        resolve(duration)
      }

      video.onerror = () => {
        cleanup()
        resolve(0)
      }
    } catch (error) {
      resolve(0)
    }
  })
}

const formatResourceType = (value = '', fileName = '') => {
  const type = String(value || '').toLowerCase()
  if (type.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName)) return '图片'
  if (type.includes('video') || /\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i.test(fileName)) return '视频'
  return '文档'
}

const resolveBasePreviewCategory = (typeText = '', url = '') => {
  if (typeText.includes('视频') || /\.(mp4|webm|ogg|mov|m4v|avi)$/.test(url)) {
    return 'video'
  }
  if (typeText.includes('图片') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(url)) {
    return 'image'
  }
  return 'doc'
}

const detectPreviewType = (row = {}) => {
  const typeText = String(row.resourceType || '').toLowerCase()
  const url = String(row.resourceUrl || '').toLowerCase()
  return resolveBasePreviewCategory(typeText, url)
}

const detectPreviewMode = (row = {}) => {
  const typeText = String(row.resourceType || row.type || '').toLowerCase()
  const url = String(row.resourceUrl || '').toLowerCase()
  const baseCategory = resolveBasePreviewCategory(typeText, url)

  if (baseCategory !== 'doc') {
    return baseCategory
  }
  if (typeText.includes('pdf') || /\.pdf($|\?)/.test(url)) {
    return 'pdf'
  }
  if (typeText.includes('文档') || /\.(doc|docx|ppt|pptx|xls|xlsx)$/.test(url)) {
    return 'office'
  }
  return 'doc'
}

const resolvePreviewFrameUrl = (mode, url) => {
  if (!url) {
    return ''
  }
  if (mode === 'office') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
  }
  return url
}

const formatFileSize = (size) => {
  const value = Number(size || 0)
  if (!Number.isFinite(value) || value <= 0) {
    return '-'
  }
  if (value < 1024) {
    return `${value} B`
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(2)} KB`
  }
  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`
  }
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const formatDurationLabel = (seconds) => {
  const total = Number(seconds || 0)
  if (!Number.isFinite(total) || total <= 0) {
    return ''
  }
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const parseDateTimeValue = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) {
    return NaN
  }
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  return new Date(normalized).getTime()
}

const disableStartDate = (date) => {
  const endTimestamp = parseDateTimeValue(activityForm.value.endTime)
  if (!Number.isFinite(endTimestamp)) {
    return false
  }
  return date.getTime() > endTimestamp
}

const disableEndDate = (date) => {
  const startTimestamp = parseDateTimeValue(activityForm.value.startTime)
  if (!Number.isFinite(startTimestamp)) {
    return false
  }
  return date.getTime() < startTimestamp
}

const disableEditStartDate = (date) => {
  const endTimestamp = parseDateTimeValue(editActivityTimeForm.value.endTime)
  if (!Number.isFinite(endTimestamp)) {
    return false
  }
  return date.getTime() > endTimestamp
}

const disableEditEndDate = (date) => {
  const startTimestamp = parseDateTimeValue(editActivityTimeForm.value.startTime)
  if (!Number.isFinite(startTimestamp)) {
    return false
  }
  return date.getTime() < startTimestamp
}

const formatMemberStatus = (status) => {
  if (status === 1 || status === '1') return '学习中'
  if (status === 2 || status === '2') return '已完成'
  if (status === 0 || status === '0') return '已退课'
  return '已选课'
}

const normalizeCourseMembers = (data) => {
  const rows = Array.isArray(data?.rows)
    ? data.rows
    : (Array.isArray(data?.list)
      ? data.list
      : (Array.isArray(data) ? data : []))

  return rows.map((item = {}, index) => {
    const username = String(item.username || item.userName || item.account || '').trim()
    const nickname = String(item.nickname || item.nickName || item.studentName || '').trim()
    const name = nickname || username || `成员${index + 1}`
    const uid = `${username || 'unknown'}-${index}`
    const progress = Number(item.progress ?? item.studyProgress ?? item.schedule ?? 0)
    const totalScore = item.totalScore != null ? Number(item.totalScore) : null
    const status = item.status

    return {
      uid,
      id: Number(item.id ?? item.userId ?? item.studentId ?? index + 1),
      name,
      username: username || '-',
      avatar: String(item.avatar || item.avatarUrl || '').trim(),
      initial: name.slice(0, 1).toUpperCase(),
      progressText: Number.isFinite(progress) ? `${progress}%` : '-',
      statusText: formatMemberStatus(status),
      selectTime: item.selectTime || item.createTime || item.updateTime || '-',
      experienceText: totalScore != null ? `${totalScore}` : '-',
      totalScore: totalScore ?? 0
    }
  })
}

const loadCourseMembers = async () => {
  if (!Number.isFinite(courseId.value)) {
    courseMembers.value = []
    activeMemberId.value = null
    memberTotal.value = 0
    return
  }

  memberLoading.value = true
  try {
    const response = await studentCourseApi.getCourseById(courseId.value, memberPage.value, memberPageSize.value)
    if (response?.code === 1) {
      const rows = Array.isArray(response?.data?.rows)
        ? response.data.rows
        : (Array.isArray(response?.data?.list)
          ? response.data.list
          : (Array.isArray(response?.data) ? response.data : []))
      const members = normalizeCourseMembers(rows)
      const total = Number(response?.data?.total ?? response?.data?.count ?? members.length)
      courseMembers.value = members.sort((a, b) => (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0))
      memberTotal.value = Number.isFinite(total) ? total : members.length
      if (isStudent.value) {
        const selfMember = members.find((item = {}) => {
          const username = currentUserName.value
          const nickname = currentUserNickname.value
          if (username && item.username === username) {
            return true
          }
          return !!(nickname && item.name === nickname)
        })
        activeMemberId.value = selfMember?.uid ?? null
      } else if (!members.some(item => item.uid === activeMemberId.value)) {
        activeMemberId.value = members[0]?.uid ?? null
      }
    } else {
      courseMembers.value = []
      activeMemberId.value = null
      memberTotal.value = 0
    }
  } catch (error) {
    courseMembers.value = []
    activeMemberId.value = null
    memberTotal.value = 0
  } finally {
    memberLoading.value = false
  }
}

const normalizeActivityRows = (data) => {
  if (Array.isArray(data?.rows)) {
    return data.rows
  }
  if (Array.isArray(data?.list)) {
    return data.list
  }
  if (Array.isArray(data)) {
    return data
  }
  return []
}

const loadActivities = async () => {
  activityLoading.value = true
  try {
    const response = await activityApi.getAllByCourseId(courseId.value)

    if (response?.code === 1) {
      const rows = normalizeActivityRows(response.data)
      const total = Number(response?.data?.total ?? response?.data?.count ?? rows.length)
      activities.value = rows
      activityTotal.value = Number.isFinite(total) ? total : rows.length
      activityCount.value = activityTotal.value
    } else {
      activities.value = []
      activityTotal.value = 0
      activityCount.value = 0
      ElMessage.warning(response?.msg || '获取活动失败')
    }
  } catch (error) {
    activities.value = []
    activityTotal.value = 0
    activityCount.value = 0
    ElMessage.warning(error.message || '获取活动出错')
  } finally {
    activityLoading.value = false
  }
}

const openActivityDialog = () => {
  if (!canPublishActivity.value) {
    ElMessage.warning('仅教师或管理员可发布活动')
    return
  }
  activityForm.value = {
    title: '',
    type: '',
    score: '',
    startTime: '',
    endTime: ''
  }
  showActivityDialog.value = true
}

const handleCreateActivity = async () => {
  if (!canPublishActivity.value) {
    ElMessage.warning('仅教师或管理员可发布活动')
    return
  }

  const title = String(activityForm.value.title || '').trim()
  const type = Number(activityForm.value.type)
  const score = Number(activityForm.value.score)
  const startTime = String(activityForm.value.startTime || '').trim()
  const endTime = String(activityForm.value.endTime || '').trim()
  const userId = Number(userStore.user?.id)

  if (!title) {
    ElMessage.warning('请输入活动标题')
    return
  }
  if (!Number.isFinite(type) || ![1, 2, 3, 4].includes(type)) {
    ElMessage.warning('请选择活动类型')
    return
  }
  if (!Number.isFinite(score)) {
    ElMessage.warning('请输入活动分数')
    return
  }
  if (!startTime) {
    ElMessage.warning('请选择活动开始时间')
    return
  }
  if (!endTime) {
    ElMessage.warning('请选择活动结束时间')
    return
  }
  if (new Date(startTime).getTime() > new Date(endTime).getTime()) {
    ElMessage.warning('活动结束时间不能早于开始时间')
    return
  }
  if (!Number.isFinite(userId)) {
    ElMessage.warning('未获取到当前用户信息，请重新登录')
    return
  }

  creatingActivity.value = true
  try {
    const currentCourseId = Number(courseId.value)
    const response = await activityApi.save({
      title,
      type,
      courseId: currentCourseId,
      score,
      startTime,
      endTime
    })
    if (response?.code === 1) {
      ElMessage.success(response?.msg || '活动发布成功')
      showActivityDialog.value = false
      await loadActivities()
    } else {
      ElMessage.error(response?.msg || '活动发布失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '活动发布出错')
  } finally {
    creatingActivity.value = false
  }
}

const handleDeleteActivity = async (id) => {
  if (!canPublishActivity.value) {
    ElMessage.warning('仅教师或管理员可删除活动')
    return
  }

  try {
    await ElMessageBox.confirm('删除后不可恢复，确认删除该活动吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })

    deletingActivityId.value = id
    const response = await activityApi.delById(id)
    if (response?.code === 1) {
      ElMessage.success('活动删除成功')
      await loadActivities()
    } else {
      ElMessage.error(response?.msg || '活动删除失败')
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(error.message || '活动删除出错')
  } finally {
    deletingActivityId.value = null
  }
}

const formatNowDateTime = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

const handleEndActivity = async (row) => {
  if (!canPublishActivity.value) {
    ElMessage.warning('仅教师或管理员可结束活动')
    return
  }
  if (row?.ended) {
    ElMessage.warning('该活动已结束')
    return
  }

  const currentActivityId = Number(row?.backendId || row?.id || 0)
  if (!Number.isFinite(currentActivityId) || currentActivityId <= 0) {
    ElMessage.warning('活动ID无效，无法结束活动')
    return
  }

  const startTime = String(row?.startTime || row?.start_time || '').trim() || formatNowDateTime()
  const endTime = formatNowDateTime()

  try {
    await ElMessageBox.confirm('确认立即结束该活动吗？结束后学生将无法回复或答题。', '结束活动确认', {
      type: 'warning',
      confirmButtonText: '确认结束',
      cancelButtonText: '取消'
    })

    endingActivityId.value = currentActivityId
    const response = await activityApi.setStartAndEndTime({
      id: currentActivityId,
      startTime,
      endTime
    })
    if (response?.code === 1) {
      ElMessage.success(response?.msg || '活动已结束')
      await loadActivities()
    } else {
      ElMessage.error(response?.msg || '结束活动失败')
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(error.message || '结束活动出错')
  } finally {
    endingActivityId.value = null
  }
}

const openEditActivityTimeDialog = (row) => {
  if (!canPublishActivity.value) {
    ElMessage.warning('仅教师或管理员可修改活动时间')
    return
  }
  editActivityTimeForm.value = {
    activityId: Number(row?.backendId || row?.id || 0),
    title: String(row?.title || '-'),
    startTime: String(row?.startTime || row?.start_time || ''),
    endTime: String(row?.endTime || row?.end_time || '')
  }
  if (editActivityTimeForm.value.startTime === '-') {
    editActivityTimeForm.value.startTime = ''
  }
  if (editActivityTimeForm.value.endTime === '-') {
    editActivityTimeForm.value.endTime = ''
  }
  showEditActivityTimeDialog.value = true
}

const handleUpdateActivityTime = async () => {
  if (!canPublishActivity.value) {
    ElMessage.warning('仅教师或管理员可修改活动时间')
    return
  }

  const startTime = String(editActivityTimeForm.value.startTime || '').trim()
  const endTime = String(editActivityTimeForm.value.endTime || '').trim()
  const currentActivityId = Number(editActivityTimeForm.value.activityId || 0)

  if (!startTime) {
    ElMessage.warning('请选择活动开始时间')
    return
  }
  if (!endTime) {
    ElMessage.warning('请选择活动结束时间')
    return
  }
  if (new Date(startTime).getTime() > new Date(endTime).getTime()) {
    ElMessage.warning('活动结束时间不能早于开始时间')
    return
  }
  if (!Number.isFinite(currentActivityId) || currentActivityId <= 0) {
    ElMessage.warning('活动ID无效，无法修改活动时间')
    return
  }

  updatingActivityTime.value = true
  try {
    const response = await activityApi.setStartAndEndTime({
      id: currentActivityId,
      startTime,
      endTime
    })
    if (response?.code === 1) {
      ElMessage.success(response?.msg || '活动时间修改成功')
      showEditActivityTimeDialog.value = false
      await loadActivities()
    } else {
      ElMessage.error(response?.msg || '活动时间修改失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '活动时间修改出错')
  } finally {
    updatingActivityTime.value = false
  }
}

const goActivityComments = async (row) => {
  if (!row?.backendId && !row?.id) {
    ElMessage.warning('活动ID无效，无法进入评论')
    return
  }
  const activityId = Number(row.backendId || row.id)
  if (!Number.isFinite(activityId)) {
    ElMessage.warning('活动ID无效，无法进入评论')
    return
  }

  const activityType = Number(row.type || row.activityType || row.activity_type || 0)
  if (activityType === 2) {
    router.push({
      name: 'ExamActivityInfo',
      params: { id: activityId },
      query: {
        courseId: String(courseId.value || ''),
        courseTitle: courseTitle.value || '',
        teacherName: teacherName.value || ''
      }
    })
    return
  }

  activeActivityRow.value = row
}

const resolveBadgeText = (category, name = '') => {
  if (category === 'video') return 'V'
  if (category === 'image') return 'I'

  const lower = String(name || '').toLowerCase()
  if (/\.pdf$/.test(lower)) return 'PDF'
  if (/\.(doc|docx)$/.test(lower)) return 'W'
  if (/\.(ppt|pptx)$/.test(lower)) return 'P'
  if (/\.(xls|xlsx)$/.test(lower)) return 'X'
  if (/\.(txt|md)$/.test(lower)) return 'T'
  return 'D'
}

const normalizeResourceList = (data) => {
  const rows = Array.isArray(data?.rows)
    ? data.rows
    : (Array.isArray(data?.list)
      ? data.list
      : (Array.isArray(data) ? data : []))

  return rows.map((item = {}, index) => {
    const resourceName = item.resourceName || item.name || item.fileName || item.title || '-'
    const resourceUrl = item.resourceUrl || item.url || item.fileUrl || item.path || item.filePath || ''
    const previewCategory = detectPreviewType({
      resourceType: item.resourceType || item.type || item.fileType || '',
      resourceUrl
    })
    const size = Number(item.size ?? item.fileSize ?? 0)
    const duration = Number(item.duration ?? item.videoDuration ?? 0)
    return {
      ...item,
      displayId: index + 1,
      backendId: item.id ?? item.resourceId ?? item.courseResourceId,
      resourceName,
      resourceUrl,
      resourceType: formatResourceType(item.resourceType || item.type || item.fileType || '', resourceName),
      createTime: item.createTime || item.uploadTime || '-',
      previewCategory,
      badgeText: resolveBadgeText(previewCategory, resourceName),
      sizeText: formatFileSize(size),
      durationText: previewCategory === 'video' ? formatDurationLabel(duration) : ''
    }
  })
}

const resourceGroups = computed(() => {
  const groups = {
    video: [],
    doc: [],
    image: [],
    other: []
  }

  courseResourceList.value.forEach((item) => {
    const key = item.previewCategory || 'other'
    if (groups[key]) {
      groups[key].push(item)
    } else {
      groups.other.push(item)
    }
  })

  const groupMeta = [
    { key: 'video', title: '视频资料' },
    { key: 'doc', title: '文档资料' },
    { key: 'image', title: '图片资料' },
    { key: 'other', title: '其他资料' }
  ]

  return groupMeta
    .map(meta => ({ ...meta, items: groups[meta.key] }))
    .filter(group => group.items.length > 0)
})

const filteredResourceGroups = computed(() => {
  const keyword = String(resourceKeyword.value || '').trim().toLowerCase()
  if (!keyword) {
    return resourceGroups.value
  }

  return resourceGroups.value
    .map(group => ({
      ...group,
      items: group.items.filter(item => String(item.resourceName || '').toLowerCase().includes(keyword))
    }))
    .filter(group => group.items.length > 0)
})

const totalResourceCount = computed(() => courseResourceList.value.length)
const learnedResourceCount = computed(() => (canAccessResources.value ? totalResourceCount.value : 0))
const resourceProgressPercent = computed(() => {
  if (totalResourceCount.value <= 0) {
    return 0
  }
  return Math.round((learnedResourceCount.value / totalResourceCount.value) * 100)
})

const toggleGroup = (key) => {
  groupCollapsed.value[key] = !groupCollapsed.value[key]
}

const extractUploadResult = (response) => {
  const upload = response?.upload
  if (upload && typeof upload === 'object') {
    return {
      url: upload.url || upload.path || '',
      path: upload.path || upload.url || '',
      name: upload.name || ''
    }
  }

  const data = response?.data
  if (typeof data === 'string') {
    return {
      url: data,
      path: data,
      name: ''
    }
  }

  if (data && typeof data === 'object') {
    const url = data.url || data.fileUrl || data.path || data.filePath || ''
    const path = data.path || data.filePath || url || ''
    const name = data.name || data.fileName || data.originName || ''
    return { url, path, name }
  }

  return { url: '', path: '', name: '' }
}

const normalizeCourseRows = (data) => {
  if (Array.isArray(data?.rows)) {
    return data.rows
  }
  if (Array.isArray(data?.list)) {
    return data.list
  }
  if (Array.isArray(data)) {
    return data
  }
  return []
}

const verifyStudentAccess = async () => {
  if (!userStore.isTeacher) {
    return true
  }

  const teacherId = currentTeacherId.value
  if (!Number.isFinite(teacherId)) {
    ElMessage.warning('未获取到当前老师信息，请重新登录')
    return false
  }

  try {
    const response = await courseApi.getByTeaId(teacherId)
    if (response?.code !== 1) {
      ElMessage.warning(response?.msg || '获取教师课程失败')
      return false
    }

    const teacherCourses = normalizeCourseRows(response.data)
    return teacherCourses.some((item = {}) => Number(item.id) === courseId.value)
  } catch (error) {
    ElMessage.warning(error.message || '校验课程权限失败')
    return false
  }
}

const loadStudentSelectionStatus = async () => {
  if (!isStudent.value) {
    selectedInCurrentCourse.value = false
    return
  }

  const nickname = String(userStore.user?.nickname || '').trim()
  if (!nickname) {
    selectedInCurrentCourse.value = false
    if (activeCategory.value !== 'resource') {
      activeCategory.value = 'resource'
    }
    return
  }

  try {
    const response = await studentCourseApi.searchByUserName(nickname)
    if (response?.code !== 1) {
      selectedInCurrentCourse.value = false
      return
    }

    const rows = Array.isArray(response?.data?.rows)
      ? response.data.rows
      : (Array.isArray(response?.data?.list)
        ? response.data.list
        : (Array.isArray(response?.data) ? response.data : []))

    selectedInCurrentCourse.value = rows.some((item = {}) => {
      const selectedCourseId = Number(item.courseId ?? item.course_id ?? item.cid ?? item.id)
      const selectedTitle = String(item.title || item.courseTitle || item.courseName || '').trim()

      if (Number.isFinite(selectedCourseId) && selectedCourseId === courseId.value) {
        return true
      }

      return !!(courseTitle.value && selectedTitle && selectedTitle === courseTitle.value)
    })
    if (!selectedInCurrentCourse.value && activeCategory.value !== 'resource') {
      activeCategory.value = 'resource'
    }
  } catch (error) {
    selectedInCurrentCourse.value = false
    if (activeCategory.value !== 'resource') {
      activeCategory.value = 'resource'
    }
  }
}

const handleSelectCurrentCourse = async () => {
  if (!isStudent.value) {
    return
  }

  if (!Number.isFinite(courseId.value)) {
    ElMessage.warning('课程参数无效，无法选课')
    return
  }

  if (selectedInCurrentCourse.value) {
    ElMessage.warning('该课程已选课')
    return
  }

  const studentId = Number(userStore.user?.id)
  if (!Number.isFinite(studentId)) {
    ElMessage.error('获取用户信息失败，请重新登录')
    return
  }

  selectingCourse.value = true
  try {
    const response = await courseApi.selectCourse(studentId, courseId.value)
    if (response?.code === 1) {
      selectedInCurrentCourse.value = true
      ElMessage.success(response?.msg || '选课成功')
      await loadCourseMembers()
      return
    }

    ElMessage.warning(response?.msg || '选课失败')
    await loadStudentSelectionStatus()
  } catch (error) {
    const backendMsg = error?.originalError?.response?.data?.msg
    ElMessage.error(backendMsg || error.message || '选课出错')
    await loadStudentSelectionStatus()
  } finally {
    selectingCourse.value = false
  }
}

const loadCourseResources = async () => {
  resourceLoading.value = true
  try {
    const response = await courseApi.getCourseResourceById(courseId.value)
    if (response?.code === 1) {
      courseResourceList.value = normalizeResourceList(response.data)
    } else {
      courseResourceList.value = []
      ElMessage.warning(response?.msg || '获取课程资源失败')
    }
  } catch (error) {
    courseResourceList.value = []
    ElMessage.error(error.message || '获取课程资源出错')
  } finally {
    resourceLoading.value = false
  }
}

const openUploadDialog = () => {
  uploadDialogVisible.value = true
}

const handleSelectUploadFile = (uploadFile) => {
  const rawFile = uploadFile?.raw
  if (!rawFile) {
    selectedUploadFile.value = null
    selectedUploadFileName.value = ''
    return
  }
  selectedUploadFile.value = rawFile
  selectedUploadFileName.value = rawFile.name || ''
}

const handleUploadCourseResource = async () => {
  if (!canManageResources.value) {
    ElMessage.warning('仅教师或管理员可上传课程资源')
    return
  }

  const customResourceName = String(resourceNameInput.value || '').trim()
  if (!customResourceName) {
    ElMessage.warning('请先输入资源名称')
    return
  }

  const rawFile = selectedUploadFile.value
  if (!rawFile) {
    ElMessage.warning('请选择要上传的资源文件')
    return
  }

  uploadingResource.value = true
  try {
    const typeCode = detectUploadType(rawFile.name || '')
    const uploadResponse = await uploadApi.upload(rawFile, typeCode)
    if (uploadResponse?.code !== 1) {
      ElMessage.error(uploadResponse?.msg || '资源文件上传失败')
      return
    }

    const uploadResult = extractUploadResult(uploadResponse)
    const resourceUrl = uploadResult.url || uploadResult.path
    const resourceName = customResourceName
    if (!resourceUrl) {
      ElMessage.error('上传成功但未获取到资源地址')
      return
    }

    const userId = Number(userStore.user?.id)
    if (!Number.isFinite(userId)) {
      ElMessage.error('未获取到当前用户ID，请重新登录后再试')
      return
    }

    const fileSize = Number(rawFile.size || 0)
    const isVideo = typeCode === 'video'
    const duration = isVideo ? await getVideoDurationSeconds(rawFile) : undefined

    const saveResponse = await courseApi.saveCourseResource({
      courseId: courseId.value,
      name: resourceName,
      url: resourceUrl,
      type: typeCode,
      size: fileSize,
      ...(isVideo ? { duration } : {}),
      userId
    })

    if (saveResponse?.code === 1) {
      ElMessage.success('课程资源上传成功')
      resourceNameInput.value = ''
      selectedUploadFile.value = null
      selectedUploadFileName.value = ''
      uploadDialogVisible.value = false
      await loadCourseResources()
    } else {
      ElMessage.error(saveResponse?.msg || '课程资源保存失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '课程资源上传出错')
  } finally {
    uploadingResource.value = false
  }
}

const handleDeleteCourseResource = async (row) => {
  const resourceId = Number(row?.backendId)
  if (!Number.isFinite(resourceId)) {
    ElMessage.warning('资源ID无效，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm('删除后不可恢复，确认删除该课程资源吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })

    deletingResourceId.value = resourceId
    const response = await courseApi.deleteCourseResource(resourceId)
    if (response?.code === 1) {
      ElMessage.success('课程资源删除成功')
      await loadCourseResources()
    } else {
      ElMessage.error(response?.msg || '课程资源删除失败')
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(error.message || '课程资源删除出错')
  } finally {
    deletingResourceId.value = null
  }
}

const openPreviewDialog = (row) => {
  if (!canAccessResources.value) {
    return
  }

  const url = String(row?.resourceUrl || '').trim()
  if (!url) {
    ElMessage.warning('资源地址为空，无法预览')
    return
  }
  previewUrl.value = url
  previewTitle.value = row?.resourceName || '在线预览'
  previewType.value = detectPreviewMode(row)
  previewFrameUrl.value = resolvePreviewFrameUrl(previewType.value, url)
  previewDialogVisible.value = true

  if (previewType.value === 'video') {
    nextTick(() => {
      const video = previewVideoRef.value
      if (!video) {
        return
      }

      const savedPosition = Number(previewPositionMap.value[url] || 0)
      if (savedPosition > 0 && video.readyState >= 1) {
        video.currentTime = savedPosition
      }
    })
  }
}

const handleResourceClick = (row) => {
  openPreviewDialog(row)
}

const handleResourceDownload = (row) => {
  if (!canAccessResources.value) {
    return
  }

  const url = String(row?.resourceUrl || '').trim()
  if (!url) {
    ElMessage.warning('资源地址为空，无法下载')
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

const handlePreviewVideoLoaded = () => {
  const video = previewVideoRef.value
  if (!video) {
    return
  }

  const savedPosition = Number(previewPositionMap.value[previewUrl.value] || 0)
  if (savedPosition > 0) {
    video.currentTime = savedPosition
  }
}

const handlePreviewClose = () => {
  const video = previewVideoRef.value
  if (video && previewType.value === 'video') {
    previewPositionMap.value[previewUrl.value] = Number(video.currentTime || 0)
    video.pause()
  }
  previewDialogVisible.value = false
}

const openPreviewInNewTab = () => {
  if (!previewUrl.value) {
    return
  }
  window.open(previewUrl.value, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
  if (!Number.isFinite(courseId.value)) {
    ElMessage.warning('课程参数无效')
    router.replace('/courses')
    return
  }

  pageLoading.value = true
  const allowed = await verifyStudentAccess()
  if (!allowed) {
    pageLoading.value = false
    router.replace('/courses')
    return
  }

  await loadStudentSelectionStatus()
  await loadCourseMembers()
  await loadActivities()

  await loadCourseResources()
  pageLoading.value = false
})

watch(activeCategory, async (value) => {
  if (value === 'activity' && canViewAllCategories.value) {
    await loadActivities()
  }
})
</script>

<style scoped>
.course-learn-container {
  --cl-accent: #1677ff;
  --cl-accent-strong: #0b57d0;
  --cl-border: #d8e6fb;
  --cl-surface: #ffffff;
  --cl-soft-bg: #f3f8ff;
  --cl-text-main: #1d2b3a;
  --cl-text-muted: #5f738c;
  width: 100%;
  padding: 26px;
  box-sizing: border-box;
  min-height: 100%;
  background:
    radial-gradient(circle at 10% 3%, rgba(22, 119, 255, 0.14), transparent 30%),
    radial-gradient(circle at 90% 1%, rgba(59, 130, 246, 0.12), transparent 26%),
    linear-gradient(180deg, #f4f9ff 0%, #ffffff 56%);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.course-learn-container :deep(.el-card) {
  border: 1px solid #e2edf8;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.course-learn-container :deep(.el-card__header) {
  background: linear-gradient(135deg, #edf5ff 0%, #ffffff 56%, #f4f9ff 100%);
  border-bottom: 1px solid #e4eef8;
  padding: 18px 22px;
}

.course-learn-container :deep(.el-card__body) {
  padding: 20px 22px 24px;
}

.learn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.learn-back-btn {
  color: #ffffff !important;
  background: linear-gradient(90deg, #1677ff 0%, #3b82f6 100%);
  border-color: transparent;
  font-weight: 600;
}

.learn-back-btn:hover,
.learn-back-btn:focus {
  color: #ffffff;
  background: linear-gradient(90deg, #1677ff 0%, #3b82f6 100%);
  border-color: transparent;
}

.learn-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--cl-text-main);
}

.learn-meta {
  margin-top: 6px;
  color: var(--cl-text-muted);
  font-size: 13px;
  font-weight: 500;
}

.resource-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.detail-categories {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--cl-border);
  border-radius: 999px;
  margin-bottom: 16px;
  background: #f8fcff;
  padding: 6px;
}

.category-item {
  border: 1px solid transparent;
  background: transparent;
  padding: 9px 14px;
  color: #465569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.24s ease;
}

.category-item:hover {
  border-color: #d7e7f7;
  background: #eef6ff;
}

.category-item.active {
  color: #ffffff;
  border-color: transparent;
  background: linear-gradient(90deg, #1677ff 0%, #3b82f6 100%);
  box-shadow: 0 8px 16px rgba(22, 119, 255, 0.24);
}

.category-placeholder {
  border: 1px solid var(--cl-border);
  border-radius: 12px;
  background: #fff;
  padding: 22px;
}

.activity-panel {
  border: 1px solid var(--cl-border);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fafdff 100%);
  padding: 16px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.activity-panel :deep(.activity-click-row) {
  cursor: pointer;
}

.activity-panel :deep(.el-table) {
  border-radius: 10px;
  overflow: hidden;
}

.activity-panel :deep(.el-table th.el-table__cell) {
  background: #f0f8ff;
  color: #254159;
}

.activity-title-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.activity-panel :deep(.activity-edit-time-btn) {
  color: #ffffff !important;
}

.activity-time-form-item :deep(.el-form-item__content) {
  align-items: flex-start;
}

.activity-time-range {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5eef8;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.activity-time-block {
  min-width: 0;
}

.activity-time-label {
  margin-bottom: 6px;
  font-size: 12px;
  color: #5a6b7e;
}

.activity-time-separator {
  padding-bottom: 10px;
  color: #7b8ea3;
  font-size: 13px;
}

.activity-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.activity-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .activity-time-range {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .activity-time-separator {
    padding-bottom: 0;
    justify-self: center;
  }
}

.member-panel {
  border: 1px solid var(--cl-border);
  border-radius: 14px;
  background: #fff;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.member-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  background: linear-gradient(90deg, #edf7ff 0%, #f8fbff 100%);
  border-bottom: 1px solid #e1ecf8;
}

.member-panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f3650;
}


.member-panel-body {
  display: grid;
  grid-template-columns: 300px 1fr;
}

.member-list {
  border-right: 1px solid #edf1f6;
  max-height: 360px;
  overflow-y: auto;
}

.member-list-item {
  width: 100%;
  border: none;
  background: #fff;
  padding: 11px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid #edf3f8;
  transition: background 0.2s ease;
}

.member-list-item-readonly {
  cursor: default;
}

.member-list-item:hover {
  background: #f8fbff;
}

.member-list-item.active {
  background: linear-gradient(90deg, #e9f5ff 0%, #f5faff 100%);
}

.member-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.member-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.member-avatar.large {
  width: 52px;
  height: 52px;
  font-size: 20px;
}

.member-list-text {
  min-width: 0;
  flex: 1;
}

.member-name {
  font-size: 14px;
  color: #223044;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-account {
  margin-top: 4px;
  font-size: 12px;
  color: #7c8ca2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-rank {
  width: 20px;
  min-width: 20px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #b0bec5;
}
.member-rank-top1 { color: #f5a623; }
.member-rank-top2 { color: #9e9e9e; }
.member-rank-top3 { color: #a0522d; }

.member-score {
  color: #0ea5e9;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
}

.member-detail {
  padding: 16px 18px;
}

.member-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.member-detail-name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d40;
}

.member-detail-account {
  margin-top: 4px;
  font-size: 12px;
  color: #7e8ca0;
}

.member-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.member-metric-item {
  background: linear-gradient(180deg, #f5faff 0%, #ffffff 100%);
  border: 1px solid #e3edf8;
  border-radius: 8px;
  padding: 11px;
}

.member-metric-item .label {
  font-size: 12px;
  color: #7a8ca5;
}

.member-metric-item .value {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #1e2f45;
}

.member-pagination {
  border-top: 1px solid #edf1f6;
  padding: 12px 14px;
  display: flex;
  justify-content: flex-end;
}


.resource-overview {
  display: grid;
  grid-template-columns: 1fr 150px 150px;
  gap: 10px;
  border: 1px solid var(--cl-border);
  border-radius: 14px;
  background: linear-gradient(120deg, #f8fcff 0%, #ffffff 100%);
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.resource-overview-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.resource-overview-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 10px;
}

.resource-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.resource-progress-track {
  flex: 1;
  height: 10px;
  border-radius: 8px;
  background: #e8edf2;
  overflow: hidden;
}

.resource-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #84cc16 100%);
  border-radius: 8px;
  transition: width 0.35s ease;
}

.resource-progress-percent {
  color: #69c31c;
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
}

.resource-overview-stat {
  border-left: 1px solid #e6edf5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.resource-overview-stat .stat-title {
  font-size: 12px;
  color: #8a96a6;
}

.resource-overview-stat .stat-value {
  margin-top: 8px;
  font-size: 22px;
  color: #4b5563;
  font-weight: 700;
}

.resource-search-bar {
  margin-bottom: 12px;
}

.resource-sections {
  border: 1px solid var(--cl-border);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  padding: 12px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
}

.resource-group + .resource-group {
  margin-top: 8px;
}

.resource-group-header {
  min-height: 36px;
  background: linear-gradient(90deg, #eef5fb 0%, #f8fbff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  color: #3f4e62;
  cursor: pointer;
  border-radius: 8px;
}

.resource-group-title {
  font-weight: 600;
}

.resource-group-arrow {
  color: #9aa0a6;
  font-size: 14px;
}

.resource-group-body {
  margin-top: 4px;
  padding: 0 10px;
  border: 1px solid #edf2f8;
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.resource-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 82px;
  border-bottom: 1px solid #edf3f8;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.resource-item-row-disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.resource-item-row:hover {
  background: #f7fbff;
}

.resource-item-row:last-child {
  border-bottom: none;
}

.resource-item-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.resource-thumb {
  width: 58px;
  height: 42px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}

.thumb-video {
  background: #1890ff;
}

.thumb-doc {
  background: #5b8ff9;
}

.thumb-image {
  background: #52c41a;
}

.thumb-other {
  background: #909399;
}

.resource-badge {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  flex-shrink: 0;
}

.badge-video {
  background: #3a7afe;
}

.badge-doc {
  background: #5b8ff9;
}

.badge-image {
  background: #52c41a;
}

.badge-other {
  background: #909399;
}

.resource-item-content {
  min-width: 0;
}

.resource-item-title {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

.resource-item-title:hover {
  color: #0ea5e9;
}

.resource-item-meta {
  color: #909399;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.resource-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.resource-link {
  color: #606266;
  font-size: 13px;
  text-decoration: none;
}

.resource-link:hover {
  color: #0ea5e9;
}

.selected-file-name {
  margin-left: 10px;
  color: #909399;
  font-size: 13px;
}


.preview-container {
  width: 100%;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
}

.preview-video {
  width: 100%;
  max-height: 72vh;
  background: #000;
}

.preview-image {
  max-width: 100%;
  max-height: 72vh;
  object-fit: contain;
}

.preview-iframe {
  width: 100%;
  height: 72vh;
  background: #fff;
}

.preview-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 13px;
}

.course-learn-container :deep(.el-button--primary) {
  background: linear-gradient(90deg, #1677ff 0%, #3b82f6 100%);
  border: none;
}

.course-learn-container :deep(.el-button--primary:hover) {
  filter: brightness(1.03);
}

.course-learn-container :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: linear-gradient(90deg, #1677ff 0%, #3b82f6 100%);
}

@media (max-width: 960px) {
  .course-learn-container {
    padding: 14px;
  }

  .detail-categories {
    gap: 8px;
    overflow-x: auto;
    white-space: nowrap;
    border-radius: 14px;
  }

  .category-item {
    font-size: 13px;
    padding: 8px 12px;
  }

  .member-panel-body {
    grid-template-columns: 1fr;
  }

  .member-list {
    border-right: none;
    border-bottom: 1px solid #edf1f6;
  }

  .resource-overview {
    grid-template-columns: 1fr;
  }

  .resource-overview-stat {
    border-left: none;
    border-top: 1px solid #eceff3;
    padding-top: 10px;
  }

  .course-learn-container :deep(.el-card__body) {
    padding: 14px;
  }
}

.preview-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #606266;
  font-size: 14px;
}

.preview-fallback-title {
  font-weight: 600;
}

@media (max-width: 900px) {
  .resource-item-row {
    align-items: flex-start;
    flex-direction: column;
    padding: 10px 0;
  }

  .resource-item-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
