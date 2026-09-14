import { act } from 'react'

import type { Session } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthGuard } from './AuthGuard'
import { useSession } from './session-context'

const router = { replace: vi.fn() }

vi.mock('next/navigation', () => ({
    useRouter: () => router,
}))

type AuthCallback = (event: string, session: Session | null) => void

const auth = vi.hoisted(() => ({ onAuthStateChange: vi.fn() }))
const unsubscribe = vi.fn()
let emit: AuthCallback = () => {}

vi.mock('~/lib/supabase', () => ({ supabase: { auth } }))

const session = { access_token: 'token', user: { id: 'user-id', email: 'user@example.com' } } as Session

function SessionEmail() {
    return <p>{useSession()?.user.email}</p>
}

function renderGuard() {
    const queryClient = new QueryClient()
    const clear = vi.spyOn(queryClient, 'clear')
    const utils = render(
        <QueryClientProvider client={queryClient}>
            <AuthGuard>
                <SessionEmail />
            </AuthGuard>
        </QueryClientProvider>,
    )
    return { ...utils, clear }
}

describe('AuthGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        auth.onAuthStateChange.mockImplementation((callback: AuthCallback) => {
            emit = callback
            return { data: { subscription: { unsubscribe } } }
        })
    })

    it('ログインしているかを確かめ終わるまでは何も出さない', () => {
        renderGuard()

        expect(screen.queryByText('user@example.com')).not.toBeInTheDocument()
    })

    it('ログインしていれば中身を出し、セッションを渡す', () => {
        renderGuard()

        act(() => emit('INITIAL_SESSION', session))

        expect(screen.getByText('user@example.com')).toBeInTheDocument()
        expect(router.replace).not.toHaveBeenCalled()
    })

    it('未ログインなら、開こうとしたパスを持ってログインへ移動する', () => {
        window.history.pushState({}, '', '/articles?page=2')
        renderGuard()

        act(() => emit('INITIAL_SESSION', null))

        expect(router.replace).toHaveBeenCalledWith('/login?redirect=%2Farticles%3Fpage%3D2')
        expect(screen.queryByText('user@example.com')).not.toBeInTheDocument()
    })

    it('ログアウトしたら読み込み済みのデータを消し、ログインへ移動する', () => {
        const { clear } = renderGuard()
        act(() => emit('INITIAL_SESSION', session))

        act(() => emit('SIGNED_OUT', null))

        expect(clear).toHaveBeenCalled()
        expect(router.replace).toHaveBeenCalledWith('/login')
        expect(screen.queryByText('user@example.com')).not.toBeInTheDocument()
    })

    it('外すと購読をやめる', () => {
        const { unmount } = renderGuard()

        unmount()

        expect(unsubscribe).toHaveBeenCalled()
    })
})
