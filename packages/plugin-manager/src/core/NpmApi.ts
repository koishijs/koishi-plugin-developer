import axios from 'axios'
import { stringify } from 'querystring'

interface Package {
  name: string
  version: string
  description: string
  links: {
    npm: string
    homepage?: string
    repository?: string
    bugs?: string
  }
  author: {
    name: string
    email?: string
    username?: string
  }
  publisher: {
    email?: string
    username?: string
  }
}

class NpmApi {
  root = 'https://api.npms.io/v2'
  async search(q: string, from = 0, size = 10) {
    return (await axios.get<{
      total: number
      results: {
        "package": Package
      }[]
    }>(`${this.root}/search?${ stringify({
      q, from, size
    }) }`)).data
  }
}

export const npmApi = new NpmApi()
