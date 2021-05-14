import { Context } from 'koishi-core'
import Router from '@koa/router'
import { pluginService } from '../services/plugin'

const prefix = 'plugins'

export const router = (ctx: Context): Router => {
  const router = new Router({
    prefix: `/${ prefix }`
  })
  router.get('/', async koaCtx => {
    const test = (koaCtx.query?.isRemote ?? '').toString().trim().toLowerCase()
    const isRemote = !((test === 'false') || (test === '0') || (test === ''))

    console.log(isRemote)
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
