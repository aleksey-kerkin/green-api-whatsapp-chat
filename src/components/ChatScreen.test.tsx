import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatScreen } from './ChatScreen'
import type { Chat } from '../model/types'

const now = new Date(2026, 8, 29, 15, 0).getTime()
const chats: Chat[] = [{
  chatId: '79001112233@c.us',
  phone: '79001112233',
  title: '+79001112233',
  lastMessageAt: now,
  messages: [{ localId: '1', text: 'привет', direction: 'out', timestamp: now, status: 'sent' }],
}]

function renderScreen(narrow: boolean, activeChatId: string | null) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: narrow && query.includes('max-width: 767px'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }))
  return render(
    <ChatScreen
      chats={chats}
      activeChatId={activeChatId}
      stateInstance="notAuthorized"
      showEnableReceive
      storageWarning
      now={now}
      onLogout={vi.fn()}
      onSelect={vi.fn()}
      onCreate={vi.fn()}
      onSend={vi.fn()}
      onRetry={vi.fn()}
      onEnableReceive={vi.fn()}
    />,
  )
}

describe('ChatScreen', () => {
  it('shows the state, storage, and receive banners', () => {
    renderScreen(false, null)
    expect(screen.getByText('Аккаунт не авторизован')).toBeInTheDocument()
    expect(screen.getByText(/после обновления страницы/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Включить получение' })).toBeInTheDocument()
  })

  it('shows a back button on a narrow open chat', () => {
    renderScreen(true, chats[0].chatId)
    expect(screen.getByRole('button', { name: 'Назад' })).toBeInTheDocument()
  })

  it('hides the back button on a wide layout', () => {
    renderScreen(false, chats[0].chatId)
    expect(screen.queryByRole('button', { name: 'Назад' })).not.toBeInTheDocument()
  })
})
