import { App as KoishiApp } from 'koishi-test-utils'
import axios from 'axios'

const port = 30000
const app = new KoishiApp({
  port,
  mockDatabase: true
})
app.plugin(require('koishi-plugin-demo-view'), {})

axios.defaults.baseURL = `http://localhost:${ port }`

before(async () => {
  await app.start()
})

describe('one', function () {
  it('should return "some message."', async () => {
    await axios.get('/demo-view/common/test')
  })
})
