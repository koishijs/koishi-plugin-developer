import { Command } from 'commander'
import * as process from 'process'
import * as start from './start'
import * as build from './build'

const pkg = require('../package.json')

async function main() {
  const program = new Command()
  program
    .version(pkg.version)
    .description(pkg.description)

  build.apply(program)
  start.apply(program)

  program.parse()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
