import type { Command } from 'commander'
import chokidar from 'chokidar'
import fs from 'fs'
import path from 'path'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { doCommand } from './utils'
import type { Protocol } from '../lib/protocol'

namespace Processes {
  let cmd: ChildProcessWithoutNullStreams | null = null
  let fsWatcher: chokidar.FSWatcher | null = null
  const resolverDirMap = new Map<string, string>()
  const initFSWatcher = (botName: string) => {
    fsWatcher = chokidar.watch(`./bots/${botName}`)
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
      const opts = {
        cwd: `./bots/${ botName }`
      }
      // * [x] hack plugin method
      // * [x] watch plugins directories change, reload target plugin
      // * [ ] watch bot directory change, reload bot
      await doCommand('ts-node', [
        '-r', 'dotenv/config',
        '-r', path.resolve(__dirname, '../lib/koishi-hot-reload.js'),
        'index.ts',
      ], {
        ...opts,
        // @ts-ignore
        stdio: [null, null, null, 'ipc'],
      }, cmd => Processes.attach(botName, cmd))
    })
}
