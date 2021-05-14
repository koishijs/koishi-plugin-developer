<template>
  <div v-if="!!plugin" class="plugin-card">
    <div class="icon" :style="{
      'background-image': `url(${genAvatar(plugin)})`
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
      <div class="desc" :title="plugin.desc">
        {{ plugin.desc }}
      </div>
      <div class="foot">
        <div class="author-avatar" :style="{
          'background-image': `url(${plugin.publisher.avatar})`
        }"/>
        <div class="author" v-text="plugin.publisher.username"/>
        <span class="material-icons settings"
              v-text="'settings'"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Identicon from 'identicon.js'
import md5 from 'js-md5'
import gravatar from 'gravatar'

export type Plugin = {
  name: string
  version: string
  desc: string
  publisher: {
    username: string
    email: string
    avatar?: string
  }
}

export default defineComponent({
  props: {
    plugin: {
      type: Object as PropType<Plugin>
    }
  },
  setup(props) {
    const genAvatar = (plugin: Plugin) => {
      return 'data:image/png;base64,' + new Identicon(
        md5(plugin.name + plugin.version), {
          background: [ 255, 255, 255, 0 ], size: 128
        }
      ).toString()
    }

    props.plugin.publisher.avatar = gravatar.url(props.plugin.publisher.email, {
      s: '200', r: 'pg', d: '404'
    })
    return {
      genAvatar
    }
  }
})
</script>

<style scoped lang="scss">
.icon-btn {
  cursor: pointer;
  user-select: none;
  transition: .3s;

  &:hover {
    color: #888888
  }
}
.plugin-card {
  display: flex;
  justify-content: space-evenly;

  $card-h: 80px;
  padding: 10px;
  border: 1px solid #adadad;
  border-radius: 10px;
  width: 300px; height: $card-h;

  background-color: #fdfdfd;

  box-shadow: 0 0 5px #adadad;

  cursor: grab;

  * { cursor: default }

  > .icon {
    $icon-size: $card-h - 10px;
    flex-shrink: 0;
    margin: 5px;
    width: $icon-size; height: $icon-size;
    box-sizing: border-box;
    border-radius: 4px;

    background: {
      size: $icon-size;
      position: center;
    };
  }

  > .detail {
    flex: 1;
    overflow: hidden;

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
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
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

      > .author-avatar {
        $size: 24px;
        width: $size; height: $size;
        background-size: $size;
        background-position: center;
        border-radius: 50%;
      }

      > .settings {
        @extend .icon-btn;
      }
    }
  }
}
</style>
