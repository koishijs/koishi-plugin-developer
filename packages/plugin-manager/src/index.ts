import { Context, Plugin } from 'koishi-core'
import { merge } from 'koishi-utils'

import './core/Context'
import { allPlugins } from './core/Context'

// 插件名称
export const name = 'manager'

declare module 'koishi-core' {
  namespace Plugin {
    interface Packages {
      // 将插件注册至 koishi-core 核心模块
      'koishi-plugin-manager': typeof import('.')
    }
  }
}

// 插件配置
interface Config { }

// 插件默认配置
const defaultConfig: Config = {
}

const searchPlugin = (plugin: string): {
  pluginName: string
  pluginModule: Plugin
} | null => {
  const pluginName = plugin
  try {
    return { pluginName, pluginModule: require(pluginName) }
  } catch (e) {
    if (/^koishi-plugin-.*$/.test(pluginName)) return null
    return searchPlugin('koishi-plugin-' + pluginName)
  }
}

export const apply = (ctx: Context, _config: Config = {}) => {
  const _logger = ctx.logger(`koishi-plugin-${name}`)
  _config = merge(_config, defaultConfig)

  const kpmCmd = ctx.command(
    'kpm <subCmd> [args...] 插件管理工具。', { authority: 4 }
  )

  kpmCmd.subcommand('.install [...plugins]')
    .alias('kpm.i')
    .option('global', '-g 全局', { type: "boolean" })
    .action(async ({ session, options }, ...plugins) => {
      let sessionCtx = ctx.select(
        'userId', session.userId
      )
      if (options.global) { sessionCtx = ctx.app }

      for (let i = 0; i < plugins.length; i++) {
        const data = searchPlugin('' + plugins[i])

        if (data !== null) {
          const ctxPlugins = allPlugins.get(sessionCtx)
          const isInstalled = ctxPlugins && ctxPlugins.filter(
            ctxPluginData => ctxPluginData.plugin === data.pluginModule
          ).length >= 1
          !isInstalled && sessionCtx.plugin(data.pluginModule)
          await session.send(`installed ${data.pluginName}`)
        } else {
          await session.send(`本地未安装 ${data.pluginName}`)
        }
      }
      return '安装完成'
    })

  kpmCmd.subcommand('.list')
    .alias('kpm.ls')
    .option('global', '-g 全局', { type: "boolean" })
    .action(({ session, options }) => {
      let sessionCtx = ctx.select(
        'userId', session.userId
      )
      if (options.global) { sessionCtx = ctx.app }

      let pluginsList = ''
      const ctxPlugins = allPlugins.get(
        sessionCtx
      )
      ctxPlugins && ctxPlugins.forEach(ctxPluginData => {
        const plugin = ctxPluginData.plugin
        const name = plugin?.name ?? '未命名插件'
        pluginsList += `[√] ${name}\n`
      })
      return pluginsList === '' ? '暂无已安装的插件' : pluginsList
    })
}
