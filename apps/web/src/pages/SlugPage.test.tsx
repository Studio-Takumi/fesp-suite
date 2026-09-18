import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '~/test/msw/server'
import { renderApp } from '~/test/render'

const API = 'http://localhost:8787'

describe('固定ページ', () => {
    it('パスの slug で記事を取得し、ページ見出しをページのタイトル（h1）にする', async () => {
        let requestUrl: URL | null = null
        server.use(
            http.get(`${API}/api/articles/slug/:slug`, ({ request }) => {
                requestUrl = new URL(request.url)
                return HttpResponse.json({
                    id: '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b',
                    event_id: '00000000-0000-4000-8000-000000000000',
                    slug: 'news',
                    created_by: '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
                    creator: { display_name: '山田太郎' },
                    title: 'お知らせ',
                    content: [
                        { id: '1', type: 'pageHeader', props: { label: 'NEWS', title: 'お知らせ' }, children: [] },
                    ],
                    status: 'published',
                    published_version: 1,
                    published_at: '2026-09-19T12:00:00+09:00',
                    created_at: '2026-09-19T12:00:00+09:00',
                    updated_at: '2026-09-19T12:00:00+09:00',
                })
            }),
        )

        renderApp('/news')

        expect(await screen.findByRole('heading', { level: 1, name: 'お知らせ' })).toBeInTheDocument()
        expect(requestUrl!.pathname).toBe('/api/articles/slug/news')
        // 記事のタイトルは出さない（ページのタイトルはページ見出しが出す）
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    })

    it('記事が見つからない（404）ときは「ページが見つかりませんでした」と出す', async () => {
        server.use(
            http.get(`${API}/api/articles/slug/:slug`, () =>
                HttpResponse.json({ error: { code: 'not_found', message: '記事が見つかりません' } }, { status: 404 }),
            ),
        )

        renderApp('/dareka-no-page')

        expect(await screen.findByText('読み込みに失敗しました')).toBeInTheDocument()
        expect(screen.getByText('ページが見つかりませんでした')).toBeInTheDocument()
    })
})
