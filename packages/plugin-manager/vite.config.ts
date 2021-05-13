import { defineConfig } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import * as path from 'path'

import { name } from './src'

export default defineConfig({
  root: path.resolve(
    __dirname, './client'
  ),
  base: `/plugins/${ name }/`,
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
