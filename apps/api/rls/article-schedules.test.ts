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

/** schedule_article が、予約しようとした版が無い・上書きされていたときに返すコード（PostgREST で 409 になる） */
const VERSION_CONFLICT = 'PT409'

/** 1時間後（予約の日時） */
function inOneHour(): string {
    return new Date(Date.now() + 60 * 60 * 1000).toISOString()
}

/** 過去の日時（時間が来た予約にする） */
const PAST = '2026-01-01T00:00:00+00:00'

async function latestHistoryOf(articleId: string): Promise<{ version: number; updated_at: string }> {
    const { data: article, error } = await serviceClient
        .from('articles')
        .select('latest_version')
        .eq('id', articleId)
        .single()
    if (error) throw new Error(`記事の取得に失敗しました: ${JSON.stringify(error)}`)
    return versionOf(articleId, article.latest_version)
}

async function versionOf(articleId: string, version: number): Promise<{ version: number; updated_at: string }> {
    const { data, error } = await serviceClient
        .from('article_histories')
        .select('version, updated_at')
        .eq('article_id', articleId)
        .eq('version', version)
        .single()
    if (error) throw new Error(`版の取得に失敗しました: ${JSON.stringify(error)}`)
    return data
}

async function historiesOf(articleId: string) {
    const { data, error } = await serviceClient
        .from('article_histories')
        .select('version, title')
        .eq('article_id', articleId)
        .order('version')
    if (error) throw new Error(`版の取得に失敗しました: ${JSON.stringify(error)}`)
    return data
}

async function articleOf(articleId: string) {
    const { data, error } = await serviceClient
        .from('articles')
        .select('status, latest_version, published_version, published_at')
        .eq('id', articleId)
        .single()
    if (error) throw new Error(`記事の取得に失敗しました: ${JSON.stringify(error)}`)
    return data
}

async function scheduleOf(articleId: string) {
    const { data, error } = await serviceClient
        .from('article_schedules')
        .select('version, publish_at, created_by')
        .eq('article_id', articleId)
        .maybeSingle()
    if (error) throw new Error(`予約の取得に失敗しました: ${JSON.stringify(error)}`)
    return data
}

function schedule(user: TestUser, articleId: string, version: number, versionUpdatedAt: string, publishAt: string) {
    return user.client.rpc('schedule_article', {
        target_article_id: articleId,
        target_version: version,
        version_updated_at: versionUpdatedAt,
        new_publish_at: publishAt,
    })
}

/** staff が記事の最新の版を予約する */
async function scheduleLatestAsStaff(articleId: string, publishAt = inOneHour()) {
    const latest = await latestHistoryOf(articleId)
    const { data, error } = await schedule(f.staff, articleId, latest.version, latest.updated_at, publishAt)
    expect(error).toBeNull()
    expect(data).toBe(true)
    return latest
}

async function saveAsStaff(articleId: string, title: string, status?: 'draft' | 'published') {
    const { data, error } = await f.staff.client.rpc('save_article', {
        target_article_id: articleId,
        new_title: title,
        new_content: [],
        new_status: status,
    })
    expect(error).toBeNull()
    expect(data).toBe(true)
}

/** 公開中の記事に、公開中の版とは別の版（版2）を一時保存する */
async function createPublishedWithTemporarySave(title: string): Promise<string> {
    const id = await createArticle(f.staff, f.eventA, title, 'published')
    await saveAsStaff(id, `${title}（一時保存）`)
    return id
}

async function makeDue(articleId: string) {
    const { error } = await serviceClient
        .from('article_schedules')
        .update({ publish_at: PAST })
        .eq('article_id', articleId)
    expect(error).toBeNull()
}

async function publishDue() {
    const { error } = await serviceClient.rpc('publish_scheduled_articles')
    expect(error).toBeNull()
}

