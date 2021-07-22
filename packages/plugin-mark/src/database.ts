import { Database, Tables } from 'koishi-core'
import 'koishi-plugin-mysql'
import 'koishi-plugin-mongo'

export interface MarkTable {
  id:    number
  uid:   Tables['user']['id']
  ctime: Date
}

declare module 'koishi-core' {
  interface Tables {
    mark: MarkTable
  }
}

Tables.extend('mark')

Database.extend('koishi-plugin-mysql', ({ tables }) => {
  tables.mark = {
    id:    'INT(10) UNSIGNED NOT NULL AUTO_INCREMENT',
    uid:   'VARCHAR(50) NOT NULL',
    ctime: 'TIMESTAMP NULL DEFAULT NULL'
  }
})
