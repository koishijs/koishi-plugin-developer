import glob from 'glob'
import path from 'path'
import fs from 'fs'

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
    const plugins = pluginPaths.map(pluginPath => {
      const absPath = path.resolve(
        process.cwd(), pluginPath, './package.json'
      )
      return JSON.parse(fs.readFileSync(absPath).toString()) as Package
    })
    ;(pRoot === root?[]:this.localPlugins(pRoot, keyWords)).forEach(pkg => {
      const index = plugins.findIndex(plugin => plugin.name === pkg.name)
      if (index == -1) plugins.push(pkg)
    })
    return plugins
  }
}
