<template>
  <div class="user-card">
    <img :src="user.avatar" :alt="user.userId">
    <span>{{ user.username }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import axios from 'axios'

export type User = {
  userId?: string
  avatar?: string
  username?: string
}

export default defineComponent({
  props: {
    userId: {
      type: String
    }
  },
  setup(props) {
    const user = ref<User>({ })
    const refreshData = async (userId) => {
      user.value = (await axios.get(
        `/plugin-apis/demo-view/common/onebot/${userId}?fields=userId,avatar,avatar,username`
      )).data
    }
    onMounted(async () => {
      await refreshData(props.userId)
    })
    return { user, refreshData }
  }
})
</script>

<style scoped lang="scss">
.user-card {
  display: flex;
  align-content: space-around;
  align-items: center;

  padding: 10px;
  border: 1px solid #adadad;
  border-radius: 10px;

  background-color: #fefefe;

  transition: .3s;
  &:hover {
    box-shadow: 0 0 15px gray;
  }
  > * {
    margin-right: 10px;
  }
  > img {
    width: 62px; height: 62px;
    border-radius: 10px;
    border: 1px solid #ededed;
  }
}
</style>
