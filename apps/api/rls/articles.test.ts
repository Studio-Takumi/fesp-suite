import { describe, expect, it } from 'vitest'

import {
    anonClient,
    createArticle,
    idsOf,
    INSUFFICIENT_PRIVILEGE,
    serviceClient,
    sorted,
    useRlsFixture,
} from './support'

const f = useRlsFixture()

/** Postgres の foreign_key_violation */
const FOREIGN_KEY_VIOLATION = '23503'

async function publishedVersionOf(articleId: string): Promise<number | null | undefined> {
    const { data } = await serviceClient.from('articles').select('published_version').eq('id', articleId).single()
    return data?.published_version
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
    it('公開済みの記事は、所属するイベントのメンバーなら読める（役割は問わない）', async () => {
        const ids = [f.articleA, f.articleB]

        const staff = await f.staff.client.from('articles').select('id').in('id', ids)
        const visitor = await f.visitor.client.from('articles').select('id').in('id', ids)

        expect(idsOf(staff.data)).toEqual(sorted([f.articleA, f.articleB]))
        expect(idsOf(visitor.data)).toEqual([f.articleA])
    })

    it('下書きは、そのイベントの staff だけ読める（visitor として所属するイベントの下書きは読めない）', async () => {
        const ids = [f.draftA, f.draftB]

        const staff = await f.staff.client.from('articles').select('id').in('id', ids)
        const visitor = await f.visitor.client.from('articles').select('id').in('id', ids)

        expect(idsOf(staff.data)).toEqual([f.draftA])
        expect(visitor.error).toBeNull()
        expect(visitor.data).toEqual([])
    })

    it('所属していない・論理削除されたユーザー・未ログインは読めない', async () => {
        const ids = [f.articleA, f.articleB, f.draftA, f.draftB]

        for (const client of [f.outsider.client, f.deleted.client, anonClient]) {
            const { data, error } = await client.from('articles').select('id').in('id', ids)
            expect(error).toBeNull()
            expect(data).toEqual([])
        }
    })
})

