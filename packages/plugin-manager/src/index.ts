import glob from 'glob'
import { spawn, SpawnOptionsWithoutStdio } from 'child_process'
import { Context, Plugin } from 'koishi-core'
import { merge } from 'koishi-utils'
import Router from '@koa/router'
import KoaLogger from 'koa-logger'

import './core/Context'
import './core/Session'
import path from 'path'
import { registerInstallCmd } from './sub-command/install'
import { registerUnInstallCmd } from './sub-command/uninstall'
import { registerListCmd } from './sub-command/list'
import { pluginService } from './services/plugin'
import { registerUpgradeCmd } from './sub-command/upgrade'

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
interface Config {
  restfulApi?: boolean
}

// 插件默认配置
const defaultConfig: Config = {
  restfulApi: false
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

export const apply = (ctx: Context, config: Config = {}) => {
  const logger = ctx.logger(`koishi-plugin-${name}`)
  config = merge(config, defaultConfig)

  pluginService.ctx = ctx

  const kpmCmd = ctx.command(
    'kpm', '插件管理工具', { authority: 4 }
  )

  kpmCmd.subcommand = function hackSubcommand(def: string, ...args: never[]) {
    const subcommand = Object.getPrototypeOf(this).subcommand.call(this, def, args)
    subcommand.action = function hackAction(callback, append = false) {
      return Object.getPrototypeOf(this).action.call(this, async (...args) => {
        try {
          return await callback.call(this, ...args)
        } catch (e) {
          if (e instanceof Error) {
            return e.message
          } else {
            return '未知错误'
          }
        }
      }, append)
    }
    subcommand.subcommand = hackSubcommand
    return subcommand
  }

  registerInstallCmd(
    ctx, kpmCmd, logger
  )
  registerUnInstallCmd(
    ctx, kpmCmd
  )
  registerListCmd(
    ctx, kpmCmd
  )
  registerUpgradeCmd(
    ctx, kpmCmd
  )

  if (config.restfulApi) {
    const pluginRouter = new Router({
      prefix: `/plugin-apis/${ name }`
    })
    pluginRouter[Context.current] = ctx
    pluginRouter.all(
      '/(.*)', KoaLogger(str => logger.info(str))
    )
    pluginRouter.all('/(.*)', async (koaCtx, next) => {
      try {
        await next()
      } catch (e) {
        const re = /^\[(.*)]:(.*)$/
        if (e instanceof Error && typeof e.message === 'string' && re.test(e.message)) {
          const [
            _allMsg, status, msg
          ] = re[Symbol.match](e.message)
          if (status && msg) {
            koaCtx.status = +status
            koaCtx.body = msg
          } else {
            throw e
          }
          logger.error(e)
        } else {
          throw e
        }
      }
    })

    ;(async () => {
      const controllerModules: { router(ctx: Context): Router }[] = await Promise.all(
        glob.sync(
          `${ path.resolve(__dirname, './controllers') }/*.ts`
        ).map(c => require(c))
      )
      controllerModules.forEach(controllerModule => {
        const r = controllerModule.router(ctx)
        pluginRouter.use(r.routes(), r.allowedMethods())
      })
      ctx.router.use(pluginRouter.routes(), pluginRouter.allowedMethods())
    })()
  }
}
