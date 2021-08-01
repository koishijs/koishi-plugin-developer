import { Context, segment, Query, User } from 'koishi-core'
import { merge } from 'koishi-utils'

import dayjs from 'dayjs'

import { initTables, MarkTable } from './database'
import { Config, defaultConfig } from './config'

initTables()
export { MarkTable } from './database'
export * from './config'

export const name = 'mark'

declare module 'koishi-core' {
  interface EventMap {
    'mark/user-mark'(
      msg: string, mark: MarkTable, data: Mark.StatisticalData
    ): Promise<string>
  }

  namespace Plugin {
    interface Packages {
      'koishi-plugin-mark': typeof import('.')
    }
  }
}

export namespace Mark {
  export type StatisticalTimeRangeKeys = 'all' | 'year' | 'month' | 'week' | 'day'
  export type TimeRangeStat<T> = {
    [key in StatisticalTimeRangeKeys]: T
  }
  export type BaseStat = {
    readonly items: Promise<MarkTable>
    readonly count: Promise<number>
  }
  export interface StatisticalData {
    global: TimeRangeStat<BaseStat & {
      readonly users: Promise<User[]>
    }>
    users: Record<string, TimeRangeStat<BaseStat & {
      readonly continuous: Promise<number>
    }>>
  }
}

export const calendar = (
  arr: Date[], viewRangeDay = 7
) => {
  const output: string[] = []
  let point = arr.length - 1
  let count = 0
  const curDayTomorrow = dayjs().subtract(-1, 'd')
  const genSymbols = (startDay: dayjs.Dayjs, endDay: dayjs.Dayjs) => {
    const symbols: string[] = []
    for (let i = 0; i < 7; i++) {
      // it should check day as the beginning of tomorrow
      let symbol = startDay.isBefore(curDayTomorrow) ? '□':' '
      if (point >= 0 && startDay.isSame(
        arr[point], 'days'
      )) { symbol = '■'; point-- }
      if (startDay.isBefore(endDay)) symbol = ' '
      if (symbol !== ' ') count++
      symbols.unshift(`${symbol} `)

      startDay = startDay.subtract(1, 'd')
    }
    return symbols.join('')
  }
  const weekend = dayjs().endOf('w')
  const viewEndDay = dayjs().subtract(
    viewRangeDay - 1, 'd'
  )
  for (let i = 0; (point > 0 && count < viewRangeDay) || count < viewRangeDay; i++) {
    output.unshift(genSymbols(
      weekend.subtract(i, 'w')
        .subtract(-1, 'd'), viewEndDay
    ))
  }
  output.unshift('1 2 3 4 5 6 7 ')
  return output
}

export const continuous = (arr: Date[]): {
  offset: number; count: number
} => {
  const result = {
    offset: 0, count: 0
  }
  if (arr.length === 0) return result

  arr.sort(
    (a, b) => a > b ? 1 : -1
  )
  const lastDay = dayjs(arr[arr.length - 1]).startOf('d')
  result.offset = dayjs().diff(lastDay, 'd')
  result.count++

  let prevDay = lastDay
  for (let i = arr.length - 2; i >= 0; i--) {
    const cur = dayjs(arr[i]).startOf('d')
    if (cur.subtract(-1, 'd').isSame(prevDay)) {
      result.count++
    } else {
      break
    }
    prevDay = cur
  }
  return result
}

export const apply = (ctx: Context, config: Config = {}) => {
  const db = ctx.database
  const _logger = ctx.logger(`koishi-plugin-${name}`)
  config = merge(config, defaultConfig)

  const queryStatisticalData = (
    timeRange: Mark.StatisticalTimeRangeKeys, key: keyof Mark.BaseStat | 'users' | 'continuous',
    uids?: User['id'][]
  ) => {
    const query: Query<'mark'> = {}
    if (uids) query['uid'] = uids
    switch (timeRange) {
      case 'day':
        query['ctime'] = {
          $gte: dayjs().startOf('d').toDate()
        }
        break
      case 'week':
        query['ctime'] = {
          $gte: dayjs().subtract(7, 'd').toDate()
        }
        break
      case 'month':
        query['ctime'] = {
          $gte: dayjs().subtract(30, 'd').toDate()
        }
        break
      case 'year':
        query['ctime'] = {
          $gte: dayjs().subtract(365, 'd').toDate()
        }
        break
      default:
        query['ctime'] = {}
        break
    }
    query['ctime']['$lte'] = dayjs().toDate()
    switch (key) {
      case 'items':
        return db.get('mark', query)
      case 'count':
        return db.get('mark', query, []).then(marks => marks.length)
      case 'users':
        return db.get('mark', query, [ 'uid' ])
          .then(marks => marks.map(m => m.uid))
          .then(uids => db.get('user', { id: uids }))
      case 'continuous':
        return (async () => {
          const marks = await db.get('mark', query, [ 'ctime' ])
          const result = continuous(marks.map(mark => mark.ctime))
          return result.offset <= 1 ? result.count : 0
        })()
    }
  }

  const genQueryProxy = (uids?: User['id'][]) => new Proxy({}, {
    get(_, timeRange: Mark.StatisticalTimeRangeKeys) {
      return new Proxy({}, {
        get(_, key: keyof Mark.BaseStat | 'users' | 'continuous') {
          return queryStatisticalData(timeRange, key, uids)
        }
      })
    }
  })

  const statisticalData = {
    global: genQueryProxy(),
    users: new Proxy({}, {
      get(_, uid: User['id']) { return genQueryProxy([uid]) }
    })
  } as Mark.StatisticalData

  const mainCmd = ctx.command('mark', '打卡。')
  mainCmd.alias(
    ...config.markAliases
  ).userFields([
    'id'
  ]).check(async ({ session }) => {
    if (
      await statisticalData
        .users[session.user.id]
        .day.count === config.markCountLimit
    ) return config.msgs['overflowMarkCountLimit']
  }).action(async ({ session }) => {
    const mark = await db.create('mark', { uid: session.user.id, ctime: new Date() })
    return ctx.waterfall(
      'mark/user-mark', `${segment.at(session.uid)}，打卡成功`, mark, statisticalData
    )
  })

  mainCmd.subcommand('.list', '获取打卡的 contributor graph。').usage(
    '以 github contribution graph 的形式展示你的打卡记录（默认打印七天内）。'
  ).alias('打卡记录').option(
    'month', '-m 30天内', { type: 'boolean' }
  ).option(
    'quarter', '-q 90天内', { type: 'boolean' }
  ).option(
    'days', '-d <days> 指定天数', { type: 'number' }
  ).userFields([ 'id' ]).action(async ({ session, options }) => {
    let day = 7
    if (options.month) day = 30
    if (options.quarter) day = 90
    if (options.days) day = +options.days
    const marks = await db.get('mark', {
      uid: [ session.user.id ],
      ctime: { $gt: dayjs().subtract(day, 'd').toDate() }
    })

    const calendarArr = calendar(marks.map(i => i.ctime), day)
    // @ts-ignore
    if (session.platform === 'onebot') {
      calendarArr[1] = ' '.repeat(calendarArr[1].indexOf('□')/2) + calendarArr[1]
      return calendarArr.join('\n')
    }
    return calendarArr.join('\n')
  })
}
