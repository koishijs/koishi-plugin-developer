import { Context, Command } from 'koishi-core'
import { allPlugins } from '../core/Context'
import { npmApi } from '../core/NpmApi'
import path from 'path'
import fs from 'fs'
import { doCommand, getLocalPluginPkgs, Package, searchPlugin } from 'koishi-plugin-manager'

export const registerInstallCmd = (ctx: Context, cmd: Command) => {
  cmd.subcommand(
    '.install [...plugins]'
  ).alias(
    ...[ 'i', 'in', 'ins', 'inst', 'insta', 'instal', 'isnt', 'isnta', 'isntal', 'add' ].map(i => `kpm.${i}`)
  ).option(
    'global', '-g 全局', { type: 'boolean' }
  ).action(async ({ session, options }, ...plugins) => {
    let sessionCtx = ctx.select(
      'userId', session.userId
    )
    if (options.global) { sessionCtx = ctx.app }

    for (let i = 0; i < plugins.length; i++) {
      const pluginName = '' + plugins[i]
      const data = searchPlugin(pluginName)

      if (data !== null) {
        const ctxPlugins = allPlugins.get(sessionCtx)
        if (options.global) {
          const plugins = allPlugins.plugins.filter(p => p.apply && p.apply === data.pluginModule.apply)
          for (let j = 0; j < plugins.length; j++) {
            await ctx.dispose(plugins[j])
            const index = ctxPlugins.findIndex(val => val.plugin.apply === plugins[j].apply)
            ctxPlugins.splice(index, 1)
          }
        }

        const isInstalled = ctxPlugins && ctxPlugins.filter(
          ctxPluginData => ctxPluginData.plugin?.apply && ctxPluginData.plugin?.apply === data.pluginModule?.apply
        ).length >= 1
        !isInstalled && sessionCtx.plugin(data.pluginModule)
        await session.send(`installed ${pluginName}`)
      } else {
        await session.send(`本地未安装 ${pluginName} / koishi-plugin-${pluginName}`)
      }
    }
    return '安装完成'
  }).subcommand(
    '.remote [...plugins]'
  ).alias(
    ...[ 'r' ].map(i => `kpm.i.${i}`)
  ).action(async ({ session }, ...plugins) => {
    const localPkgs = getLocalPluginPkgs()
    const waitInstallPlugins = []
    for (let i = 0; i < plugins.length; i++) {
      const pluginName = plugins[i]
      try {
        if (localPkgs.findIndex(pkg => pkg.name === pluginName) >= 0) {
          await session.send(`本地已安装 ${pluginName}，无须重复安装。`)
        } else {
          const pkgData = await npmApi.get(pluginName)
          const pkg = pkgData.collected.metadata
          waitInstallPlugins.push(pkg.name)
        }
      } catch (e) {
        if (e.message === 'Request failed with status code 404') {
          await session.send(`远程不存在 ${pluginName}。`)
        }
      }
    }

    const waitInstallPluginsStr = waitInstallPlugins.join(' ')
    await session.send(`${waitInstallPluginsStr} 正在安装.`)
    const args = []
    const absPath = path.resolve(
      process.cwd(), './package.json'
    )
    const pkg = JSON.parse(fs.readFileSync(absPath).toString()) as Package
    if (pkg.workspaces) {
      args.push('-W')
    }
    try {
      await doCommand('yarn', [ 'add', ...args, ...waitInstallPlugins ])
      await session.send(`${waitInstallPluginsStr} 安装完成.`)
    } catch (e) {
      await session.send(`${waitInstallPluginsStr} 安装失败.`)
      await session.send(e)
    }
  })
}
