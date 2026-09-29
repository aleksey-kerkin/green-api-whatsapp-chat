import type { Chat, Credentials } from '../model/types'

const CREDENTIALS_KEY = 'wa-chat:credentials'
const API_URL = 'https://api.green-api.com'

function chatsKey(idInstance: string): string {
  return `wa-chat:chats:${idInstance}`
}

export function loadCredentials(): Credentials | null {
  const raw = localStorage.getItem(CREDENTIALS_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Credentials
    if (!parsed.idInstance || !parsed.apiTokenInstance) return null
    return { ...parsed, apiUrl: API_URL }
  } catch {
    return null
  }
}

export function saveCredentials(credentials: Credentials): void {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
}

export function clearCredentials(): void {
  localStorage.removeItem(CREDENTIALS_KEY)
}

export function loadChats(idInstance: string): Chat[] {
  const raw = localStorage.getItem(chatsKey(idInstance))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Chat[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveChats(idInstance: string, chats: Chat[]): 'ok' | 'quota' {
  try {
    localStorage.setItem(chatsKey(idInstance), JSON.stringify(chats))
    return 'ok'
  } catch {
    return 'quota'
  }
}
