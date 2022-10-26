import type { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import { doCommand } from './utils'

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
      // * [ ] hack plugin method
      // * [ ] watch plugins directories change, reload target plugin
      // * [ ] watch bot directory change, reload bot
      await doCommand('ts-node', [
        '-r', 'dotenv/config',
        '-r', path.resolve(__dirname, '../lib/koishi-hot-reload.js'),
        'index.ts',
      ], {
        ...opts,
        // @ts-ignore
        stdio: [null, null, null, 'ipc'],
      })
    })
}
