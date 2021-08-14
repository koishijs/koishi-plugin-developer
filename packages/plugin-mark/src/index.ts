import dayjs from 'dayjs'

import { Context, segment, Query, User, Extend } from 'koishi-core'
import { merge } from 'koishi-utils'
import type {} from 'koishi-plugin-puppeteer'

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
    'mark/user-repair'(
      msg: string, uid: string, repairOptions: RepairOptions
    ): Promise<string>
  }

  namespace Plugin {
    interface Packages {
      'koishi-plugin-mark': typeof import('.')
    }
  }
}

export type RepairOptions = Extend<Extend<{},
  "count", number>,
  "range", number>

export namespace Mark {
  export type StatisticalTimeRangeKeys = 'all' | 'year' | 'month' | 'week' | 'day'
  export type TimeRangeStat<T> = {
    [key in StatisticalTimeRangeKeys]: T
  }
  export type BaseStat = {
    readonly items: Promise<MarkTable[]>
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

export const continuous = (arr: Date[]) => {
  const result = { offset: 0, count: 0 }
  if (arr.length === 0) return result

  arr.sort((a, b) => a > b ? 1 : -1)
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

export const excludeDate = (arr: Date[], offset: number, end = 0) => {
  const result: Date[] = []
  arr = arr.sort((a, b) => a > b ? 1 : -1)

  let p = 0
  const endDay = dayjs().startOf('d').subtract(end, 'd')

  for (let i = 2; i < offset + 2; i++) {
    const day = endDay.subtract(offset - i, 'd').startOf('d')
    if (p >= arr.length || !day.isSame(arr[p], 'd')) {
      result.push(day.toDate())
    } else { p++ }
  }
  return result
}

export const apply = (ctx: Context, config: Config = {}) => {
  const state: {
    mode: 'picture' | 'text'
  } = {
    mode: 'text'
  }
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

  if (ctx.router) {
    const Router = require('@koa/router')
    const pluginRouter = new Router({
      prefix: `/plugins/${ name }`
    })
    pluginRouter.get('/list', async koaCtx => {
      const { uid = '' } = koaCtx.request.query
      if (!uid) {
        koaCtx.status = 404
        return
      }
      const items = await statisticalData.users[uid].year.items
      let p = 0
      const style = `
      <style rel="stylesheet">
      body, html { margin: 0; padding: 0; }
      .label {
        fill: #24292e;
        font-size: 9px;
      }
      .day, .day[data-level="0"] {
          fill: #ebedf0;
          shape-rendering: geometricPrecision;
          outline: 1px solid rgba(27, 31, 35, 0.06);
          outline-offset: -1px;
      }
      .day[data-level="1"] {
          fill: #40c463;
          shape-rendering: geometricPrecision;
          outline: 1px solid rgba(27, 31, 35, 0.06);
          outline-offset: -1px;
      }
      </style>`

      let w = 0
      let group: string[] = []
      const groups: string[] = []
      for (let i = 364; i >= 0; i--) {
        const d = dayjs().subtract(i, 'd').startOf('d')
        let level = 0
        while (p < items.length && dayjs(items[p].ctime).startOf('d').isSame(d)) {
          level++; p++
        }
        let weekDay = d.day()
        if (weekDay === 0) weekDay = 7

        group.push(`
        <rect
          class="day"
          width="10" height="10"
          x="14" y="${13*(weekDay - 1)}"
          rx="2" ry="2"
          date="${d.toDate().toLocaleString()}"
          data-level="${level}"></rect>
        `)
        if (weekDay === 7 || i === 0) {
          groups.push(`<g transform="translate(${13*w++}, 0)">${group.join('')}</g>`)
          group = []
        }
      }
      koaCtx.body = `
      ${ style }
      <svg id="graph" width="732" height="112">
        <g transform="translate(20, 10)">
          ${ groups.join('') }
          <text text-anchor="start" class="label" dx="-10" dy="8">Mon</text>
          <text text-anchor="start" class="label" dx="-10" dy="21">Tue</text>
          <text text-anchor="start" class="label" dx="-10" dy="34">Wed</text>
          <text text-anchor="start" class="label" dx="-10" dy="48">Thu</text>
          <text text-anchor="start" class="label" dx="-10" dy="59">Fri</text>
          <text text-anchor="start" class="label" dx="-10" dy="74">Sat</text>
          <text text-anchor="start" class="label" dx="-10" dy="85">Sun</text>
        </g>
      </svg>`
    })

    ctx.router.use(pluginRouter.routes(), pluginRouter.allowedMethods())
  }

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

    if (state.mode === 'text') {
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
    } else if (state.mode === 'picture') {
      await ctx.puppeteer.launch()
      const page = await ctx.puppeteer.browser.newPage()
      await page.goto(`http://localhost:${ ctx.app.options.port }/plugins/mark/list?uid=${ session.user.id }`)
      await page.setViewport({ width: 732, height: 112 })

      const curShooter = await page.$('#graph')
      const buffer = await curShooter.screenshot({ encoding: 'binary' })
      await ctx.puppeteer.close()
      return segment.image(buffer)
    }
  })

  if (config.switch.repair) {
    mainCmd.subcommand('.repair', '补签打卡记录').usage(
      '补签距离今天最近的打卡，不包括今天。'
    ).alias('补签').option(
      'count', '-c <count:posint> 补签次数', { fallback: 1 }
    ).option(
      'range', '-r <range:posint> 补签时间范围', { fallback: 7 }
    ).shortcut(
      /^补签(\d+)次$/, { options: { count: '$1' } }
    ).shortcut(
      /^补签最近(\d+)天(记录)?$/, { options: { range: '$1' } }
    ).shortcut(
      /^补签最近(\d+)天(记录)?(\d+)次$/, { options: { range: '$1', count: '$3' } }
    ).check(({ options }) => {
      if (
        options.range > config.limit.repairTimeInterval
      ) return config.msgs.overflowRepairTimeInterval
    }).userFields([ 'id' ]).action(async ({ session, options }) => {
      try {
        const msg = await ctx.waterfall(session, 'mark/user-repair', '补签成功', session.user.id, options)
        const excludeMarkDateArr = excludeDate((await db.get('mark', {
          uid: [ session.user.id ],
          ctime: { $gt: dayjs().subtract(options.range, 'd').toDate() }
        })).map(m => m.ctime), options.range, 1)
        const successItems = []
        for (let i = excludeMarkDateArr.length - 1; i >= 0 && i >= excludeMarkDateArr.length - options.count; i--) {
          successItems.push(excludeMarkDateArr[i])
          await db.create('mark', { uid: session.user.id, ctime: excludeMarkDateArr[i] })
        }
        return msg
      } catch (e) {
        return e.message || '补签失败'
      }
    })
  }

  ctx.with(['koishi-plugin-puppeteer'], (pptCtx) => {
    ctx.app.options.port && (state.mode = 'picture')

    pptCtx.command('mark', { patch: true }).option(
      'text', '-t 切换为文本模式'
    ).option(
      'picture', '-p 切换为图片模式'
    ).action(({ options }) => {
      if (options.text) {
        state.mode = 'text'
        return '已切换为文本模式'
      }
      if (options.picture) {
        if (ctx.app.options.port === undefined) {
          throw new Error('端口未打开，请未 koishi 配置 port 参数。')
        }
        state.mode = 'picture'
        return '已切换为图片模式'
      }
    })
  })
}
