import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll } from 'vitest'

import type { Database } from '@fesp/types'

import { createAnonClient, createUserClient } from '../src/lib/supabase'
import type { Bindings } from '../src/types'

type Client = SupabaseClient<Database>

function requireEnv(name: string): string {
    const value = process.env[name]
    if (!value) throw new Error(`${name} が apps/api/.dev.vars に設定されていません`)
    return value
}

export const SUPABASE_URL = requireEnv('SUPABASE_URL')
export const SUPABASE_ANON_KEY = requireEnv('SUPABASE_ANON_KEY')

/** API と同じ作り方でクライアントを作るための env */
const env = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
} as Bindings

/** 準備と片付け用。RLS を貫通する */
export const serviceClient: Client = createClient<Database>(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

/** 未ログイン */
export const anonClient: Client = createAnonClient(env)

export type TestUser = {
    id: string
    accessToken: string
    /** ユーザーのトークンを引き継いだクライアント（API の `createUserClient` と同じ） */
    client: Client
}

export type RlsFixture = {
    eventA: string
    eventB: string
    /** eventA の公開済みの記事 */
    articleA: string
    /** eventB の公開済みの記事 */
    articleB: string
    /** eventA の下書きの記事 */
    draftA: string
    /** eventB の下書きの記事 */
    draftB: string
    /** eventA の staff、eventB の visitor */
    staff: TestUser
    /** eventA の visitor */
    visitor: TestUser
    /** どのイベントにも所属しない */
    outsider: TestUser
    /** eventA の staff だが、users が論理削除されている */
    deleted: TestUser
}

/** Postgres の insufficient_privilege。RLS の with check に通らなかったときのコード */
export const INSUFFICIENT_PRIVILEGE = '42501'

/** 並べ替えた id の配列（select の結果の比較用） */
export function idsOf(rows: { id: string }[] | null): string[] {
    return (rows ?? []).map((row) => row.id).sort()
}

export function sorted(ids: string[]): string[] {
    return [...ids].sort()
}

function ensure<T>(result: { data: T | null; error: unknown }, step: string): T {
    if (result.error || result.data === null) {
        throw new Error(`${step} に失敗しました: ${JSON.stringify(result.error)}`)
    }
    return result.data
}

/**
 * ユーザーの権限で記事を作る（本文は空。版1ができる）。`published` なら版1を公開する。
 * 記事と版1は同じトランザクションで作る必要があり、service_role からは作れないので、記事のイベントの staff で呼ぶこと
 */
export async function createArticle(
    user: TestUser,
    eventId: string,
    title: string,
    status: 'draft' | 'published' = 'draft',
): Promise<string> {
    const id = ensure(
        await user.client.rpc('create_article', { target_event_id: eventId, new_title: title, new_content: [] }),
        `記事（${title}）の作成`,
    )
    if (status === 'published') {
        const saved = ensure(
            await user.client.rpc('save_article', {
                target_article_id: id,
                new_title: title,
                new_content: [],
                new_status: 'published',
            }),
            `記事（${title}）の公開`,
        )
        if (!saved) throw new Error(`記事（${title}）の公開に失敗しました: 保存できませんでした`)
    }
    return id
}

/**
 * テスト用のイベント2つ・記事・ユーザー4人を作り、ファイルの終わりに消す。
 * 値は beforeAll の中で埋まるので、テストの中で読むこと。
 */
export function useRlsFixture(): RlsFixture {
    const fixture = {} as RlsFixture
    const runId = crypto.randomUUID().slice(0, 8)
    const createdUserIds: string[] = []
    const createdEventIds: string[] = []

    async function createUser(name: string): Promise<TestUser> {
        const email = `rls-${runId}-${name}@example.com`
        const password = crypto.randomUUID()

        const created = await serviceClient.auth.admin.createUser({ email, password, email_confirm: true })
        if (created.error) throw new Error(`ユーザー（${name}）の作成に失敗しました: ${created.error.message}`)
        const userId = created.data.user.id
        createdUserIds.push(userId)

        const signedIn = await createAnonClient(env).auth.signInWithPassword({ email, password })
        if (signedIn.error) throw new Error(`ユーザー（${name}）のログインに失敗しました: ${signedIn.error.message}`)
        const { access_token: accessToken } = signedIn.data.session

        return { id: userId, accessToken, client: createUserClient(env, accessToken) }
    }

    beforeAll(async () => {
        const events = ensure(
            await serviceClient
                .from('events')
                .insert([
                    { slug: `rls-${runId}-a`, name: 'RLS テスト A' },
                    { slug: `rls-${runId}-b`, name: 'RLS テスト B' },
                ])
                .select('id, slug'),
            'イベントの作成',
        )
        createdEventIds.push(...events.map((event) => event.id))
        fixture.eventA = events.find((event) => event.slug.endsWith('-a'))!.id
        fixture.eventB = events.find((event) => event.slug.endsWith('-b'))!.id

        fixture.staff = await createUser('staff')
        fixture.visitor = await createUser('visitor')
        fixture.outsider = await createUser('outsider')
        fixture.deleted = await createUser('deleted')

        // staff は eventB の記事も作れるよう、記事を作り終えるまで eventB でも staff にしておく
        ensure(
            await serviceClient
                .from('event_members')
                .insert([
                    { user_id: fixture.staff.id, event_id: fixture.eventA, role: 'staff' },
                    { user_id: fixture.staff.id, event_id: fixture.eventB, role: 'staff' },
                    { user_id: fixture.visitor.id, event_id: fixture.eventA, role: 'visitor' },
                    { user_id: fixture.deleted.id, event_id: fixture.eventA, role: 'staff' },
                ])
                .select('user_id'),
            '所属の作成',
        )

        fixture.articleA = await createArticle(fixture.staff, fixture.eventA, 'A の記事', 'published')
        fixture.articleB = await createArticle(fixture.staff, fixture.eventB, 'B の記事', 'published')
        fixture.draftA = await createArticle(fixture.staff, fixture.eventA, 'A の下書き')
        fixture.draftB = await createArticle(fixture.staff, fixture.eventB, 'B の下書き')

        ensure(
            await serviceClient
                .from('event_members')
                .update({ role: 'visitor' })
                .eq('user_id', fixture.staff.id)
                .eq('event_id', fixture.eventB)
                .select('user_id'),
            'eventB の staff を visitor に戻す',
        )

        ensure(
            await serviceClient
                .from('users')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', fixture.deleted.id)
                .select('id'),
            'ユーザーの論理削除',
        )
    })

    afterAll(async () => {
        // イベントを消すと articles も、ユーザーを消すと users・event_members も一緒に消える。
        // 記事が作成者のユーザーを参照しているので、イベント（記事）を先に消す
        if (createdEventIds.length > 0) {
            await serviceClient.from('events').delete().in('id', createdEventIds)
        }
        for (const id of createdUserIds) {
            await serviceClient.auth.admin.deleteUser(id)
        }
    })

    return fixture
}
