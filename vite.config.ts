import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { sharedMockInboxPlugin } from './src/core/mock/sharedMockInboxPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sharedMockInboxPlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
