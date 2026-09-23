import { http, HttpResponse } from 'msw'

import type { BottomNavListResponse, ExampleResponse } from '@fesp/schema'

const API = 'http://localhost:8787'

export const exampleFixture: ExampleResponse = {
    message: 'APIの配線確認用エンドポイントです',
    now: '2026-09-01T10:00:00Z',
}

/** slug で引いた記事。本文はページ見出し1つだけで、slug ごとに見出しを変える */
export function slugArticleFixture(slug: string) {
    return {
        id: '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b',
        event_id: '00000000-0000-4000-8000-000000000000',
        slug,
        created_by: '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
        creator: { display_name: '山田太郎' },
        title: slug,
        content: [{ id: '1', type: 'pageHeader', props: { label: slug.toUpperCase(), title: slug }, children: [] }],
        status: 'published',
        published_version: 1,
        published_at: '2026-09-19T12:00:00+09:00',
        created_at: '2026-09-19T12:00:00+09:00',
        updated_at: '2026-09-19T12:00:00+09:00',
    }
}

/** 下のナビの項目。デザインと同じ4つ */
export const bottomNavsFixture: BottomNavListResponse = {
    items: [
        { id: '7a8b9c0d-1e2f-4a3b-8c4d-000000000001', label: 'ホーム', icon: 'House', href: '/', sort_order: 0 },
        { id: '7a8b9c0d-1e2f-4a3b-8c4d-000000000002', label: 'お知らせ', icon: 'Bell', href: '/news', sort_order: 1 },
        { id: '7a8b9c0d-1e2f-4a3b-8c4d-000000000003', label: 'マップ', icon: 'Map', href: '/map', sort_order: 2 },
        {
            id: '7a8b9c0d-1e2f-4a3b-8c4d-000000000004',
            label: 'スケジュール',
            icon: 'CalendarDays',
            href: '/schedule',
            sort_order: 3,
        },
    ],
}

/** 既定のハッピーパス。個別テストで server.use() して上書きする */
export const handlers = [
    http.get(`${API}/api/example`, () => HttpResponse.json(exampleFixture)),
    http.get(`${API}/api/articles/slug/:slug`, ({ params }) =>
        HttpResponse.json(slugArticleFixture(String(params.slug))),
    ),
    http.get(`${API}/api/bottom-navs`, () => HttpResponse.json(bottomNavsFixture)),
]
