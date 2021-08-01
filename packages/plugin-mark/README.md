# koishi plugin mark

这是 koishi 插件的打卡插件，该插件依赖数据库（mysql、mongodb），当然更依赖 koishi 框架。

# 如何使用

## 安装

```shell
yarn add koishi-plugin-mark
# or
npm i --save koishi-plugin-mark
```

```js
// koishi.js
import * as mark from 'koishi-plugin-mark'

app.plugin(manager, {})
```

## 配置与事件

### 配置

* 设置打卡指令别名

  markAliases `string[]`

* 打卡间隔时间限制

  markRangeLimit `number`

* 当天打卡次数限制

  markCountLimit `number`

* 配置提示信息

  msgs `Record<string, string>`

  * overflowMarkCountLimit `string`

### 事件

* mark/user-mark
  * `(msg: string, mark: MarkTable, data: Mark.StatisticalData): Promise<string>`
  * `param msg`  上一个触发该事件插件返回的字符串
  * `param mark` 本次打卡成功的新打卡记录实例
  * `param data` 统计数据 Proxy 对象，你可以通过该对象访问用户的一些统计数据

> 简单示例
```js
// 用户打卡时返回用户已连续打卡天数，与总共打卡次数
app.on('mark/user-mark', async (_, mark, data) => {
  return `已连续打卡 ${
    await data.users[mark.uid].all.continuous
  } 天， 共打卡 ${
    await data.users[mark.uid].all.count
  } 次。`
})
```

## 指令

* `mark` `打卡、签到` 打卡
* `mark.list` `打卡记录` 获取打卡的 contributor graph。
