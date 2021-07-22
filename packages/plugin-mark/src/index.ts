import { Context, segment, Tables, User } from 'koishi-core'
import { merge } from 'koishi-utils'

import { MarkTable } from './database'
import { Config, defaultConfig } from './config'
import dayjs from 'dayjs'

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
  export type UserStat = {
    readonly items: Promise<MarkTable>
    readonly count: Promise<number>
  }
  export interface StatisticalData {
    global: TimeRangeStat<UserStat & {
      readonly users: Promise<User[]>
    }>
    users: Record<string, TimeRangeStat<UserStat>>
  }
}

export const calendar = (
  arr: Date[], viewRangeDay = 7
) => {
  const output: string[] = []
  let point = arr.length - 1
  let count = 0
  const genSymbols = (startDay: dayjs.Dayjs, endDay: dayjs.Dayjs) => {
    const symbols: string[] = []
    for (let i = 0; i < 7; i++) {
      let symbol = startDay.isBefore(dayjs()) ? '□':' '
      if (point >= 0 && startDay.isSame(
        arr[point], 'days'
      )) {
        symbol = '■'; point--
      }
      if (startDay.isBefore(endDay)) symbol = ' '
      if (symbol !== ' ') count++
      symbols.unshift(`${symbol} `)

      startDay = startDay.subtract(1, 'd')
    }
    return symbols.join('')
  }
  const weekend = dayjs().endOf('w')
  for (let i = 0; (point > 0 && count < viewRangeDay) || count < viewRangeDay; i++) {
    output.unshift(genSymbols(
      weekend.subtract(i, 'w')
        .subtract(-1, 'd'),
      dayjs()
        .subtract(viewRangeDay, 'd')
    ))
  }
  output.unshift('1 2 3 4 5 6 7 ')
  return output
}

export const apply = (ctx: Context, config: Config = {}) => {
  const db = ctx.database
  const logger = ctx.logger(`koishi-plugin-${name}`)
  config = merge(config, defaultConfig)

  const queryStatisticalData = (
    timeRange: Mark.StatisticalTimeRangeKeys, key: keyof Mark.UserStat | 'users',
    uids?: User['id'][]
  ) => {
    const query: Tables.Query<'mark'> = uids ? { uid: uids } : {}
    switch (key) {
      case 'items':
        return db.get('mark', query)
      case 'count':
        return db.get('mark', query, []).then(marks => marks.length)
      case 'users':
        return db.get('mark', query, [ 'uid' ])
          .then(marks => marks.map(m => m.uid))
          .then(uids => db.get('user', { id: uids }))
    }
  }

  const genQueryProxy = (uids?: User['id'][]) => new Proxy({}, {
    get(_, timeRange: Mark.StatisticalTimeRangeKeys) {
      return new Proxy({}, {
        get(_, key: keyof Mark.UserStat | 'users') {
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

  const mainCmd = ctx.command('mark')
  mainCmd.alias(
    ...config.markAliases
  ).userFields([
    'id'
  ]).action(async ({ session }) => {
    const mark = await db.create('mark', { uid: session.user.id, ctime: new Date() })
    return ctx.waterfall(
      'mark/user-mark', `${segment.at(session.uid)}，打卡成功`, mark, statisticalData
    )
  })

  mainCmd.subcommand('.list').usage(
    '以 github contribution 的形式展示你的打卡记录（默认打印七天内）'
  ).alias(
    '打卡记录'
  ).option(
    'month', '-m 30天内', { type: 'boolean' }
  ).option(
    'quarter', '-q 90天内', { type: 'boolean' }
  ).option(
    'days', '-d <days> 指定天数', { type: 'number' }
  ).action(async ({ session, options }) => {
    const marks = await db.get('mark', { uid: [ session.uid ] })
    let day = 7
    if (options.month) day = 30
    if (options.quarter) day = 90
    if (options.days) day = +options.days
    return calendar(marks.map(i => i.ctime), day).join('\n')
  })
}
