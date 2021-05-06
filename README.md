# Koishi plugin developer

用于开发 koishi plugin 的模板项目

## 如何使用

1. 确保你有 `yarn` 模块, 如果没有，请 `npm install -g yarn` or `cnpm install -g yarn`

    (ps: 暂时还没考虑非 `yarn` 用户, 后续支持)

### 安装依赖
```shell
yarn
```

### 根据你的环境运行指定 cqhttp
> 如果没有你需要的环境 可以自行去 [go-cqhttp releases](https://github.com/Mrs4s/go-cqhttp/releases) 下载到 `./go-cqhttp/` 下
> 
> 例如你是 linux amd64 环境下
> 
> 下载 releases 下的 go-cqhttp_linux_amd64.tar.gz, 解压到 linux-amd64下
> 
> 目前只有 windows 环境，欢迎 pr
```shell
yarn go-cqhttp:win-amd
```

### 运行 bot 与构建发布插件

* 运行 bot

  * 生产环境使用 `yarn start:pro`
  * 开发环境需要热载可以使用 `yarn start:dev`
    
    * [ ] feat 热插拔的重载插件 (减少不需要的插件的反复重启成本)
    * [ ] feat 指令化安装管理插件 (不需要代码中控制管理)
      * [x] 全局安装插件
      * [ ] 指定会话(全局、私聊、群聊、群聊下某用户)安装插件
      * [ ] 远程(github、npm)搜索 koishi 相关 plugin 安装
      * [ ] 设置指定会话插件配置
      * [ ] 热重载 监听到指定插件变动的时候，启动热重载
      * [ ] gui

* 生成构建发布插件

  * 生成模版插件(暂时参考 demo 插件，内集成最新 `unit test`)
    * cli 脚本生成模版 `yarn helper:plugin`, 创建一个简单的模版在 packages 文件夹下
    * 写下你想写出的机器人插件
    * 在 src 中启用，或者给机器人发送 `kpm.i(nstall) your-plugin-name`，全局启用你的插件
  * 构建指定插件使用 `yarn build:plugin`, 启动成功后输入指定要构建的插件。
    例如 `demo`
  * [ ] feat 待完成 cli 脚本集成发布

## 目录介绍

```shell
- cli
  # 脚手架文件夹
  - builder.ts
    # 构建脚本，用于构建插件
  - plugin-helper.ts
    # plugin 生成助手
  - run-gocq.ts
    # gocq 启动脚本
- go-cqhttp
  # go-cqhttp 各个环境下的启动文件
- packages
  - plugin-*
    # plugin 子 package
  - plugin-demo
    # 模版示例项目
    - src
      # 源文件
    - test
      # 单元测试
    - rollup.config.js
      # 统一配置管理构建方案
      # 引用的根目录下的 `rollup.config.js`
- src
  # bot 的主运行目录
- test
  # 单元测试
```
