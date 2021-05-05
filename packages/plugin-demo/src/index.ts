import { Context } from 'koishi-core'
import { merge } from 'koishi-utils'

// 插件名称
export const name = 'demo'

declare module 'koishi-core' {
  namespace Plugin {
    interface Packages {
      // 将插件注册至 koishi-core 核心模块
      'koishi-plugin-demo': typeof import('.')
    }
  }
}

// 插件配置
interface Config { }

// 插件默认配置
const defaultConfig: Config = {
}

export const apply = (ctx: Context, config: Config = {}) => {
  const logger = ctx.logger(`koishi-plugin-${name}`)
  config = merge(config, defaultConfig)

  ctx.on('message', async session => {
    logger.info(`接受到 message: '${session.content}'`)
    if (session.content == 'hello bot') {
      await session.send('hello master')
    }
  })
}
