import { App } from 'koishi-test-utils'
import * as manager from 'koishi-plugin-manager'
import { allPlugins } from '../src/core/Context'

describe('Manager plugin', () => {
  const app = new App({
    port: 30000,
    mockDatabase: true
  })
  app.plugin(manager, {})
  // app.on('message', session => {
  //   console.log(session.username, session.groupId, session.content)
  // })

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
  const superSes001Chanel002 = app.session('001', '002')
  const superSes002 = app.session('002')
  const superSes002Chanel001 = app.session('002', '001')
  const superSes002Chanel002 = app.session('002', '002')

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
    afterEach(() => {
      allPlugins.plugins.forEach(val => {
        val.apply !== manager.apply && app.dispose(val)
      })
    })

    it('should installed demo plugin in private session.', async () => {
      await superSes001.shouldReply(
        'kpm.install demo', 'koishi-plugin-demo 安装完成'
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
        'kpm.i koishi-plugin-demo', 'koishi-plugin-demo 安装完成'
      )
      await superSes001.shouldReply(
        'hello bot', 'hello master'
      )
      // other user shouldn't reply
      await superSes002.shouldNotReply('hello bot')
    })

    it('should installed koishi-plugin-demo plugin in channel session.', async () => {
      await superSes001.shouldReply(
        'kpm.i -c koishi-plugin-demo', '当前会话不是频道，无法使用 `group` 参数。'
      )
      await superSes001Chanel001.shouldReply(
        'kpm.i -c koishi-plugin-demo', 'koishi-plugin-demo 安装完成'
      )
      // this channel able to use
      await superSes001Chanel001.shouldReply(
        'hello bot', 'hello master'
      )
      await superSes001Chanel001.shouldReply(
        'test', 'this is a test command.'
      )
      await superSes002Chanel001.shouldReply(
        'hello bot', 'hello master'
      )
      // other channel unable to use
      await superSes001Chanel002.shouldNotReply('hello bot')
      await superSes002Chanel002.shouldNotReply('hello bot')

      await superSes001Chanel002.shouldReply(
        'kpm.i -c koishi-plugin-demo', 'koishi-plugin-demo 安装完成'
      )
      await superSes002Chanel002.shouldReply(
        'hello bot', 'hello master'
      )
      await superSes002Chanel002.shouldReply(
        'test', 'this is a test command.'
      )
    })

    it('should installed koishi-plugin-demo plugin in global.', async () => {
      await superSes001.shouldReply(
        'kpm.i -g demo', 'koishi-plugin-demo 安装完成'
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
        'kpm.i -g demo', '当前会话已安装 demo'
      )
    })

    it('should throw a error.', async () => {
      await superSes001.shouldReply(
        'kpm.i', '请输入待安装的插件'
      )
      await superSes001.shouldReply(
        'kpm.i.remote', '请输入待安装的插件'
      )
    })

    it('should have no demo01 plugin.', async () => {
      const pluginName = 'demo01'
      await superSes001.shouldReply(
        `kpm.i -g ${pluginName}`, `本地未安装 ${pluginName} / koishi-plugin-${pluginName}`
      )
    })
  })

  describe('uninstall plugin', () => {
    it('should uninstall demo.', async () => {
      await superSes001.shouldReply(
        'kpm.i demo', 'koishi-plugin-demo 安装完成'
      )
      await superSes001.shouldReply(
        'kpm.uni demo', ['uninstalled demo', '卸载完成']
      )
      await superSes001.shouldNotReply('hello bot')
    })

    it('should uninstall demo in channel.', async () => {
      await superSes001Chanel001.shouldReply(
        'kpm.i -c demo', 'koishi-plugin-demo 安装完成'
      )
      await superSes001Chanel001.shouldReply(
        'hello bot', 'hello master'
      )
      await superSes001Chanel001.shouldReply(
        'kpm.uni -c demo', ['uninstalled demo', '卸载完成']
      )
      await superSes001Chanel001.shouldNotReply('hello bot')
    })

    it('should uninstall demo in global.', async () => {
      await superSes001.shouldReply(
        'kpm.i -g demo', 'koishi-plugin-demo 安装完成'
      )
      await superSes001.shouldReply(
        'hello bot', 'hello master'
      )
      await superSes001.shouldReply(
        'kpm.uni -g demo', ['uninstalled demo', '卸载完成']
      )
      await superSes001.shouldNotReply('hello bot')
    })
  })
})
