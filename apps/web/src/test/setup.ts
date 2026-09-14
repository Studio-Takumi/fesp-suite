import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

import { server } from './msw/server'
import { mockSession, supabaseAuth, testSession } from './supabase'

// Supabase Auth は通信せずに差し替える。既定はログイン済み（個別テストで mockSession(null) などで上書きする）
vi.mock('~/lib/supabase', async () => {
    const { supabaseAuth: auth } = await import('./supabase')
    return { supabase: { auth } }
})

// 未定義のリクエストはテストを失敗させる（APIパスの打ち間違いを検出するため）
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

beforeEach(() => {
    for (const fn of Object.values(supabaseAuth)) fn.mockReset()
    mockSession(testSession)
    supabaseAuth.signOut.mockResolvedValue({ error: null })
})

afterEach(() => {
    cleanup()
    server.resetHandlers()
})

afterAll(() => server.close())
