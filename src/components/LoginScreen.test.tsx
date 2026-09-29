import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginScreen } from './LoginScreen'

describe('LoginScreen', () => {
  it('does not call the API when the form is empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<LoginScreen onSuccess={vi.fn()} />)
    await userEvent.clear(screen.getByLabelText('apiUrl'))
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Укажите адрес API')
    vi.unstubAllGlobals()
  })

  it('opens the chat when state succeeds and settings fail', async () => {
    const onSuccess = vi.fn()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ stateInstance: 'authorized' }), { status: 200 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch')))
    render(<LoginScreen onSuccess={onSuccess} />)
    await userEvent.type(screen.getByLabelText('idInstance'), '1234')
    await userEvent.type(screen.getByLabelText('apiTokenInstance'), 'token')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))
    expect(onSuccess).toHaveBeenCalledWith(
      { apiUrl: 'https://api.green-api.com', idInstance: '1234', apiTokenInstance: 'token' },
      'authorized',
      false,
    )
    vi.unstubAllGlobals()
  })
})
