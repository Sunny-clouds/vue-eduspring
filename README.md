# 在线教育管理系统（前端）

## 项目简介

本项目是在线教育管理系统的前端页面，基于 Vue3 + Element Plus 开发，配合后端接口实现管理员、教师、学生三类角色的在线教学管理功能。

前端主要包含登录注册、课程展示、课程管理、学生选课、课程资源、在线视频学习、在线考试、成绩统计、讨论互动等页面。

## 技术栈

- Vue3
- Vue CLI
- Vue Router
- Pinia
- Axios
- Element Plus
- ECharts / vue-echarts

## 核心功能

### 用户模块

- 用户登录
- 用户注册
- Token 本地存储
- 根据角色跳转不同页面
- 登录状态校验

### 课程模块

- 课程列表展示
- 课程详情查看
- 教师发布课程
- 学生选课
- 课程进度展示

### 在线学习模块

- 课程资源查看
- 视频学习
- 学习进度展示

### 在线考试模块

- 考试列表
- 在线答题
- 提交试卷
- 查看考试结果

### 成绩统计模块

- 成绩列表展示
- 按课程、学生、考试维度查看成绩
- 图表数据展示

### 讨论互动模块

- 发布讨论
- 评论回复
- 师生互动

## 项目亮点

1. 使用 Vue3 + Element Plus 构建后台管理页面，页面结构清晰。
2. 使用 Axios 封装接口请求，并携带 JWT Token 完成后端接口访问。
3. 使用 Pinia 管理用户信息、登录状态和角色信息。
4. 使用 Vue Router 实现页面路由跳转和基础权限控制。
5. 使用 ECharts / vue-echarts 展示成绩统计、课程数据等图表内容。
6. 与 Spring Boot 后端项目配合，实现完整的前后端分离开发流程。

## 运行环境

- Node.js 18+
- npm
- Vue CLI

## 运行说明

### 1. 克隆项目

```bash
git clone https://github.com/Sunny-clouds/vue-eduspring.git
```

### 2. 安装依赖
npm install
### 3. 启动项目
npm run serve
### 4. 打包项目
npm run build
后端接口

后端项目地址：

https://github.com/Sunny-clouds/Online-education-system

本地后端默认地址：

http://localhost:8080

如需修改接口地址，可在环境配置文件中调整后端 API 地址。
