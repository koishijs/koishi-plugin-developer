import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'

(async () => {
  const answer: {
    name: string
    desc: string
    author: string
  } = await inquirer
    .prompt([{
      type: 'input',
      name: 'name',
      message: '请输入插件名'
    }, {
      type: 'input',
      name: 'desc',
      message: '请输入插件介绍'
    }, {
      type: 'input',
      name: 'author',
      message: '你的姓名'
    }])

  const data = {}
  for (const answerKey in answer) {
    data[`___${ answerKey.toUpperCase() }___`] = answer[answerKey]
  }

  const dirData = {
    'package.json': data,
    'rollup.config.js': undefined,
    src: {
      'index.ts': data
    },
    test: undefined
  }
  const root = path.resolve(
    __dirname, './templates/plugin-common[ts]'
  )
  const targetRoot = `./packages/plugin-${answer.name}`

  if (!fs.existsSync(targetRoot)) { fs.mkdirSync(targetRoot) }
  ; (function cpTo(origin: string, target: string, data: {}) {
    const children = fs.readdirSync(origin)
    children.forEach(child => {
      const childData = data[child] || ''
      const originPath = path.resolve(origin, child)
      const targetPath = path.resolve(target, child)
      if (
        fs.lstatSync(originPath).isFile()
      ) {
        let content = fs.readFileSync(originPath).toString()
        for (const key in childData) {
          content = content.replace(
            new RegExp(key.replace('$', '\\$'), 'g'), childData[key]
          )
        }
        fs.writeFileSync(targetPath, content)
      } else if (
        fs.lstatSync(originPath).isDirectory()
      ) {
        fs.mkdirSync(targetPath)
        cpTo(originPath, targetPath, childData || {})
      }
    })
  })(root, targetRoot, dirData)
})().catch(e => console.error(e))
