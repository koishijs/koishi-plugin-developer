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

  this.timeout(30000)

  it('should return local plugins data', async () => {
    let d = await axios.get('/')

    expect(d).to
      .have.property('data')
      .have.property('total').exist

    expect(d).to
      .have.property('data')
      .have.property('results')
      .have.property('0')
      .have.property('package')
      .have.property('name').match(/^koishi-plugin-.*$/)

    d = await axios.get(`/?${ stringify({
      q: 'manager'
    }) }`)
    expect(d).to
      .have.property('data')
      .have.property('results')
      .have.property('0')
      .have.property('package')
      .have.property('name').match(/.*manager.*/)
  })

  it('should return remote plugins data.', async () => {
    let d = await axios.get(`/?${ stringify({
      isRemote: true
    }) }`)
    expect(d).to
      .have.property('data')
      .have.property('total').exist

    expect(d).to
      .have.property('data')
      .have.property('results').length.lte(10)

    expect(d).to
      .have.property('data')
      .have.property('results')
      .have.property('0')
      .have.property('package')
      .have.property('name').match(/^koishi-plugin-.*$/)

    d = await axios.get(`/?${ stringify({
      isRemote: true, page: 0, size: 3
    }) }`)

    expect(d).to
      .have.property('data')
      .have.property('results').length(3)
  })

  it('should return plugin data', async () => {
    await expect(
      axios.get('/demo')
    ).to.eventually
      .have.property('data')
      .have.property('name', 'koishi-plugin-demo')
  })
})
