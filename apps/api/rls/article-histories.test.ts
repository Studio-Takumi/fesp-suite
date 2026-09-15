import { describe, expect, it } from 'vitest'

import {
    anonClient,
    createArticle,
    INSUFFICIENT_PRIVILEGE,
    serviceClient,
    type TestUser,
    useRlsFixture,
} from './support'

const f = useRlsFixture()

/** Postgres の foreign_key_violation */
const FOREIGN_KEY_VIOLATION = '23503'

async function historiesOf(articleId: string) {
    const { data, error } = await serviceClient
        .from('article_histories')
        .select('version, title, created_by')
        .eq('article_id', articleId)
        .order('version')
    if (error) throw new Error(`版の取得に失敗しました: ${JSON.stringify(error)}`)
    return data
}

async function articleOf(articleId: string) {
    const { data, error } = await serviceClient
        .from('articles')
        .select('status, latest_version, published_version, published_at, updated_at')
        .eq('id', articleId)
        .single()
    if (error) throw new Error(`記事の取得に失敗しました: ${JSON.stringify(error)}`)
    return data
}

/** staff が eventA に下書きの記事を作る（版1ができる） */
function createDraft(title: string): Promise<string> {
    return createArticle(f.staff, f.eventA, title)
}

function save(user: TestUser, articleId: string, title: string, status?: 'draft' | 'published') {
    return user.client.rpc('save_article', {
        target_article_id: articleId,
        new_title: title,
        new_content: [],
        new_status: status,
    })
}

async function saveAsStaff(articleId: string, title: string, status?: 'draft' | 'published') {
    const { data, error } = await save(f.staff, articleId, title, status)
    expect(error).toBeNull()
    expect(data).toBe(true)
}

describe('article_histories の読み取り', () => {
    it('staff は記事のイベントの版を読める（公開済み・下書きとも）', async () => {
        const { data, error } = await f.staff.client
            .from('article_histories')
            .select('article_id, version')
            .in('article_id', [f.articleA, f.draftA])

        expect(error).toBeNull()
        expect(data?.map((row) => row.article_id).sort()).toEqual([f.articleA, f.draftA].sort())
    })

    it('staff でないメンバーは、公開中の版だけ読める（下書きの版・一時保存した版は読めない）', async () => {
        const id = await createDraft('公開中の版')
        await saveAsStaff(id, '公開中の版', 'published')
        // 別の人の版にしておき、一時保存で版2が足されるようにする
        await serviceClient.from('article_histories').update({ created_by: f.visitor.id }).eq('article_id', id)
        await saveAsStaff(id, '一時保存した版')

        const visitor = await f.visitor.client
            .from('article_histories')
            .select('article_id, version')
            .in('article_id', [f.articleA, f.draftA, id])
        // staff は eventB では visitor なので、eventB の記事も公開中の版だけ読める
        const staffInB = await f.staff.client
            .from('article_histories')
            .select('article_id, version')
            .in('article_id', [f.articleB, f.draftB])

        expect(visitor.error).toBeNull()
        expect(visitor.data).toHaveLength(2)
        expect(visitor.data).toEqual(
            expect.arrayContaining([
                { article_id: f.articleA, version: 1 },
                { article_id: id, version: 1 },
            ]),
        )
        expect(staffInB.error).toBeNull()
        expect(staffInB.data).toEqual([{ article_id: f.articleB, version: 1 }])
    })

    it('所属していない・論理削除・未ログインは読めない', async () => {
        const cases = [
            [f.outsider.client, [f.articleA, f.draftA]],
            [f.deleted.client, [f.articleA, f.draftA]],
            [anonClient, [f.articleA, f.draftA]],
        ] as const

        for (const [client, articleIds] of cases) {
            const { data, error } = await client
                .from('article_histories')
                .select('article_id')
                .in('article_id', [...articleIds])
            expect(error).toBeNull()
            expect(data).toEqual([])
        }
    })

    it('記事から公開中の版・最新の版を1件ずつ埋め込める（読めない版は null）', async () => {
        const id = await createDraft('埋め込みのテスト')
        await saveAsStaff(id, '埋め込みのテスト', 'published')
        await serviceClient.from('article_histories').update({ created_by: f.visitor.id }).eq('article_id', id)
        await saveAsStaff(id, '一時保存した版')
        const columns =
            'published_history:article_histories!articles_published_version_fkey(version, title), latest_history:article_histories!articles_latest_version_fkey(version, title)'

        const staff = await f.staff.client.from('articles').select(columns).eq('id', id).single()
        const visitor = await f.visitor.client.from('articles').select(columns).eq('id', id).single()

        expect(staff.error).toBeNull()
        expect(staff.data).toEqual({
            published_history: { version: 1, title: '埋め込みのテスト' },
            latest_history: { version: 2, title: '一時保存した版' },
        })
        expect(visitor.error).toBeNull()
        expect(visitor.data).toEqual({
            published_history: { version: 1, title: '埋め込みのテスト' },
            latest_history: null,
        })
    })
})

