import { describe, expect, it, vi } from 'vitest'
import { startNotificationLoop } from './notificationLoop'
import type { Credentials } from '../model/types'

const credentials: Credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '1',
  apiTokenInstance: 't',
}

describe('startNotificationLoop', () => {
  it('deletes a notification before receiving the next one', async () => {
    const calls: string[] = []
    let stopped = false
    const receive = vi.fn(async () => {
      calls.push('receive')
      if (calls.filter((call) => call === 'receive').length === 1) {
        return { receiptId: 5, body: { hello: true } }
      }
      stopped = true
      return null
    })
    const remove = vi.fn(async () => {
      calls.push('delete')
    })
    const loop = startNotificationLoop(credentials, {
      onBody: () => calls.push('body'),
      isHidden: () => stopped,
    }, { receive, remove, sleep: async () => undefined })
    await vi.waitFor(() => expect(calls).toEqual(['receive', 'body', 'delete', 'receive']))
    loop.stop()
  })

  it('does not receive again until delete succeeds', async () => {
    const calls: string[] = []
    let deletes = 0
    const receive = vi.fn(async () => {
      calls.push('receive')
      return { receiptId: 5, body: { hello: true } }
    })
    const remove = vi.fn(async () => {
      deletes += 1
      calls.push(`delete-${deletes}`)
      if (deletes === 1) throw new Error('network')
    })
    const loop = startNotificationLoop(credentials, {
      onBody: () => undefined,
      isHidden: () => deletes > 1,
    }, { receive, remove, sleep: async () => undefined })
    await vi.waitFor(() => expect(calls).toEqual(['receive', 'delete-1', 'delete-2']))
    expect(receive).toHaveBeenCalledTimes(1)
    loop.stop()
  })
})
