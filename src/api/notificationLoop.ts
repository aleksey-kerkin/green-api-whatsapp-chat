import { deleteNotification, receiveNotification } from './greenApi'
import type { Credentials } from '../model/types'

type Receive = typeof receiveNotification
type Remove = typeof deleteNotification

type Handlers = {
  onBody: (body: unknown) => void
  isHidden: () => boolean
}

type Deps = {
  receive: Receive
  remove: Remove
  sleep: (ms: number) => Promise<void>
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function startNotificationLoop(
  credentials: Credentials,
  handlers: Handlers,
  deps: Deps = { receive: receiveNotification, remove: deleteNotification, sleep: defaultSleep },
): { stop: () => void } {
  const controller = new AbortController()
  let pendingDelete: number | null = null
  let delay = 1000

  const stop = () => controller.abort()

  const run = async () => {
    while (!controller.signal.aborted) {
      if (handlers.isHidden()) return
      try {
        if (pendingDelete !== null) {
          await deps.remove(credentials, pendingDelete, controller.signal)
          pendingDelete = null
          delay = 1000
          continue
        }
        const notice = await deps.receive(credentials, controller.signal)
        delay = 1000
        if (!notice) continue
        handlers.onBody(notice.body)
        pendingDelete = notice.receiptId
      } catch {
        if (controller.signal.aborted) return
        await deps.sleep(delay)
        delay = Math.min(delay * 2, 10_000)
      }
    }
  }

  void run()
  return { stop }
}
