<template>
  <div class="plugins-card">
    <div class="head-bar">
      <div class="right-btns">
        <div class="close"/>
        <div class="min"/>
        <div class="max"/>
      </div>
      <div class="title"><span class="material-icons-round" v-text="'cloud'"/>{{ title }}</div>
    </div>
    <draggable
      class="plugins" :list="plugins"
      v-bind="{
        animation: 300,
        ghostClass: 'plugins-card-ghost'
      }"
      :group="{ name: 'people', put: true }">
      <transition-group type="transition" name="flip-list">
        <plugin-card :key="plugin.name"
                     v-for="plugin in plugins"
                     :plugin="plugin"/>
      </transition-group>
    </draggable>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { VueDraggableNext as Draggable } from 'vue-draggable-next'

import PluginCard, { Plugin } from '@/components/PluginCard.vue'

export default defineComponent({
  components: { Draggable, PluginCard },
  props: {
    title: String as PropType<string>,
    plugins: Array as PropType<Plugin[]>
  },
  setup(props) {
  }
})
</script>

<style>
.plugins-card-ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>

<style scoped lang="scss">
.plugins-card {
  background-color: #fdfdfd;
  border: 1px solid #888888;
  border-radius: 10px;
  margin: 10px;
  overflow: hidden;

  > .head-bar {
    padding: 10px;
    font: {
      size: 20px;
      weight: bold;
    };
    background-color: rgb(217, 215, 221);

    > .right-btns {
      > div {
        float: left;
        margin-right: 10px;
        width: 20px; height: 20px;
        border-radius: 50%;
        cursor: pointer;

        transition: .2s;
      }
      @mixin background-color-hover-darken(
        $color, $property: 10%
      ) {
        background-color: $color;
        &:hover {
          background-color: darken($color, $property);
        }
      }
      $btnColor: (
        min: rgb(246, 189, 58),
        max: rgb( 68, 204, 69),
        close: rgb(245,  93, 92)
      );
      @each $btn, $color in $btnColor {
        > .#{$btn} {
          @include background-color-hover-darken($color, 15%);
        }
      }
    }

    > .title {
      display: flex;
    }
  }

  > .plugins {
    display: grid;
    grid-template-columns: repeat(auto-fill, 382px);
    justify-content: space-evenly;
    grid-row-gap: 20px;

    padding: 10px;

    ::v-deep .plugin-card {
      width: 360px;
    }
  }
}
</style>
