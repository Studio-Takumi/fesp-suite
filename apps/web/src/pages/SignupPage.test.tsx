import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp } from '~/test/render'
import { authErrorResponse, mockSession, signedInResponse, supabaseAuth } from '~/test/supabase'

async function fillForm(email: string, password: string) {
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('メールアドレス'), email)
    await user.type(screen.getByLabelText('パスワード'), password)
    await user.click(screen.getByRole('button', { name: '登録する' }))
}

describe('新規登録ページ', () => {
    beforeEach(() => {
        mockSession(null)
    })

    it('パスワードの入力欄の下に文字数の目安を出す', async () => {
        renderApp('/signup')

        expect(await screen.findByText('8文字以上で入力してください')).toBeInTheDocument()
    })

    it('登録できたら、そのままログインした状態で redirect のパスへ移動する', async () => {
        supabaseAuth.signUp.mockImplementation(async () => signedInResponse())
        const { router } = renderApp('/signup?redirect=%2Fsettings')

        await fillForm('new@example.com', 'password123')

        await waitFor(() => expect(router.state.location.pathname).toBe('/settings'))
        expect(supabaseAuth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'password123' })
    })

    it('入力が正しくなければ送信しない', async () => {
        renderApp('/signup')

        await fillForm('new@example.com', 'short')

        expect(await screen.findByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
        expect(supabaseAuth.signUp).not.toHaveBeenCalled()
    })

    it('登録済みのメールアドレスなら、そう出す', async () => {
        supabaseAuth.signUp.mockResolvedValue(authErrorResponse('user_already_exists'))
        renderApp('/signup')

        await fillForm('used@example.com', 'password123')

        expect(await screen.findByRole('alert')).toHaveTextContent('このメールアドレスは登録済みです')
    })

    it('「Google で登録」でも Google の画面へ移動する', async () => {
        supabaseAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
        const user = userEvent.setup()
        renderApp('/signup')

        await user.click(await screen.findByRole('button', { name: 'Google で登録' }))

        expect(supabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/` },
        })
    })

    it('「ログイン」のリンクは redirect を引き継ぐ', async () => {
        const user = userEvent.setup()
        const { router } = renderApp('/signup?redirect=%2Fsettings')

        await user.click(await screen.findByRole('link', { name: 'ログイン' }))

        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(router.state.location.search).toEqual({ redirect: '/settings' })
    })
})
