const Cordis = require('cordis')

const originalPlugin = Cordis.Context.prototype.plugin
Cordis.Context.prototype.plugin = function (...args) {
  const { name } = args[0]
  if (name) {
    process.send?.(`installed ${name}`)
  }
  return originalPlugin.apply(this, args)
}
