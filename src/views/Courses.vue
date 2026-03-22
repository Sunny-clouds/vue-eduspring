<template>
  <div class="courses-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">课程中心</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- 所有课程标签页 -->
        <el-tab-pane :label="isStudent ? '所有课程' : '课程列表'" name="all">
          <div class="filter-bar">
            <el-input
              v-model="courseTitleKeyword"
              placeholder="输入课程名搜索"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearchCourseByTitle"
            />
            <el-button type="primary" @click="handleSearchCourseByTitle">搜索课程</el-button>
            <el-button @click="resetAllCoursesSearch">重置</el-button>
            <el-button v-if="canManageCourses" type="success" class="create-course-btn" @click="openCreateDialog">
              新增课程
            </el-button>
          </div>

          <el-table
            :data="allCoursesDisplay"
            stripe
            style="width: 100%"
            v-loading="allCoursesLoading"
            :row-class-name="() => 'clickable-course-row'"
            @row-click="handleAllCourseRowClick"
          >
            <el-table-column prop="displayId" label="ID" width="80" />
            <el-table-column prop="title" label="课程名称" min-width="150" />
            <el-table-column prop="description" label="课程描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="teacherName" label="讲师" width="100" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column v-if="canManageCourses" label="课程管理" width="180" align="center" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click.stop="openEditDialog(scope.row)">编辑</el-button>
                <el-button type="danger" size="small" @click.stop="handleDeleteCourse(scope.row.backendId)">删除</el-button>
              </template>
            </el-table-column>
            <el-table-column v-if="isStudent" label="操作" width="120" align="center" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click.stop="handleSelectCourse(scope.row.backendId)"
                  :loading="selectingCourse === scope.row.backendId"
                >
                  选课
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            :current-page="allCoursesPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="allCoursesTotal"
            layout="total, sizes, prev, pager, next"
            style="text-align: right; margin-top: 20px"
            @update:current-page="(val) => { allCoursesPage = val }"
            @update:page-size="(val) => { pageSize = val }"
            @change="loadAllCourses"
          />
        </el-tab-pane>

        <!-- 我的选课标签页 -->
        <el-tab-pane v-if="isStudent" label="我的选课" name="my">

          <el-table
            :data="myCoursesDisplay"
            stripe
            style="width: 100%"
            v-loading="myCoursesLoading"
            :row-class-name="() => 'clickable-course-row'"
            @row-click="handleMyCourseRowClick"
          >
            <el-table-column prop="displayId" label="ID" width="80" />
            <el-table-column prop="userName" label="学生" min-width="120" />
            <el-table-column prop="title" label="课程名称" min-width="150" />
            <el-table-column prop="teacherName" label="讲师" width="120" />
            <el-table-column prop="selectTime" label="选课时间" width="180" />
            <el-table-column prop="statusText" label="状态" width="100" align="center" />
            <el-table-column prop="progressText" label="学习进度" width="110" align="center" />
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click.stop="handleDropCourse(scope.row.backendId)"
                  :loading="droppingCourse === scope.row.backendId"
                >
                  退课
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            :current-page="myCoursesPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="myCoursesTotal"
            layout="total, sizes, prev, pager, next"
            style="text-align: right; margin-top: 20px"
            @update:current-page="(val) => { myCoursesPage = val }"
            @update:page-size="(val) => { pageSize = val }"
            @change="loadMyCourses"
          />
        </el-tab-pane>

        <!-- 管理员查看全部选课标签页 -->
        <el-tab-pane v-if="isAdmin" label="全部选课" name="allSelections">
          <div class="filter-bar">
            <el-input
              v-model="selectionUserKeyword"
              placeholder="输入用户名搜索选课"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearchSelectionsByUserName"
            />
            <el-button type="primary" @click="handleSearchSelectionsByUserName">搜索选课</el-button>
            <el-button @click="resetSelectionsSearch">重置</el-button>
          </div>

          <el-table
            :data="allSelectionsDisplay"
            stripe
            style="width: 100%"
            v-loading="allSelectionsLoading"
          >
            <el-table-column prop="displayId" label="ID" width="90" />
            <el-table-column prop="username" label="昵称" min-width="140" />
            <el-table-column prop="courseTitle" label="课程名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="teacherName" label="讲师" min-width="120" />
            <el-table-column prop="progress" label="学习进度" width="110" align="center" />
            <el-table-column prop="createTime" label="选课时间" width="180" />
          </el-table>

          <el-pagination
            :current-page="allSelectionsPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="allSelectionsTotal"
            layout="total, sizes, prev, pager, next"
            style="text-align: right; margin-top: 20px"
            @update:current-page="(val) => { allSelectionsPage = val }"
            @update:page-size="(val) => { pageSize = val }"
            @change="loadAllSelections"
          />
        </el-tab-pane>
      </el-tabs>

      <el-dialog
        v-model="courseDialogVisible"
        :title="editingCourseId ? '编辑课程' : '新增课程'"
        width="520px"
      >
        <el-form :model="courseForm" label-width="100px">
          <el-form-item label="课程名称" required>
            <el-input v-model="courseForm.title" placeholder="请输入课程名称" />
          </el-form-item>
          <el-form-item label="课程描述">
            <el-input v-model="courseForm.description" type="textarea" :rows="3" placeholder="请输入课程描述" />
          </el-form-item>
          <el-form-item label="讲师" required>
            <el-select
              v-model="courseForm.teacherId"
              placeholder="请选择讲师"
              filterable
              clearable
              :loading="loadingTeacherOptions"
              style="width: 100%"
            >
              <el-option
                v-for="item in teacherOptions"
                :key="item.id"
                :label="item.label"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="courseDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingCourse" @click="handleSaveCourse">
            {{ editingCourseId ? '保存修改' : '确认新增' }}
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup name="CoursesPage">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { courseApi } from '@/api/course'
import { studentCourseApi } from '@/api/studentCourse'
import { userApi } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { normalizeTableData, addDisplayId } from '@/utils/table'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()
// 角色能力开关：学生可选/退课，教师和管理员可管理课程。
const isStudent = computed(() => userStore.isStudent)
const isAdmin = computed(() => userStore.isAdmin)
const canManageCourses = computed(() => userStore.isTeacher || userStore.isAdmin)
const activeTab = ref('all')
const allCourses = ref([])
const myCourses = ref([])
const allSelections = ref([])
// 表格展示层：统一改成前端连续 displayId，避免直接暴露后端主键。
const allCoursesDisplay = computed(() => {
  const sortedRows = [...allCourses.value].sort((a, b) => {
    const idA = Number(a?.id)
    const idB = Number(b?.id)
    if (!Number.isFinite(idA) || !Number.isFinite(idB)) {
      return 0
    }
    return idA - idB
  })

  return addDisplayId(sortedRows, allCoursesPage.value, pageSize.value, (item) => ({
    ...item,
    courseId: item.id,
    backendId: item.id
  }))
})
const myCoursesDisplay = computed(() => {
  return addDisplayId(myCourses.value, myCoursesPage.value, pageSize.value, (item) => ({
    ...item,
    backendId: item.id
  }))
})
const allSelectionsDisplay = computed(() => {
  return addDisplayId(allSelections.value, allSelectionsPage.value, pageSize.value)
})
const allCoursesLoading = ref(false)
const myCoursesLoading = ref(false)
const allSelectionsLoading = ref(false)
const myCoursesLoaded = ref(false)
const selectingCourse = ref(null)
const droppingCourse = ref(null)

