import type { Command } from 'commander'
import fs from 'fs'

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
    })
}
