/**
 * @desc   Session.ts
 * @author yijie
 * @date   2021-05-19 10:26
 * @notes  2021-05-19 10:26 yijie 创建了 Session.ts 文件
 */
import { Extend, Context, Session } from 'koishi-core'

type Options = Extend<Extend<{}, "channel", boolean>, "global", boolean>

declare module 'koishi-core' {
  interface Session {
    genSessionCtx(ctx: Context, options: Options): Context
  }
}

Session.prototype.genSessionCtx = function <T extends Options>(ctx: Context, options: T) {
  let sessionCtx = ctx
  if (!options.channel && !options.global) {
    sessionCtx = ctx.select(
      'userId', this.userId
    )
  }
  if (options.channel) {
    if (!this.groupId) {
      throw new Error('当前会话不是频道，无法使用 `group` 参数。')
    }
    sessionCtx = sessionCtx.select(
      'groupId', this.groupId
    )
  }
  if (options.global) {
    sessionCtx = ctx.app
  }
  return sessionCtx
}
