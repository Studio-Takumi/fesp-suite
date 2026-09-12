import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '~': fileURLToPath(new URL('./', import.meta.url)),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        include: ['{app,components,lib,stores}/**/*.test.{ts,tsx}'],
        exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    },
})
