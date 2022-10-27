import chalk from 'chalk'
import { build, BuildOptions } from 'esbuild'

const pkg = require('./package.json')

async function main() {
  const [command] = process.argv.slice(2)

  const options: BuildOptions = {
    define: {
      VERSION: JSON.stringify(pkg.version),
      DESCRIPTION: JSON.stringify(pkg.description),
    },
    entryPoints: ['./src/index.ts'],
    minify: process.env.NODE_ENV === 'production',
    bundle: true,
    target: 'node16',
    platform: 'node',
    sourcemap: 'external',
    external: [
      'dotenv',
      'commander',
      'inquirer',
      'chokidar'
    ],
    format: 'cjs',
    outfile: './bin/index.js'
  }

  if (command === 'build') {
    await build(options)
  }
  if (command === 'serve') {
    let buildCount = 0
    await build({
      ...options,
      watch: {
        onRebuild(error) {
          if (error)
            console.error(chalk.red('Build failed'), error)
          else
            // log success message and rewrite line
            process.stdout.write(chalk.green(`\rBuild succeeded (${++buildCount})`))
        }
      }
    })
    console.log('Serving')
  }
}

main().catch(error => {
  console.error(error.toString())
  process.exit(1)
})
