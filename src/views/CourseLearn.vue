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
            <div class="resource-overview-title">资源学习进度</div>
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
              v-for="member in courseMembers"
              :key="member.uid"
              type="button"
              class="member-list-item"
              :class="{ active: !isStudent && activeMemberId === member.uid, 'member-list-item-readonly': isStudent }"
              @click="handleMemberClick(member.uid)"
            >
              <div class="member-rank" :class="member.rank < 4 ? `member-rank-top${member.rank}` : ''">{{ member.rank }}</div>
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
              <div class="member-metric-chart">
                <div class="chart-title">学习进度</div>
                <VChart class="member-chart" :option="progressChartOption" :autoresize="true" />
              </div>
              <div class="member-metric-chart">
                <div class="chart-title">经验值</div>
                <VChart class="member-chart" :option="experienceChartOption" :autoresize="true" />
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
                <span
                  v-if="scope.row.experienceText !== '-'"
                  class="activity-experience-text"
                >
                  {{ scope.row.experienceText }} 经验值
                </span>
                <el-tag :type="scope.row.progressTagType" size="small" effect="light">
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
        class="publish-activity-dialog"
        :close-on-click-modal="false"
      >
        <el-form label-width="112px" @submit.prevent="handleCreateActivity">
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
          <el-form-item label="活动经验值" required>
            <el-input
              v-model="activityForm.score"
              placeholder="请输入活动经验值"
            />
          </el-form-item>
          <el-form-item v-if="Number(activityForm.type) === 2" label="考试分数" required>
            <el-input
              v-model="activityForm.examTotalScore"
              placeholder="请输入考试分数"
            />
          </el-form-item>
          <template v-if="Number(activityForm.type) === 2">
            <el-form-item label="考试时长" required>
              <el-select
                v-model="activityForm.examDurationText"
                placeholder="请选择考试时长"
                style="width: 100%"
              >
                <el-option
                  v-for="item in examDurationTextOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="允许重考" required>
              <el-select
                v-model="activityForm.allowRetakeText"
                placeholder="请选择是否允许重考"
                style="width: 100%"
              >
                <el-option
                  v-for="item in allowRetakeTextOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="最大次数" required>
              <el-select
                v-model="activityForm.maxAttemptsText"
                placeholder="请选择最大考试次数"
                style="width: 100%"
              >
                <el-option
                  v-for="item in maxAttemptsTextOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="立即出分" required>
              <el-select
                v-model="activityForm.showResultsText"
                placeholder="请选择是否立即显示成绩"
                style="width: 100%"
              >
                <el-option
                  v-for="item in showResultsTextOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </template>
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
            @timeupdate="handlePreviewVideoTimeUpdate"
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
        @close="handleUploadDialogClose"
      >
        <el-form label-width="90px" class="upload-resource-form">
          <el-form-item label="资源名称">
            <el-input
              v-model="resourceNameInput"
              placeholder="请输入资源名称"
              clearable
              maxlength="60"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="上传文件">
            <div class="upload-selector-wrap">
              <el-upload
                ref="uploadResourceRef"
                class="resource-upload-picker"
                drag
                :auto-upload="false"
                :show-file-list="false"
                :limit="1"
                :on-change="handleSelectUploadFile"
                accept="*"
                :disabled="uploadingResource"
              >
                <div class="upload-drop-content">
                  <div class="upload-drop-title">点击或拖拽文件到此处</div>
                  <div class="upload-drop-tip">支持视频、图片、文档等常见格式</div>
                </div>
              </el-upload>
              <div class="selected-file-name" :class="{ empty: !selectedUploadFileName }">
                {{ selectedUploadFileName || '暂未选择文件' }}
              </div>
            </div>
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="handleUploadDialogCancel" :disabled="uploadingResource">取消</el-button>
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
import VChart from 'vue-echarts'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { courseApi } from '@/api/course'
import { uploadApi } from '@/api/upload'
import { studentCourseApi } from '@/api/studentCourse'
import { activityApi } from '@/api/activity'
import { examApi } from '@/api/exam'
import ActivityDiscussionDetail from '@/views/ActivityDiscussionDetail.vue'
import {
  activityTypeOptions,
  allowRetakeTextOptions,
  deriveResourceNameFromFileName,
  detectPreviewMode,
  detectPreviewType,
  detectUploadType,
  examCreateDefaultsText,
  examDurationTextOptions,
  examFieldTextNumberMap,
  extractUploadResult,
  formatDurationLabel,
  formatFileSize,
  formatMemberStatus,
  formatNowDateTime,
  formatResourceType,
  getVideoDurationSeconds,
  maxAttemptsTextOptions,
  normalizeActivityRows,
  normalizeCourseRows,
  parseDateTimeValue,
  resolveBadgeText,
  resolvePreviewFrameUrl,
  showResultsTextOptions
} from './courseLearn/helpers'

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
const uploadResourceRef = ref(null)
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
const currentPreviewResource = ref(null)
const videoProgressIdMap = ref({})
const lastReportedDurationMap = ref({})
const progressReportInFlight = ref(false)
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
const activities = ref([])
const activityForm = ref({
  title: '',
  type: '',
  score: '',
  examTotalScore: '',
  examDurationText: '60分钟',
  allowRetakeText: '否',
  maxAttemptsText: '1次',
  showResultsText: '是',
  startTime: '',
  endTime: ''
})
const courseMembers = ref([])
const activeMemberId = ref(null)
const memberPage = ref(1)
const memberPageSize = ref(10)
const memberTotal = ref(0)
const courseProgressPercent = ref(0)
const studentSelfMemberCache = ref(null)
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
  // 优先使用缓存的学生信息（即使学生不在当前页也能显示）
  if (studentSelfMemberCache.value) {
    return studentSelfMemberCache.value
  }
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

