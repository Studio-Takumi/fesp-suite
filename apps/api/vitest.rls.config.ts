import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

import { defineConfig } from 'vitest/config'

/**
 * RLS の結合テスト（`bun run test:rls`）。
 * fesp-dev に一時的なユーザー・イベントを作り、ユーザーのトークンで PostgREST を叩いて確かめる。終わったら消す。
 * `.dev.vars` の SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY を使うので、CI では動かさない。
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['rls/**/*.test.ts'],
        env: parseEnv(readFileSync('.dev.vars', 'utf8')) as Record<string, string>,
        // 同じ開発用 DB を使うので、ファイルを並列に走らせない
        fileParallelism: false,
        testTimeout: 30_000,
        hookTimeout: 120_000,
    },
})
