export interface Config {
  markAliases?: string[]
  /** 打卡间隔时间限制 */
  markRangeLimit?: number
  /** 当天打卡次数限制 */
  markCountLimit?: number

  msgs?: {
    overflowMarkCountLimit: string
  }
}

export const defaultConfig: Config = {
  markAliases: [ '打卡', '签到' ],
  markCountLimit: 1,
  msgs: {
    overflowMarkCountLimit: '已超过了今日的打卡次数上限'
  }
}
