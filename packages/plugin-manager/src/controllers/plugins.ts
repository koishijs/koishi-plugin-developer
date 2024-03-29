import { Context } from 'koishi-core'
import Router from '@koa/router'
import { ParsedUrlQuery } from 'querystring'

import { pluginService } from '../services/plugin'
import { npmApi } from '../core/NpmApi'

const prefix = 'plugins'

const parserQS = <T>(
  qs: ParsedUrlQuery, schema: T
): T => {
  const tempM = new Map()

  for (const qsKey in schema) {
    const itemSchema = schema[qsKey]
    const val = (qs[qsKey] ?? itemSchema) as string | string[]
    const trimStr = val.toString().trim()

    switch (typeof itemSchema) {
      case 'boolean':
        tempM.set(qsKey, !([ 'false', '0', 'null', 'undefined', '' ].includes(
          trimStr.toLowerCase()
        )))
        break
      case 'number':
        tempM.set(qsKey, +trimStr.toLowerCase())
        break

      case 'undefined':
      default:
        tempM.set(qsKey, qs[qsKey] ?? schema[qsKey])
        break
    }
  }
  const cpD = {}
  tempM.forEach((val, key) => cpD[key] = val)
  return cpD as T
}

export const router = (ctx: Context): Router => {
  const router = new Router({
    prefix: `/${ prefix }`
  })

  router.get('/', async koaCtx => {
    const qs = parserQS(koaCtx.query, {
      q: '',
      isRemote: false,
      page: 0, size: 10
    })
    if (qs.isRemote) {
      qs.q = qs.q || 'koishi-plugin'
      koaCtx.body = await npmApi.search(
        qs.q, qs.page, qs.size
      )
      return
    }

    const localPlugins = pluginService.listFromLocal(
      undefined, qs.q.split(' ').filter(s => s !== '')
    )

    koaCtx.body = {
      total: localPlugins.length,
      results: localPlugins.slice(qs.page * qs.size, (qs.page + 1) * qs.size).map(p => new Object({
        package: p
      }))
    }
  })

  router.post('/', async koaCtx => {
    // TODO install plugins
  })

  router.get('/:pluginName', async koaCtx => {
    const { pluginName } = koaCtx.params as {
      pluginName: string
    }
    const [ plugin ]= pluginService.listFromLocal().filter(
      pkg => new RegExp(`.*koishi-plugin-${ pluginName }`).test(pkg.name)
    )
    if (!plugin) {
      throw new Error('[404]:插件不存在.')
    }
    koaCtx.body = plugin
  })
  return router
}
