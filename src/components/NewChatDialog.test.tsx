import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NewChatDialog } from './NewChatDialog'

describe('NewChatDialog', () => {
  it('shows an error and does not create a short number', async () => {
    const onCreate = vi.fn()
    render(<NewChatDialog onClose={vi.fn()} onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText('Номер телефона'), '123')
    await userEvent.click(screen.getByRole('button', { name: 'Создать чат' }))
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
