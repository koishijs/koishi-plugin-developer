import { App as KoishiApp } from 'koishi'
import { appOptions } from '@/config'
import { registerPlugins } from '@/plugins'

const app = new KoishiApp(appOptions)
registerPlugins(app)

app.start().then()
