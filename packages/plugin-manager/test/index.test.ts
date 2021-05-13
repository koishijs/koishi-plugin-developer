import { App } from 'koishi-test-utils'
import * as manager from 'koishi-plugin-manager'

describe('Manager plugin', () => {
  const app = new App({
    port: 30000,
    mockDatabase: true
  })
  app.plugin(manager, {})

  before(async () => {
    await app.database.initUser('001', 4)
    await app.database.initUser('002', 4)
    await app.database.initChannel('001')
    await app.database.initChannel('002')
  })
  after(async () => {
    process.exit(0)
  })
  const superSes001 = app.session('001')
  const superSes001Chanel001 = app.session('001', '001')
  const _superSes001Chanel002 = app.session('001', '002')
  const superSes002 = app.session('002')
  const superSes002Chanel001 = app.session('002', '001')
  const _superSes002Chanel002 = app.session('002', '002')

  describe('list plugins', function () {
    this.timeout(30000)

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

    it('should return remote plugins', async () => {
      const cmd = 'kpm.ls.remote'
      await superSes001.shouldReply(
        cmd, /^远程共检索到: .*个依赖/
      )
      await superSes001.shouldReply(
        `${cmd} -p 1 -s 10`, /^远程共检索到: .*个依赖/
      )
      await superSes001.shouldReply(
        `${cmd} -p 1`, /^远程共检索到: .*个依赖/
      )
      await superSes001.shouldReply(
        `${cmd} -s 10`, /^远程共检索到: .*个依赖/
      )
    })
  })

  describe('install plugin', () => {
    it('should installed demo plugin in private session.', async () => {
      await superSes001.shouldReply(
        'kpm.install demo', [
          'installed demo',
          '安装完成'
        ]
      )
      await superSes001.shouldReply(
        'kpm.ls', '[√] demo\n'
      )
      await superSes001.shouldReply(
        'hello bot', 'hello master'
      )
      // 其他用户应当无法使用该插件
      await superSes002.shouldNotReply('hello bot')
    })

    it('should installed koishi-plugin-demo plugin in private session.', async () => {
      await superSes001.shouldReply(
        'kpm.i koishi-plugin-demo', [
          'installed koishi-plugin-demo',
          '安装完成'
        ]
      )
      await superSes001.shouldReply(
        'hello bot', 'hello master'
      )
    })

    it('should installed koishi-plugin-demo plugin in global.', async () => {
      await superSes001.shouldReply(
        'kpm.i -g demo', ['installed demo', '安装完成']
      )
      // 检测是否安装到当前 session
      await superSes001.shouldReply(
        'hello bot', 'hello master'
      )
      // 检测是否安装到全局
      await superSes001Chanel001.shouldReply(
        'hello bot', 'hello master'
      )
      // 安装到全局 其他用户应当也能使用该插件
      await superSes002.shouldReply(
        'hello bot', 'hello master'
      )
      // 安装到全局 其他用户在其他的群应当也能使用该插件
      await superSes002Chanel001.shouldReply(
        'hello bot', 'hello master'
      )

      // test dup install bug
      await superSes001.shouldReply(
        'kpm.i -g demo', ['installed demo', '安装完成']
      )
      await superSes001.shouldReply(
        'hello bot', 'hello master'
      )
    })

    it('should have no demo01 plugin.', async () => {
      const pluginName = 'demo01'
      await superSes001.shouldReply(
        `kpm.i -g ${pluginName}`, [`本地未安装 ${pluginName} / koishi-plugin-${pluginName}`, '安装完成']
      )
    })
  })

  describe('uninstall plugin', () => {
    it('should uninstall demo in global.', async () => {
      await superSes001.shouldReply(
        'kpm.i -g demo', ['installed demo', '安装完成']
      )
      await superSes001.shouldReply(
        'hello bot', 'hello master'
      )
      await superSes001.shouldReply(
        'kpm.uni -g demo', ['uninstalled demo', '卸载完成']
      )
      await superSes001.shouldNotReply('hello bot')
    })

    it('should uninstall demo.', async () => {
      await superSes001.shouldReply(
        'kpm.i demo', ['installed demo', '安装完成']
      )
      await superSes001.shouldReply(
        'kpm.uni demo', ['uninstalled demo', '卸载完成']
      )
      await superSes001.shouldNotReply('hello bot')
    })
  })
})