const allCoursesPage = ref(1)
const myCoursesPage = ref(1)
const allSelectionsPage = ref(1)
const pageSize = ref(10)
const allCoursesTotal = ref(0)
const myCoursesTotal = ref(0)
const allSelectionsTotal = ref(0)
const courseTitleKeyword = ref('')
const selectionUserKeyword = ref('')
const teacherOptions = ref([])
const loadingTeacherOptions = ref(false)
const courseDialogVisible = ref(false)
const savingCourse = ref(false)
const editingCourseId = ref(null)
const courseForm = ref({
  title: '',
  description: '',
  teacherId: null,
  teacherName: ''
})

const normalizeSelectionRow = (item = {}) => {
  // 兼容 progress/studyProgress/schedule 字段差异。
  const progressValue = item.progress ?? item.studyProgress ?? item.schedule
  return {
    ...item,
    backendId: item.id,
    username: item.username || item.userName || item.studentName || '-',
    nickname: item.nickname || item.nickName || '-',
    courseTitle: item.courseTitle || item.title || item.courseName || '-',
    teacherName: item.teacherName || item.teacher || '-',
    progress: progressValue === undefined || progressValue === null || progressValue === ''
      ? '-'
      : `${progressValue}%`,
    createTime: item.createTime || item.selectTime || '-',
    updateTime: item.updateTime || '-'
  }
}

