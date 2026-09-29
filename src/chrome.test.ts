import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('page chrome', () => {
  it('fills the viewport and does not ask for an API URL', () => {
    const moduleUrl = import.meta.url
    const css = readFileSync(new URL('./index.css', moduleUrl), 'utf8')
    expect(css).not.toContain('::before')
    expect(css).not.toMatch(/#root\s*\{[^}]*padding/)

    const login = readFileSync(new URL('./components/LoginScreen.tsx', moduleUrl), 'utf8')
    expect(login).not.toContain('aria-label="apiUrl"')
    expect(login).toContain('https://api.green-api.com')

    const loginCss = readFileSync(new URL('./components/LoginScreen.module.css', moduleUrl), 'utf8')
    expect(loginCss).toContain('padding: 0')
  })
})
