import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '~/test/msw/server'
import { renderApp } from '~/test/render'

const API = 'http://localhost:8787'

describe('ホーム（配線確認）', () => {
    it('APIから取得した内容を表示する（TanStack Query + MSW）', async () => {
        renderApp('/')
        expect(await screen.findByText('APIの配線確認用エンドポイントです')).toBeInTheDocument()
    })

    it('APIがエラーを返したらエラー表示になる', async () => {
        server.use(
            http.get(`${API}/api/example`, () =>
                HttpResponse.json({ error: { code: 'internal_error', message: '失敗' } }, { status: 500 }),
            ),
        )

        renderApp('/')
        await waitFor(() => expect(screen.getByText('読み込みに失敗しました')).toBeInTheDocument(), {
            timeout: 5000,
        })
    })

    it('Zustand のUI状態を切り替えられる', async () => {
        renderApp('/')

        expect(await screen.findByText('isMenuOpen: false')).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: '切り替える' }))
        expect(screen.getByText('isMenuOpen: true')).toBeInTheDocument()
    })
})
