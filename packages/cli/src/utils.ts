import { ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio } from 'child_process'

export const doCommand = (
  cmd: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio,
  doExecCmd?: (cmd: ChildProcessWithoutNullStreams) => void
) => new Promise<number>(resolve => {
  if (process.platform === 'win32') {
    cmd += '.cmd'
  }
  console.log('working dir:', options?.cwd)
  console.log(
    `> ${cmd} ${args.join(' ')}`
  )
  const execCmd = spawn(cmd, args, options)
  doExecCmd(execCmd)
  execCmd.stdout.pipe(process.stdout)
  execCmd.stderr.pipe(process.stderr)
  execCmd.on('exit', code => {
    resolve(code)
  })
})
