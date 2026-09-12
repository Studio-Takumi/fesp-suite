import { z } from 'zod'

import { uuidSchema } from './common'

/**
 * Supabase Auth が発行する JWT のクレーム。
 * Hono / PartyKit 側で jose 検証したあとこれでパースする。
 * 非対称鍵（JWKS / RS256・ES256）前提。
 */
export const jwtClaimsSchema = z.object({
    sub: uuidSchema,
    email: z.email().optional(),
    /** Supabase の組み込みロール（authenticated / anon / service_role） */
    role: z.string().optional(),
    aud: z.union([z.string(), z.array(z.string())]).optional(),
    iss: z.string(),
    exp: z.number(),
    iat: z.number().optional(),
    session_id: z.string().optional(),
    /** 認可に使う独自クレームを足す場合はここ（Auth Hook で埋める） */
    app_metadata: z.looseObject({}).optional(),
    user_metadata: z.record(z.string(), z.unknown()).optional(),
})
export type JwtClaims = z.infer<typeof jwtClaimsSchema>

/** API ハンドラ内で扱う認証済みユーザー */
export const authUserSchema = z.object({
    userId: uuidSchema,
    email: z.email().nullable(),
    role: z.string(),
})
export type AuthUser = z.infer<typeof authUserSchema>

/** ログインフォーム */
export const signInSchema = z.object({
    email: z.email('メールアドレスの形式が正しくありません'),
    password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})
export type SignInInput = z.infer<typeof signInSchema>
