import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '~/test/msw/server'
import { renderApp } from '~/test/render'

const API = 'http://localhost:8787'
const EVENT_ID = '00000000-0000-4000-8000-000000000000'
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'

const paragraph = (id: string, text: string) => ({
    id,
    type: 'paragraph',
    props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
    content: [{ type: 'text', text, styles: {} }],
    children: [],
})

const articleFixture = {
    id: ARTICLE_ID,
    event_id: EVENT_ID,
    title: '模擬店のお知らせ',
    content: [paragraph('1', '現金のみです。')],
    created_at: '2026-09-14T10:00:00+09:00',
    updated_at: '2026-09-14T12:30:00+09:00',
}

describe('記事ページ', () => {
    it('env のイベントを付けて記事を取得し、タイトルと本文を表示する', async () => {
        let requestedEventId: string | null = null
        server.use(
            http.get(`${API}/api/articles/:id`, ({ request, params }) => {
                requestedEventId = new URL(request.url).searchParams.get('event_id')
                return params.id === ARTICLE_ID
                    ? HttpResponse.json(articleFixture)
                    : HttpResponse.json(
                          { error: { code: 'not_found', message: '記事が見つかりません' } },
                          { status: 404 },
                      )
            }),
        )

        renderApp(`/articles/${ARTICLE_ID}`)

        expect(await screen.findByRole('heading', { level: 1, name: '模擬店のお知らせ' })).toBeInTheDocument()
        expect(screen.getByText('現金のみです。')).toBeInTheDocument()
        expect(requestedEventId).toBe(EVENT_ID)
    })

    it('タイトルが空なら「（無題）」と出す', async () => {
        server.use(http.get(`${API}/api/articles/:id`, () => HttpResponse.json({ ...articleFixture, title: '' })))

        renderApp(`/articles/${ARTICLE_ID}`)

        expect(await screen.findByRole('heading', { level: 1, name: '（無題）' })).toBeInTheDocument()
    })

    it('描画できないブロックを含んでいても、残りのブロックを表示する', async () => {
        server.use(
            http.get(`${API}/api/articles/:id`, () =>
                HttpResponse.json({
                    ...articleFixture,
                    content: [
                        paragraph('1', '先頭の段落'),
                        { id: '2', type: 'shopList', props: { day: 1 }, children: [paragraph('2-1', '模擬店の子')] },
                        paragraph('3', '末尾の段落'),
                    ],
                }),
            ),
        )

        renderApp(`/articles/${ARTICLE_ID}`)

        expect(await screen.findByText('先頭の段落')).toBeInTheDocument()
        expect(screen.getByText('末尾の段落')).toBeInTheDocument()
        expect(screen.queryByText('模擬店の子')).not.toBeInTheDocument()
    })

    it('記事が見つからない（404）ときは「ページが見つかりませんでした」と出す', async () => {
        server.use(
            http.get(`${API}/api/articles/:id`, () =>
                HttpResponse.json({ error: { code: 'not_found', message: '記事が見つかりません' } }, { status: 404 }),
            ),
        )

        renderApp(`/articles/${ARTICLE_ID}`)

        expect(await screen.findByText('読み込みに失敗しました')).toBeInTheDocument()
        expect(screen.getByText('ページが見つかりませんでした')).toBeInTheDocument()
    })
})
