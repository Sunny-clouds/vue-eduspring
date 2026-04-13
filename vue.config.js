const { defineConfig } = require('@vue/cli-service')

const proxyTarget = process.env.VUE_APP_PROXY_TARGET || 'http://localhost:8080'

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      },
      '/upload': {
        target: proxyTarget,
        changeOrigin: true
      }
    }
  }
})
