import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteNotification, getSettings, getStateInstance, queueReady, receiveNotification, sendMessage, setSettings } from './greenApi'
import type { Credentials } from '../model/types'

const credentials: Credentials = {
  apiUrl: 'https://api.green-api.com/',
  idInstance: '1234',
  apiTokenInstance: 'token',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('greenApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('builds send, receive, and delete URLs without a v3 prefix', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ idMessage: 'abc' }))
      .mockResolvedValueOnce(jsonResponse(null))
      .mockResolvedValueOnce(jsonResponse({ result: true }))
    vi.stubGlobal('fetch', fetchMock)

    await sendMessage(credentials, '79001112233@c.us', 'привет')
    await receiveNotification(credentials)
    await deleteNotification(credentials, 55)

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.green-api.com/waInstance1234/sendMessage/token')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ chatId: '79001112233@c.us', message: 'привет' }),
    })
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.green-api.com/waInstance1234/receiveNotification/token')
    expect(fetchMock.mock.calls[2][0]).toBe('https://api.green-api.com/waInstance1234/deleteNotification/token/55')
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'DELETE' })
  })

  it('returns null for an empty notification and the receipt otherwise', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(null))
      .mockResolvedValueOnce(jsonResponse({ receiptId: 7, body: { typeWebhook: 'stateInstanceChanged' } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(receiveNotification(credentials)).resolves.toBeNull()
    await expect(receiveNotification(credentials)).resolves.toEqual({
      receiptId: 7,
      body: { typeWebhook: 'stateInstanceChanged' },
    })
  })

  it('knows when the HTTP API queue is ready', () => {
    expect(queueReady({
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
    })).toBe(true)
    expect(queueReady({ webhookUrl: 'https://example.test', incomingWebhook: 'yes' })).toBe(false)
    expect(queueReady(null)).toBe(false)
  })

  it('posts the fixed settings body and reads state', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ stateInstance: 'starting' }))
      .mockResolvedValueOnce(jsonResponse({ incomingWebhook: 'no' }))
      .mockResolvedValueOnce(jsonResponse({ saveSettings: true }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getStateInstance(credentials)).resolves.toBe('starting')
    await expect(getSettings(credentials)).resolves.toMatchObject({ incomingWebhook: 'no' })
    await expect(setSettings(credentials)).resolves.toBe(true)
    const settingsCall = fetchMock.mock.calls[2]
    expect(settingsCall[0]).toBe('https://api.green-api.com/waInstance1234/setSettings/token')
    expect(JSON.parse(String(settingsCall[1].body))).toEqual({
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
    })
  })

  it('throws on an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'denied' }, 403)))
    await expect(sendMessage(credentials, '79001112233@c.us', 'x')).rejects.toMatchObject({ status: 403 })
  })
})
