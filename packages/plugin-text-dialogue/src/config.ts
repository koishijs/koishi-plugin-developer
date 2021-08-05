import { WatchOptions } from 'chokidar'

export type WatchOptionsMap = Record<string, WatchOptions> | string[]

export interface Config {
  watchOptionsMap?: WatchOptionsMap
}

export function resolveWatchOptionsMap(watchOptionsMap: WatchOptionsMap | string[]) {
  if (!Array.isArray(watchOptionsMap)) return watchOptionsMap
  const temp: WatchOptionsMap = {}
  watchOptionsMap.forEach(f => temp[f] = {})
  return temp
}
