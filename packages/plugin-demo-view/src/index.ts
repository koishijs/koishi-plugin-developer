import { Context } from 'koishi-core'
import { merge } from 'koishi-utils'

import Router from '@koa/router'
import KoaLogger from 'koa-logger'
import * as path from 'path'
import glob from 'glob'

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
    prefix: `/plugin-apis/${ name }`
  })
  pluginRouter[Context.current] = ctx
  pluginRouter.all(
    '/(.*)', KoaLogger(str => logger.info(str))
  )
  pluginRouter.all('/(.*)', async (koaCtx, next) => {
    try {
      await next()
    } catch (e) {
      const re = /^\[(.*)]:(.*)$/
      if (e instanceof Error && typeof e.message === 'string' && re.test(e.message)) {
        const [
          _allMsg, status, msg
        ] = re[Symbol.match](e.message)
        if (status && msg) {
          koaCtx.status = +status
          koaCtx.body = msg
        } else {
          throw e
        }
        logger.error(e)
      } else {
        throw e
      }
    }
  })

  glob.sync(
    `${ path.resolve(__dirname, './controllers') }/*.ts`
  ).forEach(controller => {
    const controllerModule: {
      router(ctx: Context): Router
    } = require(controller)

    const r = controllerModule.router(ctx)
    pluginRouter.use(r.routes(), r.allowedMethods())
  })
  ctx.router.use(pluginRouter.routes(), pluginRouter.allowedMethods())
}
