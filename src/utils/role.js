// 统一角色编码：兼容中英文、大小写以及常见混合值。
export const normalizeRoleCode = (role) => {
  const value = String(role || '').trim().toLowerCase()

  if (!value) {
    return ''
  }

  if (value.includes('admin') || value.includes('管理员')) {
    return 'admin'
  }
  if (value.includes('teacher') || value.includes('教师')) {
    return 'teacher'
  }
  if (value.includes('student') || value.includes('学生')) {
    return 'student'
  }

  return value
}

// 角色编码转中文展示名。
export const roleCodeToDisplay = (roleCode) => {
  if (roleCode === 'admin') return '管理员'
  if (roleCode === 'teacher') return '教师'
  if (roleCode === 'student') return '学生'
  return roleCode || '-'
}
