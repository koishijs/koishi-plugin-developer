import { Command, Context } from 'koishi-core'
import { allPlugins } from '../core/Context'
import { searchPlugin } from '../index'

export const registerUnInstallCmd = (ctx: Context, cmd: Command) => {
  cmd.subcommand(
    '.uninstall [...plugins] 卸载插件'
  ).usage(
    '从指定会话卸载插件'
  ).alias(
    ...[ 'uni', 'un', 'unlink', 'remove', 'rm', 'r' ].map(i => `kpm.${i}`)
  ).option(
    'global', '-g 全局', { type: 'boolean' }
  ).action(async ({ session, options }, ...plugins) => {
    let sessionCtx = ctx.select(
      'userId', session.userId
    )
    if (options.global) { sessionCtx = ctx.app }

    for (let i = 0; i < plugins.length; i++) {
      const pluginName = '' + plugins[i]
      const data = searchPlugin(pluginName)

      if (data !== null) {
        const ctxPlugins = allPlugins.get(sessionCtx)
        let plugins
        if (options.global) {
          plugins = allPlugins.plugins
        } else {
          plugins = allPlugins.get(sessionCtx).map(pluginData => pluginData.plugin)
        }
        plugins = plugins.filter(p => p.apply && p.apply === data.pluginModule.apply)
        for (let j = 0; j < plugins.length; j++) {
          await ctx.dispose(plugins[j])
          const index = ctxPlugins.findIndex(val => val.plugin.apply === plugins[j].apply)
          if (index >= 0) {
            ctxPlugins.splice(index, 1)
            await session.send(`uninstalled ${pluginName}`)
          }
        }
      } else {
        await session.send(`本地未安装 ${pluginName} / koishi-plugin-${pluginName}`)
      }
    }
    return '卸载完成'
  })
}
