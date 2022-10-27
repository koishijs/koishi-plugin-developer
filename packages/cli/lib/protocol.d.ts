export namespace Protocol {
  export interface UpDispatcherMap {
    'plugin:apply': [{
      name: string
      config: Record<string, any>
      resolver: string
    }, null]
  }
  export type UpTypes = keyof UpDispatcherMap
  export type UpDispatcher<T extends UpTypes = UpTypes> = [{
    type: T
    data: UpDispatcherMap[T][0]
  }, UpDispatcherMap[T][1]]
  export interface DownDispatcher {
    'plugin:reload': [resolver: string, null]
  }
  export type DownTypes = keyof DownDispatcher
  export type DownDispatcher<T extends DownTypes = DownTypes> = [{
    type: T
    data: DownDispatcher[T][0]
  }, DownDispatcher[T][1]]
}
