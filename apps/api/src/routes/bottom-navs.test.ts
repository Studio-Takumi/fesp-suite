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
    createUserClient: () => createQueryBuilder(),
}))

const { default: app } = await import('../index')

const USER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'
const NAV_ID = '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d'

const testEnv = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_JWKS_URL: 'https://test.supabase.co/auth/v1/.well-known/jwks.json',
    SUPABASE_JWT_ISSUER: 'https://test.supabase.co/auth/v1',
    ALLOWED_ORIGINS: 'http://localhost:3001',
    ASSETS_BUCKET: {} as R2Bucket,
}

const authorization = { Authorization: 'Bearer valid-token' }

const navItem = { id: NAV_ID, label: 'お知らせ', icon: 'Bell', href: '/news', sort_order: 0 }

const get = (path: string, headers: Record<string, string> = authorization) => app.request(path, { headers }, testEnv)

const put = (path: string, body: unknown, headers: Record<string, string> = authorization) =>
    app.request(
        path,
        { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        testEnv,
    )

function argsOf(method: string): unknown[][] {
    return calls.filter((call) => call.method === method).map((call) => call.args)
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
        ['GET', `/api/bottom-navs?event_id=${EVENT_ID}`],
        ['PUT', '/api/bottom-navs'],
    ] as const)('%s %s は Authorization が無いと 401 で、DB を読まない', async (method, path) => {
        const res = method === 'GET' ? await get(path, {}) : await put(path, { event_id: EVENT_ID, items: [] }, {})

        expect(res.status).toBe(401)
        expect(await errorCodeOf(res)).toBe('unauthorized')
        expect(calls).toHaveLength(0)
    })
})

describe('GET /api/bottom-navs', () => {
    it('イベントの項目を sort_order の順で返す', async () => {
        result = { data: [navItem], error: null }

        const res = await get(`/api/bottom-navs?event_id=${EVENT_ID}`)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ items: [navItem] })
        expect(argsOf('eq')).toEqual([['event_id', EVENT_ID]])
        expect(argsOf('order')).toEqual([['sort_order']])
    })

    it('event_id が無い・UUID でないと 400', async () => {
        expect((await get('/api/bottom-navs')).status).toBe(400)
        expect((await get('/api/bottom-navs?event_id=not-uuid')).status).toBe(400)
        expect(calls).toHaveLength(0)
    })
})

describe('PUT /api/bottom-navs', () => {
    it('いまの項目を全部消してから入れ直し、渡した順を sort_order にする', async () => {
        // delete → insert → 読み直し
        queuedResults.push({ data: null, error: null }, { data: null, error: null })
        result = { data: [navItem], error: null }

        const res = await put('/api/bottom-navs', {
            event_id: EVENT_ID,
            items: [
                { label: 'ホーム', icon: 'House', href: '/' },
                { label: 'お知らせ', icon: 'Bell', href: '/news' },
            ],
        })

        expect(res.status).toBe(200)
        expect(argsOf('delete')).toHaveLength(1)
        expect(argsOf('insert')).toEqual([
            [
                [
                    { label: 'ホーム', icon: 'House', href: '/', event_id: EVENT_ID, sort_order: 0 },
                    { label: 'お知らせ', icon: 'Bell', href: '/news', event_id: EVENT_ID, sort_order: 1 },
                ],
            ],
        ])
        expect(await res.json()).toEqual({ items: [navItem] })
    })

    it('空配列なら消すだけで、入れ直さない', async () => {
        queuedResults.push({ data: null, error: null })
        result = { data: [], error: null }

        const res = await put('/api/bottom-navs', { event_id: EVENT_ID, items: [] })

        expect(res.status).toBe(200)
        expect(argsOf('delete')).toHaveLength(1)
        expect(argsOf('insert')).toHaveLength(0)
        expect(await res.json()).toEqual({ items: [] })
    })

    it('空配列にしたのに項目が残っていたら 403（staff でないので消せていない）', async () => {
        queuedResults.push({ data: null, error: null })
        result = { data: [navItem], error: null }

        const res = await put('/api/bottom-navs', { event_id: EVENT_ID, items: [] })

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
    })

    it('staff でなければ 403', async () => {
        queuedResults.push(
            { data: null, error: null },
            { data: null, error: dbError('42501', 'new row violates row-level security policy') },
        )

        const res = await put('/api/bottom-navs', {
            event_id: EVENT_ID,
            items: [{ label: 'ホーム', icon: 'House', href: '/' }],
        })

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
    })

    it.each([
        ['項目が6件', { items: Array.from({ length: 6 }, () => ({ label: 'あ', icon: 'Bell', href: '/a' })) }],
        ['ラベルが空', { items: [{ label: '', icon: 'Bell', href: '/news' }] }],
        ['ラベルが10文字を超える', { items: [{ label: 'あ'.repeat(11), icon: 'Bell', href: '/news' }] }],
        ['移動先が / で始まらない', { items: [{ label: 'お知らせ', icon: 'Bell', href: 'news' }] }],
        ['移動先が100文字を超える', { items: [{ label: 'お知らせ', icon: 'Bell', href: `/${'a'.repeat(100)}` }] }],
        ['アイコンが PascalCase でない', { items: [{ label: 'お知らせ', icon: 'bell', href: '/news' }] }],
        ['アイコンが空', { items: [{ label: 'お知らせ', icon: '', href: '/news' }] }],
    ])('ボディが不正なら 400（%s）', async (_label, body) => {
        const res = await put('/api/bottom-navs', { event_id: EVENT_ID, ...body })

        expect(res.status).toBe(400)
        expect(await errorCodeOf(res)).toBe('bad_request')
        expect(calls).toHaveLength(0)
    })

    it('項目が5件ちょうどなら受け付ける', async () => {
        queuedResults.push({ data: null, error: null }, { data: null, error: null })
        result = { data: [], error: null }

        const res = await put('/api/bottom-navs', {
            event_id: EVENT_ID,
            items: Array.from({ length: 5 }, () => ({ label: 'あ', icon: 'Bell', href: '/a' })),
        })

        expect(res.status).toBe(200)
    })
})
