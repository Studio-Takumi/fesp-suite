import { describe, expect, it } from 'vitest'

import { redirectPathSchema, signUpSchema } from './auth'

describe('signUpSchema', () => {
    it('メールアドレスとパスワードを受け付ける', () => {
        expect(signUpSchema.safeParse({ email: 'a@example.com', password: 'password' }).success).toBe(true)
    })

    it('パスワードが8文字未満ならエラーメッセージを返す', () => {
        const result = signUpSchema.safeParse({ email: 'a@example.com', password: 'short' })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('パスワードは8文字以上で入力してください')
        }
    })

    it('メールアドレスの形式を検証する', () => {
        const result = signUpSchema.safeParse({ email: 'not-an-email', password: 'password' })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0]?.message).toBe('メールアドレスの形式が正しくありません')
        }
    })
})

describe('redirectPathSchema', () => {
    it.each(['/', '/articles/abc', '/settings?tab=1#top'])('サイト内のパス %s はそのまま通す', (path) => {
        expect(redirectPathSchema.parse(path)).toBe(path)
    })

    it.each(['//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', 'articles', ''])(
        '%s は / にする',
        (path) => {
            expect(redirectPathSchema.parse(path)).toBe('/')
        },
    )

    it('文字列でないとき（クエリがないとき）は / にする', () => {
        expect(redirectPathSchema.parse(undefined)).toBe('/')
    })
})
