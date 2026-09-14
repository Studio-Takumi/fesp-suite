import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthForm } from './AuthForm'

const router = { replace: vi.fn() }
let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
    useRouter: () => router,
    useSearchParams: () => searchParams,
}))

const auth = vi.hoisted(() => ({
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
}))

vi.mock('~/lib/supabase', () => ({ supabase: { auth } }))

const session = { access_token: 'token', user: { id: 'user-id', email: 'user@example.com' } }

const errorResponse = (code: string) => ({
    data: { user: null, session: null },
    error: Object.assign(new Error(code), { code }),
})

async function fillForm(submitLabel: string, email: string, password: string) {
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('メールアドレス'), email)
    await user.type(screen.getByLabelText('パスワード'), password)
    await user.click(screen.getByRole('button', { name: submitLabel }))
}

describe('AuthForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        searchParams = new URLSearchParams('redirect=/articles')
        auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    })

    describe('ログイン', () => {
        it('入力が正しくなければ、入力欄の下にエラーを出して送信しない', async () => {
            render(<AuthForm mode='login' />)

            await fillForm('ログイン', 'not-an-email', 'short')

            expect(await screen.findByText('メールアドレスの形式が正しくありません')).toBeInTheDocument()
            expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
            expect(auth.signInWithPassword).not.toHaveBeenCalled()
        })

        it('ログインできたら redirect のパスへ移動する', async () => {
            auth.signInWithPassword.mockResolvedValue({ data: { user: session.user, session }, error: null })
            render(<AuthForm mode='login' />)

            await fillForm('ログイン', 'user@example.com', 'password123')

            await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/articles'))
            expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' })
        })

        it('redirect がサイト内のパスでなければ / へ移動する', async () => {
            searchParams = new URLSearchParams('redirect=//evil.example')
            auth.signInWithPassword.mockResolvedValue({ data: { user: session.user, session }, error: null })
            render(<AuthForm mode='login' />)

            await fillForm('ログイン', 'user@example.com', 'password123')

            await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'))
        })

        it('メールアドレスかパスワードが違えば、そう出す', async () => {
            auth.signInWithPassword.mockResolvedValue(errorResponse('invalid_credentials'))
            render(<AuthForm mode='login' />)

            await fillForm('ログイン', 'user@example.com', 'password123')

            expect(await screen.findByRole('alert')).toHaveTextContent('メールアドレスまたはパスワードが違います')
            expect(router.replace).not.toHaveBeenCalled()
        })

        it('それ以外の失敗は「時間をおいて再度お試しください」と出す', async () => {
            auth.signInWithPassword.mockResolvedValue(errorResponse('unexpected_failure'))
            render(<AuthForm mode='login' />)

            await fillForm('ログイン', 'user@example.com', 'password123')

            expect(await screen.findByRole('alert')).toHaveTextContent('時間をおいて再度お試しください')
        })

        it('Google でログインすると、戻り先に redirect のパスを渡す', async () => {
            auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
            const user = userEvent.setup()
            render(<AuthForm mode='login' />)

            await user.click(screen.getByRole('button', { name: 'Google でログイン' }))

            expect(auth.signInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/articles` },
            })
        })

        it('目のアイコンでパスワードの表示・非表示を切り替える', async () => {
            const user = userEvent.setup()
            render(<AuthForm mode='login' />)

            const password = screen.getByLabelText('パスワード')
            expect(password).toHaveAttribute('type', 'password')

            await user.click(screen.getByRole('button', { name: 'パスワードを表示' }))
            expect(password).toHaveAttribute('type', 'text')
        })

        it('ログイン済みで開いたら、すぐに redirect のパスへ移動する', async () => {
            auth.getSession.mockResolvedValue({ data: { session }, error: null })

            render(<AuthForm mode='login' />)

            await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/articles'))
        })

        it('「新規登録」のリンクは redirect を引き継ぐ', () => {
            render(<AuthForm mode='login' />)

            expect(screen.getByRole('link', { name: '新規登録' })).toHaveAttribute(
                'href',
                '/signup?redirect=%2Farticles',
            )
        })
    })

    describe('新規登録', () => {
        it('パスワードの入力欄の下に文字数の目安を出す', () => {
            render(<AuthForm mode='signup' />)

            expect(screen.getByText('8文字以上で入力してください')).toBeInTheDocument()
        })

        it('登録できたら、そのままログインした状態で redirect のパスへ移動する', async () => {
            auth.signUp.mockResolvedValue({ data: { user: session.user, session }, error: null })
            render(<AuthForm mode='signup' />)

            await fillForm('登録する', 'new@example.com', 'password123')

            await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/articles'))
            expect(auth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'password123' })
        })

        it('登録済みのメールアドレスなら、そう出す', async () => {
            auth.signUp.mockResolvedValue(errorResponse('user_already_exists'))
            render(<AuthForm mode='signup' />)

            await fillForm('登録する', 'used@example.com', 'password123')

            expect(await screen.findByRole('alert')).toHaveTextContent('このメールアドレスは登録済みです')
        })

        it('「ログイン」のリンクは redirect を引き継ぐ', () => {
            render(<AuthForm mode='signup' />)

            expect(screen.getByRole('link', { name: 'ログイン' })).toHaveAttribute(
                'href',
                '/login?redirect=%2Farticles',
            )
        })
    })
})
