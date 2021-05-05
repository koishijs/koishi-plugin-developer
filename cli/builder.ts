import { spawn } from 'child_process'
import inquirer from 'inquirer'

interface Answer {
  pluginName: string
}

const rollupBuild = (argv: any[], answer: Answer) => {
    let [ cmd, args ] = ['rollup', [
      '-c', ...argv
    ]]
    if (process.platform === 'win32') {
      cmd += '.cmd'
    }
    const cwd = `./packages/plugin-${answer.pluginName}`

    console.log('working dir:', cwd)
    console.log(
      `> ${cmd} ${args.join(' ')}`
    )

    const execCmd = spawn(cmd, args, { cwd })
    execCmd.stdout.pipe(process.stdout)
    execCmd.stderr.pipe(process.stderr)
    execCmd.on('exit', code => {
      console.log('Exit code:', code)
    })
}

;(async () => {
  const argv = process.argv.splice(2)

  const answer: Answer = await inquirer
    .prompt([{
      type: 'input',
      name: 'pluginName',
      message: '请输入插件名'
    }])

  if (argv[0] !== 'all') {
    rollupBuild(argv, answer)
  } else {
    rollupBuild([ '--environment', 'FORMAT:esm' ], answer)
    rollupBuild([ '--environment', 'FORMAT:umd' ], answer)
    rollupBuild([ '--environment', 'FORMAT:min' ], answer)
  }
})()
