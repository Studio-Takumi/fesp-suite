import { describe, expect, it } from 'vitest'

import { anonClient, idsOf, INSUFFICIENT_PRIVILEGE, serviceClient, useRlsFixture } from './support'

/**
 * 下のナビの項目の RLS。
 * 「他人のイベントの項目が見えない・触れない」を重点的に確かめる（supabase/README.md）
 */
const fixture = useRlsFixture()

/** service_role で作り、テストのあとはイベントごと消えるので片付けはしない */
async function seedNav(eventId: string, label: string, sortOrder = 0): Promise<string> {
    const { data, error } = await serviceClient
        .from('bottom_navs')
        .insert({ event_id: eventId, label, icon: 'Bell', href: '/news', sort_order: sortOrder })
        .select('id')
        .single()
    if (error) throw new Error(`ナビの項目の作成に失敗しました: ${error.message}`)
    return data.id
}

describe('bottom_navs', () => {
    it('メンバーは自分のイベントの項目だけ読める。未ログインは読めない', async () => {
        const navA = await seedNav(fixture.eventA, 'A のお知らせ')
        await seedNav(fixture.eventB, 'B のお知らせ')

        const asVisitor = await fixture.visitor.client.from('bottom_navs').select('id')
        const asOutsider = await fixture.outsider.client.from('bottom_navs').select('id')
        const asAnon = await anonClient.from('bottom_navs').select('id')

        expect(idsOf(asVisitor.data)).toEqual([navA])
        expect(idsOf(asOutsider.data)).toEqual([])
        expect(idsOf(asAnon.data)).toEqual([])
    })

    it('staff だけが作れる', async () => {
        const asStaff = await fixture.staff.client
            .from('bottom_navs')
            .insert({ event_id: fixture.eventA, label: 'ホーム', icon: 'House', href: '/' })
            .select('id')
        const asVisitor = await fixture.visitor.client
            .from('bottom_navs')
            .insert({ event_id: fixture.eventA, label: '勝手に追加', icon: 'House', href: '/' })
            .select('id')

        expect(asStaff.error).toBeNull()
        expect(asVisitor.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('visitor は消せない（一括置き換えで全部消されない）', async () => {
        const nav = await seedNav(fixture.eventA, '消されない項目')

        const { data } = await fixture.visitor.client
            .from('bottom_navs')
            .delete()
            .eq('event_id', fixture.eventA)
            .select('id')

        // RLS では行が見えないだけなので、エラーではなく0件になる
        expect(idsOf(data)).toEqual([])
        const { data: remaining } = await serviceClient.from('bottom_navs').select('id').eq('id', nav)
        expect(idsOf(remaining)).toEqual([nav])
    })

    it('別のイベントの項目は、staff でも消せない', async () => {
        const navB = await seedNav(fixture.eventB, 'B の項目')

        const { data } = await fixture.staff.client
            .from('bottom_navs')
            .delete()
            .eq('event_id', fixture.eventB)
            .select('id')

        expect(idsOf(data)).toEqual([])
        const { data: remaining } = await serviceClient.from('bottom_navs').select('id').eq('id', navB)
        expect(idsOf(remaining)).toEqual([navB])
    })

    it('別のイベントへ付け替えられない', async () => {
        const navA = await seedNav(fixture.eventA, '付け替え用')

        const { error } = await fixture.staff.client
            .from('bottom_navs')
            .update({ event_id: fixture.eventB })
            .eq('id', navA)
            .select('id')

        // 更新後の event_id でも staff かを見るので、with check に落ちる
        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })
})
