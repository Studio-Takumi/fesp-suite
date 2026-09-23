import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import {
    eventQuerySchema,
    idParamSchema,
    type Tag,
    tagCreateInputSchema,
    tagInputSchema,
    type TagListResponse,
} from '@fesp/schema'

import { conflict, forbidden } from '../lib/errors'
import { writeFailure } from '../lib/event-resources'
import { INSUFFICIENT_PRIVILEGE, UNIQUE_VIOLATION } from '../lib/pg-errors'
import { createUserClient } from '../lib/supabase'
import { validationHook } from '../lib/validator'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

const COLUMNS = 'id, event_id, name, sort_order, created_at, updated_at'

/** 同じ名前のタグがすでにあるときのメッセージ。名前はイベント内で一意（docs/db.md） */
const DUPLICATE_MESSAGE = '同じ名前のタグがすでにあります'

// 開催日（routes/event-days.ts）と同じ作り。
// 記事に付いているタグも消せる（article_tags は on delete cascade なので、付いていたぶんは一緒に外れる）
export const tagsRoute = new Hono<AppEnv>()
    .use(requireAuth)

    .get('/', zValidator('query', eventQuerySchema, validationHook), async (c) => {
        const { event_id } = c.req.valid('query')

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('tags')
            .select(COLUMNS)
            .eq('event_id', event_id)
            .order('sort_order')
        if (error) throw error

        return c.json<TagListResponse>({ items: data })
    })

    .post('/', zValidator('json', tagCreateInputSchema, validationHook), async (c) => {
        const input = c.req.valid('json')

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('tags')
            .insert(input)
            .select(COLUMNS)
            .single()
        if (error?.code === INSUFFICIENT_PRIVILEGE) throw forbidden('このイベントにタグを作成する権限がありません')
        if (error?.code === UNIQUE_VIOLATION) throw conflict(DUPLICATE_MESSAGE)
        if (error) throw error

        return c.json<Tag>(data, 201)
    })

    .put(
        '/:id',
        zValidator('param', idParamSchema, validationHook),
        zValidator('json', tagInputSchema, validationHook),
        async (c) => {
            const { id } = c.req.valid('param')
            const input = c.req.valid('json')
            const supabase = createUserClient(c.env, c.get('accessToken'))

            const { data, error } = await supabase.from('tags').update(input).eq('id', id).select(COLUMNS).maybeSingle()
            if (error?.code === UNIQUE_VIOLATION) throw conflict(DUPLICATE_MESSAGE)
            if (error) throw error
            if (!data) throw await writeFailure(supabase, 'tags', id, 'このタグを更新する権限がありません')

            return c.json<Tag>(data)
        },
    )

    .delete('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
        const { id } = c.req.valid('param')
        const supabase = createUserClient(c.env, c.get('accessToken'))

        const { data, error } = await supabase.from('tags').delete().eq('id', id).select('id').maybeSingle()
        if (error) throw error
        if (!data) throw await writeFailure(supabase, 'tags', id, 'このタグを削除する権限がありません')

        return c.body(null, 204)
    })
