import { Context } from 'koishi-core'
import { merge } from 'koishi-utils'

import Router from '@koa/router'
import KoaLogger from 'koa-logger'

import { router } from './controllers/common'

// 插件名称
export const name = 'demo-view'

declare module 'koishi-core' {
  namespace Plugin {
    interface Packages {
      // 将插件注册至 koishi-core 核心模块
      'koishi-plugin-demo-view': typeof import('.')
    }
  }
}

// 插件配置
interface Config { }

// 插件默认配置
const defaultConfig: Config = {
}

export const apply = (ctx: Context, _config: Config = {}) => {
  const logger = ctx.logger(`koishi-plugin-${ name }`)
  _config = merge(_config, defaultConfig)

  const pluginRouter = new Router({
    prefix: `/${ name }`
  })
  pluginRouter[Context.current] = ctx
  pluginRouter.all(
    `/(.*)`, KoaLogger(str => logger.info(str))
  )

  const r = router(ctx)
  pluginRouter.use(r.routes(), r.allowedMethods())

  ctx.router.use(pluginRouter.routes(), pluginRouter.allowedMethods())
}
