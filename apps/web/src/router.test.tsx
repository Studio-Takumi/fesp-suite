import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderApp } from '~/test/render'
import { mockSession } from '~/test/supabase'

describe('ログインの確認', () => {
    it('未ログインでログインが要るページを開くと、開こうとしたパスを持ってログインへ移動する', async () => {
        mockSession(null)

        const { router } = renderApp('/settings')

        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(router.state.location.search).toEqual({ redirect: '/settings' })
    })

    it('ログイン済みでログインを開くと、redirect のパスへ移動する', async () => {
        const { router } = renderApp('/login?redirect=%2Fsettings')

        await waitFor(() => expect(router.state.location.pathname).toBe('/settings'))
    })

    it('ログイン済みで新規登録を開いたときも、redirect のパスへ移動する', async () => {
        const { router } = renderApp('/signup?redirect=%2Fsettings')

        await waitFor(() => expect(router.state.location.pathname).toBe('/settings'))
    })

    it('redirect がサイト内のパスでなければ / へ移動する', async () => {
        const { router } = renderApp('/login?redirect=%2F%2Fevil.example')

        await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    })
})

describe('ページのパス', () => {
    it('静的なパス（/settings）は固定ページより先に選ばれる', async () => {
        renderApp('/settings')

        expect(await screen.findByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })

    it.each([
        ['/news/1', '2日目のステージは、雨天のため体育館に会場を変更します。'],
        ['/blog/1', '今年の看板づくりは、3年生の有志が中心になって進めました。'],
    ])('個別ページ（%s）は仮ページを出す', async (path, text) => {
        renderApp(path)

        expect(await screen.findByText(text)).toBeInTheDocument()
    })

    it.each(['/shop/1', '/artist/1'])('個別ページ（%s）は記事を読みに行かない', async (path) => {
        const { router } = renderApp(path)

        await waitFor(() => expect(router.state.location.pathname).toBe(path))
    })
})
