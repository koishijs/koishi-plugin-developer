declare module '*.vue' {
  import type { defineComponent } from 'vue'
  const component: ReturnType<defineComponent>
  export default component
}
