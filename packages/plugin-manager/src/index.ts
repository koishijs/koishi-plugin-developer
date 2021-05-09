import glob from 'glob'
import { Context, Plugin } from 'koishi-core'
import { merge } from 'koishi-utils'

import './core/Context'
import fs from 'fs'
import path from 'path'
import { registerInstallCmd } from './sub-command/install'
import { spawn, SpawnOptionsWithoutStdio } from 'child_process'
import { registerUnInstallCmd } from './sub-command/uninstall'
import { registerListCmd } from './sub-command/list'

// 插件名称
export const name = 'manager'

declare module 'koishi-core' {
  namespace Plugin {
    interface Packages {
      // 将插件注册至 koishi-core 核心模块
      'koishi-plugin-manager': typeof import('.')
    }
  }
}

// 插件配置
interface Config { }

// 插件默认配置
const defaultConfig: Config = {
}

export const searchPlugin = (plugin: string): {
  pluginName: string
  pluginModule: Plugin
} | null => {
  const pluginName = plugin
  try {
    return { pluginName, pluginModule: require(pluginName) }
  } catch (e) {
    if (/^koishi-plugin-.*$/.test(pluginName)) return null
    return searchPlugin('koishi-plugin-' + pluginName)
  }
}

export type Package = {
  name: string
  version: string
  author: string
  description: string
  workspaces?: string[]
}
export const getLocalPluginPkgs = (): Package[] => {
  const pluginPaths = glob.sync(path.resolve(
    process.cwd(), './node_modules/koishi-plugin-*'
  ))
  return pluginPaths.map(pluginPath => {
    const absPath = path.resolve(
      process.cwd(), pluginPath, './package.json'
    )
    return JSON.parse(fs.readFileSync(absPath).toString()) as Package
  })
}

export const doCommand = (
  cmd: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio
) => new Promise<number|string>((resolve, reject) => {
  if (process.platform === 'win32') {
    cmd += '.cmd'
  }
  const execCmd = spawn(cmd, args, options)
  let outputStr = ''

  execCmd.stdout.on('data', data => outputStr += data)
  execCmd.stderr.on('data', data => outputStr += data)
  execCmd.on('exit', code => {
    if (code === 0) {
      resolve(outputStr)
    } else {
      reject(outputStr)
    }
  })
})

export const apply = (ctx: Context, _config: Config = {}) => {
  const logger = ctx.logger(`koishi-plugin-${name}`)
  _config = merge(_config, defaultConfig)

  const kpmCmd = ctx.command(
    'kpm <subCmd> [args...] 插件管理工具。', { authority: 4 }
  )
  registerInstallCmd(
    ctx, kpmCmd, logger
  )
  registerUnInstallCmd(
    ctx, kpmCmd
  )
  registerListCmd(
    ctx, kpmCmd
  )
}
