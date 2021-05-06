import { App } from 'koishi-test-utils'
import * as manager from 'koishi-plugin-manager'

const app = new App({
  mockDatabase: true
})
app.plugin(manager, {})

describe('Demo Plugin', () => {
  describe('Basic', () => {
    before(async () => {
      await app.database.initUser('001', 4)
    })
    const superSes = app.session('001')

    it('should have a manager plugin.', async () => {
      await superSes.shouldReply('kpm.ls', '暂无已安装的插件')
      await superSes.shouldReply('kpm.list', '暂无已安装的插件')
      await superSes.shouldReply('kpm.ls -g', '\n')
      await superSes.shouldReply('kpm.ls --global', '\n')
    })

    it('should installed demo plugin.', async () => {
      await superSes.shouldReply(
        'kpm.install', '安装完成'
      )
      await superSes.shouldReply(
        'kpm.install demo', [
          'installed koishi-plugin-demo',
          '安装完成'
        ]
      )
      await superSes.shouldReply(
        'kpm.install koishi-plugin-demo', [
          'installed koishi-plugin-demo',
          '安装完成'
        ]
      )

      await superSes.shouldReply(
        'kpm.ls', '[√] demo\n'
      )
    })
  })
})
