<template>
  <h1>hello, this is home.</h1>
  <div class="users-search">
    <div class="user">
      <img :src="user.avatar" :alt="user.userId">
      <span>{{ user.username }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted } from 'vue'
import axios from 'axios'

type User = {
  userId: string
  avatar: string
  username: string
}

export default defineComponent({
  setup() {
    const user = ref<User>({
      userId: '-1',
      avatar: '',
      username: ''
    })
    onMounted(async () => {
      user.value = (await axios.get(
        `/apis/demo-view/common/onebot/2284672637?fields=userId,avatar,avatar,username`
      )).data
      console.log(user)
    })
    return { user }
  }
})
</script>

<style>
.users-search {
}
.users-search > .user {
  background-color: aliceblue;
  border: 1px solid #ededed;

  display: flex;
  align-content: space-around;
}

.users-search > .user > img {
  width: 62px; height: 62px;
  border-radius: 50%;
  border: 1px solid #ededed;
}
</style>
