import { App as KoishiApp } from 'koishi-test-utils'
import { expect, use } from 'chai'
import cap from 'chai-as-promised'
import axios from 'axios'

use(cap)

const port = 30000
const app = new KoishiApp({
  port, mockDatabase: true
})
app.plugin(require('koishi-plugin-demo-view'), {})

axios.defaults.baseURL = `http://localhost:${ port }`

before(async () => {
  await app.start()
})

after(() => {
  process.exit()
})

describe('one', function () {
  it('should return "some message."', async () => {
    await expect(
      axios.get('/demo-view/common/test')
    ).to.eventually
      .have.property('data')
      .have.property('detail', 'some messages.')
  })
})
