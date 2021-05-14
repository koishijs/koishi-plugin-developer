import { App as KoishiApp } from 'koishi-test-utils'
import { expect, use } from 'chai'
import cap from 'chai-as-promised'
import axios from 'axios'

import * as manager from 'koishi-plugin-manager'
import { stringify } from 'querystring'

use(cap)

const port = 30000
const app = new KoishiApp({
  port, mockDatabase: true
})
app.plugin(manager, {})

axios.defaults.baseURL = `http://localhost:${ port }/plugin-apis/${manager.name}`

before(async () => {
  await app.start()
})

after(() => {
  process.exit()
})

describe('plugins apis.', function () {
  axios.defaults.baseURL += '/plugins'
  it('should return plugins data', async () => {
    await expect(
      axios.get('/')
    ).to.eventually
      .have.property('data')
      .have.property('0').have.property('name', 'koishi-plugin-demo')
    await expect(
      axios.get(`/?${ stringify({
        isRemote: true
      }) }`)
    ).to.eventually
      .have.property('data')
      .have.property('0').have.property('name', 'koishi-plugin-demo')
  })

  it('should return plugin data', async () => {
    await expect(
      axios.get('/demo')
    ).to.eventually
      .have.property('data')
      .have.property('name', 'koishi-plugin-demo')
  })
})
