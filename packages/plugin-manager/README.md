# (KPM) koishi plugin manager

更加快捷的管理你 bot 安装的插件

## How to use

* 安装插件 `yarn add koishi-plugin-manager`
* 在你的 koishi.config.js 中引入插件，或者在你的 `app.(t|j)s` 中启用插件 `app.plugin(manager)`

## 已支持的指令

```
kpm <subCmd> [args...] 插件管理工具。
可用的子指令有：
    kpm.install
    kpm.list
    kpm.uninstall
```

```
kpm.install [...plugins] 安装插件
别名：kpm.i，kpm.in，kpm.ins，kpm.inst，kpm.insta，kpm.instal，kpm.isnt，kpm.isnta，kpm.isntal，kpm.add。
安装插件到指定会话
可用的选项有：
    -g, --global  全局
可用的子指令有：
    kpm.install.remote
```

```
kpm.uninstall [...plugins] 卸载插件
别名：kpm.uni，kpm.un，kpm.unlink，kpm.remove，kpm.rm，kpm.r。
从指定会话卸载插件
可用的选项有：
    -g, --global  全局
```

```
kpm.list 插件列表
别名：kpm.ls，kpm.l。
展示当前会话已安转的插件
可用的选项有：
    -g, --global  全局
可用的子指令有：
    kpm.list.local
    kpm.list.remote
```
