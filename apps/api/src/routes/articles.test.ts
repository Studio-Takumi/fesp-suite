import { beforeEach, describe, expect, it, vi } from 'vitest'

type QueryResult = { data: unknown; error: (Error & { code: string }) | null }

/** supabase-js の PostgrestError と同じく Error を継承したエラー */
function dbError(code: string, message: string): Error & { code: string } {
    return Object.assign(new Error(message), { code })
}

const jwtVerify = vi.fn()

vi.mock('jose', () => ({
    createRemoteJWKSet: () => vi.fn(),
    jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}))

const calls: { method: string; args: unknown[] }[] = []
/** クエリを await するたびに先頭から1つずつ返す。空になったら `result` を返す */
const queuedResults: QueryResult[] = []
let result: QueryResult = { data: null, error: null }
let clientToken: string | null = null

/** supabase-js のクエリビルダーの代わり。呼ばれたメソッドを記録し、await すると結果を返す */
function createQueryBuilder(): unknown {
    const builder: unknown = new Proxy(
        {},
        {
            get: (_target, method: string) => {
                if (method === 'then') {
                    return (resolve: (value: QueryResult) => void) => resolve(queuedResults.shift() ?? result)
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
    createUserClient: (_env: unknown, accessToken: string) => {
        clientToken = accessToken
        return createQueryBuilder()
    },
}))

const { default: app } = await import('../index')

const USER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'

const testEnv = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
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

const authorization = { Authorization: 'Bearer valid-token' }

function argsOf(method: string): unknown[][] {
    return calls.filter((call) => call.method === method).map((call) => call.args)
}

function get(path: string, headers: Record<string, string> = authorization) {
    return app.request(path, { headers }, testEnv)
}

function sendJson(
    path: string,
    method: 'POST' | 'PUT',
    body: unknown,
    headers: Record<string, string> = authorization,
) {
    return app.request(
        path,
        { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        testEnv,
    )
}

async function errorCodeOf(res: Response): Promise<string> {
    const body = (await res.json()) as { error: { code: string } }
    return body.error.code
}

beforeEach(() => {
    vi.clearAllMocks()
    calls.length = 0
    queuedResults.length = 0
    result = { data: null, error: null }
    clientToken = null
    jwtVerify.mockResolvedValue({
        payload: {
            sub: USER_ID,
            iss: testEnv.SUPABASE_JWT_ISSUER,
            exp: Math.floor(Date.now() / 1000) + 3600,
            role: 'authenticated',
        },
    })
})

describe('認証', () => {
    it.each([
        ['GET', '/api/articles?event_id=' + EVENT_ID],
        ['GET', `/api/articles/${ARTICLE_ID}`],
        ['POST', '/api/articles'],
        ['PUT', `/api/articles/${ARTICLE_ID}`],
    ] as const)('%s %s は Authorization が無いと 401 で、DB を読まない', async (method, path) => {
        const res =
            method === 'GET'
                ? await get(path, {})
                : await sendJson(path, method, { event_id: EVENT_ID, title: '', content }, {})

        expect(res.status).toBe(401)
        expect(await errorCodeOf(res)).toBe('unauthorized')
        expect(calls).toHaveLength(0)
    })

    it('トークンが無効なら 401', async () => {
        jwtVerify.mockRejectedValue(new Error('invalid signature'))

        const res = await get(`/api/articles/${ARTICLE_ID}`)

        expect(res.status).toBe(401)
        expect(calls).toHaveLength(0)
    })

    it('ユーザーのトークンを引き継いだクライアントで DB を読む（RLS を効かせる）', async () => {
        result = { data: article, error: null }

        await get(`/api/articles/${ARTICLE_ID}`)

        expect(clientToken).toBe('valid-token')
    })
})

describe('GET /api/articles', () => {
    it('イベントの記事を更新日時の新しい順に、本文なしで返す', async () => {
        const { content: _content, ...listItem } = article
        result = { data: [listItem], error: null }

        const res = await get(`/api/articles?event_id=${EVENT_ID}`)

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

        await get(`/api/articles?event_id=${EVENT_ID}&limit=10&offset=30`)

        expect(argsOf('range')).toEqual([[30, 39]])
    })

    it('所属していないイベント（RLS で1件も見えない）は空の 200', async () => {
        result = { data: [], error: null }

        const res = await get(`/api/articles?event_id=${EVENT_ID}`)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ items: [], limit: 20, offset: 0 })
    })

    it('event_id が無いと 400', async () => {
        const res = await get('/api/articles')

        expect(res.status).toBe(400)
        const body = (await res.json()) as { error: { code: string; details?: Record<string, string[]> } }
        expect(body.error.code).toBe('bad_request')
        expect(body.error.details?.event_id).toBeDefined()
        expect(calls).toHaveLength(0)
    })
})

describe('GET /api/articles/:id', () => {
    it('記事IDだけで絞り込んで、本文つきで返す', async () => {
        result = { data: article, error: null }

        const res = await get(`/api/articles/${ARTICLE_ID}`)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('eq')).toEqual([['id', ARTICLE_ID]])
    })

    it('記事が無い（所属していないイベントの記事を含む）と 404', async () => {
        const res = await get(`/api/articles/${ARTICLE_ID}`)

        expect(res.status).toBe(404)
        expect(await errorCodeOf(res)).toBe('not_found')
    })

    it('id が UUID でないと 400', async () => {
        const res = await get('/api/articles/not-a-uuid')

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })

    it('DB のエラーは 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        result = { data: null, error: dbError('XX000', 'boom') }

        const res = await get(`/api/articles/${ARTICLE_ID}`)

        expect(res.status).toBe(500)
        expect(await errorCodeOf(res)).toBe('internal_error')
    })
})

