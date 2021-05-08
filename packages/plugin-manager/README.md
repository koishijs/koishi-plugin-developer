# (KPM) koishi plugin manager

更加快捷的管理你 bot 安装的插件

## How to use

* `yarn add koishi-plugin-manager`
* 在你的 koishi.config.js 中引入插件，或者在你的 `app.(t|j)s` 中启用插件 `app.plugin(manager)`

## 常用指令

* `kpm`
  * `.i(nstall) [...plugin]`
  * `.un(install) [...plugin]`
  * `.ls [...plugin]`
    * `.remote`
