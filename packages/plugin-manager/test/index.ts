import { App } from 'koishi-test-utils'
import * as manager from 'koishi-plugin-manager'

const app = new App({
  mockDatabase: true
})
app.plugin(manager, {})

describe('Manager plugin', () => {
  before(async () => {
    await app.database.initUser('001', 4)
    await app.database.initUser('002', 4)
    await app.database.initChannel('001')
    await app.database.initChannel('002')
  })
  const superSes001 = app.session('001')
  const _superSes001Chanel001 = app.session('001', '001')
  const _superSes001Chanel002 = app.session('001', '002')
  const _superSes002 = app.session('002')
  const _superSes002Chanel001 = app.session('002', '001')
  const _superSes002Chanel002 = app.session('002', '002')

  describe('list plugins', () => {

    it('should have no plugin installed', async () => {
      await superSes001.shouldReply(
        'kpm.ls', '暂无已安装的插件'
      )
      await superSes001.shouldReply(
        'kpm.list', '暂无已安装的插件'
      )
    })

    it('should have a manager plugin.', async () => {
      await superSes001.shouldReply(
        'kpm.ls -g', '[√] manager\n'
      )
    })
  })

  describe('install plugin', () => {
    it('should installed demo plugin in private session.', async () => {
      await superSes001.shouldReply(
        'kpm.install demo', [
          'installed koishi-plugin-demo',
          '安装完成'
        ]
      )
      await superSes001.shouldReply(
        'kpm.ls', '[√] demo\n'
      )
    })

    it('should installed koishi-plugin-demo plugin in private session.', async () => {
      await superSes001.shouldReply(
        'kpm.install koishi-plugin-demo', [
          'installed koishi-plugin-demo',
          '安装完成'
        ]
      )
      await superSes001.shouldReply(
        'kpm.ls', '[√] demo\n'
      )
      await superSes001.shouldReply(
        'hello bot', 'hello master'
      )
    })
  })
})
