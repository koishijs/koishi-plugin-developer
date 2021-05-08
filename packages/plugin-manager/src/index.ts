import glob from 'glob'
import { Context, Plugin } from 'koishi-core'
import { merge } from 'koishi-utils'

import './core/Context'
import { allPlugins } from './core/Context'
import { npmApi } from './core/NpmApi'
import fs from 'fs'
import path from 'path'

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

const searchPlugin = (plugin: string): {
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

type Package = {
  name: string
  version: string
  author: string
  description: string
}
const getLocalPluginPkgs = (): Package[] => {
  const pluginPaths = glob.sync(path.resolve(
    process.cwd(), './node_modules/koishi-plugin-*'
  ))
  return pluginPaths.map(pluginPath => {
    const absPath = path.resolve(
      process.cwd(), pluginPath, './package.json'
    )
    const pkg: Package = JSON.parse(fs.readFileSync(absPath).toString())
    return pkg
  })
}

export const apply = (ctx: Context, _config: Config = {}) => {
  const _logger = ctx.logger(`koishi-plugin-${name}`)
  _config = merge(_config, defaultConfig)

  const kpmCmd = ctx.command(
    'kpm <subCmd> [args...] 插件管理工具。', { authority: 4 }
  )

  kpmCmd.subcommand(
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
  })

  kpmCmd.subcommand(
    '.uninstall [...plugins]'
  ).alias(
    ...[ 'uni', 'un', 'unlink', 'remove', 'rm', 'r' ].map(i => `kpm.${i}`)
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
        let plugins
        if (options.global) {
          plugins = allPlugins.plugins
        } else {
          plugins = allPlugins.get(sessionCtx).map(pluginData => pluginData.plugin)
        }
        plugins = plugins.filter(p => p.apply && p.apply === data.pluginModule.apply)
        for (let j = 0; j < plugins.length; j++) {
          await ctx.dispose(plugins[j])
          const index = ctxPlugins.findIndex(val => val.plugin.apply === plugins[j].apply)
          if (index >= 0) {
            ctxPlugins.splice(index, 1)
            await session.send(`uninstalled ${pluginName}`)
          }
        }
      } else {
        await session.send(`本地未安装 ${pluginName} / koishi-plugin-${pluginName}`)
      }
    }
    return '卸载完成'
  })

  kpmCmd.subcommand(
    '.list', { authority: 4 }
  ).alias(
    ...[ 'ls', 'l' ].map(i => `kpm.${i}`)
  ).option(
    'global', '-g 全局', { type: 'boolean' }
  ).action(async ({ session, options }) => {
    let sessionCtx = ctx.select(
      'userId', session.userId
    )
    if (options.global) { sessionCtx = ctx.app }

    let pluginsList = ''
    const ctxPlugins = allPlugins.get(
      sessionCtx
    )
    ctxPlugins && ctxPlugins.forEach(ctxPluginData => {
      const plugin = ctxPluginData.plugin
      const name = plugin?.name ?? '未命名插件'
      pluginsList += `[√] ${name}\n`
    })
    return pluginsList === '' ? '暂无已安装的插件' : pluginsList
  }).subcommand(
    '.local'
  ).alias(
    ...[ 'l' ].map(i => `kpm.list.${i}`)
  ).action(() => {
    const pluginPkgs = getLocalPluginPkgs()
    let returnMsg = `本地共检索到: ${ pluginPkgs.length }个依赖\n`
    pluginPkgs.forEach(pkg => {
      returnMsg += `${ pkg.name }[${ pkg.author }]\n`
      returnMsg += pkg.description + '\n'
      returnMsg += `最新版本: ${pkg.version}\n`
      returnMsg += '='.repeat(24) + '\n'
    })
    return returnMsg
  }).parent.subcommand(
    '.remote [query] 搜索远程依赖'
  ).alias(
    ...[ 'r' ].map(i => `kpm.list.${i}`)
  ).option(
    'page', '-p [page] 当前页码', { type: 'number', fallback: 0 }
  ).option(
    'size', '-s [size] 当前个数', { type: 'number', fallback: 10 }
  ).check(({ options }) =>
    (options.size && !Number.isInteger(options.size)) ||
    (options.page && !Number.isInteger(options.page))
      ? '参数错误'
      : undefined
  ).action(async ({ options }, query = 'koishi-plugin') => {
    const pluginsPagination = await npmApi.search(
      query, options.page, options.size
    )
    let returnMsg = `远程共检索到: ${ pluginsPagination.total }个依赖\n`
    pluginsPagination.results.forEach(item => {
      const pkg = item.package
      returnMsg += `${ pkg.name }[${ pkg.author.name }]\n`
      returnMsg += pkg.description + '\n'
      returnMsg += `最新版本: ${pkg.version}\n`
      returnMsg += '='.repeat(24) + '\n'
    })
    returnMsg += `当前位于 ${options.page} 页，共 ${
      Math.ceil(pluginsPagination.total / options.size)
    } 页`
    return returnMsg
  })
}
