import { readFileSync } from 'node:fs'
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

  it('styles the form like the chat header', () => {
    const moduleUrl = import.meta.url
    const css = readFileSync(new URL('./NewChatDialog.module.css', moduleUrl), 'utf8')
    const heading = css.slice(css.indexOf('.heading {'), css.indexOf('.body {'))
    const field = css.slice(css.indexOf('.input {'), css.indexOf('.error {'))
    const submit = css.slice(css.indexOf('.submit {'), css.indexOf('.submit:hover {'))
    expect(heading).toContain('background: #f0f2f5')
    expect(field).toContain('border-radius: 0.5rem')
    expect(field).toContain('1px solid #d1d7db')
    expect(submit).toContain('background: #00a884')
    expect(submit).toContain('border-radius: 999em')
    expect(submit).toMatch(/padding:\s*[\d.]+em\s+[\d.]+em/)
    expect(css.replaceAll('1px', '')).not.toContain('px')
  })
})
