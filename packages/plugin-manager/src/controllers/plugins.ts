import { Context } from 'koishi-core'
import Router from '@koa/router'
import { ParsedUrlQuery } from 'querystring'

import { pluginService } from '../services/plugin'

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
      isRemote: false
    })

    if (!qs.isRemote) {
      koaCtx.body = pluginService.localPlugins(undefined, qs.q.split(' ').filter(s => s !== ''))
      return
    }
    console.log(qs.isRemote)
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
