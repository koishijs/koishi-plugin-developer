import { expect, use } from 'chai'
import cap from 'chai-as-promised'
use(cap)

const sumOfTwoNum = (one: number, two: number) => one + two
const asyncSumOfTwoNum = async (one: number, two: number) => new Promise<number>(resolve => {
  setTimeout(() => resolve(one + two), 2000)
})

describe('common test', function () {
  // set async timeout
  this.timeout(3000)

  ; it('should return `1 + 1` val', async () => {
    expect(
      sumOfTwoNum(1, 1)
    ).to.eq(2)
  })

  ; it('should async return `1 + 1` val', async () => {
    await expect(
      asyncSumOfTwoNum(1, 1)
    ).to.eventually.eq(2)
  })
})
