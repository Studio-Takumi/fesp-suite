import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderApp } from '~/test/render'
import { mockSession, supabaseAuth } from '~/test/supabase'

describe('設定ページ', () => {
    it('ログアウトすると、この端末のセッションを終えてログインへ移動し、読み込み済みのデータを消す', async () => {
        supabaseAuth.signOut.mockImplementation(async () => {
            mockSession(null)
            return { error: null }
        })
        const user = userEvent.setup()
        const { router, queryClient } = renderApp('/settings')
        queryClient.setQueryData(['cached'], 'data')

        await user.click(await screen.findByRole('button', { name: 'ログアウト' }))

        await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
        expect(supabaseAuth.signOut).toHaveBeenCalledWith({ scope: 'local' })
        expect(queryClient.getQueryData(['cached'])).toBeUndefined()
    })
})
