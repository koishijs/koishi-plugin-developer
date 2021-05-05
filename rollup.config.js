import fs from 'fs'
import { merge } from 'koishi-utils'

import { terser } from 'rollup-plugin-terser'

import json from 'rollup-plugin-json'
import { eslint } from 'rollup-plugin-eslint'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import babel from 'rollup-plugin-babel'

const extensions = [ '.ts', '.tsx' ]

const pkg = JSON.parse(fs.readFileSync(
  './package.json'
).toString())

const jobs = {
  esm: {
    output: {
      format: 'esm',
      file: pkg.module
    }
  },
  umd: {
    output: {
      format: 'umd',
      file: pkg.main
    }
  },
  min: {
    output: {
      format: 'umd',
      file: pkg.main.replace(/(.\w+)$/, '.min$1')
    },
    plugins: [ terser() ]
  }
}

export default merge({
  input: './src/index.ts',
  output: { name: pkg.name },
  plugins: [
    json(),
    eslint({
      throwOnError: true,
      throwOnWarning: true,
      include: [ 'src/**/*.ts' ],
      exclude: [ 'node_modules/**', 'dist/**', '*.js' ],
    }),
    commonjs(),
    nodeResolve({
      extensions,
      modulesOnly: true,
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    }),
    typescript({
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        compilerOptions : { module: "esnext" }
      }
    }),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
      extensions,
    })
  ]
}, jobs[process.env.FORMAT || 'esm'])
