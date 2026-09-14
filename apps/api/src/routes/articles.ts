import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import {
    articleEventQuerySchema,
    articleIdParamSchema,
    articleInputSchema,
    type ArticleListItem,
    articleListQuerySchema,
    type ArticleListResponse,
    type ArticleResponse,
} from '@fesp/schema'
import type { Json } from '@fesp/types'

import { notFound } from '../lib/errors'
import { createServiceClient } from '../lib/supabase'
import { validationHook } from '../lib/validator'
import type { AppEnv } from '../types'

const FOREIGN_KEY_VIOLATION = '23503'

// service_role は RLS を貫通するので、すべてのクエリで event_id を絞り込むこと
export const articlesRoute = new Hono<AppEnv>()
    .get('/', zValidator('query', articleListQuerySchema, validationHook), async (c) => {
        const { event_id, limit, offset } = c.req.valid('query')

        const { data, error } = await createServiceClient(c.env)
            .from('articles')
            .select('id, event_id, created_at, updated_at')
            .eq('event_id', event_id)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1)
        if (error) throw error

        return c.json<ArticleListResponse>({ items: data as ArticleListItem[], limit, offset })
    })

    .get(
        '/:id',
        zValidator('param', articleIdParamSchema, validationHook),
        zValidator('query', articleEventQuerySchema, validationHook),
        async (c) => {
            const { id } = c.req.valid('param')
            const { event_id } = c.req.valid('query')

            const { data, error } = await createServiceClient(c.env)
                .from('articles')
                .select('*')
                .eq('id', id)
                .eq('event_id', event_id)
                .maybeSingle()
            if (error) throw error
            if (!data) throw notFound('記事が見つかりません')

            return c.json<ArticleResponse>(data as ArticleResponse)
        },
    )

    .post(
        '/',
        zValidator('query', articleEventQuerySchema, validationHook),
        zValidator('json', articleInputSchema, validationHook),
        async (c) => {
            const { event_id } = c.req.valid('query')
            const { content } = c.req.valid('json')

            const { data, error } = await createServiceClient(c.env)
                .from('articles')
                .insert({ event_id, content: content as Json })
                .select('*')
                .single()
            if (error?.code === FOREIGN_KEY_VIOLATION) throw notFound('イベントが見つかりません')
            if (error) throw error

            return c.json<ArticleResponse>(data as ArticleResponse, 201)
        },
    )

    .put(
        '/:id',
        zValidator('param', articleIdParamSchema, validationHook),
        zValidator('query', articleEventQuerySchema, validationHook),
        zValidator('json', articleInputSchema, validationHook),
        async (c) => {
            const { id } = c.req.valid('param')
            const { event_id } = c.req.valid('query')
            const { content } = c.req.valid('json')

            const { data, error } = await createServiceClient(c.env)
                .from('articles')
                .update({ content: content as Json })
                .eq('id', id)
                .eq('event_id', event_id)
                .select('*')
                .maybeSingle()
            if (error) throw error
            if (!data) throw notFound('記事が見つかりません')

            return c.json<ArticleResponse>(data as ArticleResponse)
        },
    )
