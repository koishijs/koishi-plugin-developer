import { App } from 'koishi-test-utils'
import * as MockDate from 'mockdate'

import * as ppt from 'koishi-plugin-puppeteer'
import * as mark from 'koishi-plugin-mark'
import { MarkTable } from 'koishi-plugin-mark'
import * as fs from 'fs'
import * as path from 'path'

after(() => {
  process.exit()
})

describe('View', function () {
  this.timeout(10000)

  const app = new App({
    port: 8080,
    mockDatabase: true
  })
  app.plugin(ppt, {})
  app.plugin(mark, {})

  before(async () => {
    await app.database.initUser('001', 4)
    await app.start()
  })
  afterEach(() => {
    app.database.memory.$store['mark'] = []
  })

  const superSes1 = app.session('001')

  it('should able to switch mode.', async () => {
    await superSes1.shouldReply('mark -t', '已切换为文本模式')
    await superSes1.shouldReply('mark -p', '已切换为图片模式')
  })

  it('should get mark graph picture.', async () => {
    MockDate.set(new Date('2021-08-02'))
    app.database.memory.$store['mark'] = [
      '2020-07-20',
      '2020-07-21',
      '2021-05-17',
      '2021-06-17',
      '2021-07-17',
      '2021-07-18',
      '2021-07-20',
      '2021-07-21'
    ].map((ctime, index) => new Object({
      id: index + 1, uid: '1', ctime: new Date(ctime)
    }) as MarkTable)
    const demoPngBase64 = fs.readFileSync(path.resolve(__dirname, './demo.png'), {
      encoding: 'base64'
    })
    await superSes1.shouldReply('mark.list', `[CQ:image,url=base64://${demoPngBase64}]`)
  })
})
