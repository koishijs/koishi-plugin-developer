import axios from 'axios'

import { Plugin } from '@/components/PluginCard.vue'

class PluginsApi {
  async searchPlugins() {
    const plugins: {
      name: string
      author: string
      description: string
      version: string
    }[] = (await axios.get('/plugin-apis/manager/plugins')).data
    return plugins.map(plugin => {
      const pluginData: Plugin = {
        name: plugin.name,
        desc: plugin.description,
        version: plugin.version
      }
      if (/^(.*) <(.*)>$/.test(plugin.author)) {
        const [ _str, username, email ] = /^(.*) <(.*)>$/[Symbol.match](plugin.author)
        pluginData.publisher = { username, email }
      } else {
        pluginData.publisher = {
          username: plugin.author.trim(), email: ''
        }
      }
      return pluginData
    })
  }
}

export const pluginsApi = new PluginsApi()
