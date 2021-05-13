import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import * as path from 'path'

import pkg from './package.json'

const pluginName = pkg.name.replace('koishi-plugin-', '')

export default defineConfig({
  root: path.resolve(
    __dirname, './client'
  ),
  base: `/plugins/${pluginName}/`,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  },
  server: {
    host: 'localhost',
    port: 18080,
    proxy: {
      '/plugin-apis': {
        target: 'http://localhost:43333',
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: true
  },
  plugins: [ vuePlugin() ]
})
