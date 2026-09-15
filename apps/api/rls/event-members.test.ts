import { describe, expect, it } from 'vitest'

import {
    anonClient,
    INSUFFICIENT_PRIVILEGE,
    serviceClient,
    SUPABASE_ANON_KEY,
    SUPABASE_URL,
    useRlsFixture,
} from './support'

const f = useRlsFixture()

async function roleOf(userId: string, eventId: string) {
    const { data } = await serviceClient
        .from('event_members')
        .select('role')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .maybeSingle()
    return data?.role
}

describe('event_members', () => {
    it('自分の所属だけ読める（同じイベントの他のメンバーは見えない）', async () => {
        const events = [f.eventA, f.eventB]

        const staff = await f.staff.client
            .from('event_members')
            .select('user_id, event_id, role')
            .in('event_id', events)
        const visitor = await f.visitor.client
            .from('event_members')
            .select('user_id, event_id, role')
            .in('event_id', events)

        expect(staff.data).toHaveLength(2)
        expect(staff.data?.every((row) => row.user_id === f.staff.id)).toBe(true)
        expect(visitor.data).toEqual([{ user_id: f.visitor.id, event_id: f.eventA, role: 'visitor' }])
    })

    it('所属していないユーザー・未ログインは何も読めない', async () => {
        for (const client of [f.outsider.client, anonClient]) {
            const { data, error } = await client
                .from('event_members')
                .select('user_id')
                .in('event_id', [f.eventA, f.eventB])
            expect(error).toBeNull()
            expect(data).toEqual([])
        }
    })

    it('自分をイベントに参加させられない', async () => {
        const { error } = await f.outsider.client
            .from('event_members')
            .insert({ user_id: f.outsider.id, event_id: f.eventA, role: 'staff' })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(await roleOf(f.outsider.id, f.eventA)).toBeUndefined()
    })

    it('自分の役割を変えられない', async () => {
        const { data, error } = await f.visitor.client
            .from('event_members')
            .update({ role: 'staff' })
            .eq('user_id', f.visitor.id)
            .eq('event_id', f.eventA)
            .select('user_id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await roleOf(f.visitor.id, f.eventA)).toBe('visitor')
    })

    it('所属を消せない', async () => {
        const { data, error } = await f.visitor.client
            .from('event_members')
            .delete()
            .eq('user_id', f.visitor.id)
            .eq('event_id', f.eventA)
            .select('user_id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await roleOf(f.visitor.id, f.eventA)).toBe('visitor')
    })
})

describe('所属の判定関数（private スキーマ）', () => {
    it.each(['is_event_member', 'is_event_staff'])('%s は API（PostgREST の RPC）から呼べない', async (fn) => {
        for (const profile of ['public', 'private']) {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${f.staff.accessToken}`,
                    'Content-Type': 'application/json',
                    'Content-Profile': profile,
                },
                body: JSON.stringify({ target_event_id: f.eventA }),
            })

            expect(res.ok).toBe(false)
        }
    })
})
