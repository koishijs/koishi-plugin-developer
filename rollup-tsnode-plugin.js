require('ts-node').register()

module.exports = function rollupTsconfigPathsPlugin() {
  return {
    name: 'rollup-tsconfig-paths-plugin'
  }
}
