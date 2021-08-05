import { App } from 'koishi'
import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import 'koishi-plugin-text-dialogue'
import { analyzeMessage } from 'koishi-plugin-text-dialogue'

after(() => {
  process.exit()
})

describe('Text Dialogue Plugin', () => {
  describe('', function () {
    it('should analyze simple message.', () => {
      expect(analyzeMessage('' +
        '> yijie@hello world<'
      )).to.be.deep.eq({
        content: 'hello world\n',
        username: 'yijie'
      })

      expect(analyzeMessage('' +
        '> yijie@hello world' +
        '> <'
      )).to.be.eq(null)

      expect(analyzeMessage('' +
        '> yijie@hello world\n' +
        '> <<'
      )).to.be.deep.eq({
        content: 'hello world\n',
        username: 'yijie'
      })
    })

    it('should analyze the last message.', () => {
      expect(analyzeMessage('' +
        '> erjie@hello bot<\n' +
        '> yijie@hello world<'
      )).to.be.deep.eq({
        content: 'hello world',
        username: 'yijie'
      })
    })
  })

  describe('Basic', function () {
    const watchFile = path.resolve(__dirname, '.demo.temp.md')
    fs.writeFileSync(watchFile, '')

    const app = new App({
      bots: [{
        type: 'text-dialogue',
        selfId: 'test',
        watchOptionsMap: [watchFile]
      }]
    })
    before(async () => {
      await app.start()
    })

    it('should hello bot', (done) => {
      app.once('message', async session => {
        if (session.content === 'hello world') {
          await session.send('hello master')
          expect(fs.readFileSync(watchFile).toString())
            .to.be.eq('' +
              '> yijie@hello world<\n' +
              '\n' +
              '> test@hello master<\n'
            )
          done()
        }
      })

      fs.writeFileSync(watchFile, '> yijie@hello world<')
    })
  })
})
