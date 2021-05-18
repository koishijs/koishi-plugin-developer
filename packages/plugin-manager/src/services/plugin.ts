import glob from 'glob'
import path from 'path'
import fs from 'fs'
import { npmApi } from '../core/NpmApi'
import { doCommand } from 'koishi-plugin-manager'

export type Package = {
  name: string
  version: string
  author: string
  description: string
  workspaces?: string[]
}

export const pluginService = {
  localPlugins(root: string = process.cwd(), keyWords: string[] = []): Package[] {
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
    ;(pRoot === root?[]:this.localPlugins(pRoot, keyWords)).forEach(pkg => {
      const index = plugins.findIndex(plugin => plugin.name === pkg.name)
      if (index == -1) plugins.push(pkg)
    })
    return plugins
  },
  async installPlugins(plugins: string[]): Promise<string[]> {
    const localPkgs = pluginService.localPlugins()
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
