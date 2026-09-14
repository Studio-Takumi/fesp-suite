import type { Page } from '@playwright/test'

/** `src/lib/supabase.ts` の storageKey と揃える */
const AUTH_STORAGE_KEY = 'fesp-web-auth'

/** ログイン済みのセッション。有効期限は十分先にして、supabase-js がリフレッシュしに行かないようにする */
export const e2eSession = {
    access_token: 'e2e-access-token',
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 4102444800,
    user: {
        id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'user@example.com',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: '2026-09-15T01:00:00Z',
    },
}

/** ページを開く前に、ログイン済みのセッションを localStorage に入れておく */
export async function signIn(page: Page) {
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
        key: AUTH_STORAGE_KEY,
        value: JSON.stringify(e2eSession),
    })
}
