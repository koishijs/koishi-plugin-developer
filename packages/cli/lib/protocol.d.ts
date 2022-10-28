export namespace Protocol {
  export interface UpDispatcherMap {
    'plugin:apply': [{
      name: string
      config: Record<string, any>
      resolver: string
    }, null]
    'exit': [null, null]
  }
  export type UpTypes = keyof UpDispatcherMap
  export type UpDispatcher<T extends UpTypes = UpTypes> = [{
    type: T
    data: UpDispatcherMap[T][0]
  }, UpDispatcherMap[T][1]]
  export interface DownDispatcherMap {
    'plugin:reload': [resolver: string, null]
  }
  export type DownTypes = keyof DownDispatcherMap
  export type DownDispatcher<T extends DownTypes = DownTypes> = [{
    type: T
    data: DownDispatcherMap[T][0]
  }, DownDispatcherMap[T][1]]
}
