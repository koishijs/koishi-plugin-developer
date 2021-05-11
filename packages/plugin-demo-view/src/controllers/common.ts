import { Context } from 'koishi-core'
import Router from '@koa/router'

const prefix = 'common'

export const router = (ctx: Context): Router => {
  const router = new Router({
    prefix: `/${ prefix }`
  })
  router[Context.current] = ctx

  router.get('/test', async koaCtx => {
    koaCtx.body = {
      detail: 'some messages.'
    }
  })
  return router
}