const progressChartOption = computed(() => {
  if (!activeMember.value) {
    return {}
  }
  const progressText = activeMember.value.progressText
  const progress = progressText && progressText !== '-' 
    ? Number(progressText.replace('%', '')) 
    : 0
  const remaining = 100 - progress
  return {
    color: ['#52c41a', '#f0f0f0'],
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.name === '已完成') {
          return `<div style="padding: 8px;">${params.name}: ${params.value}%</div>`
        }
        return ''
      }
    },
    series: [
      {
        name: '学习进度',
        type: 'pie',
        radius: ['45%', '65%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            return `${progress}%`
          },
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1677ff'
        },
        emphasis: {
          disabled: false
        },
        animationType: 'scale',
        animationDuration: 800,
        data: [
          {
            value: progress,
            name: '已完成',
            itemStyle: { color: '#52c41a' },
            emphasis: {
              itemStyle: { color: '#45a049' },
              label: { show: true, fontSize: 28, fontWeight: 'bold' }
            }
          },
          {
            value: remaining,
            name: '未完成',
            itemStyle: { color: '#f0f0f0' },
            emphasis: { disabled: true }
          }
        ]
      }
    ]
  }
})

const experienceChartOption = computed(() => {
  if (!activeMember.value) {
    return {}
  }
  const experienceText = activeMember.value.experienceText
  const experience = experienceText && experienceText !== '-' 
    ? Number(experienceText) 
    : 0
  const maxExperience = Math.max(1000, experience * 1.2)
  const remaining = maxExperience - experience
  
  return {
    color: ['#1677ff', '#f0f0f0'],
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.name === '已获得') {
          return `<div style="padding: 8px;">${params.name}: ${experience}</div>`
        }
        return ''
      }
    },
    series: [
      {
        name: '经验值',
        type: 'pie',
        radius: ['45%', '65%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            return `${experience}`
          },
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1677ff'
        },
        emphasis: {
          disabled: false
        },
        animationType: 'scale',
        animationDuration: 800,
        data: [
          {
            value: experience,
            name: '已获得',
            itemStyle: { color: '#1677ff' },
            emphasis: {
              itemStyle: { color: '#0b53d0' },
              label: { show: true, fontSize: 28, fontWeight: 'bold' }
            }
          },
          {
            value: remaining,
            name: '未获得',
            itemStyle: { color: '#f0f0f0' },
            emphasis: { disabled: true }
          }
        ]
      }
    ]
  }
})

