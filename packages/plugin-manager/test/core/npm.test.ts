import { npmApi } from '../../src/core/NpmApi'
import { expect } from 'chai'

describe('core Npm', function () {
  it('should get may koishi plugins.', async () => {
    const packagePagination = await npmApi.search('koishi-plugin')
    await expect(
      packagePagination.total
    ).to.gte(0)
  })
})
