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

const latestHistory = {
    version: 2,
    title: '模擬店のお知らせ（2日目）',
    content,
    created_by: USER_ID,
    created_at: '2026-09-14T13:00:00+00:00',
    updated_at: '2026-09-14T13:10:00+00:00',
}

/** API が返す記事オブジェクト */
const article = {
    id: ARTICLE_ID,
    event_id: EVENT_ID,
    slug: null,
    created_by: USER_ID,
    creator: { display_name: '山田太郎' },
    title: '模擬店のお知らせ',
    content,
    status: 'published',
    published_version: 1,
    published_at: '2026-09-14T11:00:00+00:00',
    created_at: '2026-09-14T10:00:00+00:00',
    updated_at: '2026-09-14T12:30:00+00:00',
    latest_history: latestHistory,
    schedule: null,
}

const { title: _title, content: _content, ...articleWithoutBody } = article

/** DB から返る記事の行。タイトル・本文は持たず、公開中の版・最新の版を埋め込んで返る */
const articleRow = {
    ...articleWithoutBody,
    published_history: { title: article.title, content },
    latest_history: latestHistory,
}

const BASE_COLUMNS =
    'id, event_id, slug, created_by, creator:users!created_by(display_name), status, published_version, published_at, created_at, updated_at, schedule:article_schedules!article_schedules_article_id_fkey(version, publish_at, created_by, created_at, updated_at)'
const ARTICLE_COLUMNS = `${BASE_COLUMNS}, published_history:article_histories!articles_published_version_fkey(title, content), latest_history:article_histories!articles_latest_version_fkey(version, title, content, created_by, created_at, updated_at)`
const OTHER_USER_ID = '1d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a'

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

function remove(path: string, headers: Record<string, string> = authorization) {
    return app.request(path, { method: 'DELETE', headers }, testEnv)
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
        ['GET', `/api/articles/slug/news?event_id=${EVENT_ID}`],
        ['GET', `/api/articles/${ARTICLE_ID}`],
        ['POST', '/api/articles'],
        ['PUT', `/api/articles/${ARTICLE_ID}`],
        ['PUT', `/api/articles/${ARTICLE_ID}/schedule`],
        ['DELETE', `/api/articles/${ARTICLE_ID}/schedule`],
    ] as const)('%s %s は Authorization が無いと 401 で、DB を読まない', async (method, path) => {
        const res =
            method === 'GET'
                ? await get(path, {})
                : method === 'DELETE'
                  ? await remove(path, {})
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
        result = { data: articleRow, error: null }

        await get(`/api/articles/${ARTICLE_ID}`)

        expect(clientToken).toBe('valid-token')
    })
})

describe('GET /api/articles', () => {
    it('イベントの記事を更新日時の新しい順に、本文・最新の版なしで返す', async () => {
        const { content: _content, latest_history: _latestHistory, ...listItem } = article
        const listRow = {
            ...articleWithoutBody,
            published_history: { title: article.title },
            latest_history: { title: latestHistory.title },
        }
        result = { data: [listRow], error: null }

        const res = await get(`/api/articles?event_id=${EVENT_ID}`)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ items: [listItem], limit: 20, offset: 0 })
        expect(argsOf('from')).toEqual([['articles']])
        expect(argsOf('select')).toEqual([
            [
                `${BASE_COLUMNS}, published_history:article_histories!articles_published_version_fkey(title), latest_history:article_histories!articles_latest_version_fkey(title)`,
            ],
        ])
        expect(argsOf('eq')).toEqual([['event_id', EVENT_ID]])
        expect(argsOf('order')).toEqual([['updated_at', { ascending: false }]])
        expect(argsOf('range')).toEqual([[0, 19]])
    })

    it('下書き（公開中の版が無い）のタイトルは、最新の版のタイトルにする', async () => {
        const draftRow = {
            ...articleWithoutBody,
            status: 'draft',
            published_version: null,
            published_history: null,
            latest_history: { title: latestHistory.title },
        }
        result = { data: [draftRow], error: null }

        const res = await get(`/api/articles?event_id=${EVENT_ID}`)

        const body = (await res.json()) as { items: { title: string }[] }
        expect(body.items[0]?.title).toBe(latestHistory.title)
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

describe('GET /api/articles/slug/:slug', () => {
    it('イベントと slug で絞り込んで、記事1件と同じ形で返す', async () => {
        result = { data: { ...articleRow, slug: 'news' }, error: null }

        const res = await get(`/api/articles/slug/news?event_id=${EVENT_ID}`)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ ...article, slug: 'news' })
        expect(argsOf('select')).toEqual([[ARTICLE_COLUMNS]])
        expect(argsOf('eq')).toEqual([
            ['event_id', EVENT_ID],
            ['slug', 'news'],
        ])
        expect(clientToken).toBe('valid-token')
    })

    it('その slug の記事が無い（所属していないイベントを含む）と 404', async () => {
        const res = await get(`/api/articles/slug/news?event_id=${EVENT_ID}`)

        expect(res.status).toBe(404)
        expect(await errorCodeOf(res)).toBe('not_found')
    })

    it.each(['News', 'settings'])('slug の形式が合わない（%s）と 400 で、DB を読まない', async (slug) => {
        const res = await get(`/api/articles/slug/${slug}?event_id=${EVENT_ID}`)

        expect(res.status).toBe(400)
        expect(await errorCodeOf(res)).toBe('bad_request')
        expect(calls).toHaveLength(0)
    })

    it('event_id が無いと 400 で、DB を読まない', async () => {
        const res = await get('/api/articles/slug/news')

        expect(res.status).toBe(400)
        expect(await errorCodeOf(res)).toBe('bad_request')
        expect(calls).toHaveLength(0)
    })
})

