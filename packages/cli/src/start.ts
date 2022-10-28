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
  let fsWatcher: chokidar.FSWatcher | null = null
  const resolverDirMap = new Map<string, string>()

  const bots = new Map<string, {
    cmd: ChildProcessWithoutNullStreams
    onMessage: OnMessage
  }>()

  const appendBot = (botName: string) => {
    const { cmd } = bots.get(botName) ?? {}
    if (!cmd)
      throw new Error(`Bot ${ botName } is not running.`)

    const botDir = `bots/${botName}`

    if (fsWatcher === null) {
      fsWatcher = chokidar.watch(botDir)
      fsWatcher.on('change', filePath => {
        const resolvers = new Set<string>()
        resolverDirMap.forEach((dir, resolver) => {
          if (filePath.startsWith(dir)) {
            resolvers.add(resolver)
          }
        })
        resolvers.forEach(resolver => {
          cmd?.send({ type: 'plugin:reload', data: resolver }, err => {
            err && console.error(err)
          })
        })
        if (resolvers.size === 0) {
          if (filePath.startsWith(botDir)) {
            cmd?.kill('SIGINT')
            resolverDirMap.clear()
            fsWatcher?.close()
              .then(() => {
                emit('restart', botName)
              })
          }
        }
      })
    } else {
      fsWatcher.add(botDir)
    }
  }

  export const clear = (botName: string) => {
    const bot = bots.get(botName)
    if (!bot)
      throw new Error(`Bot ${ botName } is not running.`)
    bots.delete(botName)
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

          resolverDirMap.set(data.resolver, path.dirname(data.resolver))
          fsWatcher.add(resolverDirMap.get(data.resolver))
          break
      }
    }
    bots.set(botName, { cmd, onMessage })

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
    eventMap.get(type)?.forEach(cb => cb(...args))
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
          Processes.once('restart', async () => {
            setTimeout(() => run(botName), 100)
          })
        }
        await runBot(botName, options)
        Processes.clear(botName)
      }

      await run(botName)
    })
}
