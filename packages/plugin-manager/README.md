# (KPM) koishi plugin manager

更加快捷的管理你 bot 安装的插件

## How to use

* `yarn add koishi-plugin-manager`
* 在你的 koishi.config.js 中引入插件，或者在你的 `app.(t|j)s` 中启用插件 `app.plugin(manager)`

## 常用指令

* kpm
  * `.i(nstall) [option] [...plugin]` 安装插件
    * option `-g` global 全局
  * `.uni(nstall) [option] [...plugin]` 卸载插件
    * option `-g` global 全局
  * `.ls | .list [option] [...plugin]` 展示当前会话已有插件
    * option `-g` global 全局
