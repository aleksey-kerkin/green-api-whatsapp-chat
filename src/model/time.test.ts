import { describe, expect, it } from 'vitest'
import { formatChatTime } from './time'

describe('formatChatTime', () => {
  const now = new Date(2026, 8, 29, 15, 4).getTime()

  it('shows hours and minutes on the same day', () => {
    const morning = new Date(2026, 8, 29, 9, 5).getTime()
    expect(formatChatTime(morning, now)).toBe('09:05')
  })

  it('shows day and month on another day', () => {
    const yesterday = new Date(2026, 8, 28, 9, 5).getTime()
    expect(formatChatTime(yesterday, now)).toMatch(/28/)
    expect(formatChatTime(yesterday, now)).toMatch(/сен/i)
  })
})
