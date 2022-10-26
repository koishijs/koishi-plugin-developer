import { App } from 'koishi'
import * as demo from 'koishi-plugin-demo'

const app = new App({})

app.plugin(demo, {
  repeatCount: 3
})

app.start().then(() => {
  console.log('Bot started.')
}).catch(err => {
  console.log(err)
  process.exit(1)
})
