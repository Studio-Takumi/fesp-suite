import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp } from '~/test/render'
import { authErrorResponse, mockSession, signedInResponse, supabaseAuth } from '~/test/supabase'

async function fillForm(email: string, password: string) {
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('メールアドレス'), email)
    await user.type(screen.getByLabelText('パスワード'), password)
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    return user
}

describe('ログインページ', () => {
    beforeEach(() => {
        mockSession(null)
    })

    it('入力が正しくなければ、入力欄の下にエラーを出して送信しない', async () => {
        renderApp('/login')

        await fillForm('not-an-email', 'short')

        expect(await screen.findByText('メールアドレスの形式が正しくありません')).toBeInTheDocument()
        expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
        expect(supabaseAuth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('ログインできたら redirect のパスへ移動する', async () => {
        supabaseAuth.signInWithPassword.mockImplementation(async () => signedInResponse())
        const { router } = renderApp('/login?redirect=%2Fsettings')

        await fillForm('user@example.com', 'password123')

        await waitFor(() => expect(router.state.location.pathname).toBe('/settings'))
        expect(supabaseAuth.signInWithPassword).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: 'password123',
        })
    })

    it('redirect がなければ / へ移動する', async () => {
        supabaseAuth.signInWithPassword.mockImplementation(async () => signedInResponse())
        const { router } = renderApp('/login')

        await fillForm('user@example.com', 'password123')

        await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    })

    it('メールアドレスかパスワードが違えば、そう出す', async () => {
        supabaseAuth.signInWithPassword.mockResolvedValue(authErrorResponse('invalid_credentials'))
        renderApp('/login')

        await fillForm('user@example.com', 'password123')

        expect(await screen.findByRole('alert')).toHaveTextContent('メールアドレスまたはパスワードが違います')
    })

    it('それ以外の失敗は「時間をおいて再度お試しください」と出す', async () => {
        supabaseAuth.signInWithPassword.mockResolvedValue(authErrorResponse('unexpected_failure'))
        renderApp('/login')

        await fillForm('user@example.com', 'password123')

        expect(await screen.findByRole('alert')).toHaveTextContent('時間をおいて再度お試しください')
    })

    it('Google でログインすると、戻り先に redirect のパスを渡す', async () => {
        supabaseAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
        const user = userEvent.setup()
        renderApp('/login?redirect=%2Fsettings')

        await user.click(await screen.findByRole('button', { name: 'Google でログイン' }))

        expect(supabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/settings` },
        })
    })

    it('目のアイコンでパスワードの表示・非表示を切り替える', async () => {
        const user = userEvent.setup()
        renderApp('/login')

        const password = await screen.findByLabelText('パスワード')
        expect(password).toHaveAttribute('type', 'password')

        await user.click(screen.getByRole('button', { name: 'パスワードを表示' }))
        expect(password).toHaveAttribute('type', 'text')

        await user.click(screen.getByRole('button', { name: 'パスワードを隠す' }))
        expect(password).toHaveAttribute('type', 'password')
    })

    it('「新規登録」のリンクは redirect を引き継ぐ', async () => {
        const user = userEvent.setup()
        const { router } = renderApp('/login?redirect=%2Fsettings')

        await user.click(await screen.findByRole('link', { name: '新規登録' }))

        await waitFor(() => expect(router.state.location.pathname).toBe('/signup'))
        expect(router.state.location.search).toEqual({ redirect: '/settings' })
    })
})
