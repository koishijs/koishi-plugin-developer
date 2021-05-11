import { App } from 'koishi-test-utils'
import * as demo from 'koishi-plugin-demo'

// 生成 mock app 实例，用于模拟测试
const app = new App({
  mockDatabase: true
})
// 将插件注册至 mock app 实例中
app.plugin(demo, {})

describe('Demo Plugin', () => {
  // 基础性功能测试
  describe('Basic', () => {
    // 向 mock 数据库注入用户数据
    before(async () => {
      await app.database.initUser('001', 4)
    })
    // 基于模拟数据，创建一个 session
    const superSes = app.session('001')

    // 测试返回结果是否正确
    it('should hello bot', async () => {
      await superSes.shouldReply('hello bot', 'hello master')
    })
  })
})