describe('POST /api/articles', () => {
    it('ボディのイベントに記事を作成して 201', async () => {
        result = { data: article, error: null }

        const res = await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '模擬店のお知らせ', content })

        expect(res.status).toBe(201)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('insert')).toEqual([[{ event_id: EVENT_ID, title: '模擬店のお知らせ', content }]])
    })

    it('タイトル・本文とも空でも作成できる', async () => {
        result = { data: { ...article, title: '', content: [] }, error: null }

        const res = await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '', content: [] })

        expect(res.status).toBe(201)
        expect(argsOf('insert')).toEqual([[{ event_id: EVENT_ID, title: '', content: [] }]])
    })

    it('タイトルの前後の空白は取り除いて保存する', async () => {
        result = { data: article, error: null }

        await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '  模擬店のお知らせ  ', content })

        expect(argsOf('insert')).toEqual([[{ event_id: EVENT_ID, title: '模擬店のお知らせ', content }]])
    })

    it('event_id が無い・UUID でないと 400', async () => {
        const missing = await sendJson('/api/articles', 'POST', { title: '', content })
        const invalid = await sendJson('/api/articles', 'POST', { event_id: 'dev', title: '', content })

        expect(missing.status).toBe(400)
        expect(invalid.status).toBe(400)
        const body = (await missing.json()) as { error: { details?: Record<string, string[]> } }
        expect(body.error.details?.event_id).toBeDefined()
        expect(calls).toHaveLength(0)
    })

    it('タイトルが100文字を超えると 400', async () => {
        const res = await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: 'あ'.repeat(101), content })

        expect(res.status).toBe(400)
        const body = (await res.json()) as { error: { details?: Record<string, string[]> } }
        expect(body.error.details?.title).toContain('タイトルは100文字以内で入力してください')
        expect(calls).toHaveLength(0)
    })

    it('content が記事ドキュメントの形でないと 400', async () => {
        const res = await sendJson('/api/articles', 'POST', {
            event_id: EVENT_ID,
            title: '',
            content: [{ id: 'a1', type: 'image', props: {}, children: [] }],
        })

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })

    it('RLS で弾かれた（staff でない・所属していない・イベントが存在しない）と 403', async () => {
        result = { data: null, error: dbError('42501', 'new row violates row-level security policy') }

        const res = await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '', content })

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
    })

    it('それ以外の DB のエラーは 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        result = { data: null, error: dbError('XX000', 'boom') }

        const res = await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '', content })

        expect(res.status).toBe(500)
    })
})

describe('PUT /api/articles/:id', () => {
    it('記事IDだけで絞り込んでタイトルと本文を置き換える', async () => {
        result = { data: article, error: null }

        const res = await sendJson(`/api/articles/${ARTICLE_ID}`, 'PUT', { title: '模擬店のお知らせ', content })

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('update')).toEqual([[{ title: '模擬店のお知らせ', content }]])
        expect(argsOf('eq')).toEqual([['id', ARTICLE_ID]])
    })

    it('ボディに event_id があっても記事のイベントは変えない', async () => {
        result = { data: article, error: null }

        await sendJson(`/api/articles/${ARTICLE_ID}`, 'PUT', { event_id: EVENT_ID, title: '', content })

        expect(argsOf('update')).toEqual([[{ title: '', content }]])
    })

    it('更新できず、記事は読める（メンバーだが staff でない）と 403', async () => {
        queuedResults.push({ data: null, error: null }, { data: { id: ARTICLE_ID }, error: null })

        const res = await sendJson(`/api/articles/${ARTICLE_ID}`, 'PUT', { title: '', content })

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
        expect(argsOf('select')).toEqual([['*'], ['id']])
    })

    it('更新できず、記事も読めない（存在しない・所属していないイベントの記事）と 404', async () => {
        queuedResults.push({ data: null, error: null }, { data: null, error: null })

        const res = await sendJson(`/api/articles/${ARTICLE_ID}`, 'PUT', { title: '', content })

        expect(res.status).toBe(404)
        expect(await errorCodeOf(res)).toBe('not_found')
    })

    it('読み直しで DB のエラーが出たら 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        queuedResults.push({ data: null, error: null }, { data: null, error: dbError('XX000', 'boom') })

        const res = await sendJson(`/api/articles/${ARTICLE_ID}`, 'PUT', { title: '', content })

        expect(res.status).toBe(500)
    })

    it('区切り線・表を含む本文（エディタの出力をそのまま JSON で送ったもの）を保存できる', async () => {
        result = { data: article, error: null }
        const cellProps = {
            backgroundColor: 'default',
            textColor: 'default',
            textAlignment: 'left',
            colspan: 1,
            rowspan: 1,
        }
        const blockContent = [
            { id: 'd1', type: 'divider', props: {}, content: undefined, children: [] },
            {
                id: 't1',
                type: 'table',
                props: { textColor: 'default' },
                content: {
                    type: 'tableContent',
                    columnWidths: [undefined, undefined],
                    rows: [
                        {
                            cells: [
                                {
                                    type: 'tableCell',
                                    props: cellProps,
                                    content: [{ type: 'text', text: '模擬店', styles: {} }],
                                },
                                {
                                    type: 'tableCell',
                                    props: cellProps,
                                    content: [],
                                },
                            ],
                        },
                    ],
                },
                children: [],
            },
        ]

        const res = await sendJson(`/api/articles/${ARTICLE_ID}`, 'PUT', { title: '', content: blockContent })

        expect(res.status).toBe(200)
        expect(argsOf('update')).toEqual([[{ title: '', content: blockContent }]])
    })

    it('title が無いと 400', async () => {
        const res = await sendJson(`/api/articles/${ARTICLE_ID}`, 'PUT', { content })

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })
})
