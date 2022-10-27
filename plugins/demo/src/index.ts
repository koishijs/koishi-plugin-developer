import { Context, Logger } from 'koishi'
import Schema from 'schemastery'

export interface Config {
  repeatCount: number
}

export const Config = Schema.object({
  repeatCount: Number
})

export const name = 'demo'

const logger = new Logger(name)

export const apply = (ctx: Context, config: Config) => {
  logger.info('plugin loaded')
  ctx.middleware(session => {
    if (session.content === 'hello') {
      [...Array(config.repeatCount)].forEach(() => session.send('world'))
    }
  })
}
