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

axios.defaults.baseURL = `http://localhost:${ port }/plugin-apis`

after(() => {
  process.exit()
})

describe('one', function () {
  before(async () => {
    await app.start()
  })

  describe('basic test.', function () {
    it('should return "some message."', async () => {
      await expect(
        axios.get('/demo-view/common/test')
      ).to.eventually
        .have.property('data')
        .have.property('detail', 'some messages.')
    })
  })

  describe('common support.', function () {
    const u = {
      id: '1001', auth: 4
    }
    before(async () => {
      await app.database.initUser(u.id, u.auth)
    })

    it('should confirm whether there is a certain user.', async () => {
      await expect(
        axios.get(`/demo-view/common/mock/${ u.id }`)
      ).to.eventually
        .have.property('status', 200)

      try {
        await axios.get('/demo-view/common/mock/404')
      } catch (e) {
        expect(e.response).have.property('status', 404)
      }
    })

    it('should return specify user data.', async () => {
      await expect(
        axios.get(`/demo-view/common/mock/${ u.id }?fields=id`)
      ).to.eventually
        .have.property('data')
        .have.property('id', '1')

      await expect(
        axios.get(`/demo-view/common/mock/${ u.id }?fields=id,authority`)
      ).to.eventually
        .have.property('data')
        .have.property('authority', 4)

      await expect(
        axios.get(`/demo-view/common/mock/${ u.id }?fields=undefined`)
      ).to.eventually
        .have.property('data')
        .have.not.property('undefined')
    })
  })
})
