process.env.NODE_ENV = 'test'

const proxy = {
  http: '', https: ''
}

process.env.http_proxy = proxy.http
process.env.https_proxy = proxy.https

module.exports = {
  extension: [ 'ts', 'tsx' ],
  require: [
    'ts-node/register/transpile-only',
    'tsconfig-paths/register'
  ]
}
