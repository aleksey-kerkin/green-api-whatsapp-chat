import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const repository = process.env.GITHUB_REPOSITORY
const base = repository ? `/${repository.split('/')[1]}/` : '/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    passWithNoTests: true,
  },
})
