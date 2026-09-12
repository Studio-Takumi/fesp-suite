import type { AuthUser } from '@fesp/schema'

/** wrangler.jsonc の vars / bindings と .dev.vars のシークレット */
export type Bindings = {
    SUPABASE_URL: string
    SUPABASE_ANON_KEY: string
    /** 強い権限が必要な一部操作のみ使用。使う場合は認可を自前で実装すること */
    SUPABASE_SERVICE_ROLE_KEY?: string
    SUPABASE_JWKS_URL: string
    SUPABASE_JWT_ISSUER: string
    ALLOWED_ORIGINS: string
    ASSETS_BUCKET: R2Bucket
}

/** ミドルウェアが c.set() で詰める値 */
export type Variables = {
    user: AuthUser
    accessToken: string
}

export type AppEnv = {
    Bindings: Bindings
    Variables: Variables
}
