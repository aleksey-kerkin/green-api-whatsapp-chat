import { describe, expect, it } from 'vitest'
import { parsePhone } from './phone'

describe('parsePhone', () => {
  it('keeps an international number and builds chatId', () => {
    expect(parsePhone('+1 100 123 4567')).toEqual({
      ok: true,
      phone: '11001234567',
      chatId: '11001234567@c.us',
      title: '+11001234567',
    })
  })

  it('replaces a leading 8 on an 11-digit Russian number', () => {
    expect(parsePhone('8 (999) 123-45-67')).toEqual({
      ok: true,
      phone: '79991234567',
      chatId: '79991234567@c.us',
      title: '+79991234567',
    })
  })

  it('rejects numbers shorter than 10 or longer than 15 digits', () => {
    expect(parsePhone('12345').ok).toBe(false)
    expect(parsePhone('1234567890123456').ok).toBe(false)
  })

  it('accepts the length boundaries', () => {
    expect(parsePhone('1234567890').ok).toBe(true)
    expect(parsePhone('123456789012345').ok).toBe(true)
  })
})
