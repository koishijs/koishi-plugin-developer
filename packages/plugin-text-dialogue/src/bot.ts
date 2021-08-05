import { App, Session } from 'koishi'
import chokidar from 'chokidar'
import { Adapter, Bot, BotOptions } from 'koishi-core'
import { Config, resolveWatchOptionsMap } from './config'
import fs from 'fs'
import { merge } from 'koishi-utils'

export class TextDialogueBot extends Bot<'text-dialogue'> {
  constructor(adapter: Adapter<"text-dialogue">, options: BotOptions) {
    super(adapter, options)
    if (options) {
      options.watchOptionsMap = resolveWatchOptionsMap(options.watchOptionsMap)
      for (const watchOptionsMapKey in options.watchOptionsMap) {
        TextDialogueAdapter.pathBotMap[watchOptionsMapKey] = this
      }

      TextDialogueAdapter.config.watchOptionsMap = merge(options.watchOptionsMap, TextDialogueAdapter.config.watchOptionsMap)
    }
  }

  async sendMessage(session, message) {
    const [_, filePath, ...args] = session.split(':')
    const realPath = [filePath, ...args].join(':')

    const lines = `${this.selfId}@${message}`.split('\n')
    let content = lines.map(line => `> ${line}`).join('\n')
    content += '<'.repeat(lines.length)
    fs.appendFileSync(realPath, '\n\n' + content + '\n')
    return undefined
  }
}

export function analyzeMessage(str: string): {
  content: string, username: string
} | null {
  let count = 0
  const stack = []
  for (let i = str.length - 1; i >= 0; i--) {
    if (str[i] === '<') {
      count++
    } else {
      if (str[i] === '>') continue
      if (str[i] === ' ' && str[i - 1] === '>') {
        if (--count === 0) break
      } else {
        stack.unshift(str[i])
      }
    }
  }
  if (count !== 0) return null
  const msg = stack.join('')
  const splitIndex = msg.indexOf('@')
  if (splitIndex === -1) return null

  return {
    username: msg.slice(null, splitIndex),
    content: msg.slice(splitIndex + 1)
  }
}

export class TextDialogueAdapter extends Adapter<'text-dialogue'> {
  static config: Config = {
    watchOptionsMap: {}
  }

  static pathBotMap: Record<string, TextDialogueBot> = {}

  constructor(app: App) {
    super(app, TextDialogueBot)
    app.once('connect', () => {
      for (const path in TextDialogueAdapter.config.watchOptionsMap) {
        chokidar.watch(path, TextDialogueAdapter.config.watchOptionsMap[path])
          .on('change', (filePath, stats) => {
            if (stats.isFile()) {
              this.dispatchNewMessage(path, filePath, stats)
            }
          })
      }
    })
  }

  dispatchNewMessage(path: string, filePath: string, stats: fs.Stats) {
    const bot = TextDialogueAdapter.pathBotMap[path]

    const {
      content, username
    } = analyzeMessage(fs.readFileSync(filePath).toString())

    if (username === bot.selfId) return

    this.dispatch(new Session(this.app, {
      platform: 'text-dialogue',
      type: 'message',
      selfId: bot.selfId,
      userId: username,
      targetId: filePath,
      channelId: `private:${filePath}`,
      timestamp: stats.mtimeMs * 1000,
      author: {
        userId: username, nickname: username
      },
      content: content
    }))
  }

  async start() {
    return undefined
  }

  stop() {
    return
  }
}
