import { createMiddleware } from 'hono/factory'

import { unauthorized } from '../lib/errors'
import { extractBearerToken, toAuthUser, verifyAccessToken } from '../lib/jwt'
import type { AppEnv } from '../types'

/**
 * 認証が必要なルートに付けるミドルウェア。
 * Supabase が発行した JWT を JWKS で検証し、`user` / `accessToken` を c.set() する。
 *
 *   app.get("/api/me", requireAuth, (c) => c.json({ user: c.get("user") }));
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
    const token = extractBearerToken(c.req.header('Authorization'))
    if (!token) {
        throw unauthorized('Authorization ヘッダーがありません')
    }

    try {
        const claims = await verifyAccessToken(token, {
            jwksUrl: c.env.SUPABASE_JWKS_URL,
            issuer: c.env.SUPABASE_JWT_ISSUER,
        })

        c.set('user', toAuthUser(claims))
        c.set('accessToken', token)
    } catch {
        throw unauthorized('トークンが無効です')
    }

    await next()
})
