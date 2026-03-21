import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'

// 统一在应用入口注册全局插件。
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 挂载根组件。
app.mount('#app')
