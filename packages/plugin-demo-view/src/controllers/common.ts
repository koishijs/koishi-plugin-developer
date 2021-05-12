import { Context } from 'koishi-core'
import Router from '@koa/router'
import { User } from 'koishi'

const prefix = 'common'

export const router = (ctx: Context): Router => {
  const router = new Router({
    prefix: `/${ prefix }`
  })

  router.get('/test', async koaCtx => {
    koaCtx.body = {
      detail: 'some messages.'
    }
  })

  router.get('/:platform/:uid', async koaCtx => {
    const {
      platform, uid
    } = koaCtx.params as {
      platform: User.Index, uid: string
    }
    const {
      fields
    } = koaCtx.query as {
      fields: string
    }

    const user = await ctx.database.getUser(
      platform, uid, [ 'id', ...(
        (fields ?? '').split(',') as User.Index[]
      ) ]
    )
    if (!user) throw new Error('[404]:用户不存在.')
    koaCtx.body = user
  })
  return router
}
