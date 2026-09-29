import { useState, type KeyboardEvent } from 'react'
import { formatChatTime } from '../model/time'
import type { Chat, DeliveryStatus, Message } from '../model/types'
import { MESSAGE_LIMIT } from '../model/types'
import styles from './Conversation.module.css'

type Props = {
  chat: Chat | null
  now: number
  onSend: (text: string) => void
  onRetry: (localId: string) => void
}

function statusAriaLabel(status: DeliveryStatus | undefined): string | undefined {
  if (!status) return undefined
  switch (status) {
    case 'pending':
      return 'ожидает'
    case 'sent':
      return 'отправлено'
    case 'delivered':
      return 'доставлено'
    case 'read':
      return 'прочитано'
    case 'failed':
    case 'noActiveSession':
      return 'ошибка'
    default:
      return undefined
  }
}

function MessageBubble({
  message,
  now,
  onRetry,
}: {
  message: Message
  now: number
  onRetry: (localId: string) => void
}) {
  const isOut = message.direction === 'out'
  const status = message.status
  const isError = status === 'failed' || status === 'noActiveSession'
  const ariaLabel = isOut ? statusAriaLabel(status) : undefined

  return (
    <div
      className={isOut ? styles.bubbleOut : styles.bubbleIn}
      data-testid="message-bubble"
    >
      <p className={styles.messageText}>{message.text}</p>
      <div className={styles.messageMeta}>
        <time className={styles.messageTime}>{formatChatTime(message.timestamp, now)}</time>
        {isOut && ariaLabel ? (
          <span
            className={status === 'read' ? styles.statusRead : isError ? styles.statusError : styles.status}
            aria-label={ariaLabel}
          >
            {ariaLabel}
          </span>
        ) : null}
      </div>
      {isOut && isError ? (
        <div className={styles.errorBlock}>
          {message.description ? (
            <p className={styles.errorText}>{message.description}</p>
          ) : null}
          <button type="button" onClick={() => onRetry(message.localId)}>
            Повторить
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Conversation({ chat, now, onSend, onRetry }: Props) {
  const [value, setValue] = useState('')

  const trimmed = value.trim()
  const overLimit = value.length > MESSAGE_LIMIT
  const sendDisabled = trimmed.length === 0 || overLimit

  function send() {
    if (sendDisabled) return
    onSend(trimmed)
    setValue('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  if (!chat) {
    return (
      <div className={styles.empty}>
        <p>Выберите чат или создайте новый</p>
      </div>
    )
  }

  return (
    <div className={styles.conversation}>
      <header className={styles.header}>
        <h2>{chat.title}</h2>
      </header>
      <div className={styles.messages}>
        {chat.messages.map((message) => (
          <MessageBubble
            key={message.localId}
            message={message}
            now={now}
            onRetry={onRetry}
          />
        ))}
      </div>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          send()
        }}
      >
        <textarea
          className={styles.textarea}
          aria-label="Сообщение"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {overLimit ? (
          <p className={styles.counter}>{value.length} / 20000</p>
        ) : null}
        <button type="submit" disabled={sendDisabled}>
          Отправить
        </button>
      </form>
    </div>
  )
}
