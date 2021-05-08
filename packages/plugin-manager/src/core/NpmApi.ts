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

process.env.no_proxy = process.env?.no_proxy ?? ''
process.env.no_proxy += ',api.npms.io'

class NpmApi {
  axios = axios.create({
    baseURL: 'https://api.npms.io/v2/'
  })

  constructor() {
    this.axios.interceptors.response.use(response => {
      return response.data
    }, error => {
      return Promise.reject(error)
    })
  }

  async search(q: string, from = 0, size = 10): Promise<{
    total: number
    results: {
      package: Package
    }[]
  }> {
    return await this.axios.get(
      `search?${ stringify({ q, from, size }) }`
    )
  }
}

export const npmApi = new NpmApi()
