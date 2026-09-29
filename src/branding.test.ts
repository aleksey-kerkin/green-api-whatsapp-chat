import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('favicon', () => {
  it('uses the provided WhatsApp SVG', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    expect(html).toContain('href="/favicon.svg"')
    expect(html).toContain('type="image/svg+xml"')
    expect(html).not.toContain('green-api.com')
    expect(html).not.toContain('whatsapp.net')

    const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
    expect(svg).toContain('viewBox="0 0 48 48"')
    expect(svg).toContain('fill="#67C15E"')
  })
})
