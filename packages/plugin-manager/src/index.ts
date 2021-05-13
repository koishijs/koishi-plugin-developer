import glob from 'glob'
import { spawn, SpawnOptionsWithoutStdio } from 'child_process'
import { Context, Plugin } from 'koishi-core'
import { merge } from 'koishi-utils'
import Router from '@koa/router'
import KoaLogger from 'koa-logger'

import './core/Context'
import path from 'path'
import { registerInstallCmd } from './sub-command/install'
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
