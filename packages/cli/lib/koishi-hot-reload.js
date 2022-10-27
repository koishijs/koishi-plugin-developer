const Koishi = require('koishi')

/** @typedef {import('./protocol').Protocol} Protocol */

/**
 * @template {Protocol.UpTypes} T
 * @param {T} type
 * @param {Protocol.UpDispatcherMap[T][0]} data
 * @returns {{type, data}}
 */
function dispatch(type, data) {
  return { type, data }
}

/** @typedef {{
  ctx: Koishi.Context;
  name: string;
  fork: Koishi.Context;
  config: any;
}} CtxRelative */

/** @type {Map<string, CtxRelative[]>} */
const ctxMap = new Map()

const originalPlugin = Koishi.Context.prototype.plugin
Koishi.Context.prototype.plugin = function (...args) {
  const [plugin, config] = args
  const { name } = plugin
  if (['runtime', 'validate'].includes(name))
    return

  const fork = originalPlugin.apply(this, args)

  try {
    const resolver = require.resolve(`koishi-plugin-${name}`)
    const relative = { ctx: this, name, fork, config }
    if (ctxMap.has(resolver)) {
      ctxMap.get(resolver).push(relative)
    } else {
      ctxMap.set(resolver, [relative])
    }
    if (name) {
      process.send?.(dispatch('plugin:apply', {
        name, config, resolver
      }))
    }
  } catch (e) {
    console.error(e)
  }
  return fork
}

process.on(
  'message',
  /** @param {Protocol.DownDispatcher[0]} msg */ function (msg) {
    if (msg.type === 'plugin:reload') {
      const resolver = msg.data
      const relatives = ctxMap.get(resolver)
      relatives.forEach(({ ctx, name, fork, config }) => {
        console.log(`[koishi] disposing plugin ${name}`)
        fork.dispose()
        delete require.cache[resolver]
        console.log(`[koishi] disposed plugin ${name}`)
        ctx.plugin(require(resolver), config)
      })
    }
  })
