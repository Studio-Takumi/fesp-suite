import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

import { type JwtClaims, jwtClaimsSchema } from '@fesp/schema'

/** JWKS は URL 単位でキャッシュする（apps/api と同方式） */
const jwksCache = new Map<string, JWTVerifyGetKey>()

function getJwks(jwksUrl: string): JWTVerifyGetKey {
    const cached = jwksCache.get(jwksUrl)
    if (cached) return cached

    const jwks = createRemoteJWKSet(new URL(jwksUrl), { cacheMaxAge: 10 * 60 * 1000 })
    jwksCache.set(jwksUrl, jwks)
    return jwks
}

export type RealtimeEnv = {
    SUPABASE_JWKS_URL: string
    SUPABASE_JWT_ISSUER: string
}

/** Supabase の JWT を非対称鍵で検証する */
export async function verifyToken(token: string, env: RealtimeEnv, getKey?: JWTVerifyGetKey): Promise<JwtClaims> {
    const { payload } = await jwtVerify(token, getKey ?? getJwks(env.SUPABASE_JWKS_URL), {
        issuer: env.SUPABASE_JWT_ISSUER,
        algorithms: ['RS256', 'ES256'],
    })
    return jwtClaimsSchema.parse(payload)
}

/** 接続URLのクエリ（?token=...）からトークンを取り出す */
export function extractToken(url: string): string | null {
    return new URL(url).searchParams.get('token')
}

/**
 * 入室可否の判定。
 *
 * 現状は「検証済みトークンを持っていれば入れる」だけ。
 * ドメインが決まったら、ルームIDと JWT のクレーム（所属など）を突き合わせて
 * 他人のドキュメントに入れないようにすること。
 */
export function canJoinRoom(claims: JwtClaims, roomId: string): boolean {
    return Boolean(claims.sub) && roomId.length > 0
}
