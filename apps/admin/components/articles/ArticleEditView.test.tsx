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
    created_by: '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
    creator: { display_name: '山田太郎' },
    status: 'draft',
    published_at: null,
    title: '模擬店のお知らせ',
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

const articlePath = `/api/articles/${ARTICLE_ID}`

type FetchOptions = { method?: string; body?: unknown }

function putCalls() {
    return adminFetch.mock.calls.filter(([, , options]) => (options as FetchOptions | undefined)?.method === 'PUT')
}

describe('ArticleEditView', () => {
    beforeEach(() => {
        adminFetch.mockReset()
    })

    it('記事を読み込んでタイトルの入力欄とエディタの初期値にする', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('現金のみです。')).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'タイトル' })).toHaveValue('模擬店のお知らせ')
        expect(adminFetch).toHaveBeenCalledWith(
            articlePath,
            expect.anything(),
            expect.objectContaining({ authenticated: true }),
        )
    })

    it.each([
        ['山田太郎', '作成者: 山田太郎'],
        [null, '作成者: （名前未設定）'],
    ])('見出しの下に作成者を出す（表示名: %s）', async (displayName, text) => {
        adminFetch.mockResolvedValue({ ...article, creator: { display_name: displayName } })

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText(text)).toBeInTheDocument()
    })

    it('記事が見つからないと、エディタの代わりに一覧へのリンクを出す', async () => {
        adminFetch.mockRejectedValue(new ApiError(404, 'not_found', '記事が見つかりません'))

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('記事が見つかりません')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: '記事一覧へ戻る' })).toHaveAttribute('href', '/articles')
        expect(screen.queryByLabelText('本文エディタ')).not.toBeInTheDocument()
    })

    it('保存ボタンでタイトル・本文・公開状態を PUT し、成功したら「保存しました」と出す', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByText('保存しました')).toBeInTheDocument()
        expect(adminFetch).toHaveBeenCalledWith(articlePath, expect.anything(), {
            method: 'PUT',
            body: { title: '模擬店のお知らせ', content: article.content, status: 'draft' },
            authenticated: true,
        })
    })

    it('書き換えたタイトルを前後の空白を除いて保存する。空のタイトルでも保存できる', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')
        const titleInput = screen.getByRole('textbox', { name: 'タイトル' })

        await userEvent.clear(titleInput)
        await userEvent.type(titleInput, '  2日目のお知らせ ')
        await userEvent.click(screen.getByRole('button', { name: '保存' }))
        await screen.findByText('保存しました')

        await userEvent.clear(titleInput)
        await userEvent.click(screen.getByRole('button', { name: '保存' }))
        await screen.findByText('保存しました')

        expect(putCalls().map(([, , options]) => (options as { body: { title: string } }).body.title)).toEqual([
            '2日目のお知らせ',
            '',
        ])
    })

    it('タイトルを編集すると「保存しました」を消す', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')
        await userEvent.click(screen.getByRole('button', { name: '保存' }))
        await screen.findByText('保存しました')

        await userEvent.type(screen.getByRole('textbox', { name: 'タイトル' }), '！')

        expect(screen.queryByText('保存しました')).not.toBeInTheDocument()
    })

    it.each([
        ['draft', 'false'],
        ['published', 'true'],
    ] as const)('公開のスイッチの初期値を記事の公開状態にする（%s）', async (status, checked) => {
        adminFetch.mockResolvedValue({ ...article, status })

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        expect(screen.getByRole('switch', { name: '公開' })).toHaveAttribute('aria-checked', checked)
    })

    it('公開のスイッチを切り替えただけでは保存せず、保存ボタンで公開状態も一緒に PUT する', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        await userEvent.click(screen.getByRole('switch', { name: '公開' }))
        expect(putCalls()).toHaveLength(0)

        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByText('保存しました')).toBeInTheDocument()
        expect(putCalls().map(([, , options]) => (options as FetchOptions).body)).toEqual([
            { title: '模擬店のお知らせ', content: article.content, status: 'published' },
        ])
    })

    it('公開のスイッチを切り替えると「保存しました」を消す', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')
        await userEvent.click(screen.getByRole('button', { name: '保存' }))
        await screen.findByText('保存しました')

        await userEvent.click(screen.getByRole('switch', { name: '公開' }))

        expect(screen.queryByText('保存しました')).not.toBeInTheDocument()
    })

    it('タイトルが100文字を超えるとエラーを出し、保存しない', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')
        const titleInput = screen.getByRole('textbox', { name: 'タイトル' })

        await userEvent.clear(titleInput)
        await userEvent.click(titleInput)
        await userEvent.paste('あ'.repeat(101))
        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('タイトルは100文字以内で入力してください')
        expect(putCalls()).toHaveLength(0)
    })

    it.each([
        [500, 'internal_error', 'サーバー内部エラーが発生しました'],
        [403, 'forbidden', 'この記事を更新する権限がありません'],
    ])('保存に失敗（%i）したらエラーメッセージを出す', async (status, code, message) => {
        adminFetch.mockImplementation(async (_path: string, _schema: unknown, options?: FetchOptions) => {
            if (options?.method === 'PUT') {
                throw new ApiError(status, code, message)
            }
            return article
        })

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(message)
    })
})
