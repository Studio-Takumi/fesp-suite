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
 * 記事の列のうち、版を除いたもの。作成者の表示名は `users` から埋め込む（読める範囲は `users` の RLS）
 */
const ARTICLE_BASE_COLUMNS =
    'id, event_id, created_by, creator:users!created_by(display_name), status, published_version, published_at, created_at, updated_at'

/**
 * 記事オブジェクトの列。タイトル・本文は記事が指す版（公開中の版・最新の版）から埋め込む。
 * articles と article_histories の間には外部キーが3本あるので、たどる外部キーを指定する。
 * 版の読める範囲は RLS（公開中の版はメンバー全員、それ以外の版は staff だけ）で、読めなければ null になる
 */
const ARTICLE_COLUMNS = `${ARTICLE_BASE_COLUMNS}, published_history:article_histories!articles_published_version_fkey(title, content), latest_history:article_histories!articles_latest_version_fkey(version, title, content, created_by, created_at, updated_at)`

/** 一覧の列。本文（content）と最新の版は返さないので、版からはタイトルだけ埋め込む */
const ARTICLE_LIST_COLUMNS = `${ARTICLE_BASE_COLUMNS}, published_history:article_histories!articles_published_version_fkey(title), latest_history:article_histories!articles_latest_version_fkey(title)`

type UserClient = ReturnType<typeof createUserClient>

/** DB から返る記事の行。タイトル・本文は持たず、埋め込んだ版で返る */
type ArticleRow = Omit<ArticleResponse, 'title' | 'content'> & {
    published_history: Pick<ArticleHistory, 'title' | 'content'> | null
}

/** DB から返る一覧の行 */
type ArticleListRow = Omit<ArticleListItem, 'title'> & {
    published_history: Pick<ArticleHistory, 'title'> | null
    latest_history: Pick<ArticleHistory, 'title'> | null
}

/**
 * 記事に出す版を選ぶ。公開中の記事は公開中の版、下書きは最新の版。
 * 下書きは staff にしか読めず、staff は最新の版も読めるので、記事が読めれば必ずどちらかがある
 */
function shownHistoryOf<T>(row: { published_history: T | null; latest_history: T | null }): T {
    const history = row.published_history ?? row.latest_history
    if (!history) throw new Error('記事の版が読めません')
    return history
}

function toArticleResponse(row: ArticleRow): ArticleResponse {
    const { published_history: _publishedHistory, ...article } = row
    const { title, content } = shownHistoryOf(row)
    return { ...article, title, content }
}

function toArticleListItem(row: ArticleListRow): ArticleListItem {
    const { published_history: _publishedHistory, latest_history: _latestHistory, ...article } = row
    return { ...article, title: shownHistoryOf(row).title }
}

/** 記事を1件、公開中の版・最新の版つきで読む */
function selectArticle(supabase: UserClient, id: string) {
    return supabase.from('articles').select(ARTICLE_COLUMNS).eq('id', id).maybeSingle()
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

        return c.json<ArticleListResponse>({
            items: (data as unknown as ArticleListRow[]).map(toArticleListItem),
            limit,
            offset,
        })
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

        const supabase = createUserClient(c.env, c.get('accessToken'))

        // 記事と版1は、DB の関数で1トランザクションにまとめて作る（docs/db.md の「作成」）。
        // 作成者はボディでは受け取らず、関数の中でトークンのユーザー（auth.uid()）にする。記事は下書きで作られる
        const { data: id, error } = await supabase.rpc('create_article', {
            target_event_id: event_id,
            new_title: title,
            new_content: content as Json,
        })
        // staff でない・所属していない・イベントが存在しない、はどれも RLS で弾かれて同じコードになる
        if (error?.code === INSUFFICIENT_PRIVILEGE) throw forbidden('このイベントに記事を作成する権限がありません')
        if (error) throw error

        const { data, error: readError } = await selectArticle(supabase, id)
        if (readError) throw readError
        if (!data) throw notFound('記事が見つかりません')

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
