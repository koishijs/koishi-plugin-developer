import { spawn, SpawnOptionsWithoutStdio } from 'child_process'
import inquirer from 'inquirer'
import fs from 'fs'
import commander from 'commander'

import pkg from '../package.json'

interface Options {
  clear?: boolean
  all?: boolean
  plugins?: string[]
  format?: 'esm' | 'umd' | 'min'
  allFormat?: boolean
}

const doCommand = (
  cmd: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio
) => new Promise<number>(resolve => {
  if (process.platform === 'win32') {
    cmd += '.cmd'
  }
  const execCmd = spawn(cmd, args, options)
  execCmd.stdout.pipe(process.stdout)
  execCmd.stderr.pipe(process.stderr)
  execCmd.on('exit', code => {
    resolve(code)
  })
})

const runRollup = (args: any[], options: SpawnOptionsWithoutStdio = {}) => new Promise(resolve => {
  args = [ '-c', ...args ]
  const cmd = 'rollup'
  const cwd = options.cwd ?? process.cwd()

  console.log('working dir:', cwd)
  console.log(
    `> ${cmd} ${args.join(' ')}`
  )
  resolve(doCommand(cmd, args, { ...options, cwd }))
})

const buildPlugins = async (opts: Options) => {
  for (let i = 0;i < opts.plugins.length; i++) {
    const plugin = opts.plugins[i]
    const rollupOptions = { cwd: `./packages/plugin-${plugin}` }
    if (opts.format) {
      if (![ 'esm', 'umd', 'min' ].includes(opts.format)) throw new Error(
        'Format param is not found.'
      )
      await runRollup([  '--environment', `FORMAT:${opts.format}` ], rollupOptions)
      return
    }
    if (opts.allFormat) {
      const promises = [
        ...[ 'esm', 'umd', 'min' ]
          .map(format => [ '--environment', `FORMAT:${format}` ])
          .map(argv => runRollup(argv, rollupOptions))
      ]
      await Promise.all(promises)
      return
    }
  }
}

const program = new commander.Command(
  'builder'
).version(
  pkg.version
).option(
  '--clear', 'clear build data.'
).option(
  '--all', 'build all plugins.'
).option(
  '--format', 'build target format of plugin.', 'esm'
).option(
  '--plugins [plugins...]', 'build target plugins.'
).option(
  '--all-format', 'build plugin all format.'
).parse(process.argv)

;(async () => {
  const opts = program.opts() as Options

  const answer: {
    pluginName?: string
  } = await (async () => {
    if (!opts.plugins) opts.plugins = []

    return opts.all || opts.plugins.length > 0 ? {} : inquirer.prompt([{
      type: 'input',
      name: 'pluginName',
      message: '请输入插件名',
      validate(input: string) {
        if (
          !fs.existsSync(`./packages/plugin-${input}`)
        ) return 'Plugin dir is not found.'
        return true
      }
    }])
  })()
  if (opts.clear) {
    const clearPath = `packages/plugin-${ opts.all ? '*' : answer.pluginName }/dist`
    await doCommand('rimraf', [ clearPath ])
  }

  if (!opts.all) {
    answer.pluginName && opts.plugins.push(answer.pluginName)
    await buildPlugins(opts)
  } else {
    const plugins = fs.readdirSync('./packages/').filter(
      name => /^plugin-.*$/.test(name)
    ).map(
      name => /^plugin-(.*)$/[Symbol.match](name)[1]
    )
    await buildPlugins({
      plugins,
      clear: true, allFormat: true
    })
  }
})().catch(console.error)
