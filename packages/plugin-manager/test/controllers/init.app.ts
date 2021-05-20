import { App as KoishiApp } from 'koishi-test-utils'
import axios from 'axios'

import * as manager from 'koishi-plugin-manager'

const port = 30000
export const app = new KoishiApp({
  port, mockDatabase: true
})
app.plugin(manager, {
  restfulApi: true
})

axios.defaults.baseURL = `http://localhost:${ port }/plugin-apis/${manager.name}`
