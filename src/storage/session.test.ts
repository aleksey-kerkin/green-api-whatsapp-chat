import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCredentials, loadChats, loadCredentials, saveChats, saveCredentials } from './session'
import type { Chat, Credentials } from '../model/types'

const credentials: Credentials = {
  apiUrl: 'https://api.green-api.com',
  idInstance: '1234',
  apiTokenInstance: 'token',
}

const chat: Chat = {
  chatId: '79001112233@c.us',
  phone: '79001112233',
  title: '+79001112233',
  messages: [],
  lastMessageAt: 1,
}

describe('session', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips credentials and clears only them', () => {
    saveCredentials(credentials)
    saveChats(credentials.idInstance, [chat])
    clearCredentials()
    expect(loadCredentials()).toBeNull()
    expect(loadChats(credentials.idInstance)).toEqual([chat])
  })

  it('replaces broken chat JSON with an empty list', () => {
    localStorage.setItem('wa-chat:chats:1234', '{')
    localStorage.setItem('wa-chat:credentials', JSON.stringify(credentials))
    expect(loadChats('1234')).toEqual([])
    expect(loadCredentials()).toEqual(credentials)
  })

  it('reports a full storage without throwing', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(saveChats('1234', [chat])).toBe('quota')
    setItem.mockRestore()
  })
})
