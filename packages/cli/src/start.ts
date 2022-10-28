import type { Command } from 'commander'
import chokidar from 'chokidar'
import fs from 'fs'
import path from 'path'
import { ChildProcessWithoutNullStreams, SendHandle } from 'child_process'
import { doCommand } from './utils'
import type { Protocol } from '../lib/protocol'

export interface StartOptions {
  port: string
  dev: boolean
}

type OnMessage = (msg: Protocol.UpDispatcher[0], handle: SendHandle) => void

namespace Processes {
  type BotName = string
  interface BotRelative {
    cmd: ChildProcessWithoutNullStreams
    resolvers: Set<string>
    onMessage: OnMessage
  }

  let fsWatcher: chokidar.FSWatcher | null = null

  const bots = new Map<BotName, BotRelative>()
  const resolverFilesMap = new Map<string, string[]>()

  const appendBot = (botName: string) => {
    const botDir = `bots/${botName}`

    if (fsWatcher === null) {
      fsWatcher = chokidar.watch(botDir)
      fsWatcher.on('change', filePath => {
        const cacheBots = new Map(bots)
        cacheBots.forEach((bot, name) => {
          const botDir = `bots/${name}`
          if (filePath.startsWith(botDir)) {
            bot.cmd?.kill('SIGINT')
            emit('restart', name)
          }
        })
        // 通过 file 找 resolver
        const resolvers = new Set<string>()
        new Map(resolverFilesMap).forEach((files, resolver) => {
          if (files.includes(filePath)) {
            resolvers.add(resolver)
          }
        })
        // 通过 resolver 找 bot
        const resolverBotMap = new Map<string, BotRelative>()
        cacheBots.forEach(bot => {
          resolvers.forEach(resolver => {
            if (bot.resolvers.has(resolver)) {
              resolverBotMap.set(resolver, bot)
            }
          })
        })
        resolverBotMap.forEach((bot, resolver) => {
          bot.cmd?.send(
            { type: 'plugin:reload', data: resolver },
            err => err && console.error(err)
          )
        })
      })
    } else {
      fsWatcher.add(botDir)
    }
  }

  export const clear = (botName: string) => {
    const bot = bots.get(botName)
    if (!bot) return

    bots.delete(botName)
    // 移除没有用的 `resolver`，但是如果其他的 bot 有使用则不移除
    resolverFilesMap.forEach((files, resolver) => {
      if (!bot.resolvers.has(resolver))
        return
      let isUse = false
      bots.forEach(bot => {
        if (bot.resolvers.has(resolver)) {
          isUse = true
        }
      })
      if (!isUse) {
        resolverFilesMap.delete(resolver)
      }
    })
    bot.cmd.removeListener('message', bot.onMessage)
  }

  export const attach = (
    botName: string, cmd: ChildProcessWithoutNullStreams,
    watch = false
  ) => {
    const onMessage: OnMessage = dispatch => {
      const data = dispatch.data

      switch (dispatch.type) {
        case 'plugin:apply':
          if (!watch) break

          resolverFilesMap.set(data.resolver, [
            path.dirname(data.resolver)
          ])
          /* eslint-disable no-case-declarations */
          const bot = bots.get(botName)
          if (bot) {
            bot.resolvers.add(data.resolver)
          }
          /* eslint-enale no-case-declarations */
          break
      }
    }
    bots.set(botName, {
      cmd,
      resolvers: new Set(),
      onMessage,
    })

    watch && appendBot(botName)

    cmd.on('message', onMessage)
  }

  export interface EventMap {
    restart: (botName: string) => void | Promise<void>
    remove: (exitCode: number, bots: string[]) => void | Promise<void>
  }
  export const eventMap = new Map<string, Set<(...args: any[]) => void | Promise<void>>>()
  export const on = <T extends keyof EventMap>(type: T, cb: EventMap[T]) => {
    if (!eventMap.has(type)) {
      eventMap.set(type, new Set())
    }
    eventMap.get(type)?.add(cb)
  }
  export const once = <T extends keyof EventMap>(type: T, cb: EventMap[T]) => {
    const onceCb = (...args: any[]) => {
      // @ts-ignore
      cb(...args)
      off(type, onceCb)
    }
    on(type, onceCb)
  }
  export const off = <T extends keyof EventMap>(type: T, cb: EventMap[T]) => {
    eventMap.get(type)?.delete(cb)
  }
  export const emit = <T extends keyof EventMap>(type: T, ...args: Parameters<EventMap[T]>) => {
    Array.from(eventMap.get(type).values())
      .forEach(cb => cb(...args))
  }
}

const runBot = (
  botName: string, options?: StartOptions
) => {
  const args = [
    '-r', 'dotenv/config',
    ...(options.dev
      ? [
        '-r', path.resolve(__dirname, '../lib/koishi-hot-reload.js'),
        // enable sourcemap
        '--compilerOptions', '{"sourceMap":true}',
      ]
      : []),
    'index.ts',
  ]
  return doCommand('ts-node', args, {
    cwd: `./bots/${ botName }`,
    // @ts-ignore
    stdio: [null, null, null, 'ipc'],
  }, cmd => Processes.attach(botName, cmd, options.dev))
}

export function apply(program: Command) {
  program
    .command('start <botName>')
    .description('start bot by name.')
    .option('-p, --port <port>', 'port to listen', '8080')
    .option('-d, --dev', 'dev mode', false)
    .action(async (botName: string, options?: StartOptions) => {
      const bots = fs.readdirSync('./bots')
      if (!bots.includes(botName))
        throw new Error('bot is not found.')

      async function run(botName: string) {
        if (options.dev) {
          Processes.once('restart', () => {
            run(botName)
          })
        }
        Processes.clear(botName)
        await runBot(botName, options)
      }

      await run(botName)
    })
}
