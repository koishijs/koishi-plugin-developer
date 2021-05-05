import { App } from 'koishi'
import * as demo from 'koishi-plugin-demo'

export const registerPlugins = (app: App) => {
  app.plugin(
    demo, {}
  )
}