const displayedActivities = computed(() => {
  return activities.value.map((item = {}) => {
    const typeNumber = Number(item.type ?? item.activityType ?? item.activity_type)
    const typeText = activityTypeOptions.find(option => option.value === typeNumber)?.label || '-'
    const startTimeRaw = String(item.startTime || item.start_time || '').trim()
    const normalizedStartTime = startTimeRaw && !startTimeRaw.includes('T') ? startTimeRaw.replace(' ', 'T') : startTimeRaw
    const startTimestamp = new Date(normalizedStartTime).getTime()
    const notStarted = Number.isFinite(startTimestamp) ? Date.now() < startTimestamp : false
    const endTimeRaw = String(item.endTime || item.end_time || '').trim()
    const normalizedEndTime = endTimeRaw && !endTimeRaw.includes('T') ? endTimeRaw.replace(' ', 'T') : endTimeRaw
    const endTimestamp = new Date(normalizedEndTime).getTime()
    const remainingMs = Number.isFinite(endTimestamp) ? endTimestamp - Date.now() : NaN
    const ended = Number.isFinite(endTimestamp) ? Date.now() > endTimestamp : false
    const endingSoon = Number.isFinite(remainingMs) && remainingMs > 0 && remainingMs <= 24 * 60 * 60 * 1000
    const activityProgressText = notStarted ? '未开始' : (ended ? '已结束' : '进行中')
    const progressTagType = notStarted ? 'warning' : (ended ? 'info' : 'success')
    const participantCount = Number(
      typeNumber === 2
        ? (item.examSum ?? item.participantCount ?? item.joinCount ?? item.attendCount ?? item.memberCount ?? item.studentCount ?? item.commentCount ?? 0)
        : (item.participantCount ?? item.joinCount ?? item.attendCount ?? item.memberCount ?? item.studentCount ?? item.commentCount ?? 0)
    )
    return {
    ...item,
    backendId: item.id,
    username: item.username || item.nickname || item.userName || item.creatorName || '匿名用户',
    startTime: item.startTime || item.start_time || item.createTime || '-',
    endTime: item.endTime || item.end_time || '-',
    notStarted,
    ended,
    endingSoon,
    activityProgressText,
    progressTagType,
    showStudentUrgentTip: isStudent.value && endingSoon,
    urgentTipText: '不足1天，及时参加',
    typeText,
    experienceText: Number.isFinite(Number(item.score)) ? Number(item.score) : '-',
    commentCount: Number.isFinite(participantCount) ? participantCount : 0
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

const normalizeCourseMembers = (data, startRank = 1) => {
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
      totalScore: totalScore ?? 0,
      rank: startRank + index
    }
  })
}

const normalizeProgressPercent = (value) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return Math.min(100, Math.max(0, Math.round(parsed)))
}

const resolveCourseProgressPercent = (rows = [], responseData = null) => {
  const responseProgress = normalizeProgressPercent(responseData?.progress)
  if (responseProgress !== null) {
    return responseProgress
  }

  const extractRowProgress = (item = {}) => normalizeProgressPercent(item.progress ?? item.studyProgress ?? item.schedule)

  if (isStudent.value) {
    const username = currentUserName.value
    const nickname = currentUserNickname.value
    const selfRow = rows.find((item = {}) => {
      const rowUsername = String(item.username || item.userName || item.account || '').trim()
      const rowNickname = String(item.nickname || item.nickName || item.studentName || '').trim()
      if (username && rowUsername === username) {
        return true
      }
      return !!(nickname && rowNickname === nickname)
    })
    const selfProgress = extractRowProgress(selfRow)
    return selfProgress ?? 0
  }

  const progressValues = rows
    .map(item => extractRowProgress(item))
    .filter(item => item !== null)

  if (progressValues.length === 0) {
    return 0
  }

  const sum = progressValues.reduce((acc, item) => acc + item, 0)
  return Math.round(sum / progressValues.length)
}

const loadCourseMembers = async () => {
  if (!Number.isFinite(courseId.value)) {
    courseMembers.value = []
    activeMemberId.value = null
    memberTotal.value = 0
    courseProgressPercent.value = 0
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
      courseProgressPercent.value = resolveCourseProgressPercent(rows, response?.data)
      const startRank = (memberPage.value - 1) * memberPageSize.value + 1
      const members = normalizeCourseMembers(rows, startRank)
      const total = Number(response?.data?.total ?? response?.data?.count ?? members.length)
      courseMembers.value = members.sort((a, b) => (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0))
      // 排序后重新计算 rank，保持排名正确
      courseMembers.value.forEach((member, index) => {
        member.rank = startRank + index
      })
      memberTotal.value = Number.isFinite(total) ? total : members.length
      if (isStudent.value) {
        const selfMember = courseMembers.value.find((item = {}) => {
          const username = currentUserName.value
          const nickname = currentUserNickname.value
          if (username && item.username === username) {
            return true
          }
          return !!(nickname && item.name === nickname)
        })
        // 保存学生信息到缓存，即使学生不在当前页也能显示
        if (selfMember) {
          studentSelfMemberCache.value = selfMember
        }
        activeMemberId.value = selfMember?.uid ?? null
      } else if (!courseMembers.value.some(item => item.uid === activeMemberId.value)) {
        activeMemberId.value = courseMembers.value[0]?.uid ?? null
      }
    } else {
      courseMembers.value = []
      activeMemberId.value = null
      memberTotal.value = 0
      courseProgressPercent.value = 0
    }
  } catch (error) {
    courseMembers.value = []
    activeMemberId.value = null
    memberTotal.value = 0
    courseProgressPercent.value = 0
  } finally {
    memberLoading.value = false
  }
}

