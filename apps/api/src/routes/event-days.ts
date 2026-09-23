import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import {
    type EventDay,
    eventDayCreateInputSchema,
    eventDayInputSchema,
    type EventDayListResponse,
    eventQuerySchema,
    idParamSchema,
} from '@fesp/schema'

import { conflict, forbidden } from '../lib/errors'
import { writeFailure } from '../lib/event-resources'
import { FOREIGN_KEY_VIOLATION, INSUFFICIENT_PRIVILEGE, UNIQUE_VIOLATION } from '../lib/pg-errors'
import { createUserClient } from '../lib/supabase'
import { validationHook } from '../lib/validator'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

const COLUMNS = 'id, event_id, day, date, name, created_at, updated_at'

/** 同じ `day` か `date` の開催日がすでにあるときのメッセージ */
const DUPLICATE_MESSAGE = '同じ日付（または同じ日）の開催日がすでにあります'

// ユーザーの JWT を引き継いだクライアントで読み書きするので、所属と役割の判定は RLS に任せる
// （読み取りはイベントのメンバー、作成・更新・削除はイベントの staff。docs/db.md）
export const eventDaysRoute = new Hono<AppEnv>()
    .use(requireAuth)

    .get('/', zValidator('query', eventQuerySchema, validationHook), async (c) => {
        const { event_id } = c.req.valid('query')

        // 件数が少ないので limit / offset は持たない。イベントが無い・所属していないときは RLS で0件になる
        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('event_days')
            .select(COLUMNS)
            .eq('event_id', event_id)
            .order('day')
        if (error) throw error

        return c.json<EventDayListResponse>({ items: data })
    })

    .post('/', zValidator('json', eventDayCreateInputSchema, validationHook), async (c) => {
        const input = c.req.valid('json')

        const { data, error } = await createUserClient(c.env, c.get('accessToken'))
            .from('event_days')
            .insert(input)
            .select(COLUMNS)
            .single()
        // staff でない・所属していない・イベントが存在しない、はどれも RLS で弾かれて同じコードになる
        if (error?.code === INSUFFICIENT_PRIVILEGE) throw forbidden('このイベントに開催日を作成する権限がありません')
        if (error?.code === UNIQUE_VIOLATION) throw conflict(DUPLICATE_MESSAGE)
        if (error) throw error

        return c.json<EventDay>(data, 201)
    })

    .put(
        '/:id',
        zValidator('param', idParamSchema, validationHook),
        zValidator('json', eventDayInputSchema, validationHook),
        async (c) => {
            const { id } = c.req.valid('param')
            const input = c.req.valid('json')
            const supabase = createUserClient(c.env, c.get('accessToken'))

            // イベントは変えられないので event_id は受け取らない
            const { data, error } = await supabase
                .from('event_days')
                .update(input)
                .eq('id', id)
                .select(COLUMNS)
                .maybeSingle()
            if (error?.code === UNIQUE_VIOLATION) throw conflict(DUPLICATE_MESSAGE)
            if (error) throw error
            if (!data) throw await writeFailure(supabase, 'event_days', id, 'この開催日を更新する権限がありません')

            return c.json<EventDay>(data)
        },
    )

    .delete('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
        const { id } = c.req.valid('param')
        const supabase = createUserClient(c.env, c.get('accessToken'))

        const { data, error } = await supabase.from('event_days').delete().eq('id', id).select('id').maybeSingle()
        // 模擬店・出演者・スケジュールの列から参照されている開催日は消せない（docs/db.md の外部キー）
        if (error?.code === FOREIGN_KEY_VIOLATION) {
            throw conflict('模擬店・出演者・スケジュールで使われているため削除できません')
        }
        if (error) throw error
        if (!data) throw await writeFailure(supabase, 'event_days', id, 'この開催日を削除する権限がありません')

        return c.body(null, 204)
    })
