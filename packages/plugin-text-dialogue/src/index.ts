import { Adapter, Context } from 'koishi-core'
import { merge } from 'koishi-utils'

import { TextDialogueAdapter, TextDialogueBot } from './bot'
import { Config, resolveWatchOptionsMap, WatchOptionsMap } from './config'

declare module 'koishi-core' {
  namespace Plugin {
    interface Packages {
      'koishi-plugin-text-dialogue': typeof import('.')
    }
  }

  interface BotOptions {
    watchOptionsMap?: WatchOptionsMap
  }

  namespace Bot {
    interface Platforms {
      'text-dialogue': TextDialogueBot
    }
  }
}

export * from './bot'
export * from './config'

export const name = 'text-dialogue'

Adapter.types['text-dialogue'] = TextDialogueAdapter

export const apply = (ctx: Context, config: Config = {}) =>  {
  if (config.watchOptionsMap)
    config.watchOptionsMap = resolveWatchOptionsMap(config.watchOptionsMap)
  TextDialogueAdapter.config = merge(config, TextDialogueAdapter.config)
}
