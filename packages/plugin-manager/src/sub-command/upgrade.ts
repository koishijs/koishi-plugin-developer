/**
 * @desc   upgrade.ts
 * @author yijie
 * @date   2021-05-19 18:57
 * @notes  2021-05-19 18:57 yijie 创建了 upgrade.ts 文件
 */
import { Command, Context } from 'koishi-core'
import { doCommand, searchPlugin } from 'koishi-plugin-manager'
import { npmApi } from '../core/NpmApi'

export const registerUpgradeCmd = (ctx: Context, cmd: Command) => {
  const checkPlugin = (_argv, plugin) => {
    if (!plugin) return '请输入需要安装的插件'
  }

  cmd.subcommand(
    '.upgrade <plugin>', '更新插件'
  ).usage(
    '更新插件'
  ).alias(
    ...[ 'up' ].map(i => `kpm.${i}`)
  ).option(
    'channel', '-c 频道', { type: 'boolean' }
  ).option(
    'global', '-g 全局', { type: 'boolean' }
  ).check(checkPlugin).action(async ({ session, options }, plugin) => {
    const args = []
    options.global && args.push('-g')
    options.channel && args.push('-c')
    await session.execute(`kpm.uni ${ args.join(' ') } ${ plugin }`)
    await session.execute(`kpm.ins ${ args.join(' ') } ${ plugin }`)
    return '重载插件成功'
  }).subcommand(
    '.remote <plugin> [version]', '远程更新插件'
  ).option(
    'scoped', '-S <scope>', { type: 'string' }
  ).usage(
    '通过更新依赖的方式更新插件'
  ).check(checkPlugin).action(async ({ session, options }, plugin, version) => {
    const p = searchPlugin(plugin)
    if (p === null) {
      return `本地未安装该插件，请使用 \`kpm.ins.remote ${ plugin }\` 从远程服务器安装`
    }
    // uninstall plugin in global
    await session.execute(`kpm.uni -g ${ plugin }`)
    try {
      plugin = version ? `${ plugin }@${ version }` : plugin
      const argv = []
      if (options.scoped) {
        argv.push('-S', options.scoped)
      }
      await doCommand(
        'yarn', [ 'upgrade', plugin, ...argv ]
      )
    } catch (e) {
      await session.send(`${ plugin } 更新失败.`)
      // 安全起见，报错信息只私聊发送给用户
      await session.bot.sendPrivateMessage(
        session.userId,
        `${new Date().toLocaleString()} 更新 ${ plugin } 失败\n` +
        `失败原因:\n ${ e }`
      )
    }
  })
}
