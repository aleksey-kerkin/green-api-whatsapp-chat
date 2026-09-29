export type Credentials = {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type DeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'noActiveSession'

export type Message = {
  localId: string
  idMessage?: string
  text: string
  direction: 'in' | 'out'
  timestamp: number
  status?: DeliveryStatus
  description?: string
}

export type Chat = {
  chatId: string
  phone: string
  title: string
  messages: Message[]
  lastMessageAt: number
}

export const MESSAGE_LIMIT = 20000

export const HTTP_API_SETTINGS = {
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingAPIMessageWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
} as const
