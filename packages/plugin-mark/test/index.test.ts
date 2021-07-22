import { App } from 'koishi-test-utils'
import * as mark from 'koishi-plugin-mark'
import { calendar } from 'koishi-plugin-mark'
import { expect } from 'chai'
import { MarkTable } from '../src/database'
import { User } from 'koishi-core'

describe('Mark Plugin', () => {
  const app = new App({
    mockDatabase: true
  })
  app.plugin(mark, {})

  before(async () => {
    await app.database.initUser('001', 4)
    await app.database.initUser('002', 4)
  })
  beforeEach(() => {
    app.database.memory.$store['mark'] = []
  })

  const superSes1 = app.session('001')
  const superSes2 = app.session('002')

  describe('Basic', () => {
    it('should mark.', async () => {
      await superSes1.shouldReply(
        'mark', '[CQ:at,id=mock:001]，打卡成功'
      )
    })

    it('should list marks.', async () => {
      app.database.memory.$store['mark'] = [
        { ctime: new Date('2021-05-17') },
        { ctime: new Date('2021-06-17') },
        { ctime: new Date('2021-07-17') },
        { ctime: new Date('2021-07-18') },
        { ctime: new Date('2021-07-20') },
        { ctime: new Date('2021-07-21') }
      ].map(i => new Object({
        id: 1, uid: 'mock:001', ctime: i.ctime
      }) as MarkTable)
      await superSes1.shouldReply('mark.list', '' +
        '1 2 3 4 5 6 7 \n'+
        '        □ ■ ■ \n'+
        '□ ■ ■ □       '
      )
      await superSes1.shouldReply('mark.list -m', '' +
        '1 2 3 4 5 6 7 \n'+
        '    □ □ □ □ □ \n'+
        '□ □ □ □ □ □ □ \n'+
        '□ □ □ □ □ □ □ \n'+
        '□ □ □ □ □ ■ ■ \n'+
        '□ ■ ■ □       '
      )
      await superSes1.shouldReply('mark.list -d 10', '' +
        '1 2 3 4 5 6 7 \n'+
        '  □ □ □ □ ■ ■ \n'+
        '□ ■ ■ □       '
      )
      await superSes1.shouldReply('mark.list -d asdas', '选项 days 输入无效，请提供一个数字。')
    })
  })

  describe('Event', () => {
    it('should return new string.', async () => {
      app.on(
        'mark/user-mark', async (_, mark, _data) => `${mark.id}-mark success`
      )
      await superSes1.shouldReply('mark', '1-mark success')
      app.on(
        'mark/user-mark', async (_, mark, _data) => `${mark.id}-mark success1`
      )
      await superSes1.shouldReply('mark', '2-mark success1')
    })

    it('should get statistical data ', async () => {
      const markUsers: User[] = []
      app.on('mark/user-mark', async (_, _mark, data) => {
        expect((await data.global.all.users).map(
          user => user.id
        )).to.have.members(markUsers.map(user => user.id))
        return `${await data.global.all.count}-${await data.users['1'].all.count}`
      })
      markUsers.push(await app.database.getUser('mock', '001'))
      await superSes1.shouldReply('mark', '1-1')
      markUsers.push(await app.database.getUser('mock', '002'))
      await superSes2.shouldReply('mark', '2-1')
    })
  })

  it('should return right calendar.', () => {
    expect(
      calendar([
        { ctime: new Date('2021-05-17') },
        { ctime: new Date('2021-06-17') },
        { ctime: new Date('2021-07-17') },
        { ctime: new Date('2021-07-18') },
        { ctime: new Date('2021-07-20') },
        { ctime: new Date('2021-07-21') }
      ].map(i => i.ctime), 31)
    ).to.have.members([
      '1 2 3 4 5 6 7 ',
      '  □ □ □ □ □ □ ',
      '□ □ □ □ □ □ □ ',
      '□ □ □ □ □ □ □ ',
      '□ □ □ □ □ ■ ■ ',
      '□ ■ ■ □       '
    ])
  })
})
