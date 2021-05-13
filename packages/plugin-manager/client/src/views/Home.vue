<template>
  <h1>搜索 qq 账号对应的用户.</h1>
  <div class="users-search">
    <input
      type="text"
      :value="userId"
      @change="e => $refs.showUserCard.refreshData(e.target.value)"/>
    <user-card
      ref="showUserCard"
      :user-id="userId"/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import UserCard from '@/components/UserCard.vue'

@Options({
  components: { UserCard }
})
export default class Home extends Vue {
  userId: string = ''
}
</script>

<style scoped lang="scss">
.users-search {
  > input {
    padding: 5px;
    margin-bottom: 20px;
    border: 2px solid #adadad;
    border-radius: 4px;
    background-color: #fefefe;
  }

  > .user-card {
    width: 200px;
  }
}
</style>
