import { useEffect, useState } from 'react'
import { sortedChats } from '../model/chatState'
import { formatChatTime } from '../model/time'
import type { Chat } from '../model/types'
import type { PhoneOk } from '../model/phone'
import { Conversation } from './Conversation'
import { NewChatDialog } from './NewChatDialog'
import { avatarLabel } from './avatarLabel'
import styles from './ChatScreen.module.css'

const NARROW_QUERY = '(max-width: 767px)'

const AVATAR_COLORS = ['#00a884', '#53bdeb', '#e67e22', '#7f66ff', '#ff5c8d', '#027eb5']

function avatarColor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash + char.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0]
}

type Props = {
  chats: Chat[]
  activeChatId: string | null
  stateInstance: string
  showEnableReceive: boolean
  storageWarning: boolean
  now: number
  onLogout: () => void
  onSelect: (chatId: string) => void
  onCreate: (phone: PhoneOk) => void
  onSend: (text: string) => void
  onRetry: (localId: string) => void
  onEnableReceive: () => void
}

function stateBannerText(stateInstance: string): string | null {
  if (stateInstance === 'authorized') return null
  if (stateInstance === 'notAuthorized') return 'Аккаунт не авторизован'
  if (stateInstance === 'starting') return 'Аккаунт запускается. Это может занять до 5 минут.'
  return stateInstance
}

export function ChatScreen({
  chats,
  activeChatId,
  stateInstance,
  showEnableReceive,
  storageWarning,
  now,
  onLogout,
  onSelect,
  onCreate,
  onSend,
  onRetry,
  onEnableReceive,
}: Props) {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW_QUERY).matches)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(NARROW_QUERY)
    const onChange = () => setNarrow(media.matches)
    setNarrow(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const showList = !narrow || !activeChatId
  const showConversation = !narrow || Boolean(activeChatId)
  const activeChat = activeChatId
    ? chats.find((chat) => chat.chatId === activeChatId) ?? null
    : null
  const stateText = stateBannerText(stateInstance)
  const ordered = sortedChats(chats)

  return (
    <div className={styles.screen}>
      <aside className={showList ? styles.sidebar : styles.sidebarHidden}>
        <div className={styles.toolbar}>
          <button type="button" onClick={onLogout}>Выйти</button>
          <button type="button" onClick={() => setDialogOpen(true)}>Новый чат</button>
        </div>
        <div className={styles.banners}>
          {storageWarning ? (
            <p className={`${styles.banner} ${styles.bannerWarning}`}>
              Не удалось сохранить переписку. После обновления страницы она пропадёт.
            </p>
          ) : null}
          {stateText ? (
            <p className={`${styles.banner} ${styles.bannerState}`}>{stateText}</p>
          ) : null}
          {showEnableReceive ? (
            <div className={`${styles.banner} ${styles.bannerReceive}`}>
              <span>Очередь HTTP API выключена</span>
              <button type="button" onClick={onEnableReceive}>Включить получение</button>
            </div>
          ) : null}
        </div>
        <ul className={styles.chatList}>
          {ordered.map((chat) => {
            const lastMessage = chat.messages.length > 0
              ? chat.messages[chat.messages.length - 1]
              : null
            const isActive = chat.chatId === activeChatId
            return (
              <li key={chat.chatId}>
                <button
                  type="button"
                  className={isActive ? `${styles.chatRow} ${styles.chatRowActive}` : styles.chatRow}
                  onClick={() => onSelect(chat.chatId)}
                >
                  <span
                    className={styles.avatar}
                    data-avatar=""
                    style={{ background: avatarColor(chat.chatId) }}
                    aria-hidden="true"
                  >
                    {avatarLabel(chat.title)}
                  </span>
                  <div className={styles.chatMain}>
                    <div className={styles.chatRowTop}>
                      <span className={styles.chatTitle}>{chat.title}</span>
                      {lastMessage ? (
                        <time className={styles.chatTime}>
                          {formatChatTime(lastMessage.timestamp, now)}
                        </time>
                      ) : null}
                    </div>
                    <span className={styles.chatPreview}>
                      {lastMessage ? lastMessage.text : 'Нет сообщений'}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
      <section className={showConversation ? styles.conversationPane : styles.conversationPaneHidden}>
        {narrow && activeChatId ? (
          <div className={styles.backBar}>
            <button type="button" className={styles.backButton} onClick={() => onSelect('')}>
              Назад
            </button>
          </div>
        ) : null}
        <div className={styles.conversationBody}>
          <Conversation
            chat={activeChat}
            now={now}
            onSend={onSend}
            onRetry={onRetry}
          />
        </div>
      </section>
      {dialogOpen ? (
        <NewChatDialog
          onClose={() => setDialogOpen(false)}
          onCreate={(phone) => {
            setDialogOpen(false)
            onCreate(phone)
          }}
        />
      ) : null}
    </div>
  )
}
