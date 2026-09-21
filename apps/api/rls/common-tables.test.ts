import { describe, expect, it } from 'vitest'

import { anonClient, idsOf, INSUFFICIENT_PRIVILEGE, serviceClient, useRlsFixture } from './support'

/**
 * 開催日・場所・タグ・記事とタグの結び付きの RLS。
 * 「他人のイベントの行が見えない・触れない」を重点的に確かめる（supabase/README.md）
 */
const fixture = useRlsFixture()

/** service_role で作り、テストのあとはイベントごと消えるので片付けはしない */
async function seedEventDay(eventId: string, day: number, date: string): Promise<string> {
    const { data, error } = await serviceClient
        .from('event_days')
        .insert({ event_id: eventId, day, date })
        .select('id')
        .single()
    if (error) throw new Error(`開催日の作成に失敗しました: ${error.message}`)
    return data.id
}

async function seedPlace(eventId: string, name: string): Promise<string> {
    const { data, error } = await serviceClient.from('places').insert({ event_id: eventId, name }).select('id').single()
    if (error) throw new Error(`場所の作成に失敗しました: ${error.message}`)
    return data.id
}

async function seedTag(eventId: string, name: string): Promise<string> {
    const { data, error } = await serviceClient.from('tags').insert({ event_id: eventId, name }).select('id').single()
    if (error) throw new Error(`タグの作成に失敗しました: ${error.message}`)
    return data.id
}

