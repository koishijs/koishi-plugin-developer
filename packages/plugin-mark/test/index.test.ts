import { User } from 'koishi-core'
import { App } from 'koishi-test-utils'

import { expect } from 'chai'
import * as MockDate from 'mockdate'

import * as mark from 'koishi-plugin-mark'
import { calendar, continuous, MarkTable } from 'koishi-plugin-mark'

describe('Mark Plugin', () => {
  const app = new App({
    mockDatabase: true
  })
  app.plugin(mark, {})

  before(async () => {
    await app.database.initUser('001', 4)
    await app.database.initUser('002', 4)
  })
  afterEach(() => {
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
      MockDate.set(new Date('2021-07-23'))
      app.database.memory.$store['mark'] = [
        '2021-05-17',
        '2021-06-17',
        '2021-07-17',
        '2021-07-18',
        '2021-07-20',
        '2021-07-21'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(ctime)
      }) as MarkTable)
      await superSes1.shouldReply('mark.list', '' +
        '1 2 3 4 5 6 7 \n'+
        '          ■ ■ \n'+
        '□ ■ ■ □ □     '
      )
      await superSes1.shouldReply('mark.list -m', '' +
        '1 2 3 4 5 6 7 \n'+
        '      □ □ □ □ \n'+
        '□ □ □ □ □ □ □ \n'+
        '□ □ □ □ □ □ □ \n'+
        '□ □ □ □ □ ■ ■ \n'+
        '□ ■ ■ □ □     '
      )
      await superSes1.shouldReply('mark.list -d 10', '' +
        '1 2 3 4 5 6 7 \n'+
        '    □ □ □ ■ ■ \n'+
        '□ ■ ■ □ □     '
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

    it('should get statistical data. ', async () => {
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

    it('should get statistical data by time range.', async () => {
      MockDate.set(new Date('2021-07-23'))
      app.database.memory.$store['mark'] = [
        '2020-05-16',
        '2020-05-17',
        '2021-06-17',
        '2021-07-17',
        '2021-07-18',
        '2021-07-20',
        '2021-07-21'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(ctime)
      }) as MarkTable)
      app.database.memory.$store['mark'].push(
        ...[
          '2021-07-21', '2021-07-22'
        ].map((ctime, index) => new Object({
          id: index + 1, uid: '2', ctime: new Date(ctime)
        }) as MarkTable)
      )
      app.on('mark/user-mark', async (_, _mark, data) => {
        expect(await data.global.month.count).to.eq(4 + 3)
        expect(await data.users['1'].month.count).to.eq(4)
        expect(await data.users['2'].month.count).to.eq(3)
        expect(await data.global.day.count).to.eq(1)
        expect(await data.users['1'].day.count).to.eq(0)
        expect(await data.users['2'].day.count).to.eq(1)
        return 'none'
      })
      await superSes2.shouldReply('mark', 'none')
    })

    it('should get continuous data', async () => {
      MockDate.set(new Date('2021-07-23'))
      app.database.memory.$store['mark'] = [
        '2021-07-15',               '2021-07-17', '2021-07-18',
        '2021-07-19', '2021-07-20', '2021-07-21', '2021-07-22'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(ctime)
      }) as MarkTable)
      app.on('mark/user-mark', async (_, mark, data) => {
        return `已连续打卡 ${
          data.users[mark.uid].all.continuous
        } 天， 共打卡 ${
          data.users[mark.uid].all.count
        } 次。`
      })
      await superSes1.shouldReply('mark', '已连续打卡 ${} 天， 共打卡 ${} 次。')
    })
  })

  it('should return right calendar.', () => {
    MockDate.set(new Date('2021-07-23'))
    expect(
      calendar([
        new Date('2021-05-17'),
        new Date('2021-06-17'),
        new Date('2021-07-17'),
        new Date('2021-07-18'),
        new Date('2021-07-20'),
        new Date('2021-07-21')
      ], 31)
    ).to.have.members([
      '1 2 3 4 5 6 7 ',
      '    □ □ □ □ □ ',
      '□ □ □ □ □ □ □ ',
      '□ □ □ □ □ □ □ ',
      '□ □ □ □ □ ■ ■ ',
      '□ ■ ■ □ □     '
    ])
  })

  it('should calc continuous static data.', () => {
    MockDate.set(new Date('2021-07-23'))
    let result: ReturnType<typeof continuous>
    result = continuous([
      '2021-07-15',               '2021-07-17', '2021-07-18',
      '2021-07-19', '2021-07-20', '2021-07-21', '2021-07-22'
    ].map(ctime => new Date(ctime)))
    expect(result).to.have.property('count', 6)
    expect(result).to.have.property('offset', 1)
    result = continuous([
      '2021-07-15',               '2021-07-17', '2021-07-18',
      '2021-07-19', '2021-07-20', '2021-07-21', '2021-07-22',
      '2021-07-23'
    ].map(ctime => new Date(ctime)))
    expect(result).to.have.property('count', 7)
    expect(result).to.have.property('offset', 0)
    result = continuous([
      '2021-07-15',               '2021-07-17', '2021-07-18'
    ].map(ctime => new Date(ctime)))
    expect(result).to.have.property('count', 2)
    expect(result).to.have.property('offset', 5)
    result = continuous([
      '2020-07-15',               '2020-07-17', '2020-07-18'
    ].map(ctime => new Date(ctime)))
    expect(result).to.have.property('count', 2)
    expect(result).to.have.property('offset', 370)
  })
})
