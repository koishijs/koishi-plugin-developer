export interface Config {
  markAliases?: string[]
  /** 打卡间隔时间限制 */
  markRangeLimit?: number
  /** 当天打卡次数限制 */
  markCountLimit?: number

  /** 功能限制 */
  limit?: {
    /** 能补签的时间范围(单位 天) */
    repairTimeInterval?: number
  }
  /** 功能开关 */
  switch?: {
    /** 是否开启补签功能 */
    repair?: boolean
  }

  msgs?: {
    readonly overflowMarkCountLimit?: string
    readonly overflowRepairTimeInterval?: string
  }
}

export const defaultConfig: Config = {
  markAliases: [ '打卡', '签到' ],
  markCountLimit: 1,
  limit: {
    repairTimeInterval: 7
  },
  switch: {
    repair: false
  },
  msgs: {
    overflowMarkCountLimit: '已超过了今日的打卡次数上限',
    overflowRepairTimeInterval: '已超过能够补签的时间范围'
  }
}
