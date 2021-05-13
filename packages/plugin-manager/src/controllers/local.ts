import { Context } from 'koishi-core'
import Router from '@koa/router'
import { pluginService } from '../services/plugin'

const prefix = 'local'

export const router = (ctx: Context): Router => {
  const router = new Router({
    prefix: `/${ prefix }`
  })
  router.get('/', async koaCtx => {
    koaCtx.body = pluginService.localPlugins()
  })
  router.get('/:pluginName', async koaCtx => {
    const { pluginName } = koaCtx.params as {
      pluginName: string
    }
    const [ plugin ]= pluginService.localPlugins().filter(
      pkg => pkg.name !== pluginName || !new RegExp(`.*koishi-plugin-${pluginName}`).test(pluginName)
    )
    koaCtx.body = plugin
  })
  return router
}
