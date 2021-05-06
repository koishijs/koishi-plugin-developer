import { Context, Plugin } from 'koishi-core'

export const allPlugins = new Map<Context, {
  plugin: Plugin, options: Plugin.Config<Plugin>
}>()

const originRegisterPlugin = Context.prototype.plugin
Context.prototype.plugin = function <T extends Plugin>(
  plugin: T, options?: Plugin.Config<T>
): Context {
  allPlugins.set(this, { plugin, options })
  originRegisterPlugin.call(this, plugin, options)
  return this
}
