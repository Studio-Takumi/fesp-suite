import { beforeEach, describe, expect, it, vi } from 'vitest'

const jwtVerify = vi.fn()

vi.mock('jose', () => ({
    createRemoteJWKSet: () => vi.fn(),
    jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}))

const { default: app } = await import('./index')

const USER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'

/** テスト用の env（wrangler の Bindings 相当） */
const testEnv = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_JWKS_URL: 'https://test.supabase.co/auth/v1/.well-known/jwks.json',
    SUPABASE_JWT_ISSUER: 'https://test.supabase.co/auth/v1',
    ALLOWED_ORIGINS: 'http://localhost:5173',
    ASSETS_BUCKET: {} as R2Bucket,
}

const claims = (overrides: Record<string, unknown> = {}) => ({
    payload: {
        sub: USER_ID,
        iss: testEnv.SUPABASE_JWT_ISSUER,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'authenticated',
        email: 'user@example.com',
        ...overrides,
    },
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('GET /health', () => {
    it('200 を返す', async () => {
        const res = await app.request('/health', {}, testEnv)
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toMatchObject({ status: 'ok' })
    })
})

describe('クエリのバリデーション', () => {
    it('既定値が入る', async () => {
        const res = await app.request('/api/example', {}, testEnv)
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toMatchObject({ limit: 20, offset: 0 })
    })

    it('範囲外の値は共通エラー形式の 400 になる', async () => {
        const res = await app.request('/api/example?limit=999', {}, testEnv)
        expect(res.status).toBe(400)

        const body = (await res.json()) as {
            error: { code: string; details?: Record<string, string[]> }
        }
        expect(body.error.code).toBe('bad_request')
        expect(body.error.details?.limit?.length).toBeGreaterThan(0)
    })
})

describe('ボディのバリデーション（共有zodスキーマ）', () => {
    it('正しい入力なら 201', async () => {
        const res = await app.request(
            '/api/example',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '山田', email: 'a@example.com' }),
            },
            testEnv,
        )
        expect(res.status).toBe(201)
    })

    it('不正な入力はフィールド単位のエラーを返す', async () => {
        const res = await app.request(
            '/api/example',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '', email: 'not-an-email' }),
            },
            testEnv,
        )
        expect(res.status).toBe(400)

        const body = (await res.json()) as { error: { details?: Record<string, string[]> } }
        expect(body.error.details?.name).toContain('名前は必須です')
        expect(body.error.details?.email).toBeDefined()
    })
})

describe('JWT検証', () => {
    it('Authorization がないと 401', async () => {
        const res = await app.request('/api/me', {}, testEnv)
        expect(res.status).toBe(401)

        const body = (await res.json()) as { error: { code: string } }
        expect(body.error.code).toBe('unauthorized')
    })

    it('トークンが無効なら 401', async () => {
        jwtVerify.mockRejectedValueOnce(new Error('signature verification failed'))
        const res = await app.request('/api/me', { headers: { Authorization: 'Bearer invalid' } }, testEnv)
        expect(res.status).toBe(401)
    })

    it('検証が通れば user を返す', async () => {
        jwtVerify.mockResolvedValueOnce(claims())
        const res = await app.request('/api/me', { headers: { Authorization: 'Bearer valid' } }, testEnv)
        expect(res.status).toBe(200)

        const body = (await res.json()) as { user: { userId: string; role: string } }
        expect(body.user.userId).toBe(USER_ID)
        expect(body.user.role).toBe('authenticated')
    })

    it('JWKS と issuer の検証オプションを渡している', async () => {
        jwtVerify.mockResolvedValueOnce(claims())
        await app.request('/api/me', { headers: { Authorization: 'Bearer valid' } }, testEnv)

        expect(jwtVerify).toHaveBeenCalledWith(
            'valid',
            expect.anything(),
            expect.objectContaining({
                issuer: testEnv.SUPABASE_JWT_ISSUER,
                algorithms: ['RS256', 'ES256'],
            }),
        )
    })
})

describe('存在しないパス', () => {
    it('404 を共通エラー形式で返す', async () => {
        const res = await app.request('/api/nope', {}, testEnv)
        expect(res.status).toBe(404)

        const body = (await res.json()) as { error: { code: string } }
        expect(body.error.code).toBe('not_found')
    })
})
