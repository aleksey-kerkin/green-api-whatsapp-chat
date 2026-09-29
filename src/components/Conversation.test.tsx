import { readFileSync } from 'node:fs'
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

  it('renders messages in order inside a bottom-aligned stack', () => {
    const transcript: Chat = {
      ...chat,
      messages: [
        chat.messages[0],
        {
          localId: 'local-2',
          text: 'ответ',
          direction: 'in',
          timestamp: now,
        },
      ],
    }
    render(<Conversation chat={transcript} now={now} onSend={vi.fn()} onRetry={vi.fn()} />)
    const stack = screen.getByTestId('message-stack')
    const list = screen.getByTestId('message-list')
    expect(list).toContainElement(stack)
    expect(stack.textContent?.indexOf('привет')).toBeLessThan(stack.textContent?.indexOf('ответ') ?? -1)
    expect(screen.getByLabelText('ошибка')).toHaveTextContent('ошибка')
  })

  it('names the conversation header and the send control', () => {
    render(<Conversation chat={chat} now={now} onSend={vi.fn()} onRetry={vi.fn()} />)
    expect(screen.getByRole('heading', { name: '+79001112233' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeInTheDocument()
    expect(screen.getByLabelText('Сообщение')).toBeInTheDocument()
  })

  it('caps the message field with the lh unit', () => {
    const moduleUrl = import.meta.url
    const css = readFileSync(new URL('./Conversation.module.css', moduleUrl), 'utf8')
    const rule = css.slice(css.indexOf('.textarea {'), css.indexOf('.send {'))
    expect(rule).toContain('field-sizing: content')
    expect(rule).toContain('min-height: 1lh')
    expect(rule).toContain('max-height: 6lh')
    expect(rule).not.toMatch(/max-height:\s*\d+px/)
  })

  it('keeps the full title on the header and scrolls the transcript inside the message list', () => {
    const longTitle = 'Anastasia Anastasia Kerkina'
    render(
      <Conversation
        chat={{ ...chat, title: longTitle }}
        now={now}
        onSend={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    const heading = screen.getByRole('heading', { name: longTitle })
    expect(heading).toHaveAttribute('title', longTitle)
    expect(heading).toHaveTextContent(longTitle)

    const moduleUrl = import.meta.url
    const css = readFileSync(new URL('./Conversation.module.css', moduleUrl), 'utf8')
    const headerTitle = css.slice(css.indexOf('.headerTitle {'), css.indexOf('.messages {'))
    const messages = css.slice(css.indexOf('.messages {'), css.indexOf('.messagesStack {'))
    const stack = css.slice(css.indexOf('.messagesStack {'), css.indexOf('.bubbleOut,'))
    expect(headerTitle).toContain('min-width: 0')
    expect(headerTitle).toContain('flex: 1')
    expect(headerTitle).toContain('text-overflow: ellipsis')
    expect(messages).toContain('overflow-y: auto')
    expect(messages).not.toContain('display: flex')
    expect(stack).toContain('justify-content: flex-end')
    expect(stack).toContain('min-height: 100%')
  })
})
