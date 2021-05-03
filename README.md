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

## 目录介绍

```shell
- cli
  # 脚手架文件夹
  - plugin-helper.ts
  # plugin 生成助手
  - run-gocq.ts
  # gocq 启动脚本
- go-cqhttp
  # go-cqhttp 各个环境下的启动文件
- packages
  - plugin-*
  # plugin 子 package
- src
  # bot 的主运行目录
- test
  # 单元测试目录
```