describe('記事の作成と版1', () => {
    it('記事を作ると、作った中身で版1ができる（保存した人は作成者）。下書きなので公開中の版は NULL', async () => {
        const id = await createDraft('版1のテスト')

        expect(await historiesOf(id)).toEqual([{ version: 1, title: '版1のテスト', created_by: f.staff.id }])
        expect(await articleOf(id)).toMatchObject({ status: 'draft', latest_version: 1, published_version: null })
    })
})

describe('article_histories への直接の書き込み', () => {
    it('visitor は版を足せない', async () => {
        const { error } = await f.visitor.client
            .from('article_histories')
            .insert({ article_id: f.articleA, version: 99, created_by: f.visitor.id, title: '', content: [] })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('staff でも、自分以外を保存した人にして版を足せない', async () => {
        const { error } = await f.staff.client
            .from('article_histories')
            .insert({ article_id: f.draftA, version: 99, created_by: f.visitor.id, title: '', content: [] })

        expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('staff は公開していない版を上書きできるが、公開中の版は上書きできない', async () => {
        const id = await createDraft('上書きのテスト')

        const draft = await f.staff.client
            .from('article_histories')
            .update({ title: '下書きの版を上書き' })
            .eq('article_id', id)
            .select('version')
        expect(draft.error).toBeNull()
        expect(draft.data).toEqual([{ version: 1 }])

        await saveAsStaff(id, '下書きの版を上書き', 'published')
        const published = await f.staff.client
            .from('article_histories')
            .update({ title: '公開中の版を上書き' })
            .eq('article_id', id)
            .select('version')
        expect(published.error).toBeNull()
        expect(published.data).toEqual([])
        expect((await historiesOf(id))[0]?.title).toBe('下書きの版を上書き')
    })

    it('staff でも版は消せない', async () => {
        const { data, error } = await f.staff.client
            .from('article_histories')
            .delete()
            .eq('article_id', f.draftA)
            .select('id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await historiesOf(f.draftA)).toHaveLength(1)
    })

    it('存在しない版を公開中の版・最新の版にできない', async () => {
        const id = await createDraft('外部キーのテスト')

        const published = await f.staff.client.from('articles').update({ published_version: 99 }).eq('id', id)
        const latest = await f.staff.client.from('articles').update({ latest_version: 99 }).eq('id', id)

        expect(published.error?.code).toBe(FOREIGN_KEY_VIOLATION)
        expect(latest.error?.code).toBe(FOREIGN_KEY_VIOLATION)
        expect(await articleOf(id)).toMatchObject({ latest_version: 1, published_version: null })
    })
})

describe('save_article の権限', () => {
    it.each([
        ['visitor', 'visitor', 'articleA'],
        ['visitor として所属するイベントの記事', 'staff', 'articleB'],
        ['所属していないユーザー', 'outsider', 'articleA'],
        ['論理削除されたユーザー', 'deleted', 'draftA'],
    ] as const)('%s は保存できず false が返り、版も記事も変わらない', async (_label, user, article) => {
        const beforeHistories = await historiesOf(f[article])
        const beforeArticle = await articleOf(f[article])

        const { data, error } = await save(f[user], f[article], '保存できない', 'draft')

        expect(error).toBeNull()
        expect(data).toBe(false)
        expect(await historiesOf(f[article])).toEqual(beforeHistories)
        expect(await articleOf(f[article])).toEqual(beforeArticle)
    })

    it('未ログインは呼べない', async () => {
        const { error } = await anonClient.rpc('save_article', {
            target_article_id: f.draftA,
            new_title: '未ログイン',
            new_content: [],
        })

        expect(error).not.toBeNull()
        expect((await historiesOf(f.draftA)).map((history) => history.title)).toEqual(['A の下書き'])
    })
})

describe('save_article の版の残し方', () => {
    it('同じ人が30分以内に続けて保存すると、最新の版を上書きする', async () => {
        const id = await createDraft('上書き前')

        await saveAsStaff(id, '上書き後')

        expect(await historiesOf(id)).toEqual([{ version: 1, title: '上書き後', created_by: f.staff.id }])
        expect((await articleOf(id)).latest_version).toBe(1)
    })

    it('中身が最新の版と同じなら、版は増えない（記事の更新日時は進む）', async () => {
        const id = await createDraft('同じ中身')
        // 別の人の版にしておき、中身が違えば新しい版が足される状態にする
        await serviceClient.from('article_histories').update({ created_by: f.visitor.id }).eq('article_id', id)
        const before = await articleOf(id)

        await saveAsStaff(id, '同じ中身')

        expect(await historiesOf(id)).toEqual([{ version: 1, title: '同じ中身', created_by: f.visitor.id }])
        expect((await articleOf(id)).updated_at > before.updated_at).toBe(true)
    })

    it('最新の版を別の人が保存していたら、上書きせずに新しい版を足す', async () => {
        const id = await createDraft('別の人の版')
        await serviceClient.from('article_histories').update({ created_by: f.visitor.id }).eq('article_id', id)

        await saveAsStaff(id, '自分の版')

        expect(await historiesOf(id)).toEqual([
            { version: 1, title: '別の人の版', created_by: f.visitor.id },
            { version: 2, title: '自分の版', created_by: f.staff.id },
        ])
        expect((await articleOf(id)).latest_version).toBe(2)
    })

    it('最新の版を作ってから30分を過ぎていたら、上書きせずに新しい版を足す', async () => {
        const id = await createDraft('古い版')
        const longAgo = new Date(Date.now() - 31 * 60 * 1000).toISOString()
        await serviceClient.from('article_histories').update({ created_at: longAgo }).eq('article_id', id)

        await saveAsStaff(id, '新しい版')

        expect((await historiesOf(id)).map((history) => history.version)).toEqual([1, 2])
    })
})

describe('save_article の公開状態', () => {
    it('下書きを status なしで保存すると、下書きのまま最新の版が今回の中身になる', async () => {
        const id = await createDraft('下書き')

        await saveAsStaff(id, '下書きを編集')

        expect(await articleOf(id)).toMatchObject({ status: 'draft', latest_version: 1, published_version: null })
        expect((await historiesOf(id)).map((history) => history.title)).toEqual(['下書きを編集'])
    })

    it('公開 → 一時保存 → 公開に反映 → 下書きに戻す、の流れで記事が指す版が変わる', async () => {
        const id = await createDraft('流れのテスト')

        // 公開する。版1（未公開・自分・30分以内）を上書きして公開中の版にする
        await saveAsStaff(id, '公開した中身', 'published')
        const published = await articleOf(id)
        expect(published).toMatchObject({ status: 'published', latest_version: 1, published_version: 1 })

        // 一時保存する。公開中の版は上書きせずに版2を足す。公開中の版は変わらず、更新日時は進む
        await saveAsStaff(id, '一時保存した中身')
        expect(await historiesOf(id)).toEqual([
            { version: 1, title: '公開した中身', created_by: f.staff.id },
            { version: 2, title: '一時保存した中身', created_by: f.staff.id },
        ])
        const tempSaved = await articleOf(id)
        expect(tempSaved).toMatchObject({ status: 'published', latest_version: 2, published_version: 1 })
        expect(tempSaved.updated_at > published.updated_at).toBe(true)

        // 続けて一時保存すると、未公開の版2を上書きする
        await saveAsStaff(id, 'もう一度一時保存した中身')
        expect((await historiesOf(id)).map((history) => history.title)).toEqual([
            '公開した中身',
            'もう一度一時保存した中身',
        ])

        // 公開に反映する。版2を上書きして公開中の版にする
        await saveAsStaff(id, '反映した中身', 'published')
        expect(await articleOf(id)).toMatchObject({ status: 'published', latest_version: 2, published_version: 2 })
        expect(await historiesOf(id)).toHaveLength(2)

        // 下書きに戻す。公開中だった版2は上書きせずに版3を足し、公開中の版は NULL。公開日時は残る
        await saveAsStaff(id, '下書きに戻した中身', 'draft')
        expect(await articleOf(id)).toMatchObject({
            status: 'draft',
            latest_version: 3,
            published_version: null,
            published_at: published.published_at,
        })
        expect((await historiesOf(id)).map((history) => history.version)).toEqual([1, 2, 3])
    })
})
