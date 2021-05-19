import { Context, Session } from 'koishi-core'
import fs from 'fs'
import glob from 'glob'
import path from 'path'

import { doCommand, searchPlugin } from 'koishi-plugin-manager'
import { npmApi } from '../core/NpmApi'
import { allPlugins } from '../core/Context'


export type Package = {
  name: string
  version: string
  author: string
  description: string
  workspaces?: string[]
}

export const pluginService = {
  ctx: null as Context,
  listFromLocal(
    root: string = process.cwd(), keyWords: string[] = []
  ): Package[] {
    const pluginPaths = glob.sync(path.resolve(
      root, './node_modules/*koishi-plugin-*'
    ))
    const pRoot = path.resolve(root, '../')
    const plugins = pluginPaths.filter(pluginPath =>
        keyWords.length === 0 || (keyWords.filter(k => pluginPath.indexOf(k) >= 0)).length > 0
      ).map(pluginPath => {
        const absPath = path.resolve(pluginPath, './package.json')
        return JSON.parse(fs.readFileSync(absPath).toString()) as Package
      })
    ;(pRoot === root?[]:this.listFromLocal(pRoot, keyWords)).forEach(pkg => {
      const index = plugins.findIndex(plugin => plugin.name === pkg.name)
      if (index == -1) plugins.push(pkg)
    })
    return plugins
  },
  /**
   * install plugins to session
   *
   * @param plugins { string[] }     - wait install plugins
   * @param key     { K }            - select session type
   * @param values  { Session[K][] } - select value of session
   */
  async installToSession<K extends keyof Session>(
    plugins: string[], key?: K, values?: Session[K][]
  ) {
    const sessionCtx = key ? this.ctx.select(key, ...values) : this.ctx.app
    const ctxPlugins = allPlugins.get(sessionCtx)
    const waitInstalledPlugins: ReturnType<typeof searchPlugin>[] = []

    for (let i = 0; i < plugins.length; i++) {
      const pluginName = '' + plugins[i]
      const data = searchPlugin(pluginName)

      if (data !== null) {

        const isInstalled = ctxPlugins && ctxPlugins.filter(
          ctxPluginData => ctxPluginData.plugin?.apply && ctxPluginData.plugin?.apply === data.pluginModule?.apply
        ).length >= 1
        if (isInstalled) {
          throw new Error(`当前会话已安装 ${ pluginName }`)
        } else {
          waitInstalledPlugins.push(data)
        }
      } else {
        throw new Error(`本地未安装 ${ pluginName } / koishi-plugin-${ pluginName }`)
      }
    }
    for (let i = 0; i < waitInstalledPlugins.length; i++) {
      const data = waitInstalledPlugins[i]
      if (key === undefined) {
        const plugins = allPlugins.plugins.filter(p => p.apply && p.apply === data.pluginModule.apply)
        for (let j = 0; j < plugins.length; j++) {
          await sessionCtx.dispose(plugins[j])
        }
      }
      sessionCtx.plugin(data.pluginModule)
    }
    return `${waitInstalledPlugins.map(i => i.pluginName).join(', ')} 安装完成`
  },
  async installFromRemote(
    plugins: string[]
  ): Promise<string[]> {
    const localPkgs = pluginService.listFromLocal()
    const waitInstallPlugins = []
    for (let i = 0; i < plugins.length; i++) {
      const pluginName = plugins[i]
      try {
        if (localPkgs.findIndex(pkg => pkg.name === pluginName) == -1) {
          const pkgData = await npmApi.get(pluginName)
          const pkg = pkgData.collected.metadata
          waitInstallPlugins.push(pkg.name)
        }
      } catch (e) {
        if (e.message === 'Request failed with status code 404') {
          throw new Error(`远程不存在 ${ pluginName }。`)
        }
      }
    }
    if (waitInstallPlugins.length === 0) return []

    const args = []
    const absPath = path.resolve(
      process.cwd(), './package.json'
    )
    const pkg = JSON.parse(fs.readFileSync(absPath).toString()) as Package

    if (pkg.workspaces) {
      args.push('-W')
    }
    await doCommand('yarn', [ 'add', ...args, ...waitInstallPlugins ])
    return waitInstallPlugins
  }
}
