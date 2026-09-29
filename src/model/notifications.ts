export type FeedEvent =
  | {
      kind: 'incoming-text'
      chatId: string
      idMessage: string
      text: string
      timestamp: number
      senderName?: string
    }
  | {
      kind: 'api-echo'
      chatId: string
      idMessage: string
      text: string
      timestamp: number
    }
  | {
      kind: 'status'
      chatId: string
      idMessage: string
      status: 'sent' | 'delivered' | 'read' | 'failed' | 'noActiveSession'
      timestamp: number
      description?: string
    }
  | { kind: 'skip' }

const STATUS = new Set(['sent', 'delivered', 'read', 'failed', 'noActiveSession'])

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function textOf(messageData: Record<string, unknown> | null): string | null {
  if (!messageData || messageData.typeMessage !== 'textMessage') return null
  const data = record(messageData.textMessageData)
  return data && typeof data.textMessage === 'string' ? data.textMessage : null
}

function millis(timestamp: unknown): number {
  return typeof timestamp === 'number' ? timestamp * 1000 : Date.now()
}

export function parseNotification(body: unknown): FeedEvent {
  const root = record(body)
  if (!root || typeof root.typeWebhook !== 'string' || typeof root.idMessage !== 'string') {
    return { kind: 'skip' }
  }
  const sender = record(root.senderData)
  const chatId = typeof root.chatId === 'string'
    ? root.chatId
    : sender && typeof sender.chatId === 'string'
      ? sender.chatId
      : ''
  if (!chatId.endsWith('@c.us')) return { kind: 'skip' }

  if (root.typeWebhook === 'outgoingMessageStatus') {
    if (typeof root.status !== 'string' || !STATUS.has(root.status)) return { kind: 'skip' }
    return {
      kind: 'status',
      chatId,
      idMessage: root.idMessage,
      status: root.status as 'sent' | 'delivered' | 'read' | 'failed' | 'noActiveSession',
      timestamp: millis(root.timestamp),
      description: typeof root.description === 'string' ? root.description : undefined,
    }
  }

  const text = textOf(record(root.messageData))
  if (text === null) return { kind: 'skip' }
  const timestamp = millis(root.timestamp)

  if (root.typeWebhook === 'incomingMessageReceived') {
    const senderName = sender && typeof sender.senderName === 'string' ? sender.senderName : undefined
    return {
      kind: 'incoming-text',
      chatId,
      idMessage: root.idMessage,
      text,
      timestamp,
      senderName: senderName?.trim() ? senderName : undefined,
    }
  }

  if (root.typeWebhook === 'outgoingAPIMessageReceived') {
    return { kind: 'api-echo', chatId, idMessage: root.idMessage, text, timestamp }
  }

  return { kind: 'skip' }
}
