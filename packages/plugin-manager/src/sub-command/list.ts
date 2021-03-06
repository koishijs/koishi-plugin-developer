import { Command, Context } from 'koishi-core'
import { allPlugins } from '../core/Context'
import { npmApi } from '../core/NpmApi'
import { pluginService } from '../services/plugin'

export const registerListCmd = (ctx: Context, cmd: Command) => {
  cmd.subcommand(
    '.list', '插件列表'
  ).usage(
    '展示当前会话已安转的插件'
  ).alias(
    ...[ 'ls', 'l' ].map(i => `kpm.${i}`)
  ).option(
    'channel', '-c 频道', { type: 'boolean' }
  ).option(
    'global', '-g 全局', { type: 'boolean' }
  ).action(async ({ session, options }) => {
    const sessionCtx = session.genSessionCtx(ctx, options)

    let pluginsList = ''
    const ctxPlugins = allPlugins.get(sessionCtx)
    ctxPlugins && ctxPlugins.forEach(ctxPluginData => {
      const plugin = ctxPluginData.plugin
      pluginsList += `[√] ${plugin?.name ?? '未命名插件'}\n`
    })
    return pluginsList === '' ? '暂无已安装的插件' : pluginsList
  }).subcommand(
    '.local', '展示本地插件'
  ).alias(
    ...[ 'l' ].map(i => `kpm.l.${ i }`),
    ...[ 'l' ].map(i => `kpm.ls.${ i }`),
    ...[ 'l' ].map(i => `kpm.list.${ i }`),
  ).action(() => {
    const pluginPkgs = pluginService.listFromLocal()
    let returnMsg = `本地共检索到: ${ pluginPkgs.length }个依赖\n`
    pluginPkgs.forEach(pkg => {
      returnMsg += `${ pkg.name }[${ pkg.author }]\n`
      returnMsg += pkg.description + '\n'
      returnMsg += `最新版本: ${pkg.version}\n`
      returnMsg += '='.repeat(24) + '\n'
    })
    return returnMsg
  }).parent.subcommand(
    '.remote [query]', '搜索远程插件(|依赖)'
  ).alias(
    ...[ 'r' ].map(i => `kpm.l.${ i }`),
    ...[ 'r' ].map(i => `kpm.ls.${ i }`),
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