describe('GET /api/articles/:id', () => {
    it('記事IDだけで絞り込んで、公開中の版の中身・作成者・最新の版つきで返す', async () => {
        result = { data: articleRow, error: null }

        const res = await get(`/api/articles/${ARTICLE_ID}`)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('select')).toEqual([[ARTICLE_COLUMNS]])
        expect(argsOf('eq')).toEqual([['id', ARTICLE_ID]])
    })

    it('最新の版が読めない（RLS で staff でなく、公開していない版）と、最新の版は null で返す', async () => {
        result = { data: { ...articleRow, latest_history: null }, error: null }

        const res = await get(`/api/articles/${ARTICLE_ID}`)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ ...article, latest_history: null })
    })

    it('下書き（公開中の版が無い）は、最新の版のタイトル・本文を返す', async () => {
        const latestContent = [{ ...content[0], id: 'b1' }]
        result = {
            data: {
                ...articleRow,
                status: 'draft',
                published_version: null,
                published_history: null,
                latest_history: { ...latestHistory, content: latestContent },
            },
            error: null,
        }

        const res = await get(`/api/articles/${ARTICLE_ID}`)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toMatchObject({
            title: latestHistory.title,
            content: latestContent,
            status: 'draft',
        })
    })

    it('公開中の版も最新の版も読めないと 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        result = { data: { ...articleRow, published_history: null, latest_history: null }, error: null }

        const res = await get(`/api/articles/${ARTICLE_ID}`)

        expect(res.status).toBe(500)
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
    /** 作成の関数が返す記事ID と、読み直した記事の行を順に返す */
    function queueCreated(row: unknown = articleRow) {
        queuedResults.push({ data: ARTICLE_ID, error: null }, { data: row, error: null })
    }

    it('作成の関数にイベント・タイトル・本文を渡し、作成した記事を読み直して 201', async () => {
        queueCreated()

        const res = await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '模擬店のお知らせ', content })

        expect(res.status).toBe(201)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('rpc')).toEqual([
            ['create_article', { target_event_id: EVENT_ID, new_title: '模擬店のお知らせ', new_content: content }],
        ])
        expect(argsOf('insert')).toEqual([])
        expect(argsOf('select')).toEqual([[ARTICLE_COLUMNS]])
        expect(argsOf('eq')).toEqual([['id', ARTICLE_ID]])
    })

    it('タイトル・本文とも空でも作成できる', async () => {
        queueCreated()

        const res = await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '', content: [] })

        expect(res.status).toBe(201)
        expect(argsOf('rpc')).toEqual([
            ['create_article', { target_event_id: EVENT_ID, new_title: '', new_content: [] }],
        ])
    })

    it('タイトルの前後の空白は取り除いて保存する', async () => {
        queueCreated()

        await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '  模擬店のお知らせ  ', content })

        expect(argsOf('rpc')).toEqual([
            ['create_article', { target_event_id: EVENT_ID, new_title: '模擬店のお知らせ', new_content: content }],
        ])
    })

    it('ボディに created_by・status があっても、作成の関数に渡さない（作成者はトークンのユーザー、下書きで作る）', async () => {
        queueCreated()

        await sendJson('/api/articles', 'POST', {
            event_id: EVENT_ID,
            created_by: OTHER_USER_ID,
            status: 'published',
            title: '',
            content,
        })

        expect(argsOf('rpc')).toEqual([
            ['create_article', { target_event_id: EVENT_ID, new_title: '', new_content: content }],
        ])
    })

    it('作成した記事の読み直しで DB のエラーが出たら 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        queuedResults.push({ data: ARTICLE_ID, error: null }, { data: null, error: dbError('XX000', 'boom') })

        const res = await sendJson('/api/articles', 'POST', { event_id: EVENT_ID, title: '', content })

        expect(res.status).toBe(500)
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
    const path = `/api/articles/${ARTICLE_ID}`

    it('保存の関数にタイトル・本文・公開状態を渡し、保存後の記事を最新の版つきで返す', async () => {
        queuedResults.push({ data: true, error: null }, { data: articleRow, error: null })

        const res = await sendJson(path, 'PUT', { title: '模擬店のお知らせ', content, status: 'published' })

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('rpc')).toEqual([
            [
                'save_article',
                {
                    target_article_id: ARTICLE_ID,
                    new_title: '模擬店のお知らせ',
                    new_content: content,
                    new_status: 'published',
                },
            ],
        ])
        expect(argsOf('update')).toEqual([])
        expect(argsOf('select')).toEqual([[ARTICLE_COLUMNS]])
        expect(argsOf('eq')).toEqual([['id', ARTICLE_ID]])
    })

    it('status を省略すると、公開状態を渡さない（公開状態を変えない。公開中の記事なら一時保存）', async () => {
        queuedResults.push({ data: true, error: null }, { data: articleRow, error: null })

        const res = await sendJson(path, 'PUT', { title: '模擬店のお知らせ', content })

        expect(res.status).toBe(200)
        const [[, args]] = argsOf('rpc') as [[string, Record<string, unknown>]]
        expect(args.new_status).toBeUndefined()
        expect(JSON.parse(JSON.stringify(args))).not.toHaveProperty('new_status')
    })

    it('ボディに event_id・created_by があっても、保存の関数に渡さない', async () => {
        queuedResults.push({ data: true, error: null }, { data: articleRow, error: null })

        await sendJson(path, 'PUT', {
            event_id: EVENT_ID,
            created_by: OTHER_USER_ID,
            title: '',
            content,
            status: 'draft',
        })

        expect(argsOf('rpc')).toEqual([
            [
                'save_article',
                { target_article_id: ARTICLE_ID, new_title: '', new_content: content, new_status: 'draft' },
            ],
        ])
    })

    it('保存できず（関数が false）、記事は読める（メンバーだが staff でない）と 403', async () => {
        queuedResults.push({ data: false, error: null }, { data: { id: ARTICLE_ID }, error: null })

        const res = await sendJson(path, 'PUT', { title: '', content, status: 'draft' })

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
        expect(argsOf('select')).toEqual([['id']])
    })

    it('保存できず、記事も読めない（存在しない・所属していないイベントの記事）と 404', async () => {
        queuedResults.push({ data: false, error: null }, { data: null, error: null })

        const res = await sendJson(path, 'PUT', { title: '', content, status: 'draft' })

        expect(res.status).toBe(404)
        expect(await errorCodeOf(res)).toBe('not_found')
    })

    it('保存の関数で DB のエラーが出たら 500 で、読み直さない', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        queuedResults.push({ data: null, error: dbError('XX000', 'boom') })

        const res = await sendJson(path, 'PUT', { title: '', content, status: 'draft' })

        expect(res.status).toBe(500)
        expect(argsOf('select')).toEqual([])
    })

    it('403 / 404 を分ける読み直しで DB のエラーが出たら 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        queuedResults.push({ data: false, error: null }, { data: null, error: dbError('XX000', 'boom') })

        const res = await sendJson(path, 'PUT', { title: '', content, status: 'draft' })

        expect(res.status).toBe(500)
    })

    it('区切り線・表を含む本文（エディタの出力をそのまま JSON で送ったもの）を保存できる', async () => {
        queuedResults.push({ data: true, error: null }, { data: articleRow, error: null })
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

        const res = await sendJson(path, 'PUT', { title: '', content: blockContent, status: 'draft' })

        expect(res.status).toBe(200)
        expect(argsOf('rpc')).toEqual([
            [
                'save_article',
                { target_article_id: ARTICLE_ID, new_title: '', new_content: blockContent, new_status: 'draft' },
            ],
        ])
    })

    it('title が無いと 400', async () => {
        const res = await sendJson(path, 'PUT', { content, status: 'draft' })

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })

    it('status が draft / published でないと 400', async () => {
        const res = await sendJson(path, 'PUT', { title: '', content, status: 'archived' })

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })
})

