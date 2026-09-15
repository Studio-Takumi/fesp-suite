import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import {
    articleCreateInputSchema,
    type ArticleHistory,
    articleIdParamSchema,
    articleInputSchema,
    type ArticleListItem,
    articleListQuerySchema,
    type ArticleListResponse,
    type ArticleResponse,
} from '@fesp/schema'
import type { Json } from '@fesp/types'

import { forbidden, notFound } from '../lib/errors'
import { createUserClient } from '../lib/supabase'
import { validationHook } from '../lib/validator'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

/** RLS の with check に通らなかったときの Postgres のエラーコード */
const INSUFFICIENT_PRIVILEGE = '42501'

/**
 * 記事オブジェクトの列。作成者の表示名は `users` から、最新の版は `article_histories` から埋め込む
 * （読める範囲はそれぞれの RLS。版は staff にしか読めない）。
 * articles と article_histories の間には外部キーが2本（版 → 記事、記事 → 公開中の版）あるので、版 → 記事を指定する
 */
const ARTICLE_COLUMNS =
    'id, event_id, created_by, creator:users!created_by(display_name), title, content, status, published_version, published_at, created_at, updated_at, latest_history:article_histories!article_histories_article_id_fkey(version, title, content, created_by, created_at, updated_at)'

/** 一覧の列。本文（content）と最新の版は返さない */
const ARTICLE_LIST_COLUMNS =
    'id, event_id, created_by, creator:users!created_by(display_name), title, status, published_version, published_at, created_at, updated_at'

type UserClient = ReturnType<typeof createUserClient>

/** DB から返る記事の行。埋め込んだ版は配列で返る（読めなければ空の配列） */
type ArticleRow = Omit<ArticleResponse, 'latest_history'> & { latest_history: ArticleHistory[] }

function toArticleResponse({ latest_history, ...article }: ArticleRow): ArticleResponse {
    return { ...article, latest_history: latest_history[0] ?? null }
}

/** 記事を1件、最新の版（番号がいちばん大きい1件）つきで読む */
function selectArticle(supabase: UserClient, id: string) {
    return supabase
        .from('articles')
        .select(ARTICLE_COLUMNS)
        .eq('id', id)
        .order('version', { referencedTable: 'latest_history', ascending: false })
        .limit(1, { referencedTable: 'latest_history' })
        .maybeSingle()
}

// ユーザーの JWT を引き継いだクライアントで読み書きするので、所属と役割の判定は RLS に任せる
// （読み取りは staff なら下書きも・それ以外のメンバーは公開済みだけ、作成・保存はイベントの staff。docs/db.md）
export const articlesRoute = new Hono<AppEnv>()
    .use(requireAuth)

    .get('/', zValidator('query', articleListQuerySchema, validationHook), async (c) => {
        const { event_id, limit, offset } = c.req.valid('query')

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('articles')
            .select(ARTICLE_LIST_COLUMNS)
            .eq('event_id', event_id)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1)
        if (error) throw error

        return c.json<ArticleListResponse>({ items: data as ArticleListItem[], limit, offset })
    })

    .get('/:id', zValidator('param', articleIdParamSchema, validationHook), async (c) => {
        const { id } = c.req.valid('param')

        const { data, error } = await selectArticle(createUserClient(c.env, c.get('accessToken')), id)
        if (error) throw error
        if (!data) throw notFound('記事が見つかりません')

        return c.json<ArticleResponse>(toArticleResponse(data as ArticleRow))
    })

    .post('/', zValidator('json', articleCreateInputSchema, validationHook), async (c) => {
        const { event_id, title, content } = c.req.valid('json')

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('articles')
            // 作成者はボディでは受け取らず、トークンのユーザーにする（RLS も created_by = auth.uid() を要求する）。
            // 公開状態は渡さず、DB の既定値（下書き）で作る。版1は DB のトリガーで作られる
            .insert({ event_id, created_by: c.get('user').userId, title, content: content as Json })
            .select(ARTICLE_COLUMNS)
            .single()
        // staff でない・所属していない・イベントが存在しない、はどれも RLS で弾かれて同じコードになる
        if (error?.code === INSUFFICIENT_PRIVILEGE) throw forbidden('このイベントに記事を作成する権限がありません')
        if (error) throw error

        // 作った直後の記事の版は版1だけなので、並べ替えずにそのまま使う
        return c.json<ArticleResponse>(toArticleResponse(data as ArticleRow), 201)
    })

    .put(
        '/:id',
        zValidator('param', articleIdParamSchema, validationHook),
        zValidator('json', articleInputSchema, validationHook),
        async (c) => {
            const { id } = c.req.valid('param')
            const { title, content, status } = c.req.valid('json')
            const supabase = createUserClient(c.env, c.get('accessToken'))

            // 版の追加と記事の更新は、DB の関数で1トランザクションにまとめる（docs/db.md の「保存」）。
            // status を省略すると公開状態を変えない（公開中の記事なら一時保存になる）
            const { data: saved, error } = await supabase.rpc('save_article', {
                target_article_id: id,
                new_title: title,
                new_content: content as Json,
                new_status: status,
            })
            if (error) throw error

            if (saved) {
                const { data, error: readError } = await selectArticle(supabase, id)
                if (readError) throw readError
                if (!data) throw notFound('記事が見つかりません')
                return c.json<ArticleResponse>(toArticleResponse(data as ArticleRow))
            }

            // 関数は staff でない行（RLS で更新できない行）なら false を返すので、読めるかどうかで 403 と 404 を分ける
            // （staff でないメンバーには下書きが読めないので、下書きの保存は 404 になる）
            const { data: readable, error: readError } = await supabase
                .from('articles')
                .select('id')
                .eq('id', id)
                .maybeSingle()
            if (readError) throw readError
            if (readable) throw forbidden('この記事を更新する権限がありません')
            throw notFound('記事が見つかりません')
        },
    )