describe('event_days', () => {
    it('メンバーは自分のイベントの開催日だけ読める。未ログインは読めない', async () => {
        const dayA = await seedEventDay(fixture.eventA, 1, '2026-06-06')
        await seedEventDay(fixture.eventB, 1, '2026-06-06')

        const asStaff = await fixture.staff.client.from('event_days').select('id').eq('event_id', fixture.eventA)
        const asVisitor = await fixture.visitor.client.from('event_days').select('id')
        const asOutsider = await fixture.outsider.client.from('event_days').select('id')
        const asAnon = await anonClient.from('event_days').select('id')

        expect(idsOf(asStaff.data)).toEqual([dayA])
        // visitor は eventA だけのメンバーなので、eventB の開催日は混ざらない
        expect(idsOf(asVisitor.data)).toEqual([dayA])
        expect(idsOf(asOutsider.data)).toEqual([])
        expect(idsOf(asAnon.data)).toEqual([])
    })

    it('staff だけが作れる', async () => {
        const asStaff = await fixture.staff.client
            .from('event_days')
            .insert({ event_id: fixture.eventA, day: 8, date: '2026-08-08' })
            .select('id')
        const asVisitor = await fixture.visitor.client
            .from('event_days')
            .insert({ event_id: fixture.eventA, day: 9, date: '2026-09-09' })
            .select('id')

        expect(asStaff.error).toBeNull()
        expect(asVisitor.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('別のイベントの開催日は、staff でも更新・削除できない', async () => {
        const dayB = await seedEventDay(fixture.eventB, 2, '2026-06-07')

        const updated = await fixture.staff.client
            .from('event_days')
            .update({ name: '書き換え' })
            .eq('id', dayB)
            .select('id')
        const deleted = await fixture.staff.client.from('event_days').delete().eq('id', dayB).select('id')

        // RLS では行が見えないだけなので、エラーではなく0件になる
        expect(idsOf(updated.data)).toEqual([])
        expect(idsOf(deleted.data)).toEqual([])
    })

    it('別のイベントへ付け替えられない', async () => {
        const dayA = await seedEventDay(fixture.eventA, 3, '2026-06-08')

        const { data, error } = await fixture.staff.client
            .from('event_days')
            .update({ event_id: fixture.eventB })
            .eq('id', dayA)
            .select('id')

        // 更新後の event_id でも staff かを見るので、with check に落ちる
        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(data).toBeNull()
    })
})

describe('places', () => {
    it('メンバーは自分のイベントの場所だけ読める', async () => {
        const placeA = await seedPlace(fixture.eventA, '特別教室A')
        await seedPlace(fixture.eventB, '特別教室B')

        const asVisitor = await fixture.visitor.client.from('places').select('id')
        const asOutsider = await fixture.outsider.client.from('places').select('id')

        expect(idsOf(asVisitor.data)).toEqual([placeA])
        expect(idsOf(asOutsider.data)).toEqual([])
    })

    it('visitor は作れない・更新できない', async () => {
        const placeA = await seedPlace(fixture.eventA, '視聴覚室')

        const inserted = await fixture.visitor.client
            .from('places')
            .insert({ event_id: fixture.eventA, name: '勝手に追加' })
            .select('id')
        const updated = await fixture.visitor.client
            .from('places')
            .update({ name: '書き換え' })
            .eq('id', placeA)
            .select('id')

        expect(inserted.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(idsOf(updated.data)).toEqual([])
    })
})

describe('tags', () => {
    it('メンバーは自分のイベントのタグだけ読める', async () => {
        const tagA = await seedTag(fixture.eventA, '食べ物')
        await seedTag(fixture.eventB, '食べ物')

        const asVisitor = await fixture.visitor.client.from('tags').select('id')
        const asOutsider = await fixture.outsider.client.from('tags').select('id')

        expect(idsOf(asVisitor.data)).toEqual([tagA])
        expect(idsOf(asOutsider.data)).toEqual([])
    })

    it('staff だけが消せる', async () => {
        const tag = await seedTag(fixture.eventA, '消す用')

        const asVisitor = await fixture.visitor.client.from('tags').delete().eq('id', tag).select('id')
        const asStaff = await fixture.staff.client.from('tags').delete().eq('id', tag).select('id')

        expect(idsOf(asVisitor.data)).toEqual([])
        expect(idsOf(asStaff.data)).toEqual([tag])
    })
})

describe('article_tags', () => {
    it('記事が読めれば結び付きも読める。読めない記事のぶんは見えない', async () => {
        const tagA = await seedTag(fixture.eventA, '結び付きA')
        const tagB = await seedTag(fixture.eventB, '結び付きB')
        const { error: seedError } = await serviceClient.from('article_tags').insert([
            { article_id: fixture.articleA, tag_id: tagA },
            { article_id: fixture.articleB, tag_id: tagB },
        ])
        expect(seedError).toBeNull()

        const asVisitor = await fixture.visitor.client.from('article_tags').select('article_id, tag_id')
        const asOutsider = await fixture.outsider.client.from('article_tags').select('article_id, tag_id')

        // visitor は eventA の公開済みの記事だけ読めるので、その記事のぶんだけ見える
        expect(asVisitor.data).toEqual([{ article_id: fixture.articleA, tag_id: tagA }])
        expect(asOutsider.data).toEqual([])
    })

    it('staff は自分のイベントの記事にだけタグを付けられる', async () => {
        const tagA = await seedTag(fixture.eventA, '付ける用A')

        const own = await fixture.staff.client
            .from('article_tags')
            .insert({ article_id: fixture.articleA, tag_id: tagA })
            .select('tag_id')
        const other = await fixture.staff.client
            .from('article_tags')
            .insert({ article_id: fixture.articleB, tag_id: tagA })
            .select('tag_id')

        expect(own.error).toBeNull()
        expect(other.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('記事と違うイベントのタグは付けられない', async () => {
        const tagB = await seedTag(fixture.eventB, '違うイベントのタグ')

        const { error } = await fixture.staff.client
            .from('article_tags')
            .insert({ article_id: fixture.articleA, tag_id: tagB })
            .select('tag_id')

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('visitor は付けられない・外せない', async () => {
        const tag = await seedTag(fixture.eventA, 'visitor 用')
        const { error: seedError } = await serviceClient
            .from('article_tags')
            .insert({ article_id: fixture.articleA, tag_id: tag })
        expect(seedError).toBeNull()

        const inserted = await fixture.visitor.client
            .from('article_tags')
            .insert({ article_id: fixture.draftA, tag_id: tag })
            .select('tag_id')
        const deleted = await fixture.visitor.client
            .from('article_tags')
            .delete()
            .eq('article_id', fixture.articleA)
            .eq('tag_id', tag)
            .select('tag_id')

        expect(inserted.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(deleted.data).toEqual([])
    })
})
