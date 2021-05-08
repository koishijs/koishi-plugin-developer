import fs from 'fs'
import yaml from 'js-yaml'
import commander from 'commander'
import { spawn } from 'child_process'
import { merge } from 'koishi'
import inquirer from 'inquirer'

import pkg from '../package.json'

const program = new commander.Command()
program.version(
  pkg.version
).option(
  '-e, --env <envName>',
  'choose your environment.',
  'windows-amd'
).option(
  '-c, --config <file>',
  'select `gocq` configuration file.',
'config.yml'
).parse(process.argv)

const options = program.opts() as {
  env: string
  config?: string
}
const filePath = new Proxy({
  gocqExe: `.\\go-cqhttp\\${options.env}\\go-cqhttp`,
  optionConfig: options.config,
  envConfig: '.env.yml',
  envTempConfig: '.env.temp.yml'
}, {
  get(target, p, _receiver) {
    return target[p]
    // return path.resolve(
    //   process.cwd(), target[p]
    // )
  }
})

;(async () => {
  const args = []
  await (async function generateTempEnvYaml () {
    if (!fs.existsSync(filePath['optionConfig'])) {
      throw new Error('Config file can not found.')
    }
    if (!fs.existsSync(filePath['envConfig'])) {
      const defaultEnvConfig = {
        middlewares: { 'access-token': '74dc0131-0bce-4a39-8ee8-21fea81a892b' },
        account: {
          uin: undefined, password: ''
        }
      }
      const answer: {
        isAutoCreate: boolean
        uni: number
        pwd: string
      } = await inquirer
        .prompt([{
          type: 'confirm',
          name: 'isAutoCreate',
          message: '.env.yml 文件不存在，是否自动创建新文件'
        }, {
          type: 'input',
          name: 'uni',
          message: '请输入 bot qq账号'
        }, {
          type: 'input',
          name: 'pwd',
          message: '请输入 bot 密码(为空时扫码登陆)'
        }])
      if (!answer.isAutoCreate) {
        throw new Error('Env Config file can not found, You need to create a `.env.yml` file in the root directory.')
      }
      defaultEnvConfig.account.uin = +answer.uni
      defaultEnvConfig.account.password = answer.pwd
      fs.writeFileSync(
        filePath['envConfig'], yaml.dump(defaultEnvConfig)
      )
    }

    const optionConfig = yaml.load(
      fs.readFileSync(filePath['optionConfig']).toString()
    ) as {}
    const tempYaml = yaml.dump(merge(
      yaml.load(
        fs.readFileSync(filePath['envConfig']).toString()
      ) as {}, optionConfig
    ))
    fs.writeFileSync(
      filePath['envTempConfig'], tempYaml
    )
  })()

  args.push('-c', filePath['envTempConfig'])
  console.log(
    `> ${filePath['gocqExe']} ${args.join(' ')}`
  )
  const execCmd = spawn(
    filePath['gocqExe'], args
  )
  process.stdin.pipe(execCmd.stdin)
  execCmd.stdout.pipe(process.stdout)
  execCmd.stderr.pipe(process.stderr)
  execCmd.on('exit', _code => {
    fs.rmSync(filePath['envTempConfig'])
  })
})()

process.on('exit', _code => {
  fs.rmSync(filePath['envTempConfig'])
})
