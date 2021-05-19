import { Context, Command, Logger } from 'koishi-core'
import { pluginService } from '../services/plugin'

export const registerInstallCmd = (ctx: Context, cmd: Command, logger: Logger) => {
  const checkPlugins = (_argv, ...plugins) => {
    if (plugins.length === 0) return '请输入待安装的插件'
  }

  cmd.subcommand(
    '.install [...plugins]', '安装插件'
  ).usage(
    '安装插件到当前会话'
  ).alias(
    ...[ 'i', 'ins', 'add' ].map(i => `kpm.${i}`)
  ).option(
    'channel', '-c 频道', { type: 'boolean' }
  ).option(
    'global', '-g 全局', { type: 'boolean' }
  ).check(checkPlugins).action(async ({ session, options }, ...plugins) => {
    let key: keyof typeof session
    const values = []
    if (options.channel) {
      if (!session.groupId) throw new Error('当前会话不是频道，无法使用 `group` 参数。')
      key = 'groupId'
      values.push(session.groupId)
    } else {
      if (!options.global) {
        key = 'userId'
        values.push(session.userId)
      }
    }
    for (let i = 0; i < plugins.length; i++) {
      const msg = await pluginService.installToSession([ plugins[i] ], key, values)
      logger.info(msg)
      await session.send(msg)
    }
  }).subcommand(
    '.remote [...plugins]', '从远程安装插件(|依赖)'
  ).check(checkPlugins).action(async ({ session }, ...plugins) => {
    const pluginsStr = plugins.join(', ')
    try {
      await session.send(`${ pluginsStr } 安装中`)
      const installedPlugins = await pluginService.installFromRemote(plugins)
      if (installedPlugins.length === 0) {
        return '无依赖需要安装'
      } else {
        return `${ installedPlugins.join(', ') } 安装完毕.`
      }
    } catch (e) {
      await session.send(`${ pluginsStr } 安装失败.`)
      // 安全起见，报错信息只私聊发送给用户
      await session.bot.sendPrivateMessage(
        session.userId,
        `${new Date().toLocaleString()} 安装 ${ pluginsStr } 失败\n` +
        `失败原因:\n ${ e }`
      )
    }
  })
}
