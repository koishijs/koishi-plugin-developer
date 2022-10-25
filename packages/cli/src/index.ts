import { Command } from 'commander'
import { spawn, SpawnOptionsWithoutStdio } from 'child_process'
import * as process from 'process'
import * as path from 'path'

const pkg = require('../package.json')

const doCommand = (
  cmd: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio
) => new Promise<number>(resolve => {
  if (process.platform === 'win32') {
    cmd += '.cmd'
  }
  console.log('working dir:', options?.cwd)
  console.log(
    `> ${cmd} ${args.join(' ')}`
  )
  const execCmd = spawn(cmd, args, options)
  execCmd.stdout.pipe(process.stdout)
  execCmd.stderr.pipe(process.stderr)
  execCmd.on('exit', code => {
    resolve(code)
  })
})

function regBuild(program: Command) {
  const allPlatforms = ['esm', 'umd', 'min.umd', 'cjs', 'min.cjs']
  program
    .command('build <type> [name]')
    .description('build pkg, type: plugin | bot')
    .option(
      '-p, --platforms <platforms>',
      `platforms to build, can be: ${allPlatforms.join(', ')} or all`,
      'all'
    )
    .action(async (type: string, name?: string, options?: {
      platforms: string
    }) => {
      if (!['plugin', 'bot'].includes(type))
        throw new Error('type is not found.')
      if (options.platforms === 'all') {
        options.platforms = allPlatforms.join(',')
      }
      const platforms = options.platforms.split(',')
      if (platforms.some(p => !allPlatforms.includes(p)))
        throw new Error('platforms is not found.')

      const opts = {
        cwd: `./${ type }s/${ name }`
      }
      await Promise.all(
        platforms.reduce((acc, platform) => acc.concat([
          doCommand('rollup', [
            '-c',
            '--environment', `FORMAT:${ platform }`,
            '--bundleConfigAsCjs',
            '--configPlugin', path.resolve('./rollup-tsnode-plugin.js'),
          ], opts),
          doCommand('tsc', [
            '--project', 'tsconfig.build.json',
          ], opts)
        ]), [] as Promise<number>[])
      )
    })
}

async function main() {
  const program = new Command()
  program
    .version(pkg.version)
    .description(pkg.description)

  regBuild(program)

  program.parse()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
