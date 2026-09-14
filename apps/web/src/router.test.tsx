import { waitFor } from '@testing-library/react'
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
