import axios from 'axios'
import { expect, use } from 'chai'
import cap from 'chai-as-promised'
use(cap)

import { stringify } from 'querystring'

import { app } from './init.app'

before(async () => await app.start())
after(process.exit)

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
        q: 'manager'
      }) }`)
    ).to.eventually
      .have.property('data')
      .have.property('0').have.property('name', 'koishi-plugin-manager')
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
