import { describe, expect, it } from 'vitest'

import type { JwtClaims } from '@fesp/schema'

import { canJoinRoom, extractToken } from './auth'

const claims: JwtClaims = {
    sub: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
    iss: 'https://test.supabase.co/auth/v1',
    exp: Math.floor(Date.now() / 1000) + 3600,
}

describe('extractToken', () => {
    it('クエリから token を取り出す', () => {
        expect(extractToken('https://party.example.com/parties/main/room?token=abc')).toBe('abc')
    })

    it('token がなければ null', () => {
        expect(extractToken('https://party.example.com/parties/main/room')).toBeNull()
    })
})

describe('canJoinRoom', () => {
    it('検証済みトークンがあれば入室できる', () => {
        expect(canJoinRoom(claims, 'room-1')).toBe(true)
    })

    it('ルームIDが空なら拒否', () => {
        expect(canJoinRoom(claims, '')).toBe(false)
    })
})