describe('article_schedules の読み取り・直接の書き込み', () => {
    it('staff だけが予約を読める（visitor として所属するイベント・所属していない・論理削除・未ログインは読めない）', async () => {
        const id = await createArticle(f.staff, f.eventA, '読み取りのテスト', 'published')
        await scheduleLatestAsStaff(id)
        // staff が visitor として所属する eventB の記事の予約は、service_role で置く
        await serviceClient
            .from('article_schedules')
            .insert({ article_id: f.articleB, version: 1, publish_at: inOneHour() })

        const staff = await f.staff.client
            .from('article_schedules')
            .select('article_id')
            .in('article_id', [id, f.articleB])
        expect(staff.error).toBeNull()
        expect(staff.data).toEqual([{ article_id: id }])

        for (const client of [f.visitor.client, f.outsider.client, f.deleted.client, anonClient]) {
            const { data, error } = await client.from('article_schedules').select('article_id').eq('article_id', id)
            expect(error).toBeNull()
            expect(data).toEqual([])
        }
    })

    it('記事から予約を1件埋め込める（読めなければ null）', async () => {
        const id = await createArticle(f.staff, f.eventA, '埋め込みのテスト', 'published')
        const latest = await scheduleLatestAsStaff(id)
        const columns = 'schedule:article_schedules!article_schedules_article_id_fkey(version, created_by)'

        const staff = await f.staff.client.from('articles').select(columns).eq('id', id).single()
        const visitor = await f.visitor.client.from('articles').select(columns).eq('id', id).single()

        expect(staff.error).toBeNull()
        expect(staff.data).toEqual({ schedule: { version: latest.version, created_by: f.staff.id } })
        expect(visitor.error).toBeNull()
        expect(visitor.data).toEqual({ schedule: null })
    })

    it('visitor は予約を直接作れない。staff でも自分以外を予約した人にして作れない', async () => {
        const visitor = await f.visitor.client
            .from('article_schedules')
            .insert({ article_id: f.articleA, version: 1, publish_at: inOneHour(), created_by: f.visitor.id })
        const staff = await f.staff.client
            .from('article_schedules')
            .insert({ article_id: f.draftA, version: 1, publish_at: inOneHour(), created_by: f.visitor.id })

        expect(visitor.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
        expect(staff.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    })

    it('visitor は予約を消せない', async () => {
        const id = await createArticle(f.staff, f.eventA, '削除のテスト', 'published')
        await scheduleLatestAsStaff(id)

        const { data, error } = await f.visitor.client
            .from('article_schedules')
            .delete()
            .eq('article_id', id)
            .select('article_id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect(await scheduleOf(id)).not.toBeNull()
    })
})

describe('schedule_article', () => {
    it('staff は版を予約でき、予約した人は自分になる', async () => {
        const id = await createArticle(f.staff, f.eventA, '予約のテスト')
        const publishAt = inOneHour()

        const latest = await scheduleLatestAsStaff(id, publishAt)

        const scheduled = await scheduleOf(id)
        expect(scheduled).toMatchObject({ version: latest.version, created_by: f.staff.id })
        expect(new Date(scheduled!.publish_at).getTime()).toBe(new Date(publishAt).getTime())
    })

    it('もう一度予約すると、日時を上書きする（1記事に予約は1つ）', async () => {
        const id = await createArticle(f.staff, f.eventA, '予約し直しのテスト')
        await scheduleLatestAsStaff(id)
        const later = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

        await scheduleLatestAsStaff(id, later)

        expect(new Date((await scheduleOf(id))!.publish_at).getTime()).toBe(new Date(later).getTime())
    })

    it('版の updated_at が違う・版が無いと PT409 で失敗し、予約しない', async () => {
        const id = await createArticle(f.staff, f.eventA, '版の照合のテスト')
        const latest = await latestHistoryOf(id)

        const stale = await schedule(f.staff, id, latest.version, '2000-01-01T00:00:00+00:00', inOneHour())
        const missing = await schedule(f.staff, id, 99, latest.updated_at, inOneHour())

        expect(stale.error?.code).toBe(VERSION_CONFLICT)
        expect(missing.error?.code).toBe(VERSION_CONFLICT)
        expect(await scheduleOf(id)).toBeNull()
    })

    it.each([
        ['visitor', 'visitor', 'articleA'],
        ['visitor として所属するイベントの記事', 'staff', 'articleB'],
        ['所属していないユーザー', 'outsider', 'articleA'],
        ['論理削除されたユーザー', 'deleted', 'draftA'],
    ] as const)('%s は予約できず false が返る', async (_label, user, article) => {
        const latest = await latestHistoryOf(f[article])
        const before = await scheduleOf(f[article])

        const { data, error } = await schedule(f[user], f[article], latest.version, latest.updated_at, inOneHour())

        expect(error).toBeNull()
        expect(data).toBe(false)
        expect(await scheduleOf(f[article])).toEqual(before)
    })

    it('未ログインは呼べない', async () => {
        const latest = await latestHistoryOf(f.draftA)

        const { error } = await anonClient.rpc('schedule_article', {
            target_article_id: f.draftA,
            target_version: latest.version,
            version_updated_at: latest.updated_at,
            new_publish_at: inOneHour(),
        })

        expect(error).not.toBeNull()
    })
})

describe('予約中の版は上書きされない', () => {
    it('save_article は、同じ人・30分以内でも予約中の版を上書きせず、新しい版を足す（予約は残る）', async () => {
        const id = await createArticle(f.staff, f.eventA, '予約した中身')
        await scheduleLatestAsStaff(id)

        await saveAsStaff(id, '予約のあとの変更')

        expect(await historiesOf(id)).toEqual([
            { version: 1, title: '予約した中身' },
            { version: 2, title: '予約のあとの変更' },
        ])
        expect((await scheduleOf(id))?.version).toBe(1)
        expect((await articleOf(id)).latest_version).toBe(2)
    })

    it('staff でも予約中の版を直接上書きできない', async () => {
        const id = await createArticle(f.staff, f.eventA, '直接上書きのテスト')
        await scheduleLatestAsStaff(id)

        const { data, error } = await f.staff.client
            .from('article_histories')
            .update({ title: '上書き' })
            .eq('article_id', id)
            .select('version')

        expect(error).toBeNull()
        expect(data).toEqual([])
        expect((await historiesOf(id))[0]?.title).toBe('直接上書きのテスト')
    })
})

describe('予約が消えるとき', () => {
    it('一時保存では消えない', async () => {
        const id = await createPublishedWithTemporarySave('一時保存のテスト')
        await scheduleLatestAsStaff(id)

        await saveAsStaff(id, 'さらに一時保存')

        expect((await scheduleOf(id))?.version).toBe(2)
    })

    it('下書きを公開すると消える', async () => {
        const id = await createArticle(f.staff, f.eventA, '公開で消えるテスト')
        await scheduleLatestAsStaff(id)

        await saveAsStaff(id, '公開で消えるテスト', 'published')

        expect(await scheduleOf(id)).toBeNull()
    })

    it('公開中の記事を下書きに戻すと消える', async () => {
        const id = await createPublishedWithTemporarySave('下書きに戻すテスト')
        await scheduleLatestAsStaff(id)

        await saveAsStaff(id, '下書きに戻すテスト', 'draft')

        expect(await scheduleOf(id)).toBeNull()
    })

    it('cancel_article_schedule で staff は取り消せる（予約が無くても true）。staff でなければ false で残る', async () => {
        const id = await createArticle(f.staff, f.eventA, '取り消しのテスト', 'published')
        await scheduleLatestAsStaff(id)

        const visitor = await f.visitor.client.rpc('cancel_article_schedule', { target_article_id: id })
        expect(visitor.error).toBeNull()
        expect(visitor.data).toBe(false)
        expect(await scheduleOf(id)).not.toBeNull()

        const staff = await f.staff.client.rpc('cancel_article_schedule', { target_article_id: id })
        expect(staff.error).toBeNull()
        expect(staff.data).toBe(true)
        expect(await scheduleOf(id)).toBeNull()

        const again = await f.staff.client.rpc('cancel_article_schedule', { target_article_id: id })
        expect(again.data).toBe(true)

        const anon = await anonClient.rpc('cancel_article_schedule', { target_article_id: id })
        expect(anon.error).not.toBeNull()
    })
})

describe('publish_scheduled_articles', () => {
    it('日時を過ぎた予約だけ公開して消す。初めての公開なら公開日時は予約の日時になる', async () => {
        const due = await createArticle(f.staff, f.eventA, '時間が来た予約')
        const future = await createArticle(f.staff, f.eventA, 'まだ先の予約')
        await scheduleLatestAsStaff(due)
        await scheduleLatestAsStaff(future)
        await makeDue(due)

        await publishDue()

        const published = await articleOf(due)
        expect(published).toMatchObject({ status: 'published', published_version: 1 })
        expect(new Date(published.published_at!).getTime()).toBe(new Date(PAST).getTime())
        expect(await scheduleOf(due)).toBeNull()
        expect(await articleOf(future)).toMatchObject({ status: 'draft', published_version: null })
        expect(await scheduleOf(future)).not.toBeNull()
    })

    it('公開中の記事は予約した版に差し替わり、公開日時は変わらない（予約のあとの変更は公開されない）', async () => {
        const id = await createPublishedWithTemporarySave('差し替えのテスト')
        const before = await articleOf(id)
        await scheduleLatestAsStaff(id)
        await saveAsStaff(id, '予約のあとの変更')
        await makeDue(id)

        await publishDue()

        expect(await articleOf(id)).toMatchObject({
            status: 'published',
            latest_version: 3,
            published_version: 2,
            published_at: before.published_at,
        })
        expect(await scheduleOf(id)).toBeNull()
    })

    it('予約した版がすでに公開中の版でも、予約を消す', async () => {
        const id = await createArticle(f.staff, f.eventA, '公開中の版の予約', 'published')
        await scheduleLatestAsStaff(id)
        await makeDue(id)

        await publishDue()

        expect((await articleOf(id)).published_version).toBe(1)
        expect(await scheduleOf(id)).toBeNull()
    })

    it('ユーザー（staff を含む）・未ログインからは呼べない', async () => {
        const staff = await f.staff.client.rpc('publish_scheduled_articles')
        const anon = await anonClient.rpc('publish_scheduled_articles')

        expect(staff.error).not.toBeNull()
        expect(anon.error).not.toBeNull()
    })
})
