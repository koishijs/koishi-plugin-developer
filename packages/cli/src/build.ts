import { Command } from 'commander'
import path from 'path'
import { doCommand } from './utils'

export function apply(program: Command) {
  const allPlatforms = ['esm', 'umd', 'min.umd', 'cjs', 'min.cjs']
  program
    .command('build <type> [name]')
    .description('build pkg, type: plugin | bot')
    .option(
      '-p, --platforms <platforms>',
      `platforms to build, can be: ${allPlatforms.join(', ')} or all`,
      'all'
    )
    .option(
      '-d, --dts',
      'generate declaration files',
      false
    )
    .action(async (type: string, name?: string, options?: {
      platforms: string
      dts: boolean
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
      await Promise.all([
        ...platforms.map(platform => doCommand('rollup', [
          '-c',
          '--environment', `FORMAT:${ platform }`,
          '--bundleConfigAsCjs',
          '--configPlugin', path.resolve('./rollup-tsnode-plugin.js'),
        ], opts)),
        options.dts ? doCommand('tsc', [
          '--project', 'tsconfig.build.json',
        ], opts) : Promise.resolve(),
      ])
    })
}