/** 予約。版2を 2099/09/20 09:00（日本時間）に公開する */
const schedule = {
    version: 2,
    publish_at: '2099-09-20T00:00:00+00:00',
    created_by: USER_ID,
    created_at: '2026-09-14T14:00:00+00:00',
    updated_at: '2026-09-14T14:00:00+00:00',
}

describe('PUT /api/articles/:id/schedule', () => {
    const path = `/api/articles/${ARTICLE_ID}/schedule`
    const input = {
        version: 2,
        version_updated_at: '2026-09-14T13:10:00.123456+00:00',
        publish_at: '2099-09-20T09:00:00+09:00',
    }

    it('予約の関数に版・版の更新日時・公開日時を渡し、予約後の記事を予約つきで返す', async () => {
        queuedResults.push({ data: true, error: null }, { data: { ...articleRow, schedule }, error: null })

        const res = await sendJson(path, 'PUT', input)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ ...article, schedule })
        expect(argsOf('rpc')).toEqual([
            [
                'schedule_article',
                {
                    target_article_id: ARTICLE_ID,
                    target_version: 2,
                    version_updated_at: input.version_updated_at,
                    new_publish_at: input.publish_at,
                },
            ],
        ])
        expect(argsOf('select')).toEqual([[ARTICLE_COLUMNS]])
        expect(argsOf('eq')).toEqual([['id', ARTICLE_ID]])
    })

    it('予約しようとした版が無い・上書きされていた（PT409）と 409 で、読み直さない', async () => {
        queuedResults.push({
            data: null,
            error: dbError('PT409', '予約しようとした版が見つからないか、更新されています'),
        })

        const res = await sendJson(path, 'PUT', input)

        expect(res.status).toBe(409)
        expect(await errorCodeOf(res)).toBe('conflict')
        expect(argsOf('select')).toEqual([])
    })

    it('予約できず（関数が false）、記事は読める（メンバーだが staff でない）と 403', async () => {
        queuedResults.push({ data: false, error: null }, { data: { id: ARTICLE_ID }, error: null })

        const res = await sendJson(path, 'PUT', input)

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
    })

    it('予約できず、記事も読めない（存在しない・所属していないイベントの記事）と 404', async () => {
        queuedResults.push({ data: false, error: null }, { data: null, error: null })

        const res = await sendJson(path, 'PUT', input)

        expect(res.status).toBe(404)
        expect(await errorCodeOf(res)).toBe('not_found')
    })

    it('それ以外の DB のエラーは 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        queuedResults.push({ data: null, error: dbError('XX000', 'boom') })

        const res = await sendJson(path, 'PUT', input)

        expect(res.status).toBe(500)
    })

    it('公開日時が現在以前だと 400 で、DB を呼ばない', async () => {
        const res = await sendJson(path, 'PUT', { ...input, publish_at: '2000-01-01T09:00:00+09:00' })

        expect(res.status).toBe(400)
        const body = (await res.json()) as { error: { details?: Record<string, string[]> } }
        expect(body.error.details?.publish_at).toContain('現在より後の日時を指定してください')
        expect(calls).toHaveLength(0)
    })

    it('版の番号・版の更新日時が無いと 400', async () => {
        const { version: _version, ...withoutVersion } = input
        const { version_updated_at: _versionUpdatedAt, ...withoutVersionUpdatedAt } = input

        expect((await sendJson(path, 'PUT', withoutVersion)).status).toBe(400)
        expect((await sendJson(path, 'PUT', withoutVersionUpdatedAt)).status).toBe(400)
        expect(calls).toHaveLength(0)
    })

    it('id が UUID でないと 400', async () => {
        const res = await sendJson('/api/articles/not-a-uuid/schedule', 'PUT', input)

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })
})

