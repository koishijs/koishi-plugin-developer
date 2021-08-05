import { App } from 'koishi'
import * as textDialogue from 'koishi-plugin-text-dialogue'

const app = new App({
  bots: []
})
app.plugin(textDialogue, {})

describe('Demo Plugin', () => {
  it('should hello bot', async () => {
  })
})
