import { Command, Context } from 'koishi-core'
import { allPlugins } from '../core/Context'
import { npmApi } from '../core/NpmApi'
import { getLocalPluginPkgs } from '../index'

export const registerListCmd = (ctx: Context, cmd: Command) => {
  cmd.subcommand(
    '.list 插件列表', { authority: 4 }
  ).usage(
    '展示当前会话已安转的插件'
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
    '.remote [query] 搜索远程插件(|依赖)'
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
