import { describe, expect, it } from 'vitest'

import { jwtClaimsSchema } from './auth'
import { errorResponseSchema, paginationQuerySchema } from './common'
import { exampleInputSchema } from './example'

describe('paginationQuerySchema', () => {
    it('文字列のクエリを数値に変換し、既定値を埋める', () => {
        expect(paginationQuerySchema.parse({ limit: '10' })).toEqual({ limit: 10, offset: 0 })
    })

    it('範囲外の limit は弾く', () => {
        expect(paginationQuerySchema.safeParse({ limit: 999 }).success).toBe(false)
    })
})

describe('exampleInputSchema', () => {
    it('既定値が埋まる', () => {
        const parsed = exampleInputSchema.parse({ name: '山田', email: 'a@example.com' })
        expect(parsed.note).toBe('')
    })

    it('必須項目が空ならエラーメッセージを返す', () => {
        const result = exampleInputSchema.safeParse({ name: '', email: 'a@example.com' })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('名前は必須です')
        }
    })

    it('メールアドレスの形式を検証する', () => {
        const result = exampleInputSchema.safeParse({ name: '山田', email: 'not-an-email' })
        expect(result.success).toBe(false)
    })
})

describe('jwtClaimsSchema', () => {
    it('Supabase のクレームをパースできる', () => {
        const claims = jwtClaimsSchema.parse({
            sub: '3f0f7f1a-6a9a-4b2e-9f0e-2b3c4d5e6f70',
            iss: 'https://test.supabase.co/auth/v1',
            exp: 1_800_000_000,
            role: 'authenticated',
            email: 'user@example.com',
        })
        expect(claims.role).toBe('authenticated')
    })

    it('sub が UUID でなければ弾く', () => {
        expect(jwtClaimsSchema.safeParse({ sub: 'abc', iss: 'https://x', exp: 1 }).success).toBe(false)
    })
})

describe('errorResponseSchema', () => {
    it('API共通のエラー形式をパースできる', () => {
        const parsed = errorResponseSchema.parse({
            error: {
                code: 'bad_request',
                message: '入力値が不正です',
                details: { name: ['名前は必須です'] },
            },
        })
        expect(parsed.error.details?.name).toEqual(['名前は必須です'])
    })
})