const loadActivities = async () => {
  activityLoading.value = true
  try {
    const response = await activityApi.getAllByCourseId(courseId.value)

    if (response?.code === 1) {
      const rows = normalizeActivityRows(response.data)
      const total = Number(response?.data?.total ?? response?.data?.count ?? rows.length)
      activities.value = rows
      activityCount.value = Number.isFinite(total) ? total : rows.length
    } else {
      activities.value = []
      activityCount.value = 0
      ElMessage.warning(response?.msg || '获取活动失败')
    }
  } catch (error) {
    activities.value = []
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
    examTotalScore: '',
    examDurationText: examCreateDefaultsText.duration,
    allowRetakeText: examCreateDefaultsText.allowRetake,
    maxAttemptsText: examCreateDefaultsText.maxAttempts,
    showResultsText: examCreateDefaultsText.showResults,
    startTime: '',
    endTime: ''
  }
  showActivityDialog.value = true
}

const publishExamActivity = async ({
  courseId,
  title,
  score,
  startTime,
  endTime,
  examTotalScore,
  userId,
  examConfig
}) => {
  const duration = examFieldTextNumberMap.duration[examConfig.durationText]
  const allowRetake = examFieldTextNumberMap.allowRetake[examConfig.allowRetakeText]
  const maxAttempt = examFieldTextNumberMap.maxAttempts[examConfig.maxAttemptsText]
  const showResult = examFieldTextNumberMap.showResults[examConfig.showResultsText]

  const payload = {
    activityDto: {
      id: null,
      bizId: null,
      courseId,
      title,
      score,
      type: 2,
      status: null,
      startTime,
      endTime
    },
    testPaperDto: {
      id: null,
      title,
      courseId,
      totalScore: examTotalScore,
      createUser: userId
    },
    examDto: {
      id: null,
      paperId: null,
      duration,
      totalScore: examTotalScore,
      allowRetake,
      maxAttempt,
      showResult
    }
  }

  try {
    const examResponse = await examApi.saveExam(payload)
    if (examResponse?.code !== 1) {
      throw new Error(examResponse?.msg || '发布考试活动失败')
    }

    return {
      response: examResponse
    }
  } catch (error) {
    // 当后端不返回错误信息时，将"无权访问"错误改为"题库题目不足"
    if (error?.message?.includes('当前账号无权访问该接口')) {
      throw new Error('题库题目不足')
    }
    throw error
  }
}

