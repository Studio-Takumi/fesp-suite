import { describe, expect, it } from 'vitest'

import { anonClient, idsOf, serviceClient, sorted, useRlsFixture } from './support'

const f = useRlsFixture()

describe('users の読み取り', () => {
    it('同じイベントのメンバーの行を読める（役割・相手の論理削除は問わない）', async () => {
        const ids = [f.staff.id, f.visitor.id, f.outsider.id, f.deleted.id]

        const staff = await f.staff.client.from('users').select('id').in('id', ids)
        const visitor = await f.visitor.client.from('users').select('id').in('id', ids)

        expect(idsOf(staff.data)).toEqual(sorted([f.staff.id, f.visitor.id, f.deleted.id]))
        expect(idsOf(visitor.data)).toEqual(sorted([f.staff.id, f.visitor.id, f.deleted.id]))
    })

    it('どのイベントにも所属していないユーザーは、自分の行だけ読める', async () => {
        const { data, error } = await f.outsider.client
            .from('users')
            .select('id')
            .in('id', [f.staff.id, f.visitor.id, f.outsider.id])

        expect(error).toBeNull()
        expect(idsOf(data)).toEqual([f.outsider.id])
    })

    it('論理削除されたユーザーは、他のメンバーの行を読めない', async () => {
        const { data, error } = await f.deleted.client.from('users').select('id').in('id', [f.staff.id, f.visitor.id])

        expect(error).toBeNull()
        expect(data).toEqual([])
    })

    it('未ログインは読めない', async () => {
        const { data, error } = await anonClient.from('users').select('id').in('id', [f.staff.id, f.visitor.id])

        expect(error).toBeNull()
        expect(data).toEqual([])
    })

    it('イベントに所属していない作成者の行も、記事のイベントのメンバーは記事と一緒に読める', async () => {
        // イベントを抜けた人が書いた記事の代わりに、所属していないユーザーを作成者にした記事を置く
        const { data: article } = await serviceClient
            .from('articles')
            .insert({ event_id: f.eventA, created_by: f.outsider.id, title: '抜けた人の記事', status: 'published' })
            .select('id')
            .single()

        const { data, error } = await f.visitor.client
            .from('articles')
            .select('created_by, creator:users!created_by(display_name)')
            .eq('id', article!.id)
            .single()

        expect(error).toBeNull()
        expect(data).toEqual({ created_by: f.outsider.id, creator: { display_name: null } })
    })

    it('下書きの記事の作成者は、記事を通しては staff にしか見えない', async () => {
        // 同じイベントのメンバー同士だと別のポリシーで読めてしまうので、所属していないユーザーを作成者にする。
        // 公開済みの記事が残っているとそこから読めてしまうので、先に消しておく
        await serviceClient.from('articles').delete().eq('created_by', f.outsider.id)
        const { data: article } = await serviceClient
            .from('articles')
            .insert({ event_id: f.eventA, created_by: f.outsider.id, title: '抜けた人の下書き', status: 'draft' })
            .select('id')
            .single()

        const staff = await f.staff.client.from('users').select('id').eq('id', f.outsider.id)
        const visitor = await f.visitor.client.from('users').select('id').eq('id', f.outsider.id)

        expect(idsOf(staff.data)).toEqual([f.outsider.id])
        expect(visitor.error).toBeNull()
        expect(visitor.data).toEqual([])

        await serviceClient.from('articles').delete().eq('id', article!.id)
    })
})

describe('users の書き込み', () => {
    it('自分の行でも作成・更新・削除できない', async () => {
        const insert = await f.staff.client.from('users').insert({ id: crypto.randomUUID() })
        const update = await f.staff.client
            .from('users')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', f.staff.id)
            .select('id')
        const remove = await f.staff.client.from('users').delete().eq('id', f.staff.id).select('id')

        expect(insert.error).not.toBeNull()
        expect(update.data).toEqual([])
        expect(remove.data).toEqual([])
        const { data } = await serviceClient.from('users').select('deleted_at').eq('id', f.staff.id).single()
        expect(data?.deleted_at).toBeNull()
    })
})

describe('users の表示名', () => {
    it('メールアドレスでの新規登録（full_name が無い）では NULL', async () => {
        const { data } = await serviceClient.from('users').select('display_name').eq('id', f.staff.id).single()

        expect(data?.display_name).toBeNull()
    })

    it('Google のアカウント名（full_name）があれば、表示名に入る', async () => {
        const created = await serviceClient.auth.admin.createUser({
            email: `rls-${crypto.randomUUID().slice(0, 8)}-named@example.com`,
            password: crypto.randomUUID(),
            email_confirm: true,
            user_metadata: { full_name: 'RLS 太郎' },
        })
        if (created.error) throw new Error(`ユーザーの作成に失敗しました: ${created.error.message}`)
        const userId = created.data.user.id

        try {
            const { data } = await serviceClient.from('users').select('display_name').eq('id', userId).single()

            expect(data?.display_name).toBe('RLS 太郎')
        } finally {
            await serviceClient.auth.admin.deleteUser(userId)
        }
    })
})
