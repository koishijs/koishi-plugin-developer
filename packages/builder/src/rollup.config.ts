import fs from 'fs'
import * as path from 'path'
import { RollupOptions } from 'rollup'

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import esbuild, { minify } from 'rollup-plugin-esbuild'

import type { CommonOptions } from 'esbuild'
import type { RollupEslintOptions } from '@rollup/plugin-eslint'

export function resolvePeerPlugin(name: string, options: Record<string, any>) {
  try {
    const m = require(name)
    if ('default' in m) {
      return [m.default(options)]
    } else {
      return [m(options)]
    }
  } catch (err) {
    return []
  }
}

export function kIsInO<K extends string, O0>(
  key: K, o0: O0
  // @ts-ignore
): key is keyof O0 {
  return key in o0
}

export function merge<T0, T1>(o0: T0, o1: T1) {
  const newO = { ...o0 } as T0 & T1
  for (const key in o1) {
    if (kIsInO(key, o0)) {
      const [ v0, v1 ] = [ o0[key], o1[key] ]
      type V0 = typeof v0
      type V1 = typeof v1
      // resolve nested object
      if (typeof v0 === 'object' && typeof v1 === 'object') {
        newO[key] = merge(v0, v1)
        // resolve array
      } else if (Array.isArray(v0) && Array.isArray(v1)) {
        newO[key] = [
          ...v0,
          ...v1
        ] as V0 & V1
        // resolve function
      } else if (typeof v0 === 'function' && typeof v1 === 'function') {
        newO[key] = ((...args: any[]) => {
          v0(...args)
          v1(...args)
        }) as V0 & V1
        // resolve other types
      } else {
        newO[key] = o1[key] as V0 & V1
      }
    } else {
      newO[key] = o1[key] as any
    }
  }
  return newO
}

const extensions = [ 'js', 'jsx', '.ts', '.tsx' ]

export interface Options {
  /**
   * 自定义 esbuild define 参数
   *
   * 默认可用的变量
   *
   * `__NAME__`         : 包名
   *
   * `__VERSION__`      : 包版本
   *
   * `__DESCRIPTION__`  : 包描述
   */
  define?: CommonOptions['define']
  baseUrl?: string
  /**
   * 若传入参数为 string | Regexp 或者俩者的数组，则 concat
   * 若传入参数为 function ，则直接使用
   * @default ['koishi']
   */
  external?: RollupOptions['external']
  plugins?: {
    /** @default false */
    eslint?: boolean | RollupEslintOptions
  }
}

export const genConfig = (opts: Options = {}): RollupOptions => {
  const pkg = JSON.parse(fs.readFileSync(
    path.resolve(opts.baseUrl ?? './', 'package.json')
  ).toString())

  const jobs: Record<string, RollupOptions> = {
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
      plugins: [ minify() ]
    }
  }

  const external = (function resolveExternal() {
    const deaultExternal = ['koishi'] as (string | RegExp)[]
    switch (typeof opts.external) {
      case 'function':
        return opts.external
      case 'string':
        return deaultExternal.concat([opts.external])
    }
    if (opts.external instanceof RegExp) {
      return deaultExternal.concat([opts.external])
    }
    if (Array.isArray(opts.external)) {
      return deaultExternal.concat(opts.external)
    }
    return deaultExternal
  })()

  return merge({
    input: './src/index.ts',
    output: { name: pkg.name },
    external,
    plugins: [
      ...(
        (opts.plugins?.eslint ?? true)
          ? resolvePeerPlugin('eslint', merge(
            {
              throwOnError: true,
              throwOnWarning: true,
              include: [ 'src/**/*.ts' ],
              exclude: [ 'node_modules/**', 'dist/**', '*.js' ],
            } as RollupEslintOptions,
            opts.plugins?.eslint
          ))
          : []
      ),
      commonjs(),
      nodeResolve({
        extensions,
        modulesOnly: true
      }),
      esbuild({
        include: /\.[jt]sx?$/,
        exclude: /node_modules/,
        sourceMap: true,
        target: 'es2017',
        define: {
          __NAME__: `"${ pkg.name }"`,
          __VERSION__: `"${ pkg.version }"`,
          __DESCRIPTION__: `"${ pkg.description }"`,
          ...opts.define
        },
        tsconfig: 'tsconfig.json',
        loaders: { '.json': 'json' }
      })
    ]
  } as RollupOptions, jobs[process.env.FORMAT])
}
