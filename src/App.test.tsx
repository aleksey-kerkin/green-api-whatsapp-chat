import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

vi.mock('./api/greenApi', () => ({
  getStateInstance: vi.fn(),
  getSettings: vi.fn(),
  setSettings: vi.fn(),
  sendMessage: vi.fn(),
  queueReady: (settings: unknown) => Boolean(settings && typeof settings === 'object' && (settings as { incomingWebhook?: string }).incomingWebhook === 'yes'),
}))

vi.mock('./api/notificationLoop', () => ({
  startNotificationLoop: vi.fn(() => ({ stop: vi.fn() })),
}))

import { getSettings, getStateInstance, setSettings } from './api/greenApi'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getStateInstance).mockReset()
    vi.mocked(getSettings).mockReset()
    vi.mocked(setSettings).mockReset()
  })

  it('does not call setSettings while logging in', async () => {
    vi.mocked(getStateInstance).mockResolvedValue('authorized')
    vi.mocked(getSettings).mockResolvedValue({ incomingWebhook: 'no' })
    render(<App />)
    await userEvent.type(screen.getByLabelText('idInstance'), '1234')
    await userEvent.type(screen.getByLabelText('apiTokenInstance'), 'token')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByRole('button', { name: 'Выйти' })).toBeInTheDocument()
    expect(setSettings).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Включить получение' })).toBeInTheDocument()
  })
})
