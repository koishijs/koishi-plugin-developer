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

    const bot = ctx.bots.filter(bot => bot.platform === platform)[0] ?? undefined
    if (!bot) throw new Error('[422]:平台不存在.')

    const user = await bot.getUser(uid)
    if (!user) throw new Error('[404]:用户不存在.')
    const userOut = {}
    ;(fields ?? '').split(',').forEach(field => {
      userOut[field] = user[field] ?? undefined
    })
    koaCtx.body = userOut
  })
  return router
}
