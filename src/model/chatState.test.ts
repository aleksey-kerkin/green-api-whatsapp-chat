import { describe, expect, it } from 'vitest'
import { applyFeedEvent, applySendResult, openChat, retryMessage, sendText, sortedChats } from './chatState'
import type { Chat } from './types'

const phone = { ok: true as const, phone: '79001112233', chatId: '79001112233@c.us', title: '+79001112233' }

function outgoing(chats: Chat[]) {
  return chats[0].messages[0]
}

describe('chat state', () => {
  it('creates a chat immediately and reopens the same chatId', () => {
    const created = openChat([], phone, 1000)
    expect(created.activeChatId).toBe(phone.chatId)
    expect(created.chats).toHaveLength(1)
    const again = openChat(created.chats, phone, 2000)
    expect(again.chats).toHaveLength(1)
    expect(again.chats[0].lastMessageAt).toBe(1000)
  })

  it('sorts chats from newest activity', () => {
    const older = openChat([], phone, 1000).chats
    const newer = openChat(older, { ...phone, phone: '79002223344', chatId: '79002223344@c.us', title: '+79002223344' }, 5000).chats
    expect(sortedChats(newer).map((chat) => chat.chatId)).toEqual(['79002223344@c.us', phone.chatId])
  })

  it('does not send blank or oversized text', () => {
    const chats = openChat([], phone, 1000).chats
    expect(sendText(chats, phone.chatId, '   ', 2000, 'a')).toBe(chats)
    expect(sendText(chats, phone.chatId, 'x'.repeat(20001), 2000, 'b')).toBe(chats)
  })

  it('keeps one bubble, upgrades ticks, and refuses to move backwards', () => {
    let chats = sendText(openChat([], phone, 1000).chats, phone.chatId, '  привет  ', 2000, 'local-1')
    expect(outgoing(chats)).toMatchObject({ text: 'привет', status: 'pending', direction: 'out' })
    chats = applySendResult(chats, 'local-1', { ok: true, idMessage: 'srv-1' })
    expect(outgoing(chats).status).toBe('sent')
    chats = applyFeedEvent(chats, { kind: 'status', chatId: phone.chatId, idMessage: 'srv-1', status: 'delivered', timestamp: 3000 })
    chats = applyFeedEvent(chats, { kind: 'status', chatId: phone.chatId, idMessage: 'srv-1', status: 'sent', timestamp: 4000 })
    expect(outgoing(chats).status).toBe('delivered')
    chats = applyFeedEvent(chats, { kind: 'status', chatId: phone.chatId, idMessage: 'srv-1', status: 'read', timestamp: 5000 })
    expect(outgoing(chats).status).toBe('read')
  })

  it('replaces idMessage on retry so an old status cannot return', () => {
    let chats = applySendResult(
      sendText(openChat([], phone, 1000).chats, phone.chatId, 'ещё раз', 2000, 'local-1'),
      'local-1',
      { ok: false, description: 'сеть' },
    )
    expect(outgoing(chats)).toMatchObject({ status: 'failed', description: 'сеть' })
    chats = retryMessage(chats, 'local-1')
    expect(outgoing(chats).status).toBe('pending')
    expect(outgoing(chats).idMessage).toBeUndefined()
    chats = applySendResult(chats, 'local-1', { ok: true, idMessage: 'srv-2' })
    chats = applyFeedEvent(chats, { kind: 'status', chatId: phone.chatId, idMessage: 'srv-1', status: 'failed', timestamp: 9000, description: 'старое' })
    expect(outgoing(chats)).toMatchObject({ status: 'sent', idMessage: 'srv-2' })
  })

  it('adds an incoming text once and ignores the API echo', () => {
    let chats = applyFeedEvent([], {
      kind: 'incoming-text',
      chatId: '79005556677@c.us',
      idMessage: 'in-1',
      text: 'ответ',
      timestamp: 8000,
      senderName: 'Аня',
    })
    chats = applyFeedEvent(chats, {
      kind: 'incoming-text',
      chatId: '79005556677@c.us',
      idMessage: 'in-1',
      text: 'ответ',
      timestamp: 8000,
      senderName: 'Аня',
    })
    expect(chats).toHaveLength(1)
    expect(chats[0].title).toBe('Аня')
    expect(chats[0].messages).toHaveLength(1)
    const echoed = applyFeedEvent(chats, { kind: 'api-echo', chatId: '79005556677@c.us', idMessage: 'in-1', text: 'ответ', timestamp: 8000 })
    expect(echoed[0].messages).toHaveLength(1)
    const skipped = applyFeedEvent(chats, { kind: 'skip' })
    expect(skipped).toBe(chats)
  })

  it('stores noActiveSession on the matching outgoing message', () => {
    let chats = applySendResult(
      sendText(openChat([], phone, 1000).chats, phone.chatId, 'вне окна', 2000, 'local-1'),
      'local-1',
      { ok: true, idMessage: 'srv-1' },
    )
    chats = applyFeedEvent(chats, {
      kind: 'status',
      chatId: phone.chatId,
      idMessage: 'srv-1',
      status: 'noActiveSession',
      timestamp: 3000,
      description: 'окно закрыто',
    })
    expect(outgoing(chats)).toMatchObject({ status: 'noActiveSession', description: 'окно закрыто' })
  })
})
