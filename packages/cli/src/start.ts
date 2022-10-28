import type { Command } from 'commander'
import chokidar from 'chokidar'
import fs from 'fs'
import path from 'path'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { doCommand } from './utils'
import type { Protocol } from '../lib/protocol'

const runBot = async (botName: string) => {
  await doCommand('ts-node', [
    '-r', 'dotenv/config',
    '-r', path.resolve(__dirname, '../lib/koishi-hot-reload.js'),
    'index.ts',
  ], {
    cwd: `./bots/${ botName }`,
    // @ts-ignore
    stdio: [null, null, null, 'ipc'],
  }, cmd => Processes.attach(botName, cmd))
}

namespace Processes {
  let cmd: ChildProcessWithoutNullStreams | null = null
  let fsWatcher: chokidar.FSWatcher | null = null
  const resolverDirMap = new Map<string, string>()
  const initFSWatcher = (botName: string) => {
    const botDir = `bots/${botName}`

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
          cmd = null
          resolverDirMap.clear()
          fsWatcher?.close()
            .then(() => {
              emit('restart', botName)
            })
        }
      }
    })
  }
  export const attach = (botName: string, attachCmd: ChildProcessWithoutNullStreams) => {
    initFSWatcher(botName)

    cmd = attachCmd
    cmd.on('message', (dispatch: Protocol.UpDispatcher[0]) => {
      const data = dispatch.data

      switch (dispatch.type) {
        case 'plugin:apply':
          resolverDirMap.set(data.resolver, path.dirname(data.resolver))
          fsWatcher.add(resolverDirMap.get(data.resolver))
          break
      }
    })
  }
  export interface EventMap {
    restart: (botName: string) => void | Promise<void>
  }

  export const eventMap = new Map<string, Set<(...args: any[]) => void | Promise<void>>>()
  export const on = <T extends keyof EventMap>(type: T, cb: EventMap[T]) => {
    if (!eventMap.has(type)) {
      eventMap.set(type, new Set())
    }
    eventMap.get(type)?.add(cb)
  }
  export const emit = <T extends keyof EventMap>(type: T, ...args: Parameters<EventMap[T]>) => {
    eventMap.get(type)?.forEach(cb => cb(...args))
  }

  on('restart', async (botName) => {
    await runBot(botName)
    console.log('restart')
  })
}

export function apply(program: Command) {
  program
    .command('start <botName>')
    .description('start bot by name.')
    .option('-p, --port <port>', 'port to listen', '8080')
    .option('-d, --dev', 'dev mode')
    .action(async (botName: string, options?: {
      port: string
      dev: boolean
    }) => {
      const bots = fs.readdirSync('./bots')
      if (!bots.includes(botName))
        throw new Error('bot is not found.')

      await runBot(botName)
    })
}
