import { Context, Command, Logger } from 'koishi-core'
import { allPlugins } from '../core/Context'
import { searchPlugin } from '../index'
import { pluginService } from '../services/plugin'

export const registerInstallCmd = (ctx: Context, cmd: Command, logger: Logger) => {
  cmd.subcommand(
    '.install [...plugins]', '安装插件'
  ).usage(
    '安装插件到当前会话'
  ).alias(
    ...[ 'i', 'ins', 'add' ].map(i => `kpm.${i}`)
  ).option(
    'channel', '-c 频道', { type: 'boolean' }
  ).option(
    'global', '-g 全局', { type: 'boolean' }
  ).action(async ({ session, options }, ...plugins) => {
    const sessionCtx = session.genSessionCtx(ctx, options)

    for (let i = 0; i < plugins.length; i++) {
      const pluginName = '' + plugins[i]
      const data = searchPlugin(pluginName)

      let msg
      if (data !== null) {
        const ctxPlugins = allPlugins.get(sessionCtx)
        if (options.global) {
          const plugins = allPlugins.plugins.filter(p => p.apply && p.apply === data.pluginModule.apply)
          for (let j = 0; j < plugins.length; j++) {
            await ctx.dispose(plugins[j])
            const index = ctxPlugins.findIndex(val => val.plugin.apply === plugins[j].apply)
            ctxPlugins.splice(index, 1)
          }
        }

        const isInstalled = ctxPlugins && ctxPlugins.filter(
          ctxPluginData => ctxPluginData.plugin?.apply && ctxPluginData.plugin?.apply === data.pluginModule?.apply
        ).length >= 1
        if (isInstalled) {
          msg = `当前会话已安装 ${ pluginName }`
        } else {
          sessionCtx.plugin(data.pluginModule)
          msg = `installed ${ pluginName }`
        }
      } else {
        msg = `本地未安装 ${ pluginName } / koishi-plugin-${ pluginName }`
      }
      await session.send(msg)
      logger.info(msg)
    }
    return '安装完成'
  }).subcommand(
    '.remote [...plugins]', '从远程安装插件(|依赖)'
  ).action(async ({ session }, ...plugins) => {
    const pluginsStr = plugins.join(', ')
    try {
      await session.send(`${ pluginsStr } 安装中`)
      const installedPlugins = await pluginService.installFromRemote(plugins)
      if (installedPlugins.length === 0) {
        return '无依赖需要安装'
      } else {
        return `${ installedPlugins.join(', ') } 安装完毕.`
      }
    } catch (e) {
      await session.send(`${ pluginsStr } 安装失败.`)
      // 安全起见，报错信息只私聊发送给用户
      await session.bot.sendPrivateMessage(
        session.userId,
        `${new Date().toLocaleString()} 安装 ${ pluginsStr } 失败\n` +
        `失败原因:\n ${ e }`
      )
    }
  })
}
