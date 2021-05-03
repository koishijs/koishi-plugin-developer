import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import commander from 'commander'
import { spawn } from 'child_process'
import { merge } from 'koishi'
import * as readline from 'readline'
import inquirer from 'inquirer'

const program = new commander.Command()
program
  .version('0.0.1')
  .option(
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
  gocqExe: `.\\go-cqhttp\\${options.env}\\go-cqhttp.exe`,
  optionConfig: options.config,
  envConfig: '.env.yml',
  envTempConfig: '.env.temp.yml'
}, {
  get(target, p, receiver) {
    return path.resolve(
      process.cwd(), target[p]
    )
  }
})

const args = []
;(async () => {
  if (!fs.existsSync(filePath['optionConfig'])) {
    throw new Error('Config file can not found.')
  }
  if (!fs.existsSync(filePath['envConfig'])) {
    const defaultEnvConfig = {
      middlewares: { 'access-token': '74dc0131-0bce-4a39-8ee8-21fea81a892b' },
      account: {
        uin: '', pwd: ''
      }
    }
    const answer: {
      isAutoCreate: boolean
      uni: string
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
    defaultEnvConfig.account.uin = answer.uni
    defaultEnvConfig.account.pwd = answer.pwd
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
  args.push('-c', filePath['envTempConfig'])

  console.log(
    `> ${filePath['gocqExe']} ${args.join(' ')}`
  )
  const execCmd = spawn(
    filePath['gocqExe'], args
  )
  execCmd.stdout.on('data', data => process.stdout.write(data))
  execCmd.stderr.on('data', data => process.stderr.write(data))
  process.on('SIGINT', () => {
    fs.rmSync(filePath['envTempConfig'])
  })
})()