const handleCreateActivity = async () => {
  if (!canPublishActivity.value) {
    ElMessage.warning('仅教师或管理员可发布活动')
    return
  }

  const title = String(activityForm.value.title || '').trim()
  const type = Number(activityForm.value.type)
  const score = Number(activityForm.value.score)
  const examTotalScore = Number(activityForm.value.examTotalScore)
  const startTime = String(activityForm.value.startTime || '').trim()
  const endTime = String(activityForm.value.endTime || '').trim()
  const examDurationText = String(activityForm.value.examDurationText || '').trim()
  const allowRetakeText = String(activityForm.value.allowRetakeText || '').trim()
  const maxAttemptsText = String(activityForm.value.maxAttemptsText || '').trim()
  const showResultsText = String(activityForm.value.showResultsText || '').trim()
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
    ElMessage.warning('请输入活动经验值')
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
  if (type === 2) {
    if (!Number.isFinite(examTotalScore)) {
      ElMessage.warning('请输入考试分数')
      return
    }
    if (!examFieldTextNumberMap.duration[examDurationText]) {
      ElMessage.warning('请选择考试时长')
      return
    }
    if (examFieldTextNumberMap.allowRetake[allowRetakeText] === undefined) {
      ElMessage.warning('请选择是否允许重考')
      return
    }
    if (!examFieldTextNumberMap.maxAttempts[maxAttemptsText]) {
      ElMessage.warning('请选择最大考试次数')
      return
    }
    if (examFieldTextNumberMap.showResults[showResultsText] === undefined) {
      ElMessage.warning('请选择是否立即显示成绩')
      return
    }
  }

  creatingActivity.value = true
  try {
    const currentCourseId = Number(courseId.value)
    if (type === 2) {
      const { response } = await publishExamActivity({
        courseId: currentCourseId,
        title,
        score,
        startTime,
        endTime,
        examTotalScore,
        userId,
        examConfig: {
          durationText: examDurationText,
          allowRetakeText,
          maxAttemptsText,
          showResultsText
        }
      })

      ElMessage.success(response?.msg || '活动发布成功')
      showActivityDialog.value = false
      await loadActivities()
      return
    }

    const activityPayload = {
      title,
      type,
      courseId: currentCourseId,
      score,
      startTime,
      endTime
    }
    const response = await activityApi.save(activityPayload)
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
  const canEnterNotStartedExam = activityType === 2 && canPublishActivity.value
  if (row?.notStarted && !canEnterNotStartedExam) {
    ElMessage.warning('活动还未开始')
    return
  }

  if (activityType === 2) {
    const bizId = Number(row.bizId ?? row.biz_id)
    if (!Number.isFinite(bizId) || bizId <= 0) {
      ElMessage.warning('考试ID无效，无法进入考试信息')
      return
    }

    if (isStudent.value && row?.ended) {
      const studentId = Number(
        userStore.user?.id
        ?? userStore.user?.userId
        ?? userStore.user?.uid
        ?? userStore.user?.studentId
      )
      if (!Number.isFinite(studentId) || studentId <= 0) {
        ElMessage.warning('未获取到当前学生ID，无法查询成绩')
        return
      }

      try {
        const examResponse = await examApi.getExamByBizId(bizId)
        if (examResponse?.code !== 1) {
          ElMessage.warning(examResponse?.msg || '获取考试信息失败')
          return
        }

        const examData = examResponse?.data || {}
        const showResult = Number(examData.showResult)
        if (showResult !== 1) {
          ElMessage.warning('活动已结束')
          return
        }

        const paperId = Number(
          examData.paperId
          ?? examData.testPaperId
          ?? examData.paper_id
          ?? examData.test_paper_id
        )
        if (!Number.isFinite(paperId) || paperId <= 0) {
          ElMessage.warning('未获取到试卷ID，无法查询成绩')
          return
        }

        const scoreResponse = await examApi.getScoreByStudentIdAndPaperId(studentId, paperId)
        if (scoreResponse?.code !== 1) {
          ElMessage.warning(scoreResponse?.msg || '查询成绩失败')
          return
        }

        const scoreData = scoreResponse?.data || {}
        const firstRow = Array.isArray(scoreData?.rows) ? scoreData.rows[0] : null
        const score = Number(
          scoreData?.totalScore
          ?? scoreData?.score
          ?? scoreData?.examScore
          ?? firstRow?.totalScore
          ?? firstRow?.score
          ?? firstRow?.examScore
        )
        const attempt = Number(
          firstRow?.attempt
          ?? scoreData?.attempt
          ?? firstRow?.studentAttempt
          ?? scoreData?.studentAttempt
          ?? firstRow?.attemptCount
          ?? scoreData?.attemptCount
        )

        const examTitle = String(examData.title || row.title || '').trim() || '-'
        const totalScore = Number(examData.totalScore)
        const totalScoreText = Number.isFinite(totalScore) ? `${totalScore}` : '-'

        if (Number.isFinite(score)) {
          const attemptDisplay = Number.isFinite(attempt) && attempt > 0 ? `<br/>考试次数：${attempt}` : ''
          await ElMessageBox.alert(
            `考试：${examTitle}<br/>总分：${totalScoreText}<br/>我的成绩：${score}${attemptDisplay}`,
            '考试成绩',
            {
              dangerouslyUseHTMLString: true,
              confirmButtonText: '知道了',
              type: 'success'
            }
          )
          return
        }

        await ElMessageBox.alert(
          `考试：${examTitle}<br/>总分：${totalScoreText}<br/>我的成绩：暂无`,
          '考试成绩',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '知道了',
            type: 'info'
          }
        )
      } catch (error) {
        ElMessage.error(error.message || '查询成绩出错')
      }
      return
    }

    router.push({
      name: 'ExamActivityInfo',
      params: { id: activityId },
      query: {
        courseId: String(courseId.value || ''),
        courseTitle: courseTitle.value || '',
        teacherName: teacherName.value || '',
        activityTitle: String(row.title || '').trim(),
        startTime: String(row.startTime || row.start_time || ''),
        bizId: String(bizId)
      }
    })
    return
  }

  activeActivityRow.value = row
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
const resourceProgressPercent = computed(() => (canAccessResources.value ? courseProgressPercent.value : 0))

const toggleGroup = (key) => {
  groupCollapsed.value[key] = !groupCollapsed.value[key]
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
  resourceNameInput.value = ''
  resetUploadSelection()
  uploadDialogVisible.value = true
}

const resetUploadSelection = () => {
  selectedUploadFile.value = null
  selectedUploadFileName.value = ''
  uploadResourceRef.value?.clearFiles()
}

const handleUploadDialogClose = () => {
  resourceNameInput.value = ''
  resetUploadSelection()
}

const handleUploadDialogCancel = () => {
  if (uploadingResource.value) {
    return
  }
  uploadDialogVisible.value = false
}

const handleSelectUploadFile = (uploadFile) => {
  const rawFile = uploadFile?.raw
  if (!rawFile) {
    resetUploadSelection()
    return
  }
  selectedUploadFile.value = rawFile
  selectedUploadFileName.value = rawFile.name || ''
  resourceNameInput.value = deriveResourceNameFromFileName(rawFile.name || '')

  // 清空 Upload 内部 fileList/input 值，允许再次选择同名文件仍触发 on-change。
  nextTick(() => {
    uploadResourceRef.value?.clearFiles()
  })
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
      resetUploadSelection()
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
  currentPreviewResource.value = row || null

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

const reportVideoProgress = async ({ force = false } = {}) => {
  if (!isStudent.value || previewType.value !== 'video') {
    return
  }
  if (progressReportInFlight.value) {
    return
  }

  const studentId = Number(
    userStore.user?.id
    ?? userStore.user?.userId
    ?? userStore.user?.uid
    ?? userStore.user?.studentId
  )
  const videoId = Number(
    currentPreviewResource.value?.backendId
    ?? currentPreviewResource.value?.id
    ?? currentPreviewResource.value?.resourceId
  )
  const currentCourseId = Number(courseId.value)
  const currentTime = Math.max(0, Math.floor(Number(previewVideoRef.value?.currentTime || 0)))
  const reportKey = String(videoId || '')
  const resolvedProgressId = Number(
    videoProgressIdMap.value[reportKey]
    ?? currentPreviewResource.value?.progressId
    ?? currentPreviewResource.value?.recordId
    ?? currentPreviewResource.value?.saveProgressId
  )
  const lastReportedDuration = Number(lastReportedDurationMap.value[reportKey] || 0)
  const minIntervalSeconds = 15

  if (!Number.isFinite(studentId) || studentId <= 0) {
    return
  }
  if (!Number.isFinite(videoId) || videoId <= 0) {
    return
  }
  if (!Number.isFinite(currentCourseId) || currentCourseId <= 0) {
    return
  }
  if (currentTime <= 0) {
    return
  }
  if (!force && currentTime - lastReportedDuration < minIntervalSeconds) {
    return
  }
  if (force && currentTime <= lastReportedDuration) {
    return
  }

  try {
    progressReportInFlight.value = true
    const response = await userApi.saveProgress({
      id: Number.isFinite(resolvedProgressId) && resolvedProgressId > 0 ? resolvedProgressId : null,
      studentId,
      videoId,
      courseId: currentCourseId,
      currentTime,
      // Keep legacy field for backward compatibility with older backend DTO names.
      duration: currentTime
    })
    const returnedProgressId = Number(
      response?.data?.id
      ?? response?.data?.progressId
      ?? response?.id
      ?? response?.progressId
    )
    if (Number.isFinite(returnedProgressId) && returnedProgressId > 0) {
      videoProgressIdMap.value[reportKey] = returnedProgressId
    }
    lastReportedDurationMap.value[reportKey] = currentTime
  } catch (error) {
    // Ignore reporting failure to avoid interrupting preview flow.
  } finally {
    progressReportInFlight.value = false
  }
}

const handlePreviewVideoTimeUpdate = () => {
  reportVideoProgress()
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

const handlePreviewClose = async () => {
  const video = previewVideoRef.value
  if (video && previewType.value === 'video') {
    previewPositionMap.value[previewUrl.value] = Number(video.currentTime || 0)
    video.pause()
    await reportVideoProgress({ force: true })
  }
  currentPreviewResource.value = null
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

<style scoped src="./courseLearn/CourseLearn.css"></style>
