<template>
  <div class="course-learn-container">
    <el-card v-loading="pageLoading">
      <template #header>
        <div class="learn-header">
          <div>
            <div class="learn-title">课程学习页</div>
            <div class="learn-meta">{{ courseTitle || '未命名课程' }} <span v-if="teacherName">| 讲师：{{ teacherName }}</span></div>
          </div>
          <el-button type="primary" plain @click="goBack">返回课程中心</el-button>
        </div>
      </template>

      <div class="resource-toolbar" v-if="canManageResources">
        <el-button type="primary" :loading="uploadingResource" @click="openUploadDialog">上传资源</el-button>
      </div>

      <div class="resource-toolbar" v-else>
        <span class="resource-readonly-tip">学生端仅支持查看已选课课程资源</span>
      </div>

      <div class="resource-sections" v-loading="resourceLoading">
        <div v-for="group in resourceGroups" :key="group.key" class="resource-group">
          <div class="resource-group-header" @click="toggleGroup(group.key)">
            <span>{{ group.title }}（{{ group.items.length }}）</span>
            <span class="resource-group-arrow">{{ groupCollapsed[group.key] ? '▸' : '▾' }}</span>
          </div>

          <div v-show="!groupCollapsed[group.key]" class="resource-group-body">
            <div
              v-for="item in group.items"
              :key="item.backendId || item.displayId"
              class="resource-item-row"
              @click="openPreviewDialog(item)"
            >
              <div class="resource-item-left">
                <div class="resource-badge" :class="`badge-${item.previewCategory}`">{{ item.badgeText }}</div>
                  <div class="resource-item-content">
                  <button
                    type="button"
                    class="resource-item-title"
                    :title="item.resourceName"
                    @click="openPreviewDialog(item)"
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
                <a class="resource-link" :href="item.resourceUrl" target="_blank" rel="noopener noreferrer" @click.stop>下载</a>
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

      <el-empty v-if="!resourceLoading && resourceGroups.length === 0" description="暂无课程资源" />

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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { courseApi } from '@/api/course'
import { uploadApi } from '@/api/upload'
import { studentCourseApi } from '@/api/studentCourse'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pageLoading = ref(false)
const resourceLoading = ref(false)
const uploadingResource = ref(false)
const deletingResourceId = ref(null)
const courseResourceList = ref([])
const resourceNameInput = ref('')
const uploadDialogVisible = ref(false)
const selectedUploadFile = ref(null)
const selectedUploadFileName = ref('')
const previewDialogVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')
const previewType = ref('doc')
const previewFrameUrl = ref('')
const previewVideoRef = ref(null)
const previewPositionMap = ref({})
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

const detectPreviewType = (row = {}) => {
  const typeText = String(row.resourceType || '').toLowerCase()
  const url = String(row.resourceUrl || '').toLowerCase()

  if (typeText.includes('视频') || /\.(mp4|webm|ogg|mov|m4v|avi)$/.test(url)) {
    return 'video'
  }
  if (typeText.includes('图片') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(url)) {
    return 'image'
  }
  return 'doc'
}

const detectPreviewMode = (row = {}) => {
  const typeText = String(row.resourceType || row.type || '').toLowerCase()
  const url = String(row.resourceUrl || '').toLowerCase()

  if (typeText.includes('视频') || /\.(mp4|webm|ogg|mov|m4v|avi)$/.test(url)) {
    return 'video'
  }
  if (typeText.includes('图片') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(url)) {
    return 'image'
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

const verifyStudentAccess = async () => {
  if (!isStudent.value) {
    return true
  }

  const nickname = String(userStore.user?.nickname || '').trim()
  if (!nickname) {
    ElMessage.warning('未获取到学生身份信息，请重新登录')
    return false
  }

  try {
    const response = await studentCourseApi.searchByUserName(nickname)
    if (response?.code !== 1) {
      ElMessage.warning(response?.msg || '无法校验选课信息')
      return false
    }

    const rows = Array.isArray(response?.data?.rows)
      ? response.data.rows
      : (Array.isArray(response?.data?.list)
        ? response.data.list
        : (Array.isArray(response?.data) ? response.data : []))

    const allowed = rows.some((item = {}) => {
      const selectedCourseId = Number(item.courseId ?? item.course_id ?? item.cid ?? item.id)
      const selectedTitle = String(item.title || item.courseTitle || item.courseName || '').trim()

      if (Number.isFinite(selectedCourseId) && selectedCourseId === courseId.value) {
        return true
      }

      if (courseTitle.value && selectedTitle && selectedTitle === courseTitle.value) {
        return true
      }

      return false
    })

    if (!allowed) {
      ElMessage.warning('仅可进入已选课课程学习')
    }
    return allowed
  } catch (error) {
    ElMessage.error(error.message || '校验选课权限失败')
    return false
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

  await loadCourseResources()
  pageLoading.value = false
})
</script>

<style scoped>
.course-learn-container {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
  min-height: 100%;
  background: #ffffff;
}

.learn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.learn-title {
  font-size: 22px;
  font-weight: 700;
  color: #2f3a4a;
}

.learn-meta {
  margin-top: 6px;
  color: #606266;
  font-size: 13px;
}

.resource-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.resource-sections {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.resource-group + .resource-group {
  border-top: 1px solid #ebeef5;
}

.resource-group-header {
  height: 38px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  color: #606266;
  font-weight: 600;
  cursor: pointer;
}

.resource-group-arrow {
  color: #909399;
  font-size: 13px;
}

.resource-group-body {
  padding: 0 14px;
}

.resource-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 82px;
  border-bottom: 1px solid #f0f2f5;
  gap: 10px;
  cursor: pointer;
}

.resource-item-row:hover {
  background: #fafcff;
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
  color: #409eff;
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
  color: #409eff;
}

.selected-file-name {
  margin-left: 10px;
  color: #909399;
  font-size: 13px;
}

.resource-readonly-tip {
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
