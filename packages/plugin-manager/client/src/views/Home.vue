<template>
  <draggable
    class="plugins" :list="plugins"
    :group="{ name: 'people', put: true }">
    <transition-group type="transition" name="flip-list">
      <div
        class="plugin-card"
        :key="plugin.name"
        v-for="plugin in plugins">
        <div class="icon" :style="{
        'background-image': `url(${plugin.avatar()})`
      }"/>
        <div class="detail">
          <div class="head">
            <label
              class="name"
              v-text="plugin.name"/>
            <label
              class="version"
              v-text="plugin.version"/>
            <span class="downloads">
            1.5k
            <span class="material-icons"
                  v-text="'cloud_download'"/>
          </span>
          </div>
          <div class="desc">
            {{ plugin.desc }}
          </div>
          <div class="foot">
            <div class="author" v-text="plugin.author"/>
            <span class="material-icons settings"
                  v-text="'settings'"/>
          </div>
        </div>
      </div>
    </transition-group>
  </draggable>
  <draggable
    class="plugins" :list="t_plugins"
    group="people">
    <transition-group type="transition" name="flip-list">
      <div
        class="plugin-card"
        :key="plugin.name"
        v-for="plugin in t_plugins">
        <div class="icon" :style="{
          'background-image': `url(${plugin.avatar()})`
        }"/>
        <div class="detail">
          <div class="head">
            <label
              class="name"
              v-text="plugin.name"/>
            <label
              class="version"
              v-text="plugin.version"/>
            <span class="downloads">
              1.5k
              <span class="material-icons"
                    v-text="'cloud_download'"/>
            </span>
          </div>
          <div class="desc">
            {{ plugin.desc }}
          </div>
          <div class="foot">
            <div class="author" v-text="plugin.author"/>
            <span class="material-icons settings"
                  v-text="'settings'"/>
          </div>
        </div>
      </div>
    </transition-group>
  </draggable>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { VueDraggableNext as Draggable } from 'vue-draggable-next'
import Identicon from 'identicon.js'
import md5 from 'js-md5'

@Options({
  components: { Draggable }
})
export default class Home extends Vue {
  plugins = [ ...new Array(10).keys() ].map(i => new Object({
    name: `test-${ i }`,
    version: '1.0.0',
    desc: '一个测试的小插件.',
    avatar() {
      return 'data:image/png;base64,' + new Identicon(
        md5(this.name), 360
      ).toString()
    },
    author: 'yijie'
  }))
  t_plugins = [ ...new Array(10).keys() ].map(i => new Object({
    name: `test-${ i }`,
    version: '1.0.0',
    desc: '一个测试的小插件.',
    avatar() {
      return 'data:image/png;base64,' + new Identicon(
        md5(this.name), 360
      ).toString()
    },
    author: 'yijie'
  }))
}
</script>

<style>
.flip-list-move {
  transition: transform 0.3s;
}
.no-move {
  transition: transform 0s;
}
</style>

<style scoped lang="scss">
.icon-btn {
  cursor: pointer;
  user-select: none;
  transition: .3s;

  &:hover {
    color: #888888
  }
}
.plugins {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;

  padding: 10px;
  background-color: #fdfdfd;
  border: 1px solid #888888;
  border-radius: 10px;
  margin: 10px;

  .plugin-card {
    display: flex;
    justify-content: space-evenly;
    margin-bottom: 10px;
  }
  .plugin-card {
    $card-h: 80px;
    padding: 10px;
    width: 300px; height: $card-h;

    background-color: #fdfdfd;
    border: 1px solid #adadad;
    border-radius: 10px;

    box-shadow: 0 0 5px #adadad;

    > .icon {
      margin-right: 5px;
      width: $card-h;
      height: $card-h;
      box-sizing: border-box;
      border: 1px solid #adadad;
      border-radius: 4px;

      background: {
        size: $card-h;
        position: center;
      };
    }

    > .detail {
      flex-grow: 1;

      display: flex;
      flex-direction: column;

      height: $card-h;

      > .head {
        display: flex;
        justify-content: space-around;
        align-items: center;
        height: 30px;
        line-height: 30px;

        > .name {
          margin-right: 4px;
          color: #616161;
          font: {
            size: 20px;
            weight: bold;
          };
        }

        > .version {
          color: #adadad;
          font: {
            size: 12px;
            weight: bold;
          };
        }

        > .downloads {
          flex: 1;
          text-align: right;

          display: flex;
          justify-content: flex-end;
          align-items: center;

          font-size: 10px;

          > .material-icons {
            @extend .icon-btn;
            margin-left: 4px;
            font-size: 16px;
          }
        }
      }

      > .desc {
        color: #888888;
        font: {
          size: 14px;
        };
      }

      > .foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 30px;
        line-height: 30px;
        font: {
          size: 14px;
        };

        > .settings {
          @extend .icon-btn;
        }
      }
    }
  }
}
</style>
