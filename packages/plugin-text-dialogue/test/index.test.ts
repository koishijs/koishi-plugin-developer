import fs from 'fs'
import path from 'path'
import { expect } from 'chai'
import qface from 'qface'
import { App, segment } from 'koishi'

import 'koishi-plugin-text-dialogue'
import { analyzeMessage } from 'koishi-plugin-text-dialogue'
import Identicon from 'identicon.js'
import md5 from 'js-md5'

after(() => {
  process.exit()
})

describe('Text Dialogue Plugin', () => {
  describe('Analyze message', function () {
    it('should analyze simple message.', () => {
      expect(analyzeMessage('' +
        '> yijie@hello world<'
      )).to.be.deep.eq({
        content: 'hello world',
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
        content: 'hello world',
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
    this.timeout(5000)

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

    it('should watch bot say hello.', (done) => {
      app.once('message', async session => {
        if (session.content === 'hello world') {
          await session.send('hello master')
        }
      })

      fs.writeFileSync(watchFile, '> yijie@hello world<')
      setTimeout(() => {
        expect(fs.readFileSync(watchFile).toString())
          .to.be.eq('' +
          '> yijie@hello world<\n' +
          '> test@hello master\n' +
          '> ')
        done()
      }, 100)
    })

    it('should get username.', (done) => {
      app.command('whoami', 'tell me who am I.')
        .action(async ({ session }) => {
          return `you are ${session.username}`
        })
      fs.writeFileSync(watchFile, '> yijie@whoami<')
      setTimeout(() => {
        expect(fs.readFileSync(watchFile).toString())
          .to.be.eq('' +
          '> yijie@whoami<\n' +
          '> test@you are yijie\n' +
          '> ')
        done()
      }, 100)
    })

    it('should show right base 64 image.', (done) => {
      app.command('show-me-avatar', 'show me avatar.')
        .action(async ({ session }) => {
          const base64Str = new Identicon(md5(session.username), 64).toString()
          return `you avatar is \n${segment.image(`base64://${base64Str}`)}`
        })
      fs.writeFileSync(watchFile, '> yijie@show-me-avatar<')
      setTimeout(() => {
        const base64Str = new Identicon(md5('yijie'), 64).toString()
        expect(fs.readFileSync(watchFile).toString())
          .to.be.eq('' +
          '> yijie@show-me-avatar<\n' +
          '> test@you avatar is \n' +
          `> ![image](data:image/png;base64,${base64Str})\n` +
          '> ')
        done()
      }, 100)
    })

    it('should return qq face image gif.', (done) => {
      app.command('show-qq-face <id>', 'show a qq face.')
        .action(async (_, id) => {
          return segment('face', { id })
        })
      fs.writeFileSync(watchFile, '> yijie@show-qq-face 1 <')
      setTimeout(() => {
        expect(fs.readFileSync(watchFile).toString())
          .to.be.eq('' +
          '> yijie@show-qq-face 1 <\n' +
          `> test@![QQFace 1](${qface.getUrl(1)})\n` +
          '> ')
        done()
      }, 100)
    })
  })
})
