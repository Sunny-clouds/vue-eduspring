import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import './assets/responsive.css'
import App from './App.vue'
import router from './router'

// 注册 ECharts 组件
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

// 统一在应用入口注册全局插件。
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.component('VChart', VChart)

// 挂载根组件。
app.mount('#app')