const formatCourseStatus = (status) => {
  if (status === 1 || status === '1') {
    return '学习中'
  }
  if (status === 2 || status === '2') {
    return '已完成'
  }
  if (status === 0 || status === '0') {
    return '已退课'
  }
  return '-'
}

const resolveCourseId = (course = {}) => {
  const id = Number(course.courseId)
  return Number.isFinite(id) ? id : null
}

const selectedCourseIdSet = computed(() => {
  const set = new Set()
  myCourses.value.forEach((item) => {
    const id = resolveCourseId(item)
    if (id !== null) {
      set.add(id)
    }
  })
  return set
})

const selectedCourseTitleSet = computed(() => {
  const set = new Set()
  myCourses.value.forEach((item = {}) => {
    const title = String(item.title || item.courseTitle || item.courseName || '').trim()
    if (title) {
      set.add(title)
    }
  })
  return set
})

const normalizeTeacherOptions = (data) => {
  // teacherList 接口在不同环境返回结构不一致，这里统一成 { id, label }。
  const rows = Array.isArray(data?.rows)
    ? data.rows
    : (Array.isArray(data?.list)
      ? data.list
      : (Array.isArray(data) ? data : []))

  const idSet = new Set()
  return rows
    .map((item = {}) => {
      const id = item.id ?? item.userId ?? item.teacherId
      const label = item.nickname || item.userName || item.username || item.teacherName || ''
      return {
        id: id === undefined || id === null ? null : Number(id),
        label: String(label || '').trim()
      }
    })
    .filter((item) => {
      if (!Number.isFinite(item.id) || !item.label || idSet.has(item.id)) {
        return false
      }
      idSet.add(item.id)
      return true
    })
    .map((item) => ({ id: item.id, label: item.label }))
}

const buildTeacherOptionsFromCourses = () => {
  // teacherList 不可用时，回退到课程列表中的教师信息。
  return allCourses.value
    .map((item = {}) => ({
      id: Number(item.teacherId),
      label: String(item.teacherName || item.teacher || '').trim()
    }))
    .filter(item => Number.isFinite(item.id) && !!item.label)
}

const loadTeacherOptions = async () => {
  if (loadingTeacherOptions.value) {
    return
  }

  loadingTeacherOptions.value = true
  try {
    const response = await userApi.getTeacherList()
    if (response?.code === 1) {
      teacherOptions.value = normalizeTeacherOptions(response.data)
    } else {
      teacherOptions.value = buildTeacherOptionsFromCourses()
    }
  } catch (error) {
    teacherOptions.value = buildTeacherOptionsFromCourses()

    // teacherList 在部分角色下可能无权限，回退到手动输入和本地候选即可。
    if (error?.status !== 403) {
      ElMessage.warning(error.message || '获取老师列表出错')
    }
  } finally {
    loadingTeacherOptions.value = false
  }
}

