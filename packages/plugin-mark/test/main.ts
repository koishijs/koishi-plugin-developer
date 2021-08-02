import { App } from 'koishi-test-utils'

import * as ppt from 'koishi-plugin-puppeteer'
import * as mark from '../src'
import { MarkTable } from '../src'

const app = new App({
  port: 8080,
  mockDatabase: true
})
app.plugin(ppt, {})
app.plugin(mark, {})

;(async () => {
  await app.database.initUser('1', 4)
  await app.database.initUser('2', 4)

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

  await app.start()
})()
