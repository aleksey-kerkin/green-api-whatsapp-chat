import { useCallback, useEffect, useRef, useState } from 'react'
import { GreenApiError, sendMessage, setSettings } from './api/greenApi'
import { startNotificationLoop } from './api/notificationLoop'
import { ChatScreen } from './components/ChatScreen'
import { LoginScreen } from './components/LoginScreen'
import {
  applyFeedEvent,
  applySendResult,
  openChat,
  retryMessage,
  sendText,
} from './model/chatState'
import { parseNotification } from './model/notifications'
import type { PhoneOk } from './model/phone'
import type { Chat, Credentials } from './model/types'
import {
  clearCredentials,
  loadChats,
  saveChats,
  saveCredentials,
} from './storage/session'

function findOutgoingMessage(
  chats: Chat[],
  localId: string,
): { chatId: string; text: string } | null {
  for (const chat of chats) {
    for (const message of chat.messages) {
      if (message.localId === localId && message.direction === 'out') {
        return { chatId: chat.chatId, text: message.text }
      }
    }
  }
  return null
}

function sendFailureDescription(error: unknown): string {
  if (error instanceof GreenApiError) {
    return error.message || 'Ошибка отправки'
  }
  return 'Не удалось отправить сообщение'
}

export function App() {
  const [screen, setScreen] = useState<'login' | 'chat'>('login')
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [stateInstance, setStateInstance] = useState('')
  const [queueReady, setQueueReady] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [storageWarning, setStorageWarning] = useState(false)
  const [enableReceiveError, setEnableReceiveError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const loopRef = useRef<{ stop: () => void } | null>(null)
  const credentialsRef = useRef(credentials)
  const screenRef = useRef(screen)
  const chatsRef = useRef(chats)

  credentialsRef.current = credentials
  screenRef.current = screen
  chatsRef.current = chats

  const persist = useCallback((next: Chat[]) => {
    const creds = credentialsRef.current
    if (creds) {
      setStorageWarning(saveChats(creds.idInstance, next) === 'quota')
    }
    setChats(next)
  }, [])

  const stopLoop = useCallback(() => {
    loopRef.current?.stop()
    loopRef.current = null
  }, [])

  const startLoop = useCallback(() => {
    const creds = credentialsRef.current
    if (!creds || screenRef.current !== 'chat' || loopRef.current) return
    loopRef.current = startNotificationLoop(creds, {
      onBody: (body) => {
        const event = parseNotification(body)
        const next = applyFeedEvent(chatsRef.current, event)
        persist(next)
      },
      isHidden: () => document.hidden,
    })
  }, [persist])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (screen !== 'chat' || !credentials) {
      stopLoop()
      return
    }
    startLoop()
    return () => stopLoop()
  }, [screen, credentials, startLoop, stopLoop])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopLoop()
        return
      }
      if (screenRef.current === 'chat' && credentialsRef.current) {
        startLoop()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [startLoop, stopLoop])

  function handleLoginSuccess(
    nextCredentials: Credentials,
    nextStateInstance: string,
    ready: boolean,
  ) {
    saveCredentials(nextCredentials)
    setCredentials(nextCredentials)
    setStateInstance(nextStateInstance)
    setQueueReady(ready)
    setChats(loadChats(nextCredentials.idInstance))
    setActiveChatId(null)
    setStorageWarning(false)
    setEnableReceiveError('')
    setScreen('chat')
  }

  function handleLogout() {
    stopLoop()
    clearCredentials()
    setCredentials(null)
    setStateInstance('')
    setQueueReady(false)
    setChats([])
    setActiveChatId(null)
    setStorageWarning(false)
    setEnableReceiveError('')
    setScreen('login')
  }

  function handleSelect(chatId: string) {
    setActiveChatId(chatId ? chatId : null)
  }

  function handleCreate(phone: PhoneOk) {
    const result = openChat(chats, phone, Date.now())
    persist(result.chats)
    setActiveChatId(result.activeChatId)
  }

  async function handleSend(text: string) {
    if (!credentials || !activeChatId) return
    const localId = crypto.randomUUID()
    const timestamp = Date.now()
    const withPending = sendText(chats, activeChatId, text, timestamp, localId)
    persist(withPending)
    try {
      const trimmed = text.trim()
      const idMessage = await sendMessage(credentials, activeChatId, trimmed)
      persist(applySendResult(withPending, localId, { ok: true, idMessage }))
    } catch (error) {
      persist(
        applySendResult(withPending, localId, {
          ok: false,
          description: sendFailureDescription(error),
        }),
      )
    }
  }

  async function handleRetry(localId: string) {
    if (!credentials) return
    const outgoing = findOutgoingMessage(chats, localId)
    if (!outgoing) return
    const retried = retryMessage(chats, localId)
    persist(retried)
    try {
      const idMessage = await sendMessage(credentials, outgoing.chatId, outgoing.text)
      persist(applySendResult(retried, localId, { ok: true, idMessage }))
    } catch (error) {
      persist(
        applySendResult(retried, localId, {
          ok: false,
          description: sendFailureDescription(error),
        }),
      )
    }
  }

  async function handleEnableReceive() {
    if (!credentials) return
    setEnableReceiveError('')
    try {
      const saved = await setSettings(credentials)
      if (saved) {
        setQueueReady(true)
        return
      }
      setEnableReceiveError('Не удалось включить получение')
    } catch {
      setEnableReceiveError('Не удалось включить получение')
    }
  }

  if (screen === 'login') {
    return <LoginScreen onSuccess={handleLoginSuccess} />
  }

  if (!credentials) {
    return <LoginScreen onSuccess={handleLoginSuccess} />
  }

  return (
    <>
      {enableReceiveError ? (
        <p role="alert">{enableReceiveError}</p>
      ) : null}
      <ChatScreen
        chats={chats}
        activeChatId={activeChatId}
        stateInstance={stateInstance}
        showEnableReceive={!queueReady}
        storageWarning={storageWarning}
        now={now}
        onLogout={handleLogout}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onSend={handleSend}
        onRetry={handleRetry}
        onEnableReceive={handleEnableReceive}
      />
    </>
  )
}
