import type { FeedEvent } from './notifications'
import type { PhoneOk } from './phone'
import type { Chat, DeliveryStatus, Message } from './types'
import { MESSAGE_LIMIT } from './types'

const RANK: Record<'pending' | 'sent' | 'delivered' | 'read', number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

function isError(status: DeliveryStatus | undefined): boolean {
  return status === 'failed' || status === 'noActiveSession'
}

function mapChat(chats: Chat[], chatId: string, update: (chat: Chat) => Chat): Chat[] {
  return chats.map((chat) => (chat.chatId === chatId ? update(chat) : chat))
}

function withMessage(chat: Chat, localId: string, update: (message: Message) => Message): Chat {
  return { ...chat, messages: chat.messages.map((message) => (message.localId === localId ? update(message) : message)) }
}

export function sortedChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => b.lastMessageAt - a.lastMessageAt)
}

export function openChat(chats: Chat[], phone: PhoneOk, now: number): { chats: Chat[]; activeChatId: string } {
  const existing = chats.find((chat) => chat.chatId === phone.chatId)
  if (existing) return { chats, activeChatId: existing.chatId }
  const chat: Chat = {
    chatId: phone.chatId,
    phone: phone.phone,
    title: phone.title,
    messages: [],
    lastMessageAt: now,
  }
  return { chats: [...chats, chat], activeChatId: chat.chatId }
}

export function sendText(chats: Chat[], chatId: string, text: string, now: number, localId: string): Chat[] {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > MESSAGE_LIMIT) return chats
  return mapChat(chats, chatId, (chat) => ({
    ...chat,
    lastMessageAt: now,
    messages: [...chat.messages, {
      localId,
      text: trimmed,
      direction: 'out',
      timestamp: now,
      status: 'pending',
    }],
  }))
}

export function applySendResult(
  chats: Chat[],
  localId: string,
  result: { ok: true; idMessage: string } | { ok: false; description: string },
): Chat[] {
  return chats.map((chat) => withMessage(chat, localId, (message) => {
    if (!result.ok) return { ...message, status: 'failed', description: result.description }
    return {
      ...message,
      idMessage: result.idMessage,
      status: message.status === 'pending' || !message.status ? 'sent' : message.status,
    }
  }))
}

export function retryMessage(chats: Chat[], localId: string): Chat[] {
  return chats.map((chat) => withMessage(chat, localId, (message) => {
    const next = { ...message, status: 'pending' as const }
    delete next.idMessage
    delete next.description
    return next
  }))
}

function ensureChat(chats: Chat[], chatId: string, timestamp: number, senderName?: string): Chat[] {
  if (chats.some((chat) => chat.chatId === chatId)) {
    if (!senderName?.trim()) return chats
    return mapChat(chats, chatId, (chat) => ({ ...chat, title: senderName }))
  }
  const phone = chatId.replace(/@c\.us$/, '')
  return [...chats, {
    chatId,
    phone,
    title: senderName?.trim() ? senderName : `+${phone}`,
    messages: [],
    lastMessageAt: timestamp,
  }]
}

function hasId(chat: Chat, idMessage: string): boolean {
  return chat.messages.some((message) => message.idMessage === idMessage)
}

export function applyFeedEvent(chats: Chat[], event: FeedEvent): Chat[] {
  if (event.kind === 'skip' || event.kind === 'api-echo') return chats
  if (event.kind === 'status') {
    return mapChat(chats, event.chatId, (chat) => ({
      ...chat,
      messages: chat.messages.map((message) => {
        if (message.idMessage !== event.idMessage) return message
        if (isError(event.status)) return { ...message, status: event.status, description: event.description }
        if (event.status !== 'sent' && event.status !== 'delivered' && event.status !== 'read') return message
        if (isError(message.status)) return message
        const current = message.status ?? 'pending'
        if (current !== 'pending' && current !== 'sent' && current !== 'delivered' && current !== 'read') return message
        if (RANK[event.status] <= RANK[current]) return message
        return { ...message, status: event.status }
      }),
    }))
  }
  const next = ensureChat(chats, event.chatId, event.timestamp, event.senderName)
  return mapChat(next, event.chatId, (chat) => {
    if (hasId(chat, event.idMessage)) return chat
    return {
      ...chat,
      lastMessageAt: event.timestamp,
      messages: [...chat.messages, {
        localId: event.idMessage,
        idMessage: event.idMessage,
        text: event.text,
        direction: 'in',
        timestamp: event.timestamp,
      }],
    }
  })
}
