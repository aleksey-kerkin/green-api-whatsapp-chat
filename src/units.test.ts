import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const stylesheets = [
  './index.css',
  './components/LoginScreen.module.css',
  './components/ChatScreen.module.css',
  './components/Conversation.module.css',
  './components/NewChatDialog.module.css',
]

function forbiddenPixels(css: string): string[] {
  const withoutHairlines = css.replaceAll('0.5px', '').replaceAll('1px', '')
  return withoutHairlines.match(/-?\d*\.?\d+px/g) ?? []
}

describe('css units', () => {
  it('keeps only hairline px lengths', () => {
    const moduleUrl = import.meta.url
    for (const path of stylesheets) {
      const css = readFileSync(new URL(path, moduleUrl), 'utf8')
      expect(forbiddenPixels(css), path).toEqual([])
    }
  })
})
