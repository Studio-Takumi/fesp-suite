import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ArticleList } from './ArticleList'

const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'

const adminFetch = vi.fn()
const push = vi.fn()

vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: (...args: unknown[]) => adminFetch(...args) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

function renderWithQueryClient(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const listItem = {
    id: ARTICLE_ID,
    event_id: EVENT_ID,
    created_at: '2026-09-14T01:00:00+00:00',
    updated_at: '2026-09-14T03:30:00+00:00',
}

describe('ArticleList', () => {
    beforeEach(() => {
        adminFetch.mockReset()
        push.mockReset()
    })

    it('env のイベントの記事を先頭100件取得し、各行を編集画面へのリンクにする', async () => {
        adminFetch.mockResolvedValue({ items: [listItem], limit: 100, offset: 0 })

        renderWithQueryClient(<ArticleList />)

        expect(await screen.findByRole('link', { name: ARTICLE_ID })).toHaveAttribute('href', `/articles/${ARTICLE_ID}`)
        expect(adminFetch).toHaveBeenCalledWith(
            `/api/articles?event_id=${EVENT_ID}&limit=100`,
            expect.anything(),
            expect.anything(),
        )
    })

    it('0件なら「記事がありません」と出す', async () => {
        adminFetch.mockResolvedValue({ items: [], limit: 100, offset: 0 })

        renderWithQueryClient(<ArticleList />)

        expect(await screen.findByText('記事がありません')).toBeInTheDocument()
    })

    it('新規作成で空の記事を作り、その編集画面へ移動する', async () => {
        adminFetch.mockImplementation(async (_path: string, _schema: unknown, options?: { method?: string }) =>
            options?.method === 'POST' ? { ...listItem, content: [] } : { items: [], limit: 100, offset: 0 },
        )

        renderWithQueryClient(<ArticleList />)
        await screen.findByText('記事がありません')

        await userEvent.click(screen.getByRole('button', { name: '新規作成' }))

        await waitFor(() => expect(push).toHaveBeenCalledWith(`/articles/${ARTICLE_ID}`))
        expect(adminFetch).toHaveBeenCalledWith(`/api/articles?event_id=${EVENT_ID}`, expect.anything(), {
            method: 'POST',
            body: { content: [] },
        })
    })
})
