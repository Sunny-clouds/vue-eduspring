import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 路由组件按需懒加载，减少首屏体积。
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const Home = () => import('@/views/Home.vue')
const AdminDashboard = () => import('@/views/AdminDashboard.vue')
const Courses = () => import('@/views/Courses.vue')
const CourseLearn = () => import('@/views/CourseLearn.vue')
const Scores = () => import('@/views/Scores.vue')
const Discussion = () => import('@/views/Discussion.vue')
const DiscussionDetail = () => import('@/views/DiscussionDetail.vue')
const Profile = () => import('@/views/Profile.vue')
const Users = () => import('@/views/Users.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/courses',
    name: 'Courses',
    component: Courses,
    meta: { requiresAuth: true }
  },
  {
    path: '/courses/:id/learn',
    name: 'CourseLearn',
    component: CourseLearn,
    meta: { requiresAuth: true }
  },
  {
    path: '/scores',
    name: 'Scores',
    component: Scores,
    meta: { requiresAuth: true }
  },
  {
    path: '/discussion',
    name: 'Discussion',
    component: Discussion,
    meta: { requiresAuth: true }
  },
  {
    path: '/discussion/:id',
    name: 'DiscussionDetail',
    component: DiscussionDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    redirect: '/home'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn
  const isAdmin = userStore.isAdmin

  // 需要认证的路由
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  }
  // 管理员专属路由
  else if (to.meta.requiresAdmin && !isAdmin) {
    next('/home')
  }
  // 已登陆情况下访问登陆/注册页，重定向到首页
  else if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    next(isAdmin ? '/admin' : '/home')
  }
  // 管理员默认进入后台页
  else if (to.path === '/home' && isAdmin) {
    next('/admin')
  }
  // 非管理员不允许进入后台页
  else if (to.path === '/admin' && !isAdmin) {
    next('/home')
  } else {
    next()
  }
})

export default router
