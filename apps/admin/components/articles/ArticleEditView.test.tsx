import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ArticleResponse } from '@fesp/schema'
import { ApiError } from '@fesp/types'

import { ArticleEditView } from './ArticleEditView'

const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'

const adminFetch = vi.fn()

vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: (...args: unknown[]) => adminFetch(...args) }))

function renderWithQueryClient(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const article: ArticleResponse = {
    id: ARTICLE_ID,
    event_id: EVENT_ID,
    content: [
        {
            id: '1',
            type: 'paragraph',
            props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
            content: [{ type: 'text', text: '現金のみです。', styles: {} }],
            children: [],
        },
    ],
    created_at: '2026-09-14T01:00:00+00:00',
    updated_at: '2026-09-14T03:30:00+00:00',
}

type FetchOptions = { method?: string; body?: unknown }

describe('ArticleEditView', () => {
    beforeEach(() => {
        adminFetch.mockReset()
    })

    it('記事を読み込んでエディタの初期値にする', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('現金のみです。')).toBeInTheDocument()
        expect(adminFetch).toHaveBeenCalledWith(
            `/api/articles/${ARTICLE_ID}?event_id=${EVENT_ID}`,
            expect.anything(),
            expect.anything(),
        )
    })

    it('記事が見つからないと、エディタの代わりに一覧へのリンクを出す', async () => {
        adminFetch.mockRejectedValue(new ApiError(404, 'not_found', '記事が見つかりません'))

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('記事が見つかりません')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: '記事一覧へ戻る' })).toHaveAttribute('href', '/articles')
        expect(screen.queryByLabelText('本文エディタ')).not.toBeInTheDocument()
    })

    it('保存ボタンで本文を PUT し、成功したら「保存しました」と出す', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByText('保存しました')).toBeInTheDocument()
        expect(adminFetch).toHaveBeenCalledWith(`/api/articles/${ARTICLE_ID}?event_id=${EVENT_ID}`, expect.anything(), {
            method: 'PUT',
            body: { content: article.content },
        })
    })

    it('保存に失敗したらエラーメッセージを出す', async () => {
        adminFetch.mockImplementation(async (_path: string, _schema: unknown, options?: FetchOptions) => {
            if (options?.method === 'PUT') {
                throw new ApiError(500, 'internal_error', 'サーバー内部エラーが発生しました')
            }
            return article
        })

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('サーバー内部エラーが発生しました')
    })
})
