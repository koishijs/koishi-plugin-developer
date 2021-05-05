import 'koishi-adapter-onebot'
import { AppOptions } from 'koishi-core'
import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

interface YamlConfig {
  account: {
    uin: string
    pwd: string
  }
  default: {
    account: {
      uin: string
      pwd: string
    }
    server: {
      host: string
      port: number
    }
    koishi: {
      port: number
    }
  }
  middlewares: {
    'access-token': string
  }
  servers: {
    ws: {
      host: string
      port: number
      middlewares: {
        'access-token': string
      }
    }
  }[]
}

const filePath = new Proxy({
  envTemp: './.env.temp.yml'
}, {
  get(target, p, receiver) {
    return path.resolve(
      process.cwd(), target[p]
    )
  }
})

if (!fs.existsSync(filePath.envTemp)) {
  throw new Error('The go-cqhttp service is not started, please start the go-cqhttp service in the specified environment first.')
}

const yamlConfig = yaml
  .load(fs.readFileSync(
    filePath.envTemp
  ).toString()) as YamlConfig
const curServer = yamlConfig.servers[0].ws

export const appOptions: AppOptions = {
  port: yamlConfig.default.koishi.port,
  onebot: {
    secret: curServer['access-token'],
  },
  bots: [{
    type: 'onebot:ws',
    server: `ws://${curServer.host}:${curServer.port}`,
    selfId: yamlConfig.account.uin,
    token: yamlConfig.middlewares['access-token']
  }]
}
