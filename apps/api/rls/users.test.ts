import { describe, expect, it } from 'vitest'

import { anonClient, idsOf, serviceClient, useRlsFixture } from './support'

const f = useRlsFixture()

describe('users', () => {
    it('自分の行だけ読める', async () => {
        const { data, error } = await f.staff.client.from('users').select('id').in('id', [f.staff.id, f.visitor.id])

        expect(error).toBeNull()
        expect(idsOf(data)).toEqual([f.staff.id])
    })

    it('未ログインは読めない', async () => {
        const { data, error } = await anonClient.from('users').select('id').in('id', [f.staff.id, f.visitor.id])

        expect(error).toBeNull()
        expect(data).toEqual([])
    })

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
