import request from './request'

export const homeWorkApi = {
  save(data) {
    return request.post('/homeWork/save', data)
  },

  getByStudentIdAndCourseId(data) {
    return request.post('/homeWork/getByStudentIdAndCourseId', data)
  },

  getAll(data) {
    return request.post('/homeWork/getAll', data)
  }
}
