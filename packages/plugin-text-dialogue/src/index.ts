import fs from 'fs'
import { Context } from 'koishi-core'
import { merge } from 'koishi-utils'

import { TextDialogueBot } from './bot'

// 插件名称
export const name = 'text-dialogue'

declare module 'koishi-core' {
  namespace Plugin {
    interface Packages {
      // 将插件注册至 koishi-core 核心模块
      'koishi-plugin-text-dialogue': typeof import('.')
    }
  }
  interface BotOptions {
    server?: string
  }

  interface Session {
  }

  namespace Bot {
    interface Platforms {
      'text-dialogue': TextDialogueBot
    }
  }
}

// 插件配置
interface Config {
  watch?: (string | RegExp)[]
}

// 插件默认配置
const defaultConfig: Config = {
}

export const apply = (ctx: Context, _config: Config = {}) => {
  _config = merge(_config, defaultConfig)
}
