import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

import { type AuthUser, type JwtClaims, jwtClaimsSchema } from '@fesp/schema'

/**
 * JWKS の取得は Worker のグローバルスコープでキャッシュする。
 * jose 側でも鍵のキャッシュ・自動リフレッシュを行うため、URL 単位で使い回す。
 */
const jwksCache = new Map<string, JWTVerifyGetKey>()

export function getJwks(jwksUrl: string): JWTVerifyGetKey {
    const cached = jwksCache.get(jwksUrl)
    if (cached) return cached

    const jwks = createRemoteJWKSet(new URL(jwksUrl), {
        cacheMaxAge: 10 * 60 * 1000,
        cooldownDuration: 30 * 1000,
    })
    jwksCache.set(jwksUrl, jwks)
    return jwks
}

export type VerifyOptions = {
    jwksUrl: string
    issuer: string
    /** テストから鍵解決を差し替えるためのフック */
    getKey?: JWTVerifyGetKey
}

/**
 * Supabase が発行した JWT を非対称鍵（RS256 / ES256）で検証する。
 * 秘密鍵を共有せずに済むため、エッジ（Workers）でも安全に検証できる。
 */
export async function verifyAccessToken(token: string, { jwksUrl, issuer, getKey }: VerifyOptions): Promise<JwtClaims> {
    const keyResolver = getKey ?? getJwks(jwksUrl)
    const { payload } = await jwtVerify(token, keyResolver, {
        issuer,
        algorithms: ['RS256', 'ES256'],
    })
    return jwtClaimsSchema.parse(payload)
}

/** 検証済みクレームからハンドラで使う形へ落とす */
export function toAuthUser(claims: JwtClaims): AuthUser {
    return {
        userId: claims.sub,
        email: claims.email ?? null,
        role: claims.role ?? 'authenticated',
    }
}

/** `Authorization: Bearer <token>` からトークンを取り出す */
export function extractBearerToken(header: string | undefined | null): string | null {
    if (!header) return null
    const match = /^Bearer\s+(.+)$/i.exec(header.trim())
    return match?.[1] ?? null
}
