import { beforeEach, describe, expect, it, vi } from 'vitest'

type QueryResult = { data: unknown; error: (Error & { code: string }) | null }

/** supabase-js の PostgrestError と同じく Error を継承したエラー */
function dbError(code: string, message: string): Error & { code: string } {
    return Object.assign(new Error(message), { code })
}

const calls: { method: string; args: unknown[] }[] = []
let result: QueryResult = { data: null, error: null }

/** supabase-js のクエリビルダーの代わり。呼ばれたメソッドを記録し、await すると `result` を返す */
function createQueryBuilder(): unknown {
    const builder: unknown = new Proxy(
        {},
        {
            get: (_target, method: string) => {
                if (method === 'then') {
                    return (resolve: (value: QueryResult) => void) => resolve(result)
                }
                return (...args: unknown[]) => {
                    calls.push({ method, args })
                    return builder
                }
            },
        },
    )
    return builder
}

vi.mock('../lib/supabase', () => ({
    createServiceClient: () => createQueryBuilder(),
}))

const { default: app } = await import('../index')

const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'

const testEnv = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    SUPABASE_JWKS_URL: 'https://test.supabase.co/auth/v1/.well-known/jwks.json',
    SUPABASE_JWT_ISSUER: 'https://test.supabase.co/auth/v1',
    ALLOWED_ORIGINS: 'http://localhost:3001',
    ASSETS_BUCKET: {} as R2Bucket,
}

const content = [
    {
        id: 'a1',
        type: 'paragraph',
        props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
        content: [{ type: 'text', text: '現金のみです。', styles: {} }],
        children: [],
    },
]

const article = {
    id: ARTICLE_ID,
    event_id: EVENT_ID,
    title: '模擬店のお知らせ',
    content,
    created_at: '2026-09-14T10:00:00+00:00',
    updated_at: '2026-09-14T12:30:00+00:00',
}

function argsOf(method: string): unknown[][] {
    return calls.filter((call) => call.method === method).map((call) => call.args)
}

function sendJson(path: string, method: 'POST' | 'PUT', body: unknown) {
    return app.request(
        path,
        { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        testEnv,
    )
}

beforeEach(() => {
    calls.length = 0
    result = { data: null, error: null }
})

describe('GET /api/articles', () => {
    it('イベントの記事を更新日時の新しい順に、本文なしで返す', async () => {
        const { content: _content, ...listItem } = article
        result = { data: [listItem], error: null }

        const res = await app.request(`/api/articles?event_id=${EVENT_ID}`, {}, testEnv)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ items: [listItem], limit: 20, offset: 0 })
        expect(argsOf('from')).toEqual([['articles']])
        expect(argsOf('select')).toEqual([['id, event_id, title, created_at, updated_at']])
        expect(argsOf('eq')).toEqual([['event_id', EVENT_ID]])
        expect(argsOf('order')).toEqual([['updated_at', { ascending: false }]])
        expect(argsOf('range')).toEqual([[0, 19]])
    })

    it('limit / offset を取得範囲に反映する', async () => {
        result = { data: [], error: null }

        await app.request(`/api/articles?event_id=${EVENT_ID}&limit=10&offset=30`, {}, testEnv)

        expect(argsOf('range')).toEqual([[30, 39]])
    })

    it('event_id が無いと 400', async () => {
        const res = await app.request('/api/articles', {}, testEnv)

        expect(res.status).toBe(400)
        const body = (await res.json()) as { error: { code: string; details?: Record<string, string[]> } }
        expect(body.error.code).toBe('bad_request')
        expect(body.error.details?.event_id).toBeDefined()
        expect(calls).toHaveLength(0)
    })
})

