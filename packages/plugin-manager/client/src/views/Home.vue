<template>
  <plugins-card title="本地" :plugins="plugins"/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { VueDraggableNext as Draggable } from 'vue-draggable-next'

import PluginCard from '@/components/PluginCard.vue'
import PluginsCard from '@/components/PluginsCard.vue'

@Options({
  components: {PluginsCard, Draggable, PluginCard }
})
export default class Home extends Vue {
  plugins = [ ...new Array(9).keys() ].map(i => new Object({
    name: `test-${ i }`,
    version: '1.0.0',
    desc: '一个测试的小插件.',
    publisher: {
      username: 'yijie4188',
      email: 'yijie4188@gmail.com'
    }
  }))
}
</script>

<style scoped lang="scss">
</style>
