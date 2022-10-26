const Koishi = require('koishi')

const originalPlugin = Koishi.App.prototype.plugin
Koishi.App.prototype.plugin = (...args) => {
  const { name } = args[0]
  if (name) {
    process.send?.(`installed ${name}`)
  }
  return originalPlugin.apply(this, args)
}
