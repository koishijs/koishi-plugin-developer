import { EventMap, User } from 'koishi-core'
import { App } from 'koishi-test-utils'

import { expect } from 'chai'
import * as MockDate from 'mockdate'

import * as mark from 'koishi-plugin-mark'
import { calendar, continuous, excludeDate, MarkTable } from 'koishi-plugin-mark'

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

    it('should limit current mark count.', async () => {
      await superSes1.shouldReply(
        'mark', '[CQ:at,id=mock:001]，打卡成功'
      )
      await superSes1.shouldReply(
        'mark', '已超过了今日的打卡次数上限'
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

    it('should not repair mark.', async () => {
      MockDate.set(new Date('2021-08-12'))
      await superSes1.shouldNotReply('mark.repair')
    })
  })

  describe('Event', () => {
    let listener: EventMap['mark/user-mark']
    it('should return new string.', async () => {
      listener = async (_, mark, _data) => `${mark.id}-mark success`
      app.once('mark/user-mark', listener)
      await superSes1.shouldReply('mark', '1-mark success')

      listener = async (_, mark, _data) => `${mark.id}-mark success1`
      app.on('mark/user-mark', listener)
      await superSes2.shouldReply('mark', '2-mark success1')
    })

    it('should get statistical data. ', async () => {
      const markUsers: User[] = []
      const listener = async (_, _mark, data) => {
        expect((await data.global.all.users).map(
          user => user.id
        )).to.have.members(markUsers.map(user => user.id))
        return `${await data.global.all.count}-${await data.users['1'].all.count}`
      }
      app.once('mark/user-mark', listener)
      markUsers.push(await app.database.getUser('mock', '001'))
      await superSes1.shouldReply('mark', '1-1')

      app.once('mark/user-mark', listener)
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

      listener = async (_, _mark, data) => {
        expect(await data.global.month.count).to.eq(4 + 3)
        expect(await data.users['1'].month.count).to.eq(4)
        expect(await data.users['2'].month.count).to.eq(3)
        expect(await data.global.day.count).to.eq(1)
        expect(await data.users['1'].day.count).to.eq(0)
        expect(await data.users['2'].day.count).to.eq(1)
        return 'none'
      }
      app.once('mark/user-mark', listener)

      await superSes2.shouldReply('mark', 'none')
    })

    it('should get continuous data', async () => {
      MockDate.set(new Date('2021-07-23'))
      listener = async (_, mark, data) => {
        return `七天内已连续打卡 ${
          await data.users[mark.uid].week.continuous
        } 天， 共已连续打卡 ${
          await data.users[mark.uid].all.continuous
        } 天， 共打卡 ${
          await data.users[mark.uid].all.count
        } 次。`
      }

      app.once('mark/user-mark', listener)
      app.database.memory.$store['mark'] = [
        '2021-07-15',               '2021-07-17', '2021-07-18',
        '2021-07-19', '2021-07-20', '2021-07-21', '2021-07-22'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(ctime)
      }) as MarkTable)
      await superSes1.shouldReply('mark', '七天内已连续打卡 7 天， 共已连续打卡 7 天， 共打卡 8 次。')

      app.once('mark/user-mark', listener)
      app.database.memory.$store['mark'] = [
        '2021-07-15',               '2021-07-17', '2021-07-18',
        '2021-07-19', '2021-07-20', '2021-07-21'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(ctime)
      }) as MarkTable)
      await superSes1.shouldReply('mark', '七天内已连续打卡 1 天， 共已连续打卡 1 天， 共打卡 7 次。')

      app.once('mark/user-mark', listener)
      app.database.memory.$store['mark'] = [
        '2021-07-15', '2021-07-16',               '2021-07-18',
        '2021-07-19', '2021-07-20', '2021-07-21', '2021-07-22'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(ctime)
      }) as MarkTable)
      await superSes1.shouldReply('mark', '七天内已连续打卡 6 天， 共已连续打卡 6 天， 共打卡 8 次。')
    })
  })

  describe('Repair', () => {
    before(async () => {
      await app.dispose(mark)
      app.plugin(mark, {
        limit: {
          repairTimeInterval: 10
        },
        switch: { repair: true }
      })
    })
    after(async () => {
      await app.dispose(mark)
      app.plugin(mark)
    })

    it('should repair the last week once.', async () => {
      MockDate.set(new Date('2021-08-14'))
      await superSes1.shouldReply('mark.repair', '补签成功')
      expect(
        (await app.database.get('mark', {
          uid: '1', ctime: {
            $gte: new Date('2021-08-13T16:00:00.000Z'),
            $lte: new Date('2021-08-13T16:00:00.000Z')
          }
        }))[0]
      ).to.be.exist

      app.database.memory.$store['mark'] = [
        '2021-08-14', '2021-08-13', '2021-08-12', '2021-08-11', '2021-08-10', '2021-08-08'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(`${ctime}T16:00:00.000Z`)
      }) as MarkTable)
      await superSes1.shouldReply('mark.repair', '补签成功')
      expect(
        (await app.database.get('mark', {
          uid: '1', ctime: {
            $gte: new Date('2021-08-09T16:00:00.000Z'),
            $lte: new Date('2021-08-09T16:00:00.000Z')
          }
        }))[0]
      ).to.be.exist

      app.database.memory.$store['mark'] = [
        '2021-08-13', '2021-08-12', '2021-08-11', '2021-08-10', '2021-08-09', '2021-08-08', '2021-08-07'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(`${ctime}T16:00:00.000Z`)
      }) as MarkTable)
      await superSes1.shouldReply('mark.repair', '补签成功')
      expect(
        (await app.database.get('mark', {
          uid: '1', ctime: {
            $gte: new Date('2021-08-06T16:00:00.000Z'),
            $lte: new Date('2021-08-06T16:00:00.000Z')
          }
        }))[0]
      ).to.be.not.exist
      expect(
        (await app.database.get('mark', {
          uid: '1', ctime: {
            $gte: new Date('2021-08-14T16:00:00.000Z'),
            $lte: new Date('2021-08-14T16:00:00.000Z')
          }
        }))[0]
      ).to.be.not.exist
    })

    it('should test command arguments', async () => {
      MockDate.set(new Date('2021-08-14'))

      app.database.memory.$store['mark'] = [
        '2021-08-13', '2021-08-12', '2021-08-11', '2021-08-10', '2021-08-08'
      ].map((ctime, index) => new Object({
        id: index + 1, uid: '1', ctime: new Date(`${ctime}T16:00:00.000Z`)
      }) as MarkTable)
      await superSes1.shouldReply('mark.repair -c 2', '补签成功')
      expect(
        await app.database.get('mark', {
          uid: '1', $or: [
            { ctime: { $gte: new Date('2021-08-09T16:00:00.000Z'), $lte: new Date('2021-08-09T16:00:00.000Z') } },
            { ctime: { $gte: new Date('2021-08-07T16:00:00.000Z'), $lte: new Date('2021-08-07T16:00:00.000Z') } },
          ]
        })
      ).to.be.have.length(2)
      await superSes1.shouldReply('mark.repair -c 2 -r 8', '补签成功')
      expect(
        (await app.database.get('mark', {
          uid: '1', ctime: {
            $gte: new Date('2021-08-06T16:00:00.000Z'), $lte: new Date('2021-08-09T16:00:00.000Z')
          }
        }))[0]
      ).to.be.exist
      await superSes1.shouldReply('mark.repair -c 2 -r 11', '已超过能够补签的时间范围')
    })
  })
})

describe('Tools', function () {
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

  it('should exclude target date array from date range.', () => {
    MockDate.set(new Date('2021-08-14'))
    let result: ReturnType<typeof excludeDate>
    result = excludeDate([
      '2021-08-10', '2021-08-12', '2021-08-11', '2021-08-13'
    ].map(ctime => new Date(`${ctime}T16:00:00.000Z`)), 7)
    expect(result).to.have.length(3)
    expect(result).to.be.deep.eq([
      '2021-08-08', '2021-08-09', '2021-08-14'
    ].map(ctime => new Date(`${ctime}T16:00:00.000Z`)))

    result = excludeDate([
      '2021-08-10', '2021-08-12', '2021-08-11', '2021-08-13'
    ].map(ctime => new Date(`${ctime}T16:00:00.000Z`)), 7, 1)
    expect(result).to.have.length(3)
    expect(result).to.be.deep.eq([
      '2021-08-07', '2021-08-08', '2021-08-09'
    ].map(ctime => new Date(`${ctime}T16:00:00.000Z`)))
  })
})
