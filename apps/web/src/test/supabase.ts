import type { Session } from '@supabase/supabase-js'
import { vi } from 'vitest'

export const testSession = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 4102444800,
    user: {
        id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
        aud: 'authenticated',
        email: 'user@example.com',
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-09-15T01:00:00Z',
    },
} satisfies Session

/** `~/lib/supabase` の `supabase.auth` の代わり（test/setup.ts で差し替える） */
export const supabaseAuth = {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
}

/** `getSession` が返すセッションを決める。`null` で未ログイン */
export function mockSession(session: Session | null) {
    supabaseAuth.getSession.mockResolvedValue({ data: { session }, error: null })
}

/** ログインに成功したときの応答。以降の `getSession` もログイン済みになる */
export function signedInResponse() {
    mockSession(testSession)
    return { data: { user: testSession.user, session: testSession }, error: null }
}

/** Supabase Auth のエラー応答 */
export function authErrorResponse(code: string) {
    return { data: { user: null, session: null }, error: Object.assign(new Error(code), { code }) }
}
