import { App } from 'koishi'
import * as manager from 'koishi-plugin-manager'

export const registerPlugins = (app: App) => {
  app.plugin(manager, {})
}
