<template>
  <plugins-card title="本地" :plugins="plugins"/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { Plugin } from '@/components/PluginCard.vue'
import PluginsCard from '@/components/PluginsCard.vue'
import { pluginsApi } from '@/apis/pluginsApi'

@Options({
  components: {PluginsCard }
})
export default class Home extends Vue {
  plugins: Plugin[] = [  ]
  async mounted() {
    this.plugins = await pluginsApi.searchPlugins()
  }
}
</script>

<style scoped lang="scss">
</style>
