import { beforeEach, describe, expect, it, vi } from 'vitest'

type QueryResult = { data: unknown; error: (Error & { code: string }) | null }

const jwtVerify = vi.fn()

vi.mock('jose', () => ({
    createRemoteJWKSet: () => vi.fn(),
    jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}))

const calls: { method: string; args: unknown[] }[] = []
let result: QueryResult = { data: null, error: null }
let clientToken: string | null = null

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
    createUserClient: (_env: unknown, accessToken: string) => {
        clientToken = accessToken
        return createQueryBuilder()
    },
}))

const { default: app } = await import('../index')

const USER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'

const testEnv = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_JWKS_URL: 'https://test.supabase.co/auth/v1/.well-known/jwks.json',
    SUPABASE_JWT_ISSUER: 'https://test.supabase.co/auth/v1',
    ALLOWED_ORIGINS: 'http://localhost:5173',
    ASSETS_BUCKET: {} as R2Bucket,
}

const userRow = {
    id: USER_ID,
    created_at: '2026-09-15T10:00:00+09:00',
    updated_at: '2026-09-15T10:00:00+09:00',
}

const authorized = { headers: { Authorization: 'Bearer valid-token' } }

beforeEach(() => {
    vi.clearAllMocks()
    calls.length = 0
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

describe('GET /api/me', () => {
    it('自分のユーザーの行を返す', async () => {
        result = { data: userRow, error: null }

        const res = await app.request('/api/me', authorized, testEnv)

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual(userRow)
    })

    it('ユーザーのトークンを引き継いだクライアントで、自分の論理削除されていない行を読む', async () => {
        result = { data: userRow, error: null }

        await app.request('/api/me', authorized, testEnv)

        expect(clientToken).toBe('valid-token')
        expect(calls).toContainEqual({ method: 'from', args: ['users'] })
        expect(calls).toContainEqual({ method: 'eq', args: ['id', USER_ID] })
        expect(calls).toContainEqual({ method: 'is', args: ['deleted_at', null] })
    })

    it('行が見つからない（存在しない・論理削除済み）なら 404', async () => {
        const res = await app.request('/api/me', authorized, testEnv)

        expect(res.status).toBe(404)
        const body = (await res.json()) as { error: { code: string } }
        expect(body.error.code).toBe('not_found')
    })

    it('Authorization がないと 401 で、DB を読まない', async () => {
        const res = await app.request('/api/me', {}, testEnv)

        expect(res.status).toBe(401)
        expect(calls).toHaveLength(0)
    })

    it('DB のエラーは 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        result = { data: null, error: Object.assign(new Error('connection refused'), { code: 'XX000' }) }

        const res = await app.request('/api/me', authorized, testEnv)

        expect(res.status).toBe(500)
    })
})
