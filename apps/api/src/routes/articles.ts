import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import {
    articleCreateInputSchema,
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

/** 記事オブジェクトの列。作成者の表示名は `users` から埋め込む（読める範囲は users の RLS） */
const ARTICLE_COLUMNS =
    'id, event_id, created_by, creator:users!created_by(display_name), title, content, status, published_at, created_at, updated_at'

/** 一覧の列。本文（content）は返さない */
const ARTICLE_LIST_COLUMNS =
    'id, event_id, created_by, creator:users!created_by(display_name), title, status, published_at, created_at, updated_at'

// ユーザーの JWT を引き継いだクライアントで読み書きするので、所属と役割の判定は RLS に任せる
// （読み取りは staff なら下書きも・それ以外のメンバーは公開済みだけ、作成・更新はイベントの staff。docs/db.md）
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

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('articles')
            .select(ARTICLE_COLUMNS)
            .eq('id', id)
            .maybeSingle()
        if (error) throw error
        if (!data) throw notFound('記事が見つかりません')

        return c.json<ArticleResponse>(data as ArticleResponse)
    })

    .post('/', zValidator('json', articleCreateInputSchema, validationHook), async (c) => {
        const { event_id, title, content } = c.req.valid('json')

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('articles')
            // 作成者はボディでは受け取らず、トークンのユーザーにする（RLS も created_by = auth.uid() を要求する）。
            // 公開状態は渡さず、DB の既定値（下書き）で作る
            .insert({ event_id, created_by: c.get('user').userId, title, content: content as Json })
            .select(ARTICLE_COLUMNS)
            .single()
        // staff でない・所属していない・イベントが存在しない、はどれも RLS で弾かれて同じコードになる
        if (error?.code === INSUFFICIENT_PRIVILEGE) throw forbidden('このイベントに記事を作成する権限がありません')
        if (error) throw error

        return c.json<ArticleResponse>(data as ArticleResponse, 201)
    })

    .put(
        '/:id',
        zValidator('param', articleIdParamSchema, validationHook),
        zValidator('json', articleInputSchema, validationHook),
        async (c) => {
            const { id } = c.req.valid('param')
            const { title, content, status } = c.req.valid('json')
            const supabase = createUserClient(c.env, c.get('accessToken'))

            const { data, error } = await supabase
                .from('articles')
                .update({ title, content: content as Json, status })
                .eq('id', id)
                .select(ARTICLE_COLUMNS)
                .maybeSingle()
            if (error) throw error
            if (data) return c.json<ArticleResponse>(data as ArticleResponse)

            // RLS の update は staff でない行を黙って飛ばすので、読めるかどうかで 403 と 404 を分ける
            // （staff でないメンバーには下書きが読めないので、下書きの更新は 404 になる）
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
