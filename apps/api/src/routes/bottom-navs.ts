import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import {
    articleEventQuerySchema,
    type BottomNav,
    type BottomNavListResponse,
    bottomNavsInputSchema,
} from '@fesp/schema'

import { forbidden } from '../lib/errors'
import { createUserClient } from '../lib/supabase'
import { validationHook } from '../lib/validator'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

/** RLS の with check に通らなかったときの Postgres のエラーコード */
const INSUFFICIENT_PRIVILEGE = '42501'

const COLUMNS = 'id, label, icon, href, sort_order'

type UserClient = ReturnType<typeof createUserClient>

/** イベントの項目を並び順（左から）で読む */
async function selectItems(supabase: UserClient, eventId: string): Promise<BottomNav[]> {
    const { data, error } = await supabase
        .from('bottom_navs')
        .select(COLUMNS)
        .eq('event_id', eventId)
        .order('sort_order')
    if (error) throw error
    return data
}

// ユーザーの JWT を引き継いだクライアントで読み書きするので、所属と役割の判定は RLS に任せる
// （読み取りはイベントのメンバー、置き換えはイベントの staff。docs/db.md）
export const bottomNavsRoute = new Hono<AppEnv>()
    .use(requireAuth)

    .get('/', zValidator('query', articleEventQuerySchema, validationHook), async (c) => {
        const { event_id } = c.req.valid('query')

        // イベントが無い・所属していないときは RLS で0件になる
        const items = await selectItems(createUserClient(c.env, c.get('accessToken')), event_id)

        return c.json<BottomNavListResponse>({ items })
    })

    .put('/', zValidator('json', bottomNavsInputSchema, validationHook), async (c) => {
        const { event_id, items } = c.req.valid('json')
        const supabase = createUserClient(c.env, c.get('accessToken'))

        // 1件ずつ作り消しせず、いまの項目を全部消してから渡されたぶんを入れ直す。
        // 渡した順が sort_order になる（docs/api.md）
        const { error: deleteError } = await supabase.from('bottom_navs').delete().eq('event_id', event_id)
        if (deleteError) throw deleteError

        if (items.length > 0) {
            const { error: insertError } = await supabase
                .from('bottom_navs')
                .insert(items.map((item, index) => ({ ...item, event_id, sort_order: index })))
            // staff でない・所属していない・イベントが存在しない、はどれも RLS で弾かれて同じコードになる
            if (insertError?.code === INSUFFICIENT_PRIVILEGE) {
                throw forbidden('このイベントのナビを変更する権限がありません')
            }
            if (insertError) throw insertError
        }

        const saved = await selectItems(supabase, event_id)

        // 全部消すだけのときは、消せなかったことがエラーにならない（RLS では0件になるだけ）ので、
        // 残っているかどうかで staff かを判定する
        if (items.length === 0 && saved.length > 0) {
            throw forbidden('このイベントのナビを変更する権限がありません')
        }

        return c.json<BottomNavListResponse>({ items: saved })
    })