describe('DELETE /api/articles/:id/schedule', () => {
    const path = `/api/articles/${ARTICLE_ID}/schedule`

    it('予約を取り消す関数を呼び、取り消し後の記事を返す', async () => {
        queuedResults.push({ data: true, error: null }, { data: articleRow, error: null })

        const res = await remove(path)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual(article)
        expect(argsOf('rpc')).toEqual([['cancel_article_schedule', { target_article_id: ARTICLE_ID }]])
        expect(argsOf('select')).toEqual([[ARTICLE_COLUMNS]])
    })

    it('取り消せず（関数が false）、記事は読める（メンバーだが staff でない）と 403', async () => {
        queuedResults.push({ data: false, error: null }, { data: { id: ARTICLE_ID }, error: null })

        const res = await remove(path)

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
    })

    it('取り消せず、記事も読めないと 404', async () => {
        queuedResults.push({ data: false, error: null }, { data: null, error: null })

        const res = await remove(path)

        expect(res.status).toBe(404)
    })

    it('DB のエラーは 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        queuedResults.push({ data: null, error: dbError('XX000', 'boom') })

        const res = await remove(path)

        expect(res.status).toBe(500)
    })

    it('id が UUID でないと 400', async () => {
        const res = await remove('/api/articles/not-a-uuid/schedule')

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })
})
