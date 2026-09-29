import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const modules = [
  './components/LoginScreen.module.css',
  './components/ChatScreen.module.css',
  './components/Conversation.module.css',
  './components/NewChatDialog.module.css',
]

describe('scrollbar', () => {
  it('styles every scrollbar once from the page stylesheet', () => {
    const moduleUrl = import.meta.url
    const page = readFileSync(new URL('./index.css', moduleUrl), 'utf8')
    const bar = page.slice(page.indexOf('scrollbar-width'), page.indexOf('*::-webkit-scrollbar-thumb'))
    expect(page).toContain('scrollbar-width: thin')
    expect(page).toContain('scrollbar-color: #8696a0 transparent')
    expect(page).toContain('background: #8696a0')
    expect(page).toContain('background: transparent')
    expect(bar).toContain('width: 0.375rem')
    expect(bar).toContain('height: 0.375rem')
    for (const path of modules) {
      const css = readFileSync(new URL(path, moduleUrl), 'utf8')
      expect(css, path).not.toContain('scrollbar-color')
      expect(css, path).not.toContain('::-webkit-scrollbar')
    }
  })
})
