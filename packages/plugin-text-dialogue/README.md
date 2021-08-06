# Koishi Plugin Text Dialogue

快来和你的 bot 在文档中对话吧~

## how to use

### 安装插件

```shell
yarn install koishi-plugin-text-dialogue
# or
npm i --save koishi-plugin-text-dialogue
```

### 使用

* 创建一个对话用的文件，这里我们叫它 `hello.md`。

* 在配置文件中添加 bot，并配置 bot 的监听目录。
```js
// 你的配置文件
module.exports = {
  bots: [{
    type: 'text-dialogue',
    // 你的 bot 名字
    selfId: 'second-jie',
    // 该 bot 监听的文件或目录
    watchOptionsMap: ['hello.md']
  }]
}
```

* 用你的任意一款可以查看 md 的工具打开该文件（推荐使用 Typora）。
* 在文件中已如下的格式输入你的指令，并按下保存按钮（发送消息给 bot）。
```md
> $username@$command <
```
示例：
```md
> yijie@help <
```

* 你会收到机器人返回给你的消息，你的查看工具可能不知道他更改了，需要重新打开或重载文件即可（Typora 可以自动重载）。
