import { defineConfig } from 'vitest/config'

/**
 * 既定は Node 環境 + `app.request()` によるサーバー不要のユニットテスト（高速）。
 * 実 workerd での検証が必要になったら @cloudflare/vitest-pool-workers を追加する。
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
})
