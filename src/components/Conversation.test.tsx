import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Conversation } from './Conversation'
import type { Chat } from '../model/types'

const now = new Date(2026, 8, 29, 15, 0).getTime()
const chat: Chat = {
  chatId: '79001112233@c.us',
  phone: '79001112233',
  title: '+79001112233',
  lastMessageAt: now,
  messages: [{
    localId: 'local-1',
    text: 'привет',
    direction: 'out',
    timestamp: now,
    status: 'failed',
    description: 'окно закрыто',
  }],
}

describe('Conversation', () => {
  it('does not send an empty message', async () => {
    const onSend = vi.fn()
    render(<Conversation chat={chat} now={now} onSend={onSend} onRetry={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('retries the same failed bubble', async () => {
    const onRetry = vi.fn()
    render(<Conversation chat={chat} now={now} onSend={vi.fn()} onRetry={onRetry} />)
    expect(screen.getByText('окно закрыто')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(onRetry).toHaveBeenCalledWith('local-1')
  })

  it('sends trimmed text on Enter and keeps a newline on Shift+Enter', async () => {
    const onSend = vi.fn()
    render(<Conversation chat={chat} now={now} onSend={onSend} onRetry={vi.fn()} />)
    const input = screen.getByLabelText('Сообщение')
    await userEvent.type(input, '  ещё{Shift>}{Enter}{/Shift}строка{Enter}')
    expect(onSend).toHaveBeenCalledWith('ещё\nстрока')
  })
})
