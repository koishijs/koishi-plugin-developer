<template>
  <plugins-card
    title="remote"
    :plugins="plugins.remote"/>
  <plugins-card
    title="本地"
    :plugins="plugins.local"/>
  <plugins-card
    title="bot"
    :plugins="plugins.bot"/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Plugin } from '@/components/PluginCard.vue'
import PluginsCard from '@/components/PluginsCard.vue'
import { pluginsApi } from '@/apis/pluginsApi'

@Options({
  components: { PluginsCard }
})
export default class Home extends Vue {
  plugins: {
    remote: Plugin[]
    bot: Plugin[]
    local: Plugin[]
  } = {
    remote: [],
    bot: [],
    local: []
  }
  async mounted() {
    this.plugins.local = await pluginsApi.searchPlugins()
  }
}
</script>

<style scoped lang="scss">
</style>
