import { describe, expect, it } from 'vitest'

import { anonClient, idsOf, INSUFFICIENT_PRIVILEGE, serviceClient, sorted, useRlsFixture } from './support'

const f = useRlsFixture()

async function titleOf(articleId: string): Promise<string | undefined> {
    const { data } = await serviceClient.from('articles').select('title').eq('id', articleId).single()
    return data?.title
}

describe('events', () => {
    it('メンバーは所属するイベントだけ読める（役割は問わない）', async () => {
        const ids = [f.eventA, f.eventB]

        const staff = await f.staff.client.from('events').select('id').in('id', ids)
        const visitor = await f.visitor.client.from('events').select('id').in('id', ids)

        expect(idsOf(staff.data)).toEqual(sorted([f.eventA, f.eventB]))
        expect(idsOf(visitor.data)).toEqual([f.eventA])
    })

    it('所属していない・論理削除されたユーザー・未ログインは読めない', async () => {
        const ids = [f.eventA, f.eventB]

        for (const client of [f.outsider.client, f.deleted.client, anonClient]) {
            const { data, error } = await client.from('events').select('id').in('id', ids)
            expect(error).toBeNull()
            expect(data).toEqual([])
        }
    })

    it('メンバーでも書き込めない', async () => {
        const insert = await f.staff.client.from('events').insert({ slug: `rls-${f.eventA}`, name: '勝手なイベント' })
        const update = await f.staff.client.from('events').update({ name: '書き換え' }).eq('id', f.eventA).select('id')

        expect(insert.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(update.data).toEqual([])
    })
})

describe('articles の読み取り', () => {
    it('メンバーは所属するイベントの記事だけ読める（役割は問わない）', async () => {
        const ids = [f.articleA, f.articleB]

        const staff = await f.staff.client.from('articles').select('id').in('id', ids)
        const visitor = await f.visitor.client.from('articles').select('id').in('id', ids)

        expect(idsOf(staff.data)).toEqual(sorted([f.articleA, f.articleB]))
        expect(idsOf(visitor.data)).toEqual([f.articleA])
    })

    it('所属していない・論理削除されたユーザー・未ログインは読めない', async () => {
        const ids = [f.articleA, f.articleB]

        for (const client of [f.outsider.client, f.deleted.client, anonClient]) {
            const { data, error } = await client.from('articles').select('id').in('id', ids)
            expect(error).toBeNull()
            expect(data).toEqual([])
        }
    })
})

describe('articles の作成', () => {
    it('staff はそのイベントに作成できる', async () => {
        const { data, error } = await f.staff.client
            .from('articles')
            .insert({ event_id: f.eventA, created_by: f.staff.id, title: 'staff が作成' })
            .select('id, event_id')
            .single()

        expect(error).toBeNull()
        expect(data?.event_id).toBe(f.eventA)
    })

    it.each([
        ['visitor として所属するイベント', 'staff', 'eventB'],
        ['visitor', 'visitor', 'eventA'],
        ['所属していないユーザー', 'outsider', 'eventA'],
        ['論理削除されたユーザー', 'deleted', 'eventA'],
    ] as const)('%s は作成できない', async (_label, user, event) => {
        const { error } = await f[user].client
            .from('articles')
            .insert({ event_id: f[event], created_by: f[user].id, title: '作成できない' })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('存在しないイベントへの作成も RLS で弾かれる（外部キー違反より先）', async () => {
        const { error } = await f.staff.client
            .from('articles')
            .insert({ event_id: crypto.randomUUID(), created_by: f.staff.id, title: '存在しないイベント' })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('未ログインは作成できない', async () => {
        const { error } = await anonClient
            .from('articles')
            .insert({ event_id: f.eventA, created_by: f.staff.id, title: '未ログイン' })

        expect(error).not.toBeNull()
    })

    it('staff でも、自分以外を作成者にして作成できない', async () => {
        const { error } = await f.staff.client
            .from('articles')
            .insert({ event_id: f.eventA, created_by: f.visitor.id, title: '他人の名前で作成' })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })
})

describe('articles の更新', () => {
    it('staff はそのイベントの記事を更新できる', async () => {
        const { data, error } = await f.staff.client
            .from('articles')
            .update({ title: 'staff が更新' })
            .eq('id', f.articleA)
            .select('id')

        expect(error).toBeNull()
        expect(idsOf(data)).toEqual([f.articleA])
        expect(await titleOf(f.articleA)).toBe('staff が更新')
    })

    it.each([
        ['visitor として所属するイベントの記事', 'staff', 'articleB'],
        ['visitor', 'visitor', 'articleA'],
        ['所属していないユーザー', 'outsider', 'articleA'],
        ['論理削除されたユーザー', 'deleted', 'articleA'],
    ] as const)('%s は更新できない（0件になり、中身は変わらない）', async (_label, user, article) => {
        const before = await titleOf(f[article])

        const { data, error } = await f[user].client
            .from('articles')
            .update({ title: '更新できない' })
            .eq('id', f[article])
            .select('id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await titleOf(f[article])).toBe(before)
    })

    it('staff でも、staff でないイベントへ記事を移せない', async () => {
        const { error } = await f.staff.client.from('articles').update({ event_id: f.eventB }).eq('id', f.articleA)

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        const { data } = await serviceClient.from('articles').select('event_id').eq('id', f.articleA).single()
        expect(data?.event_id).toBe(f.eventA)
    })

    it('staff でも作成者は変えられない（元の値のまま残る）', async () => {
        const { error } = await f.staff.client
            .from('articles')
            .update({ created_by: f.visitor.id })
            .eq('id', f.articleA)

        expect(error).toBeNull()
        const { data } = await serviceClient.from('articles').select('created_by').eq('id', f.articleA).single()
        expect(data?.created_by).toBe(f.staff.id)
    })
})

describe('articles の削除', () => {
    it('staff でも物理削除できない（論理削除しかしない）', async () => {
        const { data, error } = await f.staff.client.from('articles').delete().eq('id', f.articleA).select('id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await titleOf(f.articleA)).toBeDefined()
    })
})