describe('articles の作成（create_article）', () => {
    it('staff はそのイベントに作成でき、作成者は呼び出したユーザーになる', async () => {
        const { data: id, error } = await f.staff.client.rpc('create_article', {
            target_event_id: f.eventA,
            new_title: 'staff が作成',
            new_content: [],
        })

        expect(error).toBeNull()
        const { data } = await serviceClient
            .from('articles')
            .select('event_id, created_by, latest_version')
            .eq('id', id!)
            .single()
        expect(data).toEqual({ event_id: f.eventA, created_by: f.staff.id, latest_version: 1 })
    })

    it.each([
        ['visitor として所属するイベント', 'staff', 'eventB'],
        ['visitor', 'visitor', 'eventA'],
        ['所属していないユーザー', 'outsider', 'eventA'],
        ['論理削除されたユーザー', 'deleted', 'eventA'],
    ] as const)('%s は作成できない', async (_label, user, event) => {
        const { error } = await f[user].client.rpc('create_article', {
            target_event_id: f[event],
            new_title: '作成できない',
            new_content: [],
        })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('存在しないイベントへの作成も RLS で弾かれる（外部キー違反より先）', async () => {
        const { error } = await f.staff.client.rpc('create_article', {
            target_event_id: crypto.randomUUID(),
            new_title: '存在しないイベント',
            new_content: [],
        })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('未ログインは呼べない', async () => {
        const { error } = await anonClient.rpc('create_article', {
            target_event_id: f.eventA,
            new_title: '未ログイン',
            new_content: [],
        })

        expect(error).not.toBeNull()
    })

    it('staff でも、版なしで記事を直接作れない（最新の版の外部キー違反）', async () => {
        const { error } = await f.staff.client
            .from('articles')
            .insert({ event_id: f.eventA, created_by: f.staff.id, latest_version: 1 })

        expect(error?.code).toBe(FOREIGN_KEY_VIOLATION)
    })

    it('staff でも、自分以外を作成者にして記事を直接作れない', async () => {
        const { error } = await f.staff.client
            .from('articles')
            .insert({ event_id: f.eventA, created_by: f.visitor.id, latest_version: 1 })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })
})

describe('articles の更新', () => {
    it('staff はそのイベントの記事を更新できる', async () => {
        const id = await createArticle(f.staff, f.eventA, '更新のテスト', 'published')

        const { data, error } = await f.staff.client
            .from('articles')
            .update({ published_version: null })
            .eq('id', id)
            .select('id')

        expect(error).toBeNull()
        expect(idsOf(data)).toEqual([id])
        expect(await publishedVersionOf(id)).toBeNull()
    })

    it.each([
        ['visitor として所属するイベントの記事', 'staff', 'articleB'],
        ['visitor', 'visitor', 'articleA'],
        ['所属していないユーザー', 'outsider', 'articleA'],
        ['論理削除されたユーザー', 'deleted', 'articleA'],
    ] as const)('%s は更新できない（0件になり、公開中のまま変わらない）', async (_label, user, article) => {
        const { data, error } = await f[user].client
            .from('articles')
            .update({ published_version: null })
            .eq('id', f[article])
            .select('id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await publishedVersionOf(f[article])).toBe(1)
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

describe('articles の公開状態と公開日時', () => {
    async function publicationOf(articleId: string) {
        const { data } = await serviceClient
            .from('articles')
            .select('status, published_at')
            .eq('id', articleId)
            .single()
        return data
    }

    async function update(articleId: string, values: { published_version?: number | null; published_at?: string }) {
        const { error } = await f.staff.client.from('articles').update(values).eq('id', articleId)
        expect(error).toBeNull()
    }

    it('作成した記事は下書きで、公開日時は NULL', async () => {
        const id = await createArticle(f.staff, f.eventA, '作成直後')

        expect(await publicationOf(id)).toEqual({ status: 'draft', published_at: null })
    })

    it('公開状態は公開中の版から決まり、直接は書き込めない（生成列）', async () => {
        const id = await createArticle(f.staff, f.eventA, '公開状態のテスト')

        const { error } = await f.staff.client.from('articles').update({ status: 'published' }).eq('id', id)
        expect(error).not.toBeNull()
        expect((await publicationOf(id))?.status).toBe('draft')

        await update(id, { published_version: 1 })
        expect((await publicationOf(id))?.status).toBe('published')
    })

    it('初めて公開したときに公開日時が入り、下書きに戻しても・公開し直しても変わらない', async () => {
        const id = await createArticle(f.staff, f.eventA, '公開日時のテスト')

        await update(id, { published_version: 1 })
        const published = await publicationOf(id)
        expect(published?.status).toBe('published')
        expect(published?.published_at).not.toBeNull()

        await update(id, { published_version: null })
        expect(await publicationOf(id)).toEqual({ status: 'draft', published_at: published?.published_at })

        await update(id, { published_version: 1 })
        expect(await publicationOf(id)).toEqual({ status: 'published', published_at: published?.published_at })
    })

    it('staff でも公開日時は書き換えられない（下書きは NULL のまま、公開済みは元の値のまま）', async () => {
        const id = await createArticle(f.staff, f.eventA, '公開日時の書き換え')

        await update(id, { published_at: '2000-01-01T00:00:00+00:00' })
        expect((await publicationOf(id))?.published_at).toBeNull()

        await update(id, { published_version: 1 })
        const published = await publicationOf(id)
        await update(id, { published_at: '2000-01-01T00:00:00+00:00' })
        expect((await publicationOf(id))?.published_at).toBe(published?.published_at)
    })
})

describe('articles の削除', () => {
    it('staff でも物理削除できない（論理削除しかしない）', async () => {
        const { data, error } = await f.staff.client.from('articles').delete().eq('id', f.articleA).select('id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await publishedVersionOf(f.articleA)).toBe(1)
    })
})
