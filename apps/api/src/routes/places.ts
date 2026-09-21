import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import {
    eventQuerySchema,
    idParamSchema,
    type Place,
    placeCreateInputSchema,
    placeInputSchema,
    type PlaceListResponse,
} from '@fesp/schema'

import { conflict, forbidden } from '../lib/errors'
import { writeFailure } from '../lib/event-resources'
import { FOREIGN_KEY_VIOLATION, INSUFFICIENT_PRIVILEGE } from '../lib/pg-errors'
import { createUserClient } from '../lib/supabase'
import { validationHook } from '../lib/validator'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

const COLUMNS = 'id, event_id, name, building, floor, sort_order, created_at, updated_at'

// 開催日（routes/event-days.ts）と同じ作り。名前に一意制約が無いので 409 は削除のときだけ
export const placesRoute = new Hono<AppEnv>()
    .use(requireAuth)

    .get('/', zValidator('query', eventQuerySchema, validationHook), async (c) => {
        const { event_id } = c.req.valid('query')

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('places')
            .select(COLUMNS)
            .eq('event_id', event_id)
            .order('sort_order')
        if (error) throw error

        return c.json<PlaceListResponse>({ items: data })
    })

    .post('/', zValidator('json', placeCreateInputSchema, validationHook), async (c) => {
        const input = c.req.valid('json')

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('places')
            .insert(input)
            .select(COLUMNS)
            .single()
        if (error?.code === INSUFFICIENT_PRIVILEGE) throw forbidden('このイベントに場所を作成する権限がありません')
        if (error) throw error

        return c.json<Place>(data, 201)
    })

    .put(
        '/:id',
        zValidator('param', idParamSchema, validationHook),
        zValidator('json', placeInputSchema, validationHook),
        async (c) => {
            const { id } = c.req.valid('param')
            const input = c.req.valid('json')
            const supabase = createUserClient(c.env, c.get('accessToken'))

            const { data, error } = await supabase
                .from('places')
                .update(input)
                .eq('id', id)
                .select(COLUMNS)
                .maybeSingle()
            if (error) throw error
            if (!data) throw await writeFailure(supabase, 'places', id, 'この場所を更新する権限がありません')

            return c.json<Place>(data)
        },
    )

    .delete('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
        const { id } = c.req.valid('param')
        const supabase = createUserClient(c.env, c.get('accessToken'))

        const { data, error } = await supabase.from('places').delete().eq('id', id).select('id').maybeSingle()
        // 模擬店・出演者から参照されている場所は消せない（docs/db.md の外部キー）
        if (error?.code === FOREIGN_KEY_VIOLATION) throw conflict('模擬店・出演者で使われているため削除できません')
        if (error) throw error
        if (!data) throw await writeFailure(supabase, 'places', id, 'この場所を削除する権限がありません')

        return c.body(null, 204)
    })
