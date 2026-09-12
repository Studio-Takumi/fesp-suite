import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'

import { type ErrorResponse, exampleInputSchema, type ExampleResponse, paginationQuerySchema } from '@fesp/schema'

import { validationHook } from './lib/validator'
import { requireAuth } from './middleware/auth'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

app.use('*', logger())

app.use('*', async (c, next) => {
    const allowed = (c.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)

    return cors({
        origin: (origin) => (allowed.includes(origin) ? origin : (allowed[0] ?? '')),
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        maxAge: 600,
        credentials: false,
    })(c, next)
})

app.get('/health', (c) => c.json({ status: 'ok', now: new Date().toISOString() }))

/**
 * ここから下は配線確認用のサンプル。実装を始めるときは
 * `src/routes/` を作ってこのファイルから `app.route()` で束ねる。
 */
export const routes = app
    // クエリのバリデーション例
    .get('/api/example', zValidator('query', paginationQuerySchema, validationHook), (c) => {
        const { limit, offset } = c.req.valid('query')
        return c.json<ExampleResponse & { limit: number; offset: number }>({
            message: 'APIの配線確認用エンドポイントです',
            now: new Date().toISOString(),
            limit,
            offset,
        })
    })

    // 共有zodスキーマでのボディ検証例（フロントのフォームと同じ定義を使う）
    .post('/api/example', zValidator('json', exampleInputSchema, validationHook), (c) => {
        return c.json({ received: c.req.valid('json') }, 201)
    })

    // JWT検証の例（Authorization: Bearer <supabaseのaccess_token>）
    .get('/api/me', requireAuth, (c) => c.json({ user: c.get('user') }))

app.notFound((c) => {
    const body: ErrorResponse = {
        error: { code: 'not_found', message: 'エンドポイントが見つかりません' },
    }
    return c.json(body, 404)
})

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse()
    }
    console.error('[unhandled]', err)
    const body: ErrorResponse = {
        error: { code: 'internal_error', message: 'サーバー内部エラーが発生しました' },
    }
    return c.json(body, 500)
})

/** フロントから hono/client で型共有したいときに使う */
export type AppType = typeof routes

export default app