describe('GET /api/articles/:id', () => {
    it('記事IDとイベントで絞り込んで、本文つきで返す', async () => {
        result = { data: article, error: null }

        const res = await app.request(`/api/articles/${ARTICLE_ID}?event_id=${EVENT_ID}`, {}, testEnv)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('eq')).toEqual([
            ['id', ARTICLE_ID],
            ['event_id', EVENT_ID],
        ])
    })

    it('記事が無い（別イベントの記事を含む）と 404', async () => {
        const res = await app.request(`/api/articles/${ARTICLE_ID}?event_id=${EVENT_ID}`, {}, testEnv)

        expect(res.status).toBe(404)
        const body = (await res.json()) as { error: { code: string } }
        expect(body.error.code).toBe('not_found')
    })

    it('id が UUID でないと 400', async () => {
        const res = await app.request(`/api/articles/not-a-uuid?event_id=${EVENT_ID}`, {}, testEnv)

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })

    it('DB のエラーは 500', async () => {
        result = { data: null, error: dbError('XX000', 'boom') }

        const res = await app.request(`/api/articles/${ARTICLE_ID}?event_id=${EVENT_ID}`, {}, testEnv)

        expect(res.status).toBe(500)
        const body = (await res.json()) as { error: { code: string } }
        expect(body.error.code).toBe('internal_error')
    })
})

describe('POST /api/articles', () => {
    it('クエリのイベントに記事を作成して 201', async () => {
        result = { data: article, error: null }

        const res = await sendJson(`/api/articles?event_id=${EVENT_ID}`, 'POST', { title: '模擬店のお知らせ', content })

        expect(res.status).toBe(201)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('insert')).toEqual([[{ event_id: EVENT_ID, title: '模擬店のお知らせ', content }]])
    })

    it('タイトル・本文とも空でも作成できる', async () => {
        result = { data: { ...article, title: '', content: [] }, error: null }

        const res = await sendJson(`/api/articles?event_id=${EVENT_ID}`, 'POST', { title: '', content: [] })

        expect(res.status).toBe(201)
        expect(argsOf('insert')).toEqual([[{ event_id: EVENT_ID, title: '', content: [] }]])
    })

    it('タイトルの前後の空白は取り除いて保存する', async () => {
        result = { data: article, error: null }

        await sendJson(`/api/articles?event_id=${EVENT_ID}`, 'POST', { title: '  模擬店のお知らせ  ', content })

        expect(argsOf('insert')).toEqual([[{ event_id: EVENT_ID, title: '模擬店のお知らせ', content }]])
    })

    it('タイトルが100文字を超えると 400', async () => {
        const res = await sendJson(`/api/articles?event_id=${EVENT_ID}`, 'POST', { title: 'あ'.repeat(101), content })

        expect(res.status).toBe(400)
        const body = (await res.json()) as { error: { details?: Record<string, string[]> } }
        expect(body.error.details?.title).toContain('タイトルは100文字以内で入力してください')
        expect(calls).toHaveLength(0)
    })

    it('content が記事ドキュメントの形でないと 400', async () => {
        const res = await sendJson(`/api/articles?event_id=${EVENT_ID}`, 'POST', {
            title: '',
            content: [{ id: 'a1', type: 'image', props: {}, children: [] }],
        })

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })

    it('イベントが存在しない（外部キー違反）と 404', async () => {
        result = { data: null, error: dbError('23503', 'violates foreign key constraint') }

        const res = await sendJson(`/api/articles?event_id=${EVENT_ID}`, 'POST', { title: '', content })

        expect(res.status).toBe(404)
        const body = (await res.json()) as { error: { code: string } }
        expect(body.error.code).toBe('not_found')
    })
})

describe('PUT /api/articles/:id', () => {
    it('記事IDとイベントで絞り込んでタイトルと本文を置き換える', async () => {
        result = { data: article, error: null }

        const res = await sendJson(`/api/articles/${ARTICLE_ID}?event_id=${EVENT_ID}`, 'PUT', {
            title: '模擬店のお知らせ',
            content,
        })

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('update')).toEqual([[{ title: '模擬店のお知らせ', content }]])
        expect(argsOf('eq')).toEqual([
            ['id', ARTICLE_ID],
            ['event_id', EVENT_ID],
        ])
    })

    it('記事が無い（別イベントの記事を含む）と 404', async () => {
        const res = await sendJson(`/api/articles/${ARTICLE_ID}?event_id=${EVENT_ID}`, 'PUT', { title: '', content })

        expect(res.status).toBe(404)
    })

    it('title が無いと 400', async () => {
        const res = await sendJson(`/api/articles/${ARTICLE_ID}?event_id=${EVENT_ID}`, 'PUT', { content })

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })
})