// 加载所有课程
const loadAllCourses = async () => {
  allCoursesLoading.value = true
  try {
    const keyword = courseTitleKeyword.value.trim()
    const response = keyword
      ? await courseApi.getByTitle(keyword, allCoursesPage.value, pageSize.value)
      : await courseApi.getAll(allCoursesPage.value, pageSize.value)

    if (response.code === 1) {
      const { rows, total } = normalizeTableData(response.data)
      allCourses.value = rows
      allCoursesTotal.value = total

      if (keyword && rows.length === 0 && allCoursesPage.value === 1) {
        ElMessage.warning('未查询到该课程')
      }
    } else {
      ElMessage.error(response.msg || (keyword ? '搜索课程失败' : '获取课程列表失败'))
    }
  } catch (error) {
    ElMessage.error(error.message || (courseTitleKeyword.value.trim() ? '搜索课程出错' : '获取课程列表出错'))
  } finally {
    allCoursesLoading.value = false
  }
}

// 加载我的选课
const loadMyCourses = async () => {
  if (!isStudent.value) {
    myCourses.value = []
    myCoursesTotal.value = 0
    return
  }

  myCoursesLoading.value = true
  try {
    const nickname = userStore.user?.nickname
    if (!nickname) {
      ElMessage.warning('获取用户信息失败')
      return
    }
    const response = await studentCourseApi.searchByUserName(nickname)
    if (response.code === 1) {
      const { rows, total } = normalizeTableData(response.data)
      myCourses.value = rows.map(item => ({
        ...item,
        courseId: item.courseId,
        userName: item.userName || item.username || '-',
        title: item.title || item.courseTitle || item.courseName || '-',
        teacherName: item.teacherName || item.teacher || '-',
        selectTime: item.selectTime || item.createTime || item.updateTime || '-',
        statusText: formatCourseStatus(item.status),
        progressText: item.progress === undefined || item.progress === null || item.progress === ''
          ? '-'
          : `${item.progress}%`
      }))
      myCoursesTotal.value = total || rows.length
      myCoursesLoaded.value = true
    } else {
      ElMessage.error(response.msg || '获取选课列表失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取选课列表出错')
  } finally {
    myCoursesLoading.value = false
  }
}

// 管理员加载全部选课
const loadAllSelections = async () => {
  if (!isAdmin.value) {
    allSelections.value = []
    allSelectionsTotal.value = 0
    return
  }

  allSelectionsLoading.value = true
  try {
    const keyword = selectionUserKeyword.value.trim()
    const response = keyword
      ? await studentCourseApi.searchByUserName(keyword)
      : await studentCourseApi.getAll(allSelectionsPage.value, pageSize.value)

    if (response.code === 1) {
      const { rows, total } = normalizeTableData(response.data)
      allSelections.value = rows.map(normalizeSelectionRow)
      allSelectionsTotal.value = total || rows.length

      if (keyword && rows.length === 0 && allSelectionsPage.value === 1) {
        ElMessage.warning('未查询到该用户的选课记录')
      }
    } else {
      ElMessage.error(response.msg || '获取选课列表失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取选课列表出错')
  } finally {
    allSelectionsLoading.value = false
  }
}

// 按课程名搜索
const handleSearchCourseByTitle = async () => {
  const title = courseTitleKeyword.value.trim()
  if (!title) {
    ElMessage.warning('请输入课程名')
    return
  }

  allCoursesPage.value = 1
  await loadAllCourses()
}

// 重置课程搜索
const resetAllCoursesSearch = () => {
  courseTitleKeyword.value = ''
  allCoursesPage.value = 1
  loadAllCourses()
}

// 按用户名搜索选课
const handleSearchSelectionsByUserName = async () => {
  const keyword = selectionUserKeyword.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入用户名')
    return
  }

  allSelectionsPage.value = 1
  await loadAllSelections()
}

// 重置选课搜索
const resetSelectionsSearch = () => {
  selectionUserKeyword.value = ''
  allSelectionsPage.value = 1
  loadAllSelections()
}

const handleTabClick = (tabPane) => {
  // 标签页切换时按需拉取，避免一次性请求全部数据。
  if (isStudent.value && tabPane?.paneName === 'my') {
    myCoursesPage.value = 1
    loadMyCourses()
  }

  if (isAdmin.value && tabPane?.paneName === 'allSelections') {
    allSelectionsPage.value = 1
    loadAllSelections()
  }
}

const resetCourseForm = () => {
  courseForm.value = {
    title: '',
    description: '',
    teacherId: null,
    teacherName: userStore.user?.nickname || userStore.user?.username || ''
  }
}

const openCreateDialog = async () => {
  editingCourseId.value = null
  await loadTeacherOptions()
  resetCourseForm()
  courseDialogVisible.value = true
}

const openEditDialog = async (course) => {
  editingCourseId.value = course.backendId || course.id
  await loadTeacherOptions()
  const teacherName = course.teacherName || course.teacher || ''
  const matchedTeacher = teacherOptions.value.find(item => item.id === Number(course.teacherId)) ||
    teacherOptions.value.find(item => item.label === teacherName)

  courseForm.value = {
    title: course.title || '',
    description: course.description || '',
    teacherId: matchedTeacher?.id ?? null,
    teacherName: teacherName || userStore.user?.nickname || userStore.user?.username || ''
  }
  courseDialogVisible.value = true
}

const handleSaveCourse = async () => {
  if (!canManageCourses.value) {
    ElMessage.warning('仅教师或管理员账号可管理课程')
    return
  }

  const title = courseForm.value.title.trim()
  if (!title) {
    ElMessage.warning('请输入课程名称')
    return
  }

  if (!Number.isFinite(Number(courseForm.value.teacherId))) {
    ElMessage.warning('请选择讲师')
    return
  }

  savingCourse.value = true
  try {
    const selectedTeacher = teacherOptions.value.find(item => item.id === Number(courseForm.value.teacherId))
    const teacherName = selectedTeacher?.label || courseForm.value.teacherName?.trim() || ''
    const payload = {
      ...courseForm.value,
      title,
      teacherId: Number(courseForm.value.teacherId),
      teacherName
    }

    let response
    if (editingCourseId.value) {
      response = await courseApi.updateCourse({
        id: editingCourseId.value,
        ...payload
      })
    } else {
      response = await courseApi.save(payload)
    }

    if (response.code === 1) {
      ElMessage.success(editingCourseId.value ? '课程更新成功' : '课程新增成功')
      courseDialogVisible.value = false
      loadAllCourses()
    } else {
      ElMessage.error(response.msg || '课程保存失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '课程保存出错')
  } finally {
    savingCourse.value = false
  }
}

const handleDeleteCourse = async (id) => {
  if (!canManageCourses.value) {
    ElMessage.warning('仅教师或管理员账号可管理课程')
    return
  }

  try {
    await ElMessageBox.confirm('删除后不可恢复，确认删除该课程吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })

    const response = await courseApi.delete(id)
    if (response.code === 1) {
      ElMessage.success('课程删除成功')
      loadAllCourses()
    } else {
      ElMessage.error(response.msg || '课程删除失败')
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    ElMessage.error(error.message || '课程删除出错')
  }
}

// 选课
const handleSelectCourse = async (courseId) => {
  if (!isStudent.value) {
    ElMessage.warning('管理员或教师账号不支持选课操作')
    return
  }

  selectingCourse.value = courseId
  try {
    const studentId = userStore.user?.id
    if (!studentId) {
      ElMessage.error('获取用户信息失败，请重新登录')
      return
    }
    const response = await courseApi.selectCourse(studentId, courseId)
    if (response.code === 1) {
      ElMessage.success('选课成功')
      loadAllCourses()
      loadMyCourses()
    } else {
      ElMessage.error(response.msg || '选课失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '选课出错')
  } finally {
    selectingCourse.value = null
  }
}

// 退课
const handleDropCourse = async (courseId) => {
  if (!isStudent.value) {
    ElMessage.warning('管理员或教师账号不支持退课操作')
    return
  }

  droppingCourse.value = courseId
  try {
    const response = await courseApi.dropCourse(courseId)
    if (response.code === 1) {
      ElMessage.success('退课成功')
      loadAllCourses()
      loadMyCourses()
    } else {
      ElMessage.error(response.msg || '退课失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '退课出错')
  } finally {
    droppingCourse.value = null
  }
}

const ensureStudentCanEnterCourse = async (course) => {
  if (!isStudent.value) {
    return true
  }

  if (!myCoursesLoaded.value) {
    await loadMyCourses()
  }

  const courseId = resolveCourseId(course)
  const courseTitle = String(course?.title || course?.courseTitle || '').trim()

  if (courseId !== null && selectedCourseIdSet.value.has(courseId)) {
    return true
  }

  if (courseTitle && selectedCourseTitleSet.value.has(courseTitle)) {
    return true
  }

  ElMessage.warning('仅可进入已选课课程学习')
  return false
}

const enterCourseLearning = async (course) => {
  const courseId = resolveCourseId(course)
  if (courseId === null) {
    ElMessage.warning('课程ID无效，无法进入学习页')
    return
  }

  const allowed = await ensureStudentCanEnterCourse(course)
  if (!allowed) {
    return
  }

  router.push({
    name: 'CourseLearn',
    params: { id: courseId },
    query: {
      title: String(course?.title || course?.courseTitle || ''),
      teacherName: String(course?.teacherName || course?.teacher || '')
    }
  })
}

const handleAllCourseRowClick = (row) => {
  enterCourseLearning(row)
}

const handleMyCourseRowClick = (row) => {
  enterCourseLearning(row)
}

onMounted(() => {
  resetCourseForm()
  loadAllCourses()
  if (isStudent.value) {
    loadMyCourses()
  }
})
</script>

<style scoped>
.courses-container {
  width: 100%;
  padding: 30px;
  background: #ffffff;
  min-height: 100%;
  animation: slideUp 0.35s ease;
  box-sizing: border-box;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.courses-container :deep(.el-card) {
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.courses-container :deep(.el-card:hover) {
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

.courses-container :deep(.el-card__header) {
  background: #87ceeb;
  color: white;
  border: none;
  padding: 24px;
  letter-spacing: 0.5px;
}

.courses-container :deep(.el-card__header) .title {
  color: white;
  -webkit-text-fill-color: white;
  background: none;
  -webkit-background-clip: unset;
  background-clip: unset;
}

.filter-bar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.create-course-btn {
  margin-left: auto;
}

.courses-container :deep(.el-table) {
  background-color: transparent;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  table-layout: auto;
}

.courses-container :deep(.el-table__wrapper) {
  overflow-x: auto;
  overflow-y: hidden;
}

.courses-container :deep(.el-table__header th) {
  background-color: var(--theme-table-head);
  color: #333;
  font-weight: 700;
  border-bottom: 2px solid var(--theme-primary);
  transition: all 0.3s ease;
}

.courses-container :deep(.el-table__header th:hover) {
  background-color: var(--theme-table-head-hover);
}

.courses-container :deep(.el-table__body tr:hover > td) {
  background-color: var(--theme-surface-soft) !important;
  transition: background-color 0.3s ease;
}

.courses-container :deep(.el-table__body tr) {
  background-color: white;
  transition: all 0.3s ease;
}

.courses-container :deep(.clickable-course-row) {
  cursor: pointer;
}

.courses-container :deep(.el-tabs__header) {
  border-bottom: 2px solid var(--theme-border-muted);
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.courses-container :deep(.el-tabs__active-bar) {
  background: #87ceeb;
  height: 4px;
  border-radius: 2px;
  transition: all 0.4s ease;
}

.courses-container :deep(.el-tabs__nav-next),
.courses-container :deep(.el-tabs__nav-prev) {
  color: var(--theme-primary);
  transition: color 0.3s ease;
}

.courses-container :deep(.el-tabs__nav-next:hover),
.courses-container :deep(.el-tabs__nav-prev:hover) {
  color: var(--theme-secondary);
}

.courses-container :deep(.el-tabs__item) {
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-pagination) {
  margin-top: 25px;
  text-align: right !important;
  transition: all 0.3s ease;
}

:deep(.el-pagination button:hover) {
  color: var(--theme-primary);
}

:deep(.el-pagination .active) {
  color: var(--theme-primary);
}
</style>







