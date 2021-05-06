import { Context } from 'koishi-core'
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

export const apply = (ctx: Context, _config: Config = {}) => {
  const logger = ctx.logger(`koishi-plugin-${name}`)
  _config = merge(_config, defaultConfig)

  const kpmCmd = ctx.command(
    'kpm <subCmd> [args...] 插件管理工具。', { authority: 4 }
  )

  kpmCmd.subcommand('.install [...plugins]')
    .alias('kpm.i')
    .action(async ({ session }, ...plugins) => {
      for (let i = 0; i < plugins.length; i++) {
        const plugin = ''+plugins[i]
        ctx.plugin(require(plugin))
        await session.send('plugin installed')
      }
    })

  kpmCmd.subcommand('.list')
    .alias('kpm.ls')
    .action(({ session }) => {
      let pluginsList = ''
      allPlugins.forEach((value, key, map) => {
        pluginsList += ('[x] ' + value.plugin?.name || '未命名插件') + '\n'
      })
      return pluginsList
    })
}
