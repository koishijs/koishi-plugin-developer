import { Context, Plugin, Session } from 'koishi-core'

export const allPlugins = new Map<Context, {
  plugin: Plugin, options: Plugin.Config<Plugin>
}[]>()

const CtxProto = Context.prototype

const sourceContextMethods = {
  select: CtxProto.select,
  plugin: CtxProto.plugin
}

const allContexts = new Map<Context, {
  key: keyof Session
  values: Session[keyof Session][]
  childCtx: Context
}[]>()

CtxProto.select = function <K extends keyof Session>(
  key: K, ...values: Session[K][]
): Context {
  const childDatas = allContexts.get(this) ?? []
  if (childDatas.length === 0) allContexts.set(this, childDatas)

  const childContexts = childDatas.filter(
    childData => key === childData.key && values.toString() === childData.values.toString()
  ).map(childData => childData.childCtx)

  if (childContexts.length >= 1) {
    return childContexts[0]
  }

  childDatas.push({
    key, values, childCtx: sourceContextMethods.select.call(
      this, key, ...values
    )
  })
  return childDatas[childDatas.length - 1].childCtx
}

CtxProto.plugin = function <T extends Plugin>(
  plugin: T, options?: Plugin.Config<T>
): Context {
  const ctxPlugins = allPlugins.get(this) ?? []
  if (ctxPlugins.length === 0) {
    allPlugins.set(this, ctxPlugins)
  }
  if (
    typeof plugin !== 'function' && 'name' in plugin
  ) {
    ctxPlugins.push({ plugin, options })
  }
  return sourceContextMethods.plugin.call(this, plugin, options)
}
