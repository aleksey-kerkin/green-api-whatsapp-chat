import { describe, expect, it } from 'vitest'
import { parseNotification } from './notifications'

const textBody = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1588091580,
  idMessage: 'IN-1',
  senderData: {
    chatId: '79001234568@c.us',
    senderName: 'GREEN-API',
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет' },
  },
}

describe('parseNotification', () => {
  it('reads an incoming personal text', () => {
    expect(parseNotification(textBody)).toEqual({
      kind: 'incoming-text',
      chatId: '79001234568@c.us',
      idMessage: 'IN-1',
      text: 'Привет',
      timestamp: 1588091580000,
      senderName: 'GREEN-API',
    })
  })

  it('skips a file but the caller still has receiptId outside this function', () => {
    expect(parseNotification({
      ...textBody,
      messageData: { typeMessage: 'imageMessage' },
    })).toEqual({ kind: 'skip' })
  })

  it('skips a group chat and a message sent from the phone', () => {
    expect(parseNotification({
      ...textBody,
      senderData: { chatId: '120363@g.us', senderName: 'Группа' },
    })).toEqual({ kind: 'skip' })
    expect(parseNotification({
      typeWebhook: 'outgoingMessageReceived',
      timestamp: 1588091580,
      idMessage: 'PHONE-1',
      senderData: { chatId: '79001234568@c.us' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'с телефона' } },
    })).toEqual({ kind: 'skip' })
  })

  it('reads an API echo and a delivery status', () => {
    expect(parseNotification({
      typeWebhook: 'outgoingAPIMessageReceived',
      timestamp: 1588091580,
      idMessage: 'API-1',
      senderData: { chatId: '79001234568@c.us' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'эхо' } },
    })).toMatchObject({ kind: 'api-echo', idMessage: 'API-1', text: 'эхо' })

    expect(parseNotification({
      typeWebhook: 'outgoingMessageStatus',
      timestamp: 1586700802,
      idMessage: 'API-1',
      chatId: '79001234568@c.us',
      status: 'read',
    })).toEqual({
      kind: 'status',
      chatId: '79001234568@c.us',
      idMessage: 'API-1',
      status: 'read',
      timestamp: 1586700802000,
    })
  })

  it('keeps failed and noActiveSession descriptions and skips unknown statuses', () => {
    expect(parseNotification({
      typeWebhook: 'outgoingMessageStatus',
      timestamp: 1586700802,
      idMessage: 'API-1',
      chatId: '79001234568@c.us',
      status: 'noActiveSession',
      description: 'окно закрыто',
    })).toMatchObject({ kind: 'status', status: 'noActiveSession', description: 'окно закрыто' })
    expect(parseNotification({
      typeWebhook: 'outgoingMessageStatus',
      timestamp: 1586700802,
      idMessage: 'API-1',
      chatId: '79001234568@c.us',
      status: 'mystery',
    })).toEqual({ kind: 'skip' })
  })

  it('skips broken bodies', () => {
    expect(parseNotification(null)).toEqual({ kind: 'skip' })
    expect(parseNotification('nope')).toEqual({ kind: 'skip' })
  })
})
