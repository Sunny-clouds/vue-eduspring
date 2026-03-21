// 兼容 rows/list/array 三种常见列表返回结构。
export const normalizeTableData = (data) => {
  if (data?.rows) {
    return {
      rows: Array.isArray(data.rows) ? data.rows : [],
      total: data.total || 0
    }
  }

  const rows = Array.isArray(data) ? data : (Array.isArray(data?.list) ? data.list : [])
  return {
    rows,
    total: data?.total || rows.length
  }
}

// 为表格行追加连续 displayId，统一分页序号计算逻辑。
export const addDisplayId = (rows, currentPage, pageSize, mapItem = (item) => item) => {
  const safeRows = Array.isArray(rows) ? rows : []
  const safePage = Math.max(1, Number(currentPage) || 1)
  const safeSize = Math.max(1, Number(pageSize) || 10)
  const baseIndex = (safePage - 1) * safeSize

  return safeRows.map((item, index) => ({
    ...mapItem(item, index),
    displayId: baseIndex + index + 1
  }))
}
