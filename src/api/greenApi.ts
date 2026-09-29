import { HTTP_API_SETTINGS, type Credentials } from '../model/types'

export class GreenApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

const RECEIVE_TIMEOUT_MS = 60_000

function endpoint(credentials: Credentials, method: string): string {
  const base = credentials.apiUrl.replace(/\/+$/, '')
  return `${base}/waInstance${encodeURIComponent(credentials.idInstance)}/${method}/${encodeURIComponent(credentials.apiTokenInstance)}`
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!response.ok) throw new GreenApiError(text || response.statusText, response.status)
  if (!text || text === 'null') return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new GreenApiError('Ответ API не JSON', response.status)
  }
}

function linkSignals(signal: AbortSignal | undefined, timeoutMs?: number): AbortSignal | undefined {
  const timeout = timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined
  if (signal && timeout) return AbortSignal.any([signal, timeout])
  return signal ?? timeout
}

async function request(url: string, init: RequestInit, signal?: AbortSignal, timeoutMs?: number): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: linkSignals(signal, timeoutMs) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new GreenApiError(error instanceof Error ? error.message : 'Сеть недоступна')
  }
  return readJson(response)
}

export function queueReady(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') return false
  const value = settings as Record<string, unknown>
  return (Object.keys(HTTP_API_SETTINGS) as (keyof typeof HTTP_API_SETTINGS)[])
    .every((key) => value[key] === HTTP_API_SETTINGS[key])
}

export async function getStateInstance(credentials: Credentials, signal?: AbortSignal): Promise<string> {
  const body = await request(endpoint(credentials, 'getStateInstance'), { method: 'GET' }, signal)
  if (!body || typeof body !== 'object' || typeof (body as { stateInstance?: unknown }).stateInstance !== 'string') {
    throw new GreenApiError('Нет состояния инстанса')
  }
  return (body as { stateInstance: string }).stateInstance
}

export async function getSettings(credentials: Credentials, signal?: AbortSignal): Promise<unknown> {
  return request(endpoint(credentials, 'getSettings'), { method: 'GET' }, signal)
}

export async function setSettings(credentials: Credentials, signal?: AbortSignal): Promise<boolean> {
  const body = await request(endpoint(credentials, 'setSettings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(HTTP_API_SETTINGS),
  }, signal)
  return Boolean(body && typeof body === 'object' && (body as { saveSettings?: unknown }).saveSettings === true)
}

export async function sendMessage(credentials: Credentials, chatId: string, message: string, signal?: AbortSignal): Promise<string> {
  const body = await request(endpoint(credentials, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  }, signal)
  if (!body || typeof body !== 'object' || typeof (body as { idMessage?: unknown }).idMessage !== 'string') {
    throw new GreenApiError('Нет idMessage')
  }
  return (body as { idMessage: string }).idMessage
}

export async function receiveNotification(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<{ receiptId: number; body: unknown } | null> {
  const body = await request(
    endpoint(credentials, 'receiveNotification'),
    { method: 'GET' },
    signal,
    RECEIVE_TIMEOUT_MS,
  )
  if (!body || typeof body !== 'object') return null
  const receiptId = (body as { receiptId?: unknown }).receiptId
  if (typeof receiptId !== 'number') return null
  return { receiptId, body: (body as { body?: unknown }).body }
}

export async function deleteNotification(credentials: Credentials, receiptId: number, signal?: AbortSignal): Promise<void> {
  await request(`${endpoint(credentials, 'deleteNotification')}/${receiptId}`, { method: 'DELETE' }, signal)
}
