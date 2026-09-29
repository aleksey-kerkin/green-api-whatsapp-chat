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

  it('stop() during an in-flight receive aborts the receive signal and does not receive again', async () => {
    const receive = vi.fn(async (_credentials, signal) => {
      await new Promise<void>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      })
      return null
    })
    const remove = vi.fn()
    const sleep = vi.fn(async () => undefined)
    const loop = startNotificationLoop(credentials, {
      onBody: () => undefined,
      isHidden: () => false,
    }, { receive, remove, sleep })

    await vi.waitFor(() => expect(receive).toHaveBeenCalledTimes(1))
    const signal = receive.mock.calls[0][1] as AbortSignal
    loop.stop()
    await vi.waitFor(() => expect(signal.aborted).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(receive).toHaveBeenCalledTimes(1)
  })

  it('sleeps with exponential backoff when receive rejects then receives again', async () => {
    let receiveAttempts = 0
    let hidden = false
    const receive = vi.fn(async () => {
      receiveAttempts += 1
      if (receiveAttempts <= 2) throw new Error('network')
      hidden = true
      return null
    })
    const sleep = vi.fn(async () => undefined)
    const remove = vi.fn()
    const loop = startNotificationLoop(credentials, {
      onBody: () => undefined,
      isHidden: () => hidden,
    }, { receive, remove, sleep })

    await vi.waitFor(() => expect(receive).toHaveBeenCalledTimes(3))
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(sleep.mock.calls[0]?.[0]).toBe(1000)
    expect(sleep.mock.calls[1]?.[0]).toBe(2000)
    hidden = true
    loop.stop()
  })

  it('deletes the receipt when onBody throws before the next receive', async () => {
    const calls: string[] = []
    let receiveCount = 0
    let hidden = false
    const receive = vi.fn(async () => {
      receiveCount += 1
      calls.push('receive')
      if (receiveCount === 1) {
        return { receiptId: 7, body: { err: true } }
      }
      hidden = true
      return null
    })
    const remove = vi.fn(async () => {
      calls.push('delete')
    })
    const loop = startNotificationLoop(credentials, {
      onBody: () => {
        calls.push('body')
        throw new Error('handler failed')
      },
      isHidden: () => hidden,
    }, { receive, remove, sleep: async () => undefined })

    await vi.waitFor(() => expect(calls).toEqual(['receive', 'body', 'delete', 'receive']))
    hidden = true
    loop.stop()
  })
})
